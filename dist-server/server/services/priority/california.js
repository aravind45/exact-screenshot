// California Probate Code 11420
const CA_RULES = [
    { rank: 1, classId: "ADMINISTRATION_EXPENSES", label: "Expenses of Administration", description: "Court fees, attorney fees, executor commissions" },
    { rank: 2, classId: "MORTGAGES_SECURED", label: "Secured Debts (Mortgages)", description: "Mortgages, liens, deed of trust" },
    { rank: 3, classId: "FUNERAL_EXPENSES", label: "Funeral Expenses", description: "Reasonable costs for funeral and disposition" },
    { rank: 4, classId: "MEDICAL_LAST_ILLNESS", label: "Last Illness Expenses", description: "Medical bills from the final illness" },
    { rank: 5, classId: "FAMILY_ALLOWANCE", label: "Family Allowance", description: "Court-ordered support for family" },
    { rank: 6, classId: "WAGE_CLAIMS", label: "Wage Claims", description: "Unpaid wages to employees (up to $2,000)" },
    { rank: 7, classId: "GENERAL_DEBTS", label: "General Debts", description: "Credit cards, personal loans, utilities" }
];
export const CaliforniaPrioritySystem = {
    stateCode: "CA",
    rules: CA_RULES,
    creditorNoticePeriodDays: 120, // 4 months
    isValidPayment: (currentLiabilityClass, openLiabilities, authorityType) => {
        // Find the rank of the current liability we want to pay
        const currentRule = CA_RULES.find(r => r.classId === currentLiabilityClass);
        if (!currentRule)
            return { allowed: true };
        // Logic for Trust Administration
        // In CA, Trusts are generally governed by the Trust instrument, but often follow similar priority
        // if the estate is insolvent (Probate Code 19000+).
        if (authorityType === "TRUST_ADMIN") {
            // Trusts might have different priority rules depending on the document, 
            // but we'll apply a standard protective layer for now.
            const higherPriorityLiabilities = openLiabilities.filter(l => {
                const rule = CA_RULES.find(r => r.classId === l.priorityClass);
                return rule && rule.rank < currentRule.rank;
            });
            if (higherPriorityLiabilities.length > 0) {
                return {
                    allowed: false,
                    reason: `Trust Administration best practice suggests paying '${higherPriorityLiabilities[0].priorityClass}' before '${currentRule.label}'.`,
                    blockingItems: higherPriorityLiabilities
                };
            }
            return { allowed: true };
        }
        // Logic for Small Estates (13100 Affidavits)
        // Affidavits usually require the person to declare all debts have been considered or paid.
        if (authorityType === "SMALL_ESTATE") {
            const higherPriorityLiabilities = openLiabilities.filter(l => {
                const rule = CA_RULES.find(r => r.classId === l.priorityClass);
                return rule && rule.rank < currentRule.rank;
            });
            if (higherPriorityLiabilities.length > 0) {
                return {
                    allowed: false,
                    reason: `Small Estate rules require addressing higher priority claims like '${higherPriorityLiabilities[0].priorityClass}' even when using an affidavit.`,
                    blockingItems: higherPriorityLiabilities
                };
            }
            return { allowed: true };
        }
        // Standard Probate Logic
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
