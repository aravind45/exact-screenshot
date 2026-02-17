import { prisma } from "../db.js";
async function checkTextSearch() {
    console.log("🔍 Checking PostgreSQL Full-Text Search Support...");
    try {
        const result = await prisma.$queryRawUnsafe(`
      SELECT to_tsvector('english', 'Probate is the legal process of settling an estate') @@ plainto_tsquery('english', 'probate process') as match;
    `);
        console.log("✅ Full-text search verified:", result);
    }
    catch (error) {
        console.error("❌ Full-text search verification failed:", error);
    }
    finally {
        await prisma.$disconnect();
    }
}
checkTextSearch();
