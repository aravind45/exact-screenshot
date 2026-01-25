import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

import { prisma } from '../db.js';

export const PdfService = {
    /**
     * Generates a filled DE-111 Petition for Probate
     */
    async generateDE111(estate: any) {
        let pdfBytes: Buffer;

        // 1. Try Database (Vercel Persistence)
        const dbTemplate = await prisma.formTemplate.findUnique({ where: { name: "DE-111" } });

        if (dbTemplate) {
            pdfBytes = dbTemplate.data as any;
        } else {
            // 2. Try Local File (Dev fallback)
            const templatePath = path.join(process.cwd(), 'server', 'templates', 'DE-111.pdf');
            if (fs.existsSync(templatePath)) {
                pdfBytes = fs.readFileSync(templatePath);
            } else {
                console.warn("Template DE-111.pdf not found. Creating a blank form for testing purposes.");
                // Create a dummy PDF with fields if missing (for dev environment)
                const doc = await PDFDocument.create();
                const page = doc.addPage();
                const form = doc.getForm();
                form.createTextField('PetitionerName').setText('Petitioner Name');
                form.createTextField('DecedentName').setText('Decedent Name');
                form.createTextField('ValuePersonalProperty').setText('0.00');
                page.drawText('DE-111 PLACESHOST (Real form not found)', { x: 50, y: 700 });
                pdfBytes = Buffer.from(await doc.save());
            }
        }

        const pdfDoc = await PDFDocument.load(pdfBytes);
        const form = pdfDoc.getForm();

        // --- MAPPING LOGIC ---

        // 1. Petitioner (Header)
        // Access user details from relation if available, otherwise fallback
        const petitionerName = estate.user?.fullName || "Petitioner";
        safeSetText(form, 'PetitionerName', petitionerName);
        safeSetText(form, 'PetitionerPhone', estate.petitionerPhone || "");

        // Attorney Box
        if (estate.petitionerIsAttorney) {
            safeSetText(form, 'AttorneyName', petitionerName);
        } else {
            safeSetText(form, 'AttorneyName', `${petitionerName} (In Pro Per)`);
        }

        // 2. Decedent Info
        const decedentName = `${estate.deceasedFirstName} ${estate.deceasedLastName}`;
        safeSetText(form, 'DecedentName', decedentName);
        if (estate.deceasedDateOfDeath) {
            safeSetText(form, 'DeathDate', new Date(estate.deceasedDateOfDeath).toLocaleDateString());
        }
        safeSetText(form, 'StreetAddress', estate.deceasedState); // Placeholder for full address

        // 3. Estimated Value
        const personal = Number(estate.estimatedPersonalProperty) || 0;
        const real = Number(estate.estimatedRealProperty) || 0;
        const income = Number(estate.estimatedAnnualIncome) || 0;
        const total = personal + real + income;

        safeSetText(form, 'ValuePersonalProperty', personal.toFixed(2));
        safeSetText(form, 'ValueRealProperty', real.toFixed(2));
        safeSetText(form, 'ValueAnnualIncome', income.toFixed(2));
        safeSetText(form, 'ValueTotal', total.toFixed(2));

        // 4. Will Logic
        if (estate.hasWill) {
            safeSetCheckbox(form, 'HasWillBox', true);
            if (estate.willDate) {
                safeSetText(form, 'WillDate', new Date(estate.willDate).toLocaleDateString());
            }
        } else {
            safeSetCheckbox(form, 'NoWillBox', true);
        }

        // 5. Bond Logic
        if (estate.bondWaived) {
            safeSetCheckbox(form, 'BondWaivedBox', true);
        } else if (estate.bondAmount) {
            safeSetText(form, 'BondAmount', Number(estate.bondAmount).toFixed(2));
        } else {
            // Default calculation if not set: Total Value
            safeSetText(form, 'BondAmount', total.toFixed(2));
        }

        // Return bytes
        return await pdfDoc.save();
    },

    /**
     * Generates a formal "Notification of Death" letter for a specific asset.
     */
    async generateLetter(asset: any, estate: any) {
        const doc = await PDFDocument.create();
        const page = doc.addPage([612, 792]); // Standard US Letter
        const { width, height } = page.getSize();

        const fontSize = 11;
        const fontBoldSize = 12;
        const margin = 50;
        let cursorY = height - margin;

        const drawText = (text: string, size = fontSize) => {
            page.drawText(text, {
                x: margin,
                y: cursorY,
                size
            });
            cursorY -= (size + 5);
        };

        // Header
        drawText("NOTIFICATION OF DEATH AND ESTATE OPENING", fontBoldSize);
        cursorY -= 15;

        // Date
        drawText(`Date: ${new Date().toLocaleDateString()}`);
        cursorY -= 10;

        // Institution Address
        drawText("TO:");
        drawText(asset.institution);
        if (asset.institutionAddress) {
            asset.institutionAddress.split(',').forEach((line: string) => drawText(line.trim()));
        }
        cursorY -= 15;

        // Subject
        drawText(`RE: Estate of ${estate.deceasedFirstName} ${estate.deceasedLastName}`);
        drawText(`Account Number: ${asset.accountNumber || "Unknown"}`);
        drawText(`Asset Type: ${asset.assetType}`);
        cursorY -= 20;

        // Body
        drawText("To whom it may concern,");
        cursorY -= 10;
        drawText(`Please be advised that ${estate.deceasedFirstName} ${estate.deceasedLastName} passed away on ${new Date(estate.deceasedDateOfDeath).toLocaleDateString()}.`);
        drawText("I have been appointed as the Executor/Administrator of the estate.");
        cursorY -= 10;
        drawText("We are currently in the process of identifying and securing all estate assets.");
        drawText("Please place a 'Death Alert' or 'Estate Freeze' on the account referenced above");
        drawText("to prevent unauthorized transactions until formal distribution is authorized.");
        cursorY -= 10;
        drawText("Kindly provide a date-of-death balance statement and a list of any required");
        drawText("documentation needed for the eventual transfer of these funds.");
        cursorY -= 20;

        // Closing
        drawText("Sincerely,");
        cursorY -= 20;
        drawText(estate.user?.fullName || "The Executor");
        drawText("Executor / Administrator");

        return await doc.save();
    },

    async debugFields() {
        const templatePath = path.join(process.cwd(), 'server', 'templates', 'DE-111.pdf');
        if (!fs.existsSync(templatePath)) return [];
        const pdfBytes = fs.readFileSync(templatePath);
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const form = pdfDoc.getForm();
        return form.getFields().map(f => f.getName());
    }
};

function safeSetText(form: any, name: string, value: string | undefined) {
    try {
        const field = form.getTextField(name);
        if (value) field.setText(value);
    } catch (e) {
        // Field might not exist in template
    }
}

function safeSetCheckbox(form: any, name: string, checked: boolean) {
    try {
        const field = form.getCheckBox(name);
        if (checked) field.check();
        else field.uncheck();
    } catch (e) {
        // Field might not exist
    }
}
