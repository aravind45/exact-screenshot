import { Router } from "express";
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
                ...history.map((m: any) => m.role === "user" ? new HumanMessage(m.content) : m),
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
    } catch (error: any) {
        console.error("Agent Route Error:", error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
