import { describe, expect, it } from 'vitest';

import { getStripeBillingConfig, getCheckoutDisabledReason } from '../../../server/utils/billingConfig.js';

describe('billingConfig', () => {
    it('marks checkout as disabled when Stripe secret and price are missing', () => {
        const config = getStripeBillingConfig({
            STRIPE_SECRET_KEY: '',
            STRIPE_PRICE_ID: '',
            STRIPE_EXTRA_SEAT_PRICE_ID: '',
            STRIPE_WEBHOOK_SECRET: '',
            VITE_STRIPE_PUBLISHABLE_KEY: '',
        } as any);

        expect(config.subscriptionCheckoutEnabled).toBe(false);
        expect(config.extraSeatCheckoutEnabled).toBe(false);
        expect(config.missingForSubscription).toEqual(['publishable_key', 'secret_key', 'price_id']);
        expect(config.missingForExtraSeat).toEqual(['publishable_key', 'secret_key', 'extra_seat_price_id']);
    });

    it('enables checkout when Stripe keys and price IDs are present', () => {
        const config = getStripeBillingConfig({
            STRIPE_SECRET_KEY: 'sk_test_123',
            STRIPE_PRICE_ID: 'price_abc',
            STRIPE_EXTRA_SEAT_PRICE_ID: 'price_extra',
            STRIPE_WEBHOOK_SECRET: 'whsec_123',
            VITE_STRIPE_PUBLISHABLE_KEY: 'pk_test_123',
        } as any);

        expect(config.subscriptionCheckoutEnabled).toBe(true);
        expect(config.extraSeatCheckoutEnabled).toBe(true);
        expect(config.secretKeyConfigured).toBe(true);
        expect(config.publishableKeyConfigured).toBe(true);
        expect(config.mode).toBe('test');
    });

    it('treats placeholder values as missing', () => {
        const config = getStripeBillingConfig({
            STRIPE_SECRET_KEY: 'sk_test_placeholder',
            STRIPE_PRICE_ID: 'price_monthly_placeholder',
            STRIPE_EXTRA_SEAT_PRICE_ID: 'price_extra_placeholder',
            STRIPE_WEBHOOK_SECRET: 'whsec_123',
            VITE_STRIPE_PUBLISHABLE_KEY: 'pk_test_placeholder',
        } as any);

        expect(config.secretKeyConfigured).toBe(false);
        expect(config.priceIdConfigured).toBe(false);
        expect(config.extraSeatPriceIdConfigured).toBe(false);
        expect(config.publishableKeyConfigured).toBe(false);
    });

    it('returns a readable reason for missing config', () => {
        const reason = getCheckoutDisabledReason(['secret_key', 'price_id']);
        expect(reason).toContain('Stripe secret key');
        expect(reason).toContain('subscription price ID');
    });
});

