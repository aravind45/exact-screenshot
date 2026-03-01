import { Router, Request, Response } from "express";
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
const isAdmin = (req: any, res: Response, next: any) => {
    if (!req.user || !RoleUtils.isAdmin(req.user)) {
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
    } catch (error: any) {
        logger.error("Failed to fetch admin stats:", error.message);
        res.status(500).json({ error: "Failed to fetch stats" });
    }
});

router.get("/users", isAdmin, async (req: any, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const search = (req.query.search as string) || "";
        const skip = (page - 1) * limit;

        const where: any = search ? {
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

router.get("/knowledge/documents", isAdmin, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit as string) || 100;
        const offset = parseInt(req.query.offset as string) || 0;
        const docs = await KnowledgeService.listDocuments(limit, offset);
        res.json(docs);
    } catch (error: any) {
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
            docType: (docType as any) || 'OTHER',
            jurisdiction: jurisdiction
        });
        res.json(result);
    } catch (error: any) {
        if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid ingestion request", details: error.errors });
        logger.error("Ingestion error:", error.message);
        res.status(500).json({ error: "Failed to ingest text" });
    }
});

router.post("/knowledge/ingest-matrix", isAdmin, upload.single("file"), async (req: any, res: Response) => {
    try {
        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ error: "Missing file upload. Please provide an Excel (.xlsx) file." });
        }

        const result = await KnowledgeService.ingestMatrixXlsx(req.file.buffer);
        res.json(result);
    } catch (error: any) {
        logger.error("Matrix ingestion error:", error.message);
        res.status(500).json({ error: "Failed to ingest matrix: " + error.message });
    }
});

router.delete("/knowledge/documents/:id", isAdmin, async (req, res) => {
    try {
        await KnowledgeService.deleteDocument(req.params.id);
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

// Marketing & Leads Management
router.get("/marketing/events", isAdmin, async (req: any, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 25;
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
    } catch (error: any) {
        logger.error("Failed to fetch marketing events:", error.message);
        res.status(500).json({ error: "Failed to fetch marketing events" });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// JURISDICTION HEALTH DASHBOARD ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

import * as JurisdictionDiagnosticsService from "../services/jurisdictionDiagnosticsService.js";

/**
 * GET /api/admin/jurisdictions/health
 * Get health summary for all jurisdictions
 */
router.get("/jurisdictions/health", isAdmin, async (req: any, res: Response) => {
    try {
        const summaries = await JurisdictionDiagnosticsService.getAllJurisdictionHealth();
        res.json({
            data: summaries,
            total: summaries.length,
            generatedAt: new Date().toISOString(),
        });
    } catch (error: any) {
        logger.error("Failed to fetch jurisdiction health:", error.message);
        res.status(500).json({ error: "Failed to fetch jurisdiction health" });
    }
});

/**
 * GET /api/admin/jurisdictions/:stateCode/diagnostics
 * Get detailed diagnostics for a specific state
 */
router.get("/jurisdictions/:stateCode/diagnostics", isAdmin, async (req: any, res: Response) => {
    try {
        const { stateCode } = req.params;
        const { useCache } = req.query;

        const report = await JurisdictionDiagnosticsService.runDiagnostics(stateCode, {
            useCache: useCache !== 'false',
        });

        res.json(report);
    } catch (error: any) {
        logger.error({ stateCode: req.params.stateCode }, "Failed to run diagnostics:");
        res.status(500).json({ error: "Failed to run diagnostics" });
    }
});

/**
 * GET /api/admin/jurisdictions/:stateCode/history
 * Get diagnostic history for a state
 */
router.get("/jurisdictions/:stateCode/history", isAdmin, async (req: any, res: Response) => {
    try {
        const { stateCode } = req.params;
        const limit = parseInt(req.query.limit as string) || 50;

        const history = await JurisdictionDiagnosticsService.getDiagnosticHistory(stateCode, { limit });

        res.json({
            stateCode,
            data: history,
            total: history.length,
        });
    } catch (error: any) {
        logger.error({ stateCode: req.params.stateCode }, "Failed to fetch diagnostic history:");
        res.status(500).json({ error: "Failed to fetch diagnostic history" });
    }
});

/**
 * GET /api/admin/jurisdictions/:stateCode/trend
 * Get health trend for a state
 */
router.get("/jurisdictions/:stateCode/trend", isAdmin, async (req: any, res: Response) => {
    try {
        const { stateCode } = req.params;
        const days = parseInt(req.query.days as string) || 30;

        const trend = await JurisdictionDiagnosticsService.getHealthTrend(stateCode, days);

        res.json({
            stateCode,
            days,
            data: trend,
        });
    } catch (error: any) {
        logger.error({ stateCode: req.params.stateCode }, "Failed to fetch health trend:");
        res.status(500).json({ error: "Failed to fetch health trend" });
    }
});

/**
 * POST /api/admin/jurisdictions/preview-roadmap
 * Preview roadmap for an estate profile
 */
const previewRoadmapSchema = z.object({
    stateCode: z.string().length(2),
    authorityType: z.enum(['PROBATE', 'TRUST', 'BOTH']),
    hasRealProperty: z.boolean(),
    estateValue: z.number().min(0),
    hasWill: z.boolean(),
    county: z.string().optional(),
    characteristics: z.object({
        isSmallEstate: z.boolean().optional(),
        hasMinorBeneficiaries: z.boolean().optional(),
        hasContest: z.boolean().optional(),
        isInternational: z.boolean().optional(),
        hasTODDeed: z.boolean().optional(),
        hasOutOfStateProperty: z.boolean().optional(),
        isSurvivingSpouse: z.boolean().optional(),
    }).optional(),
});

router.post("/jurisdictions/preview-roadmap", isAdmin, async (req: any, res: Response) => {
    try {
        const validated = previewRoadmapSchema.parse(req.body);

        const profile = {
            id: `preview_${Date.now()}`,
            name: `Preview ${validated.stateCode} ${validated.authorityType}`,
            stateCode: validated.stateCode,
            county: validated.county,
            authorityType: validated.authorityType,
            hasRealProperty: validated.hasRealProperty,
            estateValue: validated.estateValue,
            hasWill: validated.hasWill,
            characteristics: validated.characteristics || {},
        };

        const roadmap = await JurisdictionDiagnosticsService.previewRoadmap(profile);

        res.json({
            profile,
            roadmap,
        });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: "Invalid preview parameters", details: error.errors });
        }
        logger.error("Failed to preview roadmap:", error.message);
        res.status(500).json({ error: "Failed to preview roadmap" });
    }
});

/**
 * POST /api/admin/jurisdictions/:stateCode/run-diagnostics
 * Manually trigger diagnostic run for a state
 */
router.post("/jurisdictions/:stateCode/run-diagnostics", isAdmin, async (req: any, res: Response) => {
    try {
        const { stateCode } = req.params;

        const report = await JurisdictionDiagnosticsService.runDiagnostics(stateCode, {
            useCache: false,
        });

        // Persist the run
        await JurisdictionDiagnosticsService.persistDiagnosticRun(report, req.user.id, {
            commitSha: req.body.commitSha,
            branchName: req.body.branchName,
        });

        res.json(report);
    } catch (error: any) {
        logger.error({ stateCode: req.params.stateCode }, "Failed to run diagnostics:");
        res.status(500).json({ error: "Failed to run diagnostics" });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// COUNTY OVERRIDE GOVERNANCE ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/admin/county-overrides/pending
 * List pending county overrides awaiting approval
 */
router.get("/county-overrides/pending", isAdmin, async (req: any, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 25;
        const skip = (page - 1) * limit;

        const [overrides, total] = await Promise.all([
            prisma.countyOverride.findMany({
                where: { status: 'PENDING_REVIEW' },
                orderBy: { submittedAt: 'asc' },
                skip,
                take: limit,
            }),
            prisma.countyOverride.count({ where: { status: 'PENDING_REVIEW' } }),
        ]);

        res.json({
            data: overrides,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error: any) {
        logger.error("Failed to fetch pending county overrides:", error.message);
        res.status(500).json({ error: "Failed to fetch pending county overrides" });
    }
});

/**
 * GET /api/admin/county-overrides
 * List all county overrides with filtering
 */
router.get("/county-overrides", isAdmin, async (req: any, res: Response) => {
    try {
        const { stateCode, status, page = 1, limit = 25 } = req.query;
        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

        const where: any = {};
        if (stateCode) where.stateCode = stateCode;
        if (status) where.status = status;

        const [overrides, total] = await Promise.all([
            prisma.countyOverride.findMany({
                where,
                orderBy: { updatedAt: 'desc' },
                skip,
                take: parseInt(limit as string),
            }),
            prisma.countyOverride.count({ where }),
        ]);

        res.json({
            data: overrides,
            total,
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            totalPages: Math.ceil(total / parseInt(limit as string)),
        });
    } catch (error: any) {
        logger.error("Failed to fetch county overrides:", error.message);
        res.status(500).json({ error: "Failed to fetch county overrides" });
    }
});

/**
 * POST /api/admin/county-overrides/:id/approve
 * Approve a pending county override
 */
const approveOverrideSchema = z.object({
    notes: z.string().optional(),
});

router.post("/county-overrides/:id/approve", isAdmin, async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const validated = approveOverrideSchema.parse(req.body);

        const override = await prisma.countyOverride.update({
            where: { id },
            data: {
                status: 'APPROVED',
                reviewedBy: req.user.id,
                reviewedAt: new Date(),
                reviewNotes: validated.notes,
                publishedAt: new Date(),
            },
        });

        // Invalidate diagnostics cache for this state
        JurisdictionDiagnosticsService.invalidateStateCache(override.stateCode);

        // Log admin action
        await prisma.adminActionLog.create({
            data: {
                adminId: req.user.id,
                action: 'APPROVE_COUNTY_OVERRIDE',
                targetType: 'COUNTY_OVERRIDE',
                targetId: id,
                reason: validated.notes,
                metadata: { stateCode: override.stateCode, countyName: override.countyName, taskId: override.taskId },
            },
        });

        res.json({ success: true, override });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: "Invalid approval data", details: error.errors });
        }
        logger.error({ overrideId: req.params.id }, "Failed to approve county override:");
        res.status(500).json({ error: "Failed to approve county override" });
    }
});

/**
 * POST /api/admin/county-overrides/:id/reject
 * Reject a pending county override
 */
const rejectOverrideSchema = z.object({
    reason: z.string().min(1, "Rejection reason is required"),
});

router.post("/county-overrides/:id/reject", isAdmin, async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const validated = rejectOverrideSchema.parse(req.body);

        const override = await prisma.countyOverride.update({
            where: { id },
            data: {
                status: 'REJECTED',
                reviewedBy: req.user.id,
                reviewedAt: new Date(),
                reviewNotes: validated.reason,
            },
        });

        // Log admin action
        await prisma.adminActionLog.create({
            data: {
                adminId: req.user.id,
                action: 'REJECT_COUNTY_OVERRIDE',
                targetType: 'COUNTY_OVERRIDE',
                targetId: id,
                reason: validated.reason,
                metadata: { stateCode: override.stateCode, countyName: override.countyName, taskId: override.taskId },
            },
        });

        res.json({ success: true, override });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: "Invalid rejection data", details: error.errors });
        }
        logger.error({ overrideId: req.params.id }, "Failed to reject county override:");
        res.status(500).json({ error: "Failed to reject county override" });
    }
});

/**
 * GET /api/admin/county-overrides/:id/diff
 * Get diff preview for a county override
 */
router.get("/county-overrides/:id/diff", isAdmin, async (req: any, res: Response) => {
    try {
        const { id } = req.params;

        const override = await prisma.countyOverride.findUnique({
            where: { id },
        });

        if (!override) {
            return res.status(404).json({ error: "County override not found" });
        }

        // Get the original task data (from settlement phases config)
        const { SETTLEMENT_PHASE_TASKS } = await import("../../src/config/settlementPhases.js");
        let originalTask = null;

        for (const phase of SETTLEMENT_PHASE_TASKS) {
            const task = phase.tasks.find(t => t.id === override.taskId);
            if (task) {
                originalTask = task;
                break;
            }
        }

        res.json({
            override,
            originalTask: originalTask ? {
                id: originalTask.id,
                title: originalTask.title,
                description: originalTask.description,
                formNames: originalTask.formNames,
                primaryActionUrl: originalTask.primaryActionUrl,
            } : null,
            diff: {
                title: override.title !== originalTask?.title ? { from: originalTask?.title, to: override.title } : null,
                description: override.description !== originalTask?.description ? { from: originalTask?.description, to: override.description } : null,
                formNames: JSON.stringify(override.formNames) !== JSON.stringify(originalTask?.formNames) ? { from: originalTask?.formNames, to: override.formNames } : null,
                primaryActionUrl: override.primaryActionUrl !== originalTask?.primaryActionUrl ? { from: originalTask?.primaryActionUrl, to: override.primaryActionUrl } : null,
                feeAmount: override.feeAmount ? { from: null, to: override.feeAmount } : null,
            },
        });
    } catch (error: any) {
        logger.error({ overrideId: req.params.id }, "Failed to get county override diff:");
        res.status(500).json({ error: "Failed to get county override diff" });
    }
});

router.get("/authority-scope-health", async (req: Request, res: Response) => {
    try {
        const { SETTLEMENT_PHASE_TASKS } = await import("../../src/config/settlementPhases.js");

        const VALID_SCOPES = new Set(["PROBATE", "TRUST", "BOTH"]);
        const distribution = { PROBATE: 0, TRUST: 0, BOTH: 0 };
        const missingScope: string[] = [];
        const invalidScope: { taskId: string; value: string }[] = [];

        for (const phase of SETTLEMENT_PHASE_TASKS) {
            for (const task of phase.tasks) {
                const scope = (task as { authorityScope?: string }).authorityScope;
                if (!scope) {
                    missingScope.push(task.id);
                } else if (!VALID_SCOPES.has(scope)) {
                    invalidScope.push({ taskId: task.id, value: scope });
                } else {
                    distribution[scope as "PROBATE" | "TRUST" | "BOTH"]++;
                }
            }
        }

        const totalTasks = SETTLEMENT_PHASE_TASKS.reduce((sum, p) => sum + p.tasks.length, 0);
        const healthyTasks = distribution.PROBATE + distribution.TRUST + distribution.BOTH;
        const healthPercent = totalTasks > 0 ? Math.round((healthyTasks / totalTasks) * 100) : 100;

        let dbNullCount = 0;
        try {
            const result = await prisma.$queryRaw<{ count: bigint }[]>`
                SELECT COUNT(*) as count FROM roadmap_tasks WHERE authority_scope IS NULL
            `;
            dbNullCount = Number(result[0]?.count ?? 0);
        } catch {
            dbNullCount = -1;
        }

        res.json({
            health: {
                percent: healthPercent,
                status: healthPercent === 100 && dbNullCount === 0 ? "healthy" : "degraded",
            },
            configStats: {
                totalTasks,
                distribution,
                missingScope,
                invalidScope,
            },
            dbStats: {
                nullAuthorityScope: dbNullCount,
                status: dbNullCount === 0 ? "ok" : dbNullCount < 0 ? "unavailable" : "violations",
            },
        });
    } catch (error: any) {
        logger.error(error, "Failed to compute authority scope health");
        res.status(500).json({ error: "Failed to compute authority scope health" });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// VERIFICATION HEALTH ENDPOINT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/admin/verification-health
 * Shows verification harness health metrics:
 *   - Last harness run time (from the last diagnostic run)
 *   - Pass/fail summary per assertion category
 *   - Null authorityScope count in config
 *   - Duplicate task ID counts
 */
router.get("/verification-health", isAdmin, async (req: any, res: Response) => {
    try {
        const { SETTLEMENT_PHASE_TASKS } = await import("../../src/config/settlementPhases.js");
        const {
            filterTasksByJurisdiction,
            filterTasksByAuthorityScope,
        } = await import("../../src/shared/filterByJurisdiction.js");

        const SUPPORTED_STATES = ["CA", "FL", "GA", "MA", "MN", "NJ", "NY", "OH", "TX"];
        const VALID_SCOPES = new Set(["PROBATE", "TRUST", "BOTH"]);
        const KNOWN_TEMPLATE_TASKS = new Set(["file_affidavit"]);
        const STATE_STATUTE_PATTERNS: Record<string, RegExp[]> = {
            CA: [/Probate Code §/i, /Cal\. Prob\./i],
            FL: [/Florida Statutes §/i, /F\.S\. §/i],
            NY: [/SCPA §/i, /EPTL §/i],
            OH: [/Ohio Rev\. Code §/i, /O\.R\.C\. §/i],
            TX: [/Texas Estates Code §/i, /Tex\. Est\./i],
            NJ: [/N\.J\.S\.A\./i, /N\.J\. Stat\./i],
            GA: [/O\.C\.G\.A\./i, /Georgia Code §/i],
            MA: [/M\.G\.L\./i, /Mass\. Gen\. Laws/i],
            MN: [/Minn\. Stat\./i, /Minnesota Statutes §/i],
        };

        const allTasks = SETTLEMENT_PHASE_TASKS.flatMap((p: any) =>
            Array.isArray(p.tasks) ? p.tasks : []
        );

        // ─── Null authorityScope count ──────────────────────────────
        const nullScopeTasks = allTasks.filter(
            (t: any) => !t.authorityScope || !VALID_SCOPES.has(t.authorityScope)
        );

        // ─── Duplicate task IDs ─────────────────────────────────────
        const taskIdCounts = new Map<string, number>();
        for (const t of allTasks) {
            taskIdCounts.set(t.id, (taskIdCounts.get(t.id) || 0) + 1);
        }
        const duplicates = [...taskIdCounts.entries()]
            .filter(([, count]) => count > 1)
            .map(([id, count]) => ({ id, count }));

        // ─── Per-state verification summary ─────────────────────────
        const stateResults: Record<string, {
            crossStateViolations: number;
            trustLeaks: number;
            placeholders: number;
            totalTasks: { probate: number; trust: number };
        }> = {};

        for (const state of SUPPORTED_STATES) {
            const result = { crossStateViolations: 0, trustLeaks: 0, placeholders: 0, totalTasks: { probate: 0, trust: 0 } };

            for (const authorityType of ["PROBATE", "TRUST"] as const) {
                const { kept: jKept } = filterTasksByJurisdiction(allTasks, state);
                const { kept } = filterTasksByAuthorityScope(jKept, authorityType);

                if (authorityType === "PROBATE") result.totalTasks.probate = kept.length;
                if (authorityType === "TRUST") result.totalTasks.trust = kept.length;

                for (const task of kept) {
                    const text = [task.title, task.description, task.utility].filter(Boolean).join(" ");

                    // Cross-state check
                    for (const [foreignState, patterns] of Object.entries(STATE_STATUTE_PATTERNS)) {
                        if (foreignState === state) continue;
                        for (const pattern of patterns) {
                            if (pattern.test(text)) result.crossStateViolations++;
                        }
                    }

                    // Placeholder check
                    if (!KNOWN_TEMPLATE_TASKS.has(task.id) && text.includes("{{")) {
                        result.placeholders++;
                    }
                }
            }

            stateResults[state] = result;
        }

        // ─── Overall pass/fail ──────────────────────────────────────
        const totalCrossState = Object.values(stateResults).reduce((s, r) => s + r.crossStateViolations, 0);
        const totalPlaceholders = Object.values(stateResults).reduce((s, r) => s + r.placeholders, 0);
        const totalTrustLeaks = Object.values(stateResults).reduce((s, r) => s + r.trustLeaks, 0);

        const allPassed = totalCrossState === 0
            && totalPlaceholders === 0
            && totalTrustLeaks === 0
            && nullScopeTasks.length === 0;

        // ─── DB null count ──────────────────────────────────────────
        let dbNullCount = 0;
        try {
            const result = await prisma.$queryRaw<{ count: bigint }[]>`
                SELECT COUNT(*) as count FROM roadmap_tasks WHERE authority_scope IS NULL
            `;
            dbNullCount = Number(result[0]?.count ?? 0);
        } catch {
            dbNullCount = -1;
        }

        res.json({
            status: allPassed ? "PASS" : "FAIL",
            generatedAt: new Date().toISOString(),
            summary: {
                statesCovered: SUPPORTED_STATES.length,
                totalConfigTasks: allTasks.length,
                nullAuthorityScope: nullScopeTasks.length,
                duplicateTaskIds: duplicates.length,
                crossStateViolations: totalCrossState,
                placeholderViolations: totalPlaceholders,
                trustLeaks: totalTrustLeaks,
                dbNullAuthorityScope: dbNullCount,
            },
            assertions: {
                "no_cross_state_statutes": totalCrossState === 0 ? "PASS" : "FAIL",
                "no_trust_in_probate": totalTrustLeaks === 0 ? "PASS" : "FAIL",
                "no_rogue_placeholders": totalPlaceholders === 0 ? "PASS" : "FAIL",
                "no_null_authority_scope": nullScopeTasks.length === 0 ? "PASS" : "FAIL",
                "no_duplicate_task_ids": duplicates.length === 0 ? "PASS" : "FAIL",
            },
            details: {
                stateResults,
                nullScopeTasks: nullScopeTasks.map((t: any) => t.id),
                duplicates,
            },
        });
    } catch (error: any) {
        logger.error(error, "Failed to compute verification health");
        res.status(500).json({ error: "Failed to compute verification health" });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// INTEGRITY SCAN DASHBOARD ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

import * as IntegrityScanService from "../services/integrityScanService.js";

/**
 * POST /api/admin/integrity/run
 * Start a new integrity scan (full or single-state)
 */
const runIntegrityScanSchema = z.object({
    stateCode: z.string().length(2).optional(),
    checkIds: z.array(z.string()).optional(),
    profiles: z.array(z.any()).optional(),
    skipCache: z.boolean().optional(),
    commitSha: z.string().optional(),
    branchName: z.string().optional(),
});

router.post("/integrity/run", isAdmin, async (req: any, res: Response) => {
    try {
        const validated = runIntegrityScanSchema.parse(req.body);

        const scanOptions: any = {
            stateCode: validated.stateCode || null,
            checkIds: validated.checkIds || null,
            profiles: validated.profiles || undefined,
            skipCache: validated.skipCache || false,
        };

        const report = await IntegrityScanService.runFullScan(scanOptions);

        // Persist the scan run
        await IntegrityScanService.persistScanRun(report, req.user.id, {
            triggeredByUser: req.user.email,
            commitSha: validated.commitSha,
            branchName: validated.branchName,
        });

        res.json({
            success: true,
            report,
            persisted: true,
        });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: "Invalid scan parameters", details: error.errors });
        }
        logger.error("Failed to run integrity scan:", error.message);
        res.status(500).json({ error: "Failed to run integrity scan" });
    }
});

/**
 * GET /api/admin/integrity/runs
 * List recent integrity scan runs
 */
router.get("/integrity/runs", isAdmin, async (req: any, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 20;
        const runs = await IntegrityScanService.getLatestScanRuns(limit);

        res.json({
            data: runs,
            total: runs.length,
        });
    } catch (error: any) {
        logger.error("Failed to fetch integrity scan runs:", error.message);
        res.status(500).json({ error: "Failed to fetch scan runs" });
    }
});

/**
 * GET /api/admin/integrity/runs/:id
 * Get detailed scan run with findings
 */
router.get("/integrity/runs/:id", isAdmin, async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const result = await IntegrityScanService.getScanRun(id);

        res.json(result);
    } catch (error: any) {
        logger.error({ scanRunId: req.params.id }, "Failed to fetch scan run:");
        res.status(500).json({ error: "Failed to fetch scan run" });
    }
});

/**
 * GET /api/admin/integrity/state/:stateCode/latest
 * Get latest scan status for a specific state
 */
router.get("/integrity/state/:stateCode/latest", isAdmin, async (req: any, res: Response) => {
    try {
        const { stateCode } = req.params;
        const status = await IntegrityScanService.getStateLatestStatus(stateCode);

        if (!status) {
            return res.status(404).json({ 
                error: "No scan runs found for this state",
                stateCode,
                status: "NEVER_RUN",
            });
        }

        res.json(status);
    } catch (error: any) {
        logger.error({ stateCode: req.params.stateCode }, "Failed to fetch state latest status:");
        res.status(500).json({ error: "Failed to fetch state status" });
    }
});

/**
 * POST /api/admin/integrity/clear-cache
 * Clear the integrity scan cache
 */
router.post("/integrity/clear-cache", isAdmin, async (req: any, res: Response) => {
    try {
        IntegrityScanService.clearScanCache();
        
        res.json({ 
            success: true, 
            message: "Integrity scan cache cleared" 
        });
    } catch (error: any) {
        logger.error("Failed to clear scan cache:", error.message);
        res.status(500).json({ error: "Failed to clear cache" });
    }
});

export default router;
