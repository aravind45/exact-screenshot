import { Router, Response } from "express";
import { prisma } from "../db.js";

const router = Router();

// Middleware to get estateId (assumes user has one estate for now)
const getEstateId = async (req: any) => {
    const estate = await prisma.estate.findFirst({ where: { userId: req.user.id } });
    return estate?.id;
};

// GET /api/heirs
router.get("/", async (req: any, res: Response) => {
    try {
        const estateId = await getEstateId(req);
        if (!estateId) return res.status(404).json({ error: "Estate not found" });

        const heirs = await prisma.heir.findMany({
            where: { estateId },
            orderBy: { createdAt: 'asc' }
        });
        res.json(heirs);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// POST /api/heirs
router.post("/", async (req: any, res: Response) => {
    try {
        const estateId = await getEstateId(req);
        if (!estateId) return res.status(404).json({ error: "Estate not found" });

        const { name, relationship, email, phone, address, isAdult } = req.body;

        const heir = await prisma.heir.create({
            data: {
                estateId,
                name,
                relationship,
                email,
                phone,
                address,
                isAdult: isAdult !== undefined ? isAdult : true
            }
        });

        // Log Configuration Activity
        await prisma.settlementActivity.create({
            data: {
                estateId,
                userId: req.user.id,
                type: 'CONFIGURATION',
                action: 'CREATED',
                notes: `CONFIGURATION – Beneficiary added: ${name} (${relationship})`
            }
        });

        res.json(heir);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// PUT /api/heirs/:id
router.put("/:id", async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const { name, relationship, email, phone, address, isAdult } = req.body;

        const heir = await prisma.heir.update({
            where: { id },
            data: {
                name,
                relationship,
                email,
                phone,
                address,
                isAdult
            }
        });
        res.json(heir);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// DELETE /api/heirs/:id
router.delete("/:id", async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const deleted = await prisma.heir.delete({ where: { id } });

        // Log Configuration Activity
        const estateId = await getEstateId(req);
        if (estateId) {
            await prisma.settlementActivity.create({
                data: {
                    estateId,
                    userId: req.user.id,
                    type: 'CONFIGURATION',
                    action: 'DELETED',
                    notes: `CONFIGURATION – Beneficiary removed: ${deleted.name}`
                }
            });
        }

        res.json({ success: true });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export const heirRoutes = router;
