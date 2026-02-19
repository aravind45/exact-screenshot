import { prisma } from "../db.js";
import { logger } from "../lib/logger.js";
const ROLE_HIERARCHY = {
    'OWNER': 40,
    'CO_EXECUTOR': 30,
    'ATTORNEY': 20,
    'VIEWER': 10
};
/**
 * Helper to check if a user has at least the required role for an estate.
 * Handles both the Owner (via Estate.userId) and Grantees (via EstateGrant).
 */
export const checkEstateRole = async (userId, estateId, requiredRole) => {
    // 1. Check if user is the direct Owner
    const estate = await prisma.estate.findUnique({
        where: { id: estateId },
        select: { userId: true }
    });
    if (estate && estate.userId === userId) {
        return true; // Owner has all permissions (level 40)
    }
    // 2. Check for a Grant
    const grant = await prisma.estateGrant.findUnique({
        where: {
            estateId_userId: {
                estateId,
                userId
            }
        },
        select: { role: true }
    });
    if (!grant)
        return false;
    // 3. Compare Levels
    const userLevel = ROLE_HIERARCHY[grant.role] || 0;
    const requiredLevel = ROLE_HIERARCHY[requiredRole];
    return userLevel >= requiredLevel;
};
/**
 * Middleware factory to enforce RBAC on a route.
 * Assumes `req.user` is populated by auth middleware.
 * Looks for estateId in `req.params`, `req.body`, or `req.query`.
 */
export const requireRole = (requiredRole) => {
    return async (req, res, next) => {
        try {
            const userId = req.user?.id;
            if (!userId)
                return res.status(401).json({ error: "Unauthorized" });
            // Determine Estate ID from various possible sources
            // Priority: Params > Body > Query
            let estateId = req.params.estateId || req.body.estateId || req.query.estateId;
            // Special Case: "My Estate" routes (e.g. /my/...) imply the estate owned by the user
            // Use the standard pattern to find the user's primary estate if no ID is explicit
            if (!estateId && (req.path.startsWith('/my') || req.path.includes('/my/'))) {
                const estate = await prisma.estate.findFirst({
                    where: {
                        OR: [
                            { userId: userId },
                            { grants: { some: { userId: userId } } }
                        ]
                    },
                    select: { id: true }
                });
                if (!estate)
                    return res.status(404).json({ error: "Estate not found" });
                estateId = estate.id;
            }
            if (!estateId) {
                return res.status(400).json({ error: "Context Error: Estate ID required for permission check" });
            }
            const hasAccess = await checkEstateRole(userId, estateId, requiredRole);
            if (!hasAccess) {
                return res.status(403).json({
                    error: "Forbidden",
                    message: `You need at least ${requiredRole} permission to perform this action.`
                });
            }
            // Attach resolved estateId to req for convenience
            req.estateId = estateId;
            next();
        }
        catch (error) {
            logger.error("RBAC Check Error:", error);
            res.status(500).json({ error: "Authorization check failed" });
        }
    };
};
