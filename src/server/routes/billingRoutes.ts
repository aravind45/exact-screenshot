import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { z } from 'zod';

import { prisma } from '../db.js';
import { logger } from '../lib/logger.js';
import { StripeService } from '../services/stripeService.js';
import { getStripeBillingConfig, getCheckoutDisabledReason } from '../utils/billingConfig.js';
import { calculateIsTrialing, TRIAL_DAYS } from '../utils/trialUtils.js';

const checkoutSchema = z.object({
    successUrl: z.string().url().optional(),
    cancelUrl: z.string().url().optional(),
    skipTrial: z.boolean().optional()
});

const portalSchema = z.object({
    returnUrl: z.string().url().optional()
});

const router = Router();

const toTrialEndsAt = (trialStartedAt: Date | null): Date | null => {
    if (!trialStartedAt) return null;
    return new Date(new Date(trialStartedAt).getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
};

const toDaysRemaining = (trialEndsAt: Date | null): number => {
    if (!trialEndsAt) return 0;
    const msRemaining = trialEndsAt.getTime() - Date.now();
    if (msRemaining <= 0) return 0;
    return Math.ceil(msRemaining / (24 * 60 * 60 * 1000));
};

/**
 * GET /api/billing/status
 * Billing readiness, subscription, trial, and refund summary
 */
router.get('/status', async (req: any, res: Response) => {
    try {
        const userId = req.user.id;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                subscriptionStatus: true,
                stripeCustomerId: true,
                trialStartedAt: true,
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const billingConfig = getStripeBillingConfig();
        const isTrialing = calculateIsTrialing(user.trialStartedAt);
        const trialEndsAt = toTrialEndsAt(user.trialStartedAt);

        const [latestPayment, latestRefund] = await Promise.all([
            prisma.transaction.findFirst({
                where: {
                    userId,
                    type: 'PAYMENT',
                    status: 'SUCCESS'
                },
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    amount: true,
                    currency: true,
                    createdAt: true,
                    stripePaymentIntentId: true
                }
            }),
            prisma.transaction.findFirst({
                where: {
                    userId,
                    type: 'REFUND'
                },
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    amount: true,
                    currency: true,
                    createdAt: true
                }
            })
        ]);

        const checkoutEnabled = billingConfig.subscriptionCheckoutEnabled;

        res.json({
            status: String(user.subscriptionStatus || 'FREE').toLowerCase(),
            planName: String(user.subscriptionStatus || '').toUpperCase() === 'ACTIVE'
                ? 'Executor Pro Plan'
                : isTrialing
                    ? `Free Trial (${TRIAL_DAYS} days)`
                    : 'No Active Plan',
            checkoutEnabled,
            checkoutDisabledReason: checkoutEnabled ? null : getCheckoutDisabledReason(billingConfig.missingForSubscription),
            portalEnabled: billingConfig.secretKeyConfigured && Boolean(user.stripeCustomerId),
            trial: {
                isTrialing,
                days: TRIAL_DAYS,
                startedAt: user.trialStartedAt,
                endsAt: trialEndsAt,
                daysRemaining: toDaysRemaining(trialEndsAt),
            },
            refund: {
                policy: 'manual_review',
                requestReviewAvailable: Boolean(latestPayment),
                latestPayment: latestPayment ? {
                    id: latestPayment.id,
                    amount: Number(latestPayment.amount),
                    currency: latestPayment.currency,
                    createdAt: latestPayment.createdAt,
                    stripePaymentIntentId: latestPayment.stripePaymentIntentId
                } : null,
                latestRefund: latestRefund ? {
                    id: latestRefund.id,
                    amount: Number(latestRefund.amount),
                    currency: latestRefund.currency,
                    createdAt: latestRefund.createdAt,
                } : null,
            },
            diagnostics: {
                stripeMode: billingConfig.mode,
                secretKeyConfigured: billingConfig.secretKeyConfigured,
                publishableKeyConfigured: billingConfig.publishableKeyConfigured,
                priceIdConfigured: billingConfig.priceIdConfigured,
                extraSeatPriceIdConfigured: billingConfig.extraSeatPriceIdConfigured,
                webhookSecretConfigured: billingConfig.webhookSecretConfigured,
            }
        });
    } catch (error: any) {
        logger.error('❌ Billing status error:', error.message);
        res.status(500).json({ error: 'Failed to fetch billing status' });
    }
});

/**
 * POST /api/billing/checkout
 * Create a Stripe Checkout session
 */
router.post('/checkout', async (req: any, res: Response) => {
    try {
        const validated = checkoutSchema.parse(req.body);
        const { successUrl, cancelUrl, skipTrial } = validated;

        const billingConfig = getStripeBillingConfig();
        if (!billingConfig.subscriptionCheckoutEnabled) {
            return res.status(503).json({
                error: 'Billing checkout is not configured',
                message: getCheckoutDisabledReason(billingConfig.missingForSubscription),
                missing: billingConfig.missingForSubscription,
            });
        }

        const userId = req.user.id;
        const session = await StripeService.createCheckoutSession(
            userId,
            successUrl || `${process.env.APP_URL || 'http://localhost:5173'}/dashboard?payment=success`,
            cancelUrl || `${process.env.APP_URL || 'http://localhost:5173'}/pricing?payment=cancelled`,
            !!skipTrial
        );

        res.json(session);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid URL parameters', details: error.errors });
        }
        logger.error('❌ Checkout error:', error.message);
        res.status(500).json({ error: error.message || 'Failed to create checkout session' });
    }
});

/**
 * POST /api/billing/checkout/license
 * Create a Stripe Checkout session for the Estate License ($299 one-time)
 */
router.post('/checkout/license', async (req: any, res: Response) => {
    try {
        const billingConfig = getStripeBillingConfig();
        if (!billingConfig.secretKeyConfigured) {
            return res.status(503).json({
                error: 'Billing checkout is not configured',
                message: getCheckoutDisabledReason(['secret_key']),
            });
        }
        if (!process.env.STRIPE_ESTATE_LICENSE_PRICE_ID) {
            return res.status(503).json({
                error: 'Estate License is not configured',
                message: 'One-time license checkout is temporarily unavailable. Please use the monthly plan.',
            });
        }

        const userId = req.user.id;
        const session = await StripeService.createEstateLicenseCheckoutSession(userId);
        res.json(session);
    } catch (error: any) {
        logger.error('❌ Estate License checkout error:', error.message);
        res.status(500).json({ error: error.message || 'Failed to create license checkout session' });
    }
});

/**
 * POST /api/billing/portal
 * Create a Stripe Customer Portal session
 */
router.post('/portal', async (req: any, res: Response) => {
    try {
        const validated = portalSchema.parse(req.body);
        const { returnUrl } = validated;

        const billingConfig = getStripeBillingConfig();
        if (!billingConfig.secretKeyConfigured) {
            return res.status(503).json({
                error: 'Billing portal is unavailable',
                message: getCheckoutDisabledReason(['secret_key']),
            });
        }

        const userId = req.user.id;
        const session = await StripeService.createPortalSession(
            userId,
            returnUrl || `${process.env.APP_URL || 'http://localhost:5173'}/profile`
        );

        res.json(session);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid return URL', details: error.errors });
        }
        if (String(error?.message || '').toLowerCase().includes('customer')) {
            return res.status(400).json({ error: 'Stripe customer not found. Complete checkout before opening billing portal.' });
        }
        logger.error('❌ Portal error:', error.message);
        res.status(500).json({ error: 'Failed to create portal session' });
    }
});

/**
 * POST /api/billing/webhook
 * Stripe webhook handler (no auth required, verified by signature)
 */
router.post('/webhook', async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
        logger.error('❌ [CONFIG] STRIPE_WEBHOOK_SECRET not configured');
        return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
            apiVersion: '2026-01-28.clover',
        });

        const event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            webhookSecret
        );

        await StripeService.handleWebhook(event);
        res.json({ received: true });
    } catch (error: any) {
        logger.error('❌ Webhook error:', error.message);
        res.status(400).json({ error: `Webhook Error: ${error.message}` });
    }
});

export default router;
