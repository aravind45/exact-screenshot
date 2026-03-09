import { Router, Request, Response } from "express";
import { EmailService } from "../services/emailService.js";
import { logger } from "../lib/logger.js";
import Stripe from 'stripe';
import { DurableWorkflowService } from "../services/durableWorkflowService.js";

const router = Router();

/**
 * Handle inbound emails from Resend.
 * Resend sends a POST request with the email data.
 * The payload is usually JSON.
 */
router.post("/inbound-email", async (req: Request, res: Response) => {
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
    } catch (error: any) {
        logger.error("[Inbound Webhook] Error processing inbound email:", error.message);
        // Resend (and Svix) will retry on non-200. Usually we want to stop retrying if it's a code error.
        res.status(200).json({ error: error.message });
    }
});

/**
 * Handle Stripe webhooks via durable inbox pattern.
 * Endpoint verifies signature and persists event first, then async workers process it.
 */
router.post("/stripe", async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
        logger.error("[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured");
        return res.status(500).json({ error: "Webhook secret not configured" });
    }

    try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
            apiVersion: '2026-01-28.clover' as any,
        });

        const event = stripe.webhooks.constructEvent(
            (req as any).rawBody || req.body,
            sig,
            webhookSecret
        );

        const recorded = await DurableWorkflowService.recordStripeInboxEvent(event);

        // Fire-and-forget worker drain to keep webhook response path fast.
        void DurableWorkflowService.drainOnce({
            inboxSource: 'STRIPE',
            inboxLimit: 25,
            outboxLimit: 50,
        }).catch((error: any) => {
            logger.error('[Stripe Webhook] Durable drain failed:', error?.message || error);
        });

        logger.info(`[Stripe Webhook] Accepted ${event.type} (${recorded.created ? 'new' : 'duplicate'}) id=${event.id}`);
        res.json({ received: true, queued: true, duplicate: !recorded.created });
    } catch (error: any) {
        logger.error("[Stripe Webhook] Error:", error.message);
        return res.status(400).json({ error: `Webhook Error: ${error.message}` });
    }
});

export default router;
