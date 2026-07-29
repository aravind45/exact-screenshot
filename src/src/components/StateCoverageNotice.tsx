import { AlertTriangle } from "lucide-react";

/**
 * States with deep, statute-verified guidance (forms, deadlines, fee
 * schedules, thresholds reviewed against current law).
 * Everything else gets general, process-level guidance.
 */
export const DEEP_COVERAGE_STATES = ["CA", "NY", "NJ", "TX", "FL"];

export function isDeepCoverageState(state?: string | null): boolean {
    if (!state) return false;
    const s = state.trim().toUpperCase();
    if (DEEP_COVERAGE_STATES.includes(s)) return true;
    const names: Record<string, string> = {
        CALIFORNIA: "CA", "NEW YORK": "NY", "NEW JERSEY": "NJ", TEXAS: "TX", FLORIDA: "FL",
    };
    return Boolean(names[s]);
}

/**
 * Honest coverage notice shown whenever the estate is in a state without
 * deep, statute-verified guidance. Better to under-promise than to have an
 * executor discover generic content in month two.
 */
export function StateCoverageNotice({ state }: { state?: string | null }) {
    if (isDeepCoverageState(state) || !state) return null;

    return (
        <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900 leading-relaxed">
                <p className="font-bold mb-1">Coverage note for {state}</p>
                <p>
                    Our deepest, statute-level guidance currently covers California, New York,
                    New Jersey, Texas, and Florida. For {state}, this roadmap gives you the
                    correct general process and order of operations — but{" "}
                    <strong>
                        verify form numbers, filing fees, and exact deadlines with your local
                        probate court
                    </strong>{" "}
                    before relying on them.
                </p>
            </div>
        </div>
    );
}
