import { AuthService } from "../services/authService.js";
import { logger } from "../lib/logger.js";
export const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];
    logger.debug(`🔒 [AUTH] Attempting ${req.method} ${req.url}`);
    if (!token) {
        logger.debug("❌ [AUTH] No token found");
        return res.status(401).json({ error: "Unauthorized" });
    }
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
        logger.error("❌ [AUTH] Middleware error:", err.message);
        return res.status(500).json({ error: "Authentication service error" });
    }
};
