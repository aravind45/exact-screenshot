import { PrismaClient } from '@prisma/client';
import { TRACK_STAGES } from '../src/config/settlementStages.js';

const prisma = new PrismaClient();

// Settlement type metadata (tier and coverage %)
const SETTLEMENT_TYPE_META: Record<string, { tier: number; coverage: number; name: string; description: string }> = {
    FORMAL_PROBATE: {
        tier: 1,
        coverage: 0.35,
        name: 'Formal Probate',
        description: 'Full court-supervised probate with Letters Testamentary or Letters of Administration'
    },
    SMALL_ESTATE: {
        tier: 1,
        coverage: 0.30,
        name: 'Small Estate Affidavit',
        description: 'Simplified affidavit procedure for estates under statutory threshold'
    },
    TRUST_ADMIN: {
        tier: 2,
        coverage: 0.15,
        name: 'Trust Administration',
        description: 'Non-probate trust settlement with successor trustee authority'
    },
    SPOUSAL_PETITION: {
        tier: 2,
        coverage: 0.05,
        name: 'Spousal Property Petition',
        description: 'Simplified procedure for surviving spouse to confirm community property'
    },
    JOINT_TRANSFER: {
        tier: 2,
        coverage: 0.05,
        name: 'Joint Tenancy Transfer',
        description: 'Transfer of jointly owned assets with right of survivorship'
    },
    POD_TOD_TRANSFER: {
        tier: 2,
        coverage: 0.05,
        name: 'POD/TOD Transfer',
        description: 'Transfer on Death deed or Payable on Death account transfers'
    },
    INTESTATE: {
        tier: 3,
        coverage: 0.03,
        name: 'Intestate Probate',
        description: 'Probate without a will, following statutory intestacy rules'
    },
    INFORMAL_PROBATE: {
        tier: 3,
        coverage: 0.03,
        name: 'Informal Probate (UPC)',
        description: 'Simplified probate procedure in Uniform Probate Code states'
    },
    ANCILLARY_PROBATE: {
        tier: 4,
        coverage: 0.01,
        name: 'Ancillary Probate',
        description: 'Secondary probate in state where out-of-state property is located'
    },
    INSOLVENT: {
        tier: 4,
        coverage: 0.01,
        name: 'Insolvent Estate',
        description: 'Estate where liabilities exceed assets, requiring priority payment rules'
    },
    SPECIAL: {
        tier: 5,
        coverage: 0.005,
        name: 'Special/Contested',
        description: 'Complex estates with will contests, litigation, or special circumstances'
    },
};

async function main() {
    console.log('🗺️  Migrating roadmaps to database...\n');

    let totalSettlementTypes = 0;
    let totalPhases = 0;
    let totalTasks = 0;

    for (const [code, stages] of Object.entries(TRACK_STAGES)) {
        const meta = SETTLEMENT_TYPE_META[code];

        if (!meta) {
            console.warn(`⚠️  No metadata for ${code}, skipping...`);
            continue;
        }

        console.log(`📋 Processing ${code}...`);

        // Create or update settlement type
        const settlementType = await prisma.settlementType.upsert({
            where: { code },
            update: {
                name: meta.name,
                description: meta.description,
                tier: meta.tier,
                coverage: meta.coverage,
                isActive: true,
                version: 1,
            },
            create: {
                code,
                name: meta.name,
                description: meta.description,
                tier: meta.tier,
                coverage: meta.coverage,
                isActive: true,
                version: 1,
            },
        });

        totalSettlementTypes++;

        // Create phases and tasks
        for (let i = 0; i < stages.length; i++) {
            const stage = stages[i];

            const phase = await prisma.roadmapPhase.upsert({
                where: {
                    settlementTypeId_phaseCode: {
                        settlementTypeId: settlementType.id,
                        phaseCode: stage.id,
                    },
                },
                update: {
                    title: stage.title,
                    subtitle: stage.description || '',
                    description: stage.description,
                    milestone: stage.milestone || '',
                    orderIndex: i,
                    trigger: stage.trigger,
                    triggerLabel: stage.triggerLabel,
                    isEscalationPath: false,
                },
                create: {
                    settlementTypeId: settlementType.id,
                    phaseCode: stage.id,
                    title: stage.title,
                    subtitle: stage.description || '',
                    description: stage.description,
                    milestone: stage.milestone || '',
                    orderIndex: i,
                    trigger: stage.trigger,
                    triggerLabel: stage.triggerLabel,
                    isEscalationPath: false,
                },
            });

            totalPhases++;

            // Create tasks
            if (stage.tasks && stage.tasks.length > 0) {
                for (let j = 0; j < stage.tasks.length; j++) {
                    const task = stage.tasks[j];

                    await prisma.roadmapTask.upsert({
                        where: {
                            phaseId_taskCode: {
                                phaseId: phase.id,
                                taskCode: task.id,
                            },
                        },
                        update: {
                            title: task.title,
                            description: task.title,
                            estimatedTime: (task as any).estimatedTime,
                            category: (task as any).category,
                            orderIndex: j,
                            isOptional: (task as any).isOptional || false,
                            requiresAuthority: task.requiresAuthority || false,
                            requiredDocs: (task as any).requiredDocs || [],
                            dependencies: [],
                            exclusiveGroup: null,
                            trackCompatibility: [],
                            riskWarning: task.riskWarning,
                            deadlineWarningId: null,
                            isInternationalOnly: false,
                            alerts: null,
                            links: null,
                            tags: [],
                        },
                        create: {
                            phaseId: phase.id,
                            taskCode: task.id,
                            title: task.title,
                            description: task.title,
                            estimatedTime: (task as any).estimatedTime,
                            category: (task as any).category,
                            orderIndex: j,
                            isOptional: (task as any).isOptional || false,
                            requiresAuthority: task.requiresAuthority || false,
                            requiredDocs: (task as any).requiredDocs || [],
                            dependencies: [],
                            exclusiveGroup: null,
                            trackCompatibility: [],
                            riskWarning: task.riskWarning,
                            deadlineWarningId: null,
                            isInternationalOnly: false,
                            alerts: null,
                            links: null,
                            tags: [],
                        },
                    });

                    totalTasks++;
                }
            }

            console.log(`   ✅ Phase: ${stage.title} (${stage.tasks?.length || 0} tasks)`);
        }

        console.log('');
    }

    console.log('✨ Migration complete!\n');
    console.log(`📊 Summary:`);
    console.log(`   • Settlement Types: ${totalSettlementTypes}`);
    console.log(`   • Phases: ${totalPhases}`);
    console.log(`   • Tasks: ${totalTasks}`);
    console.log('');
    console.log('🔍 Verify in Prisma Studio:');
    console.log('   npx prisma studio');
    console.log('');
}

main()
    .catch((e) => {
        console.error('❌ Migration failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
