import { useMemo } from "react";
import { CalendarClock, Gauge, Route, AlertTriangle, CheckCircle2, Clock3, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineTask {
  id: string;
  estimatedTime?: string;
}

interface TimelinePhase {
  phase: string;
  title: string;
  subtitle?: string;
  tasks: TimelineTask[];
  isEscalationPath?: boolean;
}

interface TimelineEstimate {
  minDays: number;
  maxDays: number;
  estimatedTaskCount: number;
}

interface EstimatedPhase {
  phase: TimelinePhase;
  estimate: TimelineEstimate;
  completionPercent: number;
  midpointDays: number;
  startMinDays: number;
  startMaxDays: number;
  endMinDays: number;
  endMaxDays: number;
}

interface RoadmapTimelineOverviewProps {
  phases: TimelinePhase[];
  currentPhase: string;
  completedTaskIds: string[];
}

const FALLBACK_PHASE_DAYS: Record<string, { min: number; max: number }> = {
  immediate_actions: { min: 3, max: 14 },
  pre_filing_compliance: { min: 7, max: 21 },
  court_filing: { min: 45, max: 120 },
  ancillary_phase: { min: 30, max: 120 },
  litigation_phase: { min: 120, max: 365 },
  insolvency_phase: { min: 21, max: 90 },
  asset_discovery: { min: 21, max: 60 },
  probate_escalation: { min: 30, max: 120 },
  creditor_claims: { min: 90, max: 180 },
  asset_liquidation: { min: 30, max: 120 },
  final_distribution: { min: 30, max: 90 },
};

const DEFAULT_FALLBACK_DAYS = { min: 14, max: 45 };

function toDays(value: number, unitRaw: string): number {
  const unit = unitRaw.toLowerCase();

  if (unit.startsWith("minute")) return value / (24 * 60);
  if (unit.startsWith("hour")) return value / 24;
  if (unit.startsWith("day")) return value;
  if (unit.startsWith("week")) return value * 7;
  if (unit.startsWith("month")) return value * 30;
  if (unit.startsWith("year")) return value * 365;

  return value;
}

function clampDays(minDays: number, maxDays: number): { minDays: number; maxDays: number } {
  const min = Math.max(0.25, minDays);
  const max = Math.max(min, maxDays);
  return {
    minDays: Math.min(min, 730),
    maxDays: Math.min(max, 1095),
  };
}

function parseEstimateDays(estimatedTime?: string): { minDays: number; maxDays: number } | null {
  if (!estimatedTime) return null;

  const text = estimatedTime.trim().toLowerCase();
  if (!text) return null;

  if (/(ongoing|n\/a|as needed|tbd|varies|variable)/i.test(text)) {
    return null;
  }

  const rangeMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)\s*(minutes?|hours?|days?|weeks?|months?|years?)/i);
  if (rangeMatch) {
    const minValue = Number(rangeMatch[1]);
    const maxValue = Number(rangeMatch[2]);
    const unit = rangeMatch[3];
    return clampDays(toDays(minValue, unit), toDays(maxValue, unit));
  }

  const singleMatch = text.match(/(\d+(?:\.\d+)?)\s*(minutes?|hours?|days?|weeks?|months?|years?)/i);
  if (singleMatch) {
    const value = Number(singleMatch[1]);
    const unit = singleMatch[2];
    const days = toDays(value, unit);
    return clampDays(days * 0.9, days * 1.2);
  }

  return null;
}

function estimatePhaseTimeline(phase: TimelinePhase): TimelineEstimate {
  const fallback = FALLBACK_PHASE_DAYS[phase.phase] || DEFAULT_FALLBACK_DAYS;
  const parsed = phase.tasks
    .map((task) => parseEstimateDays(task.estimatedTime))
    .filter((item): item is { minDays: number; maxDays: number } => item !== null);

  if (parsed.length === 0) {
    return {
      minDays: fallback.min,
      maxDays: fallback.max,
      estimatedTaskCount: 0,
    };
  }

  const sumMin = parsed.reduce((sum, item) => sum + item.minDays, 0);
  const sumMax = parsed.reduce((sum, item) => sum + item.maxDays, 0);
  const longestMin = Math.max(...parsed.map((item) => item.minDays));
  const longestMax = Math.max(...parsed.map((item) => item.maxDays));

  const rawMin = Math.max(longestMin, sumMin * 0.35, fallback.min);
  const rawMax = Math.max(longestMax, sumMax * 0.55, fallback.max);
  const minDays = Math.max(1, Math.round(rawMin));
  const maxDays = Math.max(minDays + 1, Math.round(rawMax));

  return {
    minDays,
    maxDays,
    estimatedTaskCount: parsed.length,
  };
}

function toDisplayNumber(value: number): string {
  if (value < 2) return value.toFixed(1).replace(/\.0$/, "");
  return String(Math.round(value));
}

function formatDuration(minDays: number, maxDays: number): string {
  if (maxDays < 14) {
    return `${Math.max(1, Math.round(minDays))}-${Math.round(maxDays)} days`;
  }

  if (maxDays < 75) {
    return `${toDisplayNumber(minDays / 7)}-${toDisplayNumber(maxDays / 7)} weeks`;
  }

  return `${toDisplayNumber(minDays / 30)}-${toDisplayNumber(maxDays / 30)} months`;
}

function formatPointInTime(days: number): string {
  if (days < 35) {
    const week = Math.max(1, Math.round(days / 7));
    return `Week ${week}`;
  }

  if (days < 365) {
    const month = Math.max(1, Math.round(days / 30));
    return `Month ${month}`;
  }

  const year = Math.max(1, Math.round(days / 365));
  return `Year ${year}`;
}

function getEstimateConfidence(coverageRatio: number): { label: string; className: string } {
  if (coverageRatio >= 0.7) {
    return { label: "High", className: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  }

  if (coverageRatio >= 0.35) {
    return { label: "Medium", className: "bg-amber-50 text-amber-700 border-amber-200" };
  }

  return { label: "Low", className: "bg-rose-50 text-rose-700 border-rose-200" };
}

function getPhaseStatus(
  phase: TimelinePhase,
  completionPercent: number,
  index: number,
  currentIndex: number
): { label: string; className: string; icon: typeof CheckCircle2 } {
  if (completionPercent >= 100) {
    return {
      label: "Done",
      className: "bg-emerald-100 text-emerald-700",
      icon: CheckCircle2,
    };
  }

  if (phase.phase === "litigation_phase" || phase.isEscalationPath) {
    return {
      label: "Conditional",
      className: "bg-amber-100 text-amber-700",
      icon: AlertTriangle,
    };
  }

  if (index === currentIndex) {
    return {
      label: "Active",
      className: "bg-indigo-100 text-indigo-700",
      icon: Clock3,
    };
  }

  if (currentIndex > -1 && index < currentIndex) {
    return {
      label: "In Review",
      className: "bg-slate-200 text-slate-600",
      icon: Clock3,
    };
  }

  return {
    label: "Upcoming",
    className: "bg-slate-100 text-slate-500",
    icon: Lock,
  };
}

export function RoadmapTimelineOverview({
  phases,
  currentPhase,
  completedTaskIds,
}: RoadmapTimelineOverviewProps) {
  const estimatedPhases = useMemo(() => {
    const normalized = phases.filter((phase) => phase && phase.tasks && phase.tasks.length > 0);
    const primaryPhases = normalized.filter((phase) => !phase.isEscalationPath);
    const list = primaryPhases.length > 0 ? primaryPhases : normalized;

    let runningMin = 0;
    let runningMax = 0;

    return list.map((phase) => {
      const estimate = estimatePhaseTimeline(phase);
      const completedInPhase = phase.tasks.filter((task) => completedTaskIds.includes(task.id)).length;
      const completionPercent = phase.tasks.length > 0
        ? Math.round((completedInPhase / phase.tasks.length) * 100)
        : 0;

      const startMinDays = runningMin;
      const startMaxDays = runningMax;
      const endMinDays = startMinDays + estimate.minDays;
      const endMaxDays = startMaxDays + estimate.maxDays;

      runningMin = endMinDays;
      runningMax = endMaxDays;

      return {
        phase,
        estimate,
        completionPercent,
        midpointDays: (estimate.minDays + estimate.maxDays) / 2,
        startMinDays,
        startMaxDays,
        endMinDays,
        endMaxDays,
      } satisfies EstimatedPhase;
    });
  }, [phases, completedTaskIds]);

  if (estimatedPhases.length === 0) {
    return null;
  }

  const totalMinDays = estimatedPhases.reduce((sum, item) => sum + item.estimate.minDays, 0);
  const totalMaxDays = estimatedPhases.reduce((sum, item) => sum + item.estimate.maxDays, 0);
  const totalTasks = estimatedPhases.reduce((sum, item) => sum + item.phase.tasks.length, 0);
  const estimatedTasks = estimatedPhases.reduce((sum, item) => sum + item.estimate.estimatedTaskCount, 0);
  const coverageRatio = totalTasks > 0 ? estimatedTasks / totalTasks : 0;
  const confidence = getEstimateConfidence(coverageRatio);
  const longestMidpoint = Math.max(...estimatedPhases.map((item) => item.midpointDays), 1);
  const currentIndex = estimatedPhases.findIndex((item) => item.phase.phase === currentPhase);

  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">Roadmap Timeline</p>
          <h2 className="mt-2 text-2xl font-black text-slate-900 tracking-tight">Approximate End-to-End Duration</h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">
            This estimate updates when your roadmap version changes. County court calendars, disputes, and newly discovered assets can extend timing.
          </p>
        </div>
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-5 py-4 min-w-[220px]">
          <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold uppercase tracking-wider">
            <CalendarClock className="h-4 w-4" />
            Total Estimate
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{formatDuration(totalMinDays, totalMaxDays)}</div>
          <div className="mt-1 text-xs text-slate-600">
            {formatPointInTime(totalMinDays)} to {formatPointInTime(totalMaxDays)}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-500">
            <Gauge className="h-4 w-4" />
            Estimate Confidence
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className={cn("rounded-full border px-2 py-0.5 text-xs font-bold", confidence.className)}>
              {confidence.label}
            </span>
            <span className="text-xs text-slate-500">{Math.round(coverageRatio * 100)}% task coverage</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-500">
            <Route className="h-4 w-4" />
            Phase Count
          </div>
          <div className="mt-2 text-sm font-semibold text-slate-700">
            {estimatedPhases.length} phase{estimatedPhases.length !== 1 ? "s" : ""} in active track
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-500">
            <AlertTriangle className="h-4 w-4" />
            Legal Note
          </div>
          <div className="mt-2 text-sm text-slate-700">
            Estimated only. Deadlines and court dates are jurisdiction-dependent.
          </div>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto pb-2">
        <div className="flex min-w-max items-stretch gap-3">
          {estimatedPhases.map((item, index) => {
            const status = getPhaseStatus(item.phase, item.completionPercent, index, currentIndex);
            const StatusIcon = status.icon;
            const widthPercent = Math.max(15, Math.round((item.midpointDays / longestMidpoint) * 100));

            return (
              <div
                key={`${item.phase.phase}-${index}`}
                className="w-[260px] rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Step {index + 1}</span>
                  <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider", status.className)}>
                    <StatusIcon className="h-3 w-3" />
                    {status.label}
                  </span>
                </div>

                <h3 className="mt-3 text-base font-black text-slate-900 leading-tight">{item.phase.title}</h3>
                {item.phase.subtitle && (
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">{item.phase.subtitle}</p>
                )}

                <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-indigo-500"
                    style={{ width: `${widthPercent}%` }}
                  />
                </div>

                <div className="mt-3 text-sm font-semibold text-slate-800">
                  {formatDuration(item.estimate.minDays, item.estimate.maxDays)}
                </div>
                <div className="mt-1 text-[11px] text-slate-500">
                  Window: {formatPointInTime(item.startMinDays)} - {formatPointInTime(item.endMaxDays)}
                </div>

                <div className="mt-3 text-[11px] text-slate-500">
                  Completion: {item.completionPercent}% ({item.phase.tasks.filter((task) => completedTaskIds.includes(task.id)).length}/{item.phase.tasks.length} tasks)
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

