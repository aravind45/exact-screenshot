import { PrismaClient } from '@prisma/client';
import { ai } from './ai.js';
const prisma = new PrismaClient();
export const DISCOVERY_CATEGORIES = [
    { id: 'BANK_ACCOUNTS', label: 'Bank Accounts', examples: 'Checking, Savings' },
    { id: 'INVESTMENTS', label: 'Investment Accounts', examples: 'Brokerage, IRA, 401(k)' },
    { id: 'EMPLOYER_BENEFITS', label: 'Employer Benefits', examples: 'Life Insurance, Stock Plans, Final Pay' },
    { id: 'REAL_PROPERTY', label: 'Real Property', examples: 'Primary Residence, Rental, Vacant Land' },
    { id: 'SAFE_DEPOSIT', label: 'Safe Deposit Boxes', examples: 'Bank-held valuables' },
    { id: 'DIGITAL_ASSETS', label: 'Digital Assets', examples: 'Crypto, PayPal, Venmo, Social Media' },
    { id: 'UNCLAIMED_PROPERTY', label: 'Unclaimed Property', examples: 'State registry search' },
    { id: 'PERSONAL_PROPERTY', label: 'Vehicles & Personal Property', examples: 'Cars, Jewelry, Art' },
];
export class DiscoveryService {
    /**
     * Initialize discovery categories for an estate if they don't exist
     */
    static async initializeCategories(estateId) {
        const existing = await prisma.discoveryCategory.findMany({
            where: { estateId }
        });
        if (existing.length === 0) {
            const data = DISCOVERY_CATEGORIES.map(cat => ({
                estateId,
                category: cat.id,
                status: 'NOT_CHECKED'
            }));
            await prisma.discoveryCategory.createMany({
                data
            });
        }
        return prisma.discoveryCategory.findMany({
            where: { estateId },
            include: { negativeFindings: true }
        });
    }
    static async updateCategoryStatus(id, userId, status, evidenceSource) {
        return prisma.$transaction(async (tx) => {
            const updated = await tx.discoveryCategory.update({
                where: { id },
                data: {
                    status,
                    evidenceSource,
                    reviewDate: new Date()
                }
            });
            // Log activity
            const catInfo = DISCOVERY_CATEGORIES.find(c => c.id === updated.category);
            const statusLabel = status === 'REVIEWED' ? 'Assets Found' : status === 'NOT_FOUND' ? 'No Assets Found' : status.replace('_', ' ');
            await tx.settlementActivity.create({
                data: {
                    estateId: updated.estateId,
                    userId,
                    type: 'DISCOVERY',
                    action: 'REVIEWED',
                    notes: `REVIEWED – ${catInfo?.label || updated.category}: ${statusLabel}.`
                }
            });
            // Check for phase completion
            const allCats = await tx.discoveryCategory.findMany({
                where: { estateId: updated.estateId }
            });
            const completed = allCats.filter(c => c.status !== 'NOT_CHECKED').length;
            if (completed === allCats.length) {
                await tx.settlementActivity.create({
                    data: {
                        estateId: updated.estateId,
                        userId,
                        type: 'DISCOVERY',
                        action: 'COMPLETED',
                        notes: `COMPLETED – Asset discovery phase completed with systematic review of all categories.`
                    }
                });
            }
            return updated;
        });
    }
    static async addNegativeAssurance(discoveryCategoryId, userId, statement) {
        return prisma.$transaction(async (tx) => {
            const log = await tx.negativeAssurance.create({
                data: {
                    discoveryCategoryId,
                    statement
                },
                include: { category: true }
            });
            const catInfo = DISCOVERY_CATEGORIES.find(c => c.id === log.category.category);
            await tx.settlementActivity.create({
                data: {
                    estateId: log.category.estateId,
                    userId,
                    type: 'DISCOVERY',
                    action: 'NEGATIVE_FINDING',
                    notes: `RECORDED – Negative finding for ${catInfo?.label || log.category.category}: "${statement}"`
                }
            });
            return log;
        });
    }
    static async getDiscoveryStatus(estateId) {
        const categories = await prisma.discoveryCategory.findMany({
            where: { estateId },
            include: { negativeFindings: true }
        });
        const total = categories.length;
        const completed = categories.filter(c => c.status !== 'NOT_CHECKED').length;
        const isComplete = completed === total;
        return {
            categories,
            progress: {
                total,
                completed,
                percentage: Math.round((completed / total) * 100),
                isComplete
            }
        };
    }
    /**
     * Analyze uploaded document for assets using Real AI
     */
    static async analyzeDocument({ text, imageBase64, estateId }) {
        console.log(`[DiscoveryService] Starting analysis. Text length: ${text?.length || 0}, Image: ${!!imageBase64}, Estate: ${estateId}`);
        if (!text && !imageBase64) {
            console.log(`[DiscoveryService] No content provided`);
            return { findings: [], summary: "No content extracted from document." };
        }
        try {
            console.log(`[DiscoveryService] Calling ai.discoverRelatedAssets...`);
            const clues = await ai.discoverRelatedAssets(text, imageBase64);
            console.log(`[DiscoveryService] AI returned ${clues.length} clues`);
            const findings = clues.map(clue => {
                let category = 'INVESTMENTS';
                const lowerAsset = (clue.potentialAsset || '').toLowerCase();
                const lowerInst = (clue.institution || '').toLowerCase();
                if (lowerAsset.includes('check') || lowerAsset.includes('saving') || lowerInst.includes('bank'))
                    category = 'BANK_ACCOUNTS';
                else if (lowerAsset.includes('insurance') || lowerInst.includes('life'))
                    category = 'EMPLOYER_BENEFITS';
                else if (lowerAsset.includes('crypto') || lowerInst.includes('coinbase') || lowerInst.includes('binance'))
                    category = 'DIGITAL_ASSETS';
                else if (lowerAsset.includes('brokerage') || lowerAsset.includes('investment') || lowerInst.includes('robinhood') || lowerInst.includes('fidelity') || lowerInst.includes('vanguard'))
                    category = 'INVESTMENTS';
                return {
                    confidence: clue.confidence,
                    category,
                    asset: {
                        name: `${clue.institution} ${clue.potentialAsset}`,
                        institution: clue.institution,
                        assetType: clue.potentialAsset,
                        value: 0,
                    },
                    sourceText: clue.sourceClue,
                    suggestedAction: `Verify ${clue.institution} holdings`
                };
            });
            // PERSISTENCE: Save clues to the estate's discovery trail
            if (estateId && findings.length > 0) {
                console.log(`[DiscoveryService] Persisting findings for estate ${estateId}`);
                const estate = await prisma.estate.findUnique({ where: { id: estateId } });
                if (estate) {
                    await prisma.estateDocument.create({
                        data: {
                            estateId,
                            userId: estate.userId,
                            documentType: 'DISCOVERY_SCAN',
                            name: `Scan - ${new Date().toLocaleDateString()}`,
                            status: 'OBTAINED',
                            clues: clues // Store raw AI clues for future correlation
                        }
                    });
                }
            }
            return {
                findings,
                summary: `${findings.length} potential assets identified by AI analysis.`
            };
        }
        catch (error) {
            console.error("[DiscoveryService] AI Analysis Error:", error);
            throw error;
        }
    }
}
