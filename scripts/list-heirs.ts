import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const heirs = await prisma.heir.findMany();
    console.log('--- Heirs in Database ---');
    console.log(JSON.stringify(heirs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
