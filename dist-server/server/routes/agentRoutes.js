import express from "express";
import { OrchestratorService } from "../services/orchestratorService.js";
import { prisma } from "../db.js";
import { z } from "zod";
import { logger } from "../lib/logger.js";
const router = express.Router();
// Validation schemas
const chatSchema = z.object({
    message: z.string().min(1, "Message is required"),
    estateId: z.string().optional(),
    phase: z.string().optional(),
    history: z.array(z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string()
    })).optional()
});
/**
 * Legal Research Agent Chat Endpoint
 * POST /api/agents/chat
 */
router.post("/chat", async (req, res) => {
    try {
        const { message, estateId } = chatSchema.parse(req.body);
        // If estate context is provided, verify access before answering.
        if (estateId) {
            const estate = await prisma.estate.findUnique({ where: { id: estateId } });
            if (!estate) {
                return res.status(404).json({ error: "Estate not found" });
            }
            if (estate.userId !== req.user.id) {
                return res.status(403).json({ error: "Not authorized to access this estate" });
            }
        }
        const result = await OrchestratorService.answerLegalQuestion(message, req.user.id);
        return res.json({
            reply: result.answer,
            sources: result.sources,
            evidence: result.evidence,
            metadata: result.metadata
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: "Invalid chat payload", details: error.errors });
        }
        logger.error("Agent chat error:", error.message);
        return res.status(500).json({ error: "Failed to process chat message" });
    }
});
export default router;
