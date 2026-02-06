import { Router } from "express";
import { prisma } from "../db.js";
import { FormSeedingService } from "../services/formSeedingService.js";
import { StripeService } from "../services/stripeService.js";
const router = Router();
// Admin Middleware check
const isAdmin = (req, res, next) => {
    // DEV BYPASS: Allow all users to access admin during development/demo
    // if (req.user?.role !== 'ADMIN') {
    //    return res.status(403).json({ error: "Admin access required" });
    // }
    next();
};
router.get("/stats", isAdmin, async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch stats" });
    }
});
router.get("/users", isAdmin, async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            include: { _count: { select: { estates: true, communications: true } } }
        });
        res.json(users);
    }
    catch (error) {
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
        res.status(500).json({ error: "Failed to list templates" });
    }
});
router.post("/templates", isAdmin, async (req, res) => {
    try {
        const name = req.query.name;
        const state = req.query.state || "CA";
        const category = req.query.category || "General";
        const title = req.query.title;
        const description = req.query.description;
        const icon = req.query.icon;
        if (!name)
            return res.status(400).json({ error: "Name query param required" });
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
        console.error("Upload error:", e);
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
        res.status(500).json({ error: "Failed to fetch institutions" });
    }
});
router.post("/institutions", isAdmin, async (req, res) => {
    try {
        const { name, phone, email, fax, website, address, logoUrl } = req.body;
        if (!name)
            return res.status(400).json({ error: "Institution name required" });
        const institution = await prisma.institution.create({
            data: { name, phone, email, fax, website, address, logoUrl }
        });
        res.status(201).json(institution);
    }
    catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: "Institution already exists" });
        }
        res.status(500).json({ error: "Failed to create institution" });
    }
});
router.put("/institutions/:id", isAdmin, async (req, res) => {
    try {
        const { name, phone, email, fax, website, address, logoUrl } = req.body;
        const institution = await prisma.institution.update({
            where: { id: req.params.id },
            data: { name, phone, email, fax, website, address, logoUrl }
        });
        res.json(institution);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to update institution" });
    }
});
router.delete("/institutions/:id", isAdmin, async (req, res) => {
    try {
        await prisma.institution.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    }
    catch (error) {
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
        const { key, value, isSecret } = req.body;
        if (!key)
            return res.status(400).json({ error: "Key required" });
        await ConfigService.set(key, value, isSecret);
        res.json({ success: true });
    }
    catch (error) {
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
        console.error('Error fetching user progress:', error);
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
        console.error('❌ Failed to fetch transactions:', error);
        res.status(500).json({ error: "Failed to fetch transactions" });
    }
});
router.post("/waive-fees", isAdmin, async (req, res) => {
    try {
        const { userId, notes } = req.body;
        if (!userId)
            return res.status(400).json({ error: "userId required" });
        await StripeService.waiveFees(userId, notes || 'Admin waived fees');
        res.json({ success: true, message: 'Fees waived successfully' });
    }
    catch (error) {
        console.error('❌ Waive fees error:', error);
        res.status(500).json({ error: error.message });
    }
});
router.post("/refund", isAdmin, async (req, res) => {
    try {
        const { transactionId, notes } = req.body;
        if (!transactionId)
            return res.status(400).json({ error: "transactionId required" });
        const refund = await StripeService.issueRefund(transactionId, notes || 'Admin issued refund');
        res.json({ success: true, refund });
    }
    catch (error) {
        console.error('❌ Refund error:', error);
        res.status(500).json({ error: error.message });
    }
});
export default router;
