import { describe, it, expect } from 'vitest';
import { filterTasksForEstate } from '../../../server/services/roadmapService';
import { SETTLEMENT_PHASE_TASKS } from '../../../src/config/settlementPhases';

describe('Roadmap Service - Task Filtering', () => {
    const baseProfile = {
        id: 'estate-1',
        hasMinorBeneficiaries: false,
        isSmallEstate: false,
        isPrimaryResidence: false,
        isContested: false,
        state: 'CA',
        estimatedValue: 100000,
        totalDebts: 0,
        solvencyRatio: 1,
        authoritySource: 'COURT' as any,
        procedureType: 'FORMAL_PROBATE' as any,
        distributionModel: 'TESTATE' as any,
        activeEngines: ['PROBATE']
    };

    it('should include contest-specific tasks only when isContested is true', () => {
        // Find contest phase (e.g., litigation) if it exists, or look for specific tasks
        const uncontestedRoadmap = filterTasksForEstate(SETTLEMENT_PHASE_TASKS, baseProfile);
        const contestTask = uncontestedRoadmap.flatMap(p => p.tasks).find(t => t.id === 'resolve_contest');
        expect(contestTask).toBeUndefined();

        const contestedProfile = { ...baseProfile, isContested: true, activeEngines: ['PROBATE'] };
        const contestedRoadmap = filterTasksForEstate(SETTLEMENT_PHASE_TASKS, contestedProfile);
        const contestTaskFound = contestedRoadmap.flatMap(p => p.tasks).find(t => t.id === 'resolve_contest');
        expect(contestTaskFound).toBeDefined();
    });

    it('should include minor-specific tasks only when hasMinorBeneficiaries is true', () => {
        const noMinorsRoadmap = filterTasksForEstate(SETTLEMENT_PHASE_TASKS, baseProfile);
        const minorTask = noMinorsRoadmap.flatMap(p => p.tasks).find(t => t.id === 'petition_guardian_ad_litem');
        expect(minorTask).toBeUndefined();

        const minorsProfile = { ...baseProfile, hasMinorBeneficiaries: true };
        const minorsRoadmap = filterTasksForEstate(SETTLEMENT_PHASE_TASKS, minorsProfile);
        const minorTaskFound = minorsRoadmap.flatMap(p => p.tasks).find(t => t.id === 'petition_guardian_ad_litem');
        expect(minorTaskFound).toBeDefined();
    });

    it('should respect track compatibility (e.g., probate tasks for probate engines)', () => {
        const probateProfile = { ...baseProfile, activeEngines: ['PROBATE'] };
        const probateRoadmap = filterTasksForEstate(SETTLEMENT_PHASE_TASKS, probateProfile);

        // Find a task that is strictly for probate
        const petitionTask = probateRoadmap.flatMap(p => p.tasks).find(t => t.id === 'file_petition');
        expect(petitionTask).toBeDefined();

        const trustOnlyProfile = { ...baseProfile, activeEngines: ['TRUST'], authoritySource: 'FIDUCIARY_INSTRUMENT' as any };
        const trustRoadmap = filterTasksForEstate(SETTLEMENT_PHASE_TASKS, trustOnlyProfile);
        const probatePetitionTask = trustRoadmap.flatMap(p => p.tasks).find(t => t.id === 'file_petition');

        // If it has trackCompatibility: ['PROBATE'], it should be filtered out
        expect(probatePetitionTask).toBeUndefined();
    });
});
