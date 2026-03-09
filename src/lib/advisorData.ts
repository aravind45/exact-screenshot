export type AdvisorVerificationStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'PAUSED';

export const toStringArray = (value: unknown): string[] => {
    if (Array.isArray(value)) {
        return value
            .map((item) => String(item ?? '').trim())
            .filter(Boolean);
    }

    if (typeof value === 'string') {
        return value
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
    }

    return [];
};

export const normalizeAdvisorStatus = (rawStatus?: string): AdvisorVerificationStatus => {
    if (rawStatus === 'PENDING') return 'PENDING_REVIEW';
    if (rawStatus === 'VERIFIED') return 'APPROVED';
    if (rawStatus === 'PENDING_REVIEW' || rawStatus === 'APPROVED' || rawStatus === 'REJECTED' || rawStatus === 'PAUSED' || rawStatus === 'DRAFT') {
        return rawStatus;
    }
    return 'DRAFT';
};
