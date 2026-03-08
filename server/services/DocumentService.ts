import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

import { prisma } from '../db.js';
import { FeeService } from './feeService.js';
import { PriorityService } from './priorityService.js';
import { logger } from '../lib/logger.js';

export interface OverlayCoordinate {
    x: number;
    y: number;
    size?: number;
    font?: string; // Standard font name
    page?: number;
}

export interface FormMapping {
    [key: string]: OverlayCoordinate;
}


async function loadTemplatePdfDocument(pdfBytes: Uint8Array | Buffer): Promise<PDFDocument> {
    try {
        return await PDFDocument.load(pdfBytes);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!/encrypted/i.test(message)) {
            throw error;
        }

        logger.warn("Encrypted PDF template detected. Retrying with ignoreEncryption=true.");
        return await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    }
}

async function createTemplateFallbackPdf(formName: string, estate: any, reason: string): Promise<Uint8Array> {
    const doc = await PDFDocument.create();
    const page = doc.addPage([612, 792]);
    const font = await doc.embedStandardFont(StandardFonts.Helvetica);
    const fontBold = await doc.embedStandardFont(StandardFonts.HelveticaBold);

    const decedentName = `${String(estate?.deceasedFirstName || "")} ${String(estate?.deceasedLastName || "")}`.trim() || "Unknown Decedent";
    const summaryReason = reason.length > 180 ? `${reason.slice(0, 177)}...` : reason;

    page.drawText(`${formName} TEMPORARY PLACEHOLDER`, { x: 50, y: 740, size: 16, font: fontBold });
    page.drawText("Official template could not be parsed in this environment.", { x: 50, y: 710, size: 11, font });
    page.drawText(`Estate: ${decedentName}`, { x: 50, y: 680, size: 11, font });
    page.drawText(`Generated: ${new Date().toLocaleDateString()}`, { x: 50, y: 660, size: 11, font });
    page.drawText("Reason:", { x: 50, y: 630, size: 11, font: fontBold });
    page.drawText(summaryReason, { x: 50, y: 612, size: 10, font, maxWidth: 510, lineHeight: 12 });
    page.drawText("Use this only as a non-filing placeholder while template integrity is remediated.", {
        x: 50,
        y: 560,
        size: 10,
        font,
        maxWidth: 510,
        lineHeight: 12,
    });

    return await doc.save();
}
export const DocumentService = {
    TEMPLATES_DIR: path.join(process.cwd(), 'server', 'templates'),

    async getTemplateBytes(templateName: string): Promise<Buffer | null> {
        const dbTemplate = await prisma.formTemplate.findUnique({
            where: { name: templateName }
        });

        if (dbTemplate) return Buffer.from(dbTemplate.data);

        const templatePath = path.join(this.TEMPLATES_DIR, templateName.endsWith('.pdf') ? templateName : `${templateName}.pdf`);
        if (fs.existsSync(templatePath)) return fs.readFileSync(templatePath);

        return null;
    },
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
                logger.warn("Template DE-111.pdf not found. Creating a blank form for testing purposes.");
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

        let pdfDoc: PDFDocument;
        let form: ReturnType<PDFDocument["getForm"]>;
        try {
            pdfDoc = await loadTemplatePdfDocument(pdfBytes);
            form = pdfDoc.getForm();
        } catch (error) {
            const reason = error instanceof Error ? error.message : String(error);
            logger.error({ err: reason }, "[DocumentService] Failed to parse DE-111 template. Returning placeholder PDF.");
            return await createTemplateFallbackPdf("DE-111", estate, reason);
        }

        // --- MAPPING LOGIC ---

        // 1. Petitioner (Header)
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

        // 6. Publication Info (NEW)
        if (estate.publicationNewspaper) {
            safeSetText(form, 'PublicationNewspaper', estate.publicationNewspaper);
        }

        // 7. Codicils (NEW)
        if (estate.hasCodicil) {
            safeSetCheckbox(form, 'HasCodicilBox', true);
            if (estate.codicilDate) {
                safeSetText(form, 'CodicilDate', new Date(estate.codicilDate).toLocaleDateString());
            }
        }

        // 8. Contact Info (NEW)
        safeSetText(form, 'PetitionerPhone', estate.petitionerPhone || "");
        safeSetText(form, 'PetitionerEmail', estate.petitionerEmail || "");

        // 9. Attorney Details (Enhanced)
        if (estate.attorneyName) {
            safeSetText(form, 'AttorneyName', estate.attorneyName);
            safeSetText(form, 'AttorneyFirm', estate.attorneyFirm || "");
            safeSetText(form, 'AttorneyAddress', estate.attorneyAddress || "");
            safeSetText(form, 'AttorneyPhone', estate.attorneyPhone || "");
            safeSetText(form, 'AttorneyBarNumber', estate.attorneyBarNumber || "");
        }

        // Return bytes
        try {
            return await pdfDoc.save();
        } catch (error) {
            const reason = error instanceof Error ? error.message : String(error);
            logger.error({ err: reason }, "[DocumentService] Failed to serialize DE-111. Returning placeholder PDF.");
            return await createTemplateFallbackPdf("DE-111", estate, reason);
        }
    },

    /**
     * Generates a filled DE-221 Spousal Property Petition
     */
    async generateDE221(estate: any) {
        let pdfBytes: Buffer;

        const dbTemplate = await prisma.formTemplate.findUnique({ where: { name: "DE-221" } });

        if (dbTemplate) {
            pdfBytes = dbTemplate.data as any;
        } else {
            const templatePath = path.join(process.cwd(), 'server', 'templates', 'DE-221.pdf');
            if (fs.existsSync(templatePath)) {
                pdfBytes = fs.readFileSync(templatePath);
            } else {
                logger.warn("Template DE-221.pdf not found. Creating a blank form for testing purposes.");
                const doc = await PDFDocument.create();
                const page = doc.addPage();
                const form = doc.getForm();
                form.createTextField('PetitionerName').setText('Petitioner Name');
                form.createTextField('DecedentName').setText('Decedent Name');
                page.drawText('DE-221 PLACESHOST (Real form not found)', { x: 50, y: 700 });
                pdfBytes = Buffer.from(await doc.save());
            }
        }

        let pdfDoc: PDFDocument;
        let form: ReturnType<PDFDocument["getForm"]>;
        try {
            pdfDoc = await loadTemplatePdfDocument(pdfBytes);
            form = pdfDoc.getForm();
        } catch (error) {
            const reason = error instanceof Error ? error.message : String(error);
            logger.error({ err: reason }, "[DocumentService] Failed to parse DE-221 template. Returning placeholder PDF.");
            return await createTemplateFallbackPdf("DE-221", estate, reason);
        }

        const petitionerName = estate.user?.fullName || "Petitioner";
        safeSetText(form, 'PetitionerName', petitionerName);
        safeSetText(form, 'PetitionerPhone', estate.petitionerPhone || "");
        safeSetText(form, 'PetitionerEmail', estate.petitionerEmail || "");

        if (!estate.petitionerIsAttorney) {
            safeSetText(form, 'AttorneyName', `${petitionerName} (In Pro Per)`);
        } else if (estate.attorneyName) {
            safeSetText(form, 'AttorneyName', estate.attorneyName);
            safeSetText(form, 'AttorneyFirm', estate.attorneyFirm || "");
            safeSetText(form, 'AttorneyBarNumber', estate.attorneyBarNumber || "");
        }

        const decedentName = `${estate.deceasedFirstName} ${estate.deceasedLastName}`;
        safeSetText(form, 'DecedentName', decedentName);
        if (estate.deceasedDateOfDeath) {
            safeSetText(form, 'DeathDate', new Date(estate.deceasedDateOfDeath).toLocaleDateString());
        }

        // California Specifics
        if (estate.probateCounty) {
            safeSetText(form, 'County', estate.probateCounty);
        }

        // Checkbox for spouse/partner
        safeSetCheckbox(form, 'SpouseBox', estate.isSpouse);

        return await pdfDoc.save();

    },

    /**
     * Generates a formal "Notification of Death" letter for a specific asset.
     */
    async generateLetter(asset: any, estate: any, overrides?: any) {
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

        const institution = String(overrides?.institution || asset.institution || 'Unknown Institution');
        const deceasedName = String(overrides?.deceasedName || `${estate.deceasedFirstName || ''} ${estate.deceasedLastName || ''}`);
        const accountNumber = String(overrides?.accountNumber || asset.accountNumber || "Unknown");
        const assetType = String(overrides?.assetType || asset.assetType || 'Asset');
        const dateOfDeath = String(overrides?.dateOfDeath || (estate.deceasedDateOfDeath ? new Date(estate.deceasedDateOfDeath).toLocaleDateString() : "[Date]"));

        // Header
        drawText("NOTIFICATION OF DEATH AND ESTATE OPENING", fontBoldSize);
        cursorY -= 15;

        // Date
        drawText(`Date: ${new Date().toLocaleDateString()}`);
        cursorY -= 10;

        // Institution Address
        drawText("TO:");
        drawText(institution);
        if (asset.institutionAddress && !overrides?.institution) {
            String(asset.institutionAddress).split(',').forEach((line: string) => drawText(line.trim()));
        }
        cursorY -= 15;

        // Subject
        drawText(`RE: Estate of ${deceasedName}`);
        drawText(`Account Number: ${accountNumber}`);
        drawText(`Asset Type: ${assetType}`);
        cursorY -= 20;

        // Body
        drawText("To whom it may concern,");
        cursorY -= 10;
        drawText(`Please be advised that ${deceasedName} passed away on ${dateOfDeath}.`);
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
        drawText(String(overrides?.senderName || estate.user?.fullName || "The Executor"));
        drawText("Executor / Administrator");

        return await doc.save();
    },

    async debugFields() {
        const templatePath = path.join(process.cwd(), 'server', 'templates', 'DE-111.pdf');
        if (!fs.existsSync(templatePath)) return [];
        const pdfBytes = fs.readFileSync(templatePath);
        const pdfDoc = await loadTemplatePdfDocument(pdfBytes);
        const form = pdfDoc.getForm();
        return form.getFields().map(f => f.getName());
    },

    /**
     * Generates DE-160 Inventory and Appraisal
     */
    async generateDE160(estate: any, assets: any[]) {
        const doc = await PDFDocument.create();
        const firstPage = doc.addPage();
        const { height } = firstPage.getSize();
        let y = height - 50;

        // Title
        firstPage.drawText('INVENTORY AND APPRAISAL (DE-160 Placeholder)', { x: 50, y, size: 18 });
        y -= 30;

        firstPage.drawText(`Estate of: ${String(estate.deceasedFirstName || '')} ${String(estate.deceasedLastName || '')}`, { x: 50, y, size: 12 });
        firstPage.drawText(`Case Number: ${String(estate.courtCaseNumber || 'N/A')}`, { x: 400, y, size: 12 });
        y -= 40;

        // Categorization
        const realAssets = assets.filter(a => a.inventoryCategory === 'ATTACHMENT_1');
        const personalAssets = assets.filter(a => a.inventoryCategory === 'ATTACHMENT_2');

        const totalReal = realAssets.reduce((sum, a) => sum + Number(a.inventoryValue || a.value || 0), 0);
        const totalPersonal = personalAssets.reduce((sum, a) => sum + Number(a.inventoryValue || a.value || 0), 0);
        const total = totalReal + totalPersonal;

        // Summary Table
        firstPage.drawText('SUMMARY', { x: 50, y, size: 14 });
        y -= 25;
        firstPage.drawText(`1. Real Property (Attachment 1):`, { x: 50, y });
        firstPage.drawText(`$${totalReal.toFixed(2)}`, { x: 400, y });
        y -= 20;
        firstPage.drawText(`2. Personal Property (Attachment 2):`, { x: 50, y });
        firstPage.drawText(`$${totalPersonal.toFixed(2)}`, { x: 400, y });
        y -= 20;
        firstPage.drawText(`TOTAL VALUE:`, { x: 50, y, size: 12 });
        firstPage.drawText(`$${total.toFixed(2)}`, { x: 400, y, size: 12 });
        y -= 40;

        // Listings
        const drawAssetRow = (a: any) => {
            const currentPage = doc.getPages()[doc.getPageCount() - 1];
            const desc = `${String(a.institution || 'Unknown')} - ${String(a.assetType || 'Asset')} ${a.inventoryNote ? `(${String(a.inventoryNote)})` : ''}`;
            const val = `$${Number(a.inventoryValue || a.value || 0).toFixed(2)}`;
            currentPage.drawText(desc, { x: 50, y, size: 10 });
            currentPage.drawText(val, { x: 450, y, size: 10 });
            y -= 15;
            if (y < 50) {
                doc.addPage();
                y = height - 50;
            }
        };

        if (realAssets.length > 0) {
            firstPage.drawText('Attachment 1: Real Property', { x: 50, y, size: 12 });
            y -= 20;
            realAssets.forEach(drawAssetRow);
            y -= 20;
        }

        if (personalAssets.length > 0) {
            const currentPage = doc.getPages()[doc.getPageCount() - 1];
            currentPage.drawText('Attachment 2: Personal Property', { x: 50, y, size: 12 });
            y -= 20;
            personalAssets.forEach(drawAssetRow);
        }

        return await doc.save();
    },

    /**
     * Generates DE-121 Notice of Petition to Administer Estate
     */
    async generateDE121(estate: any) {
        const doc = await PDFDocument.create();
        const page = doc.addPage();
        const { height } = page.getSize();
        let y = height - 50;

        // Header
        page.drawText('NOTICE OF PETITION TO ADMINISTER ESTATE (DE-121)', { x: 50, y, size: 16 });
        y -= 30;
        page.drawText(`Estate of: ${String(estate.deceasedFirstName || '')} ${String(estate.deceasedLastName || '')}`, { x: 50, y, size: 12 });
        page.drawText(`Case Number: ${String(estate.courtCaseNumber || 'Pending')}`, { x: 400, y, size: 12 });
        y -= 40;

        // 1. Notice Info
        page.drawText('To all heirs, beneficiaries, creditors, and contingent creditors:', { x: 50, y, size: 10 });
        y -= 20;
        page.drawText(`A Petition for Probate has been filed by: ${String(estate.user?.fullName || 'Petitioner')}`, { x: 50, y, size: 10 });
        y -= 20;
        page.drawText(`in the Superior Court of California, County of: ${String(estate.probateCounty || '[County]')}`, { x: 50, y, size: 10 });
        y -= 40;

        // 2. Hearing Info
        page.drawText('THE PETITION requests authority to administer the estate.', { x: 50, y, size: 10 });
        y -= 30;
        page.drawText('NOTICE OF HEARING:', { x: 50, y, size: 12 });
        y -= 20;

        if (estate.hearingDate) {
            const date = new Date(estate.hearingDate).toLocaleDateString();
            const time = String(estate.hearingTime || "TBD");
            const dept = String(estate.hearingDept || "TBD");
            page.drawText(`Date: ${date}   Time: ${time}   Dept: ${dept}`, { x: 70, y, size: 12 });
            y -= 20;
            page.drawText(`Address: ${String(estate.hearingAddress || 'See Court Website')}`, { x: 70, y, size: 10 });
        } else {
            page.drawText('[ ] Hearing date not yet set', { x: 70, y, size: 12 });
        }

        y -= 50;
        page.drawText('IF you object to the granting of the petition, you should appear at the hearing.', { x: 50, y, size: 10 });

        return await doc.save();
    },

    /**
     * Generates DE-120 Notice of Hearing (Probate)
     */
    async generateDE120(estate: any) {
        const doc = await PDFDocument.create();
        const page = doc.addPage();
        const { height } = page.getSize();
        let y = height - 50;

        page.drawText('NOTICE OF HEARING—GUARDIANSHIP OR CONSERVATORSHIP / PROBATE (DE-120)', { x: 50, y, size: 14 });
        y -= 30;
        page.drawText(`Estate of: ${String(estate.deceasedFirstName || '')} ${String(estate.deceasedLastName || '')}`, { x: 50, y, size: 12 });
        page.drawText(`Case Number: ${String(estate.courtCaseNumber || 'Pending')}`, { x: 400, y, size: 12 });
        y -= 40;

        page.drawText('1. NOTICE IS GIVEN that:', { x: 50, y, size: 12 });
        y -= 20;
        page.drawText(`   ${String(estate.user?.fullName || 'Petitioner')} has filed a Spousal Property Petition.`, { x: 50, y, size: 10 });
        y -= 40;

        page.drawText('2. A HEARING on the matter will be held as follows:', { x: 50, y, size: 12 });
        y -= 30;

        if (estate.hearingDate) {
            const date = new Date(estate.hearingDate).toLocaleDateString();
            const time = String(estate.hearingTime || "TBD");
            const dept = String(estate.hearingDept || "TBD");
            page.drawText(`Date: ${date}   Time: ${time}   Dept: ${dept}`, { x: 70, y, size: 12 });
            y -= 20;
            page.drawText(`Address: ${String(estate.hearingAddress || 'See Court Website')}`, { x: 70, y, size: 10 });
        } else {
            page.drawText('[ ] Hearing date not yet set', { x: 70, y, size: 12 });
        }

        return await doc.save();
    },

    /**
     * Generates DE-226 Spousal Property Order
     */
    async generateDE226(estate: any) {
        const doc = await PDFDocument.create();
        const page = doc.addPage();
        const { height } = page.getSize();
        let y = height - 50;

        page.drawText('SPOUSAL OR DOMESTIC PARTNER PROPERTY ORDER (DE-226)', { x: 50, y, size: 16 });
        y -= 30;
        page.drawText(`Estate of: ${String(estate.deceasedFirstName || '')} ${String(estate.deceasedLastName || '')}`, { x: 50, y, size: 12 });
        page.drawText(`Case Number: ${String(estate.courtCaseNumber || 'Varies')}`, { x: 400, y, size: 12 });
        y -= 40;

        page.drawText('1. THE COURT FINDS:', { x: 50, y, size: 12 });
        y -= 20;
        page.drawText('   a. All notices required by law have been given.', { x: 70, y, size: 10 });
        y -= 20;
        page.drawText(`   b. The decedent was a resident of California at the time of death.`, { x: 70, y, size: 10 });
        y -= 40;

        page.drawText('2. THE COURT ORDERS:', { x: 50, y, size: 12 });
        y -= 20;
        page.drawText(`   a. Property described in the petition belongs to the surviving spouse/partner.`, { x: 70, y, size: 10 });
        y -= 20;
        page.drawText(`   b. No probate administration is necessary for said property.`, { x: 70, y, size: 10 });

        return await doc.save();
    },

    /**
     * Generates DE-150 Letters
     */
    async generateDE150(estate: any) {
        const doc = await PDFDocument.create();
        const page = doc.addPage();
        const { height } = page.getSize();
        let y = height - 50;
        const fontBold = await doc.embedStandardFont(StandardFonts.HelveticaBold);
        const fontRegular = await doc.embedStandardFont(StandardFonts.Helvetica);

        // Header
        page.drawText('LETTERS (DE-150)', { x: 50, y, size: 20, font: fontBold });
        y -= 40;

        page.drawText('FOR COURT USE ONLY', { x: 380, y: height - 80, size: 9, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });

        page.drawText(`Estate of: ${String(estate.deceasedFirstName || '')} ${String(estate.deceasedLastName || '')}`, { x: 50, y, size: 12, font: fontRegular });
        page.drawText(`Case Number: ${String(estate.courtCaseNumber || 'Pending')}`, { x: 380, y, size: 12, font: fontRegular });
        y -= 40;

        // 1. Appointed As
        page.drawText('1. The Court Appoints:', { x: 50, y, size: 12, font: fontBold });
        y -= 25;
        page.drawText(`   [X] Executor: ${String(estate.user?.fullName || 'Petitioner')}`, { x: 50, y, size: 12, font: fontRegular });
        y -= 35;

        // 2. Authority
        page.drawText('2. The personal representative is authorized to administer the estate under:', { x: 50, y, size: 12, font: fontBold });
        y -= 25;
        page.drawText('   the Independent Administration of Estates Act.', { x: 50, y, size: 12, font: fontRegular });
        y -= 25;

        const isFull = estate.iaeaType === 'FULL';
        page.drawText(`   [${isFull ? 'X' : ' '}] with full authority`, { x: 70, y, size: 12, font: fontRegular });
        y -= 20;
        page.drawText(`   [${!isFull ? 'X' : ' '}] with limited authority (no power to sell real property)`, { x: 70, y, size: 12, font: fontRegular });
        y -= 40;

        // 3. Affirmation
        page.drawText('AFFIRMATION', { x: 50, y, size: 12, font: fontBold });
        y -= 25;
        page.drawText('I solemnly affirm that I will perform the duties of personal representative', { x: 50, y, size: 11, font: fontRegular });
        y -= 18;
        page.drawText('according to law.', { x: 50, y, size: 11, font: fontRegular });
        y -= 50;

        const appointedDate = estate.appointedDate ? new Date(estate.appointedDate).toLocaleDateString() : new Date().toLocaleDateString();
        page.drawText(`Executed on: ${appointedDate}`, { x: 50, y, size: 12, font: fontRegular });
        page.drawText(`at (City, State): ${String(estate.user?.state || 'California')}`, { x: 300, y, size: 12, font: fontRegular });

        return await doc.save();
    },

    /**
     * Generates DE-174 Allowance or Rejection of Creditor's Claim
     */
    async generateDE174(estate: any, liability: any) {
        const doc = await PDFDocument.create();
        const page = doc.addPage();
        const { height } = page.getSize();
        let y = height - 50;
        const fontBold = await doc.embedStandardFont(StandardFonts.HelveticaBold);

        // Header
        page.drawText('ALLOWANCE OR REJECTION OF CREDITOR\'S CLAIM (DE-174)', { x: 50, y, size: 14, font: fontBold });
        y -= 30;

        page.drawText(`Estate of: ${String(estate.deceasedFirstName || '')} ${String(estate.deceasedLastName || '')}`, { x: 50, y, size: 12 });
        page.drawText(`Case Number: ${String(estate.courtCaseNumber || 'Pending')}`, { x: 400, y, size: 12 });
        y -= 40;

        // Creditor Info
        page.drawText(`Creditor: ${String(liability.name || 'Unknown')}`, { x: 50, y, size: 12 });
        y -= 20;
        page.drawText(`Claim Amount: $${Number(liability.amount).toFixed(2)}`, { x: 50, y, size: 12 });
        if (liability.dateClaimFiled) {
            page.drawText(`Date Claim Filed: ${new Date(liability.dateClaimFiled).toLocaleDateString()}`, { x: 300, y, size: 12 });
        }
        y -= 40;

        // Action
        page.drawText('The personal representative takes the following action:', { x: 50, y, size: 12 });
        y -= 20;

        const isAllowed = liability.status === 'APPROVED' || liability.status === 'PAID';
        const isRejected = liability.status === 'REJECTED';

        if (isAllowed) {
            page.drawText('[X] ALLOWANCE', { x: 70, y, size: 12, font: fontBold });
            y -= 20;
            const allowedAmt = liability.allowedAmount || liability.amount;
            page.drawText(`    Allowed for: $${Number(allowedAmt).toFixed(2)}`, { x: 70, y });
        } else if (isRejected) {
            page.drawText('[X] REJECTION', { x: 70, y, size: 12, font: fontBold });
            y -= 20;
            page.drawText(`    The claim is rejected for: $${Number(liability.amount).toFixed(2)}`, { x: 70, y });
            y -= 20;
            if (liability.rejectionReason) {
                page.drawText(`    Reason: ${String(liability.rejectionReason)}`, { x: 70, y });
            }
        } else {
            page.drawText('[ ] Claim Not Yet Acted Upon', { x: 70, y });
        }
        y -= 40;

        // Signature
        page.drawText(`Date: ${new Date().toLocaleDateString()}`, { x: 50, y });
        y -= 30;
        page.drawText('___________________________________________________', { x: 50, y });
        y -= 15;
        page.drawText(`${String(estate.user?.fullName || 'Executor')}`, { x: 50, y });
        page.drawText('Personal Representative', { x: 50, y: y - 15 });

        return await doc.save();
    },

    /**
     * Generates DE-310 Petition to Determine Succession to Real Property
     */
    async generateDE310(estate: any, inventoryValue: number) {
        const doc = await PDFDocument.create();
        let page = doc.addPage();
        const { height } = page.getSize();
        let y = height - 50;
        const fontBold = await doc.embedStandardFont(StandardFonts.HelveticaBold);

        // Header
        page.drawText('PETITION TO DETERMINE SUCCESSION TO REAL PROPERTY (DE-310)', { x: 50, y, size: 14, font: fontBold });
        y -= 30;

        page.drawText(`Estate of: ${String(estate.deceasedFirstName || '')} ${String(estate.deceasedLastName || '')}`, { x: 50, y, size: 12 });
        page.drawText(`Case Number: ${String(estate.courtCaseNumber || 'Pending')}`, { x: 400, y, size: 12 });
        y -= 40;

        // 1. Character of Property
        page.drawText('1. Character of Property:', { x: 50, y, size: 12, font: fontBold });
        y -= 20;
        page.drawText(`   Total Inventory Value: $${inventoryValue.toLocaleString()}`, { x: 70, y });
        y -= 30;

        // 2. Statutory Fees
        const fee = FeeService.calculateStatutoryFee(inventoryValue);
        page.drawText('2. Statutory Fees (Probate Code § 10800):', { x: 50, y, size: 12, font: fontBold });
        y -= 20;
        page.drawText(`   Base Fee Calculation: $${fee.toLocaleString()}`, { x: 70, y });
        page.drawText(`   Executor Commission: $${fee.toLocaleString()}`, { x: 70, y: y - 15 });
        page.drawText(`   Attorney Fees: $${fee.toLocaleString()}`, { x: 70, y: y - 30 });
        y -= 60;

        // 3. Petitioner Information
        page.drawText('3. Petitioner Information:', { x: 50, y, size: 12, font: fontBold });
        y -= 20;
        page.drawText(`   Petitioner Name: ${String(estate.user?.fullName || '')}`, { x: 70, y });
        y -= 20;
        page.drawText('   The decedent died on ' + (estate.deceasedDateOfDeath ? new Date(estate.deceasedDateOfDeath).toLocaleDateString() : '[Date]'), { x: 70, y });
        y -= 30;

        // 4. Property Description
        page.drawText('4. Description of Property:', { x: 50, y, size: 12, font: fontBold });
        y -= 25;
        page.drawText('[Real Property Description Placeholder - DE-310 Requirement]', { x: 70, y, size: 10 });
        y -= 40;

        // Signature
        page.drawText(`Date: ${new Date().toLocaleDateString()}`, { x: 50, y });
        y -= 30;
        page.drawText('___________________________________________________', { x: 50, y });
        y -= 15;
        page.drawText(`${String(estate.user?.fullName || 'Petitioner')}`, { x: 50, y });

        return await doc.save();
    },

    /**
     * Generates DE-315 Order Determining Succession to Real Property
     */
    async generateDE315(estate: any) {
        const doc = await PDFDocument.create();
        let page = doc.addPage();
        const { height } = page.getSize();
        let y = height - 50;
        const fontBold = await doc.embedStandardFont(StandardFonts.HelveticaBold);

        // Header
        page.drawText('ORDER DETERMINING SUCCESSION TO REAL PROPERTY (DE-315)', { x: 50, y, size: 14, font: fontBold });
        y -= 30;

        page.drawText(`Estate of: ${String(estate.deceasedFirstName || '')} ${String(estate.deceasedLastName || '')}`, { x: 50, y, size: 12 });
        page.drawText(`Case Number: ${String(estate.courtCaseNumber || 'Pending')}`, { x: 400, y, size: 12 });
        y -= 40;

        // Findings
        page.drawText('THE COURT FINDS:', { x: 50, y, size: 12, font: fontBold });
        y -= 25;
        page.drawText('1. All notices required by law have been given.', { x: 70, y });
        y -= 20;
        page.drawText('2. The decedent died on ' + (estate.deceasedDateOfDeath ? new Date(estate.deceasedDateOfDeath).toLocaleDateString() : '[Date]'), { x: 70, y });
        y -= 20;
        page.drawText('   and was a resident of the county named above.', { x: 70, y });
        y -= 40;

        // Orders
        page.drawText('THE COURT ORDERS:', { x: 50, y, size: 12, font: fontBold });
        y -= 25;
        page.drawText('1. No administration of the decedent\'s estate is necessary.', { x: 70, y });
        y -= 20;
        page.drawText('2. The following property is property of the estate passing to', { x: 70, y });
        y -= 15;
        page.drawText('   the named beneficiaries/heirs:', { x: 70, y });
        y -= 30;

        page.drawText('[Real Property Description Placeholder]', { x: 90, y, size: 10 });
        y -= 50;

        // Judge Signature area
        page.drawText('Date: ________________________', { x: 50, y });
        y -= 30;
        page.drawText('___________________________________________________', { x: 300, y });
        y -= 15;
        page.drawText('JUDGE OF THE SUPERIOR COURT', { x: 350, y, size: 8 });

        return await doc.save();
    },

    async generateDE350(estate: any) {
        const doc = await PDFDocument.create();
        let page = doc.addPage();
        const { height } = page.getSize();
        let y = height - 50;
        const fontBold = await doc.embedStandardFont(StandardFonts.HelveticaBold);

        page.drawText('PETITION FOR APPOINTMENT OF GUARDIAN AD LITEM (DE-350)', { x: 50, y, size: 14, font: fontBold });
        y -= 30;

        page.drawText(`Estate of: ${String(estate.deceasedFirstName || '')} ${String(estate.deceasedLastName || '')}`, { x: 50, y, size: 12 });
        page.drawText(`Case Number: ${String(estate.courtCaseNumber || 'Pending')}`, { x: 400, y, size: 12 });
        y -= 40;

        page.drawText('1. Petitioner requests that a guardian ad litem be appointed for:', { x: 50, y, size: 12, font: fontBold });
        y -= 25;
        page.drawText('[Minor Beneficiary Name Placeholder]', { x: 70, y });
        y -= 30;

        page.drawText('2. Reason for appointment:', { x: 50, y, size: 12, font: fontBold });
        y -= 20;
        page.drawText('   The person named above is a minor beneficiary of the estate and', { x: 70, y });
        y -= 15;
        page.drawText('   requires representation in these proceedings.', { x: 70, y });
        y -= 40;

        // Signature
        page.drawText(`Date: ${new Date().toLocaleDateString()}`, { x: 50, y });
        y -= 30;
        page.drawText('___________________________________________________', { x: 50, y });
        y -= 15;
        page.drawText(`${String(estate.user?.fullName || 'Petitioner')}`, { x: 50, y });

        return await doc.save();
    },

    async generateDE351(estate: any) {
        const doc = await PDFDocument.create();
        let page = doc.addPage();
        const { height } = page.getSize();
        let y = height - 50;
        const fontBold = await doc.embedStandardFont(StandardFonts.HelveticaBold);

        page.drawText('ORDER APPOINTING GUARDIAN AD LITEM (DE-351)', { x: 50, y, size: 14, font: fontBold });
        y -= 30;

        page.drawText(`Estate of: ${String(estate.deceasedFirstName || '')} ${String(estate.deceasedLastName || '')}`, { x: 50, y, size: 12 });
        page.drawText(`Case Number: ${String(estate.courtCaseNumber || 'Pending')}`, { x: 400, y, size: 12 });
        y -= 40;

        page.drawText('THE COURT FINDS:', { x: 50, y, size: 12, font: fontBold });
        y -= 25;
        page.drawText('1. [Guardian Name Placeholder] is appointed guardian ad litem for:', { x: 70, y });
        y -= 20;
        page.drawText('   [Minor Beneficiary Name Placeholder]', { x: 70, y });
        y -= 30;

        page.drawText('2. The guardian ad litem is authorized to represent the interests', { x: 70, y });
        y -= 15;
        page.drawText('   of the minor in this proceeding.', { x: 70, y });
        y -= 50;

        // Judge Signature area
        page.drawText('Date: ________________________', { x: 50, y });
        y -= 30;
        page.drawText('___________________________________________________', { x: 300, y });
        y -= 15;
        page.drawText('JUDGE OF THE SUPERIOR COURT', { x: 350, y, size: 8 });

        return await doc.save();
    },

    async generateDE142(estate: any) {
        const decedentName = `${String(estate.deceasedFirstName || '')} ${String(estate.deceasedLastName || '')}`.trim();
        const caseNumber = String(estate.courtCaseNumber || 'Pending');
        const signerName = String(estate.user?.fullName || '[Name of Heir or Beneficiary]');

        const overlayData = {
            partyName: signerName,
            partyAddress: String(estate.user?.address || ''),
            partyPhone: String(estate.petitionerPhone || estate.user?.phone || ''),
            estateOf: decedentName.toUpperCase(),
            caseNumber,
            waiverDate: new Date().toLocaleDateString(),
            heirName: signerName,
        };

        const mapping: FormMapping = {
            partyName: { x: 50, y: 715, size: 9 },
            partyAddress: { x: 50, y: 702, size: 9 },
            partyPhone: { x: 50, y: 689, size: 9 },
            estateOf: { x: 160, y: 575, size: 12, font: 'HelveticaBold' },
            caseNumber: { x: 420, y: 540, size: 11 },
            waiverDate: { x: 92, y: 231, size: 10 },
            heirName: { x: 92, y: 145, size: 10 },
        };

        try {
            return await this.generateOverlayPdf('DE-142', overlayData, mapping);
        } catch (error: any) {
            logger.warn(`[DocumentService] Template overlay failed for DE-142, using fallback draft: ${error?.message || error}`);

            const doc = await PDFDocument.create();
            const page = doc.addPage([612, 792]);
            const fontBold = await doc.embedStandardFont(StandardFonts.HelveticaBold);
            const fontRegular = await doc.embedStandardFont(StandardFonts.Helvetica);

            const draw = (text: string, x: number, y: number, size = 10, bold = false) => {
                page.drawText(text, {
                    x,
                    y,
                    size,
                    font: bold ? fontBold : fontRegular,
                    color: rgb(0, 0, 0),
                });
            };

            draw('ATTORNEY OR PARTY WITHOUT ATTORNEY (Name, Address and Telephone):', 40, 748, 7);
            draw(signerName, 40, 734, 9, true);
            draw(String(estate.user?.address || ''), 40, 721, 9);
            draw(`Telephone: ${String(estate.petitionerPhone || estate.user?.phone || '')}`, 40, 708, 9);
            draw('SUPERIOR COURT OF CALIFORNIA, COUNTY OF', 40, 690, 8);

            draw('ESTATE OF:', 40, 650, 9, true);
            draw(decedentName || '______________________________', 112, 650, 11, true);
            draw('CASE NUMBER:', 360, 650, 9, true);
            draw(caseNumber, 448, 650, 10);
            page.drawLine({ start: { x: 40, y: 642 }, end: { x: 570, y: 642 }, thickness: 0.75, color: rgb(0, 0, 0) });

            draw('WAIVER OF BOND BY HEIR OR BENEFICIARY (DE-142)', 132, 610, 12, true);
            draw('I declare:', 40, 575, 10, true);
            draw('1. I am an heir or beneficiary of the estate of the decedent named above.', 52, 553, 10);
            draw('2. I understand that the court would otherwise require the personal representative', 52, 534, 10);
            draw('   to post a bond for my protection.', 52, 518, 10);
            draw('3. I freely and voluntarily waive the requirement of a bond.', 52, 496, 10, true);

            draw(`Date: ${new Date().toLocaleDateString()}`, 52, 430, 10);
            page.drawLine({ start: { x: 52, y: 395 }, end: { x: 360, y: 395 }, thickness: 1, color: rgb(0, 0, 0) });
            draw('Signature of Heir or Beneficiary', 52, 379, 9);
            draw(signerName, 52, 358, 10);

            return await doc.save();
        }
    },
    async generateDE143(estate: any) {
        const decedentName = `${String(estate.deceasedFirstName || '')} ${String(estate.deceasedLastName || '')}`.trim();
        const caseNumber = String(estate.courtCaseNumber || 'Pending');

        const overlayData = {
            partyName: String(estate.user?.fullName || ''),
            partyAddress: String(estate.user?.address || ''),
            partyPhone: String(estate.petitionerPhone || estate.user?.phone || ''),
            estateOf: decedentName.toUpperCase(),
            caseNumber,
            orderDate: new Date().toLocaleDateString(),
        };

        const mapping: FormMapping = {
            partyName: { x: 50, y: 715, size: 9 },
            partyAddress: { x: 50, y: 702, size: 9 },
            partyPhone: { x: 50, y: 689, size: 9 },
            estateOf: { x: 160, y: 575, size: 12, font: 'HelveticaBold' },
            caseNumber: { x: 420, y: 540, size: 11 },
            orderDate: { x: 96, y: 108, size: 10 },
        };

        try {
            return await this.generateOverlayPdf('DE-143', overlayData, mapping);
        } catch (error: any) {
            logger.warn(`[DocumentService] Template overlay failed for DE-143, using fallback draft: ${error?.message || error}`);

            const doc = await PDFDocument.create();
            const page = doc.addPage([612, 792]);
            const fontBold = await doc.embedStandardFont(StandardFonts.HelveticaBold);
            const fontRegular = await doc.embedStandardFont(StandardFonts.Helvetica);

            const draw = (text: string, x: number, y: number, size = 10, bold = false) => {
                page.drawText(text, {
                    x,
                    y,
                    size,
                    font: bold ? fontBold : fontRegular,
                    color: rgb(0, 0, 0),
                });
            };

            draw('SUPERIOR COURT OF CALIFORNIA, COUNTY OF', 40, 730, 8);
            draw('ESTATE OF:', 40, 694, 9, true);
            draw(decedentName || '______________________________', 112, 694, 11, true);
            draw('CASE NUMBER:', 360, 694, 9, true);
            draw(caseNumber, 448, 694, 10);
            page.drawLine({ start: { x: 40, y: 686 }, end: { x: 570, y: 686 }, thickness: 0.75, color: rgb(0, 0, 0) });

            draw('ORDER WAIVING BOND (DE-143)', 202, 650, 12, true);
            draw('THE COURT FINDS:', 40, 616, 10, true);
            draw('1. All heirs and beneficiaries have signed waivers of bond (DE-142).', 52, 595, 10);
            draw('2. The estate is solvent and no creditor will be harmed by waiving bond.', 52, 576, 10);

            draw('THE COURT ORDERS:', 40, 535, 10, true);
            draw('1. The requirement of a bond is waived for the personal representative.', 52, 514, 10);
            draw('2. Letters shall issue without bond.', 52, 495, 10);

            draw(`Date: ${new Date().toLocaleDateString()}`, 72, 350, 10);
            page.drawLine({ start: { x: 340, y: 318 }, end: { x: 555, y: 318 }, thickness: 1, color: rgb(0, 0, 0) });
            draw('JUDGE OF THE SUPERIOR COURT', 376, 302, 8);

            return await doc.save();
        }
    },
    /**
     * Generates a professional chronological Settlement Trail PDF with multi-page support.
     */
    async generateActivityLogPdf(estate: any, activities: any[], userName: string, options?: { pendingTasks?: any[], negativeFindings?: any[], verification?: { valid: boolean, count?: number, error?: string } }) {
        const doc = await PDFDocument.create();
        const fontBold = await doc.embedStandardFont(StandardFonts.HelveticaBold);
        const fontRegular = await doc.embedStandardFont(StandardFonts.Helvetica);
        const fontItalic = await doc.embedStandardFont(StandardFonts.HelveticaOblique);
        const fontMono = await doc.embedStandardFont(StandardFonts.Courier);

        const margin = 50;
        const pageWidth = 612; // US Letter
        const pageHeight = 792;
        let page = doc.addPage([pageWidth, pageHeight]);
        let cursorY = pageHeight - margin;

        const addNewPage = () => {
            page = doc.addPage([pageWidth, pageHeight]);
            cursorY = pageHeight - margin;
            page.drawText(`(Continued - Page ${doc.getPageCount()})`, { x: margin, y: cursorY, size: 8, font: fontRegular });
            cursorY -= 15;
        };

        const drawTextRow = (text: string, size = 11, font = fontRegular, xOffset = 0, color = rgb(0, 0, 0)) => {
            if (cursorY < margin + 20) {
                addNewPage();
            }
            page.drawText(text, { x: margin + xOffset, y: cursorY, size, font, color });
            cursorY -= (size + 5);
        };

        const drawDash = (thickness = 1, color = rgb(0.8, 0.8, 0.8)) => {
            page.drawLine({
                start: { x: margin, y: cursorY + 5 },
                end: { x: pageWidth - margin, y: cursorY + 5 },
                thickness,
                color
            });
            cursorY -= 10;
        };

        // --- Header Section ---
        drawTextRow("SETTLEMENT TRAIL: OFFICIAL FIDUCIARY RECORD", 16, fontBold);
        cursorY -= 5;
        drawTextRow(`ESTATE: ${String(estate.deceasedFirstName || 'Unknown')} ${String(estate.deceasedLastName || 'Estate').toUpperCase()}`, 12, fontBold);
        drawTextRow(`EXECUTOR: ${userName || 'Authorized Representative'}`);
        drawTextRow(`JURISDICTION: ${estate.deceasedState || 'N/A'}`);
        drawTextRow(`SYSTEM OF RECORD: ExpectedEstate`);
        drawTextRow(`EXPORTED ON: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`);
        cursorY -= 15;

        // --- Verification Seal (SEC-003) ---
        if (options?.verification) {
            cursorY -= 10;
            if (options.verification.valid) {
                page.drawRectangle({
                    x: pageWidth - margin - 180,
                    y: pageHeight - margin - 40,
                    width: 180,
                    height: 30,
                    color: rgb(0.9, 1, 0.9),
                    borderColor: rgb(0, 0.5, 0),
                    borderWidth: 1
                });
                page.drawText("CRYPTOGRAPHICALLY VERIFIED", {
                    x: pageWidth - margin - 170,
                    y: pageHeight - margin - 28,
                    size: 10,
                    font: fontBold,
                    color: rgb(0, 0.5, 0)
                });
                page.drawText(`Checked ${options.verification.count} records`, {
                    x: pageWidth - margin - 170,
                    y: pageHeight - margin - 38,
                    size: 8,
                    font: fontRegular,
                    color: rgb(0, 0.3, 0)
                });
            } else {
                page.drawRectangle({
                    x: pageWidth - margin - 180,
                    y: pageHeight - margin - 40,
                    width: 180,
                    height: 40,
                    color: rgb(1, 0.9, 0.9),
                    borderColor: rgb(0.8, 0, 0),
                    borderWidth: 2
                });
                page.drawText("INTEGRITY CHECK FAILED", {
                    x: pageWidth - margin - 170,
                    y: pageHeight - margin - 25,
                    size: 10,
                    font: fontBold,
                    color: rgb(0.8, 0, 0)
                });
                page.drawText("CHAIN BROKEN / TAMPERED", {
                    x: pageWidth - margin - 170,
                    y: pageHeight - margin - 35,
                    size: 8,
                    font: fontBold,
                    color: rgb(0.8, 0, 0)
                });
            }
        }

        // --- Summary Section ---
        drawTextRow("RECORD SUMMARY", 12, fontBold);
        drawDash(1.5, rgb(0.4, 0.4, 0.4));
        const completedCount = activities.filter(a => a.action === 'COMPLETED' || a.action === 'PHASE_COMPLETED').length;
        drawTextRow(`Total Verified Actions: ${activities.length}`, 10);
        drawTextRow(`Milestones Reached: ${completedCount}`, 10);
        drawTextRow(`Estate Status: ${estate.probateStatus?.replace(/_/g, ' ') || 'In Progress'}`, 10);
        cursorY -= 15;

        // --- FIDUCIARY GAP ANALYSIS ---
        if (options?.pendingTasks?.length || options?.negativeFindings?.length) {
            drawTextRow("FIDUCIARY GAP ANALYSIS (STATUS OF DILIGENCE)", 12, fontBold);
            drawDash(1, rgb(0, 0.3, 0.6));

            if (options.pendingTasks?.length) {
                drawTextRow("PENDING MILESTONES (Current Phase)", 10, fontBold, 5);
                options.pendingTasks.forEach(task => {
                    drawTextRow(`[ ] ${task.title || task.id}`, 9, fontRegular, 15);
                });
                cursorY -= 10;
            }

            if (options.negativeFindings?.length) {
                drawTextRow("NEGATIVE ASSURANCE (Explicitly Reviewed & Absent)", 10, fontBold, 5);
                options.negativeFindings.forEach(cat => {
                    drawTextRow(`${cat.category.replace(/_/g, ' ')}: ABSENT`, 9, fontBold, 15);
                    cat.negativeFindings?.forEach((f: any) => {
                        drawTextRow(`- Diligence Note: "${f.statement}"`, 8, fontItalic, 25);
                    });
                });
                cursorY -= 10;
            }
            cursorY -= 10;
        }

        // --- Activity Log ---
        drawTextRow("CHRONOLOGICAL LOG OF ACTIONS", 12, fontBold);
        drawDash(1, rgb(0.6, 0.6, 0.6));
        cursorY -= 5;

        const sorted = [...activities].sort((a, b) =>
            new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
        );

        sorted.forEach((log) => {
            const dateStr = new Date(log.occurredAt).toLocaleDateString();
            const timeStr = new Date(log.occurredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const phaseStr = log.phase ? `${log.phase.replace(/_/g, ' ')}` : 'GENERAL';
            drawTextRow(`${dateStr} ${timeStr} | ${phaseStr}`, 9, fontBold);
            drawTextRow(log.notes || log.action, 10, fontRegular, 10);
            if (log.hash) {
                drawTextRow(`SHA: ${log.hash.substring(0, 32)}...`, 7, fontMono, 10, rgb(0.4, 0.4, 0.4));
            }
            cursorY -= 8;
        });

        if (cursorY < 180) addNewPage();
        cursorY -= 20;

        drawDash(1, rgb(0, 0, 0));
        drawTextRow("DECLARATION & AFFIRMATION", 12, fontBold);
        cursorY -= 5;

        const affirmationLines = [
            "I, the undersigned Fiduciary, hereby declare under penalty of perjury under the laws of the State of",
            `${estate.deceasedState || 'residence'} that I have reviewed the foregoing Settlement Trail and that it constitutes a true,`,
            "complete, and accurate record of the actions performed in the administration of this estate to the",
            "best of my knowledge and belief."
        ];
        affirmationLines.forEach(line => drawTextRow(line, 9));

        cursorY -= 30;
        page.drawLine({ start: { x: margin, y: cursorY }, end: { x: margin + 250, y: cursorY }, thickness: 1 });
        page.drawLine({ start: { x: pageWidth - margin - 150, y: cursorY }, end: { x: pageWidth - margin, y: cursorY }, thickness: 1 });

        cursorY -= 12;
        page.drawText("Signature of Executor / Administrator", { x: margin, y: cursorY, size: 8, font: fontRegular });
        page.drawText("Date Signed", { x: pageWidth - margin - 150, y: cursorY, size: 8, font: fontRegular });

        const pages = doc.getPages();
        pages.forEach((p, i) => {
            p.drawText(`Page ${i + 1} of ${pages.length} - ExpectedEstate Fiduciary Record`, {
                x: margin,
                y: 30,
                size: 8,
                font: fontRegular,
                color: rgb(0.5, 0.5, 0.5)
            });
        });

        return await doc.save();
    },

    async generateDE154(estate: any) {
        const doc = await PDFDocument.create();
        let page = doc.addPage();
        const { height } = page.getSize();
        let y = height - 50;
        const fontBold = await doc.embedStandardFont(StandardFonts.HelveticaBold);

        page.drawText('REQUEST FOR SPECIAL NOTICE (DE-154)', { x: 50, y, size: 14, font: fontBold });
        y -= 30;

        page.drawText(`Estate of: ${String(estate.deceasedFirstName || '')} ${String(estate.deceasedLastName || '')}`, { x: 50, y, size: 12 });
        page.drawText(`Case Number: ${String(estate.courtCaseNumber || 'Pending')}`, { x: 400, y, size: 12 });
        y -= 40;

        page.drawText('1. I am a person interested in this estate.', { x: 50, y, size: 11 });
        y -= 20;
        page.drawText('2. I request special notice of the following matters:', { x: 50, y, size: 11 });
        y -= 15;
        page.drawText('   (Check all that apply)', { x: 70, y, size: 9, font: fontBold });
        y -= 25;

        page.drawText('[ ] All matters for which special notice may be requested', { x: 70, y, size: 10 });
        y -= 20;
        page.drawText('[ ] Inventory and Appraisal', { x: 70, y, size: 10 });
        y -= 20;
        page.drawText('[ ] Petitions for Distribution', { x: 70, y, size: 10 });
        y -= 20;
        page.drawText('[ ] Reports of Administration and Accountings', { x: 70, y, size: 10 });
        y -= 40;

        page.drawText('3. Notice should be sent to:', { x: 50, y, size: 11, font: fontBold });
        y -= 25;
        page.drawText(`Name: ${String(estate.user?.fullName || '[Requestor Name]')}`, { x: 70, y });
        y -= 20;
        page.drawText(`Address: [Mailing Address Placeholder]`, { x: 70, y });
        y -= 50;

        // Signature
        page.drawText(`Date: ${new Date().toLocaleDateString()}`, { x: 50, y });
        y -= 30;
        page.drawText('___________________________________________________', { x: 50, y });
        y -= 15;
        page.drawText('Signature of Requestor or Attorney', { x: 50, y, size: 10 });

        return await doc.save();
    },

    async generateDE115(estate: any) {
        const doc = await PDFDocument.create();
        let page = doc.addPage();
        const { height } = page.getSize();
        let y = height - 50;
        const fontBold = await doc.embedStandardFont(StandardFonts.HelveticaBold);

        page.drawText('OBJECTION TO PROBATE OF WILL (DE-115)', { x: 50, y, size: 14, font: fontBold });
        y -= 30;

        page.drawText(`Estate of: ${String(estate.deceasedFirstName || '')} ${String(estate.deceasedLastName || '')}`, { x: 50, y, size: 12 });
        page.drawText(`Case Number: ${String(estate.courtCaseNumber || 'Pending')}`, { x: 400, y, size: 12 });
        y -= 40;

        page.drawText('1. I object to the petition for probate of the will dated:', { x: 50, y, size: 11 });
        y -= 25;
        page.drawText('2. Grounds for objection (check all that apply):', { x: 50, y, size: 11, font: fontBold });
        y -= 20;
        page.drawText('[ ] Lack of testamentary capacity', { x: 70, y, size: 10 });
        y -= 15;
        page.drawText('[ ] Undue influence', { x: 70, y, size: 10 });
        y -= 15;
        page.drawText('[ ] Fraud', { x: 70, y, size: 10 });
        y -= 15;
        page.drawText('[ ] Improper execution', { x: 70, y, size: 10 });
        y -= 15;
        page.drawText('[ ] Revocation', { x: 70, y, size: 10 });
        y -= 40;

        page.drawText('3. Supporting Facts:', { x: 50, y, size: 11, font: fontBold });
        y -= 20;
        page.drawText('___________________________________________________', { x: 50, y });
        y -= 15;
        page.drawText('___________________________________________________', { x: 50, y });
        y -= 15;
        page.drawText('___________________________________________________', { x: 50, y });
        y -= 40;

        // Signature
        page.drawText(`Date: ${new Date().toLocaleDateString()}`, { x: 50, y });
        y -= 30;
        page.drawText('___________________________________________________', { x: 50, y });
        y -= 15;
        page.drawText('Signature of Objector or Attorney', { x: 50, y, size: 10 });

        return await doc.save();
    },

    async generateDE116(estate: any) {
        const doc = await PDFDocument.create();
        let page = doc.addPage();
        const { height } = page.getSize();
        let y = height - 50;
        const fontBold = await doc.embedStandardFont(StandardFonts.HelveticaBold);

        page.drawText('ANSWER TO OBJECTION TO PROBATE OF WILL (DE-116)', { x: 50, y, size: 14, font: fontBold });
        y -= 30;

        page.drawText(`Estate of: ${String(estate.deceasedFirstName || '')} ${String(estate.deceasedLastName || '')}`, { x: 50, y, size: 12 });
        page.drawText(`Case Number: ${String(estate.courtCaseNumber || 'Pending')}`, { x: 400, y, size: 12 });
        y -= 40;

        page.drawText('1. I am the petitioner for probate of the will.', { x: 50, y, size: 11 });
        y -= 25;
        page.drawText('2. I deny the allegations in the Objection to Probate of Will.', { x: 50, y, size: 11 });
        y -= 25;
        page.drawText('3. Affirmative Defenses/Support for Validity:', { x: 50, y, size: 11, font: fontBold });
        y -= 20;
        page.drawText('___________________________________________________', { x: 50, y });
        y -= 15;
        page.drawText('___________________________________________________', { x: 50, y });
        y -= 40;

        // Signature
        page.drawText(`Date: ${new Date().toLocaleDateString()}`, { x: 50, y });
        y -= 30;
        page.drawText('___________________________________________________', { x: 50, y });
        y -= 15;
        page.drawText('Signature of Petitioner or Attorney', { x: 50, y, size: 10 });

        return await doc.save();
    },

    async generateDE295(estate: any) {
        const doc = await PDFDocument.create();
        let page = doc.addPage();
        const { height } = page.getSize();
        let y = height - 50;
        const fontBold = await doc.embedStandardFont(StandardFonts.HelveticaBold);

        page.drawText('EX PARTE PETITION FOR FINAL DISCHARGE AND ORDER (DE-295)', { x: 50, y, size: 14, font: fontBold });
        y -= 30;

        page.drawText(`Estate of: ${String(estate.deceasedFirstName || '')} ${String(estate.deceasedLastName || '')}`, { x: 50, y, size: 12 });
        page.drawText(`Case Number: ${String(estate.courtCaseNumber || 'Pending')}`, { x: 400, y, size: 12 });
        y -= 40;

        page.drawText('1. I am the personal representative of the estate.', { x: 50, y, size: 11 });
        y -= 25;
        page.drawText('2. All acts required of me as personal representative have been performed.', { x: 50, y, size: 11 });
        y -= 25;
        page.drawText('3. All assets of the estate have been distributed to the persons entitled to them.', { x: 50, y, size: 11 });
        y -= 25;
        page.drawText('4. Receipts for distribution are filed with this petition.', { x: 50, y, size: 11 });
        y -= 40;

        page.drawText('I declare under penalty of perjury that the foregoing is true.', { x: 50, y, size: 10 });
        y -= 40;

        // Signature
        page.drawText(`Date: ${new Date().toLocaleDateString()}`, { x: 50, y });
        y -= 30;
        page.drawText('___________________________________________________', { x: 50, y });
        y -= 15;
        page.drawText('Signature of Personal Representative', { x: 50, y, size: 10 });
        y -= 50;

        page.drawText('ORDER FOR FINAL DISCHARGE', { x: 50, y, size: 12, font: fontBold });
        y -= 25;
        page.drawText('THE COURT ORDERS the personal representative is discharged and released.', { x: 50, y, size: 11 });
        y -= 40;

        // Judge Signature area
        page.drawText('Date: ________________________', { x: 50, y });
        y -= 30;
        page.drawText('___________________________________________________', { x: 300, y });
        y -= 15;
        page.drawText('JUDGE OF THE SUPERIOR COURT', { x: 350, y, size: 8 });

        return await doc.save();
    },

    async generateReceiptOfDistribution(estate: any, beneficiaryName: string = "[Beneficiary Name]") {
        const doc = await PDFDocument.create();
        let page = doc.addPage();
        const { height } = page.getSize();
        let y = height - 50;
        const fontBold = await doc.embedStandardFont(StandardFonts.HelveticaBold);

        page.drawText('RECEIPT OF DISTRIBUTION', { x: 50, y, size: 16, font: fontBold });
        y -= 40;

        page.drawText(`Estate of: ${String(estate.deceasedFirstName || '')} ${String(estate.deceasedLastName || '')}`, { x: 50, y, size: 12 });
        page.drawText(`Case Number: ${String(estate.courtCaseNumber || 'Pending')}`, { x: 400, y, size: 12 });
        y -= 50;

        page.drawText(`I, ${beneficiaryName}, hereby acknowledge receipt from the personal representative`, { x: 50, y, size: 11 });
        y -= 15;
        page.drawText('of the following sum or property as full or partial distribution of my share of the estate:', { x: 50, y, size: 11 });
        y -= 30;

        page.drawText('DESCRIPTION OF PROPERTY:', { x: 50, y, size: 11, font: fontBold });
        y -= 25;
        page.drawText('____________________________________________________________________', { x: 50, y });
        y -= 25;
        page.drawText('____________________________________________________________________', { x: 50, y });
        y -= 50;

        // Signature
        page.drawText(`Date: ________________________`, { x: 50, y });
        y -= 30;
        page.drawText('___________________________________________________', { x: 50, y });
        y -= 15;
        page.drawText(`Signature of ${beneficiaryName}`, { x: 50, y, size: 10 });

        return await doc.save();
    },

    async generateDE165(estate: any) {
        const doc = await PDFDocument.create();
        let page = doc.addPage();
        const { height } = page.getSize();
        let y = height - 50;
        const fontBold = await doc.embedStandardFont(StandardFonts.HelveticaBold);

        page.drawText('NOTICE OF PROPOSED ACTION (DE-165)', { x: 50, y, size: 14, font: fontBold });
        y -= 30;

        page.drawText(`Estate of: ${String(estate.deceasedFirstName || '')} ${String(estate.deceasedLastName || '')}`, { x: 50, y, size: 12 });
        page.drawText(`Case Number: ${String(estate.courtCaseNumber || 'Pending')}`, { x: 400, y, size: 12 });
        y -= 40;

        page.drawText('1. The personal representative of the estate of the decedent is:', { x: 50, y, size: 11 });
        y -= 20;
        page.drawText(`${String(estate.user?.fullName || '[Personal Representative Name]')}`, { x: 70, y, size: 11, font: fontBold });
        y -= 30;

        page.drawText('2. The personal representative has authority to administer the estate without', { x: 50, y, size: 11 });
        y -= 15;
        page.drawText('   court supervision under the Independent Administration of Estates Act.', { x: 50, y, size: 11 });
        y -= 30;

        page.drawText('3. ON OR AFTER [Date of Proposed Action], THE PERSONAL REPRESENTATIVE', { x: 50, y, size: 11, font: fontBold });
        y -= 15;
        page.drawText('   WILL TAKE THE FOLLOWING ACTION:', { x: 50, y, size: 11, font: fontBold });
        y -= 25;
        page.drawText('   [ ] Sale of Real Property', { x: 70, y, size: 11 });
        y -= 20;
        page.drawText('   [ ] Other (specify): ________________________________________', { x: 70, y, size: 11 });
        y -= 40;

        page.drawText('4. IF YOU OBJECT TO THE PROPOSED ACTION:', { x: 50, y, size: 11, font: fontBold });
        y -= 20;
        page.drawText('   a. Sign the enclosed objection form and deliver it to the representative.', { x: 70, y, size: 10 });
        y -= 15;
        page.drawText('   b. OR send a written objection to the court and the representative.', { x: 70, y, size: 10 });
        y -= 40;

        // Signature
        page.drawText(`Date: ${new Date().toLocaleDateString()}`, { x: 50, y });
        y -= 30;
        page.drawText('___________________________________________________', { x: 50, y });
        y -= 15;
        page.drawText('Signature of Personal Representative', { x: 50, y, size: 10 });

        return await doc.save();
    },

    async generateDE260(estate: any) {
        const doc = await PDFDocument.create();
        let page = doc.addPage();
        const { height } = page.getSize();
        let y = height - 50;
        const fontBold = await doc.embedStandardFont(StandardFonts.HelveticaBold);

        page.drawText('REPORT OF SALE AND PETITION FOR ORDER (DE-260)', { x: 50, y, size: 14, font: fontBold });
        y -= 15;
        page.drawText('CONFIRMING SALE OF REAL PROPERTY', { x: 50, y, size: 14, font: fontBold });
        y -= 30;

        page.drawText(`Estate of: ${String(estate.deceasedFirstName || '')} ${String(estate.deceasedLastName || '')}`, { x: 50, y, size: 12 });
        page.drawText(`Case Number: ${String(estate.courtCaseNumber || 'Pending')}`, { x: 400, y, size: 12 });
        y -= 40;

        page.drawText('1. Petitioner (name): ___________________________________________', { x: 50, y, size: 11 });
        y -= 25;
        page.drawText('2. Petitioner requests an order confirming the sale of real property.', { x: 50, y });
        y -= 25;
        page.drawText('3. Property description (address or legal):', { x: 50, y, font: fontBold });
        y -= 20;
        page.drawText('   _________________________________________________________', { x: 70, y });
        y -= 20;
        page.drawText('   _________________________________________________________', { x: 70, y });
        y -= 30;

        page.drawText('4. Sale price: $____________________', { x: 50, y });
        y -= 25;
        page.drawText('5. Buyer (name): _______________________________________________', { x: 50, y });
        y -= 40;

        page.drawText('UNDER PENALTY OF PERJURY, I declare that the foregoing is true.', { x: 50, y, size: 10 });
        y -= 40;

        // Signature
        page.drawText(`Date: ${new Date().toLocaleDateString()}`, { x: 50, y });
        y -= 30;
        page.drawText('___________________________________________________', { x: 50, y });
        y -= 15;
        page.drawText('Signature of Petitioner', { x: 50, y, size: 10 });

        return await doc.save();
    },

    async generateDE265(estate: any) {
        const doc = await PDFDocument.create();
        let page = doc.addPage();
        const { height } = page.getSize();
        let y = height - 50;
        const fontBold = await doc.embedStandardFont(StandardFonts.HelveticaBold);

        page.drawText('ORDER CONFIRMING SALE OF REAL PROPERTY (DE-265)', { x: 50, y, size: 14, font: fontBold });
        y -= 30;

        page.drawText(`Estate of: ${String(estate.deceasedFirstName || '')} ${String(estate.deceasedLastName || '')}`, { x: 50, y, size: 12 });
        page.drawText(`Case Number: ${String(estate.courtCaseNumber || 'Pending')}`, { x: 400, y, size: 12 });
        y -= 40;

        page.drawText('THE COURT FINDS:', { x: 50, y, size: 11, font: fontBold });
        y -= 25;
        page.drawText('1. Notice of hearing was given as required by law.', { x: 70, y });
        y -= 20;
        page.drawText('2. The sale was made on terms that are to the advantage of the estate.', { x: 70, y });
        y -= 20;
        page.drawText('3. The purchase price is at least 90% of the appraised value.', { x: 70, y });
        y -= 40;

        page.drawText('THE COURT ORDERS:', { x: 50, y, size: 11, font: fontBold });
        y -= 25;
        page.drawText('1. The sale of the real property described in the petition is confirmed.', { x: 70, y });
        y -= 20;
        page.drawText('2. The personal representative is authorized to execute a deed.', { x: 70, y });
        y -= 50;

        // Judge Signature area
        page.drawText('Date: ________________________', { x: 50, y });
        y -= 30;
        page.drawText('___________________________________________________', { x: 300, y });
        y -= 15;
        page.drawText('JUDGE OF THE SUPERIOR COURT', { x: 350, y, size: 8 });

        return await doc.save();
    },

    /**
     * Generates a PDF by overlaying text on an official template at specific coordinates.
     * Consolidates logic from the legacy FormService.
     */
    async generateOverlayPdf(templateName: string, data: Record<string, any>, mapping: FormMapping) {
        const templateBytes = await this.getTemplateBytes(templateName);
        if (!templateBytes) {
            throw new Error(`Template ${templateName} not found in DB or filesystem`);
        }

        const pdfDoc = await PDFDocument.load(templateBytes, { ignoreEncryption: true });
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        const pages = pdfDoc.getPages();

        for (const [key, value] of Object.entries(data)) {
            const coord = mapping[key];
            if (coord) {
                // Determine which page to draw on (default to 0 if not specified)
                const pageIdx = coord.page || 0;
                if (pageIdx >= pages.length) {
                    logger.warn(`[DocumentService] Target page ${pageIdx} exceeds template length for ${templateName}`);
                    continue;
                }
                const page = pages[pageIdx];

                // Draw the text
                page.drawText(String(value || ''), {
                    x: coord.x,
                    y: coord.y,
                    size: coord.size || 10,
                    font: coord.font?.includes('Bold') ? fontBold : font,
                    color: rgb(0, 0, 0),
                });
            }
        }

        return await pdfDoc.save();

    },

    /**
     * Calibration Utility: Generates a PDF with a grid overlay to help find coordinates.
     * Consolidates logic from the legacy FormService.
     */
    async generateCalibrationPdf(templateName: string) {
        const templateBytes = await this.getTemplateBytes(templateName);
        if (!templateBytes) {
            throw new Error(`Template ${templateName} not found`);
        }
        const pdfDoc = await PDFDocument.load(templateBytes, { ignoreEncryption: true });

        const pages = pdfDoc.getPages();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

        pages.forEach(page => {
            const { width, height } = page.getSize();

            // Draw vertical lines every 50 points
            for (let x = 0; x <= width; x += 50) {
                page.drawLine({
                    start: { x, y: 0 },
                    end: { x, y: height },
                    thickness: 0.5,
                    color: rgb(0.8, 0, 0),
                    opacity: 0.3,
                });
                page.drawText(String(x), { x: x + 2, y: 10, size: 8, font, color: rgb(0.8, 0, 0) });
            }

            // Draw horizontal lines every 50 points
            for (let y = 0; y <= height; y += 50) {
                page.drawLine({
                    start: { x: 0, y: y },
                    end: { x: width, y: y },
                    thickness: 0.5,
                    color: rgb(0, 0, 0.8),
                    opacity: 0.3,
                });
                page.drawText(String(y), { x: 10, y: y + 2, size: 8, font, color: rgb(0, 0, 0.8) });
            }

            // Add fine grid (10 points)
            for (let x = 0; x <= width; x += 10) {
                page.drawLine({
                    start: { x, y: 0 },
                    end: { x, y: height },
                    thickness: 0.1,
                    color: rgb(0.5, 0.5, 0.5),
                    opacity: 0.1,
                });
            }
            for (let y = 0; y <= height; y += 10) {
                page.drawLine({
                    start: { x: 0, y: y },
                    end: { x: width, y: y },
                    thickness: 0.1,
                    color: rgb(0.5, 0.5, 0.5),
                    opacity: 0.1,
                });
            }
        });

        return await pdfDoc.save();

    },

    /**
     * Generates a formal Certification of Trust (For TRUST_ADMIN path)
     */
    async generateCertificationOfTrust(estate: any) {
        const doc = await PDFDocument.create();
        let page = doc.addPage();
        const { height } = page.getSize();
        let y = height - 50;
        const fontBold = await doc.embedStandardFont(StandardFonts.HelveticaBold);
        const fontItalic = await doc.embedStandardFont(StandardFonts.HelveticaOblique);

        page.drawText('CERTIFICATION OF TRUST', { x: 50, y, size: 16, font: fontBold });
        y -= 30;

        const trustDate = estate.willDate ? new Date(estate.willDate).toLocaleDateString() : '[Trust Date]';
        const decedentName = `${String(estate.deceasedFirstName || '')} ${String(estate.deceasedLastName || '')}`;
        const trusteeName = String(estate.user?.fullName || '[Trustee Name]');

        page.drawText('1. Declaration of Trust Existence', { x: 50, y, size: 12, font: fontBold });
        y -= 20;
        page.drawText(`   The undersigned Trustee(s) declares that a trust exists and is currently`, { x: 50, y, size: 11 });
        y -= 15;
        page.drawText(`   in full force and effect. The trust was executed on ${trustDate}.`, { x: 50, y, size: 11 });
        y -= 30;

        page.drawText('2. Trustee Information', { x: 50, y, size: 12, font: fontBold });
        y -= 20;
        page.drawText(`   The current acting Trustee of the Trust is: ${trusteeName}`, { x: 50, y, size: 11 });
        y -= 15;
        page.drawText(`   Address: __________________________________________________`, { x: 50, y, size: 11 });
        y -= 30;

        page.drawText('3. Settlor / Grantor', { x: 50, y, size: 12, font: fontBold });
        y -= 20;
        page.drawText(`   The Settlor / Grantor of the Trust was: ${decedentName}`, { x: 50, y, size: 11 });
        y -= 30;

        page.drawText('4. Revocability', { x: 50, y, size: 12, font: fontBold });
        y -= 20;
        const isRevocable = estate.isTrustRevocable !== false;
        page.drawText(`   The Trust is currently: ${isRevocable ? 'Revocable' : 'Irrevocable'}`, { x: 50, y, size: 11 });
        if (isRevocable) {
            y -= 15;
            page.drawText(`   (Note: Trust may have become irrevocable upon the death of the Settlor)`, { x: 50, y, size: 10, font: fontItalic });
        }
        y -= 30;

        page.drawText('5. Trustee Powers', { x: 50, y, size: 12, font: fontBold });
        y -= 20;
        page.drawText(`   The Trustee has power and authority to manage trust property, including`, { x: 50, y, size: 11 });
        y -= 15;
        page.drawText(`   the power to buy, sell, convey, encumber, and manage real and personal`, { x: 50, y, size: 11 });
        y -= 15;
        page.drawText(`   property on behalf of the Trust.`, { x: 50, y, size: 11 });
        y -= 40;

        page.drawText('6. Reliance on this Certification', { x: 50, y, size: 12, font: fontBold });
        y -= 20;
        page.drawText(`   Any person dealing with the Trustee may rely upon this Certification of`, { x: 50, y, size: 11 });
        y -= 15;
        page.drawText(`   Trust as proof of the Trustee's authority.`, { x: 50, y, size: 11 });
        y -= 50;

        // Signature Area
        page.drawText('I declare under penalty of perjury under the laws of the State of', { x: 50, y, size: 11 });
        y -= 15;
        page.drawText(`${String(estate.user?.state || '___________')} that the foregoing is true and correct.`, { x: 50, y, size: 11 });
        y -= 40;

        page.drawText(`Date: ${new Date().toLocaleDateString()}`, { x: 50, y });
        y -= 30;
        page.drawText('___________________________________________________', { x: 50, y });
        y -= 15;
        page.drawText(`Signature of ${trusteeName}, Trustee`, { x: 50, y, size: 10 });
        y -= 50;

        // Notary (Placeholder)
        page.drawText('NOTARY ACKNOWLEDGMENT', { x: 50, y, size: 12, font: fontBold });
        y -= 25;
        page.drawText('State of _________________', { x: 50, y, size: 11 });
        y -= 15;
        page.drawText('County of ________________', { x: 50, y, size: 11 });
        y -= 25;
        page.drawText('Subscribed and sworn to before me on _______________, by _______________', { x: 50, y, size: 11 });
        y -= 30;
        page.drawText('_______________________________', { x: 50, y });
        y -= 15;
        page.drawText('Signature of Notary Public', { x: 50, y, size: 10 });

        return await doc.save();
    },

    /**
     * Generates a TX Muniment of Title application placeholder (For Texas estates)
     */
    async generateTXMunimentOfTitle(estate: any) {
        const doc = await PDFDocument.create();
        let page = doc.addPage();
        const { height } = page.getSize();
        let y = height - 50;
        const fontBold = await doc.embedStandardFont(StandardFonts.HelveticaBold);

        page.drawText('APPLICATION FOR PROBATE OF WILL AS', { x: 50, y, size: 14, font: fontBold });
        y -= 15;
        page.drawText('MUNIMENT OF TITLE (TEXAS)', { x: 50, y, size: 14, font: fontBold });
        y -= 40;

        page.drawText(`Estate of: ${String(estate.deceasedFirstName || '')} ${String(estate.deceasedLastName || '')}`, { x: 50, y, size: 12 });
        page.drawText(`County: ${String(estate.probateCounty || '[County]')}`, { x: 400, y, size: 12 });
        y -= 40;

        page.drawText('TO THE HONORABLE JUDGE OF SAID COURT:', { x: 50, y, size: 11, font: fontBold });
        y -= 30;

        const applicantName = String(estate.user?.fullName || 'Applicant');
        page.drawText(`1. Applicant's Name: ${applicantName}`, { x: 50, y, size: 11 });
        y -= 25;

        page.drawText(`2. Decedent Information:`, { x: 50, y, size: 11 });
        y -= 15;
        page.drawText(`   Name: ${String(estate.deceasedFirstName || '')} ${String(estate.deceasedLastName || '')}`, { x: 50, y, size: 11 });
        y -= 15;
        const deathDate = estate.deceasedDateOfDeath ? new Date(estate.deceasedDateOfDeath).toLocaleDateString() : '[Date]';
        page.drawText(`   Date of Death: ${deathDate}`, { x: 50, y, size: 11 });
        y -= 15;
        page.drawText(`   State of Residence: Texas`, { x: 50, y, size: 11 });
        y -= 25;

        page.drawText(`3. Will Application:`, { x: 50, y, size: 11 });
        y -= 15;
        page.drawText(`   Applicant requests that the Decedent's Will, dated ${estate.willDate ? new Date(estate.willDate).toLocaleDateString() : '[Date]'},`, { x: 50, y, size: 11 });
        y -= 15;
        page.drawText(`   be admitted to probate as a Muniment of Title.`, { x: 50, y, size: 11 });
        y -= 25;

        page.drawText(`4. Estate Solvency (Requirement for Muniment of Title):`, { x: 50, y, size: 11 });
        y -= 15;
        page.drawText(`   There are no unpaid debts owing by the Estate of the Testator,`, { x: 50, y, size: 11 });
        y -= 15;
        page.drawText(`   excluding debts secured by liens on real estate.`, { x: 50, y, size: 11 });
        y -= 25;

        page.drawText(`5. Necessity of Administration:`, { x: 50, y, size: 11 });
        y -= 15;
        page.drawText(`   There is no necessity for administration of this estate.`, { x: 50, y, size: 11 });
        y -= 40;

        page.drawText('Respectfully submitted,', { x: 50, y, size: 11 });
        y -= 40;

        page.drawText('___________________________________________________', { x: 50, y });
        y -= 15;
        page.drawText(`Signature of ${applicantName}`, { x: 50, y, size: 10 });

        return await doc.save();
    },

    /**
     * Generates a FL Summary Administration application placeholder (For Florida estates)
     */
    async generateFLSummaryAdministration(estate: any) {
        const doc = await PDFDocument.create();
        let page = doc.addPage();
        const { height } = page.getSize();
        let y = height - 50;
        const fontBold = await doc.embedStandardFont(StandardFonts.HelveticaBold);

        page.drawText('PETITION FOR SUMMARY ADMINISTRATION (FLORIDA)', { x: 50, y, size: 14, font: fontBold });
        y -= 40;

        page.drawText(`Estate of: ${String(estate.deceasedFirstName || '')} ${String(estate.deceasedLastName || '')}`, { x: 50, y, size: 12 });
        page.drawText(`County: ${String(estate.probateCounty || '[County]')}`, { x: 400, y, size: 12 });
        y -= 40;

        const applicantName = String(estate.user?.fullName || 'Petitioner');
        page.drawText(`1. Petitioner Information:`, { x: 50, y, size: 11, font: fontBold });
        y -= 20;
        page.drawText(`   Name: ${applicantName}`, { x: 50, y, size: 11 });
        y -= 25;

        page.drawText(`2. Decedent Information:`, { x: 50, y, size: 11, font: fontBold });
        y -= 20;
        page.drawText(`   Name: ${String(estate.deceasedFirstName || '')} ${String(estate.deceasedLastName || '')}`, { x: 50, y, size: 11 });
        y -= 15;
        const deathDate = estate.deceasedDateOfDeath ? new Date(estate.deceasedDateOfDeath).toLocaleDateString() : '[Date]';
        page.drawText(`   Date of Death: ${deathDate}`, { x: 50, y, size: 11 });
        y -= 25;

        page.drawText(`3. Estate Value (Eligibility):`, { x: 50, y, size: 11, font: fontBold });
        y -= 20;
        page.drawText(`   The value of the entire estate subject to administration in this state,`, { x: 50, y, size: 11 });
        y -= 15;
        page.drawText(`   less the value of property exempt from the claims of creditors,`, { x: 50, y, size: 11 });
        y -= 15;
        page.drawText(`   does not exceed $75,000.`, { x: 50, y, size: 11 });
        y -= 25;

        page.drawText(`4. Creditors:`, { x: 50, y, size: 11, font: fontBold });
        y -= 20;
        page.drawText(`   [ ] All creditors' claims have been paid or provision for payment`, { x: 50, y, size: 11 });
        y -= 15;
        page.drawText(`       has been made.`, { x: 50, y, size: 11 });
        y -= 40;

        page.drawText('Under penalties of perjury, I declare that I have read the', { x: 50, y, size: 11 });
        y -= 15;
        page.drawText('foregoing Petition for Summary Administration and that the', { x: 50, y, size: 11 });
        y -= 15;
        page.drawText('facts stated are true.', { x: 50, y, size: 11 });
        y -= 40;

        page.drawText(`Date: ${new Date().toLocaleDateString()}`, { x: 50, y });
        y -= 30;
        page.drawText('___________________________________________________', { x: 50, y });
        y -= 15;
        page.drawText(`Signature of ${applicantName}`, { x: 50, y, size: 10 });

        return await doc.save();
    },

    /**
     * Generates a NY Voluntary Administration application placeholder (For New York estates)
     */
    async generateNYVoluntaryAdministration(estate: any) {
        const doc = await PDFDocument.create();
        let page = doc.addPage();
        const { height } = page.getSize();
        let y = height - 50;
        const fontBold = await doc.embedStandardFont(StandardFonts.HelveticaBold);

        page.drawText('AFFIDAVIT IN RELATION TO SETTLEMENT OF ESTATE', { x: 50, y, size: 14, font: fontBold });
        y -= 15;
        page.drawText('UNDER ARTICLE 13 (VOLUNTARY ADMINISTRATION - NEW YORK)', { x: 50, y, size: 14, font: fontBold });
        y -= 40;

        page.drawText(`Estate of: ${String(estate.deceasedFirstName || '')} ${String(estate.deceasedLastName || '')}`, { x: 50, y, size: 12 });
        page.drawText(`County: ${String(estate.probateCounty || '[County]')}`, { x: 400, y, size: 12 });
        y -= 40;

        const applicantName = String(estate.user?.fullName || 'Affiant');
        page.drawText(`I, ${applicantName}, being duly sworn, depose and say:`, { x: 50, y, size: 11 });
        y -= 30;

        page.drawText(`1. My address is: _____________________________________________`, { x: 50, y, size: 11 });
        y -= 25;

        page.drawText(`2. The decedent died on ${estate.deceasedDateOfDeath ? new Date(estate.deceasedDateOfDeath).toLocaleDateString() : '[Date]'}, a resident of New York.`, { x: 50, y, size: 11 });
        y -= 25;

        page.drawText(`3. I am a distributee or person entitled to act as voluntary administrator.`, { x: 50, y, size: 11 });
        y -= 25;

        page.drawText(`4. The value of all personal property belonging to the decedent`, { x: 50, y, size: 11 });
        y -= 15;
        page.drawText(`   does not exceed $50,000 (excluding exempt property).`, { x: 50, y, size: 11 });
        y -= 25;

        page.drawText(`5. The decedent did not own any real property individually in New York.`, { x: 50, y, size: 11 });
        y -= 40;

        page.drawText('___________________________________________________', { x: 50, y });
        y -= 15;
        page.drawText(`Signature of ${applicantName}, Affiant`, { x: 50, y, size: 10 });

        return await doc.save();

    },

    /**
     * Generates a Creditor Claim Priority Worksheet for insolvent estates
     */
    async generateCreditorClaimPriorityWorksheet(estateId: string) {
        const estate = await prisma.estate.findUnique({
            where: { id: estateId },
            include: { liabilities: true, user: true }
        });

        if (!estate) throw new Error("Estate not found");

        const doc = await PDFDocument.create();
        let page = doc.addPage();
        const { height } = page.getSize();
        let y = height - 50;
        const fontBold = await doc.embedStandardFont(StandardFonts.HelveticaBold);
        const fontNormal = await doc.embedStandardFont(StandardFonts.Helvetica);

        page.drawText('CREDITOR CLAIM PRIORITY WORKSHEET', { x: 50, y, size: 14, font: fontBold });
        y -= 15;
        page.drawText('(FOR INSOLVENT ESTATES)', { x: 50, y, size: 12, font: fontBold });
        y -= 30;

        page.drawText(`Estate of: ${String(estate.deceasedFirstName || '')} ${String(estate.deceasedLastName || '')}`, { x: 50, y, size: 11 });
        page.drawText(`State: ${String(estate.deceasedState || 'N/A')}`, { x: 400, y, size: 11 });
        y -= 25;

        // Get priority rules for state
        const stateRules = PriorityService.getPriorityOptions(estate.deceasedState || '');

        // Group liabilities
        const liabilitiesByClass: Record<string, any[]> = {};
        for (const rule of stateRules) {
            liabilitiesByClass[rule.classId] = estate.liabilities.filter(l => l.priorityClass === rule.classId);
        }

        const estAssets = Number(estate.estimatedPersonalProperty || 0) + Number(estate.estimatedRealProperty || 0);
        let remainingFunds = estAssets;

        page.drawText(`Estimated Total Assets: $${estAssets.toFixed(2)}`, { x: 50, y, size: 11, font: fontBold });
        y -= 30;

        for (const rule of stateRules) {
            const claims = liabilitiesByClass[rule.classId];
            if (!claims || claims.length === 0) continue;

            if (y < 100) {
                page = doc.addPage();
                y = height - 50;
            }

            page.drawText(`Priority ${rule.rank}: ${rule.label}`, { x: 50, y, size: 11, font: fontBold });
            y -= 15;

            let classTotal = 0;
            for (const claim of claims) {
                const amt = Number(claim.amount);
                classTotal += amt;
                page.drawText(`  - ${claim.name}: $${amt.toFixed(2)} [${claim.status}]`, { x: 50, y, size: 10, font: fontNormal });
                y -= 15;
            }

            page.drawText(`  Class Total: $${classTotal.toFixed(2)}`, { x: 50, y, size: 10, font: fontBold });
            y -= 15;

            // Simple pro-rata logic for display
            if (remainingFunds >= classTotal) {
                page.drawText(`  Payment Authorized: 100%`, { x: 50, y, size: 10, font: fontNormal, color: rgb(0, 0.5, 0) });
                remainingFunds -= classTotal;
            } else if (remainingFunds > 0) {
                const ratio = (remainingFunds / classTotal) * 100;
                page.drawText(`  Payment Authorized: ${ratio.toFixed(2)}% (Pro-Rata)`, { x: 50, y, size: 10, font: fontNormal, color: rgb(0.8, 0.5, 0) });
                remainingFunds = 0;
            } else {
                page.drawText(`  Payment Authorized: 0% (Funds Exhausted)`, { x: 50, y, size: 10, font: fontNormal, color: rgb(0.8, 0, 0) });
            }
            y -= 25;
        }

        page.drawText(`Remaining Funds for Heirs: $${Math.max(0, remainingFunds).toFixed(2)}`, { x: 50, y, size: 12, font: fontBold });
        y -= 40;

        page.drawText('WARNING: This worksheet is for planning purposes only.', { x: 50, y, size: 10, font: fontBold });
        y -= 15;
        page.drawText('Do not make payments to lower-priority creditors until all higher-priority claims', { x: 50, y, size: 10, font: fontNormal });
        y -= 15;
        page.drawText('and tax clearances are fully satisfied and the court authorizes distribution.', { x: 50, y, size: 10, font: fontNormal });

        return await doc.save();
    },

    /**
     * Generates a W-8BEN form placeholder for foreign beneficiaries
     */
    async generateW8BEN(estate: any) {
        const doc = await PDFDocument.create();
        let page = doc.addPage();
        const { height } = page.getSize();
        let y = height - 50;
        const fontBold = await doc.embedStandardFont(StandardFonts.HelveticaBold);

        page.drawText('Form W-8BEN', { x: 50, y, size: 16, font: fontBold });
        y -= 25;
        page.drawText('Certificate of Foreign Status of Beneficial Owner for United States Tax Withholding and Reporting', { x: 50, y, size: 11 });
        y -= 40;

        page.drawText(`1. Name of individual who is the beneficial owner:`, { x: 50, y, size: 11 });
        y -= 15;
        page.drawText(`   [Beneficiary Name]`, { x: 50, y, size: 11, font: fontBold });
        y -= 25;

        page.drawText(`2. Country of citizenship:`, { x: 50, y, size: 11 });
        y -= 15;
        const reasons = estate.internationalReasons || [];
        const isForeign = reasons.includes('FOREIGN_HEIRS') || reasons.includes('FOREIGN_NON_RESIDENT_DECEDENT');
        page.drawText(`   ${isForeign ? '[Foreign Country]' : '_______________________'}`, { x: 50, y, size: 11, font: fontBold });
        y -= 25;

        page.drawText(`3. Permanent residence address:`, { x: 50, y, size: 11 });
        y -= 15;
        page.drawText(`   [Foreign Address]`, { x: 50, y, size: 11, font: fontBold });
        y -= 40;

        page.drawText('Part II: Claim of Tax Treaty Benefits', { x: 50, y, size: 12, font: fontBold });
        y -= 25;
        page.drawText(`9. I certify that the beneficial owner is a resident of _________________`, { x: 50, y, size: 11 });
        y -= 15;
        page.drawText(`   within the meaning of the income tax treaty between the United States and that country.`, { x: 50, y, size: 11 });
        y -= 40;

        page.drawText('Part III: Certification', { x: 50, y, size: 12, font: fontBold });
        y -= 25;
        page.drawText(`Under penalties of perjury, I declare that I have examined the information on this form and to the`, { x: 50, y, size: 10 });
        y -= 15;
        page.drawText(`best of my knowledge and belief it is true, correct, and complete.`, { x: 50, y, size: 10 });
        y -= 40;

        page.drawText('___________________________________________________', { x: 50, y });
        y -= 15;
        page.drawText(`Signature of beneficial owner (or individual authorized to sign)`, { x: 50, y, size: 10 });

        return await doc.save();
    },

    /**
     * Generates a W-8CE form placeholder for expatriated decedents
     */
    async generateW8CE(estate: any) {
        const doc = await PDFDocument.create();
        let page = doc.addPage();
        const { height } = page.getSize();
        let y = height - 50;
        const fontBold = await doc.embedStandardFont(StandardFonts.HelveticaBold);

        page.drawText('Form W-8CE', { x: 50, y, size: 16, font: fontBold });
        y -= 25;
        page.drawText('Notice of Expatriation and Waiver of Treaty Benefits', { x: 50, y, size: 11 });
        y -= 40;

        page.drawText(`1. Name of covered expatriate:`, { x: 50, y, size: 11 });
        y -= 15;
        page.drawText(`   ${String(estate.deceasedFirstName || '')} ${String(estate.deceasedLastName || '')}`, { x: 50, y, size: 11, font: fontBold });
        y -= 25;

        page.drawText(`2. U.S. taxpayer identification number (if any):`, { x: 50, y, size: 11 });
        y -= 15;
        page.drawText(`   ${String(estate.deceasedSsn || '[SSN/ITIN]')}`, { x: 50, y, size: 11, font: fontBold });
        y -= 25;

        page.drawText(`3. Date of expatriation:`, { x: 50, y, size: 11 });
        y -= 15;
        page.drawText(`   [Date prior to death]`, { x: 50, y, size: 11, font: fontBold });
        y -= 40;

        page.drawText('Part I: Waiver of Treaty Benefits', { x: 50, y, size: 12, font: fontBold });
        y -= 25;
        page.drawText(`I irrevocably waive any right to claim any reduction in withholding on the eligible deferred`, { x: 50, y, size: 11 });
        y -= 15;
        page.drawText(`compensation item under any income tax treaty with the United States.`, { x: 50, y, size: 11 });
        y -= 40;

        page.drawText('Part IV: Certification', { x: 50, y, size: 12, font: fontBold });
        y -= 25;
        const applicantName = String(estate.user?.fullName || 'Executor');
        page.drawText(`Under penalties of perjury, I declare that I am the executor of the estate of the covered expatriate.`, { x: 50, y, size: 10 });
        y -= 40;

        page.drawText('___________________________________________________', { x: 50, y });
        y -= 15;
        page.drawText(`Signature of ${applicantName}, Executor`, { x: 50, y, size: 10 });

        return await doc.save();
    }
};

function safeSetText(form: any, name: string, value: string | undefined) {
    try {
        const field = form.getTextField(name);
        if (value) field.setText(value);
    } catch (e: any) {
        logger.warn(`[DocumentService] Could not set text for field "${name}": ${e.message}`);
    }
}

function safeSetCheckbox(form: any, name: string, checked: boolean) {
    try {
        const field = form.getCheckBox(name);
        if (checked) field.check();
        else field.uncheck();
    } catch (e: any) {
        logger.warn(`[DocumentService] Could not set checkbox for field "${name}": ${e.message}`);
    }
}

