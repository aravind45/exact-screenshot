import { Request, Response, NextFunction } from "express";
import { prisma } from "../db.js";
import { logger } from "../lib/logger.js";

/**
 * Authority Status Lifecycle
 * Tracks the progression of legal authority for an estate
 */
export type AuthorityStatus =
    | "NOT_STARTED"      // Initial state, no authority established
    | "PENDING_FILING"   // Forms prepared, waiting for court filing
    | "PENDING_HEARING"  // Filed, waiting for court hearing
    | "PENDING_LETTERS"  // Granted, waiting for Letters issuance
    | "GRANTED"          // Full legal authority established
    | "LIMITED_GRANTED"  // Limited authority (e.g., small estate affidavit)
    | "EXPIRED"          // Authority has expired
    | "REVOKED";         // Authority revoked by court

/**
 * Authority Types
 * Defines the legal mechanism for estate administration
 */
export type AuthorityType =
    | "UNSET"
    | "FORMAL_PROBATE"
    | "INFORMAL_PROBATE"
    | "SMALL_ESTATE"
    | "SUMMARY_ADMINISTRATION"
    | "VOLUNTARY_ADMINISTRATION"
    | "MUNIMENT_OF_TITLE"
    | "ANCILLARY_PROBATE"
    | "SPOUSAL_PETITION"
    | "TRUST_ADMIN_REVOCABLE"
    | "TRUST_ADMIN_IRREVOCABLE"
    | "POD_TOD_TRANSFER"
    | "JOINT_TRANSFER"
    | "BENEFICIARY_DESIGNATED"
    | "TOD_DEED"
    | "INTESTATE"
    | "INSOLVENT_ESTATE"
    | "CONTESTED_ESTATE";

/**
 * Gate Types
 * Defines functional areas that require specific authority levels
 */
export type GateType =
    | "ASSET_COLLECTION"      // Collecting/marshaling estate assets
    | "ASSET_INVENTORY"       // Creating estate inventory
    | "CREDITOR_CLAIMS"       // Handling creditor claims
    | "DISTRIBUTION"          // Distributing assets to beneficiaries
    | "REAL_ESTATE"           // Selling/transferring real property
    | "FINANCIAL_ACCOUNTS"    // Accessing financial accounts
    | "LEGAL_ACTIONS"         // Taking legal actions on behalf of estate
    | "TAX_FILING"            // Filing estate tax returns
    | "FULL_ADMINISTRATION";  // Complete estate administration authority

/**
 * Gate Definition
 * Defines requirements for a specific functional gate
 */
export interface GateDefinition {
    gateType: GateType;
    requiredStatus: AuthorityStatus[];
    excludedTypes?: AuthorityType[];  // Authority types that cannot use this gate
    requiredTypes?: AuthorityType[];  // Authority types that specifically allow this gate
    description: string;
    warningMessage: string;
}

/**
 * Gate Check Result
 */
export interface GateCheckResult {
    gateType: GateType;
    isOpen: boolean;
    currentStatus: AuthorityStatus;
    authorityType: AuthorityType;
    requiredStatuses: AuthorityStatus[];
    message: string;
    canProceed: boolean;
}

/**
 * Estate Gates Resolution
 * Contains all gate checks for an estate
 */
export interface EstateGatesResolution {
    estateId: string;
    authorityStatus: AuthorityStatus;
    authorityType: AuthorityType;
    isFullyAuthorized: boolean;
    gates: Record<GateType, GateCheckResult>;
    openGates: GateType[];
    closedGates: GateType[];
    timestamp: Date;
}

/**
 * Enforcement Matrix
 * Defines which gates are required for specific operations
 */
export const ENFORCEMENT_MATRIX: Record<string, GateType[]> = {
    // Asset operations
    "assets:create": ["ASSET_INVENTORY"],
    "assets:update": ["ASSET_INVENTORY"],
    "assets:delete": ["ASSET_INVENTORY"],
    "assets:collect": ["ASSET_COLLECTION"],
    "assets:transfer": ["ASSET_COLLECTION", "FULL_ADMINISTRATION"],
    "assets:liquidate": ["ASSET_COLLECTION", "FULL_ADMINISTRATION"],

    // Financial operations
    "accounts:access": ["FINANCIAL_ACCOUNTS"],
    "accounts:withdraw": ["FINANCIAL_ACCOUNTS", "FULL_ADMINISTRATION"],
    "accounts:close": ["FINANCIAL_ACCOUNTS", "FULL_ADMINISTRATION"],

    // Real estate operations
    "realestate:sell": ["REAL_ESTATE", "FULL_ADMINISTRATION"],
    "realestate:transfer": ["REAL_ESTATE", "FULL_ADMINISTRATION"],
    "realestate:mortgage": ["REAL_ESTATE", "FULL_ADMINISTRATION"],

    // Creditor operations
    "creditors:pay": ["CREDITOR_CLAIMS", "FULL_ADMINISTRATION"],
    "creditors:reject": ["CREDITOR_CLAIMS", "FULL_ADMINISTRATION"],
    "creditors:settle": ["CREDITOR_CLAIMS", "FULL_ADMINISTRATION"],

    // Distribution operations
    "distributions:create": ["DISTRIBUTION"],
    "distributions:execute": ["DISTRIBUTION", "FULL_ADMINISTRATION"],
    "distributions:finalize": ["DISTRIBUTION", "FULL_ADMINISTRATION"],

    // Legal operations
    "legal:sue": ["LEGAL_ACTIONS", "FULL_ADMINISTRATION"],
    "legal:settle": ["LEGAL_ACTIONS", "FULL_ADMINISTRATION"],
    "legal:contract": ["LEGAL_ACTIONS", "FULL_ADMINISTRATION"],

    // Tax operations
    "tax:file": ["TAX_FILING"],
    "tax:pay": ["TAX_FILING", "FULL_ADMINISTRATION"],

    // Administrative operations
    "estate:close": ["FULL_ADMINISTRATION"],
    "estate:amend": ["FULL_ADMINISTRATION"],
};

/**
 * Gate Definitions
 * Full definitions of all gates and their requirements
 */
export const GATE_DEFINITIONS: Record<GateType, GateDefinition> = {
    ASSET_INVENTORY: {
        gateType: "ASSET_INVENTORY",
        requiredStatus: ["NOT_STARTED", "PENDING_FILING", "PENDING_HEARING", "PENDING_LETTERS", "GRANTED", "LIMITED_GRANTED", "EXPIRED", "REVOKED"],
        description: "Inventory and document estate assets",
        warningMessage: "Asset inventory can be performed at any stage of authority"
    },
    ASSET_COLLECTION: {
        gateType: "ASSET_COLLECTION",
        requiredStatus: ["GRANTED", "LIMITED_GRANTED"],
        excludedTypes: ["UNSET"],
        description: "Collect and take possession of estate assets",
        warningMessage: "Asset collection requires legal authority to be granted"
    },
    CREDITOR_CLAIMS: {
        gateType: "CREDITOR_CLAIMS",
        requiredStatus: ["GRANTED", "LIMITED_GRANTED", "PENDING_LETTERS"],
        excludedTypes: ["UNSET", "POD_TOD_TRANSFER", "JOINT_TRANSFER", "BENEFICIARY_DESIGNATED", "TRUST_ADMIN_REVOCABLE", "TRUST_ADMIN_IRREVOCABLE", "TOD_DEED"],
        description: "Handle and resolve creditor claims",
        warningMessage: "Creditor claim handling requires probate authority"
    },
    DISTRIBUTION: {
        gateType: "DISTRIBUTION",
        requiredStatus: ["GRANTED", "LIMITED_GRANTED"],
        excludedTypes: ["UNSET"],
        description: "Distribute assets to beneficiaries",
        warningMessage: "Distribution requires granted legal authority"
    },
    REAL_ESTATE: {
        gateType: "REAL_ESTATE",
        requiredStatus: ["GRANTED", "LIMITED_GRANTED"],
        excludedTypes: ["UNSET", "SMALL_ESTATE", "SUMMARY_ADMINISTRATION", "VOLUNTARY_ADMINISTRATION", "MUNIMENT_OF_TITLE", "POD_TOD_TRANSFER", "JOINT_TRANSFER"],
        description: "Transfer or sell real property",
        warningMessage: "Real estate transactions require full probate authority"
    },
    FINANCIAL_ACCOUNTS: {
        gateType: "FINANCIAL_ACCOUNTS",
        requiredStatus: ["GRANTED", "LIMITED_GRANTED"],
        excludedTypes: ["UNSET"],
        description: "Access and manage financial accounts",
        warningMessage: "Financial account access requires granted authority"
    },
    LEGAL_ACTIONS: {
        gateType: "LEGAL_ACTIONS",
        requiredStatus: ["GRANTED"],
        excludedTypes: ["UNSET", "SMALL_ESTATE", "SUMMARY_ADMINISTRATION", "VOLUNTARY_ADMINISTRATION", "MUNIMENT_OF_TITLE", "LIMITED_GRANTED"],
        description: "Take legal actions on behalf of the estate",
        warningMessage: "Legal actions require full probate authority"
    },
    TAX_FILING: {
        gateType: "TAX_FILING",
        requiredStatus: ["PENDING_HEARING", "PENDING_LETTERS", "GRANTED", "LIMITED_GRANTED"],
        excludedTypes: ["UNSET"],
        description: "File estate tax returns",
        warningMessage: "Tax filing requires at least pending authority"
    },
    FULL_ADMINISTRATION: {
        gateType: "FULL_ADMINISTRATION",
        requiredStatus: ["GRANTED"],
        excludedTypes: ["UNSET", "SMALL_ESTATE", "SUMMARY_ADMINISTRATION", "VOLUNTARY_ADMINISTRATION", "MUNIMENT_OF_TITLE", "LIMITED_GRANTED"],
        description: "Complete estate administration authority",
        warningMessage: "This action requires full probate authority to be granted"
    }
};

/**
 * Authority types that don't require full probate
 */
const NON_PROBATE_TYPES: AuthorityType[] = [
    "TRUST_ADMIN_REVOCABLE",
    "TRUST_ADMIN_IRREVOCABLE",
    "POD_TOD_TRANSFER",
    "JOINT_TRANSFER",
    "BENEFICIARY_DESIGNATED",
    "TOD_DEED"
];

/**
 * Small estate authority types
 */
const SMALL_ESTATE_TYPES: AuthorityType[] = [
    "SMALL_ESTATE",
    "SUMMARY_ADMINISTRATION",
    "VOLUNTARY_ADMINISTRATION",
    "MUNIMENT_OF_TITLE"
];

/**
 * Resolve all gates for an estate
 * Determines which functional gates are open based on authority status and type
 */
export async function resolveEstateGates(estateId: string): Promise<EstateGatesResolution> {
    const estate = await prisma.estate.findUnique({
        where: { id: estateId },
        select: {
            id: true,
            authorityStatus: true,
            authorityType: true
        }
    });

    if (!estate) {
        throw new Error(`Estate not found: ${estateId}`);
    }

    const authorityStatus = (estate.authorityStatus || "NOT_STARTED") as AuthorityStatus;
    const authorityType = (estate.authorityType || "UNSET") as AuthorityType;

    const gates: Record<GateType, GateCheckResult> = {} as Record<GateType, GateCheckResult>;
    const openGates: GateType[] = [];
    const closedGates: GateType[] = [];

    // Check each gate definition
    for (const [gateType, definition] of Object.entries(GATE_DEFINITIONS)) {
        const result = checkGate(authorityStatus, authorityType, definition);
        gates[gateType as GateType] = result;

        if (result.isOpen) {
            openGates.push(gateType as GateType);
        } else {
            closedGates.push(gateType as GateType);
        }
    }

    // Determine if estate is fully authorized
    const isFullyAuthorized = authorityStatus === "GRANTED" &&
        !NON_PROBATE_TYPES.includes(authorityType) &&
        !SMALL_ESTATE_TYPES.includes(authorityType);

    return {
        estateId,
        authorityStatus,
        authorityType,
        isFullyAuthorized,
        gates,
        openGates,
        closedGates,
        timestamp: new Date()
    };
}

/**
 * Check a single gate
 */
function checkGate(
    currentStatus: AuthorityStatus,
    authorityType: AuthorityType,
    definition: GateDefinition
): GateCheckResult {
    // Check if authority type is excluded
    if (definition.excludedTypes?.includes(authorityType)) {
        return {
            gateType: definition.gateType,
            isOpen: false,
            currentStatus,
            authorityType,
            requiredStatuses: definition.requiredStatus,
            message: `This operation is not available for ${authorityType} estates`,
            canProceed: false
        };
    }

    // Check if authority type is specifically required
    if (definition.requiredTypes && !definition.requiredTypes.includes(authorityType)) {
        return {
            gateType: definition.gateType,
            isOpen: false,
            currentStatus,
            authorityType,
            requiredStatuses: definition.requiredStatus,
            message: `This operation requires specific authority types: ${definition.requiredTypes.join(", ")}`,
            canProceed: false
        };
    }

    // Check status requirement
    const hasRequiredStatus = definition.requiredStatus.includes(currentStatus);

    // Special handling for non-probate types (but respect excludedTypes)
    if (NON_PROBATE_TYPES.includes(authorityType)) {
        // Non-probate transfers have immediate authority once set
        // Only for gates not explicitly excluded for this type
        const isNonProbateGate = ["ASSET_INVENTORY", "ASSET_COLLECTION", "DISTRIBUTION"].includes(definition.gateType);
        const isExcluded = definition.excludedTypes?.includes(authorityType);

        if (isNonProbateGate && !isExcluded && currentStatus === "GRANTED") {
            return {
                gateType: definition.gateType,
                isOpen: true,
                currentStatus,
                authorityType,
                requiredStatuses: definition.requiredStatus,
                message: "Non-probate transfer authority is active",
                canProceed: true
            };
        }
    }

    // Special handling for small estates (but respect excludedTypes)
    if (SMALL_ESTATE_TYPES.includes(authorityType)) {
        // Small estates have limited authority
        const smallEstateAllowedGates = [
            "ASSET_INVENTORY",
            "ASSET_COLLECTION",
            "CREDITOR_CLAIMS",
            "DISTRIBUTION",
            "FINANCIAL_ACCOUNTS",
            "TAX_FILING"
        ];
        const isExcluded = definition.excludedTypes?.includes(authorityType);

        if (smallEstateAllowedGates.includes(definition.gateType) && !isExcluded && hasRequiredStatus) {
            return {
                gateType: definition.gateType,
                isOpen: true,
                currentStatus,
                authorityType,
                requiredStatuses: definition.requiredStatus,
                message: "Small estate authority is active",
                canProceed: true
            };
        }
    }

    if (hasRequiredStatus) {
        return {
            gateType: definition.gateType,
            isOpen: true,
            currentStatus,
            authorityType,
            requiredStatuses: definition.requiredStatus,
            message: "Authority requirements satisfied",
            canProceed: true
        };
    }

    return {
        gateType: definition.gateType,
        isOpen: false,
        currentStatus,
        authorityType,
        requiredStatuses: definition.requiredStatus,
        message: definition.warningMessage,
        canProceed: false
    };
}

/**
 * Check if a specific operation is allowed
 */
export async function checkOperationAllowed(
    estateId: string,
    operation: string
): Promise<{
    allowed: boolean;
    requiredGates: GateType[];
    blockedGates: GateType[];
    message: string;
}> {
    const requiredGates = ENFORCEMENT_MATRIX[operation];

    if (!requiredGates) {
        // No enforcement defined for this operation
        return {
            allowed: true,
            requiredGates: [],
            blockedGates: [],
            message: "No authority restrictions for this operation"
        };
    }

    const resolution = await resolveEstateGates(estateId);
    const blockedGates: GateType[] = [];

    for (const gate of requiredGates) {
        const gateResult = resolution.gates[gate];
        if (!gateResult?.isOpen) {
            blockedGates.push(gate);
        }
    }

    const allowed = blockedGates.length === 0;

    return {
        allowed,
        requiredGates,
        blockedGates,
        message: allowed
            ? "Operation allowed"
            : `Blocked by: ${blockedGates.join(", ")}. ${blockedGates.map(g => resolution.gates[g].message).join(" ")}`
    };
}

/**
 * Middleware factory to require specific authority status
 * @param options - Configuration options
 */
export function requireAuthorityStatus(options: {
    operation?: string;
    gates?: GateType[];
    allowPending?: boolean;
    customMessage?: string;
}) {
    return async (req: any, res: Response, next: NextFunction) => {
        try {
            const estateId = req.estateId || req.params.estateId;

            if (!estateId) {
                logger.error("[AuthorityGating] No estateId found in request");
                return res.status(400).json({
                    error: "Bad Request",
                    message: "Estate ID is required for authority check"
                });
            }

            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    error: "Unauthorized",
                    message: "Authentication required"
                });
            }

            // Resolve gates for this estate
            const resolution = await resolveEstateGates(estateId);

            // Attach resolution to request for downstream use
            req.estateGates = resolution;

            // Check specific operation if provided
            if (options.operation) {
                const check = await checkOperationAllowed(estateId, options.operation);

                if (!check.allowed) {
                    logger.warn(`[AuthorityGating] Blocked ${options.operation} for estate ${estateId} by user ${userId}`);
                    return res.status(403).json({
                        error: "Authority Required",
                        message: options.customMessage || check.message,
                        currentStatus: resolution.authorityStatus,
                        authorityType: resolution.authorityType,
                        blockedGates: check.blockedGates,
                        requiredGates: check.requiredGates
                    });
                }
            }

            // Check specific gates if provided
            if (options.gates && options.gates.length > 0) {
                const blockedGates: GateType[] = [];

                for (const gate of options.gates) {
                    const gateResult = resolution.gates[gate];
                    if (!gateResult?.isOpen) {
                        blockedGates.push(gate);
                    }
                }

                if (blockedGates.length > 0) {
                    logger.warn(`[AuthorityGating] Blocked access to gates ${blockedGates.join(",")} for estate ${estateId} by user ${userId}`);
                    return res.status(403).json({
                        error: "Authority Required",
                        message: options.customMessage || `This operation requires: ${blockedGates.join(", ")}`,
                        currentStatus: resolution.authorityStatus,
                        authorityType: resolution.authorityType,
                        blockedGates,
                        requiredGates: options.gates
                    });
                }
            }

            // Check for pending status allowance
            if (!options.allowPending && resolution.authorityStatus !== "GRANTED") {
                // Special case: non-probate types don't need traditional "GRANTED" status
                if (!NON_PROBATE_TYPES.includes(resolution.authorityType)) {
                    logger.warn(`[AuthorityGating] Blocked non-granted authority for estate ${estateId}`);
                    return res.status(403).json({
                        error: "Authority Required",
                        message: options.customMessage || "This operation requires granted legal authority",
                        currentStatus: resolution.authorityStatus,
                        authorityType: resolution.authorityType
                    });
                }
            }

            next();
        } catch (error: any) {
            logger.error("[AuthorityGating] Middleware error:", error.message);
            return res.status(500).json({
                error: "Internal Server Error",
                message: "Authority check failed"
            });
        }
    };
}

/**
 * Middleware to require full probate authority
 * Most restrictive - requires GRANTED status and full probate type
 */
export function requireFullAuthority(req: any, res: Response, next: NextFunction) {
    return requireAuthorityStatus({
        gates: ["FULL_ADMINISTRATION"],
        customMessage: "This operation requires full probate authority with Letters Testamentary or Letters of Administration"
    })(req, res, next);
}

/**
 * Middleware to require asset collection authority
 */
export function requireAssetCollectionAuthority(req: any, res: Response, next: NextFunction) {
    return requireAuthorityStatus({
        gates: ["ASSET_COLLECTION"],
        customMessage: "Asset collection requires legal authority to be granted"
    })(req, res, next);
}

/**
 * Middleware to require distribution authority
 */
export function requireDistributionAuthority(req: any, res: Response, next: NextFunction) {
    return requireAuthorityStatus({
        operation: "distributions:execute",
        customMessage: "Distributions require granted legal authority"
    })(req, res, next);
}

/**
 * Middleware to check if estate can perform creditor operations
 */
export function requireCreditorAuthority(req: any, res: Response, next: NextFunction) {
    return requireAuthorityStatus({
        gates: ["CREDITOR_CLAIMS"],
        customMessage: "Creditor claim handling requires probate authority"
    })(req, res, next);
}

/**
 * Get gate status for an estate (API endpoint helper)
 */
export async function getEstateGateStatus(estateId: string): Promise<{
    estateId: string;
    authorityStatus: AuthorityStatus;
    authorityType: AuthorityType;
    isFullyAuthorized: boolean;
    gates: Record<GateType, { open: boolean; message: string }>;
    availableOperations: string[];
}> {
    const resolution = await resolveEstateGates(estateId);

    // Simplify gates for API response
    const gates: Record<GateType, { open: boolean; message: string }> = {} as any;
    for (const [gateType, result] of Object.entries(resolution.gates)) {
        gates[gateType as GateType] = {
            open: result.isOpen,
            message: result.message
        };
    }

    // Determine available operations
    const availableOperations: string[] = [];
    for (const [operation, requiredGates] of Object.entries(ENFORCEMENT_MATRIX)) {
        const canPerform = requiredGates.every(gate => resolution.gates[gate]?.isOpen);
        if (canPerform) {
            availableOperations.push(operation);
        }
    }

    return {
        estateId: resolution.estateId,
        authorityStatus: resolution.authorityStatus,
        authorityType: resolution.authorityType,
        isFullyAuthorized: resolution.isFullyAuthorized,
        gates,
        availableOperations
    };
}
