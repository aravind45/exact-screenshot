import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
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

// Only listen if this file is run directly (local dev) and NOT on Netlify
const isNetlify = process.env.NETLIFY === "true" || process.env.LAMBDA_TASK_ROOT !== undefined;

if (!isNetlify && (process.env.NODE_ENV !== "production" || process.env.VITE_API_URL === undefined)) {
    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
}

export default app;
