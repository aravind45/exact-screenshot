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
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import type { AssetCategory } from "@/components/CategoryBadge";
import type { AssetStatus } from "@/components/StatusBadge";
import type { Priority } from "@/components/PriorityBadge";

// Mock data for demonstration
const mockAssets = [
  {
    id: '1',
    institution: 'Fidelity Investments',
    type: '401k',
    value: 425000,
    category: 'retirement' as AssetCategory,
    status: 'contacted' as AssetStatus,
    priority: 'high' as Priority,
    lastContactDate: '2026-01-07',
    nextFollowUpDate: '2026-01-21',
    daysSinceContact: 14,
  },
  {
    id: '2',
    institution: 'Chase Bank',
    type: 'checking_account',
    value: 15420,
    category: 'financial' as AssetCategory,
    status: 'documents_submitted' as AssetStatus,
    priority: 'medium' as Priority,
    lastContactDate: '2026-01-14',
    nextFollowUpDate: '2026-01-28',
    daysSinceContact: 7,
  },
  {
    id: '3',
    institution: 'MetLife',
    type: 'life_insurance',
    value: 250000,
    category: 'insurance' as AssetCategory,
    status: 'in_review' as AssetStatus,
    priority: 'low' as Priority,
    lastContactDate: '2026-01-18',
    nextFollowUpDate: null,
    daysSinceContact: 3,
  },
  {
    id: '4',
    institution: 'Vanguard',
    type: 'ira',
    value: 185000,
    category: 'retirement' as AssetCategory,
    status: 'discovered' as AssetStatus,
    priority: 'medium' as Priority,
    lastContactDate: null,
    nextFollowUpDate: null,
    daysSinceContact: null,
  },
  {
    id: '5',
    institution: 'Bank of America',
    type: 'savings_account',
    value: 32500,
    category: 'financial' as AssetCategory,
    status: 'approved' as AssetStatus,
    priority: 'low' as Priority,
    lastContactDate: '2026-01-10',
    nextFollowUpDate: null,
    daysSinceContact: 11,
  },
  {
    id: '6',
    institution: 'Former Employer Inc.',
    type: 'stock_options',
    value: 45000,
    category: 'employer' as AssetCategory,
    status: 'contacted' as AssetStatus,
    priority: 'urgent' as Priority,
    lastContactDate: '2025-12-20',
    nextFollowUpDate: '2026-01-20',
    daysSinceContact: 32,
  },
];

const mockFollowUps = [
  {
    assetId: '6',
    institution: 'Former Employer Inc.',
    assetType: 'stock_options',
    daysSinceContact: 32,
    priority: 'urgent' as Priority,
    action: 'Urgent: Consider filing complaint - No response in 30+ days',
  },
  {
    assetId: '1',
    institution: 'Fidelity Investments',
    assetType: '401k',
    daysSinceContact: 14,
    priority: 'high' as Priority,
    action: 'Escalation recommended - Request supervisor',
  },
  {
    assetId: '2',
    institution: 'Chase Bank',
    assetType: 'checking_account',
    daysSinceContact: 7,
    priority: 'medium' as Priority,
    action: 'Gentle reminder - Follow up on document status',
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const totalValue = mockAssets.reduce((sum, asset) => sum + asset.value, 0);
  const inProgress = mockAssets.filter(a => !['distributed', 'closed'].includes(a.status)).length;
  const completed = mockAssets.filter(a => ['distributed', 'closed'].includes(a.status)).length;

  const handleAssetClick = (assetId: string) => {
    navigate(`/asset/${assetId}`);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Get first name from user metadata or email
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

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
              <Button size="sm" className="gap-2">
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
            Demo Estate • {mockAssets.length} assets tracked
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Assets"
            value={mockAssets.length}
            icon={Landmark}
            variant="primary"
          />
          <StatCard
            title="Total Value"
            value={`$${(totalValue / 1000).toFixed(0)}K`}
            icon={DollarSign}
            variant="success"
          />
          <StatCard
            title="In Progress"
            value={inProgress}
            icon={Clock}
            variant="warning"
          />
          <StatCard
            title="Completed"
            value={completed}
            icon={CheckCircle2}
            variant="default"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Assets List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
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
              {mockAssets.map((asset, index) => (
                <motion.div
                  key={asset.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <AssetCard 
                    asset={asset} 
                    onClick={() => handleAssetClick(asset.id)}
                  />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <FollowUpWidget 
              followUps={mockFollowUps}
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
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Plus className="w-4 h-4" />
                  Add New Asset
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Landmark className="w-4 h-4" />
                  Upload Document
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
