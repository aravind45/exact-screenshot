import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import {
    Flag,
    FileCheck,
    Users,
    CheckCircle2,
    Download,
    ExternalLink,
    AlertCircle,
    PartyPopper,
    ArrowRight,
    Calculator,
    Banknote,
    Lock,
    Scale,
    Info,
    ChevronDown,
    ChevronUp,
    FileText,
    Archive
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { downloadAutofillWithFallback } from "@/lib/formAutofill";

export default function FinalDistribution() {
    const queryClient = useQueryClient();
    const [downloadingForm, setDownloadingForm] = useState<string | null>(null);
    const { data: estate } = useQuery({
        queryKey: ["estate"],
        queryFn: api.getMyEstate,
    });

    const { data: heirsData = [] } = useQuery({
        queryKey: ["heirs"],
        queryFn: api.getHeirs,
        enabled: !!estate,
    });

    const estateBeneficiaries = Array.isArray((estate as any)?.beneficiaries)
        ? ((estate as any).beneficiaries as Array<{ name?: string }>)
        : [];
    const heirs = Array.isArray(heirsData)
        ? (heirsData as Array<{ name?: string }>)
        : [];
    const distributionRecipients = (estateBeneficiaries.length > 0 ? estateBeneficiaries : heirs)
        .filter((person) => Boolean(person?.name));

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
    const completedTaskIds = estate?.roadmapProgress?.completedTaskIds || [];
    const handleDownload = async (form: string, beneficiaryName?: string) => {
        const downloadKey = form === "RECEIPT_DISTRIBUTION" ? ("RECEIPT_" + (beneficiaryName || "")) : form;
        setDownloadingForm(downloadKey);

        try {
            const result = await downloadAutofillWithFallback({
                formType: form,
                payload: beneficiaryName ? { beneficiaryName } : undefined,
                blankPdfUrl: form === "DE-295" ? "https://www.courts.ca.gov/documents/de295.pdf" : undefined,
                filename: beneficiaryName ? (form + "_" + beneficiaryName + "_PreFilled.pdf") : (form + "_PreFilled.pdf"),
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

    const handleMarkAsComplete = async (taskId: string) => {
        completeTaskMutation.mutate({ taskId });
    };

    const milestones = [
        {
            id: "prepare_accounting",
            title: "Final Accounting",
            desc: "Validate every dollar that entered and left the estate.",
            status: completedTaskIds.includes("prepare_accounting") ? "completed" : "ready",
            color: "emerald"
        },
        {
            id: "file_final_petition",
            title: "Petition for Distribution",
            desc: "Ask the court for permission to distribute remaining funds.",
            status: completedTaskIds.includes("file_final_petition") ? "completed" :
                (completedTaskIds.includes("prepare_accounting") ? "ready" : "locked"),
            color: "blue"
        },
        {
            id: "distribute_assets",
            title: "Asset Distribution",
            desc: "Send checks/title to heirs and collect signed receipts.",
            status: completedTaskIds.includes("distribute_assets") ? "completed" :
                (completedTaskIds.includes("file_final_petition") ? "ready" : "locked"),
            color: "indigo"
        },
        {
            id: "close_estate",
            title: "Final Discharge (DE-295)",
            desc: "Formally terminate your liability as personal representative.",
            status: completedTaskIds.includes("close_estate") ? "completed" :
                (completedTaskIds.includes("distribute_assets") ? "ready" : "locked"),
            color: "violet"
        }
    ];

    return (
        <div className="flex min-h-screen bg-slate-50/50">
            <Sidebar />
            <div className="flex-1 ml-64 min-h-screen bg-gradient-to-br from-indigo-50/20 via-white to-sky-50/20 p-6 pl-4 font-sans">
                <div className="max-w-4xl mx-auto space-y-6">
                    <header className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="p-1 bg-indigo-600 rounded shadow-md shadow-indigo-200">
                                <Flag className="w-4 h-4 text-white" />
                            </div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Final Distribution & Closing</h1>
                            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 uppercase text-[9px] font-black h-4 px-2">
                                Phase 4: Finish
                            </Badge>
                        </div>
                        <p className="text-slate-500 text-sm font-medium">
                            Distribute remaining assets to heirs and formally close the estate records.
                        </p>
                    </header>

                    {/* Completion Tracker */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {milestones.map((m, idx) => (
                            <div key={m.id} className={cn(
                                "p-4 rounded-3xl border-2 flex flex-col items-center text-center gap-2 transition-all",
                                m.status === 'completed' ? `bg-${m.color}-50 border-${m.color}-200` :
                                    (m.status === 'ready' ? "bg-white border-slate-900 shadow-lg shadow-slate-100 ring-2 ring-slate-900/5" : "bg-slate-50 border-slate-100 opacity-50")
                            )}>
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black",
                                    m.status === 'completed' ? `bg-${m.color}-600 text-white` :
                                        (m.status === 'ready' ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-400")
                                )}>
                                    {m.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                                </div>
                                <p className="text-[10px] font-black uppercase text-slate-900 tracking-wider leading-none mt-1">{m.title}</p>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-8 space-y-6">
                            {/* Distribution Registry */}
                            <Card className="border-none shadow-xl shadow-indigo-100/50 bg-white rounded-[2rem] overflow-hidden border-t-4 border-t-indigo-600">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg font-black text-slate-900">Distribution Tracking</CardTitle>
                                    <CardDescription className="text-xs font-medium">Generate receipts for beneficiaries to sign upon receiving assets.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="border rounded-2xl overflow-hidden divide-y divide-slate-100">
                                        {distributionRecipients.length > 0 ? distributionRecipients.map((person, i) => (
                                            <div key={`${person.name}-${i}`} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                                                        <Users className="w-5 h-5 text-slate-500" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-slate-900 truncate tracking-tight">{person.name}</p>
                                                        <p className="text-[10px] text-slate-400 font-medium">Ready for Receipt</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    className="h-9 px-4 rounded-xl border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 flex gap-2"
                                                    onClick={() => handleDownload("RECEIPT_DISTRIBUTION", person.name)}
                                                    disabled={downloadingForm === `RECEIPT_${person.name}`}
                                                >
                                                    <Download className="w-4 h-4" /> Receipt
                                                </Button>
                                            </div>
                                        )) : (
                                            <div className="p-5 text-center bg-slate-50/70">
                                                <p className="text-xs font-semibold text-slate-600">No heirs or beneficiaries found.</p>
                                                <Button
                                                    variant="link"
                                                    className="h-auto p-0 mt-1 text-xs font-black uppercase tracking-wide"
                                                    asChild
                                                >
                                                    <a href="/heirs">Add recipients in Heirs</a>
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    {!completedTaskIds.includes("distribute_assets") && (
                                        <Button
                                            className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-10 font-black text-[10px] uppercase tracking-widest"
                                            onClick={() => handleMarkAsComplete("distribute_assets")}
                                        >
                                            Mark All Distributions Finished
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Final Closing */}
                            <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg font-black text-slate-900">Petition for Final Discharge</CardTitle>
                                    <CardDescription className="text-xs font-medium">The official end of your legal responsibility.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-indigo-100 shrink-0">
                                                <Archive className="w-5 h-5 text-indigo-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900 tracking-tight leading-tight">Form DE-295</p>
                                                <p className="text-[10px] text-indigo-600/70 font-medium">Ex Parte Petition for Final Discharge</p>
                                            </div>
                                        </div>
                                        <Button
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-9 px-6 font-black text-[10px] uppercase tracking-widest shrink-0"
                                            onClick={() => handleDownload("DE-295")}
                                            disabled={downloadingForm === "DE-295" || !completedTaskIds.includes("distribute_assets")}
                                        >
                                            {downloadingForm === "DE-295" ? "Preparing..." : "Auto-Fill Discharge"}
                                        </Button>
                                    </div>

                                    {!completedTaskIds.includes("close_estate") && (
                                        <Button
                                            variant="outline"
                                            className="w-full h-10 rounded-xl border-dashed border-2 border-slate-200 text-slate-400 font-bold text-xs"
                                            onClick={() => handleMarkAsComplete("close_estate")}
                                        >
                                            Final Step: Close Estate
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        <div className="lg:col-span-4 space-y-5">
                            <Card className="border-none shadow-2xl shadow-indigo-100/50 bg-slate-900 text-white rounded-[2rem] overflow-hidden">
                                <CardHeader className="pb-4 bg-gradient-to-br from-slate-800 to-slate-900 border-b border-white/5">
                                    <div className="flex items-center gap-2.5">
                                        <Scale className="w-5 h-5 text-emerald-400" />
                                        <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-300">Liability Shield</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 space-y-4">
                                    <p className="text-[10px] text-slate-300 leading-relaxed font-medium">
                                        Until the Court signs your **Final Discharge (DE-295)**, you remain personally liable for:
                                    </p>
                                    <ul className="space-y-3">
                                        <li className="flex gap-2 items-start text-[10px] text-slate-200">
                                            <div className="w-1 h-1 rounded-full bg-emerald-400 mt-1 shrink-0" />
                                            Unpaid estate taxes
                                        </li>
                                        <li className="flex gap-2 items-start text-[10px] text-slate-200">
                                            <div className="w-1 h-1 rounded-full bg-emerald-400 mt-1 shrink-0" />
                                            Disputed heir claims
                                        </li>
                                        <li className="flex gap-2 items-start text-[10px] text-slate-200">
                                            <div className="w-1 h-1 rounded-full bg-emerald-400 mt-1 shrink-0" />
                                            Reporting errors
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-sm bg-white rounded-3xl border border-slate-100">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                        <FileCheck className="w-3.5 h-3.5" /> Best Practices
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 space-y-3">
                                    <div className="p-3 bg-slate-50 rounded-2xl space-y-2 border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">Requirement</p>
                                        <p className="text-[10px] text-slate-600 leading-relaxed">
                                            You MUST obtain a signed receipt for every asset distributed before filing for discharge.
                                        </p>
                                    </div>
                                    <div className="p-3 bg-amber-50 rounded-2xl space-y-2 border border-amber-100">
                                        <p className="text-[10px] font-black text-amber-900 uppercase tracking-tight">Records</p>
                                        <p className="text-[10px] text-amber-800/80 leading-relaxed">
                                            Keep all bank statements and receipts for 10 years after closing.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}







