import { prisma } from "../db.js";
import { OpenAIEmbeddings } from "@langchain/openai";
import crypto from 'crypto';
const embeddings = process.env.OPENAI_API_KEY ? new OpenAIEmbeddings({
    apiKey: process.env.OPENAI_API_KEY,
    modelName: "text-embedding-3-small"
}) : null;
export class KnowledgeService {
    /**
     * List all knowledge chunks with metadata
     */
    static async listChunks(limit = 100, offset = 0) {
        return prisma.knowledgeChunk.findMany({
            take: limit,
            skip: offset,
            orderBy: { createdAt: 'desc' }
        });
    }
    /**
     * Delete a specific chunk
     */
    static async deleteChunk(id) {
        return prisma.knowledgeChunk.delete({
            where: { id }
        });
    }
    /**
     * Ingest raw text into chunks and embeddings
     */
    static async ingestText(text, source) {
        if (!embeddings) {
            throw new Error("OPENAI_API_KEY is missing. RAG functionality requires an OpenAI API key for embeddings.");
        }
        const CHUNK_SIZE = 1500;
        const CHUNK_OVERLAP = 200;
        const chunks = [];
        for (let i = 0; i < text.length; i += CHUNK_SIZE - CHUNK_OVERLAP) {
            chunks.push(text.slice(i, i + CHUNK_SIZE));
        }
        console.log(`🧩 Admin Ingestion: Processing ${chunks.length} chunks for ${source}`);
        let successCount = 0;
        for (const chunkText of chunks) {
            try {
                const vector = await embeddings.embedQuery(chunkText);
                const vectorSql = `[${vector.join(',')}]`;
                await prisma.$executeRawUnsafe(`
                    INSERT INTO "knowledge_chunks" (id, content, source, embedding, created_at)
                    VALUES ($1, $2, $3, $4::vector, NOW())
                `, crypto.randomUUID(), chunkText, source, vectorSql);
                successCount++;
            }
            catch (err) {
                console.error(`❌ Ingestion error for ${source}:`, err);
            }
        }
        return { totalChunks: chunks.length, successfullyIngested: successCount };
    }
    /**
     * Get knowledge base stats
     */
    static async getStats() {
        const totalChunks = await prisma.knowledgeChunk.count();
        const sources = await prisma.knowledgeChunk.groupBy({
            by: ['source'],
            _count: true
        });
        return {
            totalChunks,
            sourceCount: sources.length,
            sources: sources.map(s => ({ name: s.source, count: s._count }))
        };
    }
}
