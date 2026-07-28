import Stripe from 'stripe';
import { prisma } from '../db.js';
import crypto from 'crypto';
import { logger } from '../lib/logger.js';
import { getRefundEligibility } from '../utils/refundUtils.js';
import { ADVISOR_PLATFORM_FEE_PERCENT, calculateAdvisorEscrowReleaseDate } from '../config/marketplacePayments.js';


const PRICE_ID = process.env.STRIPE_PRICE_ID || 'price_1234567890'; // $49/mo product
const EXTRA_SEAT_PRICE_ID = process.env.STRIPE_EXTRA_SEAT_PRICE_ID || 'price_extraseat_placeholder'; // $9.99 extra seat

export class StripeService {
    private static _stripe: Stripe | null = null;

    private static get stripe(): Stripe {
        if (!this._stripe) {
            this._stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
                apiVersion: '2026-01-28.clover' as any,
            });
        }
        return this._stripe;
    }

    private static get stripeSecretKey(): string {
        return (process.env.STRIPE_SECRET_KEY || "").trim();
    }

    private static isStripeMockMode(): boolean {
        const key = this.stripeSecretKey.toLowerCase();
        return !key || key.includes("placeholder") || key === "sk_test";
    }

    private static buildMockStripeAccountId(userId: string): string {
        const compact = userId.replace(/[^a-z0-9]/gi, "").slice(0, 16) || crypto.randomBytes(6).toString("hex");
        return `acct_mock_${compact}`;
    }
    /**
     * Create a Stripe Checkout Session for a user to subscribe
     */
    static async createCheckoutSession(userId: string, successUrl: string, cancelUrl: string, skipTrial = false) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error('User not found');

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
                trial_period_days: 15, // matches TRIAL_DAYS in subscription middleware
            },
            return_url: `${process.env.APP_URL || 'http://localhost:5173'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            metadata: { userId },
        });

        return { clientSecret: session.client_secret, sessionId: session.id };
    }

    /**
     * Create a Stripe Checkout Session for an extra collaborator seat ($9.99)
     */
    static async createExtraSeatCheckoutSession(userId: string, estateId: string, inviteeEmail: string, inviteeRole: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error('User not found');

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
    static async createPortalSession(userId: string, returnUrl: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.stripeCustomerId) throw new Error('Stripe customer not found');

        const session = await this.stripe.billingPortal.sessions.create({
            customer: user.stripeCustomerId,
            return_url: returnUrl,
        });

        return { url: session.url };
    }

    /**
     * Handle Stripe webhook events
     */
    static async handleWebhook(event: Stripe.Event) {
        logger.info(`📨 Stripe webhook received: ${event.type}`);

        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const userId = session.metadata?.userId;
                if (!userId) break;

                // Handle Subscriptions
                if (session.mode === 'subscription') {
                    const subscription = await this.stripe.subscriptions.retrieve(session.subscription as string);

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
                            stripePaymentIntentId: session.payment_intent as string,
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
                            stripePaymentIntentId: session.payment_intent as string,
                            type: 'PAYMENT',
                            notes: `Extra seat for ${inviteeEmail} in estate ${estateId}`,
                        },
                    });

                    logger.info(`✅ Extra seat invitation created for ${inviteeEmail}`);
                }
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer as string;

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
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer as string;

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
                const invoice = event.data.object as Stripe.Invoice;
                const customerId = invoice.customer as string;

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
                            stripePaymentIntentId: (typeof (invoice as any).payment_intent === 'string' ? (invoice as any).payment_intent : (invoice as any).payment_intent?.id) as string,
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
    static async waiveFees(userId: string, adminNotes: string) {
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
     * Refund a marketplace booking payment via Stripe.
     * Returns a structured result so callers can persist refund state honestly:
     *  - refunded: a real Stripe refund was created (or already existed)
     *  - skipped: no captured payment exists to refund (nothing was ever charged)
     * Throws on Stripe API failure so callers can decide how to handle it.
     */
    static async refundBookingPayment(bookingId: string, amountCents?: number) {
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            select: { id: true, stripePaymentId: true, totalAmount: true },
        });

        if (!booking) {
            throw new Error('Booking not found');
        }

        if (!booking.stripePaymentId) {
            return { refunded: false, skipped: true, reason: 'Booking has no recorded payment' };
        }

        if (this.isStripeMockMode()) {
            logger.warn(`⚠️ Stripe mock mode active; skipping real refund for booking ${bookingId}`);
            return { refunded: true, mock: true, refundId: null };
        }

        const paymentIntent = await this.stripe.paymentIntents.retrieve(booking.stripePaymentId);
        if (paymentIntent.status !== 'succeeded') {
            return { refunded: false, skipped: true, reason: `Payment intent is ${paymentIntent.status}; nothing captured to refund` };
        }

        // Idempotency: never double-refund the same payment intent
        const existingRefunds = await this.stripe.refunds.list({
            payment_intent: booking.stripePaymentId,
            limit: 10,
        });
        const alreadyRefundedCents = existingRefunds.data
            .filter(r => r.status !== 'failed' && r.status !== 'canceled')
            .reduce((sum, r) => sum + (r.amount || 0), 0);
        const requestedCents = amountCents ?? Math.round(Number(booking.totalAmount) * 100);

        if (alreadyRefundedCents >= requestedCents) {
            logger.info(`ℹ️ Booking ${bookingId} payment already refunded (${alreadyRefundedCents}¢)`);
            return { refunded: true, alreadyRefunded: true, refundId: existingRefunds.data[0]?.id ?? null };
        }

        const remainingCents = requestedCents - alreadyRefundedCents;
        const refund = await this.stripe.refunds.create({
            payment_intent: booking.stripePaymentId,
            amount: remainingCents,
            metadata: { bookingId, type: 'ADVISOR_BOOKING_REFUND' },
        }, {
            idempotencyKey: `refund-booking-${bookingId}-${remainingCents}`,
        });

        logger.info(`✅ Refunded ${remainingCents}¢ for booking ${bookingId} (refund ${refund.id})`);
        return { refunded: true, refundId: refund.id, amountCents: remainingCents };
    }

    /**
     * Admin: Issue a refund
     */
    static async issueRefund(transactionId: string, adminNotes: string) {
        const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId },
            include: { user: true },
        });

        const eligibility = getRefundEligibility({
            type: transaction?.type,
            status: transaction?.status,
            amount: transaction?.amount as any,
            stripePaymentIntentId: transaction?.stripePaymentIntentId,
        });

        if (!eligibility.eligible) {
            throw new Error(eligibility.reason || 'Transaction is not refundable');
        }

        const existingRefunds = await this.stripe.refunds.list({
            payment_intent: transaction!.stripePaymentIntentId as string,
            limit: 1,
        });

        if (existingRefunds.data.length > 0) {
            throw new Error('This payment already has a refund recorded in Stripe');
        }

        // Issue refund via Stripe
        const refund = await this.stripe.refunds.create({
            payment_intent: transaction!.stripePaymentIntentId as string,
        });

        // Log refund transaction
        await prisma.transaction.create({
            data: {
                userId: transaction!.userId,
                amount: -transaction!.amount,
                currency: transaction!.currency,
                status: 'REFUNDED',
                stripePaymentIntentId: refund.id,
                type: 'REFUND',
                notes: `refund_of:${transactionId} | ${adminNotes}`,
            },
        });

        logger.info(`✅ Refund issued for transaction ${transactionId}`);
        return refund;
    }
    /**
     * Get subscription status for a user
     */
    static async getSubscriptionStatus(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                subscriptionStatus: true,
                stripeSubscriptionId: true,
                stripeCustomerId: true,
            },
        });

        if (!user) throw new Error('User not found');

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
    static async createConnectAccount(userId: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error('User not found');

        if (this.isStripeMockMode()) {
            const mockAccountId = this.buildMockStripeAccountId(userId);
            await prisma.advisorProfile.update({
                where: { userId },
                data: { stripeAccountId: mockAccountId },
            });
            logger.warn(`⚠️ Stripe mock mode active; created mock Connect account ${mockAccountId} for user ${userId}`);
            return { id: mockAccountId } as any;
        }

        try {
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
        } catch (error: any) {
            if (error.message?.includes('permission') || error.type?.includes('StripePermissionError')) {
                logger.error(`🚨 Stripe Permission Error: Your API key lacks the required permissions for Connect operations. Please ensure 'Accounts' and 'Connected accounts' write permissions are granted to your Restricted Key in the Stripe Dashboard.`);
            }
            throw error;
        }
    }
    /**
     * Create an account link for Stripe Connect onboarding
     */
    static async createAccountLink(accountId: string, returnUrl: string, refreshUrl: string) {
        if (this.isStripeMockMode()) {
            const token = encodeURIComponent(accountId);
            return {
                url: `https://connect.stripe.com/setup/s/${token}`
            } as any;
        }

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
    static async transferToAdvisor(accountId: string, amount: number, paymentIntentId: string) {
        return this.stripe.transfers.create({
            amount: Math.round(amount * 100),
            currency: 'usd',
            destination: accountId,
            source_transaction: paymentIntentId,
        });
    }

    // ========== ADVISOR BOOKING PAYMENT METHODS ==========

    private static readonly PLATFORM_FEE_PERCENTAGE = ADVISOR_PLATFORM_FEE_PERCENT; // 20% platform fee

    /**
     * Get the status of a Stripe Connect account
     */
    static async getAccountStatus(stripeAccountId: string) {
        if (this.isStripeMockMode() && stripeAccountId.startsWith("acct_mock_")) {
            return {
                detailsSubmitted: false,
                chargesEnabled: false,
                payoutsEnabled: false,
            };
        }

        try {
            const account = await this.stripe.accounts.retrieve(stripeAccountId);

            return {
                detailsSubmitted: account.details_submitted,
                chargesEnabled: account.charges_enabled,
                payoutsEnabled: account.payouts_enabled,
            };
        } catch (error: any) {
            logger.error('Error getting account status:', error.message);
            throw error;
        }
    }

    /**
     * Create a payment intent for a booking.
     * Funds remain on the platform and are transferred to advisor after escrow release.
     */
    static async createBookingPaymentIntent(bookingId: string, amountDollars: number, _advisorStripeAccountId: string) {
        try {
            const amountCents = Math.round(amountDollars * 100);
            if (amountCents <= 0) {
                throw new Error('Invalid booking amount');
            }

            if (this.isStripeMockMode()) {
                const mockIntentId = `pi_mock_${crypto.randomBytes(8).toString('hex')}`;
                const mockClientSecret = `${mockIntentId}_secret_mock`;

                await prisma.booking.update({
                    where: { id: bookingId },
                    data: { stripePaymentId: mockIntentId }
                });

                logger.warn(`⚠️ Stripe mock mode active; created mock booking payment intent ${mockIntentId} for booking ${bookingId}`);

                return {
                    clientSecret: mockClientSecret,
                    paymentIntentId: mockIntentId,
                };
            }
            const paymentIntent = await this.stripe.paymentIntents.create({
                amount: amountCents,
                currency: 'usd',
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
        } catch (error: any) {
            logger.error('Error creating booking payment intent:', error.message);
            throw error;
        }
    }

    /**
     * Capture a booking payment (called after payment intent succeeds)
     */
    static async captureBookingPayment(paymentIntentId: string) {
        try {
            const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

            if (paymentIntent.status !== 'succeeded') {
                throw new Error('Payment intent has not succeeded');
            }

            const bookingId = paymentIntent.metadata.bookingId;
            if (!bookingId) {
                throw new Error('Payment intent missing bookingId metadata');
            }

            const booking = await prisma.booking.findUnique({
                where: { id: bookingId },
                select: {
                    id: true,
                    status: true,
                    endTime: true,
                    payoutStatus: true,
                    escrowReleaseDate: true,
                },
            });

            if (!booking) {
                throw new Error('Booking not found');
            }

            if (booking.status === 'CANCELLED' || booking.status === 'REFUNDED') {
                logger.warn(`Skipping payment capture status update for ${bookingId}; current status=${booking.status}`);
                return { success: false, skipped: true, bookingId };
            }

            if (booking.payoutStatus === 'ESCROWED' || booking.payoutStatus === 'PAID') {
                logger.info(`ℹ️ Payment capture already applied for ${bookingId}; payoutStatus=${booking.payoutStatus}`);
                return {
                    success: true,
                    bookingId,
                    alreadyCaptured: true,
                    escrowReleaseDate: booking.escrowReleaseDate?.toISOString?.() ?? null,
                };
            }

            const now = new Date();
            const escrowBaseDate = booking.endTime > now ? booking.endTime : now;
            const escrowReleaseDate = calculateAdvisorEscrowReleaseDate(escrowBaseDate);

            await prisma.booking.update({
                where: { id: bookingId },
                data: {
                    status: 'CONFIRMED',
                    payoutStatus: 'ESCROWED',
                    escrowReleaseDate,
                }
            });

            logger.info(`✅ Booking payment captured for ${bookingId}`);

            return {
                success: true,
                bookingId,
                escrowReleaseDate: escrowReleaseDate.toISOString(),
            };
        } catch (error: any) {
            logger.error('Error capturing booking payment:', error.message);
            throw error;
        }
    }
    static async releaseBookingEscrow(bookingId: string) {
        try {
            const booking = await prisma.booking.findUnique({
                where: { id: bookingId },
                include: { advisor: true, dispute: true }
            });

            if (!booking) {
                throw new Error('Booking not found');
            }

            // An open dispute freezes the payout until an admin resolves it.
            if (booking.dispute && booking.dispute.status === 'OPEN') {
                throw new Error(`Payout frozen: booking ${bookingId} has an open dispute (${booking.dispute.id})`);
            }

            if (!booking.advisor.stripeAccountId) {
                throw new Error('Advisor does not have a Stripe account');
            }

            if (!booking.stripePaymentId) {
                throw new Error('Booking does not have a successful payment to release');
            }

            if (booking.status !== 'COMPLETED') {
                throw new Error('Escrow can only be released for completed bookings');
            }

            if (!booking.escrowReleaseDate || booking.escrowReleaseDate > new Date()) {
                throw new Error('Escrow hold period has not ended');
            }

            if (booking.payoutStatus === 'PAID') {
                throw new Error('Escrow already released');
            }

            if (booking.payoutStatus !== 'ESCROWED' && booking.payoutStatus !== 'UNPAID') {
                throw new Error(`Booking payout status ${booking.payoutStatus} is not eligible for release`);
            }

            const paymentIntent = await this.stripe.paymentIntents.retrieve(booking.stripePaymentId);
            if (paymentIntent.status !== 'succeeded') {
                throw new Error('Cannot release payout for a payment that did not succeed');
            }

            // Legacy destination-charge flow already sent funds to advisor at payment time.
            if (paymentIntent.transfer_data?.destination) {
                await prisma.booking.update({
                    where: { id: bookingId },
                    data: { payoutStatus: 'PAID' },
                });

                logger.info(`ℹ️ Booking ${bookingId} used legacy destination charge; marked payout as PAID`);
                return { transferId: null, alreadyTransferred: true };
            }

            const transferPayload: Stripe.TransferCreateParams = {
                amount: Math.round(Number(booking.advisorPayout) * 100),
                currency: 'usd',
                destination: booking.advisor.stripeAccountId,
                metadata: {
                    bookingId: booking.id,
                },
            };

            const latestChargeId =
                typeof paymentIntent.latest_charge === 'string'
                    ? paymentIntent.latest_charge
                    : paymentIntent.latest_charge?.id;

            if (latestChargeId) {
                transferPayload.source_transaction = latestChargeId;
            }

            // Create transfer to advisor
            const transfer = await this.stripe.transfers.create(transferPayload);

            // Update booking payout status
            await prisma.booking.update({
                where: { id: bookingId },
                data: { payoutStatus: 'PAID' }
            });

            logger.info(`✅ Escrow released for booking ${bookingId}, transfer: ${transfer.id}`);

            return { transferId: transfer.id };
        } catch (error: any) {
            logger.error('Error releasing booking escrow:', error.message);
            throw error;
        }
    }

    /**
     * Calculate platform fee and advisor payout for a booking
     */
    static calculateBookingFees(totalAmount: number) {
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
    static async processBookingRefund(bookingId: string, amount: number, reason?: string) {
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
        } catch (error: any) {
            logger.error('Error processing booking refund:', error.message);
            throw error;
        }
    }
}

