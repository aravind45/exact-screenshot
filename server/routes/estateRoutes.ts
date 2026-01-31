import { Router, Request, Response } from "express";
import { prisma } from "../db.js";
import { EmailService } from "../services/emailService.js";

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
            return res.json(updatedEstate);
        }
        res.json(estate);
    } catch (error: any) {
        console.error("CRITICAL Estate Fetch Error:", error);
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
        const allowedFields = [
            'name', 'deceasedFirstName', 'deceasedLastName', 'deceasedDateOfDeath', 'deceasedState',
            'estateType', 'authorityType', 'authorityStatus', 'certifiedCopies', 'authorityEffectiveDate',
            'iaeaType', 'appointedDate', 'probateStatus', 'courtCaseNumber', 'probateCounty', 'status',
            'petitionerPhone', 'petitionerIsAttorney', 'hasWill', 'willDate', 'codicilDates',
            'estimatedPersonalProperty', 'estimatedRealProperty', 'estimatedAnnualIncome',
            'bondAmount', 'bondWaived', 'probateNotes', 'hearingDate', 'hearingTime', 'hearingDept', 'hearingAddress'
        ];

        const updateData: any = {};
        const dateFields = ['deceasedDateOfDeath', 'deceasedDateOfBirth', 'authorityEffectiveDate', 'appointedDate', 'willDate', 'hearingDate'];

        const numericFields = ['certifiedCopies', 'estimatedPersonalProperty', 'estimatedRealProperty', 'estimatedAnnualIncome', 'bondAmount'];
        for (const key of allowedFields) {
            if (req.body[key] !== undefined) {
                if (dateFields.includes(key)) {
                    if (req.body[key]) {
                        const date = new Date(req.body[key]);
                        if (!isNaN(date.getTime())) {
                            updateData[key] = date;
                        } else {
                            updateData[key] = null;
                        }
                    } else {
                        updateData[key] = null;
                    }
                } else if (numericFields.includes(key)) {
                    if (req.body[key] === "" || req.body[key] === null) {
                        updateData[key] = null;
                    } else {
                        const val = parseFloat(req.body[key]);
                        updateData[key] = isNaN(val) ? null : val;
                    }
                } else if (key === 'codicilDates' && typeof req.body[key] === 'string') {
                    updateData[key] = req.body[key].split(',').map((s: string) => s.trim()).filter(Boolean);
                } else {
                    updateData[key] = req.body[key];
                }
            }
        }

        const updated = await prisma.estate.update({
            where: { id: estate.id },
            data: updateData
        });

        // If status changed to EXECUTOR_APPOINTED, auto-sync assets
        if (req.body.probateStatus === 'EXECUTOR_APPOINTED' && estate.probateStatus !== 'EXECUTOR_APPOINTED') {
            const { AssetService } = await import("../services/assetService.js");
            await AssetService.autoSyncAssetsForEstate(estate.id);
        }

        res.json(updated);
    } catch (error: any) {
        console.error("Estate Update Error:", error);
        res.status(500).json({ error: "Failed to update estate", message: error.message });
    }
});

// Roadmap Persistence
router.put("/my/roadmap", async (req: any, res: Response) => {
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

        const { completedTaskIds, completedPhases, taskId, action, phase } = req.body;

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
                action === 'UNCOMPLETED' ? 'Uncompleted' :
                    action === 'PHASE_COMPLETED' ? 'Completed Phase' : action;

            await prisma.settlementActivity.create({
                data: {
                    estateId: estate.id,
                    userId: req.user.id,
                    taskId,
                    phase,
                    action,
                    notes: `${actionLabel}: ${taskTitle}${phaseName ? ` (${phaseName})` : ''}`
                }
            });
        }

        res.json(updated);
    } catch (e: any) {
        console.error("Roadmap update error:", e);
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
        res.status(500).json({ error: "Failed to fetch activities" });
    }
});

router.get("/my/activities/download", async (req: any, res: Response) => {
    try {
        const estate = await prisma.estate.findFirst({ where: { userId: req.user.id } });
        if (!estate) return res.status(404).json({ error: "Estate not found" });

        const activities = await prisma.settlementActivity.findMany({
            where: { estateId: estate.id },
            orderBy: { occurredAt: 'desc' }
        });

        const { DossierService } = await import("../services/dossierService.js");
        const log = DossierService.formatActivityLog(estate, activities);

        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename=Settlement_Trail_${estate.deceasedLastName}.txt`);
        res.send(log);
    } catch (e: any) {
        console.error("Activity download error:", e);
        res.status(500).json({ error: "Failed to download activity log" });
    }
});

// Heir Management
router.post("/my/heirs", async (req: any, res: Response) => {
    try {
        const estate = await prisma.estate.findFirst({ where: { userId: req.user.id } });
        if (!estate) return res.status(404).json({ error: "Estate not found" });

        const heir = await prisma.heir.create({
            data: {
                ...req.body,
                estateId: estate.id
            }
        });
        res.json(heir);
    } catch (error) {
        res.status(500).json({ error: "Failed to create heir" });
    }
});

router.put("/my/heirs/:id", async (req: any, res: Response) => {
    try {
        // meaningful security check: ensure heir belongs to user's estate
        const estate = await prisma.estate.findFirst({ where: { userId: req.user.id } });
        if (!estate) return res.status(404).json({ error: "Estate not found" });

        const count = await prisma.heir.count({ where: { id: req.params.id, estateId: estate.id } });
        if (count === 0) return res.status(404).json({ error: "Heir not found" });

        const updated = await prisma.heir.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: "Failed to update heir" });
    }
});

router.delete("/my/heirs/:id", async (req: any, res: Response) => {
    try {
        const estate = await prisma.estate.findFirst({ where: { userId: req.user.id } });
        if (!estate) return res.status(404).json({ error: "Estate not found" });

        const count = await prisma.heir.count({ where: { id: req.params.id, estateId: estate.id } });
        if (count === 0) return res.status(404).json({ error: "Heir not found" });

        await prisma.heir.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete heir" });
    }
});

import { PdfService } from "../services/pdfService.js";

router.get("/my/petition/pdf", async (req: any, res: Response) => {
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
        console.error("PDF Generation Error:", error);
        res.status(500).json({ error: "Failed to generate PDF: " + error.message });
    }
});

// Upload completed probate form
router.post("/:estateId/documents", async (req: any, res: Response) => {
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
            content: req.body,
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

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=${document.documentType}_Completed.pdf`);
        res.send(document.content);
    } catch (e: any) {
        res.status(500).json({ error: "Failed to download document" });
    }
});

// Create estate document record (metadata only)
router.post("/my/documents", async (req: any, res: Response) => {
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
        await prisma.settlementActivity.create({
            data: {
                estateId: estate.id,
                userId: req.user.id,
                type: 'DOCUMENT',
                action: 'CREATED',
                notes: `Created document record: ${document.name} (${document.documentType})`
            }
        });
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
        await prisma.settlementActivity.create({
            data: {
                estateId: estate.id,
                userId: req.user.id,
                type: 'DOCUMENT',
                action: 'DELETED',
                notes: `Deleted document: ${deletedDoc.name} (${deletedDoc.documentType})`
            }
        });

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
                content: req.body,
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

// Get estate documents
router.get("/:estateId/documents", async (req: any, res: Response) => {
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
router.get("/:estateId/deadlines", async (req: any, res: Response) => {
    try {
        const { DeadlineService } = await import("../services/deadlineService.js");
        const deadlines = await DeadlineService.getDeadlines(req.params.estateId);
        res.json(deadlines);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch deadlines" });
    }
});

router.post("/:estateId/deadlines", async (req: any, res: Response) => {
    try {
        const { DeadlineService } = await import("../services/deadlineService.js");
        const deadline = await DeadlineService.createDeadline(req.params.estateId, {
            ...req.body,
            dueDate: new Date(req.body.dueDate)
        });
        res.json(deadline);
    } catch (error) {
        res.status(500).json({ error: "Failed to create deadline" });
    }
});

router.put("/:estateId/deadlines/:id", async (req: any, res: Response) => {
    try {
        const { DeadlineService } = await import("../services/deadlineService.js");
        const deadline = await DeadlineService.updateDeadline(
            req.params.id,
            req.params.estateId,
            req.body.dueDate ? { ...req.body, dueDate: new Date(req.body.dueDate) } : req.body
        );
        res.json(deadline);
    } catch (error) {
        res.status(500).json({ error: "Failed to update deadline" });
    }
});

router.delete("/:estateId/deadlines/:id", async (req: any, res: Response) => {
    try {
        const { DeadlineService } = await import("../services/deadlineService.js");
        await DeadlineService.deleteDeadline(req.params.id, req.params.estateId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete deadline" });
    }
});

router.post("/:estateId/deadlines/generate", async (req: any, res: Response) => {
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

export default router;
