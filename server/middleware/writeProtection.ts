import { Response, NextFunction } from "express";
import { prisma } from "../db.js";
import { logger } from "../lib/logger.js";
import { checkEstateRole } from "./rbac.js";

/**
 * ─────────────────────────────────────────────────────────────────────────
 * WRITE PROTECTION — closes the privilege-escalation hole found in the
 * heir-role audit (2026-07).
 *
 * Problem: `requireEstateAccess` passes at VIEWER level and
 * `requireAuthorityStatus` checks ESTATE state only — never the requesting
 * user's role. Result: an invited heir (VIEWER) could PUT/DELETE assets,
 * corrupting the inventory the executor is personally liable for.
 *
 * Fix: every mutating route must also pass requireWriteAccess(), which
 * requires ATTORNEY-level (20) or higher on the estate. VIEWER = read-only.
 * ─────────────────────────────────────────────────────────────────────────
 */

const MIN_WRITE_ROLE: Parameters<typeof checkEstateRole>[2] = "ATTORNEY";

/** Resolve the estate for asset-scoped routes where the param is a record ID. */
async function resolveEstateId(req: any): Promise<string | null> {
    // 1. Already resolved upstream
    if (req.estateId) return req.estateId;

    // 2. Explicit estateId in params/body/query
    const explicit = req.params.estateId || req.body?.estateId || req.query?.estateId;
    if (explicit) return explicit;

    // 3. "My estate" routes: /my or paths containing /my/ imply the user's
    // primary estate (owned or granted — the grant's role is checked later)
    const fullPath: string = req.baseUrl + req.path;
    if (fullPath.includes("/my")) {
        const estate = await prisma.estate.findFirst({
            where: {
                OR: [
                    { userId: req.user.id },
                    { grants: { some: { userId: req.user.id } } },
                ],
            },
            select: { id: true },
        });
        if (estate) return estate.id;
    }

    // 4. Record-scoped routes: /:id where :id is an asset / liability / heir / document
    const recordId = req.params.id;
    if (!recordId) return null;

    const path: string = fullPath;

    try {
        if (path.includes("/assets")) {
            const a = await prisma.asset.findUnique({ where: { id: recordId }, select: { estateId: true } });
            return a?.estateId ?? null;
        }
        if (path.includes("/liabilities")) {
            const l = await prisma.liability.findUnique({ where: { id: recordId }, select: { estateId: true } });
            return l?.estateId ?? null;
        }
        if (path.includes("/heirs")) {
            const h = await prisma.heir.findUnique({ where: { id: recordId }, select: { estateId: true } });
            return h?.estateId ?? null;
        }
    } catch (e) {
        logger.warn("[WriteProtection] Failed to resolve estateId from record:", e);
        return null;
    }

    return null;
}

/**
 * Middleware: require ATTORNEY-level (or higher) estate role for mutations.
 * VIEWER grants (invited heirs) are read-only — this is the actual boundary
 * the "Beneficiary View" UI badge always implied.
 */
export const requireWriteAccess = async (req: any, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const estateId = await resolveEstateId(req);
        if (!estateId) {
            logger.warn(`[WriteProtection] Could not resolve estate for ${req.method} ${req.baseUrl}${req.path} (user ${userId})`);
            return res.status(400).json({ error: "Bad Request", message: "Could not determine estate context for permission check" });
        }

        const canWrite = await checkEstateRole(userId, estateId, MIN_WRITE_ROLE);

        if (!canWrite) {
            logger.warn(`⛔ [WriteProtection] Read-only user ${userId} attempted ${req.method} on estate ${estateId} (${req.baseUrl}${req.path})`);
            return res.status(403).json({
                error: "Forbidden",
                message: "You have read-only access to this estate. Only the executor can make changes."
            });
        }

        req.estateId = estateId;
        next();
    } catch (error: any) {
        logger.error("Write Protection Error:", error.message);
        res.status(500).json({ error: "Authorization check failed" });
    }
};
