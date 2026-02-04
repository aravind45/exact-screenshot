import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import {
    ShoppingCart,
    FileText,
    Mail,
    CheckCircle2,
    Download,
    ExternalLink,
    AlertCircle,
    Building2,
    ArrowRight,
    Search,
    Clock,
    Gavel,
    ShieldCheck,
    Info,
    ChevronDown,
    ChevronUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function AssetSaleAuthorization() {
    const queryClient = useQueryClient();
    const [downloadingForm, setDownloadingForm] = useState<string | null>(null);
    const [activeTrack, setActiveTrack] = useState<'IAEA' | 'COURT' | null>(null);

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

    const completedTaskIds = estate?.roadmapProgress?.completedTaskIds || [];

    const handleDownload = (form: string) => {
        setDownloadingForm(form);
        generatePdfMutation.mutate(form);
    };

    const handleMarkAsComplete = async (taskId: string) => {
        completeTaskMutation.mutate({ taskId });
    };

    return (
        <div className="flex min-h-screen bg-slate-50/50">
            <Sidebar />
            <div className="flex-1 ml-64 min-h-screen bg-gradient-to-br from-indigo-50/20 via-white to-violet-50/20 p-6 pl-4 font-sans">
                <div className="max-w-4xl mx-auto space-y-6">
                    <header className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="p-1 bg-indigo-600 rounded shadow-md shadow-indigo-200">
                                <ShoppingCart className="w-4 h-4 text-white" />
                            </div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Asset Sale Authorization</h1>
                            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 uppercase text-[9px] font-black h-4 px-2">
                                Liquidation
                            </Badge>
                        </div>
                        <p className="text-slate-500 text-sm font-medium">
                            The legal process for selling estate property, typically real estate or high-value personal assets.
                        </p>
                    </header>

                    {/* Track Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button
                            variant="outline"
                            className={cn(
                                "h-auto p-6 rounded-[2rem] border-2 flex flex-col items-start gap-3 transition-all",
                                activeTrack === 'IAEA' ? "border-indigo-600 bg-indigo-50 shadow-lg shadow-indigo-100" : "border-slate-200 bg-white hover:border-indigo-200"
                            )}
                            onClick={() => setActiveTrack('IAEA')}
                        >
                            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-black text-slate-900 leading-tight">IAEA Authority</p>
                                <p className="text-[10px] text-slate-500 font-medium leading-relaxed whitespace-normal">Fast-track sale with heirs' notice. No court confirmation hearing required.</p>
                            </div>
                        </Button>

                        <Button
                            variant="outline"
                            className={cn(
                                "h-auto p-6 rounded-[2rem] border-2 flex flex-col items-start gap-3 transition-all",
                                activeTrack === 'COURT' ? "border-violet-600 bg-violet-50 shadow-lg shadow-violet-100" : "border-slate-200 bg-white hover:border-violet-200"
                            )}
                            onClick={() => setActiveTrack('COURT')}
                        >
                            <div className="w-10 h-10 rounded-2xl bg-violet-600 flex items-center justify-center text-white">
                                <Gavel className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-black text-slate-900 leading-tight">Court Confirmation</p>
                                <p className="text-[10px] text-slate-500 font-medium leading-relaxed whitespace-normal">Required for estates without IAEA or if an heir objects. Includes overbid hearing.</p>
                            </div>
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Main Content Area */}
                        <div className="lg:col-span-8 space-y-6">
                            {activeTrack === 'IAEA' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <Card className="border-none shadow-xl shadow-indigo-100/50 bg-white rounded-[2rem] overflow-hidden border-t-4 border-t-indigo-600">
                                        <CardHeader>
                                            <CardTitle className="text-lg font-black text-slate-900">IAEA Sale Process (Notice of Proposed Action)</CardTitle>
                                            <CardDescription className="text-xs font-medium">Follow these steps to sell property under IAEA.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            <div className="space-y-4">
                                                <div className="flex gap-4">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 text-xs font-black text-indigo-700 border border-indigo-200">1</div>
                                                    <div className="flex-1 space-y-3">
                                                        <p className="text-sm font-bold text-slate-900 leading-tight tracking-tight">Prepare & Serve DE-165</p>
                                                        <p className="text-xs text-slate-600">Serve heirs 15 days before the intended sale date.</p>
                                                        <Button
                                                            variant="outline"
                                                            className="h-9 rounded-xl border-indigo-200 text-[10px] font-black uppercase tracking-widest text-indigo-700 hover:bg-indigo-50 flex gap-2"
                                                            onClick={() => handleDownload("DE-165")}
                                                            disabled={downloadingForm === "DE-165"}
                                                        >
                                                            <FileText className="w-4 h-4" /> {downloadingForm === "DE-165" ? "Generating..." : "Generate DE-165"}
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="flex gap-4">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 text-xs font-black text-indigo-700 border border-indigo-200">2</div>
                                                    <div className="flex-1 space-y-3">
                                                        <p className="text-sm font-bold text-slate-900 leading-tight tracking-tight">15-Day Objection Period</p>
                                                        <p className="text-xs text-slate-600">Wait for the period to expire. If no one objects, you are free to close escrow.</p>
                                                        {!completedTaskIds.includes("wait_proposed_action_period") && (
                                                            <Button
                                                                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-9 px-4 font-black text-[10px] uppercase tracking-widest"
                                                                onClick={() => handleMarkAsComplete("wait_proposed_action_period")}
                                                            >
                                                                Period Expired
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            {activeTrack === 'COURT' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <Card className="border-none shadow-xl shadow-violet-100/50 bg-white rounded-[2rem] overflow-hidden border-t-4 border-t-violet-600">
                                        <CardHeader>
                                            <CardTitle className="text-lg font-black text-slate-900">Court Confirmation Process</CardTitle>
                                            <CardDescription className="text-xs font-medium">Higher oversight process required for certain sales.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            <div className="space-y-4">
                                                <div className="flex gap-4">
                                                    <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0 text-xs font-black text-violet-700 border border-violet-200">1</div>
                                                    <div className="flex-1 space-y-3">
                                                        <p className="text-sm font-bold text-slate-900 leading-tight tracking-tight">File Report of Sale (DE-260)</p>
                                                        <p className="text-xs text-slate-600">Submit the sale terms to the court for initial review.</p>
                                                        <Button
                                                            variant="outline"
                                                            className="h-9 rounded-xl border-violet-200 text-[10px] font-black uppercase tracking-widest text-violet-700 hover:bg-violet-50 flex gap-2"
                                                            onClick={() => handleDownload("DE-260")}
                                                            disabled={downloadingForm === "DE-260"}
                                                        >
                                                            <FileText className="w-4 h-4" /> {downloadingForm === "DE-260" ? "Generating..." : "Generate DE-260"}
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="flex gap-4">
                                                    <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0 text-xs font-black text-violet-700 border border-violet-200">2</div>
                                                    <div className="flex-1 space-y-3">
                                                        <p className="text-sm font-bold text-slate-900 leading-tight tracking-tight">Obtain Order (DE-265)</p>
                                                        <p className="text-xs text-slate-600">After the confirmation hearing, the judge signs the order allowing title transfer.</p>
                                                        <Button
                                                            variant="outline"
                                                            className="h-9 rounded-xl border-violet-200 text-[10px] font-black uppercase tracking-widest text-violet-700 hover:bg-violet-50 flex gap-2"
                                                            onClick={() => handleDownload("DE-265")}
                                                            disabled={downloadingForm === "DE-265"}
                                                        >
                                                            <Download className="w-4 h-4" /> {downloadingForm === "DE-265" ? "Generating..." : "Generate DE-265 Order"}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            {!activeTrack && (
                                <div className="p-12 text-center bg-white rounded-[2rem] shadow-sm border border-slate-100 border-dashed">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <ShoppingCart className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-900 mb-1">Select an Authorization Path</p>
                                    <p className="text-xs text-slate-500 font-medium max-w-[240px] mx-auto leading-relaxed">Choose whether you have independent authority or require court confirmation to see the personalized checklist.</p>
                                </div>
                            )}

                            <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg font-black text-slate-900">Finalizing the Sale</CardTitle>
                                    <CardDescription className="text-xs font-medium">Once authorized, proceed to close the transaction.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0 border border-slate-100">
                                                <Building2 className="w-5 h-5 text-indigo-600" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-black text-slate-900 truncate tracking-tight">Close Escrow & Deposit Proceeds</p>
                                                <p className="text-[10px] text-slate-500 font-medium">All funds must go to the Estate Account.</p>
                                            </div>
                                        </div>
                                        {!completedTaskIds.includes("sell_property") && (
                                            <Button
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-9 px-4 font-black text-[10px] uppercase tracking-widest shadow-lg shrink-0"
                                                onClick={() => handleMarkAsComplete("sell_property")}
                                            >
                                                Finalized
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar Info */}
                        <div className="lg:col-span-4 space-y-5">
                            <Card className="border-none shadow-2xl shadow-indigo-100/50 bg-slate-900 text-white rounded-[2rem] overflow-hidden">
                                <CardHeader className="pb-4 bg-gradient-to-br from-slate-800 to-slate-900 border-b border-white/5">
                                    <div className="flex items-center gap-2.5">
                                        <Info className="w-5 h-5 text-indigo-400" />
                                        <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-300">Statutory Rules</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 space-y-4">
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-1 h-auto bg-indigo-500 rounded-full shrink-0 mt-1" />
                                            <p className="text-[10px] text-slate-300 leading-relaxed font-medium">
                                                Real property must be sold for at least **90% of its appraised value** within 1 year.
                                            </p>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="w-1 h-auto bg-indigo-500 rounded-full shrink-0 mt-1" />
                                            <p className="text-[10px] text-slate-300 leading-relaxed font-medium">
                                                Commissions are usually capped at **5-6%** by local court rules.
                                            </p>
                                        </div>
                                        <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                                            <p className="text-[9px] text-indigo-300 font-bold uppercase tracking-tighter mb-1">IAEA Advantage</p>
                                            <p className="text-[9px] text-slate-400 font-medium italic">
                                                Saves 4-8 weeks by avoiding the overbid process and court calendar wait times.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-sm bg-white rounded-3xl border border-slate-100">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                        <Clock className="w-3.5 h-3.5" /> Timelines
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 space-y-3">
                                    <div className="flex items-center justify-between text-[10px]">
                                        <span className="text-slate-500 font-medium">IAEA Notice</span>
                                        <span className="font-bold text-slate-900">15 Days</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px]">
                                        <span className="text-slate-500 font-medium">Court Confirm</span>
                                        <span className="font-bold text-slate-900">4-8 Weeks</span>
                                    </div>
                                    <div className="pt-2 border-t border-slate-100">
                                        <p className="text-[9px] text-slate-400 font-medium leading-relaxed">
                                            Consult your broker regarding local market customs for probate sales.
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
