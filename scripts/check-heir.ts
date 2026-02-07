import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const id = '046399a9-30bb-4001-8316-c7379d750c1b';
    console.log(`Searching for Heir ID: ${id}`);
    const heir = await prisma.heir.findUnique({ where: { id } });
    if (heir) {
        console.log('✅ Heir found:', heir);
    } else {
        console.log('❌ Heir NOT found');
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
