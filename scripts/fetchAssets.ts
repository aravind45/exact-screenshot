import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const assets = await prisma.asset.findMany({
        where: { status: 'discovered' },
        select: { id: true, institution: true, assetType: true, status: true },
        take: 5
    });
    console.log(JSON.stringify(assets, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
