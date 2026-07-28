import { prisma } from '../db.js';
import { logger } from '../lib/logger.js';
import { AdvisorStatus, DocumentStatus } from '@prisma/client';

const PLATFORM_FEE_PERCENT = 0.20;

export class AdvisorMarketplaceService {
    // ─── Profile ───────────────────────────────────────────────────────────────

    static async upsertProfile(userId: string, data: {
        bio?: string;
        specialties?: string[];
        statesServed?: string[];
        languages?: string[];
        advisorType?: string;
        hourlyRate?: number;
        requiresApproval?: boolean;
        cancellationHours?: number;
        noShowPolicy?: string;
        profileImage?: string;
        timezone?: string;
        maxSessionsPerDay?: number;
        bufferMinutes?: number;
        meetingLink?: string;
        publicNotes?: string;
        // legacy
        expertise?: string[];
        licenseNumber?: string;
        licenseDocument?: string;
    }) {
        logger.info(`📝 Upserting advisor marketplace profile for user ${userId}`);
        const DEFAULT_RATE_PLAN_DESCRIPTION = "Auto-generated from hourly rate";

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

        // If advisor only sets an hourly rate, create a default bookable package.
        const numericHourlyRate = data.hourlyRate !== undefined
            ? Number(data.hourlyRate)
            : Number(profile.hourlyRate ?? 0);

        if (numericHourlyRate > 0) {
            const activePlanCount = await prisma.advisorRatePlan.count({
                where: { advisorId: profile.id, isActive: true }
            });

            if (activePlanCount === 0) {
                await prisma.advisorRatePlan.create({
                    data: {
                        advisorId: profile.id,
                        serviceName: "Consultation (60 min)",
                        durationMinutes: 60,
                        priceCents: Math.round(numericHourlyRate * 100),
                        currency: "USD",
                        description: DEFAULT_RATE_PLAN_DESCRIPTION,
                        sortOrder: 0,
                        isActive: true,
                    }
                });
            }
        }

        return profile;
    }

    static async getProfile(userId: string) {
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

    static async getPublicProfile(advisorId: string) {
        // Explicit public-safe whitelist — license numbers/documents, Stripe
        // account state, meeting links, and verification internals must never
        // be exposed through the public profile endpoint.
        return prisma.advisorProfile.findUnique({
            where: { id: advisorId },
            select: {
                id: true,
                bio: true,
                hourlyRate: true,
                profileImage: true,
                advisorType: true,
                avgRating: true,
                totalReviews: true,
                specialties: true,
                statesServed: true,
                languages: true,
                publicNotes: true,
                timezone: true,
                cancellationHours: true,
                status: true,
                createdAt: true,
                user: { select: { fullName: true } },
                ratePlans: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
                reviews: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                    select: {
                        id: true,
                        rating: true,
                        comment: true,
                        createdAt: true,
                        user: { select: { fullName: true } }
                    }
                },
            }
        });
    }

    static async submitForReview(userId: string) {
        const profile = await prisma.advisorProfile.findUnique({ where: { userId } });
        if (!profile) throw new Error('Profile not found');
        if (profile.status === AdvisorStatus.APPROVED) throw new Error('Already approved');

        const activePlanCount = await prisma.advisorRatePlan.count({
            where: { advisorId: profile.id, isActive: true }
        });

        if (activePlanCount === 0 && Number(profile.hourlyRate ?? 0) > 0) {
            await prisma.advisorRatePlan.create({
                data: {
                    advisorId: profile.id,
                    serviceName: "Consultation (60 min)",
                    durationMinutes: 60,
                    priceCents: Math.round(Number(profile.hourlyRate) * 100),
                    currency: "USD",
                    description: "Auto-generated from hourly rate",
                    sortOrder: 0,
                    isActive: true,
                }
            });
        }

        return prisma.advisorProfile.update({
            where: { userId },
            data: { status: AdvisorStatus.PENDING_REVIEW }
        });
    }

    // ─── Marketplace Search ────────────────────────────────────────────────────

    static async searchAdvisors(filters: {
        specialty?: string;
        state?: string;
        minRate?: number;
        maxRate?: number;
        advisorType?: string;
        minRating?: number;
        page?: number;
        limit?: number;
    }) {
        const page = filters.page ?? 1;
        const limit = Math.min(filters.limit ?? 20, 100);
        const skip = (page - 1) * limit;

        const where: any = {
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
            if (filters.minRate !== undefined) where.hourlyRate.gte = filters.minRate;
            if (filters.maxRate !== undefined) where.hourlyRate.lte = filters.maxRate;
        }
        if (filters.minRating !== undefined) {
            where.avgRating = { gte: filters.minRating };
        }

        const [advisors, total] = await Promise.all([
            prisma.advisorProfile.findMany({
                where,
                // Explicit public-safe whitelist — never expose licenseNumber,
                // licenseDocument, stripeAccountId, meetingLink, or internal
                // verification/stripe state through the public directory.
                select: {
                    id: true,
                    bio: true,
                    hourlyRate: true,
                    profileImage: true,
                    advisorType: true,
                    avgRating: true,
                    totalReviews: true,
                    specialties: true,
                    statesServed: true,
                    languages: true,
                    publicNotes: true,
                    status: true,
                    createdAt: true,
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
            advisors,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    // ─── Rate Plans ────────────────────────────────────────────────────────────

    static async getRatePlans(userId: string) {
        const profile = await prisma.advisorProfile.findUnique({ where: { userId } });
        if (!profile) return [];

        return prisma.advisorRatePlan.findMany({
            where: { advisorId: profile.id },
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
        });
    }

    static async createRatePlan(userId: string, data: {
        serviceName: string;
        durationMinutes: number;
        priceCents: number;
        currency?: string;
        description?: string;
        sortOrder?: number;
    }) {
        const profile = await prisma.advisorProfile.findUnique({ where: { userId } });
        if (!profile) throw new Error('Advisor profile not found');

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

    static async updateRatePlan(userId: string, ratePlanId: string, data: {
        serviceName?: string;
        durationMinutes?: number;
        priceCents?: number;
        description?: string;
        isActive?: boolean;
        sortOrder?: number;
    }) {
        const profile = await prisma.advisorProfile.findUnique({ where: { userId } });
        if (!profile) throw new Error('Advisor profile not found');

        const plan = await prisma.advisorRatePlan.findUnique({ where: { id: ratePlanId } });
        if (!plan || plan.advisorId !== profile.id) throw new Error('Rate plan not found');

        return prisma.advisorRatePlan.update({
            where: { id: ratePlanId },
            data
        });
    }

    static async deleteRatePlan(userId: string, ratePlanId: string) {
        const profile = await prisma.advisorProfile.findUnique({ where: { userId } });
        if (!profile) throw new Error('Advisor profile not found');

        const plan = await prisma.advisorRatePlan.findUnique({ where: { id: ratePlanId } });
        if (!plan || plan.advisorId !== profile.id) throw new Error('Rate plan not found');

        // Soft delete
        return prisma.advisorRatePlan.update({
            where: { id: ratePlanId },
            data: { isActive: false }
        });
    }

    // ─── License Documents ─────────────────────────────────────────────────────

    static async recordLicenseDocument(userId: string, data: {
        documentType: string;
        storageKey: string;
        fileName: string;
        mimeType: string;
        sizeBytes?: number;
        licenseNumber?: string;
        issuingState?: string;
        expirationDate?: Date;
    }) {
        const profile = await prisma.advisorProfile.findUnique({ where: { userId } });
        if (!profile) throw new Error('Advisor profile not found');

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

    static async getLicenseDocuments(userId: string) {
        const profile = await prisma.advisorProfile.findUnique({ where: { userId } });
        if (!profile) return [];

        return prisma.advisorLicenseDocument.findMany({
            where: { advisorId: profile.id },
            orderBy: { createdAt: 'desc' }
        });
    }

    static async deleteLicenseDocument(userId: string, docId: string) {
        const profile = await prisma.advisorProfile.findUnique({ where: { userId } });
        if (!profile) throw new Error('Profile not found');

        const doc = await prisma.advisorLicenseDocument.findUnique({ where: { id: docId } });
        if (!doc || doc.advisorId !== profile.id) throw new Error('Document not found');

        return prisma.advisorLicenseDocument.delete({ where: { id: docId } });
    }

    // ─── Availability Rules ────────────────────────────────────────────────────

    static async getAvailabilityRules(userId: string) {
        const profile = await prisma.advisorProfile.findUnique({ where: { userId } });
        if (!profile) return [];

        return prisma.availabilityRule.findMany({
            where: { advisorId: profile.id },
            orderBy: { dayOfWeek: 'asc' }
        });
    }

    static async setAvailabilityRules(userId: string, rules: {
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        isActive?: boolean;
    }[]) {
        const profile = await prisma.advisorProfile.findUnique({ where: { userId } });
        if (!profile) throw new Error('Profile not found');

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

    static async createAvailabilityException(userId: string, data: {
        date: Date;
        isBlackout: boolean;
        startTime?: string;
        endTime?: string;
        reason?: string;
    }) {
        const profile = await prisma.advisorProfile.findUnique({ where: { userId } });
        if (!profile) throw new Error('Profile not found');

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

    static async getAvailabilityExceptions(userId: string) {
        const profile = await prisma.advisorProfile.findUnique({ where: { userId } });
        if (!profile) return [];

        return prisma.availabilityException.findMany({
            where: { advisorId: profile.id },
            orderBy: { date: 'asc' }
        });
    }

    static async deleteAvailabilityException(userId: string, exceptionId: string) {
        const profile = await prisma.advisorProfile.findUnique({ where: { userId } });
        if (!profile) throw new Error('Profile not found');

        const ex = await prisma.availabilityException.findUnique({ where: { id: exceptionId } });
        if (!ex || ex.advisorId !== profile.id) throw new Error('Exception not found');

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

    static async adminGetAdvisorDetail(advisorId: string) {
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

    static async adminApproveAdvisor(adminId: string, advisorId: string, reason?: string) {
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

    static async adminRejectAdvisor(adminId: string, advisorId: string, reason: string) {
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

    static async adminPauseAdvisor(adminId: string, advisorId: string, reason?: string) {
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

    static async adminUnpauseAdvisor(adminId: string, advisorId: string, reason?: string) {
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

    static async adminVerifyDocument(adminId: string, docId: string, status: 'VERIFIED' | 'REJECTED', reason?: string) {
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

    static async getAuditLog(page = 1, limit = 50, filters?: {
        action?: string;
        targetType?: string;
        adminId?: string;
        targetId?: string;
    }) {
        const skip = (page - 1) * limit;
        const where: any = {};
        if (filters?.action) where.action = { contains: filters.action, mode: 'insensitive' };
        if (filters?.targetType) where.targetType = filters.targetType;
        if (filters?.adminId) where.adminId = filters.adminId;
        if (filters?.targetId) where.targetId = filters.targetId;

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

    static async openDispute(userId: string, bookingId: string, reason: string, description?: string) {
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: { dispute: true }
        });

        if (!booking) throw new Error('Booking not found');
        if (booking.userId !== userId) throw new Error('Unauthorized');
        if (booking.dispute) throw new Error('Dispute already exists for this booking');

        if (!['COMPLETED', 'NO_SHOW'].includes(booking.status as string)) {
            throw new Error('Can only dispute completed or no-show bookings');
        }

        // Create the dispute AND freeze the payout atomically — an open dispute
        // must stop the escrow clock from auto-releasing funds to the advisor.
        const [dispute] = await prisma.$transaction([
            prisma.dispute.create({
                data: {
                    bookingId,
                    openedBy: userId,
                    reason,
                    description,
                    status: 'OPEN',
                }
            }),
            prisma.booking.updateMany({
                where: {
                    id: bookingId,
                    payoutStatus: { in: ['UNPAID', 'ESCROWED'] },
                },
                data: { payoutStatus: 'DISPUTED' },
            }),
        ]);

        logger.info(`🛑 Dispute ${dispute.id} opened on booking ${bookingId}; payout frozen`);
        return dispute;
    }

    static async adminResolveDispute(adminId: string, disputeId: string, resolution: 'REFUND' | 'RELEASE', data: {
        resolution: string;
        refundAmount?: number;
    }) {
        const dispute = await prisma.dispute.findUnique({
            where: { id: disputeId },
            include: { booking: true }
        });

        if (!dispute) throw new Error('Dispute not found');

        if (dispute.status !== 'OPEN') throw new Error('Dispute has already been resolved');

        const newStatus = resolution === 'REFUND' ? 'RESOLVED_REFUNDED' : 'RESOLVED_RELEASED';

        // Execute the real money movement first — never record a refund in the
        // database that Stripe did not actually perform.
        let refundResult: any = null;
        if (resolution === 'REFUND') {
            const { StripeService } = await import('./stripeService.js');
            refundResult = await StripeService.refundBookingPayment(
                dispute.bookingId,
                data.refundAmount ?? undefined, // cents; undefined = full amount
            );
        }

        const updated = await prisma.dispute.update({
            where: { id: disputeId },
            data: {
                status: newStatus as any,
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
                    payoutStatus: 'REFUNDED',
                    refundAmount: data.refundAmount ? (data.refundAmount / 100) : dispute.booking.totalAmount,
                    refundedAt: new Date(),
                }
            });
        } else if (resolution === 'RELEASE') {
            // Unfreeze and re-queue the escrow payout. If the 30-day hold already
            // elapsed during the dispute, release immediately; otherwise respect it.
            const booking = await prisma.booking.update({
                where: { id: dispute.bookingId },
                data: { payoutStatus: 'ESCROWED' },
            });
            const releaseAt = booking.escrowReleaseDate && booking.escrowReleaseDate > new Date()
                ? booking.escrowReleaseDate
                : new Date();
            const { BookingPayoutSagaService } = await import('./bookingPayoutSagaService.js');
            await BookingPayoutSagaService.enqueuePayoutReleaseEvent({
                bookingId: booking.id,
                source: 'dispute-resolved-release',
                availableAt: releaseAt,
            });
        }

        await prisma.adminActionLog.create({
            data: {
                adminId,
                action: `RESOLVE_DISPUTE_${resolution}`,
                targetType: 'DISPUTE',
                targetId: disputeId,
                reason: data.resolution,
                metadata: { refundAmount: data.refundAmount, stripeRefundId: refundResult?.refundId ?? null },
            }
        });

        return updated;
    }

    static async getDisputes(page = 1, limit = 20, status?: string) {
        const skip = (page - 1) * limit;
        const where: any = status ? { status } : {};

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

    static async getAdvisorEarnings(userId: string) {
        const profile = await prisma.advisorProfile.findUnique({ where: { userId } });
        if (!profile) throw new Error('Profile not found');

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

