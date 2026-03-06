import { prisma } from "../db.js";
import { logger } from "../lib/logger.js";
/**
 * Default gate configurations for common use cases
 */
export const ESTATE_GATES = {
    // Roadmap access - requires at least MINIMUM_READY (state + authority selected)
    ROADMAP: {
        requiredStatus: "MINIMUM_READY",
        wizardStep: "TRACK_SELECTION",
        customMessage: "Complete estate setup to access the roadmap",
    },
    // Active estate features - requires ACTIVE status
    ACTIVE_FEATURES: {
        requiredStatus: "ACTIVE",
        wizardStep: "AUTHORITY_SETUP",
        customMessage: "Estate authority must be established to access this feature",
    },
    // Full administration - requires ACTIVE status
    FULL_ADMINISTRATION: {
        requiredStatus: "ACTIVE",
        wizardStep: "AUTHORITY_SETUP",
        customMessage: "Complete authority setup to perform this action",
    },
    // Read-only access - any non-DRAFT status
    READ_ONLY: {
        requiredStatus: "MINIMUM_READY",
        wizardStep: "TRACK_SELECTION",
        customMessage: "Complete estate setup to view this information",
    },
};
/**
 * Check if an estate status meets the required gate
 */
export function checkEstateStatusGate(currentStatus, requiredStatus) {
    const statusHierarchy = {
        DRAFT: 0,
        MINIMUM_READY: 1,
        ACTIVE: 2,
        CLOSED: 3,
    };
    return statusHierarchy[currentStatus] >= statusHierarchy[requiredStatus];
}
/**
 * Resolve estate status gate for an estate
 */
export async function resolveEstateStatusGate(estateId, config) {
    const estate = await prisma.estate.findUnique({
        where: { id: estateId },
        select: {
            id: true,
            estateStatus: true,
            deceasedState: true,
            userSelectedEstateAuthorityType: true,
        },
    });
    if (!estate) {
        return {
            isOpen: false,
            currentStatus: "DRAFT",
            requiredStatus: config.requiredStatus,
            message: "Estate not found",
            code: "ESTATE_NOT_FOUND",
            wizardStep: config.wizardStep,
        };
    }
    const currentStatus = estate.estateStatus || "DRAFT";
    const isOpen = checkEstateStatusGate(currentStatus, config.requiredStatus);
    // Determine appropriate wizard step based on missing requirements
    let wizardStep = config.wizardStep;
    if (!isOpen && !wizardStep) {
        if (!estate.deceasedState) {
            wizardStep = "STATE_SELECTION";
        }
        else if (!estate.userSelectedEstateAuthorityType) {
            wizardStep = "TRACK_SELECTION";
        }
        else {
            wizardStep = "AUTHORITY_SETUP";
        }
    }
    return {
        isOpen,
        currentStatus,
        requiredStatus: config.requiredStatus,
        message: isOpen
            ? "Access granted"
            : config.customMessage || `This feature requires estate status: ${config.requiredStatus}`,
        code: isOpen ? "ACCESS_GRANTED" : "INCOMPLETE_ESTATE",
        wizardStep,
    };
}
/**
 * Middleware factory to require a specific estate status
 * Returns 409 with code "INCOMPLETE_ESTATE" when blocked
 */
export function requireEstateStatus(config) {
    return async (req, res, next) => {
        try {
            const estateId = req.estateId ||
                req.params?.estateId ||
                req.params?.id;
            if (!estateId) {
                logger.error("[EstateStatusGating] No estateId found in request");
                return res.status(400).json({
                    error: "Bad Request",
                    message: "Estate ID is required for status check",
                });
            }
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    error: "Unauthorized",
                    message: "Authentication required",
                });
            }
            // Check blocked statuses
            if (config.blockedStatuses) {
                const estate = await prisma.estate.findUnique({
                    where: { id: estateId },
                    select: { estateStatus: true },
                });
                const currentStatus = estate?.estateStatus || "DRAFT";
                if (config.blockedStatuses.includes(currentStatus)) {
                    logger.warn(`[EstateStatusGating] Blocked access - estate ${estateId} has blocked status: ${currentStatus}`);
                    return res.status(409).json({
                        error: "Estate Access Blocked",
                        code: "ESTATE_BLOCKED",
                        currentStatus,
                        message: `This operation is not allowed for estates with status: ${currentStatus}`,
                    });
                }
            }
            // Resolve the gate
            const gateResult = await resolveEstateStatusGate(estateId, config);
            // Attach gate result to request for downstream use
            req.estateGate = gateResult;
            if (!gateResult.isOpen) {
                logger.warn(`[EstateStatusGating] Blocked access to estate ${estateId} by user ${userId}. ` +
                    `Required: ${config.requiredStatus}, Current: ${gateResult.currentStatus}`);
                return res.status(409).json({
                    error: gateResult.message,
                    code: "INCOMPLETE_ESTATE",
                    currentStatus: gateResult.currentStatus,
                    requiredStatus: gateResult.requiredStatus,
                    requiredStep: gateResult.wizardStep,
                });
            }
            next();
        }
        catch (error) {
            logger.error("[EstateStatusGating] Middleware error:", error.message);
            return res.status(500).json({
                error: "Internal Server Error",
                message: "Estate status check failed",
            });
        }
    };
}
/**
 * Middleware to check if estate is at least MINIMUM_READY (for roadmap access)
 */
export function requireMinimumEstate(req, res, next) {
    return requireEstateStatus(ESTATE_GATES.ROADMAP)(req, res, next);
}
/**
 * Middleware to check if estate is ACTIVE (for full features)
 */
export function requireActiveEstate(req, res, next) {
    return requireEstateStatus(ESTATE_GATES.ACTIVE_FEATURES)(req, res, next);
}
/**
 * Middleware to check if estate is not CLOSED (for write operations)
 */
export function requireOpenEstate(req, res, next) {
    return requireEstateStatus({
        requiredStatus: "DRAFT",
        blockedStatuses: ["CLOSED"],
        customMessage: "Cannot modify a closed estate",
    })(req, res, next);
}
/**
 * Get estate status for API response helper
 */
export async function getEstateStatus(estateId) {
    const estate = await prisma.estate.findUnique({
        where: { id: estateId },
        select: {
            estateStatus: true,
            deceasedState: true,
            userSelectedEstateAuthorityType: true,
        },
    });
    if (!estate) {
        return {
            status: "DRAFT",
            canAccessRoadmap: false,
            canAccessActiveFeatures: false,
            nextStep: "CREATE_ESTATE",
        };
    }
    const status = estate.estateStatus || "DRAFT";
    // Determine next step
    let nextStep = null;
    if (!estate.deceasedState) {
        nextStep = "STATE_SELECTION";
    }
    else if (!estate.userSelectedEstateAuthorityType) {
        nextStep = "TRACK_SELECTION";
    }
    else if (status === "MINIMUM_READY") {
        nextStep = "AUTHORITY_SETUP";
    }
    return {
        status,
        canAccessRoadmap: checkEstateStatusGate(status, "MINIMUM_READY"),
        canAccessActiveFeatures: checkEstateStatusGate(status, "ACTIVE"),
        nextStep,
    };
}
/**
 * Update estate status helper
 */
export async function updateEstateStatus(estateId, newStatus, userId, reason) {
    const estate = await prisma.estate.update({
        where: { id: estateId },
        data: { estateStatus: newStatus },
    });
    // Log the status change
    await prisma.settlementActivity.create({
        data: {
            estateId,
            userId,
            type: "STATUS_CHANGE",
            action: "UPDATED",
            notes: `Estate status changed to ${newStatus}${reason ? `: ${reason}` : ""}`,
        },
    });
    logger.info({
        estateId,
        userId,
        oldStatus: estate.estateStatus,
        newStatus,
        reason,
    }, "Estate status updated");
}
