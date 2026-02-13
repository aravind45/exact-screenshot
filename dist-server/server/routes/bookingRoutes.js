import { Router } from 'express';
import { BookingService } from '../services/bookingService.js';
import { authenticate } from '../middleware/auth.js';
import { bookingCreationLimiter, paymentIntentLimiter } from '../middleware/rateLimiter.js';
import { logger } from '../lib/logger.js';
import { z } from 'zod';
const router = Router();
// Validation schemas
const createBookingSchema = z.object({
    advisorId: z.string(),
    estateId: z.string().optional(),
    sessionDuration: z.number().min(1).max(8),
    sessionDate: z.string().datetime()
});
const cancelBookingSchema = z.object({
    reason: z.string().optional()
});
/**
 * POST /api/bookings
 * Create a new booking
 */
router.post('/', authenticate, bookingCreationLimiter, async (req, res) => {
    try {
        const data = createBookingSchema.parse(req.body);
        const booking = await BookingService.createBooking({
            userId: req.user.id,
            advisorId: data.advisorId,
            estateId: data.estateId,
            sessionDuration: data.sessionDuration,
            sessionDate: new Date(data.sessionDate)
        });
        res.status(201).json(booking);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid request data', details: error.errors });
        }
        logger.error(`❌ Error creating booking: ${error.message}`);
        res.status(400).json({ error: error.message });
    }
});
/**
 * POST /api/bookings/:id/payment
 * Create payment intent for a booking
 */
router.post('/:id/payment', authenticate, paymentIntentLimiter, async (req, res) => {
    try {
        const bookingId = req.params.id;
        // Verify user owns this booking
        await BookingService.getBooking(bookingId, req.user.id);
        const paymentIntent = await BookingService.createPaymentIntent(bookingId);
        res.json(paymentIntent);
    }
    catch (error) {
        logger.error(`❌ Error creating payment intent: ${error.message}`);
        res.status(500).json({ error: error.message || 'Failed to create payment intent' });
    }
});
/**
 * GET /api/bookings/my-bookings
 * Get bookings for the current user (as a client)
 */
router.get('/my-bookings', authenticate, async (req, res) => {
    try {
        const bookings = await BookingService.getUserBookings(req.user.id);
        res.json(bookings);
    }
    catch (error) {
        logger.error(`❌ Error fetching user bookings: ${error.message}`);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});
/**
 * GET /api/bookings/advisor-bookings
 * Get bookings for the current user (as an advisor)
 */
router.get('/advisor-bookings', authenticate, async (req, res) => {
    try {
        // We need to find the advisor profile for this user first
        const { prisma } = await import('../db.js');
        const profile = await prisma.advisorProfile.findUnique({
            where: { userId: req.user.id }
        });
        if (!profile) {
            return res.status(404).json({ error: 'Advisor profile not found' });
        }
        const bookings = await BookingService.getAdvisorBookings(profile.id);
        res.json(bookings);
    }
    catch (error) {
        logger.error(`❌ Error fetching advisor bookings: ${error.message}`);
        res.status(500).json({ error: 'Failed to fetch advisor bookings' });
    }
});
/**
 * GET /api/bookings/:id
 * Get a single booking
 */
router.get('/:id', authenticate, async (req, res) => {
    try {
        const booking = await BookingService.getBooking(req.params.id, req.user.id);
        res.json(booking);
    }
    catch (error) {
        logger.error(`❌ Error fetching booking: ${error.message}`);
        res.status(error.message === 'Unauthorized' ? 403 : 500).json({
            error: error.message || 'Failed to fetch booking'
        });
    }
});
/**
 * POST /api/bookings/:id/confirm
 * Confirm a booking (advisor only)
 */
router.post('/:id/confirm', authenticate, async (req, res) => {
    try {
        const { prisma } = await import('../db.js');
        const advisor = await prisma.advisorProfile.findUnique({
            where: { userId: req.user.id }
        });
        if (!advisor) {
            return res.status(403).json({ error: 'Only advisors can confirm bookings' });
        }
        const booking = await BookingService.confirmBooking(req.params.id, advisor.id);
        res.json(booking);
    }
    catch (error) {
        logger.error(`❌ Error confirming booking: ${error.message}`);
        res.status(500).json({ error: error.message || 'Failed to confirm booking' });
    }
});
/**
 * POST /api/bookings/:id/cancel
 * Cancel a booking
 */
router.post('/:id/cancel', authenticate, async (req, res) => {
    try {
        const data = cancelBookingSchema.parse(req.body);
        const result = await BookingService.cancelBooking(req.params.id, req.user.id, data.reason);
        res.json(result);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid request data', details: error.errors });
        }
        logger.error(`❌ Error cancelling booking: ${error.message}`);
        res.status(500).json({ error: error.message || 'Failed to cancel booking' });
    }
});
export default router;
