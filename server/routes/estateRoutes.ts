import { Router, Request, Response } from "express";
import { prisma } from "../db.js";

const router = Router();

router.get("/my", async (req: any, res: Response) => {
    try {
        const estate = await prisma.estate.findFirst({
            where: { userId: req.user.id }
        });
        res.json(estate);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch estate" });
    }
});

router.put("/my", async (req: any, res: Response) => {
    try {
        const estate = await prisma.estate.findFirst({ where: { userId: req.user.id } });
        if (!estate) return res.status(404).json({ error: "Estate not found" });

        const updated = await prisma.estate.update({
            where: { id: estate.id },
            data: req.body
        });

        // If status changed to EXECUTOR_APPOINTED, auto-sync assets
        if (req.body.probateStatus === 'EXECUTOR_APPOINTED' && estate.probateStatus !== 'EXECUTOR_APPOINTED') {
            const { AssetService } = await import("../services/assetService.js");
            await AssetService.autoSyncAssetsForEstate(estate.id);
        }

        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: "Failed to update estate" });
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

        const document = await prisma.estateDocument.upsert({
            where: {
                estateId_documentType: {
                    estateId,
                    documentType: documentType as string
                }
            },
            update: {
                fileUrl,
                content: req.body, // Store binary data
                status: "OBTAINED",
                obtainedDate: new Date()
            },
            create: {
                estateId,
                userId: req.user.id,
                documentType: documentType as string,
                name: name as string,
                fileUrl,
                content: req.body, // Store binary data
                status: "OBTAINED",
                obtainedDate: new Date()
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

        const document = await prisma.estateDocument.findUnique({
            where: {
                estateId_documentType: {
                    estateId: estate.id,
                    documentType: req.params.formCode
                }
            }
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

export default router;
