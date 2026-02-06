import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DistributionService } from '../../../server/services/distributionService';
import { prisma } from '../../../server/db';

// Mock Prisma
vi.mock('../../../server/db', () => ({
    prisma: {
        estate: {
            findUnique: vi.fn(),
        },
        liability: {
            findMany: vi.fn(),
        },
        estateDocument: {
            findMany: vi.fn(),
        },
        asset: {
            findMany: vi.fn(),
        },
        heir: {
            findMany: vi.fn(),
        },
    },
}));

describe('Distribution Service - Safety Gates', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should block distribution if notice period is not closed', async () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() - 30); // Only 30 days ago (threshold is 120 in CA)

        (prisma.estate.findUnique as any).mockResolvedValue({
            id: 'estate-1',
            appointedDate: futureDate,
            deceasedState: 'CA'
        });
        (prisma.liability.findMany as any).mockResolvedValue([]);
        (prisma.estateDocument.findMany as any).mockResolvedValue([
            { documentType: 'INVENTORY_APPRAISAL', status: 'OBTAINED' },
            { documentType: 'FINAL_ACCOUNTING', status: 'OBTAINED' }
        ]);
        (prisma.asset.findMany as any).mockResolvedValue([{ status: 'VERIFIED' }]);
        (prisma.heir.findMany as any).mockResolvedValue([{ isAdult: true }]);

        const readiness = await DistributionService.checkReadiness('estate-1');

        expect(readiness.allowed).toBe(false);
        expect(readiness.checks.noticePeriodClosed).toBe(false);
        expect(readiness.reasons.some(r => r.includes('Creditor notice period is still open'))).toBe(true);
    });

    it('should block distribution if accounting is not complete', async () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 150);

        (prisma.estate.findUnique as any).mockResolvedValue({
            id: 'estate-1',
            appointedDate: pastDate,
            deceasedState: 'CA'
        });
        (prisma.liability.findMany as any).mockResolvedValue([]);
        (prisma.estateDocument.findMany as any).mockResolvedValue([
            { documentType: 'INVENTORY_APPRAISAL', status: 'OBTAINED' }
            // Missing FINAL_ACCOUNTING
        ]);
        (prisma.asset.findMany as any).mockResolvedValue([{ status: 'VERIFIED' }]);
        (prisma.heir.findMany as any).mockResolvedValue([{ isAdult: true }]);

        const readiness = await DistributionService.checkReadiness('estate-1');

        expect(readiness.allowed).toBe(false);
        expect(readiness.checks.accountingComplete).toBe(false);
        expect(readiness.reasons).toContain('Final Accounting has not been completed or verified.');
    });

    it('should block distribution if minor heirs exist without blocked account proof', async () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 150);

        (prisma.estate.findUnique as any).mockResolvedValue({
            id: 'estate-1',
            appointedDate: pastDate,
            deceasedState: 'CA'
        });
        (prisma.liability.findMany as any).mockResolvedValue([]);
        (prisma.estateDocument.findMany as any).mockResolvedValue([
            { documentType: 'INVENTORY_APPRAISAL', status: 'OBTAINED' },
            { documentType: 'FINAL_ACCOUNTING', status: 'OBTAINED' }
        ]);
        (prisma.asset.findMany as any).mockResolvedValue([{ status: 'VERIFIED' }]);
        (prisma.heir.findMany as any).mockResolvedValue([{ isAdult: false }]); // Minor heir

        const readiness = await DistributionService.checkReadiness('estate-1');

        expect(readiness.allowed).toBe(false);
        expect(readiness.reasons.some(r => r.includes('Minor beneficiary detected'))).toBe(true);
    });

    it('should allow distribution if all gates are passed', async () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 150);

        (prisma.estate.findUnique as any).mockResolvedValue({
            id: 'estate-1',
            appointedDate: pastDate,
            deceasedState: 'CA'
        });
        (prisma.liability.findMany as any).mockResolvedValue([]);
        (prisma.estateDocument.findMany as any).mockResolvedValue([
            { documentType: 'INVENTORY_APPRAISAL', status: 'OBTAINED' },
            { documentType: 'FINAL_ACCOUNTING', status: 'OBTAINED' }
        ]);
        (prisma.asset.findMany as any).mockResolvedValue([{ status: 'VERIFIED' }]);
        (prisma.heir.findMany as any).mockResolvedValue([{ isAdult: true }]);

        const readiness = await DistributionService.checkReadiness('estate-1');

        expect(readiness.allowed).toBe(true);
        expect(readiness.status).toBe('ALLOWED');
    });
});
