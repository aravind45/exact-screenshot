import React, { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import {
    Calculator,
    ArrowUpRight,
    ArrowDownRight,
    FileText,
    CheckCircle2,
    AlertCircle,
    Info,
    ShieldCheck,
    Lock,
    ArrowRight,
    FileSearch,
    Download
} from "lucide-react";
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

    const assets = Array.isArray(assetsData) ? assetsData : [];
    const liabilities = Array.isArray(liabilitiesData) ? liabilitiesData : [];

    const inventoryTotal = assets.reduce((sum: number, a: any) => sum + (Number(a.value) || 0), 0);
    const paidLiabilities = liabilities.filter((l: any) => l.status === 'PAID');
    const unpaidLiabilities = liabilities.filter((l: any) => l.status !== 'PAID');

    const disbursementsTotal = paidLiabilities.reduce((sum: number, l: any) => sum + (Number(l.amount) || 0), 0);
    const estimatedDebts = unpaidLiabilities.reduce((sum: number, l: any) => sum + (Number(l.amount) || 0), 0);

    const totalCharges = inventoryTotal;
    const propertyOnHand = totalCharges - disbursementsTotal;
    const solvencyRatio = estimatedDebts > 0 ? (propertyOnHand / estimatedDebts) * 100 : 100;

    const isReady = readiness?.status === 'READY_FOR_REVIEW';
    const isDraft = readiness?.status === 'DRAFT';
    const isIncomplete = readiness?.status === 'INCOMPLETE';

    return (
        <div className="flex bg-slate-50 min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
                <div className="max-w-6xl mx-auto space-y-6">
                    {/* Header */}
                    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="p-1.5 bg-emerald-600 rounded-md shadow-sm">
                                    <Calculator className="w-4 h-4 text-white" />
                                </div>
                                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Estate Accounting</h1>
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 uppercase text-[10px] font-black tracking-widest">
                                    Probate Code § 1060
                                </Badge>
                            </div>
                            <p className="text-slate-500 text-sm font-medium"> Financial command center for fiduciary transparency and court reporting. </p>
                        </div>
                        <div className="flex gap-3">
                            <div className="flex flex-col items-end mr-2">
                                <Button
                                    variant={isWaiverEnabled ? "default" : "outline"}
                                    size="sm"
                                    className={cn(
                                        "h-10 text-[10px] font-black uppercase tracking-widest px-4 transition-all rounded-xl",
                                        isWaiverEnabled ? "bg-amber-500 hover:bg-amber-600 border-none shadow-lg shadow-amber-200" : "border-slate-200 bg-white"
                                    )}
                                    onClick={() => setIsWaiverEnabled(!isWaiverEnabled)}
                                >
                                    {isWaiverEnabled ? "Accounting Waived" : "Waiver of Accounting"}
                                </Button>
                                <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">Requires all-heir consent</p>
                            </div>
                            <Button className="h-10 bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 shadow-lg shadow-slate-200 rounded-xl">
                                <FileText className="w-4 h-4 mr-2" /> Export Report
                            </Button>
                        </div>
                    </header>

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
                                        "text-xs font-medium mt-1",
                                        isReady ? "text-emerald-700/80" :
                                            isDraft ? "text-amber-700/80" :
                                                "text-rose-700/80"
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
                                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Net Property On Hand</CardTitle>
                                <div className="text-3xl font-black text-white tracking-tight">
                                    {(isDraft && totalCharges === 0) ? "To be Calculated" : `$${propertyOnHand.toLocaleString()}`}
                                </div>
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <p className="text-[11px] text-slate-400 leading-relaxed mb-4 font-medium">
                                    Charges minus Credits. This flows directly into the <strong>Final Distribution</strong> plan.
                                </p>
                                <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[10px] font-black uppercase text-slate-400">Solvency Health</span>
                                        <span className={cn("text-[10px] font-black uppercase", solvencyRatio >= 100 ? "text-emerald-400" : "text-amber-400")}>
                                            {solvencyRatio >= 100 ? "Estate Solvent" : "Risk of Insolvency"}
                                        </span>
                                    </div>
                                    <Progress value={Math.min(solvencyRatio, 100)} className={cn("h-1.5 bg-slate-700", solvencyRatio >= 100 ? "[&>div]:bg-emerald-500" : "[&>div]:bg-amber-500")} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tabs for Schedules */}
                    <Tabs defaultValue="charges" className="space-y-4">
                        <TabsList className="bg-slate-200/50 p-1 border-none rounded-xl h-auto">
                            <TabsTrigger value="charges" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg flex gap-2">
                                Schedules A & B (Assets)
                                {readiness?.checks.assetsVerified && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                            </TabsTrigger>
                            <TabsTrigger value="credits" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg flex gap-2">
                                Schedules C & D (Debts)
                                {readiness?.status === 'READY_FOR_REVIEW' && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="charges">
                            <ScheduleCard title="Inventory & Receipts" data={assets} />
                        </TabsContent>

                        <TabsContent value="credits">
                            <ScheduleCard title="Disbursements (Paid Debts)" data={paidLiabilities} isDebt />
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
            </main>
        </div>
    );
}

function KPICol({ label, value, isReady, items }: { label: string, value: number, isReady: boolean, items: any[] }) {
    return (
        <Card className="border-none shadow-sm bg-white overflow-hidden rounded-3xl">
            <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</CardTitle>
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

function ScheduleCard({ title, data, isDebt }: { title: string, data: any[], isDebt?: boolean }) {
    return (
        <Card className="border-none shadow-sm bg-white overflow-hidden rounded-3xl">
            <div className="p-4 bg-slate-50/50 border-b border-slate-100">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">{title}</h3>
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
                                <div className="text-xs font-black text-slate-900">{item.name || item.institution}</div>
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
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
                    <div className="p-16 text-center text-slate-300">
                        <div className="p-4 bg-slate-50 w-fit mx-auto rounded-3xl mb-4">
                            <Search className="w-8 h-8 opacity-20" />
                        </div>
                        <div className="text-xs font-black uppercase tracking-widest">No records found for this schedule</div>
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
                "text-[9px] font-black uppercase tracking-tighter",
                active ? "text-slate-600" : "text-slate-300"
            )}>
                {label}
            </span>
        </div>
    );
}
