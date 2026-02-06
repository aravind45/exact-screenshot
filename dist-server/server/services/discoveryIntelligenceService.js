import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export class DiscoveryIntelligenceService {
    /**
     * Aggregates clues from all documents in an estate to provide cross-document insights.
     */
    static async getDiscoveryInsights(estateId) {
        const documents = await prisma.estateDocument.findMany({
            where: { estateId, clues: { not: null } }
        });
        const allClues = [];
        documents.forEach(doc => {
            const clues = doc.clues;
            if (Array.isArray(clues)) {
                allClues.push(...clues);
            }
            else if (clues && typeof clues === 'object') {
                // Handle different clue formats if necessary
                if (Array.isArray(clues.clues))
                    allClues.push(...clues.clues);
                else if (clues.data)
                    allClues.push(clues.data);
            }
        });
        if (allClues.length === 0)
            return [];
        const insights = [];
        // 1. Detect Duplicates / High Confidence Correlations
        const institutionCounts = {};
        allClues.forEach(clue => {
            const name = clue.institution.toLowerCase().trim();
            institutionCounts[name] = (institutionCounts[name] || 0) + 1;
        });
        const strongLeads = Object.entries(institutionCounts)
            .filter(([_, count]) => count > 1)
            .map(([name]) => name);
        if (strongLeads.length > 0) {
            insights.push({
                title: "Strong Asset Correlations",
                content: `${strongLeads.map(l => l.toUpperCase()).join(', ')} appeared in multiple documents. This significantly increases the probability of these assets existing.`,
                type: 'success'
            });
        }
        // 2. Cross-Category Intelligence
        const hasBankAccounts = allClues.some(c => c.potentialAsset.toLowerCase().includes('bank'));
        const hasInvestments = allClues.some(c => c.potentialAsset.toLowerCase().includes('brokerage') || c.potentialAsset.toLowerCase().includes('investment'));
        if (hasBankAccounts && !hasInvestments) {
            insights.push({
                title: "Missing Investment Clues",
                content: "We found bank accounts but no investment clues. Check for transfers to brokerage firms (Fidelity, Schwab) in the bank statements.",
                type: 'warning'
            });
        }
        // 3. Tax Document Intelligence
        const hasW2 = documents.some(d => d.documentType === 'W2');
        const has1099 = documents.some(d => d.documentType?.includes('1099'));
        if (hasW2 && !allClues.some(c => c.potentialAsset.toLowerCase().includes('benefit'))) {
            insights.push({
                title: "Employer Benefit Check",
                content: "W-2 forms detected. Remember to check for final pay, accrued vacation, and employer-sponsored life insurance.",
                type: 'info'
            });
        }
        // 4. Activity Density
        if (allClues.length > 10) {
            insights.push({
                title: "High Discovery Density",
                content: `We've identified ${allClues.length} potential items across ${documents.length} documents. Consider using the systematic review to keep track of each.`,
                type: 'info'
            });
        }
        return insights;
    }
    /**
     * Correlates a new set of findings with existing estate data.
     */
    static async correlateFindings(estateId, currentFindings) {
        const existingAssets = await prisma.asset.findMany({
            where: { estateId }
        });
        const newLeads = currentFindings.filter(finding => {
            const isDuplicate = existingAssets.some(asset => asset.institution.toLowerCase().includes(finding.asset.institution.toLowerCase()) ||
                finding.asset.institution.toLowerCase().includes(asset.institution.toLowerCase()));
            return !isDuplicate;
        });
        return newLeads;
    }
}
