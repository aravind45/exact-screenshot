import { AgentService } from "./server/services/agentService";
import { prisma } from "./server/db";

async function test() {
    try {
        console.log("Checking for estates...");
        const estate = await prisma.estate.findFirst();
        if (!estate) {
            console.log("No estate found.");
            process.exit(0);
        }
        console.log("Found estate:", estate.id);

        console.log("Running Watchdog Scan...");
        const insights = await AgentService.runWatchdogScan(estate.id);
        console.log("Insights found:", insights.length);
        console.log(JSON.stringify(insights, null, 2));
    } catch (error) {
        console.error("Test Failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

test();
