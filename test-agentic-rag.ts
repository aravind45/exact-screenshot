import { OrchestratorService } from "./server/services/orchestratorService.js";
import { logger } from "./server/lib/logger.js";

async function testAgenticRAG() {
    logger.info("🧪 Testing Agentic RAG Implementation");
    
    const testQuestions = [
        "What is probate?",
        "How do I get letters of administration?",
        "What documents do I need to settle an estate?"
    ];

    for (const question of testQuestions) {
        logger.info(`\n${"=".repeat(80)}`);
        logger.info(`📝 Question: ${question}`);
        logger.info("=".repeat(80));
        
        try {
            const result = await OrchestratorService.answerLegalQuestion(question);
            
            logger.info(`\n✅ Answer received (${result.answer.length} chars)`);
            logger.info(`📚 Sources: ${result.sources.length}`);
            logger.info(`🔍 Evidence: ${result.evidence.length} chunks`);
            logger.info(`⏱️  Execution time: ${result.metadata.execution_time_ms}ms`);
            logger.info(`🤖 Agent flow: ${result.metadata.agent_flow.join(" → ")}`);
            
            if (result.metadata.citation) {
                logger.info(`📎 Citations added: ${result.metadata.citation.citations_added}`);
                logger.info(`🎯 Grounding score: ${(result.metadata.citation.grounding_score * 100).toFixed(1)}%`);
            }
            
            if (result.metadata.validation) {
                logger.info(`✓ Validation: ${result.metadata.validation.validation_status}`);
            }
            
            logger.info(`\n📄 Answer preview:\n${result.answer.substring(0, 300)}...`);
            
        } catch (error) {
            logger.error(`❌ Error: ${error}`);
        }
    }
    
    logger.info(`\n${"=".repeat(80)}`);
    logger.info("✅ Test complete!");
}

testAgenticRAG().catch(console.error);
