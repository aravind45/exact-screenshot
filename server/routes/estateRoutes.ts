import { Router, Request, Response } from "express";
import { prisma } from "../db.js";
import { Prisma } from "@prisma/client";
import { EmailService } from "../services/emailService.js";
import { encrypt, decrypt, encryptBuffer, decryptBuffer } from "../utils/encryption.js";
import { AuditService } from "../services/auditService.js";
import { requireRole } from "../middleware/rbac.js";
import { requireEstateAccess } from "../middleware/estateAuth.js";
import { requireAuthorityStatus } from "../middleware/authorityGating.js";
import { requireEstateStatus, ESTATE_GATES } from "../middleware/estateStatusGating.js";
import { z } from "zod";
import { logger } from "../lib/logger.js";
import { requireSubscription } from "../middleware/subscription.js";
import { authenticate } from "../middleware/auth.js";
import { fetchEstateRowForUser } from "../utils/estateFallback.js";
import { getPrismaErrorDetails, isMissingColumnError } from "../utils/prismaErrors.js";


const estateUpdateSchema = z.object({
    name: z.string().optional(),
    deceasedFirstName: z.string().optional(),
    deceasedLastName: z.string().optional(),
    deceasedDateOfBirth: z.string().optional().nullable(),
    deceasedDateOfDeath: z.string().optional().nullable(),
    deceasedState: z.string().optional(),
    estateType: z.string().optional(),
    authorityType: z.string().optional(),
    userSelectedEstateAuthorityType: z.string().optional(),
    authorityStatus: z.string().optional(),
    certifiedCopies: z.coerce.number().optional().nullable(),
    authorityEffectiveDate: z.string().optional().nullable(),
    iaeaType: z.string().optional(),
    appointedDate: z.string().optional().nullable(),
    probateStatus: z.string().optional(),
    courtCaseNumber: z.string().optional(),
    probateCounty: z.string().optional(),
    status: z.string().optional(),
    petitionerPhone: z.string().optional(),
    petitionerIsAttorney: z.boolean().optional(),
    hasWill: z.boolean().optional(),
    willDate: z.string().optional().nullable(),
    codicilDates: z.string().optional(),
    estimatedPersonalProperty: z.coerce.number().optional().nullable(),
    estimatedRealProperty: z.coerce.number().optional().nullable(),
    estimatedAnnualIncome: z.coerce.number().optional().nullable(),
    bondAmount: z.coerce.number().optional().nullable(),
    bondWaived: z.boolean().optional(),
    probateNotes: z.string().optional(),
    hearingDate: z.string().optional().nullable(),
    hearingTime: z.string().optional(),
    hearingDept: z.string().optional(),
    hearingAddress: z.string().optional(),
    deceasedSsn: z.string().optional(),
    // Onboarding specific fields
    estimatedLiabilities: z.coerce.number().optional().nullable(),
    hasContest: z.boolean().optional(),
    isTrustRevocable: z.boolean().optional().nullable(),
    hasTODDeed: z.boolean().optional(),
    isSurvivingSpouse: z.boolean().optional(),
    hasUnknownHeirs: z.boolean().optional(),
    isOutOfState: z.boolean().optional(),
    hasOutOfStateProperty: z.boolean().optional(),
    hasMinorBeneficiaries: z.boolean().optional()
});

const roadmapUpdateSchema = z.object({
    completedTaskIds: z.array(z.string()),
    completedPhases: z.array(z.string()),
    taskId: z.string().optional(),
    action: z.string().optional(),
    phase: z.string().optional(),
    taskTitle: z.string().optional(),
    phaseName: z.string().optional()
});

const deadlineSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    dueDate: z.string(),
    priority: z.string().optional(),
    category: z.string().optional()
});

const router = Router();

// List all estates for the current user
router.get("/", async (req: any, res: Response) => {
    try {
        const estates = await prisma.estate.findMany({
            where: {
                OR: [
                    { userId: req.user.id },
                    { grants: { some: { userId: req.user.id } } }
                ]
            },
            include: { user: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(estates);
    } catch (error: any) {
        logger.error("Error fetching estates:", error.message);
        res.status(500).json({ error: "Failed to fetch estates" });
    }
});

router.get("/my", async (req: any, res: Response) => {
    try {
        let estate;
        try {
            estate = await prisma.estate.findFirst({
                where: {
                    OR: [
                        { userId: req.user.id },
                        { grants: { some: { userId: req.user.id } } }
                    ]
                },
                include: { user: true }
            });
        } catch (dbError: any) {
            // Check if this is a missing column error
            const errorMessage = dbError.message || '';
            if (errorMessage.includes('column') && (errorMessage.includes('does not exist') || errorMessage.includes('Unknown column'))) {
                logger.error("CRITICAL: Database schema mismatch - missing column detected in /my endpoint", {
                    error: dbError.message,
                    stack: dbError.stack,
                    userId: req.user.id
                });
                return res.status(503).json({
                    error: "Service temporarily unavailable",
                    message: "The system is undergoing maintenance. Please try again in a few minutes.",
                    code: "SCHEMA_MIGRATION_PENDING"
                });
            }
            throw dbError; // Re-throw if not a column error
        }

        if (estate) {
            try {
                await EmailService.ensureEstateHandle(estate.id);
            } catch (handleErr: any) {
                logger.warn("Failed to ensure estate handle (non-fatal):", handleErr);
            }
            // Re-fetch to get the new handle/email if it was just created
            let updatedEstate;
            try {
                updatedEstate = await prisma.estate.findUnique({
                    where: { id: estate.id },
                    include: { user: true }
                });
            } catch (dbError: any) {
                // Check if this is a missing column error
                const errorMessage = dbError.message || '';
                if (errorMessage.includes('column') && (errorMessage.includes('does not exist') || errorMessage.includes('Unknown column'))) {
                    logger.error("CRITICAL: Database schema mismatch - missing column in re-fetch", {
                        error: dbError.message,
                        stack: dbError.stack,
                        estateId: estate.id
                    });
                    // Return the original estate data if re-fetch fails due to missing columns
                    // Decrypt SSN for display if available
                    if (estate.deceasedSsn) {
                        try {
                            estate.deceasedSsn = decrypt(estate.deceasedSsn);
                        } catch (decryptErr) {
                            logger.warn("Failed to decrypt SSN:", decryptErr);
                            estate.deceasedSsn = undefined;
                        }
                    }
                    return res.json(estate);
                }
                throw dbError;
            }

            if (updatedEstate) {
                // Decrypt SSN for display
                updatedEstate.deceasedSsn = updatedEstate.deceasedSsn ? decrypt(updatedEstate.deceasedSsn) : updatedEstate.deceasedSsn;
            }

            return res.json(updatedEstate);
        }
        res.json(estate);
    } catch (error: any) {
        if (isMissingColumnError(error)) {
            logger.warn("Estate fetch failed due to missing columns — using fallback query.", {
                userId: req.user.id,
                message: error instanceof Error ? error.message : String(error),
                ...getPrismaErrorDetails(error)
            });

            const fallbackEstate = await fetchEstateRowForUser(prisma, req.user.id);
            if (!fallbackEstate) {
                return res.json(null);
            }

            try {
                await EmailService.ensureEstateHandle(fallbackEstate.id as string);
            } catch (handleErr) {
                logger.warn("Failed to ensure estate handle during fallback (non-fatal):", handleErr);
            }

            const refreshedEstate = await fetchEstateRowForUser(prisma, req.user.id);
            const estateToReturn = (refreshedEstate || fallbackEstate) as any;

            if (estateToReturn.deceasedSsn) {
                estateToReturn.deceasedSsn = decrypt(estateToReturn.deceasedSsn);
            }

            if (estateToReturn.userId) {
                estateToReturn.user = await prisma.user.findUnique({
                    where: { id: estateToReturn.userId }
                });
            }

            return res.json(estateToReturn);
        }

        logger.error("Estate Fetch Error:", error.message);
        res.status(500).json({ error: "Failed to fetch estate", message: error.message });
    }
});

router.put("/my", authenticate, async (req: any, res: Response) => {
    try {
        const userId = req.user.id;

        // Find or Create Estate (Upsert pattern for onboarding resilience)
        let estate;
        try {
            estate = await prisma.estate.findFirst({
                where: {
                    OR: [
                        { userId: userId },
                        { grants: { some: { userId: userId } } }
                    ]
                }
            });
        } catch (dbError: any) {
            const errorMessage = dbError.message || '';
            if (errorMessage.includes('column') && (errorMessage.includes('does not exist') || errorMessage.includes('Unknown column'))) {
                logger.error("CRITICAL: Database schema mismatch in PUT /my - missing column", {
                    error: dbError.message,
                    userId
                });
                return res.status(503).json({
                    error: "Service temporarily unavailable",
                    message: "The system is undergoing maintenance. Please try again in a few minutes.",
                    code: "SCHEMA_MIGRATION_PENDING"
                });
            }
            throw dbError;
        }

        // Whitelist allowed fields and parse dates
        const validated = estateUpdateSchema.parse(req.body);

        const updateData: any = {};
        const dateFields = ['deceasedDateOfDeath', 'deceasedDateOfBirth', 'authorityEffectiveDate', 'appointedDate', 'willDate', 'hearingDate'];
        const numericFields = ['certifiedCopies', 'estimatedPersonalProperty', 'estimatedRealProperty', 'estimatedAnnualIncome', 'bondAmount', 'estimatedLiabilities'];

        for (const [key, value] of Object.entries(validated)) {
            if (value === undefined) continue;

            if (dateFields.includes(key)) {
                if (value) {
                    const date = new Date(value as string);
                    updateData[key] = isNaN(date.getTime()) ? null : date;
                } else {
                    updateData[key] = null;
                }
            } else if (numericFields.includes(key)) {
                updateData[key] = (value === "" || value === null) ? null : new Prisma.Decimal(value as number | string);
            } else if (key === 'codicilDates' && typeof value === 'string') {
                updateData[key] = value.split(',').map((s: string) => s.trim()).filter(Boolean);
            } else if (key === 'deceasedSsn') {
                updateData[key] = value ? encrypt(value as string) : value;
            } else {
                updateData[key] = value;
            }
        }



        // International Executor Mode Trigger (Overlay)
        const US_STATES = [
            'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
            'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
            'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC',
            'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia',
            'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland',
            'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
            'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
            'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming', 'District of Columbia'
        ];

        // Check Triggers
        const newReasons: string[] = [];
        let shouldEnableInternational = false;

        // 1. Executor Residence Check
        if (req.user.state && !US_STATES.some(s => s.toLowerCase() === req.user.state.toLowerCase())) {
            shouldEnableInternational = true;
            newReasons.push("EXECUTOR_RESIDENCE");
        }

        // 2. Deceased State Check (Ancillary indication)
        // If deceasedState is updated and NOT in US_STATES (assuming it might store country if freely entered, though typically it's restricted)
        // For now, we trust the frontend dropdowns, but if we later capture "Country", checking here is good.

        // 3. User Citizenship (if tracked) or Mailing Address
        // (Assuming we might check specific other fields if they existed)

        // UPSERT LOGIC
        let finalEstate;
        if (!estate) {
            finalEstate = await prisma.estate.create({
                data: {
                    ...updateData,
                    userId: userId,
                    deceasedFirstName: updateData.deceasedFirstName || "",
                    deceasedLastName: updateData.deceasedLastName || "Estate",
                    deceasedState: updateData.deceasedState || "",
                    status: "active",
                    name: updateData.name || `${req.user.fullName}'s Estate`,
                    hasContest: updateData.hasContest === undefined ? false : Boolean(updateData.hasContest),
                    // New estates start as DRAFT until minimum intake is complete
                    estateStatus: "DRAFT",
                    ...(updateData.estimatedLiabilities !== undefined && {
                        estimatedLiabilities: updateData.estimatedLiabilities === "" || updateData.estimatedLiabilities === null ? null : new Prisma.Decimal(updateData.estimatedLiabilities)
                    })
                } as any
            });
            logger.info(`✅ [ESTATE] Upsert: Created new estate for user ${userId} with status: DRAFT`);
        } else {
            if (shouldEnableInternational) {
                const currentReasons = estate.internationalReasons || [];
                if (!estate.isInternational || !newReasons.every(r => currentReasons.includes(r))) {
                    updateData.isInternational = true;
                    updateData.internationalReasons = [...new Set([...currentReasons, ...newReasons])];

                    await prisma.settlementActivity.create({
                        data: {
                            estateId: estate.id,
                            userId: userId,
                            type: 'CONFIGURATION',
                            action: 'UPDATED',
                            notes: `INTERNATIONAL MODE ENABLED – Detected: ${newReasons.join(", ")}`
                        }
                    });
                }
            }

            // Check if we should advance estateStatus to MINIMUM_READY
            // This happens when authority type selection is being set for the first time
            const currentStatus = (estate as any).estateStatus || "DRAFT";
            const selectedAuthorityType = updateData.authorityType ?? updateData.userSelectedEstateAuthorityType;
            if (currentStatus === "DRAFT" && selectedAuthorityType && selectedAuthorityType !== "UNSET") {
                updateData.estateStatus = "MINIMUM_READY";
                logger.info(`✅ [ESTATE] Advancing estate ${estate.id} from DRAFT to MINIMUM_READY`);
            }

            finalEstate = await prisma.estate.update({
                where: { id: estate.id },
                data: {
                    ...updateData,
                    ...(updateData.hasContest !== undefined && { hasContest: Boolean(updateData.hasContest) }),
                    ...(updateData.estimatedLiabilities !== undefined && {
                        estimatedLiabilities: updateData.estimatedLiabilities === "" || updateData.estimatedLiabilities === null ? null : new Prisma.Decimal(updateData.estimatedLiabilities)
                    })
                }
            });
        }

        // Decrypt SSN for response
        if (finalEstate.deceasedSsn) {
            finalEstate.deceasedSsn = decrypt(finalEstate.deceasedSsn);
        }

        // Log Configuration Activity
        const updatedFields = Object.keys(updateData).length;
        if (updatedFields > 0 && estate) {
            await prisma.settlementActivity.create({
                data: {
                    estateId: estate.id,
                    userId: req.user.id,
                    type: 'CONFIGURATION',
                    action: 'UPDATED',
                    notes: `CONFIGURATION – Case information updated (${updatedFields} fields refined).`
                }
            });
        }

        // If status changed to EXECUTOR_APPOINTED, auto-sync assets
        if (req.body.probateStatus === 'EXECUTOR_APPOINTED' && estate?.probateStatus !== 'EXECUTOR_APPOINTED' && finalEstate.id) {
            const { AssetService } = await import("../services/assetService.js");
            await AssetService.autoSyncAssetsForEstate(finalEstate.id);
        }

        res.json(finalEstate);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: "Validation failed", details: error.errors });
        }
        
        // Check if this is a Prisma missing column error
        const errorMessage = error.message || '';
        const isMissingColumnError = errorMessage.includes('column') && 
            (errorMessage.includes('does not exist') || 
             errorMessage.includes('Unknown column') || 
             errorMessage.includes('Invalid column'));

        if (isMissingColumnError) {
            logger.error("CRITICAL Database Migration Error in PUT /my:", {
                message: error.message,
                code: error.code,
                stack: error.stack,
                userId: req.user?.id
            });
            return res.status(503).json({
                error: "Service temporarily unavailable",
                message: "The system is undergoing maintenance. Please try again in a few minutes.",
                code: "SCHEMA_MIGRATION_PENDING"
            });
        }
        
        logger.error("Estate Update Error:", error.message);
        res.status(500).json({ error: "Failed to update estate", message: error.message });
    }
});

// Roadmap Persistence
router.put("/my/roadmap", requireSubscription, async (req: any, res: Response) => {
    try {
        const estate = await prisma.estate.findFirst({
            where: {
                OR: [
                    { userId: req.user.id },
                    { grants: { some: { userId: req.user.id } } }
                ]
            }
        });
        if (!estate) return res.status(404).json({ error: "Estate not found" });

        const validated = roadmapUpdateSchema.parse(req.body);
        const { completedTaskIds, completedPhases, taskId, action, phase } = validated;

        const updateData: any = {
            roadmapProgress: {
                completedTaskIds,
                completedPhases
            } as Prisma.InputJsonValue
        };

        // Sync high-level status if it's a phase completion
        if (action === 'PHASE_COMPLETED' && phase) {
            updateData.status = phase.toUpperCase();
        }

        const updated = await prisma.estate.update({
            where: { id: estate.id },
            data: updateData
        });

        // Log activity with detailed task information
        if (taskId) {
            const taskTitle = req.body.taskTitle || taskId;
            const phaseName = req.body.phaseName || phase;
            const actionLabel = action === 'COMPLETED' ? 'Completed' :
                action === 'UNCOMPLETED' ? 'Re-opened' :
                    action === 'PHASE_COMPLETED' ? 'Completed Phase' : action;

            // Log Activity
            await prisma.settlementActivity.create({
                data: {
                    estateId: estate.id,
                    userId: req.user.id,
                    taskId,
                    phase,
                    action,
                    notes: action === 'COMPLETED'
                        ? `ROADMAP – ${taskTitle} marked as complete`
                        : `ROADMAP – ${taskTitle} re-opened for refinement`
                }
            });
        }

        res.json(updated);
    } catch (e: any) {
        if (e instanceof z.ZodError) {
            return res.status(400).json({ error: "Validation failed", details: e.errors });
        }
        
        // Check for missing column errors
        const errorMessage = e.message || '';
        const isMissingColumnError = errorMessage.includes('column') && 
            (errorMessage.includes('does not exist') || 
             errorMessage.includes('Unknown column') || 
             errorMessage.includes('Invalid column'));

        if (isMissingColumnError) {
            logger.error("CRITICAL Database Migration Error in PUT /my/roadmap:", e.message);
            return res.status(503).json({
                error: "Service temporarily unavailable",
                message: "The system is undergoing maintenance.",
                code: "SCHEMA_MIGRATION_PENDING"
            });
        }
        
        logger.error("Roadmap update error:", e.message);
        res.status(500).json({ error: "Failed to update roadmap" });
    }
});

router.get("/my/activities", async (req: any, res: Response) => {
    try {
        const estate = await prisma.estate.findFirst({ where: { userId: req.user.id } });
        if (!estate) return res.json([]);

        const activities = await prisma.settlementActivity.findMany({
            where: { estateId: estate.id },
            orderBy: { occurredAt: 'desc' }
        });
        res.json(activities);
    } catch (e: any) {
        logger.error("Activities Fetch Error:", e.message);
        res.status(500).json({ error: "Failed to fetch activities" });
    }
});

router.put("/my/activities/:id", requireSubscription, async (req: any, res: Response) => {
    try {
        const estate = await prisma.estate.findFirst({ where: { userId: req.user.id } });
        if (!estate) return res.status(404).json({ error: "Estate not found" });

        const activity = await prisma.settlementActivity.findFirst({
            where: { id: req.params.id, estateId: estate.id }
        });
        if (!activity) return res.status(404).json({ error: "Activity not found" });

        const { notes } = z.object({ notes: z.string() }).parse(req.body);
        const updated = await prisma.settlementActivity.update({
            where: { id: req.params.id },
            data: { notes }
        });
        res.json(updated);
    } catch (e: any) {
        if (e instanceof z.ZodError) return res.status(400).json({ error: "Invalid notes" });
        res.status(500).json({ error: "Failed to update activity" });
    }
});

router.get("/my/activities/download", requireSubscription, async (req: any, res: Response) => {
    try {
        const estate = await prisma.estate.findFirst({ where: { userId: req.user.id } });
        if (!estate) return res.status(404).json({ error: "Estate not found" });

        const activities = await prisma.settlementActivity.findMany({
            where: {
                estateId: estate.id,
                action: { in: ['COMPLETED', 'PHASE_COMPLETED', 'UPLOADED', 'CREATED'] }
            },
            orderBy: { occurredAt: 'asc' }
        });

        // Fetch Data for Gap Analysis
        const discoveryStatus = await prisma.discoveryCategory.findMany({
            where: { estateId: estate.id },
            include: { negativeFindings: true }
        });

        const negativeFindings = discoveryStatus?.filter((c: any) => c.status === 'NOT_FOUND') || [];

        // Calculate Pending Tasks
        const { SETTLEMENT_PHASE_TASKS } = await import("../config/settlementPhases.js");
        const currentPhase = estate.status || 'immediate_actions';
        const phaseData = SETTLEMENT_PHASE_TASKS.find((p: any) => p.phase === currentPhase);
        const completedTaskIds = (estate.roadmapProgress as any)?.completedTaskIds || [];
        const pendingTasks = phaseData?.tasks.filter((t: any) => !completedTaskIds.includes(t.id)) || [];

        const { DocumentService } = await import("../services/DocumentService.js");

        // SEC-003: Verify Chain Integrity before export
        const verification = await AuditService.verifyChain(estate.id);

        const pdfBytes = await DocumentService.generateActivityLogPdf(estate, activities, req.user.fullName, {
            pendingTasks,
            negativeFindings,
            verification // Pass verification result to PDF
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Settlement_Trail_${estate.deceasedLastName}.pdf`);
        res.send(Buffer.from(pdfBytes));
    } catch (e: any) {
        logger.error("Activity download error:", e);
        res.status(500).json({ error: "Failed to download activity log" });
    }
});

// [REMOVED DUPLICATE HEIR ROUTES - HANDLED IN heirRoutes.ts]

import { DocumentService } from "../services/DocumentService.js";

router.get("/my/petition/creditor-priority-worksheet/pdf", requireSubscription, async (req: any, res: Response) => {
    try {
        const estate = await prisma.estate.findFirst({
            where: { userId: req.user.id },
            include: { user: true, liabilities: true }
        });

        if (!estate) return res.status(404).json({ error: "Estate not found" });

        const pdfBytes = await DocumentService.generateCreditorClaimPriorityWorksheet(estate.id);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=Creditor_Priority_Worksheet.pdf');
        return res.send(Buffer.from(pdfBytes));
    } catch (error: any) {
        logger.error("Creditor Worksheet Generation Error:", error.message);
        res.status(500).json({ error: "Failed to generate Creditor Worksheet PDF" });
    }
});

router.get("/my/petition/:formCode/pdf", requireSubscription, async (req: any, res: Response) => {
    try {
        const estate = await prisma.estate.findFirst({
            where: { userId: req.user.id },
            include: { user: true, heirs: true, assets: true, liabilities: true }
        });

        if (!estate) return res.status(404).json({ error: "Estate not found" });

        const { formCode } = req.params;
        let pdfBytes: Uint8Array;

        if (formCode === 'W-8BEN') {
            pdfBytes = await DocumentService.generateW8BEN(estate);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=W-8BEN.pdf');
            return res.send(Buffer.from(pdfBytes));
        } else if (formCode === 'W-8CE') {
            pdfBytes = await DocumentService.generateW8CE(estate);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=W-8CE.pdf');
            return res.send(Buffer.from(pdfBytes));
        }

        // If it's not a specific formCode we handle here, fall through or return 404
        return res.status(404).json({ error: "Form template not found for code: " + formCode });
    } catch (error: any) {
        logger.error("Specific Form PDF Generation Error:", error.message);
        res.status(500).json({ error: "Failed to generate specific form PDF" });
    }
});

router.get("/my/petition/pdf", requireSubscription, async (req: any, res: Response) => {
    try {
        const estate = await prisma.estate.findFirst({
            where: { userId: req.user.id },
            include: { user: true, heirs: true, assets: true, liabilities: true }
        });

        if (!estate) return res.status(404).json({ error: "Estate not found" });

        let pdfBytes: Uint8Array;
        const state = estate.deceasedState;

        // 1. Trust Path
        if (estate.authorityType === 'TRUST' || estate.isTrustRevocable !== null) {
            pdfBytes = await DocumentService.generateCertificationOfTrust(estate);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=Certification_of_Trust.pdf');
            return res.send(Buffer.from(pdfBytes));
        }

        // 2. State-Specific Paths
        if (state === 'TX') {
            pdfBytes = await DocumentService.generateTXMunimentOfTitle(estate);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=TX_Muniment_of_Title.pdf');
        } else if (state === 'FL') {
            pdfBytes = await DocumentService.generateFLSummaryAdministration(estate);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=FL_Summary_Administration.pdf');
        } else if (state === 'NY') {
            pdfBytes = await DocumentService.generateNYVoluntaryAdministration(estate);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=NY_Voluntary_Administration.pdf');
        } else if (state === 'CA') {
            pdfBytes = await DocumentService.generateDE111(estate);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=Petition_DE111.pdf');
        } else {
            return res.status(400).json({
                error: "State Required",
                message: "Please select a state in your Profile to generate the correct probate forms."
            });
        }

        res.send(Buffer.from(pdfBytes));
    } catch (error: any) {
        logger.error("PDF Generation Error:", error.message);
        res.status(500).json({ error: "Failed to generate PDF" });
    }
});

// Upload completed probate form (Secured)
router.post("/:estateId/documents", requireSubscription, requireEstateAccess, async (req: any, res: Response) => {
    try {
        const { estateId } = req.params;
        const { documentType, name } = req.query;

        if (!documentType || !name) {
            return res.status(400).json({ error: "documentType and name query params required" });
        }

        // req.body is Buffer because of express.raw for application/pdf
        if (!req.body || !Buffer.isBuffer(req.body)) {
            return res.status(400).json({ error: "Binary PDF body required" });
        }

        const fileUrl = `uploads/${estateId}/${documentType}.pdf`;

        // Smart Upsert: Update standard forms, Create for 'OTHER'
        const existing = documentType !== 'OTHER'
            ? await prisma.estateDocument.findFirst({
                where: { estateId, documentType: documentType as string }
            })
            : null;

        let document;
        const commonData = {
            fileUrl,
            content: encryptBuffer(req.body) as any, // Encrypt at rest (Cast for TS)
            status: "OBTAINED",
            obtainedDate: new Date(),
            name: name as string
        };

        if (existing) {
            document = await prisma.estateDocument.update({
                where: { id: existing.id },
                data: commonData
            });
        } else {
            document = await prisma.estateDocument.create({
                data: {
                    ...commonData,
                    estateId,
                    userId: req.user.id,
                    documentType: documentType as string,
                }
            });
        }

        // Log Activity
        await prisma.settlementActivity.create({
            data: {
                estateId,
                userId: req.user.id,
                type: 'DOCUMENT',
                action: 'UPLOADED',
                notes: `Uploaded document: ${name} (${documentType})`
            }
        });

        res.json({ success: true, document: { ...document, content: undefined } }); // Hide content in JSON response
    } catch (e: any) {
        logger.error("Document upload error:", e);
        res.status(500).json({ error: "Failed to upload document" });
    }
});

// Download uploaded probate form
router.get("/my/documents/:formCode/download", async (req: any, res: Response) => {
    try {
        const estate = await prisma.estate.findFirst({ where: { userId: req.user.id } });
        if (!estate) return res.status(404).json({ error: "Estate not found" });

        const document = await prisma.estateDocument.findFirst({
            where: {
                estateId: estate.id,
                documentType: req.params.formCode
            },
            orderBy: { createdAt: 'desc' } // Get latest if multiple exist
        });

        if (!document || !document.content) {
            return res.status(404).json({ error: "Document content not found" });
        }

        // Decrypt on the fly
        const decryptedContent = decryptBuffer(Buffer.from(document.content));

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=${document.documentType}_Completed.pdf`);
        res.send(decryptedContent);
    } catch (e: any) {
        res.status(500).json({ error: "Failed to download document" });
    }
});

// Create estate document record (metadata only)
router.post("/my/documents", requireSubscription, async (req: any, res: Response) => {
    try {
        const estate = await prisma.estate.findFirst({ where: { userId: req.user.id } });
        if (!estate) return res.status(404).json({ error: "Estate not found" });

        const document = await prisma.estateDocument.create({
            data: {
                ...req.body,
                estateId: estate.id,
                userId: req.user.id,
                obtainedDate: req.body.obtainedDate ? new Date(req.body.obtainedDate) : undefined,
                expirationDate: req.body.expirationDate ? new Date(req.body.expirationDate) : undefined
            }
        });

        // Log Activity
        await AuditService.logActivity(
            estate.id,
            req.user.id,
            'DOCUMENT',
            'CREATED',
            `Created document record: ${document.name} (${document.documentType})`
        );
        res.json(document);
    } catch (error) {
        logger.error("Create document error:", error);
        res.status(500).json({ error: "Failed to create document" });
    }
});

// Update estate document
router.put("/my/documents/:id", async (req: any, res: Response) => {
    try {
        const estate = await prisma.estate.findFirst({ where: { userId: req.user.id } });
        if (!estate) return res.status(404).json({ error: "Estate not found" });

        const count = await prisma.estateDocument.count({
            where: { id: req.params.id, estateId: estate.id }
        });
        if (count === 0) return res.status(404).json({ error: "Document not found" });

        const updated = await prisma.estateDocument.update({
            where: { id: req.params.id },
            data: {
                ...req.body,
                obtainedDate: req.body.obtainedDate ? new Date(req.body.obtainedDate) : undefined,
                expirationDate: req.body.expirationDate ? new Date(req.body.expirationDate) : undefined
            }
        });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: "Failed to update document" });
    }
});

// Delete estate document
router.delete("/my/documents/:id", async (req: any, res: Response) => {
    try {
        const estate = await prisma.estate.findFirst({ where: { userId: req.user.id } });
        if (!estate) return res.status(404).json({ error: "Estate not found" });

        const count = await prisma.estateDocument.count({
            where: { id: req.params.id, estateId: estate.id }
        });
        if (count === 0) return res.status(404).json({ error: "Document not found" });

        const deletedDoc = await prisma.estateDocument.delete({ where: { id: req.params.id } });

        // Log Activity
        await AuditService.logActivity(
            estate.id,
            req.user.id,
            'DOCUMENT',
            'DELETED',
            `Deleted document: ${deletedDoc.name} (${deletedDoc.documentType})`
        );

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete document" });
    }
});

// Upload file for a specific document ID
router.post("/my/documents/:id/upload", async (req: any, res: Response) => {
    try {
        const estate = await prisma.estate.findFirst({ where: { userId: req.user.id } });
        if (!estate) return res.status(404).json({ error: "Estate not found" });

        const existing = await prisma.estateDocument.findFirst({
            where: { id: req.params.id, estateId: estate.id }
        });
        if (!existing) return res.status(404).json({ error: "Document not found" });

        if (!req.body || !Buffer.isBuffer(req.body)) {
            return res.status(400).json({ error: "Binary file body required" });
        }

        const fileUrl = `uploads/${estate.id}/${existing.documentType}.pdf`;

        const document = await prisma.estateDocument.update({
            where: { id: req.params.id },
            data: {
                fileUrl,
                content: encryptBuffer(req.body) as any,
                status: "OBTAINED",
                obtainedDate: new Date()
            }
        });

        res.json({ success: true, document: { ...document, content: undefined } });
    } catch (error) {
        logger.error("Document upload error:", error);
        res.status(500).json({ error: "Failed to upload file" });
    }
});

// Get estate documents (Secured)
router.get("/:estateId/documents", requireEstateAccess, async (req: any, res: Response) => {
    try {
        const { estateId } = req.params;

        const documents = await prisma.estateDocument.findMany({
            where: { estateId },
            orderBy: { createdAt: 'desc' },
            select: { // Exclude large content blob from list
                id: true,
                estateId: true,
                userId: true,
                documentType: true,
                name: true,
                fileUrl: true,
                status: true,
                obtainedDate: true,
                createdAt: true,
                updatedAt: true
            }
        });

        res.json(documents);
    } catch (e: any) {
        res.status(500).json({ error: "Failed to fetch documents" });
    }
});




import { DossierService } from "../services/dossierService.js";

router.get("/my/dossier/download", async (req: any, res: Response) => {
    try {
        const estate = await prisma.estate.findFirst({ where: { userId: req.user.id } });
        if (!estate) return res.status(404).json({ error: "Estate not found" });

        const data = await DossierService.generateDossierData(estate.id);
        const report = DossierService.formatComplianceSummary(data);

        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename=Compliance_Dossier_${estate.deceasedLastName}.txt`);
        res.send(report);
    } catch (e: any) {
        logger.error("Dossier generation error:", e);
        res.status(500).json({ error: "Failed to generate compliance dossier" });
    }
});

import { AccountingService } from "../services/accountingService.js";

router.get("/my/accounting-readiness", requireEstateStatus({
    requiredStatus: "ACTIVE",
    customMessage: "Accounting features require active estate status",
    wizardStep: "AUTHORITY_SETUP"
}), async (req: any, res: Response) => {
    try {
        const estate = await prisma.estate.findFirst({ where: { userId: req.user.id } });
        if (!estate) return res.status(404).json({ error: "Estate not found" });

        const readiness = await AccountingService.getReadiness(estate.id);
        res.json(readiness);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

import { DistributionService } from "../services/distributionService.js";

router.get("/my/distribution-readiness", async (req: any, res: Response) => {
    try {
        const estate = await prisma.estate.findFirst({ where: { userId: req.user.id } });
        if (!estate) return res.status(404).json({ error: "Estate not found" });

        const readiness = await DistributionService.checkReadiness(estate.id);

        // Auto-log restricted/allowed status if not already logged recently
        const lastLog = await prisma.settlementActivity.findFirst({
            where: { estateId: estate.id, phase: 'DISTRIBUTION', notes: { contains: 'DISTRIBUTION' } },
            orderBy: { occurredAt: 'desc' }
        });

        const expectedNotes = readiness.status === 'ALLOWED'
            ? "DISTRIBUTION ALLOWED – All required prerequisites satisfied"
            : "DISTRIBUTION RESTRICTED – Legal prerequisites not yet satisfied";

        if (!lastLog || lastLog.notes !== expectedNotes) {
            await DistributionService.logEvent(estate.id, req.user.id, readiness.status === 'ALLOWED' ? 'DISTRIBUTION_ALLOWED' : 'DISTRIBUTION_RESTRICTED');
        }

        res.json(readiness);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// ... imports at top ...
import { RiskService } from "../services/riskService.js";

// ... existing code ...

router.post("/my/distribution-activity", async (req: any, res: Response) => {
    try {
        const estate = await prisma.estate.findFirst({ where: { userId: req.user.id } });
        if (!estate) return res.status(404).json({ error: "Estate not found" });

        const { eventType, notes, overrideConfirmation } = req.body;

        // RISK MONITOR CHECK (RISK-001)
        if (eventType === 'AUTHORIZED' || eventType === 'EXECUTED') {
            const riskReport = await RiskService.assessEstateRisk(estate.id);

            if (riskReport.blockers.length > 0 && !overrideConfirmation) {
                return res.status(400).json({
                    error: "Action Blocked by Risk Monitor",
                    reasons: riskReport.blockers,
                    riskReport
                });
            }

            if (overrideConfirmation && riskReport.blockers.length > 0) {
                // Determine user intent note
                const overrideNote = ` [RISK OVERRIDE: ${req.user.firstName} authorized despite ${riskReport.level} risk]`;
                req.body.notes = (req.body.notes || "") + overrideNote;
            }
        }

        const activity = await DistributionService.logEvent(estate.id, req.user.id, eventType, req.body.notes);
        res.json(activity);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default router;

// Roadmap endpoints
import {
    getEstateRoadmap,
    completeTask,
    uncompleteTask,
    getTaskCompletions,
    pinEstateRoadmap,
    repinEstateRoadmap
} from "../services/roadmapService.js";

const VALID_STATE_CODE = /^[A-Z]{2}$/;

// GET /:id/roadmap - Get personalized roadmap (requires subscription)
router.get("/:id/roadmap", requireSubscription, async (req: any, res: Response) => {
    try {
        const { id } = req.params;

        // Verify user has access to this estate
        const estate = await prisma.estate.findFirst({
            where: {
                id,
                OR: [
                    { userId: req.user.id },
                    { grants: { some: { userId: req.user.id } } }
                ]
            },
            select: {
                id: true,
                deceasedState: true,
                estateAuthorityType: true,
                completenessLevel: true,
                deceasedFirstName: true,
                deceasedLastName: true,
                userId: true,
                estateStatus: true,
            }
        });

        if (!estate) {
            return res.status(404).json({ error: "Estate not found or access denied" });
        }

        // 🚨 ESTATE STATUS GATE: Check new estateStatus field first
        // Only gate if estateStatus is explicitly "DRAFT" - legacy estates (null/undefined) 
        // fall back to completenessLevel check below
        const explicitEstateStatus = (estate as any).estateStatus;
        if (explicitEstateStatus === "DRAFT") {
            logger.warn({ estateId: id, estateStatus: explicitEstateStatus }, "Roadmap blocked — estate is in DRAFT status");
            return res.status(409).json({
                code: "INCOMPLETE_ESTATE",
                error: "Estate setup incomplete",
                currentStatus: explicitEstateStatus,
                requiredStatus: "MINIMUM_READY",
                requiredStep: "TRACK_SELECTION"
            });
        }

        // Minimum intake gate: require state + deceased name before roadmap generation
        const rawState = estate.deceasedState;
        if (!rawState || !VALID_STATE_CODE.test(rawState.trim().toUpperCase())) {
            logger.warn({ estateId: id, deceasedState: rawState }, "Roadmap requested for estate with invalid or missing state code");
            return res.status(409).json({
                code: "MINIMUM_INTAKE_REQUIRED",
                error: "State information required",
                requiredFields: ["deceasedState"],
                wizardStep: "TRACK_SELECTION"
            });
        }

        const shouldFallbackToCompleteness = explicitEstateStatus == null;
        if (shouldFallbackToCompleteness) {
            // 🚨 MINIMUM INTAKE GATE: Prevent misleading roadmaps for incomplete legacy estates
            const { estateAuthorityType, completenessLevel } = estate;
            if (completenessLevel !== "MINIMUM_READY" && completenessLevel !== "PROFILE_READY") {
                logger.warn({ estateId: id, completenessLevel, estateAuthorityType }, "Roadmap blocked — minimum intake not complete");
                return res.status(409).json({
                    code: "MINIMUM_INTAKE_REQUIRED",
                    error: "Estate requires authority type selection before generating roadmap",
                    requiredFields: ["estateAuthorityType"],
                    wizardStep: "TRACK_SELECTION"
                });
            }

            if (!estateAuthorityType || estateAuthorityType === "UNSET") {
                logger.warn({ estateId: id, estateAuthorityType }, "Roadmap blocked — authority type is UNSET");
                return res.status(409).json({
                    code: "MINIMUM_INTAKE_REQUIRED",
                    error: "Estate requires authority type selection before generating roadmap",
                    requiredFields: ["estateAuthorityType"],
                    wizardStep: "TRACK_SELECTION"
                });
            }
        }

        const hasDeceasedName = (estate.deceasedFirstName && estate.deceasedFirstName.trim().length > 0) ||
            (estate.deceasedLastName && estate.deceasedLastName.trim().length > 0);
        if (!hasDeceasedName) {
            logger.warn({ estateId: id }, "Roadmap requested without deceased name");
            return res.status(400).json({
                error: "Incomplete estate profile",
                code: "INTAKE_INCOMPLETE",
                message: "Please enter the deceased's name before generating a roadmap.",
                missingFields: ["deceasedFirstName"]
            });
        }

        // Get personalized roadmap
        const roadmap = await getEstateRoadmap(id);
        res.json(roadmap);
    } catch (error: any) {
        if (error.message === 'STATE_REQUIRED') {
            return res.status(409).json({
                code: "MINIMUM_INTAKE_REQUIRED",
                error: "State not selected",
                requiredFields: ["deceasedState"],
                wizardStep: "TRACK_SELECTION"
            });
        }

        if (error.message === 'SCHEMA_MIGRATION_REQUIRED') {
            logger.error("Roadmap unavailable due to schema migration required", {
                estateId: req.params.id,
                userId: req.user?.id
            });
            return res.status(503).json({
                error: "Service temporarily unavailable",
                message: "The system is undergoing maintenance. Please try again in a few minutes.",
                code: "SCHEMA_MIGRATION_PENDING"
            });
        }
        logger.error({ estateId: req.params.id, error: error.message, stack: error.stack }, "Error fetching roadmap");
        res.status(500).json({ error: "Failed to fetch roadmap", message: error.message });
    }
});

/**
 * POST /:id/pin - Freeze the current roadmap
 */
router.post("/:id/pin", requireSubscription, async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const result = await pinEstateRoadmap(id, req.user.id);
        res.json(result);
    } catch (error: any) {
        logger.error("Error pinning roadmap:", error);
        res.status(error.message === 'STATE_REQUIRED' ? 400 : 500).json({
            error: "Failed to pin roadmap",
            message: error.message
        });
    }
});

/**
 * GET /:id/repinPreview - Preview what would change if repinned
 * Returns diff of tasks added/removed and impact on completed tasks
 */
router.get("/:id/repinPreview", requireSubscription, async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        
        // Verify user has access to this estate
        const estate = await prisma.estate.findFirst({
            where: {
                id,
                OR: [
                    { userId: req.user.id },
                    { grants: { some: { userId: req.user.id } } }
                ]
            }
        });

        if (!estate) {
            return res.status(404).json({ error: "Estate not found or access denied" });
        }

        const { getRepinPreview } = await import("../services/authorityChangeService.js");
        const preview = await getRepinPreview(id);
        
        res.json(preview);
    } catch (error: any) {
        logger.error("Error getting repin preview:", error);
        res.status(500).json({ error: "Failed to get repin preview", message: error.message });
    }
});

/**
 * POST /:id/repin - Update frozen roadmap to latest
 * Requires confirmation if completed tasks would be affected
 */
router.post("/:id/repin", requireSubscription, async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const { force, confirm } = req.body;
        const result = await repinEstateRoadmap(id, req.user.id, !!(force || confirm));
        res.json(result);
    } catch (error: any) {
        if (error.message === "REPIN_BLOCKED_COMPLETED_TASKS") {
            return res.status(409).json({
                error: "Repin Blocked",
                code: "REPIN_BLOCKED",
                message: "This estate has completed tasks. Repinning will lose progress mapping unless forced."
            });
        }
        if (error.message === "REPIN_REQUIRES_CONFIRMATION") {
            return res.status(409).json({
                error: "Repin Requires Confirmation",
                code: "REPIN_REQUIRES_CONFIRMATION",
                message: "This repin would affect completed tasks or remove tasks. Please confirm or use force=true."
            });
        }
        logger.error("Error repinning roadmap:", error);
        res.status(500).json({ error: "Failed to repin roadmap", message: error.message });
    }
});

/**
 * GET /:id/authorityHistory - Get authority change history for audit
 */
router.get("/:id/authorityHistory", requireSubscription, async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        
        // Verify user has access to this estate
        const estate = await prisma.estate.findFirst({
            where: {
                id,
                OR: [
                    { userId: req.user.id },
                    { grants: { some: { userId: req.user.id } } }
                ]
            }
        });

        if (!estate) {
            return res.status(404).json({ error: "Estate not found or access denied" });
        }

        const { getAuthorityChangeHistory } = await import("../services/authorityChangeService.js");
        const history = await getAuthorityChangeHistory(id);
        
        res.json(history);
    } catch (error: any) {
        logger.error("Error getting authority history:", error);
        res.status(500).json({ error: "Failed to get authority history", message: error.message });
    }
});

/**
 * GET /:id/jurisdictionPreview - Non-task hints about jurisdiction
 */
router.get("/:id/jurisdictionPreview", async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const estate = await prisma.estate.findUnique({ where: { id } });
        if (!estate || !estate.deceasedState) {
            return res.status(404).json({ error: "Jurisdiction not set" });
        }

        // Return preview metadata (authority engine recommendation, count of tasks, etc.)
        const profile = await getEstateRoadmap(id);
        res.json({
            state: estate.deceasedState,
            county: estate.probateCounty,
            authorityRecommendation: profile.profile.procedureType,
            activeEngines: profile.profile.activeEngines,
            totalTasks: profile.phases.reduce((acc, p) => acc + p.tasks.length, 0)
        });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// GET /:id/tasks - Get task completions (requires subscription)
router.get("/:id/tasks", requireSubscription, async (req: any, res: Response) => {
    try {
        const { id } = req.params;

        // Verify user has access to this estate
        const estate = await prisma.estate.findFirst({
            where: {
                id,
                OR: [
                    { userId: req.user.id },
                    { grants: { some: { userId: req.user.id } } }
                ]
            }
        });

        if (!estate) {
            return res.status(404).json({ error: "Estate not found or access denied" });
        }

        // Get task completions
        const completions = await getTaskCompletions(id);
        res.json(completions);
    } catch (error: any) {
        console.error("Error fetching task completions:", error);
        res.status(500).json({ error: "Failed to fetch task completions", message: error.message });
    }
});

router.post("/:id/tasks/:taskId/complete", requireSubscription, async (req: any, res: Response) => {
    try {
        const { id, taskId } = req.params;
        const { notes } = req.body;

        // Verify user has access to this estate
        const estate = await prisma.estate.findFirst({
            where: {
                id,
                OR: [
                    { userId: req.user.id },
                    { grants: { some: { userId: req.user.id } } }
                ]
            },
            select: {
                id: true,
                completenessLevel: true,
                userId: true,
                estateStatus: true,
            }
        });

        if (!estate) {
            return res.status(404).json({ error: "Estate not found or access denied" });
        }

        // 🚨 ESTATE STATUS GATE: Check new estateStatus field first
        // Only gate if estateStatus is explicitly "DRAFT" - legacy estates (null/undefined) 
        // fall back to completenessLevel check below
        const explicitEstateStatus = (estate as any).estateStatus;
        if (explicitEstateStatus === "DRAFT") {
            logger.warn({ estateId: id, estateStatus: explicitEstateStatus, taskId }, "Task completion blocked — estate is in DRAFT status");
            return res.status(409).json({
                code: "INCOMPLETE_ESTATE",
                error: "Complete estate setup before marking tasks complete",
                currentStatus: explicitEstateStatus,
                requiredStatus: "MINIMUM_READY",
                requiredStep: "TRACK_SELECTION"
            });
        }

        const shouldFallbackToCompleteness = explicitEstateStatus == null;
        if (shouldFallbackToCompleteness) {
            // 🚨 MINIMUM INTAKE GATE: Block task completion until setup is complete
            if (estate.completenessLevel !== "MINIMUM_READY" && estate.completenessLevel !== "PROFILE_READY") {
                return res.status(409).json({
                    code: "MINIMUM_INTAKE_REQUIRED",
                    error: "Complete estate setup before marking tasks complete",
                    wizardStep: "TRACK_SELECTION"
                });
            }
        }

        // Complete task
        const result = await completeTask(id, taskId, req.user.id, notes);
        res.json(result);
    } catch (error: any) {
        console.error("Error completing task:", error);
        res.status(500).json({ error: "Failed to complete task", message: error.message });
    }
});

router.delete("/:id/tasks/:taskId/complete", requireSubscription, requireEstateAccess, requireAuthorityStatus({
    operation: "estate:amend",
    customMessage: "Modifying task completions requires legal authority"
}), async (req: any, res: Response) => {
    try {
        const { id, taskId } = req.params;

        // Verify user has access to this estate
        const estate = await prisma.estate.findFirst({
            where: {
                id,
                OR: [
                    { userId: req.user.id },
                    { grants: { some: { userId: req.user.id } } }
                ]
            }
        });

        if (!estate) {
            return res.status(404).json({ error: "Estate not found or access denied" });
        }

        // Uncomplete task
        const result = await uncompleteTask(id, taskId, req.user.id);

        // Log the task uncompletion
        await AuditService.logActivity(
            id,
            req.user.id,
            "TASK",
            "UNCOMPLETED",
            `Uncompleted task: ${taskId}`
        );

        res.json(result);
    } catch (error: any) {
        logger.error("Error uncompleting task:", error.message);
        res.status(500).json({ error: "Failed to uncomplete task" });
    }
});

// Track Selection Onboarding Endpoint
const trackSelectionSchema = z.object({
    estateAuthorityType: z.enum(["PROBATE", "TRUST", "BOTH"]),
    hasProbateAssets: z.boolean().optional(),
    hasTrustAssets: z.boolean().optional(),
    hasBeneficiaryAssets: z.boolean().optional(),
    assistedDecisionAnswers: z.record(z.unknown()).optional(),
});

router.post("/:id/select-track", authenticate, requireEstateAccess, async (req: any, res: Response) => {
    try {
        const { id } = req.params;

        // Verify user has access to this estate
        const estate = await prisma.estate.findFirst({
            where: {
                id,
                OR: [
                    { userId: req.user.id },
                    { grants: { some: { userId: req.user.id } } }
                ]
            }
        });

        if (!estate) {
            return res.status(404).json({ error: "Estate not found or access denied" });
        }

        // Validate request body
        const validated = trackSelectionSchema.parse(req.body);
        const assistedDecisionAnswers = validated.assistedDecisionAnswers as Prisma.InputJsonValue | undefined;

        // Update estate with track selection and advance completeness level
        const updatedEstate = await prisma.estate.update({
            where: { id },
            data: {
                userSelectedEstateAuthorityType: validated.estateAuthorityType,
                userSelectedAuthorityAt: new Date(),
                hasProbateAssets: validated.hasProbateAssets,
                hasTrustAssets: validated.hasTrustAssets,
                hasBeneficiaryAssets: validated.hasBeneficiaryAssets,
                assistedDecisionAnswers,
                // Advance to MINIMUM_READY once user has selected a track.
                // deceasedState is required at estate creation so it is always present here.
                completenessLevel: "MINIMUM_READY",
                // Also update estateStatus for lifecycle gating
                estateStatus: "MINIMUM_READY",
            }
        });

        // Log activity
        await AuditService.logActivity(
            id,
            req.user.id,
            "TRACK_SELECTION",
            "SELECTED",
            `User selected track: ${validated.estateAuthorityType}`
        );

        logger.info({
            estateId: id,
            userId: req.user.id,
            selectedTrack: validated.estateAuthorityType,
        }, "Track selection recorded");

        res.json({
            success: true,
            estateId: id,
            selectedTrack: validated.estateAuthorityType,
            selectedAt: updatedEstate.userSelectedAuthorityAt,
        });
    } catch (error: any) {
        logger.error("Error selecting track:", error.message);
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: "Invalid request data", details: error.errors });
        }
        res.status(500).json({ error: "Failed to select track", message: error.message });
    }
});
