import { cn } from "@/lib/utils";
import { Clock, ChevronRight, Bell } from "lucide-react";
import { motion } from "framer-motion";
import { Communication } from "@/lib/api";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

type FollowUp = Communication & {
  asset?: {
    id: string;
    institution: string;
    assetType: string;
  }
};

interface FollowUpWidgetProps {
  followUps: FollowUp[];
  onFollowUpClick?: (assetId: string) => void;
  className?: string;
}

export function FollowUpWidget({ followUps, onFollowUpClick, className }: FollowUpWidgetProps) {
  if (followUps.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn('card-elevated overflow-hidden bg-white border-slate-200 shadow-sm', className)}
    >
      {/* Header */}
      <div className="p-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-100 rounded-lg">
              <Bell className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Follow-ups Needed</h3>
              <p className="text-sm text-slate-500">
                {followUps.length} interaction{followUps.length !== 1 ? 's' : ''} need attention
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-slate-100">
        {followUps.slice(0, 5).map((followUp, index) => (
          <motion.button
            key={followUp.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            onClick={() => onFollowUpClick?.(followUp.assetId)}
            className="w-full text-left p-3 hover:bg-slate-50 transition-colors focus:outline-none focus:bg-slate-50 group"
          >
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-slate-900 truncate">
                    {followUp.asset?.institution || followUp.institutionName}
                  </span>
                  <Badge className="bg-amber-100 text-amber-700 border-none text-[10px] h-5 font-black">FOLLOW-UP</Badge>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-tighter">
                    Due: {followUp.followUpDueAt ? format(new Date(followUp.followUpDueAt), 'MMM d, yyyy') : 'Pending'}
                  </span>
                </div>
                <p className="text-sm text-slate-600 line-clamp-1 leading-relaxed">
                  {followUp.subject || followUp.notes}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 shrink-0 group-hover:text-primary transition-colors" />
            </div>
          </motion.button>
        ))}
      </div>

      {/* View All */}
      {followUps.length > 5 && (
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <button className="w-full text-center text-sm font-bold text-primary hover:underline">
            View all {followUps.length} follow-ups
          </button>
        </div>
      )}
    </motion.div>
  );
}
