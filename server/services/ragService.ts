import { prisma } from "../db.js";
import { OpenAIEmbeddings } from "@langchain/openai";
import { ai } from "./ai.js";

// Initialize embeddings (requires OPENAI_API_KEY)
const embeddings = new OpenAIEmbeddings({
    apiKey: process.env.OPENAI_API_KEY,
    modelName: "text-embedding-3-small"
});

export class RAGService {
    /**
     * Perform semantic search to find relevant legal chunks
     */
    static async searchKnowledge(query: string, limit = 5) {
        try {
            const queryVector = await embeddings.embedQuery(query);

            // Perform vector similarity search
            // <=> is the cosine distance operator in pgvector
            const results = await prisma.$queryRawUnsafe(`
                SELECT content, source, 1 - (embedding <=> $1::vector) as similarity
                FROM knowledge_chunks
                WHERE 1 - (embedding <=> $1::vector) > 0.6
                ORDER BY similarity DESC
                LIMIT $2
            `, queryVector, limit);

            return results as { content: string; source: string; similarity: number }[];
        } catch (error) {
            console.error("RAG Search Error:", error);
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
        Your goal is to provide accurate, helpful, and legally-grounded answers to estate settlement questions.
        
        CONTEXT FROM LEGAL GUIDES:
        ${contextContent}
        
        USER QUESTION: ${question}
        
        INSTRUCTIONS:
        1. Answer the question specifically using ONLY the provided context.
        2. IF the answer is not contained in the context, explicitly state that you don't have enough information from the current guides and suggest professional advice.
        3. ALWAYS cite your sources (e.g., "According to the Executor's Guide...").
        4. Use a professional, supportive, and clear tone.
        5. If specific California Probate Code sections are mentioned in the context, include them.
        `;

        const answer = await ai.generateText(prompt, "heavy");

        return {
            answer,
            sources: [...new Set(contexts.map(c => c.source))]
        };
    }
}
