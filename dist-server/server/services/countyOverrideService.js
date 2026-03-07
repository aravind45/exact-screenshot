import { prisma as db } from "../db.js";
import { logger } from "../lib/logger.js";
// Cache for table existence check to avoid repeated queries
let tableExistsCache = null;
/**
 * Check if the county_overrides table exists in the database.
 * This handles cases where migrations haven't been applied yet.
 */
async function tableExists() {
    // Unit tests often mock prisma without $queryRaw. In that case,
    // allow query execution and rely on mocked delegate behavior.
    if (typeof db.$queryRaw !== "function") {
        tableExistsCache = true;
        return true;
    }
    if (tableExistsCache !== null) {
        return tableExistsCache;
    }
    try {
        const result = await db.$queryRaw `
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'county_overrides'
            ) as exists
        `;
        tableExistsCache = result[0]?.exists ?? false;
        return tableExistsCache;
    }
    catch (error) {
        // If we can't check, assume table doesn't exist
        logger.debug({ error }, "Could not check if county_overrides table exists");
        return false;
    }
}
/**
 * Safely execute a query against county_overrides table.
 * Returns null if the table doesn't exist or any error occurs.
 */
async function safeQuery(queryFn) {
    try {
        // First check if table exists
        if (!(await tableExists())) {
            return null;
        }
        return await queryFn();
    }
    catch (error) {
        // Catch ALL error types including:
        // - Prisma validation errors (model not in client)
        // - Database errors (table doesn't exist)
        // - Query errors
        // Log at debug level since this is expected before migrations
        logger.debug({ error }, "County overrides query failed - table may not exist yet");
        // Reset cache so we check again next time
        tableExistsCache = null;
        return null;
    }
}
/**
 * CountyOverrideService
 *
 * Handles whitelisted, data-only overrides for tasks based on county.
 * Prevents complex procedural logic from leaking into the database.
 *
 * This service is designed to be fail-safe: if the county_overrides table
 * doesn't exist (e.g., before migrations are applied), it will silently
 * return default values.
 */
export class CountyOverrideService {
    /**
     * Applies county-level overrides to a list of tasks for a specific state and county.
     * This handles whitelisted fields only: title, description, feeAmount, etc.
     * Returns original tasks if the table doesn't exist or any error occurs.
     */
    static async applyOverrides(stateCode, countyName, tasks) {
        if (!countyName || countyName.trim() === "")
            return tasks;
        const overrides = await safeQuery(() => db.countyOverride.findMany({
            where: {
                stateCode,
                status: "APPROVED",
                countyName: {
                    equals: countyName,
                    mode: "insensitive"
                },
                taskId: {
                    in: tasks.map(t => t.id)
                }
            }
        }));
        if (!overrides || overrides.length === 0)
            return tasks;
        const overrideMap = new Map(overrides.map(o => [o.taskId, o]));
        // Apply whitelisted patches
        return tasks.map(task => {
            const patch = overrideMap.get(task.id);
            if (!patch)
                return task;
            logger.info({ taskId: task.id, county: countyName }, "Applying county override");
            // Merge only whitelisted fields
            return {
                ...task,
                title: patch.title || task.title,
                description: patch.description || task.description,
                // Promote approved county actions/forms into canonical task fields
                // so downstream action handlers and confidence audits see them.
                primaryActionUrl: patch.primaryActionUrl || task.primaryActionUrl,
                formNames: patch.formNames.length > 0 ? patch.formNames : task.formNames,
                // We attach metadata that the roadmap UI can use for fees/forms
                countyMetadata: {
                    feeAmount: patch.feeAmount ? Number(patch.feeAmount) : undefined,
                    primaryActionUrl: patch.primaryActionUrl || undefined,
                    formNames: patch.formNames.length > 0 ? patch.formNames : undefined,
                    attachments: patch.attachments || undefined,
                    appliedAt: new Date().toISOString()
                }
            };
        });
    }
    /**
     * Generates a hash of the current county overrides for pinning.
     * Returns null if the table doesn't exist or any error occurs.
     */
    static async getOverrideHash(stateCode, countyName) {
        if (!countyName || countyName.trim() === "")
            return null;
        const overrides = await safeQuery(() => db.countyOverride.findMany({
            where: { stateCode, countyName, status: "APPROVED" },
            orderBy: { taskId: "asc" },
            select: { taskId: true, updatedAt: true }
        }));
        if (!overrides)
            return null;
        if (overrides.length === 0)
            return "none";
        const signature = overrides.map(o => `${o.taskId}:${o.updatedAt.getTime()}`).join('|');
        // Simple string-based hash for comparison
        return Buffer.from(signature).toString('base64').substring(0, 32);
    }
}
