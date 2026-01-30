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

    const { totalDebt, totalLiquidAssets, isSolvent, ratio } = solvency;
    const percentage = Math.min((totalLiquidAssets / (totalDebt || 1)) * 100, 100);

    return (
        <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Estate Solvency Assessment</CardTitle>
                    <Badge
                        variant={isSolvent ? "outline" : "destructive"}
                        className={`font-black tracking-tighter uppercase px-2 py-0.5 rounded-md ${isSolvent ? "border-emerald-200 text-emerald-600 bg-emerald-50" : ""}`}
                    >
                        {isSolvent ? "Solvent" : "At Risk"}
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
                    // Note: Progress component styling via CSS if possible or inline
                    />
                </div>

                <div className={`p-4 rounded-xl flex gap-3 items-start ${isSolvent ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}>
                    {isSolvent ? (
                        <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
                    ) : (
                        <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                        <p className="text-xs font-black uppercase tracking-tight">
                            {isSolvent ? "Legal Protection Active" : "Immediate Action Required"}
                        </p>
                        <p className="text-[11px] leading-relaxed font-medium opacity-90">
                            {isSolvent
                                ? "Estate has sufficient liquid assets to cover current reported claims. It is generally safe to proceed with priority payments."
                                : "The estate is currently underfunded for its debts. DO NOT distribute any assets to heirs. Priority 1 & 2 debts must be handled with extreme caution."
                            }
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
