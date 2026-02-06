import { Router } from "express";
import { AssetService } from "../services/assetService.js";
const router = Router();
// Note: Authentication middleware is applied to these routes in index.ts
router.get("/", async (req, res) => {
    try {
        const assets = await AssetService.getAll(req.user.id);
        res.json(assets);
    }
    catch (error) {
        console.error("Error fetching assets:", error);
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
        console.error("Error fetching asset:", error);
        res.status(500).json({ error: "Failed to fetch asset" });
    }
});
router.post("/", async (req, res) => {
    try {
        const asset = await AssetService.create(req.user.id, req.body);
        res.json(asset);
    }
    catch (error) {
        console.error("Error creating asset:", error);
        res.status(400).json({ error: error.message });
    }
});
router.put("/:id", async (req, res) => {
    try {
        const asset = await AssetService.update(req.params.id, req.user.id, req.body);
        res.json(asset);
    }
    catch (error) {
        console.error("Error updating asset:", error);
        res.status(403).json({ error: error.message });
    }
});
router.delete("/:id", async (req, res) => {
    try {
        const result = await AssetService.delete(req.params.id, req.user.id);
        res.json(result);
    }
    catch (error) {
        console.error("Error deleting asset:", error);
        res.status(403).json({ error: error.message });
    }
});
router.post("/:id/fax", async (req, res) => {
    try {
        const { FaxService } = await import("../services/faxService.js");
        const result = await FaxService.sendFax({
            assetId: req.params.id,
            userId: req.user.id,
            faxNumber: req.body.faxNumber,
            documentType: req.body.documentType,
            subject: req.body.subject
        });
        res.json(result);
    }
    catch (error) {
        console.error("Error sending fax:", error);
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
        console.error("Error generating draft:", error);
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
        const { PdfService } = await import("../services/pdfService.js");
        const pdfBytes = await PdfService.generateLetter(asset, estate, req.body);
        res.contentType("application/pdf");
        res.send(Buffer.from(pdfBytes));
    }
    catch (error) {
        console.error("Error generating letter:", error);
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
        const { PdfService } = await import("../services/pdfService.js");
        const { PDFDocument } = await import("pdf-lib");
        const combinedDoc = await PDFDocument.create();
        for (const asset of assets) {
            const letterBytes = await PdfService.generateLetter(asset, estate);
            const letterDoc = await PDFDocument.load(letterBytes);
            const copiedPages = await combinedDoc.copyPages(letterDoc, letterDoc.getPageIndices());
            copiedPages.forEach((page) => combinedDoc.addPage(page));
        }
        const combinedPdfBytes = await combinedDoc.save();
        res.contentType("application/pdf");
        res.send(Buffer.from(combinedPdfBytes));
    }
    catch (error) {
        console.error("Error batch generating letters:", error);
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
        console.error("Error fetching asset documents:", error);
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
        console.error("Error uploading asset document:", error);
        res.status(500).json({ error: "Failed to upload document" });
    }
});
export default router;
