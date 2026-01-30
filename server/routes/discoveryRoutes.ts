import { Router, Response } from "express";
import { prisma } from "../db.js";
import { AiService } from "../services/aiService.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();
const upload = multer({ dest: "uploads/" });

// POST /api/discovery/analyze
router.post("/analyze", upload.single("file"), async (req: any, res: Response) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        const findings = await AiService.analyzeDocument(req.file.path);

        // Cleanup temp file
        fs.unlinkSync(req.file.path);

        res.json({ findings });
    } catch (e: any) {
        console.error("Analysis failed:", e);
        res.status(500).json({ error: e.message });
    }
});

// POST /api/discovery/confirm
router.post("/confirm", async (req: any, res: Response) => {
    try {
        const { asset } = req.body;
        const estateId = (await prisma.estate.findFirst({ where: { userId: req.user.id } }))?.id;

        if (!estateId) throw new Error("Estate not found");

        const newAsset = await prisma.asset.create({
            data: {
                ...asset,
                estateId,
                userId: req.user.id,
                status: "DISCOVERED",
                workflowState: { source: "AI_DISCOVERY", discoveredAt: new Date() }
            }
        });

        res.json(newAsset);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export const discoveryRoutes = router;
