import { DocumentService } from '../services/DocumentService.js';
import fs from 'fs';
import path from 'path';
async function calibrateAll() {
    const templates = [
        'DE-111.pdf',
        'DE-150 LETTERS (Probate).pdf',
        'DE-160 INVENTORY AND APPRAISAL.pdf'
    ];
    for (const template of templates) {
        console.log(`Generating calibration for: ${template}...`);
        try {
            // Note: generateCalibrationPdf was previously in FormService, 
            // but DocumentService now handles getting template bytes and we can re-implement it or call it if we moved it.
            // Wait, I didn't move generateCalibrationPdf to DocumentService yet. 
            // I should move it.
            const calibratedBytes = await DocumentService.generateCalibrationPdf(template);
            const outputName = `calibrated_${template.replace(/ /g, '_')}`;
            const outputPath = path.join(process.cwd(), 'server', 'templates', outputName);
            fs.writeFileSync(outputPath, calibratedBytes);
            console.log(`Success! Calibrated PDF saved to: ${outputPath}`);
        }
        catch (err) {
            console.error(`Calibration failed for ${template}:`, err.message);
        }
    }
}
calibrateAll();
