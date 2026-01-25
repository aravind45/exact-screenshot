import { prisma } from "../server/db.js";

async function main() {
    console.log("=== Template Database Diagnostic ===\n");

    // 1. List all templates
    const templates = await prisma.formTemplate.findMany({
        select: { id: true, name: true, createdAt: true, updatedAt: true }
    });

    console.log(`Found ${templates.length} templates in database:`);
    templates.forEach(t => {
        console.log(`  - ${t.name} (ID: ${t.id.substring(0, 8)}..., Updated: ${t.updatedAt.toISOString()})`);
    });

    // 2. Try to fetch DE-111 specifically
    console.log("\n=== Testing DE-111 Lookup ===");
    const de111 = await prisma.formTemplate.findUnique({
        where: { name: "DE-111" }
    });

    if (de111) {
        console.log(`✅ DE-111 found!`);
        console.log(`   - Size: ${de111.data.length} bytes`);
        console.log(`   - Last updated: ${de111.updatedAt}`);
    } else {
        console.log("❌ DE-111 NOT found with exact name 'DE-111'");

        // Try case-insensitive search
        const allTemplates = await prisma.formTemplate.findMany();
        console.log("\nAll template names in DB:");
        allTemplates.forEach(t => console.log(`   "${t.name}"`));
    }

    // 3. Check what PdfService would see
    console.log("\n=== Simulating PdfService Lookup ===");
    const mockEstate = { deceasedState: "CA" };
    console.log(`Estate state: ${mockEstate.deceasedState}`);

    const serviceResult = await prisma.formTemplate.findUnique({
        where: { name: "DE-111" }
    });

    if (serviceResult) {
        console.log("✅ PdfService WOULD find the template");
    } else {
        console.log("❌ PdfService WOULD NOT find the template");
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
