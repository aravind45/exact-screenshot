import { OrchestratorService } from "./server/services/orchestratorService.js";
import { prisma } from "./server/db.js";
import { logger } from "./server/lib/logger.js";

async function testPhase3() {
    logger.info("🧪 Phase 3: Advanced Agents Testing\n");
    
    // Get a test estate
    const testEstate = await prisma.estate.findFirst({
        include: {
            user: true
        }
    });
    
    if (!testEstate) {
        logger.error("No test estate found. Creating one...");
        const testUser = await prisma.user.findFirst() || await prisma.user.create({
            data: {
                email: "test-phase3@expectedestate.com",
                fullName: "Phase 3 Test User"
            }
        });
        
        const newEstate = await prisma.estate.create({
            data: {
                userId: testUser.id,
                name: "Test Estate for Phase 3",
                deceasedFirstName: "John",
                deceasedLastName: "Doe",
                deceasedDateOfDeath: new Date("2024-01-15"),
                deceasedState: "CA",
                hasWill: true,
                estateType: "FULL_PROBATE",
                authorityType: "EXECUTOR",
                estimatedPersonalProperty: 250000,
                estimatedRealProperty: 500000,
                estimatedLiabilities: 50000,
                hasMinorBeneficiaries: false,
                isInternational: false,
                probateStatus: "NOT_STARTED"
            }
        });
        
        logger.info(`✓ Created test estate: ${newEstate.id}`);
        return testPhase3(); // Retry with new estate
    }
    
    logger.info(`Using test estate: ${testEstate.name} (${testEstate.id})\n`);
    
    // Test 3.1: Form-Filling Agent
    logger.info("=".repeat(80));
    logger.info("TEST 3.1: Form-Filling Agent");
    logger.info("=".repeat(80));
    
    const formTypes = ['DE-111', 'DE-221', 'DE-150', 'DE-160'];
    
    for (const formType of formTypes) {
        logger.info(`\n📋 Testing form: ${formType}`);
        const result = await OrchestratorService.fillForm(testEstate, formType);
        
        logger.info(`   Success: ${result.success}`);
        logger.info(`   Fields extracted: ${result.metadata?.fields_extracted || 0}`);
        logger.info(`   Missing required: ${result.missing_fields?.length || 0}`);
        if (result.missing_fields && result.missing_fields.length > 0) {
            logger.info(`   Missing: ${result.missing_fields.join(', ')}`);
        }
        logger.info(`   Confidence: ${((result.confidence || 0) * 100).toFixed(1)}%`);
        logger.info(`   Execution time: ${result.execution_time_ms}ms`);
        
        if (result.extracted_data && Object.keys(result.extracted_data).length > 0) {
            logger.info(`   Sample data: ${JSON.stringify(Object.keys(result.extracted_data).slice(0, 3))}`);
        }
    }
    
    // Test 3.2: Checklist Agent
    logger.info("\n" + "=".repeat(80));
    logger.info("TEST 3.2: Checklist Agent");
    logger.info("=".repeat(80));
    
    const checklistResult = await OrchestratorService.createChecklist(testEstate, {
        currentPhase: 'discovery'
    });
    
    logger.info(`\n✅ Checklist generated`);
    logger.info(`   Items: ${checklistResult.checklist?.length || 0}`);
    logger.info(`   Execution time: ${checklistResult.execution_time_ms}ms`);
    
    if (checklistResult.summary) {
        logger.info(`   Summary: ${checklistResult.summary.substring(0, 100)}...`);
    }
    
    if (checklistResult.checklist && checklistResult.checklist.length > 0) {
        logger.info(`\n   Top 3 priorities:`);
        checklistResult.checklist.slice(0, 3).forEach((item: any) => {
            logger.info(`   ${item.priority}. ${item.task}`);
            logger.info(`      Category: ${item.category}`);
            logger.info(`      Time: ${item.estimated_time}`);
        });
    }
    
    // Test 3.3: Timeline Agent
    logger.info("\n" + "=".repeat(80));
    logger.info("TEST 3.3: Timeline Agent");
    logger.info("=".repeat(80));
    
    const timelineResult = await OrchestratorService.createTimeline(testEstate);
    
    logger.info(`\n📅 Timeline generated`);
    logger.info(`   Milestones: ${timelineResult.timeline?.length || 0}`);
    logger.info(`   Critical deadlines: ${timelineResult.critical_deadlines?.length || 0}`);
    logger.info(`   Execution time: ${timelineResult.execution_time_ms}ms`);
    
    if (timelineResult.timeline && timelineResult.timeline.length > 0) {
        logger.info(`\n   Upcoming milestones:`);
        timelineResult.timeline.slice(0, 5).forEach((item: any) => {
            logger.info(`   ${item.date} - ${item.milestone} (${item.type})`);
            logger.info(`      ${item.description}`);
        });
    }
    
    if (timelineResult.critical_deadlines && timelineResult.critical_deadlines.length > 0) {
        logger.info(`\n   ⚠️  Critical deadlines: ${timelineResult.critical_deadlines.join(', ')}`);
    }
    
    // Test 3.4: Integration test - All agents together
    logger.info("\n" + "=".repeat(80));
    logger.info("TEST 3.4: Multi-Agent Integration");
    logger.info("=".repeat(80));
    
    logger.info(`\n🤖 Running all agents for estate: ${testEstate.name}`);
    
    const integrationStart = Date.now();
    
    const [formResult, checklistResult2, timelineResult2] = await Promise.all([
        OrchestratorService.fillForm(testEstate, 'DE-111'),
        OrchestratorService.createChecklist(testEstate),
        OrchestratorService.createTimeline(testEstate)
    ]);
    
    const integrationTime = Date.now() - integrationStart;
    
    logger.info(`\n✅ All agents completed in ${integrationTime}ms`);
    logger.info(`   Form-Filling: ${formResult.success ? 'SUCCESS' : 'FAILED'}`);
    logger.info(`   Checklist: ${checklistResult2.checklist?.length || 0} items`);
    logger.info(`   Timeline: ${timelineResult2.timeline?.length || 0} milestones`);
    
    logger.info("\n" + "=".repeat(80));
    logger.info("✅ Phase 3 Testing Complete!");
    logger.info("=".repeat(80));
}

testPhase3().catch(console.error).finally(() => process.exit(0));
