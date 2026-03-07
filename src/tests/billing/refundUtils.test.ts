import { describe, expect, it } from 'vitest';

import { getRefundEligibility } from '../../../server/utils/refundUtils.js';

describe('refundUtils', () => {
    it('allows refund for successful payment with payment intent', () => {
        const result = getRefundEligibility({
            type: 'PAYMENT',
            status: 'SUCCESS',
            amount: 49,
            stripePaymentIntentId: 'pi_123',
        });

        expect(result.eligible).toBe(true);
    });

    it('rejects non-payment transactions', () => {
        const result = getRefundEligibility({
            type: 'REFUND',
            status: 'SUCCESS',
            amount: -49,
            stripePaymentIntentId: 're_123',
        });

        expect(result.eligible).toBe(false);
        expect(result.reason).toContain('successful payment');
    });

    it('rejects transactions without valid Stripe payment intent', () => {
        const result = getRefundEligibility({
            type: 'PAYMENT',
            status: 'SUCCESS',
            amount: 49,
            stripePaymentIntentId: 're_123',
        });

        expect(result.eligible).toBe(false);
        expect(result.reason).toContain('payment intent');
    });
});
