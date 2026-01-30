import { StatePrioritySystem, PaymentEligibility, PriorityRule } from "./types.js";

// California Probate Code 11420
const CA_RULES: PriorityRule[] = [
    { rank: 1, classId: "ADMINISTRATION_EXPENSES", label: "Expenses of Administration", description: "Court fees, attorney fees, executor commissions" },
    { rank: 2, classId: "MORTGAGES_SECURED", label: "Secured Debts (Mortgages)", description: "Mortgages, liens, deed of trust" },
    { rank: 3, classId: "FUNERAL_EXPENSES", label: "Funeral Expenses", description: "Reasonable costs for funeral and disposition" },
    { rank: 4, classId: "MEDICAL_LAST_ILLNESS", label: "Last Illness Expenses", description: "Medical bills from the final illness" },
    { rank: 5, classId: "FAMILY_ALLOWANCE", label: "Family Allowance", description: "Court-ordered support for family" },
    { rank: 6, classId: "WAGE_CLAIMS", label: "Wage Claims", description: "Unpaid wages to employees (up to $2,000)" },
    { rank: 7, classId: "GENERAL_DEBTS", label: "General Debts", description: "Credit cards, personal loans, utilities" }
];

export const CaliforniaPrioritySystem: StatePrioritySystem = {
    stateCode: "CA",
    rules: CA_RULES,

    isValidPayment: (currentLiabilityClass, openLiabilities) => {
        // Find the rank of the current liability we want to pay
        const currentRule = CA_RULES.find(r => r.classId === currentLiabilityClass);
        if (!currentRule) return { allowed: true }; // Unknown class, default allow (or could be strict deny)

        // Filter open liabilities that have a higher priority (lower rank number)
        // AND are effectively strictly higher priority.
        // Equal rank does NOT block in CA (pro rata), but for simplicity we allow equal rank to pay.
        // We only block if there is a STRICTLY higher priority debt unpaid.

        const higherPriorityLiabilities = openLiabilities.filter(l => {
            const rule = CA_RULES.find(r => r.classId === l.priorityClass);
            return rule && rule.rank < currentRule.rank;
        });

        if (higherPriorityLiabilities.length > 0) {
            return {
                allowed: false,
                reason: `Cannot pay '${currentRule.label}' yet. California law requires paying '${higherPriorityLiabilities[0].priorityClass}' first.`,
                blockingItems: higherPriorityLiabilities
            };
        }

        return { allowed: true };
    }
};
