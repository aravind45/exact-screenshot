import { describe, it, expect } from 'vitest';
import { TRACK_STAGES } from '@/config/settlementStages';

describe('Tier 3 Settlement Types - Quality Improvements', () => {
    describe('INTESTATE (Target: 77% → 85%)', () => {
        const intestateStages = TRACK_STAGES.INTESTATE;

        it('should have 5 detailed phases', () => {
            expect(intestateStages).toHaveLength(5);
        });

        it('should include heir hierarchy determination phase', () => {
            const hierarchyPhase = intestateStages.find(s => s.id === 'hierarchy');
            expect(hierarchyPhase).toBeDefined();
            expect(hierarchyPhase?.title).toBe('Heir Hierarchy');
            expect(hierarchyPhase?.tasks).toBeDefined();
            expect(hierarchyPhase?.tasks?.length).toBeGreaterThanOrEqual(7);
        });

        it('should distinguish Administrator vs Executor', () => {
            const petitionPhase = intestateStages.find(s => s.id === 'admin_petition');
            expect(petitionPhase).toBeDefined();
            expect(petitionPhase?.title).toContain('Administrator');

            const bondPhase = intestateStages.find(s => s.id === 'bond');
            expect(bondPhase?.description).toContain('Letters of Administration');
        });

        it('should include bond requirement logic', () => {
            const bondPhase = intestateStages.find(s => s.id === 'bond');
            expect(bondPhase).toBeDefined();
            expect(bondPhase?.title).toContain('Bond');

            const bondTask = bondPhase?.tasks?.find(t => t.id === 'post_bond');
            expect(bondTask).toBeDefined();
            expect(bondTask?.title).toContain('surety bond');
        });

        it('should include statutory distribution (not Will)', () => {
            const distributionPhase = intestateStages.find(s => s.id === 'statutory');
            expect(distributionPhase).toBeDefined();
            expect(distributionPhase?.title).toContain('Statutory');
            expect(distributionPhase?.description).toContain('state intestacy law');
            expect(distributionPhase?.description).toContain('not Will');
        });

        it('should have comprehensive tasks for each phase', () => {
            intestateStages.forEach(stage => {
                expect(stage.tasks).toBeDefined();
                expect(stage.tasks!.length).toBeGreaterThan(0);

                // Verify all tasks have id and title
                stage.tasks!.forEach(task => {
                    expect(task.id).toBeDefined();
                    expect(task.title).toBeDefined();
                    expect(task.title.length).toBeGreaterThan(0);
                });
            });
        });

        it('should total at least 35 tasks across all phases', () => {
            const totalTasks = intestateStages.reduce((sum, stage) =>
                sum + (stage.tasks?.length || 0), 0
            );
            expect(totalTasks).toBeGreaterThanOrEqual(35);
        });

        it('should include state intestacy calculator task', () => {
            const hierarchyPhase = intestateStages.find(s => s.id === 'hierarchy');
            const calculatorTask = hierarchyPhase?.tasks?.find(t =>
                t.id === 'calculator' || t.title.toLowerCase().includes('calculator')
            );
            expect(calculatorTask).toBeDefined();
        });

        it('should verify no Will exists', () => {
            const hierarchyPhase = intestateStages.find(s => s.id === 'hierarchy');
            const verifyTask = hierarchyPhase?.tasks?.find(t =>
                t.id === 'verify_no_will' || t.title.toLowerCase().includes('verify')
            );
            expect(verifyTask).toBeDefined();
        });
    });

    describe('INFORMAL_PROBATE (Target: 75% → 85%)', () => {
        const informalStages = TRACK_STAGES.INFORMAL_PROBATE;

        it('should have 5 detailed phases', () => {
            expect(informalStages).toHaveLength(5);
        });

        it('should include uncontested verification phase', () => {
            const verifyPhase = informalStages.find(s => s.id === 'verify_uncontested');
            expect(verifyPhase).toBeDefined();
            expect(verifyPhase?.title).toContain('Uncontested');
            expect(verifyPhase?.tasks).toBeDefined();
            expect(verifyPhase?.tasks?.length).toBeGreaterThanOrEqual(6);
        });

        it('should use simplified petition process', () => {
            const petitionPhase = informalStages.find(s => s.id === 'simplified_petition');
            expect(petitionPhase).toBeDefined();
            expect(petitionPhase?.title).toContain('Simplified');

            const bondWaiverTask = petitionPhase?.tasks?.find(t =>
                t.id === 'waive_bond' || t.title.toLowerCase().includes('waive')
            );
            expect(bondWaiverTask).toBeDefined();
        });

        it('should grant independent administration', () => {
            const authorityPhase = informalStages.find(s => s.id === 'streamlined_authority');
            expect(authorityPhase).toBeDefined();

            const independentTask = authorityPhase?.tasks?.find(t =>
                t.id === 'independent_note' || t.title.toLowerCase().includes('independent')
            );
            expect(independentTask).toBeDefined();
        });

        it('should have minimal court supervision', () => {
            const authorityPhase = informalStages.find(s => s.id === 'streamlined_authority');
            const supervisionTask = authorityPhase?.tasks?.find(t =>
                t.id === 'minimal_supervision' || t.title.toLowerCase().includes('minimal')
            );
            expect(supervisionTask).toBeDefined();
        });

        it('should not require formal accounting in most states', () => {
            const adminPhase = informalStages.find(s => s.id === 'informal_administration');
            const noAccountingTask = adminPhase?.tasks?.find(t =>
                t.id === 'no_accounting' || t.title.toLowerCase().includes('no formal accounting')
            );
            expect(noAccountingTask).toBeDefined();
        });

        it('should allow simplified distribution', () => {
            const distributionPhase = informalStages.find(s => s.id === 'simplified_distribution');
            expect(distributionPhase).toBeDefined();
            expect(distributionPhase?.title).toContain('Simplified');

            const closeTask = distributionPhase?.tasks?.find(t =>
                t.id === 'close_estate' || t.title.toLowerCase().includes('without formal hearing')
            );
            expect(closeTask).toBeDefined();
        });

        it('should have comprehensive tasks for each phase', () => {
            informalStages.forEach(stage => {
                expect(stage.tasks).toBeDefined();
                expect(stage.tasks!.length).toBeGreaterThan(0);

                // Verify all tasks have id and title
                stage.tasks!.forEach(task => {
                    expect(task.id).toBeDefined();
                    expect(task.title).toBeDefined();
                    expect(task.title.length).toBeGreaterThan(0);
                });
            });
        });

        it('should total at least 30 tasks across all phases', () => {
            const totalTasks = informalStages.reduce((sum, stage) =>
                sum + (stage.tasks?.length || 0), 0
            );
            expect(totalTasks).toBeGreaterThanOrEqual(30);
        });

        it('should require beneficiary consents', () => {
            const distributionPhase = informalStages.find(s => s.id === 'simplified_distribution');
            const consentTask = distributionPhase?.tasks?.find(t =>
                t.id === 'beneficiary_consents' || t.title.toLowerCase().includes('consent')
            );
            expect(consentTask).toBeDefined();
        });
    });

    describe('Quality Metrics Comparison', () => {
        it('INTESTATE should have more tasks than before (baseline: 5 basic stages)', () => {
            const totalTasks = TRACK_STAGES.INTESTATE.reduce((sum, stage) =>
                sum + (stage.tasks?.length || 0), 0
            );
            // Before: 5 stages with no tasks = 0 tasks
            // After: Should have 35+ tasks
            expect(totalTasks).toBeGreaterThan(30);
        });

        it('INFORMAL_PROBATE should have more tasks than before (baseline: 3 basic stages)', () => {
            const totalTasks = TRACK_STAGES.INFORMAL_PROBATE.reduce((sum, stage) =>
                sum + (stage.tasks?.length || 0), 0
            );
            // Before: 3 stages with minimal tasks
            // After: Should have 30+ tasks
            expect(totalTasks).toBeGreaterThan(25);
        });

        it('Both types should have detailed task breakdowns', () => {
            const intestateTasks = TRACK_STAGES.INTESTATE.reduce((sum, s) =>
                sum + (s.tasks?.length || 0), 0
            );
            const informalTasks = TRACK_STAGES.INFORMAL_PROBATE.reduce((sum, s) =>
                sum + (s.tasks?.length || 0), 0
            );

            // Combined should be 65+ tasks
            expect(intestateTasks + informalTasks).toBeGreaterThan(60);
        });
    });
});
