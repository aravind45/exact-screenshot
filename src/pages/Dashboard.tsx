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
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProbateHub } from "@/components/ProbateHub";
import { AgentInsights } from "@/components/AgentInsights";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AssetCategory } from "@/components/CategoryBadge";
import type { AssetStatus } from "@/components/StatusBadge";
import type { Priority } from "@/components/PriorityBadge";

// Helper to normalize status/priority from DB (often uppercase) to frontend (lowercase)
const normalize = (str: string | null) => str?.toLowerCase() || '';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  // Fetch real assets from Neon DB
  const { data: assets = [], isLoading, error } = useQuery({
    queryKey: ['assets'],
    queryFn: api.getAssets,
  });

  const totalValue = assets.reduce((sum: number, asset: any) => sum + (asset.value || 0), 0);
  // Status check: !distributed AND !closed
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

  // Get first name from user metadata or email
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  // Basic client-side derivation of follow-ups from real assets
  // Valid logic: IF (priority is high/urgent OR daysSinceContact > 14) -> Add to list
  const derivedFollowUps = assets
    .filter((asset: any) => {
      const p = normalize(asset.priority);
      return p === 'high' || p === 'urgent';
    })
    .map((asset: any) => ({
      assetId: asset.id,
      institution: asset.institution,
      assetType: normalize(asset.assetType),
      daysSinceContact: 0, // TODO: Calculate real days from lastContactDate
      priority: normalize(asset.priority) as Priority,
      action: 'Review required'
    }))
    .slice(0, 5); // Limit to 5

  if (error) {
    return <div className="p-8 text-red-500">Error loading dashboard: {(error as Error).message}. Verify backend is likely running (npm run api).</div>
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="section-container">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary text-primary-foreground">
                <Landmark className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg text-foreground">ExpectedEstate</span>
            </Link>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={() => navigate('/profile')}
              >
                <User className="w-4 h-4" />
                Profile
              </Button>
              <Button size="sm" className="gap-2" onClick={() => navigate('/add-asset')}>
                <Plus className="w-4 h-4" />
                Add Asset
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="section-container py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Welcome back, {firstName}
          </h1>
          <p className="text-muted-foreground">
            {assets.length === 0 ? "No assets tracked yet." : `Demo Estate • ${assets.length} assets tracked`}
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Assets"
            value={isLoading ? "-" : assets.length}
            icon={Landmark}
            variant="primary"
          />
          <StatCard
            title="Total Value"
            value={isLoading ? "-" : `$${(totalValue / 1000).toFixed(0)}K`}
            icon={DollarSign}
            variant="success"
          />
          <StatCard
            title="In Progress"
            value={isLoading ? "-" : inProgress}
            icon={Clock}
            variant="warning"
          />
          <StatCard
            title="Completed"
            value={isLoading ? "-" : completed}
            icon={CheckCircle2}
            variant="default"
          />
        </div>

        {/* Proactive Agent Insights */}
        <AgentInsights />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Assets List */}
          <div className="flex flex-col gap-8 pb-12">
            {/* Probate Command Center */}
            <ProbateHub />

            {/* Stats & Search Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search assets..."
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                Filter
              </Button>
            </div>

            {/* Assets */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">All Assets</h2>
              {isLoading && <p>Loading assets...</p>}
              {!isLoading && assets.length === 0 && (
                <div className="p-8 border rounded-lg text-center text-muted-foreground bg-muted/20">
                  <p>No assets found. Click "Add Asset" to start.</p>
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
                      // Helper to match AssetCard expectations if needed
                      type: normalize(asset.assetType),
                      category: normalize(asset.category) as AssetCategory,
                      status: normalize(asset.status) as AssetStatus,
                      priority: normalize(asset.priority) as Priority,
                      // Use raw dates or formatted strings depending on what AssetCard expects. 
                      // Prisma returns strings for JSON.
                      lastContactDate: asset.lastContactDate ? String(asset.lastContactDate).split('T')[0] : null,
                      nextFollowUpDate: asset.nextFollowUpDate ? String(asset.nextFollowUpDate).split('T')[0] : null,
                      daysSinceContact: 0 // Placeholder
                    }}
                    onClick={() => handleAssetClick(asset.id)}
                  />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <FollowUpWidget
              followUps={derivedFollowUps}
              onFollowUpClick={handleAssetClick}
            />

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="card-elevated p-5"
            >
              <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => navigate('/add-asset')}>
                  <Plus className="w-4 h-4" />
                  Add New Asset
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => navigate('/upload')}>
                  <Landmark className="w-4 h-4" />
                  Upload Document
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2 text-primary border-primary/20 bg-primary/5 hover:bg-primary/10" onClick={() => navigate('/discovery')}>
                  <Search className="w-4 h-4" />
                  Asset Detective
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
