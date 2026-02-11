import { Router, Request, Response } from "express";
import { prisma } from "../db.js";
import { FormSeedingService } from "../services/formSeedingService.js";
import { StripeService } from "../services/stripeService.js";
import { KnowledgeService } from "../services/knowledgeService.js";
import { z } from "zod";
import { logger } from "../lib/logger.js";

const router = Router();

const AUTHORIZED_ADMINS = ['aravind45@gmail.com'];

// Schemas
const institutionSchema = z.object({
    name: z.string().min(1),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    fax: z.string().optional(),
    website: z.string().url().optional().or(z.literal("")),
    address: z.string().optional(),
    logoUrl: z.string().url().optional().or(z.literal(""))
});

const settingsSchema = z.object({
    key: z.string().min(1),
    value: z.any(),
    isSecret: z.boolean().optional()
});

const waiveFeesSchema = z.object({
    userId: z.string().min(1),
    notes: z.string().optional()
});

const refundSchema = z.object({
    transactionId: z.string().min(1),
    notes: z.string().optional()
});

const ingestSchema = z.object({
    text: z.string().min(1),
    source: z.string().min(1)
});

const templateMetadataSchema = z.object({
    name: z.string().min(1),
    state: z.string().optional().default("CA"),
    category: z.string().optional().default("General"),
    title: z.string().optional(),
    description: z.string().optional(),
    icon: z.string().optional()
});

// Admin Middleware check
const isAdmin = (req: any, res: Response, next: any) => {
    if (!req.user || !AUTHORIZED_ADMINS.includes(req.user.email)) {
        return res.status(403).json({ error: "Admin access restricted to authorized personnel" });
    }
    next();
};

router.get("/stats", isAdmin, async (req: any, res: Response) => {
    try {
        const userCount = await prisma.user.count();
        const assetCount = await prisma.asset.count();
        const totalValue = await prisma.asset.aggregate({ _sum: { value: true } });
        const institutionCount = await prisma.institution.count();

        res.json({
            users: userCount,
            assets: assetCount,
            totalValue: totalValue._sum.value || 0,
            institutions: institutionCount
        });
    } catch (error: any) {
        logger.error("Failed to fetch admin stats:", error.message);
        res.status(500).json({ error: "Failed to fetch stats" });
    }
});

router.get("/users", isAdmin, async (req: any, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            include: {
                _count: { select: { estates: true, communications: true } },
                estates: { select: { id: true, name: true } }
            }
        });
        res.json(users);
    } catch (error: any) {
        logger.error("Failed to fetch admin users:", error.message);
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

// Template Management
router.get("/templates", isAdmin, async (req: any, res: Response) => {
    try {
        const templates = await prisma.formTemplate.findMany({
            select: { id: true, name: true, title: true, description: true, icon: true, state: true, category: true, updatedAt: true }
        });
        res.json(templates);
    } catch (e: any) {
        logger.error("Failed to list admin templates:", e.message);
        res.status(500).json({ error: "Failed to list templates" });
    }
});

router.post("/templates", isAdmin, async (req: any, res: Response) => {
    try {
        const validated = templateMetadataSchema.parse(req.query);
        const { name, state, category, title, description, icon } = validated;

        // req.body is Buffer because of express.raw
        if (!req.body || !Buffer.isBuffer(req.body)) {
            return res.status(400).json({ error: "Binary PDF body required" });
        }

        const template = await prisma.formTemplate.upsert({
            where: { name },
            update: { data: req.body, state, category, title, description, icon },
            create: { name, data: req.body, state, category, title, description, icon }
        });
        res.json({ success: true, id: template.id });
    } catch (e: any) {
        if (e instanceof z.ZodError) return res.status(400).json({ error: "Invalid template metadata", details: e.errors });
        logger.error("Upload error:", e.message);
        res.status(500).json({ error: "Failed to upload template" });
    }
});

router.post("/seed-templates", isAdmin, async (req: any, res: Response) => {
    try {
        await FormSeedingService.seedDefaults();
        res.json({ success: true, message: "Default templates seeded successfully" });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Institution Directory Management
router.get("/institutions", isAdmin, async (req: any, res: Response) => {
    try {
        const institutions = await prisma.institution.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(institutions);
    } catch (error: any) {
        logger.error("Failed to fetch institutions:", error.message);
        res.status(500).json({ error: "Failed to fetch institutions" });
    }
});

router.post("/institutions", isAdmin, async (req: any, res: Response) => {
    try {
        const validated = institutionSchema.parse(req.body);

        const institution = await prisma.institution.create({
            data: {
                name: validated.name as string,
                phone: validated.phone,
                email: validated.email,
                fax: validated.fax,
                website: validated.website,
                address: validated.address,
                logoUrl: validated.logoUrl
            }
        });
        res.status(201).json(institution);
    } catch (error: any) {
        if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid institution data", details: error.errors });
        if (error.code === 'P2002') {
            return res.status(409).json({ error: "Institution already exists" });
        }
        logger.error("Failed to create institution:", error.message);
        res.status(500).json({ error: "Failed to create institution" });
    }
});

router.put("/institutions/:id", isAdmin, async (req: any, res: Response) => {
    try {
        const validated = institutionSchema.partial().parse(req.body);
        const institution = await prisma.institution.update({
            where: { id: req.params.id },
            data: validated as any
        });
        res.json(institution);
    } catch (error: any) {
        if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid institution update", details: error.errors });
        logger.error("Failed to update institution:", error.message);
        res.status(500).json({ error: "Failed to update institution" });
    }
});

router.delete("/institutions/:id", isAdmin, async (req: any, res: Response) => {
    try {
        await prisma.institution.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error: any) {
        logger.error("Failed to delete institution:", error.message);
        res.status(500).json({ error: "Failed to delete institution" });
    }
});

// App Settings Management
router.get("/settings", isAdmin, async (req: any, res: Response) => {
    try {
        const { ConfigService } = await import("../services/configService.js");
        const settings = await ConfigService.getAll();
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch settings" });
    }
});

router.post("/settings", isAdmin, async (req: any, res: Response) => {
    try {
        const { ConfigService } = await import("../services/configService.js");
        const validated = settingsSchema.parse(req.body);
        const { key, value, isSecret } = validated;

        await ConfigService.set(key, value, isSecret);
        res.json({ success: true });
    } catch (error: any) {
        if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid settings data", details: error.errors });
        logger.error("Failed to save setting:", error.message);
        res.status(500).json({ error: "Failed to save setting" });
    }
});

/**
 * GET /api/admin/user-progress
 * Get roadmap progress for all users - shows where each user is in their settlement process
 */
router.get("/user-progress", isAdmin, async (req: any, res: Response) => {
    try {
        const estates = await prisma.estate.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        fullName: true,
                        lastLoginAt: true,
                    },
                },
                _count: {
                    select: {
                        assets: true,
                        heirs: true,
                    },
                },
            },
            orderBy: {
                updatedAt: 'desc',
            },
        });

        const progressData = await Promise.all(
            estates.map(async (estate) => {
                // Get settlement type and roadmap
                const settlementTypeCode = estate.settlementPath || estate.estateType || 'FORMAL_PROBATE';
                const settlementType = await prisma.settlementType.findUnique({
                    where: { code: settlementTypeCode },
                    include: {
                        phases: {
                            include: {
                                tasks: true,
                            },
                            orderBy: { orderIndex: 'asc' },
                        },
                    },
                });

                if (!settlementType) {
                    return null;
                }

                // Calculate progress
                const totalTasks = settlementType.phases.reduce((sum, phase) => sum + phase.tasks.length, 0);
                const completedTaskIds = (estate.roadmapProgress as any)?.completedTaskIds || [];
                const completedCount = completedTaskIds.length;
                const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

                // Find current phase (first incomplete phase)
                let currentPhase = settlementType.phases[0];
                let currentPhaseIndex = 0;
                for (let i = 0; i < settlementType.phases.length; i++) {
                    const phase = settlementType.phases[i];
                    const phaseTasks = phase.tasks.map(t => t.taskCode);
                    const phaseCompleted = phaseTasks.every(taskCode => completedTaskIds.includes(taskCode));
                    if (!phaseCompleted) {
                        currentPhase = phase;
                        currentPhaseIndex = i;
                        break;
                    }
                }

                // Get last activity
                const lastActivity = await prisma.settlementActivity.findFirst({
                    where: { estateId: estate.id },
                    orderBy: { occurredAt: 'desc' },
                });

                // Calculate days since last activity
                const daysSinceActivity = lastActivity
                    ? Math.floor((Date.now() - new Date(lastActivity.occurredAt).getTime()) / (1000 * 60 * 60 * 24))
                    : null;

                return {
                    userId: estate.user.id,
                    userEmail: estate.user.email,
                    userName: estate.user.fullName,
                    lastLogin: estate.user.lastLoginAt,
                    estateId: estate.id,
                    estateName: estate.name,
                    settlementType: {
                        code: settlementType.code,
                        name: settlementType.name,
                        tier: settlementType.tier,
                    },
                    progress: {
                        completedTasks: completedCount,
                        totalTasks: totalTasks,
                        percent: progressPercent,
                        status: getProgressStatus(progressPercent),
                    },
                    currentPhase: {
                        index: currentPhaseIndex,
                        total: settlementType.phases.length,
                        code: currentPhase.phaseCode,
                        title: currentPhase.title,
                    },
                    assets: estate._count.assets,
                    heirs: estate._count.heirs,
                    lastActivity: lastActivity
                        ? {
                            action: lastActivity.action,
                            date: lastActivity.occurredAt,
                            daysSince: daysSinceActivity,
                        }
                        : null,
                    createdAt: estate.createdAt,
                    updatedAt: estate.updatedAt,
                };
            })
        );

        // Filter out nulls and sort by progress
        const validProgress = progressData.filter(p => p !== null);
        validProgress.sort((a, b) => b!.progress.percent - a!.progress.percent);

        res.json({
            total: validProgress.length,
            users: validProgress,
        });
    } catch (error: any) {
        logger.error('Error fetching user progress:', error.message);
        res.status(500).json({ error: 'Failed to fetch user progress' });
    }
});

function getProgressStatus(percent: number): string {
    if (percent === 0) return 'Not Started';
    if (percent < 25) return 'Just Started';
    if (percent < 50) return 'In Progress';
    if (percent < 75) return 'Halfway There';
    if (percent < 100) return 'Almost Done';
    return 'Complete';
}

// Billing & Transactions
router.get("/transactions", isAdmin, async (req: any, res: Response) => {
    try {
        const transactions = await prisma.transaction.findMany({
            include: {
                user: {
                    select: { id: true, email: true, fullName: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 100
        });
        res.json(transactions);
    } catch (error: any) {
        logger.error('Failed to fetch transactions:', error.message);
        res.status(500).json({ error: "Failed to fetch transactions" });
    }
});

router.post("/waive-fees", isAdmin, async (req: any, res: Response) => {
    try {
        const validated = waiveFeesSchema.parse(req.body);
        const { userId, notes } = validated;

        await StripeService.waiveFees(userId, notes || 'Admin waived fees');
        res.json({ success: true, message: 'Fees waived successfully' });
    } catch (error: any) {
        if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid waive-fees request", details: error.errors });
        logger.error('Waive fees error:', error.message);
        res.status(500).json({ error: "Failed to waive fees" });
    }
});

router.post("/refund", isAdmin, async (req: any, res: Response) => {
    try {
        const validated = refundSchema.parse(req.body);
        const { transactionId, notes } = validated;

        const refund = await StripeService.issueRefund(transactionId, notes || 'Admin issued refund');
        res.json({ success: true, refund });
    } catch (error: any) {
        if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid refund request", details: error.errors });
        logger.error('Refund error:', error.message);
        res.status(500).json({ error: "Failed to issue refund" });
    }
});

// Knowledge Base Management
router.get("/knowledge/stats", isAdmin, async (req, res) => {
    try {
        const stats = await KnowledgeService.getStats();
        res.json(stats);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/knowledge/chunks", isAdmin, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit as string) || 100;
        const offset = parseInt(req.query.offset as string) || 0;
        const chunks = await KnowledgeService.listChunks(limit, offset);
        res.json(chunks);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/knowledge/ingest", isAdmin, async (req, res) => {
    try {
        const validated = ingestSchema.parse(req.body);
        const { text, source } = validated;

        const result = await KnowledgeService.ingestText(text, source);
        res.json(result);
    } catch (error: any) {
        if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid ingestion request", details: error.errors });
        logger.error("Ingestion error:", error.message);
        res.status(500).json({ error: "Failed to ingest text" });
    }
});

router.delete("/knowledge/chunks/:id", isAdmin, async (req, res) => {
    try {
        await KnowledgeService.deleteChunk(req.params.id);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Estate Management & Reset
router.put("/estates/:id/reset", isAdmin, async (req: any, res: Response) => {
    try {
        const { id } = req.params;

        // Reset the estate track fields and JSON blobs
        const updatedEstate = await prisma.estate.update({
            where: { id },
            data: {
                estateType: null,
                authorityType: "UNSET",
                authorityStatus: "NOT_STARTED",
                probateStatus: "NOT_STARTED",
                settlementPath: null,
                roadmapProgress: null,
                authorityDecision: null,
                status: "NOT_STARTED", // Revert to initial status
                iaeaType: null,
                appointedDate: null,
                hearingDate: null,
                hearingTime: null,
                hearingDept: null,
                hearingAddress: null,
                courtCaseNumber: null,
                probateCounty: null,
            }
        });

        // Clear associated task completions and deadlines to ensure a clean slate
        await prisma.taskCompletion.deleteMany({ where: { estateId: id } });
        await prisma.deadline.deleteMany({ where: { estateId: id } });

        // Log the reset action
        await prisma.settlementActivity.create({
            data: {
                estateId: id,
                userId: req.user.id,
                type: 'CONFIGURATION',
                action: 'RESET',
                notes: `ADMIN RESET – Estate settlement track and roadmap data have been cleared by an administrator.`
            }
        });

        res.json({ success: true, estate: updatedEstate });
    } catch (error: any) {
        logger.error('Estate reset error:', error.message);
        res.status(500).json({ error: "Failed to reset estate data" });
    }
});

export default router;
