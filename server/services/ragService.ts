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
     * Retrieval Agent: Perform semantic search and return structured evidence
     */
    static async retrieveLegalChunks(query: string, limit = 5) {
        if (!embeddings) {
            logger.error("RAG Error: OPENAI_API_KEY is missing. Semantic search disabled.");
            return { 
                chunks: [], 
                evidence: [], 
                metadata: { 
                    query, 
                    timestamp: new Date(),
                    error: "OPENAI_API_KEY missing"
                } 
            };
        }
        try {
            const queryVector = await embeddings.embedQuery(query);
            const vectorSql = `[${queryVector.join(',')}]`;

            // Perform vector similarity search
            // CRITICAL: Removed hard threshold - let downstream agents decide relevance
            const results = await prisma.$queryRawUnsafe(`
                SELECT 
                    id,
                    content, 
                    source, 
                    metadata,
                    1 - (embedding <=> $1::vector) as similarity
                FROM knowledge_chunks
                ORDER BY similarity DESC
                LIMIT $2
            `, vectorSql, limit);

            const rows = results as {
                id: string;
                content: string;
                source: string;
                metadata: any;
                similarity: number;
            }[];

            // Structure evidence for downstream agents
            const evidence = rows.map((r, i) => ({
                evidence_id: `e${i + 1}`,
                chunk_id: r.id,
                source: r.source,
                snippet: r.content.slice(0, 220),
                full_content: r.content,
                score: r.similarity,
                metadata: r.metadata
            }));

            logger.info(`🔍 Retrieval Agent: Found ${rows.length} chunks. Top score: ${rows[0]?.similarity?.toFixed(4) || 0}`);

            return {
                chunks: rows,
                evidence,
                metadata: {
                    query,
                    timestamp: new Date(),
                    retrieval_count: rows.length,
                    top_score: rows[0]?.similarity || 0
                }
            };
        } catch (error) {
            logger.error("Retrieval Agent Error:", error);
            return { 
                chunks: [], 
                evidence: [], 
                metadata: { 
                    query,
                    timestamp: new Date(),
                    error: String(error) 
                } 
            };
        }
    }

    /**
     * Legacy method - kept for backward compatibility
     * @deprecated Use retrieveLegalChunks instead
     */
    static async searchKnowledge(query: string, limit = 5) {
        const result = await this.retrieveLegalChunks(query, limit);
        return result.chunks;
    }

    /**
     * Draft Agent: Generate answer draft using evidence (no citations)
     */
    static async draftAnswer(question: string, evidence: any[]) {
        if (evidence.length === 0) {
            return {
                draft: "I couldn't find specific information in our legal guides to answer that. For complex legal matters, I strongly recommend consulting with a qualified estate attorney.",
                confidence: 0,
                metadata: { 
                    evidence_used: 0,
                    timestamp: new Date()
                }
            };
        }

        // Build context from evidence
        const contextContent = evidence
            .map((e) => `[Evidence ${e.evidence_id}] Source: ${e.source}\n${e.full_content}`)
            .join("\n\n---\n\n");

        const prompt = `
You are an elite Estate Settlement AI Assistant for ExpectedEstate.

CRITICAL RULES:
1. Answer ONLY using the provided evidence
2. DO NOT add information not in the evidence
3. DO NOT cite sources yet (Citation Agent will handle that)
4. Write in a professional, supportive, clear tone
5. If evidence is insufficient, explicitly state that

EVIDENCE:
${contextContent}

USER QUESTION: ${question}

Write a comprehensive answer using ONLY the evidence above.
`;

        const draft = await ai.generateText(prompt, "heavy");

        logger.info(`✍️ Draft Agent: Generated ${draft.length} chars from ${evidence.length} evidence chunks`);

        return {
            draft,
            confidence: evidence[0]?.score || 0,
            metadata: {
                evidence_used: evidence.length,
                draft_length: draft.length,
                timestamp: new Date()
            }
        };
    }

    /**
     * Citation Agent: Add citations to draft and enforce grounding
     */
    static async attachCitations(draft: string, evidence: any[]) {
        if (evidence.length === 0) {
            return {
                final_answer: draft,
                citations: [],
                grounding_score: 0,
                metadata: {
                    citations_added: 0,
                    timestamp: new Date()
                }
            };
        }

        // Build evidence map for LLM
        const evidenceList = evidence
            .map(e => `${e.evidence_id}: ${e.source} (Score: ${e.score.toFixed(3)})`)
            .join("\n");

        const prompt = `
You are a Citation Agent. Your job is to add citations to the draft answer.

CRITICAL RULES:
1. Use ONLY the evidence IDs provided below
2. Format citations as [e1], [e2], etc.
3. Every factual claim MUST have a citation
4. If a claim cannot be cited, remove it or mark as uncertain
5. Add a disclaimer at the end

DRAFT ANSWER:
${draft}

AVAILABLE EVIDENCE:
${evidenceList}

Return the final answer with proper citations. Every claim must be grounded in evidence.
`;

        const finalAnswer = await ai.generateText(prompt, "heavy");

        // Extract citations used
        const citationMatches = finalAnswer.match(/\[e\d+\]/g) || [];
        const uniqueCitations = [...new Set(citationMatches)];

        // Calculate grounding score
        const groundingScore = uniqueCitations.length / Math.max(evidence.length, 1);

        logger.info(`📎 Citation Agent: Added ${uniqueCitations.length} citations. Grounding: ${(groundingScore * 100).toFixed(1)}%`);

        return {
            final_answer: finalAnswer,
            citations: uniqueCitations,
            grounding_score: groundingScore,
            metadata: {
                citations_added: uniqueCitations.length,
                evidence_available: evidence.length,
                timestamp: new Date()
            }
        };
    }

    /**
     * Validation Agent: Ensure answer meets compliance standards
     */
    static async validateAnswer(finalAnswer: string, evidence: any[], metadata: any) {
        const validationChecks = {
            has_disclaimer: finalAnswer.toLowerCase().includes('not legal advice') || 
                           finalAnswer.toLowerCase().includes('educational purposes'),
            has_citations: /\[e\d+\]/.test(finalAnswer),
            sufficient_evidence: evidence.length >= 2,
            grounding_score: metadata.grounding_score || 0,
            answer_length: finalAnswer.length
        };

        const isValid = 
            validationChecks.has_disclaimer &&
            validationChecks.has_citations &&
            validationChecks.sufficient_evidence &&
            validationChecks.grounding_score > 0.3;

        // Add disclaimer if missing
        let validatedAnswer = finalAnswer;
        if (!validationChecks.has_disclaimer) {
            validatedAnswer += "\n\n**Disclaimer:** This information is for educational purposes only and does not constitute legal advice. For specific legal guidance, please consult with a qualified estate attorney.";
        }

        logger.info(`✅ Validation Agent: ${isValid ? 'PASSED' : 'FAILED'} - Grounding: ${(validationChecks.grounding_score * 100).toFixed(1)}%`);

        return {
            validated_answer: validatedAnswer,
            is_valid: isValid,
            validation_checks: validationChecks,
            metadata: {
                timestamp: new Date(),
                validation_status: isValid ? 'PASSED' : 'FAILED'
            }
        };
    }

    /**
     * Legacy method - kept for backward compatibility
     * @deprecated Use OrchestratorService.answerLegalQuestion instead
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
