import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

export const PdfService = {
    /**
     * Generates a filled DE-111 Petition for Probate
     */
    async generateDE111(estate: any) {
        // Load template
        const templatePath = path.join(process.cwd(), 'server', 'templates', 'DE-111.pdf');

        let pdfBytes: Buffer;

        if (!fs.existsSync(templatePath)) {
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
        } else {
            pdfBytes = fs.readFileSync(templatePath);
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
