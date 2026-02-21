import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, DistributionReadiness } from "@/lib/api";
import {
    Users, Scale, FileText, Download, ShieldAlert, FileSearch,
    CheckCircle2, Circle, AlertCircle, ShieldCheck, Lock, Info, ArrowRight, Mail,
    XCircle, Gavel, AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useWorkflow } from "@/contexts/WorkflowContext";
import { RiskBanner } from "@/components/RiskBanner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { AuthorityBadge, AuthorityType } from "@/components/AuthorityBadge";
import { useTerminology } from "@/hooks/use-terminology";

export default function Distribution() {
    const queryClient = useQueryClient();
    const { assets } = useWorkflow();
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // XLSX path outcome hooks — determines if distribution is legally prohibited
    const { distributionsBlocked, isHighRisk, pathLabel, roleName, authorityType } = useTerminology();

    // Get estate for state-specific labels
    const { data: estate } = useQuery({
        queryKey: ["estate"],
        queryFn: api.getMyEstate,
        retry: false,
    });
    const estateState = estate?.deceasedState || '';

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

    const mailMutation = useMutation({
        mutationFn: (id: string) => api.mailHeir(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["heirs"] });
            toast.success("Mailing initiated successfully via Lob.com");
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to initiate mailing");
        }
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

    // Calculate Residue by Authority Source
    const authorityBreakdown = assets.reduce((acc: Record<string, number>, asset: any) => {
        const type = asset.authorityType || 'UNKNOWN';
        acc[type] = (acc[type] || 0) + (Number(asset.value) || 0);
        return acc;
    }, {});

    const authorityLabels: Record<string, string> = {
        'COURT_REQUIRED': 'Court Authority',
        'TRUSTEE_DIRECT': 'Trust Authority',
        'AFFIDAVIT_SMALL': 'Affidavit Authority',
        'BENEFICIARY_CONTRACT': 'Beneficiary Direct (Excluded)',
        'SURVIVORSHIP_TITLE': 'Survivorship (Excluded)',
        'LITIGATION_HOLD': 'Litigation Hold (Frozen)',
        'UNKNOWN': 'Unclassified'
    };

    // Safety Status logic
    // distributionsBlocked (INSOLVENT/CONTESTED) always overrides API readiness
    const isSafe = !distributionsBlocked && readiness?.status === 'ALLOWED';
    const isRestricted = distributionsBlocked || readiness?.status === 'RESTRICTED';
    const isBlocked = readiness?.status === 'BLOCKED';

    // Human-readable reason for the hard blocker
    const blockerReason = authorityType === 'INSOLVENT_ESTATE'
        ? "This estate has been classified as Insolvent (debts exceed assets). Distributions to heirs are legally prohibited until all creditors are paid in the court-mandated priority order. Distributing now exposes you to personal liability."
        : authorityType === 'CONTESTED_ESTATE'
        ? "This estate is under active litigation (Contested Probate). Distributions are frozen by law until the court resolves all contests. Proceeding without a court order may result in reversal and personal liability."
        : null;

    return (
        <div className="flex bg-slate-50 min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-[220px] p-5">
                <div className="max-w-5xl mx-auto space-y-4">
                    <header className="flex justify-between items-end">
                        <div className="space-y-1">
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Final Distribution</h1>
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

                    {/* ══════════════════════════════════════════════════════════
                        HARD BLOCKER BANNER — shown only for INSOLVENT / CONTESTED
                        This takes legal precedence over the standard readiness check.
                       ══════════════════════════════════════════════════════════ */}
                    {distributionsBlocked && blockerReason && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-5 rounded-2xl border-2 border-red-400 bg-red-50 shadow-lg shadow-red-100"
                        >
                            <div className="flex items-start gap-4">
                                <div className="p-2.5 bg-red-100 rounded-xl flex-shrink-0">
                                    {authorityType === 'INSOLVENT_ESTATE'
                                        ? <AlertTriangle className="w-6 h-6 text-red-600" />
                                        : <Gavel className="w-6 h-6 text-red-600" />
                                    }
                                </div>
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h2 className="text-lg font-black text-red-900 tracking-tight">
                                            {authorityType === 'INSOLVENT_ESTATE'
                                                ? "⛔ Distribution Legally Prohibited — Insolvent Estate"
                                                : "⛔ Distribution Frozen — Active Litigation"}
                                        </h2>
                                        <Badge className="bg-red-600 text-white border-none text-[10px] font-black uppercase tracking-widest">
                                            {pathLabel}
                                        </Badge>
                                    </div>
                                    <p className="text-sm font-medium text-red-800 leading-relaxed">
                                        {blockerReason}
                                    </p>
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {authorityType === 'INSOLVENT_ESTATE' && (
                                            <>
                                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 rounded-xl text-[11px] font-bold text-red-700">
                                                    <XCircle className="w-3.5 h-3.5" />
                                                    Do NOT distribute to heirs
                                                </div>
                                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 rounded-xl text-[11px] font-bold text-red-700">
                                                    <XCircle className="w-3.5 h-3.5" />
                                                    Pay creditors in statutory priority order
                                                </div>
                                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-amber-200 rounded-xl text-[11px] font-bold text-amber-700">
                                                    <AlertTriangle className="w-3.5 h-3.5" />
                                                    Consult a probate attorney immediately
                                                </div>
                                            </>
                                        )}
                                        {authorityType === 'CONTESTED_ESTATE' && (
                                            <>
                                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 rounded-xl text-[11px] font-bold text-red-700">
                                                    <XCircle className="w-3.5 h-3.5" />
                                                    Await court order before any distribution
                                                </div>
                                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-amber-200 rounded-xl text-[11px] font-bold text-amber-700">
                                                    <AlertTriangle className="w-3.5 h-3.5" />
                                                    All actions require attorney coordination
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Safety Signalling Banner & Risk Meter */}
                    <AnimatePresence mode="wait">
                        {readiness && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`p-4 rounded-2xl border shadow-sm flex flex-col md:flex-row gap-4 ${isSafe ? 'bg-emerald-50 border-emerald-100' :
                                    isRestricted ? 'bg-amber-50 border-amber-100' :
                                        'bg-rose-50 border-rose-100'
                                    }`}
                            >
                                {/* Fiduciary Risk Meter (Gauge Visual) */}
                                <div className="flex flex-col items-center gap-2 px-3 border-r border-slate-200/50">
                                    <div className="relative w-16 h-16 flex items-center justify-center">
                                        <svg className="w-full h-full -rotate-90">
                                            <circle
                                                cx="32" cy="32" r="26"
                                                fill="transparent"
                                                stroke="currentColor"
                                                strokeWidth="8"
                                                className="text-slate-200"
                                            />
                                            <circle
                                                cx="32" cy="32" r="26"
                                                fill="transparent"
                                                stroke="currentColor"
                                                strokeWidth="6"
                                                strokeDasharray={163.4}
                                                strokeDashoffset={163.4 - (163.4 * (isSafe ? 100 : isRestricted ? 60 : 20)) / 100}
                                                strokeLinecap="round"
                                                className={isSafe ? 'text-emerald-500' : isRestricted ? 'text-amber-500' : 'text-rose-500'}
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                            <span className={`text-sm font-black ${isSafe ? 'text-emerald-700' : isRestricted ? 'text-amber-700' : 'text-rose-700'}`}>
                                                {isSafe ? '100%' : isRestricted ? '60%' : '20%'}
                                            </span>
                                            <span className="text-[8px] font-bold uppercase tracking-tighter opacity-70">Security</span>
                                        </div>
                                    </div>
                                    <div className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${isSafe ? 'bg-emerald-500 text-white border-emerald-600' :
                                        isRestricted ? 'bg-amber-500 text-white border-amber-600' :
                                            'bg-rose-500 text-white border-rose-600'
                                        }`}>
                                        {isSafe ? 'Low Risk' : isRestricted ? 'Med Risk' : 'High Risk'}
                                    </div>
                                </div>

                                <div className="flex-1 space-y-1">
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

                                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-2 bg-white/50 p-2.5 rounded-2xl">
                                        <CheckItem label="Notice Period" done={!distributionsBlocked && readiness.checks.noticePeriodClosed} />
                                        <CheckItem label="Priority Claims" done={!distributionsBlocked && readiness.checks.allClaimsPaid} />
                                        <CheckItem label="Inventory Filed" done={readiness.checks.inventoryFiled} />
                                        <CheckItem label="Assets Verified" done={readiness.checks.assetsVerified} />
                                        <CheckItem
                                            label="Inst. Notice"
                                            done={!distributionsBlocked && assets.filter(a =>
                                                ['COURT_REQUIRED', 'TRUSTEE_DIRECT'].includes(a.authorityType)
                                            ).every(a => ['notified', 'approved', 'distributed'].includes(a.status))}
                                        />
                                        <CheckItem label="Accounting" done={readiness.checks.accountingComplete} />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <SummaryCard
                            title="Total Estate Value"
                            value={inventoryValue > 0 ? `$${inventoryValue.toLocaleString()}` : "Pending"}
                            subtitle={inventoryValue > 0 ? `From ${assets.length} items` : "Awaiting Inventory"}
                            color="slate"
                        />
                        <SummaryCard
                            title="Executor Commission"
                            value={inventoryValue > 0 ? `$${statutoryFee.toLocaleString()}` : "Pending"}
                            subtitle={estateState ? `Statutory (${estateState} Probate Code)` : "Statutory (State Probate Code)"}
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

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        <div className="space-y-4">
                            <Card className="border-none shadow-sm overflow-hidden">
                                <CardHeader className="bg-slate-50/50 pb-4">
                                    <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Proposed Plan of Distribution</CardTitle>
                                    <CardDescription className="text-slate-600 font-medium pt-1">The system has auto-calculated the residue allocation after fees & debts.</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-4">
                                    {heirs.length > 0 ? heirs.map((heir: any) => (
                                        <div key={heir.id} className="p-3 border rounded-xl bg-white flex gap-3 items-center group">
                                            <div className="p-2 bg-indigo-50 rounded-lg">
                                                <Users className="w-4 h-4 text-indigo-600" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-bold text-slate-900">{heir.name}</span>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-7 text-[9px] font-black uppercase tracking-widest px-2 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-30"
                                                            onClick={() => mailMutation.mutate(heir.id)}
                                                            disabled={!heir.address || mailMutation.isPending}
                                                        >
                                                            <Mail className="w-3 h-3 mr-1.5" />
                                                            Mail Notice
                                                        </Button>
                                                        <Badge className="bg-indigo-600">Net Residue</Badge>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-slate-500 font-medium mt-0.5">
                                                    {heir.address ? heir.address : "Add address in Settings to mail notice."}
                                                </p>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="p-8 text-center border-2 border-dashed rounded-2xl">
                                            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                            <p className="text-sm text-slate-400">No heirs identified yet. <a href="/heirs" className="text-indigo-600 hover:underline font-semibold">Add heirs →</a></p>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                                        <Info className="w-3.5 h-3.5" />
                                        Manual adjustments are restricted until safety gates are met.
                                    </div>

                                    <div className="pt-4 border-t border-slate-100 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Residue by Authority Source</h4>
                                            <Badge variant="outline" className="text-[8px] h-4 bg-slate-50 text-slate-400 border-slate-200">Court vs. Direct</Badge>
                                        </div>
                                        <div className="space-y-2">
                                            {Object.entries(authorityBreakdown).map(([type, total]) => {
                                                const isExcluded = ['BENEFICIARY_CONTRACT', 'SURVIVORSHIP_TITLE', 'TRUSTEE_DIRECT'].includes(type);
                                                return (
                                                    <div key={type} className={cn(
                                                        "flex justify-between items-center p-2.5 rounded-xl border transition-all",
                                                        isExcluded ? "bg-emerald-50/30 border-emerald-100/50" : "bg-slate-50/50 border-slate-100/50"
                                                    )}>
                                                        <div className="flex items-center gap-2">
                                                            <AuthorityBadge type={type as AuthorityType} showIcon={false} className="h-4 scale-90 origin-left" />
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-bold text-slate-700 leading-tight">
                                                                    {authorityLabels[type] || type}
                                                                </span>
                                                                <span className={cn("text-[8px] font-black uppercase tracking-tight", isExcluded ? "text-emerald-600" : "text-slate-400")}>
                                                                    {isExcluded ? "Excluded from Probate" : "Probate Asset"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <span className={cn("text-[11px] font-black", isExcluded ? "text-emerald-700" : "text-slate-900")}>
                                                            ${(total as number).toLocaleString()}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="space-y-3">
                                <Button
                                    className={`w-full h-11 text-sm font-bold rounded-xl transition-all ${
                                        distributionsBlocked
                                            ? 'bg-red-100 text-red-400 cursor-not-allowed border-2 border-red-200'
                                            : isSafe
                                                ? 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200'
                                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    }`}
                                    onClick={() => isSafe && !distributionsBlocked && generatePdfMutation.mutate()}
                                    disabled={!isSafe || distributionsBlocked}
                                    title={distributionsBlocked ? `Blocked: ${pathLabel} — distributions are legally prohibited` : undefined}
                                >
                                    {generatePdfMutation.isPending ? (
                                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                                    ) : (
                                        <>
                                            {distributionsBlocked
                                                ? <XCircle className="w-4 h-4 mr-2" />
                                                : isSafe
                                                    ? <FileText className="w-4 h-4 mr-2" />
                                                    : <Lock className="w-4 h-4 mr-2" />
                                            }
                                            {distributionsBlocked
                                                ? `Blocked — ${authorityType === 'INSOLVENT_ESTATE' ? 'Insolvent Estate' : 'Litigation Hold'}`
                                                : "Prepare Distribution for Review"
                                            }
                                        </>
                                    )}
                                </Button>
                                <p className={`text-center text-xs font-medium ${distributionsBlocked ? 'text-red-500' : 'text-slate-400'}`}>
                                    {distributionsBlocked
                                        ? authorityType === 'INSOLVENT_ESTATE'
                                            ? "⛔ Creditors must be paid before any distribution to heirs."
                                            : "⛔ Distribution frozen pending court resolution of contested claims."
                                        : "This creates a review-ready package. No assets will be distributed yet."
                                    }
                                </p>
                            </div>

                            <div className="pt-4 border-t border-slate-100 space-y-3">
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
                                            await api.downloadDossier();
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
                        <div className="h-[480px] bg-slate-200 rounded-2xl border-2 border-slate-300 border-dashed flex items-center justify-center overflow-hidden relative shadow-inner">
                            {previewUrl ? (
                                <iframe src={previewUrl} className="w-full h-full" title="PDF Preview" />
                            ) : (
                                <div className="text-center space-y-3 max-w-xs px-8">
                                    <div className="w-14 h-14 bg-slate-100 rounded-2xl mx-auto flex items-center justify-center">
                                        <Scale className="w-7 h-7 text-slate-300" />
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
