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

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Auth Middleware
const authenticate = async (req: Request | any, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const user = await AuthService.verifyToken(token);
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

// Profile (simple, keep here or move if grows)
app.get("/api/auth/me", authenticate, (req: any, res) => res.json(req.user));

// Only listen if this file is run directly (local dev)
if (process.env.NODE_ENV !== "production" || process.env.VITE_API_URL === undefined) {
    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
}

export default app;
