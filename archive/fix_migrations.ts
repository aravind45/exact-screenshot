import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const result = await prisma.$executeRaw`UPDATE "_prisma_migrations" SET "rolled_back_at" = NOW() WHERE "migration_name" = '20260126000000_add_communication_constraints' AND "finished_at" IS NULL`;
        console.log("Update Result:", result);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
