import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle, AlertCircle, ArrowDown } from "lucide-react";
import { LiabilityStats, SolvencyAssessment } from "@/lib/api";
import { motion } from "framer-motion";

interface PriorityRule {
    rank: number;
    classId: string;
    label: string;
    description: string;
}

const CA_RULES: PriorityRule[] = [
    { rank: 1, classId: "ADMINISTRATION_EXPENSES", label: "Expenses of Administration", description: "Court, attorney, and executor fees" },
    { rank: 2, classId: "MORTGAGES_SECURED", label: "Secured Debts (Mortgages)", description: "Liens and deeds of trust" },
    { rank: 3, classId: "FUNERAL_EXPENSES", label: "Funeral Expenses", description: "Reasonable costs for disposition" },
    { rank: 4, classId: "MEDICAL_LAST_ILLNESS", label: "Last Illness Expenses", description: "Final medical bills" },
    { rank: 5, classId: "FAMILY_ALLOWANCE", label: "Family Allowance", description: "Court-ordered support" },
    { rank: 6, classId: "WAGE_CLAIMS", label: "Wage Claims", description: "Unpaid employee wages" },
    { rank: 7, classId: "GENERAL_DEBTS", label: "General Debts", description: "Credit cards, personal loans" }
];

interface ClaimsPriorityEngineProps {
    stats: LiabilityStats;
    solvency?: SolvencyAssessment;
    isLoading?: boolean;
}

export function ClaimsPriorityEngine({ stats, solvency, isLoading }: ClaimsPriorityEngineProps) {
    if (isLoading) return (
        <div className="h-64 w-full bg-slate-100 animate-pulse rounded-2xl" />
    );

    const breakdown = stats.priorityBreakdown || {};
    const noticePeriodOpen = solvency?.noticePeriodStatus !== 'CLOSED';

    // Determine the "Current" priority class (the first one with unpaid debts)
    let currentRankFound = false;
    const rulesWithStatus = CA_RULES.map(rule => {
        const data = breakdown[rule.classId] || { total: 0, paid: 0 };
        const isFullyPaid = data.total > 0 && data.paid >= data.total;
        const hasDebts = data.total > 0;

        let status: 'completed' | 'active' | 'pending' = 'pending';
        if (isFullyPaid) status = 'completed';
        else if (!currentRankFound && hasDebts) {
            status = 'active';
            currentRankFound = true;
        }

        return { ...rule, ...data, status };
    });

    return (
        <Card className="border-none shadow-sm bg-white">
            <CardHeader className="pb-4">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Claims Priority Roadmap (CA § 11420)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {rulesWithStatus.map((rule, idx) => {
                        const isPayable = rule.status === 'active' &&
                            (rule.rank === 1 || !noticePeriodOpen);
                        const isRestricted = rule.status === 'active' && rule.rank > 1 && noticePeriodOpen;

                        return (
                            <div key={rule.classId} className="relative">
                                {idx < rulesWithStatus.length - 1 && (
                                    <div className="absolute left-[11px] top-6 bottom-[-12px] w-[2px] bg-slate-100 z-0" />
                                )}

                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className={`relative z-10 flex gap-4 p-3 rounded-xl transition-all ${rule.status === 'active' ? 'bg-indigo-50 border border-indigo-100 ring-2 ring-indigo-500/10' :
                                            rule.status === 'completed' ? 'bg-emerald-50/50' : 'opacity-60'
                                        }`}
                                >
                                    <div className="mt-1">
                                        {rule.status === 'completed' ? (
                                            <CheckCircle2 className="w-6 h-6 text-emerald-500 bg-white rounded-full" />
                                        ) : rule.status === 'active' ? (
                                            <AlertCircle className="w-6 h-6 text-indigo-600 animate-pulse" />
                                        ) : (
                                            <Circle className="w-6 h-6 text-slate-200 fill-white" />
                                        )}
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className={`text-xs font-black uppercase tracking-tight ${rule.status === 'active' ? 'text-indigo-900' : 'text-slate-700'
                                                }`}>
                                                {rule.rank}. {rule.label}
                                                {rule.status === 'active' && (
                                                    <span className="ml-2 text-[8px] px-1 bg-indigo-600 text-white rounded font-bold">CURRENT TIER</span>
                                                )}
                                            </p>
                                            {rule.total > 0 && (
                                                <p className="text-[10px] font-bold text-slate-500">
                                                    ${rule.paid.toLocaleString()} / ${rule.total.toLocaleString()}
                                                </p>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-0.5">
                                            {rule.description}
                                        </p>

                                        {rule.status === 'active' && rule.total > 0 && (
                                            <div className="mt-2 flex items-center gap-1.5">
                                                {isPayable ? (
                                                    <div className="py-1 px-2 rounded-md bg-emerald-600/10 w-fit flex items-center gap-1">
                                                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                                        <span className="text-[9px] font-black uppercase text-emerald-700 tracking-wider">Safe to Pay</span>
                                                    </div>
                                                ) : isRestricted ? (
                                                    <div className="py-1 px-2 rounded-md bg-amber-600/10 w-fit flex items-center gap-1">
                                                        <Circle className="w-2.5 h-2.5 text-amber-600" />
                                                        <span className="text-[9px] font-black uppercase text-amber-700 tracking-wider">Waiting for Notice Period</span>
                                                    </div>
                                                ) : null}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex gap-2 items-center text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                        <ArrowDown className="w-3 h-3" />
                        Pro Tip: Personal Liability
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                        Under CA law, an executor who pays lower-priority debts while higher ones remain unpaid can be <strong>personally liable</strong> to the higher-priority creditors if the estate runs out of money.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
