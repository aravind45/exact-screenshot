import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get roadmap progress for all users
 * Shows where each user is in their settlement process
 */
async function getUserRoadmapStatus() {
    const estates = await prisma.estate.findMany({
        include: {
            user: {
                select: {
                    email: true,
                    fullName: true,
                },
            },
            _count: {
                select: {
                    assets: true,
                    heirs: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    console.log('📊 User Roadmap Status Report\n');
    console.log('='.repeat(100));

    for (const estate of estates) {
        // Get settlement type and roadmap
        const settlementType = await prisma.settlementType.findUnique({
            where: { code: estate.settlementPath || estate.estateType || 'FORMAL_PROBATE' },
            include: {
                phases: {
                    include: {
                        tasks: true,
                    },
                    orderBy: { orderIndex: 'asc' },
                },
            },
        });

        if (!settlementType) continue;

        // Calculate progress
        const totalTasks = settlementType.phases.reduce((sum, phase) => sum + phase.tasks.length, 0);
        const completedTaskIds = (estate.roadmapProgress as any)?.completedTaskIds || [];
        const completedCount = completedTaskIds.length;
        const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

        // Find current phase (first incomplete phase)
        let currentPhase = settlementType.phases[0];
        for (const phase of settlementType.phases) {
            const phaseTasks = phase.tasks.map(t => t.taskCode);
            const phaseCompleted = phaseTasks.every(taskCode => completedTaskIds.includes(taskCode));
            if (!phaseCompleted) {
                currentPhase = phase;
                break;
            }
        }

        // Get last activity
        const lastActivity = await prisma.settlementActivity.findFirst({
            where: { estateId: estate.id },
            orderBy: { createdAt: 'desc' },
        });

        console.log(`\n👤 ${estate.user.fullName} (${estate.user.email})`);
        console.log(`   Estate: ${estate.name}`);
        console.log(`   Settlement Type: ${settlementType.name} (${settlementType.code})`);
        console.log(`   Progress: ${completedCount}/${totalTasks} tasks (${progressPercent}%)`);
        console.log(`   Current Phase: ${currentPhase.title}`);
        console.log(`   Assets: ${estate._count.assets} | Heirs: ${estate._count.heirs}`);
        if (lastActivity) {
            console.log(`   Last Activity: ${lastActivity.action} - ${new Date(lastActivity.createdAt).toLocaleDateString()}`);
        }
        console.log(`   Status: ${getStatusEmoji(progressPercent)} ${getStatusLabel(progressPercent)}`);
    }

    console.log('\n' + '='.repeat(100));
}

function getStatusEmoji(percent: number): string {
    if (percent === 0) return '🔴';
    if (percent < 25) return '🟠';
    if (percent < 50) return '🟡';
    if (percent < 75) return '🔵';
    if (percent < 100) return '🟢';
    return '✅';
}

function getStatusLabel(percent: number): string {
    if (percent === 0) return 'Not Started';
    if (percent < 25) return 'Just Started';
    if (percent < 50) return 'In Progress';
    if (percent < 75) return 'Halfway There';
    if (percent < 100) return 'Almost Done';
    return 'Complete';
}

// Run the report
getUserRoadmapStatus()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
