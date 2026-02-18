/**
 * NextActionWidget — GAP-02 Implementation
 *
 * Surfaces the single highest-priority incomplete task the executor
 * should act on today. Logic:
 *   1. Walk phases in order (immediate_actions → final_distribution)
 *   2. In each phase, find first incomplete task where ALL dependencies are met
 *   3. Cross-reference with live deadlines for urgency coloring
 *   4. Display one clear card with CTA → /roadmap
 */

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Target,
  Clock,
  ArrowRight,
  AlertTriangle,
  Gavel,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useWorkflow } from "@/contexts/WorkflowContext";
import { generateRoadmap } from "@/config/roadmapGenerator";
import { calculateAuthorityRecommendation } from "@/lib/authorityEngine";
import { api } from "@/lib/api";

interface NextActionWidgetProps {
  estate: any;
  assets?: any[];
}

const PHASE_ORDER = [
  "immediate_actions",
  "court_filing",
  "asset_discovery",
  "creditor_claims",
  "asset_liquidation",
  "final_distribution",
] as const;

const PHASE_LABELS: Record<string, string> = {
  immediate_actions: "Immediate Actions",
  court_filing: "Court Filing",
  asset_discovery: "Asset Discovery",
  creditor_claims: "Creditor Claims",
  asset_liquidation: "Asset Liquidation",
  final_distribution: "Final Distribution",
};

export function NextActionWidget({ estate, assets = [] }: NextActionWidgetProps) {
  const navigate = useNavigate();
  const { completedTaskIds } = useWorkflow();

  // Share React Query cache with DeadlineTracker (same query key)
  const { data: deadlines = [] } = useQuery({
    queryKey: ["deadlines", estate?.id],
    queryFn: () => api.getDeadlines(estate?.id),
    enabled: !!estate?.id,
  });

  // Compute the roadmap deterministically from estate data
  const roadmap = useMemo(() => {
    if (!estate) return [];
    try {
      const recommendation = calculateAuthorityRecommendation(
        assets,
        estate.deceasedState || "CA",
        {
          hasWill: estate.hasWill,
          isSpouse: estate.isSurvivingSpouse,
          isOutOfState: estate.hasOutOfStateProperty,
          estimatedValue: estate.estimatedPersonalProperty,
          isTrustRevocable: estate.isTrustRevocable,
          hasTODDeed: estate.hasTODDeed,
          hasContest: estate.hasContest,
        }
      );
      const modifiers = [...(recommendation.modifiers || [])];
      if (estate.isInternational) modifiers.push("INTERNATIONAL_MODE");
      return generateRoadmap(
        recommendation.type,
        estate.deceasedState || "CA",
        modifiers,
        recommendation.activeEngines
      );
    } catch {
      return [];
    }
  }, [estate, assets]);

  // Walk phases in order — find the first unblocked, incomplete task
  const nextAction = useMemo(() => {
    if (!roadmap.length) return null;

    for (const phaseKey of PHASE_ORDER) {
      const phase = roadmap.find((p) => p.phase === phaseKey);
      if (!phase) continue;

      for (const task of phase.tasks) {
        // Already done — skip
        if (completedTaskIds.includes(task.id)) continue;

        // All dependencies must be satisfied
        const depsOk =
          !task.dependencies?.length ||
          task.dependencies.every((depId: string) =>
            completedTaskIds.includes(depId)
          );
        if (!depsOk) continue;

        // Cross-reference with a live deadline (by deadlineWarningId OR title prefix)
        const deadline = (deadlines as any[]).find(
          (d) =>
            (task.deadlineWarningId && d.deadlineWarningId === task.deadlineWarningId) ||
            (d.title &&
              task.title &&
              d.title.toLowerCase().startsWith(task.title.toLowerCase().slice(0, 12)))
        );

        return {
          task,
          phase: phaseKey,
          phaseLabel: PHASE_LABELS[phaseKey] || phaseKey,
          deadline,
        };
      }
    }
    return null;
  }, [roadmap, completedTaskIds, deadlines]);

  // Derive urgency level
  const urgency = useMemo(() => {
    if (!nextAction?.deadline?.dueDate) return null;
    const daysLeft = Math.ceil(
      (new Date(nextAction.deadline.dueDate).getTime() - Date.now()) / 86_400_000
    );
    if (daysLeft < 0)
      return {
        label: "OVERDUE",
        days: Math.abs(daysLeft),
        colorText: "text-red-700",
        colorBg: "bg-red-100",
        cardBg: "bg-red-50",
        cardBorder: "border-red-200",
        btnClass: "bg-red-600 hover:bg-red-700 text-white",
        iconBg: "bg-red-100 text-red-600",
      };
    if (daysLeft <= 7)
      return {
        label: "CRITICAL",
        days: daysLeft,
        colorText: "text-red-700",
        colorBg: "bg-red-100",
        cardBg: "bg-red-50",
        cardBorder: "border-red-200",
        btnClass: "bg-red-600 hover:bg-red-700 text-white",
        iconBg: "bg-red-100 text-red-600",
      };
    if (daysLeft <= 30)
      return {
        label: "DUE SOON",
        days: daysLeft,
        colorText: "text-amber-700",
        colorBg: "bg-amber-100",
        cardBg: "bg-amber-50/60",
        cardBorder: "border-amber-200",
        btnClass: "bg-amber-600 hover:bg-amber-700 text-white",
        iconBg: "bg-amber-100 text-amber-600",
      };
    return {
      label: `${daysLeft}d`,
      days: daysLeft,
      colorText: "text-indigo-700",
      colorBg: "bg-indigo-100",
      cardBg: "bg-white",
      cardBorder: "border-indigo-100",
      btnClass: "bg-indigo-600 hover:bg-indigo-700 text-white",
      iconBg: "bg-indigo-100 text-indigo-600",
    };
  }, [nextAction]);

  // Defaults when no deadline is attached
  const cardBg = urgency?.cardBg ?? "bg-white";
  const cardBorder = urgency?.cardBorder ?? "border-indigo-100";
  const btnClass = urgency?.btnClass ?? "bg-indigo-600 hover:bg-indigo-700 text-white";
  const iconBg = urgency?.iconBg ?? "bg-indigo-100 text-indigo-600";

  // ── All done ──────────────────────────────────────────────────────────────
  if (!nextAction) {
    return (
      <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-5 flex gap-4 items-center">
        <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-black text-emerald-800">All tasks complete</p>
          <p className="text-xs text-emerald-600 mt-0.5">
            Your estate is fully settled. Excellent work.
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "rounded-3xl border p-5 space-y-4 shadow-sm",
        cardBg,
        cardBorder
      )}
    >
      {/* ── Header row ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("p-2.5 rounded-2xl", iconBg)}>
            <Target className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 leading-none mb-0.5">
              What To Do Today
            </p>
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-700 leading-none">
              Your Next Action
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {urgency && (
            <div
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                urgency.colorBg,
                urgency.colorText
              )}
            >
              <Zap className="w-3 h-3" />
              {urgency.label === "OVERDUE"
                ? `${urgency.days}d Overdue`
                : urgency.label === "CRITICAL"
                ? `${urgency.days}d — Act Now`
                : urgency.label === "DUE SOON"
                ? `${urgency.days}d Left`
                : urgency.label}
            </div>
          )}
          <Badge
            variant="outline"
            className="text-[9px] font-black uppercase tracking-wider border-slate-200 text-slate-400 rounded-lg px-2"
          >
            {nextAction.phaseLabel}
          </Badge>
        </div>
      </div>

      {/* ── Task body ── */}
      <div className="space-y-1.5">
        <h3 className="text-xl font-black text-slate-900 leading-tight tracking-tight">
          {nextAction.task.title}
        </h3>
        {nextAction.task.description && (
          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
            {nextAction.task.description}
          </p>
        )}
      </div>

      {/* ── Meta chips ── */}
      <div className="flex flex-wrap items-center gap-2">
        {nextAction.task.estimatedTime && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-wider">
            <Clock className="w-3 h-3" />
            ~{nextAction.task.estimatedTime}
          </div>
        )}
        {nextAction.task.isAttorneyReviewNode && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-wider border border-amber-200">
            <Gavel className="w-3 h-3" />
            Get Legal Advice First
          </div>
        )}
        {nextAction.task.requiresAuthority && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider border border-indigo-100">
            Requires Letters of Authority
          </div>
        )}
      </div>

      {/* ── Inline task alert ── */}
      {nextAction.task.alerts?.length > 0 && (
        <div className="p-3 bg-white/90 border border-amber-100 rounded-2xl flex gap-2.5 items-start">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-800 font-semibold leading-relaxed">
            {nextAction.task.alerts[0].message}
          </p>
        </div>
      )}

      {/* ── CTA ── */}
      <Button
        className={cn(
          "w-full h-11 font-black text-[11px] uppercase tracking-widest rounded-2xl shadow-sm",
          btnClass
        )}
        onClick={() => navigate("/roadmap")}
      >
        Start This Task
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </motion.div>
  );
}
