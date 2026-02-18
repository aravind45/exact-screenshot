/**
 * AttorneyReviewWidget — GAP-09 Implementation
 *
 * Surfaces all upcoming `isAttorneyReviewNode` tasks in the executor's
 * roadmap as a prominent "⚠️ STOP — Get an Attorney Before This Step"
 * panel. Prevents personal-liability mistakes before they happen.
 *
 * Placement: Dashboard right sidebar (above SettlementHealthEngine)
 */

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Gavel, AlertTriangle, ChevronRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useWorkflow } from "@/contexts/WorkflowContext";
import { generateRoadmap } from "@/config/roadmapGenerator";
import { calculateAuthorityRecommendation } from "@/lib/authorityEngine";

interface AttorneyReviewWidgetProps {
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
  immediate_actions: "Immediate",
  court_filing: "Court Filing",
  asset_discovery: "Discovery",
  creditor_claims: "Creditors",
  asset_liquidation: "Liquidation",
  final_distribution: "Distribution",
};

export function AttorneyReviewWidget({ estate, assets = [] }: AttorneyReviewWidgetProps) {
  const navigate = useNavigate();
  const { completedTaskIds } = useWorkflow();

  // Compute roadmap deterministically
  const roadmap = useMemo(() => {
    if (!estate) return [];
    try {
      const rec = calculateAuthorityRecommendation(assets, estate.deceasedState || "CA", {
        hasWill: estate.hasWill,
        isSpouse: estate.isSurvivingSpouse,
        isOutOfState: estate.hasOutOfStateProperty,
        estimatedValue: estate.estimatedPersonalProperty,
        isTrustRevocable: estate.isTrustRevocable,
        hasTODDeed: estate.hasTODDeed,
        hasContest: estate.hasContest,
      });
      const mods = [...(rec.modifiers || [])];
      if (estate.isInternational) mods.push("INTERNATIONAL_MODE");
      return generateRoadmap(rec.type, estate.deceasedState || "CA", mods, rec.activeEngines);
    } catch {
      return [];
    }
  }, [estate, assets]);

  // Collect all incomplete attorney-review tasks across all phases
  const reviewNodes = useMemo(() => {
    const results: Array<{
      taskId: string;
      title: string;
      reason: string;
      phase: string;
      phaseLabel: string;
      isUpNext: boolean; // next task with all deps satisfied
    }> = [];

    for (const phaseKey of PHASE_ORDER) {
      const phase = roadmap.find((p) => p.phase === phaseKey);
      if (!phase) continue;

      for (const task of phase.tasks) {
        if (!task.isAttorneyReviewNode) continue;
        if (completedTaskIds.includes(task.id)) continue;

        const depsOk =
          !task.dependencies?.length ||
          task.dependencies.every((d: string) => completedTaskIds.includes(d));

        results.push({
          taskId: task.id,
          title: task.title,
          reason: task.attorneyReviewReason || "Attorney review required before proceeding.",
          phase: phaseKey,
          phaseLabel: PHASE_LABELS[phaseKey] || phaseKey,
          isUpNext: depsOk,
        });
      }
    }

    // Show up-next tasks first, limit to 4
    return results
      .sort((a, b) => (b.isUpNext ? 1 : 0) - (a.isUpNext ? 1 : 0))
      .slice(0, 4);
  }, [roadmap, completedTaskIds]);

  if (!reviewNodes.length) {
    return null; // Nothing to warn about
  }

  const urgentCount = reviewNodes.filter((n) => n.isUpNext).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-amber-200 bg-amber-50/60 overflow-hidden shadow-sm"
    >
      {/* Header */}
      <div className="p-4 border-b border-amber-200/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
            <Gavel className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-600 leading-none mb-0.5">
              Personal Liability Risk
            </p>
            <p className="text-sm font-black text-amber-900 leading-none">
              Attorney Review Required
            </p>
          </div>
        </div>
        {urgentCount > 0 && (
          <Badge className="bg-amber-600 text-white text-[9px] font-black px-2 py-0.5 rounded-lg border-none">
            {urgentCount} up next
          </Badge>
        )}
      </div>

      {/* Task list */}
      <div className="divide-y divide-amber-100">
        {reviewNodes.map((node) => (
          <div key={node.taskId} className="p-3 flex gap-3 items-start group">
            {/* Status dot */}
            <div className="mt-1 flex-shrink-0">
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  node.isUpNext
                    ? "bg-amber-500 animate-pulse"
                    : "bg-amber-200"
                )}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-xs font-bold text-amber-900 leading-snug line-clamp-1">
                  {node.title}
                </p>
                {node.isUpNext && (
                  <Badge
                    variant="outline"
                    className="text-[8px] font-black border-amber-400 text-amber-700 px-1.5 py-0 rounded-md flex-shrink-0"
                  >
                    Up Next
                  </Badge>
                )}
              </div>
              <p className="text-[10px] text-amber-700 leading-snug line-clamp-2">
                {node.reason}
              </p>
              <p className="text-[9px] font-black uppercase tracking-widest text-amber-500 mt-1">
                {node.phaseLabel}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer CTA */}
      <div className="p-3 border-t border-amber-200/60 flex gap-2">
        <Button
          size="sm"
          className="flex-1 h-8 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl"
          onClick={() => navigate("/roadmap")}
        >
          View on Roadmap
          <ChevronRight className="w-3 h-3 ml-1" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 border-amber-300 text-amber-700 hover:bg-amber-100 text-[10px] font-black uppercase tracking-widest rounded-xl px-3"
          onClick={() => navigate("/advisor/marketplace")}
        >
          Find Attorney
          <ExternalLink className="w-3 h-3 ml-1" />
        </Button>
      </div>
    </motion.div>
  );
}
