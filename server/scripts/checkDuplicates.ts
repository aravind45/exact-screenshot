import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const tasks = await prisma.roadmapTask.findMany({
        select: {
            taskCode: true,
            phase: {
                select: {
                    phase: true
                }
            }
        }
    });

    const taskMap: Record<string, string[]> = {};
    tasks.forEach(t => {
        if (!taskMap[t.taskCode]) taskMap[t.taskCode] = [];
        taskMap[t.taskCode].push(t.phase.phase);
    });

    const duplicates = Object.entries(taskMap).filter(([code, phases]) => phases.length > 1);

    if (duplicates.length > 0) {
        console.log('Duplicate tasks found across phases:');
        duplicates.forEach(([code, phases]) => {
            console.log(`${code}: ${phases.join(', ')}`);
        });
    } else {
        console.log('No duplicate tasks found.');
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
