import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const migrations: any = await prisma.$queryRaw`SELECT migration_name, finished_at, logs, rolled_back_at, started_at FROM "_prisma_migrations" ORDER BY "started_at" DESC`;
        console.log("Total Migrations:", migrations.length);
        migrations.forEach((m: any) => {
            console.log(`- ${m.migration_name}: finished=${m.finished_at}${m.rolled_back_at ? `, rolled_back=${m.rolled_back_at}` : ''}`);
            if (!m.finished_at && !m.rolled_back_at) {
                console.log("  !!! FAILED MIGRATION DETECTED !!!");
                console.log("  Started at:", m.started_at);
                console.log("  Logs:", m.logs);
            }
        });
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
