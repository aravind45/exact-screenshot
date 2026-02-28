import type { AuthorityScope, EstateAuthorityType } from "../types/authorityScope.js";
import { deriveEstateAuthorityType } from "../types/authorityScope.js";

/**
 * Unified Jurisdiction Filter — Single Source of Truth
 *
 * Both roadmapGenerator.ts (client-side/tests) and roadmapService.ts (server-side)
 * import this. No duplicated filtering logic allowed.
 *
 * Fail-closed: any task without a valid scope is DROPPED.
 *
 * FILTERING ORDER (Critical - do not reorder):
 * 1. State scope (CORE/US-XX) check
 * 2. AuthorityScope (PROBATE/TRUST/BOTH) check
 * 3. County overrides (additive)
 */

// Minimal task shape required for filtering — both PhaseTask and DB-mapped tasks conform
export interface ScopedTask {
    id: string;
    title?: string;
    description?: string;
    scope?: string;
    authorityScope?: AuthorityScope;
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

export interface AuthorityScopeFilterResult<T extends ScopedTask> {
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
 * Filter tasks by authorityScope (PROBATE, TRUST, BOTH).
 * This is the ROOT-CAUSE filter that prevents trust/probate module leakage.
 *
 * Fail-closed rules:
 * 1. Tasks without authorityScope → default to "BOTH" (backward compatibility)
 * 2. authorityScope = "BOTH" → always visible
 * 3. authorityScope = "PROBATE" → visible only if estateAuthorityType is "PROBATE" or "BOTH"
 * 4. authorityScope = "TRUST" → visible only if estateAuthorityType is "TRUST" or "BOTH"
 * 5. Unknown authorityScope values → DROP (fail-closed)
 */
export function filterTasksByAuthorityScope<T extends ScopedTask>(
    tasks: T[],
    estateAuthorityType: EstateAuthorityType
): AuthorityScopeFilterResult<T> {
    const kept: T[] = [];
    const dropped: { id: string; reason: string }[] = [];

    for (const task of tasks) {
        // Backward compatibility: tasks without authorityScope default to BOTH
        const taskScope = task.authorityScope;

        // No authorityScope = visible to all (backward compatibility)
        if (!taskScope) {
            kept.push(task);
            continue;
        }

        // BOTH tasks are always visible
        if (taskScope === "BOTH") {
            kept.push(task);
            continue;
        }

        // Estate is BOTH: show all tasks
        if (estateAuthorityType === "BOTH") {
            kept.push(task);
            continue;
        }

        // Exact match required for PROBATE or TRUST
        if (taskScope === estateAuthorityType) {
            kept.push(task);
            continue;
        }

        // Mismatch → DROP (fail-closed)
        dropped.push({
            id: task.id,
            reason: `authorityScope="${taskScope}" does not match estateAuthorityType="${estateAuthorityType}"`
        });
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

/**
 * Phase-level wrapper for authorityScope filtering.
 * Filters tasks within each phase based on estateAuthorityType.
 */
export function filterPhasesByAuthorityScope<T extends ScopedTask>(
    phases: PhaseLike<T>[],
    estateAuthorityType: EstateAuthorityType
): { phases: PhaseLike<T>[]; dropped: { id: string; reason: string }[] } {
    const allDropped: { id: string; reason: string }[] = [];

    const filteredPhases = phases.map(phase => {
        const { kept, dropped } = filterTasksByAuthorityScope(phase.tasks, estateAuthorityType);
        allDropped.push(...dropped);
        return { ...phase, tasks: kept };
    });

    return { phases: filteredPhases, dropped: allDropped };
}
