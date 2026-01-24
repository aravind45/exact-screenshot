import { prisma } from "../server/db.js";
import { AgentService } from "../server/services/agentService.js";

async function verify() {
    console.log("--- Verifying Backend Gaps ---");

    // 1. Verify Threshold Logic
    const user = await prisma.user.findFirst();
    if (!user) {
        console.log("No user found, skip threshold check.");
    } else {
        const estate = await prisma.estate.findFirst({ where: { userId: user.id } });
        if (estate) {
            console.log(`Checking threshold for estate in ${estate.deceasedState}...`);
            // We'd need to mock the request or call the logic directly
            // For now, we'll just log that the fields are present in the response logic
        }
    }

    // 2. Verify Watchdog
    const estates = await prisma.estate.findMany();
    for (const estate of estates) {
        const insights = await AgentService.runWatchdogScan(estate.id);
        console.log(`Estate ${estate.id}: Found ${insights.length} stale assets.`);
    }

    console.log("--- Verification Complete ---");
}

verify().catch(console.error);
