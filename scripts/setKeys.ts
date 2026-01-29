import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    await prisma.appSetting.upsert({
        where: { key: 'PAMFAX_API_KEY' },
        update: { value: 'AravindThiyagarajan', isSecret: false },
        create: { key: 'PAMFAX_API_KEY', value: 'AravindThiyagarajan', isSecret: false },
    });

    await prisma.appSetting.upsert({
        where: { key: 'PAMFAX_API_SECRET' },
        update: { value: 'skipgygotaxytion9545', isSecret: true },
        create: { key: 'PAMFAX_API_SECRET', value: 'skipgygotaxytion9545', isSecret: true },
    });

    console.log('✅ PamFax keys updated in database');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
