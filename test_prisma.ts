import { prisma } from "./server/db.js";

async function test() {
    try {
        console.log("Testing prisma.diagnosticRun.count...");
        // @ts-ignore - checking if it exists at runtime
        const runCount = await prisma.diagnosticRun.count();
        console.log("Success! DiagnosticRun count:", runCount);

        console.log("Testing prisma.countyOverride.count...");
        // @ts-ignore - checking if it exists at runtime
        const overrideCount = await prisma.countyOverride.count();
        console.log("Success! CountyOverride count:", overrideCount);
    } catch (error) {
        console.error("FAILED:", error);
    } finally {
        await prisma.$disconnect();
    }
}

test();
