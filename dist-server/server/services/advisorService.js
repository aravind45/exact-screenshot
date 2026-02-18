import { prisma } from '../db.js';
import { logger } from '../lib/logger.js';
export class AdvisorService {
    /**
     * Register a user as an advisor or update their existing profile
     */
    static async updateAdvisorProfile(userId, data) {
        logger.info(`📝 Updating advisor profile for user ${userId}`);
        // Sanitize data to only include fields defined in Prisma schema
        const sanitizedData = {
            bio: data.bio,
            expertise: data.expertise,
            hourlyRate: data.hourlyRate,
            licenseNumber: data.licenseNumber,
            licenseDocument: data.licenseDocument,
            profileImage: data.profileImage,
        };
        const profile = await prisma.advisorProfile.upsert({
            where: { userId },
            update: {
                ...sanitizedData,
                verificationStatus: data.licenseDocument ? 'PENDING' : undefined, // Reset to pending if doc updated
            },
            create: {
                userId,
                bio: data.bio || '',
                expertise: data.expertise || [],
                hourlyRate: data.hourlyRate || 0,
                licenseNumber: data.licenseNumber,
                licenseDocument: data.licenseDocument,
                profileImage: data.profileImage,
                verificationStatus: 'PENDING',
            }
        });
        // Ensure user role is updated to ADVISOR
        await prisma.user.update({
            where: { id: userId },
            data: { role: 'ADVISOR' }
        });
        return profile;
    }
    /**
     * Get advisor profile by userId
     */
    static async getAdvisorProfile(userId) {
        return prisma.advisorProfile.findUnique({
            where: { userId },
            include: { user: true }
        });
    }
    /**
     * List verified advisors for the marketplace
     */
    static async listMarketplaceAdvisors(filters) {
        return prisma.advisorProfile.findMany({
            where: {
                verificationStatus: 'VERIFIED',
                expertise: filters?.expertise ? { has: filters.expertise } : undefined,
                hourlyRate: filters?.maxRate ? { lte: filters.maxRate } : undefined,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    }
                }
            }
        });
    }
    /**
     * Admin: Verify or Reject an advisor
     */
    static async adminVerifyAdvisor(advisorId, status) {
        logger.info(`👮 Admin ${status} advisor ${advisorId}`);
        return prisma.advisorProfile.update({
            where: { id: advisorId },
            data: {
                verificationStatus: status,
                isVerified: status === 'VERIFIED'
            }
        });
    }
    /**
     * Admin: List all advisors regardless of status
     */
    static async listAllAdvisors() {
        return prisma.advisorProfile.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    /**
     * Get dashboard metrics for an advisor
     */
    static async getDashboardMetrics(advisorId) {
        const bookings = await prisma.booking.findMany({
            where: { advisorId }
        });
        const totalBookings = bookings.length;
        const pendingBookings = bookings.filter(b => b.status === 'REQUESTED').length;
        // Calculate earnings (using Number to avoid Decimal types for now simplistically, 
        // real app should use Decimal handling)
        const totalEarnings = bookings
            .filter(b => b.status === 'COMPLETED')
            .reduce((sum, b) => sum + Number(b.advisorPayout), 0);
        const pendingEarnings = bookings
            .filter(b => b.status === 'CONFIRMED' || (b.status === 'COMPLETED' && b.payoutStatus !== 'PAID'))
            .reduce((sum, b) => sum + Number(b.advisorPayout), 0);
        return {
            totalBookings,
            pendingBookings,
            totalEarnings,
            pendingEarnings
        };
    }
    /**
     * Get bookings for an advisor
     */
    static async getBookings(advisorId) {
        return await prisma.booking.findMany({
            where: { advisorId },
            include: {
                user: {
                    select: {
                        fullName: true,
                        email: true
                    }
                },
                estate: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }
}
