import { cn } from "@/lib/utils";
import { 
  Landmark, 
  PiggyBank, 
  Shield, 
  Briefcase, 
  Home, 
  MoreHorizontal 
} from "lucide-react";

export type AssetCategory = 
  | 'financial' 
  | 'retirement' 
  | 'insurance' 
  | 'employer' 
  | 'property' 
  | 'other';

interface CategoryBadgeProps {
  category: AssetCategory;
  showIcon?: boolean;
  className?: string;
}

const categoryConfig: Record<AssetCategory, { 
  label: string; 
  className: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  financial: {
    label: 'Financial',
    className: 'bg-primary/10 text-primary',
    icon: Landmark,
  },
  retirement: {
    label: 'Retirement',
    className: 'bg-violet-500/10 text-violet-600',
    icon: PiggyBank,
  },
  insurance: {
    label: 'Insurance',
    className: 'bg-success/10 text-success',
    icon: Shield,
  },
  employer: {
    label: 'Employer',
    className: 'bg-warning/10 text-warning',
    icon: Briefcase,
  },
  property: {
    label: 'Property',
    className: 'bg-orange-500/10 text-orange-600',
    icon: Home,
  },
  other: {
    label: 'Other',
    className: 'bg-muted text-muted-foreground',
    icon: MoreHorizontal,
  },
};

export function CategoryBadge({ category, showIcon = true, className }: CategoryBadgeProps) {
  const config = categoryConfig[category];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'status-badge',
        config.className,
        className
      )}
    >
      {showIcon && <Icon className="w-3 h-3" />}
      {config.label}
    </span>
  );
}

export function getCategoryIcon(category: AssetCategory) {
  return categoryConfig[category].icon;
}
