import { Router } from "express";
import { AssetService } from "../services/assetService.js";
import { z } from "zod";
import { logger } from "../lib/logger.js";
import { requireSubscription } from "../middleware/subscription.js";
import { requireAuthorityStatus } from "../middleware/authorityGating.js";
import { requireEstateAccess } from "../middleware/estateAuth.js";
import { AuditService } from "../services/auditService.js";
const router = Router();
// Enforce subscription for all asset management features
router.use(requireSubscription);
const assetSchema = z.object({
    institution: z.string().min(1),
    assetType: z.string().min(1),
    category: z.string().min(1),
    estimatedValue: z.number().optional(),
    accountNumber: z.string().optional(),
    notes: z.string().optional(),
    beneficiaries: z.string().optional(),
    isDiscovered: z.boolean().optional(),
    discoveryConfidence: z.number().optional(),
    discoveryClue: z.string().optional()
});
const faxSchema = z.object({
    faxNumber: z.string().min(5),
    documentType: z.string().min(1),
    subject: z.string().optional()
});
// Note: Authentication middleware is applied to these routes in index.ts
router.get("/", async (req, res) => {
    try {
        const assets = await AssetService.getAll(req.user.id);
        res.json(assets);
    }
    catch (error) {
        logger.error("Error fetching assets:", error.message);
        res.status(500).json({ error: "Failed to fetch assets" });
    }
});
router.get("/:id", async (req, res) => {
    try {
        const asset = await AssetService.getById(req.params.id, req.user.id);
        if (!asset)
            return res.status(404).json({ error: "Asset not found" });
        res.json(asset);
    }
    catch (error) {
        logger.error("Error fetching asset:", error);
        res.status(500).json({ error: "Failed to fetch asset" });
    }
});
router.post("/", async (req, res) => {
    try {
        const validated = assetSchema.parse(req.body);
        const asset = await AssetService.create(req.user.id, validated);
        res.json(asset);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: "Validation failed", details: error.errors });
        }
        logger.error("Error creating asset:", error.message);
        res.status(400).json({ error: error.message });
    }
});
router.put("/:id", requireEstateAccess, requireAuthorityStatus({
    operation: "assets:update",
    customMessage: "Asset updates require authority status"
}), async (req, res) => {
    try {
        const validated = assetSchema.partial().parse(req.body);
        // Log the asset update attempt
        await AuditService.logActivity(req.estateId, req.user.id, "ASSET", "UPDATED", `Updated asset: ${req.params.id}`);
        const asset = await AssetService.update(req.params.id, req.user.id, validated);
        res.json(asset);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: "Validation failed", details: error.errors });
        }
        logger.error("Error updating asset:", error.message);
        res.status(403).json({ error: error.message });
    }
});
router.delete("/:id", requireEstateAccess, requireAuthorityStatus({
    operation: "assets:delete",
    customMessage: "Asset deletion requires legal authority"
}), async (req, res) => {
    try {
        // Log the asset deletion attempt
        await AuditService.logActivity(req.estateId, req.user.id, "ASSET", "DELETED", `Deleted asset: ${req.params.id}`);
        const result = await AssetService.delete(req.params.id, req.user.id);
        res.json(result);
    }
    catch (error) {
        logger.error("Error deleting asset:", error);
        res.status(503).json({ error: error.message });
    }
});
router.post("/:id/fax", async (req, res) => {
    try {
        const { faxNumber, documentType, subject } = faxSchema.parse(req.body);
        const { FaxService } = await import("../services/faxService.js");
        const result = await FaxService.sendFax({
            assetId: req.params.id,
            userId: req.user.id,
            faxNumber,
            documentType,
            subject
        });
        res.json(result);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: "Validation failed", details: error.errors });
        }
        logger.error("Error sending fax:", error.message);
        res.status(500).json({ error: error.message });
    }
});
router.post("/:id/generate-draft", async (req, res) => {
    try {
        const asset = await AssetService.getById(req.params.id, req.user.id);
        if (!asset)
            return res.status(404).json({ error: "Asset not found" });
        const { prisma } = await import("../db.js");
        const estateRecord = await prisma.estate.findFirst({
            where: { userId: req.user.id },
            include: { user: true }
        });
        const { generateCommunicationDraft } = await import("../services/ai.js");
        const result = await generateCommunicationDraft({
            institutionName: asset.institution,
            assetType: asset.assetType,
            workflowStepTitle: req.body.workflowStepTitle,
            workflowStepDescription: req.body.workflowStepDescription,
            deceasedName: estateRecord ? `${estateRecord.deceasedFirstName} ${estateRecord.deceasedLastName}` : undefined
        });
        res.json(result);
    }
    catch (error) {
        logger.error("Error generating draft:", error);
        res.status(500).json({ error: error.message });
    }
});
router.post("/:id/generate-letter", async (req, res) => {
    try {
        const asset = await AssetService.getById(req.params.id, req.user.id);
        if (!asset)
            return res.status(404).json({ error: "Asset not found" });
        const { prisma } = await import("../db.js");
        const estate = await prisma.estate.findFirst({
            where: { userId: req.user.id },
            include: { user: true }
        });
        if (!estate)
            return res.status(404).json({ error: "Estate not found" });
        const { DocumentService } = await import("../services/DocumentService.js");
        const pdfBytes = await DocumentService.generateLetter(asset, estate, req.body);
        res.contentType("application/pdf");
        res.send(Buffer.from(pdfBytes));
    }
    catch (error) {
        logger.error("Error generating letter:", error);
        res.status(500).json({ error: error.message });
    }
});
router.post("/batch-generate-letters", async (req, res) => {
    try {
        const { assetIds } = req.body;
        if (!Array.isArray(assetIds) || assetIds.length === 0) {
            return res.status(400).json({ error: "Missing assetIds" });
        }
        const { prisma } = await import("../db.js");
        const estate = await prisma.estate.findFirst({
            where: { userId: req.user.id },
            include: { user: true }
        });
        if (!estate)
            return res.status(404).json({ error: "Estate not found" });
        const assets = await prisma.asset.findMany({
            where: {
                id: { in: assetIds },
                estateId: estate.id
            }
        });
        const { DocumentService } = await import("../services/DocumentService.js");
        const { PDFDocument } = await import("pdf-lib");
        const combinedDoc = await PDFDocument.create();
        for (const asset of assets) {
            const letterBytes = await DocumentService.generateLetter(asset, estate);
            const letterDoc = await PDFDocument.load(letterBytes);
            const copiedPages = await combinedDoc.copyPages(letterDoc, letterDoc.getPageIndices());
            copiedPages.forEach((page) => combinedDoc.addPage(page));
        }
        const combinedPdfBytes = await combinedDoc.save();
        res.contentType("application/pdf");
        res.send(Buffer.from(combinedPdfBytes));
    }
    catch (error) {
        logger.error("Error batch generating letters:", error);
        res.status(500).json({ error: error.message });
    }
});
router.get("/:id/documents", async (req, res) => {
    try {
        const { prisma } = await import("../db.js");
        const documents = await prisma.document.findMany({
            where: { assetId: req.params.id, userId: req.user.id }
        });
        res.json(documents);
    }
    catch (error) {
        logger.error("Error fetching asset documents:", error);
        res.status(500).json({ error: "Failed to fetch documents" });
    }
});
router.post("/:id/documents", async (req, res) => {
    try {
        const { prisma } = await import("../db.js");
        const { type, name } = req.query;
        const file = req.body;
        if (!file)
            return res.status(400).json({ error: "No file provided" });
        // In a real app, we'd upload to S3/Cloud Storage here.
        // For now, we simulate success and save a reference.
        const document = await prisma.document.create({
            data: {
                assetId: req.params.id,
                userId: req.user.id,
                name: name || "Document",
                type: type || "OTHER",
                status: "UPLOADED",
                fileUrl: "/api/placeholder-url", // Stub
                isRequired: false
            }
        });
        res.json(document);
    }
    catch (error) {
        logger.error("Error uploading asset document:", error);
        res.status(500).json({ error: "Failed to upload document" });
    }
});
export default router;
