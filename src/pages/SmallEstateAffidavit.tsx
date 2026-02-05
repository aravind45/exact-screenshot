import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import {
    Zap,
    FileText,
    CheckCircle2,
    Download,
    ExternalLink,
    AlertCircle,
    Landmark,
    Banknote,
    Info,
    ArrowRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { useTerminology } from "@/hooks/use-terminology";

export default function SmallEstateAffidavit() {
    const queryClient = useQueryClient();
    const [downloadingForm, setDownloadingForm] = useState<string | null>(null);
    const { stateRule, smallEstateThreshold, estate } = useTerminology();

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

    const completedTaskIds = estate?.roadmapProgress?.completedTaskIds || [];

    const handleDownload = (form: string) => {
        setDownloadingForm(form);
        generatePdfMutation.mutate(form);
    };

    const handleMarkAsComplete = async (taskId: string) => {
        completeTaskMutation.mutate({ taskId });
    };

    const steps = [
        {
            id: "verify_limit",
            title: "Verify Estate Limit",
            desc: `Ensure personal property is under the ${estate?.deceasedState || "state's"} small estate limit ($${smallEstateThreshold?.toLocaleString()}).`,
            status: completedTaskIds.includes("verify_limit") ? "completed" : "ready",
            icon: Banknote
        },
        {
            id: "prepare_affidavit",
            title: "Prepare Affidavit",
            form: "AFFIDAVIT",
            desc: "Create the Section 13100 affidavit for personal property.",
            status: completedTaskIds.includes("prepare_affidavit") ? "completed" :
                (completedTaskIds.includes("verify_limit") ? "ready" : "locked"),
            icon: FileText
        },
        {
            id: "present_to_banks",
            title: "Present to Institutions",
            desc: "Take the notarized affidavit to banks to claim assets.",
            status: completedTaskIds.includes("present_to_banks") ? "completed" :
                (completedTaskIds.includes("prepare_affidavit") ? "ready" : "locked"),
            icon: Landmark
        }
    ];

    return (
        <div className="flex min-h-screen bg-slate-50/50">
            <Sidebar />
            <div className="flex-1 ml-64 min-h-screen bg-gradient-to-br from-amber-50/20 via-white to-orange-50/20 p-6 pl-4 font-sans">
                <div className="max-w-4xl mx-auto space-y-6">
                    <header className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="p-1 bg-amber-500 rounded shadow-md shadow-amber-200">
                                <Zap className="w-4 h-4 text-white" />
                            </div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Small Estate Fast-Track</h1>
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 uppercase text-[9px] font-black h-4 px-2">
                                No Court Required
                            </Badge>
                        </div>
                        <p className="text-slate-500 text-sm font-medium">
                            Avoid probate entirely using a sworn affidavit if the estate is below the statutory limit.
                        </p>
                    </header>

                    <Card className="border-none shadow-md bg-white border-l-4 border-l-amber-500 rounded-2xl">
                        <CardContent className="p-4 flex gap-4">
                            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Wait Period Required</h4>
                                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                    You must wait at least **40 days** after the date of death before presenting this affidavit to any bank or person.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Process Steps */}
                        <div className="lg:col-span-8 space-y-4">
                            {steps.map((step, idx) => (
                                <Card key={step.id} className={cn(
                                    "border-none shadow-sm transition-all overflow-hidden rounded-[2rem]",
                                    step.status === 'ready' ? "bg-white shadow-xl shadow-amber-100/50" :
                                        (step.status === 'completed' ? "bg-white border border-amber-100 shadow-md" : "bg-slate-100/50 opacity-60")
                                )}>
                                    <CardContent className="p-0">
                                        <div className="p-6 flex items-start gap-5">
                                            {step.status === 'completed' ? (
                                                <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0 border border-emerald-200 shadow-sm">
                                                    <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                                                </div>
                                            ) : (
                                                <div className={cn(
                                                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm",
                                                    step.status === 'ready' ? "bg-amber-500 text-white border-amber-600" : "bg-slate-200 text-slate-400 border-slate-300"
                                                )}>
                                                    <step.icon className="w-6 h-6" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h3 className="text-base font-black text-slate-900 tracking-tight">{step.title}</h3>
                                                    {step.status === 'ready' && <Badge className="bg-amber-100 text-amber-700 border-none font-black text-[8px] uppercase tracking-widest">Active Step</Badge>}
                                                </div>
                                                <p className="text-xs text-slate-500 mb-4 font-medium">{step.desc}</p>

                                                <div className="flex gap-2">
                                                    {step.id === 'prepare_affidavit' && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-9 px-4 text-[10px] font-black uppercase tracking-widest border-amber-200 text-amber-700 hover:bg-amber-50"
                                                            onClick={() => handleDownload("SMALL_ESTATE_AFFIDAVIT")}
                                                            disabled={downloadingForm === "SMALL_ESTATE_AFFIDAVIT" || step.status === 'locked'}
                                                        >
                                                            {downloadingForm === "SMALL_ESTATE_AFFIDAVIT" ? "Generating..." : "Generate Affidavit"}
                                                        </Button>
                                                    )}

                                                    {step.status === 'ready' && (
                                                        <Button
                                                            variant="default"
                                                            size="sm"
                                                            className="h-9 px-4 text-[10px] font-black uppercase tracking-widest bg-slate-900 border-none hover:bg-slate-800"
                                                            onClick={() => handleMarkAsComplete(step.id)}
                                                            disabled={completeTaskMutation.isPending}
                                                        >
                                                            Mark Complete
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Sidebar Info */}
                        <div className="lg:col-span-4 space-y-5">
                            <Card className="border-none shadow-2xl shadow-amber-100/50 bg-slate-900 text-white rounded-[2rem] overflow-hidden">
                                <CardHeader className="pb-4 bg-gradient-to-br from-slate-800 to-slate-900 border-b border-white/5">
                                    <div className="flex items-center gap-2.5">
                                        <Info className="w-5 h-5 text-amber-400" />
                                        <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-300">Fast-Track FAQ</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 space-y-4">
                                    <div className="space-y-4">
                                        <div className="flex gap-3">
                                            <div className="w-1 h-auto bg-amber-500 rounded-full shrink-0" />
                                            <div>
                                                <p className="text-[10px] font-black text-white uppercase tracking-tight">Do I need a lawyer?</p>
                                                <p className="text-[10px] text-slate-400 leading-relaxed font-medium mt-1">
                                                    Usually no. This is a self-help procedure designed for small estates.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="w-1 h-auto bg-amber-500 rounded-full shrink-0" />
                                            <div>
                                                <p className="text-[10px] font-black text-white uppercase tracking-tight">Must I notarize it?</p>
                                                <p className="text-[10px] text-slate-400 leading-relaxed font-medium mt-1">
                                                    **Yes.** Your signature must be notarized before banks will accept it.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-sm bg-white rounded-[2rem] border border-slate-100 overflow-hidden">
                                <CardHeader className="bg-amber-50/50 pb-2">
                                    <CardTitle className="text-[11px] font-black uppercase tracking-widest text-amber-700">Resources</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 space-y-2">
                                    <a href="https://www.courts.ca.gov/10440.htm" target="_blank" className="flex items-center justify-between p-2 rounded-xl hover:bg-amber-50 transition-colors group">
                                        <span className="text-[10px] font-bold text-slate-700">State Probate Guide</span>
                                        <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-amber-500" />
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
