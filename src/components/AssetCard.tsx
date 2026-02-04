import { cn } from "@/lib/utils";
import { StatusBadge, AssetStatus } from "./StatusBadge";
import { PriorityBadge, Priority } from "./PriorityBadge";
import { CategoryBadge, AssetCategory, getCategoryIcon } from "./CategoryBadge";
import { ChevronRight, Clock, AlertTriangle, Eye, FileText, Lock, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { AssetTaxonomyBadge } from "./AssetTaxonomyBadge";
import { getAssetTaxonomyState, getTaxonomyInfo } from "@/lib/taxonomy";

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
  onSelect?: (selected: boolean) => void;
  selected?: boolean;
  selectable?: boolean;
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

export function AssetCard({ asset, onClick, onSelect, selected, selectable, className }: AssetCardProps) {
  const CategoryIcon = getCategoryIcon(asset.category);
  const needsFollowUp = asset.daysSinceContact && asset.daysSinceContact >= 7;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative flex items-center gap-3"
    >
      {selectable && (
        <label className="flex items-center cursor-pointer p-2 hover:bg-slate-100 rounded-lg transition-colors group/check">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelect?.(e.target.checked)}
            className="w-5 h-5 rounded border-2 border-slate-300 text-primary focus:ring-primary cursor-pointer transition-all group-hover/check:border-primary"
          />
        </label>
      )}

      <button
        onClick={onClick}
        className={cn(
          'flex-1 text-left card-elevated p-3 hover-lift group cursor-pointer border-2 transition-all',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          selected ? 'border-primary bg-primary/5' : 'border-transparent',
          className
        )}
      >
        <div className="flex items-start gap-3">
          {/* Category Icon */}
          <div className={cn(
            'p-2 rounded-lg shrink-0',
            asset.category === 'financial' && 'bg-primary/10 text-primary',
            asset.category === 'retirement' && 'bg-violet-500/10 text-violet-600',
            asset.category === 'insurance' && 'bg-success/10 text-success',
            asset.category === 'employer' && 'bg-warning/10 text-warning',
            asset.category === 'property' && 'bg-orange-500/10 text-orange-600',
            asset.category === 'other' && 'bg-muted text-muted-foreground',
          )}>
            <CategoryIcon className="w-4 h-4" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-sm text-foreground truncate">
                  {asset.institution}
                </h3>
                <p className="text-xs text-muted-foreground capitalize">
                  Account: {asset.type.replace(/_/g, ' ')}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-semibold text-sm text-foreground">
                  {asset.value === 0 ? (
                    <span className="text-slate-400 italic text-xs font-medium">Pending</span>
                  ) : (
                    formatCurrency(asset.value)
                  )}
                </p>

                {/* Taxonomy Signaling */}
                <div className="mt-0.5 flex justify-end">
                  <AssetTaxonomyBadge state={getAssetTaxonomyState(asset as any)} />
                </div>
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
                'flex items-center gap-2 text-xs p-2 rounded-lg mt-1',
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
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1 group-hover:text-foreground transition-colors" />
        </div>
      </button>
    </motion.div>
  );
}
