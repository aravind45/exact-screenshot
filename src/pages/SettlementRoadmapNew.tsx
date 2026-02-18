import { Sidebar } from "@/components/Sidebar";
import { CollapsiblePhaseChevron } from "@/components/CollapsiblePhaseChevron";
import { ProbateBlockerAlert } from "@/components/ProbateBlockerAlert";
import { useWorkflow } from "@/contexts/WorkflowContext";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CheckCircle, AlertCircle, ArrowRight, FileText } from "lucide-react";
import { SettlementPhaseChevron } from "@/components/SettlementPhaseChevron";
import { type SettlementPhase } from "@/config/settlementPhases";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function SettlementRoadmapNew() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
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

  // Mock logic for Authority Banner (In real app, check if assets require authority and if authority is granted)
  // For now, we assume if we are in phase 1 or 2, we show it if there are assets.
  const showAuthorityBanner = assets.length > 0 && !completedPhases.includes('court_filing');

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
            <h1 className="text-[30px] font-bold text-slate-900 tracking-tight leading-none">Master Plan</h1>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">
              Your Complete 6-Phase Guide
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

          {/* Authority Support Banner */}
          {showAuthorityBanner && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-start gap-5 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Authority Support Required</h3>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed max-w-2xl">
                  <strong className="text-slate-900 font-semibold">{assets.length} assets are</strong> awaiting your Letters Testamentary (DE-150) to finalize ownership.
                  These assets require probate authority (Letters Testamentary (DE-150)) to complete the transfer process.
                </p>
                <div className="mt-4 flex items-center gap-4">
                  <Button
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 h-10 rounded-lg shadow-md shadow-indigo-200 transition-all active:scale-95"
                    onClick={() => navigate('/official-forms')} // Assuming this goes to where they get documents
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

          {/* Probate Blocker Alert */}
          {probateBlockers.length > 0 && (
            <ProbateBlockerAlert />
          )}

          {/* Horizontal Phase Progress */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <SettlementPhaseChevron
              currentPhase={currentPhase as SettlementPhase}
              completedPhases={completedPhases as SettlementPhase[]}
            />
          </div>

          {/* Collapsible Chevron (Task List) */}
          <CollapsiblePhaseChevron onTaskToggle={handleTaskToggle} />
        </main>
      </div>
    </div>
  );
}
