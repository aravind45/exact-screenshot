import { Router, Request, Response } from "express";
import { CommunicationService } from "../services/communicationService.js";
import { EmailService } from "../services/emailService.js";
import { DocumentRecommendationService } from "../services/documentRecommendationService.js";
import { prisma } from "../db.js";
import { fileUpload, FileService } from "../services/fileService.js";
import { z } from "zod";
import { logger } from "../lib/logger.js";
import { requireSubscription } from "../middleware/subscription.js";

const communicationSchema = z.object({
    assetId: z.string(),
    type: z.string(),
    direction: z.enum(["INBOUND", "OUTBOUND", "inbound", "outbound"]),
    notes: z.string().min(1),
    subject: z.string().optional(),
    sender: z.string().optional(),
    recipient: z.string().optional(),
    contactChannel: z.enum(["EMAIL", "FAX", "MAIL", "PHONE", "PORTAL", "OTHER", "email", "fax", "mail", "phone", "portal", "other"]),
    status: z.string().optional(),
    statusChange: z.string().optional(),
    followUpDueAt: z.string().optional().nullable(),
    attachments: z.array(z.string()).optional()
});

const sendEmailSchema = z.object({
    assetId: z.string(),
    to: z.string().email(),
    subject: z.string().min(1),
    body: z.string().min(1),
    ccPersonalEmail: z.boolean().optional()
});

const communicationUpdateSchema = z.object({
    status: z.string().optional(),
    content: z.string().optional(),
    followUpCompletedAt: z.string().optional().nullable(),
    followUpDueAt: z.string().optional().nullable()
});

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
        const validated = communicationSchema.parse(req.body);
        // Validation: Verify asset belongs to user
        const asset = await prisma.asset.findFirst({
            where: { id: validated.assetId, userId: req.user.id }
        });
        if (!asset) return res.status(403).json({ error: "Asset not found or access denied" });

        const communication = await CommunicationService.create(req.user.id, {
            ...validated,
            direction: validated.direction.toUpperCase(),
            contactChannel: validated.contactChannel.toUpperCase(),
            estateId: asset.estateId
        });
        res.status(201).json(communication);
    } catch (error: any) {
        if (error instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", details: error.errors });
        logger.error("Create Communication Error:", error.message);
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
    } catch (e: any) {
        logger.error("Error searching communications:", e.message);
        res.status(500).json({ error: "Failed to search communications" });
    }
});

// Update a communication
router.patch("/:id", async (req: any, res: Response) => {
    try {
        const validated = communicationUpdateSchema.parse(req.body);
        const result = await CommunicationService.update(req.params.id, req.user.id, validated);
        res.json(result);
    } catch (error: any) {
        if (error instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", details: error.errors });
        logger.error("Update Communication Error:", error.message);
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
        const validated = sendEmailSchema.parse(req.body);
        const { assetId, to, subject, body, ccPersonalEmail } = validated;

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
            body,
            ccPersonalEmail: ccPersonalEmail !== false // Default to true
        });

        res.json(result);
    } catch (error: any) {
        if (error instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", details: error.errors });
        logger.error("Send Email Error:", error.message);
        res.status(500).json({ error: "Failed to send email" });
    }
});

router.get("/timeline", async (req: any, res: Response) => {
    try {
        const estate = await prisma.estate.findFirst({ where: { userId: req.user.id } });
        if (!estate) return res.json([]);

        const timeline = await CommunicationService.getTimelineByEstate(estate.id);
        res.json(timeline);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Get document recommendations for an asset
router.get("/asset/:assetId/document-recommendations", async (req: any, res: Response) => {
    try {
        const { assetId } = req.params;
        const { workflowStep, communicationType, institution } = req.query;

        // Verify asset belongs to user
        const asset = await prisma.asset.findFirst({
            where: { id: assetId, userId: req.user.id }
        });
        if (!asset) return res.status(403).json({ error: "Access denied" });

        const recommendations = await DocumentRecommendationService.getRecommendations({
            assetId,
            workflowStep: workflowStep as string,
            communicationType: communicationType as string,
            institution: institution as string
        });

        res.json(recommendations);
    } catch (error: any) {
        logger.error("Get Document Recommendations Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Get available documents for an estate
router.get("/estate/available-documents", async (req: any, res: Response) => {
    try {
        const estate = await prisma.estate.findFirst({ where: { userId: req.user.id } });
        if (!estate) return res.status(404).json({ error: "Estate not found" });

        const documents = await DocumentRecommendationService.getAvailableDocuments(estate.id);
        res.json(documents);
    } catch (error: any) {
        logger.error("Get Available Documents Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Validate document completeness
router.post("/validate-completeness", async (req: any, res: Response) => {
    try {
        const { assetId, attachedDocumentIds } = req.body;

        // Verify asset belongs to user
        const asset = await prisma.asset.findFirst({
            where: { id: assetId, userId: req.user.id }
        });
        if (!asset) return res.status(403).json({ error: "Access denied" });

        const validation = await DocumentRecommendationService.validateCompleteness(
            assetId,
            attachedDocumentIds
        );

        res.json(validation);
    } catch (error: any) {
        logger.error("Validate Completeness Error:", error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
