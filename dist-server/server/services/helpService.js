import { prisma } from "../db.js";
import { AuditService } from "../services/auditService.js";
export class HelpService {
    /**
     * Log that an executor referenced a specific help topic for defensibility
     */
    static async logHelpReference(estateId, userId, topic) {
        return AuditService.logActivity(estateId, userId, 'HELP_REFERENCED', 'VIEWED', `REFERENCED – Knowledge Base: Reviewed documentation regarding \"${topic}\".`);
    }
    /**
     * Get recommended help topics based on the estate's current roadmap phase
     */
    static async getContextualRecommendations(estateId) {
        const estate = await prisma.estate.findUnique({
            where: { id: estateId },
            include: {
                liabilities: true,
                assets: true,
                estateDocuments: true
            }
        });
        if (!estate)
            return [];
        // Simple heuristic for phase
        const hasPetition = estate.estateDocuments.some(d => d.documentType === 'WILL' || d.documentType === 'SMALL_ESTATE_AFFIDAVIT');
        const hasLetters = estate.estateDocuments.some(d => d.documentType === 'LETTERS_TESTAMENTARY');
        const hasInventory = estate.estateDocuments.some(d => d.documentType === 'INVENTORY' || d.documentType === 'DE-160'); // Assuming some might be labeled DE-160
        const hasCreditors = estate.liabilities.length > 0;
        if (!hasPetition)
            return ["Probate 101", "Small Estate Eligibility", "DE-111 Guide"];
        if (!hasLetters)
            return ["Court Hearings", "Order for Probate", "DE-150 Guide"];
        if (!hasInventory)
            return ["Asset Discovery", "Probate Referee", "DE-160 Guide"];
        if (hasCreditors)
            return ["Creditor Notice", "Paying Debts", "Fiduciary Liability"];
        return ["Final Distribution", "Closing the Estate", "Executor Discharge"];
    }
}
