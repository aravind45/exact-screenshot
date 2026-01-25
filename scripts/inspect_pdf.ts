
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

async function inspect() {
    const relativePath = path.join('server', 'templates', 'DE-111.pdf');
    const absolutePath = path.join(process.cwd(), relativePath);

    console.log(`Checking path: ${absolutePath}`);

    if (!fs.existsSync(absolutePath)) {
        console.error("❌ File NOT found at this path.");
        console.log("Current working directory:", process.cwd());
        console.log("Please confirm the file is in:", path.join(process.cwd(), 'server', 'templates'));
        return;
    }

    const stats = fs.statSync(absolutePath);
    console.log(`✅ File found! Size: ${stats.size} bytes`);

    if (stats.size < 5000) {
        console.warn("⚠️  WARNING: File is very small (< 5KB). This is likely the dummy placeholder, not the official court form.");
    }

    try {
        const pdfBytes = fs.readFileSync(absolutePath);
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const form = pdfDoc.getForm();
        const fields = form.getFields().map(f => f.getName());

        console.log("\n--- DETECTED FIELDS ---");
        if (fields.length === 0) {
            console.log("No form fields found (Is this a flattened PDF?)");
        } else {
            // Print first 10 fields
            fields.slice(0, 10).forEach(f => console.log(`- ${f}`));
            if (fields.length > 10) console.log(`... and ${fields.length - 10} more.`);
        }
        console.log("-----------------------\n");

    } catch (e: any) {
        console.error("Error reading PDF:", e.message);
    }
}

inspect();
