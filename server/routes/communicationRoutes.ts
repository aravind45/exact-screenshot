import { Router, Request, Response } from "express";
import { CommunicationService } from "../services/communicationService.js";
import { EmailService } from "../services/emailService.js";
import { prisma } from "../db.js";
import { fileUpload, FileService } from "../services/fileService.js";

const router = Router();

// Upload attachment
router.post("/:id/attachments", fileUpload.single("file"), async (req: any, res: Response) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file provided" });

        const attachment = await prisma.communicationAttachment.create({
            data: {
                communicationId: req.params.id,
                storageKey: req.file.path,
                fileName: req.file.originalname,
                mimeType: req.file.mimetype,
                sizeBytes: req.file.size,
                uploadedBy: req.user.id
            }
        });
        res.status(201).json(attachment);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Download attachment
router.get("/attachments/:id", async (req: any, res: Response) => {
    try {
        const filePath = await FileService.downloadFile(req.params.id);
        res.download(filePath);
    } catch (error: any) {
        res.status(404).json({ error: error.message });
    }
});

// Create a new communication
router.post("/", async (req: any, res: Response) => {
    try {
        // Validation: Verify asset belongs to user
        const asset = await prisma.asset.findFirst({
            where: { id: req.body.assetId, userId: req.user.id }
        });
        if (!asset) return res.status(403).json({ error: "Asset not found or access denied" });

        const communication = await CommunicationService.create(req.user.id, {
            ...req.body,
            estateId: asset.estateId
        });
        res.status(201).json(communication);
    } catch (error: any) {
        console.error("Create Communication Error:", error);
        res.status(400).json({ error: error.message });
    }
});

// Get communications for an asset
router.get("/asset/:assetId", async (req: any, res: Response) => {
    try {
        const asset = await prisma.asset.findFirst({
            where: { id: req.params.assetId, userId: req.user.id }
        });
        if (!asset) return res.status(403).json({ error: "Access denied" });

        const communications = await CommunicationService.getByAsset(req.params.assetId, asset.estateId);
        res.json(communications);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET /inbox - All inbound messages for the user's estate
router.get("/inbox", async (req: any, res: Response) => {
    try {
        const estate = await prisma.estate.findFirst({ where: { userId: req.user.id } });
        if (!estate) return res.json([]);

        const inbox = await CommunicationService.getInbox(estate.id);
        res.json(inbox);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// GET /outbox - All outbound messages for the user's estate
router.get("/outbox", async (req: any, res: Response) => {
    try {
        const estate = await prisma.estate.findFirst({ where: { userId: req.user.id } });
        if (!estate) return res.json([]);

        const outbox = await CommunicationService.getOutbox(estate.id);
        res.json(outbox);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get recent follow-ups across all assets
router.get("/follow-ups", async (req: any, res: Response) => {
    try {
        const estate = await prisma.estate.findFirst({ where: { userId: req.user.id } });
        if (!estate) return res.json([]);

        const followUps = await prisma.communication.findMany({
            where: {
                estateId: estate.id,
                followUpDueAt: { not: null },
                followUpCompletedAt: null
            },
            include: { asset: true },
            orderBy: { followUpDueAt: 'asc' }
        });
        res.json(followUps);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Search communications
router.get("/search", async (req: any, res: Response) => {
    try {
        const { query } = req.query;
        const estate = await prisma.estate.findFirst({ where: { userId: req.user.id } });
        if (!estate) return res.json([]);

        const results = await CommunicationService.search(estate.id, query as string);
        res.json(results);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Update a communication
router.patch("/:id", async (req: any, res: Response) => {
    try {
        const result = await CommunicationService.update(req.params.id, req.user.id, req.body);
        res.json(result);
    } catch (error: any) {
        res.status(403).json({ error: error.message });
    }
});

// Delete a communication
router.delete("/:id", async (req: any, res: Response) => {
    try {
        const estate = await prisma.estate.findFirst({ where: { userId: req.user.id } });
        if (!estate) return res.status(403).json({ error: "Access denied" });

        const result = await CommunicationService.delete(req.params.id, estate.id);
        res.json(result);
    } catch (error: any) {
        res.status(403).json({ error: error.message });
    }
});

// Send an outbound email via Mailgun
router.post("/send-email", async (req: any, res: Response) => {
    try {
        const { assetId, to, subject, body } = req.body;

        // Security check
        const asset = await prisma.asset.findFirst({
            where: { id: assetId, userId: req.user.id }
        });
        if (!asset) return res.status(403).json({ error: "Access denied or asset not found" });

        const result = await EmailService.sendEmail({
            estateId: asset.estateId,
            assetId,
            to,
            subject,
            body
        });

        res.json(result);
    } catch (error: any) {
        console.error("Send Email Error:", error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
