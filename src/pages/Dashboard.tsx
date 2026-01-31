
import { StatCard } from "@/components/StatCard";
import { AssetCard } from "@/components/AssetCard";
import { FollowUpWidget } from "@/components/FollowUpWidget";
import { useAuth } from "@/contexts/AuthContext";
import {
  Landmark,
  DollarSign,
  Clock,
  CheckCircle2,
  LogOut,
  User,
  Lightbulb,
  Bell,
  ArrowRight,
  TrendingUp,
  LayoutGrid,
  History as HistoryIcon,
  X,
  Flag,
  ArrowDownLeft,
  ArrowUpRight
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AgentInsights } from "@/components/AgentInsights";
import { FinancialHealthWidget } from "@/components/dashboard/FinancialHealthWidget";
import { DeadlineTracker } from "@/components/dashboard/DeadlineTracker";
import { SafetyNetWidget } from "@/components/dashboard/SafetyNetWidget";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { WelcomeModal } from "@/components/WelcomeModal";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { AssetCategory } from "@/components/CategoryBadge";
import type { AssetStatus } from "@/components/StatusBadge";
import type { Priority } from "@/components/PriorityBadge";
import { ProcessFlow } from "@/components/ProcessFlow";
import { TRACK_STAGES, type SettlementTrack } from "@/config/settlementStages";
import { Sidebar } from "@/components/Sidebar";
import { SettlementPhaseChevron, type SettlementPhase } from "@/components/SettlementPhaseChevron";
import { PhaseTaskList } from "@/components/PhaseTaskList";
import { CollapsiblePhaseChevron } from "@/components/CollapsiblePhaseChevron";
import { ProbateBlockerAlert } from "@/components/ProbateBlockerAlert";
import { useWorkflow } from "@/contexts/WorkflowContext";
import { CurrentMilestone } from "@/components/dashboard/CurrentMilestone";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { SETTLEMENT_PHASE_TASKS } from "@/config/settlementPhases";
import { ProbateChecklistWidget } from "@/components/dashboard/ProbateChecklistWidget";
import { WorkRemainingWidget } from "@/components/dashboard/WorkRemainingWidget";

const normalize = (str: string | null) => str?.toLowerCase() || '';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const { data: assetsData, isLoading, error } = useQuery({
    queryKey: ['assets'],
    queryFn: api.getAssets,
  });

  const { data: estate } = useQuery({
    queryKey: ['estate'],
    queryFn: api.getMyEstate,
  });

  // Ensure assets is always an array
  const assets = Array.isArray(assetsData) ? assetsData : [];

  // Redirect to Onboarding if estate hasn't been set up
  useEffect(() => {
    if (!isLoading && estate && estate.deceasedFirstName === "TBD") {
      navigate("/onboarding");
    }
  }, [estate, isLoading, navigate]);

  const totalValue = assets.reduce((sum: number, asset: any) => sum + (asset.value || 0), 0);

  const inProgress = assets.filter((a: any) => {
    const s = normalize(a.status);
    return s !== 'distributed' && s !== 'closed';
  }).length;

  const completed = assets.filter((a: any) => {
    const s = normalize(a.status);
    return s === 'distributed' || s === 'closed';
  }).length;

  const handleAssetClick = (assetId: string) => {
    navigate(`/asset/${assetId}`);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const firstName = user?.fullName?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  const { data: realFollowUps = [] } = useQuery({
    queryKey: ['follow-ups'],
    queryFn: api.getFollowUps,
  });

  const { data: recentActivity = [] } = useQuery({
    queryKey: ['timeline', 'recent'],
    queryFn: async () => {
      const data = await api.getTimeline();
      return data.slice(0, 5);
    },
  });

  // Calculate Asset Stats
  const statsByStatus = {
    discovered: assets.filter(a => normalize(a.status) === 'discovered').length,
    contacted: assets.filter(a => ['contacted', 'notified'].includes(normalize(a.status))).length,
    inReview: assets.filter(a => ['in_review', 'claim_filed'].includes(normalize(a.status))).length,
    distributed: assets.filter(a => ['distributed', 'closed'].includes(normalize(a.status))).length,
  };

  // Blockers calculation
  const blockers = assets.filter(a =>
    a.ownershipType === 'INDIVIDUAL' &&
    estate?.probateStatus !== 'EXECUTOR_APPOINTED'
  ).length;

  const progressPercent = assets.length > 0
    ? Math.round((statsByStatus.distributed / assets.length) * 100)
    : 0;


  const { probateBlockers, completedTaskIds, completedPhases } = useWorkflow();

  const [localCompletedTaskIds, setLocalCompletedTaskIds] = useState<string[]>([]);
  const [localCompletedPhases, setLocalCompletedPhases] = useState<SettlementPhase[]>([]);

  useEffect(() => {
    setLocalCompletedTaskIds(completedTaskIds);
    setLocalCompletedPhases(completedPhases);
  }, [completedTaskIds, completedPhases]);

  const { data: activitiesData = [] } = useQuery({
    queryKey: ['activities'],
    queryFn: api.getActivities,
  });

  const totalTasksCount = SETTLEMENT_PHASE_TASKS.reduce((sum, p) => sum + p.tasks.length, 0);
  const overallProgress = totalTasksCount > 0
    ? Math.round((completedTaskIds.length / totalTasksCount) * 100)
    : 0;

  const currentPhase: SettlementPhase = (estate?.status?.toLowerCase() as SettlementPhase) || "immediate_actions";

  // Merge communications and roadmap activities for a unified audit trail
  const unifiedTimeline = [
    ...(recentActivity || []).map((a: any) => ({ ...a, uiType: 'communication' })),
    ...(activitiesData || []).map((a: any) => {
      // Prioritize descriptive notes for the primary subject line
      const displaySubject = a.notes || (
        a.action === 'PHASE_COMPLETED'
          ? `Phase Completed: ${(a.taskId || '').replace(/_/g, ' ')}`
          : `Task: ${(a.taskId || 'Update').replace(/_/g, ' ')}`
      );

      return {
        id: a.id,
        occurredAt: a.occurredAt,
        subject: displaySubject,
        // Secondary description
        notes: a.action === 'PHASE_COMPLETED' ? `Advanced to next roadmap stage` : `Fiduciary record updated`,
        direction: 'system',
        type: a.type || 'roadmap',
        uiType: 'activity'
      };
    })
  ].sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()).slice(0, 10);

  const queryClient = useQueryClient();
  const roadmapMutation = useMutation({
    mutationFn: api.updateRoadmap,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estate'] });
    }
  });

  const handleTaskToggle = (taskId: string, completed: boolean) => {
    const newCompletedIds = completed
      ? [...new Set([...localCompletedTaskIds, taskId])]
      : localCompletedTaskIds.filter(id => id !== taskId);

    setLocalCompletedTaskIds(newCompletedIds);

    roadmapMutation.mutate({
      completedTaskIds: newCompletedIds,
      completedPhases: localCompletedPhases,
      taskId,
      action: completed ? 'COMPLETED' : 'UNCOMPLETED'
    });
  };

  if (error) {
    return <div className="p-8 text-red-500">Error loading dashboard: {(error as Error).message}.</div>;
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />

      <div className="flex-1 ml-64 flex flex-col">
        <main className="max-w-[1240px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-10">
          {/* Top Metadata Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider border border-emerald-100">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Estate Active
                </div>
                {estate?.estateType && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider border border-slate-200">
                    {estate.estateType.replace(/_/g, " ")} TRACK
                  </div>
                )}
              </div>
              <div className="h-6 w-px bg-slate-200 hidden sm:block" />
              <p className="text-xs font-medium text-slate-500 uppercase tracking-widest hidden sm:block">
                Managing: <span className="text-slate-900 font-black">{estate?.deceasedFirstName} {estate?.deceasedLastName}</span>
              </p>
            </motion.div>
          </div>

          <ProbateBlockerAlert />


          {/* Stat Cards - Full Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex flex-col justify-between hover:border-emerald-200 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-emerald-50 rounded-2xl">
                  <DollarSign className="w-6 h-6 text-emerald-600" />
                </div>
                <Badge variant="outline" className="text-[10px] font-black text-emerald-600 border-emerald-100 bg-emerald-50/50">+{Math.round(progressPercent / 2)}% Growth</Badge>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Estate Value</p>
                <p className="text-3xl font-black text-slate-900 leading-none">${(totalValue / 1000).toFixed(0)}K</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex flex-col justify-between hover:border-indigo-200 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-indigo-50 rounded-2xl">
                  <CheckCircle2 className="w-6 h-6 text-indigo-600" />
                </div>
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter">{completed}/{assets.length} Done</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Progress</p>
                <div className="flex items-center gap-3">
                  <p className="text-3xl font-black text-slate-900 leading-none">{progressPercent}%</p>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div
              className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex flex-col justify-between cursor-pointer hover:border-amber-400 hover:shadow-lg transition-all group"
              onClick={() => navigate('/follow-ups')}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-amber-50 rounded-2xl group-hover:bg-amber-100 transition-colors">
                  <Bell className="w-6 h-6 text-amber-600" />
                </div>
                {blockers > 0 && <Badge variant="destructive" className="animate-pulse text-[10px] font-black">{blockers} Critical</Badge>}
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Action Items</p>
                <p className="text-3xl font-black text-slate-900 leading-none">{realFollowUps.length + blockers}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-400 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-slate-50 rounded-2xl">
                  <Landmark className="w-6 h-6 text-slate-600" />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Active Tracks</p>
                <p className="text-3xl font-black text-slate-900 leading-none">{assets.length} Assets</p>
              </div>
            </div>
          </div>



          {/* Probate Roadmap Checklists */}
          <section>
            <ProbateChecklistWidget
              estateType={estate?.estateType as any || "FORMAL_PROBATE"}
              deceasedState={estate?.deceasedState}
            />
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Main Content (Left) */}
            <div className="lg:col-span-7 space-y-12">
              <WorkRemainingWidget
                currentPhase={currentPhase}
                completedTaskIds={completedTaskIds}
                assets={assets}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Action Items Column */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <Bell className="w-5 h-5 text-amber-500" />
                      <h2 className="text-lg font-bold text-slate-900 tracking-tight">Action Items</h2>
                    </div>
                    <div className="flex items-center gap-2">
                      {realFollowUps.length > 0 && <Badge variant="secondary" className="bg-amber-100 text-amber-900 text-[10px] border-none">{realFollowUps.length}</Badge>}
                      <Button variant="ghost" size="sm" className="h-7 text-[10px] uppercase font-black text-amber-600" onClick={() => navigate('/follow-ups')}>View Hub</Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {blockers > 0 && (
                      <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex gap-3 items-start animate-in slide-in-from-left duration-300">
                        <div className="p-2 bg-rose-500 text-white rounded-xl">
                          <X className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-rose-900">Legal Blockers Detected</p>
                          <p className="text-[10px] text-rose-700 font-medium">{blockers} assets require Probate Authority DE-150.</p>
                          <Button variant="link" className="p-0 h-auto text-[10px] text-rose-800 font-black uppercase mt-1" onClick={() => navigate('/probate')}>Resolve in Probate Hub</Button>
                        </div>
                      </div>
                    )}
                    <FollowUpWidget followUps={realFollowUps as any} onFollowUpClick={handleAssetClick} />
                    {realFollowUps.length === 0 && blockers === 0 && (
                      <div className="p-12 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-20" />
                        <p className="text-xs font-bold text-slate-400">All clear! No pending actions.</p>
                      </div>
                    )}
                  </div>
                </section>

                {/* Recent Activity Column */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <HistoryIcon className="w-5 h-5 text-indigo-500" />
                      <h2 className="text-lg font-bold text-slate-900 tracking-tight">Recent Activity</h2>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 text-[10px] uppercase font-black text-indigo-600" onClick={() => navigate('/inbox')}>View All</Button>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                    {recentActivity.length === 0 && (
                      <div className="p-10 text-center">
                        <p className="text-xs font-medium text-slate-400">No recent communications recorded.</p>
                      </div>
                    )}
                    <div className="divide-y divide-slate-100">
                      {unifiedTimeline.map((act: any) => (
                        <div key={act.id} className="p-4 hover:bg-slate-50 transition-colors cursor-pointer group flex gap-4" onClick={() => act.uiType === 'communication' ? navigate(`/inbox?selected=${act.id}`) : navigate('/roadmap')}>
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110",
                            act.uiType === 'activity' ? "bg-amber-100 text-amber-600" : (act.direction === 'inbound' ? "bg-emerald-100 text-emerald-600" : "bg-indigo-100 text-indigo-600")
                          )}>
                            {act.uiType === 'activity' ? <Flag className="w-5 h-5" /> : (act.direction === 'inbound' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-[10px] font-black uppercase text-slate-400">
                                {act.uiType === 'activity' ? 'Roadmap Milestone' : (act.institutionName || 'Direct Message')}
                              </span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase">{new Date(act.occurredAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-xs font-bold text-slate-800 line-clamp-1">{act.subject || act.notes}</p>
                            <div className="flex items-center gap-2 mt-2">
                              {act.type && (
                                <Badge variant="outline" className="h-4 text-[8px] font-black border-slate-200 text-slate-500 uppercase px-1.5">
                                  {act.type}
                                </Badge>
                              )}
                              {act.method && (
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">• {act.method}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              </div>

              <AgentInsights />
            </div>

            {/* Sidebar (Right) */}
            <div className="lg:col-span-5 space-y-10">
              <QuickActions />

              <DeadlineTracker estateId={estate?.id || ""} />

              <SafetyNetWidget
                assets={assets}
                onNavigate={(id) => navigate(`/asset/${id}`)}
              />

              <div className="p-6 rounded-[32px] bg-slate-900 text-white border border-slate-800 shadow-2xl">
                <div className="flex items-center gap-2 mb-3 text-indigo-400">
                  <Flag className="w-5 h-5" />
                  <span className="font-black text-[10px] uppercase tracking-wider">Fiduciary Guidelines</span>
                </div>
                <p className="text-sm font-medium text-slate-300 leading-relaxed">
                  Maintain your <strong className="text-white">System of Record</strong> by logging all bank communications. Consistent documentation is key to evidence of reasonable care if disputes arise.
                </p>
                <Button variant="link" className="p-0 h-auto text-indigo-400 text-xs font-bold mt-4 hover:text-indigo-300 uppercase tracking-widest">
                  View Procedural Best Practices <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
      <WelcomeModal />
    </div>
  );
}
