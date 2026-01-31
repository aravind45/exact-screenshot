import { Router, Response } from "express";
import { prisma } from "../db.js";
import { PriorityService } from "../services/priorityService.js";

const router = Router();

// Middleware to get estateId for the current user
const getEstateId = async (userId: string) => {
    const grant = await prisma.estateGrant.findFirst({
        where: { userId },
        include: { estate: true }
    });
    return grant?.estateId || (await prisma.estate.findFirst({ where: { userId } }))?.id;
};

// GET /api/liabilities - List all
router.get("/", async (req: any, res: Response) => {
    try {
        const estateId = await getEstateId(req.user.id);
        if (!estateId) return res.status(404).json({ error: "Estate not found" });

        const liabilities = await prisma.liability.findMany({
            where: { estateId },
            orderBy: { createdAt: "desc" }
        });
        res.json(liabilities);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/liabilities/priority-options - Get state-specific options
router.get("/priority-options", async (req: any, res: Response) => {
    try {
        const estateId = await getEstateId(req.user.id);
        if (!estateId) return res.status(404).json({ error: "Estate not found" });

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
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/liabilities/stats - Summary stats
router.get("/stats", async (req: any, res: Response) => {
    try {
        const estateId = await getEstateId(req.user.id);
        if (!estateId) return res.status(404).json({ error: "Estate not found" });

        const liabilities = await prisma.liability.findMany({ where: { estateId } });

        const total = liabilities.reduce((sum, l) => sum + Number(l.amount), 0);
        const paid = liabilities.filter(l => l.status === "PAID")
            .reduce((sum, l) => sum + Number(l.amount), 0);
        const count = liabilities.length;
        const openCount = liabilities.filter(l => l.status !== "PAID").length;

        // Priority breakdown
        const priorityBreakdown: Record<string, { total: number, paid: number }> = {};
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
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// GET /api/liabilities/solvency - Asset vs Debt comparison
router.get("/solvency", async (req: any, res: Response) => {
    try {
        const estateId = await getEstateId(req.user.id);
        const estate = await prisma.estate.findUnique({
            where: { id: estateId },
            select: { authorityType: true }
        });

        const liabilities = await prisma.liability.findMany({ where: { estateId } });

        // Filter assets based on Authority Type
        // Probate/Small Estate -> Individual assets
        // Trust Admin -> Trust assets
        const assetFilter: any = {
            estateId,
            assetType: { in: ["checking", "savings", "cash", "brokerage", "monetary"] }
        };

        if (estate?.authorityType === "TRUST_ADMIN") {
            assetFilter.ownershipType = "TRUST";
        } else {
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

        res.json({
            totalDebt,
            totalLiquidAssets,
            isSolvent,
            ratio: Math.min(ratio, 2), // Cap ratio display for UI
            countLiquidAssets: assets.length,
            authorityType: estate?.authorityType || "UNKNOWN"
        });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/liabilities - Create
router.post("/", async (req: any, res: Response) => {
    try {
        const estateId = await getEstateId(req.user.id);
        if (!estateId) return res.status(404).json({ error: "Estate not found" });

        const { name, amount, status, invoiceDate, dueDate, accountNumber, notes, contactPhone, contactEmail, priority, priorityClass } = req.body;

        const liability = await prisma.liability.create({
            data: {
                estateId,
                name,
                amount: Number(amount),
                status: status || "DISCOVERED",
                invoiceDate: invoiceDate ? new Date(invoiceDate) : null,
                dueDate: dueDate ? new Date(dueDate) : null,
                accountNumber,
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

        res.json(liability);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// PUT /api/liabilities/:id - Update
router.put("/:id", async (req: any, res: Response) => {
    try {
        const estateId = await getEstateId(req.user.id);
        if (!estateId) return res.status(404).json({ error: "Estate not found" });

        const { id } = req.params;
        const data = req.body;

        // Convert dates if present
        if (data.invoiceDate) data.invoiceDate = new Date(data.invoiceDate);
        if (data.dueDate) data.dueDate = new Date(data.dueDate);
        if (data.amount) data.amount = Number(data.amount);

        // PRIORITY CHECK: If trying to mark as PAID, run the validation
        if (data.status === "PAID" && !data.forcePay) {
            const eligibility = await PriorityService.checkPaymentEligibility(estateId, id);
            if (!eligibility.allowed) {
                return res.status(400).json({
                    error: "Payment Blocked by Priority Rules",
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
            await prisma.settlementActivity.create({
                data: {
                    estateId,
                    userId: req.user.id,
                    action: "UPDATED",
                    type: "LIABILITY",
                    notes: `Paid liability: ${liability.name}`
                }
            });
        }

        res.json(liability);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// DELETE /api/liabilities/:id - Delete
router.delete("/:id", async (req: any, res: Response) => {
    try {
        const estateId = await getEstateId(req.user.id);
        if (!estateId) return res.status(404).json({ error: "Estate not found" });

        const { id } = req.params;
        await prisma.liability.delete({ where: { id } });

        res.json({ success: true });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
