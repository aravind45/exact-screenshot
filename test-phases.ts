import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const phases = await prisma.roadmapPhase.findMany({ select: { phaseCode: true, title: true, milestone: true, subtitle: true } });
    console.log(phases);
}
main().finally(() => prisma.$disconnect());
