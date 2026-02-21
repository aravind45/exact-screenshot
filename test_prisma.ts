import { prisma } from "./server/db.js";
import crypto from 'crypto';

async function test() {
    try {
        console.log("Testing prisma.ragChunk.create...");

        // Ensure a document exists to link to
        let doc = await prisma.ragDocument.findFirst();
        if (!doc) {
            console.log("Creating dummy document...");
            doc = await prisma.ragDocument.create({
                data: {
                    title: "Test Doc",
                    docType: 'OTHER'
                }
            });
        }

        console.log("Creating chunk...");
        const chunk = await prisma.ragChunk.create({
            data: {
                documentId: doc.id,
                text: "Test text",
                tokenCount: 1,
                contentHash: crypto.randomUUID(),
            }
        });
        console.log("Success! Chunk ID:", chunk.id);

        // Clean up
        await prisma.ragChunk.delete({ where: { id: chunk.id } });
        console.log("Cleaned up.");
    } catch (error) {
        console.error("FAILED:", error);
    } finally {
        await prisma.$disconnect();
    }
}

test();
