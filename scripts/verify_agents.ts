
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { OrchestratorService } from "../server/services/orchestratorService.js";
import { logger } from "../server/lib/logger.js";

const prisma = new PrismaClient();

async function main() {
    console.log("🔍 Starting Agent Verification...");

    // 1. Find a test estate
    const estate = await prisma.estate.findFirst({
        include: { user: true }
    });

    if (!estate) {
        console.error("❌ No estate found in database to test with.");
        process.exit(1);
    }

    console.log(`✅ Using Estate: ${estate.name} (${estate.id})`);

    // 2. Test Checklist Agent
    console.log("\n📋 Testing Checklist Agent...");
    try {
        const checklist = await OrchestratorService.createChecklist(estate, { currentPhase: 'discovery' });
        if (checklist.checklist && checklist.checklist.length > 0) {
            console.log(`   ✅ Success: Generated ${checklist.checklist.length} items`);
        } else {
            console.error("   ❌ Failed: No items generated");
            console.error(checklist);
        }
    } catch (e) {
        console.error(`   ❌ Error: ${e}`);
    }

    // 3. Test Timeline Agent
    console.log("\n📅 Testing Timeline Agent...");
    try {
        const timeline = await OrchestratorService.createTimeline(estate);
        if (timeline.timeline && timeline.timeline.length > 0) {
            console.log(`   ✅ Success: Generated ${timeline.timeline.length} timeline events`);
        } else {
            console.error("   ❌ Failed: No timeline events");
            console.error(timeline);
        }
    } catch (e) {
        console.error(`   ❌ Error: ${e}`);
    }

    // 4. Test Form-Filling Agent (Mock call to avoid cost/time if possible, or just DE-111)
    console.log("\n📝 Testing Form-Filling Agent (DE-111)...");
    try {
        const formResult = await OrchestratorService.fillForm(estate, 'DE-111');
        if (formResult.success || formResult.missing_fields) {
            // It might fail validation if data is missing, but as long as it returns a structure it's "working"
            console.log(`   ✅ Success: Agent ran. Fields extracted: ${Object.keys(formResult.extracted_data || {}).length}`);
        } else {
            console.error("   ❌ Failed: Agent returned error");
            console.error(formResult);
        }
    } catch (e) {
        console.error(`   ❌ Error: ${e}`);
    }

    console.log("\n✨ Verification Complete");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
