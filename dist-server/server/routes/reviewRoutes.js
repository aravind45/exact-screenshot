import { Router } from 'express';
import { ReviewService } from '../services/reviewService.js';
import { authenticate } from '../middleware/auth.js';
import { logger } from '../lib/logger.js';
import { z } from 'zod';
const router = Router();
// Validation schemas
const createReviewSchema = z.object({
    bookingId: z.string(),
    rating: z.number().min(1).max(5),
    comment: z.string().optional()
});
const updateReviewSchema = z.object({
    rating: z.number().min(1).max(5).optional(),
    comment: z.string().optional()
});
/**
 * POST /api/reviews
 * Create a review for a booking
 */
router.post('/', authenticate, async (req, res) => {
    try {
        const data = createReviewSchema.parse(req.body);
        const review = await ReviewService.createReview({
            bookingId: data.bookingId,
            rating: data.rating,
            comment: data.comment,
            userId: req.user.id
        });
        res.status(201).json(review);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid request data', details: error.errors });
        }
        logger.error(`❌ Error creating review: ${error.message}`);
        res.status(400).json({ error: error.message });
    }
});
/**
 * GET /api/reviews/advisor/:advisorId
 * Get all reviews for an advisor
 */
router.get('/advisor/:advisorId', async (req, res) => {
    try {
        const reviews = await ReviewService.getAdvisorReviews(req.params.advisorId);
        res.json(reviews);
    }
    catch (error) {
        logger.error(`❌ Error fetching advisor reviews: ${error.message}`);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});
/**
 * GET /api/reviews/advisor/:advisorId/stats
 * Get rating statistics for an advisor
 */
router.get('/advisor/:advisorId/stats', async (req, res) => {
    try {
        const stats = await ReviewService.getAdvisorRatingStats(req.params.advisorId);
        res.json(stats);
    }
    catch (error) {
        logger.error(`❌ Error fetching rating stats: ${error.message}`);
        res.status(500).json({ error: 'Failed to fetch rating statistics' });
    }
});
/**
 * GET /api/reviews/my-reviews
 * Get current user's reviews
 */
router.get('/my-reviews', authenticate, async (req, res) => {
    try {
        const reviews = await ReviewService.getUserReviews(req.user.id);
        res.json(reviews);
    }
    catch (error) {
        logger.error(`❌ Error fetching user reviews: ${error.message}`);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});
/**
 * PATCH /api/reviews/:id
 * Update a review
 */
router.patch('/:id', authenticate, async (req, res) => {
    try {
        const data = updateReviewSchema.parse(req.body);
        const review = await ReviewService.updateReview(req.params.id, req.user.id, data);
        res.json(review);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Invalid request data', details: error.errors });
        }
        logger.error(`❌ Error updating review: ${error.message}`);
        res.status(400).json({ error: error.message });
    }
});
/**
 * DELETE /api/reviews/:id
 * Delete a review
 */
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const result = await ReviewService.deleteReview(req.params.id, req.user.id);
        res.json(result);
    }
    catch (error) {
        logger.error(`❌ Error deleting review: ${error.message}`);
        res.status(400).json({ error: error.message });
    }
});
export default router;
