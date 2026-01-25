import { Router, Request, Response } from "express";
import { prisma } from "../db.js";

const router = Router();

// Admin Middleware check
const isAdmin = (req: any, res: Response, next: any) => {
    if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({ error: "Admin access required" });
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
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch stats" });
    }
});

router.get("/users", isAdmin, async (req: any, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            include: { _count: { select: { estates: true, communications: true } } }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

// Template Management
router.get("/templates", isAdmin, async (req: any, res: Response) => {
    try {
        const templates = await prisma.formTemplate.findMany({
            select: { id: true, name: true, updatedAt: true }
        });
        res.json(templates);
    } catch (e) {
        res.status(500).json({ error: "Failed to list templates" });
    }
});

router.post("/templates", isAdmin, async (req: any, res: Response) => {
    try {
        const name = req.query.name as string;
        if (!name) return res.status(400).json({ error: "Name query param required" });

        // req.body is Buffer because of express.raw
        if (!req.body || !Buffer.isBuffer(req.body)) {
            return res.status(400).json({ error: "Binary PDF body required" });
        }

        const template = await prisma.formTemplate.upsert({
            where: { name },
            update: { data: req.body },
            create: { name, data: req.body }
        });
        res.json({ success: true, id: template.id });
    } catch (e) {
        console.error("Upload error:", e);
        res.status(500).json({ error: "Failed to upload template" });
    }
});

export default router;
