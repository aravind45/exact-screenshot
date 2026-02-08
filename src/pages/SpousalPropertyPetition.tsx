import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import {
    Heart,
    FileText,
    Gavel,
    Bell,
    CheckCircle2,
    Download,
    ExternalLink,
    ArrowRight,
    Info,
    AlertCircle,
    AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function SpousalPropertyPetition() {
    const queryClient = useQueryClient();
    const [downloadingForm, setDownloadingForm] = useState<string | null>(null);

    const { data: estate } = useQuery({
        queryKey: ["estate"],
        queryFn: api.getMyEstate,
    });

    const completeTaskMutation = useMutation({
        mutationFn: ({ taskId }: { taskId: string }) =>
            api.completeTask(estate?.id || "", taskId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["estate"] });
            toast.success("Progress updated successfully");
        },
        onError: (err: any) => {
            toast.error(`Error updating progress: ${err.message}`);
        }
    });

    const generatePdfMutation = useMutation({
        mutationFn: (formType: string) => api.previewPetition({ formType }),
        onSuccess: (data: any, formType) => {
            if (data.pdfBase64) {
                const blob = b64toBlob(data.pdfBase64, 'application/pdf');
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${formType}_PreFilled.pdf`;
                a.click();
                toast.success(`${formType} downloaded successfully`);
            }
        },
        onSettled: () => setDownloadingForm(null),
        onError: (err: any) => {
            toast.error(`Error generating PDF: ${err.message}`);
        }
    });

    // Helper to convert base64 to Blob
    const b64toBlob = (b64Data: string, contentType = '', sliceSize = 512) => {
        const byteCharacters = atob(b64Data);
        const byteArrays = [];
        for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            const slice = byteCharacters.slice(offset, offset + sliceSize);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }
        return new Blob(byteArrays, { type: contentType });
    };

    const isSpousalPath = estate?.authorityType === "SPOUSAL_PETITION";
    const completedTaskIds = estate?.roadmapProgress?.completedTaskIds || [];

    const handleDownload = (form: string) => {
        setDownloadingForm(form);
        generatePdfMutation.mutate(form);
    };

    const handleMarkAsFiled = async (taskId: string) => {
        completeTaskMutation.mutate({ taskId }, {
            onSuccess: async () => {
                if (taskId === "file_spousal_petition") {
                    try {
                        await api.updateMyEstate({
                            authorityType: "SPOUSAL_PETITION_FILED",
                            probateStatus: "PETITION_FILED"
                        });
                        queryClient.invalidateQueries({ queryKey: ["estate"] });
                    } catch (err) {
                        console.error("Failed to update estate status:", err);
                    }
                }
            }
        });
    };

    const steps = [
        {
            id: "file_spousal_petition",
            title: "File Spousal Property Petition",
            form: "DE-221",
            desc: "Request that property pass to you without full probate.",
            status: completedTaskIds.includes("file_spousal_petition") ? "completed" : "ready",
            link: "https://www.courts.ca.gov/documents/de221.pdf"
        },
        {
            id: "give_spousal_notice",
            title: "Give Notice of Hearing",
            form: "DE-120",
            desc: "Notify all interested parties about the court hearing date.",
            status: completedTaskIds.includes("give_spousal_notice") ? "completed" :
                (completedTaskIds.includes("file_spousal_petition") ? "ready" : "locked"),
            link: "https://www.courts.ca.gov/documents/de120.pdf"
        },
        {
            id: "obtain_spousal_order",
            title: "Final Spousal Property Order",
            form: "DE-226",
            desc: "The judge signs the order transferring the property to you.",
            status: completedTaskIds.includes("obtain_spousal_order") ? "completed" :
                (completedTaskIds.includes("give_spousal_notice") ? "ready" : "locked"),
            link: "https://www.courts.ca.gov/documents/de226.pdf"
        }
    ];

    return (
        <div className="flex min-h-screen bg-slate-50/50">
            <Sidebar />
            <div className="flex-1 ml-64 min-h-screen bg-gradient-to-br from-slate-50 via-rose-50/20 to-slate-50 p-6 pl-4">
                <div className="max-w-4xl mx-auto space-y-6">
                    <header className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="p-1 bg-rose-600 rounded">
                                <Heart className="w-3.5 h-3.5 text-white" />
                            </div>
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Spousal Property Petition (DE-221)</h1>
                            <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 uppercase text-[9px] font-bold h-4">
                                Shortcut
                            </Badge>
                        </div>
                        <p className="text-slate-500 text-xs max-w-2xl">
                            A streamlined process for surviving spouses to take legal title to assets without full probate.
                        </p>
                    </header>

                    {!isSpousalPath && (
                        <Card className="bg-amber-50/50 border-amber-200 shadow-none">
                            <CardContent className="p-3 flex gap-3">
                                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-[11px] font-black text-amber-900 uppercase">Path Not Applicable</h4>
                                    <p className="text-[10px] text-amber-700 leading-tight">
                                        Your current settlement path (<strong>{estate?.authorityType}</strong>) is not a dedicated Spousal Property Petition.
                                        Using this form may be incorrect.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Eligibility Alert */}
                    <Card className="border-none shadow-md bg-white border-l-4 border-l-rose-500">
                        <CardContent className="p-4 flex gap-4">
                            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <h4 className="text-sm font-bold text-slate-900">Who can use this?</h4>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Only a surviving spouse or registered domestic partner can use this petition.
                                    It applies to both community property and separate property inherited from the
                                    deceased spouse.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Process Steps */}
                        <div className="lg:col-span-8 space-y-4">
                            {steps.map((step, idx) => (
                                <Card key={step.id} className={cn(
                                    "border-none shadow-sm transition-all overflow-hidden",
                                    step.status === 'ready' ? "bg-white shadow-md shadow-slate-200/50" :
                                        (step.status === 'completed' ? "bg-white border-l-4 border-l-emerald-500 shadow-md" : "bg-slate-50 opacity-60")
                                )}>
                                    <CardContent className="p-0">
                                        <div className="p-5 flex items-start gap-4">
                                            {step.status === 'completed' ? (
                                                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                                </div>
                                            ) : (
                                                <div className={cn(
                                                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                                                    step.status === 'ready' ? "bg-rose-100 text-rose-600" : "bg-slate-200 text-slate-400"
                                                )}>
                                                    {idx + 1}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h3 className="text-sm font-bold text-slate-900 truncate">{step.title}</h3>
                                                    <Badge variant="outline" className="text-[9px] font-black tracking-tighter uppercase px-1.5 py-0 border-slate-200">
                                                        Form {step.form}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-slate-500 mb-4">{step.desc}</p>

                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 text-[10px] font-bold uppercase tracking-tight"
                                                        onClick={() => handleDownload(step.form)}
                                                        disabled={!isSpousalPath || downloadingForm === step.form || step.status === 'locked'}
                                                    >
                                                        {downloadingForm === step.form ? "Generating..." : "Auto-Fill (Beta)"}
                                                    </Button>

                                                    {step.status === 'ready' && (
                                                        <Button
                                                            variant="default"
                                                            size="sm"
                                                            className="h-8 text-[10px] font-bold uppercase tracking-tight bg-slate-900 border-none hover:bg-slate-800"
                                                            onClick={() => handleMarkAsFiled(step.id)}
                                                            disabled={!isSpousalPath || completeTaskMutation.isPending}
                                                        >
                                                            Mark as Filed
                                                        </Button>
                                                    )}

                                                    {step.status === 'completed' && (
                                                        <Badge className="h-8 flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border-emerald-100 px-3">
                                                            <CheckCircle2 className="w-3 h-3" /> Filed
                                                        </Badge>
                                                    )}

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 text-[10px] font-bold uppercase tracking-tight text-slate-400 hover:text-slate-600"
                                                        asChild
                                                    >
                                                        <a href={step.link} target="_blank">
                                                            Blank PDF
                                                        </a>
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Pro Tips & Resources */}
                        <div className="lg:col-span-4 space-y-4">
                            <Card className="border-none shadow-xl shadow-slate-200/50 bg-slate-900 text-white">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center gap-2">
                                        <Gavel className="w-4 h-4 text-rose-400" />
                                        <CardTitle className="text-xs font-bold uppercase tracking-widest">Legal Authority</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-0 space-y-3">
                                    <p className="text-[10px] text-slate-400 leading-relaxed italic">
                                        "Probate Code Section 13650 allows for the summary distribution
                                        of assets passing to a surviving spouse."
                                    </p>
                                    <div className="space-y-2 pt-2 border-t border-slate-800">
                                        <div className="flex items-center justify-between text-[10px]">
                                            <span className="text-slate-500">Wait Period</span>
                                            <span className="font-bold">None</span>
                                        </div>
                                        <div className="flex items-center justify-between text-[10px]">
                                            <span className="text-slate-500">Court Hearing</span>
                                            <span className="font-bold">Required</span>
                                        </div>
                                        <div className="flex items-center justify-between text-[10px]">
                                            <span className="text-slate-500">Max Value</span>
                                            <span className="font-bold">No Limit</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-md bg-white">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xs font-bold uppercase text-slate-500">Helpful Links</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <a href="https://www.courts.ca.gov/8865.htm" target="_blank" className="flex items-center justify-between p-2 rounded hover:bg-slate-50 transition-colors group">
                                        <span className="text-[10px] font-bold text-slate-700">Judicial Council Guide</span>
                                        <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-rose-500" />
                                    </a>
                                    <a href="#" className="flex items-center justify-between p-2 rounded hover:bg-slate-50 transition-colors group">
                                        <span className="text-[10px] font-bold text-slate-700">Find Local Court Fees</span>
                                        <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-rose-500" />
                                    </a>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
