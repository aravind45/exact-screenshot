import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import {
    Home,
    FileText,
    Gavel,
    CheckCircle2,
    Download,
    ExternalLink,
    AlertCircle,
    AlertTriangle,
    ArrowRight,
    MapPin,
    Building
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { downloadAutofillWithFallback } from "@/lib/formAutofill";

import { useTerminology } from "@/hooks/use-terminology";

export default function SuccessionPetition() {
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
    const isSmallEstate = (estate?.probateTotal || 0) <= (smallEstateThreshold || 50000);
    const completedTaskIds = estate?.roadmapProgress?.completedTaskIds || [];
    const handleDownload = async (form: string, blankUrl?: string) => {
        setDownloadingForm(form);
        try {
            const result = await downloadAutofillWithFallback({
                formType: form,
                blankPdfUrl: blankUrl,
                filename: form + "_PreFilled.pdf",
            });
            if (result.mode === "blank") {
                toast.success("Auto-fill isn't available for " + form + " yet. Opened the blank form.");
            } else {
                toast.success(form + " downloaded successfully");
            }
        } catch (err: any) {
            toast.error("Couldn't generate " + form + ": " + err.message);
        } finally {
            setDownloadingForm(null);
        }
    };

    const handleMarkAsFiled = async (taskId: string) => {
        completeTaskMutation.mutate({ taskId }, {
            onSuccess: async () => {
                if (taskId === "file_succession_petition") {
                    try {
                        await api.updateMyEstate({
                            probateStatus: "PETITION_FILED",
                            authorityType: "SUCCESSION_PETITION_FILED"
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
            id: "file_succession_petition",
            title: "File Succession Petition",
            form: "DE-310",
            desc: "The primary legal request to determine succession to the property.",
            status: completedTaskIds.includes("file_succession_petition") ? "completed" : "ready",
            link: "https://www.courts.ca.gov/documents/de310.pdf"
        },
        {
            id: "give_succession_notice",
            title: "Notice of Hearing",
            form: "DE-120",
            desc: "Notify all potential heirs and interested parties of the hearing date.",
            status: completedTaskIds.includes("give_succession_notice") ? "completed" :
                (completedTaskIds.includes("file_succession_petition") ? "ready" : "locked"),
            link: "https://www.courts.ca.gov/documents/de120.pdf"
        },
        {
            id: "obtain_succession_order",
            title: "Succession Order",
            form: "DE-315",
            desc: "The court's final order confirming the transfer of title.",
            status: completedTaskIds.includes("obtain_succession_order") ? "completed" :
                (completedTaskIds.includes("give_succession_notice") ? "ready" : "locked"),
            link: "https://www.courts.ca.gov/documents/de315.pdf"
        }
    ];

    return (
        <div className="flex min-h-screen bg-slate-50/50">
            <Sidebar />
            <div className="flex-1 ml-64 min-h-screen bg-gradient-to-br from-indigo-50/20 via-white to-blue-50/20 p-6 pl-4 font-sans">
                <div className="max-w-4xl mx-auto space-y-6">
                    <header className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="p-1 bg-indigo-600 rounded shadow-md shadow-indigo-200">
                                <Home className="w-4 h-4 text-white" />
                            </div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Real Property Succession (DE-310)</h1>
                            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 uppercase text-[9px] font-black h-4 px-2">
                                Small Estate Track
                            </Badge>
                        </div>
                        <p className="text-slate-500 text-sm font-medium">
                            A simplified court process for Primary Residences valued under statutory limits.
                        </p>
                    </header>

                    {!isSmallEstate && (
                        <Card className="bg-amber-50/50 border-amber-200 shadow-none border-dashed">
                            <CardContent className="p-4 flex gap-3">
                                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                                <div>
                                    <h4 className="text-xs font-black text-amber-900 uppercase tracking-wide">Value Warning</h4>
                                    <p className="text-xs text-amber-700 leading-relaxed font-medium">
                                        Your total estate value appears to exceed the small estate threshold for your state.
                                        This process may result in a court rejection. Consult an attorney before filing.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Process Steps */}
                        <div className="lg:col-span-8 space-y-4">
                            {steps.map((step, idx) => (
                                <Card key={step.id} className={cn(
                                    "border-none shadow-sm transition-all overflow-hidden rounded-3xl",
                                    step.status === 'ready' ? "ring-2 ring-indigo-500/20 bg-white shadow-lg shadow-indigo-100/50" :
                                        (step.status === 'completed' ? "bg-white border border-emerald-100 shadow-md" : "bg-slate-100/50 opacity-60")
                                )}>
                                    <CardContent className="p-0">
                                        <div className="p-6 flex items-start gap-5">
                                            {step.status === 'completed' ? (
                                                <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0 border border-emerald-200 shadow-sm">
                                                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                                                </div>
                                            ) : (
                                                <div className={cn(
                                                    "w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black shrink-0 border shadow-sm",
                                                    step.status === 'ready' ? "bg-indigo-600 text-white border-indigo-700" : "bg-slate-200 text-slate-400 border-slate-300"
                                                )}>
                                                    {idx + 1}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <h3 className="text-base font-black text-slate-900 truncate tracking-tight">{step.title}</h3>
                                                    <Badge variant="outline" className="text-[10px] font-black tracking-widest uppercase border-slate-200 text-slate-500 bg-slate-50">
                                                        Form {step.form}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-slate-600 mb-5 leading-relaxed font-medium">{step.desc}</p>

                                                <div className="flex flex-wrap gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-9 px-4 text-[10px] font-black uppercase tracking-widest border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                                        onClick={() => handleDownload(step.form, step.link)}
                                                        disabled={downloadingForm === step.form || step.status === 'locked'}
                                                    >
                                                        {downloadingForm === step.form ? "Generating..." : "Auto-Fill (Beta)"}
                                                    </Button>

                                                    {step.status === 'ready' && (
                                                        <Button
                                                            variant="default"
                                                            size="sm"
                                                            className="h-9 px-4 text-[10px] font-black uppercase tracking-widest bg-slate-900 border-none hover:bg-slate-800 shadow-lg shadow-slate-200"
                                                            onClick={() => handleMarkAsFiled(step.id)}
                                                            disabled={completeTaskMutation.isPending}
                                                        >
                                                            Mark as Filed
                                                        </Button>
                                                    )}

                                                    {step.status === 'completed' && (
                                                        <Badge className="h-9 flex items-center gap-2 bg-emerald-50 text-emerald-700 border-emerald-100 px-4 font-black uppercase text-[10px] tracking-widest shadow-sm">
                                                            <CheckCircle2 className="w-4 h-4" /> Filed & Confirmed
                                                        </Badge>
                                                    )}

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-9 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600"
                                                        asChild
                                                    >
                                                        <a href={step.link} target="_blank" rel="noreferrer">
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

                        {/* Sidebar Info */}
                        <div className="lg:col-span-4 space-y-5">
                            <Card className="border-none shadow-2xl shadow-indigo-100/50 bg-slate-900 text-white rounded-[2rem] overflow-hidden">
                                <CardHeader className="pb-4 bg-gradient-to-br from-slate-800 to-slate-900 border-b border-white/5">
                                    <div className="flex items-center gap-2.5">
                                        <Building className="w-5 h-5 text-indigo-400" />
                                        <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-300">Property Details</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 space-y-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">State</span>
                                            <span className="text-xs font-black text-white px-2 py-0.5 bg-white/10 rounded-md border border-white/10">{estate?.deceasedState || "State"}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Small Estate Limit</span>
                                            <span className="text-xs font-black text-indigo-400">${smallEstateThreshold?.toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Real Property</span>
                                            <span className="text-xs font-black">Included</span>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-white/5">
                                        <p className="text-[10px] text-slate-400 leading-relaxed italic font-medium">
                                            "This petition is used to determine that real and personal property
                                            passed to the heirs without full administration."
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-sm bg-white rounded-3xl border border-slate-100">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                        <MapPin className="w-3.5 h-3.5" /> Registry Links
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-1.5 p-3">
                                    <a href="https://www.courts.ca.gov/8865.htm" target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-all group border border-slate-50 hover:border-indigo-100">
                                        <span className="text-[11px] font-extrabold text-slate-700 tracking-tight">Courts.ca.gov Guide</span>
                                        <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500" />
                                    </a>
                                    <a href="https://www.courts.ca.gov/7646.htm" target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-all group border border-slate-50 hover:border-indigo-100">
                                        <span className="text-[11px] font-extrabold text-slate-700 tracking-tight">Probate Filing Fees</span>
                                        <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500" />
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



