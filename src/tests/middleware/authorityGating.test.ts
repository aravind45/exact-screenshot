import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    resolveEstateGates,
    checkOperationAllowed,
    requireAuthorityStatus,
    ENFORCEMENT_MATRIX,
    GATE_DEFINITIONS,
    type GateType,
    type AuthorityStatus,
    type AuthorityType
} from '../../../server/middleware/authorityGating';

// Mock prisma
vi.mock('../../../server/db.js', () => ({
    prisma: {
        estate: {
            findUnique: vi.fn()
        }
    }
}));

import { prisma } from '../../../server/db.js';

describe('Authority Gating Middleware', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('resolveEstateGates', () => {
        it('should return all gates closed for UNSET authority', async () => {
            const mockEstate = {
                id: 'estate-1',
                authorityStatus: 'NOT_STARTED',
                authorityType: 'UNSET'
            };
            (prisma.estate.findUnique as any).mockResolvedValue(mockEstate);

            const result = await resolveEstateGates('estate-1');

            expect(result.estateId).toBe('estate-1');
            expect(result.authorityStatus).toBe('NOT_STARTED');
            expect(result.authorityType).toBe('UNSET');
            expect(result.isFullyAuthorized).toBe(false);
            expect(result.closedGates).toContain('ASSET_COLLECTION');
            expect(result.closedGates).toContain('DISTRIBUTION');
            expect(result.closedGates).toContain('FULL_ADMINISTRATION');
        });

        it('should open ASSET_INVENTORY for all authority states', async () => {
            const mockEstate = {
                id: 'estate-1',
                authorityStatus: 'NOT_STARTED',
                authorityType: 'UNSET'
            };
            (prisma.estate.findUnique as any).mockResolvedValue(mockEstate);

            const result = await resolveEstateGates('estate-1');

            expect(result.gates.ASSET_INVENTORY.isOpen).toBe(true);
            expect(result.openGates).toContain('ASSET_INVENTORY');
        });

        it('should open collection gates for GRANTED formal probate', async () => {
            const mockEstate = {
                id: 'estate-1',
                authorityStatus: 'GRANTED',
                authorityType: 'FORMAL_PROBATE'
            };
            (prisma.estate.findUnique as any).mockResolvedValue(mockEstate);

            const result = await resolveEstateGates('estate-1');

            expect(result.isFullyAuthorized).toBe(true);
            expect(result.gates.ASSET_COLLECTION.isOpen).toBe(true);
            expect(result.gates.DISTRIBUTION.isOpen).toBe(true);
            expect(result.gates.CREDITOR_CLAIMS.isOpen).toBe(true);
            expect(result.gates.FULL_ADMINISTRATION.isOpen).toBe(true);
        });

        it('should open limited gates for SMALL_ESTATE authority', async () => {
            const mockEstate = {
                id: 'estate-1',
                authorityStatus: 'GRANTED',
                authorityType: 'SMALL_ESTATE'
            };
            (prisma.estate.findUnique as any).mockResolvedValue(mockEstate);

            const result = await resolveEstateGates('estate-1');

            expect(result.isFullyAuthorized).toBe(false);
            expect(result.gates.ASSET_COLLECTION.isOpen).toBe(true);
            expect(result.gates.DISTRIBUTION.isOpen).toBe(true);
            expect(result.gates.REAL_ESTATE.isOpen).toBe(false); // Small estate can't handle real estate
            expect(result.gates.LEGAL_ACTIONS.isOpen).toBe(false);
        });

        it('should open appropriate gates for trust administration', async () => {
            const mockEstate = {
                id: 'estate-1',
                authorityStatus: 'GRANTED',
                authorityType: 'TRUST_ADMIN_REVOCABLE'
            };
            (prisma.estate.findUnique as any).mockResolvedValue(mockEstate);

            const result = await resolveEstateGates('estate-1');

            expect(result.gates.ASSET_COLLECTION.isOpen).toBe(true);
            expect(result.gates.DISTRIBUTION.isOpen).toBe(true);
            expect(result.gates.CREDITOR_CLAIMS.isOpen).toBe(false); // Trusts don't handle creditor claims
        });

        it('should block all gates for EXPIRED authority', async () => {
            const mockEstate = {
                id: 'estate-1',
                authorityStatus: 'EXPIRED',
                authorityType: 'FORMAL_PROBATE'
            };
            (prisma.estate.findUnique as any).mockResolvedValue(mockEstate);

            const result = await resolveEstateGates('estate-1');

            expect(result.gates.ASSET_COLLECTION.isOpen).toBe(false);
            expect(result.gates.DISTRIBUTION.isOpen).toBe(false);
            expect(result.gates.FULL_ADMINISTRATION.isOpen).toBe(false);
        });

        it('should throw error for non-existent estate', async () => {
            (prisma.estate.findUnique as any).mockResolvedValue(null);

            await expect(resolveEstateGates('non-existent')).rejects.toThrow('Estate not found');
        });
    });

    describe('checkOperationAllowed', () => {
        it('should allow inventory operations with NOT_STARTED status', async () => {
            const mockEstate = {
                id: 'estate-1',
                authorityStatus: 'NOT_STARTED',
                authorityType: 'UNSET'
            };
            (prisma.estate.findUnique as any).mockResolvedValue(mockEstate);

            // ASSET_INVENTORY gate is always open
            const result = await checkOperationAllowed('estate-1', 'assets:create');

            expect(result.allowed).toBe(true);
            expect(result.requiredGates).toContain('ASSET_INVENTORY');
        });

        it('should block asset collection without granted authority', async () => {
            const mockEstate = {
                id: 'estate-1',
                authorityStatus: 'PENDING_FILING',
                authorityType: 'FORMAL_PROBATE'
            };
            (prisma.estate.findUnique as any).mockResolvedValue(mockEstate);

            const result = await checkOperationAllowed('estate-1', 'assets:collect');

            expect(result.allowed).toBe(false);
            expect(result.blockedGates).toContain('ASSET_COLLECTION');
        });

        it('should allow asset collection with GRANTED authority', async () => {
            const mockEstate = {
                id: 'estate-1',
                authorityStatus: 'GRANTED',
                authorityType: 'FORMAL_PROBATE'
            };
            (prisma.estate.findUnique as any).mockResolvedValue(mockEstate);

            const result = await checkOperationAllowed('estate-1', 'assets:collect');

            expect(result.allowed).toBe(true);
            expect(result.blockedGates).toHaveLength(0);
        });

        it('should block real estate sale for small estate', async () => {
            const mockEstate = {
                id: 'estate-1',
                authorityStatus: 'GRANTED',
                authorityType: 'SMALL_ESTATE'
            };
            (prisma.estate.findUnique as any).mockResolvedValue(mockEstate);

            const result = await checkOperationAllowed('estate-1', 'realestate:sell');

            expect(result.allowed).toBe(false);
            expect(result.blockedGates).toContain('REAL_ESTATE');
        });

        it('should allow distribution for granted authority', async () => {
            const mockEstate = {
                id: 'estate-1',
                authorityStatus: 'GRANTED',
                authorityType: 'FORMAL_PROBATE'
            };
            (prisma.estate.findUnique as any).mockResolvedValue(mockEstate);

            const result = await checkOperationAllowed('estate-1', 'distributions:execute');

            expect(result.allowed).toBe(true);
        });

        it('should return allowed for undefined operations', async () => {
            const mockEstate = {
                id: 'estate-1',
                authorityStatus: 'NOT_STARTED',
                authorityType: 'UNSET'
            };
            (prisma.estate.findUnique as any).mockResolvedValue(mockEstate);

            const result = await checkOperationAllowed('estate-1', 'unknown:operation');

            expect(result.allowed).toBe(true);
            expect(result.message).toContain('No authority restrictions');
        });
    });

    describe('ENFORCEMENT_MATRIX', () => {
        it('should have asset operations mapped to correct gates', () => {
            expect(ENFORCEMENT_MATRIX['assets:create']).toContain('ASSET_INVENTORY');
            expect(ENFORCEMENT_MATRIX['assets:collect']).toContain('ASSET_COLLECTION');
            expect(ENFORCEMENT_MATRIX['assets:transfer']).toContain('FULL_ADMINISTRATION');
        });

        it('should have distribution operations mapped to correct gates', () => {
            expect(ENFORCEMENT_MATRIX['distributions:create']).toContain('DISTRIBUTION');
            expect(ENFORCEMENT_MATRIX['distributions:execute']).toContain('DISTRIBUTION');
            expect(ENFORCEMENT_MATRIX['distributions:finalize']).toContain('FULL_ADMINISTRATION');
        });

        it('should have real estate operations mapped to correct gates', () => {
            expect(ENFORCEMENT_MATRIX['realestate:sell']).toContain('REAL_ESTATE');
            expect(ENFORCEMENT_MATRIX['realestate:sell']).toContain('FULL_ADMINISTRATION');
        });

        it('should have creditor operations mapped to correct gates', () => {
            expect(ENFORCEMENT_MATRIX['creditors:pay']).toContain('CREDITOR_CLAIMS');
            expect(ENFORCEMENT_MATRIX['creditors:pay']).toContain('FULL_ADMINISTRATION');
        });
    });

    describe('GATE_DEFINITIONS', () => {
        it('should define ASSET_INVENTORY as always available', () => {
            const def = GATE_DEFINITIONS.ASSET_INVENTORY;
            expect(def.requiredStatus).toContain('NOT_STARTED');
            expect(def.requiredStatus).toContain('GRANTED');
        });

        it('should define FULL_ADMINISTRATION as requiring GRANTED status', () => {
            const def = GATE_DEFINITIONS.FULL_ADMINISTRATION;
            expect(def.requiredStatus).toEqual(['GRANTED']);
            expect(def.excludedTypes).toContain('SMALL_ESTATE');
        });

        it('should exclude non-probate types from creditor claims', () => {
            const def = GATE_DEFINITIONS.CREDITOR_CLAIMS;
            expect(def.excludedTypes).toContain('POD_TOD_TRANSFER');
            expect(def.excludedTypes).toContain('JOINT_TRANSFER');
        });
    });

    describe('requireAuthorityStatus middleware', () => {
        it('should call next() when operation is allowed', async () => {
            const mockEstate = {
                id: 'estate-1',
                authorityStatus: 'GRANTED',
                authorityType: 'FORMAL_PROBATE'
            };
            (prisma.estate.findUnique as any).mockResolvedValue(mockEstate);

            const middleware = requireAuthorityStatus({ operation: 'assets:collect' });
            const req = {
                params: { estateId: 'estate-1' },
                user: { id: 'user-1' }
            };
            const res = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn()
            };
            const next = vi.fn();

            await middleware(req as any, res as any, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should return 403 when operation is blocked', async () => {
            const mockEstate = {
                id: 'estate-1',
                authorityStatus: 'PENDING_FILING',
                authorityType: 'FORMAL_PROBATE'
            };
            (prisma.estate.findUnique as any).mockResolvedValue(mockEstate);

            const middleware = requireAuthorityStatus({
                operation: 'assets:collect',
                customMessage: 'Custom error message'
            });
            const req = {
                params: { estateId: 'estate-1' },
                user: { id: 'user-1' }
            };
            const res = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn()
            };
            const next = vi.fn();

            await middleware(req as any, res as any, next);

            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                error: 'Authority Required',
                message: 'Custom error message',
                currentStatus: 'PENDING_FILING',
                authorityType: 'FORMAL_PROBATE'
            }));
        });

        it('should return 400 when estateId is missing', async () => {
            const middleware = requireAuthorityStatus({ operation: 'assets:collect' });
            const req = {
                params: {},
                user: { id: 'user-1' }
            };
            const res = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn()
            };
            const next = vi.fn();

            await middleware(req as any, res as any, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                error: 'Bad Request'
            }));
        });

        it('should return 401 when user is not authenticated', async () => {
            const middleware = requireAuthorityStatus({ operation: 'assets:collect' });
            const req = {
                params: { estateId: 'estate-1' }
                // no user
            };
            const res = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn()
            };
            const next = vi.fn();

            await middleware(req as any, res as any, next);

            expect(res.status).toHaveBeenCalledWith(401);
        });

        it('should check specific gates when provided', async () => {
            const mockEstate = {
                id: 'estate-1',
                authorityStatus: 'GRANTED',
                authorityType: 'FORMAL_PROBATE'
            };
            (prisma.estate.findUnique as any).mockResolvedValue(mockEstate);

            const middleware = requireAuthorityStatus({
                gates: ['ASSET_COLLECTION', 'DISTRIBUTION']
            });
            const req = {
                params: { estateId: 'estate-1' },
                user: { id: 'user-1' }
            };
            const res = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn()
            };
            const next = vi.fn();

            await middleware(req as any, res as any, next);

            expect(next).toHaveBeenCalled();
        });

        it('should attach gate resolution to request', async () => {
            const mockEstate = {
                id: 'estate-1',
                authorityStatus: 'GRANTED',
                authorityType: 'FORMAL_PROBATE'
            };
            (prisma.estate.findUnique as any).mockResolvedValue(mockEstate);

            const middleware = requireAuthorityStatus({ operation: 'assets:collect' });
            const req = {
                params: { estateId: 'estate-1' },
                user: { id: 'user-1' }
            };
            const res = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn()
            };
            const next = vi.fn();

            await middleware(req as any, res as any, next);

            expect(req.estateGates).toBeDefined();
            expect(req.estateGates.estateId).toBe('estate-1');
            expect(req.estateGates.authorityStatus).toBe('GRANTED');
        });
    });

    describe('Authority status transitions', () => {
        const statuses: AuthorityStatus[] = [
            'NOT_STARTED',
            'PENDING_FILING',
            'PENDING_HEARING',
            'PENDING_LETTERS',
            'GRANTED',
            'LIMITED_GRANTED',
            'EXPIRED',
            'REVOKED'
        ];

        it.each(statuses)('should handle %s status', async (status) => {
            const mockEstate = {
                id: 'estate-1',
                authorityStatus: status,
                authorityType: 'FORMAL_PROBATE'
            };
            (prisma.estate.findUnique as any).mockResolvedValue(mockEstate);

            const result = await resolveEstateGates('estate-1');

            expect(result.authorityStatus).toBe(status);
            expect(result.gates.ASSET_INVENTORY.isOpen).toBe(true); // Always open
        });
    });

    describe('Non-probate authority types', () => {
        const nonProbateTypes: AuthorityType[] = [
            'TRUST_ADMIN_REVOCABLE',
            'TRUST_ADMIN_IRREVOCABLE',
            'POD_TOD_TRANSFER',
            'JOINT_TRANSFER',
            'BENEFICIARY_DESIGNATED',
            'TOD_DEED'
        ];

        it.each(nonProbateTypes)('should handle %s type with GRANTED status', async (type) => {
            const mockEstate = {
                id: 'estate-1',
                authorityStatus: 'GRANTED',
                authorityType: type
            };
            (prisma.estate.findUnique as any).mockResolvedValue(mockEstate);

            const result = await resolveEstateGates('estate-1');

            expect(result.authorityType).toBe(type);
            expect(result.isFullyAuthorized).toBe(false);
            expect(result.gates.ASSET_INVENTORY.isOpen).toBe(true);
            expect(result.gates.ASSET_COLLECTION.isOpen).toBe(true);
            expect(result.gates.DISTRIBUTION.isOpen).toBe(true);
        });
    });

    describe('Small estate authority types', () => {
        const smallEstateTypes: AuthorityType[] = [
            'SMALL_ESTATE',
            'SUMMARY_ADMINISTRATION',
            'VOLUNTARY_ADMINISTRATION',
            'MUNIMENT_OF_TITLE'
        ];

        it.each(smallEstateTypes)('should open limited gates for %s', async (type) => {
            const mockEstate = {
                id: 'estate-1',
                authorityStatus: 'GRANTED',
                authorityType: type
            };
            (prisma.estate.findUnique as any).mockResolvedValue(mockEstate);

            const result = await resolveEstateGates('estate-1');

            expect(result.authorityType).toBe(type);
            expect(result.isFullyAuthorized).toBe(false);
            expect(result.gates.ASSET_COLLECTION.isOpen).toBe(true);
            expect(result.gates.DISTRIBUTION.isOpen).toBe(true);
            expect(result.gates.REAL_ESTATE.isOpen).toBe(false);
            expect(result.gates.LEGAL_ACTIONS.isOpen).toBe(false);
            expect(result.gates.FULL_ADMINISTRATION.isOpen).toBe(false);
        });
    });
});
