import { Check, Clock, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SettlementPhase } from "@/config/settlementPhases";
export type { SettlementPhase } from "@/config/settlementPhases";

export interface PhaseConfig {
  id: SettlementPhase;
  title: string;
  subtitle: string;
  milestone: string;
  color?: string;
  isEscalationPath?: boolean;
}



interface SettlementPhaseChevronProps {
  currentPhase: SettlementPhase;
  completedPhases: SettlementPhase[];
  phases: PhaseConfig[];
  className?: string;
}

export function SettlementPhaseChevron({
  currentPhase,
  completedPhases,
  phases,
  className
}: SettlementPhaseChevronProps) {
  const currentIndex = phases.findIndex(p => p.id === currentPhase);

  const getPhaseStatus = (phase: PhaseConfig, index: number) => {
    if (completedPhases.includes(phase.id)) return "completed";
    if (phase.id === currentPhase) return "current";
    if (index < currentIndex) return "completed";
    return "upcoming";
  };

  const getStatusIcon = (status: "completed" | "current" | "upcoming") => {
    if (status === "completed") return Check;
    if (status === "current") return Clock;
    return Lock;
  };

  return (
    <div className={cn("w-full overflow-x-auto pb-4", className)}>
      <div className="hidden md:flex items-stretch min-w-max gap-2 px-1">
        {phases.map((phase, index) => {
          const status = getPhaseStatus(phase, index);
          const isCompleted = status === "completed";
          const isCurrent = status === "current";
          const isUpcoming = status === "upcoming";
          const StatusIcon = getStatusIcon(status);

          return (
            <div key={phase.id} className="flex items-center">
              <div
                className={cn(
                  "w-52 min-h-[122px] rounded-xl border p-3 transition-all duration-200",
                  isCompleted && "bg-emerald-50 border-emerald-200",
                  isCurrent && "bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-200",
                  isUpcoming && "bg-white border-slate-200"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={cn(
                    "text-[11px] font-bold uppercase tracking-widest",
                    isCompleted && "text-emerald-700",
                    isCurrent && "text-indigo-100",
                    isUpcoming && "text-slate-500"
                  )}>
                    Step {index + 1}
                  </span>

                  <span className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider",
                    isCompleted && "bg-emerald-100 text-emerald-700",
                    isCurrent && "bg-indigo-500/40 text-indigo-100",
                    isUpcoming && "bg-slate-100 text-slate-500"
                  )}>
                    <StatusIcon className="h-3 w-3" />
                    {isCompleted ? "Done" : isCurrent ? "Active" : "Upcoming"}
                  </span>
                </div>

                <div
                  className={cn(
                    "mt-2 text-[15px] font-semibold leading-[1.15]",
                    isCompleted && "text-emerald-900",
                    isCurrent && "text-white",
                    isUpcoming && "text-slate-700"
                  )}
                >
                  {phase.title}
                </div>

                <div className={cn(
                  "mt-1 text-[11px] leading-tight",
                  isCompleted && "text-emerald-700",
                  isCurrent && "text-indigo-100",
                  isUpcoming && "text-slate-500"
                )}>
                  {phase.subtitle}
                </div>

                <div className={cn(
                  "mt-2 text-[11px] font-bold uppercase tracking-widest",
                  isCompleted && "text-emerald-600",
                  isCurrent && "text-indigo-200",
                  isUpcoming && "text-slate-400"
                )}>
                  {phase.milestone}
                </div>
              </div>

              {index < phases.length - 1 && (
                <div className="mx-1 text-slate-300">→</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: Vertical Stack */}
      <div className="md:hidden mt-4 space-y-2">
        {phases.map((phase, index) => {
          const status = getPhaseStatus(phase, index);
          const isCompleted = status === "completed";
          const isCurrent = status === "current";
          const isUpcoming = status === "upcoming";

          return (
            <div
              key={phase.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg transition-all",
                isCompleted && "bg-green-50 border border-green-200",
                isCurrent && "bg-blue-50 border border-blue-200",
                isUpcoming && "bg-slate-50 border border-slate-200"
              )}
            >

              <div className="flex-1">
                <div className={cn(
                  "text-sm font-bold",
                  isCompleted && "text-green-900",
                  isCurrent && "text-blue-900",
                  isUpcoming && "text-slate-600"
                )}>
                  {phase.title}
                </div>
                <div className={cn(
                  "text-xs",
                  isCompleted && "text-green-700",
                  isCurrent && "text-blue-700",
                  isUpcoming && "text-slate-500"
                )}>
                  {phase.subtitle} • {phase.milestone}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
