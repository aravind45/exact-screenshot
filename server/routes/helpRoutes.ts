import express from "express";
import { HelpService } from "../services/helpService.js";
import { RAGService } from "../services/ragService.js";
import { z } from "zod";
import { logger } from "../lib/logger.js";

const helpLogSchema = z.object({
    estateId: z.string().min(1),
    topic: z.string().min(1)
});

const legalChatSchema = z.object({
    question: z.string().min(1)
});

const supportContactSchema = z.object({
    estateId: z.string().optional(),
    message: z.string().min(1),
    subject: z.string().min(1)
});

const feedbackSchema = z.object({
    rating: z.number().min(1).max(5),
    comment: z.string().optional()
});

const router = express.Router();

router.get("/recommendations/:estateId", async (req, res) => {
    try {
        const recommendations = await HelpService.getContextualRecommendations(req.params.estateId);
        res.json(recommendations);
    } catch (error: any) {
        logger.error("Failed to get recommendations:", error.message);
        res.status(500).json({ error: "Failed to get recommendations" });
    }
});

router.post("/log", async (req: any, res) => {
    try {
        const validated = helpLogSchema.parse(req.body);
        const { estateId, topic } = validated;
        const log = await HelpService.logHelpReference(estateId, req.user.id, topic);
        res.json(log);
    } catch (error: any) {
        if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid help log request", details: error.errors });
        logger.error("Failed to log help reference:", error.message);
        res.status(500).json({ error: "Failed to log help reference" });
    }
});

router.post("/chat", async (req: any, res) => {
    try {
        const validated = legalChatSchema.parse(req.body);
        const { question } = validated;

        const result = await RAGService.answerLegalQuestion(question);
        res.json(result);
    } catch (error: any) {
        if (error instanceof z.ZodError) return res.status(400).json({ error: "Question is required", details: error.errors });
        logger.error("RAG Chat Error:", error.message);
        res.status(500).json({ error: "Failed to process chat" });
    }
});

router.post("/contact", async (req: any, res) => {
    try {
        const validated = supportContactSchema.parse(req.body);
        const { estateId, message, subject } = validated;
        const result = await HelpService.processSupportMessage(req.user.id, estateId, message, subject);
        res.json(result);
    } catch (error: any) {
        if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid support request", details: error.errors });
        logger.error("Support message error:", error.message);
        res.status(500).json({ error: "Failed to send support message" });
    }
});

router.post("/feedback", async (req: any, res) => {
    try {
        const validated = feedbackSchema.parse(req.body);
        const { rating, comment } = validated;
        const result = await HelpService.processFeedback(req.user.id, rating, comment);
        res.json(result);
    } catch (error: any) {
        if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid feedback data", details: error.errors });
        logger.error("Feedback error:", error.message);
        res.status(500).json({ error: "Failed to submit feedback" });
    }
});

export default router;
