import { prisma } from '../db.js';
import { logger } from '../lib/logger.js';
export class ReviewService {
    /**
     * Create a review for a completed booking
     */
    static async createReview(data) {
        logger.info(`📝 Creating review for booking ${data.bookingId}`);
        // Validate rating
        if (data.rating < 1 || data.rating > 5) {
            throw new Error('Rating must be between 1 and 5');
        }
        // Get booking
        const booking = await prisma.booking.findUnique({
            where: { id: data.bookingId },
            include: { review: true }
        });
        if (!booking) {
            throw new Error('Booking not found');
        }
        // Verify user owns this booking
        if (booking.userId !== data.userId) {
            throw new Error('Unauthorized: You can only review your own bookings');
        }
        // Verify booking is completed
        if (booking.status !== 'COMPLETED') {
            throw new Error('Can only review completed bookings');
        }
        // Check if review already exists
        if (booking.review) {
            throw new Error('Booking has already been reviewed');
        }
        // Create review
        const review = await prisma.review.create({
            data: {
                bookingId: data.bookingId,
                userId: data.userId,
                advisorId: booking.advisorId,
                rating: data.rating,
                comment: data.comment
            },
            include: {
                user: true,
                advisor: { include: { user: true } }
            }
        });
        logger.info(`✅ Review created: ${review.id}`);
        return review;
    }
    /**
     * Get reviews for an advisor
     */
    static async getAdvisorReviews(advisorId) {
        const reviews = await prisma.review.findMany({
            where: { advisorId },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        email: false // Don't expose email
                    }
                },
                booking: {
                    select: {
                        sessionDate: true,
                        sessionDuration: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return reviews;
    }
    /**
     * Get advisor rating statistics
     */
    static async getAdvisorRatingStats(advisorId) {
        const reviews = await prisma.review.findMany({
            where: { advisorId },
            select: { rating: true }
        });
        if (reviews.length === 0) {
            return {
                averageRating: 0,
                totalReviews: 0,
                ratingDistribution: {
                    5: 0,
                    4: 0,
                    3: 0,
                    2: 0,
                    1: 0
                }
            };
        }
        const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
        const averageRating = totalRating / reviews.length;
        const ratingDistribution = {
            5: reviews.filter(r => r.rating === 5).length,
            4: reviews.filter(r => r.rating === 4).length,
            3: reviews.filter(r => r.rating === 3).length,
            2: reviews.filter(r => r.rating === 2).length,
            1: reviews.filter(r => r.rating === 1).length
        };
        return {
            averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
            totalReviews: reviews.length,
            ratingDistribution
        };
    }
    /**
     * Get a user's reviews
     */
    static async getUserReviews(userId) {
        return prisma.review.findMany({
            where: { userId },
            include: {
                advisor: {
                    include: {
                        user: {
                            select: {
                                fullName: true,
                                email: false
                            }
                        }
                    }
                },
                booking: {
                    select: {
                        sessionDate: true,
                        sessionDuration: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    /**
     * Update a review
     */
    static async updateReview(reviewId, userId, data) {
        const review = await prisma.review.findUnique({
            where: { id: reviewId }
        });
        if (!review) {
            throw new Error('Review not found');
        }
        if (review.userId !== userId) {
            throw new Error('Unauthorized: You can only update your own reviews');
        }
        // Validate rating if provided
        if (data.rating && (data.rating < 1 || data.rating > 5)) {
            throw new Error('Rating must be between 1 and 5');
        }
        const updated = await prisma.review.update({
            where: { id: reviewId },
            data: {
                rating: data.rating,
                comment: data.comment
            },
            include: {
                user: true,
                advisor: { include: { user: true } }
            }
        });
        logger.info(`✅ Review updated: ${reviewId}`);
        return updated;
    }
    /**
     * Delete a review
     */
    static async deleteReview(reviewId, userId) {
        const review = await prisma.review.findUnique({
            where: { id: reviewId }
        });
        if (!review) {
            throw new Error('Review not found');
        }
        if (review.userId !== userId) {
            throw new Error('Unauthorized: You can only delete your own reviews');
        }
        await prisma.review.delete({
            where: { id: reviewId }
        });
        logger.info(`✅ Review deleted: ${reviewId}`);
        return { success: true };
    }
}
