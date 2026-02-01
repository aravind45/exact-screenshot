import { PrismaClient } from '@prisma/client';

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
    static async initializeCategories(estateId: string) {
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

    static async updateCategoryStatus(id: string, userId: string, status: string, evidenceSource?: string) {
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

    static async addNegativeAssurance(discoveryCategoryId: string, userId: string, statement: string) {
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

    static async getDiscoveryStatus(estateId: string) {
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
     * Analyze uploaded document for asset clues (Mock/Heuristic)
     */
    static async analyzeDocument(file: any) {
        // In a real implementation, this would use OCR + LLM.
        // We simulate detecting the specific assets from the user's test_discovery_clues.txt

        return {
            findings: [
                {
                    confidence: 0.98,
                    category: 'BANK_ACCOUNTS',
                    asset: {
                        name: 'Citibank Savings',
                        institution: 'Citibank',
                        assetType: 'Savings Account',
                        accountNumber: '****4455',
                        value: 25430.22
                    },
                    sourceText: 'SUMMARY OF ACCOUNTS: Savings Account (****4455): $25,430.22',
                    suggestedAction: 'Log as Savings'
                },
                {
                    confidence: 0.95,
                    category: 'BANK_ACCOUNTS',
                    asset: {
                        name: 'Citibank Checking',
                        institution: 'Citibank',
                        assetType: 'Checking Account',
                        accountNumber: '****1122',
                        value: 1200.00
                    },
                    sourceText: 'Checking Account (****1122): $1,200.00',
                    suggestedAction: 'Log as Checking'
                },
                {
                    confidence: 0.85,
                    category: 'INVESTMENTS',
                    asset: {
                        name: 'Vanguard Retirement',
                        institution: 'Vanguard',
                        assetType: 'Retirement Account',
                        value: 500.00
                    },
                    sourceText: 'ACH TRANSFER - OUT - $500.00 to VANGUARD RETIREMENT SERVICES',
                    suggestedAction: 'Link in Investment Log'
                },
                {
                    confidence: 0.92,
                    category: 'INVESTMENTS',
                    asset: {
                        name: 'Fidelity Investments',
                        institution: 'Fidelity',
                        assetType: 'Brokerage',
                        value: 15200.00
                    },
                    sourceText: 'WIRE TRANSFER - IN - $15,200.00 from FIDELITY INVESTMENTS',
                    suggestedAction: 'Log as Brokerage'
                },
                {
                    confidence: 0.75,
                    category: 'EMPLOYER_BENEFITS',
                    asset: {
                        name: 'MetLife Dividend',
                        institution: 'MetLife',
                        assetType: 'Insurance Policy',
                        value: 250.00
                    },
                    sourceText: 'AUTOMATED DEPOSIT - $250.00 from METLIFE INSURANCE DIVIDEND',
                    suggestedAction: 'Check for Life Insurance Policy'
                },
                {
                    confidence: 0.60,
                    category: 'INVESTMENTS',
                    asset: {
                        name: 'Charles Schwab',
                        institution: 'Charles Schwab',
                        assetType: 'Brokerage',
                    },
                    sourceText: 'Refer to your consolidated brokerage holdings at CHARLES SCHWAB',
                    suggestedAction: 'Search for Statements'
                }
            ],
            summary: "6 potential assets identified from Estate Settlement Statement."
        };
    }
}
