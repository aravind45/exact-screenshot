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
    static async updateCategoryStatus(id, status, evidenceSource) {
        return prisma.discoveryCategory.update({
            where: { id },
            data: {
                status,
                evidenceSource,
                reviewDate: new Date()
            }
        });
    }
    static async addNegativeAssurance(discoveryCategoryId, statement) {
        return prisma.negativeAssurance.create({
            data: {
                discoveryCategoryId,
                statement
            }
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
}
