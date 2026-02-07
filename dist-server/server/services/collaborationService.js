import { prisma } from "../db.js";
import { EmailService } from "./emailService.js";
import crypto from "crypto";
export const CollaborationService = {
    /**
     * Invite a user to collaborate on an estate
     */
    async invite(inviterId, estateId, email, role) {
        // 1. Verify estate ownership (only owners/attorneys can invite)
        const estate = await prisma.estate.findUnique({
            where: { id: estateId },
            include: { grants: true }
        });
        if (!estate)
            throw new Error("Estate not found");
        const isOwner = estate.userId === inviterId;
        const hasAdminGrant = estate.grants.some(g => g.userId === inviterId && (g.role === 'OWNER' || g.role === 'ATTORNEY'));
        if (!isOwner && !hasAdminGrant) {
            throw new Error("You do not have permission to invite collaborators to this estate.");
        }
        // 1b. Check collaborator limit (5 free seats)
        const currentGrants = await prisma.estateGrant.count({
            where: { estateId }
        });
        const pendingInvites = await prisma.invitation.count({
            where: { estateId, status: 'PENDING' }
        });
        const totalCollaborators = currentGrants + pendingInvites;
        if (totalCollaborators >= 5) {
            return { limitExceeded: true, currentCount: totalCollaborators };
        }
        // 2. Generate token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry
        // 3. Create invitation
        const invitation = await prisma.invitation.create({
            data: {
                estateId,
                email: email.toLowerCase(),
                role,
                token,
                invitedBy: inviterId,
                expiresAt
            }
        });
        // 4. Send email (optional - if it fails, we still have the invitation in the system)
        try {
            await EmailService.sendInviteEmail(email, {
                inviterName: (await prisma.user.findUnique({ where: { id: inviterId } }))?.fullName || "A user",
                estateName: estate.name,
                token
            });
        }
        catch (emailError) {
            console.error("Failed to send invitation email:", emailError);
            // We don't throw here so the 201 response can still be sent
            return {
                ...invitation,
                emailSent: false,
                emailError: "Invitation created, but email could not be sent. Please share the link manually."
            };
        }
        return { ...invitation, emailSent: true };
    },
    /**
     * Accept an invitation
     */
    async acceptInvitation(userId, token) {
        const invitation = await prisma.invitation.findUnique({
            where: { token },
            include: { estate: true }
        });
        if (!invitation)
            throw new Error("Invalid or expired invitation token.");
        if (invitation.status !== 'PENDING')
            throw new Error("Invitation has already been " + invitation.status.toLowerCase());
        if (new Date() > invitation.expiresAt) {
            await prisma.invitation.update({ where: { id: invitation.id }, data: { status: 'EXPIRED' } });
            throw new Error("Invitation has expired.");
        }
        return await prisma.$transaction(async (tx) => {
            // 1. Create Grant
            const grant = await tx.estateGrant.create({
                data: {
                    estateId: invitation.estateId,
                    userId,
                    role: invitation.role
                }
            });
            // 2. Update Invitation status
            await tx.invitation.update({
                where: { id: invitation.id },
                data: {
                    status: 'ACCEPTED',
                    acceptedAt: new Date()
                }
            });
            // 3. Log Activity
            await tx.settlementActivity.create({
                data: {
                    estateId: invitation.estateId,
                    userId,
                    type: 'SYSTEM',
                    action: 'JOINED',
                    notes: `User joined as ${invitation.role}`
                }
            });
            return grant;
        });
    },
    /**
     * Get all estates shared with a user
     */
    async getSharedEstates(userId) {
        const grants = await prisma.estateGrant.findMany({
            where: { userId },
            include: {
                estate: {
                    include: {
                        user: {
                            select: { fullName: true, email: true }
                        }
                    }
                }
            }
        });
        return grants.map(g => ({
            ...g.estate,
            userRole: g.role,
            isOwner: false
        }));
    }
};
