/**
 * TXFormService
 *
 * Generation pipeline for Texas probate forms.
 * Handles field extraction, value resolution, formatting and PDF output
 * for TX-1 through TX-12, including unique Texas forms like
 * Independent Administration and Muniment of Title.
 */
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { prisma } from '../db.js';
import { logger } from '../lib/logger.js';
import { TX_FORM_REGISTRY, validateTXFormData, } from './txFormRegistry.js';
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
        case 'executorName':
        case 'administratorName':
            return estate.user?.fullName || '';
        case 'estimatedEstateValue': {
            const personal = Number(estate.estimatedPersonalProperty || 0);
            const real = Number(estate.estimatedRealProperty || 0);
            return personal + real;
        }
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
            return new Date();
        case 'orderDate':
            return new Date();
        case 'heirSummary':
            return heirs.length
                ? heirs.map((h) => `${h.name} (${h.relationship})`).join('; ')
                : '';
        default:
            return undefined;
    }
}
// Fallback PDF builders for when no template exists
async function buildFallbackTX1(fieldValues) {
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
    draw("APPLICATION FOR PROBATE OF WILL (TX-1)", 16, true);
    y -= 4;
    draw(`Probate Court County: ${fieldValues.courtCounty || '[County]'}`, 10);
    draw(`Estate of: ${fieldValues.decedentName || '[Decedent Name]'}`, 12, true);
    draw(`Date of Death: ${fieldValues.dateOfDeath || '[Date]'}`, 10);
    y -= 10;
    draw('APPLICANT', 11, true);
    draw(`Applicant: ${fieldValues.applicantName || ''}`, 10, false, 10);
    draw(`Address: ${fieldValues.applicantAddress || ''}`, 10, false, 10);
    draw(`Phone: ${fieldValues.applicantPhone || ''}`, 10, false, 10);
    y -= 10;
    draw('WILL', 11, true);
    draw(`Will Date: ${fieldValues.willDate || '[Not Provided]'}`, 10, false, 10);
    draw(`Executor: ${fieldValues.executorName || ''}`, 10, false, 10);
    draw(`Independent Administration: ${fieldValues.independentAdministration ? 'Yes' : 'No'}`, 10, false, 10);
    y -= 10;
    draw('ESTATE VALUE', 11, true);
    draw(`Estimated Value: $${fieldValues.estimatedEstateValue || '0.00'}`, 10, false, 10);
    y -= 15;
    draw('Note: Upload the official TX-1 template for field-level auto-fill.', 8);
    return await doc.save();
}
async function buildFallbackTX2(fieldValues) {
    const doc = await PDFDocument.create();
    const page = doc.addPage([612, 792]);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
    let y = page.getSize().height - 50;
    const draw = (text, size = 10, bold = false, indent = 0) => {
        page.drawText(text, { x: 50 + indent, y, size, font: bold ? fontBold : fontRegular });
        y -= size + 6;
    };
    draw('APPLICATION FOR LETTERS OF ADMINISTRATION (TX-2)', 15, true);
    y -= 4;
    draw(`Probate Court County: ${fieldValues.courtCounty || '[County]'}`, 10);
    draw(`Estate of: ${fieldValues.decedentName || '[Decedent Name]'}`, 12, true);
    draw(`Date of Death: ${fieldValues.dateOfDeath || '[Date]'}`, 10);
    y -= 10;
    draw('ADMINISTRATOR', 11, true);
    draw(`Proposed Administrator: ${fieldValues.administratorName || ''}`, 10, false, 10);
    draw(`Applicant: ${fieldValues.applicantName || ''}`, 10, false, 10);
    y -= 10;
    draw('HEIRS', 11, true);
    draw(fieldValues.heirSummary || 'Heir summary not provided.', 9, false, 10);
    y -= 10;
    draw('Note: Upload the official TX-2 template for field-level auto-fill.', 8);
    return await doc.save();
}
async function buildFallbackTX3(fieldValues) {
    const doc = await PDFDocument.create();
    const page = doc.addPage([612, 792]);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
    let y = page.getSize().height - 50;
    const draw = (text, size = 10, bold = false, indent = 0) => {
        page.drawText(text, { x: 50 + indent, y, size, font: bold ? fontBold : fontRegular });
        y -= size + 6;
    };
    draw('APPLICATION FOR INDEPENDENT ADMINISTRATION (TX-3)', 14, true);
    y -= 4;
    draw(`Probate Court County: ${fieldValues.courtCounty || '[County]'}`, 10);
    draw(`Estate of: ${fieldValues.decedentName || '[Decedent Name]'}`, 12, true);
    draw(`Date of Death: ${fieldValues.dateOfDeath || '[Date]'}`, 10);
    y -= 10;
    draw('INDEPENDENT ADMINISTRATION', 11, true);
    draw(`Requested: ${fieldValues.independentAdministration ? 'Yes' : 'No'}`, 10, false, 10);
    draw(`Will Date: ${fieldValues.willDate || '[Not Provided]'}`, 10, false, 10);
    draw(`Executor: ${fieldValues.executorName || ''}`, 10, false, 10);
    y -= 10;
    draw('Note: Upload the official TX-3 template for field-level auto-fill.', 8);
    return await doc.save();
}
async function buildFallbackTX7(fieldValues, assets) {
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
    draw('INVENTORY, APPRAISEMENT AND LIST OF CLAIMS (TX-7)', 14, true);
    y -= 4;
    draw(`Probate Court County: ${fieldValues.courtCounty || '[County]'}`, 10);
    draw(`Estate of: ${fieldValues.decedentName || '[Decedent Name]'}`, 12, true);
    draw(`Inventory Date: ${fieldValues.inventoryDate || ''}`, 10);
    y -= 8;
    draw('SUMMARY', 11, true);
    draw(`Real Property: $${fieldValues.totalRealProperty || '0.00'}`, 10, false, 10);
    draw(`Personal Property: $${fieldValues.totalPersonalProperty || '0.00'}`, 10, false, 10);
    draw(`Total Estate Value: $${fieldValues.totalEstateValue || '0.00'}`, 10, false, 10);
    draw(`Claims Owed: $${fieldValues.claimsOwed || '0.00'}`, 10, false, 10);
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
    draw('Note: Upload the official TX-7 template for field-level auto-fill.', 8);
    return await doc.save();
}
async function buildFallbackTX9(fieldValues) {
    const doc = await PDFDocument.create();
    const page = doc.addPage([612, 792]);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
    let y = page.getSize().height - 50;
    const draw = (text, size = 10, bold = false, indent = 0) => {
        page.drawText(text, { x: 50 + indent, y, size, font: bold ? fontBold : fontRegular });
        y -= size + 6;
    };
    draw('APPLICATION TO CLOSE ESTATE (TX-9)', 15, true);
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
    draw('Note: Upload the official TX-9 template for field-level auto-fill.', 8);
    return await doc.save();
}
async function buildFallbackTX11(fieldValues) {
    const doc = await PDFDocument.create();
    const page = doc.addPage([612, 792]);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
    let y = page.getSize().height - 50;
    const draw = (text, size = 10, bold = false, indent = 0) => {
        page.drawText(text, { x: 50 + indent, y, size, font: bold ? fontBold : fontRegular });
        y -= size + 6;
    };
    draw('SMALL ESTATE AFFIDAVIT (TX-11)', 15, true);
    draw('Texas Estates Code Chapter 205', 10, false, 10);
    y -= 4;
    draw(`Probate Court County: ${fieldValues.courtCounty || '[County]'}`, 10);
    draw(`Estate of: ${fieldValues.decedentName || '[Decedent Name]'}`, 12, true);
    draw(`Date of Death: ${fieldValues.dateOfDeath || '[Date]'}`, 10);
    y -= 10;
    draw('SMALL ESTATE', 11, true);
    draw(`Estate Value: $${fieldValues.smallEstateValue || '0.00'}`, 10, false, 10);
    y -= 8;
    draw('HEIRS', 11, true);
    draw(fieldValues.heirSummary || 'Heir summary not provided.', 9, false, 10);
    y -= 10;
    draw('Note: Upload the official TX-11 template for field-level auto-fill.', 8);
    return await doc.save();
}
async function buildFallbackTX12(fieldValues) {
    const doc = await PDFDocument.create();
    const page = doc.addPage([612, 792]);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
    let y = page.getSize().height - 50;
    const draw = (text, size = 10, bold = false, indent = 0) => {
        page.drawText(text, { x: 50 + indent, y, size, font: bold ? fontBold : fontRegular });
        y -= size + 6;
    };
    draw('APPLICATION FOR MUNIMENT OF TITLE (TX-12)', 14, true);
    draw('Texas Estates Code Chapter 257', 10, false, 10);
    y -= 4;
    draw(`Probate Court County: ${fieldValues.courtCounty || '[County]'}`, 10);
    draw(`Estate of: ${fieldValues.decedentName || '[Decedent Name]'}`, 12, true);
    draw(`Date of Death: ${fieldValues.dateOfDeath || '[Date]'}`, 10);
    y -= 10;
    draw('WILL', 11, true);
    draw(`Will Date: ${fieldValues.willDate || '[Not Provided]'}`, 10, false, 10);
    draw(`Executor: ${fieldValues.executorName || ''}`, 10, false, 10);
    y -= 8;
    draw('PROPERTY', 11, true);
    draw(fieldValues.propertyDescription || 'Property description required.', 9, false, 10);
    y -= 10;
    draw('Note: Upload the official TX-12 template for field-level auto-fill.', 8);
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
export const TXFormService = {
    resolveFields(input) {
        const registry = TX_FORM_REGISTRY[input.formId];
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
        const validationErrors = validateTXFormData(input.formId, {
            ...Object.fromEntries(Object.entries(input.estate).filter(([, v]) => v !== undefined)),
            ...input.overrides,
        });
        return { fieldValues, validationErrors };
    },
    async generate(input) {
        const registry = TX_FORM_REGISTRY[input.formId];
        if (!registry) {
            throw new Error(`Unknown TX form: ${input.formId}`);
        }
        const { fieldValues, validationErrors } = this.resolveFields(input);
        let pdfBytes;
        const dbTemplate = await prisma.formTemplate.findUnique({
            where: { name: input.formId },
        }).catch(() => null);
        const templateBytes = dbTemplate ? Buffer.from(dbTemplate.data) : null;
        if (templateBytes) {
            logger.info(`[TXFormService] Using template from DB for ${input.formId}`);
            pdfBytes = await fillTemplateFields(templateBytes, fieldValues, registry);
        }
        else {
            logger.warn(`[TXFormService] No template found for ${input.formId}, using fallback builder`);
            switch (input.formId) {
                case 'TX-1':
                    pdfBytes = await buildFallbackTX1(fieldValues);
                    break;
                case 'TX-2':
                    pdfBytes = await buildFallbackTX2(fieldValues);
                    break;
                case 'TX-3':
                    pdfBytes = await buildFallbackTX3(fieldValues);
                    break;
                case 'TX-4':
                    pdfBytes = await buildFallbackTX4(fieldValues);
                    break;
                case 'TX-5':
                    pdfBytes = await buildFallbackTX5(fieldValues);
                    break;
                case 'TX-6':
                    pdfBytes = await buildFallbackTX6(fieldValues);
                    break;
                case 'TX-7':
                    pdfBytes = await buildFallbackTX7(fieldValues, input.assets || []);
                    break;
                case 'TX-8':
                    pdfBytes = await buildFallbackTX8(fieldValues);
                    break;
                case 'TX-9':
                    pdfBytes = await buildFallbackTX9(fieldValues);
                    break;
                case 'TX-10':
                    pdfBytes = await buildFallbackTX10(fieldValues);
                    break;
                case 'TX-11':
                    pdfBytes = await buildFallbackTX11(fieldValues);
                    break;
                case 'TX-12':
                    pdfBytes = await buildFallbackTX12(fieldValues);
                    break;
                default:
                    throw new Error(`No fallback builder for ${input.formId}`);
            }
        }
        return { pdfBytes, fieldValues, validationErrors };
    },
    getUISchema(formId) {
        const registry = TX_FORM_REGISTRY[formId];
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
async function buildFallbackTX4(fieldValues) {
    const doc = await PDFDocument.create();
    const page = doc.addPage([612, 792]);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
    let y = page.getSize().height - 50;
    const draw = (text, size = 10, bold = false, indent = 0) => {
        page.drawText(text, { x: 50 + indent, y, size, font: bold ? fontBold : fontRegular });
        y -= size + 6;
    };
    draw('ORDER ADMITTING WILL TO PROBATE (TX-4)', 15, true);
    y -= 4;
    draw(`Probate Court County: ${fieldValues.courtCounty || '[County]'}`, 10);
    draw(`Estate of: ${fieldValues.decedentName || '[Decedent Name]'}`, 12, true);
    draw(`Date of Death: ${fieldValues.dateOfDeath || '[Date]'}`, 10);
    y -= 10;
    draw('ORDER', 11, true);
    draw(`Order Date: ${fieldValues.orderDate || ''}`, 10, false, 10);
    draw(`Executor: ${fieldValues.executorName || ''}`, 10, false, 10);
    y -= 10;
    draw('Note: Upload the official TX-4 template for field-level auto-fill.', 8);
    return await doc.save();
}
async function buildFallbackTX5(fieldValues) {
    const doc = await PDFDocument.create();
    const page = doc.addPage([612, 792]);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
    let y = page.getSize().height - 50;
    const draw = (text, size = 10, bold = false, indent = 0) => {
        page.drawText(text, { x: 50 + indent, y, size, font: bold ? fontBold : fontRegular });
        y -= size + 6;
    };
    draw('LETTERS TESTAMENTARY (TX-5)', 15, true);
    y -= 4;
    draw(`Probate Court County: ${fieldValues.courtCounty || '[County]'}`, 10);
    draw(`Estate of: ${fieldValues.decedentName || '[Decedent Name]'}`, 12, true);
    draw(`Date of Death: ${fieldValues.dateOfDeath || '[Date]'}`, 10);
    y -= 10;
    draw('AUTHORITY', 11, true);
    draw(`Executor: ${fieldValues.executorName || ''}`, 10, false, 10);
    y -= 10;
    draw('Note: Upload the official TX-5 template for field-level auto-fill.', 8);
    return await doc.save();
}
async function buildFallbackTX6(fieldValues) {
    const doc = await PDFDocument.create();
    const page = doc.addPage([612, 792]);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
    let y = page.getSize().height - 50;
    const draw = (text, size = 10, bold = false, indent = 0) => {
        page.drawText(text, { x: 50 + indent, y, size, font: bold ? fontBold : fontRegular });
        y -= size + 6;
    };
    draw('LETTERS OF ADMINISTRATION (TX-6)', 15, true);
    y -= 4;
    draw(`Probate Court County: ${fieldValues.courtCounty || '[County]'}`, 10);
    draw(`Estate of: ${fieldValues.decedentName || '[Decedent Name]'}`, 12, true);
    draw(`Date of Death: ${fieldValues.dateOfDeath || '[Date]'}`, 10);
    y -= 10;
    draw('AUTHORITY', 11, true);
    draw(`Administrator: ${fieldValues.administratorName || ''}`, 10, false, 10);
    y -= 10;
    draw('Note: Upload the official TX-6 template for field-level auto-fill.', 8);
    return await doc.save();
}
async function buildFallbackTX8(fieldValues) {
    const doc = await PDFDocument.create();
    const page = doc.addPage([612, 792]);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
    let y = page.getSize().height - 50;
    const draw = (text, size = 10, bold = false, indent = 0) => {
        page.drawText(text, { x: 50 + indent, y, size, font: bold ? fontBold : fontRegular });
        y -= size + 6;
    };
    draw('ANNUAL ACCOUNT (TX-8)', 15, true);
    y -= 4;
    draw(`Probate Court County: ${fieldValues.courtCounty || '[County]'}`, 10);
    draw(`Estate of: ${fieldValues.decedentName || '[Decedent Name]'}`, 12, true);
    y -= 10;
    draw('ACCOUNT PERIOD', 11, true);
    draw(`Start: ${fieldValues.accountPeriodStart || '[Date]'}`, 10, false, 10);
    draw(`End: ${fieldValues.accountPeriodEnd || '[Date]'}`, 10, false, 10);
    y -= 8;
    draw('SUMMARY', 11, true);
    draw(`Total Receipts: $${fieldValues.totalReceipts || '0.00'}`, 10, false, 10);
    draw(`Total Disbursements: $${fieldValues.totalDisbursements || '0.00'}`, 10, false, 10);
    draw(`Net Balance: $${fieldValues.netBalance || '0.00'}`, 10, false, 10);
    y -= 10;
    draw('Note: Upload the official TX-8 template for field-level auto-fill.', 8);
    return await doc.save();
}
async function buildFallbackTX10(fieldValues) {
    const doc = await PDFDocument.create();
    const page = doc.addPage([612, 792]);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
    let y = page.getSize().height - 50;
    const draw = (text, size = 10, bold = false, indent = 0) => {
        page.drawText(text, { x: 50 + indent, y, size, font: bold ? fontBold : fontRegular });
        y -= size + 6;
    };
    draw('FINAL ACCOUNT (TX-10)', 15, true);
    y -= 4;
    draw(`Probate Court County: ${fieldValues.courtCounty || '[County]'}`, 10);
    draw(`Estate of: ${fieldValues.decedentName || '[Decedent Name]'}`, 12, true);
    y -= 10;
    draw('ACCOUNT PERIOD', 11, true);
    draw(`Start: ${fieldValues.accountPeriodStart || '[Date]'}`, 10, false, 10);
    draw(`End: ${fieldValues.accountPeriodEnd || '[Date]'}`, 10, false, 10);
    y -= 8;
    draw('FINAL SUMMARY', 11, true);
    draw(`Total Receipts: $${fieldValues.totalReceipts || '0.00'}`, 10, false, 10);
    draw(`Total Disbursements: $${fieldValues.totalDisbursements || '0.00'}`, 10, false, 10);
    draw(`Final Balance: $${fieldValues.finalBalance || '0.00'}`, 10, false, 10);
    y -= 10;
    draw('Note: Upload the official TX-10 template for field-level auto-fill.', 8);
    return await doc.save();
}
