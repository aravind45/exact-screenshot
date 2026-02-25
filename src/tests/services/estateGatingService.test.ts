import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EstateGatingService } from '../../../server/services/estateGatingService';

// Mock prisma
vi.mock('../../../server/db.js', () => ({
    prisma: {
        estate: {
            findUnique: vi.fn()
        },
        settlementActivity: {
            create: vi.fn()
        }
    }
}));

import { prisma } from '../../../server/db.js';

describe('EstateGatingService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getGateResolution', () => {
        it('should return full gate resolution', async () => {
            const mockEstate = {
                id: 'estate-1',
                authorityStatus: 'GRANTED',
                authorityType: 'FORMAL_PROBATE'
            };
            (prisma.estate.findUnique as any).mockResolvedValue(mockEstate);

            const result = await EstateGatingService.getGateResolution('estate-1');

            expect(result.estateId).toBe('estate-1');
            expect(result.gates).toBeDefined();
            expect(result.openGates).toBeDefined();
            expect(result.closedGates).toBeDefined();
        });
    });

    describe('checkOperation', () => {
        it('should return detailed operation check result', async () => {
            const mockEstate = {
                id: 'estate-1',
                authorityStatus: 'GRANTED',
                authorityType: 'FORMAL_PROBATE'
            };
            (prisma.estate.findUnique as any).mockResolvedValue(mockEstate);

            const result = await EstateGatingService.checkOperation('estate-1', 'assets:collect');

            expect(result.allowed).toBe(true);
            expect(result.resolution).toBeDefined();
            expect(result.requiredGates).toContain('ASSET_COLLECTION');
        });
    });

    describe('validateOperations', () => {
        it('should validate multiple operations', async () => {
            const mockEstate = {
                id: 'estate-1',
                authorityStatus: 'GRANTED',
                authorityType: 'FORMAL_PROBATE'
            };
            (prisma.estate.findUnique as any).mockResolvedValue(mockEstate);

            const operations = ['assets:collect', 'distributions:execute', 'realestate:sell'];
            const results = await EstateGatingService.validateOperations('estate-1', operations);

            expect(Object.keys(results)).toHaveLength(3);
            expect(results['assets:collect'].allowed).toBe(true);
            expect(results['distributions:execute'].allowed).toBe(true);
            expect(results['realestate:sell'].allowed).toBe(true);
        });

        it('should block operations that require unavailable gates', async () => {
            const mockEstate = {
                id: 'estate-1',
                authorityStatus: 'PENDING_FILING',
                authorityType: 'FORMAL_PROBATE'
            };
            (prisma.estate.findUnique as any).mockResolvedValue(mockEstate);

            const operations = ['assets:collect', 'assets:create'];
            const results = await EstateGatingService.validateOperations('estate-1', operations);

            expect(results['assets:collect'].allowed).toBe(false);
            expect(results['assets:create'].allowed).toBe(true); // Inventory is always allowed
        });
    });

    describe('getAuthoritySummary', () => {
        it('should return comprehensive authority summary', async () => {
            const mockEstate = {
                id: 'estate-1',
                authorityStatus: 'GRANTED',
                authorityType: 'FORMAL_PROBATE',
                probateStatus: 'EXECUTOR_APPOINTED',
                courtCaseNumber: 'CASE-123',
                appointedDate: new Date()
            };
            (prisma.estate.findUnique as any).mockResolvedValue(mockEstate);

            const result = await EstateGatingService.getAuthoritySummary('estate-1');

            expect(result.estateId).toBe('estate-1');
            expect(result.currentPhase).toBe('EXECUTOR_APPOINTED');
            expect(result.authorityStatus).toBe('GRANTED');
            expect(result.authorityType).toBe('FORMAL_PROBATE');
            expect(result.isFullyAuthorized).toBe(true);
            expect(result.canCollectAssets).toBe(true);
            expect(result.canDistribute).toBe(true);
            expect(result.nextSteps).toBeDefined();
            expect(result.nextSteps.length).toBeGreaterThan(0);
        });

        it('should return NOT_STARTED next steps for new estates', async () => {
            const mockEstate = {
                id: 'estate-1',
                authorityStatus: 'NOT_STARTED',
                authorityType: 'UNSET',
                probateStatus: null
            };
            (prisma.estate.findUnique as any).mockResolvedValue(mockEstate);

            const result = await EstateGatingService.getAuthoritySummary('estate-1');

            expect(result.nextSteps).toContain('Complete estate profile');
            expect(result.nextSteps).toContain('Determine appropriate probate path');
        });

        it('should return PENDING_FILING next steps', async () => {
            const mockEstate = {
                id: 'estate-1',
                authorityStatus: 'PENDING_FILING',
                authorityType: 'FORMAL_PROBATE',
                probateStatus: null
            };
            (prisma.estate.findUnique as any).mockResolvedValue(mockEstate);

            const result = await EstateGatingService.getAuthoritySummary('estate-1');

            expect(result.nextSteps).toContain('File probate petition with court');
            expect(result.nextSteps).toContain('Pay filing fees');
        });

        it('should throw error for non-existent estate', async () => {
            (prisma.estate.findUnique as any).mockResolvedValue(null);

            await expect(EstateGatingService.getAuthoritySummary('non-existent'))
                .rejects.toThrow('Estate not found');
        });
    });

    describe('canUpgradeAuthority', () => {
        it('should suggest SMALL_ESTATE for low value estates', async () => {
            const mockEstate = {
                id: 'estate-1',
                authorityType: 'UNSET',
                deceasedState: 'CA',
                assets: [{ value: 50000, category: 'financial' }],
                liabilities: [],
                heirs: []
            };
            (prisma.estate.findUnique as any).mockResolvedValue(mockEstate);

            const result = await EstateGatingService.canUpgradeAuthority('estate-1');

            expect(result.canUpgrade).toBe(true);
            expect(result.possibleUpgrades).toContain('SMALL_ESTATE');
            expect(result.possibleUpgrades).toContain('FORMAL_PROBATE');
        });

        it('should suggest FORMAL_PROBATE for high value estates', async () => {
            const mockEstate = {
                id: 'estate-1',
                authorityType: 'UNSET',
                deceasedState: 'CA',
                assets: [
                    { value: 300000, category: 'financial' },
                    { value: 500000, category: 'real_estate' }
                ],
                liabilities: [],
                heirs: []
            };
            (prisma.estate.findUnique as any).mockResolvedValue(mockEstate);

            const result = await EstateGatingService.canUpgradeAuthority('estate-1');

            expect(result.canUpgrade).toBe(true);
            expect(result.possibleUpgrades).toContain('FORMAL_PROBATE');
            expect(result.possibleUpgrades).not.toContain('SMALL_ESTATE'); // Has real estate
        });

        it('should return no upgrades when already at full probate', async () => {
            const mockEstate = {
                id: 'estate-1',
                authorityType: 'FORMAL_PROBATE',
                deceasedState: 'CA',
                assets: [],
                liabilities: [],
                heirs: []
            };
            (prisma.estate.findUnique as any).mockResolvedValue(mockEstate);

            const result = await EstateGatingService.canUpgradeAuthority('estate-1');

            expect(result.canUpgrade).toBe(false);
            expect(result.possibleUpgrades).toHaveLength(0);
            expect(result.currentType).toBe('FORMAL_PROBATE');
        });

        it('should throw error for non-existent estate', async () => {
            (prisma.estate.findUnique as any).mockResolvedValue(null);

            await expect(EstateGatingService.canUpgradeAuthority('non-existent'))
                .rejects.toThrow('Estate not found');
        });
    });

    describe('logGateAccess', () => {
        it('should create settlement activity log', async () => {
            (prisma.settlementActivity.create as any).mockResolvedValue({ id: 'log-1' });

            await EstateGatingService.logGateAccess(
                'estate-1',
                'user-1',
                'test:operation',
                ['ASSET_COLLECTION'],
                true,
                { ip: '127.0.0.1' }
            );

            expect(prisma.settlementActivity.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    estateId: 'estate-1',
                    userId: 'user-1',
                    type: 'AUTHORITY_GATE',
                    action: 'ACCESS_GRANTED'
                })
            }));
        });

        it('should log denied access', async () => {
            (prisma.settlementActivity.create as any).mockResolvedValue({ id: 'log-1' });

            await EstateGatingService.logGateAccess(
                'estate-1',
                'user-1',
                'test:operation',
                ['FULL_ADMINISTRATION'],
                false
            );

            expect(prisma.settlementActivity.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    action: 'ACCESS_DENIED'
                })
            }));
        });

        it('should handle logging errors gracefully', async () => {
            (prisma.settlementActivity.create as any).mockRejectedValue(new Error('DB error'));

            // Should not throw
            await expect(EstateGatingService.logGateAccess(
                'estate-1',
                'user-1',
                'test:operation',
                ['ASSET_COLLECTION'],
                true
            )).resolves.not.toThrow();
        });
    });

    describe('batchCheckGates', () => {
        it('should check gates for multiple estates', async () => {
            const mockEstates = [
                { id: 'estate-1', authorityStatus: 'GRANTED', authorityType: 'FORMAL_PROBATE' },
                { id: 'estate-2', authorityStatus: 'PENDING_FILING', authorityType: 'FORMAL_PROBATE' }
            ];

            (prisma.estate.findUnique as any)
                .mockResolvedValueOnce(mockEstates[0])
                .mockResolvedValueOnce(mockEstates[1]);

            const results = await EstateGatingService.batchCheckGates(
                ['estate-1', 'estate-2'],
                'ASSET_COLLECTION'
            );

            expect(results['estate-1'].allowed).toBe(true);
            expect(results['estate-2'].allowed).toBe(false);
        });

        it('should handle errors for individual estates', async () => {
            (prisma.estate.findUnique as any)
                .mockResolvedValueOnce({
                    id: 'estate-1',
                    authorityStatus: 'GRANTED',
                    authorityType: 'FORMAL_PROBATE'
                })
                .mockResolvedValueOnce(null);

            const results = await EstateGatingService.batchCheckGates(
                ['estate-1', 'estate-2'],
                'ASSET_COLLECTION'
            );

            expect(results['estate-1'].allowed).toBe(true);
            expect(results['estate-2'].allowed).toBe(false);
            expect(results['estate-2'].message).toContain('not found');
        });
    });

    describe('getAvailableOperations', () => {
        it('should return all operations with their status', async () => {
            const mockEstate = {
                id: 'estate-1',
                authorityStatus: 'GRANTED',
                authorityType: 'FORMAL_PROBATE'
            };
            (prisma.estate.findUnique as any).mockResolvedValue(mockEstate);

            const operations = await EstateGatingService.getAvailableOperations('estate-1');

            expect(operations.length).toBeGreaterThan(0);

            // Check structure
            const firstOp = operations[0];
            expect(firstOp).toHaveProperty('operation');
            expect(firstOp).toHaveProperty('allowed');
            expect(firstOp).toHaveProperty('requiredGates');

            // Allowed operations should come first (if there are any blocked operations)
            const allowedOps = operations.filter(o => o.allowed);
            const blockedOps = operations.filter(o => !o.allowed);
            if (allowedOps.length > 0 && blockedOps.length > 0) {
                expect(operations.indexOf(allowedOps[0])).toBeLessThan(operations.indexOf(blockedOps[0]));
            }
        });

        it('should show limited operations for small estates', async () => {
            const mockEstate = {
                id: 'estate-1',
                authorityStatus: 'GRANTED',
                authorityType: 'SMALL_ESTATE'
            };
            (prisma.estate.findUnique as any).mockResolvedValue(mockEstate);

            const operations = await EstateGatingService.getAvailableOperations('estate-1');

            const realEstateSell = operations.find(o => o.operation === 'realestate:sell');
            expect(realEstateSell?.allowed).toBe(false);
        });
    });

    describe('getGateDefinitions', () => {
        it('should return all gate definitions', () => {
            const definitions = EstateGatingService.getGateDefinitions();

            expect(definitions.ASSET_INVENTORY).toBeDefined();
            expect(definitions.ASSET_COLLECTION).toBeDefined();
            expect(definitions.DISTRIBUTION).toBeDefined();
            expect(definitions.FULL_ADMINISTRATION).toBeDefined();
        });
    });

    describe('getEnforcementMatrix', () => {
        it('should return enforcement matrix', () => {
            const matrix = EstateGatingService.getEnforcementMatrix();

            expect(matrix['assets:collect']).toBeDefined();
            expect(matrix['distributions:execute']).toBeDefined();
            expect(matrix['realestate:sell']).toBeDefined();
        });
    });

    describe('Integration scenarios', () => {
        it('should handle complete estate lifecycle', async () => {
            // New estate
            const newEstate = {
                id: 'estate-1',
                authorityStatus: 'NOT_STARTED',
                authorityType: 'UNSET'
            };
            (prisma.estate.findUnique as any).mockResolvedValue(newEstate);

            let resolution = await EstateGatingService.getGateResolution('estate-1');
            expect(resolution.isFullyAuthorized).toBe(false);
            expect(resolution.gates.ASSET_COLLECTION.isOpen).toBe(false);

            // After filing
            newEstate.authorityStatus = 'PENDING_FILING';
            resolution = await EstateGatingService.getGateResolution('estate-1');
            expect(resolution.gates.ASSET_COLLECTION.isOpen).toBe(false);

            // Granted
            newEstate.authorityStatus = 'GRANTED';
            newEstate.authorityType = 'FORMAL_PROBATE';
            resolution = await EstateGatingService.getGateResolution('estate-1');
            expect(resolution.isFullyAuthorized).toBe(true);
            expect(resolution.gates.ASSET_COLLECTION.isOpen).toBe(true);
            expect(resolution.gates.DISTRIBUTION.isOpen).toBe(true);
        });

        it('should handle trust estate correctly', async () => {
            const trustEstate = {
                id: 'estate-1',
                authorityStatus: 'GRANTED',
                authorityType: 'TRUST_ADMIN_REVOCABLE'
            };
            (prisma.estate.findUnique as any).mockResolvedValue(trustEstate);

            const summary = await EstateGatingService.getAuthoritySummary('estate-1');

            expect(summary.isFullyAuthorized).toBe(false);
            expect(summary.canCollectAssets).toBe(true);
            expect(summary.canDistribute).toBe(true);
            expect(summary.canHandleCreditors).toBe(false); // Trusts don't handle creditors
        });
    });
});
