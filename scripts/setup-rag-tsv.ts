/**
 * setup-rag-tsv.ts
 *
 * One-time migration: adds the `tsv` tsvector column to `rag_chunks`,
 * populates it for all existing rows, and creates a GIN index + trigger
 * so future inserts/updates auto-populate it.
 *
 * Run once:
 *   npx tsx scripts/setup-rag-tsv.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🔧  Setting up tsvector column on rag_chunks…");

    // 1. Add the tsv column if it doesn't already exist
    await prisma.$executeRawUnsafe(`
        ALTER TABLE "rag_chunks"
        ADD COLUMN IF NOT EXISTS tsv tsvector;
    `);
    console.log("✅  tsv column present (or already existed)");

    // 2. Back-fill tsv for all existing rows
    const updated = await prisma.$executeRawUnsafe(`
        UPDATE "rag_chunks"
        SET    tsv = to_tsvector('english', COALESCE(text, ''))
        WHERE  tsv IS NULL OR tsv = ''::tsvector;
    `);
    console.log(`✅  Back-filled ${updated} existing chunk(s)`);

    // 3. Create GIN index for fast full-text search
    await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "rag_chunks_tsv_idx"
        ON "rag_chunks"
        USING GIN (tsv);
    `);
    console.log("✅  GIN index created (or already existed)");

    // 4. Create trigger so every INSERT or UPDATE auto-populates tsv
    await prisma.$executeRawUnsafe(`
        CREATE OR REPLACE FUNCTION rag_chunks_tsv_update()
        RETURNS trigger AS $$
        BEGIN
            NEW.tsv := to_tsvector('english', COALESCE(NEW.text, ''));
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    `);

    // Prisma does not allow multiple statements in one call — split into two
    await prisma.$executeRawUnsafe(`
        DROP TRIGGER IF EXISTS "rag_chunks_tsv_trigger" ON "rag_chunks";
    `);
    await prisma.$executeRawUnsafe(`
        CREATE TRIGGER "rag_chunks_tsv_trigger"
        BEFORE INSERT OR UPDATE ON "rag_chunks"
        FOR EACH ROW EXECUTE FUNCTION rag_chunks_tsv_update();
    `);
    console.log("✅  Auto-update trigger installed");

    // 5. Verify: count chunks with populated tsv
    const result = await prisma.$queryRawUnsafe<{ total: BigInt; with_tsv: BigInt }[]>(`
        SELECT
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE tsv IS NOT NULL) AS with_tsv
        FROM "rag_chunks";
    `);
    const row = result[0];
    console.log(`\n📊  rag_chunks: ${row.total} total, ${row.with_tsv} with tsv populated`);
    console.log("\n🎉  RAG BM25 setup complete! Full-text search is now active.");
}

main()
    .catch((e) => {
        console.error("❌  Migration failed:", e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
