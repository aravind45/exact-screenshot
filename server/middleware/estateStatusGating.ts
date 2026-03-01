import { Request, Response, NextFunction } from "express";
import { prisma } from "../db.js";
import { logger } from "../lib/logger.js";

/**
 * Estate Status Lifecycle
 * Tracks the progression of an estate through the onboarding and settlement process
 */
export type EstateStatus = "DRAFT" | "MINIMUM_READY" | "ACTIVE" | "CLOSED";

/**
 * Estate Gate Configuration
 * Defines which estate statuses allow access to specific features
 */
export interface EstateGateConfig {
  requiredStatus: EstateStatus;
  blockedStatuses?: EstateStatus[];
  customMessage?: string;
  wizardStep?: string;
}

/**
 * Estate Status Gate Result
 */
export interface EstateStatusGateResult {
  isOpen: boolean;
  currentStatus: EstateStatus;
  requiredStatus: EstateStatus;
  message: string;
  code: string;
  wizardStep?: string;
}

/**
 * Default gate configurations for common use cases
 */
export const ESTATE_GATES = {
  // Roadmap access - requires at least MINIMUM_READY (state + authority selected)
  ROADMAP: {
    requiredStatus: "MINIMUM_READY" as EstateStatus,
    wizardStep: "TRACK_SELECTION",
    customMessage: "Complete estate setup to access the roadmap",
  },
  // Active estate features - requires ACTIVE status
  ACTIVE_FEATURES: {
    requiredStatus: "ACTIVE" as EstateStatus,
    wizardStep: "TRACK_SELECTION",
    customMessage: "Estate authority must be established to access this feature",
  },
  // Full administration - requires ACTIVE status
  FULL_ADMINISTRATION: {
    requiredStatus: "ACTIVE" as EstateStatus,
    wizardStep: "TRACK_SELECTION",
    customMessage: "Complete authority setup to perform this action",
  },
  // Read-only access - any non-DRAFT status
  READ_ONLY: {
    requiredStatus: "MINIMUM_READY" as EstateStatus,
    wizardStep: "TRACK_SELECTION",
    customMessage: "Complete estate setup to view this information",
  },
  // Task completion - requires MINIMUM_READY but with allowlist restrictions
  TASK_COMPLETION: {
    requiredStatus: "MINIMUM_READY" as EstateStatus,
    wizardStep: "TRACK_SELECTION",
    customMessage: "Complete estate setup to mark tasks complete",
  },
};

/**
 * Safe task IDs that can be completed when estate is in MINIMUM_READY status.
 * These are preparatory tasks that don't require legal authority to be established.
 */
export const SAFE_TASK_IDS_FOR_MINIMUM_READY = new Set([
  // Document gathering
  "preliminary_asset_scan",
  "locate_will",
  "locate_docs_no_will",
  // Property securing
  "secure_property",
  "secure_property_2",
  // Notifications (safe preparatory)
  "notify_ssa",
  "cancel_cards",
  "manage_utilities",
  // Preparatory steps that don't require authority
  "obtain_ein_probate",
  // Other safe tasks
  "genealogical_search",
  "check_small_estate",
]);

/**
 * Check if an estate status meets the required gate
 */
export function checkEstateStatusGate(
  currentStatus: EstateStatus,
  requiredStatus: EstateStatus
): boolean {
  const statusHierarchy: Record<EstateStatus, number> = {
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
export async function resolveEstateStatusGate(
  estateId: string,
  config: EstateGateConfig
): Promise<EstateStatusGateResult> {
  const estate: any = await prisma.estate.findUnique({
    where: { id: estateId },
    select: {
      id: true,
      estateStatus: true,
      deceasedState: true,
      userSelectedEstateAuthorityType: true,
      estateAuthorityType: true,
      completenessLevel: true,
    } as any,
  } as any);

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

  // For legacy estates (null estateStatus), we need to check if they're actually set up
  // Only treat as DRAFT if explicitly set to DRAFT, otherwise check other indicators
  const explicitStatus = (estate as any).estateStatus as EstateStatus | null;

  // For legacy estates without estateStatus, check if they have minimum setup
  // TIGHTENED: MINIMUM_READY now requires actual authority type selection,
  // not just completenessLevel fallback (prevents misleading progress on provisional roadmaps)
  const isLegacyEstate = explicitStatus === null;
  const hasMinimumSetup = Boolean(
    estate.deceasedState &&
    (estate.userSelectedEstateAuthorityType || estate.estateAuthorityType)
  );

  // Determine effective current status
  let currentStatus: EstateStatus;
  if (explicitStatus !== null) {
    currentStatus = explicitStatus;
  } else if (isLegacyEstate && hasMinimumSetup) {
    // Legacy estates with minimum setup are treated as MINIMUM_READY
    currentStatus = "MINIMUM_READY";
  } else {
    currentStatus = "DRAFT";
  }

  // Determine if gate is open
  const isOpen = checkEstateStatusGate(currentStatus, config.requiredStatus);

  // Determine appropriate wizard step based on missing requirements
  let wizardStep = config.wizardStep;
  if (!isOpen && !wizardStep) {
    if (!estate.deceasedState) {
      wizardStep = "STATE_SELECTION";
    } else if (!estate.userSelectedEstateAuthorityType) {
      wizardStep = "TRACK_SELECTION";
    } else {
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
export function requireEstateStatus(config: EstateGateConfig) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      let estateId =
        (req as any).estateId ||
        (req as any).params?.estateId ||
        (req as any).params?.id;

      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          error: "Unauthorized",
          message: "Authentication required",
        });
      }

      // Fallback for routes without estateId params (e.g. /api/liabilities, /estates/my/*)
      if (!estateId) {
        const estate = await prisma.estate.findFirst({
          where: {
            OR: [
              { userId },
              { grants: { some: { userId } } }
            ]
          },
          select: { id: true }
        });
        estateId = estate?.id;
      }

      if (!estateId) {
        logger.warn("[EstateStatusGating] No estate found for user during status check", { userId });
        return res.status(409).json({
          error: "Estate setup incomplete",
          code: "INCOMPLETE_ESTATE",
          requiredStep: "TRACK_SELECTION",
        });
      }

      // Check blocked statuses
      if (config.blockedStatuses) {
        const estate: any = await prisma.estate.findUnique({
          where: { id: estateId },
          select: { estateStatus: true },
        } as any);

        // Only block if estateStatus is explicitly set to a blocked status
        // Legacy estates (null estateStatus) should not be blocked by default
        const explicitStatus = (estate as any)?.estateStatus as EstateStatus | null;
        if (explicitStatus !== null && config.blockedStatuses.includes(explicitStatus)) {
          logger.warn(
            `[EstateStatusGating] Blocked access - estate ${estateId} has blocked status: ${explicitStatus}`
          );
          return res.status(409).json({
            error: "Estate Access Blocked",
            code: "ESTATE_BLOCKED",
            currentStatus: explicitStatus,
            message: `This operation is not allowed for estates with status: ${explicitStatus}`,
          });
        }
      }

      // Resolve the gate
      const gateResult = await resolveEstateStatusGate(estateId, config);

      // Attach gate result to request for downstream use
      (req as any).estateGate = gateResult;

      if (!gateResult.isOpen) {
        logger.warn(
          `[EstateStatusGating] Blocked access to estate ${estateId} by user ${userId}. ` +
          `Required: ${config.requiredStatus}, Current: ${gateResult.currentStatus}`
        );
        return res.status(409).json({
          error: gateResult.message,
          code: "INCOMPLETE_ESTATE",
          currentStatus: gateResult.currentStatus,
          requiredStatus: gateResult.requiredStatus,
          requiredStep: gateResult.wizardStep || "TRACK_SELECTION",
        });
      }

      next();
    } catch (error: any) {
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
export function requireMinimumEstate(req: Request, res: Response, next: NextFunction) {
  return requireEstateStatus(ESTATE_GATES.ROADMAP)(req, res, next);
}

/**
 * Middleware to check if estate is ACTIVE (for full features)
 */
export function requireActiveEstate(req: Request, res: Response, next: NextFunction) {
  return requireEstateStatus(ESTATE_GATES.ACTIVE_FEATURES)(req, res, next);
}

/**
 * Middleware to check if estate is not CLOSED (for write operations)
 */
export function requireOpenEstate(req: Request, res: Response, next: NextFunction) {
  return requireEstateStatus({
    requiredStatus: "DRAFT",
    blockedStatuses: ["CLOSED"],
    customMessage: "Cannot modify a closed estate",
  })(req, res, next);
}

/**
 * Middleware factory to check if a task is allowed to be completed given the estate status.
 * For MINIMUM_READY estates, only safe preparatory tasks can be completed.
 * ACTIVE estates can complete any task.
 */
export function requireTaskCompletionAllowed(taskIdParam: string = "taskId") {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const taskId = req.params[taskIdParam];
      const estateGate = (req as any).estateGate;

      if (!estateGate?.isOpen) {
        return res.status(409).json({
          error: "Estate setup incomplete",
          code: "INCOMPLETE_ESTATE",
          requiredStep: estateGate?.wizardStep || "TRACK_SELECTION",
        });
      }

      // If estate is ACTIVE or higher, allow all tasks
      if (checkEstateStatusGate(estateGate.currentStatus, "ACTIVE")) {
        return next();
      }

      // For MINIMUM_READY, only allow safe tasks
      if (estateGate.currentStatus === "MINIMUM_READY") {
        if (!SAFE_TASK_IDS_FOR_MINIMUM_READY.has(taskId)) {
          return res.status(409).json({
            error: "This task requires legal authority to be established",
            code: "AUTHORITY_REQUIRED",
            taskId,
            requiredStep: "AUTHORITY_SETUP",
          });
        }
      }

      next();
    } catch (error: any) {
      logger.error("[requireTaskCompletionAllowed] Middleware error:", error.message);
      return res.status(500).json({
        error: "Internal Server Error",
        message: "Task completion check failed",
      });
    }
  };
}

/**
 * Get estate status for API response helper
 */
export async function getEstateStatus(estateId: string): Promise<{
  status: EstateStatus;
  canAccessRoadmap: boolean;
  canAccessActiveFeatures: boolean;
  nextStep: string | null;
}> {
  const estate: any = await prisma.estate.findUnique({
    where: { id: estateId },
    select: {
      estateStatus: true,
      deceasedState: true,
      userSelectedEstateAuthorityType: true,
      estateAuthorityType: true,
      completenessLevel: true,
    } as any,
  } as any);

  if (!estate) {
    return {
      status: "DRAFT",
      canAccessRoadmap: false,
      canAccessActiveFeatures: false,
      nextStep: "CREATE_ESTATE",
    };
  }

  // For legacy estates, determine status based on setup
  const explicitStatus = (estate as any).estateStatus as EstateStatus | null;
  let status: EstateStatus;

  if (explicitStatus !== null) {
    status = explicitStatus;
  } else {
    // Legacy estate - determine status based on setup
    // TIGHTENED: MINIMUM_READY requires actual authority type selection
    const hasMinimumSetup = Boolean(
      estate.deceasedState &&
      (estate.userSelectedEstateAuthorityType || estate.estateAuthorityType)
    );
    status = hasMinimumSetup ? "MINIMUM_READY" : "DRAFT";
  }

  // Determine next step
  let nextStep: string | null = null;
  if (!estate.deceasedState) {
    nextStep = "STATE_SELECTION";
  } else if (!estate.userSelectedEstateAuthorityType && !estate.estateAuthorityType) {
    nextStep = "TRACK_SELECTION";
  } else if (status === "MINIMUM_READY") {
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
export async function updateEstateStatus(
  estateId: string,
  newStatus: EstateStatus,
  userId: string,
  reason?: string
): Promise<void> {
  const estate = await prisma.estate.update({
    where: { id: estateId },
    data: { estateStatus: newStatus } as any,
  } as any);

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
    oldStatus: (estate as any).estateStatus,
    newStatus,
    reason,
  }, "Estate status updated");
}
