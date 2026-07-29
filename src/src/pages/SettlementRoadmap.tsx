import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SETTLEMENT_PHASE_TASKS, type SettlementPhase, type PhaseTaskList, type PhaseTask } from "@/config/settlementPhases";
import { generateRoadmap } from "@/config/roadmapGenerator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Scale,
  X,
  FileText,
  Check,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { calculateAuthorityRecommendation } from "@/lib/authorityEngine";
import { MinimumIntakeGate } from "@/components/MinimumIntakeGate";
import { StateCoverageNotice } from "@/components/StateCoverageNotice";

// ─────────────────────────────────────────────────────────────────────────────
// Visual contract (Figma "Probate Settlement Roadmap Design"):
//   1. "Your roadmap" — horizontal phase cards connected by a line
//   2. Phase header — "Phase N — Title · x of y complete" and nothing else
//   3. Full-width task cards — checkbox, title, one-line why, pill, time
//   4. Attorney guidance — a slim amber strip inline between cards
// No engine jargon, no stat walls, no all-caps micro-labels.
// ─────────────────────────────────────────────────────────────────────────────

// The roadmap's raw phases can be granular; group them into ~6 broad journey
// stages so the stepper always reads as a calm, finite journey.
const JOURNEY_GROUPS: { title: string; match: RegExp }[] = [
  { title: "Secure & Notify", match: /immediate|secure|notify|first/i },
  { title: "Court Filing", match: /petition|filing|court|eligibility|compliance/i },
  { title: "Authority", match: /authority|letters|fiduciary/i },
  { title: "Asset Inventory", match: /asset|inventory|discovery|liquidation/i },
  { title: "Creditor Claims", match: /creditor|claims|debt|tax|accounting/i },
  { title: "Final Distribution", match: /distribution|final|closing|discharge/i },
];

function groupIndexFor(phase: PhaseTaskList, fallback: number): number {
  const haystack = `${phase.phase} ${phase.title} ${phase.subtitle || ""}`;
  const idx = JOURNEY_GROUPS.findIndex(g => g.match.test(haystack));
  return idx === -1 ? Math.min(fallback, JOURNEY_GROUPS.length - 1) : idx;
}

export default function SettlementRoadmap() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentPhase, setCurrentPhase] = useState<SettlementPhase>("immediate_actions");

  const { data: estate } = useQuery({
    queryKey: ['estate'],
    queryFn: api.getMyEstate,
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: api.getAssets,
  });

  const { data: uploadedDocs = [] } = useQuery({
    queryKey: ['estateDocuments'],
    queryFn: api.getEstateDocuments,
    enabled: !!estate,
  });

  const uploadedDocTypes = useMemo<Set<string>>(() => {
    const types = new Set<string>();
    for (const doc of uploadedDocs as any[]) {
      if (doc.documentType) types.add(doc.documentType.toLowerCase());
      if (doc.name) types.add(doc.name.toLowerCase());
      if (doc.type) types.add(doc.type.toLowerCase());
    }
    return types;
  }, [uploadedDocs]);

  const authorityRec = useMemo(() => {
    if (!estate) return null;
    return calculateAuthorityRecommendation(assets, estate.deceasedState || "", {
      hasWill: estate.hasWill,
      isSpouse: false,
    });
  }, [estate, assets]);

  const isContested = useMemo(() => {
    return assets.some((a: any) => a.authorityType === "LITIGATION_HOLD" || a.status === "contested");
  }, [assets]);

  const { data: roadmapData, isLoading: isLoadingRoadmap, error: roadmapError } = useQuery({
    queryKey: ['roadmap', estate?.id],
    queryFn: () => api.getEstateRoadmap(estate!.id),
    enabled: !!estate?.id,
    retry: (failureCount, error: any) => {
      if (error?.status === 409) return false;
      return failureCount < 3;
    },
  });

  const isMinimumIntakeRequired = (roadmapError as any)?.status === 409 &&
    (roadmapError as any)?.data?.code === 'MINIMUM_INTAKE_REQUIRED';

  // State-aware fallback so jurisdiction-specific content never leaks.
  const dynamicRoadmap = useMemo<PhaseTaskList[]>(() => {
    if (roadmapData?.phases) return roadmapData.phases;

    if (estate?.deceasedState && authorityRec) {
      try {
        return generateRoadmap(
          authorityRec.authoritySource as any,
          estate.deceasedState,
          authorityRec.modifiers || [],
          authorityRec.activeEngines || [],
          estate.hasWill
        );
      } catch {
        // Fall through to raw fallback
      }
    }
    return SETTLEMENT_PHASE_TASKS;
  }, [roadmapData, estate, authorityRec]);

  const [completedPhases, setCompletedPhases] = useState<SettlementPhase[]>([]);
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [pendingAttorneyTask, setPendingAttorneyTask] = useState<{
    taskId: string;
    taskTitle: string;
  } | null>(null);

  const [pendingDocTask, setPendingDocTask] = useState<{
    taskId: string;
    taskTitle: string;
    requiredDocs: string[];
    missingDocs: string[];
  } | null>(null);

  useEffect(() => {
    if (estate?.roadmapProgress) {
      setCompletedTaskIds(estate.roadmapProgress.completedTaskIds || []);
      setCompletedPhases(estate.roadmapProgress.completedPhases || []);
    }
  }, [estate]);

  useEffect(() => {
    if (estate?.status) {
      const statusLower = estate.status.toLowerCase() as SettlementPhase;
      const validPhases = dynamicRoadmap.map(p => p.phase);
      if (validPhases.includes(statusLower)) {
        setCurrentPhase(statusLower);
      } else if (validPhases.length > 0 && currentPhase === "immediate_actions" && !validPhases.includes("immediate_actions")) {
        setCurrentPhase(validPhases[0]);
      }
    }
  }, [estate?.status, dynamicRoadmap]);

  const completeMutation = useMutation({
    mutationFn: ({ taskId, notes }: { taskId: string; notes?: string }) =>
      api.completeTask(estate!.id, taskId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estate'] });
      queryClient.invalidateQueries({ queryKey: ['roadmap', estate?.id] });
    }
  });

  const uncompleteMutation = useMutation({
    mutationFn: (taskId: string) => api.uncompleteTask(estate!.id, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estate'] });
      queryClient.invalidateQueries({ queryKey: ['roadmap', estate?.id] });
    }
  });

  const handleTaskToggle = (taskId: string, completed: boolean) => {
    if (completed) {
      const allTasks = dynamicRoadmap.flatMap(p => p.tasks);
      const task = allTasks.find(t => t.id === taskId);

      // Attorney review gate — takes priority
      if (task?.isAttorneyReviewNode) {
        setPendingAttorneyTask({ taskId, taskTitle: task.title });
        return;
      }

      // Document stage gate
      if (task?.requiredDocs && (task.requiredDocs as string[]).length > 0) {
        const required: string[] = task.requiredDocs as string[];
        const missing = required.filter(doc => !uploadedDocTypes.has(doc.toLowerCase()));
        if (missing.length > 0) {
          setPendingDocTask({ taskId, taskTitle: task.title, requiredDocs: required, missingDocs: missing });
          return;
        }
      }

      completeMutation.mutate({ taskId });
    } else {
      uncompleteMutation.mutate(taskId);
    }
  };

  const handleAttorneyAcknowledge = () => {
    if (pendingAttorneyTask) {
      completeMutation.mutate({ taskId: pendingAttorneyTask.taskId });
      setPendingAttorneyTask(null);
    }
  };

  const handleDocAcknowledge = () => {
    if (pendingDocTask) {
      completeMutation.mutate({ taskId: pendingDocTask.taskId });
      setPendingDocTask(null);
    }
  };

  // ── Journey grouping: raw phases → the ~6 calm stages ─────────────────────
  const journey = useMemo(() => {
    const groups = JOURNEY_GROUPS.map((g) => ({
      title: g.title,
      phases: [] as PhaseTaskList[],
      total: 0,
      done: 0,
    }));

    dynamicRoadmap.forEach((phase, i) => {
      const gi = groupIndexFor(phase, i);
      groups[gi].phases.push(phase);
      groups[gi].total += phase.tasks.length;
      groups[gi].done += phase.tasks.filter(t => completedTaskIds.includes(t.id)).length;
    });

    return groups.filter(g => g.phases.length > 0);
  }, [dynamicRoadmap, completedTaskIds]);

  const currentGroupIndex = useMemo(() => {
    if (!phaseInJourney(journey, currentPhase)) return 0;
    return journey.findIndex(g => g.phases.some(p => p.phase === currentPhase));
  }, [journey, currentPhase]);

  function phaseInJourney(groups: typeof journey, phase: SettlementPhase) {
    return groups.some(g => g.phases.some(p => p.phase === phase));
  }

  const phaseData = dynamicRoadmap.find(p => p.phase === currentPhase);
  const totalTasks = dynamicRoadmap.reduce((sum, p) => sum + p.tasks.length, 0);
  const openTaskCount = totalTasks - completedTaskIds.length;

  // ── Gates ─────────────────────────────────────────────────────────────────
  if (isLoadingRoadmap) {
    return (
      <DashboardLayout maxWidth="max-w-[1000px]">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="w-12 h-12 rounded-2xl border-4 border-indigo-600 border-t-transparent animate-spin" />
          <p className="text-sm font-bold text-slate-600">Preparing your action plan…</p>
        </div>
      </DashboardLayout>
    );
  }

  if (isMinimumIntakeRequired) {
    return (
      <DashboardLayout maxWidth="max-w-[1000px]">
        <div className="flex items-center justify-center min-h-[60vh]">
          <MinimumIntakeGate estateId={estate?.id} />
        </div>
      </DashboardLayout>
    );
  }

  if (!estate?.deceasedState) {
    return (
      <DashboardLayout maxWidth="max-w-[1000px]">
        <div className="max-w-2xl mx-auto space-y-8 pt-12 pb-24">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-amber-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
              <Scale className="w-10 h-10 text-amber-600" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Tell us where to start</h1>
            <p className="text-slate-600 font-medium text-lg leading-relaxed">
              Probate laws are different in every state. To generate your accurate, state-specific action plan, we first need to know where the deceased lived.
            </p>
          </div>
          <Button
            onClick={() => navigate("/profile")}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black h-14 rounded-2xl shadow-lg shadow-indigo-200 text-lg"
          >
            Complete My Profile
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const phaseDoneCount = phaseData
    ? phaseData.tasks.filter(t => completedTaskIds.includes(t.id)).length
    : 0;
  const phaseNumber = dynamicRoadmap.findIndex(p => p.phase === currentPhase) + 1;

  return (
    <DashboardLayout maxWidth="max-w-[1000px]">
      <div className="space-y-10 pb-16">

        {/* ── 1. Your roadmap — horizontal journey cards ─────────────────────── */}
        <div className="space-y-5 pt-2">
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Your roadmap</h1>

          <StateCoverageNotice state={estate.deceasedState} />

          <div className="relative">
            {/* connector line */}
            <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-slate-200 -translate-y-1/2 hidden md:block" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 relative">
              {journey.map((group, i) => {
                const isComplete = group.total > 0 && group.done === group.total;
                const isCurrent = i === currentGroupIndex;
                const representative = group.phases.find(p => p.phase === currentPhase) || group.phases[0];

                return (
                  <button
                    key={group.title}
                    onClick={() => setCurrentPhase(representative.phase)}
                    className={cn(
                      "relative flex flex-col items-center gap-2.5 p-4 rounded-2xl bg-white border-2 transition-all text-center",
                      isCurrent
                        ? "border-indigo-500 shadow-lg shadow-indigo-100"
                        : isComplete
                          ? "border-emerald-200 hover:border-emerald-300"
                          : "border-slate-100 hover:border-slate-200"
                    )}
                  >
                    <div className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
                      isComplete ? "bg-emerald-100" : isCurrent ? "bg-indigo-100" : "bg-slate-100"
                    )}>
                      {isComplete ? (
                        <Check className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <span className={cn("text-sm font-black", isCurrent ? "text-indigo-600" : "text-slate-400")}>
                          {i + 1}
                        </span>
                      )}
                    </div>
                    <span className={cn(
                      "text-[13px] font-bold leading-tight",
                      isCurrent ? "text-indigo-700" : isComplete ? "text-emerald-700" : "text-slate-500"
                    )}>
                      {group.title}
                    </span>
                    {isCurrent && (
                      <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-wide px-2.5 py-0.5 rounded-full shadow">
                        In progress
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {isContested && (
            <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-sm text-rose-800 font-medium leading-relaxed">
                A dispute was detected on estate assets. Your plan has been adjusted — consider consulting an attorney before proceeding.
              </p>
            </div>
          )}
        </div>

        {/* ── 2. Phase header ─────────────────────────────────────────────────── */}
        {phaseData && (
          <div className="flex items-baseline gap-3 flex-wrap">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Phase {phaseNumber} — {phaseData.title}
            </h2>
            <span className="text-sm font-bold text-slate-400">
              {phaseDoneCount} of {phaseData.tasks.length} complete
            </span>
          </div>
        )}

        {/* ── 3. Task cards ───────────────────────────────────────────────────── */}
        {phaseData && (
          <div className="space-y-4">
            {phaseData.tasks.map(task => {
              const completed = completedTaskIds.includes(task.id);
              return (
                <div key={task.id} className="space-y-4">
                  {(task as any).isAttorneyReviewNode && !completed && (
                    <AttorneyStrip
                      onConnect={() => navigate(`/marketplace?task=${encodeURIComponent(task.title)}`)}
                    />
                  )}
                  <TaskCard
                    task={task}
                    completed={completed}
                    onToggle={(done) => handleTaskToggle(task.id, done)}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* ── 4. Quiet footer ─────────────────────────────────────────────────── */}
        <div className="pt-4 space-y-6">
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="font-bold text-slate-900">Stuck or overwhelmed?</p>
                <p className="text-sm text-slate-500 font-medium">A verified estate professional can take any of these steps off your plate.</p>
              </div>
            </div>
            <Button
              onClick={() => navigate("/marketplace")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 h-11 rounded-2xl shadow-lg shadow-indigo-200 shrink-0"
            >
              Find an Advisor
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <p className="text-center text-xs text-slate-400 leading-relaxed max-w-xl mx-auto">
            {openTaskCount > 0
              ? `${openTaskCount} ${openTaskCount === 1 ? "step" : "steps"} remaining in your plan. `
              : "Every step in your plan is complete. "}
            ExpectedEstate provides self-help software and organizational tools. We are not a law firm and do not provide legal advice.
          </p>
        </div>
      </div>

      {/* ── Document gate modal ──────────────────────────────────────────────── */}
      <Dialog open={!!pendingDocTask} onOpenChange={(open) => { if (!open) setPendingDocTask(null); }}>
        <DialogContent className="max-w-md rounded-[2rem] p-0 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-blue-500 to-slate-600 w-full" />
          <div className="p-6 space-y-5">
            <DialogHeader>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <DialogTitle className="text-lg font-black text-slate-900 leading-tight">Documents Required</DialogTitle>
                  <DialogDescription className="text-sm text-slate-600 font-medium mt-1 leading-relaxed">
                    This task needs certain documents uploaded before it can be marked complete.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
              <p className="text-[9px] font-black text-blue-700 uppercase tracking-widest mb-1">Task</p>
              <p className="text-sm font-bold text-blue-900">{pendingDocTask?.taskTitle}</p>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Missing documents ({pendingDocTask?.missingDocs.length})
              </p>
              <div className="space-y-1.5">
                {pendingDocTask?.missingDocs.map((doc) => (
                  <div key={doc} className="flex items-center gap-2.5 p-2.5 bg-rose-50 border border-rose-100 rounded-xl">
                    <div className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                      <X className="w-3 h-3 text-rose-600" />
                    </div>
                    <span className="text-sm font-semibold text-rose-900 capitalize">{doc}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Upload them in the <strong className="text-slate-700">Document Vault</strong>, or mark complete anyway if you have them on file elsewhere.
            </p>

            <div className="flex flex-col gap-2.5 pt-1">
              <Button
                onClick={() => { setPendingDocTask(null); navigate("/documents"); }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 rounded-xl shadow-lg shadow-blue-200"
              >
                <FileText className="w-4 h-4 mr-2" />
                Go to Document Vault
              </Button>
              <Button
                variant="ghost"
                onClick={handleDocAcknowledge}
                className="w-full text-slate-500 hover:text-slate-700 font-semibold text-sm h-10 rounded-xl hover:bg-slate-50"
              >
                I have them elsewhere — mark complete anyway
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Attorney review modal (still gates checkbox completion) ──────────── */}
      <Dialog open={!!pendingAttorneyTask} onOpenChange={(open) => { if (!open) setPendingAttorneyTask(null); }}>
        <DialogContent className="max-w-md rounded-[2rem] p-0 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-amber-400 to-orange-500 w-full" />
          <div className="p-6 space-y-5">
            <DialogHeader>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                  <Scale className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <DialogTitle className="text-lg font-black text-slate-900 leading-tight">Attorney Review Recommended</DialogTitle>
                  <DialogDescription className="text-sm text-slate-600 font-medium mt-1 leading-relaxed">
                    This task involves a legal decision that carries personal fiduciary risk.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
              <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest mb-1">Task</p>
              <p className="text-sm font-bold text-amber-900">{pendingAttorneyTask?.taskTitle}</p>
            </div>

            <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
              <p>
                Completing this task incorrectly — without proper legal guidance — could expose you to <strong className="text-slate-900">personal liability as executor</strong>.
              </p>
              <p className="text-slate-500 text-xs">
                Courts hold executors to a fiduciary standard. A verified estate attorney can review this step and provide a written opinion that protects you.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 pt-1">
              <Button
                onClick={() => navigate(`/marketplace${pendingAttorneyTask?.taskTitle ? `?task=${encodeURIComponent(pendingAttorneyTask.taskTitle)}` : ''}`)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 rounded-xl shadow-lg shadow-indigo-200"
              >
                <Scale className="w-4 h-4 mr-2" />
                Connect with an Attorney
              </Button>
              <Button
                variant="ghost"
                onClick={handleAttorneyAcknowledge}
                className="w-full text-slate-500 hover:text-slate-700 font-semibold text-sm h-10 rounded-xl hover:bg-slate-50"
              >
                I understand the risk — mark complete anyway
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Attorney strip — slim inline guidance, not a wall
// ─────────────────────────────────────────────────────────────────────────────
function AttorneyStrip({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5 bg-amber-50 border border-amber-200 rounded-2xl">
      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
      <p className="text-sm text-amber-900 font-medium flex-1 leading-relaxed">
        <span className="font-bold">Attorney review recommended</span> — this step carries personal liability risk
      </p>
      <button
        onClick={onConnect}
        className="text-sm font-bold text-amber-800 underline underline-offset-2 hover:text-amber-950 shrink-0"
      >
        Connect with an attorney →
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Task card — one full-width checklist item
// ─────────────────────────────────────────────────────────────────────────────
function TaskCard({
  task,
  completed,
  onToggle,
}: {
  task: PhaseTask;
  completed: boolean;
  onToggle: (completed: boolean) => void;
}) {
  const hasDocs = ((task as any).requiredDocs?.length ?? 0) > 0;

  return (
    <div className={cn(
      "bg-white border rounded-2xl transition-all",
      completed ? "border-emerald-200 bg-emerald-50/30" : "border-slate-100 shadow-sm hover:border-slate-200"
    )}>
      <div className="flex items-start gap-4 p-5">
        <button
          onClick={() => onToggle(!completed)}
          aria-label={completed ? "Mark not done" : "Mark done"}
          className={cn(
            "w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all",
            completed
              ? "bg-emerald-500 border-emerald-500"
              : "border-slate-300 hover:border-indigo-500 hover:bg-indigo-50"
          )}
        >
          {completed && <Check className="w-4 h-4 text-white" />}
        </button>

        <div className="flex-1 min-w-0 space-y-1.5">
          <p className={cn(
            "font-bold leading-snug",
            completed ? "text-emerald-900 line-through decoration-emerald-300" : "text-slate-900"
          )}>
            {task.title}
          </p>
          <p className={cn(
            "text-sm font-medium leading-relaxed",
            completed ? "text-emerald-700/70" : "text-slate-500"
          )}>
            {task.description}
          </p>
          <div className="flex items-center gap-2.5 pt-0.5 flex-wrap">
            {task.estimatedTime && (
              <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                <Clock className="w-3 h-3" /> {task.estimatedTime}
              </span>
            )}
            {task.isOptional && (
              <span className="text-xs text-slate-400 font-semibold">Optional</span>
            )}
          </div>
        </div>

        <div className="shrink-0 flex flex-col items-end gap-1.5">
          {task.category && (
            <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
              Court required
            </span>
          )}
          {hasDocs && !task.category && (
            <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full flex items-center gap-1">
              <FileText className="w-3 h-3" /> Documents
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
