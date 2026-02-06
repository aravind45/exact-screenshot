import Stripe from 'stripe';
import { prisma } from '../db.js';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2026-01-28.clover',
});
const PRICE_ID = process.env.STRIPE_PRICE_ID || 'price_1234567890'; // $49/mo product
export class StripeService {
    /**
     * Create a Stripe Checkout Session for a user to subscribe
     */
    static async createCheckoutSession(userId, successUrl, cancelUrl) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new Error('User not found');
        let customerId = user.stripeCustomerId;
        // Create Stripe customer if doesn't exist
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: { userId: user.id },
            });
            customerId = customer.id;
            await prisma.user.update({
                where: { id: userId },
                data: { stripeCustomerId: customerId },
            });
        }
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [
                {
                    price: PRICE_ID,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: { userId },
        });
        return { sessionId: session.id, url: session.url };
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
                const subscription = await stripe.subscriptions.retrieve(session.subscription);
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
        const refund = await stripe.refunds.create({
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
            subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        }
        return {
            status: user.subscriptionStatus,
            subscription,
        };
    }
}
