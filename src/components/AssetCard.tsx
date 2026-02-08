import { cn } from "@/lib/utils";
import { StatusBadge, AssetStatus } from "./StatusBadge";
import { PriorityBadge, Priority } from "./PriorityBadge";
import { CategoryBadge, AssetCategory, getCategoryIcon } from "./CategoryBadge";
import { ChevronRight, Clock, AlertTriangle, Eye, FileText, Lock, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { AssetTaxonomyBadge } from "./AssetTaxonomyBadge";
import { getAssetTaxonomyState, getTaxonomyInfo } from "@/lib/taxonomy";
import { AuthorityBadge, AuthorityType } from "./AuthorityBadge";

interface Asset {
  id: string;
  institution: string;
  type: string;
  value: number;
  dateOfDeathValue?: number;
  category: AssetCategory;
  status: AssetStatus;
  priority: Priority;
  authorityType?: AuthorityType | string;
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
          'flex-1 text-left bg-white rounded-3xl border border-slate-100 p-5 shadow-premium hover:border-primary/20 hover:scale-[1.01] transition-all group cursor-pointer',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          selected ? 'border-primary bg-primary/[0.02]' : '',
          className
        )}
      >
        <div className="flex items-start gap-3">
          {/* Category Icon */}
          <div className={cn(
            'p-3 rounded-2xl shrink-0 group-hover:scale-110 transition-transform duration-300',
            asset.category === 'financial' && 'bg-primary/10 text-primary shadow-sm shadow-primary/10',
            asset.category === 'retirement' && 'bg-violet-500/10 text-violet-600',
            asset.category === 'insurance' && 'bg-emerald-500/10 text-emerald-600',
            asset.category === 'employer' && 'bg-amber-500/10 text-amber-600',
            asset.category === 'property' && 'bg-orange-500/10 text-orange-600',
            asset.category === 'other' && 'bg-slate-100 text-slate-500',
          )}>
            <CategoryIcon className="w-5 h-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-['Outfit'] font-black text-base text-slate-900 leading-tight group-hover:text-primary transition-colors">
                  {asset.institution}
                </h3>
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mt-1">
                  {asset.type.replace(/_/g, ' ')}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-['Outfit'] font-black text-lg text-slate-900 tracking-tighter">
                  {asset.value === 0 && !asset.dateOfDeathValue ? (
                    <span className="text-slate-300 italic text-xs font-medium uppercase tracking-widest">Awaiting Value</span>
                  ) : (
                    <div className="flex flex-col items-end">
                      <span className="leading-none">{formatCurrency(asset.value)}</span>
                      {asset.dateOfDeathValue && (
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                          Value at Death: {formatCurrency(asset.dateOfDeathValue)}
                        </span>
                      )}
                    </div>
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
              <AuthorityBadge type={asset.authorityType} />
              <StatusBadge status={asset.status} />
              {needsFollowUp && (
                <span className="status-badge bg-orange-500/10 text-orange-600 font-bold">
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
