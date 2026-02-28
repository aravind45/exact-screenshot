/**
 * Authority Scope Types
 *
 * Defines which authority tracks (PROBATE, TRUST, or BOTH) a task belongs to.
 * This is used for fail-closed filtering to prevent module leakage.
 */
/**
 * Derives estateAuthorityType from activeEngines array
 * Rules:
 * - If TRUST only → "TRUST"
 * - If PROBATE only → "PROBATE"
 * - If both → "BOTH"
 * - If neither (shouldn't happen) → defaults to "PROBATE" (fail-closed)
 */
export function deriveEstateAuthorityType(activeEngines, options) {
    const hasTrust = activeEngines.includes("TRUST");
    const hasProbate = activeEngines.includes("PROBATE") || activeEngines.includes("AFFIDAVIT");
    if (hasTrust && !hasProbate)
        return "TRUST";
    if (hasProbate && !hasTrust)
        return "PROBATE";
    if (hasTrust && hasProbate)
        return "BOTH";
    // Fail-closed default - PROBATE is safer than BOTH
    return options?.failClosedDefault ?? "PROBATE";
}
/**
 * Checks if a task's authorityScope is compatible with the estate's authorityType
 * Returns true if task should be visible, false if it should be filtered out.
 */
export function isAuthorityScopeCompatible(taskScope, estateAuthorityType) {
    // Backward compatibility: tasks without authorityScope default to BOTH
    if (!taskScope)
        return true;
    // BOTH tasks are always visible
    if (taskScope === "BOTH")
        return true;
    // Estate is BOTH: show all tasks
    if (estateAuthorityType === "BOTH")
        return true;
    // Exact match required
    return taskScope === estateAuthorityType;
}
/**
 * Filters a task array by authorityScope using fail-closed logic
 * Returns kept and dropped tasks with reasons
 */
export function filterTasksByAuthorityScopeCompat(tasks, estateAuthorityType) {
    const kept = [];
    const dropped = [];
    for (const task of tasks) {
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
