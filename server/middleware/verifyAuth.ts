import { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger.js";

/**
 * Middleware to restrict access to users who haven't verified their email.
 */
export const requireVerification = (req: any, res: Response, next: NextFunction) => {
    // Skip verification check if user is not logged in (should be handled by authenticate middleware)
    if (!req.user) {
        return next();
    }

    // Check if the user has a verification date
    if (!req.user.emailVerifiedAt) {
        logger.warn(`[Auth] Blocked unverified user ${req.user.id} from sensitive feature: ${req.originalUrl}`);
        return res.status(403).json({
            error: "UNVERIFIED_EMAIL",
            message: "Please verify your email address to access this feature."
        });
    }

    next();
};
