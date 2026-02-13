import { Router } from "express";
import { prisma } from "../db.js";
import { PriorityService } from "../services/priorityService.js";
import { encrypt, decrypt } from "../utils/encryption.js";
import { RiskService } from "../services/riskService.js";
import { AuditService } from "../services/auditService.js";
import { z } from "zod";
import { logger } from "../lib/logger.js";
import { requireSubscription } from "../middleware/subscription.js";
const liabilitySchema = z.object({
    name: z.string().min(1),
    amount: z.coerce.number().positive(),
    status: z.string().optional(),
    invoiceDate: z.string().optional().nullable(),
    dueDate: z.string().optional().nullable(),
    accountNumber: z.string().optional().nullable(),
    notes: z.string().optional(),
    contactPhone: z.string().optional(),
    contactEmail: z.string().email().optional().or(z.literal("")),
    priority: z.string().optional(),
    priorityClass: z.string().optional()
});
const router = Router();
router.use(requireSubscription);
// Middleware to get estateId for the current user
const getEstateId = async (userId) => {
    const grant = await prisma.estateGrant.findFirst({
        where: { userId },
        include: { estate: true }
    });
    return grant?.estateId || (await prisma.estate.findFirst({ where: { userId } }))?.id;
};
// GET /api/liabilities - List all
router.get("/", async (req, res) => {
    try {
        const estateId = await getEstateId(req.user.id);
        if (!estateId)
            return res.status(404).json({ error: "Estate not found" });
        const liabilities = await prisma.liability.findMany({
            where: { estateId },
            orderBy: { createdAt: "desc" }
        });
        // Decrypt account numbers
        const decryptedLiabilities = liabilities.map(l => ({
            ...l,
            accountNumber: l.accountNumber ? decrypt(l.accountNumber) : l.accountNumber
        }));
        res.json(decryptedLiabilities);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// GET /api/liabilities/priority-options - Get state-specific options
router.get("/priority-options", async (req, res) => {
    try {
        const estateId = await getEstateId(req.user.id);
        if (!estateId)
            return res.status(404).json({ error: "Estate not found" });
        const estate = await prisma.estate.findUnique({
            where: { id: estateId },
            select: { deceasedState: true }
        });
        // Default to CA if state is missing
        const state = estate?.deceasedState || "CA";
        const system = PriorityService.getPrioritySystem(state);
        const options = PriorityService.getPriorityOptions(state);
        res.json({
            state,
            options,
            creditorNoticePeriodDays: system.creditorNoticePeriodDays
        });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// GET /api/liabilities/stats - Summary stats
router.get("/stats", async (req, res) => {
    try {
        const estateId = await getEstateId(req.user.id);
        if (!estateId)
            return res.status(404).json({ error: "Estate not found" });
        const liabilities = await prisma.liability.findMany({ where: { estateId } });
        const total = liabilities.reduce((sum, l) => sum + Number(l.amount), 0);
        const paid = liabilities.filter(l => l.status === "PAID")
            .reduce((sum, l) => sum + Number(l.amount), 0);
        const count = liabilities.length;
        const openCount = liabilities.filter(l => l.status !== "PAID").length;
        // Priority breakdown
        const priorityBreakdown = {};
        liabilities.forEach(l => {
            const pClass = l.priorityClass;
            if (!priorityBreakdown[pClass]) {
                priorityBreakdown[pClass] = { total: 0, paid: 0 };
            }
            const amt = Number(l.amount);
            priorityBreakdown[pClass].total += amt;
            if (l.status === "PAID") {
                priorityBreakdown[pClass].paid += amt;
            }
        });
        res.json({ total, paid, count, openCount, priorityBreakdown });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// GET /api/liabilities/solvency - Asset vs Debt comparison
router.get("/solvency", async (req, res) => {
    try {
        const estateId = await getEstateId(req.user.id);
        const estate = await prisma.estate.findUnique({
            where: { id: estateId },
            select: { authorityType: true, appointedDate: true, deceasedState: true }
        });
        const liabilities = await prisma.liability.findMany({ where: { estateId } });
        // Filter assets based on Authority Type
        // Probate/Small Estate -> Individual assets
        // Trust Admin -> Trust assets
        const assetFilter = {
            estateId,
            assetType: { in: ["checking", "savings", "cash", "brokerage", "monetary"] }
        };
        if (estate?.authorityType === "TRUST_ADMIN") {
            assetFilter.ownershipType = "TRUST";
        }
        else {
            // Default to Individual for Probate/Small Estate
            assetFilter.ownershipType = "INDIVIDUAL";
        }
        const assets = await prisma.asset.findMany({
            where: assetFilter
        });
        const totalDebt = liabilities.reduce((sum, l) => sum + Number(l.amount), 0);
        const totalLiquidAssets = assets.reduce((sum, a) => sum + (a.value || 0), 0);
        const isSolvent = totalLiquidAssets >= totalDebt;
        const ratio = totalDebt > 0 ? (totalLiquidAssets / totalDebt) : 1;
        // Creditor Notice Period Logic (CA default 120 days)
        const system = PriorityService.getPrioritySystem(estate?.deceasedState || "CA");
        const noticePeriodDays = system.creditorNoticePeriodDays;
        let noticePeriodStatus = 'NOT_STARTED';
        let daysRemaining = noticePeriodDays;
        if (estate?.appointedDate) {
            const appointed = new Date(estate.appointedDate);
            const now = new Date();
            const diffTime = now.getTime() - appointed.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            daysRemaining = Math.max(0, noticePeriodDays - diffDays);
            noticePeriodStatus = daysRemaining > 0 ? 'OPEN' : 'CLOSED';
        }
        res.json({
            totalDebt,
            totalLiquidAssets,
            isSolvent,
            ratio: Math.min(ratio, 2), // Cap ratio display for UI
            countLiquidAssets: assets.length,
            authorityType: estate?.authorityType || "UNKNOWN",
            noticePeriodStatus,
            daysRemaining
        });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// POST /api/liabilities - Create
router.post("/", async (req, res) => {
    try {
        const estateId = await getEstateId(req.user.id);
        if (!estateId)
            return res.status(404).json({ error: "Estate not found" });
        const validated = liabilitySchema.parse(req.body);
        const { name, amount, status, invoiceDate, dueDate, accountNumber, notes, contactPhone, contactEmail, priority, priorityClass } = validated;
        const liability = await prisma.liability.create({
            data: {
                estateId,
                name,
                amount: Number(amount),
                status: status || "DISCOVERED",
                invoiceDate: invoiceDate ? new Date(invoiceDate) : null,
                dueDate: dueDate ? new Date(dueDate) : null,
                accountNumber: accountNumber ? encrypt(accountNumber) : null,
                notes,
                contactPhone,
                contactEmail,
                priority: priority || "MEDIUM",
                priorityClass: priorityClass || "GENERAL_DEBTS"
            }
        });
        // Log activity
        await prisma.settlementActivity.create({
            data: {
                estateId,
                userId: req.user.id,
                action: "CREATED",
                type: "LIABILITY",
                notes: `Added liability: ${name} ($${amount})`
            }
        });
        // Return decrypted
        if (liability.accountNumber) {
            liability.accountNumber = decrypt(liability.accountNumber);
        }
        res.json(liability);
    }
    catch (e) {
        if (e instanceof z.ZodError)
            return res.status(400).json({ error: "Validation failed", details: e.errors });
        logger.error("Error creating liability:", e.message);
        res.status(500).json({ error: "Failed to create liability" });
    }
});
// PUT /api/liabilities/:id - Update
router.put("/:id", async (req, res) => {
    try {
        const estateId = await getEstateId(req.user.id);
        if (!estateId)
            return res.status(404).json({ error: "Estate not found" });
        const { id } = req.params;
        const validated = liabilitySchema.partial().parse(req.body);
        const data = { ...validated };
        // Convert dates if present
        if (data.invoiceDate)
            data.invoiceDate = new Date(data.invoiceDate);
        if (data.dueDate)
            data.dueDate = new Date(data.dueDate);
        if (data.amount)
            data.amount = Number(data.amount);
        // Encrypt Account Number
        if (data.accountNumber) {
            data.accountNumber = encrypt(data.accountNumber);
        }
        // PRIORITY & RISK CHECK: If trying to mark as PAID, run the validation
        if (data.status === "PAID" && !req.body.forcePay) {
            const eligibility = await RiskService.validatePayment(estateId, id);
            if (!eligibility.allowed) {
                return res.status(400).json({
                    error: "Payment Blocked by Risk/Priority Rules",
                    details: eligibility
                });
            }
        }
        const liability = await prisma.liability.update({
            where: { id },
            data
        });
        // Log significant status changes
        if (data.status === "PAID") {
            await AuditService.logActivity(estateId, req.user.id, "LIABILITY", "UPDATED", `Paid liability: ${liability.name}`);
        }
        // Return decrypted
        if (liability.accountNumber) {
            liability.accountNumber = decrypt(liability.accountNumber);
        }
        res.json(liability);
    }
    catch (e) {
        if (e instanceof z.ZodError)
            return res.status(400).json({ error: "Validation failed", details: e.errors });
        logger.error("Error updating liability:", e.message);
        res.status(500).json({ error: "Failed to update liability" });
    }
});
// DELETE /api/liabilities/:id - Delete
router.delete("/:id", async (req, res) => {
    try {
        const estateId = await getEstateId(req.user.id);
        if (!estateId)
            return res.status(404).json({ error: "Estate not found" });
        const { id } = req.params;
        await prisma.liability.delete({ where: { id } });
        res.json({ success: true });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
export default router;
