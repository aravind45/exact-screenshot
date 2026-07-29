import { Router, Request, Response } from "express";
import crypto from "crypto";
import { prisma } from "../db.js";
import { logger } from "../lib/logger.js";
import { getEstateRoadmap } from "../services/roadmapService.js";

/**
 * PUBLIC ESTATE STATUS — the "family update link".
 *
 * Executors' #1 real-world pain is relatives asking "where's the money?".
 * This route powers a read-only, shareable status page that answers that
 * question without giving the family an account — and without exposing
 * anything sensitive.
 *
 * Security model:
 *  - The URL carries an HMAC-SHA256 token of the estate ID. Anyone with the
 *    link can view; the link cannot be guessed or forged for other estates.
 *  - The payload is deliberately minimal: a first name + last initial, the
 *    current phase, percent complete, and the next milestone. NO asset
 *    values, NO heir names, NO SSN, NO addresses, NO court case numbers.
 */

const router = Router();

const getStatusSecret = (): string => {
    const secret =
        process.env.STATUS_LINK_SECRET ||
        process.env.ENCRYPTION_KEY ||
        process.env.JWT_SECRET;
    if (!secret) throw new Error("No secret configured for status links");
    return secret;
};

export function generateStatusToken(estateId: string): string {
    return crypto
        .createHmac("sha256", getStatusSecret())
        .update(`estate-status:${estateId}`)
        .digest("hex");
}

function isValidStatusToken(estateId: string, token: string): boolean {
    const expected = generateStatusToken(estateId);
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(String(token || ""), "utf8");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * GET /api/public/estate-status/:estateId/:token
 * Unauthenticated, token-guarded, heavily sanitized estate progress.
 */
router.get("/estate-status/:estateId/:token", async (req: Request, res: Response) => {
    try {
        const estateId = String(req.params.estateId || "");
        const token = String(req.params.token || "");

        let valid = false;
        try {
            valid = isValidStatusToken(estateId, token);
        } catch {
            valid = false;
        }
        if (!valid) {
            return res.status(404).json({ error: "Status page not found" });
        }

        const estate = await prisma.estate.findUnique({
            where: { id: estateId },
            select: {
                id: true,
                deceasedFirstName: true,
                deceasedLastName: true,
                deceasedState: true,
                estateStatus: true,
                roadmapProgress: true,
                updatedAt: true,
            },
        });
        if (!estate) {
            return res.status(404).json({ error: "Status page not found" });
        }

        const completedTaskIds: string[] =
            ((estate.roadmapProgress as any)?.completedTaskIds as string[]) || [];

        // Canonical roadmap (same source the executor's dashboard uses)
        let phases: { title: string; tasks: { id: string; title: string }[] }[] = [];
        try {
            const roadmap = await getEstateRoadmap(estate.id);
            phases = roadmap.phases.map(p => ({
                title: p.title,
                tasks: p.tasks.map(t => ({ id: t.id, title: t.title })),
            }));
        } catch (error: any) {
            logger.warn(`[PublicStatus] Roadmap unavailable for ${estate.id}: ${error.message}`);
        }

        const totalTasks = phases.reduce((n, p) => n + p.tasks.length, 0);
        const completedCount = Math.min(completedTaskIds.length, totalTasks || completedTaskIds.length);
        const percentComplete = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

        const currentPhase = phases.find(p => p.tasks.some(t => !completedTaskIds.includes(t.id)));
        const nextTask = currentPhase?.tasks.find(t => !completedTaskIds.includes(t.id));
        const isComplete = totalTasks > 0 && !currentPhase;

        const lastInitial = estate.deceasedLastName ? `${estate.deceasedLastName.charAt(0).toUpperCase()}.` : "";

        res.json({
            estateLabel: `${estate.deceasedFirstName || "The"} ${lastInitial}`.trim(),
            percentComplete,
            completedTasks: completedCount,
            totalTasks,
            currentPhaseTitle: isComplete ? "Settlement complete" : currentPhase?.title || "Getting organized",
            nextMilestone: isComplete ? null : nextTask?.title || null,
            isComplete,
            updatedAt: estate.updatedAt,
        });
    } catch (error: any) {
        logger.error("[PublicStatus] Error:", error.message);
        res.status(500).json({ error: "Could not load estate status" });
    }
});

export default router;
