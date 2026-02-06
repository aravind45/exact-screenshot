import { cn } from "@/lib/utils";

export type AssetStatus =
  | 'discovered'
  | 'contacted'
  | 'documents_submitted'
  | 'in_review'
  | 'approved'
  | 'distributed'
  | 'closed';

interface StatusBadgeProps {
  status: AssetStatus;
  className?: string;
}

const statusConfig: Record<AssetStatus, { label: string; className: string }> = {
  discovered: {
    label: 'Discovered',
    className: 'bg-muted text-muted-foreground',
  },
  contacted: {
    label: 'Contacted',
    className: 'bg-primary/10 text-primary',
  },
  documents_submitted: {
    label: 'Docs Submitted',
    className: 'bg-violet-500/10 text-violet-600',
  },
  in_review: {
    label: 'In Review',
    className: 'bg-warning/10 text-warning',
  },
  approved: {
    label: 'Approved',
    className: 'bg-success/10 text-success',
  },
  distributed: {
    label: 'Distributed',
    className: 'bg-emerald-600/10 text-emerald-700',
  },
  closed: {
    label: 'Closed',
    className: 'bg-muted text-muted-foreground',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  if (!config) {
    return (
      <span className={cn('status-badge bg-muted text-muted-foreground', className)}>
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        {status || 'Unknown'}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'status-badge',
        config.className,
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {config.label}
    </span>
  );
}
