import { prisma } from '../db.js';
import { logger } from '../lib/logger.js';
import { AdvisorStatus, DocumentStatus } from '@prisma/client';
const PLATFORM_FEE_PERCENT = 0.20;
export class AdvisorMarketplaceService {
    // ─── Profile ───────────────────────────────────────────────────────────────
    static async upsertProfile(userId, data) {
        logger.info(`📝 Upserting advisor marketplace profile for user ${userId}`);
        const profile = await prisma.advisorProfile.upsert({
            where: { userId },
            update: {
                bio: data.bio,
                specialties: data.specialties,
                statesServed: data.statesServed,
                languages: data.languages,
                advisorType: data.advisorType,
                hourlyRate: data.hourlyRate,
                requiresApproval: data.requiresApproval,
                cancellationHours: data.cancellationHours,
                noShowPolicy: data.noShowPolicy,
                profileImage: data.profileImage,
                timezone: data.timezone,
                maxSessionsPerDay: data.maxSessionsPerDay,
                bufferMinutes: data.bufferMinutes,
                meetingLink: data.meetingLink,
                publicNotes: data.publicNotes,
                expertise: data.expertise ?? data.specialties,
                licenseNumber: data.licenseNumber,
                licenseDocument: data.licenseDocument,
            },
            create: {
                userId,
                bio: data.bio ?? '',
                specialties: data.specialties ?? [],
                statesServed: data.statesServed ?? [],
                languages: data.languages ?? ['English'],
                advisorType: data.advisorType ?? 'ATTORNEY',
                hourlyRate: data.hourlyRate ?? 0,
                requiresApproval: data.requiresApproval ?? false,
                cancellationHours: data.cancellationHours ?? 24,
                noShowPolicy: data.noShowPolicy,
                profileImage: data.profileImage,
                timezone: data.timezone ?? 'America/New_York',
                maxSessionsPerDay: data.maxSessionsPerDay ?? 8,
                bufferMinutes: data.bufferMinutes ?? 15,
                meetingLink: data.meetingLink,
                publicNotes: data.publicNotes,
                expertise: data.expertise ?? data.specialties ?? [],
                licenseNumber: data.licenseNumber,
                licenseDocument: data.licenseDocument,
                status: AdvisorStatus.DRAFT,
                verificationStatus: 'PENDING',
            },
            include: { user: { select: { id: true, fullName: true, email: true } } }
        });
        // Ensure user role is ADVISOR
        await prisma.user.update({
            where: { id: userId },
            data: { role: 'ADVISOR' }
        });
        return profile;
    }
    static async getProfile(userId) {
        return prisma.advisorProfile.findUnique({
            where: { userId },
            include: {
                user: { select: { id: true, fullName: true, email: true } },
                ratePlans: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
                licenseDocuments: { orderBy: { createdAt: 'desc' } },
                availabilityRules: { where: { isActive: true }, orderBy: { dayOfWeek: 'asc' } },
                availabilityExceptions: { orderBy: { date: 'asc' } },
            }
        });
    }
    static async getPublicProfile(advisorId) {
        const profile = await prisma.advisorProfile.findUnique({
            where: { id: advisorId },
            include: {
                user: { select: { fullName: true } },
                ratePlans: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
                reviews: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                    include: { user: { select: { fullName: true } } }
                },
                availabilityRules: { where: { isActive: true } },
            }
        });
        if (!profile)
            return null;
        // Strip sensitive fields for public view
        const { licenseDocument, stripeAccountId, ...safe } = profile;
        return safe;
    }
    static async submitForReview(userId) {
        const profile = await prisma.advisorProfile.findUnique({ where: { userId } });
        if (!profile)
            throw new Error('Profile not found');
        if (profile.status === AdvisorStatus.APPROVED)
            throw new Error('Already approved');
        return prisma.advisorProfile.update({
            where: { userId },
            data: { status: AdvisorStatus.PENDING_REVIEW }
        });
    }
    // ─── Marketplace Search ────────────────────────────────────────────────────
    static async searchAdvisors(filters) {
        const page = filters.page ?? 1;
        const limit = Math.min(filters.limit ?? 20, 100);
        const skip = (page - 1) * limit;
        const where = {
            status: AdvisorStatus.APPROVED,
        };
        if (filters.specialty) {
            where.specialties = { has: filters.specialty };
        }
        if (filters.state) {
            where.statesServed = { has: filters.state };
        }
        if (filters.advisorType) {
            where.advisorType = filters.advisorType;
        }
        if (filters.minRate !== undefined || filters.maxRate !== undefined) {
            where.hourlyRate = {};
            if (filters.minRate !== undefined)
                where.hourlyRate.gte = filters.minRate;
            if (filters.maxRate !== undefined)
                where.hourlyRate.lte = filters.maxRate;
        }
        if (filters.minRating !== undefined) {
            where.avgRating = { gte: filters.minRating };
        }
        const [advisors, total] = await Promise.all([
            prisma.advisorProfile.findMany({
                where,
                include: {
                    user: { select: { fullName: true } },
                    ratePlans: { where: { isActive: true }, take: 3, orderBy: { priceCents: 'asc' } },
                },
                orderBy: [
                    { avgRating: 'desc' },
                    { totalReviews: 'desc' },
                    { createdAt: 'desc' }
                ],
                skip,
                take: limit,
            }),
            prisma.advisorProfile.count({ where })
        ]);
        return {
            advisors: advisors.map(a => {
                const { licenseDocument, stripeAccountId, ...safe } = a;
                return safe;
            }),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }
    // ─── Rate Plans ────────────────────────────────────────────────────────────
    static async getRatePlans(userId) {
        const profile = await prisma.advisorProfile.findUnique({ where: { userId } });
        if (!profile)
            return [];
        return prisma.advisorRatePlan.findMany({
            where: { advisorId: profile.id },
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
        });
    }
    static async createRatePlan(userId, data) {
        const profile = await prisma.advisorProfile.findUnique({ where: { userId } });
        if (!profile)
            throw new Error('Advisor profile not found');
        return prisma.advisorRatePlan.create({
            data: {
                advisorId: profile.id,
                serviceName: data.serviceName,
                durationMinutes: data.durationMinutes,
                priceCents: data.priceCents,
                currency: data.currency ?? 'USD',
                description: data.description,
                sortOrder: data.sortOrder ?? 0,
                isActive: true,
            }
        });
    }
    static async updateRatePlan(userId, ratePlanId, data) {
        const profile = await prisma.advisorProfile.findUnique({ where: { userId } });
        if (!profile)
            throw new Error('Advisor profile not found');
        const plan = await prisma.advisorRatePlan.findUnique({ where: { id: ratePlanId } });
        if (!plan || plan.advisorId !== profile.id)
            throw new Error('Rate plan not found');
        return prisma.advisorRatePlan.update({
            where: { id: ratePlanId },
            data
        });
    }
    static async deleteRatePlan(userId, ratePlanId) {
        const profile = await prisma.advisorProfile.findUnique({ where: { userId } });
        if (!profile)
            throw new Error('Advisor profile not found');
        const plan = await prisma.advisorRatePlan.findUnique({ where: { id: ratePlanId } });
        if (!plan || plan.advisorId !== profile.id)
            throw new Error('Rate plan not found');
        // Soft delete
        return prisma.advisorRatePlan.update({
            where: { id: ratePlanId },
            data: { isActive: false }
        });
    }
    // ─── License Documents ─────────────────────────────────────────────────────
    static async recordLicenseDocument(userId, data) {
        const profile = await prisma.advisorProfile.findUnique({ where: { userId } });
        if (!profile)
            throw new Error('Advisor profile not found');
        return prisma.advisorLicenseDocument.create({
            data: {
                advisorId: profile.id,
                documentType: data.documentType,
                storageKey: data.storageKey,
                fileName: data.fileName,
                mimeType: data.mimeType,
                sizeBytes: data.sizeBytes ?? 0,
                licenseNumber: data.licenseNumber,
                issuingState: data.issuingState,
                expirationDate: data.expirationDate,
                status: DocumentStatus.UPLOADED,
            }
        });
    }
    static async getLicenseDocuments(userId) {
        const profile = await prisma.advisorProfile.findUnique({ where: { userId } });
        if (!profile)
            return [];
        return prisma.advisorLicenseDocument.findMany({
            where: { advisorId: profile.id },
            orderBy: { createdAt: 'desc' }
        });
    }
    static async deleteLicenseDocument(userId, docId) {
        const profile = await prisma.advisorProfile.findUnique({ where: { userId } });
        if (!profile)
            throw new Error('Profile not found');
        const doc = await prisma.advisorLicenseDocument.findUnique({ where: { id: docId } });
        if (!doc || doc.advisorId !== profile.id)
            throw new Error('Document not found');
        return prisma.advisorLicenseDocument.delete({ where: { id: docId } });
    }
    // ─── Availability Rules ────────────────────────────────────────────────────
    static async getAvailabilityRules(userId) {
        const profile = await prisma.advisorProfile.findUnique({ where: { userId } });
        if (!profile)
            return [];
        return prisma.availabilityRule.findMany({
            where: { advisorId: profile.id },
            orderBy: { dayOfWeek: 'asc' }
        });
    }
    static async setAvailabilityRules(userId, rules) {
        const profile = await prisma.advisorProfile.findUnique({ where: { userId } });
        if (!profile)
            throw new Error('Profile not found');
        // Replace all rules for this advisor
        await prisma.availabilityRule.deleteMany({ where: { advisorId: profile.id } });
        const created = await prisma.availabilityRule.createMany({
            data: rules.map(r => ({
                advisorId: profile.id,
                dayOfWeek: r.dayOfWeek,
                startTime: r.startTime,
                endTime: r.endTime,
                isActive: r.isActive ?? true,
            }))
        });
        return prisma.availabilityRule.findMany({
            where: { advisorId: profile.id },
            orderBy: { dayOfWeek: 'asc' }
        });
    }
    static async createAvailabilityException(userId, data) {
        const profile = await prisma.advisorProfile.findUnique({ where: { userId } });
        if (!profile)
            throw new Error('Profile not found');
        return prisma.availabilityException.create({
            data: {
                advisorId: profile.id,
                date: data.date,
                isBlackout: data.isBlackout,
                startTime: data.startTime,
                endTime: data.endTime,
                reason: data.reason,
            }
        });
    }
    static async getAvailabilityExceptions(userId) {
        const profile = await prisma.advisorProfile.findUnique({ where: { userId } });
        if (!profile)
            return [];
        return prisma.availabilityException.findMany({
            where: { advisorId: profile.id },
            orderBy: { date: 'asc' }
        });
    }
    static async deleteAvailabilityException(userId, exceptionId) {
        const profile = await prisma.advisorProfile.findUnique({ where: { userId } });
        if (!profile)
            throw new Error('Profile not found');
        const ex = await prisma.availabilityException.findUnique({ where: { id: exceptionId } });
        if (!ex || ex.advisorId !== profile.id)
            throw new Error('Exception not found');
        return prisma.availabilityException.delete({ where: { id: exceptionId } });
    }
    // ─── Admin ─────────────────────────────────────────────────────────────────
    static async getAdminQueue(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [advisors, total] = await Promise.all([
            prisma.advisorProfile.findMany({
                where: { status: { in: [AdvisorStatus.PENDING_REVIEW, AdvisorStatus.APPROVED, AdvisorStatus.REJECTED, AdvisorStatus.PAUSED] } },
                include: {
                    user: { select: { fullName: true, email: true } },
                    licenseDocuments: { select: { id: true, documentType: true, status: true, expirationDate: true } },
                },
                orderBy: [
                    { status: 'asc' },
                    { updatedAt: 'desc' }
                ],
                skip,
                take: limit
            }),
            prisma.advisorProfile.count({
                where: { status: { in: [AdvisorStatus.PENDING_REVIEW, AdvisorStatus.APPROVED, AdvisorStatus.REJECTED, AdvisorStatus.PAUSED] } }
            })
        ]);
        return { advisors, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    static async adminGetAdvisorDetail(advisorId) {
        return prisma.advisorProfile.findUnique({
            where: { id: advisorId },
            include: {
                user: { select: { id: true, fullName: true, email: true, createdAt: true } },
                licenseDocuments: true,
                ratePlans: true,
                availabilityRules: true,
                availabilityExceptions: true,
                bookings: {
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                    include: { user: { select: { fullName: true, email: true } } }
                },
                reviews: { take: 5, orderBy: { createdAt: 'desc' } },
            }
        });
    }
    static async adminApproveAdvisor(adminId, advisorId, reason) {
        const profile = await prisma.advisorProfile.update({
            where: { id: advisorId },
            data: {
                status: AdvisorStatus.APPROVED,
                isVerified: true,
                verificationStatus: 'VERIFIED',
            }
        });
        await prisma.adminActionLog.create({
            data: {
                adminId,
                action: 'APPROVE_ADVISOR',
                targetType: 'ADVISOR',
                targetId: advisorId,
                reason,
            }
        });
        return profile;
    }
    static async adminRejectAdvisor(adminId, advisorId, reason) {
        const profile = await prisma.advisorProfile.update({
            where: { id: advisorId },
            data: {
                status: AdvisorStatus.REJECTED,
                isVerified: false,
                verificationStatus: 'REJECTED',
            }
        });
        await prisma.adminActionLog.create({
            data: {
                adminId,
                action: 'REJECT_ADVISOR',
                targetType: 'ADVISOR',
                targetId: advisorId,
                reason,
            }
        });
        return profile;
    }
    static async adminPauseAdvisor(adminId, advisorId, reason) {
        const profile = await prisma.advisorProfile.update({
            where: { id: advisorId },
            data: { status: AdvisorStatus.PAUSED }
        });
        // Auto-decline pending bookings
        await prisma.booking.updateMany({
            where: { advisorId, status: 'REQUESTED' },
            data: {
                status: 'CANCELLED',
                cancellationReason: 'Advisor services paused by platform',
                cancelledAt: new Date(),
            }
        });
        await prisma.adminActionLog.create({
            data: {
                adminId,
                action: 'PAUSE_ADVISOR',
                targetType: 'ADVISOR',
                targetId: advisorId,
                reason,
            }
        });
        return profile;
    }
    static async adminUnpauseAdvisor(adminId, advisorId, reason) {
        const profile = await prisma.advisorProfile.update({
            where: { id: advisorId },
            data: { status: AdvisorStatus.APPROVED }
        });
        await prisma.adminActionLog.create({
            data: {
                adminId,
                action: 'UNPAUSE_ADVISOR',
                targetType: 'ADVISOR',
                targetId: advisorId,
                reason,
            }
        });
        return profile;
    }
    static async adminVerifyDocument(adminId, docId, status, reason) {
        const doc = await prisma.advisorLicenseDocument.update({
            where: { id: docId },
            data: {
                status: status === 'VERIFIED' ? DocumentStatus.VERIFIED : DocumentStatus.REJECTED,
                verifiedAt: status === 'VERIFIED' ? new Date() : undefined,
                verifiedBy: status === 'VERIFIED' ? adminId : undefined,
                rejectionReason: status === 'REJECTED' ? reason : undefined,
            }
        });
        await prisma.adminActionLog.create({
            data: {
                adminId,
                action: `${status}_DOCUMENT`,
                targetType: 'DOCUMENT',
                targetId: docId,
                reason,
            }
        });
        return doc;
    }
    static async getAuditLog(page = 1, limit = 50, filters) {
        const skip = (page - 1) * limit;
        const where = {};
        if (filters?.action)
            where.action = { contains: filters.action, mode: 'insensitive' };
        if (filters?.targetType)
            where.targetType = filters.targetType;
        if (filters?.adminId)
            where.adminId = filters.adminId;
        if (filters?.targetId)
            where.targetId = filters.targetId;
        const [logs, total] = await Promise.all([
            prisma.adminActionLog.findMany({
                where,
                include: {
                    admin: { select: { fullName: true, email: true } }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.adminActionLog.count({ where })
        ]);
        return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    // ─── Disputes ──────────────────────────────────────────────────────────────
    static async openDispute(userId, bookingId, reason, description) {
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: { dispute: true }
        });
        if (!booking)
            throw new Error('Booking not found');
        if (booking.userId !== userId)
            throw new Error('Unauthorized');
        if (booking.dispute)
            throw new Error('Dispute already exists for this booking');
        if (!['COMPLETED', 'NO_SHOW'].includes(booking.status)) {
            throw new Error('Can only dispute completed or no-show bookings');
        }
        return prisma.dispute.create({
            data: {
                bookingId,
                openedBy: userId,
                reason,
                description,
                status: 'OPEN',
            }
        });
    }
    static async adminResolveDispute(adminId, disputeId, resolution, data) {
        const dispute = await prisma.dispute.findUnique({
            where: { id: disputeId },
            include: { booking: true }
        });
        if (!dispute)
            throw new Error('Dispute not found');
        const newStatus = resolution === 'REFUND' ? 'RESOLVED_REFUNDED' : 'RESOLVED_RELEASED';
        const updated = await prisma.dispute.update({
            where: { id: disputeId },
            data: {
                status: newStatus,
                resolution: data.resolution,
                resolvedBy: adminId,
                resolvedAt: new Date(),
                refundAmount: data.refundAmount,
            }
        });
        if (resolution === 'REFUND') {
            await prisma.booking.update({
                where: { id: dispute.bookingId },
                data: {
                    status: 'REFUNDED',
                    refundAmount: data.refundAmount ? (data.refundAmount / 100) : dispute.booking.totalAmount,
                    refundedAt: new Date(),
                }
            });
        }
        await prisma.adminActionLog.create({
            data: {
                adminId,
                action: `RESOLVE_DISPUTE_${resolution}`,
                targetType: 'DISPUTE',
                targetId: disputeId,
                reason: data.resolution,
                metadata: { refundAmount: data.refundAmount },
            }
        });
        return updated;
    }
    static async getDisputes(page = 1, limit = 20, status) {
        const skip = (page - 1) * limit;
        const where = status ? { status } : {};
        const [disputes, total] = await Promise.all([
            prisma.dispute.findMany({
                where,
                include: {
                    booking: {
                        include: {
                            user: { select: { fullName: true, email: true } },
                            advisor: {
                                include: { user: { select: { fullName: true, email: true } } }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.dispute.count({ where })
        ]);
        return { disputes, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    // ─── Earnings ─────────────────────────────────────────────────────────────
    static async getAdvisorEarnings(userId) {
        const profile = await prisma.advisorProfile.findUnique({ where: { userId } });
        if (!profile)
            throw new Error('Profile not found');
        const bookings = await prisma.booking.findMany({
            where: { advisorId: profile.id },
            include: { user: { select: { fullName: true, email: true } } },
            orderBy: { createdAt: 'desc' }
        });
        const totalEarnings = bookings
            .filter(b => b.status === 'COMPLETED')
            .reduce((sum, b) => sum + Number(b.advisorPayout), 0);
        const pendingEarnings = bookings
            .filter(b => b.status === 'CONFIRMED' || (b.status === 'COMPLETED' && b.payoutStatus !== 'PAID'))
            .reduce((sum, b) => sum + Number(b.advisorPayout), 0);
        return {
            totalEarnings,
            pendingEarnings,
            paidEarnings: bookings
                .filter(b => b.payoutStatus === 'PAID')
                .reduce((sum, b) => sum + Number(b.advisorPayout), 0),
            bookings: bookings.map(b => ({
                id: b.id,
                date: b.createdAt,
                sessionDate: b.startTime,
                clientName: b.user.fullName ?? b.user.email,
                amount: Number(b.advisorPayout),
                platformFee: Number(b.platformFee),
                totalAmount: Number(b.totalAmount),
                status: b.status,
                payoutStatus: b.payoutStatus,
            }))
        };
    }
    // ─── Cron: Check Expired Licenses ──────────────────────────────────────────
    static async checkAndPauseExpiredLicenses() {
        const expiredDocs = await prisma.advisorLicenseDocument.findMany({
            where: {
                expirationDate: { lte: new Date() },
                status: DocumentStatus.VERIFIED,
            },
            include: { advisor: true }
        });
        const advisorIds = [...new Set(expiredDocs.map(d => d.advisorId))];
        for (const advisorId of advisorIds) {
            const profile = await prisma.advisorProfile.findUnique({ where: { id: advisorId } });
            if (profile && profile.status === AdvisorStatus.APPROVED) {
                await prisma.advisorProfile.update({
                    where: { id: advisorId },
                    data: { status: AdvisorStatus.PAUSED }
                });
                await prisma.adminActionLog.create({
                    data: {
                        adminId: 'system',
                        action: 'AUTO_PAUSE_EXPIRED_LICENSE',
                        targetType: 'ADVISOR',
                        targetId: advisorId,
                        reason: 'License document expired',
                    }
                });
                logger.warn(`⚠️ Auto-paused advisor ${advisorId} due to expired license`);
            }
        }
    }
}
