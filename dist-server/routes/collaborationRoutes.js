import { Router } from "express";
import { CollaborationService } from "../services/collaborationService.js";
import { prisma } from "../db.js";
const router = Router();
// Send an invitation
router.post("/invitations", async (req, res) => {
    try {
        const { estateId, email, role } = req.body;
        if (!estateId || !email || !role) {
            return res.status(400).json({ error: "Missing required fields: estateId, email, role" });
        }
        const invitation = await CollaborationService.invite(req.user.id, estateId, email, role);
        res.status(201).json(invitation);
    }
    catch (error) {
        console.error("Invite Error:", error);
        res.status(500).json({ error: error.message });
    }
});
// Accept an invitation
router.post("/invitations/accept", async (req, res) => {
    try {
        const { token } = req.body;
        if (!token)
            return res.status(400).json({ error: "Token is required" });
        const grant = await CollaborationService.acceptInvitation(req.user.id, token);
        res.json(grant);
    }
    catch (error) {
        console.error("Accept Invite Error:", error);
        res.status(400).json({ error: error.message });
    }
});
// Get estates I have access to (both owned and granted)
router.get("/my-estates", async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch estates" });
    }
});
// Get collaborators for an estate
router.get("/:estateId/collaborators", async (req, res) => {
    try {
        const grants = await prisma.estateGrant.findMany({
            where: { estateId: req.params.estateId },
            include: { user: { select: { id: true, fullName: true, email: true } } }
        });
        const invitations = await prisma.invitation.findMany({
            where: { estateId: req.params.estateId, status: 'PENDING' }
        });
        res.json({ grants, invitations });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch collaborators" });
    }
});
export default router;
