import { cn } from "@/lib/utils";
import { AlertTriangle, AlertCircle, Clock, CheckCircle } from "lucide-react";

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

interface PriorityBadgeProps {
  priority: Priority;
  showIcon?: boolean;
  className?: string;
}

const priorityConfig: Record<Priority, { 
  label: string; 
  className: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  low: {
    label: 'Low',
    className: 'bg-success/10 text-success',
    icon: CheckCircle,
  },
  medium: {
    label: 'Medium',
    className: 'bg-warning/10 text-warning',
    icon: Clock,
  },
  high: {
    label: 'High',
    className: 'bg-orange-500/10 text-orange-600',
    icon: AlertCircle,
  },
  urgent: {
    label: 'Urgent',
    className: 'bg-destructive/10 text-destructive',
    icon: AlertTriangle,
  },
};

export function PriorityBadge({ priority, showIcon = true, className }: PriorityBadgeProps) {
  const config = priorityConfig[priority];
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
