import { Check, Clock, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SettlementPhase } from "@/config/settlementPhases";

export interface PhaseConfig {
  id: SettlementPhase;
  title: string;
  subtitle: string;
  milestone: string;
  color?: string;
  isEscalationPath?: boolean;
}

const DEFAULT_PHASES: PhaseConfig[] = [
  {
    id: "immediate_actions",
    title: "Strategic Assessment",
    subtitle: "Secure & Notify",
    milestone: "Death to Filing",
    color: "bg-red-500"
  },
  {
    id: "court_filing",
    title: "Petition & Authority",
    subtitle: "Obtaining Powers",
    milestone: "After Petition Filed",
    color: "bg-orange-500"
  },
  {
    id: "asset_discovery",
    title: "Asset Discovery",
    subtitle: "Inventory & Appraisal",
    milestone: "After Letters Issued",
    color: "bg-yellow-500"
  },
  {
    id: "creditor_claims",
    title: "Creditor Claims",
    subtitle: "Notice & Priority",
    milestone: "After Notice Published",
    color: "bg-blue-500"
  },
  {
    id: "asset_liquidation",
    title: "Asset Liquidation",
    subtitle: "Managed Transfer",
    milestone: "After Inventory Approved",
    color: "bg-indigo-500"
  },
  {
    id: "final_distribution",
    title: "Final Distribution",
    subtitle: "Estate In Closing",
    milestone: "After Claim Period",
    color: "bg-green-500"
  }
];

interface SettlementPhaseChevronProps {
  currentPhase: SettlementPhase;
  completedPhases: SettlementPhase[];
  phases?: PhaseConfig[];
  className?: string;
}

export function SettlementPhaseChevron({
  currentPhase,
  completedPhases,
  phases = DEFAULT_PHASES,
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
                    "relative h-14 w-44 flex items-center justify-center transition-all duration-300",
                    "clip-chevron",
                    isCompleted && "bg-green-600",
                    isCurrent && (phase.isEscalationPath ? "bg-amber-600" : phase.color),
                    isUpcoming && (phase.isEscalationPath ? "bg-amber-100 border-l border-amber-200" : "bg-slate-200"),
                    isCurrent && "scale-105 z-20 shadow-xl ring-2 ring-white/30"
                  )}
                  style={{
                    clipPath: index === 0
                      ? "polygon(0 0, calc(100% - 20px) 0, 100% 50%, calc(100% - 20px) 100%, 0 100%)"
                      : "polygon(20px 0, calc(100% - 20px) 0, 100% 50%, calc(100% - 20px) 100%, 20px 100%, 0 50%)"
                  }}
                >
                  <div className="flex items-center gap-3 px-6">
                    {/* Status Icon */}
                    <div className={cn(
                      "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center",
                      isCompleted && "bg-white/20",
                      isCurrent && "bg-white/20",
                      isUpcoming && "bg-slate-300"
                    )}>
                      {isCompleted && <Check className="w-4 h-4 text-white" />}
                      {isCurrent && <Clock className="w-4 h-4 text-white" />}
                      {isUpcoming && <Lock className="w-3 h-3 text-slate-500" />}
                    </div>

                    {/* Phase Info */}
                    <div className="flex flex-col">
                      <span className={cn(
                        "text-xs font-bold leading-tight",
                        (isCompleted || isCurrent) && "text-white",
                        isUpcoming && (phase.isEscalationPath ? "text-amber-900" : "text-slate-600")
                      )}>
                        {phase.title}
                      </span>
                      <span className={cn(
                        "text-[10px] leading-tight",
                        (isCompleted || isCurrent) && "text-white/80",
                        isUpcoming && (phase.isEscalationPath ? "text-amber-800" : "text-slate-500")
                      )}>
                        {phase.subtitle}
                      </span>
                      <span className={cn(
                        "text-[9px] leading-tight mt-0.5 opacity-80",
                        (isCompleted || isCurrent) && "text-white/60",
                        isUpcoming && (phase.isEscalationPath ? "text-amber-700/60" : "text-slate-400")
                      )}>
                        {phase.milestone}
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
              <div className={cn(
                "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                isCompleted && "bg-green-600",
                isCurrent && "bg-blue-600",
                isUpcoming && "bg-slate-300"
              )}>
                {isCompleted && <Check className="w-5 h-5 text-white" />}
                {isCurrent && <Clock className="w-5 h-5 text-white" />}
                {isUpcoming && <Lock className="w-4 h-4 text-slate-500" />}
              </div>

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
