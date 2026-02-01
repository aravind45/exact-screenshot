import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SolvencyAssessment } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldAlert, Coins, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";

interface SolvencyTrackerProps {
    solvency: SolvencyAssessment;
    isLoading?: boolean;
}

export function SolvencyTracker({ solvency, isLoading }: SolvencyTrackerProps) {
    if (isLoading) return (
        <div className="h-32 w-full bg-slate-100 animate-pulse rounded-2xl" />
    );

    const { totalDebt, totalLiquidAssets, isSolvent, ratio, noticePeriodStatus, daysRemaining } = solvency;
    const percentage = Math.min((totalLiquidAssets / (totalDebt || 1)) * 100, 100);

    // Operational Guidance Logic
    let safetyStatus: 'ALLOWED' | 'RESTRICTED' | 'BLOCKED' = 'BLOCKED';
    let safetyLabel = "Do Not Pay Without Guidance";
    let safetyColor = "rose";
    let safetyMessage = "The estate is currently underfunded for its debts. DO NOT distribute any assets to heirs. Priority 1 & 2 debts must be handled with extreme caution.";

    if (isSolvent) {
        if (noticePeriodStatus === 'CLOSED') {
            safetyStatus = 'ALLOWED';
            safetyLabel = "Payments Allowed (By Priority)";
            safetyColor = "emerald";
            safetyMessage = "Notice period has expired and estate is solvent. You may proceed with paying approved claims in statutory order.";
        } else if (noticePeriodStatus === 'OPEN') {
            safetyStatus = 'RESTRICTED';
            safetyLabel = "Payments Restricted";
            safetyColor = "amber";
            safetyMessage = `Creditor notice period is still open (${daysRemaining} days remaining). Most claims may not be paid until this period closes to protect unknown creditors.`;
        } else {
            // NOT_STARTED
            safetyStatus = 'RESTRICTED';
            safetyLabel = "Notice Period Not Started";
            safetyColor = "slate";
            safetyMessage = "Probate letters haven't been issued yet. The 4-month creditor notice period starts once you are officially appointed.";
        }
    }

    return (
        <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Estate Solvency Assessment</CardTitle>
                    <Badge
                        variant={safetyStatus === 'ALLOWED' ? "outline" : safetyStatus === 'RESTRICTED' ? "secondary" : "destructive"}
                        className={`font-black tracking-tighter uppercase px-2 py-0.5 rounded-md ${safetyStatus === 'ALLOWED' ? "border-emerald-200 text-emerald-600 bg-emerald-50" :
                                safetyStatus === 'RESTRICTED' ? "border-amber-200 text-amber-600 bg-amber-50" : ""
                            }`}
                    >
                        {isSolvent ? (noticePeriodStatus === 'CLOSED' ? "Solvent" : "Watch Period") : "At Risk"}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-end justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-slate-500">
                            <Coins className="w-4 h-4" />
                            <span className="text-xs font-bold">Liquid Reserves</span>
                        </div>
                        <p className="text-3xl font-black text-slate-900 tracking-tight">
                            ${totalLiquidAssets.toLocaleString()}
                        </p>
                    </div>
                    <div className="text-right space-y-1">
                        <div className="flex items-center gap-2 text-slate-400 justify-end">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest text-[9px]">Total Liabilities</span>
                            <TrendingDown className="w-3 h-3" />
                        </div>
                        <p className="text-xl font-bold text-slate-400 tracking-tighter">
                            ${totalDebt.toLocaleString()}
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                        <span className="text-slate-400">Debt Coverage</span>
                        <span className={isSolvent ? "text-emerald-600" : "text-rose-500"}>
                            {percentage.toFixed(0)}%
                        </span>
                    </div>
                    <Progress
                        value={percentage}
                        className={`h-2.5 rounded-full bg-slate-100`}
                    />
                </div>

                <div className={`p-4 rounded-xl flex gap-3 items-start bg-${safetyColor}-50 text-${safetyColor}-800`}>
                    {safetyStatus === 'ALLOWED' ? (
                        <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
                    ) : (
                        <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                        <p className="text-xs font-black uppercase tracking-tight">
                            {safetyLabel}
                        </p>
                        <p className="text-[11px] leading-relaxed font-medium opacity-90">
                            {safetyMessage}
                            {!isSolvent && (
                                <strong className="block mt-1">Asset Liquidation May Be Required: Available cash may be insufficient to cover higher-priority claims.</strong>
                            )}
                        </p>
                        <p className="text-[9px] mt-1 font-black opacity-40 uppercase tracking-widest">Legal Protection Active: Payments are monitored to prevent priority violations.</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
