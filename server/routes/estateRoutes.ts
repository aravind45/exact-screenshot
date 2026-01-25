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

export default router;
