import { prisma } from "../db.js";
import { PriorityFactory } from "./priority/priorityFactory.js";

export class PriorityService {

    /**
     * Checks if a specific liability can be paid based on the estate's jurisdiction rules.
     */
    static async checkPaymentEligibility(estateId: string, liabilityId: string) {
        // 1. Get Estate Info (State)
        const estate = await prisma.estate.findUnique({
            where: { id: estateId },
            select: { deceasedState: true, authorityType: true }
        });

        if (!estate) throw new Error("Estate not found");

        // 2. Get the specific liability we want to pay
        const targetLiability = await prisma.liability.findUnique({
            where: { id: liabilityId }
        });

        if (!targetLiability) throw new Error("Liability not found");

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

        // 5. Run Check
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
    static getPriorityOptions(state: string) {
        return PriorityFactory.getAllRules(state);
    }
}
