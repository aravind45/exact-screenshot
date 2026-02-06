import { Router } from 'express';
import { StripeService } from '../services/stripeService.js';
import Stripe from 'stripe';
const router = Router();
/**
 * POST /api/billing/checkout
 * Create a Stripe Checkout session
 */
router.post('/checkout', async (req, res) => {
    try {
        const userId = req.user.id;
        const { successUrl, cancelUrl } = req.body;
        const session = await StripeService.createCheckoutSession(userId, successUrl || `${process.env.APP_URL || 'http://localhost:5173'}/dashboard?payment=success`, cancelUrl || `${process.env.APP_URL || 'http://localhost:5173'}/pricing?payment=cancelled`);
        res.json(session);
    }
    catch (error) {
        console.error('❌ Checkout error:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * GET /api/billing/status
 * Get current subscription status
 */
router.get('/status', async (req, res) => {
    try {
        const userId = req.user.id;
        const status = await StripeService.getSubscriptionStatus(userId);
        res.json(status);
    }
    catch (error) {
        console.error('❌ Status error:', error);
        res.status(500).json({ error: error.message });
    }
});
/**
 * POST /api/billing/webhook
 * Stripe webhook handler (no auth required, verified by signature)
 */
router.post('/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
        console.error('❌ STRIPE_WEBHOOK_SECRET not configured');
        return res.status(500).json({ error: 'Webhook secret not configured' });
    }
    try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
            apiVersion: '2026-01-28.clover',
        });
        const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        await StripeService.handleWebhook(event);
        res.json({ received: true });
    }
    catch (error) {
        console.error('❌ Webhook error:', error.message);
        res.status(400).json({ error: `Webhook Error: ${error.message}` });
    }
});
export default router;
