import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { prisma } from "./db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Global Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Health Check
app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
});

// --- Auth Middleware ---
const authenticate = async (req: Request | any, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ error: "Unauthorized" });

        const decoded: any = jwt.verify(token, JWT_SECRET);
        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

        if (!user) return res.status(401).json({ error: "User not found" });

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ error: "Invalid token" });
    }
};

// --- Auth Routes ---

app.post("/api/auth/register", async (req: Request, res: Response): Promise<any> => {
    try {
        const { email, password, fullName, state } = req.body;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) return res.status(400).json({ error: "Email already registered" });

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                fullName,
                state,
                role: 'EXECUTOR'
            }
        });

        // Create an initial estate for the user
        await prisma.estate.create({
            data: {
                userId: user.id,
                name: `${fullName || 'My'}'s Estate`,
                deceasedFirstName: "TBD",
                deceasedLastName: "TBD",
                deceasedDateOfDeath: new Date(),
                deceasedState: state || "CA",
                probateStatus: "NOT_STARTED"
            }
        });

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "30d" });
        res.json({ user, token });
    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ error: "Registration failed" });
    }
});

app.post("/api/auth/login", async (req: Request, res: Response): Promise<any> => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } }) as any;
        if (!user || !user.passwordHash) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return res.status(401).json({ error: "Invalid email or password" });

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "30d" });
        res.json({ user, token });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: "Login failed" });
    }
});

app.get("/api/auth/me", authenticate, async (req: Request | any, res: Response) => {
    res.json(req.user);
});

app.get("/api/agent/insights", authenticate, async (req: any, res) => {
    try {
        const estate = await prisma.estate.findFirst({
            where: { userId: req.user.id }
        });
        if (!estate) return res.json([]);

        const insights = await AgentService.runWatchdogScan(estate.id);
        res.json(insights);
    } catch (error) {
        console.error("Agent Insights Error:", error);
        res.status(500).json({ error: "Failed to fetch insights" });
    }
});

// --- Assets Routes ---

// GET /api/assets
app.get("/api/assets", authenticate, async (req: any, res) => {
    try {
        const assets = await prisma.asset.findMany({
            where: { userId: req.user.id }
        });
        res.json(assets);
    } catch (error) {
        console.error("Error fetching assets:", error);
        res.status(500).json({ error: "Failed to fetch assets" });
    }
});

// GET /api/assets/:id
app.get("/api/assets/:id", authenticate, async (req: any, res) => {
    try {
        const { id } = req.params;
        const asset = await prisma.asset.findFirst({
            where: { id, userId: req.user.id },
            include: { communications: true }
        });
        if (!asset) return res.status(404).json({ error: "Asset not found" });
        res.json(asset);
    } catch (error) {
        console.error("Error fetching asset:", error);
        res.status(500).json({ error: "Failed to fetch asset" });
    }
});

// POST /api/assets
app.post("/api/assets", authenticate, async (req: any, res) => {
    try {
        const estate = await prisma.estate.findFirst({ where: { userId: req.user.id } });
        if (!estate) return res.status(400).json({ error: "No estate found for user." });

        const { institution, assetType, category, ownershipType, value, priority, status } = req.body;

        const asset = await prisma.asset.create({
            data: {
                userId: req.user.id,
                estateId: estate.id, // Link to the user's estate
                institution,
                assetType,
                category,
                ownershipType: ownershipType || "INDIVIDUAL",
                value: value ? parseFloat(value) : 0,
                priority: priority || 'medium',
                status: status || 'discovered',
                // Optional fields
                accountNumber: req.body.accountNumber,
                institutionPhone: req.body.institutionPhone,
                institutionEmail: req.body.institutionEmail,
                notes: req.body.notes
            },
        });

        // Agent Action: The Concierge (Proactive Enrichment)
        // Background task to not block asset creation response
        AgentService.runConciergeEnrichment(asset.id).catch(err =>
            console.error("Concierge Enrichment Error:", err)
        );

        res.json(asset);
    } catch (error) {
        console.error("Error creating asset:", error);
        res.status(500).json({ error: "Failed to create asset" });
    }
});

// PUT /api/assets/:id
app.put("/api/assets/:id", authenticate, async (req: any, res) => {
    try {
        const { id } = req.params;
        // ... rest stays same but ensure it belongs to user
        const existing = await prisma.asset.findFirst({ where: { id, userId: req.user.id } });
        if (!existing) return res.status(403).json({ error: "Access denied" });

        const {
            institution,
            assetType,
            category,
            ownershipType,
            value,
            priority,
            status,
            accountNumber,
            institutionPhone,
            institutionEmail,
            institutionFax,
            institutionAddress,
            institutionUrl,
            notes,
            workflowState
        } = req.body;

        const asset = await prisma.asset.update({
            where: { id },
            data: {
                institution,
                assetType,
                category,
                ownershipType,
                value: value ? parseFloat(value) : undefined,
                priority,
                status,
                accountNumber,
                institutionPhone,
                institutionEmail,
                institutionFax,
                institutionAddress,
                institutionUrl,
                notes,
                workflowState: workflowState !== undefined ? workflowState : undefined
            }
        });
        res.json(asset);
    } catch (error) {
        console.error("Error updating asset:", error);
        res.status(500).json({ error: "Failed to update asset" });
    }
});

// DELETE /api/assets/:id
app.delete("/api/assets/:id", authenticate, async (req: any, res) => {
    try {
        const { id } = req.params;
        const existing = await prisma.asset.findFirst({ where: { id, userId: req.user.id } });
        if (!existing) return res.status(403).json({ error: "Access denied" });

        await prisma.asset.delete({
            where: { id }
        });
        res.json({ success: true });
    } catch (error) {
        console.error("Error deleting asset:", error);
        res.status(500).json({ error: "Failed to delete asset" });
    }
});

// POST /api/assets/:id/communications
app.post("/api/assets/:id/communications", authenticate, async (req: any, res): Promise<any> => {
    try {
        const { id } = req.params;
        const { method, subject, content, communicationDate, type, direction, contactPerson, nextActionDate, nextActionType } = req.body;

        // Validation
        if (!method || !subject || !communicationDate) {
            return res.status(400).json({ error: "Missing required fields: method, subject, communicationDate" });
        }

        // Verify asset exists and belongs to user
        const asset = await prisma.asset.findFirst({ where: { id, userId: req.user.id } });
        if (!asset) return res.status(404).json({ error: "Asset not found or access denied" });

        const communication = await prisma.assetCommunication.create({
            data: {
                assetId: id,
                userId: req.user.id,
                method: method.toLowerCase(),
                subject,
                content: content || null,
                communicationDate: new Date(communicationDate),
                type: type || 'follow_up',
                direction: direction || 'outbound',
                contactPerson: contactPerson || null,
                nextActionDate: nextActionDate ? new Date(nextActionDate) : null,
                nextActionType: nextActionType || null
            }
        });

        // Update asset's lastContactDate
        await prisma.asset.update({
            where: { id },
            data: { lastContactDate: new Date(communicationDate) }
        });

        console.log("Communication logged successfully:", communication.id);
        res.json(communication);
    } catch (error: any) {
        console.error("Error creating communication:", error);
        res.status(500).json({
            error: "Failed to create communication",
            details: error.message
        });
    }
});

// POST /api/assets/:id/generate-draft
app.post("/api/assets/:id/generate-draft", authenticate, async (req: any, res): Promise<any> => {
    try {
        const { id } = req.params;
        const { workflowStepTitle, workflowStepDescription } = req.body;

        const asset = await prisma.asset.findFirst({ where: { id, userId: req.user.id } });
        if (!asset) return res.status(404).json({ error: "Asset not found or access denied" });

        const draft = await generateCommunicationDraft({
            institutionName: asset.institution,
            assetType: asset.assetType,
            workflowStepTitle: workflowStepTitle || "General Inquiry",
            workflowStepDescription: workflowStepDescription || "Checking status of the account",
            deceasedName: "the account holder" // Could be fetched from estate if needed
        });

        res.json(draft);
    } catch (error: any) {
        console.error("Draft Generation Error:", error);
        res.status(500).json({ error: "Failed to generate draft" });
    }
});

// --- Document Processing ---
import multer from "multer";
import { analyzeDocument, generateCommunicationDraft, discoverRelatedAssets } from "./services/ai";
import { AgentService } from "./services/agentService";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

// Configure Multer (Memory Storage)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// POST /api/documents/scan
// expects "file" field in multipart/form-data
app.post("/api/documents/scan", authenticate, upload.single("file"), async (req: any, res: Response): Promise<any> => {
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
                console.error("PDF Parsing Error:", pdfError);
                return res.status(422).json({ error: "Failed to parse PDF file. It might be corrupted or password protected." });
            }
        } else if (req.file.mimetype.startsWith("text/")) {
            textToAnalyze = req.file.buffer.toString("utf-8");
        } else if (req.file.mimetype.startsWith("image/")) {
            // Handle Images via Vision LLM
            console.log("Analyzing image via Vision LLM...");
            const imageBase64 = req.file.buffer.toString("base64");
            const extractedData = await analyzeDocument(undefined, imageBase64);
            console.log("Analyze (Vision) Result:", JSON.stringify(extractedData));

            if (!extractedData) throw new Error("AI Vision Analysis returned null");
            return res.json(extractedData);
        } else {
            return res.status(400).json({ error: "Only PDF, Text, and Image files (JPEG/PNG) supported currently" });
        }

        console.log("Analyze Document: Text length:", textToAnalyze.length);
        const extractedData = await analyzeDocument(textToAnalyze);

        // Agent Action: The Detective (Discover related assets/clues)
        let agentInsights: any[] = [];
        if (textToAnalyze) {
            agentInsights = await AgentService.runDetectiveDiscovery(textToAnalyze, ""); // EstateId could be linked here
        }

        console.log("Analyze Result:", JSON.stringify(extractedData));
        console.log("Agent Insights:", JSON.stringify(agentInsights));

        if (!extractedData) {
            throw new Error("AI Analysis returned null (Failed to extract data)");
        }

        res.json({
            ...extractedData,
            agentInsights
        });

    } catch (error: any) {
        console.error("Error processing document:", error);
        console.error("Error Type:", typeof error);
        console.error("Error Keys:", Object.keys(error));
        if (error.response) console.error("Error Response:", error.response); // axios/openAI style

        res.status(500).json({
            error: "Failed to process document",
            details: error.message || String(error),
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});



// --- Document Repository ---
import fs from "fs";
import path from "path";

// Persistence Storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(process.cwd(), "server/uploads");
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + "-" + file.originalname);
    },
});

const uploadRepo = multer({ storage: storage });

// GET /api/assets/:id/documents
app.get("/api/assets/:id/documents", authenticate, async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const asset = await prisma.asset.findFirst({ where: { id, userId: req.user.id } });
        if (!asset) return res.status(403).json({ error: "Access denied" });

        const documents = await prisma.document.findMany({
            where: { assetId: id },
            orderBy: { createdAt: "desc" }
        });
        res.json(documents);
    } catch (error) {
        console.error("Error fetching documents:", error);
        res.status(500).json({ error: "Failed to fetch documents" });
    }
});

// POST /api/assets/:id/documents
app.post("/api/assets/:id/documents", authenticate, uploadRepo.single("file"), async (req: any, res: Response): Promise<any> => {
    try {
        const { id } = req.params;
        const asset = await prisma.asset.findFirst({ where: { id, userId: req.user.id } });
        if (!asset) return res.status(403).json({ error: "Access denied" });

        console.log("Upload Request Received for Asset:", id);
        console.log("File:", req.file ? "Present" : "Missing");
        console.log("Body:", req.body);

        const bodyType = req.body.type;
        const typeStr = (typeof bodyType === 'string' ? bodyType : (Array.isArray(bodyType) ? bodyType[0] : String(bodyType))) || "OTHER";

        if (!req.file) {
            console.error("Upload failed: No file in request");
            return res.status(400).json({ error: "No file provided" });
        }

        const doc = await prisma.document.create({
            data: {
                assetId: id,
                userId: req.user.id,
                name: req.file.originalname,
                type: typeStr,
                fileUrl: `/uploads/${req.file.filename}`,
                status: "UPLOADED",
                isRequired: false
            }
        });
        console.log("Document created successfully:", doc.id);
        res.json(doc);
    } catch (error: any) {
        console.error("Error uploading document:", error);
        res.status(500).json({
            error: "Failed to upload document",
            details: error.message
        });
    }
});

// --- Enrichment ---
import { enrichInstitutionData } from "./services/enrichment";

// GET /api/institutions
app.get("/api/institutions", authenticate, async (req, res) => {
    try {
        const { query } = req.query;
        if (!query || typeof query !== 'string' || query.length < 2) {
            return res.json([]);
        }

        const institutions = await prisma.institution.findMany({
            where: {
                name: {
                    contains: query,
                    mode: 'insensitive' // Postgres case-insensitive search
                }
            },
            take: 5
        });
        res.json(institutions);
    } catch (error) {
        console.error("Institution search error:", error);
        res.status(500).json({ error: "Search failed" });
    }
});

// POST /api/assets/:id/enrich
app.post("/api/assets/:id/enrich", authenticate, async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const asset = await prisma.asset.findFirst({ where: { id, userId: req.user.id } });

        if (!asset || !asset.institution) {
            return res.status(400).json({ error: "Asset has no institution name or access denied" });
        }

        const enriched = await enrichInstitutionData(asset.institution);

        if (enriched && enriched.extracted) {
            // Auto-update the asset if we found info
            const updates: any = {};
            if (enriched.extracted.institutionPhone) updates.institutionPhone = enriched.extracted.institutionPhone;
            if (enriched.extracted.institutionEmail) updates.institutionEmail = enriched.extracted.institutionEmail;
            if (enriched.extracted.institutionFax) updates.institutionFax = enriched.extracted.institutionFax;
            if (enriched.extracted.mailingAddress) updates.institutionAddress = enriched.extracted.mailingAddress;
            if (enriched.sourceUrl) updates.institutionUrl = enriched.sourceUrl;

            if (Object.keys(updates).length > 0) {
                await prisma.asset.update({
                    where: { id },
                    data: updates
                });
            }

            // Sync with Global Master Table (Upsert)
            try {
                // Check if institution exists by name (fuzzy check irrelevant here, direct match on what we searched)
                // We use asset.institution as the key.
                const existing = await prisma.institution.findUnique({
                    where: { name: asset.institution }
                });

                const instData = {
                    phone: enriched.extracted.institutionPhone || undefined,
                    email: enriched.extracted.institutionEmail || undefined,
                    fax: enriched.extracted.institutionFax || undefined,
                    address: enriched.extracted.mailingAddress || undefined,
                    website: enriched.sourceUrl || undefined
                };

                if (existing) {
                    // Only update if we have better data (or just overwrite?)
                    // Let's overwrite empties
                    await prisma.institution.update({
                        where: { id: existing.id },
                        data: instData
                    });
                } else {
                    await prisma.institution.create({
                        data: {
                            name: asset.institution,
                            ...instData
                        }
                    });
                }
            } catch (syncError) {
                console.error("Failed to sync with Institution Master:", syncError);
                // Don't fail the request, just log it
            }
        }

        res.json(enriched);
    } catch (error) {
        console.error("Enrichment error:", error);
        res.status(500).json({ error: "Failed to enrich data" });
    }
});

// --- Profile Routes ---

// GET /api/profile
app.get("/api/profile", authenticate, async (req: any, res: Response) => {
    try {
        res.json(req.user);
    } catch (error) {
        console.error("Profile fetch error:", error);
        res.status(500).json({ error: "Failed to fetch profile" });
    }
});

// PUT /api/profile
app.put("/api/profile", authenticate, async (req: any, res: Response) => {
    try {
        const { fullName, state, role } = req.body;
        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: { fullName, state, role }
        });
        res.json(user);
    } catch (error) {
        console.error("Profile update error:", error);
        res.status(500).json({ error: "Failed to update profile" });
    }
});

// --- Admin Routes ---
const isAdmin = (req: any, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({ error: "Admin access required" });
    }
    next();
};

// GET /api/admin/stats
app.get("/api/admin/stats", authenticate, isAdmin, async (req: any, res: Response) => {
    try {
        const userCount = await prisma.user.count();
        const assetCount = await prisma.asset.count();
        const totalValue = await prisma.asset.aggregate({
            _sum: { value: true }
        });
        const institutionCount = await prisma.institution.count();

        res.json({
            users: userCount,
            assets: assetCount,
            totalValue: totalValue._sum.value || 0,
            institutions: institutionCount
        });
    } catch (error) {
        console.error("Admin stats error:", error);
        res.status(500).json({ error: "Failed to fetch admin stats" });
    }
});

// GET /api/admin/users
app.get("/api/admin/users", authenticate, isAdmin, async (req: any, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            include: {
                _count: {
                    select: { estates: true, communications: true }
                }
            }
        });
        res.json(users);
    } catch (error) {
        console.error("Admin users list error:", error);
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

// GET /api/admin/institutions
app.get("/api/admin/institutions", authenticate, isAdmin, async (req: any, res: Response) => {
    try {
        const institutions = await prisma.institution.findMany({
            orderBy: { name: "asc" }
        });
        res.json(institutions);
    } catch (error) {
        console.error("Admin institutions list error:", error);
        res.status(500).json({ error: "Failed to fetch institutions" });
    }
});

// PUT /api/admin/institutions/:id
app.put("/api/admin/institutions/:id", authenticate, isAdmin, async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const { phone, email, fax, website, address } = req.body;
        const updated = await prisma.institution.update({
            where: { id },
            data: { phone, email, fax, website, address }
        });
        res.json(updated);
    } catch (error) {
        console.error("Admin institution update error:", error);
        res.status(500).json({ error: "Failed to update institution" });
    }
});

// --- Estate/Probate Routes ---

// GET /api/estates/my
app.get("/api/estates/my", authenticate, async (req: any, res: Response) => {
    try {
        const estate = await prisma.estate.findFirst({
            where: { userId: req.user.id },
            include: { _count: { select: { assets: true } } }
        });
        res.json(estate);
    } catch (error) {
        console.error("Estate fetch error:", error);
        res.status(500).json({ error: "Failed to fetch estate" });
    }
});

// PUT /api/estates/my
app.put("/api/estates/my", authenticate, async (req: any, res: Response) => {
    try {
        const estate = await prisma.estate.findFirst({ where: { userId: req.user.id } });
        if (!estate) return res.status(404).json({ error: "Estate not found" });

        const { probateStatus, courtCaseNumber, probateCounty } = req.body;
        const updated = await prisma.estate.update({
            where: { id: estate.id },
            data: {
                probateStatus: probateStatus || undefined,
                courtCaseNumber: courtCaseNumber !== undefined ? courtCaseNumber : undefined,
                probateCounty: probateCounty !== undefined ? probateCounty : undefined
            }
        });
        res.json(updated);
    } catch (error) {
        console.error("Estate update error:", error);
        res.status(500).json({ error: "Failed to update estate" });
    }
});

app.use("/uploads", express.static(path.join(process.cwd(), "server/uploads")));

// --- Start Server ---
if (process.env.NODE_ENV !== "production") {
    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
}

export default app;
