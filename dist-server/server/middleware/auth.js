import { AuthService } from "../services/authService.js";
import { logger } from "../lib/logger.js";
import { prisma } from "../db.js";
export const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];
    logger.debug(`🔒 [AUTH] Attempting ${req.method} ${req.url}`);
    if (!token) {
        logger.debug("❌ [AUTH] No token found");
        return res.status(401).json({ error: "Unauthorized" });
    }
    // Check if token is blacklisted
    try {
        const blacklisted = await prisma.tokenBlacklist.findFirst({
            where: {
                token: token,
                expiresAt: { gt: new Date() }
            }
        });
        if (blacklisted) {
            logger.debug("❌ [AUTH] Token is blacklisted");
            return res.status(401).json({ error: "Token has been revoked" });
        }
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        logger.error("❌ [AUTH] Blacklist check error:", message);
        return res.status(500).json({ error: "Authentication service error" });
    }
    // Verify token
    try {
        const user = await AuthService.verifyToken(token);
        if (!user) {
            logger.debug("❌ [AUTH] verifyToken returned null");
            return res.status(401).json({ error: "Unauthorized" });
        }
        logger.debug(`✅ [AUTH] Success for user: ${user.id}`);
        req.user = user;
        next();
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        logger.error("❌ [AUTH] Middleware error:", message);
        return res.status(500).json({ error: "Authentication service error" });
    }
};
