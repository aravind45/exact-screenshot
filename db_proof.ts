import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
    console.log('--- 1️⃣ DATABASE PROOF: estateStatus COUNT ---');
    const counts = await (prisma.estate as any).groupBy({
        by: ['estateStatus'],
        _count: true
    });
    console.log(JSON.stringify(counts, null, 2));

    console.log('\n--- 2️⃣ DATABASE PROOF: Default status for new estates ---');
    const newest = await prisma.estate.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { id: true, estateStatus: true }
    });
    console.log(JSON.stringify(newest, null, 2));

    console.log('\n--- 3️⃣ SCHEMA PROOF: Missing columns check ---');
    // If this query succeeds, the columns must exist in the DB
    const schemaCheck = await prisma.estate.findFirst({
        select: {
            userSelectedEstateAuthorityType: true,
            hasProbateAssets: true,
            estateStatus: true
        }
    });
    console.log('✅ Columns verified successfully');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
