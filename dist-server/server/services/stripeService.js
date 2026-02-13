import Stripe from 'stripe';
import { prisma } from '../db.js';
import crypto from 'crypto';
import { logger } from '../lib/logger.js';
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
                trial_period_days: 7,
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
        logger.info(`📨 Stripe webhook received: ${event.type}`);
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const userId = session.metadata?.userId;
                if (!userId)
                    break;
                // Handle Subscriptions
                if (session.mode === 'subscription') {
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
                    logger.info(`✅ Subscription activated for user ${userId}`);
                }
                // Handle Extra Seats
                if (session.metadata?.type === 'EXTRA_SEAT') {
                    const { estateId, inviteeEmail, inviteeRole } = session.metadata;
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
                    logger.info(`✅ Extra seat invitation created for ${inviteeEmail}`);
                }
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
                    logger.info(`✅ Subscription status updated for user ${user.id}: ${subscription.status}`);
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
                    logger.info(`✅ Subscription cancelled for user ${user.id}`);
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
                    logger.info(`✅ Payment logged for user ${user.id}`);
                }
                break;
            }
            default:
                logger.warn(`⚠️ Unhandled event type: ${event.type}`);
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
        logger.info(`✅ Fees waived for user ${userId}`);
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
        logger.info(`✅ Refund issued for transaction ${transactionId}`);
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
    /**
     * Create a Stripe Connect Express account for an advisor
     */
    static async createConnectAccount(userId) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new Error('User not found');
        const account = await this.stripe.accounts.create({
            type: 'express',
            email: user.email,
            capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true },
            },
            metadata: { userId },
        });
        await prisma.advisorProfile.update({
            where: { userId },
            data: { stripeAccountId: account.id },
        });
        return account;
    }
    /**
     * Create an account link for Stripe Connect onboarding
     */
    static async createAccountLink(accountId, returnUrl, refreshUrl) {
        return this.stripe.accountLinks.create({
            account: accountId,
            refresh_url: refreshUrl,
            return_url: returnUrl,
            type: 'account_onboarding',
        });
    }
    /**
     * Create a Transfer to an advisor's Connect account
     */
    static async transferToAdvisor(accountId, amount, paymentIntentId) {
        return this.stripe.transfers.create({
            amount: Math.round(amount * 100),
            currency: 'usd',
            destination: accountId,
            source_transaction: paymentIntentId,
        });
    }
    /**
     * Get the status of a Stripe Connect account
     */
    static async getAccountStatus(stripeAccountId) {
        try {
            const account = await this.stripe.accounts.retrieve(stripeAccountId);
            return {
                detailsSubmitted: account.details_submitted,
                chargesEnabled: account.charges_enabled,
                payoutsEnabled: account.payouts_enabled,
            };
        }
        catch (error) {
            logger.error('Error getting account status:', error.message);
            throw error;
        }
    }
    /**
     * Create a payment intent for a booking
     */
    static async createBookingPaymentIntent(bookingId, amount, advisorStripeAccountId) {
        try {
            const platformFee = Math.round(amount * this.PLATFORM_FEE_PERCENTAGE);
            const paymentIntent = await this.stripe.paymentIntents.create({
                amount: Math.round(amount * 100), // Convert to cents
                currency: 'usd',
                application_fee_amount: platformFee * 100,
                transfer_data: {
                    destination: advisorStripeAccountId,
                },
                metadata: {
                    bookingId,
                    type: 'ADVISOR_BOOKING',
                },
            });
            // Update booking with payment intent ID
            await prisma.booking.update({
                where: { id: bookingId },
                data: { stripePaymentId: paymentIntent.id }
            });
            logger.info(`Payment intent created for booking ${bookingId}: ${paymentIntent.id}`);
            return {
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id,
            };
        }
        catch (error) {
            logger.error('Error creating booking payment intent:', error.message);
            throw error;
        }
    }
    /**
     * Capture a booking payment (called after payment intent succeeds)
     */
    static async captureBookingPayment(paymentIntentId) {
        try {
            const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
            if (paymentIntent.status !== 'succeeded') {
                throw new Error('Payment intent has not succeeded');
            }
            const bookingId = paymentIntent.metadata.bookingId;
            // Update booking status and set escrow release date
            await prisma.booking.update({
                where: { id: bookingId },
                data: {
                    status: 'CONFIRMED',
                    payoutStatus: 'ESCROWED',
                    escrowReleaseDate: new Date(Date.now() + this.ESCROW_DAYS * 24 * 60 * 60 * 1000)
                }
            });
            logger.info(`✅ Booking payment captured for ${bookingId}`);
            return { success: true };
        }
        catch (error) {
            logger.error('Error capturing booking payment:', error.message);
            throw error;
        }
    }
    /**
     * Release escrow and payout to advisor
     */
    static async releaseBookingEscrow(bookingId) {
        try {
            const booking = await prisma.booking.findUnique({
                where: { id: bookingId },
                include: { advisor: true }
            });
            if (!booking) {
                throw new Error('Booking not found');
            }
            if (!booking.advisor.stripeAccountId) {
                throw new Error('Advisor does not have a Stripe account');
            }
            if (booking.payoutStatus === 'PAID') {
                throw new Error('Escrow already released');
            }
            // Create transfer to advisor
            const transfer = await this.stripe.transfers.create({
                amount: Math.round(Number(booking.advisorPayout) * 100),
                currency: 'usd',
                destination: booking.advisor.stripeAccountId,
                metadata: {
                    bookingId: booking.id,
                },
            });
            // Update booking payout status
            await prisma.booking.update({
                where: { id: bookingId },
                data: { payoutStatus: 'PAID' }
            });
            logger.info(`✅ Escrow released for booking ${bookingId}, transfer: ${transfer.id}`);
            return { transferId: transfer.id };
        }
        catch (error) {
            logger.error('Error releasing booking escrow:', error.message);
            throw error;
        }
    }
    /**
     * Calculate platform fee and advisor payout for a booking
     */
    static calculateBookingFees(totalAmount) {
        const platformFee = totalAmount * this.PLATFORM_FEE_PERCENTAGE;
        const advisorPayout = totalAmount - platformFee;
        return {
            totalAmount,
            platformFee,
            advisorPayout,
        };
    }
    /**
     * Process a refund for a cancelled booking
     */
    static async processBookingRefund(bookingId, amount, reason) {
        try {
            const booking = await prisma.booking.findUnique({
                where: { id: bookingId }
            });
            if (!booking?.stripePaymentId) {
                throw new Error('Booking does not have a payment ID');
            }
            const refund = await this.stripe.refunds.create({
                payment_intent: booking.stripePaymentId,
                amount: Math.round(amount * 100),
                reason: 'requested_by_customer',
            });
            // Update booking with refund info
            await prisma.booking.update({
                where: { id: bookingId },
                data: {
                    status: 'REFUNDED',
                    refundAmount: amount,
                    refundedAt: new Date(),
                    cancellationReason: reason,
                }
            });
            logger.info(`✅ Refund processed for booking ${bookingId}: ${refund.id}`);
            return { refundId: refund.id };
        }
        catch (error) {
            logger.error('Error processing booking refund:', error.message);
            throw error;
        }
    }
}
StripeService._stripe = null;
// ========== ADVISOR BOOKING PAYMENT METHODS ==========
StripeService.PLATFORM_FEE_PERCENTAGE = 0.20; // 20% platform fee
StripeService.ESCROW_DAYS = 90; // 90-day escrow period
