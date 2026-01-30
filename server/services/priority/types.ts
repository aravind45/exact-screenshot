export interface PriorityRule {
    rank: number;
    classId: string;
    label: string;
    description: string;
}

export interface PaymentEligibility {
    allowed: boolean;
    reason?: string;
    blockingItems?: {
        id: string;
        name: string;
        amount: number;
        priorityClass: string;
    }[];
}

export interface StatePrioritySystem {
    stateCode: string;
    rules: PriorityRule[];
    isValidPayment: (
        currentLiabilityClass: string,
        openLiabilities: { id: string; name: string; amount: number; priorityClass: string }[]
    ) => PaymentEligibility;
}
