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

    if (!asset) {
        console.log('Asset not found');
        return;
    }

    const result = {
        institution: asset.institution,
        assetType: asset.assetType,
        deceasedName: `${asset.estate.deceasedFirstName} ${asset.estate.deceasedLastName}`,
        dateOfDeath: asset.estate.deceasedDateOfDeath,
        executorName: asset.estate.user.fullName,
        executorEmail: asset.estate.user.email,
        state: asset.estate.user.state
    };

    console.log(JSON.stringify(result, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
