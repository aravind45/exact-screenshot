import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ShieldCheck,
    ShieldAlert,
    Heart,
    Zap,
    Scale,
    AlertTriangle,
    Activity,
    Lock,
    CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";

interface HealthEngineProps {
    scores: {
        authority: number;   // 0-100 (Based on letters issued % or required filings)
        accounting: number;  // 0-100 (Readiness score)
        risk: number;        // 0-100 (Inverse of debt ratio/litigation)
        compliance: number;   // 0-100 (Completed mandatory tasks)
    };
    alerts: {
        type: 'CRITICAL' | 'WARNING' | 'INFO';
        message: string;
    }[];
}

export function SettlementHealthEngine({ scores, alerts }: HealthEngineProps) {
    const overallScore = Math.round(
        (scores.authority * 0.3) +
        (scores.accounting * 0.3) +
        (scores.risk * 0.2) +
        (scores.compliance * 0.2)
    );

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-indigo-600";
        if (score >= 50) return "text-amber-500";
        return "text-rose-500";
    };

    const getScoreBg = (score: number) => {
        if (score >= 80) return "bg-indigo-50 border-indigo-100/50 shadow-sm";
        if (score >= 50) return "bg-amber-50 border-amber-100/50 shadow-sm";
        return "bg-rose-50 border-rose-100/50 shadow-sm";
    };

    return (
        <Card className="border-none shadow-sm relative overflow-hidden bg-white rounded-3xl">
            {/* Ambient Background Glow */}
            <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-indigo-500/5 blur-3xl rounded-full pointer-events-none" />

            <CardHeader className="pb-4 border-b border-slate-50">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-1 flex items-center gap-2">
                            <Activity className="w-3.5 h-3.5" />
                            Settlement Health Engine
                        </CardTitle>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Fiduciary Health Index</h2>
                    </div>
                    <div className={cn(
                        "p-4 rounded-3xl flex flex-col items-center justify-center border transition-all duration-700",
                        getScoreBg(overallScore)
                    )}>
                        <span className={cn("text-4xl font-black leading-none tracking-tighter", getScoreColor(overallScore))}>{overallScore}</span>
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 mt-1">Overall</span>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-8">
                {/* Sub-scores Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <ScoreIndicator label="Authority" score={scores.authority} icon={Scale} />
                    <ScoreIndicator label="Accounting" score={scores.accounting} icon={Zap} />
                    <ScoreIndicator label="Liability Risk" score={scores.risk} icon={ShieldCheck} />
                    <ScoreIndicator label="Compliance" score={scores.compliance} icon={ShieldAlert} />
                </div>

                {/* Risk Feed */}
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Live Risk Feed</h3>
                    <div className="space-y-3">
                        {alerts.map((alert, i) => (
                            <motion.div
                                initial={{ x: -10, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: i * 0.1 }}
                                key={i}
                                className={cn(
                                    "p-4 rounded-2xl border flex gap-3 items-center transition-all hover:shadow-sm",
                                    alert.type === 'CRITICAL' ? "bg-red-50 border-red-100" :
                                        alert.type === 'WARNING' ? "bg-amber-50 border-amber-100" :
                                            "bg-indigo-50/30 border-indigo-100/50"
                                )}
                            >
                                <div className={cn(
                                    "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                                    alert.type === 'CRITICAL' ? "bg-red-500 text-white" :
                                        alert.type === 'WARNING' ? "bg-amber-500 text-white" :
                                            "bg-indigo-500 text-white"
                                )}>
                                    {alert.type === 'CRITICAL' ? <AlertTriangle className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={cn(
                                        "text-[9px] font-black uppercase tracking-widest leading-none mb-1",
                                        alert.type === 'CRITICAL' ? "text-red-900" :
                                            alert.type === 'WARNING' ? "text-amber-900" :
                                                "text-indigo-900"
                                    )}>
                                        {alert.type}
                                    </p>
                                    <p className="text-xs text-slate-600 font-bold leading-tight truncate">
                                        {alert.message}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                    {alerts.length === 0 && (
                        <div className="p-10 text-center border border-dashed border-slate-100 bg-slate-50/30 rounded-3xl">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-3 opacity-80" />
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">No Active Fiduciary Risks</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function ScoreIndicator({ label, score, icon: Icon }: { label: string, score: number, icon: any }) {
    const color = score >= 80 ? "bg-indigo-600" : score >= 50 ? "bg-amber-500" : "bg-rose-500";

    return (
        <div className="space-y-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 group hover:bg-slate-50 transition-colors">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 group-hover:border-indigo-100 transition-colors">
                        <Icon className="w-3.5 h-3.5 text-indigo-600" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-tight text-slate-500 antialiased">{label}</span>
                </div>
                <span className="text-[11px] font-black text-slate-900">{score}%</span>
            </div>
            <div className="h-1.5 bg-white rounded-full overflow-hidden border border-slate-100">
                <div
                    className={cn("h-full transition-all duration-1000 ease-out", color)}
                    style={{ width: `${score}%` }}
                />
            </div>
        </div>
    );
}
