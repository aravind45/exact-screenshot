import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Scale,
  ShieldCheck,
  ClipboardList,
  AlertTriangle,
  Activity,
  CheckCircle2,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface HealthEngineProps {
  scores: {
    authority: number;
    accounting: number;
    risk: number;
    compliance: number;
  };
  alerts: {
    type: "CRITICAL" | "WARNING" | "INFO";
    message: string;
  }[];
}

type ScoreKey = "authority" | "accounting" | "risk" | "compliance";

const SCORE_META: Record<
  ScoreKey,
  {
    label: string;
    icon: any;
    nextTitle: string;
    nextDetail: string;
    nextPath: string;
    nextAction: string;
  }
> = {
  authority: {
    label: "Court Authority",
    icon: Scale,
    nextTitle: "Confirm court authority",
    nextDetail: "Update probate status and letters so institutions can release estate accounts.",
    nextPath: "/probate",
    nextAction: "Review Probate Status",
  },
  accounting: {
    label: "Records",
    icon: BookOpen,
    nextTitle: "Tighten records",
    nextDetail: "Add missing assets, liabilities, and values so reports are complete.",
    nextPath: "/accounting",
    nextAction: "Open Accounting",
  },
  risk: {
    label: "Debt Safety",
    icon: ShieldCheck,
    nextTitle: "Review debt and claim order",
    nextDetail: "Check solvency and payment order before any distributions or creditor payments.",
    nextPath: "/liabilities",
    nextAction: "Review Liabilities",
  },
  compliance: {
    label: "Required Steps",
    icon: ClipboardList,
    nextTitle: "Complete the next roadmap tasks",
    nextDetail: "Finish the next unblocked tasks to reduce delays and unblock downstream filings.",
    nextPath: "/roadmap",
    nextAction: "Open Action Plan",
  },
};

export function SettlementHealthEngine({ scores, alerts }: HealthEngineProps) {
  const navigate = useNavigate();

  const overallScore = Math.round(
    scores.authority * 0.3 +
      scores.accounting * 0.3 +
      scores.risk * 0.2 +
      scores.compliance * 0.2
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

  const scorePairs: Array<[ScoreKey, number]> = [
    ["authority", scores.authority],
    ["accounting", scores.accounting],
    ["risk", scores.risk],
    ["compliance", scores.compliance],
  ];

  const weakestKey = scorePairs.reduce((lowest, current) => {
    if (!lowest) return current;
    return current[1] < lowest[1] ? current : lowest;
  }, null as [ScoreKey, number] | null)?.[0] || "compliance";

  const weakestMeta = SCORE_META[weakestKey];

  return (
    <Card className="border-none shadow-sm relative overflow-hidden bg-white rounded-3xl">
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-indigo-500/5 blur-3xl rounded-full pointer-events-none" />

      <CardHeader className="pb-4 border-b border-slate-50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-1 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5" />
              Case Progress Check
            </CardTitle>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">How Prepared This Estate Is</h2>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              This score is guidance only. Focus on the next action, not perfection.
            </p>
          </div>
          <div
            className={cn(
              "p-4 rounded-3xl flex flex-col items-center justify-center border transition-all duration-700",
              getScoreBg(overallScore)
            )}
          >
            <span className={cn("text-4xl font-black leading-none tracking-tighter", getScoreColor(overallScore))}>
              {overallScore}
            </span>
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 mt-1">Overall</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {scorePairs.map(([key, value]) => (
            <ScoreIndicator key={key} label={SCORE_META[key].label} score={value} icon={SCORE_META[key].icon} />
          ))}
        </div>

        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">
            What Needs Attention
          </h3>
          <div className="space-y-3">
            {alerts.map((alert, i) => {
              const tone =
                alert.type === "CRITICAL"
                  ? {
                      container: "bg-red-50 border-red-100",
                      icon: "bg-red-500 text-white",
                      label: "Action Needed",
                      labelCls: "text-red-900",
                    }
                  : alert.type === "WARNING"
                    ? {
                        container: "bg-amber-50 border-amber-100",
                        icon: "bg-amber-500 text-white",
                        label: "Heads Up",
                        labelCls: "text-amber-900",
                      }
                    : {
                        container: "bg-indigo-50/30 border-indigo-100/50",
                        icon: "bg-indigo-500 text-white",
                        label: "Info",
                        labelCls: "text-indigo-900",
                      };

              return (
                <motion.div
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  key={i}
                  className={cn(
                    "p-4 rounded-2xl border flex gap-3 items-center transition-all hover:shadow-sm",
                    tone.container
                  )}
                >
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm", tone.icon)}>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-[9px] font-black uppercase tracking-widest leading-none mb-1", tone.labelCls)}>
                      {tone.label}
                    </p>
                    <p className="text-xs text-slate-600 font-bold leading-tight">{alert.message}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {alerts.length === 0 && (
            <div className="p-8 text-center border border-dashed border-slate-100 bg-slate-50/30 rounded-3xl">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-3 opacity-80" />
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">No urgent blockers right now</p>
              <p className="text-[11px] text-slate-500 mt-1">Keep moving through your next roadmap step.</p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-3.5">
          <p className="text-[10px] font-black uppercase tracking-wider text-indigo-500 mb-1">Best Next Improvement</p>
          <p className="text-sm font-bold text-indigo-900">{weakestMeta.nextTitle}</p>
          <p className="text-[11px] text-indigo-700 mt-1 leading-relaxed">{weakestMeta.nextDetail}</p>
          <Button
            size="sm"
            className="mt-3 h-8 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl px-4"
            onClick={() => navigate(weakestMeta.nextPath)}
          >
            {weakestMeta.nextAction}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ScoreIndicator({ label, score, icon: Icon }: { label: string; score: number; icon: any }) {
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
        <div className={cn("h-full transition-all duration-1000 ease-out", color)} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}
