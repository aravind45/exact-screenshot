import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SettlementPhaseChevron } from "@/components/SettlementPhaseChevron";
import { PhaseTaskList as PhaseTaskListComponent } from "@/components/PhaseTaskList";
import { SETTLEMENT_PHASE_TASKS, type SettlementPhase, type PhaseTaskList } from "@/config/settlementPhases";
import { generateRoadmap } from "@/config/roadmapGenerator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Info,
  AlertCircle,
  Zap,
  Scale,
  X,
  FileText
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

  // Estate documents — used for document stage-gate checks
  const { data: uploadedDocs = [] } = useQuery({
    queryKey: ['estateDocuments'],
    queryFn: api.getEstateDocuments,
    enabled: !!estate,
  });

  // Derive a Set of uploaded document type keys for fast lookup
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
      isSpouse: false, // Could be derived if we had more info
    });
  }, [estate, assets]);

  const isContested = useMemo(() => {
    return assets.some((a: any) => a.authorityType === "LITIGATION_HOLD" || a.status === "contested");
  }, [assets]);

  const { data: roadmapData, isLoading: isLoadingRoadmap } = useQuery({
    queryKey: ['roadmap', estate?.id],
    queryFn: () => api.getEstateRoadmap(estate!.id),
    enabled: !!estate?.id,
  });

  // State-aware fallback: if API data isn't available yet, apply client-side
  // filtering to prevent CA-specific content from showing for non-CA states.
  const dynamicRoadmap = useMemo<PhaseTaskList[]>(() => {
    if (roadmapData?.phases) return roadmapData.phases;

    // Fallback: use client-side generator with state-aware filtering
    // instead of raw SETTLEMENT_PHASE_TASKS (which contain CA-only tasks)
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
      // Basic validation that it matches one of our phases in the dynamic roadmap
      const validPhases = dynamicRoadmap.map(p => p.phase);
      if (validPhases.includes(statusLower)) {
        setCurrentPhase(statusLower);
      } else if (validPhases.length > 0 && currentPhase === "immediate_actions" && !validPhases.includes("immediate_actions")) {
        // Fallback if immediate_actions isn't in this roadmap
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

      // 1️⃣ Attorney review gate — takes priority
      if (task?.isAttorneyReviewNode) {
        setPendingAttorneyTask({ taskId, taskTitle: task.title });
        return;
      }

      // 2️⃣ Document stage gate — check required docs vs uploaded
      if (task?.requiredDocs && (task.requiredDocs as string[]).length > 0) {
        const required: string[] = task.requiredDocs as string[];
        const missing = required.filter(doc => {
          const key = doc.toLowerCase();
          return !uploadedDocTypes.has(key);
        });
        if (missing.length > 0) {
          setPendingDocTask({
            taskId,
            taskTitle: task.title,
            requiredDocs: required,
            missingDocs: missing,
          });
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

  const handlePhaseComplete = (phase: SettlementPhase) => {
    // Mark all tasks in this phase as complete
    const phaseTasks = dynamicRoadmap.find(p => p.phase === phase);
    if (phaseTasks) {
      // For now, we'll just track phase completion in the estate object via updateRoadmap or similar
      // But the new design suggests task-by-task completion.
      // We can iterate and complete all tasks.
      phaseTasks.tasks.forEach(task => {
        if (!completedTaskIds.includes(task.id)) {
          completeMutation.mutate({ taskId: task.id });
        }
      });
    }

    // Move to next phase
    const phases = dynamicRoadmap.map(p => p.phase);
    const currentIndex = phases.indexOf(phase);
    if (currentIndex < phases.length - 1) {
      setCurrentPhase(phases[currentIndex + 1]);
    }
  };

  const getCurrentPhaseData = () => {
    return dynamicRoadmap.find(p => p.phase === currentPhase);
  };

  const phaseData = getCurrentPhaseData();
  const totalTasks = dynamicRoadmap.reduce((sum, p) => sum + p.tasks.length, 0);
  const overallProgress = totalTasks > 0
    ? Math.round((completedTaskIds.length / totalTasks) * 100)
    : 0;

  if (isLoadingRoadmap) {
    return (
      <DashboardLayout maxWidth="max-w-[1240px]">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="w-12 h-12 rounded-2xl border-4 border-indigo-600 border-t-transparent animate-spin" />
          <p className="text-sm font-bold text-slate-600">Generating your custom Action Plan...</p>
        </div>
      </DashboardLayout>
    );
  }

  const isMissingState = !estate?.deceasedState;

  if (isMissingState) {
    return (
      <DashboardLayout maxWidth="max-w-[1240px]">
        <div className="max-w-2xl mx-auto space-y-8 pt-12 pb-24">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-amber-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
              <Scale className="w-10 h-10 text-amber-600" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Tell us where to start</h1>
            <p className="text-slate-600 font-medium text-lg leading-relaxed">
              Probate laws are different in every state. To generate your accurate, state-gated Action Plan, we first need to know the state where the deceased lived.
            </p>
          </div>

          <div className="bg-white border-2 border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 relative overflow-hidden group hover:border-indigo-200 transition-all">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <ShieldCheck className="w-48 h-48 text-indigo-900" />
            </div>

            <div className="relative z-10 space-y-6">
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900">Missing Information</h3>
                <p className="text-sm text-slate-500 font-medium">Jurisdiction / Deceased's State of Residence</p>
              </div>

              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                <p className="text-xs text-indigo-700 font-semibold leading-relaxed">
                  Once you select a state, we'll unlock your full roadmap, including specific forms, deadlines, and legal requirements tailored to that state.
                </p>
              </div>

              <Button
                onClick={() => navigate("/profile")}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black h-14 rounded-2xl shadow-lg shadow-indigo-200 text-lg group"
              >
                Complete My Profile
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout maxWidth="max-w-[1240px]">

      {/* ── Bridge Banner: connects Dashboard actions to this page ── */}
      <div className="flex items-start gap-3 p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl">
        <span className="text-lg leading-none flex-shrink-0 mt-0.5">🗺️</span>
        <div>
          <p className="text-xs font-black text-indigo-900 mb-0.5">This is your complete Action Plan</p>
          <p className="text-[11px] text-indigo-700 leading-relaxed font-medium">
            Your <strong>Dashboard</strong> shows the single most urgent task to do right now.
            This page shows <strong>all 6 phases and every task</strong> — the same plan, fully expanded.
            Complete tasks here and your dashboard updates automatically.
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Action Plan</h1>
              <Badge variant="outline" className="bg-indigo-600 text-white border-none text-[8px] font-black uppercase tracking-tighter px-1.5 h-4">
                Derived from Ledger
              </Badge>
              <div className="flex gap-1">
                {authorityRec?.activeEngines?.map(engine => (
                  <Badge key={engine} variant="outline" className="bg-indigo-50 border-indigo-200 text-indigo-700 text-[9px] font-bold uppercase py-0 px-2 h-4 shrink-0">
                    {engine.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <p className="text-[11px] text-slate-600 font-medium flex items-center gap-1">
                Source: <span className="text-slate-900 font-bold bg-slate-100 px-1.5 py-0.5 rounded uppercase text-[9px]">{authorityRec?.authoritySource?.replace(/_/g, " ")}</span>
              </p>
              <p className="text-[11px] text-slate-600 font-medium flex items-center gap-1">
                Model: <span className="text-slate-900 font-bold bg-slate-100 px-1.5 py-0.5 rounded uppercase text-[9px]">{authorityRec?.distributionModel?.replace(/_/g, " ")}</span>
              </p>
              <p className="text-[11px] text-slate-600 font-medium flex items-center gap-1">
                Procedure: <span className="text-slate-900 font-bold uppercase text-[10px]">{authorityRec?.legalTerm}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Overall Progress</p>
              <p className="text-xl font-black text-slate-900 leading-tight">{overallProgress}%</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
              <div className="relative w-10 h-10">
                <svg className="transform -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="3"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    stroke="#4f46e5"
                    strokeWidth="3"
                    strokeDasharray={`${overallProgress} ${100 - overallProgress}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Phases</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{dynamicRoadmap.length}</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Tasks</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{totalTasks}</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-emerald-200 bg-emerald-50">
            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Completed</p>
            <p className="text-xl font-black text-emerald-900 mt-0.5">{completedTaskIds.length}</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-amber-200 bg-amber-50">
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">Remaining</p>
            <p className="text-xl font-black text-amber-900 mt-0.5">{totalTasks - completedTaskIds.length}</p>
          </div>
        </div>

        {/* Authority Logic Banner */}
        {authorityRec && (
          <div className={cn(
            "rounded-2xl p-4 text-white shadow-lg border overflow-hidden relative",
            isContested ? "bg-rose-900 border-rose-700" : "bg-indigo-900 border-indigo-700"
          )}>
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              {isContested ? <AlertCircle className="w-24 h-24" /> : <ShieldCheck className="w-24 h-24" />}
            </div>
            <div className="flex items-start gap-4 relative z-10">
              <div className={cn(
                "p-2.5 rounded-xl backdrop-blur-sm",
                isContested ? "bg-rose-500/30" : "bg-indigo-500/30"
              )}>
                {isContested ? <AlertCircle className="w-6 h-6 text-white" /> : <ShieldCheck className="w-6 h-6 text-white" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={cn(
                    "text-[10px] font-black uppercase tracking-[0.2em]",
                    isContested ? "text-rose-300" : "text-indigo-300"
                  )}>
                    {isContested ? "Active Conflict Overlay" : "Deterministic Settlement Engine"}
                  </h3>
                  {isContested && (
                    <Badge className="bg-white text-rose-900 border-none text-[8px] font-black uppercase tracking-tighter px-1.5 h-4 animate-pulse">
                      SPECIAL Path Active
                    </Badge>
                  )}
                </div>
                <p className="text-lg font-bold leading-tight">
                  {isContested ? "Litigation Hold detected on assets. Your Action Plan has been updated to the SPECIAL (Contested) overlay." : authorityRec.reason}
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-white/10 rounded border border-white/20">
                    <span className="text-[9px] font-black uppercase tracking-tight text-white/70">Master Source</span>
                    <span className="text-[9px] font-bold text-white uppercase">{authorityRec.authoritySource?.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-white/10 rounded border border-white/20">
                    <span className="text-[9px] font-black uppercase tracking-tight text-white/70">Orchestrator Mode</span>
                    <span className="text-[9px] font-bold text-white uppercase">{authorityRec.masterMode}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-white/10 rounded border border-white/20">
                    <span className="text-[9px] font-black uppercase tracking-tight text-white/70">Active Engines</span>
                    <div className="flex gap-1">
                      {authorityRec.activeEngines?.map(engine => (
                        <span key={engine} className="text-[9px] font-bold text-white uppercase bg-white/10 px-1 rounded">{engine.replace('_', ' ')}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Current Focus Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">Current Focus</h2>
          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100 text-[9px] font-bold">Acting Executor</Badge>
        </div>

        {/* Sprint 3: Phase-level liability risk alert — shown when any upcoming task is a legal decision point */}
        {phaseData?.tasks.some(t => !completedTaskIds.includes(t.id) && (t as any).isAttorneyReviewNode) && (
          <div className="flex items-start gap-3 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl">
            <div className="w-7 h-7 rounded-lg bg-rose-100 border border-rose-200 flex items-center justify-center shrink-0 mt-0.5">
              <AlertCircle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-black text-rose-900 uppercase tracking-widest leading-none mb-1">Personal Liability Alert</p>
              <p className="text-[11px] text-rose-700 leading-relaxed font-medium">
                This phase contains <strong>high-risk legal decision points</strong>. Completing them incorrectly can expose you to personal fiduciary liability.{' '}
                <button
                  onClick={() => navigate("/marketplace")}
                  className="underline underline-offset-2 font-bold text-rose-800 hover:text-rose-900"
                >
                  Consult an estate attorney →
                </button>
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {phaseData?.tasks.filter(t => !completedTaskIds.includes(t.id)).slice(0, 3).map(task => {
            const isHighRisk = !!(task as any).isAttorneyReviewNode;
            const hasMissingDocs = !!(task as any).requiredDocs?.length;
            return (
              <div
                key={task.id}
                className={cn(
                  "bg-white p-4 rounded-2xl border shadow-sm transition-all group",
                  isHighRisk
                    ? "border-rose-200 hover:border-rose-300 bg-rose-50/30"
                    : "border-slate-200 hover:border-indigo-300"
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant="outline" className="text-[8px] font-black uppercase tracking-tight bg-slate-50 border-slate-200 text-slate-500">Next Required</Badge>
                    {isHighRisk && (
                      <Badge className="text-[8px] font-black uppercase tracking-tight bg-rose-600 text-white border-rose-600 px-1.5">
                        ⚠ Liability Risk
                      </Badge>
                    )}
                    {hasMissingDocs && !isHighRisk && (
                      <Badge className="text-[8px] font-black uppercase tracking-tight bg-blue-600 text-white border-blue-600 px-1.5">
                        <FileText className="w-2.5 h-2.5 mr-0.5" />
                        Docs Required
                      </Badge>
                    )}
                  </div>
                  {isHighRisk ? (
                    <Scale className="w-3.5 h-3.5 text-rose-400 group-hover:text-rose-600 transition-colors" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                  )}
                </div>
                <h4 className="text-sm font-bold text-slate-900 leading-tight">{task.title}</h4>
                <p className="text-[11px] text-slate-500 line-clamp-2 mt-1.5">{task.description}</p>
                {isHighRisk && (
                  <div className="mt-2.5 pt-2.5 border-t border-rose-100 flex items-center gap-1.5">
                    <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
                    <p className="text-[10px] text-rose-600 font-semibold">Attorney review recommended before completing</p>
                  </div>
                )}
              </div>
            );
          })}
          {phaseData?.tasks.filter(t => !completedTaskIds.includes(t.id)).length === 0 && (
            <div className="col-span-full bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-bold text-slate-900">All current actions are completed</p>
              <p className="text-xs text-slate-500 mt-1">You may proceed to the next phase of settlement.</p>
            </div>
          )}
        </div>
      </div>

      {/* Expert Help CTA */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-[32px] p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <ShieldCheck className="w-32 h-32 text-indigo-900" />
        </div>
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-indigo-100 shrink-0">
            <ShieldCheck className="w-7 h-7 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none mb-1">Stuck or overwhelmed?</h3>
            <Button
              onClick={() => navigate("/marketplace")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 h-12 rounded-2xl shadow-lg shadow-indigo-200 shrink-0 relative z-10"
            >
              Find an Advisor
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* Phase Chevron */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        <SettlementPhaseChevron
          currentPhase={currentPhase}
          completedPhases={completedPhases}
          phases={dynamicRoadmap.map(p => ({
            id: p.phase,
            title: p.title,
            subtitle: p.subtitle,
            milestone: p.milestone,
            isEscalationPath: p.isEscalationPath
          }))}
        />
      </div>

      {/* Current Phase Details */}
      {
        phaseData && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight leading-none">
                    Active Phase: {phaseData.title}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {phaseData.subtitle} • {phaseData.milestone}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => handlePhaseComplete(currentPhase)}
                disabled={completedPhases.includes(currentPhase)}
                className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 h-10 px-6 rounded-xl font-bold text-sm"
              >
                {completedPhases.includes(currentPhase) ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Phase Complete
                  </>
                ) : (
                  <>
                    Complete Phase
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>

            <PhaseTaskListComponent
              phase={currentPhase}
              phaseData={phaseData}
              completedTaskIds={completedTaskIds}
              onTaskToggle={handleTaskToggle}
              className="shadow-md"
            />
          </div>
        )
      }

      {/* All Phases Overview */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1 pt-4">
          <div className="w-1.5 h-6 bg-slate-300 rounded-full" />
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">Full Roadmap</h2>
          <span className="text-[10px] text-slate-400 font-bold uppercase">(Phases 1-6)</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900">All Phases</h2>
        <div className="grid grid-cols-1 gap-4">
          {dynamicRoadmap.map((phase) => {
            const phaseTaskIds = phase.tasks.map(t => t.id);
            const completedCount = phaseTaskIds.filter(id => completedTaskIds.includes(id)).length;
            const totalCount = phaseTaskIds.length;
            const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
            const isComplete = completedPhases.includes(phase.phase);
            const isCurrent = currentPhase === phase.phase;

            // Find if this phase is in the future
            const phaseOrder = dynamicRoadmap.map(p => p.phase);
            const currentIndex = phaseOrder.indexOf(currentPhase);
            const thisIndex = phaseOrder.indexOf(phase.phase);
            const isFuture = thisIndex > currentIndex + 1; // Show current + next, collapse beyond that

            return (
              <button
                key={phase.phase}
                onClick={() => setCurrentPhase(phase.phase)}
                disabled={isFuture && !isComplete}
                className={cn(
                  "group relative bg-white p-5 rounded-[28px] border transition-all text-left overflow-hidden",
                  isCurrent && !phase.isEscalationPath && "border-indigo-500 bg-indigo-50/40 shadow-xl ring-4 ring-indigo-500/5 scale-[1.02] z-10",
                  isCurrent && phase.isEscalationPath && "border-amber-500 bg-amber-50/40 shadow-xl ring-4 ring-amber-500/5 scale-[1.02] z-10",
                  !isCurrent && !isFuture && "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50",
                  isFuture && !isComplete && "border-slate-100 opacity-60 grayscale cursor-not-allowed bg-slate-50/30"
                )}
              >
                {isCurrent && (
                  <div className={cn(
                    "absolute left-0 top-0 bottom-0 w-1.5 rounded-r-full",
                    phase.isEscalationPath ? "bg-amber-600" : "bg-indigo-600"
                  )} />
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                      isComplete && "bg-green-100",
                      isCurrent && !isComplete && "bg-indigo-100",
                      !isCurrent && !isFuture && !isComplete && "bg-slate-100",
                      isFuture && !isComplete && "bg-slate-200/50"
                    )}>
                      {isComplete ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : isFuture && !isComplete ? (
                        <Clock className="w-5 h-5 text-slate-400" />
                      ) : (
                        <span className={cn(
                          "text-sm font-bold",
                          isCurrent ? "text-indigo-600" : "text-slate-600"
                        )}>
                          {completedCount}/{totalCount}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">{phase.title}</h3>
                        {isFuture && !isComplete && (
                          <Badge variant="outline" className="h-4 px-1.5 text-[8px] font-black uppercase tracking-widest bg-white border-slate-200 text-slate-400">
                            Locked
                          </Badge>
                        )}
                        {phase.isEscalationPath && (
                          <Badge className="h-4 px-1.5 text-[8px] font-black uppercase tracking-widest bg-amber-600 text-white border-amber-600">
                            Escalation Path
                          </Badge>
                        )}
                      </div>
                      {!isFuture ? (
                        <p className="text-xs text-slate-500">{phase.subtitle} • {phase.milestone}</p>
                      ) : (
                        <p className="text-[10px] text-slate-400 font-medium italic">Unlocks after {phaseOrder[thisIndex - 1].replace('_', ' ')} phase</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isCurrent && (
                      <Badge className="bg-indigo-600 text-white border-indigo-600 animate-pulse shadow-sm px-3 py-1 text-[10px] font-black uppercase">
                        Currently Active
                      </Badge>
                    )}
                    {!isFuture || isComplete ? (
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full transition-all duration-500",
                              isComplete ? "bg-green-600" : "bg-indigo-600"
                            )}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-600 w-10 text-right">
                          {progressPercent}%
                        </span>
                      </div>
                    ) : (
                      <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest pl-8">
                        Awaiting Progress
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      {/* ── Document Stage-Gate Modal ── */}
      <Dialog open={!!pendingDocTask} onOpenChange={(open) => { if (!open) setPendingDocTask(null); }}>
        <DialogContent className="max-w-md rounded-[2rem] p-0 overflow-hidden">
          {/* Top accent bar */}
          <div className="h-1.5 bg-gradient-to-r from-blue-500 to-slate-600 w-full" />
          <div className="p-6 space-y-5">
            <DialogHeader>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <DialogTitle className="text-lg font-black text-slate-900 leading-tight">
                    Documents Required
                  </DialogTitle>
                  <DialogDescription className="text-sm text-slate-600 font-medium mt-1 leading-relaxed">
                    This task requires certain documents to be uploaded before it can be marked complete.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* Task name */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
              <p className="text-[9px] font-black text-blue-700 uppercase tracking-widest mb-1">Task</p>
              <p className="text-sm font-bold text-blue-900">{pendingDocTask?.taskTitle}</p>
            </div>

            {/* Missing docs list */}
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
              Upload the required documents in the <strong className="text-slate-700">Document Vault</strong> to satisfy this gate, or mark complete anyway if you have them on file elsewhere.
            </p>

            {/* Action buttons */}
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

      {/* ── Attorney Review Interstitial Modal ── */}
      <Dialog open={!!pendingAttorneyTask} onOpenChange={(open) => { if (!open) setPendingAttorneyTask(null); }}>
        <DialogContent className="max-w-md rounded-[2rem] p-0 overflow-hidden">
          {/* Top accent bar */}
          <div className="h-1.5 bg-gradient-to-r from-amber-400 to-orange-500 w-full" />
          <div className="p-6 space-y-5">
            <DialogHeader>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                  <Scale className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <DialogTitle className="text-lg font-black text-slate-900 leading-tight">
                    Attorney Review Recommended
                  </DialogTitle>
                  <DialogDescription className="text-sm text-slate-600 font-medium mt-1 leading-relaxed">
                    This task involves a legal decision that carries personal fiduciary risk.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* Task name */}
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
              <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest mb-1">Task</p>
              <p className="text-sm font-bold text-amber-900">{pendingAttorneyTask?.taskTitle}</p>
            </div>

            {/* Warning content */}
            <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
              <p>
                Completing this task incorrectly — without proper legal guidance — could expose you to <strong className="text-slate-900">personal liability as executor</strong>.
              </p>
              <p className="text-slate-500 text-xs">
                Courts hold executors to a fiduciary standard. A verified estate attorney can review this step and provide a written opinion that protects you.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2.5 pt-1">
              <Button
                onClick={() => navigate("/marketplace")}
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
    </DashboardLayout >
  );
}
