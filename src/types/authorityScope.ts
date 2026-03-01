/**
 * Authority Scope Types
 *
 * Defines which authority tracks (PROBATE, TRUST, or BOTH) a task belongs to.
 * This is used for fail-closed filtering to prevent module leakage.
 */

export type AuthorityScope = "PROBATE" | "TRUST" | "BOTH";

const VALID_SCOPES: ReadonlySet<string> = new Set(["PROBATE", "TRUST", "BOTH"]);

/**
 * Estate Authority Type derived from activeEngines
 * Computed server-side from the AuthorityEngine's activeEngines array.
 */
export type EstateAuthorityType = "PROBATE" | "TRUST" | "BOTH";

/**
 * Derives estateAuthorityType from activeEngines array
 * Rules:
 * - If TRUST only → "TRUST"
 * - If PROBATE only → "PROBATE"
 * - If both → "BOTH"
 * - If neither (shouldn't happen) → defaults to "PROBATE" (fail-closed)
 */
export function deriveEstateAuthorityType(
  activeEngines: string[],
  options?: { failClosedDefault?: "PROBATE" | "BOTH" }
): EstateAuthorityType {
  const hasTrust = activeEngines.includes("TRUST");
  const hasProbate = activeEngines.includes("PROBATE") || activeEngines.includes("AFFIDAVIT");

  if (hasTrust && !hasProbate) return "TRUST";
  if (hasProbate && !hasTrust) return "PROBATE";
  if (hasTrust && hasProbate) return "BOTH";

  return options?.failClosedDefault ?? "PROBATE";
}

/**
 * Checks if a task's authorityScope is compatible with the estate's authorityType.
 * Fail-closed: tasks without a valid authorityScope are REJECTED.
 * Returns true if task should be visible, false if it should be filtered out.
 * Fail-closed: tasks without authorityScope or with invalid scope are NOT visible.
 */
export function isAuthorityScopeCompatible(
  taskScope: AuthorityScope | undefined | null,
  estateAuthorityType: EstateAuthorityType
): boolean {
  if (!taskScope) return false;
  if (!VALID_SCOPES.has(taskScope)) return false;
  if (taskScope === "BOTH") return true;
  if (estateAuthorityType === "BOTH") return true;
  return taskScope === estateAuthorityType;
}

/**
 * Filters a task array by authorityScope using fail-closed logic.
 * Returns kept and dropped tasks with reasons.
 * Fail-closed: tasks without authorityScope or with invalid scope are DROPPED.
 */
export function filterTasksByAuthorityScopeCompat<T extends { id: string; authorityScope?: AuthorityScope }>(
  tasks: T[],
  estateAuthorityType: EstateAuthorityType
): { kept: T[]; dropped: { id: string; reason: string }[] } {
  const kept: T[] = [];
  const dropped: { id: string; reason: string }[] = [];

  for (const task of tasks) {
    const taskScope = task.authorityScope;

    if (!taskScope) {
      dropped.push({
        id: task.id,
        reason: `authorityScope is missing (FAIL-CLOSED)`
      });
      continue;
    }

    if (!VALID_SCOPES.has(taskScope)) {
      dropped.push({
        id: task.id,
        reason: `Invalid authorityScope="${taskScope}" (FAIL-CLOSED)`
      });
      continue;
    }

    if (taskScope === "BOTH") {
      kept.push(task);
      continue;
    }

    if (estateAuthorityType === "BOTH") {
      kept.push(task);
      continue;
    }

    if (taskScope === estateAuthorityType) {
      kept.push(task);
      continue;
    }

    dropped.push({
      id: task.id,
      reason: `authorityScope="${taskScope}" does not match estateAuthorityType="${estateAuthorityType}"`
    });
  }

  return { kept, dropped };
}
