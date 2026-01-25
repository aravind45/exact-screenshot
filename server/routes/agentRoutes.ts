import { Router, Request, Response } from "express";
import { prisma } from "../db.js";
import { AgentService } from "../services/agentService.js";

const router = Router();

router.get("/insights", async (req: any, res: Response) => {
    try {
        const estate = await prisma.estate.findFirst({ where: { userId: req.user.id } });
        if (!estate) return res.json([]);

        const insights = await AgentService.runWatchdogScan(estate.id);
        res.json(insights);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch insights" });
    }
});

export default router;
