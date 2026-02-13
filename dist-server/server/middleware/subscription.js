import { prisma } from "../db.js";
import { logger } from "../lib/logger.js";
/**
 * Middleware to enforce subscription status on sensitive API routes.
 * Exempts Admins and Alpha users.
 */
export const requireSubscription = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ error: "Unauthorized" });
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                subscriptionStatus: true,
                fullName: true,
                role: true,
                email: true,
                trialStartedAt: true
            }
        });
        if (!user)
            return res.status(401).json({ error: "User not found" });
        // Logic sync with SubscriptionGuard.tsx
        const isAlphaUser = user.fullName?.includes("(Alpha)") || user.email?.endsWith("@expectedestate.com");
        const isAdmin = user.role === 'ADMIN';
        const isActive = user.subscriptionStatus === 'ACTIVE';
        // 7-Day Trial Logic
        const TRIAL_DAYS = 7;
        const isTrialing = user.trialStartedAt
            ? (new Date().getTime() - new Date(user.trialStartedAt).getTime() < TRIAL_DAYS * 24 * 60 * 60 * 1000)
            : false;
        const canAccess = isAdmin || isAlphaUser || isActive || isTrialing;
        if (!canAccess) {
            return res.status(403).json({
                error: "Subscription Required",
                message: "This feature requires an active premium subscription or a valid 7-day trial."
            });
        }
        next();
    }
    catch (error) {
        logger.error("Subscription Check Error:", error.message);
        res.status(500).json({ error: "Internal server error during subscription check" });
    }
};
