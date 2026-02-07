import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const settings = await prisma.appSetting.findMany();
    console.log('--- App Settings in Database ---');
    if (settings.length === 0) {
        console.log('No settings found in database.');
    } else {
        settings.forEach(s => {
            console.log(`${s.key}: ${s.isSecret ? '[REDACTED]' : s.value}`);
        });
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
