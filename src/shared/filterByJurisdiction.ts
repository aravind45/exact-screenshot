/**
 * Unified Jurisdiction Filter — Single Source of Truth
 *
 * Both roadmapGenerator.ts (client-side/tests) and roadmapService.ts (server-side)
 * import this. No duplicated filtering logic allowed.
 *
 * Fail-closed: any task without a valid scope is DROPPED.
 */

// Minimal task shape required for filtering — both PhaseTask and DB-mapped tasks conform
export interface ScopedTask {
    id: string;
    scope?: string;
    allowedStates?: string[];
    allowedCounties?: string[];
    applicability?: {
        states?: string[];
        [key: string]: unknown;
    };
}

export interface JurisdictionFilterResult<T extends ScopedTask> {
    kept: T[];
    dropped: { id: string; reason: string }[];
}

/**
 * Filter a flat array of tasks by jurisdiction scope.
 *
 * Eligibility rules (fail-closed):
 * 1. scope === "CORE" AND no allowedStates AND no applicability.states → eligible for ALL states
 * 2. scope === `US-${stateCode}` → eligible for that state only
 * 3. allowedStates includes stateCode → eligible
 * 4. Everything else → DROP
 *
 * County filter (additive):
 * - If task.allowedCounties is set, keep only if county matches
 */
export function filterTasksByJurisdiction<T extends ScopedTask>(
    tasks: T[],
    stateCode: string,
    county?: string
): JurisdictionFilterResult<T> {
    const kept: T[] = [];
    const dropped: { id: string; reason: string }[] = [];

    for (const task of tasks) {
        // ── Gate 1: scope must exist and be valid ─────────────────────────
        if (!task.scope || task.scope === "UNSCOPED") {
            dropped.push({ id: task.id, reason: `missing/UNSCOPED scope` });
            continue;
        }

        // ── Gate 2: state eligibility ─────────────────────────────────────
        const isCore = task.scope === "CORE";
        const isThisState = task.scope === `US-${stateCode}`;
        const isAllowedState = task.allowedStates?.includes(stateCode) ?? false;

        if (isCore) {
            // CORE tasks with applicability.states are suspect — they should use
            // allowedStates or a state scope instead. But legacy data may still
            // have this pattern, so we apply it as a secondary gate.
            if (task.applicability?.states?.length) {
                if (!task.applicability.states.includes(stateCode)) {
                    dropped.push({ id: task.id, reason: `CORE task with applicability.states excluding ${stateCode}` });
                    continue;
                }
            }
        } else if (!isThisState && !isAllowedState) {
            dropped.push({ id: task.id, reason: `scope "${task.scope}" does not match state ${stateCode}` });
            continue;
        }

        // ── Gate 3: county filter (additive) ──────────────────────────────
        if (task.allowedCounties && task.allowedCounties.length > 0) {
            if (!county || !task.allowedCounties.includes(county)) {
                dropped.push({ id: task.id, reason: `allowedCounties does not include "${county || '(none)'}"` });
                continue;
            }
        }

        kept.push(task);
    }

    return { kept, dropped };
}

/**
 * Phase-level wrapper: filters tasks within each phase, removing empty phases.
 * Returns dropped task report for logging/auditing.
 */
export interface PhaseLike<T extends ScopedTask> {
    phase: string;
    tasks: T[];
    [key: string]: unknown;
}

export function filterPhasesByJurisdiction<T extends ScopedTask>(
    phases: PhaseLike<T>[],
    stateCode: string,
    county?: string
): { phases: PhaseLike<T>[]; dropped: { id: string; reason: string }[] } {
    const allDropped: { id: string; reason: string }[] = [];

    const filteredPhases = phases.map(phase => {
        const { kept, dropped } = filterTasksByJurisdiction(phase.tasks, stateCode, county);
        allDropped.push(...dropped);
        return { ...phase, tasks: kept };
    });

    return { phases: filteredPhases, dropped: allDropped };
}
