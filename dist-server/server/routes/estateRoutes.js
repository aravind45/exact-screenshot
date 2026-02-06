import { Router } from "express";
import { prisma } from "../db.js";
import { EmailService } from "../services/emailService.js";
import { encrypt, decrypt } from "../utils/encryption.js";
import { AuditService } from "../services/auditService.js";
const router = Router();
router.get("/my", async (req, res) => {
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
            }
            catch (handleErr) {
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
    }
    catch (error) {
        console.error("CRITICAL Estate Fetch Error:", error);
        res.status(500).json({ error: "Failed to fetch estate", message: error.message });
    }
});
router.put("/my", async (req, res) => {
    try {
        const estate = await prisma.estate.findFirst({
            where: {
                OR: [
                    { userId: req.user.id },
                    { grants: { some: { userId: req.user.id } } }
                ]
            }
        });
        if (!estate)
            return res.status(404).json({ error: "Estate not found" });
        // Whitelist allowed fields and parse dates
        const allowedFields = [
            'name', 'deceasedFirstName', 'deceasedLastName', 'deceasedDateOfBirth', 'deceasedDateOfDeath', 'deceasedState',
            'estateType', 'authorityType', 'authorityStatus', 'certifiedCopies', 'authorityEffectiveDate',
            'iaeaType', 'appointedDate', 'probateStatus', 'courtCaseNumber', 'probateCounty', 'status',
            'petitionerPhone', 'petitionerIsAttorney', 'hasWill', 'willDate', 'codicilDates',
            'estimatedPersonalProperty', 'estimatedRealProperty', 'estimatedAnnualIncome',
            'bondAmount', 'bondWaived', 'probateNotes', 'hearingDate', 'hearingTime', 'hearingDept', 'hearingAddress',
            'deceasedSsn' // Added for SEC-001
        ];
        const updateData = {};
        const dateFields = ['deceasedDateOfDeath', 'deceasedDateOfBirth', 'authorityEffectiveDate', 'appointedDate', 'willDate', 'hearingDate'];
        const numericFields = ['certifiedCopies', 'estimatedPersonalProperty', 'estimatedRealProperty', 'estimatedAnnualIncome', 'bondAmount'];
        for (const key of allowedFields) {
            if (req.body[key] !== undefined) {
                if (dateFields.includes(key)) {
                    if (req.body[key]) {
                        const date = new Date(req.body[key]);
                        if (!isNaN(date.getTime())) {
                            updateData[key] = date;
                        }
                        else {
                            updateData[key] = null;
                        }
                    }
                    else {
                        updateData[key] = null;
                    }
                }
                else if (numericFields.includes(key)) {
                    if (req.body[key] === "" || req.body[key] === null) {
                        updateData[key] = null;
                    }
                    else {
                        const val = parseFloat(req.body[key]);
                        updateData[key] = isNaN(val) ? null : val;
                    }
                }
                else if (key === 'codicilDates' && typeof req.body[key] === 'string') {
                    updateData[key] = req.body[key].split(',').map((s) => s.trim()).filter(Boolean);
                }
                else if (key === 'deceasedSsn') {
                    // SEC-001: Encrypt SSN
                    updateData[key] = req.body[key] ? encrypt(req.body[key]) : req.body[key];
                }
                else {
                    updateData[key] = req.body[key];
                }
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
        const newReasons = [];
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
    }
    catch (error) {
        console.error("Estate Update Error:", error);
        res.status(500).json({ error: "Failed to update estate", message: error.message });
    }
});
// Roadmap Persistence
router.put("/my/roadmap", async (req, res) => {
    try {
        const estate = await prisma.estate.findFirst({
            where: {
                OR: [
                    { userId: req.user.id },
                    { grants: { some: { userId: req.user.id } } }
                ]
            }
        });
        if (!estate)
            return res.status(404).json({ error: "Estate not found" });
        const { completedTaskIds, completedPhases, taskId, action, phase } = req.body;
        const updateData = {
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
    }
    catch (e) {
        console.error("Roadmap update error:", e);
        res.status(500).json({ error: "Failed to update roadmap" });
    }
});
router.get("/my/activities", async (req, res) => {
    try {
        const estate = await prisma.estate.findFirst({ where: { userId: req.user.id } });
        if (!estate)
            return res.json([]);
        const activities = await prisma.settlementActivity.findMany({
            where: { estateId: estate.id },
            orderBy: { occurredAt: 'desc' }
        });
        res.json(activities);
    }
    catch (e) {
        console.error("Activities Fetch Error:", e);
        res.status(500).json({ error: "Failed to fetch activities" });
    }
});
router.put("/my/activities/:id", async (req, res) => {
    try {
        const estate = await prisma.estate.findFirst({ where: { userId: req.user.id } });
        if (!estate)
            return res.status(404).json({ error: "Estate not found" });
        const activity = await prisma.settlementActivity.findFirst({
            where: { id: req.params.id, estateId: estate.id }
        });
        if (!activity)
            return res.status(404).json({ error: "Activity not found" });
        const updated = await prisma.settlementActivity.update({
            where: { id: req.params.id },
            data: { notes: req.body.notes }
        });
        res.json(updated);
    }
    catch (e) {
        res.status(500).json({ error: "Failed to update activity" });
    }
});
router.get("/my/activities/download", async (req, res) => {
    try {
        const estate = await prisma.estate.findFirst({ where: { userId: req.user.id } });
        if (!estate)
            return res.status(404).json({ error: "Estate not found" });
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
        const negativeFindings = discoveryStatus?.filter((c) => c.status === 'NOT_FOUND') || [];
        // Calculate Pending Tasks
        const { SETTLEMENT_PHASE_TASKS } = await import("../config/settlementPhases.js");
        const currentPhase = estate.status || 'immediate_actions';
        const phaseData = SETTLEMENT_PHASE_TASKS.find((p) => p.phase === currentPhase);
        const completedTaskIds = estate.roadmapProgress?.completedTaskIds || [];
        const pendingTasks = phaseData?.tasks.filter((t) => !completedTaskIds.includes(t.id)) || [];
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
    }
    catch (e) {
        console.error("Activity download error:", e);
        res.status(500).json({ error: "Failed to download activity log" });
    }
});
// [REMOVED DUPLICATE HEIR ROUTES - HANDLED IN heirRoutes.ts]
import { PdfService } from "../services/pdfService.js";
router.get("/my/petition/pdf", async (req, res) => {
    try {
        const estate = await prisma.estate.findFirst({
            where: { userId: req.user.id },
            include: { user: true, heirs: true }
        });
        if (!estate)
            return res.status(404).json({ error: "Estate not found" });
        const pdfBytes = await PdfService.generateDE111(estate);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=Petition_DE111.pdf');
        res.send(Buffer.from(pdfBytes));
    }
    catch (error) {
        console.error("PDF Generation Error:", error);
        res.status(500).json({ error: "Failed to generate PDF: " + error.message });
    }
});
// Upload completed probate form
router.post("/:estateId/documents", async (req, res) => {
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
                where: { estateId, documentType: documentType }
            })
            : null;
        let document;
        const commonData = {
            fileUrl,
            content: req.body,
            status: "OBTAINED",
            obtainedDate: new Date(),
            name: name
        };
        if (existing) {
            document = await prisma.estateDocument.update({
                where: { id: existing.id },
                data: commonData
            });
        }
        else {
            document = await prisma.estateDocument.create({
                data: {
                    ...commonData,
                    estateId,
                    userId: req.user.id,
                    documentType: documentType,
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
    }
    catch (e) {
        console.error("Document upload error:", e);
        res.status(500).json({ error: "Failed to upload document" });
    }
});
// Download uploaded probate form
router.get("/my/documents/:formCode/download", async (req, res) => {
    try {
        const estate = await prisma.estate.findFirst({ where: { userId: req.user.id } });
        if (!estate)
            return res.status(404).json({ error: "Estate not found" });
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
    }
    catch (e) {
        res.status(500).json({ error: "Failed to download document" });
    }
});
// Create estate document record (metadata only)
router.post("/my/documents", async (req, res) => {
    try {
        const estate = await prisma.estate.findFirst({ where: { userId: req.user.id } });
        if (!estate)
            return res.status(404).json({ error: "Estate not found" });
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
        await AuditService.logActivity(estate.id, req.user.id, 'DOCUMENT', 'CREATED', `Created document record: ${document.name} (${document.documentType})`);
        res.json(document);
    }
    catch (error) {
        console.error("Create document error:", error);
        res.status(500).json({ error: "Failed to create document" });
    }
});
// Update estate document
router.put("/my/documents/:id", async (req, res) => {
    try {
        const estate = await prisma.estate.findFirst({ where: { userId: req.user.id } });
        if (!estate)
            return res.status(404).json({ error: "Estate not found" });
        const count = await prisma.estateDocument.count({
            where: { id: req.params.id, estateId: estate.id }
        });
        if (count === 0)
            return res.status(404).json({ error: "Document not found" });
        const updated = await prisma.estateDocument.update({
            where: { id: req.params.id },
            data: {
                ...req.body,
                obtainedDate: req.body.obtainedDate ? new Date(req.body.obtainedDate) : undefined,
                expirationDate: req.body.expirationDate ? new Date(req.body.expirationDate) : undefined
            }
        });
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to update document" });
    }
});
// Delete estate document
router.delete("/my/documents/:id", async (req, res) => {
    try {
        const estate = await prisma.estate.findFirst({ where: { userId: req.user.id } });
        if (!estate)
            return res.status(404).json({ error: "Estate not found" });
        const count = await prisma.estateDocument.count({
            where: { id: req.params.id, estateId: estate.id }
        });
        if (count === 0)
            return res.status(404).json({ error: "Document not found" });
        const deletedDoc = await prisma.estateDocument.delete({ where: { id: req.params.id } });
        // Log Activity
        await AuditService.logActivity(estate.id, req.user.id, 'DOCUMENT', 'DELETED', `Deleted document: ${deletedDoc.name} (${deletedDoc.documentType})`);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to delete document" });
    }
});
// Upload file for a specific document ID
router.post("/my/documents/:id/upload", async (req, res) => {
    try {
        const estate = await prisma.estate.findFirst({ where: { userId: req.user.id } });
        if (!estate)
            return res.status(404).json({ error: "Estate not found" });
        const existing = await prisma.estateDocument.findFirst({
            where: { id: req.params.id, estateId: estate.id }
        });
        if (!existing)
            return res.status(404).json({ error: "Document not found" });
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
    }
    catch (error) {
        console.error("Document upload error:", error);
        res.status(500).json({ error: "Failed to upload file" });
    }
});
// Get estate documents
router.get("/:estateId/documents", async (req, res) => {
    try {
        const { estateId } = req.params;
        const documents = await prisma.estateDocument.findMany({
            where: { estateId },
            orderBy: { createdAt: 'desc' },
            select: {
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
    }
    catch (e) {
        res.status(500).json({ error: "Failed to fetch documents" });
    }
});
// Deadline Management
router.get("/:estateId/deadlines", async (req, res) => {
    try {
        const { DeadlineService } = await import("../services/deadlineService.js");
        const deadlines = await DeadlineService.getDeadlines(req.params.estateId);
        res.json(deadlines);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch deadlines" });
    }
});
router.post("/:estateId/deadlines", async (req, res) => {
    try {
        const { DeadlineService } = await import("../services/deadlineService.js");
        const deadline = await DeadlineService.createDeadline(req.params.estateId, {
            ...req.body,
            dueDate: new Date(req.body.dueDate)
        });
        res.json(deadline);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to create deadline" });
    }
});
router.put("/:estateId/deadlines/:id", async (req, res) => {
    try {
        const { DeadlineService } = await import("../services/deadlineService.js");
        const deadline = await DeadlineService.updateDeadline(req.params.id, req.params.estateId, req.body.dueDate ? { ...req.body, dueDate: new Date(req.body.dueDate) } : req.body);
        res.json(deadline);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to update deadline" });
    }
});
router.delete("/:estateId/deadlines/:id", async (req, res) => {
    try {
        const { DeadlineService } = await import("../services/deadlineService.js");
        await DeadlineService.deleteDeadline(req.params.id, req.params.estateId);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to delete deadline" });
    }
});
router.post("/:estateId/deadlines/generate", async (req, res) => {
    try {
        const { DeadlineService } = await import("../services/deadlineService.js");
        const deadlines = await DeadlineService.generateStatutoryDeadlines(req.params.estateId);
        res.json(deadlines);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to generate deadlines" });
    }
});
import { DossierService } from "../services/dossierService.js";
router.get("/my/dossier/download", async (req, res) => {
    try {
        const estate = await prisma.estate.findFirst({ where: { userId: req.user.id } });
        if (!estate)
            return res.status(404).json({ error: "Estate not found" });
        const data = await DossierService.generateDossierData(estate.id);
        const report = DossierService.formatComplianceSummary(data);
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename=Compliance_Dossier_${estate.deceasedLastName}.txt`);
        res.send(report);
    }
    catch (e) {
        console.error("Dossier generation error:", e);
        res.status(500).json({ error: "Failed to generate compliance dossier" });
    }
});
import { AccountingService } from "../services/accountingService.js";
router.get("/my/accounting-readiness", async (req, res) => {
    try {
        const estate = await prisma.estate.findFirst({ where: { userId: req.user.id } });
        if (!estate)
            return res.status(404).json({ error: "Estate not found" });
        const readiness = await AccountingService.getReadiness(estate.id);
        res.json(readiness);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
import { DistributionService } from "../services/distributionService.js";
router.get("/my/distribution-readiness", async (req, res) => {
    try {
        const estate = await prisma.estate.findFirst({ where: { userId: req.user.id } });
        if (!estate)
            return res.status(404).json({ error: "Estate not found" });
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
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// ... imports at top ...
import { RiskService } from "../services/riskService.js";
// ... existing code ...
router.post("/my/distribution-activity", async (req, res) => {
    try {
        const estate = await prisma.estate.findFirst({ where: { userId: req.user.id } });
        if (!estate)
            return res.status(404).json({ error: "Estate not found" });
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
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
export default router;
// Roadmap endpoints
import { getEstateRoadmap, completeTask, uncompleteTask, getTaskCompletions } from "../services/roadmapService.js";
router.get("/:id/roadmap", async (req, res) => {
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
    }
    catch (error) {
        console.error("Error fetching roadmap:", error);
        res.status(500).json({ error: "Failed to fetch roadmap", message: error.message });
    }
});
router.get("/:id/tasks", async (req, res) => {
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
    }
    catch (error) {
        console.error("Error fetching task completions:", error);
        res.status(500).json({ error: "Failed to fetch task completions", message: error.message });
    }
});
router.post("/:id/tasks/:taskId/complete", async (req, res) => {
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
    }
    catch (error) {
        console.error("Error completing task:", error);
        res.status(500).json({ error: "Failed to complete task", message: error.message });
    }
});
router.delete("/:id/tasks/:taskId/complete", async (req, res) => {
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
    }
    catch (error) {
        console.error("Error uncompleting task:", error);
        res.status(500).json({ error: "Failed to uncomplete task", message: error.message });
    }
});
