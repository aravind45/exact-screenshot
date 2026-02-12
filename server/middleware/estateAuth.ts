import { Response, NextFunction } from "express";
import { checkEstateRole } from "./rbac.js";
import { logger } from "../lib/logger.js";

/**
 * Middleware to enforce that the authenticated user has access to the requested estate.
 * This effectively prevents IDOR on /:estateId routes.
 * 
 * It requires 'VIEWER' access (minimum level) to pass.
 */
export const requireEstateAccess = async (req: any, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        // strictly look for estateId in params for these specific routes
        const estateId = req.params.estateId;

        if (!estateId) {
            // If middleware is applied to a route without :estateId, it's a dev error configuration
            logger.error("Context Error: requireEstateAccess applied to route without :estateId param");
            return res.status(500).json({ error: "Server Configuration Error" });
        }

        // Check if user has at least VIEWER scope (which covers Owner, Executor, Attorney, Viewer)
        const hasAccess = await checkEstateRole(userId, estateId, 'VIEWER');

        if (!hasAccess) {
            logger.warn(`⛔ [AUTH] IDOR Attempt blocked? User ${userId} tried to access Estate ${estateId}`);
            return res.status(403).json({ error: "Forbidden", message: "You do not have access to this estate." });
        }

        // Attach resolved estateId to req for convenience
        req.estateId = estateId;
        next();
    } catch (error: any) {
        logger.error("Estate Auth Error:", error.message);
        res.status(500).json({ error: "Authorization check failed" });
    }
};
