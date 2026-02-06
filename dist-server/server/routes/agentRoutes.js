import { Router } from "express";
import { prisma } from "../db.js";
import { AgentService } from "../services/agentService.js";
import { graph } from "../services/agent/graph.js";
import { HumanMessage } from "@langchain/core/messages";
const router = Router();
/**
 * POST /api/agent/chat
 *
 * Main endpoint for interacting with the Estate Settlement Agent.
 */
router.post("/chat", async (req, res) => {
    const { message, estateId, phase, history = [] } = req.body;
    try {
        const input = {
            messages: [
                ...history.map((m) => m.role === "user" ? new HumanMessage(m.content) : m),
                new HumanMessage(message)
            ],
            estateId,
            phase: phase || "Initial Discovery",
        };
        const config = { configurable: { thread_id: estateId } };
        const result = await graph.invoke(input, config);
        const lastMessage = result.messages[result.messages.length - 1];
        res.json({
            reply: lastMessage.content,
            history: result.messages,
        });
    }
    catch (error) {
        console.error("Agent Route Error:", error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * GET /api/agent/insights
 *
 * Returns proactive insights for the current estate.
 */
router.get("/insights", async (req, res) => {
    try {
        const estate = await prisma.estate.findFirst({
            where: { userId: req.user.id }
        });
        if (!estate) {
            return res.json([]);
        }
        const insights = await AgentService.runWatchdogScan(estate.id);
        // Add a generic welcome insight if empty
        if (insights.length === 0) {
            insights.push({
                assetId: "system",
                type: "WELCOME",
                title: "Agent Ready",
                message: "I am monitoring your estate for deadlines and delays. I'll post insights here as I find them.",
                priority: "low"
            });
        }
        res.json(insights);
    }
    catch (error) {
        console.error("Agent Insights Error:", error);
        res.status(500).json({ error: error.message });
    }
});
export default router;
