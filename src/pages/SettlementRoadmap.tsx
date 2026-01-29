import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { SettlementPhaseChevron, type SettlementPhase } from "@/components/SettlementPhaseChevron";
import { PhaseTaskList } from "@/components/PhaseTaskList";
import { SETTLEMENT_PHASE_TASKS } from "@/config/settlementPhases";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useEffect } from "react";

export default function SettlementRoadmap() {
  const queryClient = useQueryClient();
  const [currentPhase, setCurrentPhase] = useState<SettlementPhase>("immediate_actions");

  const { data: estate } = useQuery({
    queryKey: ['estate'],
    queryFn: api.getMyEstate,
  });

  const [completedPhases, setCompletedPhases] = useState<SettlementPhase[]>([]);
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);

  useEffect(() => {
    if (estate?.roadmapProgress) {
      setCompletedTaskIds(estate.roadmapProgress.completedTaskIds || []);
      setCompletedPhases(estate.roadmapProgress.completedPhases || []);
    }
  }, [estate]);

  useEffect(() => {
    if (estate?.status) {
      const statusLower = estate.status.toLowerCase() as SettlementPhase;
      // Basic validation that it matches one of our phases
      const validPhases: SettlementPhase[] = [
        "immediate_actions", "court_filing", "asset_discovery",
        "creditor_claims", "asset_liquidation", "final_distribution"
      ];
      if (validPhases.includes(statusLower)) {
        setCurrentPhase(statusLower);
      }
    }
  }, [estate?.status]);

  const roadmapMutation = useMutation({
    mutationFn: api.updateRoadmap,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estate'] });
    }
  });

  const handleTaskToggle = (taskId: string, completed: boolean) => {
    const newCompletedIds = completed
      ? [...new Set([...completedTaskIds, taskId])]
      : completedTaskIds.filter(id => id !== taskId);

    setCompletedTaskIds(newCompletedIds);

    // Find the task title for better logging
    let taskTitle = taskId;
    for (const phase of SETTLEMENT_PHASE_TASKS) {
      const task = phase.tasks.find(t => t.id === taskId);
      if (task) {
        taskTitle = task.title;
        break;
      }
    }

    roadmapMutation.mutate({
      completedTaskIds: newCompletedIds,
      completedPhases,
      taskId,
      taskTitle, // Pass title for logging
      action: completed ? 'COMPLETED' : 'UNCOMPLETED'
    });
  };

  const handlePhaseComplete = (phase: SettlementPhase) => {
    // Mark all tasks in this phase as complete
    const phaseTasks = SETTLEMENT_PHASE_TASKS.find(p => p.phase === phase);
    let newCompletedIds = [...completedTaskIds];
    if (phaseTasks) {
      const taskIds = phaseTasks.tasks.map(t => t.id);
      newCompletedIds = [...new Set([...newCompletedIds, ...taskIds])];
      setCompletedTaskIds(newCompletedIds);
    }

    // Mark phase as complete
    const newCompletedPhases = [...new Set([...completedPhases, phase])];
    setCompletedPhases(newCompletedPhases);

    roadmapMutation.mutate({
      completedTaskIds: newCompletedIds,
      completedPhases: newCompletedPhases,
      taskId: phase,
      action: 'PHASE_COMPLETED',
      phase
    });

    // Move to next phase
    const phases: SettlementPhase[] = [
      "immediate_actions",
      "court_filing",
      "asset_discovery",
      "creditor_claims",
      "asset_liquidation",
      "final_distribution"
    ];
    const currentIndex = phases.indexOf(phase);
    if (currentIndex < phases.length - 1) {
      setCurrentPhase(phases[currentIndex + 1]);
    }
  };

  const getCurrentPhaseData = () => {
    return SETTLEMENT_PHASE_TASKS.find(p => p.phase === currentPhase);
  };

  const phaseData = getCurrentPhaseData();
  const totalTasks = SETTLEMENT_PHASE_TASKS.reduce((sum, p) => sum + p.tasks.length, 0);
  const overallProgress = totalTasks > 0
    ? Math.round((completedTaskIds.length / totalTasks) * 100)
    : 0;

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />

      <div className="flex-1 ml-64 flex flex-col">
        <main className="max-w-[1240px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Settlement Roadmap</h1>
                <p className="text-xs text-slate-600 mt-0.5">
                  Complete guide to settling an estate in California
                </p>
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
                <p className="text-xl font-black text-slate-900 mt-0.5">6</p>
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
          </div>

          {/* Phase Chevron */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
            <SettlementPhaseChevron
              currentPhase={currentPhase}
              completedPhases={completedPhases}
            />
          </div>

          {/* Current Phase Details */}
          {phaseData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-6 h-6 text-indigo-600" />
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Current Phase: {phaseData.title}
                    </h2>
                    <p className="text-sm text-slate-600">
                      {phaseData.subtitle} • {phaseData.duration}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => handlePhaseComplete(currentPhase)}
                  disabled={completedPhases.includes(currentPhase)}
                  className="bg-indigo-600 hover:bg-indigo-700"
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

              <PhaseTaskList
                phase={currentPhase}
                completedTaskIds={completedTaskIds}
                onTaskToggle={handleTaskToggle}
              />
            </div>
          )}

          {/* All Phases Overview */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">All Phases</h2>
            <div className="grid grid-cols-1 gap-4">
              {SETTLEMENT_PHASE_TASKS.map((phase) => {
                const phaseTaskIds = phase.tasks.map(t => t.id);
                const completedCount = phaseTaskIds.filter(id => completedTaskIds.includes(id)).length;
                const totalCount = phaseTaskIds.length;
                const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
                const isComplete = completedPhases.includes(phase.phase);
                const isCurrent = currentPhase === phase.phase;

                return (
                  <button
                    key={phase.phase}
                    onClick={() => setCurrentPhase(phase.phase)}
                    className={cn(
                      "group relative bg-white p-5 rounded-[28px] border transition-all text-left overflow-hidden",
                      isCurrent && "border-indigo-500 bg-indigo-50/40 shadow-xl ring-4 ring-indigo-500/5 scale-[1.02] z-10",
                      !isCurrent && "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                    )}
                  >
                    {isCurrent && (
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-600 rounded-r-full" />
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          isComplete && "bg-green-100",
                          isCurrent && !isComplete && "bg-indigo-100",
                          !isCurrent && !isComplete && "bg-slate-100"
                        )}>
                          {isComplete ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
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
                          <h3 className="text-sm font-bold text-slate-900">{phase.title}</h3>
                          <p className="text-xs text-slate-500">{phase.subtitle} • {phase.duration}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {isCurrent && (
                          <Badge className="bg-indigo-600 text-white border-indigo-600 animate-pulse shadow-sm px-3 py-1">
                            Currently Active
                          </Badge>
                        )}
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
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
