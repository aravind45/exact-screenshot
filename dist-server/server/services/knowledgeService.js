import { prisma } from "../db.js";
import { OpenAIEmbeddings } from "@langchain/openai";
import { SimpleRecursiveSplitter } from "../lib/textSplitter.js";
import crypto from 'crypto';
import { logger } from "../lib/logger.js";
const embeddings = process.env.OPENAI_API_KEY ? new OpenAIEmbeddings({
    apiKey: process.env.OPENAI_API_KEY,
    modelName: "text-embedding-3-small"
}) : null;
export class KnowledgeService {
    /**
     * List all documents
     */
    static async listDocuments(limit = 100, offset = 0) {
        return prisma.ragDocument.findMany({
            take: limit,
            skip: offset,
            orderBy: { ingestedAt: 'desc' },
            include: {
                _count: {
                    select: { chunks: true }
                }
            }
        });
    }
    /**
     * Delete a document and all its chunks/embeddings
     */
    static async deleteDocument(id) {
        return prisma.ragDocument.delete({
            where: { id }
        });
    }
    /**
     * Ingest raw text into RagDocument -> RagChunk -> RagChunkEmbedding
     */
    static async ingestText(text, metadata) {
        if (!embeddings) {
            throw new Error("OPENAI_API_KEY is missing. RAG requires OpenAI embedding model.");
        }
        const runId = crypto.randomUUID();
        logger.info(`🧩 Ingestion [${runId}]: Starting for ${metadata.title}`);
        try {
            // 1. Create Document Record
            const doc = await prisma.ragDocument.create({
                data: {
                    title: metadata.title,
                    sourceUri: metadata.sourceUri,
                    docType: metadata.docType || 'OTHER',
                    jurisdiction: metadata.jurisdiction,
                    version: 'v1',
                    ingestedAt: new Date()
                }
            });
            // 2. Split Text
            const splitter = new SimpleRecursiveSplitter({
                chunkSize: 1000,
                chunkOverlap: 200,
                separators: ["\n\n", "\n", ".", "!", "?", ",", " ", ""]
            });
            const splitDocs = await splitter.createDocuments([text]);
            logger.info(`🧩 Ingestion [${runId}]: Created ${splitDocs.length} chunks`);
            let successCount = 0;
            // 3. Process Chunks (Embed and Save)
            // We use standard chunks for now. 
            // TODO: Implement advanced hierarchical parent/child splitting if needed for complex docs.
            for (const splitDoc of splitDocs) {
                const chunkContent = splitDoc.pageContent;
                const contentHash = crypto.createHash('sha256').update(chunkContent).digest('hex');
                const tokenCount = Math.ceil(chunkContent.length / 4); // Approx
                // Embed
                const vector = await embeddings.embedQuery(chunkContent);
                const vectorSql = `[${vector.join(',')}]`;
                // Transaction for Chunk + Embedding + TSVector (via trigger)
                // Note: TSVector is populated via DB Trigger, so we just insert the text.
                await prisma.$transaction(async (tx) => {
                    const chunk = await tx.ragChunk.create({
                        data: {
                            documentId: doc.id,
                            text: chunkContent,
                            tokenCount: tokenCount,
                            contentHash: contentHash,
                            // metadata from splitter can be mapped to sectionId/page headers if we parse distinct structural elements
                            pageStart: splitDoc.metadata.loc?.lines?.from,
                            pageEnd: splitDoc.metadata.loc?.lines?.to
                        }
                    });
                    // Insert Embedding via ExecuteRaw to handle vector type
                    await tx.$executeRawUnsafe(`
                        INSERT INTO "rag_chunk_embeddings" (id, "chunk_id", "vector_type", "model_id", embedding, "created_at")
                        VALUES ($1, $2, 'content', 'text-embedding-3-small', $3::vector, NOW())
                    `, crypto.randomUUID(), chunk.id, vectorSql);
                });
                successCount++;
            }
            logger.info(`✅ Ingestion [${runId}]: Successfully ingested ${successCount} chunks`);
            return { documentId: doc.id, chunks: successCount };
        }
        catch (error) {
            logger.error(`❌ Ingestion [${runId}] Failed:`, error);
            throw error;
        }
    }
    /**
     * Search usage simplified for stats
     */
    static async getStats() {
        const totalDocs = await prisma.ragDocument.count();
        const totalChunks = await prisma.ragChunk.count();
        return {
            totalDocs,
            totalChunks,
            documents: await prisma.ragDocument.findMany({
                select: { title: true, docType: true, _count: { select: { chunks: true } } }
            })
        };
    }
}
