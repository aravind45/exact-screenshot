
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
  Gavel,
  Activity,
  Lock
} from "lucide-react";
import { SettlementHealthEngine } from "@/components/SettlementHealthEngine";
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
import { type SettlementPhase } from "@/config/settlementPhases";
import { SEO } from "@/components/SEO";
import { useTerminology } from "@/hooks/use-terminology";
import { ProbateStatusUpdater } from "@/components/dashboard/ProbateStatusUpdater";
import { isProfileComplete } from "@/lib/authorityEngine";
import { TaxAlerts } from "@/components/dashboard/TaxAlerts";
import { generateCPAExport } from "@/lib/csvExport";

const normalize = (str: string | null) => str?.toLowerCase() || '';

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'EXECUTOR_APPOINTED': return 'Executor Appointed';
    case 'PETITION_FILED': return 'Petition Filed';
    case 'HEARING_SCHEDULED': return 'Hearing Scheduled';
    case 'INVENTORY_FILED': return 'Inventory Filed';
    case 'CREDITOR_PERIOD_ACTIVE': return 'Creditor Period Active';
    case 'DISTRIBUTION_READY': return 'Distribution Ready';
    case 'CLOSED': return 'Estate Closed';
    default: return 'Not Started';
  }
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { roleName, estateName, authorityType } = useTerminology();
  const [viewMode, setViewMode] = useState<'grid' | 'trail'>('grid');
  const { toast } = useToast();

  const { data: assetsData, isLoading, error } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      try {
        return await api.getAssets();
      } catch (err: any) {
        if (err.status === 403) return { isLocked: true, data: [] };
        throw err;
      }
    },
    enabled: !!user,
  });

  const isAssetsLocked = (assetsData as any)?.isLocked;
  // Ensure assets is always an array
  const assets = isAssetsLocked ? [] : (Array.isArray(assetsData) ? assetsData : []);

  const { data: estate } = useQuery({
    queryKey: ['estate'],
    queryFn: api.getMyEstate,
    enabled: !!user,
  });

  // Automatically redirect to onboarding if estate profile is incomplete or track is unset
  useEffect(() => {
    // Advisors and Admins should land on their own dashboards
    if (user?.role === 'ADVISOR') {
      navigate('/advisor/dashboard');
      return;
    }
    if (user?.role === 'ADMIN') {
      navigate('/admin');
      return;
    }

    if (estate && !isProfileComplete(estate)) {
      console.log("Estate profile incomplete, redirecting to onboarding...");
      navigate('/onboarding');
    }
  }, [estate, navigate, user?.role]);

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

  const { data: followUpsData } = useQuery({
    queryKey: ['follow-ups'],
    queryFn: async () => {
      try {
        return await api.getFollowUps();
      } catch (err: any) {
        if (err.status === 403) return { isLocked: true, data: [] };
        throw err;
      }
    },
    enabled: !!user,
  });

  const isFollowUpsLocked = (followUpsData as any)?.isLocked;
  const realFollowUps = isFollowUpsLocked ? [] : (Array.isArray(followUpsData) ? followUpsData : []);

  const { data: timelineData } = useQuery({
    queryKey: ['timeline', 'recent'],
    queryFn: async () => {
      try {
        const data = await api.getTimeline();
        return { data: data.slice(0, 5) };
      } catch (err: any) {
        if (err.status === 403) return { isLocked: true, data: [] };
        throw err;
      }
    },
    enabled: !!user,
  });

  const isTimelineLocked = (timelineData as any)?.isLocked;
  const recentActivity = isTimelineLocked ? [] : (Array.isArray((timelineData as any)?.data) ? (timelineData as any).data : []);

  const { data: liabilitiesQueryData } = useQuery({
    queryKey: ['liabilities'],
    queryFn: async () => {
      try {
        return await api.getLiabilities();
      } catch (err: any) {
        if (err.status === 403) return { isLocked: true, data: [] };
        throw err;
      }
    },
    enabled: !!user,
  });

  const isLiabilitiesLocked = (liabilitiesQueryData as any)?.isLocked;
  const liabilities = isLiabilitiesLocked ? [] : (Array.isArray(liabilitiesQueryData) ? liabilitiesQueryData : []);

  const { data: readiness } = useQuery({
    queryKey: ["accounting-readiness"],
    queryFn: () => api.getAccountingReadiness(),
    enabled: !!user,
  });

  const { data: activitiesQueryData } = useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      try {
        return await api.getActivities();
      } catch (err: any) {
        if (err.status === 403) return { isLocked: true, data: [] };
        throw err;
      }
    },
    enabled: !!user,
  });

  const isActivitiesLocked = (activitiesQueryData as any)?.isLocked;
  const activitiesData = isActivitiesLocked ? [] : (Array.isArray(activitiesQueryData) ? activitiesQueryData : []);

  const { probateBlockers, completedTaskIds, completedPhases, totalTaskCount } = useWorkflow();

  // 1. Authority Score: % of assets needing authority that HAVE authority 
  const needsAuthority = assets.filter((a: any) =>
    a.authorityType === "COURT_REQUIRED" || a.authorityType === "TRUSTEE_DIRECT"
  );
  const hasAuthority = needsAuthority.filter((a: any) => a.authorityIssuedDate).length;
  const authorityScore = needsAuthority.length > 0 ? Math.round((hasAuthority / needsAuthority.length) * 100) : 100;

  // 2. Accounting Score (matches Accounting.tsx logic)
  const verifiedAssetsCount = assets.filter((a: any) => a.value > 0).length;
  const assetsScore = assets.length > 0 ? (verifiedAssetsCount / assets.length) * 40 : 40;
  const liabilitiesScore = liabilities.length > 0 ? (liabilities.filter((l: any) => l.status === 'PAID').length / liabilities.length) * 40 : 40;
  const requirementsScore = (readiness?.checks?.inventoryObtained ? 10 : 0) + (readiness?.checks?.claimsResolved ? 10 : 0);
  const accountingScore = Math.round(assetsScore + liabilitiesScore + requirementsScore);

  // 3. Risk Score: Solvency + Litigation
  const totalDebtsValue = liabilities.reduce((sum, l: any) => sum + (Number(l.amount) || 0), 0);
  const solvencyRatio = totalDebtsValue > 0 ? (totalValue / totalDebtsValue) : 100;
  const riskSubScore = Math.min(Math.max(solvencyRatio * 100, 0), 100);
  const hasLitigation = assets.some((a: any) => a.authorityType === "LITIGATION_HOLD" || a.hasContest);
  const riskScore = Math.round(hasLitigation ? riskSubScore * 0.7 : riskSubScore);

  // 4. Compliance Score: % tasks completed
  const complianceScore = totalTaskCount > 0 ? Math.round(((completedTaskIds?.length || 0) / totalTaskCount) * 100) : 0;


  const healthScores = {
    authority: isAssetsLocked ? 0 : authorityScore,
    accounting: isAssetsLocked ? 0 : accountingScore,
    risk: isLiabilitiesLocked ? 0 : riskScore,
    compliance: isActivitiesLocked ? 0 : Math.min(complianceScore, 100)
  };

  const healthAlerts: { type: 'CRITICAL' | 'WARNING' | 'INFO'; message: string }[] = [];
  if (solvencyRatio < 1.0) healthAlerts.push({ type: 'CRITICAL', message: "Estate is currently Insolvent. Debts exceed assets." });
  if (hasLitigation) healthAlerts.push({ type: 'CRITICAL', message: "Active Litigation Hold detected on one or more assets." });
  if (authorityScore < 50) healthAlerts.push({ type: 'WARNING', message: "Significant authority gaps. Letters not yet issued for major assets." });
  if (accountingScore < 30) healthAlerts.push({ type: 'INFO', message: "Early accounting phase. Inventory verification pending." });

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




  if (error && !isAssetsLocked) {
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 text-primary text-[10px] font-black uppercase tracking-[0.2em] border border-primary/10">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    Estate Active
                  </div>
                  {estate?.probateStatus && estate.probateStatus !== "NOT_STARTED" && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-[0.2em] border border-indigo-100">
                      {getStatusLabel(estate.probateStatus)}
                    </div>
                  )}
                </div>
                {estate?.estateType && estate.estateType !== "UNSET" && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/5 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] border border-slate-200">
                    {estate.estateType.replace(/_/g, " ")} TRACK
                  </div>
                )}
                <ProbateStatusUpdater
                  currentStatus={estate?.probateStatus || "NOT_STARTED"}
                  currentCaseNumber={estate?.courtCaseNumber}
                />
              </div>
              <div className="h-6 w-px bg-slate-200 hidden sm:block" />
              <div className="flex flex-col">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] hidden sm:block">
                  Managing: <span className="text-slate-900 font-black">{estate?.deceasedFirstName} {estate?.deceasedLastName}</span>
                </p>
                {estate?.courtCaseNumber && (
                  <p className="text-[10px] font-medium text-indigo-600 uppercase tracking-[0.05em] hidden sm:block">
                    Case: {estate.courtCaseNumber}
                  </p>
                )}
              </div>
            </motion.div>
          </div>




          {/* Stat Cards - Full Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-premium flex flex-col justify-between hover:border-primary/20 transition-all hover:scale-[1.02] group">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-primary/5 rounded-xl group-hover:bg-primary group-hover:text-white transition-colors">
                  <DollarSign className="w-5 h-5 text-primary group-hover:text-white transition-colors stroke-[2.5]" />
                </div>
                <div className="text-[10px] font-black text-primary uppercase tracking-widest">Global Assets</div>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 leading-none">Gross Estate Value</p>
                {isAssetsLocked ? (
                  <div className="flex items-baseline gap-1">
                    <p className="text-3xl font-black text-slate-300 tracking-tighter leading-none">$---</p>
                    <span className="text-[10px] font-black text-primary uppercase bg-primary/10 px-1.5 py-0.5 rounded">Premium</span>
                  </div>
                ) : (
                  <p className="text-3xl font-black text-slate-900 tracking-tighter leading-none">${(totalValue / 1000).toFixed(0)}K</p>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-premium flex flex-col justify-between hover:border-primary/20 transition-all hover:scale-[1.02] group">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-primary/5 rounded-xl group-hover:bg-primary group-hover:text-white transition-colors">
                  <CheckCircle2 className="w-5 h-5 text-primary group-hover:text-white transition-colors stroke-[2.5]" />
                </div>
                <div className="text-[10px] font-black text-primary uppercase tracking-widest">{completed}/{assets.length} Tasks</div>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 leading-none">Overall Progress</p>
                <div className="flex items-center gap-3">
                  {isActivitiesLocked ? (
                    <div className="flex items-center gap-2">
                      <p className="text-3xl font-black text-slate-300 tracking-tighter leading-none">--%</p>
                      <span className="text-[9px] font-bold text-slate-400 uppercase px-1.5 py-0.5 border border-slate-200 rounded-lg">Trial Required</span>
                    </div>
                  ) : (
                    <>
                      <p className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{progressPercent}%</p>
                      <div className="flex-1 h-2 bg-slate-50 rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div
              className={cn(
                "p-6 rounded-2xl border transition-all hover:scale-[1.02] shadow-premium flex flex-col justify-between cursor-pointer group",
                attentionNeededCount > 0
                  ? "bg-primary/[0.02] border-primary/20"
                  : "bg-white border-slate-100 hover:border-primary/20"
              )}
              onClick={() => navigate('/assets')}
            >
              <div className="flex justify-between items-start mb-6">
                <div className={cn(
                  "p-3 rounded-xl transition-colors",
                  attentionNeededCount > 0 ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white"
                )}>
                  <Bell className="w-5 h-5 transition-colors stroke-[2.5]" />
                </div>
                {taxonomyStats.action_required > 0 && <Badge variant="destructive" className="animate-pulse text-[10px] font-black px-2 py-1 rounded-lg tracking-widest uppercase border-none">Urgent</Badge>}
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 leading-none">
                  Guidance Required
                </p>
                <div className="flex items-center gap-2">
                  {isAssetsLocked ? (
                    <p className="text-sm font-bold text-slate-400">Upgrade to View Actions</p>
                  ) : (
                    <>
                      <p className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{attentionNeededCount}</p>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Required</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-premium flex flex-col justify-between hover:border-primary/20 transition-all hover:scale-[1.02] group">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-primary/5 rounded-xl group-hover:bg-primary group-hover:text-white transition-colors">
                  <Landmark className="w-5 h-5 text-primary group-hover:text-white transition-colors" />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 leading-none">Settlement Track</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-2xl font-black text-slate-900 tracking-tighter leading-none truncate">{authorityType.replace(/_/g, " ")}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-[9px] uppercase font-black text-primary hover:bg-primary/10 border border-primary/20 rounded-xl px-3"
                    disabled={isAssetsLocked}
                    onClick={() => generateCPAExport(assets, liabilities)}
                  >
                    {isAssetsLocked ? 'Premium' : 'CPA Handoff'}
                  </Button>
                </div>
              </div>
            </div>
          </div>



          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Main Content (Left Column - 8/12 = 66%) */}
            <div className="lg:col-span-8 space-y-8">
              <TaxAlerts estate={estate} totalValue={totalValue} />

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

                  {isFollowUpsLocked ? (
                    <div className="p-8 text-center border-2 border-dashed border-slate-100 bg-slate-50/50 rounded-2xl">
                      <Lock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Premium Feature</p>
                      <p className="text-[10px] text-slate-400 mt-1 mb-4">Real-time alerts and follow-ups are available on professional plans.</p>
                      <Button
                        size="sm"
                        className="h-8 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                        onClick={() => navigate('/pricing')}
                      >
                        Start 7-Day Trial
                      </Button>
                    </div>
                  ) : (
                    <>
                      <FollowUpWidget
                        followUps={realFollowUps as any}
                        onFollowUpClick={handleAssetClick}
                      />

                      {realFollowUps.length === 0 && (
                        <div className="p-8 text-center border-2 border-dashed border-emerald-100 bg-emerald-50/30 rounded-2xl">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                          <p className="text-sm font-bold text-emerald-700">All caught up!</p>
                          <p className="text-xs text-emerald-600 mt-1">No pending follow-ups or blockers.</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </section>

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
                  {isTimelineLocked ? (
                    <div className="p-12 text-center flex flex-col items-center justify-center">
                      <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
                        <HistoryIcon className="w-6 h-6 text-indigo-400" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-2">Immutable Audit Trail</p>
                      <p className="text-xs text-slate-500 max-w-[240px] leading-relaxed mb-6 font-medium">
                        Secure, court-ready activity logging is a premium feature. Track every fiduciary action with timestamps.
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest px-6"
                        onClick={() => navigate('/pricing')}
                      >
                        Unlock Audit Trail
                      </Button>
                    </div>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              </section>

            </div>

            {/* Sidebar (Right Column - 4/12 = 33%) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Settlement Health Engine */}
              <SettlementHealthEngine
                scores={healthScores}
                alerts={healthAlerts}
              />

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
