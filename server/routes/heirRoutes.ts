import { Router, Response } from "express";
import { prisma } from "../db.js";
import { AuditService } from "../services/auditService.js";
import { CollaborationService } from "../services/collaborationService.js";
import { z } from "zod";
import { logger } from "../lib/logger.js";
import { requireSubscription } from "../middleware/subscription.js";
import { requireWriteAccess } from "../middleware/writeProtection.js";

const heirSchema = z.object({
    name: z.string().min(1),
    relationship: z.string().min(1),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional(),
    address: z.string().optional(),
    isAdult: z.boolean().optional()
});

const router = Router();
router.use(requireSubscription);

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

        // Get invitations for this estate to match with heirs
        const invitations = await prisma.invitation.findMany({
            where: { estateId, status: 'PENDING' }
        });

        const heirsWithStatus = heirs.map(heir => {
            const pendingInvite = heir.email ? invitations.find(i => i.email.toLowerCase() === heir.email?.toLowerCase()) : null;
            return {
                ...heir,
                hasPendingInvite: !!pendingInvite,
                pendingInviteToken: pendingInvite?.token
            };
        });

        res.json(heirsWithStatus);
    } catch (e: any) {
        logger.error("Error fetching heirs:", e.message);
        res.status(500).json({ error: "Failed to fetch heirs" });
    }
});

// POST /api/heirs
router.post("/", requireWriteAccess, async (req: any, res: Response) => {
    try {
        const estateId = await getEstateId(req);
        if (!estateId) return res.status(404).json({ error: "Estate not found" });

        const validated = heirSchema.parse(req.body);
        const { name, relationship, email, phone, address, isAdult } = validated;

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
        await AuditService.logActivity(
            estateId,
            req.user.id,
            'CONFIGURATION',
            'CREATED',
            `CONFIGURATION – Beneficiary added: ${heir.name} (${heir.relationship})`
        );

        res.json(heir);
    } catch (e: any) {
        if (e instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", details: e.errors });
        logger.error("Error creating heir:", e.message);
        res.status(500).json({ error: "Failed to create heir" });
    }
});

// PUT /api/heirs/:id
router.put("/:id", requireWriteAccess, async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const validated = heirSchema.partial().parse(req.body);

        const heir = await prisma.heir.update({
            where: { id },
            data: validated
        });
        res.json(heir);
    } catch (e: any) {
        if (e instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", details: e.errors });
        logger.error("Error updating heir:", e.message);
        res.status(500).json({ error: "Failed to update heir" });
    }
});

// DELETE /api/heirs/:id
router.delete("/:id", requireWriteAccess, async (req: any, res: Response) => {
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

// Invite an heir to collaborate
router.post("/:id/invite", requireWriteAccess, async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const heir = await prisma.heir.findUnique({ where: { id } });

        if (!heir) return res.status(404).json({ error: "Heir not found" });
        if (!heir.email) return res.status(400).json({ error: "Heir has no email address" });

        // Trigger invitation via CollaborationService
        // Role for heirs is currently VIEW (read-only for their own data)
        const invitation = await CollaborationService.invite(req.user.id, heir.estateId, heir.email, "VIEWER");

        res.json(invitation);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

export const heirRoutes = router;
