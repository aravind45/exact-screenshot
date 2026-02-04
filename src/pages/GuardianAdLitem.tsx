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
    Baby,
    Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function GuardianAdLitem() {
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

    const hasMinors = estate?.hasMinorBeneficiaries || false;
    const completedTaskIds = estate?.roadmapProgress?.completedTaskIds || [];

    const handleDownload = (form: string) => {
        setDownloadingForm(form);
        generatePdfMutation.mutate(form);
    };

    const handleMarkAsFiled = async (taskId: string) => {
        completeTaskMutation.mutate({ taskId });
    };

    const steps = [
        {
            id: "identify_minor_beneficiaries",
            title: "Identify Minor Beneficiaries",
            form: "INTERNAL",
            desc: "Confirm all beneficiaries under age 18 who require representation.",
            status: completedTaskIds.includes("identify_minor_beneficiaries") ? "completed" : "ready",
            link: "#"
        },
        {
            id: "petition_guardian_ad_litem",
            title: "File Petition for Guardian Ad Litem",
            form: "DE-350",
            desc: "The formal request to the court to appoint a representative for the minor.",
            status: completedTaskIds.includes("petition_guardian_ad_litem") ? "completed" :
                (completedTaskIds.includes("identify_minor_beneficiaries") ? "ready" : "locked"),
            link: "https://www.courts.ca.gov/documents/de350.pdf"
        },
        {
            id: "obtain_guardian_order",
            title: "Obtain Appointment Order",
            form: "DE-351",
            desc: "The court's official order designating the Guardian Ad Litem.",
            status: completedTaskIds.includes("obtain_guardian_order") ? "completed" :
                (completedTaskIds.includes("petition_guardian_ad_litem") ? "ready" : "locked"),
            link: "https://www.courts.ca.gov/documents/de351.pdf"
        }
    ];

    return (
        <div className="flex min-h-screen bg-slate-50/50">
            <Sidebar />
            <div className="flex-1 ml-64 min-h-screen bg-gradient-to-br from-amber-50/20 via-white to-orange-50/20 p-6 pl-4 font-sans">
                <div className="max-w-4xl mx-auto space-y-6">
                    <header className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="p-1 bg-amber-600 rounded shadow-md shadow-amber-200">
                                <ShieldCheck className="w-4 h-4 text-white" />
                            </div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Guardian Ad Litem (DE-350)</h1>
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 uppercase text-[9px] font-black h-4 px-2">
                                Minor Protection
                            </Badge>
                        </div>
                        <p className="text-slate-500 text-sm font-medium">
                            Ensuring the legal interests of minor beneficiaries are protected throughout probate.
                        </p>
                    </header>

                    {!hasMinors && (
                        <Card className="bg-slate-50 border-slate-200 shadow-none border-dashed opacity-80">
                            <CardContent className="p-4 flex gap-3">
                                <Info className="w-5 h-5 text-slate-400 shrink-0" />
                                <div>
                                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">Note</h4>
                                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                        Your estate profile does not currently list any minor beneficiaries.
                                        This process is usually only required when beneficiaries are under 18.
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
                                    step.status === 'ready' ? "ring-2 ring-amber-500/20 bg-white shadow-lg shadow-amber-100/50" :
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
                                                    step.status === 'ready' ? "bg-amber-600 text-white border-amber-700" : "bg-slate-200 text-slate-400 border-slate-300"
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
                                                            className="h-9 px-4 text-[10px] font-black uppercase tracking-widest border-amber-200 text-amber-700 hover:bg-amber-50"
                                                            onClick={() => handleDownload(step.form)}
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
                                                            className="h-9 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-amber-600"
                                                            asChild
                                                        >
                                                            <a href={step.link} target="_blank" rel="noreferrer">
                                                                Blank PDF
                                                            </a>
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
                                        <Gavel className="w-5 h-5 text-amber-400" />
                                        <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-300">Why this matters</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 space-y-4">
                                    <div className="space-y-4">
                                        <div className="flex gap-3">
                                            <Baby className="w-4 h-4 text-amber-400 shrink-0" />
                                            <p className="text-[10px] text-slate-300 leading-relaxed font-medium">
                                                Minors cannot legally sign waivers or represent themselves.
                                            </p>
                                        </div>
                                        <div className="flex gap-3">
                                            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                                            <p className="text-[10px] text-slate-300 leading-relaxed font-medium">
                                                A court-appointed guardian ensures their inheritance is protected.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-white/5">
                                        <p className="text-[10px] text-slate-400 leading-relaxed italic font-medium">
                                            "A guardian ad litem is appointed specifically for the litigation to
                                            look after the interests of the minor."
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-sm bg-white rounded-3xl border border-slate-100">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                        <Users className="w-3.5 h-3.5" /> Requirement
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 space-y-3">
                                    <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100">
                                        <p className="text-[10px] text-amber-800 font-bold leading-tight uppercase tracking-tighter">
                                            The Guardian Ad Litem must be unbiased and have no conflict of interest
                                            with the estate's executor.
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
