import { cn } from "@/lib/utils";
import { StatusBadge, AssetStatus } from "./StatusBadge";
import { PriorityBadge, Priority } from "./PriorityBadge";
import { CategoryBadge, AssetCategory, getCategoryIcon } from "./CategoryBadge";
import { ChevronRight, Clock, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

interface Asset {
  id: string;
  institution: string;
  type: string;
  value: number;
  category: AssetCategory;
  status: AssetStatus;
  priority: Priority;
  lastContactDate: string | null;
  nextFollowUpDate: string | null;
  daysSinceContact: number | null;
}

interface AssetCardProps {
  asset: Asset;
  onClick?: () => void;
  className?: string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
}

export function AssetCard({ asset, onClick, className }: AssetCardProps) {
  const CategoryIcon = getCategoryIcon(asset.category);
  const needsFollowUp = asset.daysSinceContact && asset.daysSinceContact >= 7;

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      className={cn(
        'w-full text-left card-elevated p-5 hover-lift group cursor-pointer',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        className
      )}
    >
      <div className="flex items-start gap-4">
        {/* Category Icon */}
        <div className={cn(
          'p-3 rounded-xl shrink-0',
          asset.category === 'financial' && 'bg-primary/10 text-primary',
          asset.category === 'retirement' && 'bg-violet-500/10 text-violet-600',
          asset.category === 'insurance' && 'bg-success/10 text-success',
          asset.category === 'employer' && 'bg-warning/10 text-warning',
          asset.category === 'property' && 'bg-orange-500/10 text-orange-600',
          asset.category === 'other' && 'bg-muted text-muted-foreground',
        )}>
          <CategoryIcon className="w-5 h-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-foreground truncate">
                {asset.institution}
              </h3>
              <p className="text-sm text-muted-foreground capitalize">
                {asset.type.replace(/_/g, ' ')}
              </p>
            </div>
            <div className="text-right shrink-0">
              {asset.status === 'discovered' && (
                <div className="flex items-center gap-1 text-[10px] font-bold text-primary uppercase bg-primary/10 px-2 py-1 rounded-lg mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  Action Required
                </div>
              )}
              <p className="font-semibold text-foreground">
                {formatCurrency(asset.value)}
              </p>
            </div>
          </div>

          {/* Status Row */}
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={asset.status} />
            {needsFollowUp && (
              <span className="status-badge bg-orange-500/10 text-orange-600">
                <Clock className="w-3 h-3" />
                {asset.daysSinceContact} days
              </span>
            )}
          </div>

          {/* Follow-up Alert */}
          {needsFollowUp && asset.priority !== 'low' && (
            <div className={cn(
              'flex items-center gap-2 text-xs p-2 rounded-lg mt-2',
              asset.priority === 'urgent' && 'bg-destructive/5 text-destructive',
              asset.priority === 'high' && 'bg-orange-500/5 text-orange-600',
              asset.priority === 'medium' && 'bg-warning/5 text-warning',
            )}>
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>
                {asset.priority === 'urgent' && 'Urgent: Consider filing complaint'}
                {asset.priority === 'high' && 'Follow-up recommended'}
                {asset.priority === 'medium' && 'Gentle reminder due'}
              </span>
            </div>
          )}
        </div>

        {/* Arrow */}
        <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 mt-1 group-hover:text-foreground transition-colors" />
      </div>
    </motion.button>
  );
}
