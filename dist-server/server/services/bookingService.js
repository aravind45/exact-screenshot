import { prisma } from '../db.js';
import { logger } from '../lib/logger.js';
import { StripeService } from './stripeService.js';
export class BookingService {
    /**
     * Create a new booking with session details
     */
    static async createBooking(data) {
        logger.info(`📅 Creating booking for user ${data.userId} with advisor ${data.advisorId}`);
        const advisor = await prisma.advisorProfile.findUnique({
            where: { id: data.advisorId },
            include: { user: true }
        });
        if (!advisor || !advisor.isVerified) {
            throw new Error('Advisor not found or not verified');
        }
        if (!advisor.stripeAccountId) {
            throw new Error('Advisor has not completed Stripe onboarding');
        }
        const hourlyRate = Number(advisor.hourlyRate);
        const totalAmount = hourlyRate * data.sessionDuration;
        const platformFee = totalAmount * this.PLATFORM_FEE_PERCENT;
        const advisorPayout = totalAmount - platformFee;
        const escrowReleaseDate = new Date();
        escrowReleaseDate.setDate(escrowReleaseDate.getDate() + this.ESCROW_DAYS);
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
                status: 'REQUESTED',
                payoutStatus: 'UNPAID',
            },
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
    static async createPaymentIntent(bookingId) {
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
        const paymentIntent = await StripeService.createBookingPaymentIntent(bookingId, Number(booking.totalAmount), booking.advisor.stripeAccountId);
        return paymentIntent;
    }
    /**
     * Confirm a booking (advisor accepts)
     */
    static async confirmBooking(bookingId, advisorId) {
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
    static async cancelBooking(bookingId, userId, reason) {
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
            await StripeService.processBookingRefund(bookingId, Number(booking.totalAmount), reason);
        }
        else {
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
    static async getBooking(bookingId, userId) {
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
     * Process due payouts (Cron Job candidate)
     */
    static async processDuePayouts() {
        logger.info("💸 Processing due advisor payouts...");
        const now = new Date();
        const dueBookings = await prisma.booking.findMany({
            where: {
                status: 'COMPLETED', // Only pay for completed services
                payoutStatus: 'UNPAID',
                escrowReleaseDate: { lte: now }
            },
            include: {
                advisor: true
            }
        });
        logger.info(`Found ${dueBookings.length} bookings due for payout`);
        for (const booking of dueBookings) {
            try {
                if (!booking.advisor.stripeAccountId) {
                    logger.warn(`⚠️ Advisor ${booking.advisorId} has no Stripe account linked`);
                    continue;
                }
                // Send transfer via Stripe Connect
                await StripeService.releaseBookingEscrow(booking.id);
                logger.info(`✅ Paid advisor for booking ${booking.id}`);
            }
            catch (error) {
                logger.error(`❌ Failed to process payout for booking ${booking.id}: ${error.message}`);
            }
        }
    }
    /**
     * Get user's bookings
     */
    static async getUserBookings(userId) {
        return prisma.booking.findMany({
            where: { userId },
            include: { advisor: { include: { user: true } }, estate: true },
            orderBy: { createdAt: 'desc' }
        });
    }
    /**
     * Get advisor's bookings
     */
    static async getAdvisorBookings(advisorId) {
        return prisma.booking.findMany({
            where: { advisorId },
            include: { user: true, estate: true },
            orderBy: { createdAt: 'desc' }
        });
    }
}
BookingService.PLATFORM_FEE_PERCENT = 0.20; // 20% fee
BookingService.ESCROW_DAYS = 90;
