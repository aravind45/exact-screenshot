import { prisma as db } from "../db.js";
import { PhaseTask } from "../../src/config/settlementPhases.js";
import { logger } from "../lib/logger.js";

/**
 * CountyOverrideService
 * 
 * Handles whitelisted, data-only overrides for tasks based on county.
 * Prevents complex procedural logic from leaking into the database.
 */
export class CountyOverrideService {
    /**
     * Applies county-level overrides to a list of tasks for a specific state and county.
     * This handles whitelisted fields only: title, description, feeAmount, etc.
     */
    static async applyOverrides(
        stateCode: string,
        countyName: string,
        tasks: PhaseTask[]
    ): Promise<PhaseTask[]> {
        if (!countyName || countyName.trim() === "") return tasks;

        let overrides: Awaited<ReturnType<typeof db.countyOverride.findMany>> = [];

        try {
            // 1. Fetch all overrides for this county in one query
            overrides = await db.countyOverride.findMany({
                where: {
                    stateCode,
                    countyName: {
                        equals: countyName,
                        mode: "insensitive"
                    },
                    taskId: {
                        in: tasks.map(t => t.id)
                    }
                }
            });
        } catch (error: unknown) {
            logger.error(
                { error, stateCode, countyName },
                "County override lookup failed"
            );
            return tasks;
        }

        if (overrides.length === 0) return tasks;

        const overrideMap = new Map(overrides.map(o => [o.taskId, o]));

        // 2. Apply whitelisted patches
        return tasks.map(task => {
            const patch = overrideMap.get(task.id);
            if (!patch) return task;

            logger.info({ taskId: task.id, county: countyName }, "Applying county override");

            // Merge only whitelisted fields
            return {
                ...task,
                title: patch.title || task.title,
                description: patch.description || task.description,
                // We attach metadata that the roadmap UI can use for fees/forms
                countyMetadata: {
                    feeAmount: patch.feeAmount ? Number(patch.feeAmount) : undefined,
                    primaryActionUrl: patch.primaryActionUrl || undefined,
                    formNames: patch.formNames.length > 0 ? patch.formNames : undefined,
                    attachments: (patch.attachments as any) || undefined,
                    appliedAt: new Date().toISOString()
                }
            };
        });
    }

    /**
     * Generates a hash of the current county overrides for pinning.
     */
    static async getOverrideHash(stateCode: string, countyName: string): Promise<string | null> {
        if (!countyName || countyName.trim() === "") return null;

        let overrides: Array<{ taskId: string; updatedAt: Date }> = [];

        try {
            overrides = await db.countyOverride.findMany({
                where: { stateCode, countyName },
                orderBy: { taskId: "asc" },
                select: { taskId: true, updatedAt: true }
            });
        } catch (error: unknown) {
            logger.error(
                { error, stateCode, countyName },
                "Failed to get county override hash"
            );
            return null;
        }

        if (overrides.length === 0) return "none";

        const signature = overrides.map(o => `${o.taskId}:${o.updatedAt.getTime()}`).join("|");
        // Simple string-based hash for comparison
        return Buffer.from(signature).toString("base64").substring(0, 32);
    }
}
