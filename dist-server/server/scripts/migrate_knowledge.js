import { PrismaClient } from '@prisma/client';
import { KnowledgeService } from '../services/knowledgeService.js';
const prisma = new PrismaClient();
async function migrate() {
    console.log("🚀 Starting migration from knowledge_chunks to rag_documents...");
    // 1. Fetch all legacy chunks using Raw SQL (since model is @@ignored or removed)
    // Note: Assuming table name is 'knowledge_chunks' based on schema map
    // Exclude embedding column to avoid P2010 error
    const legacyChunks = await prisma.$queryRawUnsafe(`
        SELECT content, source, created_at FROM "knowledge_chunks" ORDER BY created_at ASC
    `);
    console.log(`Found ${legacyChunks.length} legacy chunks.`);
    if (legacyChunks.length === 0) {
        console.log("No legacy data found. Skipping migration.");
        return;
    }
    // 2. Group by Source
    const grouped = new Map();
    for (const chunk of legacyChunks) {
        const source = chunk.source || 'Unknown';
        if (!grouped.has(source)) {
            grouped.set(source, []);
        }
        grouped.get(source)?.push(chunk.content);
    }
    console.log(`Found ${grouped.size} unique sources.`);
    // 3. Ingest into New Schema
    let success = 0;
    let fail = 0;
    for (const [source, contents] of grouped.entries()) {
        try {
            console.log(`Processing ${source}...`);
            // Join contents. Using newline separator.
            const fullText = contents.join('\n\n');
            await KnowledgeService.ingestText(fullText, {
                title: source,
                sourceUri: source,
                docType: 'OTHER' // Default
            });
            success++;
        }
        catch (error) {
            console.error(`Failed to migrate ${source}:`, error);
            fail++;
        }
    }
    console.log(`Migration Complete. Success: ${success}, Fail: ${fail}`);
}
migrate()
    .catch(e => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
