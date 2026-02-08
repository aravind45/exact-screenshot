import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { OpenAIEmbeddings } from "@langchain/openai";
import 'dotenv/config';

const prisma = new PrismaClient();
const embeddings = new OpenAIEmbeddings({
    apiKey: process.env.OPENAI_API_KEY,
    modelName: "text-embedding-3-small"
});

const DOCS_TO_INGEST = [
    {
        filename: 'pdf_text_Estate_and_Trust_Administration_For_Dummies_(Margaret_A._MunroKathryn_A._Murphy_Esq)_(Z-Library).pdf.txt',
        source: 'Estate and Trust Administration For Dummies'
    },
    {
        filename: 'pdf_text_Executors_Guide.pdf.txt',
        source: 'Executors Guide'
    }
];

const CHUNK_SIZE = 1500;
const CHUNK_OVERLAP = 200;

async function ingest() {
    console.log("🚀 Starting ingestion...");

    for (const docInfo of DOCS_TO_INGEST) {
        const filePath = path.join(process.cwd(), docInfo.filename);
        if (!fs.existsSync(filePath)) {
            console.warn(`⚠️ File not found: ${docInfo.filename}`);
            continue;
        }

        console.log(`📖 Reading ${docInfo.filename}...`);
        const text = fs.readFileSync(filePath, 'utf-8');

        // Simple chunking
        const chunks: string[] = [];
        for (let i = 0; i < text.length; i += CHUNK_SIZE - CHUNK_OVERLAP) {
            chunks.push(text.slice(i, i + CHUNK_SIZE));
        }

        console.log(`🧩 Created ${chunks.length} chunks. Generating embeddings and saving...`);

        for (let i = 0; i < chunks.length; i++) {
            const chunkText = chunks[i];

            try {
                const vector = await embeddings.embedQuery(chunkText);

                // Use raw SQL for the vector column
                await prisma.$executeRaw`
                    INSERT INTO "knowledge_chunks" (id, content, source, embedding, created_at)
                    VALUES (
                        ${crypto.randomUUID()}, 
                        ${chunkText}, 
                        ${docInfo.source}, 
                        ${vector}::vector, 
                        NOW()
                    )
                `;

                if (i % 50 === 0) console.log(`✅ Processed ${i}/${chunks.length} chunks for ${docInfo.source}`);
            } catch (err) {
                console.error(`❌ Error on chunk ${i}:`, err);
            }
        }
    }

    console.log("✨ Ingestion complete!");
}

ingest()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
