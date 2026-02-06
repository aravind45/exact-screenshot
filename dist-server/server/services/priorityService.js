import { prisma } from "../db.js";
import { PriorityFactory } from "./priority/priorityFactory.js";
export class PriorityService {
    /**
     * Checks if a specific liability can be paid based on the estate's jurisdiction rules.
     */
    static async checkPaymentEligibility(estateId, liabilityId) {
        // 1. Get Estate Info (State)
        const estate = await prisma.estate.findUnique({
            where: { id: estateId },
            select: { deceasedState: true, authorityType: true, appointedDate: true }
        });
        if (!estate)
            throw new Error("Estate not found");
        // 2. Get the specific liability we want to pay
        const targetLiability = await prisma.liability.findUnique({
            where: { id: liabilityId }
        });
        if (!targetLiability)
            throw new Error("Liability not found");
        // 3. Unpaid Liabilities (Status != PAID)
        // We exclude the current one we are trying to pay
        const openLiabilities = await prisma.liability.findMany({
            where: {
                estateId,
                status: { not: "PAID" },
                id: { not: liabilityId }
            },
            select: { id: true, name: true, amount: true, priorityClass: true }
        });
        // 4. Get Rules Engine
        const system = PriorityFactory.getSystem(estate.deceasedState || "CA");
        // 5. Notice Period Check
        // In most states, payments to regular creditors are restricted until the notice period expires.
        // Rank 1 (Administration Expenses) are usually allowed anytime.
        const currentRule = system.rules.find(r => r.classId === targetLiability.priorityClass);
        if (currentRule && currentRule.rank > 1 && estate.appointedDate) {
            const appointed = new Date(estate.appointedDate);
            const now = new Date();
            const diffDays = Math.floor((now.getTime() - appointed.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays < system.creditorNoticePeriodDays) {
                return {
                    allowed: false,
                    reason: `Creditor notice period is still open (${system.creditorNoticePeriodDays - diffDays} days remaining). Payments to ${currentRule.label} are restricted by law during this time to protect unknown creditors.`,
                    blockingItems: []
                };
            }
        }
        // 6. Run Priority Ranking Check
        // Convert Decimal to Number for the engine interface
        const formattedOpenLiabilities = openLiabilities.map(l => ({
            ...l,
            amount: Number(l.amount)
        }));
        return system.isValidPayment(targetLiability.priorityClass, formattedOpenLiabilities, estate.authorityType);
    }
    /**
     * Get the priority options for a dropdown based on state
     */
    static getPriorityOptions(state) {
        return PriorityFactory.getAllRules(state);
    }
    /**
     * Get the priority system for a state
     */
    static getPrioritySystem(state) {
        return PriorityFactory.getSystem(state);
    }
}
