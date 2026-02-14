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
}
