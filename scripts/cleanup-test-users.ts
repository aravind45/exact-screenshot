import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Cleaning up test users...\n');

  try {
    // Delete all test users (this will cascade delete estates, assets, etc.)
    const result = await prisma.user.deleteMany({
      where: {
        email: {
          startsWith: 'pth',
          endsWith: '@test.com',
        },
      },
    });

    console.log(`✅ Deleted ${result.count} test users and all related data\n`);
    console.log('You can now run: npx tsx scripts/seed-21-paths.ts');
  } catch (error) {
    console.error('❌ Error cleaning up test users:', error);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
