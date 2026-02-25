import { Router, Response } from "express";
import { EstateGatingService } from "../services/estateGatingService.js";
import { requireEstateAccess } from "../middleware/estateAuth.js";
import { requireAuthorityStatus, getEstateGateStatus, type GateType } from "../middleware/authorityGating.js";
import { logger } from "../lib/logger.js";
import { z } from "zod";

const router = Router();

/**
 * @route GET /api/estates/:estateId/gates
 * @desc Get all gate statuses for an estate
 * @access Private
 */
router.get("/estates/:estateId/gates", requireEstateAccess, async (req: any, res: Response) => {
    try {
        const { estateId } = req.params;
        const gateStatus = await getEstateGateStatus(estateId);
        res.json(gateStatus);
    } catch (error: any) {
        logger.error("[AuthorityRoutes] Error fetching gate status:", error.message);
        res.status(500).json({ error: "Failed to fetch gate status" });
    }
});

/**
 * @route GET /api/estates/:estateId/gates/resolution
 * @desc Get full gate resolution with details
 * @access Private
 */
router.get("/estates/:estateId/gates/resolution", requireEstateAccess, async (req: any, res: Response) => {
    try {
        const { estateId } = req.params;
        const resolution = await EstateGatingService.getGateResolution(estateId);
        res.json(resolution);
    } catch (error: any) {
        logger.error("[AuthorityRoutes] Error fetching gate resolution:", error.message);
        res.status(500).json({ error: "Failed to fetch gate resolution" });
    }
});

/**
 * @route GET /api/estates/:estateId/authority/summary
 * @desc Get authority summary for an estate
 * @access Private
 */
router.get("/estates/:estateId/authority/summary", requireEstateAccess, async (req: any, res: Response) => {
    try {
        const { estateId } = req.params;
        const summary = await EstateGatingService.getAuthoritySummary(estateId);
        res.json(summary);
    } catch (error: any) {
        logger.error("[AuthorityRoutes] Error fetching authority summary:", error.message);
        res.status(500).json({ error: "Failed to fetch authority summary" });
    }
});

/**
 * @route POST /api/estates/:estateId/operations/check
 * @desc Check if specific operations are allowed
 * @access Private
 */
const checkOperationsSchema = z.object({
    operations: z.array(z.string()).min(1).max(50)
});

router.post("/estates/:estateId/operations/check", requireEstateAccess, async (req: any, res: Response) => {
    try {
        const { estateId } = req.params;
        const { operations } = checkOperationsSchema.parse(req.body);

        const results = await EstateGatingService.validateOperations(estateId, operations);
        res.json({
            estateId,
            results,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: "Validation failed",
                details: error.errors
            });
        }
        logger.error("[AuthorityRoutes] Error checking operations:", error.message);
        res.status(500).json({ error: "Failed to check operations" });
    }
});

/**
 * @route GET /api/estates/:estateId/operations/available
 * @desc Get all available operations for an estate
 * @access Private
 */
router.get("/estates/:estateId/operations/available", requireEstateAccess, async (req: any, res: Response) => {
    try {
        const { estateId } = req.params;
        const operations = await EstateGatingService.getAvailableOperations(estateId);

        const allowed = operations.filter(o => o.allowed);
        const blocked = operations.filter(o => !o.allowed);

        res.json({
            estateId,
            allowed,
            blocked,
            counts: {
                total: operations.length,
                allowed: allowed.length,
                blocked: blocked.length
            }
        });
    } catch (error: any) {
        logger.error("[AuthorityRoutes] Error fetching available operations:", error.message);
        res.status(500).json({ error: "Failed to fetch available operations" });
    }
});

/**
 * @route POST /api/estates/:estateId/operations/:operation/check
 * @desc Check a single operation
 * @access Private
 */
router.post("/estates/:estateId/operations/:operation/check", requireEstateAccess, async (req: any, res: Response) => {
    try {
        const { estateId, operation } = req.params;
        const check = await EstateGatingService.checkOperation(estateId, operation);

        res.json({
            estateId,
            operation,
            allowed: check.allowed,
            message: check.message,
            requiredGates: check.requiredGates,
            blockedGates: check.blockedGates,
            authorityStatus: check.resolution.authorityStatus,
            authorityType: check.resolution.authorityType
        });
    } catch (error: any) {
        logger.error("[AuthorityRoutes] Error checking operation:", error.message);
        res.status(500).json({ error: "Failed to check operation" });
    }
});

/**
 * @route GET /api/estates/:estateId/authority/upgrade-options
 * @desc Get available authority upgrade options
 * @access Private
 */
router.get("/estates/:estateId/authority/upgrade-options", requireEstateAccess, async (req: any, res: Response) => {
    try {
        const { estateId } = req.params;
        const upgradeOptions = await EstateGatingService.canUpgradeAuthority(estateId);
        res.json(upgradeOptions);
    } catch (error: any) {
        logger.error("[AuthorityRoutes] Error fetching upgrade options:", error.message);
        res.status(500).json({ error: "Failed to fetch upgrade options" });
    }
});

/**
 * @route POST /api/estates/:estateId/gates/:gate/verify
 * @desc Verify access to a specific gate (with logging)
 * @access Private
 */
router.post("/estates/:estateId/gates/:gate/verify", requireEstateAccess, async (req: any, res: Response) => {
    try {
        const { estateId, gate } = req.params;
        const userId = req.user.id;

        const resolution = await EstateGatingService.getGateResolution(estateId);
        const gateResult = resolution.gates[gate as GateType];

        if (!gateResult) {
            return res.status(404).json({
                error: "Gate not found",
                availableGates: Object.keys(resolution.gates)
            });
        }

        // Log the access attempt
        await EstateGatingService.logGateAccess(
            estateId,
            userId,
            `verify:${gate}`,
            [gate as GateType],
            gateResult.isOpen,
            { ip: req.ip, userAgent: req.headers["user-agent"] }
        );

        res.json({
            estateId,
            gate,
            allowed: gateResult.isOpen,
            message: gateResult.message,
            currentStatus: gateResult.currentStatus,
            authorityType: gateResult.authorityType
        });
    } catch (error: any) {
        logger.error("[AuthorityRoutes] Error verifying gate:", error.message);
        res.status(500).json({ error: "Failed to verify gate access" });
    }
});

/**
 * @route GET /api/authority/gate-definitions
 * @desc Get all gate definitions (for documentation/UI)
 * @access Private
 */
router.get("/authority/gate-definitions", (req: any, res: Response) => {
    const definitions = EstateGatingService.getGateDefinitions();
    res.json(definitions);
});

/**
 * @route GET /api/authority/enforcement-matrix
 * @desc Get enforcement matrix (for documentation/UI)
 * @access Private
 */
router.get("/authority/enforcement-matrix", (req: any, res: Response) => {
    const matrix = EstateGatingService.getEnforcementMatrix();
    res.json(matrix);
});

/**
 * Protected route examples with middleware
 */

// Asset collection - requires ASSET_COLLECTION gate
router.post(
    "/estates/:estateId/assets/collect",
    requireEstateAccess,
    requireAuthorityStatus({
        operation: "assets:collect",
        customMessage: "Asset collection requires legal authority to be granted"
    }),
    async (req: any, res: Response) => {
        // This would be handled by assetRoutes, this is just an example
        res.json({
            message: "Asset collection endpoint (implement in assetRoutes)",
            gates: req.estateGates
        });
    }
);

// Distribution - requires DISTRIBUTION gate
router.post(
    "/estates/:estateId/distributions/execute",
    requireEstateAccess,
    requireAuthorityStatus({
        operation: "distributions:execute",
        customMessage: "Distributions require granted legal authority"
    }),
    async (req: any, res: Response) => {
        // This would be handled by distribution routes
        res.json({
            message: "Distribution execution endpoint (implement in distributionRoutes)",
            gates: req.estateGates
        });
    }
);

// Real estate sale - requires REAL_ESTATE gate
router.post(
    "/estates/:estateId/realestate/sell",
    requireEstateAccess,
    requireAuthorityStatus({
        operation: "realestate:sell",
        customMessage: "Real estate sales require full probate authority"
    }),
    async (req: any, res: Response) => {
        // This would be handled by asset routes
        res.json({
            message: "Real estate sale endpoint (implement in assetRoutes)",
            gates: req.estateGates
        });
    }
);

export default router;
