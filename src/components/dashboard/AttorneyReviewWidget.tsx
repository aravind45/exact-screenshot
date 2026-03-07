/**
 * AttorneyReviewWidget — surfaces high-risk legal decision points with direct actions.
 *
 * Goal: keep the executor moving safely by showing only the attorney-review tasks
 * that are still incomplete, prioritized by what can be done right now.
 */

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Gavel, ChevronRight, ExternalLink, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useWorkflow } from "@/contexts/WorkflowContext";
import { generateRoadmap } from "@/config/roadmapGenerator";
import { calculateAuthorityRecommendation } from "@/lib/authorityEngine";
import { PHASE_ORDER } from "@/config/roadmapMetadata";
import { TASK_ACTIONS } from "@/config/taskActions";

interface AttorneyReviewWidgetProps {
  estate: {
    status?: string | null;
    deceasedState?: string | null;
    hasWill?: boolean;
    isSurvivingSpouse?: boolean;
    hasOutOfStateProperty?: boolean;
    estimatedPersonalProperty?: number;
    isTrustRevocable?: boolean | null;
    hasTODDeed?: boolean;
    hasContest?: boolean;
    isInternational?: boolean;
  } | null | undefined;
  assets?: Array<Record<string, unknown>>;
}

interface ResolvedTaskAction {
  type: "navigate" | "external";
  target: string;
  label: string;
}

interface ReviewNode {
  taskId: string;
  title: string;
  reason: string;
  phase: string;
  phaseLabel: string;
  isUpNext: boolean;
  missingDependencyCount: number;
  actionType: "navigate" | "external";
  actionTarget: string;
  actionLabel: string;
}

const PHASE_LABELS: Record<string, string> = {
  immediate_actions: "Immediate",
  court_filing: "Court Filing",
  asset_discovery: "Discovery",
  creditor_claims: "Creditors",
  asset_liquidation: "Liquidation",
  final_distribution: "Distribution",
};

const DEFAULT_ACTION: ResolvedTaskAction = {
  type: "navigate",
  target: "/roadmap",
  label: "Open on Roadmap",
};

function resolveTaskAction(taskId: string): ResolvedTaskAction {
  const action = TASK_ACTIONS[taskId];
  if (!action) return DEFAULT_ACTION;

  if (action.type === "external" && action.target) {
    return {
      type: "external",
      target: action.target,
      label: action.label || "Open Resource",
    };
  }

  if (action.type === "navigate") {
    if (action.target && action.target !== "none") {
      return {
        type: "navigate",
        target: action.target,
        label: action.label || "Open Step",
      };
    }

    return {
      type: "navigate",
      target: "/roadmap",
      label: action.label || "Open Step Details",
    };
  }

  return DEFAULT_ACTION;
}

export function AttorneyReviewWidget({ estate, assets = [] }: AttorneyReviewWidgetProps) {
  const navigate = useNavigate();
  const { completedTaskIds } = useWorkflow();
  const phaseOrder: readonly string[] = PHASE_ORDER as readonly string[];

  const currentPhase = (estate?.status?.toLowerCase?.() || "immediate_actions") as string;
  const currentPhaseIndex = Math.max(0, phaseOrder.indexOf(currentPhase));

  const roadmap = useMemo(() => {
    if (!estate) return [];

    try {
      const rec = calculateAuthorityRecommendation(assets, estate.deceasedState || "", {
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

      return generateRoadmap(rec.type, estate.deceasedState || "", mods, rec.activeEngines, estate.hasWill);
    } catch {
      return [];
    }
  }, [estate, assets]);

  const reviewNodes = useMemo<ReviewNode[]>(() => {
    const results: ReviewNode[] = [];

    for (const phaseKey of phaseOrder) {
      const phase = roadmap.find((p) => p.phase === phaseKey);
      if (!phase) continue;

      for (const task of phase.tasks) {
        if (!task.isAttorneyReviewNode) continue;
        if (completedTaskIds.includes(task.id)) continue;

        const missingDependencyCount = (task.dependencies || []).filter(
          (d: string) => !completedTaskIds.includes(d)
        ).length;

        const action = resolveTaskAction(task.id);

        results.push({
          taskId: task.id,
          title: task.title,
          reason: task.attorneyReviewReason || "Attorney review required before proceeding.",
          phase: phaseKey,
          phaseLabel: PHASE_LABELS[phaseKey] || phaseKey,
          isUpNext: missingDependencyCount === 0,
          missingDependencyCount,
          actionType: action.type,
          actionTarget: action.target,
          actionLabel: action.label,
        });
      }
    }

    return results
      .sort((a, b) => {
        if (a.isUpNext !== b.isUpNext) return a.isUpNext ? -1 : 1;

        const aIndex = phaseOrder.indexOf(a.phase);
        const bIndex = phaseOrder.indexOf(b.phase);
        const aDistance = Math.abs((aIndex < 0 ? 0 : aIndex) - currentPhaseIndex);
        const bDistance = Math.abs((bIndex < 0 ? 0 : bIndex) - currentPhaseIndex);

        if (aDistance !== bDistance) return aDistance - bDistance;
        if (a.missingDependencyCount !== b.missingDependencyCount) {
          return a.missingDependencyCount - b.missingDependencyCount;
        }

        return a.title.localeCompare(b.title);
      })
      .slice(0, 4);
  }, [roadmap, completedTaskIds, currentPhaseIndex, phaseOrder]);

  if (!reviewNodes.length) return null;

  const urgentCount = reviewNodes.filter((n) => n.isUpNext).length;
  const blockedCount = reviewNodes.length - urgentCount;

  const handleNodeAction = (node: ReviewNode) => {
    if (node.actionType === "external") {
      window.open(node.actionTarget, "_blank", "noopener,noreferrer");
      return;
    }

    navigate(node.actionTarget);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-amber-200 bg-amber-50 overflow-hidden shadow-sm"
    >
      <div className="p-4 border-b border-amber-200/60">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <Gavel className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-600 leading-none mb-0.5">
                Legal Decision Points
              </p>
              <p className="text-sm font-black text-amber-900 leading-none">
                Attorney Review Recommended
              </p>
              <p className="text-[10px] font-semibold text-amber-700 mt-1 leading-none">
                {urgentCount > 0
                  ? `${urgentCount} ready now • ${blockedCount} upcoming`
                  : "No immediate legal blockers. Upcoming checkpoints are still listed below."}
              </p>
            </div>
          </div>

          {urgentCount > 0 && (
            <Badge className="bg-amber-600 text-white text-[9px] font-black px-2 py-0.5 rounded-lg border-none">
              {urgentCount} ready now
            </Badge>
          )}
        </div>

        <p className="text-[10px] text-amber-800 mt-2.5 leading-snug">
          Focus on one item at a time. These are moments where legal advice can prevent delays and reduce risk.
        </p>
      </div>

      <div className="divide-y divide-amber-100">
        {reviewNodes.map((node) => (
          <div key={node.taskId} className="p-3 flex gap-3 items-start group">
            <div className="mt-1 flex-shrink-0">
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  node.isUpNext ? "bg-amber-500 animate-pulse" : "bg-amber-200"
                )}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
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

              <div className="mt-1.5 flex items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] text-amber-600 leading-snug">
                    {node.isUpNext
                      ? "Discuss this with counsel before you submit the next filing."
                      : `Unlock by completing ${node.missingDependencyCount} prerequisite ${node.missingDependencyCount === 1 ? "task" : "tasks"}.`}
                  </p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-amber-500 mt-0.5">
                    {node.phaseLabel}
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 border-amber-300 text-amber-800 hover:bg-amber-100 text-[9px] font-black uppercase tracking-widest rounded-lg px-2.5"
                  onClick={() => handleNodeAction(node)}
                >
                  {node.isUpNext ? "Open Step" : "Preview Step"}
                  {node.actionType === "external" ? (
                    <ExternalLink className="w-3 h-3 ml-1" />
                  ) : (
                    <ArrowRight className="w-3 h-3 ml-1" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-amber-200/60 flex gap-2">
        <Button
          size="sm"
          className="flex-1 h-8 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl"
          onClick={() => navigate("/roadmap")}
        >
          See All Checkpoints
          <ChevronRight className="w-3 h-3 ml-1" />
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="h-8 border-amber-300 text-amber-700 hover:bg-amber-100 text-[10px] font-black uppercase tracking-widest rounded-xl px-3"
          onClick={() => navigate("/marketplace")}
        >
          Find Legal Help
          <ExternalLink className="w-3 h-3 ml-1" />
        </Button>
      </div>
    </motion.div>
  );
}
