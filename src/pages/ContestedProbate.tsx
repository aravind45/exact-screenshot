import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import {
    Gavel,
    FileText,
    AlertTriangle,
    CheckCircle2,
    Download,
    ExternalLink,
    AlertCircle,
    ArrowRight,
    Users,
    ShieldAlert,
    Scale,
    Calendar,
    MessageSquare,
    Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { downloadAutofillWithFallback } from "@/lib/formAutofill";

export default function ContestedProbate() {
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

    const handleMarkAsComplete = async (taskId: string) => {
        completeTaskMutation.mutate({ taskId });
    };

    const steps = [
        {
            id: "respond_to_objections",
            title: "File Answer to Objection",
            form: "DE-116",
            desc: "Formally respond to the will contest. Consult with legal counsel immediately.",
            status: completedTaskIds.includes("respond_to_objections") ? "completed" : "ready",
            link: "https://www.courts.ca.gov/documents/de116.pdf"
        },
        {
            id: "attend_contest_hearing",
            title: "Attend Court Hearing",
            form: "INTERNAL",
            desc: "Present evidence and testimony regarding the will's validity.",
            status: completedTaskIds.includes("attend_contest_hearing") ? "completed" :
                (completedTaskIds.includes("respond_to_objections") ? "ready" : "locked"),
            link: "#"
        },
        {
            id: "resolve_contest",
            title: "Final Resolution",
            form: "INTERNAL",
            desc: "Obtain the court's final ruling on the objection.",
            status: completedTaskIds.includes("resolve_contest") ? "completed" :
                (completedTaskIds.includes("attend_contest_hearing") ? "ready" : "locked"),
            link: "#"
        }
    ];

    return (
        <div className="flex min-h-screen bg-slate-50/50">
            <Sidebar />
            <div className="flex-1 ml-64 min-h-screen bg-gradient-to-br from-rose-50/20 via-white to-red-50/20 p-6 pl-4 font-sans">
                <div className="max-w-4xl mx-auto space-y-6">
                    <header className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="p-1 bg-rose-600 rounded shadow-md shadow-rose-200">
                                <Gavel className="w-4 h-4 text-white" />
                            </div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Probate Litigation (Contest)</h1>
                            <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 uppercase text-[9px] font-black h-4 px-2">
                                High Priority
                            </Badge>
                        </div>
                        <p className="text-slate-500 text-sm font-medium">
                            An objection has been filed against the probate petition or the validity of the Will.
                        </p>
                    </header>

                    {!estate?.isContested && (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex gap-3 text-amber-800">
                            <AlertTriangle className="w-5 h-5 shrink-0" />
                            <div className="text-xs font-medium">
                                <p className="font-black uppercase text-[10px] mb-1">Estate Status mismatch</p>
                                Your estate profile is not currently marked as "Contested". This workflow is usually only visible when litigation is active.
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Process Steps */}
                        <div className="lg:col-span-8 space-y-4">
                            {steps.map((step, idx) => (
                                <Card key={step.id} className={cn(
                                    "border-none shadow-sm transition-all overflow-hidden rounded-3xl",
                                    step.status === 'ready' ? "ring-2 ring-rose-500/20 bg-white shadow-lg shadow-rose-100/50" :
                                        (step.status === 'completed' ? "bg-white border border-rose-100 shadow-md" : "bg-slate-100/50 opacity-60")
                                )}>
                                    <CardContent className="p-0">
                                        <div className="p-6 flex items-start gap-5">
                                            {step.status === 'completed' ? (
                                                <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0 border border-rose-200 shadow-sm">
                                                    <CheckCircle2 className="w-6 h-6 text-rose-600" />
                                                </div>
                                            ) : (
                                                <div className={cn(
                                                    "w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black shrink-0 border shadow-sm",
                                                    step.status === 'ready' ? "bg-rose-600 text-white border-rose-700" : "bg-slate-200 text-slate-400 border-slate-300"
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
                                                            className="h-9 px-4 text-[10px] font-black uppercase tracking-widest border-rose-200 text-rose-700 hover:bg-rose-50"
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
                                                            onClick={() => handleMarkAsComplete(step.id)}
                                                            disabled={completeTaskMutation.isPending}
                                                        >
                                                            Mark as Complete
                                                        </Button>
                                                    )}

                                                    {step.status === 'completed' && (
                                                        <Badge className="h-9 flex items-center gap-2 bg-rose-50 text-rose-700 border-rose-100 px-4 font-black uppercase text-[10px] tracking-widest shadow-sm">
                                                            <CheckCircle2 className="w-4 h-4" /> Finished
                                                        </Badge>
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
                            <Card className="border-none shadow-2xl shadow-rose-100/50 bg-slate-900 text-white rounded-[2rem] overflow-hidden">
                                <CardHeader className="pb-4 bg-gradient-to-br from-slate-800 to-slate-900 border-b border-white/5">
                                    <div className="flex items-center gap-2.5">
                                        <AlertCircle className="w-5 h-5 text-rose-400" />
                                        <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-rose-300">Defense Strategy</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 space-y-4">
                                    <div className="space-y-4">
                                        <div className="flex gap-3">
                                            <div className="w-1 h-auto bg-rose-500 rounded-full shrink-0" />
                                            <p className="text-[10px] text-slate-300 leading-relaxed font-medium">
                                                Gather witnesses who can testify to the decedent's capacity at the time of signing.
                                            </p>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="w-1 h-auto bg-rose-500 rounded-full shrink-0" />
                                            <p className="text-[10px] text-slate-300 leading-relaxed font-medium">
                                                Review previous wills/estate plans to show consistent intent.
                                            </p>
                                        </div>
                                        <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                                            <p className="text-[9px] text-rose-300 font-bold uppercase tracking-tighter mb-1">Legal Notice</p>
                                            <p className="text-[9px] text-slate-400 font-medium italic">
                                                Will contests are highly technical. Failure to respond on time can result in default judgement.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-sm bg-white rounded-3xl border border-slate-100">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                        <Scale className="w-3.5 h-3.5" /> Burden of Proof
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 space-y-3">
                                    <p className="text-[10px] text-slate-500 leading-relaxed">
                                        Generally, the person objecting (the contestant) has the burden of proving that the will is invalid.
                                    </p>
                                    <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl">
                                        <Info className="w-3.5 h-3.5 text-blue-500" />
                                        <span className="text-[9px] font-bold text-slate-600">Probate Code § 8252</span>
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



