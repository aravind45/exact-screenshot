import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

async function inspectAllPdfs() {
    const templatesDir = 'c:/Users/aravi/Documents/AI_LLM/projects/exact-screenshot/server/templates';
    const files = fs.readdirSync(templatesDir);

    for (const file of files) {
        if (file.endsWith('.pdf')) {
            const pdfPath = path.join(templatesDir, file);
            const pdfBytes = fs.readFileSync(pdfPath);
            try {
                const pdfDoc = await PDFDocument.load(pdfBytes);
                const form = pdfDoc.getForm();
                const fields = form.getFields();
                console.log(`File: ${file} - Found ${fields.length} fields.`);
            } catch (e) {
                console.log(`File: ${file} - Error: ${e.message}`);
            }
        }
    }
}

inspectAllPdfs().catch(console.error);
