import { prisma } from "../db.js";

export class HelpService {
    /**
     * Log that an executor referenced a specific help topic for defensibility
     */
    static async logHelpReference(estateId: string, userId: string, topic: string) {
        return prisma.settlementActivity.create({
            data: {
                estateId,
                userId,
                type: 'HELP_REFERENCED',
                action: 'VIEWED',
                notes: `REFERENCED – Knowledge Base: Reviewed documentation regarding \"${topic}\".`
            }
        });
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
}
