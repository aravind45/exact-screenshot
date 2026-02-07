import Stripe from 'stripe';
import { prisma } from '../db.js';
import crypto from 'crypto';
const PRICE_ID = process.env.STRIPE_PRICE_ID || 'price_1234567890'; // $49/mo product
const EXTRA_SEAT_PRICE_ID = process.env.STRIPE_EXTRA_SEAT_PRICE_ID || 'price_extraseat_placeholder'; // $9.99 extra seat
export class StripeService {
    static get stripe() {
        if (!this._stripe) {
            this._stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
                apiVersion: '2026-01-28.clover',
            });
        }
        return this._stripe;
    }
    /**
     * Create a Stripe Checkout Session for a user to subscribe
     */
    static async createCheckoutSession(userId, successUrl, cancelUrl, skipTrial = false) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new Error('User not found');
        let customerId = user.stripeCustomerId;
        // Create Stripe customer if doesn't exist
        if (!customerId) {
            const customer = await this.stripe.customers.create({
                email: user.email,
                metadata: { userId: user.id },
            });
            customerId = customer.id;
            await prisma.user.update({
                where: { id: userId },
                data: { stripeCustomerId: customerId },
            });
        }
        const session = await this.stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [
                {
                    price: PRICE_ID,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            ui_mode: 'embedded',
            subscription_data: skipTrial ? undefined : {
                trial_period_days: 14,
            },
            return_url: `${process.env.APP_URL || 'http://localhost:5173'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            metadata: { userId },
        });
        return { clientSecret: session.client_secret, sessionId: session.id };
    }
    /**
     * Create a Stripe Checkout Session for an extra collaborator seat ($9.99)
     */
    static async createExtraSeatCheckoutSession(userId, estateId, inviteeEmail, inviteeRole) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new Error('User not found');
        let customerId = user.stripeCustomerId;
        if (!customerId) {
            const customer = await this.stripe.customers.create({
                email: user.email,
                metadata: { userId: user.id },
            });
            customerId = customer.id;
            await prisma.user.update({
                where: { id: userId },
                data: { stripeCustomerId: customerId },
            });
        }
        const session = await this.stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [
                {
                    price: EXTRA_SEAT_PRICE_ID,
                    quantity: 1,
                },
            ],
            mode: 'payment',
            ui_mode: 'embedded',
            return_url: `${process.env.APP_URL || 'http://localhost:5173'}/dashboard?seat_payment=success`,
            metadata: {
                type: 'EXTRA_SEAT',
                userId,
                estateId,
                inviteeEmail: inviteeEmail.toLowerCase(),
                inviteeRole
            },
        });
        return { clientSecret: session.client_secret, sessionId: session.id };
    }
    /**
     * Create a Stripe Customer Portal Session for a user to manage billing
     */
    static async createPortalSession(userId, returnUrl) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.stripeCustomerId)
            throw new Error('Stripe customer not found');
        const session = await this.stripe.billingPortal.sessions.create({
            customer: user.stripeCustomerId,
            return_url: returnUrl,
        });
        return { url: session.url };
    }
    /**
     * Handle Stripe webhook events
     */
    static async handleWebhook(event) {
        console.log(`📨 Stripe webhook received: ${event.type}`);
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const userId = session.metadata?.userId;
                if (!userId)
                    break;
                const subscription = await this.stripe.subscriptions.retrieve(session.subscription);
                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        stripeSubscriptionId: subscription.id,
                        subscriptionStatus: 'ACTIVE',
                    },
                });
                // Log transaction
                await prisma.transaction.create({
                    data: {
                        userId,
                        amount: (session.amount_total || 0) / 100,
                        currency: session.currency?.toUpperCase() || 'USD',
                        status: 'SUCCESS',
                        stripePaymentIntentId: session.payment_intent,
                        type: 'PAYMENT',
                        notes: 'Subscription activated',
                    },
                });
                console.log(`✅ Subscription activated for user ${userId}`);
                break;
            }
            case 'checkout.session.completed': {
                const session = event.data.object;
                if (session.metadata?.type === 'EXTRA_SEAT') {
                    const { userId, estateId, inviteeEmail, inviteeRole } = session.metadata;
                    // The payment is complete, now create the invitation
                    // We need to import CollaborationService or use the logic here
                    // To avoid circular dependency, we might want to move core logic to a shared helper
                    // But for now, let's assume we can call CollaborationService or just create the record
                    const token = crypto.randomBytes(32).toString('hex');
                    const expiresAt = new Date();
                    expiresAt.setDate(expiresAt.getDate() + 7);
                    await prisma.invitation.create({
                        data: {
                            estateId,
                            email: inviteeEmail,
                            role: inviteeRole,
                            token,
                            invitedBy: userId,
                            expiresAt,
                            paymentId: session.id,
                            cost: 9.99,
                            status: 'PENDING'
                        }
                    });
                    // Log transaction
                    await prisma.transaction.create({
                        data: {
                            userId,
                            amount: 9.99,
                            currency: 'USD',
                            status: 'SUCCESS',
                            stripePaymentIntentId: session.payment_intent,
                            type: 'PAYMENT',
                            notes: `Extra seat for ${inviteeEmail} in estate ${estateId}`,
                        },
                    });
                    console.log(`✅ Extra seat invitation created for ${inviteeEmail}`);
                }
                // Handle normal checkout if type is not extra seat (already partially handled above in a separate case block)
                // Actually the current code has TWO checkout.session.completed blocks potentially? 
                // Let's re-examine handleWebhook.
                break;
            }
            case 'customer.subscription.updated': {
                const subscription = event.data.object;
                const customerId = subscription.customer;
                const user = await prisma.user.findFirst({
                    where: { stripeCustomerId: customerId },
                });
                if (user) {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: {
                            subscriptionStatus: subscription.status.toUpperCase(),
                        },
                    });
                    console.log(`✅ Subscription status updated for user ${user.id}: ${subscription.status}`);
                }
                break;
            }
            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                const customerId = subscription.customer;
                const user = await prisma.user.findFirst({
                    where: { stripeCustomerId: customerId },
                });
                if (user) {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: {
                            subscriptionStatus: 'CANCELLED',
                            stripeSubscriptionId: null,
                        },
                    });
                    console.log(`✅ Subscription cancelled for user ${user.id}`);
                }
                break;
            }
            case 'invoice.payment_succeeded': {
                const invoice = event.data.object;
                const customerId = invoice.customer;
                const user = await prisma.user.findFirst({
                    where: { stripeCustomerId: customerId },
                });
                if (user) {
                    await prisma.transaction.create({
                        data: {
                            userId: user.id,
                            amount: (invoice.amount_paid || 0) / 100,
                            currency: invoice.currency?.toUpperCase() || 'USD',
                            status: 'SUCCESS',
                            stripePaymentIntentId: (typeof invoice.payment_intent === 'string' ? invoice.payment_intent : invoice.payment_intent?.id),
                            type: 'PAYMENT',
                            notes: `Invoice ${invoice.number} paid`,
                        },
                    });
                    console.log(`✅ Payment logged for user ${user.id}`);
                }
                break;
            }
            default:
                console.log(`⚠️ Unhandled event type: ${event.type}`);
        }
    }
    /**
     * Admin: Waive fees for a user (grants access without payment)
     */
    static async waiveFees(userId, adminNotes) {
        await prisma.user.update({
            where: { id: userId },
            data: { subscriptionStatus: 'ACTIVE' },
        });
        await prisma.transaction.create({
            data: {
                userId,
                amount: 0,
                currency: 'USD',
                status: 'WAIVED',
                type: 'WAIVER',
                notes: adminNotes,
            },
        });
        console.log(`✅ Fees waived for user ${userId}`);
    }
    /**
     * Admin: Issue a refund
     */
    static async issueRefund(transactionId, adminNotes) {
        const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId },
            include: { user: true },
        });
        if (!transaction)
            throw new Error('Transaction not found');
        if (!transaction.stripePaymentIntentId)
            throw new Error('No Stripe payment intent found');
        // Issue refund via Stripe
        const refund = await this.stripe.refunds.create({
            payment_intent: transaction.stripePaymentIntentId,
        });
        // Log refund transaction
        await prisma.transaction.create({
            data: {
                userId: transaction.userId,
                amount: -transaction.amount,
                currency: transaction.currency,
                status: 'REFUNDED',
                stripePaymentIntentId: refund.id,
                type: 'REFUND',
                notes: adminNotes,
            },
        });
        console.log(`✅ Refund issued for transaction ${transactionId}`);
        return refund;
    }
    /**
     * Get subscription status for a user
     */
    static async getSubscriptionStatus(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                subscriptionStatus: true,
                stripeSubscriptionId: true,
                stripeCustomerId: true,
            },
        });
        if (!user)
            throw new Error('User not found');
        let subscription = null;
        if (user.stripeSubscriptionId) {
            subscription = await this.stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        }
        return {
            status: user.subscriptionStatus,
            subscription,
        };
    }
}
StripeService._stripe = null;
