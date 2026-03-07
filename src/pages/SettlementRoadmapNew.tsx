import { Sidebar } from "@/components/Sidebar";
import { CollapsiblePhaseChevron } from "@/components/CollapsiblePhaseChevron";
import { ProbateBlockerAlert } from "@/components/ProbateBlockerAlert";
import { useWorkflow } from "@/contexts/WorkflowContext";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CheckCircle, AlertCircle, ArrowRight, FileText, MapPin, History } from "lucide-react";
import { SettlementPhaseChevron } from "@/components/SettlementPhaseChevron";
import { type SettlementPhase } from "@/config/settlementPhases";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { getLettersTerm } from "@/lib/stateRules";
import { MinimumIntakeGate } from "@/components/MinimumIntakeGate";
import { RoadmapTimelineOverview } from "@/components/roadmap/RoadmapTimelineOverview";

export default function SettlementRoadmapNew() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { phaseProgress, probateBlockers, currentPhase, completedPhases, completedTaskIds, assets, isStateMissing, clientRoadmap } = useWorkflow();

  const { data: estate } = useQuery({
    queryKey: ['estate'],
    queryFn: api.getMyEstate
  });

  const { data: roadmapData, error: roadmapError } = useQuery({
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

  const roadmapRevision = roadmapData?.roadmapRevision;
  const roadmapVersionLabel = roadmapRevision?.versionLabel || roadmapData?.version || "latest";
  const revisionInvalidatedCount = roadmapRevision?.invalidatedCompletedTaskIds?.length || 0;
  const revisionChangedTaskCount =
    (roadmapRevision?.addedTaskIds?.length || 0) +
    (roadmapRevision?.removedTaskIds?.length || 0) +
    (roadmapRevision?.changedTaskIds?.length || 0);

  // Primary: server-side roadmap. Fallback: client-side generated roadmap.
  const dynamicRoadmap = (roadmapData?.phases && roadmapData.phases.length > 0)
    ? roadmapData.phases
    : (clientRoadmap && clientRoadmap.length > 0 ? clientRoadmap : []);

  const isViewer = (estate as any)?.userRole === 'VIEWER';

  const roadmapMutation = useMutation({
    mutationFn: api.updateRoadmap,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estate'] });
    }
  });

  const handleTaskToggle = (taskId: string, completed: boolean, taskTitle: string, phaseName: string) => {
    const currentCompleted = estate?.roadmapProgress?.completedTaskIds || [];
    const currentPhases = estate?.roadmapProgress?.completedPhases || [];

    const newCompletedIds = completed
      ? [...new Set([...currentCompleted, taskId])]
      : currentCompleted.filter((id: string) => id !== taskId);

    roadmapMutation.mutate({
      completedTaskIds: newCompletedIds,
      completedPhases: currentPhases,
      taskId,
      action: completed ? 'COMPLETED' : 'UNCOMPLETED',
      taskTitle,
      phaseName
    });
  };

  // Calculate overall progress
  const totalTasks = Object.values(phaseProgress).reduce((sum, p) => sum + p.total, 0);
  const completedTasks = Object.values(phaseProgress).reduce((sum, p) => sum + p.completed, 0);
  const overallPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Mock logic for Authority Banner (In real app, check if assets require authority and if authority is granted)
  // For now, we assume if we are in phase 1 or 2, we show it if there are assets.
  const showAuthorityBanner = assets.length > 0 && !completedPhases.includes('court_filing');

  if (isMinimumIntakeRequired) {
    return (
      <div className="flex min-h-screen bg-[#F8FAFC]">
        <SEO
          title="Complete Setup — Action Plan"
          description="Finish your estate setup to generate your personalized settlement roadmap."
        />
        <Sidebar />
        <div className="flex-1 ml-64 flex items-center justify-center p-10">
          <MinimumIntakeGate estateId={estate?.id} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <SEO
        title="Probate Roadmap"
        description="A step-by-step guide to settling your estate. Track your progress through the phases of probate and estate administration."
      />
      <Sidebar />

      <div className="flex-1 ml-64">
        {/* Header */}
        <header className="h-24 bg-white px-10 flex items-center justify-between sticky top-0 z-10 border-b border-slate-100 shadow-sm">
          <div>
            <h1 className="text-[30px] font-bold text-slate-900 tracking-tight leading-none">Action Plan</h1>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">
              {`Your Complete 6-Phase Guide - ${roadmapVersionLabel}`}
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-3xl font-black text-slate-900 leading-none">{overallPercentage}%</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{completedTasks}/{totalTasks} tasks</div>
            </div>
            <div className="w-14 h-14 relative">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 64 64">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="5"
                  fill="none"
                  className="text-slate-100"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="5"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 28}`}
                  strokeDashoffset={`${2 * Math.PI * 28 * (1 - overallPercentage / 100)}`}
                  className="text-indigo-600 transition-all duration-1000 shadow-lg shadow-indigo-500/50"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-[1280px] w-full mx-auto px-10 py-10 space-y-8">
          {roadmapRevision && (
            <div className={`rounded-2xl p-5 border shadow-sm ${revisionInvalidatedCount > 0 ? "bg-amber-50 border-amber-200" : "bg-white border-slate-100"}`}>
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${revisionInvalidatedCount > 0 ? "bg-amber-100" : "bg-indigo-50"}`}>
                  <History className={`w-4 h-4 ${revisionInvalidatedCount > 0 ? "text-amber-700" : "text-indigo-600"}`} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Roadmap Version</p>
                  <h3 className="text-base font-black text-slate-900 mt-1">{roadmapRevision.versionLabel} is active</h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Generated {new Date(roadmapRevision.generatedAt).toLocaleString()} · {roadmapRevision.generationReason.split("_").join(" ")}
                  </p>
                  {roadmapRevision.triggerReasons.length > 0 && (
                    <p className="text-xs text-slate-600 mt-1">
                      Trigger(s): {roadmapRevision.triggerReasons.join(", ")}
                    </p>
                  )}
                  {revisionChangedTaskCount > 0 && (
                    <p className="text-xs text-slate-600 mt-1">
                      Changed tasks: {revisionChangedTaskCount} (added {roadmapRevision.addedTaskIds.length}, removed {roadmapRevision.removedTaskIds.length}, updated {roadmapRevision.changedTaskIds.length})
                    </p>
                  )}
                  {revisionInvalidatedCount > 0 && (
                    <p className="text-xs font-bold text-amber-800 mt-2">
                      {revisionInvalidatedCount} completed task(s) need revalidation because material facts changed.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}


          {!isStateMissing && dynamicRoadmap.length > 0 && (
            <RoadmapTimelineOverview
              phases={dynamicRoadmap}
              currentPhase={currentPhase}
              completedTaskIds={completedTaskIds}
            />
          )}
          {/* ── STATE MISSING BANNER ── */}
          {isStateMissing && (
            <div className="bg-amber-50 rounded-2xl p-8 shadow-sm border-2 border-amber-200 flex items-start gap-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-black text-amber-900 tracking-tight">State / Jurisdiction Required</h3>
                <p className="text-sm text-amber-800 mt-2 leading-relaxed max-w-2xl">
                  We cannot generate your personalized roadmap without knowing which state the deceased resided in.
                  Every state has different probate rules, deadlines, forms, and procedures — showing generic steps would be <strong className="font-black">misleading and potentially harmful</strong> to your case.
                </p>
                <p className="text-xs text-amber-700 mt-3 font-semibold">
                  Please update your estate's state in Profile Settings so we can build an accurate, state-specific action plan.
                </p>
                <div className="mt-5 flex items-center gap-4">
                  <Button
                    className="bg-amber-600 hover:bg-amber-700 text-white font-black text-xs px-6 h-10 rounded-lg shadow-md shadow-amber-200 transition-all active:scale-95"
                    onClick={() => navigate('/profile')}
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    SET STATE NOW
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-amber-700 hover:text-amber-900 font-bold text-xs gap-1"
                    onClick={() => navigate('/onboarding')}
                  >
                    Re-run Setup Wizard <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Authority Support Banner */}
          {!isStateMissing && showAuthorityBanner && !isViewer && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-start gap-5 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Authority Support Required</h3>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed max-w-2xl">
                  <strong className="text-slate-900 font-semibold">{probateBlockers.length} assets are</strong> awaiting your {getLettersTerm(estate?.deceasedState)} to finalize ownership.
                  These assets require probate authority to complete the transfer process.
                </p>
                <div className="mt-4 flex items-center gap-4">
                  <Button
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 h-10 rounded-lg shadow-md shadow-indigo-200 transition-all active:scale-95"
                    onClick={() => navigate('/official-forms')}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    FINALIZE DOCUMENTS
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-slate-500 hover:text-indigo-600 font-bold text-xs gap-1 group/btn"
                    onClick={() => navigate('/assets')}
                  >
                    View Asset List <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
                  </Button>
                </div>
              </div>
            </div>
          )}


          {/* Horizontal Phase Progress — hidden when state is missing */}
          {!isStateMissing && (
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <SettlementPhaseChevron
                currentPhase={currentPhase as SettlementPhase}
                completedPhases={completedPhases as SettlementPhase[]}
                phases={dynamicRoadmap.map(p => ({
                  id: p.phase,
                  title: p.title,
                  subtitle: p.subtitle,
                  milestone: p.milestone,
                  isEscalationPath: p.isEscalationPath,
                  color: "bg-indigo-500"
                }))}
              />
            </div>
          )}

          {/* Collapsible Chevron (Task List) — hidden when state is missing */}
          {!isStateMissing && (
            <CollapsiblePhaseChevron
              onTaskToggle={handleTaskToggle}
              isViewer={isViewer}
            />
          )}
        </main>
      </div>
    </div>
  );
}

