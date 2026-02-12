import { Router, Request, Response } from "express";
import { prisma } from "../db.js";
import { EmailService } from "../services/emailService.js";
import { encrypt, decrypt, encryptBuffer, decryptBuffer } from "../utils/encryption.js";
import { AuditService } from "../services/auditService.js";
import { requireRole } from "../middleware/rbac.js";
import { requireEstateAccess } from "../middleware/estateAuth.js";
import { z } from "zod";
import { logger } from "../lib/logger.js";
import { requireSubscription } from "../middleware/subscription.js";

const estateUpdateSchema = z.object({
    name: z.string().optional(),
    deceasedFirstName: z.string().optional(),
    deceasedLastName: z.string().optional(),
    deceasedDateOfBirth: z.string().optional().nullable(),
    deceasedDateOfDeath: z.string().optional().nullable(),
    deceasedState: z.string().optional(),
    estateType: z.string().optional(),
    authorityType: z.string().optional(),
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
    deceasedSsn: z.string().optional()
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

router.get("/my", async (req: any, res: Response) => {
    try {
        const estate = await prisma.estate.findFirst({
            where: {
                OR: [
                    { userId: req.user.id },
                    { grants: { some: { userId: req.user.id } } }
                ]
            },
            include: { user: true }
        });
        if (estate) {
            try {
                await EmailService.ensureEstateHandle(estate.id);
            } catch (handleErr) {
                console.warn("Failed to ensure estate handle (non-fatal):", handleErr);
            }
            // Re-fetch to get the new handle/email if it was just created
            const updatedEstate = await prisma.estate.findUnique({
                where: { id: estate.id },
                include: { user: true }
            });

            if (updatedEstate) {
                // Decrypt SSN for display
                updatedEstate.deceasedSsn = updatedEstate.deceasedSsn ? decrypt(updatedEstate.deceasedSsn) : updatedEstate.deceasedSsn;
            }

            return res.json(updatedEstate);
        }
        res.json(estate);
    } catch (error: any) {
        logger.error("CRITICAL Estate Fetch Error:", error.message);
        res.status(500).json({ error: "Failed to fetch estate", message: error.message });
    }
});

router.put("/my", async (req: any, res: Response) => {
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

        // Whitelist allowed fields and parse dates
        const validated = estateUpdateSchema.parse(req.body);

        const updateData: any = {};
        const dateFields = ['deceasedDateOfDeath', 'deceasedDateOfBirth', 'authorityEffectiveDate', 'appointedDate', 'willDate', 'hearingDate'];
        const numericFields = ['certifiedCopies', 'estimatedPersonalProperty', 'estimatedRealProperty', 'estimatedAnnualIncome', 'bondAmount'];

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
                updateData[key] = value === "" ? null : value;
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
        if (req.user.state && !US_STATES.includes(req.user.state)) {
            shouldEnableInternational = true;
            newReasons.push("EXECUTOR_RESIDENCE");
        }

        // 2. Deceased State Check (Ancillary indication)
        // If deceasedState is updated and NOT in US_STATES (assuming it might store country if freely entered, though typically it's restricted)
        // For now, we trust the frontend dropdowns, but if we later capture "Country", checking here is good.

        // 3. User Citizenship (if tracked) or Mailing Address
        // (Assuming we might check specific other fields if they existed)

        if (shouldEnableInternational) {
            // Only update if not already set or if adding new reasons
            const currentReasons = estate.internationalReasons || [];
            if (!estate.isInternational || !newReasons.every(r => currentReasons.includes(r))) {
                updateData.isInternational = true;
                // Merge unique reasons
                updateData.internationalReasons = [...new Set([...currentReasons, ...newReasons])];

                // Log High-Signal Event
                await prisma.settlementActivity.create({
                    data: {
                        estateId: estate.id,
                        userId: req.user.id,
                        type: 'CONFIGURATION',
                        action: 'UPDATED',
                        notes: `INTERNATIONAL MODE ENABLED – Detected: ${newReasons.join(", ")}`
                    }
                });
            }
        }

        const updated = await prisma.estate.update({
            where: { id: estate.id },
            data: updateData
        });

        // Decrypt SSN for response
        if (updated.deceasedSsn) {
            updated.deceasedSsn = decrypt(updated.deceasedSsn);
        }

        // Log Configuration Activity
        const updatedFields = Object.keys(updateData).length;
        if (updatedFields > 0) {
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
        if (req.body.probateStatus === 'EXECUTOR_APPOINTED' && estate.probateStatus !== 'EXECUTOR_APPOINTED') {
            const { AssetService } = await import("../services/assetService.js");
            await AssetService.autoSyncAssetsForEstate(estate.id);
        }

        res.json(updated);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: "Validation failed", details: error.errors });
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
            }
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

        const { PdfService } = await import("../services/pdfService.js");

        // SEC-003: Verify Chain Integrity before export
        const verification = await AuditService.verifyChain(estate.id);

        const pdfBytes = await PdfService.generateActivityLogPdf(estate, activities, req.user.fullName, {
            pendingTasks,
            negativeFindings,
            verification // Pass verification result to PDF
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Settlement_Trail_${estate.deceasedLastName}.pdf`);
        res.send(Buffer.from(pdfBytes));
    } catch (e: any) {
        console.error("Activity download error:", e);
        res.status(500).json({ error: "Failed to download activity log" });
    }
});

// [REMOVED DUPLICATE HEIR ROUTES - HANDLED IN heirRoutes.ts]

import { PdfService } from "../services/pdfService.js";

router.get("/my/petition/pdf", requireSubscription, async (req: any, res: Response) => {
    try {
        const estate = await prisma.estate.findFirst({
            where: { userId: req.user.id },
            include: { user: true, heirs: true }
        });

        if (!estate) return res.status(404).json({ error: "Estate not found" });

        const pdfBytes = await PdfService.generateDE111(estate);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=Petition_DE111.pdf');
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
        console.error("Document upload error:", e);
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
        console.error("Create document error:", error);
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
        console.error("Document upload error:", error);
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

// Deadline Management
router.get("/:estateId/deadlines", requireEstateAccess, async (req: any, res: Response) => {
    try {
        const { DeadlineService } = await import("../services/deadlineService.js");
        const deadlines = await DeadlineService.getDeadlines(req.params.estateId);
        res.json(deadlines);
    } catch (error: any) {
        logger.error("Deadline Fetch Error:", error.message);
        res.status(500).json({ error: "Failed to fetch deadlines" });
    }
});

router.post("/:estateId/deadlines", requireEstateAccess, async (req: any, res: Response) => {
    try {
        const validated = deadlineSchema.parse(req.body);
        const { DeadlineService } = await import("../services/deadlineService.js");
        const deadline = await DeadlineService.createDeadline(req.params.estateId, {
            title: validated.title,
            dueDate: new Date(validated.dueDate)
        });
        res.json(deadline);
    } catch (error: any) {
        if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid input", details: error.errors });
        logger.error("Deadline Create Error:", error.message);
        res.status(500).json({ error: "Failed to create deadline" });
    }
});

router.put("/:estateId/deadlines/:id", requireEstateAccess, async (req: any, res: Response) => {
    try {
        const validated = deadlineSchema.partial().parse(req.body);
        const { DeadlineService } = await import("../services/deadlineService.js");

        const updateData: any = { ...validated };
        if (validated.dueDate) {
            updateData.dueDate = new Date(validated.dueDate);
        }

        const deadline = await DeadlineService.updateDeadline(
            req.params.id,
            req.params.estateId,
            updateData
        );
        res.json(deadline);
    } catch (error: any) {
        if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid input", details: error.errors });
        logger.error("Deadline Update Error:", error.message);
        res.status(500).json({ error: "Failed to update deadline" });
    }
});

router.delete("/:estateId/deadlines/:id", requireEstateAccess, async (req: any, res: Response) => {
    try {
        const { DeadlineService } = await import("../services/deadlineService.js");
        await DeadlineService.deleteDeadline(req.params.id, req.params.estateId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete deadline" });
    }
});

router.post("/:estateId/deadlines/generate", requireEstateAccess, async (req: any, res: Response) => {
    try {
        const { DeadlineService } = await import("../services/deadlineService.js");
        const deadlines = await DeadlineService.generateStatutoryDeadlines(req.params.estateId);
        res.json(deadlines);
    } catch (error) {
        res.status(500).json({ error: "Failed to generate deadlines" });
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
        console.error("Dossier generation error:", e);
        res.status(500).json({ error: "Failed to generate compliance dossier" });
    }
});

import { AccountingService } from "../services/accountingService.js";

router.get("/my/accounting-readiness", async (req: any, res: Response) => {
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
import { getEstateRoadmap, completeTask, uncompleteTask, getTaskCompletions } from "../services/roadmapService.js";

router.get("/:id/roadmap", async (req: any, res: Response) => {
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

        // Get personalized roadmap
        const roadmap = await getEstateRoadmap(id);
        res.json(roadmap);
    } catch (error: any) {
        console.error("Error fetching roadmap:", error);
        res.status(500).json({ error: "Failed to fetch roadmap", message: error.message });
    }
});

router.get("/:id/tasks", async (req: any, res: Response) => {
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

router.post("/:id/tasks/:taskId/complete", async (req: any, res: Response) => {
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
            }
        });

        if (!estate) {
            return res.status(404).json({ error: "Estate not found or access denied" });
        }

        // Complete task
        const result = await completeTask(id, taskId, req.user.id, notes);
        res.json(result);
    } catch (error: any) {
        console.error("Error completing task:", error);
        res.status(500).json({ error: "Failed to complete task", message: error.message });
    }
});

router.delete("/:id/tasks/:taskId/complete", async (req: any, res: Response) => {
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
        res.json(result);
    } catch (error: any) {
        logger.error("Error uncompleting task:", error.message);
        res.status(500).json({ error: "Failed to uncomplete task" });
    }
});
