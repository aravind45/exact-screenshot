import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ScreenIntro } from "@/components/ScreenIntro";
import {
    Calculator,
    ArrowDownRight,
    FileText,
    CheckCircle2,
    AlertCircle,
    Info,
    ShieldCheck,
    Lock,
    ArrowRight,
    Search,
    Plus,
    Sparkles
} from "lucide-react";
import { AuthorityBadge } from "@/components/AuthorityBadge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { api, AccountingReadiness } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function Accounting() {
    const navigate = useNavigate();
    const [isWaiverEnabled, setIsWaiverEnabled] = useState(false);

    // Fetch Real Data
    const { data: assetsData = [] } = useQuery({ queryKey: ["assets"], queryFn: api.getAssets });
    const { data: liabilitiesData = [] } = useQuery({ queryKey: ["liabilities"], queryFn: api.getLiabilities });
    const { data: readiness, isLoading: isReadinessLoading } = useQuery<AccountingReadiness>({
        queryKey: ["accounting-readiness"],
        queryFn: () => api.getAccountingReadiness()
    });
    const { data: estate } = useQuery({ queryKey: ["estate"], queryFn: api.getMyEstate });

    const assets = Array.isArray(assetsData) ? assetsData : [];
    const liabilities = Array.isArray(liabilitiesData) ? liabilitiesData : [];

    const inventoryTotal = assets.reduce((sum: number, a: any) => sum + (Number(a.value) || 0), 0);
    const paidLiabilities = liabilities.filter((l: any) => l.status === 'PAID');
    const unpaidLiabilities = liabilities.filter((l: any) => l.status !== 'PAID');

    const disbursementsTotal = paidLiabilities.reduce((sum: number, l: any) => sum + (Number(l.amount) || 0), 0);
    const estimatedDebts = unpaidLiabilities.reduce((sum: number, l: any) => sum + (Number(l.amount) || 0), 0);

    const lockedAssets = assets.filter((a: any) =>
        (a.authorityType === "COURT_REQUIRED" || a.authorityType === "LITIGATION_HOLD") &&
        !a.authorityIssuedDate
    );
    const lockedTotal = lockedAssets.reduce((sum: number, a: any) => sum + (Number(a.value) || 0), 0);

    const totalCharges = inventoryTotal;
    const propertyOnHand = totalCharges - disbursementsTotal;
    const solvencyRatio = estimatedDebts > 0 ? (propertyOnHand / estimatedDebts) * 100 : 100;

    // Authority Breakdown for Accounting
    const authorityBreakdown = assets.reduce((acc: Record<string, number>, asset: any) => {
        const type = asset.authorityType || 'UNKNOWN';
        acc[type] = (acc[type] || 0) + (Number(asset.value) || 0);
        return acc;
    }, {});

    const authorityTotals = {
        probate: (authorityBreakdown['COURT_REQUIRED'] || 0) + (authorityBreakdown['LITIGATION_HOLD'] || 0),
        excluded: (authorityBreakdown['TRUSTEE_DIRECT'] || 0) +
            (authorityBreakdown['BENEFICIARY_CONTRACT'] || 0) +
            (authorityBreakdown['SURVIVORSHIP_TITLE'] || 0) +
            (authorityBreakdown['AFFIDAVIT_SMALL'] || 0)
    };

    // Readiness Score Calculation
    const verifiedAssetsCount = assets.filter((a: any) => a.value > 0).length; // Simplified verification logic
    const assetsScore = assets.length > 0 ? (verifiedAssetsCount / assets.length) * 40 : 40;
    const liabilitiesScore = liabilities.length > 0 ? (paidLiabilities.length / liabilities.length) * 40 : 40;
    const requirementsScore = (readiness?.checks.inventoryObtained ? 10 : 0) + (readiness?.checks.claimsResolved ? 10 : 0);
    const readinessScore = Math.round(assetsScore + liabilitiesScore + requirementsScore);

    const isReady = readiness?.status === 'READY_FOR_REVIEW';
    const isDraft = readiness?.status === 'DRAFT';
    const isIncomplete = readiness?.status === 'INCOMPLETE';

    const handleExportReport = () => {
        // Generate CSV content
        const estateName = estate?.name || 'Estate';
        const date = new Date().toLocaleDateString();

        let csvContent = `Estate Accounting Report\n`;
        csvContent += `Estate: ${estateName}\n`;
        csvContent += `Generated: ${date}\n`;
        csvContent += `Status: ${readiness?.status || 'UNKNOWN'}\n\n`;

        csvContent += `SUMMARY\n`;
        csvContent += `Total Charges (Assets):,$${totalCharges.toLocaleString()}\n`;
        csvContent += `Total Credits (Disbursements):,$${disbursementsTotal.toLocaleString()}\n`;
        csvContent += `Net Property on Hand:,$${propertyOnHand.toLocaleString()}\n`;
        csvContent += `Estimated Remaining Debts:,$${estimatedDebts.toLocaleString()}\n`;
        csvContent += `Solvency Ratio:,${solvencyRatio.toFixed(1)}%\n\n`;

        csvContent += `SCHEDULE A & B - INVENTORY & RECEIPTS\n`;
        csvContent += `Asset Name,Institution,Category,Value\n`;
        assets.forEach((asset: any) => {
            csvContent += `"${asset.name || 'Unnamed'}","${asset.institution || 'N/A'}","${asset.category || 'N/A'}",$${(Number(asset.value) || 0).toFixed(2)}\n`;
        });

        csvContent += `\nSCHEDULE C & D - DISBURSEMENTS (PAID DEBTS)\n`;
        csvContent += `Liability Name,Amount,Status,Date Paid\n`;
        paidLiabilities.forEach((liability: any) => {
            const datePaid = liability.updatedAt ? new Date(liability.updatedAt).toLocaleDateString() : 'N/A';
            csvContent += `"${liability.name || 'Unnamed'}",$${(Number(liability.amount) || 0).toFixed(2)},"${liability.status}","${datePaid}"\n`;
        });

        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `accounting-report-${date.replace(/\//g, '-')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <DashboardLayout maxWidth="max-w-[1200px]">
            <div className="space-y-5">
                {/* ── Compact Sticky Header ──────────────────────────────── */}
                <header className="h-16 border-b border-slate-100 bg-white/80 backdrop-blur-xl px-4 sm:px-12 flex items-center justify-between sticky top-0 z-10 -mx-6 -mt-6 mb-6 pt-0">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-emerald-600 rounded-lg shadow-sm">
                            <Calculator className="w-4 h-4 text-white" />
                        </div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">Estate Accounting</h1>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] hidden md:block">
                            {estate?.deceasedState || "Jurisdiction"} Probate Code
                        </span>
                        {/* Readiness pill — computed, not hardcoded */}
                        <div className={cn(
                            "flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wide border",
                            isReady ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                isDraft ? "bg-amber-50 text-amber-700 border-amber-200" :
                                    "bg-rose-50 text-rose-700 border-rose-200"
                        )}>
                            <div className={cn("w-1.5 h-1.5 rounded-full", isReady ? "bg-emerald-500" : isDraft ? "bg-amber-500" : "bg-rose-500")} />
                            {readinessScore}% Ready
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                            <Button
                                variant={isWaiverEnabled ? "default" : "ghost"}
                                size="sm"
                                className={cn(
                                    "h-9 text-[11px] font-black uppercase tracking-widest px-4 rounded-xl transition-all",
                                    isWaiverEnabled ? "bg-amber-600 hover:bg-amber-700 border-none text-white shadow-md shadow-amber-200" : "text-slate-400 hover:text-slate-600"
                                )}
                                onClick={() => setIsWaiverEnabled(!isWaiverEnabled)}
                            >
                                {isWaiverEnabled ? "Waiver Active" : "Waive Accounting"}
                            </Button>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button className="text-slate-300 hover:text-slate-500 transition-colors" aria-label="About accounting waivers">
                                            <Info className="w-3.5 h-3.5" />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs text-xs leading-relaxed">
                                        A waiver is a legal election made at final settlement — every beneficiary must consent in writing. It does not remove your duty to report Net Property on Hand. Most executors leave this off.
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <Button
                            onClick={handleExportReport}
                            size="sm"
                            className="h-9 bg-slate-900 hover:bg-slate-800 text-white font-black px-5 rounded-xl text-[11px] gap-1.5"
                        >
                            <FileText className="w-3.5 h-3.5" /> Export CSV
                        </Button>
                    </div>
                </header>

                <ScreenIntro
                    what="This is the running record of money in and money out. The court and the beneficiaries expect it at final settlement — recording things as they happen is far easier than reconstructing a year later."
                />

                {/* Accounting Readiness Banner */}
                <AnimatePresence mode="wait">
                    {readiness && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                                "p-5 rounded-2xl border flex gap-4 items-center shadow-sm",
                                isReady ? "bg-emerald-50 border-emerald-100" :
                                    isDraft ? "bg-amber-50 border-amber-100" :
                                        "bg-rose-50 border-rose-100"
                            )}
                        >
                            <div className={cn(
                                "p-2 rounded-full",
                                isReady ? "bg-emerald-500 text-white" :
                                    isDraft ? "bg-amber-500 text-white" :
                                        "bg-rose-500 text-white"
                            )}>
                                {isReady ? <CheckCircle2 className="w-5 h-5" /> :
                                    isDraft ? <Info className="w-5 h-5" /> :
                                        <AlertCircle className="w-5 h-5" />}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <h3 className={cn(
                                        "text-sm font-black uppercase tracking-tight",
                                        isReady ? "text-emerald-900" :
                                            isDraft ? "text-amber-900" :
                                                "text-rose-900"
                                    )}>
                                        {isReady ? "Accounting Ready for Review" :
                                            isDraft ? "Draft Accounting in Progress" :
                                                "Accounting Incomplete"}
                                    </h3>
                                    <div className="flex gap-4">
                                        <CompletenessBadge label="Inventory" active={readiness.checks.inventoryObtained} />
                                        <CompletenessBadge label="Assets" active={readiness.checks.assetsVerified} />
                                        <CompletenessBadge label="Claims" active={readiness.checks.claimsResolved} />
                                    </div>
                                </div>
                                <p className={cn(
                                    "text-[11px] font-bold mt-1",
                                    isReady ? "text-emerald-700" :
                                        isDraft ? "text-amber-700" :
                                            "text-rose-700"
                                )}>
                                    {isReady ? "All financial schedules are balanced and verified. You are ready to proceed with distribution planning." :
                                        isDraft ? "Some inventory values or asset verifications are still pending. Values below reflect current progress." :
                                            "Unresolved claims or missing inventory filings prevent finalization of this accounting."}
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {isWaiverEnabled && (
                    <Card className="border-none shadow-md bg-amber-50 border-l-4 border-l-amber-500 rounded-2xl">
                        <CardContent className="p-4 flex gap-4">
                            <ShieldCheck className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <h4 className="text-sm font-black text-amber-900 uppercase tracking-tight">Fiduciary Guidance: Accounting Waiver</h4>
                                <p className="text-xs text-amber-700 leading-relaxed font-medium">
                                    Waiving accounting does not waive the duty to report <strong>Net Property on Hand</strong>.
                                    You are still personally liable for accurate distributions even if beneficiaries consent to a waiver.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Financial KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <KPICol
                        label="Total Charges"
                        value={totalCharges}
                        isReady={!isDraft}
                        items={[
                            { name: "Inventory Value", val: inventoryTotal, isReady: readiness?.checks.inventoryObtained },
                            { name: "Receipts (Income)", val: 0, isReady: true },
                            { name: "Gains on Sales", val: 0, isReady: true }
                        ]}
                    />

                    <KPICol
                        label="Total Credits"
                        value={disbursementsTotal}
                        isReady={!isDraft}
                        items={[
                            { name: "Paid Debts/Expenses", val: disbursementsTotal, isReady: readiness?.checks.claimsResolved },
                            { name: "Pending distributions", val: 0, isReady: true },
                            { name: "Losses on Sales", val: 0, isReady: true }
                        ]}
                    />

                    <Card className="border-none shadow-xl shadow-emerald-100 bg-slate-900 text-white overflow-hidden relative rounded-3xl">
                        <div className="absolute top-[-50%] right-[-50%] w-full h-full bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />
                        <CardHeader className="pb-2 relative z-10">
                            <CardTitle className="text-[11px] font-black uppercase tracking-widest text-slate-400">Net Property On Hand</CardTitle>
                            <div className="text-3xl font-black text-white tracking-tight">
                                {(isDraft && totalCharges === 0) ? "To be Calculated" : `$${propertyOnHand.toLocaleString()}`}
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <p className="text-[11px] text-slate-400 leading-relaxed mb-4 font-bold">
                                Charges minus Credits. This flows directly into the <strong>Final Distribution</strong> plan.
                            </p>
                            <div className="flex flex-col gap-2">
                                <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[11px] font-black uppercase text-slate-400">Solvency Health</span>
                                        <span className={cn("text-[10px] font-black uppercase", solvencyRatio >= 100 ? "text-emerald-400" : "text-amber-400")}>
                                            {solvencyRatio >= 100 ? "Estate Solvent" : "Risk of Insolvency"}
                                        </span>
                                    </div>
                                    <Progress value={Math.min(solvencyRatio, 100)} className={cn("h-1.5 bg-slate-700", solvencyRatio >= 100 ? "[&>div]:bg-emerald-500" : "[&>div]:bg-amber-500")} />
                                </div>

                                {lockedTotal > 0 && (
                                    <div className="bg-rose-900/50 rounded-2xl p-3 border border-rose-800/50 flex items-center justify-between">
                                        <div>
                                            <p className="text-[9px] font-black uppercase text-rose-300">Court Authority Locked</p>
                                            <p className="text-sm font-black text-white">${lockedTotal.toLocaleString()}</p>
                                        </div>
                                        <Badge variant="outline" className="bg-rose-500 border-none text-white text-[10px] font-black uppercase tracking-tight px-1.5 h-4 mb-2">
                                            Probate Blocker
                                        </Badge>
                                    </div>
                                )}

                                <div className="bg-slate-800/50 rounded-2xl p-3 border border-slate-700/50 space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-black uppercase text-slate-400">Net by Authority</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="flex-1 flex flex-col gap-1">
                                            <div className="flex justify-between text-[8px] font-bold text-slate-300 uppercase">
                                                <span>Probate</span>
                                                <span>${authorityTotals.probate.toLocaleString()}</span>
                                            </div>
                                            <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500"
                                                    style={{ width: `${totalCharges > 0 ? (authorityTotals.probate / totalCharges) * 100 : 0}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex-1 flex flex-col gap-1">
                                            <div className="flex justify-between text-[8px] font-bold text-slate-300 uppercase">
                                                <span>Excluded</span>
                                                <span>${authorityTotals.excluded.toLocaleString()}</span>
                                            </div>
                                            <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-emerald-500"
                                                    style={{ width: `${totalCharges > 0 ? (authorityTotals.excluded / totalCharges) * 100 : 0}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs for Schedules */}
                <Tabs defaultValue="charges" className="space-y-4">
                    <TabsList className="bg-slate-200/50 p-1 border-none rounded-xl h-auto">
                        <TabsTrigger value="charges" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-lg flex gap-2">
                            Schedules A & B (Assets)
                            {readiness?.checks.assetsVerified && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                        </TabsTrigger>
                        <TabsTrigger value="credits" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-lg flex gap-2">
                            Schedules C & D (Debts)
                            {readiness?.status === 'READY_FOR_REVIEW' && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="charges">
                        <ScheduleCard title="Outputs from Asset Ledger (Inventory & Receipts)" data={assets} />
                    </TabsContent>

                    <TabsContent value="credits">
                        <ScheduleCard
                            title="Disbursements (Paid Debts)"
                            data={paidLiabilities}
                            isDebt
                            onAdd={() => navigate('/add-liability')}
                            onDiscovery={() => navigate('/discovery')}
                        />
                    </TabsContent>
                </Tabs>

                <footer className="pt-8 border-t border-slate-200">
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center justify-between">
                        <div className="flex gap-4 items-center">
                            <div className="p-3 bg-indigo-50 rounded-2xl">
                                <ArrowRight className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-black text-slate-900 uppercase tracking-tight">Next Phase: Final Distribution</h4>
                                <p className="text-xs text-slate-500 font-medium">Once accounting is finalized, you can proceed to the court petition for distribution.</p>
                            </div>
                        </div>
                        <Button
                            onClick={() => navigate('/distribution')}
                            disabled={!isReady}
                            className={cn(
                                "h-12 px-8 rounded-2xl font-black uppercase tracking-widest text-xs transition-all",
                                isReady ? "bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100" : "bg-slate-100 text-slate-300"
                            )}
                        >
                            {isReady ? "Go to Distribution" : <><Lock className="w-4 h-4 mr-2" /> Distribution Locked</>}
                        </Button>
                    </div>
                </footer>
            </div>
        </DashboardLayout>
    );
}

function KPICol({ label, value, isReady, items }: { label: string, value: number, isReady: boolean, items: any[] }) {
    return (
        <Card className="border-none shadow-sm bg-white overflow-hidden rounded-3xl">
            <CardHeader className="pb-2">
                <CardTitle className="text-[11px] font-black uppercase tracking-widest text-slate-400">{label}</CardTitle>
                <div className={cn("text-2xl font-black", !isReady && value === 0 ? "text-slate-300 italic font-medium" : "text-slate-900")}>
                    {!isReady && value === 0 ? "Pending" : `$${value.toLocaleString()}`}
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3 mt-3">
                    {items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-[11px] font-medium">
                            <span className="text-slate-500">{item.name}</span>
                            <span className={cn(
                                "font-bold",
                                !item.isReady && item.val === 0 ? "text-slate-300 italic" : "text-slate-700"
                            )}>
                                {!item.isReady && item.val === 0 ? "Pending" : `$${item.val.toLocaleString()}`}
                            </span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function ScheduleCard({ title, data, isDebt, onAdd, onDiscovery }: { title: string, data: any[], isDebt?: boolean, onAdd?: () => void, onDiscovery?: () => void }) {
    return (
        <Card className="border-none shadow-sm bg-white overflow-hidden rounded-3xl">
            <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-500">{title}</h3>
                {isDebt && data.length > 0 && (
                    <Button onClick={onAdd} variant="ghost" size="sm" className="h-6 px-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                        <Plus className="w-3 h-3 mr-1" /> Add Payment
                    </Button>
                )}
            </div>
            <div className="divide-y divide-slate-50">
                {data.map((item: any) => (
                    <div key={item.id} className="p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "w-10 h-10 rounded-2xl flex items-center justify-center",
                                isDebt ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                            )}>
                                {isDebt ? <ArrowDownRight className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <div className="text-xs font-black text-slate-900">{item.name || item.institution}</div>
                                    {!isDebt && item.authorityType && (
                                        <AuthorityBadge type={item.authorityType} showIcon={false} className="h-4 px-1.5 border-none bg-slate-100 text-[10px]" />
                                    )}
                                </div>
                                <div className="text-[11px] text-slate-500 font-bold uppercase tracking-tight">
                                    {isDebt ? `Paid on ${item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'N/A'}` : (item.category || "General Asset")}
                                </div>
                            </div>
                        </div>
                        <div className={cn("text-sm font-black", isDebt ? "text-rose-600" : "text-emerald-600")}>
                            {isDebt ? "-" : "+"}${(Number(item.value || item.amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                    </div>
                ))}
                {data.length === 0 && (
                    <div className="p-12 text-center">
                        <div className="max-w-xs mx-auto space-y-4">
                            <div className="p-4 bg-slate-50 w-fit mx-auto rounded-3xl mb-2">
                                {isDebt ? <Search className="w-8 h-8 text-indigo-400 opacity-40 shrink-0" /> : <Search className="w-8 h-8 opacity-20" />}
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900">
                                    {isDebt ? "No Paid Debts Found" : "No records found for this schedule"}
                                </h4>
                                {isDebt && (
                                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                                        Accounting Schedule C & D tracks <strong>paid</strong> liabilities. If you have unpaid creditors, they first need to be logged and approved in the Liabilities ledger.
                                    </p>
                                )}
                            </div>

                            {isDebt && (
                                <div className="flex flex-col gap-2 pt-2">
                                    <Button
                                        onClick={onDiscovery}
                                        className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 rounded-xl h-9 text-[10px] font-black uppercase tracking-widest shadow-none"
                                    >
                                        <Sparkles className="w-3.5 h-3.5 mr-2" /> Start Debt Discovery
                                    </Button>
                                    <Button
                                        onClick={onAdd}
                                        variant="outline"
                                        className="w-full border-slate-200 rounded-xl h-9 text-[10px] font-black uppercase tracking-widest"
                                    >
                                        <Plus className="w-3.5 h-3.5 mr-2" /> Manually Add Liability
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
}

function CompletenessBadge({ label, active }: { label: string, active: boolean }) {
    return (
        <div className="flex items-center gap-1.5">
            <div className={cn(
                "w-1.5 h-1.5 rounded-full",
                active ? "bg-emerald-500" : "bg-slate-300"
            )} />
            <span className={cn(
                "text-[10px] font-black uppercase tracking-tighter",
                active ? "text-slate-900" : "text-slate-400"
            )}>
                {label}
            </span>
        </div>
    );
}

