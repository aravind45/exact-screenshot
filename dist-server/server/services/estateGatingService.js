import { prisma } from "../db.js";
import { logger } from "../lib/logger.js";
import { resolveEstateGates, checkOperationAllowed, ENFORCEMENT_MATRIX, GATE_DEFINITIONS } from "../middleware/authorityGating.js";
/**
 * Estate Gating Service
 * Provides business logic for authority-based access control
 */
export const EstateGatingService = {
    /**
     * Get full gate resolution for an estate
     */
    async getGateResolution(estateId) {
        return resolveEstateGates(estateId);
    },
    /**
     * Check if a specific operation is allowed
     */
    async checkOperation(estateId, operation) {
        const [check, resolution] = await Promise.all([
            checkOperationAllowed(estateId, operation),
            resolveEstateGates(estateId)
        ]);
        return {
            ...check,
            resolution
        };
    },
    /**
     * Validate multiple operations at once
     */
    async validateOperations(estateId, operations) {
        const results = {};
        for (const operation of operations) {
            const check = await checkOperationAllowed(estateId, operation);
            results[operation] = {
                allowed: check.allowed,
                blockedGates: check.blockedGates,
                message: check.message
            };
        }
        return results;
    },
    /**
     * Get estate authority summary for display
     */
    async getAuthoritySummary(estateId) {
        const resolution = await resolveEstateGates(estateId);
        const estate = await prisma.estate.findUnique({
            where: { id: estateId },
            select: {
                id: true,
                authorityStatus: true,
                authorityType: true,
                probateStatus: true,
                courtCaseNumber: true,
                appointedDate: true
            }
        });
        if (!estate) {
            throw new Error(`Estate not found: ${estateId}`);
        }
        const nextSteps = [];
        // Generate next steps based on current status
        switch (resolution.authorityStatus) {
            case "NOT_STARTED":
                nextSteps.push("Complete estate profile");
                nextSteps.push("Determine appropriate probate path");
                nextSteps.push("Prepare initial filings");
                break;
            case "PENDING_FILING":
                nextSteps.push("File probate petition with court");
                nextSteps.push("Pay filing fees");
                nextSteps.push("Serve notices to interested parties");
                break;
            case "PENDING_HEARING":
                nextSteps.push("Attend court hearing");
                nextSteps.push("Bring required documentation");
                nextSteps.push("Prepare for potential questions from judge");
                break;
            case "PENDING_LETTERS":
                nextSteps.push("Wait for Letters Testamentary/Administration");
                nextSteps.push("Begin preliminary asset inventory");
                break;
            case "GRANTED":
                nextSteps.push("Begin asset collection");
                nextSteps.push("Notify creditors");
                nextSteps.push("Manage estate finances");
                break;
            case "LIMITED_GRANTED":
                nextSteps.push("Execute limited authority within scope");
                nextSteps.push("Consider upgrading to full probate if needed");
                break;
            case "EXPIRED":
                nextSteps.push("Renew authority with court");
                nextSteps.push("File required renewal documents");
                break;
            case "REVOKED":
                nextSteps.push("Consult attorney immediately");
                nextSteps.push("Understand reasons for revocation");
                break;
        }
        return {
            estateId,
            currentPhase: estate.probateStatus || "NOT_STARTED",
            authorityStatus: resolution.authorityStatus,
            authorityType: resolution.authorityType,
            isFullyAuthorized: resolution.isFullyAuthorized,
            canCollectAssets: resolution.gates.ASSET_COLLECTION?.isOpen ?? false,
            canDistribute: resolution.gates.DISTRIBUTION?.isOpen ?? false,
            canHandleCreditors: resolution.gates.CREDITOR_CLAIMS?.isOpen ?? false,
            canSellRealEstate: resolution.gates.REAL_ESTATE?.isOpen ?? false,
            canAccessAccounts: resolution.gates.FINANCIAL_ACCOUNTS?.isOpen ?? false,
            nextSteps
        };
    },
    /**
     * Check if authority can be upgraded based on current state
     */
    async canUpgradeAuthority(estateId) {
        const estate = await prisma.estate.findUnique({
            where: { id: estateId },
            include: {
                assets: true,
                liabilities: true,
                heirs: true
            }
        });
        if (!estate) {
            throw new Error(`Estate not found: ${estateId}`);
        }
        const currentType = (estate.authorityType || "UNSET");
        const possibleUpgrades = [];
        const requirements = {};
        // Calculate total estate value
        const totalValue = estate.assets.reduce((sum, a) => sum + (a.value || 0), 0);
        const hasRealEstate = estate.assets.some(a => a.category === "real_estate");
        const hasDebts = estate.liabilities.length > 0;
        // Small estate affidavit path
        if (["UNSET", "FORMAL_PROBATE", "INFORMAL_PROBATE"].includes(currentType)) {
            const stateRule = await import("../../src/lib/stateRules.js").then(m => m.getStateRule(estate.deceasedState));
            if (totalValue <= stateRule.threshold && !hasRealEstate) {
                possibleUpgrades.push("SMALL_ESTATE");
                requirements["SMALL_ESTATE"] = [
                    `Estate value ($${totalValue}) below threshold ($${stateRule.threshold})`,
                    "No real property"
                ];
            }
        }
        // Full probate path
        if (["UNSET", "SMALL_ESTATE"].includes(currentType)) {
            if (totalValue > 0 || hasRealEstate) {
                possibleUpgrades.push("FORMAL_PROBATE");
                requirements["FORMAL_PROBATE"] = [
                    "Valid will (testate) or intestate proceeding",
                    "Court petition filing",
                    "Notice to interested parties"
                ];
            }
        }
        return {
            canUpgrade: possibleUpgrades.length > 0,
            currentType,
            possibleUpgrades,
            requirements
        };
    },
    /**
     * Log gate access attempt for audit trail
     */
    async logGateAccess(estateId, userId, operation, gates, allowed, metadata) {
        try {
            await prisma.settlementActivity.create({
                data: {
                    estateId,
                    userId,
                    type: "AUTHORITY_GATE",
                    action: allowed ? "ACCESS_GRANTED" : "ACCESS_DENIED",
                    notes: `Operation: ${operation}, Gates: ${gates.join(",")}`,
                    hash: JSON.stringify({
                        operation,
                        gates,
                        allowed,
                        metadata,
                        timestamp: new Date().toISOString()
                    })
                }
            });
        }
        catch (error) {
            logger.error("[EstateGatingService] Failed to log gate access:", error.message);
        }
    },
    /**
     * Batch check gates for multiple estates
     * Useful for dashboard views
     */
    async batchCheckGates(estateIds, gate) {
        const results = {};
        await Promise.all(estateIds.map(async (estateId) => {
            try {
                const resolution = await resolveEstateGates(estateId);
                const gateResult = resolution.gates[gate];
                results[estateId] = {
                    allowed: gateResult?.isOpen ?? false,
                    message: gateResult?.message || "Gate not found"
                };
            }
            catch (error) {
                results[estateId] = {
                    allowed: false,
                    message: error.message
                };
            }
        }));
        return results;
    },
    /**
     * Get all operations available for an estate
     */
    async getAvailableOperations(estateId) {
        const resolution = await resolveEstateGates(estateId);
        const operations = [];
        for (const [operation, requiredGates] of Object.entries(ENFORCEMENT_MATRIX)) {
            const allowed = requiredGates.every(gate => resolution.gates[gate]?.isOpen);
            operations.push({
                operation,
                allowed,
                requiredGates
            });
        }
        return operations.sort((a, b) => {
            if (a.allowed === b.allowed) {
                return a.operation.localeCompare(b.operation);
            }
            return a.allowed ? -1 : 1;
        });
    },
    /**
     * Get gate definitions for documentation
     */
    getGateDefinitions() {
        return GATE_DEFINITIONS;
    },
    /**
     * Get enforcement matrix for documentation
     */
    getEnforcementMatrix() {
        return ENFORCEMENT_MATRIX;
    }
};
