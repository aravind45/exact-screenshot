import { Router } from 'express';
import { AdvisorService } from '../services/advisorService.js';
import { StripeService } from '../services/stripeService.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdvisor, requireAdmin } from '../middleware/authorization.js';
import { profileUpdateLimiter } from '../middleware/rateLimiter.js';
import { logger } from '../lib/logger.js';

const router = Router();

/**
 * GET /api/advisors/me
 * Get current user's advisor profile
 */
router.get('/me', authenticate, async (req: any, res) => {
    try {
        const profile = await AdvisorService.getAdvisorProfile(req.user!.id);

        // Return null if no profile exists (don't error)
        if (!profile) {
            return res.json(null);
        }

        res.json(profile);
    } catch (error: any) {
        logger.error(`❌ Error fetching advisor profile: ${error.message}`);
        res.status(500).json({ error: 'Failed to fetch advisor profile' });
    }
});

/**
 * POST /api/advisors/profile
 * Create or update advisor profile
 */
router.post('/profile', authenticate, profileUpdateLimiter, async (req: any, res) => {
    try {
        const profile = await AdvisorService.updateAdvisorProfile(req.user!.id, req.body);
        res.json(profile);
    } catch (error: any) {
        logger.error(`❌ Error updating advisor profile: ${error.message}`);
        res.status(500).json({ error: 'Failed to update advisor profile' });
    }
});

/**
 * GET /api/advisors/marketplace
 * List verified advisors
 */
router.get('/marketplace', async (req, res) => {
    try {
        const { expertise, maxRate } = req.query;
        const advisors = await AdvisorService.listMarketplaceAdvisors({
            expertise: expertise as string,
            maxRate: maxRate ? parseFloat(maxRate as string) : undefined
        });
        res.json(advisors);
    } catch (error: any) {
        logger.error(`❌ Error listing marketplace advisors: ${error.message}`);
        res.status(500).json({ error: 'Failed to list advisors' });
    }
});

/**
 * GET /api/advisors/admin/list (Admin Only)
 */
router.get('/admin/list', authenticate, async (req: any, res) => {
    try {
        if (req.user!.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        const advisors = await AdvisorService.listAllAdvisors();
        res.json(advisors);
    } catch (error: any) {
        logger.error(`❌ Error listing all advisors: ${error.message}`);
        res.status(500).json({ error: 'Failed to list advisors' });
    }
});

/**
 * POST /api/advisors/:id/verify (Admin Only)
 */
router.post('/:id/verify', authenticate, async (req: any, res) => {
    try {
        // Basic admin check (this should be replaced with a more robust role-based check)
        if (req.user!.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const { status } = req.body;
        const profile = await AdvisorService.adminVerifyAdvisor(req.params.id, status);
        res.json(profile);
    } catch (error: any) {
        logger.error(`❌ Error verifying advisor: ${error.message}`);
        res.status(500).json({ error: 'Failed to verify advisor' });
    }
});

/**
 * POST /api/advisors/stripe/connect/onboard
 * Start Stripe Connect onboarding for advisor
 */
router.post('/stripe/connect/onboard', authenticate, async (req: any, res) => {
    try {
        const userId = req.user!.id;
        const { returnUrl, refreshUrl } = req.body;

        logger.info(`💳 Starting Stripe onboarding for user ${userId}`);

        // Get or create advisor profile
        let advisor = await AdvisorService.getAdvisorProfile(userId);

        if (!advisor) {
            logger.info(`✨ Creating initial advisor profile for user ${userId}`);
            // Create a minimal advisor profile if it doesn't exist
            advisor = await AdvisorService.updateAdvisorProfile(userId, {
                bio: '',
                expertise: [],
                hourlyRate: 0,
            });
        }

        // Create Connect account if doesn't exist
        if (!advisor.stripeAccountId) {
            logger.info(`🏦 Creating Stripe Connect account for user ${userId}`);
            const account = await StripeService.createConnectAccount(userId);
            // Re-fetch to get updated account ID
            advisor = await AdvisorService.getAdvisorProfile(userId);
        }

        if (!advisor?.stripeAccountId) {
            throw new Error("Failed to secure a Stripe account ID for advisor");
        }

        // Create account link for onboarding
        const accountLink = await StripeService.createAccountLink(
            advisor.stripeAccountId,
            returnUrl || `${process.env.APP_URL}/advisor/dashboard`,
            refreshUrl || `${process.env.APP_URL}/advisor/onboarding`
        );

        res.json({ url: accountLink.url });
    } catch (error: any) {
        logger.error(`❌ Error starting Stripe onboarding: ${error.message}`);
        res.status(500).json({ error: error.message || 'Failed to start Stripe onboarding' });
    }
});

/**
 * GET /api/advisors/stripe/connect/status
 * Check Stripe Connect account status
 */
router.get('/stripe/connect/status', authenticate, async (req: any, res) => {
    try {
        const advisor = await AdvisorService.getAdvisorProfile(req.user!.id);

        if (!advisor?.stripeAccountId) {
            return res.json({
                connected: false,
                stripeOnboardingComplete: false,
                stripeDetailsSubmitted: false,
                chargesEnabled: false,
                payoutsEnabled: false,
                requirements: []
            });
        }

        const status = await StripeService.getAccountStatus(advisor.stripeAccountId);

        res.json({
            connected: true,
            stripeOnboardingComplete: status.detailsSubmitted && status.chargesEnabled,
            stripeDetailsSubmitted: status.detailsSubmitted,
            chargesEnabled: status.chargesEnabled,
            payoutsEnabled: status.payoutsEnabled,
            verificationStatus: advisor.verificationStatus,
            isVerified: advisor.isVerified,
            ...status
        });
    } catch (error: any) {
        logger.error(`❌ Error checking Stripe status: ${error.message}`);
        res.status(500).json({ error: 'Failed to check Stripe status' });
    }
});

/**
 * GET /api/advisors/dashboard/stats
 * Get dashboard statistics for advisor
 */
router.get('/dashboard/stats', authenticate, async (req: any, res) => {
    try {
        const { prisma } = await import('../db.js');
        const advisor = await prisma.advisorProfile.findUnique({
            where: { userId: req.user!.id }
        });

        if (!advisor) {
            return res.status(404).json({ error: 'Advisor profile not found' });
        }

        // Get booking statistics
        const bookings = await prisma.booking.findMany({
            where: { advisorId: advisor.id }
        });

        const totalBookings = bookings.length;
        const pendingBookings = bookings.filter(b => b.status === 'PENDING').length;
        const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED').length;
        const completedBookings = bookings.filter(b => b.status === 'COMPLETED').length;

        // Calculate earnings
        const totalEarnings = bookings
            .filter(b => b.status === 'COMPLETED' || b.status === 'CONFIRMED')
            .reduce((sum, b) => sum + Number(b.advisorPayout), 0);

        const paidEarnings = bookings
            .filter(b => b.payoutStatus === 'PAID')
            .reduce((sum, b) => sum + Number(b.advisorPayout), 0);

        const pendingEarnings = totalEarnings - paidEarnings;

        // Get upcoming sessions
        const upcomingSessions = await prisma.booking.findMany({
            where: {
                advisorId: advisor.id,
                status: 'CONFIRMED',
                sessionDate: { gte: new Date() }
            },
            orderBy: { sessionDate: 'asc' },
            take: 5,
            include: { user: true, estate: true }
        });

        res.json({
            stats: {
                totalBookings,
                pendingBookings,
                confirmedBookings,
                completedBookings,
                totalEarnings,
                paidEarnings,
                pendingEarnings
            },
            upcomingSessions
        });
    } catch (error: any) {
        logger.error(`❌ Error fetching dashboard stats: ${error.message}`);
        res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
    }
});

/**
 * GET /api/advisors/dashboard/earnings
 * Get detailed earnings breakdown
 */
router.get('/dashboard/earnings', authenticate, async (req: any, res) => {
    try {
        const { prisma } = await import('../db.js');
        const advisor = await prisma.advisorProfile.findUnique({
            where: { userId: req.user!.id }
        });

        if (!advisor) {
            return res.status(404).json({ error: 'Advisor profile not found' });
        }

        const bookings = await prisma.booking.findMany({
            where: { advisorId: advisor.id },
            include: { user: true },
            orderBy: { createdAt: 'desc' }
        });

        const earnings = bookings.map(booking => ({
            id: booking.id,
            date: booking.createdAt,
            sessionDate: booking.sessionDate,
            clientName: booking.user.fullName || booking.user.email,
            amount: Number(booking.advisorPayout),
            platformFee: Number(booking.platformFee),
            totalAmount: Number(booking.totalAmount),
            status: booking.status,
            payoutStatus: booking.payoutStatus,
            escrowReleaseDate: booking.escrowReleaseDate
        }));

        res.json({ earnings });
    } catch (error: any) {
        logger.error(`❌ Error fetching earnings: ${error.message}`);
        res.status(500).json({ error: 'Failed to fetch earnings' });
    }
});

export default router;
