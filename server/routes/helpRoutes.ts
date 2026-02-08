import express from "express";
import { HelpService } from "../services/helpService.js";
import { RAGService } from "../services/ragService.js";

const router = express.Router();

router.get("/recommendations/:estateId", async (req, res) => {
    try {
        const recommendations = await HelpService.getContextualRecommendations(req.params.estateId);
        res.json(recommendations);
    } catch (error) {
        res.status(500).json({ error: "Failed to get recommendations" });
    }
});

router.post("/log", async (req: any, res) => {
    try {
        const { estateId, topic } = req.body;
        const log = await HelpService.logHelpReference(estateId, req.user.id, topic);
        res.json(log);
    } catch (error) {
        res.status(500).json({ error: "Failed to log help reference" });
    }
});

router.post("/chat", async (req: any, res) => {
    try {
        const { question } = req.body;
        if (!question) return res.status(400).json({ error: "Question is required" });

        const result = await RAGService.answerLegalQuestion(question);
        res.json(result);
    } catch (error: any) {
        console.error("RAG Chat Error:", error);
        res.status(500).json({ error: error.message || "Failed to process chat" });
    }
});

router.post("/contact", async (req: any, res) => {
    try {
        const { estateId, message, subject } = req.body;
        const result = await HelpService.processSupportMessage(req.user.id, estateId, message, subject);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message || "Failed to send support message" });
    }
});

router.post("/feedback", async (req: any, res) => {
    try {
        const { rating, comment } = req.body;
        const result = await HelpService.processFeedback(req.user.id, rating, comment);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message || "Failed to submit feedback" });
    }
});

export default router;
