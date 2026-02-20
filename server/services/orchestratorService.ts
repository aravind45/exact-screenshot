import { RAGService } from "./ragService.js";
import { prisma } from "../db.js";
import { logger } from "../lib/logger.js";

export class OrchestratorService {
    /**
     * Main orchestration flow for legal question answering
     * Coordinates multiple specialized agents to produce grounded, compliant answers
     */
    static async answerLegalQuestion(question: string, userId?: string) {
        const startTime = Date.now();
        const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        logger.info(`🎯 Orchestrator [${executionId}]: Starting multi-agent flow for question`);

        try {
            // STEP 0: Query Expansion - Agentic optimization
            logger.info(`🎯 Orchestrator [${executionId}]: Step 0 - Query Expansion`);
            const optimizedQuery = await RAGService.expandQuery(question);
            logger.info(`🔍 Orchestrator: Optimized "${question}" -> "${optimizedQuery}"`);

            // STEP 1: Retrieval Agent - Hybrid Search
            logger.info(`🎯 Orchestrator [${executionId}]: Step 1 - Retrieval Agent (Hybrid)`);
            const retrieval = await RAGService.retrieveLegalChunks(optimizedQuery, 5);

            if (retrieval.chunks.length === 0) {
                logger.warn(`🎯 Orchestrator [${executionId}]: No evidence found, returning fallback`);
                const draft = await RAGService.draftAnswer(question, []);
                return this.buildResponse({
                    answer: draft.draft,
                    sources: [],
                    evidence: [],
                    execution_id: executionId,
                    agent_flow: ['retrieval', 'draft'],
                    execution_time_ms: Date.now() - startTime,
                    metadata: {
                        retrieval: retrieval.metadata,
                        draft: draft.metadata
                    }
                });
            }

            // STEP 2: Draft Agent - Generate answer from evidence
            logger.info(`🎯 Orchestrator [${executionId}]: Step 2 - Draft Agent`);
            const draft = await RAGService.draftAnswer(question, retrieval.evidence);

            // STEP 3: Citation Agent - Add citations and enforce grounding
            logger.info(`🎯 Orchestrator [${executionId}]: Step 3 - Citation Agent`);
            const cited = await RAGService.attachCitations(draft.draft, retrieval.evidence);

            // STEP 4: Validation Agent - Ensure compliance
            logger.info(`🎯 Orchestrator [${executionId}]: Step 4 - Validation Agent`);
            const validated = await RAGService.validateAnswer(
                cited.final_answer,
                retrieval.evidence,
                { grounding_score: cited.grounding_score }
            );

            // Build final response
            const response = this.buildResponse({
                answer: validated.validated_answer,
                sources: [...new Set(retrieval.evidence.map(e => e.source))],
                evidence: retrieval.evidence.map(e => ({
                    id: e.evidence_id,
                    source: e.source,
                    snippet: e.snippet,
                    score: e.score
                })),
                execution_id: executionId,
                agent_flow: ['retrieval', 'draft', 'citation', 'validation'],
                execution_time_ms: Date.now() - startTime,
                metadata: {
                    retrieval: retrieval.metadata,
                    draft: draft.metadata,
                    citation: cited.metadata,
                    validation: validated.metadata
                }
            });

            // Log to database for audit trail
            if (userId) {
                await this.logExecution(executionId, question, response, userId);
            }

            logger.info(`✅ Orchestrator [${executionId}]: Completed in ${Date.now() - startTime}ms`);

            return response;

        } catch (error) {
            logger.error(`❌ Orchestrator [${executionId}]: Error`, error);

            // Return graceful error response
            return this.buildResponse({
                answer: "I encountered an error while processing your question. Please try again or contact support if the issue persists.",
                sources: [],
                evidence: [],
                execution_id: executionId,
                agent_flow: ['error'],
                execution_time_ms: Date.now() - startTime,
                metadata: {
                    error: String(error)
                }
            });
        }
    }

    /**
     * Build standardized response structure
     */
    private static buildResponse(data: any) {
        return {
            answer: data.answer,
            sources: data.sources,
            evidence: data.evidence,
            metadata: {
                execution_id: data.execution_id,
                agent_flow: data.agent_flow,
                execution_time_ms: data.execution_time_ms,
                timestamp: new Date().toISOString(),
                ...data.metadata
            }
        };
    }

    /**
     * Log execution to database for audit trail and compliance
     */
    private static async logExecution(executionId: string, question: string, response: any, userId: string) {
        try {
            await prisma.agentExecution.create({
                data: {
                    executionId,
                    userId,
                    question,
                    answer: response.answer,
                    sources: response.sources,
                    evidence: response.evidence as any,
                    metadata: response.metadata as any,
                    executionTimeMs: response.metadata.execution_time_ms
                }
            });
            logger.info(`📝 Orchestrator: Logged execution ${executionId} to database`);
        } catch (error) {
            logger.error("Failed to log agent execution:", error);
            // Don't throw - logging failure shouldn't break the response
        }
    }

    /**
     * Export audit trail for legal compliance
     */
    static async exportAuditTrail(executionId: string) {
        try {
            const execution = await prisma.agentExecution.findUnique({
                where: { executionId },
                include: { user: true }
            });

            if (!execution) {
                throw new Error(`Execution ${executionId} not found`);
            }

            return {
                execution_id: executionId,
                timestamp: execution.createdAt,
                user: execution.user?.email || 'anonymous',
                question: execution.question,
                answer: execution.answer,
                evidence_used: execution.evidence,
                sources: execution.sources,
                agent_flow: (execution.metadata as any)?.agent_flow || [],
                validation_status: (execution.metadata as any)?.validation?.validation_status,
                grounding_score: (execution.metadata as any)?.citation?.grounding_score,
                execution_time_ms: execution.executionTimeMs
            };
        } catch (error) {
            logger.error("Failed to export audit trail:", error);
            throw error;
        }
    }

}
