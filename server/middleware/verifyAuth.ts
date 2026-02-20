import { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger.js";
import { prisma } from "../db.js";

/**
 * Middleware to restrict access to users who haven't verified their email.
 * Early adopters who already have an estate are auto-verified (they predate
 * the email verification requirement).
 */
export const requireVerification = async (req: any, res: Response, next: NextFunction) => {
    // Skip verification check if user is not logged in
    if (!req.user) {
        return next();
    }

    // Already verified — allow through
    if (req.user.emailVerifiedAt) {
        return next();
    }

    /* 
    // Legacy / early adopter: if the user has an estate, auto-verify them now
    // so they aren't locked out by the email verification requirement that was
    // added after they registered.
    try {
        const estate = await prisma.estate.findFirst({
            where: {
                OR: [
                    { userId: req.user.id },
                    { grants: { some: { userId: req.user.id } } }
                ]
            },
            select: { id: true }
        });

        if (estate) {
            logger.info(`[Auth] Auto-verifying legacy user ${req.user.id} (${req.user.email}) — has estate, predates email verification.`);
            await prisma.user.update({
                where: { id: req.user.id },
                data: { emailVerifiedAt: new Date() }
            });
            return next();
        }
    } catch (err) {
        logger.error(`[Auth] Error during legacy verification check for user ${req.user.id}:`, err);
        // Fall through to require verification normally
    }
    */

    logger.warn(`[Auth] Blocked unverified user ${req.user.id} from sensitive feature: ${req.originalUrl}`);
    return res.status(403).json({
        error: "UNVERIFIED_EMAIL",
        message: "Please verify your email address to access this feature."
    });
};
