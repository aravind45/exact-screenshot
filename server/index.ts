import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { logger } from "./lib/logger.js";
import { execSync } from "child_process";
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
import discoveryRoutes from "./routes/discoveryRoutes.js";
import { heirRoutes } from "./routes/heirRoutes.js";
import { pdfRoutes } from "./routes/pdfRoutes.js";
import formRoutes from "./routes/formRoutes.js";
import helpRoutes from "./routes/helpRoutes.js";
import billingRoutes from "./routes/billingRoutes.js";
import marketingRoutes from "./routes/marketingRoutes.js";

const isServerless = process.env.VERCEL === '1' || process.env.NETLIFY === 'true' || !!process.env.AWS_EXECUTION_ENV || !!process.env.FUNCTION_NAME;
const app = express();
const port = Number(process.env.PORT) || 3000;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Both in dev (server/index.ts) and prod (dist-server/index.js), 
// the static 'dist' folder is at ../dist relative to the file.
const distPath = path.resolve(__dirname, "../dist");

logger.info("🚀 Starting ExpectedEstate server...");
logger.info(`📦 Node environment: ${process.env.NODE_ENV}`);
logger.info(`🔌 Port: ${port}`);
logger.info(`📁 Dist path: ${distPath}`);
logger.info(`💾 Database URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ NOT SET'}`);
logger.info(`🔍 Serverless detection: ${isServerless ? 'YES' : 'NO'}`);

// 1. Security Headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "connect-src": ["'self'", "https://api.mailgun.net", "https://api.stripe.com"],
            "img-src": ["'self'", "data:", "https://*.stripe.com"],
            "frame-src": ["'self'", "https://*.stripe.com"]
        }
    }
}));

// 2. HTTPS Enforcement (Production only)
app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https' && process.env.NODE_ENV === 'production' && !isServerless) {
        return res.redirect(`https://${req.header('host')}${req.url}`);
    }
    next();
});

// 3. CORS Configuration
const allowedOrigins = [
    process.env.APP_URL,
    'http://localhost:5173',
    'http://localhost:3000',
    'https://www.expectedestate.com',
    'https://expected-estate.vercel.app'
].filter(Boolean) as string[];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            logger.warn(`🚫 [CORS] Blocked request from unauthorized origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 4. Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per `window`
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: "Too many requests from this IP, please try again after 15 minutes" },
    skip: (req) => req.path === '/api/health' || req.path === '/api/ping'
});

app.use("/api/", limiter);

app.use(express.json({ limit: '1mb' })); // Request size limit
app.use(express.raw({
    type: ['application/pdf', 'image/jpeg', 'image/png'],
    limit: '10mb'
}));

// Logger (Sanitized)
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    if (req.headers.authorization) {
        logger.debug(`🔑 Auth Header present (truncated): ${req.headers.authorization.substring(0, 10)}...`);
    }
    next();
});

// Auth Middleware
const authenticate = async (req: Request | any, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    logger.debug(`🔒 [AUTH] Attempting ${req.method} ${req.url}`);
    if (!token) {
        logger.debug("❌ [AUTH] No token found");
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const user = await AuthService.verifyToken(token as string);
        if (!user) {
            logger.debug("❌ [AUTH] verifyToken returned null");
            return res.status(401).json({ error: "Unauthorized" });
        }

        logger.debug(`✅ [AUTH] Success for user: ${user.id}`);
        req.user = user;
        next();
    } catch (err: any) {
        logger.error("❌ [AUTH] Middleware error:", err.message);
        return res.status(500).json({ error: "Authentication service error" });
    }
};

// Health & Ping
app.get("/api/health", async (req, res) => {
    try {
        // Simple DB check as requested in audit
        await prisma.$queryRaw`SELECT 1`;
        res.json({ status: "ok", db: "connected", timestamp: new Date().toISOString() });
    } catch (e) {
        logger.error("💔 Health check DB failed");
        res.status(500).json({ status: "error", db: "disconnected" });
    }
});

app.get("/api/ping", (req, res) => {
    res.send("pong");
});

// Routes
logger.info("📋 Registering routes...");
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
app.use("/api/help", authenticate, helpRoutes);
app.use("/api/billing", authenticate, billingRoutes);
app.use("/api/marketing", marketingRoutes);
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

// Serve Static Files (Disabled in serverless to avoid path issues)
if (!isServerless) {
    console.log("📂 Setting up static file serving...");
    app.use(express.static(distPath));

    // Catch-all to serve index.html for React Router
    app.get(/(.*)/, (req, res) => {
        if (req.path.startsWith("/api/")) {
            return res.status(404).json({ error: "API route not found" });
        }
        res.sendFile(path.join(distPath, "index.html"));
    });
} else {
    console.log("📂 Skipping static file serving in serverless mode");
}

// Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    logger.error("❌ Server Error:", {
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
        url: req.url,
        method: req.method
    });

    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production' ? "Internal server error" : err.message
    });
});

// Always listen when in production or no specific VITE_API_URL is set
// Cloud Run expects the server to listen on the PORT environment variable
console.log(`🎧 Starting server on 0.0.0.0:${port}...`);

let server: any; // Declare server variable outside the conditional block

if (!isServerless) {
    server = app.listen(port, '0.0.0.0', async () => {
        console.log(`✅ Server running on http://0.0.0.0:${port}`);
        console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);

        // Background Database Sync & Seeding (Non-blocking)
        (async () => {
            console.log("ℹ️ Skipping auto-db-push in production for safety. Use 'prisma migrate deploy' in CI/CD.");

            try {
                // Seed default forms if DB is empty
                const { FormSeedingService } = await import("./services/formSeedingService.js");
                const count = await prisma.formTemplate.count();
                if (count === 0) {
                    console.log("🌱 Seeding default forms...");
                    await FormSeedingService.seedDefaults();
                }
                console.log(`🎉 Background initialization complete! Server is fully ready.`);
            } catch (e) {
                console.error("❌ Background initialization error:", e);
            }
        })();
    });

    server.on('error', (err: any) => {
        console.error("❌ Failed to start server:", err);
        process.exit(1);
    });
} else {
    console.log(`🔧 Running in serverless mode - app exported for function invocation`);
}

// Graceful shutdown (only if server is running)
if (server) {
    process.on('SIGTERM', () => {
        console.log('SIGTERM signal received: closing HTTP server');
        server.close(() => {
            console.log('HTTP server closed');
        });
    });
}


// Catch unhandled errors
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    if (!isServerless) process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    if (!isServerless) process.exit(1);
});

export default app;
