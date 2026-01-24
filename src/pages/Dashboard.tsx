
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
  Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProbateHub } from "@/components/ProbateHub";
import { AgentInsights } from "@/components/AgentInsights";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { WelcomeModal } from "@/components/WelcomeModal";
import type { AssetCategory } from "@/components/CategoryBadge";
import type { AssetStatus } from "@/components/StatusBadge";
import type { Priority } from "@/components/PriorityBadge";

const normalize = (str: string | null) => str?.toLowerCase() || '';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const { data: assets = [], isLoading, error } = useQuery({
    queryKey: ['assets'],
    queryFn: api.getAssets,
  });

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

  const derivedFollowUps = assets
    .filter((asset: any) => {
      const p = normalize(asset.priority);
      return p === 'high' || p === 'urgent';
    })
    .map((asset: any) => ({
      assetId: asset.id,
      institution: asset.institution,
      assetType: normalize(asset.assetType),
      daysSinceContact: 0,
      priority: normalize(asset.priority) as Priority,
      action: 'Review required'
    }))
    .slice(0, 5);

  if (error) {
    return <div className="p-8 text-red-500">Error loading dashboard: {(error as Error).message}.</div>
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary text-primary-foreground shadow-sm">
                <Landmark className="w-5 h-5" />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900">ExpectedEstate</span>
            </Link>
            <div className="flex items-center gap-2 md:gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="hidden md:flex gap-2 text-slate-600 hover:text-slate-900"
                onClick={() => navigate('/profile')}
              >
                <User className="w-4 h-4" />
                Profile
              </Button>
              <Button size="sm" className="gap-2 shadow-sm" onClick={() => navigate('/add-asset')}>
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Asset</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="gap-2 text-slate-500"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        {/* Hero Section with Stats Bar */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Estate Active
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2 tracking-tight">
              Welcome back, {firstName}
            </h1>
            <div className="flex flex-wrap gap-2 mt-2">
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 border-slate-200" onClick={() => navigate('/add-asset')}>
                <Plus className="w-3 h-3" /> Add Asset
              </Button>
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 border-slate-200" onClick={() => navigate('/upload')}>
                <Landmark className="w-3 h-3" /> Upload Statement
              </Button>
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 border-slate-200 bg-primary/5 text-primary border-primary/20" onClick={() => navigate('/discovery')}>
                <Search className="w-3 h-3" /> Detective Scan
              </Button>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
            <StatCard
              title="Value"
              value={isLoading ? "-" : `$${(totalValue / 1000).toFixed(0)}K`}
              icon={DollarSign}
              variant="success"
              className="lg:min-w-[120px]"
            />
            <StatCard
              title="Active"
              value={isLoading ? "-" : inProgress}
              icon={Clock}
              variant="warning"
              className="lg:min-w-[120px]"
            />
            <StatCard
              title="Completed"
              value={isLoading ? "-" : completed}
              icon={CheckCircle2}
              variant="default"
              className="lg:min-w-[120px] hidden sm:flex"
            />
            <StatCard
              title="Assets"
              value={isLoading ? "-" : assets.length}
              icon={Landmark}
              variant="primary"
              className="lg:min-w-[120px] hidden sm:flex"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Content (Left) */}
          <div className="lg:col-span-8 space-y-8">
            {derivedFollowUps.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <Bell className="w-5 h-5 text-amber-500" />
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">Pending Actions</h2>
                </div>
                <FollowUpWidget
                  followUps={derivedFollowUps}
                  onFollowUpClick={handleAssetClick}
                />
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
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search..."
                      className="pl-9 h-10 w-[180px] md:w-[240px] bg-white border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <Button variant="outline" size="sm" className="h-10 px-3 border-slate-200 text-slate-600">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {isLoading && (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-20 w-full bg-slate-100 animate-pulse rounded-xl" />
                    ))}
                  </div>
                )}

                {!isLoading && assets.length === 0 && (
                  <div className="py-16 border-2 border-dashed border-slate-200 rounded-2xl text-center bg-white/50">
                    <p className="font-semibold text-slate-700 mb-1">No data identified</p>
                    <p className="text-xs text-slate-500 mb-6 px-10">Add accounts manually or upload a bank statement to let the Detective Agent find them.</p>
                    <Button size="sm" onClick={() => navigate('/add-asset')}>Add Your First Asset</Button>
                  </div>
                )}

                {assets.map((asset: any, index: number) => (
                  <motion.div
                    key={asset.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
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
                      onClick={() => handleAssetClick(asset.id)}
                      className="bg-white border-slate-200 hover:border-primary/30 transition-all rounded-xl shadow-sm"
                    />
                  </motion.div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar (Right) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-2xl p-6 bg-slate-900 text-white shadow-xl">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Command Actions</h3>
              <div className="grid grid-cols-1 gap-2">
                <Button className="w-full justify-start h-11 bg-white/10 hover:bg-white/20 border-none text-white font-semibold" onClick={() => navigate('/add-asset')}>
                  <Plus className="w-4 h-4 mr-3" />
                  Add New Asset
                </Button>
                <Button className="w-full justify-start h-11 bg-white/10 hover:bg-white/20 border-none text-white font-semibold" onClick={() => navigate('/upload')}>
                  <Landmark className="w-4 h-4 mr-3" />
                  Upload Statement
                </Button>
                <Button className="w-full justify-start h-11 bg-primary text-primary-foreground font-bold" onClick={() => navigate('/discovery')}>
                  <Search className="w-4 h-4 mr-3" />
                  Detective Scan
                </Button>
              </div>
            </div>

            <ProbateHub />

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
      <WelcomeModal />
    </div>
  );
}
