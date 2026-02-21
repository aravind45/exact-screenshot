import { prisma } from "../db.js";
import { OpenAIEmbeddings } from "@langchain/openai";
import { SimpleRecursiveSplitter } from "../lib/textSplitter.js";
import crypto from 'crypto';
import { logger } from "../lib/logger.js";
import { DocType } from "@prisma/client";
import * as xlsx from 'xlsx';

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
    static async deleteDocument(id: string) {
        return prisma.ragDocument.delete({
            where: { id }
        });
    }

    /**
     * Ingest raw text into RagDocument -> RagChunk -> RagChunkEmbedding
     * Preserved original ingestion logic completely untouched.
     */
    static async ingestText(text: string, metadata: {
        sourceUri?: string,
        title: string,
        docType?: DocType,
        jurisdiction?: string
    }) {
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
            for (const splitDoc of splitDocs) {
                const chunkContent = splitDoc.pageContent;
                const contentHash = crypto.createHash('sha256').update(chunkContent).digest('hex');
                const tokenCount = Math.ceil(chunkContent.length / 4); // Approx

                // Embed
                const vector = await embeddings.embedQuery(chunkContent);
                const vectorSql = `[${vector.join(',')}]`;

                await prisma.$transaction(async (tx) => {
                    const chunk = await tx.ragChunk.create({
                        data: {
                            documentId: doc.id,
                            text: chunkContent,
                            tokenCount: tokenCount,
                            contentHash: contentHash,
                            pageStart: splitDoc.metadata.loc?.lines?.from,
                            pageEnd: splitDoc.metadata.loc?.lines?.to
                        }
                    });

                    await tx.$executeRawUnsafe(`
                        INSERT INTO "rag_chunk_embeddings" (id, "chunk_id", "vector_type", "model_id", embedding, "created_at")
                        VALUES ($1, $2, 'content', 'text-embedding-3-small', $3::vector, NOW())
                    `, crypto.randomUUID(), chunk.id, vectorSql);
                });

                successCount++;
            }

            logger.info(`✅ Ingestion [${runId}]: Successfully ingested ${successCount} chunks`);
            return { documentId: doc.id, chunks: successCount };

        } catch (error) {
            logger.error(`❌ Ingestion [${runId}] Failed:`, error);
            throw error;
        }
    }

    /**
     * Ingest structured Matrix XLSX data into RAG Docs (1 per state)
     */
    static async ingestMatrixXlsx(buffer: Buffer) {
        if (!embeddings) {
            throw new Error("OPENAI_API_KEY is missing. RAG requires OpenAI embedding model.");
        }

        const runId = crypto.randomUUID();
        logger.info(`🧩 Matrix Ingestion [${runId}]: Starting XLSX parse`);

        try {
            // 1. Parse Excel
            const workbook = xlsx.read(buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const data: any[] = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

            if (!data || data.length === 0) {
                throw new Error("Excel sheet is empty or invalid format.");
            }

            // 2. Group rows by State
            const stateGroups = new Map<string, any[]>();
            for (const row of data) {
                const state = row.State || row.state || "US_General";
                if (!stateGroups.has(state)) {
                    stateGroups.set(state, []);
                }
                stateGroups.get(state)!.push(row);
            }

            logger.info(`🧩 Matrix Ingestion [${runId}]: Found ${stateGroups.size} states/jurisdictions in ${data.length} total rows.`);

            let totalDocsCreated = 0;
            let totalChunksCreated = 0;

            // 3. Process each state as its own Document
            for (const [state, rows] of stateGroups.entries()) {
                const docTitle = `Estate Matrix - ${state}`;

                // Clear out any previous matrix for this state
                await prisma.ragDocument.deleteMany({
                    where: {
                        jurisdiction: state,
                        title: docTitle
                    }
                });

                // Create the new document
                const doc = await prisma.ragDocument.create({
                    data: {
                        title: docTitle,
                        sourceUri: "uploaded_matrix.xlsx",
                        docType: 'PLAYBOOK',
                        jurisdiction: state,
                        version: 'v1',
                        ingestedAt: new Date()
                    }
                });

                totalDocsCreated++;

                // Process each row as a holistic Chunk
                for (const row of rows) {
                    // Turn row key-values into a readable chunk string
                    const rowContent = Object.entries(row)
                        .filter(([k, v]) => k !== 'State' && k !== 'state' && v !== undefined && v !== null && v !== '')
                        .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
                        .join('\n');

                    const chunkContent = `State: ${state}\n${rowContent}`;

                    const contentHash = crypto.createHash('sha256').update(chunkContent).digest('hex');
                    const tokenCount = Math.ceil(chunkContent.length / 4);

                    // Embed
                    const vector = await embeddings.embedQuery(chunkContent);
                    const vectorSql = `[${vector.join(',')}]`;

                    // Save Chunk and Embedding Transactionally
                    await prisma.$transaction(async (tx) => {
                        const chunk = await tx.ragChunk.create({
                            data: {
                                documentId: doc.id,
                                text: chunkContent,
                                tokenCount: tokenCount,
                                contentHash: contentHash,
                            }
                        });

                        await tx.$executeRawUnsafe(`
                            INSERT INTO "rag_chunk_embeddings" (id, "chunk_id", "vector_type", "model_id", embedding, "created_at")
                            VALUES ($1, $2, 'content', 'text-embedding-3-small', $3::vector, NOW())
                        `, crypto.randomUUID(), chunk.id, vectorSql);
                    });

                    totalChunksCreated++;
                }
            }

            logger.info(`✅ Matrix Ingestion [${runId}]: Successfully processed ${totalDocsCreated} states and ${totalChunksCreated} combinations.`);
            return { documents: totalDocsCreated, chunks: totalChunksCreated };

        } catch (error) {
            logger.error(`❌ Matrix Ingestion [${runId}] Failed:`, error);
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
