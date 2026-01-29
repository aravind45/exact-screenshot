import { Router, Response } from "express";
import { prisma } from "../db.js";

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

        res.json({ total, paid, count, openCount });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/liabilities - Create
router.post("/", async (req: any, res: Response) => {
    try {
        const estateId = await getEstateId(req.user.id);
        if (!estateId) return res.status(404).json({ error: "Estate not found" });

        const { name, amount, status, invoiceDate, dueDate, accountNumber, notes, contactPhone, contactEmail, priority } = req.body;

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
                priority: priority || "MEDIUM"
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
