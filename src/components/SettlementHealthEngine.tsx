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
    Lock
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
        if (score >= 80) return "text-emerald-500";
        if (score >= 50) return "text-amber-500";
        return "text-rose-500";
    };

    const getScoreBg = (score: number) => {
        if (score >= 80) return "bg-emerald-500/10 border-emerald-500/20 shadow-emerald-50";
        if (score >= 50) return "bg-amber-500/10 border-amber-500/20 shadow-amber-50";
        return "bg-rose-500/10 border-rose-500/20 shadow-rose-50";
    };

    return (
        <Card className="border-none shadow-2xl relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-3xl">
            {/* Ambient Background Glow */}
            <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-indigo-500/5 blur-3xl rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none" />

            <CardHeader className="pb-2 border-b border-slate-50">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-2">
                            <Activity className="w-3 h-3 text-indigo-500" />
                            Settlement Health Engine
                        </CardTitle>
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Fiduciary Health Index</h2>
                    </div>
                    <div className={cn(
                        "p-4 rounded-2xl flex flex-col items-center justify-center border transition-all duration-700",
                        getScoreBg(overallScore)
                    )}>
                        <span className={cn("text-3xl font-black leading-none", getScoreColor(overallScore))}>{overallScore}</span>
                        <span className="text-[8px] font-black uppercase tracking-tighter text-slate-500 mt-1">Overall</span>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
                {/* Sub-scores Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <ScoreIndicator label="Authority" score={scores.authority} icon={Scale} />
                    <ScoreIndicator label="Accounting" score={scores.accounting} icon={Zap} />
                    <ScoreIndicator label="Liability Risk" score={scores.risk} icon={ShieldCheck} />
                    <ScoreIndicator label="Compliance" score={scores.compliance} icon={ShieldAlert} />
                </div>

                {/* Risk Feed */}
                <div className="space-y-2">
                    <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400 font-bold mb-3">Live Risk Feed</h3>
                    {alerts.map((alert, i) => (
                        <motion.div
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: i * 0.1 }}
                            key={i}
                            className={cn(
                                "p-3 rounded-xl border flex gap-3 items-center",
                                alert.type === 'CRITICAL' ? "bg-rose-50 border-rose-100" :
                                    alert.type === 'WARNING' ? "bg-amber-50 border-amber-100" :
                                        "bg-slate-50 border-slate-100"
                            )}
                        >
                            <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                alert.type === 'CRITICAL' ? "bg-rose-500 text-white" :
                                    alert.type === 'WARNING' ? "bg-amber-500 text-white" :
                                        "bg-slate-500 text-white"
                            )}>
                                {alert.type === 'CRITICAL' ? <AlertTriangle className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                            </div>
                            <div className="flex-1">
                                <p className={cn(
                                    "text-[10px] font-black uppercase tracking-tight",
                                    alert.type === 'CRITICAL' ? "text-rose-900" :
                                        alert.type === 'WARNING' ? "text-amber-900" :
                                            "text-slate-900"
                                )}>
                                    {alert.type}
                                </p>
                                <p className="text-[11px] text-slate-500 font-medium leading-tight">
                                    {alert.message}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                    {alerts.length === 0 && (
                        <div className="p-4 text-center border border-dashed border-slate-200 rounded-2xl">
                            <Heart className="w-5 h-5 text-emerald-400 mx-auto mb-1 opacity-50" />
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">No Active Fiduciary Risks</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function ScoreIndicator({ label, score, icon: Icon }: { label: string, score: number, icon: any }) {
    const color = score >= 80 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-rose-500";

    return (
        <div className="space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-white rounded-lg shadow-sm border border-slate-100">
                        <Icon className="w-3 h-3 text-slate-600" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-tight text-slate-500">{label}</span>
                </div>
                <span className="text-[10px] font-black text-slate-900">{score}%</span>
            </div>
            <Progress value={score} className={cn("h-1 [&>div]:transition-all duration-1000", `[&>div]:${color}`)} />
        </div>
    );
}
