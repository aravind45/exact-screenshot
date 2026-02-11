import { prisma } from "../db.js";
import { OpenAIEmbeddings } from "@langchain/openai";
import { ai } from "./ai.js";
import { logger } from "../lib/logger.js";

// Initialize embeddings (requires OPENAI_API_KEY)
const embeddings = process.env.OPENAI_API_KEY ? new OpenAIEmbeddings({
    apiKey: process.env.OPENAI_API_KEY,
    modelName: "text-embedding-3-small"
}) : null;

export class RAGService {
    /**
     * Perform semantic search to find relevant legal chunks
     */
    static async searchKnowledge(query: string, limit = 5) {
        if (!embeddings) {
            logger.error("RAG Error: OPENAI_API_KEY is missing. Semantic search disabled.");
            return [];
        }
        try {
            const queryVector = await embeddings.embedQuery(query);
            const vectorSql = `[${queryVector.join(',')}]`;

            // Perform vector similarity search
            // Lowered threshold to 0.45 for better retrieval
            const results = await prisma.$queryRawUnsafe(`
                SELECT content, source, 1 - (embedding <=> $1::vector) as similarity
                FROM knowledge_chunks
                WHERE 1 - (embedding <=> $1::vector) > 0.45
                ORDER BY similarity DESC
                LIMIT $2
            `, vectorSql, limit);

            const searchResults = results as { content: string; source: string; similarity: number }[];
            logger.info(`🤖 RAG Search: Found ${searchResults.length} chunks. Max Similarity: ${searchResults[0]?.similarity?.toFixed(4) || 0}`);

            return searchResults;
        } catch (error) {
            logger.error("RAG Search Error:", error);
            return [];
        }
    }

    /**
     * Answer a user question using retrieved legal context
     */
    static async answerLegalQuestion(question: string) {
        const contexts = await this.searchKnowledge(question);

        if (contexts.length === 0) {
            return {
                answer: "I couldn't find specific information in our legal guides to answer that. For complex legal matters, I strongly recommend consulting with a qualified estate attorney.",
                sources: []
            };
        }

        const contextContent = contexts
            .map(c => `[Source: ${c.source}] ${c.content}`)
            .join("\n\n---\n\n");

        const prompt = `
        You are an elite Estate Settlement AI Assistant for the ExpectedEstate platform.
        Your goal is to provide accurate, helpful, and expert answers to estate settlement questions.
        
        CONTEXT FROM KNOWLEDGE BASE:
        ${contextContent}
        
        USER QUESTION: ${question}
        
        INSTRUCTIONS:
        1. Answer the question specifically using ONLY the provided context.
        2. IF the answer is not contained in the context, explicitly state that you don't have enough information from the current guides and suggest professional advice.
        3. ALWAYS cite your sources (e.g., "According to the Executor's Guide...").
        4. Use a professional, supportive, and clear tone.
        5. Include relevant code sections or legal references if mentioned in the context.
        6. MANDATORY: Every response must conclude with a brief disclaimer stating that this information is for educational purposes only and not legal advice.
        `;

        const answer = await ai.generateText(prompt, "heavy");

        return {
            answer,
            sources: [...new Set(contexts.map(c => c.source))]
        };
    }
}
