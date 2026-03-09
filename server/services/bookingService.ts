import { prisma } from '../db.js';
import { logger } from '../lib/logger.js';
import { StripeService } from './stripeService.js';
import { BookingPayoutSagaService } from './bookingPayoutSagaService.js';
import { DurableWorkflowService } from './durableWorkflowService.js';
import { ADVISOR_PLATFORM_FEE_PERCENT, calculateAdvisorEscrowReleaseDate } from '../config/marketplacePayments.js';

export class BookingService {
    /**
     * Create a new booking with session details — includes double-booking guard
     */
    static async createBooking(data: {
        userId: string;
        advisorId: string;
        estateId?: string;
        sessionDuration: number;
        sessionDate: Date;
    }) {
        logger.info(`📅 Creating booking for user ${data.userId} with advisor ${data.advisorId}`);

        const advisor = await prisma.advisorProfile.findUnique({
            where: { id: data.advisorId },
            include: { user: true }
        });

        if (!advisor) {
            throw new Error('Advisor not found or not verified');
        }

        const strictAdvisorEligibility = process.env.NODE_ENV === "production";
        if (!advisor.isVerified && strictAdvisorEligibility) {
            throw new Error('Advisor not found or not verified');
        }

        if (!advisor.isVerified && !strictAdvisorEligibility) {
            logger.warn(`⚠️ Allowing booking for non-verified advisor ${advisor.id} outside production`);
        }

        if (!advisor.stripeAccountId && strictAdvisorEligibility) {
            throw new Error('Advisor has not completed Stripe onboarding');
        }

        // ── Double-booking guard ─────────────────────────────────────────────
        // Calculate the session window before we check for conflicts
        const sessionStart = data.sessionDate;
        const sessionEnd = new Date(data.sessionDate.getTime() + data.sessionDuration * 3600 * 1000);

        const conflict = await prisma.booking.findFirst({
            where: {
                advisorId: data.advisorId,
                status: { in: ['REQUESTED', 'CONFIRMED'] },
                // Overlap check: existing booking starts before our end AND ends after our start
                startTime: { lt: sessionEnd },
                endTime: { gt: sessionStart },
            }
        });

        if (conflict) {
            logger.warn(`⚠️ Double-booking conflict detected for advisor ${data.advisorId} at ${sessionStart.toISOString()}`);
            throw new Error('This time slot is no longer available. Please choose a different time.');
        }
        // ────────────────────────────────────────────────────────────────────

        const hourlyRate = Number(advisor.hourlyRate);
        const totalAmount = hourlyRate * data.sessionDuration;
        const platformFee = totalAmount * ADVISOR_PLATFORM_FEE_PERCENT;
        const advisorPayout = totalAmount - platformFee;

        const escrowReleaseDate = calculateAdvisorEscrowReleaseDate(new Date());

        const booking = await prisma.booking.create({
            data: {
                userId: data.userId,
                advisorId: data.advisorId,
                estateId: data.estateId,
                startTime: data.sessionDate,
                endTime: new Date(data.sessionDate.getTime() + data.sessionDuration * 3600 * 1000),
                durationMinutes: data.sessionDuration * 60,
                timezone: 'America/New_York',
                totalAmount,
                platformFee,
                advisorPayout,
                currency: 'USD',
                escrowReleaseDate,
                status: 'REQUESTED' as any,
                payoutStatus: 'UNPAID',
            } as any,
            include: {
                user: true,
                advisor: { include: { user: true } },
                estate: true
            }
        });

        logger.info(`✅ Booking created: ${booking.id}`);
        return booking;
    }

    /**
     * Create payment intent for a booking
     */
    static async createPaymentIntent(bookingId: string) {
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: { advisor: true }
        });

        if (!booking) {
            throw new Error('Booking not found');
        }

        if (!booking.advisor.stripeAccountId && process.env.NODE_ENV === "production") {
            throw new Error('Advisor does not have a Stripe account');
        }

        const paymentIntent = await StripeService.createBookingPaymentIntent(
            bookingId,
            Number(booking.totalAmount),
            booking.advisor.stripeAccountId
        );

        return { ...paymentIntent, amount: Number(booking.totalAmount) };
    }

    /**
     * Confirm a booking (advisor accepts)
     */
    static async confirmBooking(bookingId: string, advisorId: string) {
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId }
        });

        if (!booking) {
            throw new Error('Booking not found');
        }

        if (booking.advisorId !== advisorId) {
            throw new Error('Unauthorized');
        }

        if (booking.status !== 'REQUESTED' && booking.status !== 'CONFIRMED') {
            throw new Error('Booking cannot be confirmed');
        }

        const updated = await prisma.booking.update({
            where: { id: bookingId },
            data: { status: 'CONFIRMED' },
            include: {
                user: true,
                advisor: { include: { user: true } }
            }
        });

        logger.info(`✅ Booking confirmed: ${bookingId}`);
        return updated;
    }

    /**
     * Cancel a booking
     */
    static async cancelBooking(bookingId: string, userId: string, reason?: string) {
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId }
        });

        if (!booking) {
            throw new Error('Booking not found');
        }

        if (booking.userId !== userId) {
            throw new Error('Unauthorized');
        }

        if (booking.status === 'CANCELLED' || booking.status === 'REFUNDED') {
            throw new Error('Booking is already cancelled');
        }

        // If payment was made, process refund
        if (booking.stripePaymentId && booking.status === 'CONFIRMED') {
            await StripeService.processBookingRefund(
                bookingId,
                Number(booking.totalAmount),
                reason
            );
        } else {
            // Just update status if no payment was made
            await prisma.booking.update({
                where: { id: bookingId },
                data: {
                    status: 'CANCELLED',
                    cancellationReason: reason
                }
            });
        }

        logger.info(`✅ Booking cancelled: ${bookingId}`);
        return { success: true };
    }

    /**
     * Get a single booking by ID
     */
    static async getBooking(bookingId: string, userId: string) {
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                user: true,
                advisor: { include: { user: true } },
                estate: true
            }
        });

        if (!booking) {
            throw new Error('Booking not found');
        }

        // Check authorization
        const advisor = await prisma.advisorProfile.findUnique({
            where: { id: booking.advisorId }
        });

        if (booking.userId !== userId && advisor?.userId !== userId) {
            throw new Error('Unauthorized');
        }

        return booking;
    }

        /**
     * Get escrow payout queue for admin operations.
     */
    static async getEscrowPayoutQueue(page = 1, limit = 25) {
        const safePage = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
        const safeLimit = Number.isFinite(limit) ? Math.min(100, Math.max(1, Math.floor(limit))) : 25;
        const skip = (safePage - 1) * safeLimit;
        const now = new Date();

        const baseWhere = {
            payoutStatus: { in: ['ESCROWED', 'UNPAID'] },
            stripePaymentId: { not: null },
        };

        const [bookings, total, dueCount, nextRelease] = await Promise.all([
            prisma.booking.findMany({
                where: {
                    ...baseWhere,
                    status: { in: ['CONFIRMED', 'COMPLETED'] },
                },
                include: {
                    user: { select: { id: true, fullName: true, email: true } },
                    advisor: {
                        select: {
                            id: true,
                            userId: true,
                            stripeAccountId: true,
                            user: { select: { fullName: true, email: true } },
                        },
                    },
                },
                orderBy: [
                    { escrowReleaseDate: 'asc' },
                    { createdAt: 'desc' },
                ],
                skip,
                take: safeLimit,
            }),
            prisma.booking.count({
                where: {
                    ...baseWhere,
                    status: { in: ['CONFIRMED', 'COMPLETED'] },
                },
            }),
            prisma.booking.count({
                where: {
                    ...baseWhere,
                    status: 'COMPLETED',
                    escrowReleaseDate: { not: null, lte: now },
                },
            }),
            prisma.booking.findFirst({
                where: {
                    ...baseWhere,
                    status: 'COMPLETED',
                    escrowReleaseDate: { not: null, gt: now },
                },
                orderBy: { escrowReleaseDate: 'asc' },
                select: { escrowReleaseDate: true },
            }),
        ]);

        const items = bookings.map((booking) => ({
            ...booking,
            dueForRelease:
                booking.status === 'COMPLETED' &&
                Boolean(booking.escrowReleaseDate) &&
                (booking.escrowReleaseDate as Date).getTime() <= now.getTime(),
        }));

        return {
            items,
            total,
            page: safePage,
            limit: safeLimit,
            totalPages: Math.max(1, Math.ceil(total / safeLimit)),
            dueCount,
            pendingCount: Math.max(0, total - dueCount),
            nextReleaseAt: nextRelease?.escrowReleaseDate ?? null,
        };
    }

    /**
     * Process due payouts (Cron Job candidate)
     */
    static async processDuePayouts() {
        logger.info("💸 Processing due advisor payouts...");

        const now = new Date();
        const dueBookings = await prisma.booking.findMany({
            where: {
                status: 'COMPLETED',
                payoutStatus: { in: ['ESCROWED', 'UNPAID'] },
                stripePaymentId: { not: null },
                escrowReleaseDate: { not: null, lte: now }
            },
            include: {
                advisor: {
                    select: {
                        id: true,
                        stripeAccountId: true,
                    },
                },
            }
        });

        const dueBookingIds = dueBookings.map((booking) => booking.id);

        const summary: {
            scanned: number;
            queued: number;
            processedOutbox: number;
            paid: number;
            failed: number;
            deadLettered: number;
            skippedNoStripe: number;
            failures: Array<{ bookingId: string; error: string }>;
        } = {
            scanned: dueBookings.length,
            queued: 0,
            processedOutbox: 0,
            paid: 0,
            failed: 0,
            deadLettered: 0,
            skippedNoStripe: 0,
            failures: [],
        };

        logger.info(`Found ${dueBookings.length} bookings due for payout`);

        for (const booking of dueBookings) {
            try {
                if (!booking.advisor.stripeAccountId) {
                    summary.skippedNoStripe += 1;
                    logger.warn(`⚠️ Advisor ${booking.advisorId} has no Stripe account linked`);
                    continue;
                }

                const queued = await BookingPayoutSagaService.enqueuePayoutReleaseEvent({
                    bookingId: booking.id,
                    source: 'scheduler',
                    availableAt: now,
                });
                if (queued.queued || queued.reactivated) {
                    summary.queued += 1;
                }
            } catch (error: any) {
                summary.failed += 1;
                summary.failures.push({ bookingId: booking.id, error: error.message || 'Failed to enqueue payout release' });
                logger.error(`❌ Failed to enqueue payout for booking ${booking.id}: ${error.message}`);
            }
        }

        if (summary.queued > 0) {
            const outboxSummary = await DurableWorkflowService.processOutboxBatch({
                limit: Math.max(25, summary.queued),
                eventTypes: ['booking.payout.release_due'],
            });
            summary.processedOutbox = outboxSummary.processed;
            summary.failed += outboxSummary.failed;
            summary.deadLettered = outboxSummary.deadLettered;
        }

        if (dueBookingIds.length > 0) {
            summary.paid = await prisma.booking.count({
                where: {
                    id: { in: dueBookingIds },
                    payoutStatus: 'PAID',
                },
            });
        }

        return summary;
    }
    static async autoCompleteExpiredSessions() {
        logger.info("⏰ Auto-completing past sessions...");
        const now = new Date();

        const expiredBookings = await prisma.booking.findMany({
            where: {
                status: 'CONFIRMED',
                endTime: { lt: now }
            }
        });

        logger.info(`Found ${expiredBookings.length} sessions to auto-complete`);

        for (const booking of expiredBookings) {
            try {
                const escrowReleaseDate = calculateAdvisorEscrowReleaseDate(now);

                await prisma.booking.update({
                    where: { id: booking.id },
                    data: {
                        status: 'COMPLETED',
                        escrowReleaseDate, // Reset escrow from completion time, not booking creation
                    }
                });

                await BookingPayoutSagaService.enqueueBookingCompletedEvent({
                    bookingId: booking.id,
                    source: 'auto-complete',
                });

                logger.info(`✅ Auto-completed booking ${booking.id}, escrow releases ${escrowReleaseDate.toISOString()}`);
            } catch (error: any) {
                logger.error(`❌ Failed to auto-complete booking ${booking.id}: ${error.message}`);
            }
        }
    }

    /**
     * Get user's bookings
     */
    static async getUserBookings(userId: string) {
        return prisma.booking.findMany({
            where: { userId },
            include: { advisor: { include: { user: true } }, estate: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    /**
     * Get advisor's bookings
     */
    static async getAdvisorBookings(advisorId: string) {
        return prisma.booking.findMany({
            where: { advisorId },
            include: { user: true, estate: true },
            orderBy: { createdAt: 'desc' }
        });
    }
}
