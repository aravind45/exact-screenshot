import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import {
    ShieldCheck,
    FileText,
    Gavel,
    CheckCircle2,
    Download,
    ExternalLink,
    AlertCircle,
    AlertTriangle,
    ArrowRight,
    Users,
    Coins,
    Banknote,
    TrendingDown,
    Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { downloadAutofillWithFallback } from "@/lib/formAutofill";

export default function BondWaiver() {
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

    const completedTaskIds = estate?.roadmapProgress?.completedTaskIds || [];

    // Calculate estimated savings
    const estateValue = Number(estate?.estimatedPersonalProperty || 0) + Number(estate?.estimatedRealProperty || 0);
    const estBondPremium = Math.max(500, Math.round(estateValue * 0.005));


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
        completeTaskMutation.mutate({ taskId });
    };

    const steps = [
        {
            id: "request_bond_waiver",
            title: "Request Waivers from Heirs",
            form: "DE-142",
            desc: "Send this form to every heir. All must sign for a total waiver.",
            status: completedTaskIds.includes("request_bond_waiver") ? "completed" : "ready",
            link: "https://www.courts.ca.gov/documents/de142.pdf"
        },
        {
            id: "file_bond_waiver",
            title: "File Signed Waivers",
            form: "INTERNAL",
            desc: "Submit all collected DE-142 forms to the court before the hearing.",
            status: completedTaskIds.includes("file_bond_waiver") ? "completed" :
                (completedTaskIds.includes("request_bond_waiver") ? "ready" : "locked"),
            link: "#"
        },
        {
            id: "obtain_bond_waiver_order",
            title: "Confirm Bond Waiver",
            form: "DE-143",
            desc: "Verify the court order waiving the bond requirement.",
            status: completedTaskIds.includes("obtain_bond_waiver_order") ? "completed" :
                (completedTaskIds.includes("file_bond_waiver") ? "ready" : "locked"),
            link: "https://www.courts.ca.gov/documents/de143.pdf"
        }
    ];

    return (
        <div className="flex min-h-screen bg-slate-50/50">
            <Sidebar />
            <div className="flex-1 ml-64 min-h-screen bg-gradient-to-br from-emerald-50/20 via-white to-teal-50/20 p-6 pl-4 font-sans">
                <div className="max-w-4xl mx-auto space-y-6">
                    <header className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="p-1 bg-emerald-600 rounded shadow-md shadow-emerald-200">
                                <Coins className="w-4 h-4 text-white" />
                            </div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Bond Waiver Process (DE-142)</h1>
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 uppercase text-[9px] font-black h-4 px-2">
                                Cost Savings
                            </Badge>
                        </div>
                        <p className="text-slate-500 text-sm font-medium">
                            Save thousands in annual insurance premiums by obtaining waivers from heirs.
                        </p>
                    </header>

                    <Card className="bg-emerald-900 text-white border-none shadow-xl rounded-[2rem] overflow-hidden">
                        <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="space-y-2 text-center md:text-left">
                                <h3 className="text-emerald-300 text-xs font-black uppercase tracking-widest">Estimated Savings</h3>
                                <div className="text-4xl md:text-5xl font-black tracking-tighter flex items-center gap-2">
                                    <Banknote className="w-8 h-8 md:w-10 md:h-10 text-emerald-400" />
                                    ${estBondPremium.toLocaleString()}
                                    <span className="text-lg md:text-xl text-emerald-500 font-bold">/year</span>
                                </div>
                                <p className="text-emerald-100/60 text-[10px] font-medium max-w-sm">
                                    Based on your current estate value of ${estateValue.toLocaleString()}.
                                    Corporate bonds typically cost 0.5% - 1% of the estate value annually.
                                </p>
                            </div>
                            <div className="flex flex-col items-center md:items-end gap-2">
                                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10 flex items-center gap-3">
                                    <TrendingDown className="w-5 h-5 text-emerald-400" />
                                    <div className="text-left">
                                        <p className="text-[10px] font-black uppercase text-emerald-300">Liability Impact</p>
                                        <p className="text-xs font-bold text-white leading-none">Reduces admin costs</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Process Steps */}
                        <div className="lg:col-span-8 space-y-4">
                            {steps.map((step, idx) => (
                                <Card key={step.id} className={cn(
                                    "border-none shadow-sm transition-all overflow-hidden rounded-3xl",
                                    step.status === 'ready' ? "ring-2 ring-emerald-500/20 bg-white shadow-lg shadow-emerald-100/50" :
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
                                                    step.status === 'ready' ? "bg-emerald-600 text-white border-emerald-700" : "bg-slate-200 text-slate-400 border-slate-300"
                                                )}>
                                                    {idx + 1}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <h3 className="text-base font-black text-slate-900 truncate tracking-tight">{step.title}</h3>
                                                    {step.form !== "INTERNAL" && (
                                                        <Badge variant="outline" className="text-[10px] font-black tracking-widest uppercase border-slate-200 text-slate-500 bg-slate-50">
                                                            Form {step.form}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-600 mb-5 leading-relaxed font-medium">{step.desc}</p>

                                                <div className="flex flex-wrap gap-2">
                                                    {step.form !== "INTERNAL" && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-9 px-4 text-[10px] font-black uppercase tracking-widest border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                                            onClick={() => handleDownload(step.form, step.link)}
                                                            disabled={downloadingForm === step.form || step.status === 'locked'}
                                                        >
                                                            {downloadingForm === step.form ? "Generating..." : "Auto-Fill (Beta)"}
                                                        </Button>
                                                    )}

                                                    {step.status === 'ready' && (
                                                        <Button
                                                            variant="default"
                                                            size="sm"
                                                            className="h-9 px-4 text-[10px] font-black uppercase tracking-widest bg-slate-900 border-none hover:bg-slate-800 shadow-lg shadow-slate-200"
                                                            onClick={() => handleMarkAsFiled(step.id)}
                                                            disabled={completeTaskMutation.isPending}
                                                        >
                                                            Complete Step
                                                        </Button>
                                                    )}

                                                    {step.status === 'completed' && (
                                                        <Badge className="h-9 flex items-center gap-2 bg-emerald-50 text-emerald-700 border-emerald-100 px-4 font-black uppercase text-[10px] tracking-widest shadow-sm">
                                                            <CheckCircle2 className="w-4 h-4" /> Finished
                                                        </Badge>
                                                    )}

                                                    {step.form !== "INTERNAL" && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-9 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-600"
                                                            asChild
                                                        >
                                                            <a href={step.link} target="_blank" rel="noreferrer">
                                                                Blank PDF
                                                            </a>
                                                        </Button>
                                                    )}
                                                </div>
                                                {step.status === 'locked' && (
                                                    <p className="mt-2 text-[10px] font-medium text-slate-400">
                                                        Complete the prior step to unlock this action.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Sidebar Info */}
                        <div className="lg:col-span-4 space-y-5">
                            <Card className="border-none shadow-2xl shadow-emerald-100/50 bg-slate-900 text-white rounded-[2rem] overflow-hidden">
                                <CardHeader className="pb-4 bg-gradient-to-br from-slate-800 to-slate-900 border-b border-white/5">
                                    <div className="flex items-center gap-2.5">
                                        <Gavel className="w-5 h-5 text-emerald-400" />
                                        <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-300">Rules of Waiver</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 space-y-4">
                                    <div className="space-y-4">
                                        <div className="flex gap-3">
                                            <div className="w-1 h-auto bg-emerald-500 rounded-full shrink-0" />
                                            <p className="text-[10px] text-slate-300 leading-relaxed font-medium">
                                                All heirs must agree. If one heir refuses, the court will likely require a bond for the entire estate.
                                            </p>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="w-1 h-auto bg-emerald-500 rounded-full shrink-0" />
                                            <p className="text-[10px] text-slate-300 leading-relaxed font-medium">
                                                Waivers must be filed BEFORE the initial probate hearing to avoid the requirement in the first order.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-sm bg-white rounded-3xl border border-slate-100">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                        <Info className="w-3.5 h-3.5" /> What is a Bond?
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 space-y-3">
                                    <p className="text-[10px] text-slate-500 leading-relaxed">
                                        A probate bond is a type of insurance policy that protects the heirs and
                                        creditors from theft or mismanagement by the executor.
                                    </p>
                                    <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100">
                                        <p className="text-[9px] text-amber-800 font-bold leading-tight uppercase tracking-tighter">
                                            If the Will explicitly states "no bond shall be required,"
                                            you may not need these waivers.
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






