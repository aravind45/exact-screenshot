import { Router, Response } from "express";
import { CollaborationService } from "../services/collaborationService.js";
import { StripeService } from "../services/stripeService.js";
import { prisma } from "../db.js";

const router = Router();

// Create a Stripe checkout session for an extra collaborator seat ($9.99)
router.post("/extra-seat-session", async (req: any, res: Response) => {
    try {
        const { estateId, email, role } = req.body;
        if (!estateId || !email || !role) {
            return res.status(400).json({ error: "Missing required fields: estateId, email, role" });
        }

        const session = await StripeService.createExtraSeatCheckoutSession(
            req.user.id,
            estateId,
            email,
            role
        );

        res.json(session);
    } catch (error: any) {
        console.error("Extra Seat Session Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Send an invitation
router.post("/invitations", async (req: any, res: Response) => {
    try {
        const { estateId, email, role } = req.body;
        if (!estateId || !email || !role) {
            return res.status(400).json({ error: "Missing required fields: estateId, email, role" });
        }

        const invitation = await CollaborationService.invite(req.user.id, estateId, email, role);
        res.status(201).json(invitation);
    } catch (error: any) {
        console.error("Invite Error:", error);
        res.status(500).json({ error: error.message });
    }
});


// Accept an invitation
router.post("/invitations/accept", async (req: any, res: Response) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ error: "Token is required" });

        const grant = await CollaborationService.acceptInvitation(req.user.id, token);
        res.json(grant);
    } catch (error: any) {
        console.error("Accept Invite Error:", error);
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
        res.status(500).json({ error: "Failed to fetch collaborators" });
    }
});

// Delete a pending invitation
router.delete("/invitations/:id", async (req: any, res: Response) => {
    try {
        await CollaborationService.deleteInvitation(req.user.id, req.params.id);
        res.json({ success: true });
    } catch (error: any) {
        console.error("Delete Invite Error:", error);
        res.status(400).json({ error: error.message });
    }
});

export default router;
