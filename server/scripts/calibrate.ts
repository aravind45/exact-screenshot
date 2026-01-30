
import { FormService } from '../services/formService.js';
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
            const calibratedBytes = await FormService.generateCalibrationPdf(template);
            const outputName = `calibrated_${template.replace(/ /g, '_')}`;
            const outputPath = path.join(process.cwd(), 'server', 'templates', outputName);
            fs.writeFileSync(outputPath, calibratedBytes);
            console.log(`Success! Calibrated PDF saved to: ${outputPath}`);
        } catch (err: any) {
            console.error(`Calibration failed for ${template}:`, err.message);
        }
    }
}

calibrateAll();
