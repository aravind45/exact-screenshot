import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const assetId = '18a5c3ee-8e0e-4803-9235-c561cc5acb2a';
    const asset = await prisma.asset.findUnique({
        where: { id: assetId },
        include: {
            estate: {
                include: {
                    user: true
                }
            }
        }
    });
    console.log(JSON.stringify(asset, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
