import { PDFDocument } from 'pdf-lib';
import fs from 'fs';

async function test() {
    const pdfPath = 'c:/Users/aravi/Documents/AI_LLM/projects/exact-screenshot/server/templates/DE-160 INVENTORY AND APPRAISAL.pdf';
    console.log(`Loading: ${pdfPath}`);
    const bytes = fs.readFileSync(pdfPath);
    try {
        const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
        console.log("Load successful.");
        const form = doc.getForm();
        const fields = form.getFields();
        console.log("Field count:", fields.length);
        fields.forEach(f => console.log(f.getName()));
    } catch (e: any) {
        console.log("Error:", e.message);
    }
}
test();
