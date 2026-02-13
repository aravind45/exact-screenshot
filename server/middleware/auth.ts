import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/authService.js";
import { logger } from "../lib/logger.js";

export const authenticate = async (req: Request | any, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    logger.debug(`🔒 [AUTH] Attempting ${req.method} ${req.url}`);
    if (!token) {
        logger.debug("❌ [AUTH] No token found");
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const user = await AuthService.verifyToken(token as string);
        if (!user) {
            logger.debug("❌ [AUTH] verifyToken returned null");
            return res.status(401).json({ error: "Unauthorized" });
        }

        logger.debug(`✅ [AUTH] Success for user: ${user.id}`);
        req.user = user;
        next();
    } catch (err: any) {
        logger.error("❌ [AUTH] Middleware error:", err.message);
        return res.status(500).json({ error: "Authentication service error" });
    }
};
