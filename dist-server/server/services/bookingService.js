import { prisma } from '../db.js';
import { logger } from '../lib/logger.js';
import { StripeService } from './stripeService.js';
export class BookingService {
    /**
     * Create a new booking and return a Stripe Checkout session
     */
    static async createBooking(userId, advisorId, estateId, hours = 1) {
        logger.info(`📅 Creating booking for user ${userId} with advisor ${advisorId}`);
        const advisor = await prisma.advisorProfile.findUnique({
            where: { id: advisorId },
            include: { user: true }
        });
        if (!advisor || !advisor.isVerified) {
            throw new Error('Advisor not found or not verified');
        }
        const hourlyRate = Number(advisor.hourlyRate);
        const totalAmount = hourlyRate * hours;
        const platformFee = totalAmount * this.PLATFORM_FEE_PERCENT;
        const advisorPayout = totalAmount - platformFee;
        const escrowReleaseDate = new Date();
        escrowReleaseDate.setDate(escrowReleaseDate.getDate() + this.ESCROW_DAYS);
        const booking = await prisma.booking.create({
            data: {
                userId,
                advisorId,
                estateId,
                totalAmount,
                platformFee,
                advisorPayout,
                escrowReleaseDate,
                status: 'PENDING',
                payoutStatus: 'UNPAID'
            }
        });
        // In a real app, we'd use Stripe Checkout here
        // For this prototype, we'll simulate the payment completion if needed
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
                await StripeService.transferToAdvisor(booking.advisor.stripeAccountId, Number(booking.advisorPayout), booking.stripePaymentId || '' // In real app, this would be the actual PI ID
                );
                await prisma.booking.update({
                    where: { id: booking.id },
                    data: { payoutStatus: 'PAID' }
                });
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
            include: { advisor: { include: { user: true } } }
        });
    }
    /**
     * Get advisor's bookings
     */
    static async getAdvisorBookings(advisorId) {
        return prisma.booking.findMany({
            where: { advisorId },
            include: { user: true }
        });
    }
}
BookingService.PLATFORM_FEE_PERCENT = 0.20; // 20% fee
BookingService.ESCROW_DAYS = 90;
