const FL_RULES = [
    {
        classId: "ADMIN",
        label: "Class 1: Admin Expenses",
        rank: 1,
        description: "Costs, expenses of administration, and PR/Attorney compensation."
    },
    {
        classId: "FUNERAL",
        label: "Class 2: Funeral Expenses",
        rank: 2,
        description: "Reasonable funeral, interment, and grave marker expenses (up to $6,000)."
    },
    {
        classId: "FEDERAL_TAX",
        label: "Class 3: Fed. Debts/Taxes",
        rank: 3,
        description: "Debts and taxes with preference under federal law."
    },
    {
        classId: "MEDICAL",
        label: "Class 4: Medical Expenses",
        rank: 4,
        description: "Medical/hospital expenses of the last 60 days of illness."
    },
    {
        classId: "FAMILY",
        label: "Class 5: Family Allowance",
        rank: 5,
        description: "Family allowance."
    },
    {
        classId: "CHILD_SUPPORT",
        label: "Class 6: Child Support",
        rank: 6,
        description: "Arrearage from court-ordered child support."
    },
    {
        classId: "BUSINESS",
        label: "Class 7: Post-Death Business",
        rank: 7,
        description: "Debts acquired after death by the continuation of the decedent's business."
    },
    {
        classId: "GENERAL",
        label: "Class 8: All Other Claims",
        rank: 8,
        description: "All other claims."
    }
];
export const FloridaPrioritySystem = {
    stateCode: "FL",
    rules: FL_RULES,
    creditorNoticePeriodDays: 90, // Florida notice period is 3 months (90 days)
    isValidPayment: (currentLiabilityClass, openLiabilities, authorityType) => {
        const currentRule = FL_RULES.find(r => r.classId === currentLiabilityClass);
        if (!currentRule)
            return { allowed: true };
        const higherPriorityLiabilities = openLiabilities.filter(l => {
            const rule = FL_RULES.find(r => r.classId === l.priorityClass);
            return rule && rule.rank < currentRule.rank;
        });
        if (higherPriorityLiabilities.length > 0) {
            return {
                allowed: false,
                reason: `Florida Statutes 733.707 requires paying '${higherPriorityLiabilities[0].priorityClass}' before '${currentRule.label}'.`,
                blockingItems: higherPriorityLiabilities
            };
        }
        return { allowed: true };
    }
};
