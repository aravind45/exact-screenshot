import { Router } from "express";
import { prisma } from "../db.js";
import { AuditService } from "../services/auditService.js";
import { CollaborationService } from "../services/collaborationService.js";
const router = Router();
// Middleware to get estateId (assumes user has one estate for now)
const getEstateId = async (req) => {
    const estate = await prisma.estate.findFirst({ where: { userId: req.user.id } });
    return estate?.id;
};
// GET /api/heirs
router.get("/", async (req, res) => {
    try {
        const estateId = await getEstateId(req);
        if (!estateId)
            return res.status(404).json({ error: "Estate not found" });
        const heirs = await prisma.heir.findMany({
            where: { estateId },
            orderBy: { createdAt: 'asc' }
        });
        res.json(heirs);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// POST /api/heirs
router.post("/", async (req, res) => {
    try {
        const estateId = await getEstateId(req);
        if (!estateId)
            return res.status(404).json({ error: "Estate not found" });
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
        await AuditService.logActivity(estateId, req.user.id, 'CONFIGURATION', 'CREATED', `CONFIGURATION – Beneficiary added: ${heir.name} (${heir.relationship})`);
        res.json(heir);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// PUT /api/heirs/:id
router.put("/:id", async (req, res) => {
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
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// DELETE /api/heirs/:id
router.delete("/:id", async (req, res) => {
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
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// Invite an heir to collaborate
router.post("/:id/invite", async (req, res) => {
    try {
        const { id } = req.params;
        const heir = await prisma.heir.findUnique({ where: { id } });
        if (!heir)
            return res.status(404).json({ error: "Heir not found" });
        if (!heir.email)
            return res.status(400).json({ error: "Heir has no email address" });
        // Trigger invitation via CollaborationService
        // Role for heirs is currently VIEW (read-only for their own data)
        const invitation = await CollaborationService.invite(req.user.id, heir.estateId, heir.email, "VIEWER");
        res.json(invitation);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
export const heirRoutes = router;
