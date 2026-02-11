import { Router, Response } from "express";
import { CollaborationService } from "../services/collaborationService.js";
import { StripeService } from "../services/stripeService.js";
import { prisma } from "../db.js";
import { z } from "zod";
import { logger } from "../lib/logger.js";

const invitationSchema = z.object({
    estateId: z.string().min(1),
    email: z.string().email(),
    role: z.enum(["VIEWER", "EDITOR", "ADMIN"])
});

const acceptInviteSchema = z.object({
    token: z.string().min(1)
});

const router = Router();

// Create a Stripe checkout session for an extra collaborator seat ($9.99)
router.post("/extra-seat-session", async (req: any, res: Response) => {
    try {
        const validated = invitationSchema.parse(req.body);
        const { estateId, email, role } = validated;

        const session = await StripeService.createExtraSeatCheckoutSession(
            req.user.id,
            estateId,
            email,
            role
        );

        res.json(session);
    } catch (error: any) {
        if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid seat session request", details: error.errors });
        logger.error("Extra Seat Session Error:", error.message);
        res.status(500).json({ error: "Failed to create seat session" });
    }
});

// Send an invitation
router.post("/invitations", async (req: any, res: Response) => {
    try {
        const validated = invitationSchema.parse(req.body);
        const { estateId, email, role } = validated;

        const invitation = await CollaborationService.invite(req.user.id, estateId, email, role);
        res.status(201).json(invitation);
    } catch (error: any) {
        if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid invitation request", details: error.errors });
        logger.error("Invite Error:", error.message);
        res.status(500).json({ error: "Failed to send invitation" });
    }
});


// Accept an invitation
router.post("/invitations/accept", async (req: any, res: Response) => {
    try {
        const validated = acceptInviteSchema.parse(req.body);
        const { token } = validated;

        const grant = await CollaborationService.acceptInvitation(req.user.id, token);
        res.json(grant);
    } catch (error: any) {
        if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid accept request", details: error.errors });
        logger.error("Accept Invite Error:", error.message);
        res.status(400).json({ error: error.message });
    }
});

// Get estates I have access to (both owned and granted)
router.get("/my-estates", async (req: any, res: Response) => {
    try {
        const owned = await prisma.estate.findMany({
            where: { userId: req.user.id },
            include: { user: true }
        });

        const shared = await CollaborationService.getSharedEstates(req.user.id);

        const allEstates = [
            ...owned.map(e => ({ ...e, userRole: 'OWNER', isOwner: true })),
            ...shared
        ];

        res.json(allEstates);
    } catch (error: any) {
        logger.error("Failed to fetch my estates:", error.message);
        res.status(500).json({ error: "Failed to fetch estates" });
    }
});

// Get collaborators for an estate
router.get("/:estateId/collaborators", async (req: any, res: Response) => {
    try {
        const grants = await prisma.estateGrant.findMany({
            where: { estateId: req.params.estateId },
            include: { user: { select: { id: true, fullName: true, email: true } } }
        });

        const invitations = await prisma.invitation.findMany({
            where: { estateId: req.params.estateId, status: 'PENDING' }
        });

        res.json({ grants, invitations });
    } catch (error: any) {
        logger.error("Failed to fetch collaborators:", error.message);
        res.status(500).json({ error: "Failed to fetch collaborators" });
    }
});

// Delete a pending invitation
router.delete("/invitations/:id", async (req: any, res: Response) => {
    try {
        await CollaborationService.deleteInvitation(req.user.id, req.params.id);
        res.json({ success: true });
    } catch (error: any) {
        logger.error("Delete Invite Error:", error.message);
        res.status(400).json({ error: error.message });
    }
});

export default router;
