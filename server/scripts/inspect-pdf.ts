import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

async function inspectPdfFields() {
    const pdfPath = 'c:/Users/aravi/Documents/AI_LLM/projects/exact-screenshot/server/templates/DE-111.pdf';
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    const fields = form.getFields();

    console.log(`Found ${fields.length} fields in the PDF.`);

    fields.forEach(field => {
        const type = field.constructor.name;
        const name = field.getName();
        console.log(`Field: ${name} [${type}]`);
    });
}

inspectPdfFields().catch(console.error);
