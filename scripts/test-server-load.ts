
// Test script to verify that all server routes can be loaded by tsx
// This catches syntax errors or runtime import issues that tsc might miss
import { prisma } from "../server/db.js";

async function main() {
    console.log("🔍 Testing Server Module Loading...");

    try {
        console.log("Importing authRoutes...");
        await import("../server/routes/authRoutes.js");

        console.log("Importing estateRoutes...");
        await import("../server/routes/estateRoutes.js");

        console.log("Importing pdfService...");
        await import("../server/services/pdfService.js");

        console.log("✅ All modules loaded successfully!");
    } catch (e: any) {
        console.error("❌ Module Load Failed:", e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
