
import { StatCard } from "@/components/StatCard";
import { AssetCard } from "@/components/AssetCard";
import { FollowUpWidget } from "@/components/FollowUpWidget";
import { useAuth } from "@/contexts/AuthContext";
import {
  Landmark,
  DollarSign,
  Clock,
  CheckCircle2,
  Plus,
  Search,
  Filter,
  LogOut,
  User,
  Lightbulb,
  Bell,
  Mail,
  X
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AgentInsights } from "@/components/AgentInsights";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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

const normalize = (str: string | null) => str?.toLowerCase() || '';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const { data: assetsData, isLoading, error } = useQuery({
    queryKey: ['assets'],
    queryFn: api.getAssets,
  });

  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Ensure assets is always an array
  const assets = Array.isArray(assetsData) ? assetsData : [];

  queryFn: api.getMyEstate,
  });


// Redirect to Onboarding if estate hasn't been set up
useEffect(() => {
  if (!isLoading && estate && estate.deceasedFirstName === "TBD") {
    navigate("/onboarding");
  }
}, [estate, isLoading, navigate]);

// Correction:

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

const handleSelectAsset = (id: string, selected: boolean) => {
  if (selected) {
    setSelectedAssetIds(prev => [...prev, id]);
  } else {
    setSelectedAssetIds(prev => prev.filter(i => i !== id));
  }
};

const handleBatchNotify = async () => {
  try {
    toast({
      title: "Generating Letters...",
      description: `Preparing notification documents for ${selectedAssetIds.length} institutions.`,
    });

    const blob = await api.batchGenerateLetters(selectedAssetIds);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Notification_Letters_${new Date().toISOString().split('T')[0]}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Ready to Print",
      description: "Your combined notification letters have been generated.",
    });

    setSelectedAssetIds([]);
    setIsSelectionMode(false);
  } catch (error: any) {
    toast({
      title: "Generation Failed",
      description: error.message,
      variant: "destructive"
    });
  }
};

const toggleSelectionMode = () => {
  setIsSelectionMode(!isSelectionMode);
  if (isSelectionMode) setSelectedAssetIds([]);
};

const firstName = user?.fullName?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

const { data: realFollowUps = [] } = useQuery({
  queryKey: ['follow-ups'],
  queryFn: api.getFollowUps,
});


if (error) {
  return <div className="p-8 text-red-500">Error loading dashboard: {(error as Error).message}.</div>;
}

return (
  <div className="flex min-h-screen bg-[#F8FAFC]">
    <Sidebar />

    <div className="flex-1 ml-64 flex flex-col">
      <main className="max-w-[1100px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-10">
        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Estate Active
              </div>
              {estate?.estateType && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider border border-slate-200">
                  {estate.estateType.replace(/_/g, " ")} TRACK
                </div>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2 tracking-tight">
              Welcome back, {firstName}
            </h1>
            <p className="text-slate-500 text-sm">Managing the estate of <span className="font-bold text-slate-900">{estate?.deceasedName || "..."}</span></p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4 shrink-0">
            <StatCard title="Value" value={isLoading ? "-" : `$${(totalValue / 1000).toFixed(0)}K`} icon={DollarSign} variant="success" />
            <StatCard title="Active" value={isLoading ? "-" : inProgress} icon={Clock} variant="warning" />
            <StatCard title="Completed" value={isLoading ? "-" : completed} icon={CheckCircle2} variant="default" className="hidden sm:flex" />
            <StatCard title="Assets" value={isLoading ? "-" : assets.length} icon={Landmark} variant="primary" className="hidden sm:flex" />
          </div>
        </div>

        {/* Process Roadmap */}
        <section>
          <ProcessFlow
            stages={TRACK_STAGES[(estate?.estateType as SettlementTrack) || "PROBATE"]}
            currentStageId={estate?.probateStatus === "EXECUTOR_APPOINTED" ? "discovery" : "petition"}
            completedStageIds={estate?.probateStatus === "EXECUTOR_APPOINTED" ? ["petition", "authority"] : []}
          />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Content (Left) */}
          <div className="lg:col-span-8 space-y-10">
            {realFollowUps.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <Bell className="w-5 h-5 text-amber-500" />
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">Pending Actions</h2>
                </div>
                <FollowUpWidget followUps={realFollowUps as any} onFollowUpClick={handleAssetClick} />
              </section>
            )}

            <AgentInsights />

            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">Asset Ledger</h2>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mt-1">Verified Financial Records</p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant={isSelectionMode ? "secondary" : "outline"}
                    size="sm"
                    className="h-10 px-3 border-slate-200"
                    onClick={toggleSelectionMode}
                  >
                    {isSelectionMode ? "Cancel" : "Select"}
                  </Button>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input placeholder="Search..." className="pl-9 h-10 w-[180px] md:w-[200px] bg-white border-slate-200 rounded-lg text-sm" />
                  </div>
                  <Button variant="outline" size="sm" className="h-10 px-3 border-slate-200 text-slate-600">
                    <Filter className="w-4 h-4 mr-2" /> Filter
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {!isLoading && assets.length === 0 && (
                  <div className="py-16 border-2 border-dashed border-slate-200 rounded-2xl text-center bg-white/50">
                    <p className="font-semibold text-slate-700 mb-1">No data identified</p>
                    <Button size="sm" variant="link" onClick={() => navigate('/add-asset')}>Add Your First Asset</Button>
                  </div>
                )}

                {assets.map((asset: any, index: number) => (
                  <motion.div key={asset.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.05 }}>
                    <AssetCard
                      asset={{
                        ...asset,
                        type: normalize(asset.assetType),
                        category: normalize(asset.category) as AssetCategory,
                        status: normalize(asset.status) as AssetStatus,
                        priority: normalize(asset.priority) as Priority,
                        lastContactDate: asset.lastContactDate ? String(asset.lastContactDate).split('T')[0] : null,
                        nextFollowUpDate: asset.nextFollowUpDate ? String(asset.nextFollowUpDate).split('T')[0] : null,
                        daysSinceContact: 0
                      }}
                      onClick={() => !isSelectionMode && handleAssetClick(asset.id)}
                      onSelect={(sel) => handleSelectAsset(asset.id, sel)}
                      selected={selectedAssetIds.includes(asset.id)}
                      selectable={isSelectionMode}
                      className={cn(
                        "bg-white border-slate-200 hover:border-primary/30 transition-all rounded-xl shadow-sm",
                        selectedAssetIds.includes(asset.id) && "border-primary"
                      )}
                    />
                  </motion.div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar (Right) */}
          <div className="lg:col-span-4 space-y-8">
            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-100/50">
              <div className="flex items-center gap-2 mb-2 text-amber-700">
                <Lightbulb className="w-4 h-4" />
                <span className="font-bold text-[10px] uppercase tracking-wider">Case Tip</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                Assets owned <strong>Individually</strong> require formal probate steps. Focus on obtaining Letters Testamentary to gain legal control.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
    <WelcomeModal />

    {/* Batch Action Bar */}
    {selectedAssetIds.length > 0 && (
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4"
      >
        <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-2xl flex items-center justify-between border border-slate-800">
          <div className="flex items-center gap-4">
            <div className="bg-primary/20 text-primary p-2 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold">{selectedAssetIds.length} Assets Selected</p>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Batch Operations Active</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleBatchNotify}
              className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl h-11 px-6 gap-2"
            >
              <Mail className="w-4 h-4" />
              Notify All
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedAssetIds([])}
              className="text-slate-400 hover:text-white hover:bg-white/10 rounded-xl"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </motion.div>
    )}
  </div>
);
}
