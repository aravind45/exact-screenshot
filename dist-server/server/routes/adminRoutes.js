import { Router } from "express";
import { prisma } from "../db.js";
import { FormSeedingService } from "../services/formSeedingService.js";
import { StripeService } from "../services/stripeService.js";
import { KnowledgeService } from "../services/knowledgeService.js";
import { z } from "zod";
import { logger } from "../lib/logger.js";
import { RoleUtils } from "../utils/userUtils.js";
import multer from 'multer';
const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
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
    source: z.string().min(1),
    title: z.string().optional(),
    docType: z.string().optional(),
    jurisdiction: z.string().optional()
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
const isAdmin = (req, res, next) => {
    if (!req.user || !RoleUtils.isAdmin(req.user)) {
        return res.status(403).json({ error: "Admin access restricted to authorized personnel" });
    }
    next();
};
router.get("/stats", isAdmin, async (req, res) => {
    try {
        const userCount = await prisma.user.count();
        const assetCount = await prisma.asset.count();
        const totalValue = await prisma.asset.aggregate({ _sum: { value: true } });
        const institutionCount = await prisma.institution.count();
        const leadCount = await prisma.marketingEvent.groupBy({
            by: ['email'],
            where: { email: { not: null } }
        });
        const eventCount = await prisma.marketingEvent.count();
        res.json({
            users: userCount,
            assets: assetCount,
            totalValue: totalValue._sum.value || 0,
            institutions: institutionCount,
            leads: leadCount.length,
            totalEvents: eventCount
        });
    }
    catch (error) {
        logger.error("Failed to fetch admin stats:", error.message);
        res.status(500).json({ error: "Failed to fetch stats" });
    }
});
router.get("/users", isAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const search = req.query.search || "";
        const skip = (page - 1) * limit;
        const where = search ? {
            OR: [
                { fullName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
            ]
        } : {};
        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                include: {
                    _count: { select: { estates: true, communications: true } },
                    estates: { select: { id: true, name: true } }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.user.count({ where })
        ]);
        res.json({
            data: users,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });
    }
    catch (error) {
        logger.error("Failed to fetch admin users:", error.message);
        res.status(500).json({ error: "Failed to fetch users" });
    }
});
// Template Management
router.get("/templates", isAdmin, async (req, res) => {
    try {
        const templates = await prisma.formTemplate.findMany({
            select: { id: true, name: true, title: true, description: true, icon: true, state: true, category: true, updatedAt: true }
        });
        res.json(templates);
    }
    catch (e) {
        logger.error("Failed to list admin templates:", e.message);
        res.status(500).json({ error: "Failed to list templates" });
    }
});
router.post("/templates", isAdmin, async (req, res) => {
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
    }
    catch (e) {
        if (e instanceof z.ZodError)
            return res.status(400).json({ error: "Invalid template metadata", details: e.errors });
        logger.error("Upload error:", e.message);
        res.status(500).json({ error: "Failed to upload template" });
    }
});
router.post("/seed-templates", isAdmin, async (req, res) => {
    try {
        await FormSeedingService.seedDefaults();
        res.json({ success: true, message: "Default templates seeded successfully" });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Institution Directory Management
router.get("/institutions", isAdmin, async (req, res) => {
    try {
        const institutions = await prisma.institution.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(institutions);
    }
    catch (error) {
        logger.error("Failed to fetch institutions:", error.message);
        res.status(500).json({ error: "Failed to fetch institutions" });
    }
});
router.post("/institutions", isAdmin, async (req, res) => {
    try {
        const validated = institutionSchema.parse(req.body);
        const institution = await prisma.institution.create({
            data: {
                name: validated.name,
                phone: validated.phone,
                email: validated.email,
                fax: validated.fax,
                website: validated.website,
                address: validated.address,
                logoUrl: validated.logoUrl
            }
        });
        res.status(201).json(institution);
    }
    catch (error) {
        if (error instanceof z.ZodError)
            return res.status(400).json({ error: "Invalid institution data", details: error.errors });
        if (error.code === 'P2002') {
            return res.status(409).json({ error: "Institution already exists" });
        }
        logger.error("Failed to create institution:", error.message);
        res.status(500).json({ error: "Failed to create institution" });
    }
});
router.put("/institutions/:id", isAdmin, async (req, res) => {
    try {
        const validated = institutionSchema.partial().parse(req.body);
        const institution = await prisma.institution.update({
            where: { id: req.params.id },
            data: validated
        });
        res.json(institution);
    }
    catch (error) {
        if (error instanceof z.ZodError)
            return res.status(400).json({ error: "Invalid institution update", details: error.errors });
        logger.error("Failed to update institution:", error.message);
        res.status(500).json({ error: "Failed to update institution" });
    }
});
router.delete("/institutions/:id", isAdmin, async (req, res) => {
    try {
        await prisma.institution.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    }
    catch (error) {
        logger.error("Failed to delete institution:", error.message);
        res.status(500).json({ error: "Failed to delete institution" });
    }
});
// App Settings Management
router.get("/settings", isAdmin, async (req, res) => {
    try {
        const { ConfigService } = await import("../services/configService.js");
        const settings = await ConfigService.getAll();
        res.json(settings);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch settings" });
    }
});
router.post("/settings", isAdmin, async (req, res) => {
    try {
        const { ConfigService } = await import("../services/configService.js");
        const validated = settingsSchema.parse(req.body);
        const { key, value, isSecret } = validated;
        await ConfigService.set(key, value, isSecret);
        res.json({ success: true });
    }
    catch (error) {
        if (error instanceof z.ZodError)
            return res.status(400).json({ error: "Invalid settings data", details: error.errors });
        logger.error("Failed to save setting:", error.message);
        res.status(500).json({ error: "Failed to save setting" });
    }
});
/**
 * GET /api/admin/user-progress
 * Get roadmap progress for all users - shows where each user is in their settlement process
 */
router.get("/user-progress", isAdmin, async (req, res) => {
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
        const progressData = await Promise.all(estates.map(async (estate) => {
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
            const completedTaskIds = estate.roadmapProgress?.completedTaskIds || [];
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
        }));
        // Filter out nulls and sort by progress
        const validProgress = progressData.filter(p => p !== null);
        validProgress.sort((a, b) => b.progress.percent - a.progress.percent);
        res.json({
            total: validProgress.length,
            users: validProgress,
        });
    }
    catch (error) {
        logger.error('Error fetching user progress:', error.message);
        res.status(500).json({ error: 'Failed to fetch user progress' });
    }
});
function getProgressStatus(percent) {
    if (percent === 0)
        return 'Not Started';
    if (percent < 25)
        return 'Just Started';
    if (percent < 50)
        return 'In Progress';
    if (percent < 75)
        return 'Halfway There';
    if (percent < 100)
        return 'Almost Done';
    return 'Complete';
}
// Billing & Transactions
router.get("/transactions", isAdmin, async (req, res) => {
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
    }
    catch (error) {
        logger.error('Failed to fetch transactions:', error.message);
        res.status(500).json({ error: "Failed to fetch transactions" });
    }
});
router.post("/waive-fees", isAdmin, async (req, res) => {
    try {
        const validated = waiveFeesSchema.parse(req.body);
        let { userId, notes } = validated;
        // Validating if the input looks like an email
        if (userId.includes('@')) {
            const user = await prisma.user.findUnique({
                where: { email: userId }
            });
            if (!user) {
                return res.status(404).json({ error: "User not found with that email" });
            }
            userId = user.id;
        }
        await StripeService.waiveFees(userId, notes || 'Admin waived fees');
        res.json({ success: true, message: 'Fees waived successfully' });
    }
    catch (error) {
        if (error instanceof z.ZodError)
            return res.status(400).json({ error: "Invalid waive-fees request", details: error.errors });
        logger.error('Waive fees error:', error.message);
        res.status(500).json({ error: "Failed to waive fees" });
    }
});
router.post("/refund", isAdmin, async (req, res) => {
    try {
        const validated = refundSchema.parse(req.body);
        const { transactionId, notes } = validated;
        const refund = await StripeService.issueRefund(transactionId, notes || 'Admin issued refund');
        res.json({ success: true, refund });
    }
    catch (error) {
        if (error instanceof z.ZodError)
            return res.status(400).json({ error: "Invalid refund request", details: error.errors });
        logger.error('Refund error:', error.message);
        res.status(500).json({ error: "Failed to issue refund" });
    }
});
// Knowledge Base Management
router.get("/knowledge/stats", isAdmin, async (req, res) => {
    try {
        const stats = await KnowledgeService.getStats();
        res.json(stats);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get("/knowledge/documents", isAdmin, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const offset = parseInt(req.query.offset) || 0;
        const docs = await KnowledgeService.listDocuments(limit, offset);
        res.json(docs);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.post("/knowledge/ingest", isAdmin, async (req, res) => {
    try {
        const validated = ingestSchema.parse(req.body);
        const { text, source, title, docType, jurisdiction } = validated;
        const result = await KnowledgeService.ingestText(text, {
            sourceUri: source,
            title: title || source, // Fallback to source if title missing
            docType: docType || 'OTHER',
            jurisdiction: jurisdiction
        });
        res.json(result);
    }
    catch (error) {
        if (error instanceof z.ZodError)
            return res.status(400).json({ error: "Invalid ingestion request", details: error.errors });
        logger.error("Ingestion error:", error.message);
        res.status(500).json({ error: "Failed to ingest text" });
    }
});
router.post("/knowledge/ingest-matrix", isAdmin, upload.single("file"), async (req, res) => {
    try {
        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ error: "Missing file upload. Please provide an Excel (.xlsx) file." });
        }
        const result = await KnowledgeService.ingestMatrixXlsx(req.file.buffer);
        res.json(result);
    }
    catch (error) {
        logger.error("Matrix ingestion error:", error.message);
        res.status(500).json({ error: "Failed to ingest matrix: " + error.message });
    }
});
router.delete("/knowledge/documents/:id", isAdmin, async (req, res) => {
    try {
        await KnowledgeService.deleteDocument(req.params.id);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Estate Management & Reset
router.put("/estates/:id/reset", isAdmin, async (req, res) => {
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
    }
    catch (error) {
        logger.error('Estate reset error:', error.message);
        res.status(500).json({ error: "Failed to reset estate data" });
    }
});
// Marketing & Leads Management
router.get("/marketing/events", isAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 25;
        const skip = (page - 1) * limit;
        const [events, total] = await Promise.all([
            prisma.marketingEvent.findMany({
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.marketingEvent.count()
        ]);
        res.json({
            data: events,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });
    }
    catch (error) {
        logger.error("Failed to fetch marketing events:", error.message);
        res.status(500).json({ error: "Failed to fetch marketing events" });
    }
});
export default router;
