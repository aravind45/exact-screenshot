import { PDFDocument } from 'pdf-lib';
import { prisma } from "../server/db.js";

async function main() {
    console.log("=== Extracting DE-111 Field Names ===\n");

    // Fetch the real form from database
    const template = await prisma.formTemplate.findUnique({
        where: { name: "DE-111" }
    });

    if (!template) {
        console.error("❌ DE-111 not found in database");
        return;
    }

    console.log(`✅ Found DE-111 (${template.data.length} bytes)\n`);

    // Load and analyze
    const pdfDoc = await PDFDocument.load(template.data);
    const form = pdfDoc.getForm();
    const fields = form.getFields();

    console.log(`Total fields: ${fields.length}\n`);
    console.log("=== Field Names ===");

    fields.forEach((field, index) => {
        const name = field.getName();
        const type = field.constructor.name;
        console.log(`${index + 1}. "${name}" (${type})`);
    });

    console.log("\n=== Suggested Mapping ===");
    console.log("Look for fields containing:");
    console.log("  - 'petitioner' or 'attorney'");
    console.log("  - 'decedent' or 'deceased'");
    console.log("  - 'value' or 'estate'");
    console.log("  - 'will' or 'codicil'");
    console.log("  - 'bond'");
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
