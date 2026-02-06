const NY_RULES = [
    {
        classId: "EXPENSES",
        label: "Funeral & Administration Expenses",
        rank: 1,
        description: "Reasonable funeral expenses and expenses of administration (SCPA 1811(1))"
    },
    {
        classId: "SECURED",
        label: "Debts Entitled to Preference",
        rank: 2,
        description: "Debts entitled to preference under the laws of the US and NY (e.g., Federal/State Taxes)"
    },
    {
        classId: "TAXES",
        label: "Property Taxes",
        rank: 3,
        description: "Taxes assessed on property of the deceased previous to death"
    },
    {
        classId: "JUDGMENTS",
        label: "Judgments",
        rank: 4,
        description: "Judgments docketed and decrees entered against the decedent"
    },
    {
        classId: "GENERAL",
        label: "General Debts",
        rank: 5,
        description: "All other demands and accounts (Credit cards, utilities, etc.)"
    }
];
export const NewYorkPrioritySystem = {
    stateCode: "NY",
    rules: NY_RULES,
    creditorNoticePeriodDays: 210, // New York notice period is 7 months (210 days - SCPA 1802)
    isValidPayment: (currentLiabilityClass, openLiabilities, authorityType) => {
        const currentRule = NY_RULES.find(r => r.classId === currentLiabilityClass);
        if (!currentRule)
            return { allowed: true };
        // Similar logic to CA: don't pay lower priority if higher priority is open
        const higherPriorityLiabilities = openLiabilities.filter(l => {
            const rule = NY_RULES.find(r => r.classId === l.priorityClass);
            return rule && rule.rank < currentRule.rank;
        });
        if (higherPriorityLiabilities.length > 0) {
            return {
                allowed: false,
                reason: `New York law (SCPA 1811) requires paying '${higherPriorityLiabilities[0].priorityClass}' before '${currentRule.label}'.`,
                blockingItems: higherPriorityLiabilities
            };
        }
        return { allowed: true };
    }
};
