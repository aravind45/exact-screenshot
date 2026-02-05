
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
  History as HistoryIcon,
  Flag,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldAlert,
  Target,
  FileCheck,
  FileText,
  Search,
  Gavel
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import { getAssetTaxonomyState, getTaxonomyInfo } from "@/lib/taxonomy";
import { AssetTaxonomyBadge } from "@/components/AssetTaxonomyBadge";
import { Sidebar } from "@/components/Sidebar";
import { useWorkflow } from "@/contexts/WorkflowContext";
import { type SettlementPhase } from "@/components/SettlementPhaseChevron";
import { SEO } from "@/components/SEO";
import { useTerminology } from "@/hooks/use-terminology";
import { ProbateStatusUpdater } from "@/components/dashboard/ProbateStatusUpdater";
import { isProfileComplete } from "@/lib/authorityEngine";

const normalize = (str: string | null) => str?.toLowerCase() || '';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { roleName, estateName, authorityType } = useTerminology();
  const [viewMode, setViewMode] = useState<'grid' | 'trail'>('grid');
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

  // Automatically redirect to onboarding if estate profile is incomplete or track is unset
  useEffect(() => {
    if (estate && !isProfileComplete(estate)) {
      console.log("Estate profile incomplete, redirecting to onboarding...");
      navigate('/onboarding');
    }
  }, [estate, navigate]);

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

  // Calculate Asset Stats via Taxonomy
  const taxonomyStats = assets.reduce((acc, a) => {
    const state = getAssetTaxonomyState(a as any, estate as any);
    acc[state] = (acc[state] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const attentionNeededCount = (taxonomyStats.action_required || 0) + (taxonomyStats.waiting || 0) + (taxonomyStats.blocked || 0);

  const progressPercent = assets.length > 0
    ? Math.round(((taxonomyStats.resolved || 0) / assets.length) * 100)
    : 0;


  const { probateBlockers, completedTaskIds, completedPhases } = useWorkflow();


  const { data: activitiesData = [] } = useQuery({
    queryKey: ['activities'],
    queryFn: api.getActivities,
  });

  const currentPhase: SettlementPhase = (estate?.status?.toLowerCase() as SettlementPhase) || "immediate_actions";

  // Merge communications and roadmap activities for a unified audit trail
  const rawTimeline = [
    ...(recentActivity || []).map((a: any) => ({ ...a, uiType: 'communication' })),
    ...(activitiesData || []).map((a: any) => {
      const displaySubject = a.notes || (
        a.action === 'PHASE_COMPLETED'
          ? `Phase Completed: ${(a.taskId || '').replace(/_/g, ' ')}`
          : `Task: ${(a.taskId || 'Update').replace(/_/g, ' ')}`
      );

      return {
        id: a.id,
        occurredAt: a.occurredAt,
        subject: displaySubject,
        notes: a.action === 'PHASE_COMPLETED' ? `Advanced to next roadmap stage` : `Fiduciary record updated`,
        direction: 'system',
        type: a.type || 'roadmap',
        uiType: 'activity'
      };
    })
  ].sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());

  // Compress repeated micro-updates (logic: if subject, notes, type, and day are same, collapse)
  const unifiedTimeline = rawTimeline.reduce((acc: any[], current) => {
    const last = acc[acc.length - 1];
    const isSameDay = last &&
      new Date(last.occurredAt).toLocaleDateString() === new Date(current.occurredAt).toLocaleDateString();

    // Check for high similarity in subjects (e.g., "Updated asset: Robinhood")
    const isRepeat = isSameDay && last.subject === current.subject && last.uiType === current.uiType;

    if (isRepeat) {
      if (!last.count) last.count = 1;
      last.count += 1;
      // Keep the most recent timestamp
      return acc;
    }

    acc.push(current);
    return acc;
  }, []).slice(0, 10);




  if (error) {
    return <div className="p-8 text-red-500">Error loading dashboard: {(error as Error).message}.</div>;
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <SEO
        title="Executor Dashboard"
        description="Manage your estate settlement journey. Track probate progress, assets, and liabilities from a single defensible system of record."
      />
      <Sidebar />

      <div className="flex-1 ml-64 flex flex-col">
        <main className="max-w-[1240px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-6">
          {/* Top Metadata Bar */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
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
                {estate?.estateType && estate.estateType !== "UNSET" && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider border border-slate-200">
                    {estate.estateType.replace(/_/g, " ")} TRACK
                  </div>
                )}
                <ProbateStatusUpdater
                  currentStatus={estate?.probateStatus || "NOT_STARTED"}
                  currentCaseNumber={estate?.courtCaseNumber}
                />
              </div>
              <div className="h-6 w-px bg-slate-200 hidden sm:block" />
              <p className="text-xs font-medium text-slate-500 uppercase tracking-widest hidden sm:block">
                Managing: <span className="text-slate-900 font-black">{estate?.deceasedFirstName} {estate?.deceasedLastName}</span>
              </p>
            </motion.div>

          </div>




          {/* Stat Cards - Full Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-emerald-200 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div className="p-1.5 bg-emerald-50 rounded-lg">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
                <Badge variant="outline" className="text-[8px] font-black text-emerald-600 border-emerald-100 bg-emerald-50/50 px-1 h-4">+{Math.round(progressPercent / 2)}%</Badge>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Estate Value</p>
                <p className="text-xl font-black text-slate-900 leading-none">${(totalValue / 1000).toFixed(0)}K</p>
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-indigo-200 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div className="p-1.5 bg-indigo-50 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                </div>
                <p className="text-[8px] font-black text-indigo-600 uppercase tracking-tighter">{completed}/{assets.length}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Progress</p>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-black text-slate-900 leading-none">{progressPercent}%</p>
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-[60px]">
                    <div className="h-full bg-indigo-600 transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div
              className={cn(
                "p-3 rounded-xl border shadow-sm flex flex-col justify-between cursor-pointer transition-all group",
                attentionNeededCount > 0
                  ? "bg-amber-50/50 border-amber-200 hover:border-amber-400 shadow-amber-100/20"
                  : "bg-white border-slate-200 hover:border-slate-400"
              )}
              onClick={() => navigate('/assets')}
            >
              <div className="flex justify-between items-start mb-2">
                <div className={cn(
                  "p-1.5 rounded-lg group-hover:scale-105 transition-transform",
                  attentionNeededCount > 0 ? "bg-amber-100 text-amber-600" : "bg-slate-50 text-slate-600"
                )}>
                  <Bell className="w-4 h-4" />
                </div>
                {taxonomyStats.action_required > 0 && <Badge variant="destructive" className="animate-pulse text-[8px] font-black px-1 h-4">{taxonomyStats.action_required} Urgent</Badge>}
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">
                  Guidance Required
                </p>
                <div className="flex items-center gap-1.5">
                  <p className="text-xl font-black text-slate-900 leading-none">{attentionNeededCount}</p>
                  {attentionNeededCount > 0 && (
                    <ArrowRight className="w-4 h-4 text-amber-500 group-hover:translate-x-0.5 transition-transform" />
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-400 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div className="p-1.5 bg-slate-50 rounded-lg">
                  <Landmark className="w-4 h-4 text-slate-600" />
                </div>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Authority Type</p>
                <p className="text-xl font-black text-slate-900 leading-none truncate">{authorityType.replace(/_/g, " ")}</p>
              </div>
            </div>
          </div>



          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Main Content (Left Column - 8/12 = 66%) */}
            <div className="lg:col-span-8 space-y-6">

              {/* Support Requested Section - Hidden for now
              <section className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <Lightbulb className="w-5 h-5 text-indigo-500" />
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">Support Requested</h2>
                  {(realFollowUps.length > 0 || taxonomyStats.blocked > 0) && (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-900 text-[10px] border-none">
                      {realFollowUps.length + taxonomyStats.blocked}
                    </Badge>
                  )}
                </div>

                <div className="space-y-3">
                  {taxonomyStats.blocked > 0 && (
                    <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex gap-3 items-start">
                      <div className="p-2 bg-indigo-500 text-white rounded-xl">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-indigo-900">Authority Guidance</p>
                        <p className="text-xs text-indigo-700 font-medium mt-0.5">
                          {taxonomyStats.blocked} assets are awaiting verification of your local court authority.
                        </p>
                        <Button
                          variant="link"
                          className="p-0 h-auto text-xs text-indigo-800 font-black uppercase mt-2"
                          onClick={() => navigate('/probate')}
                        >
                          Review Authority Requirements →
                        </Button>
                      </div>
                    </div>
                  )}

                  <FollowUpWidget followUps={realFollowUps as any} onFollowUpClick={handleAssetClick} />

                  {realFollowUps.length === 0 && taxonomyStats.blocked === 0 && (
                    <div className="p-8 text-center border-2 border-dashed border-emerald-100 bg-emerald-50/30 rounded-2xl">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                      <p className="text-sm font-bold text-emerald-700">All caught up!</p>
                      <p className="text-xs text-emerald-600 mt-1">No pending follow-ups or blockers.</p>
                    </div>
                  )}
                </div>
              </section>
              */}

              {/* Recent Proof of Work */}
              <section className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <HistoryIcon className="w-5 h-5 text-indigo-500" />
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">Recent Proof of Work</h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[10px] uppercase font-black text-indigo-600"
                    onClick={() => navigate('/settlement-trail')}
                  >
                    View Full Trail
                  </Button>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  {recentActivity.length === 0 && (
                    <div className="p-10 text-center">
                      <p className="text-xs font-medium text-slate-400">No recent activity recorded.</p>
                    </div>
                  )}
                  <div className="divide-y divide-slate-100">
                    {unifiedTimeline.slice(0, 5).map((act: any) => (
                      <div
                        key={act.id}
                        className="p-3 hover:bg-slate-50 transition-colors cursor-pointer group flex gap-3"
                        onClick={() => act.uiType === 'communication' ? navigate(`/inbox?selected=${act.id}`) : navigate('/roadmap')}
                      >
                        <div className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110",
                          act.uiType === 'activity' ? "bg-amber-100 text-amber-600" : (act.direction === 'inbound' ? "bg-emerald-100 text-emerald-600" : "bg-indigo-100 text-indigo-600")
                        )}>
                          {act.uiType === 'activity' ? <Flag className="w-4 h-4" /> : (act.direction === 'inbound' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-0.5">
                            <span className="text-[10px] font-black uppercase text-slate-400">
                              {act.uiType === 'activity' ? 'Roadmap' : (act.institutionName || 'Message')}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400">{new Date(act.occurredAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-xs font-bold text-slate-800 line-clamp-1">
                            {act.subject || act.notes} {act.count > 1 && <span className="text-[10px] text-indigo-500 ml-1">({act.count}×)</span>}
                          </p>
                          {act.type && (
                            <Badge variant="outline" className="h-4 text-[8px] font-black border-slate-200 text-slate-500 uppercase px-1.5 mt-1">
                              {act.type}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

            </div>

            {/* Sidebar (Right Column - 4/12 = 33%) */}
            <div className="lg:col-span-4 space-y-6">

              {/* Critical Dates */}
              <DeadlineTracker estateId={estate?.id || ""} />

              {/* Diligence Gaps (if any) */}
              <SafetyNetWidget
                assets={assets}
                onNavigate={(id) => navigate(`/asset/${id}`)}
              />

            </div>
          </div>
        </main>
      </div>
      <WelcomeModal />
    </div>
  );
}
