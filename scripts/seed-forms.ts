import { PrismaClient } from '@prisma/client';
import { FormSeedingService } from '../server/services/formSeedingService.js';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting form template seeding...');
    await FormSeedingService.seedDefaults();
    console.log('✅ Form templates seeded successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding forms:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
