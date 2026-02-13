import { Router } from 'express';
import { AdvisorService } from '../services/advisorService.js';
import { authenticate } from '../middleware/auth.js';
import { logger } from '../lib/logger.js';
const router = Router();
/**
 * GET /api/advisors/me
 * Get current user's advisor profile
 */
router.get('/me', authenticate, async (req, res) => {
    try {
        const profile = await AdvisorService.getAdvisorProfile(req.user.id);
        res.json(profile);
    }
    catch (error) {
        logger.error(`❌ Error fetching advisor profile: ${error.message}`);
        res.status(500).json({ error: 'Failed to fetch advisor profile' });
    }
});
/**
 * POST /api/advisors/profile
 * Create or update advisor profile
 */
router.post('/profile', authenticate, async (req, res) => {
    try {
        const profile = await AdvisorService.updateAdvisorProfile(req.user.id, req.body);
        res.json(profile);
    }
    catch (error) {
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
            expertise: expertise,
            maxRate: maxRate ? parseFloat(maxRate) : undefined
        });
        res.json(advisors);
    }
    catch (error) {
        logger.error(`❌ Error listing marketplace advisors: ${error.message}`);
        res.status(500).json({ error: 'Failed to list advisors' });
    }
});
/**
 * POST /api/advisors/:id/verify (Admin Only)
 */
router.post('/:id/verify', authenticate, async (req, res) => {
    try {
        // Basic admin check (this should be replaced with a more robust role-based check)
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        const { status } = req.body;
        const profile = await AdvisorService.adminVerifyAdvisor(req.params.id, status);
        res.json(profile);
    }
    catch (error) {
        logger.error(`❌ Error verifying advisor: ${error.message}`);
        res.status(500).json({ error: 'Failed to verify advisor' });
    }
});
export default router;
