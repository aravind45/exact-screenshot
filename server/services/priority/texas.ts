import { StatePrioritySystem, PriorityRule } from "./types.js";

const TX_RULES: PriorityRule[] = [
    {
        classId: "FUNERAL",
        label: "Class 1: Funeral & Illness",
        rank: 1,
        description: "Funeral expenses and expenses of last illness (up to $15,000)."
    },
    {
        classId: "ADMIN",
        label: "Class 2: Admin Expenses",
        rank: 2,
        description: "Expenses of administration and estate preservation."
    },
    {
        classId: "SECURED",
        label: "Class 3: Secured Claims",
        rank: 3,
        description: "Secured claims (e.g., mortgages, car loans)."
    },
    {
        classId: "TAXES",
        label: "Class 4: Fed/State Taxes",
        rank: 4,
        description: "Claims for taxes, penalties, and interest."
    },
    {
        classId: "INMATE",
        label: "Class 5: Inmate Confinement",
        rank: 5,
        description: "Claims for the cost of confinement of an inmate."
    },
    {
        classId: "MEDICAID",
        label: "Class 6: Medicaid Recovery",
        rank: 6,
        description: "Claims for repayment of medical assistance (Medicaid)."
    },
    {
        classId: "GENERAL",
        label: "Class 7: All Other Claims",
        rank: 7,
        description: "All other claims."
    }
];

export const TexasPrioritySystem: StatePrioritySystem = {
    stateCode: "TX",
    rules: TX_RULES,

    isValidPayment: (currentLiabilityClass, openLiabilities, authorityType) => {
        const currentRule = TX_RULES.find(r => r.classId === currentLiabilityClass);
        if (!currentRule) return { allowed: true };

        const higherPriorityLiabilities = openLiabilities.filter(l => {
            const rule = TX_RULES.find(r => r.classId === l.priorityClass);
            return rule && rule.rank < currentRule.rank;
        });

        if (higherPriorityLiabilities.length > 0) {
            return {
                allowed: false,
                reason: `Texas Estates Code 355.102 requires paying '${higherPriorityLiabilities[0].priorityClass}' before '${currentRule.label}'.`,
                blockingItems: higherPriorityLiabilities
            };
        }

        return { allowed: true };
    }
};
