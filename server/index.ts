// Deployment Trigger - Cloud Run Port & Express 5 Fix
import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { AuthService } from "./services/authService.js";
import { prisma } from "./db.js";

import authRoutes from "./routes/authRoutes.js";
import assetRoutes from "./routes/assetRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import estateRoutes from "./routes/estateRoutes.js";
import enrichmentRoutes from "./routes/enrichmentRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import agentRoutes from "./routes/agentRoutes.js";
import communicationRoutes from "./routes/communicationRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import collaborationRoutes from "./routes/collaborationRoutes.js";
import liabilityRoutes from "./routes/liabilityRoutes.js";
import { discoveryRoutes } from "./routes/discoveryRoutes.js";
import { heirRoutes } from "./routes/heirRoutes.js";
import { pdfRoutes } from "./routes/pdfRoutes.js";
import formRoutes from "./routes/formRoutes.js";

const app = express();
const port = Number(process.env.PORT) || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, "../dist");

console.log("🚀 Starting ExpectedEstate server...");
console.log(`📦 Node environment: ${process.env.NODE_ENV}`);
console.log(`🔌 Port: ${port}`);
console.log(`📁 Dist path: ${distPath}`);
console.log(`💾 Database URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ NOT SET'}`);

app.use(cors());
app.use(express.json());
app.use(express.raw({
    type: ['application/pdf', 'image/jpeg', 'image/png'],
    limit: '10mb'
}));

// Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    if (req.headers.authorization) {
        console.log(`🔑 Auth Header present: ${req.headers.authorization.substring(0, 15)}...`);
    } else {
        console.log("🔑 No Auth Header present");
    }
    next();
});

// Auth Middleware
const authenticate = async (req: Request | any, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1] || req.query.token;

    console.log(`🔒 Auth attempt: ${req.method} ${req.url}`);
    if (!token) {
        console.log("❌ No token provided");
        return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await AuthService.verifyToken(token as string);
    if (!user) {
        console.log("❌ Token verification failed or user not found");
        return res.status(401).json({ error: "Invalid token" });
    }

    console.log(`✅ Auth success: user ${user.id}`);
    req.user = user;
    next();
};

// Health
app.get("/api/health", (req, res) => {
    console.log("✅ Health check called");
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
console.log("📋 Registering routes...");
app.use("/api/auth", authRoutes);
app.use("/api/assets", authenticate, assetRoutes);
app.use("/api/documents", authenticate, documentRoutes);
app.use("/api/estates", authenticate, estateRoutes);
app.use("/api/enrichment", authenticate, enrichmentRoutes);
app.use("/api/admin", authenticate, adminRoutes);
app.use("/api/agent", authenticate, agentRoutes);
app.use("/api/communications", authenticate, communicationRoutes);
app.use("/api/collaboration", authenticate, collaborationRoutes);
app.use("/api/liabilities", authenticate, liabilityRoutes);
app.use("/api/discovery", authenticate, discoveryRoutes);
app.use("/api/heirs", authenticate, heirRoutes);
app.use("/api/pdf", authenticate, pdfRoutes);
app.use("/api/forms", authenticate, formRoutes);
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
console.log("📂 Setting up static file serving...");
app.use(express.static(distPath));

// Catch-all to serve index.html for React Router
app.get(/(.*)/, (req, res) => {
    if (req.path.startsWith("/api/")) {
        return res.status(404).json({ error: "API route not found" });
    }
    res.sendFile(path.join(distPath, "index.html"));
});

// Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error("❌ Server error:", err);
    res.status(500).json({ error: "Internal server error" });
});

// Always listen when in production or no specific VITE_API_URL is set
// Cloud Run expects the server to listen on the PORT environment variable
console.log(`🎧 Starting server on 0.0.0.0:${port}...`);

const server = app.listen(port, '0.0.0.0', async () => {
    console.log(`✅ Server running on http://0.0.0.0:${port}`);
    console.log(`✅ Environment: ${process.env.NODE_ENV}`);
    console.log(`✅ Database: ${process.env.DATABASE_URL ? 'Connected' : 'NOT CONFIGURED'}`);

    // Seed default forms if DB is empty
    try {
        const { FormSeedingService } = await import("./services/formSeedingService.js");
        const count = await prisma.formTemplate.count();
        if (count === 0) {
            await FormSeedingService.seedDefaults();
        }
    } catch (e) {
        console.error("Failed to seed default forms:", e);
    }

    console.log(`🎉 Server is ready to accept connections!`);
}).on('error', (err: any) => {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
});

// Catch unhandled errors
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

export default app;
