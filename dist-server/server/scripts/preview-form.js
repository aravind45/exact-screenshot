import { FormService } from '../services/formService.js';
import { DE160_MAPPING } from '../services/formMappings.js';
import fs from 'fs';
import path from 'path';
async function preview() {
    console.log("Generating Preview for DE-160...");
    const sampleData = {
        'partyName': 'Aravind Estate Admin',
        'partyAddress': '123 Probate Lane, San Francisco, CA',
        'partyPhone': '(555) 000-1234',
        'estateOf': 'ESTATE OF JANE DOE',
        'caseNumber': 'PB-2026-001',
        'totalInventory': '$1,250,000.00',
    };
    try {
        const pdfBytes = await FormService.generateOverlayPdf('DE-160 INVENTORY AND APPRAISAL.pdf', sampleData, DE160_MAPPING);
        const outputPath = path.join(process.cwd(), 'server', 'templates', 'preview_DE-160.pdf');
        fs.writeFileSync(outputPath, pdfBytes);
        console.log(`Success! Preview saved to: ${outputPath}`);
    }
    catch (err) {
        console.error("Preview failed:", err.message);
    }
}
preview();
