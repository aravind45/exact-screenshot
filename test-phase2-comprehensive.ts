import { RAGService } from "./server/services/ragService.js";
import { OrchestratorService } from "./server/services/orchestratorService.js";
import { prisma } from "./server/db.js";
import { logger } from "./server/lib/logger.js";

async function testPhase2() {
    logger.info("🧪 Phase 2 Comprehensive Testing\n");
    
    // Test 2.4.1: Retrieval Agent with various queries
    logger.info("=" .repeat(80));
    logger.info("TEST 2.4.1: Retrieval Agent with Various Queries");
    logger.info("=".repeat(80));
    
    const retrievalQueries = [
        "probate process",
        "executor duties",
        "estate taxes",
        "invalid query xyz123",
        ""
    ];
    
    for (const query of retrievalQueries) {
        logger.info(`\n📝 Query: "${query}"`);
        const result = await RAGService.retrieveLegalChunks(query, 3);
        logger.info(`   Evidence found: ${result.evidence.length}`);
        logger.info(`   Top score: ${result.metadata.top_score?.toFixed(4) || 'N/A'}`);
    }
    
    // Test 2.4.2: Draft Agent with different evidence sets
    logger.info("\n" + "=".repeat(80));
    logger.info("TEST 2.4.2: Draft Agent with Different Evidence Sets");
    logger.info("=".repeat(80));
    
    const draftTests = [
        { name: "Full evidence", query: "What is probate?" },
        { name: "Empty evidence", query: "nonexistent topic xyz" }
    ];
    
    for (const test of draftTests) {
        logger.info(`\n📝 Test: ${test.name}`);
        const retrieval = await RAGService.retrieveLegalChunks(test.query, 3);
        const draft = await RAGService.draftAnswer(test.query, retrieval.evidence);
        logger.info(`   Draft length: ${draft.draft.length} chars`);
        logger.info(`   Confidence: ${draft.confidence.toFixed(4)}`);
        logger.info(`   Evidence used: ${draft.metadata.evidence_used}`);
    }
    
    // Test 2.4.3: Citation Agent enforcement
    logger.info("\n" + "=".repeat(80));
    logger.info("TEST 2.4.3: Citation Agent Citation Enforcement");
    logger.info("=".repeat(80));
    
    const citationTest = await RAGService.retrieveLegalChunks("probate", 5);
    const citationDraft = await RAGService.draftAnswer("What is probate?", citationTest.evidence);
    const cited = await RAGService.attachCitations(citationDraft.draft, citationTest.evidence);
    
    logger.info(`\n📎 Citations added: ${cited.citations.length}`);
    logger.info(`   Unique citations: ${cited.citations.join(", ")}`);
    logger.info(`   Grounding score: ${(cited.grounding_score * 100).toFixed(1)}%`);
    logger.info(`   Evidence available: ${citationTest.evidence.length}`);
    
    // Test 2.4.4: Validation Agent compliance checks
    logger.info("\n" + "=".repeat(80));
    logger.info("TEST 2.4.4: Validation Agent Compliance Checks");
    logger.info("=".repeat(80));
    
    const validationTests = [
        { name: "With disclaimer", answer: "This is for educational purposes only. [e1]", evidence: citationTest.evidence },
        { name: "Without disclaimer", answer: "Some answer [e1]", evidence: citationTest.evidence },
        { name: "No citations", answer: "Some answer without citations", evidence: citationTest.evidence },
        { name: "Insufficient evidence", answer: "Answer [e1]", evidence: [] }
    ];
    
    for (const test of validationTests) {
        logger.info(`\n✓ Test: ${test.name}`);
        const validated = await RAGService.validateAnswer(
            test.answer,
            test.evidence,
            { grounding_score: 0.8 }
        );
        logger.info(`   Valid: ${validated.is_valid}`);
        logger.info(`   Has disclaimer: ${validated.validation_checks.has_disclaimer}`);
        logger.info(`   Has citations: ${validated.validation_checks.has_citations}`);
        logger.info(`   Sufficient evidence: ${validated.validation_checks.sufficient_evidence}`);
    }
    
    // Test 2.4.5: Full orchestration flow end-to-end
    logger.info("\n" + "=".repeat(80));
    logger.info("TEST 2.4.5: Full Orchestration Flow End-to-End");
    logger.info("=".repeat(80));
    
    const e2eQuestions = [
        "What is probate?",
        "How do I handle estate debts?"
    ];
    
    for (const question of e2eQuestions) {
        logger.info(`\n📝 Question: ${question}`);
        const result = await OrchestratorService.answerLegalQuestion(question);
        logger.info(`   ✅ Answer: ${result.answer.length} chars`);
        logger.info(`   📚 Sources: ${result.sources.length}`);
        logger.info(`   🔍 Evidence: ${result.evidence.length}`);
        logger.info(`   🤖 Flow: ${result.metadata.agent_flow.join(" → ")}`);
        logger.info(`   ⏱️  Time: ${result.metadata.execution_time_ms}ms`);
    }
    
    // Test 2.4.6: Database logging
    logger.info("\n" + "=".repeat(80));
    logger.info("TEST 2.4.6: Database Logging");
    logger.info("=".repeat(80));
    
    // Create a test user first
    let testUser = await prisma.user.findFirst({ where: { email: "test@expectedestate.com" } });
    if (!testUser) {
        testUser = await prisma.user.create({
            data: {
                email: "test@expectedestate.com",
                fullName: "Test User"
            }
        });
        logger.info(`\n✓ Created test user: ${testUser.id}`);
    } else {
        logger.info(`\n✓ Using existing test user: ${testUser.id}`);
    }
    
    const dbTestQuestion = "Test database logging";
    const dbResult = await OrchestratorService.answerLegalQuestion(dbTestQuestion, testUser.id);
    logger.info(`   Execution ID: ${dbResult.metadata.execution_id}`);
    
    // Verify it was logged
    const logged = await prisma.agentExecution.findUnique({
        where: { executionId: dbResult.metadata.execution_id }
    });
    
    if (logged) {
        logger.info(`   ✅ Successfully logged to database`);
        logger.info(`   Question: ${logged.question}`);
        logger.info(`   Answer length: ${logged.answer.length}`);
        logger.info(`   Sources: ${logged.sources.length}`);
        logger.info(`   Execution time: ${logged.executionTimeMs}ms`);
    } else {
        logger.error(`   ❌ Failed to log to database`);
    }
    
    // Test 2.4.7: Error scenarios and fallbacks
    logger.info("\n" + "=".repeat(80));
    logger.info("TEST 2.4.7: Error Scenarios and Fallbacks");
    logger.info("=".repeat(80));
    
    const errorTests = [
        { name: "Empty query", query: "" },
        { name: "Very long query", query: "a".repeat(10000) },
        { name: "Special characters", query: "!@#$%^&*()" }
    ];
    
    for (const test of errorTests) {
        logger.info(`\n🔧 Test: ${test.name}`);
        try {
            const result = await OrchestratorService.answerLegalQuestion(test.query);
            logger.info(`   ✅ Handled gracefully`);
            logger.info(`   Answer length: ${result.answer.length}`);
            logger.info(`   Agent flow: ${result.metadata.agent_flow.join(" → ")}`);
        } catch (error) {
            logger.error(`   ❌ Error: ${error}`);
        }
    }
    
    logger.info("\n" + "=".repeat(80));
    logger.info("✅ Phase 2 Testing Complete!");
    logger.info("=".repeat(80));
}

testPhase2().catch(console.error).finally(() => process.exit(0));
