import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, DistributionReadiness } from "@/lib/api";
import {
    Users, Scale, FileText, Download, ShieldAlert, FileSearch,
    CheckCircle2, Circle, AlertCircle, ShieldCheck, Lock, Info, ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useWorkflow } from "@/contexts/WorkflowContext";
import { RiskBanner } from "@/components/RiskBanner";
import { motion, AnimatePresence } from "framer-motion";

export default function Distribution() {
    const queryClient = useQueryClient();
    const { assets } = useWorkflow();
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // 1. Fetch Readiness
    const { data: readiness, isLoading: isReadinessLoading } = useQuery<DistributionReadiness>({
        queryKey: ["distribution-readiness"],
        queryFn: () => api.getDistributionReadiness()
    });

    const { data: heirs = [] } = useQuery({
        queryKey: ["heirs"],
        queryFn: () => api.getHeirs()
    });

    // 2. Logging Mutation
    const logMutation = useMutation({
        mutationFn: (data: { eventType: string, notes?: string }) => api.logDistributionActivity(data)
    });

    // 3. Initial Review Log
    useEffect(() => {
        logMutation.mutate({ eventType: 'REVIEW_INITIATED' });
    }, []);

    // 4. PDF Generation
    const generatePdfMutation = useMutation({
        mutationFn: () => api.previewPetition({ formType: 'DE-310' }),
        onSuccess: (data) => {
            setPreviewUrl(`data:application/pdf;base64,${data.pdfBase64}`);
            toast.success("Petition generated");
        }
    });

    // Calculate Fees
    const inventoryValue = assets.reduce((sum: number, a: any) => sum + (Number(a.value) || 0), 0);
    const statutoryFee = calculateFee(inventoryValue);

    // Safety Status logic
    const isSafe = readiness?.status === 'ALLOWED';
    const isRestricted = readiness?.status === 'RESTRICTED';
    const isBlocked = readiness?.status === 'BLOCKED';

    return (
        <div className="flex bg-slate-50 min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
                <div className="max-w-5xl mx-auto space-y-6">
                    <header className="flex justify-between items-end">
                        <div className="space-y-1">
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Final Distribution</h1>
                            <p className="text-slate-500 font-medium">Prepare the estate for closing and fiduciary discharge.</p>
                        </div>
                        {readiness && (
                            <Badge variant="outline" className={`py-1 px-3 border-2 ${isSafe ? 'border-emerald-200 text-emerald-700 bg-emerald-50' :
                                isRestricted ? 'border-amber-200 text-amber-700 bg-amber-50' :
                                    'border-rose-200 text-rose-700 bg-rose-50'
                                }`}>
                                <ShieldCheck className="w-3 h-3 mr-1.5" />
                                Legal Protection Active
                            </Badge>
                        )}
                    </header>

                    {/* Safety Signalling Banner */}
                    <AnimatePresence mode="wait">
                        {readiness && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`p-4 rounded-2xl border flex gap-3 ${isSafe ? 'bg-emerald-50 border-emerald-100' :
                                    isRestricted ? 'bg-amber-50 border-amber-100' :
                                        'bg-rose-50 border-rose-100'
                                    }`}
                            >
                                <div className={`mt-0.5 p-2 rounded-full h-fit ${isSafe ? 'bg-emerald-500 text-white' :
                                    isRestricted ? 'bg-amber-500 text-white' :
                                        'bg-rose-500 text-white'
                                    }`}>
                                    {isSafe ? <CheckCircle2 className="w-5 h-5" /> :
                                        isRestricted ? <AlertCircle className="w-5 h-5" /> :
                                            <ShieldAlert className="w-5 h-5" />}
                                </div>
                                <div className="space-y-1">
                                    <h3 className={`text-lg font-black tracking-tight ${isSafe ? 'text-emerald-900' :
                                        isRestricted ? 'text-amber-900' :
                                            'text-rose-900'
                                        }`}>
                                        {isSafe ? "Distribution Allowed" :
                                            isRestricted ? "Distribution Restricted" :
                                                "Distribution Prohibited"}
                                    </h3>
                                    <p className={`text-sm font-medium ${isSafe ? 'text-emerald-700/80' :
                                        isRestricted ? 'text-amber-700/80' :
                                            'text-rose-700/80'
                                        }`}>
                                        {isSafe ? "All required steps have been completed. You may proceed with final distribution, subject to attorney review." :
                                            isRestricted ? "Final distribution is not yet allowed. One or more legal prerequisites are still pending." :
                                                "Distributing now may expose you to personal liability. Critical safety gates are currently blocked."}
                                    </p>

                                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 bg-white/50 p-2.5 rounded-xl">
                                        <CheckItem label="Notice Period" done={readiness.checks.noticePeriodClosed} />
                                        <CheckItem label="Priority Claims" done={readiness.checks.allClaimsPaid} />
                                        <CheckItem label="Inventory Filed" done={readiness.checks.inventoryFiled} />
                                        <CheckItem label="Assets Verified" done={readiness.checks.assetsVerified} />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <SummaryCard
                            title="Total Estate Value"
                            value={inventoryValue > 0 ? `$${inventoryValue.toLocaleString()}` : "Pending"}
                            subtitle={inventoryValue > 0 ? `From ${assets.length} items` : "Awaiting Inventory"}
                            color="slate"
                        />
                        <SummaryCard
                            title="Executor Commission"
                            value={inventoryValue > 0 ? `$${statutoryFee.toLocaleString()}` : "Pending"}
                            subtitle="Statutory (CA Probate Code)"
                            color="emerald"
                            onCalc={() => logMutation.mutate({ eventType: 'EXECUTOR_FEES_CALCULATED' })}
                        />
                        <SummaryCard
                            title="Statutory Attorney Fees"
                            value={inventoryValue > 0 ? `$${statutoryFee.toLocaleString()}` : "Pending"}
                            subtitle="Subject to final accounting"
                            color="indigo"
                            onCalc={() => logMutation.mutate({ eventType: 'ATTORNEY_FEES_RECORDED' })}
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <Card className="border-none shadow-sm overflow-hidden">
                                <CardHeader className="bg-slate-50/50 pb-4">
                                    <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Proposed Plan of Distribution</CardTitle>
                                    <CardDescription className="text-slate-600 font-medium pt-1">The system has auto-calculated the residue allocation after fees & debts.</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-4">
                                    {heirs.length > 0 ? heirs.map((heir: any) => (
                                        <div key={heir.id} className="p-3 border rounded-xl bg-white flex gap-3 items-center">
                                            <div className="p-2 bg-indigo-50 rounded-lg">
                                                <Users className="w-4 h-4 text-indigo-600" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-bold text-slate-900">{heir.name}</span>
                                                    <Badge className="bg-indigo-600">Net Residue</Badge>
                                                </div>
                                                <p className="text-xs text-slate-500 font-medium mt-0.5">Will receive remaining assets after court-approved fees.</p>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="p-8 text-center border-2 border-dashed rounded-2xl">
                                            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                            <p className="text-sm text-slate-400">No heirs identified yet. Please update the Roadmap.</p>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                                        <Info className="w-3.5 h-3.5" />
                                        Manual adjustments are restricted until safety gates are met.
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="space-y-3">
                                <Button
                                    size="lg"
                                    className={`w-full py-8 text-lg font-bold rounded-2xl transition-all ${isSafe ? 'bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                        }`}
                                    onClick={() => isSafe && generatePdfMutation.mutate()}
                                    disabled={!isSafe}
                                >
                                    {generatePdfMutation.isPending ? (
                                        <div className="animate-spin w-6 h-6 border-4 border-white border-t-transparent rounded-full" />
                                    ) : (
                                        <>
                                            {isSafe ? <FileText className="w-6 h-6 mr-3" /> : <Lock className="w-6 h-6 mr-3" />}
                                            Prepare Distribution for Review
                                        </>
                                    )}
                                </Button>
                                <p className="text-center text-xs text-slate-400 font-medium">
                                    This creates a review-ready package. No assets will be distributed yet.
                                </p>
                            </div>

                            <div className="pt-6 border-t border-slate-100 space-y-4">
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 mb-1 flex items-center gap-2">
                                        <FileSearch className="w-4 h-4 text-indigo-400" />
                                        Evidence of Reasonable Care
                                    </h3>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        Generate a chronological Fiduciary Activity Report containing all asset logs, creditor notices, and compliance proofs for court filing.
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    className="w-full h-12 border-2 border-indigo-100 text-indigo-700 hover:bg-indigo-50 font-bold rounded-xl"
                                    onClick={async () => {
                                        logMutation.mutate({ eventType: 'DOSSIER_GENERATED' });
                                        try {
                                            toast.info("Assembling Compliance Dossier...");
                                            const blob = await api.downloadDossier();
                                            const url = window.URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `Compliance_Dossier_Final.txt`;
                                            document.body.appendChild(a);
                                            a.click();
                                            window.URL.revokeObjectURL(url);
                                            toast.success("Dossier assembled successfully");
                                        } catch (err) {
                                            toast.error("Failed to assemble dossier");
                                        }
                                    }}
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Download Fiduciary Activity Report
                                </Button>
                            </div>
                        </div>

                        {/* Right: PDF Preview or Onboarding */}
                        <div className="h-[750px] bg-slate-200 rounded-3xl border-2 border-slate-300 border-dashed flex items-center justify-center overflow-hidden relative shadow-inner">
                            {previewUrl ? (
                                <iframe src={previewUrl} className="w-full h-full" title="PDF Preview" />
                            ) : (
                                <div className="text-center space-y-4 max-w-xs px-8">
                                    <div className="w-20 h-20 bg-slate-100 rounded-3xl mx-auto flex items-center justify-center">
                                        <Scale className="w-10 h-10 text-slate-300" />
                                    </div>
                                    <h4 className="text-slate-900 font-bold">Draft Petition Pending</h4>
                                    <p className="text-slate-400 text-xs leading-relaxed font-medium text-center">
                                        The draft DE-310 petition will appear here once all safety gates are satisfied and you initiate the preparation step.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function SummaryCard({ title, value, subtitle, color, onCalc }: { title: string, value: string, subtitle: string, color: string, onCalc?: () => void }) {
    useEffect(() => {
        if (value !== 'Pending' && onCalc) onCalc();
    }, [value]);

    return (
        <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className={`text-2xl font-black ${value === 'Pending' ? 'text-slate-300 italic font-medium' :
                    color === 'emerald' ? 'text-emerald-600' :
                        color === 'indigo' ? 'text-indigo-600' : 'text-slate-900'
                    }`}>
                    {value}
                </div>
                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">{subtitle}</p>
            </CardContent>
        </Card>
    );
}

function CheckItem({ label, done }: { label: string, done: boolean }) {
    return (
        <div className="flex items-center gap-2 group">
            {done ? (
                <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                </div>
            ) : (
                <div className="w-4 h-4 border-2 border-slate-200 rounded-full" />
            )}
            <span className={`text-[10px] font-black uppercase tracking-tight ${done ? 'text-slate-500' : 'text-slate-400'}`}>
                {label}
            </span>
        </div>
    );
}

function calculateFee(val: number) {
    if (val <= 0) return 0;
    let remaining = val;
    let fee = 0;
    const t1 = Math.min(remaining, 100000); fee += t1 * 0.04; remaining -= t1;
    if (remaining <= 0) return fee;
    const t2 = Math.min(remaining, 100000); fee += t2 * 0.03; remaining -= t2;
    if (remaining <= 0) return fee;
    const t3 = Math.min(remaining, 800000); fee += t3 * 0.02; remaining -= t3;
    if (remaining <= 0) return fee;
    const t4 = Math.min(remaining, 9000000); fee += t4 * 0.01; remaining -= t4;
    return fee;
}
