/**
 * EstateJourneyBanner
 *
 * A plain-English "you are here" map of the 6 estate settlement phases.
 * Designed for first-time executors who have no idea what estate settlement
 * involves or how long it takes.
 *
 * Data: Phases are derived from settlementPhases.ts — no hardcoded values.
 * Completion: Computed from completedTaskIds + roadmap.
 */

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, ChevronRight, Clock, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkflow } from "@/contexts/WorkflowContext";
import { generateRoadmap } from "@/config/roadmapGenerator";
import { calculateAuthorityRecommendation } from "@/lib/authorityEngine";

// Plain-English phase metadata — maps from phase id to user-friendly content
const PHASE_META: Record<string, {
    label: string;          // short label for stepper
    heading: string;        // descriptive name
    summary: string;        // one plain-English sentence for new users
    duration: string;       // estimated calendar time
    icon: string;           // emoji icon (lightweight, no lucide import needed)
}> = {
    immediate_actions: {
        label: "Secure",
        heading: "Secure the Estate",
        summary: "Stop recurring charges, forward mail, secure property, and confirm you're the right person to act.",
        duration: "Days 1–14",
        icon: "🔒",
    },
    court_filing: {
        label: "Authority",
        heading: "Get Court Authority",
        summary: "File paperwork with the probate court so you legally have the power to access and manage the estate's accounts.",
        duration: "Weeks 2–8",
        icon: "⚖️",
    },
    asset_discovery: {
        label: "Inventory",
        heading: "Find & Value All Assets",
        summary: "Track down every bank account, property, and investment. Get official valuations for the court.",
        duration: "Month 1–3",
        icon: "🔍",
    },
    creditor_claims: {
        label: "Debts",
        heading: "Handle Debts & Creditors",
        summary: "Give creditors a chance to file claims. Pay valid debts in the legally required order — not before.",
        duration: "Month 2–6",
        icon: "📋",
    },
    asset_liquidation: {
        label: "Transfer",
        heading: "Transfer & Liquidate Assets",
        summary: "Move accounts, sell property, file taxes. This is the longest operational phase.",
        duration: "Month 4–10",
        icon: "💸",
    },
    final_distribution: {
        label: "Close",
        heading: "Distribute & Close Estate",
        summary: "Pay heirs their share, file final court accounting, and officially close the estate.",
        duration: "Month 8–14",
        icon: "✅",
    },
};

const PHASE_ORDER = [
    "immediate_actions",
    "court_filing",
    "asset_discovery",
    "creditor_claims",
    "asset_liquidation",
    "final_distribution",
] as const;

interface EstateJourneyBannerProps {
    estate: any;
    assets?: any[];
}

export function EstateJourneyBanner({ estate, assets = [] }: EstateJourneyBannerProps) {
    const navigate = useNavigate();
    const { completedTaskIds } = useWorkflow();
    const [expandedPhase, setExpandedPhase] = useState<string | null>(null);

    // Build the roadmap deterministically
    const roadmap = useMemo(() => {
        if (!estate) return [];
        try {
            const recommendation = calculateAuthorityRecommendation(
                assets,
                estate.deceasedState || "CA",
                {
                    hasWill: estate.hasWill,
                    isSpouse: estate.isSurvivingSpouse,
                    isOutOfState: estate.hasOutOfStateProperty,
                    estimatedValue: estate.estimatedPersonalProperty,
                    isTrustRevocable: estate.isTrustRevocable,
                    hasTODDeed: estate.hasTODDeed,
                    hasContest: estate.hasContest,
                }
            );
            const modifiers = [...(recommendation.modifiers || [])];
            if (estate.isInternational) modifiers.push("INTERNATIONAL_MODE");
            return generateRoadmap(
                recommendation.type,
                estate.deceasedState || "CA",
                modifiers,
                recommendation.activeEngines,
                estate.hasWill
            );
        } catch {
            return [];
        }
    }, [estate, assets]);

    // Compute per-phase progress from real completedTaskIds
    const phaseProgress = useMemo(() => {
        return PHASE_ORDER.map((phaseKey) => {
            const phase = roadmap.find((p) => p.phase === phaseKey);
            if (!phase) return { phaseKey, total: 0, completed: 0, pct: 0 };

            const total = phase.tasks.length;
            const completed = phase.tasks.filter((t) => completedTaskIds.includes(t.id)).length;
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

            return { phaseKey, total, completed, pct };
        });
    }, [roadmap, completedTaskIds]);

    // Determine current active phase (first phase with incomplete tasks)
    const activePhaseKey = useMemo(() => {
        for (const { phaseKey, total, completed } of phaseProgress) {
            if (total > 0 && completed < total) return phaseKey;
        }
        return PHASE_ORDER[PHASE_ORDER.length - 1]; // All done
    }, [phaseProgress]);

    const activePhaseIndex = PHASE_ORDER.indexOf(activePhaseKey as any);

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-4 pt-3 pb-2.5 flex items-center justify-between border-b border-slate-50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 leading-none mb-1">
                            Your Settlement Journey
                        </p>
                        <p className="text-lg font-black text-slate-900 leading-tight">
                            {activePhaseIndex === PHASE_ORDER.length - 1 && phaseProgress[activePhaseIndex]?.pct === 100
                                ? "Estate Fully Settled 🎉"
                                : `Phase ${activePhaseIndex + 1} of ${PHASE_ORDER.length} · ${PHASE_META[activePhaseKey]?.heading}`}
                        </p>
                    </div>
                </div>
                <button
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                    onClick={() => navigate("/roadmap")}
                >
                    Full Action Plan <ChevronRight className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Phase Stepper */}
            <div className="px-4 py-3 overflow-x-auto">
                <div className="flex items-start gap-0 min-w-max">
                    {PHASE_ORDER.map((phaseKey, idx) => {
                        const meta = PHASE_META[phaseKey];
                        const prog = phaseProgress[idx];
                        const isActive = phaseKey === activePhaseKey;
                        const isCompleted = prog.pct === 100 && prog.total > 0;
                        const isUpcoming = idx > activePhaseIndex;
                        const isExpanded = expandedPhase === phaseKey;

                        return (
                            <div key={phaseKey} className="flex items-start">
                                {/* Phase Pill */}
                                <button
                                    className={cn(
                                        "flex flex-col items-center gap-1.5 px-3 py-2 rounded-2xl transition-all duration-200 group relative",
                                        isActive && "bg-indigo-50 ring-2 ring-indigo-200",
                                        isCompleted && !isActive && "bg-emerald-50/60",
                                        isUpcoming && "opacity-50",
                                        !isActive && !isUpcoming && "hover:bg-slate-50"
                                    )}
                                    onClick={() => setExpandedPhase(isExpanded ? null : phaseKey)}
                                >
                                    {/* Icon + completion indicator */}
                                    <div className="relative">
                                        <div className={cn(
                                            "w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all",
                                            isActive && "bg-indigo-600 shadow-lg shadow-indigo-200",
                                            isCompleted && !isActive && "bg-emerald-500",
                                            isUpcoming && "bg-slate-100",
                                            !isActive && !isUpcoming && !isCompleted && "bg-slate-100"
                                        )}>
                                            {isCompleted && !isActive
                                                ? <CheckCircle2 className="w-5 h-5 text-white" />
                                                : <span className="leading-none">{meta.icon}</span>
                                            }
                                        </div>
                                        {isActive && (
                                            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse border-2 border-white" />
                                        )}
                                    </div>

                                    {/* Label */}
                                    <span className={cn(
                                        "text-[11px] font-bold uppercase tracking-wide leading-none text-center whitespace-nowrap",
                                        isActive ? "text-indigo-700" : isCompleted ? "text-emerald-700" : "text-slate-400"
                                    )}>
                                        {meta.label}
                                    </span>

                                    {/* Progress bar (only for active/partial) */}
                                    {prog.total > 0 && !isUpcoming && (
                                        <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mt-0.5" style={{ width: '36px' }}>
                                            <div
                                                className={cn("h-full rounded-full transition-all duration-500",
                                                    isActive ? "bg-indigo-500" : "bg-emerald-500"
                                                )}
                                                style={{ width: `${prog.pct}%` }}
                                            />
                                        </div>
                                    )}

                                    {/* Duration chip — only on active */}
                                    {isActive && (
                                        <div className="flex items-center gap-1 px-2 py-1 bg-indigo-100 rounded-md">
                                            <Clock className="w-2.5 h-2.5 text-indigo-600" />
                                            <span className="text-[10px] font-bold text-indigo-700 whitespace-nowrap">{meta.duration}</span>
                                        </div>
                                    )}
                                </button>

                                {/* Connector line between phases */}
                                {idx < PHASE_ORDER.length - 1 && (
                                    <div className="flex items-center mt-5 mx-0.5 flex-shrink-0">
                                        <div className={cn(
                                            "h-0.5 w-6 rounded-full transition-colors",
                                            idx < activePhaseIndex ? "bg-emerald-400" :
                                                idx === activePhaseIndex ? "bg-indigo-300" : "bg-slate-150"
                                        )} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Expanded Phase Detail — shows when user taps a phase */}
            {expandedPhase && PHASE_META[expandedPhase] && (
                <div className={cn(
                    "px-5 py-3 border-t border-slate-50 flex items-start gap-3",
                    expandedPhase === activePhaseKey ? "bg-indigo-50/50" : "bg-slate-50/50"
                )}>
                    <span className="text-xl leading-none mt-0.5 flex-shrink-0">{PHASE_META[expandedPhase].icon}</span>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <p className="text-xs font-black text-slate-900">{PHASE_META[expandedPhase].heading}</p>
                            <span className="text-[11px] font-semibold text-slate-500 px-2 py-0.5 bg-slate-100 rounded-md">
                                {PHASE_META[expandedPhase].duration}
                            </span>
                            {phaseProgress[PHASE_ORDER.indexOf(expandedPhase as any)]?.total > 0 && (
                                <span className="text-[11px] font-medium text-slate-500">
                                    {phaseProgress[PHASE_ORDER.indexOf(expandedPhase as any)].completed}/
                                    {phaseProgress[PHASE_ORDER.indexOf(expandedPhase as any)].total} tasks
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            {PHASE_META[expandedPhase].summary}
                        </p>
                    </div>
                    <button
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5 flex-shrink-0 mt-0.5"
                        onClick={() => navigate("/roadmap")}
                    >
                        View <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}
        </div>
    );
}
