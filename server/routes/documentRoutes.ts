import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { prisma } from "../db.js";
import { analyzeDocument } from "../services/ai.js";
import { AgentService } from "../services/agentService.js";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

const router = Router();

const isVercel = process.env.VERCEL === "1";
const uploadDir = isVercel
    ? path.join("/tmp", "uploads")
    : path.join(process.cwd(), "server/uploads");

if (!fs.existsSync(uploadDir)) {
    try {
        fs.mkdirSync(uploadDir, { recursive: true });
    } catch (e) {
        console.warn("Could not create upload directory:", e);
    }
}

// Configuration for Document Repository (Persistence)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + "-" + file.originalname);
    },
});

const uploadRepo = multer({ storage: storage });
const uploadMemory = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Scans / Analyzes a document
router.post("/scan", uploadMemory.single("file"), async (req: any, res: Response): Promise<any> => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file provided" });

        let textToAnalyze = "";

        if (req.file.mimetype === "application/pdf") {
            try {
                const parseFunc = typeof pdf === "function" ? pdf : pdf.default;
                const data = await parseFunc(req.file.buffer);
                textToAnalyze = data.text;
                if (!textToAnalyze || textToAnalyze.trim().length === 0) {
                    return res.status(422).json({ error: "PDF text extraction failed: No text found. Is it a scanned image?" });
                }
            } catch (pdfError) {
                return res.status(422).json({ error: "Failed to parse PDF file." });
            }
        } else if (req.file.mimetype.startsWith("text/")) {
            textToAnalyze = req.file.buffer.toString("utf-8");
        } else if (req.file.mimetype.startsWith("image/")) {
            const imageBase64 = req.file.buffer.toString("base64");
            const extractedData = await analyzeDocument(undefined, imageBase64);
            return res.json(extractedData);
        } else {
            return res.status(400).json({ error: "Unsupported file type" });
        }

        const extractedData = await analyzeDocument(textToAnalyze);
        const agentInsights = await AgentService.runDetectiveDiscovery(textToAnalyze, "");

        // If estateId is provided, we can optionally link/save this discovery
        if (req.query.saveToVault === 'true' && req.user) {
            const estate = await prisma.estate.findFirst({ where: { userId: req.user.id } });
            if (estate) {
                await prisma.estateDocument.upsert({
                    where: {
                        estateId_documentType: {
                            estateId: estate.id,
                            documentType: req.query.documentType || "OTHER_DISCOVERY"
                        }
                    },
                    update: {
                        content: req.file.buffer,
                        name: req.file.originalname,
                        status: "OBTAINED",
                        obtainedDate: new Date(),
                        clues: agentInsights as any
                    },
                    create: {
                        estateId: estate.id,
                        userId: req.user.id,
                        documentType: req.query.documentType || "OTHER_DISCOVERY",
                        name: req.file.originalname,
                        content: req.file.buffer,
                        status: "OBTAINED",
                        obtainedDate: new Date(),
                        clues: agentInsights as any
                    }
                });
            }
        }

        res.json({
            ...(extractedData || { institution: "Unknown", assetType: "Account", value: 0 }),
            agentInsights
        });
    } catch (error: any) {
        console.error("Scan Error:", error);
        res.status(500).json({ error: "Failed to process document" });
    }
});

export default router;
