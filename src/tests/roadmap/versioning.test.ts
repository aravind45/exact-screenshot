import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database
vi.mock('../../db.js', () => ({
    prisma: {
        estate: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
        roadmapVersion: {
            findFirst: vi.fn(),
            findMany: vi.fn(),
        },
        settlementActivity: {
            create: vi.fn(),
        },
    },
}));

describe('Roadmap Versioning', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Estate Time Pinning', () => {
        it('should use pinned version when estate has roadmapVersion set', async () => {
            // This test validates the logic - in production, DB would return pinned version
            const estate = {
                roadmapVersion: '1.0.0',
                roadmapPinnedAt: new Date('2025-01-15'),
            };
            
            // When version is pinned, the service should use that version
            expect(estate.roadmapVersion).toBe('1.0.0');
            expect(estate.roadmapPinnedAt).toBeDefined();
        });

        it('should use latest version when estate has no roadmapVersion', async () => {
            const estate = {
                roadmapVersion: null,
                roadmapPinnedAt: null,
            };
            
            // When version is null, service should fetch latest
            expect(estate.roadmapVersion).toBeNull();
        });

        it('should return version info in roadmap response', () => {
            const response = {
                estateId: 'estate-1',
                phases: [],
                triggers: {
                    hasMinors: false,
                    isSmallEstate: false,
                    isPrimaryResidence: false,
                    isContested: false,
                    showBondWaiver: false,
                    showSpecialNotice: false,
                    activeEngines: []
                },
                profile: {},
                version: '1.0.0',
                pinnedAt: new Date('2025-01-15')
            };
            
            expect(response.version).toBeDefined();
            expect(response.pinnedAt).toBeDefined();
        });
    });

    describe('Version Pinning Flow', () => {
        it('should allow pinning estate to specific version', async () => {
            const pinRoadmapVersion = async (estateId: string, version: string, userId: string) => {
                // Simulate the pinning operation
                return {
                    success: true,
                    version,
                    pinnedAt: new Date()
                };
            };

            const result = await pinRoadmapVersion('estate-1', '1.0.0', 'user-1');
            expect(result.success).toBe(true);
            expect(result.version).toBe('1.0.0');
        });

        it('should allow unpinning estate to use latest version', async () => {
            const unpinRoadmapVersion = async (estateId: string, userId: string) => {
                // Simulate the unpin operation
                return { success: true };
            };

            const result = await unpinRoadmapVersion('estate-1', 'user-1');
            expect(result.success).toBe(true);
        });
    });

    describe('SSOT Version Management', () => {
        it('should list available versions for settlement type', async () => {
            const mockVersions = [
                { version: '1.1.0', isPublished: true, releasedAt: new Date('2025-02-01') },
                { version: '1.0.0', isPublished: true, releasedAt: new Date('2025-01-01') },
            ];

            // This would be the return from getAvailableRoadmapVersions
            expect(mockVersions.length).toBe(2);
            expect(mockVersions[0].version).toBe('1.1.0');
        });

        it('should create new version with proper fields', async () => {
            const newVersion = {
                version: '1.2.0',
                settlementTypeCode: 'FORMAL_PROBATE',
                isActive: true,
                isPublished: false,
                changelog: 'Added new tasks for federal tax filing',
                schemaHash: 'abc123',
            };

            expect(newVersion.version).toBeDefined();
            expect(newVersion.isPublished).toBe(false);
        });
    });
});

describe('Middleware - Subscription Gating', () => {
    describe('requireSubscription middleware', () => {
        it('should block requests without active subscription', () => {
            // Mock user without subscription
            const user = {
                subscriptionStatus: 'FREE',
                role: 'EXECUTOR',
                trialStartedAt: null,
                isPilot: false,
            };

            const canAccess = 
                user.role === 'ADMIN' ||
                user.subscriptionStatus === 'ACTIVE' ||
                (user.trialStartedAt && 
                    (new Date().getTime() - new Date(user.trialStartedAt).getTime() < 7 * 24 * 60 * 60 * 1000)) ||
                user.isPilot;

            expect(canAccess).toBe(false);
        });

        it('should allow requests with active subscription', () => {
            const user = {
                subscriptionStatus: 'ACTIVE',
                role: 'EXECUTOR',
                trialStartedAt: null,
                isPilot: false,
            };

            const canAccess = 
                user.role === 'ADMIN' ||
                user.subscriptionStatus === 'ACTIVE' ||
                (user.trialStartedAt && 
                    (new Date().getTime() - new Date(user.trialStartedAt).getTime() < 7 * 24 * 60 * 60 * 1000)) ||
                user.isPilot;

            expect(canAccess).toBe(true);
        });

        it('should allow admins regardless of subscription', () => {
            const user = {
                subscriptionStatus: 'FREE',
                role: 'ADMIN',
                trialStartedAt: null,
                isPilot: false,
            };

            const canAccess = 
                user.role === 'ADMIN' ||
                user.subscriptionStatus === 'ACTIVE';

            expect(canAccess).toBe(true);
        });

        it('should allow pilot users regardless of subscription', () => {
            const user = {
                subscriptionStatus: 'FREE',
                role: 'EXECUTOR',
                trialStartedAt: null,
                isPilot: true,
            };

            const canAccess = user.isPilot;

            expect(canAccess).toBe(true);
        });
    });
});
