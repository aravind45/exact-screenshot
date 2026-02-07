import { prisma } from "../db.js";
import { EmailService } from "./emailService.js";
import crypto from "crypto";

export const CollaborationService = {
    /**
     * Invite a user to collaborate on an estate
     */
    async invite(inviterId: string, estateId: string, email: string, role: string) {
        const normalizedEmail = email.toLowerCase();

        // 1. Verify estate ownership (only owners/attorneys can invite)
        const estate = await prisma.estate.findUnique({
            where: { id: estateId },
            include: { grants: true }
        });

        if (!estate) throw new Error("Estate not found");

        const isOwner = estate.userId === inviterId;
        const hasAdminGrant = estate.grants.some(g => g.userId === inviterId && (g.role === 'OWNER' || g.role === 'ATTORNEY'));

        if (!isOwner && !hasAdminGrant) {
            throw new Error("You do not have permission to invite collaborators to this estate.");
        }

        // 2. Check for existing PENDING invitation for this exact email/estate
        // This prevents duplicate seats being consumed by the same person
        const existingPending = await prisma.invitation.findFirst({
            where: {
                estateId,
                email: normalizedEmail,
                status: 'PENDING'
            }
        });

        if (existingPending) {
            console.log(`[CollaborationService] Found existing pending invite for ${normalizedEmail}. Resending...`);
            // Update expiry and resend email
            const newExpiresAt = new Date();
            newExpiresAt.setDate(newExpiresAt.getDate() + 7);

            const updatedInvitation = await prisma.invitation.update({
                where: { id: existingPending.id },
                data: {
                    role, // Allow updating role on resend
                    expiresAt: newExpiresAt,
                    invitedBy: inviterId
                }
            });

            try {
                await EmailService.sendInviteEmail(normalizedEmail, {
                    inviterName: (await prisma.user.findUnique({ where: { id: inviterId } }))?.fullName || "A user",
                    estateName: estate.name,
                    token: updatedInvitation.token
                });
                return { ...updatedInvitation, emailSent: true, reused: true };
            } catch (emailError) {
                console.error("Failed to resend invitation email:", emailError);
                return {
                    ...updatedInvitation,
                    emailSent: false,
                    emailError: emailError instanceof Error ? emailError.message : "Email could not be sent. Please share the link manually.",
                    reused: true
                };
            }
        }

        // 3. Check collaborator limit (5 free seats)
        const currentGrants = await prisma.estateGrant.count({
            where: { estateId }
        });
        const pendingInvites = await prisma.invitation.count({
            where: { estateId, status: 'PENDING' }
        });
        const totalCollaborators = currentGrants + pendingInvites;

        if (totalCollaborators >= 5) {
            console.log(`[CollaborationService] Limit reached for estate ${estateId}: ${totalCollaborators}/5`);
            return { limitExceeded: true, currentCount: totalCollaborators };
        }

        // 4. Generate token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

        // 5. Create invitation
        const invitation = await prisma.invitation.create({
            data: {
                estateId,
                email: normalizedEmail,
                role,
                token,
                invitedBy: inviterId,
                expiresAt
            }
        });

        // 6. Send email
        try {
            await EmailService.sendInviteEmail(normalizedEmail, {
                inviterName: (await prisma.user.findUnique({ where: { id: inviterId } }))?.fullName || "A user",
                estateName: estate.name,
                token
            });
        } catch (emailError) {
            console.error("Failed to send invitation email:", emailError);
            return {
                ...invitation,
                emailSent: false,
                emailError: emailError instanceof Error ? emailError.message : "Invitation created, but email could not be sent. Please share the link manually."
            };
        }

        return { ...invitation, emailSent: true };
    },

    /**
     * Accept an invitation
     */
    async acceptInvitation(userId: string, token: string) {
        const invitation = await prisma.invitation.findUnique({
            where: { token },
            include: { estate: true }
        });

        if (!invitation) throw new Error("Invalid or expired invitation token.");
        if (invitation.status !== 'PENDING') throw new Error("Invitation has already been " + invitation.status.toLowerCase());
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

            // 3. Link Heir record if it exists
            const matchingHeir = await tx.heir.findFirst({
                where: {
                    estateId: invitation.estateId,
                    email: invitation.email
                }
            });

            if (matchingHeir) {
                await tx.heir.update({
                    where: { id: matchingHeir.id },
                    data: { user: { connect: { id: userId } } }
                });
            }

            // 4. Log Activity
            await tx.settlementActivity.create({
                data: {
                    estateId: invitation.estateId,
                    userId,
                    type: 'SYSTEM',
                    action: 'JOINED',
                    notes: `User joined as ${invitation.role}${matchingHeir ? ' (Linked to Beneficiary record)' : ''}`
                }
            });

            return grant;
        });
    },

    /**
     * Get all estates shared with a user
     */
    async getSharedEstates(userId: string) {
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
    },

    /**
     * Delete a pending invitation
     */
    async deleteInvitation(userId: string, invitationId: string) {
        const invitation = await prisma.invitation.findUnique({
            where: { id: invitationId },
            include: { estate: { include: { grants: true } } }
        });

        if (!invitation) throw new Error("Invitation not found");

        const isOwner = invitation.estate.userId === userId;
        const hasAdminGrant = invitation.estate.grants.some(g => g.userId === userId && (g.role === 'OWNER' || g.role === 'ATTORNEY'));

        if (!isOwner && !hasAdminGrant && invitation.invitedBy !== userId) {
            throw new Error("You do not have permission to delete this invitation.");
        }

        return await prisma.invitation.delete({
            where: { id: invitationId }
        });
    }
};
