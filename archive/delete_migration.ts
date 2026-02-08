import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const result = await prisma.$executeRaw`DELETE FROM "_prisma_migrations" WHERE "migration_name" = '20260126000000_add_communication_constraints'`;
        console.log("Delete Result:", result);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
