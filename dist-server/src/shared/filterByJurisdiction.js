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
export function filterTasksByJurisdiction(tasks, stateCode, county) {
    const kept = [];
    const dropped = [];
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
        }
        else if (!isThisState && !isAllowedState) {
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
export function filterTasksByAuthorityScope(tasks, estateAuthorityType) {
    const kept = [];
    const dropped = [];
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
export function filterPhasesByJurisdiction(phases, stateCode, county) {
    const allDropped = [];
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
export function filterPhasesByAuthorityScope(phases, estateAuthorityType) {
    const allDropped = [];
    const filteredPhases = phases.map(phase => {
        const { kept, dropped } = filterTasksByAuthorityScope(phase.tasks, estateAuthorityType);
        allDropped.push(...dropped);
        return { ...phase, tasks: kept };
    });
    return { phases: filteredPhases, dropped: allDropped };
}
