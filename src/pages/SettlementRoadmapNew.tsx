import { Sidebar } from "@/components/Sidebar";
import { CollapsiblePhaseChevron } from "@/components/CollapsiblePhaseChevron";
import { ProbateBlockerAlert } from "@/components/ProbateBlockerAlert";
import { RiskBanner, AuthorityDecisionGuide } from "@/components/RiskBanner";
import { useWorkflow } from "@/contexts/WorkflowContext";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, Scale, ShieldCheck } from "lucide-react";
import { SettlementPhaseChevron } from "@/components/SettlementPhaseChevron";
import { type SettlementPhase } from "@/components/SettlementPhaseChevron";
import { calculateAuthorityRecommendation } from "@/lib/authorityEngine";

export default function SettlementRoadmapNew() {
  const queryClient = useQueryClient();
  const { phaseProgress, probateBlockers, currentPhase, completedPhases, assets } = useWorkflow();

  const { data: estate } = useQuery({
    queryKey: ['estate'],
    queryFn: api.getMyEstate
  });

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

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />

      <div className="flex-1 ml-64">
        {/* Header */}
        <header className="h-20 border-b border-slate-200 bg-white px-8 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Settlement Roadmap</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Your Complete 6-Phase Guide
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xl font-black text-slate-900 leading-tight">{overallPercentage}%</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{completedTasks}/{totalTasks} tasks</div>
            </div>
            <div className="w-12 h-12 relative">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 64 64">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  className="text-slate-200"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 28}`}
                  strokeDashoffset={`${2 * Math.PI * 28 * (1 - overallPercentage / 100)}`}
                  className="text-primary transition-all duration-1000"
                />
              </svg>
              <CheckCircle className="w-4 h-4 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-[1000px] w-full mx-auto px-8 py-8 space-y-5">
          {/* Risk Signaling */}
          <RiskBanner />

          {/* Probate Blocker Alert */}
          {probateBlockers.length > 0 && (
            <ProbateBlockerAlert />
          )}

          {/* Authority Scout Explanation */}
          {estate && (
            <AuthorityDecisionGuide
              recommendation={calculateAuthorityRecommendation(
                assets,
                estate.deceasedState || "CA",
                {
                  hasWill: estate.hasWill,
                  isSpouse: estate.isSpouse,
                  isOutOfState: estate.isOutOfState
                }
              )}
            />
          )}

          {/* Horizontal Phase Progress */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
            <SettlementPhaseChevron
              currentPhase={currentPhase as SettlementPhase}
              completedPhases={completedPhases as SettlementPhase[]}
            />
          </div>

          {/* Info Card - Simplified */}
          <div className="p-4 bg-gradient-to-r from-indigo-50/50 to-blue-50/50 border border-indigo-100/50 rounded-2xl">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm border border-indigo-100 shrink-0">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-sm font-black text-indigo-900 mb-1">Fiduciary Process & Record System</h3>
                <p className="text-[11px] text-indigo-800/80 leading-relaxed mb-2">
                  <strong>ExpectedEstate does not provide legal advice.</strong> It provides a structured, state-aware system for executors to document reasonable diligence and fiduciary compliance.
                </p>
                <div className="flex flex-wrap gap-1.5 pb-2 border-b border-indigo-100/30 mb-2">
                  <Badge variant="secondary" className="bg-white/50 text-indigo-700 border-indigo-200 text-[9px] h-5">
                    State-Specific
                  </Badge>
                  <Badge variant="secondary" className="bg-white/50 text-indigo-700 border-indigo-200 text-[9px] h-5">
                    Fiduciary Records
                  </Badge>
                  <Badge variant="secondary" className="bg-white/50 text-indigo-700 border-indigo-200 text-[9px] h-5">
                    Attorney-Optimized
                  </Badge>
                </div>
                <div className="flex items-start gap-2 text-[10px] text-slate-400 font-medium italic">
                  <Scale className="w-3 h-3 mt-0.5 shrink-0" />
                  <p>Designed to complement legal counsel by creating a clear, timestamped record of fiduciary actions.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Collapsible Chevron */}
          <CollapsiblePhaseChevron onTaskToggle={handleTaskToggle} />
        </main>
      </div>
    </div>
  );
}
