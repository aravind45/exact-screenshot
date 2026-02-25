/**
 * FLFormService
 *
 * Generation pipeline for Florida probate forms.
 * Handles field extraction, value resolution, formatting and PDF output
 * for FL-1 through FL-15, including unique Florida forms like
 * Summary Administration and Homestead Property Petition.
 */
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { prisma } from '../db.js';
import { logger } from '../lib/logger.js';
import { FL_FORM_REGISTRY, validateFLFormData, } from './flFormRegistry.js';
function formatDate(value) {
    if (!value)
        return '';
    try {
        return new Date(value).toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    }
    catch {
        return String(value);
    }
}
function formatCurrency(value) {
    const num = Number(value);
    if (isNaN(num))
        return '0.00';
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatPhone(value) {
    if (!value)
        return '';
    const digits = String(value).replace(/\D/g, '');
    if (digits.length === 10) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return String(value);
}
function applyTransform(value, transform) {
    if (!transform)
        return value === null || value === undefined ? '' : String(value);
    switch (transform) {
        case 'uppercase':
            return String(value || '').toUpperCase();
        case 'formatDate':
            return formatDate(value);
        case 'formatCurrency':
            return formatCurrency(value);
        case 'formatPhone':
            return formatPhone(value);
        default:
            return String(value || '');
    }
}
function getNestedValue(obj, path) {
    return path.split('.').reduce((acc, key) => acc?.[key], obj);
}
function resolveFieldValue(key, def, input) {
    const { estate, assets = [], heirs = [], overrides = {} } = input;
    if (overrides[key] !== undefined)
        return overrides[key];
    switch (def.source) {
        case 'estate':
            return def.path ? getNestedValue(estate, def.path) : undefined;
        case 'user':
            return def.path ? getNestedValue(estate.user, def.path) : undefined;
        case 'assets':
            return assets;
        case 'heirs':
            return heirs;
        case 'computed':
            return resolveComputed(key, input);
        case 'override':
            return overrides[key];
        default:
            return undefined;
    }
}
function resolveComputed(key, input) {
    const { estate, assets = [], heirs = [] } = input;
    switch (key) {
        case 'decedentName':
            return `${estate.deceasedFirstName || ''} ${estate.deceasedLastName || ''}`.trim();
        case 'personalRepresentativeName':
            return estate.user?.fullName || '';
        case 'estimatedEstateValue':
        case 'smallEstateValue': {
            const personal = Number(estate.estimatedPersonalProperty || 0);
            const real = Number(estate.estimatedRealProperty || 0);
            return personal + real;
        }
        case 'totalRealProperty': {
            const realAssets = assets.filter((a) => a.inventoryCategory === 'ATTACHMENT_1');
            return realAssets.reduce((sum, a) => sum + Number(a.inventoryValue || a.value || 0), 0);
        }
        case 'totalPersonalProperty': {
            const personalAssets = assets.filter((a) => a.inventoryCategory !== 'ATTACHMENT_1');
            return personalAssets.reduce((sum, a) => sum + Number(a.inventoryValue || a.value || 0), 0);
        }
        case 'totalEstateValue': {
            return assets.reduce((sum, a) => sum + Number(a.inventoryValue || a.value || 0), 0);
        }
        case 'inventoryDate':
        case 'noticeDate':
        case 'oathDate':
        case 'releaseDate':
            return new Date();
        case 'intestate':
            return !estate.hasWill;
        case 'heirSummary':
            return heirs.length
                ? heirs.map((h) => `${h.name} (${h.relationship})`).join('; ')
                : '';
        default:
            return undefined;
    }
}
// Fallback PDF builders for when no template exists
async function buildFallbackFL1(fieldValues) {
    const doc = await PDFDocument.create();
    const page = doc.addPage([612, 792]);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
    const { height } = page.getSize();
    let y = height - 50;
    const draw = (text, size = 10, bold = false, indent = 0) => {
        page.drawText(text, { x: 50 + indent, y, size, font: bold ? fontBold : fontRegular });
        y -= size + 6;
    };
    draw("PETITION FOR ADMINISTRATION (FL-1)", 16, true);
    y -= 4;
    draw(`Probate Court County: ${fieldValues.courtCounty || '[County]'}`, 10);
    draw(`Estate of: ${fieldValues.decedentName || '[Decedent Name]'}`, 12, true);
    draw(`Date of Death: ${fieldValues.dateOfDeath || '[Date]'}`, 10);
    y -= 10;
    draw('PETITIONER', 11, true);
    draw(`Petitioner: ${fieldValues.petitionerName || ''}`, 10, false, 10);
    draw(`Address: ${fieldValues.petitionerAddress || ''}`, 10, false, 10);
    draw(`Phone: ${fieldValues.petitionerPhone || ''}`, 10, false, 10);
    y -= 10;
    draw('ADMINISTRATION TYPE', 11, true);
    draw(`Testamentary (Will): ${fieldValues.testamentary ? 'Yes' : 'No'}`, 10, false, 10);
    draw(`Intestate (No Will): ${fieldValues.intestate ? 'Yes' : 'No'}`, 10, false, 10);
    y -= 8;
    draw('PERSONAL REPRESENTATIVE', 11, true);
    draw(`Name: ${fieldValues.personalRepresentativeName || ''}`, 10, false, 10);
    y -= 8;
    draw('ESTATE VALUE', 11, true);
    draw(`Estimated Value: $${fieldValues.estimatedEstateValue || '0.00'}`, 10, false, 10);
    y -= 15;
    draw('Note: Upload the official FL-1 template for field-level auto-fill.', 8);
    return await doc.save();
}
async function buildFallbackFL2(fieldValues) {
    const doc = await PDFDocument.create();
    const page = doc.addPage([612, 792]);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
    let y = page.getSize().height - 50;
    const draw = (text, size = 10, bold = false, indent = 0) => {
        page.drawText(text, { x: 50 + indent, y, size, font: bold ? fontBold : fontRegular });
        y -= size + 6;
    };
    draw('PETITION FOR SUMMARY ADMINISTRATION (FL-2)', 15, true);
    y -= 4;
    draw(`Probate Court County: ${fieldValues.courtCounty || '[County]'}`, 10);
    draw(`Estate of: ${fieldValues.decedentName || '[Decedent Name]'}`, 12, true);
    draw(`Date of Death: ${fieldValues.dateOfDeath || '[Date]'}`, 10);
    y -= 10;
    draw('SUMMARY ADMINISTRATION', 11, true);
    draw(`Estate Value: $${fieldValues.smallEstateValue || '0.00'}`, 10, false, 10);
    draw(`Basis: ${fieldValues.summaryAdministrationBasis || '[Not Provided]'}`, 10, false, 10);
    y -= 8;
    draw('HEIRS', 11, true);
    draw(fieldValues.heirSummary || 'Heir summary not provided.', 9, false, 10);
    y -= 10;
    draw('Note: Upload the official FL-2 template for field-level auto-fill.', 8);
    return await doc.save();
}
async function buildFallbackFL3(fieldValues) {
    const doc = await PDFDocument.create();
    const page = doc.addPage([612, 792]);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
    let y = page.getSize().height - 50;
    const draw = (text, size = 10, bold = false, indent = 0) => {
        page.drawText(text, { x: 50 + indent, y, size, font: bold ? fontBold : fontRegular });
        y -= size + 6;
    };
    draw('NOTICE OF ADMINISTRATION (FL-3)', 15, true);
    y -= 4;
    draw(`Probate Court County: ${fieldValues.courtCounty || '[County]'}`, 10);
    draw(`Estate of: ${fieldValues.decedentName || '[Decedent Name]'}`, 12, true);
    draw(`Date of Death: ${fieldValues.dateOfDeath || '[Date]'}`, 10);
    y -= 10;
    draw('NOTICE', 11, true);
    draw(`Date: ${fieldValues.noticeDate || ''}`, 10, false, 10);
    draw(`Personal Representative: ${fieldValues.personalRepresentativeName || ''}`, 10, false, 10);
    draw(`Creditor Claim Deadline: ${fieldValues.creditorClaimDeadline || '[Not Provided]'}`, 10, false, 10);
    y -= 10;
    draw('Note: Upload the official FL-3 template for field-level auto-fill.', 8);
    return await doc.save();
}
async function buildFallbackFL6(fieldValues, assets) {
    const doc = await PDFDocument.create();
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
    const addPage = () => {
        const p = doc.addPage([612, 792]);
        return { page: p, y: p.getSize().height - 50 };
    };
    let { page, y } = addPage();
    const draw = (text, size = 10, bold = false, indent = 0, curY) => {
        const useY = curY !== undefined ? curY : y;
        page.drawText(text, { x: 50 + indent, y: useY, size, font: bold ? fontBold : fontRegular });
        if (curY === undefined)
            y -= size + 6;
    };
    draw('INVENTORY (FL-6)', 15, true);
    y -= 4;
    draw(`Probate Court County: ${fieldValues.courtCounty || '[County]'}`, 10);
    draw(`Estate of: ${fieldValues.decedentName || '[Decedent Name]'}`, 12, true);
    draw(`Inventory Date: ${fieldValues.inventoryDate || ''}`, 10);
    y -= 8;
    draw('SUMMARY', 11, true);
    draw(`Real Property: $${fieldValues.totalRealProperty || '0.00'}`, 10, false, 10);
    draw(`Personal Property: $${fieldValues.totalPersonalProperty || '0.00'}`, 10, false, 10);
    draw(`Total Estate Value: $${fieldValues.totalEstateValue || '0.00'}`, 10, false, 10);
    y -= 10;
    if (assets.length) {
        draw('ASSET DETAIL', 11, true);
        assets.slice(0, 15).forEach((asset) => {
            if (y < 80) {
                const np = addPage();
                page = np.page;
                y = np.y;
            }
            const desc = `${asset.institution || 'Institution'} – ${asset.assetType || 'Asset'}`;
            draw(desc.substring(0, 70), 9, false, 10);
            const val = `$${formatCurrency(Number(asset.inventoryValue || asset.value || 0))}`;
            draw(val, 9, false, 0, y + 9 + 6);
        });
    }
    y -= 12;
    draw('Note: Upload the official FL-6 template for field-level auto-fill.', 8);
    return await doc.save();
}
async function buildFallbackFL7(fieldValues) {
    const doc = await PDFDocument.create();
    const page = doc.addPage([612, 792]);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
    let y = page.getSize().height - 50;
    const draw = (text, size = 10, bold = false, indent = 0) => {
        page.drawText(text, { x: 50 + indent, y, size, font: bold ? fontBold : fontRegular });
        y -= size + 6;
    };
    draw('NOTICE TO CREDITORS (FL-7)', 15, true);
    y -= 4;
    draw(`Probate Court County: ${fieldValues.courtCounty || '[County]'}`, 10);
    draw(`Estate of: ${fieldValues.decedentName || '[Decedent Name]'}`, 12, true);
    y -= 10;
    draw('NOTICE', 11, true);
    draw(`Date: ${fieldValues.noticeDate || ''}`, 10, false, 10);
    draw(`Personal Representative: ${fieldValues.personalRepresentativeName || ''}`, 10, false, 10);
    draw(`Creditor Claim Deadline: ${fieldValues.creditorClaimDeadline || '[Not Provided]'}`, 10, false, 10);
    y -= 10;
    draw('Note: Upload the official FL-7 template for field-level auto-fill.', 8);
    return await doc.save();
}
async function buildFallbackFL10(fieldValues) {
    const doc = await PDFDocument.create();
    const page = doc.addPage([612, 792]);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
    let y = page.getSize().height - 50;
    const draw = (text, size = 10, bold = false, indent = 0) => {
        page.drawText(text, { x: 50 + indent, y, size, font: bold ? fontBold : fontRegular });
        y -= size + 6;
    };
    draw('ACCOUNTING (FL-10)', 15, true);
    y -= 4;
    draw(`Probate Court County: ${fieldValues.courtCounty || '[County]'}`, 10);
    draw(`Estate of: ${fieldValues.decedentName || '[Decedent Name]'}`, 12, true);
    y -= 10;
    draw('ACCOUNTING PERIOD', 11, true);
    draw(`Start: ${fieldValues.accountingPeriodStart || '[Date]'}`, 10, false, 10);
    draw(`End: ${fieldValues.accountingPeriodEnd || '[Date]'}`, 10, false, 10);
    y -= 8;
    draw('SUMMARY', 11, true);
    draw(`Total Receipts: $${fieldValues.totalReceipts || '0.00'}`, 10, false, 10);
    draw(`Total Disbursements: $${fieldValues.totalDisbursements || '0.00'}`, 10, false, 10);
    draw(`Net Balance: $${fieldValues.netBalance || '0.00'}`, 10, false, 10);
    y -= 10;
    draw('Note: Upload the official FL-10 template for field-level auto-fill.', 8);
    return await doc.save();
}
async function buildFallbackFL11(fieldValues) {
    const doc = await PDFDocument.create();
    const page = doc.addPage([612, 792]);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
    let y = page.getSize().height - 50;
    const draw = (text, size = 10, bold = false, indent = 0) => {
        page.drawText(text, { x: 50 + indent, y, size, font: bold ? fontBold : fontRegular });
        y -= size + 6;
    };
    draw('PETITION FOR DISCHARGE (FL-11)', 15, true);
    y -= 4;
    draw(`Probate Court County: ${fieldValues.courtCounty || '[County]'}`, 10);
    draw(`Estate of: ${fieldValues.decedentName || '[Decedent Name]'}`, 12, true);
    draw(`Date of Death: ${fieldValues.dateOfDeath || '[Date]'}`, 10);
    y -= 10;
    draw('DISTRIBUTION PLAN', 11, true);
    draw(`Proposed Date: ${fieldValues.finalDistributionDate || '[Not Provided]'}`, 10, false, 10);
    draw(`Total Estate Value: $${fieldValues.totalEstateValue || '0.00'}`, 10, false, 10);
    draw(fieldValues.distributionPlan || 'Distribution plan summary required.', 9, false, 10);
    y -= 10;
    draw('Note: Upload the official FL-11 template for field-level auto-fill.', 8);
    return await doc.save();
}
async function buildFallbackFL14(fieldValues) {
    const doc = await PDFDocument.create();
    const page = doc.addPage([612, 792]);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
    let y = page.getSize().height - 50;
    const draw = (text, size = 10, bold = false, indent = 0) => {
        page.drawText(text, { x: 50 + indent, y, size, font: bold ? fontBold : fontRegular });
        y -= size + 6;
    };
    draw('DISPOSITION WITHOUT ADMINISTRATION (FL-14)', 14, true);
    draw('Florida Statutes Section 735.301', 10, false, 10);
    y -= 4;
    draw(`Probate Court County: ${fieldValues.courtCounty || '[County]'}`, 10);
    draw(`Estate of: ${fieldValues.decedentName || '[Decedent Name]'}`, 12, true);
    draw(`Date of Death: ${fieldValues.dateOfDeath || '[Date]'}`, 10);
    y -= 10;
    draw('CLAIM', 11, true);
    draw(`Estate Value: $${fieldValues.smallEstateValue || '0.00'}`, 10, false, 10);
    draw(`Claimant: ${fieldValues.claimantName || ''}`, 10, false, 10);
    draw(`Relationship: ${fieldValues.relationshipToDecedent || ''}`, 10, false, 10);
    y -= 10;
    draw('Note: Upload the official FL-14 template for field-level auto-fill.', 8);
    return await doc.save();
}
async function buildFallbackFL15(fieldValues) {
    const doc = await PDFDocument.create();
    const page = doc.addPage([612, 792]);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
    let y = page.getSize().height - 50;
    const draw = (text, size = 10, bold = false, indent = 0) => {
        page.drawText(text, { x: 50 + indent, y, size, font: bold ? fontBold : fontRegular });
        y -= size + 6;
    };
    draw('HOMESTEAD PROPERTY PETITION (FL-15)', 14, true);
    y -= 4;
    draw(`Probate Court County: ${fieldValues.courtCounty || '[County]'}`, 10);
    draw(`Estate of: ${fieldValues.decedentName || '[Decedent Name]'}`, 12, true);
    draw(`Date of Death: ${fieldValues.dateOfDeath || '[Date]'}`, 10);
    y -= 10;
    draw('PROPERTY', 11, true);
    draw(`Address: ${fieldValues.propertyAddress || ''}`, 10, false, 10);
    draw(`Value: $${fieldValues.propertyValue || '0.00'}`, 10, false, 10);
    y -= 8;
    draw('FAMILY', 11, true);
    draw(`Surviving Spouse: ${fieldValues.survivingSpouseName || ''}`, 10, false, 10);
    draw(`Minor Children: ${fieldValues.minorChildNames || 'None'}`, 10, false, 10);
    y -= 10;
    draw('Note: Upload the official FL-15 template for field-level auto-fill.', 8);
    return await doc.save();
}
async function fillTemplateFields(templateBytes, fieldValues, registry) {
    const pdfDoc = await PDFDocument.load(templateBytes, { ignoreEncryption: true });
    const form = pdfDoc.getForm();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();
    const fields = form.getFields();
    const fieldNames = new Set(fields.map(f => f.getName()));
    for (const [key, def] of Object.entries(registry)) {
        const rawValue = fieldValues[key];
        if (rawValue === undefined || rawValue === null)
            continue;
        const rendered = applyTransform(rawValue, def.transform);
        if (def.pdfFieldName && fieldNames.has(def.pdfFieldName)) {
            try {
                if (def.type === 'checkbox') {
                    const cb = form.getCheckBox(def.pdfFieldName);
                    rawValue ? cb.check() : cb.uncheck();
                }
                else {
                    const tf = form.getTextField(def.pdfFieldName);
                    tf.setText(rendered);
                }
            }
            catch {
                // fallback to overlay
            }
        }
        if (def.coord) {
            const pageIdx = def.coord.page || 0;
            if (pageIdx < pages.length) {
                if (def.type !== 'checkbox') {
                    pages[pageIdx].drawText(rendered, {
                        x: def.coord.x,
                        y: def.coord.y,
                        size: def.coord.size || 10,
                        font: def.coord.bold ? fontBold : font,
                        color: rgb(0, 0, 0),
                    });
                }
                else if (rawValue) {
                    pages[pageIdx].drawText('✓', {
                        x: def.coord.x,
                        y: def.coord.y,
                        size: def.coord.size || 10,
                        font,
                        color: rgb(0, 0, 0),
                    });
                }
            }
        }
    }
    try {
        form.flatten();
    }
    catch {
        // ignore
    }
    return await pdfDoc.save();
}
export const FLFormService = {
    resolveFields(input) {
        const registry = FL_FORM_REGISTRY[input.formId];
        if (!registry) {
            return { fieldValues: {}, validationErrors: [`Unknown form: ${input.formId}`] };
        }
        const fieldValues = {};
        for (const [key, def] of Object.entries(registry)) {
            const raw = resolveFieldValue(key, def, input);
            if (raw !== undefined) {
                fieldValues[key] = applyTransform(raw, def.transform);
            }
        }
        const validationErrors = validateFLFormData(input.formId, {
            ...Object.fromEntries(Object.entries(input.estate).filter(([, v]) => v !== undefined)),
            ...input.overrides,
        });
        return { fieldValues, validationErrors };
    },
    async generate(input) {
        const registry = FL_FORM_REGISTRY[input.formId];
        if (!registry) {
            throw new Error(`Unknown FL form: ${input.formId}`);
        }
        const { fieldValues, validationErrors } = this.resolveFields(input);
        let pdfBytes;
        const dbTemplate = await prisma.formTemplate.findUnique({
            where: { name: input.formId },
        }).catch(() => null);
        const templateBytes = dbTemplate ? Buffer.from(dbTemplate.data) : null;
        if (templateBytes) {
            logger.info(`[FLFormService] Using template from DB for ${input.formId}`);
            pdfBytes = await fillTemplateFields(templateBytes, fieldValues, registry);
        }
        else {
            logger.warn(`[FLFormService] No template found for ${input.formId}, using fallback builder`);
            switch (input.formId) {
                case 'FL-1':
                    pdfBytes = await buildFallbackFL1(fieldValues);
                    break;
                case 'FL-2':
                    pdfBytes = await buildFallbackFL2(fieldValues);
                    break;
                case 'FL-3':
                    pdfBytes = await buildFallbackFL3(fieldValues);
                    break;
                case 'FL-4':
                    pdfBytes = await buildFallbackFL4(fieldValues);
                    break;
                case 'FL-5':
                    pdfBytes = await buildFallbackFL5(fieldValues);
                    break;
                case 'FL-6':
                    pdfBytes = await buildFallbackFL6(fieldValues, input.assets || []);
                    break;
                case 'FL-7':
                    pdfBytes = await buildFallbackFL7(fieldValues);
                    break;
                case 'FL-8':
                    pdfBytes = await buildFallbackFL8(fieldValues);
                    break;
                case 'FL-9':
                    pdfBytes = await buildFallbackFL9(fieldValues);
                    break;
                case 'FL-10':
                    pdfBytes = await buildFallbackFL10(fieldValues);
                    break;
                case 'FL-11':
                    pdfBytes = await buildFallbackFL11(fieldValues);
                    break;
                case 'FL-12':
                    pdfBytes = await buildFallbackFL12(fieldValues);
                    break;
                case 'FL-13':
                    pdfBytes = await buildFallbackFL13(fieldValues);
                    break;
                case 'FL-14':
                    pdfBytes = await buildFallbackFL14(fieldValues);
                    break;
                case 'FL-15':
                    pdfBytes = await buildFallbackFL15(fieldValues);
                    break;
                default:
                    throw new Error(`No fallback builder for ${input.formId}`);
            }
        }
        return { pdfBytes, fieldValues, validationErrors };
    },
    getUISchema(formId) {
        const registry = FL_FORM_REGISTRY[formId];
        if (!registry)
            return [];
        return Object.entries(registry)
            .filter(([, def]) => def.source !== 'computed')
            .map(([key, def]) => ({
            key,
            label: def.label,
            type: def.type,
            required: def.required ?? false,
            description: def.description,
            overridable: def.source === 'override' || true,
        }));
    },
};
// Additional fallback builders for remaining forms
async function buildFallbackFL4(fieldValues) {
    const doc = await PDFDocument.create();
    const page = doc.addPage([612, 792]);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
    let y = page.getSize().height - 50;
    const draw = (text, size = 10, bold = false, indent = 0) => {
        page.drawText(text, { x: 50 + indent, y, size, font: bold ? fontBold : fontRegular });
        y -= size + 6;
    };
    draw('OATH OF PERSONAL REPRESENTATIVE (FL-4)', 14, true);
    y -= 4;
    draw(`Probate Court County: ${fieldValues.courtCounty || '[County]'}`, 10);
    draw(`Estate of: ${fieldValues.decedentName || '[Decedent Name]'}`, 12, true);
    y -= 10;
    draw('OATH', 11, true);
    draw(`Personal Representative: ${fieldValues.personalRepresentativeName || ''}`, 10, false, 10);
    draw(`Date: ${fieldValues.oathDate || ''}`, 10, false, 10);
    y -= 10;
    draw('Note: Upload the official FL-4 template for field-level auto-fill.', 8);
    return await doc.save();
}
async function buildFallbackFL5(fieldValues) {
    const doc = await PDFDocument.create();
    const page = doc.addPage([612, 792]);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
    let y = page.getSize().height - 50;
    const draw = (text, size = 10, bold = false, indent = 0) => {
        page.drawText(text, { x: 50 + indent, y, size, font: bold ? fontBold : fontRegular });
        y -= size + 6;
    };
    draw('LETTERS OF ADMINISTRATION (FL-5)', 15, true);
    y -= 4;
    draw(`Probate Court County: ${fieldValues.courtCounty || '[County]'}`, 10);
    draw(`Estate of: ${fieldValues.decedentName || '[Decedent Name]'}`, 12, true);
    draw(`Date of Death: ${fieldValues.dateOfDeath || '[Date]'}`, 10);
    y -= 10;
    draw('AUTHORITY', 11, true);
    draw(`Personal Representative: ${fieldValues.personalRepresentativeName || ''}`, 10, false, 10);
    y -= 10;
    draw('Note: Upload the official FL-5 template for field-level auto-fill.', 8);
    return await doc.save();
}
async function buildFallbackFL8(fieldValues) {
    const doc = await PDFDocument.create();
    const page = doc.addPage([612, 792]);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
    let y = page.getSize().height - 50;
    const draw = (text, size = 10, bold = false, indent = 0) => {
        page.drawText(text, { x: 50 + indent, y, size, font: bold ? fontBold : fontRegular });
        y -= size + 6;
    };
    draw('PROOF OF CLAIM (FL-8)', 15, true);
    y -= 4;
    draw(`Probate Court County: ${fieldValues.courtCounty || '[County]'}`, 10);
    draw(`Estate of: ${fieldValues.decedentName || '[Decedent Name]'}`, 12, true);
    y -= 10;
    draw('CLAIM', 11, true);
    draw(`Creditor: ${fieldValues.creditorName || ''}`, 10, false, 10);
    draw(`Amount: $${fieldValues.claimAmount || '0.00'}`, 10, false, 10);
    draw(`Basis: ${fieldValues.claimBasis || ''}`, 9, false, 10);
    y -= 10;
    draw('Note: Upload the official FL-8 template for field-level auto-fill.', 8);
    return await doc.save();
}
async function buildFallbackFL9(fieldValues) {
    const doc = await PDFDocument.create();
    const page = doc.addPage([612, 792]);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
    let y = page.getSize().height - 50;
    const draw = (text, size = 10, bold = false, indent = 0) => {
        page.drawText(text, { x: 50 + indent, y, size, font: bold ? fontBold : fontRegular });
        y -= size + 6;
    };
    draw('OBJECTION TO CLAIM (FL-9)', 15, true);
    y -= 4;
    draw(`Probate Court County: ${fieldValues.courtCounty || '[County]'}`, 10);
    draw(`Estate of: ${fieldValues.decedentName || '[Decedent Name]'}`, 12, true);
    y -= 10;
    draw('OBJECTION', 11, true);
    draw(`Creditor: ${fieldValues.creditorName || ''}`, 10, false, 10);
    draw(`Claim Amount: $${fieldValues.claimAmount || '0.00'}`, 10, false, 10);
    draw(`Reason: ${fieldValues.objectionReason || ''}`, 9, false, 10);
    y -= 10;
    draw('Note: Upload the official FL-9 template for field-level auto-fill.', 8);
    return await doc.save();
}
async function buildFallbackFL12(fieldValues) {
    const doc = await PDFDocument.create();
    const page = doc.addPage([612, 792]);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
    let y = page.getSize().height - 50;
    const draw = (text, size = 10, bold = false, indent = 0) => {
        page.drawText(text, { x: 50 + indent, y, size, font: bold ? fontBold : fontRegular });
        y -= size + 6;
    };
    draw('FINAL ACCOUNTING (FL-12)', 15, true);
    y -= 4;
    draw(`Probate Court County: ${fieldValues.courtCounty || '[County]'}`, 10);
    draw(`Estate of: ${fieldValues.decedentName || '[Decedent Name]'}`, 12, true);
    y -= 10;
    draw('ACCOUNTING PERIOD', 11, true);
    draw(`Start: ${fieldValues.accountingPeriodStart || '[Date]'}`, 10, false, 10);
    draw(`End: ${fieldValues.accountingPeriodEnd || '[Date]'}`, 10, false, 10);
    y -= 8;
    draw('FINAL SUMMARY', 11, true);
    draw(`Total Receipts: $${fieldValues.totalReceipts || '0.00'}`, 10, false, 10);
    draw(`Total Disbursements: $${fieldValues.totalDisbursements || '0.00'}`, 10, false, 10);
    draw(`Final Balance: $${fieldValues.finalBalance || '0.00'}`, 10, false, 10);
    y -= 10;
    draw('Note: Upload the official FL-12 template for field-level auto-fill.', 8);
    return await doc.save();
}
async function buildFallbackFL13(fieldValues) {
    const doc = await PDFDocument.create();
    const page = doc.addPage([612, 792]);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
    let y = page.getSize().height - 50;
    const draw = (text, size = 10, bold = false, indent = 0) => {
        page.drawText(text, { x: 50 + indent, y, size, font: bold ? fontBold : fontRegular });
        y -= size + 6;
    };
    draw('RECEIPT AND RELEASE (FL-13)', 15, true);
    y -= 4;
    draw(`Probate Court County: ${fieldValues.courtCounty || '[County]'}`, 10);
    draw(`Estate of: ${fieldValues.decedentName || '[Decedent Name]'}`, 12, true);
    draw(`Date of Death: ${fieldValues.dateOfDeath || '[Date]'}`, 10);
    y -= 10;
    draw('DISTRIBUTION', 11, true);
    draw(`Beneficiary: ${fieldValues.beneficiaryName || ''}`, 10, false, 10);
    draw(`Amount: $${fieldValues.distributionAmount || '0.00'}`, 10, false, 10);
    draw(`Date: ${fieldValues.releaseDate || ''}`, 10, false, 10);
    y -= 10;
    draw('Note: Upload the official FL-13 template for field-level auto-fill.', 8);
    return await doc.save();
}
