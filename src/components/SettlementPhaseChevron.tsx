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

  return (
    <div className={cn("w-full overflow-x-auto pb-4", className)}>
      <div className="flex items-center min-w-max">
        {phases.map((phase, index) => {
          const status = getPhaseStatus(phase, index);
          const isCompleted = status === "completed";
          const isCurrent = status === "current";
          const isUpcoming = status === "upcoming";

          return (
            <div key={phase.id} className="flex items-center">
              {/* Chevron Shape */}
              <div className="relative">
                {/* Main Chevron Body */}
                <div
                  className={cn(
                    "relative h-24 w-56 flex items-center justify-center transition-all duration-300",
                    "clip-chevron",
                    isCompleted && "bg-white border-2 border-indigo-100",
                    isCurrent && "bg-indigo-600 shadow-lg shadow-indigo-200",
                    isUpcoming && "bg-white border border-slate-100",
                    isCurrent && "scale-[1.03] z-20"
                  )}
                  style={{
                    clipPath: index === 0
                      ? "polygon(0 0, calc(100% - 24px) 0, 100% 50%, calc(100% - 24px) 100%, 0 100%)"
                      : "polygon(24px 0, calc(100% - 24px) 0, 100% 50%, calc(100% - 24px) 100%, 24px 100%, 0 50%)"
                  }}
                >
                  <div className="flex flex-col items-center px-5 w-full">
                    {/* Phase Info */}
                    <div className="flex flex-col items-center text-center min-w-0 w-full">
                      <span className={cn(
                        "text-[15px] font-semibold tracking-tight leading-[1.1] whitespace-normal break-words",
                        isCurrent && "text-white",
                        isCompleted && "text-indigo-900",
                        isUpcoming && "text-slate-400"
                      )}>
                        {phase.title}
                      </span>
                      <span className={cn(
                        "text-[11px] font-medium leading-[1.15] mt-1 tracking-tight whitespace-normal break-words",
                        isCurrent && "text-indigo-100",
                        isCompleted && "text-indigo-600/70",
                        isUpcoming && "text-slate-400/70"
                      )}>
                        {phase.subtitle}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Hover Effect */}
                {!isUpcoming && (
                  <div className="absolute inset-0 bg-white/0 hover:bg-white/10 transition-colors duration-200 pointer-events-none"
                    style={{
                      clipPath: index === 0
                        ? "polygon(0 0, calc(100% - 20px) 0, 100% 50%, calc(100% - 20px) 100%, 0 100%)"
                        : "polygon(20px 0, calc(100% - 20px) 0, 100% 50%, calc(100% - 20px) 100%, 20px 100%, 0 50%)"
                    }}
                  />
                )}
              </div>

              {/* Connector (hidden for last item) */}
              {index < phases.length - 1 && (
                <div className="w-0 h-0" /> // Overlap handled by clip-path
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
