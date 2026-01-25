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

        // In production, you'd upload to S3/cloud storage
        // For now, we'll store a placeholder URL
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
                status: "OBTAINED",
                obtainedDate: new Date()
            },
            create: {
                estateId,
                userId: req.user.id,
                documentType: documentType as string,
                name: name as string,
                fileUrl,
                status: "OBTAINED",
                obtainedDate: new Date()
            }
        });

        res.json({ success: true, document });
    } catch (e: any) {
        console.error("Document upload error:", e);
        res.status(500).json({ error: "Failed to upload document" });
    }
});

// Get estate documents
router.get("/:estateId/documents", async (req: any, res: Response) => {
    try {
        const { estateId } = req.params;

        const documents = await prisma.estateDocument.findMany({
            where: { estateId },
            orderBy: { createdAt: 'desc' }
        });

        res.json(documents);
    } catch (e: any) {
        res.status(500).json({ error: "Failed to fetch documents" });
    }
});

export default router;
