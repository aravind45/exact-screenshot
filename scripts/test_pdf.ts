
import { PdfService } from "../server/services/pdfService.js";
import fs from 'fs';
import path from 'path';

// Mock Estate Data
const mockEstate = {
    user: { fullName: "Test User" },
    petitionerPhone: "555-0100",
    petitionerIsAttorney: false,
    deceasedFirstName: "John",
    deceasedLastName: "Doe",
    deceasedDateOfDeath: new Date(),
    deceasedState: "CA",
    estimatedPersonalProperty: 50000,
    estimatedRealProperty: 400000,
    estimatedAnnualIncome: 0,
    hasWill: true,
    willDate: new Date(),
    bondWaived: false,
    bondAmount: 450000
};

async function test() {
    console.log("Generating PDF...");
    try {
        const pdfBytes = await PdfService.generateDE111(mockEstate);
        console.log(`Success! Generated ${pdfBytes.length} bytes.`);

        const outPath = path.join(process.cwd(), 'test_output_de111.pdf');
        fs.writeFileSync(outPath, pdfBytes);
        console.log(`Saved to ${outPath}`);
    } catch (e: any) {
        console.error("Error:", e);
    }
}

test();
