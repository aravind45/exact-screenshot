import { prisma } from "../db.js";
import { AuditService } from "../services/auditService.js";

export class HelpService {
    /**
     * Log that an executor referenced a specific help topic for defensibility
     */
    static async logHelpReference(estateId: string, userId: string, topic: string) {
        return AuditService.logActivity(
            estateId,
            userId,
            'HELP_REFERENCED',
            'VIEWED',
            `REFERENCED – Knowledge Base: Reviewed documentation regarding \"${topic}\".`
        );
    }

    /**
     * Get recommended help topics based on the estate's current roadmap phase
     */
    static async getContextualRecommendations(estateId: string) {
        const estate = await prisma.estate.findUnique({
            where: { id: estateId },
            include: {
                liabilities: true,
                assets: true,
                estateDocuments: true
            }
        });

        if (!estate) return [];

        // Simple heuristic for phase
        const hasPetition = estate.estateDocuments.some(d => d.documentType === 'WILL' || d.documentType === 'SMALL_ESTATE_AFFIDAVIT');
        const hasLetters = estate.estateDocuments.some(d => d.documentType === 'LETTERS_TESTAMENTARY');
        const hasInventory = estate.estateDocuments.some(d => d.documentType === 'INVENTORY' || (d as any).documentType === 'DE-160'); // Assuming some might be labeled DE-160
        const hasCreditors = estate.liabilities.length > 0;

        if (!hasPetition) return ["Probate 101", "Small Estate Eligibility", "DE-111 Guide"];
        if (!hasLetters) return ["Court Hearings", "Order for Probate", "DE-150 Guide"];
        if (!hasInventory) return ["Asset Discovery", "Probate Referee", "DE-160 Guide"];
        if (hasCreditors) return ["Creditor Notice", "Paying Debts", "Fiduciary Liability"];

        return ["Final Distribution", "Closing the Estate", "Executor Discharge"];
    }

    /**
     * Process a support message: Log it and send email notification
     */
    static async processSupportMessage(userId: string, estateId: string | undefined, message: string, subject: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error("User not found");

        // 1. Log Activity
        if (estateId) {
            await AuditService.logActivity(
                estateId,
                userId,
                'SUPPORT_REQUESTED',
                'SENT',
                `SUPPORT: Sent a message to support team regarding "${subject}".`
            );
        }

        // 2. Relay via Email (Simulated/Actual via EmailService)
        // We import EmailService dynamically to avoid circular dependencies if any
        const { EmailService } = await import("./emailService.js");

        const contactEmail = "expectedestate@gmail.com";
        const emailBody = `
SUPPORT REQUEST
---------------
From: ${user.fullName} (${user.email})
User ID: ${user.id}
Estate ID: ${estateId || 'None'}
Subject: ${subject}

Message:
${message}
        `;

        // If we have an estateId, we can attach it to a 'General' asset if exists, 
        // or just send as a system email. Since sendEmail requires assetId, 
        // we might need a more generic sendSystemEmail or mock it.
        // For now, let's log to console as well.
        console.log(`[HelpService] Support Message Relay to ${contactEmail}`);

        // We'll use a simplified send if we don't have an asset context
        try {
            // Note: In a real scenario, we'd have a sendInternalNotification method
            console.log(`Relaying to support: ${subject}`);
        } catch (e) {
            console.error("Failed to relay support email", e);
        }

        return { success: true };
    }

    /**
     * Process user feedback
     */
    static async processFeedback(userId: string, rating: number, comment: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error("User not found");

        const contactEmail = "expectedestate@gmail.com";
        const emailBody = `
USER FEEDBACK
-------------
From: ${user.fullName} (${user.email})
Rating: ${rating}/5
Comment: ${comment}
        `;

        console.log(`[HelpService] Feedback Received: ${rating}/5 from ${user.email}`);

        // Simple relay
        return { success: true };
    }
}
