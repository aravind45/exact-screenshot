import "dotenv/config";
import { FormSeedingService } from "../server/services/formSeedingService.js";
import { prisma } from "../server/db.js";

async function run() {
    try {
        console.log("Starting manual seed...");
        await FormSeedingService.seedDefaults();
        console.log("Seeding successful.");
    } catch (e) {
        console.error("Seeding failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

run();
