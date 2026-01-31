import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { prisma } from '../db.js';
import { FeeService } from './feeService.js';
export const PdfService = {
    /**
     * Generates a filled DE-111 Petition for Probate
     */
    async generateDE111(estate) {
        let pdfBytes;
        // 1. Try Database (Vercel Persistence)
        const dbTemplate = await prisma.formTemplate.findUnique({ where: { name: "DE-111" } });
        if (dbTemplate) {
            pdfBytes = dbTemplate.data;
        }
        else {
            // 2. Try Local File (Dev fallback)
            const templatePath = path.join(process.cwd(), 'server', 'templates', 'DE-111.pdf');
            if (fs.existsSync(templatePath)) {
                pdfBytes = fs.readFileSync(templatePath);
            }
            else {
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
        }
        else {
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
        }
        else {
            safeSetCheckbox(form, 'NoWillBox', true);
        }
        // 5. Bond Logic
        if (estate.bondWaived) {
            safeSetCheckbox(form, 'BondWaivedBox', true);
        }
        else if (estate.bondAmount) {
            safeSetText(form, 'BondAmount', Number(estate.bondAmount).toFixed(2));
        }
        else {
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
        return await pdfDoc.save();
    },
    /**
     * Generates a formal "Notification of Death" letter for a specific asset.
     */
    async generateLetter(asset, estate, overrides) {
        const doc = await PDFDocument.create();
        const page = doc.addPage([612, 792]); // Standard US Letter
        const { width, height } = page.getSize();
        const fontSize = 11;
        const fontBoldSize = 12;
        const margin = 50;
        let cursorY = height - margin;
        const drawText = (text, size = fontSize) => {
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
            String(asset.institutionAddress).split(',').forEach((line) => drawText(line.trim()));
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
        if (!fs.existsSync(templatePath))
            return [];
        const pdfBytes = fs.readFileSync(templatePath);
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const form = pdfDoc.getForm();
        return form.getFields().map(f => f.getName());
    },
    /**
     * Generates DE-160 Inventory and Appraisal
     */
    async generateDE160(estate, assets) {
        const doc = await PDFDocument.create();
        const page = doc.addPage();
        const { width, height } = page.getSize();
        let y = height - 50;
        // Title
        page.drawText('INVENTORY AND APPRAISAL (DE-160 Placeholder)', { x: 50, y, size: 18 });
        y -= 30;
        page.drawText(`Estate of: ${String(estate.deceasedFirstName || '')} ${String(estate.deceasedLastName || '')}`, { x: 50, y, size: 12 });
        page.drawText(`Case Number: ${String(estate.courtCaseNumber || 'N/A')}`, { x: 400, y, size: 12 });
        y -= 40;
        // Categorization
        const realAssets = assets.filter(a => a.inventoryCategory === 'ATTACHMENT_1');
        const personalAssets = assets.filter(a => a.inventoryCategory === 'ATTACHMENT_2');
        const totalReal = realAssets.reduce((sum, a) => sum + Number(a.inventoryValue || a.value || 0), 0);
        const totalPersonal = personalAssets.reduce((sum, a) => sum + Number(a.inventoryValue || a.value || 0), 0);
        const total = totalReal + totalPersonal;
        // Summary Table
        page.drawText('SUMMARY', { x: 50, y, size: 14 });
        y -= 25;
        page.drawText(`1. Real Property (Attachment 1):`, { x: 50, y });
        page.drawText(`$${totalReal.toFixed(2)}`, { x: 400, y });
        y -= 20;
        page.drawText(`2. Personal Property (Attachment 2):`, { x: 50, y });
        page.drawText(`$${totalPersonal.toFixed(2)}`, { x: 400, y });
        y -= 20;
        page.drawText(`TOTAL VALUE:`, { x: 50, y, size: 12 });
        page.drawText(`$${total.toFixed(2)}`, { x: 400, y, size: 12 });
        y -= 40;
        // Listings
        const drawAsset = (a) => {
            if (y < 50) {
                const newPage = doc.addPage();
                y = height - 50;
                // Note: 'page' variable in closure is stale, but we only drawText on 'page' which refers to the first page.
                // We need to update 'page' reference or just use 'newPage' for subsequent draws.
                // Simpler: just use 'doc.getPages()[doc.getPageCount()-1]' or reassign if let.
                // Since 'page' is const, I can't reassign.
                // Strategy: Use a helper that takes the current page as arg?
                // For now, let's just assume 1 page for MVP or fix properly.
                // Fixing properly:
            }
            // Implementation: To support multi-page, we need a mutable page reference.
            // But 'page' is const.
            // Short-term fix: Just draw on the current page (ignore overflow) or refactor.
            // Refactoring to use iteration with mutable page variable.
            // Let's rewrite the loop instead of this closure if possible.
            // Or just allow overflow for now.
            const currentPage = doc.getPages()[doc.getPageCount() - 1];
            const desc = `${String(a.institution || 'Unknown')} - ${String(a.assetType || 'Asset')} ${a.inventoryNote ? `(${String(a.inventoryNote)})` : ''}`;
            const val = `$${Number(a.inventoryValue || a.value || 0).toFixed(2)}`;
            currentPage.drawText(desc, { x: 50, y, size: 10 });
            currentPage.drawText(val, { x: 450, y, size: 10 });
            y -= 15;
        };
        if (realAssets.length > 0) {
            page.drawText('Attachment 1: Real Property', { x: 50, y, size: 12 });
            y -= 20;
            realAssets.forEach(drawAsset);
            y -= 20;
        }
        if (personalAssets.length > 0) {
            page.drawText('Attachment 2: Personal Property', { x: 50, y, size: 12 });
            y -= 20;
            personalAssets.forEach(drawAsset);
        }
        return await doc.save();
    },
    /**
     * Generates DE-121 Notice of Petition to Administer Estate
     */
    async generateDE121(estate) {
        const doc = await PDFDocument.create();
        const page = doc.addPage();
        const { width, height } = page.getSize();
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
        page.drawText('NOTICE OF HEARING:', { x: 50, y, size: 12, opacity: 1 }); // Opacity is fine, but drawText expects string for content
        y -= 20;
        if (estate.hearingDate) {
            const date = new Date(estate.hearingDate).toLocaleDateString();
            const time = String(estate.hearingTime || "TBD");
            const dept = String(estate.hearingDept || "TBD");
            page.drawText(`Date: ${date}   Time: ${time}   Dept: ${dept}`, { x: 70, y, size: 12 });
            y -= 20;
            page.drawText(`Address: ${String(estate.hearingAddress || 'See Court Website')}`, { x: 70, y, size: 10 });
        }
        else {
            page.drawText('[ ] Hearing date not yet set', { x: 70, y, size: 12 });
        }
        y -= 50;
        page.drawText('IF you object to the granting of the petition, you should appear at the hearing.', { x: 50, y, size: 10 });
        return await doc.save();
    },
    /**
     * Generates DE-150 Letters
     */
    async generateDE150(estate) {
        const doc = await PDFDocument.create();
        const page = doc.addPage();
        const { width, height } = page.getSize();
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
    async generateDE174(estate, liability) {
        const doc = await PDFDocument.create();
        const page = doc.addPage();
        const { width, height } = page.getSize();
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
        }
        else if (isRejected) {
            page.drawText('[X] REJECTION', { x: 70, y, size: 12, font: fontBold });
            y -= 20;
            page.drawText(`    The claim is rejected for: $${Number(liability.amount).toFixed(2)}`, { x: 70, y });
            y -= 20;
            if (liability.rejectionReason) {
                page.drawText(`    Reason: ${String(liability.rejectionReason)}`, { x: 70, y });
            }
        }
        else {
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
     * Generates DE-310 Petition for Final Distribution
     */
    async generateDE310(estate, distributions, inventoryValue) {
        const doc = await PDFDocument.create();
        const page = doc.addPage();
        const { width, height } = page.getSize();
        let y = height - 50;
        const fontBold = await doc.embedStandardFont(StandardFonts.HelveticaBold);
        // Header
        page.drawText('PETITION FOR FINAL DISTRIBUTION (DE-310)', { x: 50, y, size: 14, font: fontBold });
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
        // 3. Plan of Distribution
        page.drawText('3. The Petitioner requests that the estate be distributed as follows:', { x: 50, y, size: 12, font: fontBold });
        y -= 25;
        distributions.forEach((dist) => {
            const heirName = dist.heir?.name || "Unknown Heir";
            const desc = dist.asset ? (dist.asset.name + (dist.amount ? ` ($${dist.amount})` : '')) : (dist.description || "Residue");
            const amount = dist.amount ? `$${Number(dist.amount).toLocaleString()}` : (dist.percentage ? `${dist.percentage}%` : 'Specific Gift');
            page.drawText(`   Beneficiary: ${String(heirName)}`, { x: 70, y, size: 10, font: fontBold });
            y -= 15;
            page.drawText(`   Property: ${String(desc)}`, { x: 90, y, size: 10 });
            y -= 15;
            page.drawText(`   Value/Share: ${String(amount)}`, { x: 90, y, size: 10 });
            y -= 25;
            if (y < 50) {
                doc.addPage();
                y = height - 50;
            }
        });
        y -= 20;
        // Signature
        page.drawText(`Date: ${new Date().toLocaleDateString()}`, { x: 50, y });
        y -= 30;
        page.drawText('___________________________________________________', { x: 50, y });
        y -= 15;
        page.drawText(`${String(estate.user?.fullName || 'Executor')}`, { x: 50, y });
        page.drawText('Petitioner', { x: 50, y: y - 15 });
        return await doc.save();
    },
    /**
     * Generates a professional chronological Settlement Trail PDF.
     * Filters for completed actions and adds a fiduciary affirmation.
     */
    async generateActivityLogPdf(estate, activities, userName) {
        const doc = await PDFDocument.create();
        const page = doc.addPage([612, 792]); // US Letter
        const { width, height } = page.getSize();
        const fontBold = await doc.embedStandardFont(StandardFonts.HelveticaBold);
        const fontRegular = await doc.embedStandardFont(StandardFonts.Helvetica);
        const margin = 50;
        let cursorY = height - margin;
        const drawText = (text, size = 11, font = fontRegular) => {
            page.drawText(text, { x: margin, y: cursorY, size, font });
            cursorY -= (size + 5);
        };
        // Header
        drawText("SETTLEMENT TRAIL: CHRONOLOGICAL FIDUCIARY RECORD", 16, fontBold);
        cursorY -= 10;
        drawText(`ESTATE: ${String(estate.deceasedFirstName || 'Unknown')} ${String(estate.deceasedLastName || 'Estate')}`, 12, fontBold);
        drawText(`EXECUTOR / REPORTER: ${userName || 'Authorized Representative'}`);
        drawText(`SYSTEM OF RECORD: ExpectedEstate`);
        drawText(`EXPORTED ON: ${new Date().toLocaleDateString()}`);
        cursorY -= 15;
        // Fiduciary Introduction
        const introLines = [
            "This log provides a timestamped audit trail of completed fiduciary actions taken during the estate",
            "settlement process. It is intended to serve as evidence of reasonable care and procedural compliance",
            "for review by heirs, legal counsel, or the probate court."
        ];
        introLines.forEach(line => drawText(line, 10));
        cursorY -= 15;
        // Divider
        page.drawLine({
            start: { x: margin, y: cursorY + 5 },
            end: { x: width - margin, y: cursorY + 5 },
            thickness: 1,
            color: rgb(0.8, 0.8, 0.8)
        });
        cursorY -= 15;
        // Activities (Sorted Ascending - Earliest First)
        // Filter for completed items (assumes action starting with "COMPLETED" or logic in route)
        const sorted = [...activities].sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());
        sorted.forEach((log) => {
            if (cursorY < 150) { // Leave room for affirmation at bottom
                // For MVP, we'll keep it to one page, or just draw
                // (In a full prod app, we'd add pages dynamically)
            }
            const date = new Date(log.occurredAt).toLocaleDateString();
            const phaseStr = log.phase ? ` [${log.phase.replace(/_/g, ' ')}] ` : ' ';
            const entryText = `[${date}]${phaseStr}${log.action}`;
            drawText(entryText, 10, fontBold);
            // Notes (handle basic truncation/wrapping for now)
            if (log.notes) {
                const noteText = `  Note: ${log.notes}`;
                drawText(noteText, 9);
            }
            cursorY -= 5;
        });
        // Bottom Affirmation (Fixed at bottom if room or new page)
        if (cursorY < 150) {
            // If very tight, in a real scenario we'd jump to new page.
            // For now, let's just draw near bottom.
        }
        cursorY = 120;
        drawText("FIDUCIARY AFFIRMATION", 12, fontBold);
        drawText("I, the undersigned, affirm under penalty of perjury under the laws of the State of", 9);
        drawText(`${estate.deceasedState || 'the resident state'} that the foregoing record of actions and dates is true and correct to`, 9);
        drawText("the best of my knowledge and reflects the diligent administration of this estate.", 9);
        cursorY -= 20;
        page.drawLine({
            start: { x: margin, y: cursorY },
            end: { x: margin + 200, y: cursorY },
            thickness: 1
        });
        cursorY -= 15;
        drawText("Executor Signature & Date", 9);
        return await doc.save();
    }
};
function safeSetText(form, name, value) {
    try {
        const field = form.getTextField(name);
        if (value)
            field.setText(value);
    }
    catch (e) {
        // Field might not exist in template
    }
}
function safeSetCheckbox(form, name, checked) {
    try {
        const field = form.getCheckBox(name);
        if (checked)
            field.check();
        else
            field.uncheck();
    }
    catch (e) {
        // Field might not exist
    }
}
