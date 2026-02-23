import { prisma } from "../db.js";
import { PriorityService } from "./priorityService.js";

type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type RiskType = 'INSOLVENCY' | 'PREMATURE_DISTRIBUTION' | 'PRIORITY_VIOLATION' | 'MISSING_PREREQUISITES';

interface RiskReport {
    level: RiskLevel;
    score: number; // 0-100 (100 is safest)
    solvencyRatio: number;
    warnings: string[];
    blockers: string[];
    details: {
        totalLiquidAssets: number;
        totalLiabilities: number;
        creditorNoticeDaysRemaining: number;
        unpaidHighPriorityClaims: number;
    };
}

export const RiskService = {
    /**
     * Comprehensive Risk Assessment for an Estate
     * Used before allowing major actions like Distributions
     */
    async assessEstateRisk(estateId: string): Promise<RiskReport> {
        const estate = await prisma.estate.findUnique({
            where: { id: estateId },
            select: { authorityType: true, appointedDate: true, deceasedState: true }
        });
        if (!estate) throw new Error("Estate not found");

        // 1. Financial Health (Solvency)
        const assetFilter: any = {
            estateId,
            assetType: { in: ["checking", "savings", "cash", "brokerage", "monetary"] }
        };

        // Trust vs Probate Assets
        if (estate?.authorityType === "TRUST_ADMIN") {
            assetFilter.ownershipType = "TRUST";
        } else {
            assetFilter.ownershipType = "INDIVIDUAL";
        }

        const assets = await prisma.asset.findMany({ where: assetFilter });
        const liabilities = await prisma.liability.findMany({ where: { estateId } });

        const totalLiquidAssets = assets.reduce((sum, a) => sum + (a.value || 0), 0);
        const totalLiabilities = liabilities.reduce((sum, l) => sum + Number(l.amount), 0);

        let solvencyRatio = totalLiabilities > 0 ? totalLiquidAssets / totalLiabilities : 100;
        // Cap visual ratio at 100% logic
        if (totalLiabilities === 0) solvencyRatio = 999;

        // 2. Creditor Notice Period
        const system = PriorityService.getPrioritySystem(estate.deceasedState || "");
        let daysRemaining = system.creditorNoticePeriodDays;

        if (estate.appointedDate) {
            const appointed = new Date(estate.appointedDate);
            const now = new Date();
            const diffDays = Math.floor((now.getTime() - appointed.getTime()) / (1000 * 60 * 60 * 24));
            daysRemaining = Math.max(0, system.creditorNoticePeriodDays - diffDays);
        } else {
            // If not appointed, the clock hasn't started
            daysRemaining = system.creditorNoticePeriodDays;
        }

        // 3. Unpaid High Priority Claims
        // Anything ranked 1-3 (Admin, Funeral, Taxes) that isn't PAID
        // We use the PriorityFactory rules implicitly via logic here or call PriorityService
        // For efficiency, let's just count open liabilities with priorityClass that typically maps to high rank
        const highPriorityClasses = ['ADMINISTRATION_EXPENSES', 'FUNERAL_EXPENSES', 'FEDERAL_TAXES', 'STATE_TAXES'];
        const unpaidHighPriorityClaims = liabilities.filter(l =>
            l.status !== 'PAID' && highPriorityClasses.includes(l.priorityClass)
        ).length;

        // --- Risk Calculation Logic ---
        const warnings: string[] = [];
        const blockers: string[] = [];
        let riskLevel: RiskLevel = 'LOW';
        let score = 100;

        // Check: Insolvency
        if (solvencyRatio < 1) {
            riskLevel = 'CRITICAL';
            blockers.push("Estate is INSOLVENT. Debts exceed assets. Consult an attorney before any payments.");
            score -= 50;
        } else if (solvencyRatio < 1.1) {
            riskLevel = 'HIGH';
            warnings.push("Solvency is tight (<10% buffer). Proceed with caution.");
            score -= 20;
        }

        // Check: Premature Distribution
        if (daysRemaining > 0) {
            if (solvencyRatio < 1.5) {
                // If we aren't super solvent, this is a blocker
                blockers.push(`Creditor Notice Period is still OPEN (${daysRemaining} days left). Premature distribution is unsafe.`);
                riskLevel = 'HIGH';
                score -= 30;
            } else {
                // If we are wealthy, it's just a warning (At Risk Distribution)
                warnings.push(`Creditor Notice Period is OPEN (${daysRemaining} days left). You may distribute, but you are personally liable if new debts appear.`);
                if (riskLevel !== 'CRITICAL') riskLevel = 'MEDIUM';
                score -= 10;
            }
        }

        // Check: Unpaid Priority Claims
        if (unpaidHighPriorityClaims > 0) {
            warnings.push(`${unpaidHighPriorityClaims} high-priority claims (Taxes/Admin) are still unpaid. Ensure you reserve funds.`);
            // This becomes a blocker only if we are trying to do a Final Distribution, but this function is general estate risk
            if (riskLevel !== 'CRITICAL') riskLevel = 'MEDIUM';
            score -= 10;
        }

        return {
            level: riskLevel,
            score: Math.max(0, score),
            solvencyRatio,
            warnings,
            blockers,
            details: {
                totalLiquidAssets,
                totalLiabilities,
                creditorNoticeDaysRemaining: daysRemaining,
                unpaidHighPriorityClaims
            }
        };
    },

    /**
     * Validate a specific payment (RISK-003)
     * Wraps PriorityService but adds stricter Risk/Solvency context
     */
    async validatePayment(estateId: string, liabilityId: string): Promise<{ allowed: boolean; reason?: string; blockingItems?: any[] }> {
        // 1. Run standard priority check
        const priorityCheck = await PriorityService.checkPaymentEligibility(estateId, liabilityId);

        if (!priorityCheck.allowed) {
            return priorityCheck;
        }

        // 2. Run Solvency Check
        // If estate is CRITICALLY insolvent, we might blocking ALL payments except Admin Expenses
        const estateRisk = await this.assessEstateRisk(estateId);

        if (estateRisk.level === 'CRITICAL') {
            const liability = await prisma.liability.findUnique({ where: { id: liabilityId } });
            if (liability?.priorityClass !== 'ADMINISTRATION_EXPENSES') {
                return {
                    allowed: false,
                    reason: "Estate is INSOLVENT. Only Administrative Expenses can be paid at this time. All other debts must wait for court instructions.",
                    blockingItems: []
                };
            }
        }

        return { allowed: true };
    }
};
