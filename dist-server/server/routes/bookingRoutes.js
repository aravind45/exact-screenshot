import { Router } from 'express';
import { BookingService } from '../services/bookingService.js';
import { authenticate } from '../middleware/auth.js';
import { logger } from '../lib/logger.js';
const router = Router();
/**
 * POST /api/bookings
 * Create a new booking
 */
router.post('/', authenticate, async (req, res) => {
    try {
        const { advisorId, estateId, hours } = req.body;
        const booking = await BookingService.createBooking(req.user.id, advisorId, estateId, hours);
        res.json(booking);
    }
    catch (error) {
        logger.error(`❌ Error creating booking: ${error.message}`);
        res.status(400).json({ error: error.message });
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
export default router;
