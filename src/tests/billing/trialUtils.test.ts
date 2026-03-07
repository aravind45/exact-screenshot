import { describe, expect, it } from 'vitest';

import { TRIAL_DAYS, calculateIsTrialing } from '../../../server/utils/trialUtils.js';

describe('trialUtils', () => {
    it('returns false when trial start is null', () => {
        expect(calculateIsTrialing(null)).toBe(false);
    });

    it('returns true during trial window', () => {
        const startedAt = new Date(Date.now() - (TRIAL_DAYS - 1) * 24 * 60 * 60 * 1000);
        expect(calculateIsTrialing(startedAt)).toBe(true);
    });

    it('returns false when trial is expired', () => {
        const startedAt = new Date(Date.now() - (TRIAL_DAYS + 1) * 24 * 60 * 60 * 1000);
        expect(calculateIsTrialing(startedAt)).toBe(false);
    });

    it('returns false for a future trial date', () => {
        const startedAt = new Date(Date.now() + 60 * 60 * 1000);
        expect(calculateIsTrialing(startedAt)).toBe(false);
    });
});
