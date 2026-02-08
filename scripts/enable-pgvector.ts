import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("🐘 Attempting to enable pgvector extension...");
        await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS vector;');
        console.log("✅ pgvector extension enabled successfully.");
    } catch (err) {
        console.error("❌ Failed to enable pgvector. Make sure your database user has SUPERUSER or appropriate permissions, or that the extension is available in your environment (e.g., Neon/Supabase support it).", err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
