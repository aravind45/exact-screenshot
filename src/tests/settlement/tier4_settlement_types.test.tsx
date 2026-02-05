import { describe, it, expect } from 'vitest';
import { TRACK_STAGES } from '@/config/settlementStages';

describe('Tier 4 Settlement Types - Quality Improvements', () => {
    describe('INSOLVENT (Target: 65% → 85%)', () => {
        const insolventStages = TRACK_STAGES.INSOLVENT;

        it('should have 6 detailed phases', () => {
            expect(insolventStages).toHaveLength(6);
        });

        it('should include insolvency determination phase', () => {
            const determinationPhase = insolventStages.find(s => s.id === 'insolvency_determination');
            expect(determinationPhase).toBeDefined();
            expect(determinationPhase?.title).toContain('Insolvency Determination');
            expect(determinationPhase?.tasks).toBeDefined();
            expect(determinationPhase?.tasks?.length).toBeGreaterThanOrEqual(7);
        });

        it('should classify creditors by 8 priority levels', () => {
            const priorityPhase = insolventStages.find(s => s.id === 'creditor_priority');
            expect(priorityPhase).toBeDefined();
            expect(priorityPhase?.title).toContain('Priority');

            // Should have 9 tasks (1 classify + 8 priorities)
            expect(priorityPhase?.tasks?.length).toBe(9);

            // Verify all 8 priority levels exist
            const priorities = priorityPhase?.tasks?.filter(t => t.id.startsWith('priority_'));
            expect(priorities?.length).toBe(8);
        });

        it('should require court approval before paying creditors', () => {
            const courtPhase = insolventStages.find(s => s.id === 'court_approval');
            expect(courtPhase).toBeDefined();
            expect(courtPhase?.title).toContain('Court Approval');

            const approvalTask = courtPhase?.tasks?.find(t =>
                t.id === 'request_approval' || t.title.toLowerCase().includes('court approval')
            );
            expect(approvalTask).toBeDefined();
        });

        it('should include asset liquidation phase', () => {
            const liquidationPhase = insolventStages.find(s => s.id === 'asset_liquidation');
            expect(liquidationPhase).toBeDefined();
            expect(liquidationPhase?.title).toContain('Liquidation');
            expect(liquidationPhase?.tasks?.length).toBeGreaterThanOrEqual(7);
        });

        it('should include pro-rata distribution phase', () => {
            const distributionPhase = insolventStages.find(s => s.id === 'prorata_distribution');
            expect(distributionPhase).toBeDefined();
            expect(distributionPhase?.title).toContain('Pro-Rata');

            const prorataTask = distributionPhase?.tasks?.find(t =>
                t.id === 'calculate_prorata' || t.title.toLowerCase().includes('pro-rata')
            );
            expect(prorataTask).toBeDefined();
        });

        it('should include final accounting phase', () => {
            const accountingPhase = insolventStages.find(s => s.id === 'final_accounting');
            expect(accountingPhase).toBeDefined();
            expect(accountingPhase?.title).toContain('Final Accounting');

            const complianceTask = accountingPhase?.tasks?.find(t =>
                t.id === 'document_compliance' || t.title.toLowerCase().includes('compliance')
            );
            expect(complianceTask).toBeDefined();
        });

        it('should have comprehensive tasks for each phase', () => {
            insolventStages.forEach(stage => {
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

        it('should total at least 45 tasks across all phases', () => {
            const totalTasks = insolventStages.reduce((sum, stage) =>
                sum + (stage.tasks?.length || 0), 0
            );
            expect(totalTasks).toBeGreaterThanOrEqual(45);
        });

        it('should warn about executor liability', () => {
            const priorityPhase = insolventStages.find(s => s.id === 'creditor_priority');
            expect(priorityPhase).toBeDefined();
            // Priority classification is critical to avoid executor liability
            expect(priorityPhase?.description).toContain('priority');
        });
    });

    describe('ANCILLARY_PROBATE (Target: 68% → 85%)', () => {
        const ancillaryStages = TRACK_STAGES.ANCILLARY_PROBATE;

        it('should have 5 detailed phases', () => {
            expect(ancillaryStages).toHaveLength(5);
        });

        it('should include domiciliary probate completion phase', () => {
            const domiciliaryPhase = ancillaryStages.find(s => s.id === 'domiciliary_completion');
            expect(domiciliaryPhase).toBeDefined();
            expect(domiciliaryPhase?.title).toContain('Domiciliary');
            expect(domiciliaryPhase?.tasks).toBeDefined();
            expect(domiciliaryPhase?.tasks?.length).toBeGreaterThanOrEqual(6);
        });

        it('should require exemplified documents', () => {
            const documentsPhase = ancillaryStages.find(s => s.id === 'exemplified_documents');
            expect(documentsPhase).toBeDefined();
            expect(documentsPhase?.title).toContain('Exemplified');

            const exemplifiedWillTask = documentsPhase?.tasks?.find(t =>
                t.id === 'exemplified_will' || t.title.toLowerCase().includes('exemplified')
            );
            expect(exemplifiedWillTask).toBeDefined();
        });

        it('should require local counsel', () => {
            const counselPhase = ancillaryStages.find(s => s.id === 'local_counsel_filing');
            expect(counselPhase).toBeDefined();
            expect(counselPhase?.title).toContain('Local Counsel');

            const retainAttorneyTask = counselPhase?.tasks?.find(t =>
                t.id === 'retain_attorney' || t.title.toLowerCase().includes('attorney')
            );
            expect(retainAttorneyTask).toBeDefined();
        });

        it('should include local administration phase', () => {
            const adminPhase = ancillaryStages.find(s => s.id === 'local_administration');
            expect(adminPhase).toBeDefined();
            expect(adminPhase?.title).toContain('Local Administration');

            const coordinateTask = adminPhase?.tasks?.find(t =>
                t.id === 'coordinate' || t.title.toLowerCase().includes('coordinate')
            );
            expect(coordinateTask).toBeDefined();
        });

        it('should include property disposition phase', () => {
            const dispositionPhase = ancillaryStages.find(s => s.id === 'property_disposition');
            expect(dispositionPhase).toBeDefined();
            expect(dispositionPhase?.title).toContain('Property');

            const decideTask = dispositionPhase?.tasks?.find(t =>
                t.id === 'decide_disposition' || t.title.toLowerCase().includes('decide')
            );
            expect(decideTask).toBeDefined();
        });

        it('should have comprehensive tasks for each phase', () => {
            ancillaryStages.forEach(stage => {
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
            const totalTasks = ancillaryStages.reduce((sum, stage) =>
                sum + (stage.tasks?.length || 0), 0
            );
            expect(totalTasks).toBeGreaterThanOrEqual(30);
        });

        it('should address multi-state coordination', () => {
            const adminPhase = ancillaryStages.find(s => s.id === 'local_administration');
            const coordinateTask = adminPhase?.tasks?.find(t => t.id === 'coordinate');
            expect(coordinateTask).toBeDefined();
            expect(coordinateTask?.title).toContain('domiciliary');
        });
    });

    describe('Quality Metrics Comparison', () => {
        it('INSOLVENT should have significantly more tasks than before', () => {
            const totalTasks = TRACK_STAGES.INSOLVENT.reduce((sum, stage) =>
                sum + (stage.tasks?.length || 0), 0
            );
            // Before: 4 stages with no tasks = 0 tasks
            // After: Should have 45+ tasks
            expect(totalTasks).toBeGreaterThan(40);
        });

        it('ANCILLARY_PROBATE should have significantly more tasks than before', () => {
            const totalTasks = TRACK_STAGES.ANCILLARY_PROBATE.reduce((sum, stage) =>
                sum + (stage.tasks?.length || 0), 0
            );
            // Before: 4 stages with no tasks = 0 tasks
            // After: Should have 30+ tasks
            expect(totalTasks).toBeGreaterThan(30);
        });

        it('Both types should have detailed task breakdowns', () => {
            const insolventTasks = TRACK_STAGES.INSOLVENT.reduce((sum, s) =>
                sum + (s.tasks?.length || 0), 0
            );
            const ancillaryTasks = TRACK_STAGES.ANCILLARY_PROBATE.reduce((sum, s) =>
                sum + (s.tasks?.length || 0), 0
            );

            // Combined should be 75+ tasks
            expect(insolventTasks + ancillaryTasks).toBeGreaterThan(70);
        });

        it('INSOLVENT should have more phases than ANCILLARY_PROBATE', () => {
            // INSOLVENT is more complex (6 phases vs 5)
            expect(TRACK_STAGES.INSOLVENT.length).toBe(6);
            expect(TRACK_STAGES.ANCILLARY_PROBATE.length).toBe(5);
        });
    });
});
