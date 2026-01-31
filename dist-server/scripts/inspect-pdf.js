import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
async function inspectPdfFields() {
    const pdfPath = 'c:/Users/aravi/Documents/AI_LLM/projects/exact-screenshot/server/templates/DE-150 LETTERS (Probate).pdf';
    console.log(`Inspecting: ${pdfPath}`);
    try {
        const pdfBytes = fs.readFileSync(pdfPath);
        const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
        const form = pdfDoc.getForm();
        const fields = form.getFields();
        console.log(`Found ${fields.length} fields in the PDF.`);
        if (fields.length === 0) {
            console.log("No fields found. This might be a flattened PDF or an XFA form which is not fully supported by pdf-lib mapping.");
            // Check for XFA
            const xfa = pdfDoc.catalog.get(pdfDoc.context.obj('AcroForm'))?.asDict()?.get(pdfDoc.context.obj('XFA'));
            if (xfa) {
                console.log("XFA data detected. This form uses XML structure for fields.");
            }
        }
        fields.forEach(field => {
            const type = field.constructor.name;
            const name = field.getName();
            console.log(`Field: ${name} [${type}]`);
        });
    }
    catch (err) {
        console.error("PDF Loading Error:", err.message);
        if (err.stack)
            console.error(err.stack);
    }
}
inspectPdfFields().catch(console.error);
