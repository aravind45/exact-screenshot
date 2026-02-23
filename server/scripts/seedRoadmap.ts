import { PrismaClient } from '@prisma/client';
import { SETTLEMENT_PHASE_TASKS, TRUST_PHASE_TASKS, MODIFIER_PHASE_TASKS, PROBATE_ESCALATION_PHASE } from '../../src/config/settlementPhases.js';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Roadmap Configuration...');

    // 1. Define Settlement Types
    const settlementTypes = [
        { code: 'FORMAL_PROBATE', name: 'Formal Probate', description: 'Full court-supervised probate process.' },
        { code: 'TRUST_ADMINISTRATION', name: 'Trust Administration', description: 'Successor trustee administration for trust-held assets.' },
        { code: 'SMALL_ESTATE', name: 'Small Estate', description: 'Simplified affidavit process for estates below threshold.' },
        { code: 'NON_PROBATE', name: 'Non-Probate / TOD', description: 'Direct transfer for TOD/Joint Tenancy assets.' },
    ];

    for (const type of settlementTypes) {
        await prisma.settlementType.upsert({
            where: { code: type.code },
            update: type,
            create: type,
        });
    }

    // 2. Map Config to DB

    // Helper to seed phases and tasks
    const seedTrack = async (typeCode: string, phases: any[]) => {
        const settlementType = await prisma.settlementType.findUnique({ where: { code: typeCode } });
        if (!settlementType) return;

        console.log(`Clearing existing phases for ${typeCode}...`);
        await prisma.roadmapPhase.deleteMany({
            where: { settlementTypeId: settlementType.id }
        });

        for (let i = 0; i < phases.length; i++) {
            const phaseData = phases[i];
            const phase = await prisma.roadmapPhase.upsert({
                where: {
                    settlementTypeId_phaseCode: {
                        settlementTypeId: settlementType.id,
                        phaseCode: phaseData.phase,
                    },
                },
                update: {
                    title: phaseData.title,
                    subtitle: phaseData.subtitle,
                    milestone: phaseData.milestone,
                    description: phaseData.description,
                    orderIndex: i,
                    isEscalationPath: phaseData.isEscalationPath || false,
                },
                create: {
                    settlementTypeId: settlementType.id,
                    phaseCode: phaseData.phase,
                    title: phaseData.title,
                    subtitle: phaseData.subtitle,
                    milestone: phaseData.milestone,
                    description: phaseData.description,
                    orderIndex: i,
                    isEscalationPath: phaseData.isEscalationPath || false,
                },
            });

            for (let j = 0; j < phaseData.tasks.length; j++) {
                const t = phaseData.tasks[j];
                const task = await prisma.roadmapTask.upsert({
                    where: {
                        phaseId_taskCode: {
                            phaseId: phase.id,
                            taskCode: t.id,
                        },
                    },
                    update: {
                        title: t.title,
                        description: t.description,
                        estimatedTime: t.estimatedTime,
                        category: t.category,
                        orderIndex: j,
                        isOptional: t.isOptional || false,
                        requiresAuthority: t.requiresAuthority || false,
                        requiredDocs: t.requiredDocs || [],
                        dependencies: t.dependencies || [],
                        exclusiveGroup: t.exclusiveGroup || null,
                        trackCompatibility: t.trackCompatibility || [],
                        tags: t.tags || [],
                        rationale: t.rationale || null,
                        isAttorneyReviewNode: t.isAttorneyReviewNode || false,
                        attorneyReviewReason: t.attorneyReviewReason || null,
                        isConditional: t.isConditional || false,
                        conditionalRequirementLabel: t.conditionalRequirementLabel || null,
                        utility: t.utility || null,
                        requiresNotary: t.requiresNotary || false,
                        requiresPhysicalMail: t.requiresPhysicalMail || false,
                        deadlineWarningId: t.deadlineWarningId || null,
                        isInternationalOnly: t.isInternationalOnly || false,
                        alerts: t.alerts || null,
                        links: t.links || null,
                        primaryActionLabel: t.primaryActionLabel || null,
                        primaryActionUrl: t.primaryActionUrl || null,
                        formNames: t.formNames || [],
                        applicableStates: t.applicability?.states || [],
                        applicableVariants: t.applicability?.variants || [],
                        predicatesAll: t.applicability?.predicatesAll || [],
                        predicatesAny: t.applicability?.predicatesAny || [],
                        excludePredicates: t.applicability?.excludePredicates || [],
                        requiredProfileFields: t.requiredProfileFields || [],
                        outputs: t.outputs || [],
                    },
                    create: {
                        phaseId: phase.id,
                        taskCode: t.id,
                        title: t.title,
                        description: t.description,
                        estimatedTime: t.estimatedTime,
                        category: t.category,
                        orderIndex: j,
                        isOptional: t.isOptional || false,
                        requiresAuthority: t.requiresAuthority || false,
                        requiredDocs: t.requiredDocs || [],
                        dependencies: t.dependencies || [],
                        exclusiveGroup: t.exclusiveGroup || null,
                        trackCompatibility: t.trackCompatibility || [],
                        tags: t.tags || [],
                        rationale: t.rationale || null,
                        isAttorneyReviewNode: t.isAttorneyReviewNode || false,
                        attorneyReviewReason: t.attorneyReviewReason || null,
                        isConditional: t.isConditional || false,
                        conditionalRequirementLabel: t.conditionalRequirementLabel || null,
                        utility: t.utility || null,
                        requiresNotary: t.requiresNotary || false,
                        requiresPhysicalMail: t.requiresPhysicalMail || false,
                        deadlineWarningId: t.deadlineWarningId || null,
                        isInternationalOnly: t.isInternationalOnly || false,
                        alerts: t.alerts || null,
                        links: t.links || null,
                        primaryActionLabel: t.primaryActionLabel || null,
                        primaryActionUrl: t.primaryActionUrl || null,
                        formNames: t.formNames || [],
                        applicableStates: t.applicability?.states || [],
                        applicableVariants: t.applicability?.variants || [],
                        predicatesAll: t.applicability?.predicatesAll || [],
                        predicatesAny: t.applicability?.predicatesAny || [],
                        excludePredicates: t.applicability?.excludePredicates || [],
                        requiredProfileFields: t.requiredProfileFields || [],
                        outputs: t.outputs || [],
                    },
                });

                if (t.stateOverrides) {
                    const overrides = t.stateOverrides as Record<string, any>;
                    for (const [stateCode, override] of Object.entries(overrides)) {
                        await prisma.roadmapTaskStateOverride.upsert({
                            where: {
                                stateCode_taskKey: {
                                    stateCode: stateCode,
                                    taskKey: t.id,
                                }
                            },
                            update: {
                                title: override.title !== undefined ? override.title : null,
                                description: override.description !== undefined ? override.description : null,
                                formNames: override.formNames || [],
                                primaryActionLabel: override.primaryActionLabel !== undefined ? override.primaryActionLabel : null,
                                primaryActionUrl: override.primaryActionUrl !== undefined ? override.primaryActionUrl : null,
                                links: override.links || null,
                                sourceUrl: override.sourceUrl || null,
                                lastVerifiedAt: override.lastVerifiedAt ? new Date(override.lastVerifiedAt) : null,
                                reviewedBy: override.reviewedBy || null,
                                changeLog: override.changeLog || null,
                                confidence: override.confidence || "draft",
                                officialForms: override.officialForms || null,
                                isOptional: override.isOptional !== undefined ? override.isOptional : null,
                                dependencies: override.dependencies || [],
                            },
                            create: {
                                taskKey: t.id,
                                stateCode: stateCode,
                                title: override.title !== undefined ? override.title : null,
                                description: override.description !== undefined ? override.description : null,
                                formNames: override.formNames || [],
                                primaryActionLabel: override.primaryActionLabel !== undefined ? override.primaryActionLabel : null,
                                primaryActionUrl: override.primaryActionUrl !== undefined ? override.primaryActionUrl : null,
                                links: override.links || null,
                                sourceUrl: override.sourceUrl || null,
                                lastVerifiedAt: override.lastVerifiedAt ? new Date(override.lastVerifiedAt) : null,
                                reviewedBy: override.reviewedBy || null,
                                changeLog: override.changeLog || null,
                                confidence: override.confidence || "draft",
                                officialForms: override.officialForms || null,
                                isOptional: override.isOptional !== undefined ? override.isOptional : null,
                                dependencies: override.dependencies || [],
                            },
                        });
                    }
                }
            }
        }
    };

    // Seed PROBATE
    console.log('Seeding FORMAL_PROBATE...');
    await seedTrack('FORMAL_PROBATE', SETTLEMENT_PHASE_TASKS);

    console.log('Seeding INTESTATE...');
    await seedTrack('INTESTATE', SETTLEMENT_PHASE_TASKS);

    console.log('Seeding SMALL_ESTATE...');
    await seedTrack('SMALL_ESTATE', SETTLEMENT_PHASE_TASKS);

    // Seed TRUST
    console.log('Seeding TRUST_ADMINISTRATION...');
    await seedTrack('TRUST_ADMINISTRATION', TRUST_PHASE_TASKS);

    // Seed NON_PROBATE (subset of tasks for now, or we can map them specifically)
    console.log('Seeding NON_PROBATE...');
    // For NON_PROBATE, we might want a specific subset or just use compatibility flags
    // But the DB-first architecture asks for "Path & Phase defined in DB", so we give each path its own data.
    await seedTrack('NON_PROBATE', SETTLEMENT_PHASE_TASKS.filter(p => p.tasks.some(t => t.trackCompatibility?.includes('NON_PROBATE'))));

    console.log('Roadmap Seeding Complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
