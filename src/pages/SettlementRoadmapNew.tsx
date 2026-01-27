import { Sidebar } from "@/components/Sidebar";
import { CollapsiblePhaseChevron } from "@/components/CollapsiblePhaseChevron";
import { ProbateBlockerAlert } from "@/components/ProbateBlockerAlert";
import { useWorkflow } from "@/contexts/WorkflowContext";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle } from "lucide-react";

export default function SettlementRoadmapNew() {
  const queryClient = useQueryClient();
  const { phaseProgress, probateBlockers } = useWorkflow();
  
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

  const handleTaskToggle = (taskId: string, completed: boolean) => {
    const currentCompleted = estate?.roadmapProgress?.completedTaskIds || [];
    const currentPhases = estate?.roadmapProgress?.completedPhases || [];
    
    const newCompletedIds = completed
      ? [...new Set([...currentCompleted, taskId])]
      : currentCompleted.filter((id: string) => id !== taskId);

    roadmapMutation.mutate({
      completedTaskIds: newCompletedIds,
      completedPhases: currentPhases,
      taskId,
      action: completed ? 'COMPLETED' : 'UNCOMPLETED'
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
              <div className="text-2xl font-black text-slate-900">{overallPercentage}%</div>
              <div className="text-xs text-slate-500 font-medium">{completedTasks}/{totalTasks} tasks</div>
            </div>
            <div className="w-16 h-16 relative">
              <svg className="w-full h-full transform -rotate-90">
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
              <CheckCircle className="w-6 h-6 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-[1000px] w-full mx-auto px-8 py-10 space-y-8">
          {/* Probate Blocker Alert */}
          {probateBlockers.length > 0 && (
            <ProbateBlockerAlert />
          )}
          
          {/* Info Card */}
          <div className="p-6 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-indigo-900 mb-1">How This Roadmap Works</h3>
                <p className="text-sm text-indigo-800 mb-3">
                  This roadmap guides you through the entire 12-18 month estate settlement process. 
                  Each phase contains specific tasks with action buttons to help you complete them.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-white/50 text-indigo-700 border-indigo-200">
                    Click phases to expand/collapse
                  </Badge>
                  <Badge variant="secondary" className="bg-white/50 text-indigo-700 border-indigo-200">
                    Check off tasks as you complete them
                  </Badge>
                  <Badge variant="secondary" className="bg-white/50 text-indigo-700 border-indigo-200">
                    Use action buttons for quick access
                  </Badge>
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
