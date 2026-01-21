import { cn } from "@/lib/utils";
import { PriorityBadge, Priority } from "./PriorityBadge";
import { Clock, ChevronRight, Bell } from "lucide-react";
import { motion } from "framer-motion";

interface FollowUp {
  assetId: string;
  institution: string;
  assetType: string;
  daysSinceContact: number;
  priority: Priority;
  action: string;
}

interface FollowUpWidgetProps {
  followUps: FollowUp[];
  onFollowUpClick?: (assetId: string) => void;
  className?: string;
}

export function FollowUpWidget({ followUps, onFollowUpClick, className }: FollowUpWidgetProps) {
  const urgentCount = followUps.filter(f => f.priority === 'urgent').length;
  const highCount = followUps.filter(f => f.priority === 'high').length;

  if (followUps.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={cn(
          'card-elevated p-6 bg-success/5',
          className
        )}
      >
        <div className="flex items-center gap-3 text-success">
          <div className="p-2 bg-success/10 rounded-lg">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold">All caught up!</h3>
            <p className="text-sm text-muted-foreground">No pending follow-ups right now</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn('card-elevated overflow-hidden', className)}
    >
      {/* Header */}
      <div className="p-5 border-b border-border/50 bg-gradient-to-r from-orange-50 to-amber-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warning/10 rounded-lg">
              <Bell className="w-5 h-5 text-warning" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Follow-ups Needed</h3>
              <p className="text-sm text-muted-foreground">
                {followUps.length} asset{followUps.length !== 1 ? 's' : ''} need attention
              </p>
            </div>
          </div>
          {(urgentCount > 0 || highCount > 0) && (
            <div className="flex gap-2">
              {urgentCount > 0 && (
                <span className="status-badge bg-destructive/10 text-destructive">
                  {urgentCount} urgent
                </span>
              )}
              {highCount > 0 && (
                <span className="status-badge bg-orange-500/10 text-orange-600">
                  {highCount} high
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-border/50">
        {followUps.slice(0, 5).map((followUp, index) => (
          <motion.button
            key={followUp.assetId}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            onClick={() => onFollowUpClick?.(followUp.assetId)}
            className="w-full text-left p-4 hover:bg-muted/50 transition-colors focus:outline-none focus:bg-muted/50 group"
          >
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground truncate">
                    {followUp.institution}
                  </span>
                  <PriorityBadge priority={followUp.priority} />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {followUp.daysSinceContact} days since last contact
                  </span>
                </div>
                <p className="text-sm text-foreground/80 mt-1 truncate">
                  {followUp.action}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" />
            </div>
          </motion.button>
        ))}
      </div>

      {/* View All */}
      {followUps.length > 5 && (
        <div className="p-4 border-t border-border/50 bg-muted/30">
          <button className="w-full text-center text-sm font-medium text-primary hover:underline">
            View all {followUps.length} follow-ups
          </button>
        </div>
      )}
    </motion.div>
  );
}
