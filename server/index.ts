import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { AuthService } from "./services/authService.js";

import authRoutes from "./routes/authRoutes.js";
import assetRoutes from "./routes/assetRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import estateRoutes from "./routes/estateRoutes.js";
import enrichmentRoutes from "./routes/enrichmentRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import agentRoutes from "./routes/agentRoutes.js";
import communicationRoutes from "./routes/communicationRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";

const app = express();
const port = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, "../dist");

app.use(cors());
app.use(express.json());
app.use(express.raw({ type: 'application/pdf', limit: '10mb' }));

// Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Auth Middleware
const authenticate = async (req: Request | any, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1] || req.query.token;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const user = await AuthService.verifyToken(token as string);
    if (!user) return res.status(401).json({ error: "Invalid token" });

    req.user = user;
    next();
};

// Health
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/assets", authenticate, assetRoutes);
app.use("/api/documents", authenticate, documentRoutes);
app.use("/api/estates", authenticate, estateRoutes);
app.use("/api/enrichment", authenticate, enrichmentRoutes);
app.use("/api/admin", authenticate, adminRoutes);
app.use("/api/agent", authenticate, agentRoutes);
app.use("/api/communications", authenticate, communicationRoutes);
app.use("/api/webhooks", webhookRoutes); // Auth handled via Mailgun signatures

// Profile (simple, keep here or move if grows)
app.get("/api/auth/me", authenticate, (req: any, res) => res.json(req.user));
app.put("/api/auth/me", authenticate, async (req: any, res) => {
    try {
        const updatedUser = await AuthService.updateProfile(req.user.id, req.body);
        res.json(updatedUser);
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

// Serve Static Files
app.use(express.static(distPath));

// Catch-all to serve index.html for React Router
app.get("*", (req, res) => {
    if (req.path.startsWith("/api/")) {
        return res.status(404).json({ error: "API route not found" });
    }
    res.sendFile(path.join(distPath, "index.html"));
});

// Always listen when in production or no specific VITE_API_URL is set
// Cloud Run expects the server to listen on the PORT environment variable
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

export default app;
