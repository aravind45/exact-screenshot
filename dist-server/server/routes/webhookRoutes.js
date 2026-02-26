import { Router } from "express";
import { EmailService } from "../services/emailService.js";
import { StripeService } from "../services/stripeService.js";
import { logger } from "../lib/logger.js";
import { prisma } from "../db.js";
import Stripe from 'stripe';
const router = Router();
/**
 * Handle inbound emails from Resend.
 * Resend sends a POST request with the email data.
 * The payload is usually JSON.
 */
router.post("/inbound-email", async (req, res) => {
    try {
        // 1. Verify that this actually came from Resend
        // If RESEND_WEBHOOK_SECRET is set, verify the signature or common secret in headers
        if (!EmailService.verifySignature(req.body, req.headers)) {
            logger.warn("[Webhook] Invalid signature received on inbound-email");
            return res.status(401).json({ error: "Invalid signature" });
        }
        // 2. Process the email content
        const result = await EmailService.processInbound(req.body);
        logger.info(`[Inbound Webhook] Processed email: ${result.status} ${result.reason || ""}`);
        // Return 200 to Resend to stop retrying
        res.status(200).json({ status: "ok", result });
    }
    catch (error) {
        logger.error("[Inbound Webhook] Error processing inbound email:", error.message);
        // Resend (and Svix) will retry on non-200. Usually we want to stop retrying if it's a code error.
        res.status(200).json({ error: error.message });
    }
});
/**
 * Handle Stripe webhooks for advisor booking payments
 * This endpoint uses raw body parsing (configured in index.ts)
 */
router.post("/stripe", async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
        logger.error("[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured");
        return res.status(500).json({ error: "Webhook secret not configured" });
    }
    try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
            apiVersion: '2026-01-28.clover',
        });
        // Verify webhook signature
        const event = stripe.webhooks.constructEvent(req.rawBody || req.body, sig, webhookSecret);
        logger.info(`[Stripe Webhook] Received event: ${event.type}`);
        // Handle different event types
        switch (event.type) {
            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object;
                // Check if this is an advisor booking payment
                if (paymentIntent.metadata.type === 'ADVISOR_BOOKING') {
                    await StripeService.captureBookingPayment(paymentIntent.id);
                    logger.info(`✅ Advisor booking payment captured: ${paymentIntent.id}`);
                }
                break;
            }
            case 'payment_intent.payment_failed': {
                const paymentIntent = event.data.object;
                logger.error(`❌ Payment failed for booking: ${paymentIntent.metadata.bookingId}`);
                if (paymentIntent.metadata.bookingId) {
                    await prisma.booking.update({
                        where: { id: paymentIntent.metadata.bookingId },
                        data: { status: 'CANCELLED' }
                    });
                }
                break;
            }
            case 'account.updated': {
                const account = event.data.object;
                logger.info(`Stripe Connect account updated: ${account.id}`);
                if (account.details_submitted) {
                    await prisma.advisorProfile.updateMany({
                        where: { stripeAccountId: account.id },
                        data: { stripeOnboardingComplete: true }
                    });
                    logger.info(`✅ Advisor onboarding marked complete for account: ${account.id}`);
                }
                break;
            }
            case 'transfer.created': {
                const transfer = event.data.object;
                logger.info(`✅ Transfer created to advisor: ${transfer.id}`);
                break;
            }
            default:
                // Handle other webhook events from existing StripeService
                await StripeService.handleWebhook(event);
        }
        res.json({ received: true });
    }
    catch (error) {
        logger.error("[Stripe Webhook] Error:", error.message);
        return res.status(400).json({ error: `Webhook Error: ${error.message}` });
    }
});
export default router;
