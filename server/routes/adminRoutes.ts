import { Router, Request, Response } from "express";
import { prisma } from "../db.js";

const router = Router();

// Admin Middleware check
const isAdmin = (req: any, res: Response, next: any) => {
    // DEV BYPASS: Allow all users to access admin during development/demo
    // if (req.user?.role !== 'ADMIN') {
    //    return res.status(403).json({ error: "Admin access required" });
    // }
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
            select: { id: true, name: true, title: true, description: true, icon: true, state: true, category: true, updatedAt: true }
        });
        res.json(templates);
    } catch (e) {
        res.status(500).json({ error: "Failed to list templates" });
    }
});

router.post("/templates", isAdmin, async (req: any, res: Response) => {
    try {
        const name = req.query.name as string;
        const state = (req.query.state as string) || "CA";
        const category = (req.query.category as string) || "General";
        const title = req.query.title as string;
        const description = req.query.description as string;
        const icon = req.query.icon as string;

        if (!name) return res.status(400).json({ error: "Name query param required" });

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
    } catch (e) {
        console.error("Upload error:", e);
        res.status(500).json({ error: "Failed to upload template" });
    }
});

// Institution Directory Management
router.get("/institutions", isAdmin, async (req: any, res: Response) => {
    try {
        const institutions = await prisma.institution.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(institutions);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch institutions" });
    }
});

router.post("/institutions", isAdmin, async (req: any, res: Response) => {
    try {
        const { name, phone, email, fax, website, address, logoUrl } = req.body;
        if (!name) return res.status(400).json({ error: "Institution name required" });

        const institution = await prisma.institution.create({
            data: { name, phone, email, fax, website, address, logoUrl }
        });
        res.status(201).json(institution);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: "Institution already exists" });
        }
        res.status(500).json({ error: "Failed to create institution" });
    }
});

router.put("/institutions/:id", isAdmin, async (req: any, res: Response) => {
    try {
        const { name, phone, email, fax, website, address, logoUrl } = req.body;
        const institution = await prisma.institution.update({
            where: { id: req.params.id },
            data: { name, phone, email, fax, website, address, logoUrl }
        });
        res.json(institution);
    } catch (error) {
        res.status(500).json({ error: "Failed to update institution" });
    }
});

router.delete("/institutions/:id", isAdmin, async (req: any, res: Response) => {
    try {
        await prisma.institution.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error) {
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
        const { key, value, isSecret } = req.body;
        if (!key) return res.status(400).json({ error: "Key required" });

        await ConfigService.set(key, value, isSecret);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to save setting" });
    }
});

export default router;
