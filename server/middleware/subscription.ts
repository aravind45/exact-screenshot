import { Request, Response, NextFunction } from "express";
import { prisma } from "../db.js";
import { logger } from "../lib/logger.js";

/**
 * Middleware to enforce subscription status on sensitive API routes.
 * Exempts Admins and Alpha users.
 *
 * FIDUCIARY-SAFE POLICY (added after executor-role audit, 2026-07):
 * An executor's deadlines are legal obligations that do not pause when a
 * subscription lapses. We therefore NEVER hard-lock an expired user out of
 * their own data:
 *   - Safe/read methods (GET, HEAD, OPTIONS) always pass — the executor can
 *     always SEE and EXPORT what they entered.
 *   - Only mutating methods (POST/PUT/PATCH/DELETE) require an active
 *     subscription or valid trial.
 * This module exports:
 *   - requireSubscription        → full access (admin/alpha/active/trial/pilot)
 *   - requireSubscriptionForWrite→ write access; expired users get 402 with a
 *                                  clear "read-only mode" message
 */
const TRIAL_DAYS = 15;

interface SubFlags {
    isAdmin: boolean;
    isAlphaUser: boolean;
    isActive: boolean;
    isTrialing: boolean;
    isPilot: boolean;
}

async function loadFlags(userId: string): Promise<SubFlags | null> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            subscriptionStatus: true,
            fullName: true,
            role: true,
            email: true,
            trialStartedAt: true,
            isPilot: true,
        },
    });
    if (!user) return null;

    const isAlphaUser = user.fullName?.includes("(Alpha)") || user.email?.endsWith("@expectedestate.com");
    const isAdmin = user.role === "ADMIN";
    const isActive = user.subscriptionStatus === "ACTIVE";
    const isPilot = user.isPilot === true;
    const isTrialing = user.trialStartedAt
        ? Date.now() - new Date(user.trialStartedAt).getTime() < TRIAL_DAYS * 24 * 60 * 60 * 1000
        : false;

    return { isAdmin, isAlphaUser, isActive, isTrialing, isPilot };
}

const fullAccess = (f: SubFlags) => f.isAdmin || f.isAlphaUser || f.isActive || f.isTrialing || f.isPilot;

/**
 * Full-access gate: admin / alpha / active / trialing / pilot.
 * Use for premium-only features (form generation, letters, advisor booking).
 */
export const requireSubscription = async (req: any, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const flags = await loadFlags(userId);
        if (!flags) return res.status(401).json({ error: "User not found" });

        if (!fullAccess(flags)) {
            return res.status(402).json({
                error: "Subscription Required",
                code: "SUBSCRIPTION_REQUIRED",
                message: "This feature requires an active premium subscription or a valid 15-day trial.",
            });
        }

        next();
    } catch (error: any) {
        logger.error("Subscription Check Error:", error.message);
        res.status(500).json({ error: "Internal server error during subscription check" });
    }
};

/**
 * Fiduciary-safe write gate for core estate data routes (assets, heirs,
 * liabilities, roadmap, documents). Expired users keep full read + export
 * access forever; only writes require a subscription.
 */
export const requireSubscriptionForWrite = async (req: any, res: Response, next: NextFunction) => {
    try {
        // Safe methods always pass — an executor can always see/export their data.
        if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
            return next();
        }

        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const flags = await loadFlags(userId);
        if (!flags) return res.status(401).json({ error: "User not found" });

        if (!fullAccess(flags)) {
            return res.status(402).json({
                error: "Subscription Required",
                code: "SUBSCRIPTION_READ_ONLY",
                message: "Your trial has ended, so the account is in read-only mode. All your data remains fully visible and exportable. Upgrade to continue editing.",
            });
        }

        next();
    } catch (error: any) {
        logger.error("Subscription Write-Check Error:", error.message);
        res.status(500).json({ error: "Internal server error during subscription check" });
    }
};
