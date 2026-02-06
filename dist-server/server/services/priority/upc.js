const UPC_RULES = [
    {
        classId: "ADMIN",
        label: "1. Admin Expenses",
        rank: 1,
        description: "Costs and expenses of administration."
    },
    {
        classId: "FUNERAL",
        label: "2. Funeral Expenses",
        rank: 2,
        description: "Reasonable funeral expenses."
    },
    {
        classId: "FEDERAL_TAX",
        label: "3. Fed. Debts/Taxes",
        rank: 3,
        description: "Debts and taxes with preference under federal law."
    },
    {
        classId: "MEDICAL",
        label: "4. Medical Expenses",
        rank: 4,
        description: "Reasonable and necessary medical/hospital expenses of the last illness."
    },
    {
        classId: "STATE_DEBTS",
        label: "5. State Debts/Taxes",
        rank: 5,
        description: "Debts and taxes with preference under other laws of this state."
    },
    {
        classId: "GENERAL",
        label: "6. All Other Claims",
        rank: 6,
        description: "All other claims."
    }
];
export const UPCPrioritySystem = {
    stateCode: "UPC",
    rules: UPC_RULES,
    creditorNoticePeriodDays: 120, // 4 months standard UPC
    isValidPayment: (currentLiabilityClass, openLiabilities, authorityType) => {
        const currentRule = UPC_RULES.find(r => r.classId === currentLiabilityClass);
        if (!currentRule)
            return { allowed: true };
        const higherPriorityLiabilities = openLiabilities.filter(l => {
            const rule = UPC_RULES.find(r => r.classId === l.priorityClass);
            return rule && rule.rank < currentRule.rank;
        });
        if (higherPriorityLiabilities.length > 0) {
            return {
                allowed: false,
                reason: `Uniform Probate Code (UPC) 3-805 requires paying '${higherPriorityLiabilities[0].priorityClass}' before '${currentRule.label}'.`,
                blockingItems: higherPriorityLiabilities
            };
        }
        return { allowed: true };
    }
};
