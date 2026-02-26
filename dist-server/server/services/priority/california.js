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
// California Simplified Succession Thresholds (Probate Code §13100 et seq.)
// Updated for 2025/2026
export const CA_SIMPLIFIED_THRESHOLDS = {
    // Personal Property - total aggregate value threshold
    personalProperty: {
        threshold: 208850, // CA Probate Code §13100 - adjusted annually
        citation: "CA Prob. Code §13100",
        waitingDays: 40, // 40 days after death before affidavit can be used
    },
    // Real Property - different thresholds apply
    realProperty: {
        // Under Probate Code §13200, real property up to certain value can use affidavit
        // Note: This is rarely used due to title insurance issues
        threshold: 208850, // Same threshold as personal property
        citation: "CA Prob. Code §13200",
        waitingDays: 40,
    },
    // Spousal Property Petition (Probate Code §13500)
    // No dollar limit - surviving spouse/domestic partner can claim community property
    spousalProperty: {
        threshold: null, // No limit
        citation: "CA Prob. Code §13500",
        waitingDays: 0, // Can file immediately
    },
};
// California Creditor Claim Timing
// Probate Code §9154: Creditor claim period is the LATER of:
// - 4 months after Letters issued, OR
// - 60 days after notice mailed/published
export const CA_CREDITOR_TIMING = {
    lettersBasedDays: 120, // 4 months after Letters issued
    noticeBasedDays: 60, // 60 days after notice mailed/published
    calculation: "MAX", // Use maximum of the two periods
    citation: "CA Prob. Code §9154",
};
/**
 * Calculate California creditor claim deadline
 * Returns the later of (Letters date + 4 months) or (Notice date + 60 days)
 */
export function calculateCACreditorDeadline(lettersIssuedDate, noticePublishedDate) {
    const lettersDeadline = new Date(lettersIssuedDate);
    lettersDeadline.setDate(lettersDeadline.getDate() + CA_CREDITOR_TIMING.lettersBasedDays);
    // If notice date provided, calculate notice-based deadline
    if (noticePublishedDate) {
        const noticeDeadline = new Date(noticePublishedDate);
        noticeDeadline.setDate(noticeDeadline.getDate() + CA_CREDITOR_TIMING.noticeBasedDays);
        // Return the later date
        return noticeDeadline > lettersDeadline ? noticeDeadline : lettersDeadline;
    }
    return lettersDeadline;
}
/**
 * Calculate California simplified succession eligibility
 * Returns detailed eligibility info including waiting period status
 */
export function calculateCASimplifiedEligibility(personalPropertyValue, realPropertyValue, daysSinceDeath, isSurvivingSpouse) {
    const totalValue = personalPropertyValue + realPropertyValue;
    const waitingPeriodMet = daysSinceDeath >= CA_SIMPLIFIED_THRESHOLDS.personalProperty.waitingDays;
    const waitingDaysRemaining = Math.max(0, CA_SIMPLIFIED_THRESHOLDS.personalProperty.waitingDays - daysSinceDeath);
    // Spousal property petition has no dollar limit
    if (isSurvivingSpouse) {
        return {
            eligibleForAffidavit: true,
            waitingPeriodMet: true,
            waitingDaysRemaining: 0,
            affidavitType: "spousal",
            totalValue,
        };
    }
    // Check personal property threshold
    if (personalPropertyValue <= CA_SIMPLIFIED_THRESHOLDS.personalProperty.threshold && realPropertyValue === 0) {
        return {
            eligibleForAffidavit: waitingPeriodMet,
            waitingPeriodMet,
            waitingDaysRemaining,
            affidavitType: "personal",
            totalValue,
        };
    }
    // Real property affidavit is rarely used but check threshold
    if (realPropertyValue <= CA_SIMPLIFIED_THRESHOLDS.realProperty.threshold && personalPropertyValue === 0) {
        return {
            eligibleForAffidavit: waitingPeriodMet,
            waitingPeriodMet,
            waitingDaysRemaining,
            affidavitType: "real",
            totalValue,
        };
    }
    return {
        eligibleForAffidavit: false,
        waitingPeriodMet,
        waitingDaysRemaining,
        affidavitType: null,
        totalValue,
    };
}
/**
 * Calculate real estate sale overbid amount for court confirmation
 * Per CA Probate Code §10310
 */
export function calculateOverbidAmount(originalBid, overbidIncrement) {
    // Probate Code §10310: Minimum overbid is the greater of:
    // (a) Original bid + $500, OR
    // (b) Original bid + (original bid × 0.05) [5% of first $10k = $500, then scaled]
    const optionA = originalBid + 500;
    const optionB = originalBid + (Math.min(originalBid, 10000) * 0.05) + (originalBid > 10000 ? (originalBid - 10000) * 0.025 : 0);
    const minimumOverbid = Math.max(optionA, optionB);
    // Deposit is typically 10% of the overbid amount
    const requiredDeposit = Math.round(minimumOverbid * 0.1);
    return {
        minimumOverbid: Math.ceil(minimumOverbid),
        requiredDeposit,
        totalRequired: Math.ceil(minimumOverbid) + requiredDeposit,
        formula: "Greater of (bid + $500) or (bid + 5% of first $10k + 2.5% of excess)",
    };
}
// California County Fee Overrides
// Filing fees vary by county - these are base fees that can be overridden
export const CA_COUNTY_FEES = {
    "Los Angeles": {
        filingFee: 435,
        firstPetitionFee: 435,
        citation: "LA Superior Court Fee Schedule",
        notes: "Additional fees for complex estates",
    },
    "San Diego": {
        filingFee: 435,
        firstPetitionFee: 435,
        citation: "SD Superior Court Probate Fee Schedule",
    },
    "Orange": {
        filingFee: 435,
        firstPetitionFee: 435,
        citation: "OC Superior Court Fee Schedule",
    },
    "San Francisco": {
        filingFee: 435,
        firstPetitionFee: 435,
        citation: "SF Superior Court Fee Schedule",
    },
    "Sacramento": {
        filingFee: 435,
        firstPetitionFee: 435,
        citation: "Sacramento Superior Court Fee Schedule",
    },
    "Santa Clara": {
        filingFee: 435,
        firstPetitionFee: 435,
        citation: "Santa Clara Superior Court Fee Schedule",
    },
    "Alameda": {
        filingFee: 435,
        firstPetitionFee: 435,
        citation: "Alameda Superior Court Fee Schedule",
    },
    "Contra Costa": {
        filingFee: 435,
        firstPetitionFee: 435,
        citation: "Contra Costa Superior Court Fee Schedule",
    },
    "Riverside": {
        filingFee: 435,
        firstPetitionFee: 435,
        citation: "Riverside Superior Court Fee Schedule",
    },
    "San Bernardino": {
        filingFee: 435,
        firstPetitionFee: 435,
        citation: "San Bernardino Superior Court Fee Schedule",
    },
};
// California Probate Code §850 - Heggstad Petition
// For assets that should have been in a trust but weren't properly transferred
export const CA_HEGGSTAD_PROVISIONS = {
    probateCodeSection: "850",
    citation: "CA Prob. Code §850",
    description: "Petition to transfer assets to trust that were not properly titled in the trust name but were intended to be trust assets",
    requirements: [
        "Evidence of intent to transfer to trust (typically from the trust document)",
        "Description of the property",
        "Explanation of why transfer wasn't completed",
    ],
    applicableSituations: [
        "Property listed on trust schedule but deed not transferred",
        "Bank accounts intended for trust but not retitled",
        "Other assets where settlor intent is clear but transfer incomplete",
    ],
    typicalTimeline: "30-60 days if uncontested",
    formReference: "DE-850 (Petition)",
};
// Small Estate / Spousal / §850 Parameterized Branching Configuration
export const CA_BRANCHING_CONFIG = {
    smallEstate: {
        threshold: CA_SIMPLIFIED_THRESHOLDS.personalProperty.threshold,
        citation: CA_SIMPLIFIED_THRESHOLDS.personalProperty.citation,
        waitingDays: CA_SIMPLIFIED_THRESHOLDS.personalProperty.waitingDays,
        formNumber: "DE-310", // Affidavit for Collection of Personal Property
    },
    spousalProperty: {
        threshold: null, // No dollar limit
        citation: CA_SIMPLIFIED_THRESHOLDS.spousalProperty.citation,
        waitingDays: CA_SIMPLIFIED_THRESHOLDS.spousalProperty.waitingDays,
        formNumber: "DE-221", // Spousal Property Petition
    },
    heggstadPetition: {
        citation: CA_HEGGSTAD_PROVISIONS.citation,
        formNumber: "DE-850",
        requirements: CA_HEGGSTAD_PROVISIONS.requirements,
    },
    // Branching logic based on estate characteristics
    determinePath: (params) => {
        // Priority 1: Spousal Property Petition (no dollar limit)
        if (params.isSurvivingSpouse) {
            return { path: "spousal", reason: "Surviving spouse eligible for Spousal Property Petition (no dollar limit)" };
        }
        // Priority 2: Heggstad Petition (if trust transfer issues exist)
        if (params.hasTrust && params.trustTransferIssues) {
            return { path: "heggstad", reason: "Assets intended for trust can be transferred via §850 Heggstad petition" };
        }
        // Priority 3: Small Estate Affidavit
        if (params.personalPropertyValue <= CA_SIMPLIFIED_THRESHOLDS.personalProperty.threshold &&
            params.realPropertyValue === 0 &&
            params.daysSinceDeath >= CA_SIMPLIFIED_THRESHOLDS.personalProperty.waitingDays) {
            return { path: "small_estate", reason: `Personal property ≤ ${CA_SIMPLIFIED_THRESHOLDS.personalProperty.threshold} qualifies for affidavit` };
        }
        // Default: Formal Probate
        return { path: "formal_probate", reason: "Estate requires formal probate proceedings" };
    },
};
export const CaliforniaPrioritySystem = {
    stateCode: "CA",
    rules: CA_RULES,
    creditorNoticePeriodDays: CA_CREDITOR_TIMING.lettersBasedDays, // Base period - 4 months
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
