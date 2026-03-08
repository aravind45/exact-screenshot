/**
 * CAFormService
 *
 * Generation pipeline for California Judicial Council probate forms.
 * Handles field extraction, value resolution, formatting and PDF output
 * for DE-111, DE-160, and DE-310.
 */
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { prisma } from '../db.js';
import { FeeService } from './feeService.js';
import { logger } from '../lib/logger.js';
import fs from 'fs';
import path from 'path';
import { CA_FORM_REGISTRY, validateCAFormData, } from './caFormRegistry.js';
// ─── Value Transforms ─────────────────────────────────────────────────────────
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
        case 'uppercase': return String(value || '').toUpperCase();
        case 'formatDate': return formatDate(value);
        case 'formatCurrency': return formatCurrency(value);
        case 'formatPhone': return formatPhone(value);
        default: return String(value || '');
    }
}
function sanitizePdfText(value) {
    if (value === null || value === undefined)
        return '';
    return String(value)
        .replace(/\u00A0/g, ' ')
        .replace(/[–—]/g, '-')
        .replace(/[“”]/g, '"')
        .replace(/[‘’]/g, "'")
        .replace(/…/g, '...')
        .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, '');
}
// ─── Value Resolution ─────────────────────────────────────────────────────────
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
    const { estate, assets = [], overrides = {} } = input;
    switch (key) {
        case 'decedentName':
            return `${estate.deceasedFirstName || ''} ${estate.deceasedLastName || ''}`.trim();
        case 'checkLettersTestamentary':
            return estate.hasWill === true;
        case 'checkLettersAdministration':
            return estate.hasWill !== true;
        case 'checkInventoryFinal':
            return (overrides.inventoryType || 'FINAL') === 'FINAL';
        case 'checkInventoryPartial':
            return overrides.inventoryType === 'PARTIAL';
        case 'checkInventorySupplemental':
            return overrides.inventoryType === 'SUPPLEMENTAL';
        case 'totalAttachment1': {
            const realAssets = assets.filter((a) => a.inventoryCategory === 'ATTACHMENT_1');
            return realAssets.reduce((sum, a) => sum + Number(a.inventoryValue || a.value || 0), 0);
        }
        case 'totalAttachment2': {
            const personalAssets = assets.filter((a) => a.inventoryCategory === 'ATTACHMENT_2');
            return personalAssets.reduce((sum, a) => sum + Number(a.inventoryValue || a.value || 0), 0);
        }
        case 'totalInventory':
        case 'totalInventoryValue': {
            return assets.reduce((sum, a) => sum + Number(a.inventoryValue || a.value || 0), 0);
        }
        case 'statutoryFee': {
            const total = assets.reduce((sum, a) => sum + Number(a.inventoryValue || a.value || 0), 0);
            return FeeService.calculateStatutoryFee(total);
        }
        case 'appraisalDate':
            return new Date();
        default:
            return undefined;
    }
}
// ─── Fallback PDF Builder ─────────────────────────────────────────────────────
async function buildFallbackDE111(fieldValues) {
    const doc = await PDFDocument.create();
    const page = doc.addPage([612, 792]);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
    const { height } = page.getSize();
    let y = height - 50;
    const draw = (text, size = 10, bold = false, indent = 0) => {
        page.drawText(sanitizePdfText(text), { x: 50 + indent, y, size, font: bold ? fontBold : fontRegular });
        y -= size + 5;
    };
    draw('PETITION FOR PROBATE (DE-111)', 16, true);
    y -= 10;
    draw(`Superior Court of California, County of: ${fieldValues.courtCounty || '[County]'}`, 10);
    draw(`ESTATE OF: ${fieldValues.decedentName || '[Decedent Name]'}`, 12, true);
    draw(`Case Number: ${fieldValues.caseNumber || 'PENDING'}`, 10);
    y -= 15;
    draw('PETITIONER INFORMATION', 11, true);
    draw(`Name: ${fieldValues.petitionerName || ''}`, 10, false, 10);
    draw(`Phone: ${fieldValues.petitionerPhone || ''}`, 10, false, 10);
    y -= 10;
    draw('DECEDENT INFORMATION', 11, true);
    draw(`Date of Death: ${fieldValues.dateOfDeath || '[Date]'}`, 10, false, 10);
    y -= 10;
    draw('ESTATE VALUES', 11, true);
    draw(`Personal Property:  $${fieldValues.valuePersonalProperty || '0.00'}`, 10, false, 10);
    draw(`Real Property:      $${fieldValues.valueRealProperty || '0.00'}`, 10, false, 10);
    draw(`Annual Income:      $${fieldValues.valueAnnualIncome || '0.00'}`, 10, false, 10);
    const total = (Number(String(fieldValues.valuePersonalProperty || '0').replace(/,/g, '')) +
        Number(String(fieldValues.valueRealProperty || '0').replace(/,/g, '')) +
        Number(String(fieldValues.valueAnnualIncome || '0').replace(/,/g, '')));
    draw(`TOTAL:              $${formatCurrency(total)}`, 10, true, 10);
    y -= 10;
    draw('PETITION TYPE', 11, true);
    draw(`[${fieldValues.checkProbateOfWill ? 'X' : ' '}] Probate of Will`, 10, false, 10);
    draw(`[${fieldValues.checkLettersTestamentary ? 'X' : ' '}] Letters Testamentary`, 10, false, 10);
    draw(`[${fieldValues.checkLettersAdministration ? 'X' : ' '}] Letters of Administration`, 10, false, 10);
    y -= 10;
    draw('BOND', 11, true);
    draw(`[${fieldValues.bondWaived ? 'X' : ' '}] Bond Waived`, 10, false, 10);
    if (!fieldValues.bondWaived && fieldValues.bondAmount) {
        draw(`Bond Amount: $${fieldValues.bondAmount}`, 10, false, 10);
    }
    y -= 20;
    draw('Note: Upload the official DE-111 PDF template via Admin -> Templates for', 8, false);
    draw('field-level auto-fill. This is a structured draft for review.', 8, false);
    return await doc.save();
}
async function buildFallbackDE160(fieldValues, assets) {
    const doc = await PDFDocument.create();
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
    const addPage = () => {
        const p = doc.addPage([612, 792]);
        return { page: p, y: p.getSize().height - 50 };
    };
    let { page, y } = addPage();
    const draw = (text, size = 10, bold = false, indent = 0, curY) => {
        const usePage = page;
        const useY = curY !== undefined ? curY : y;
        usePage.drawText(sanitizePdfText(text), { x: 50 + indent, y: useY, size, font: bold ? fontBold : fontRegular });
        if (curY === undefined)
            y -= size + 5;
    };
    draw('INVENTORY AND APPRAISAL (DE-160)', 16, true);
    y -= 5;
    draw(`Superior Court of California, County of: ${fieldValues.courtCounty || '[County]'}`, 10);
    draw(`ESTATE OF: ${fieldValues.decedentName || '[Decedent Name]'}`, 12, true);
    draw(`Case Number: ${fieldValues.caseNumber || 'PENDING'}`, 10);
    y -= 10;
    const invType = fieldValues.inventoryType || 'FINAL';
    draw(`[${invType === 'FINAL' ? 'X' : ' '}] Final Inventory`, 10, false, 10);
    draw(`[${invType === 'PARTIAL' ? 'X' : ' '}] Partial Inventory`, 10, false, 10);
    draw(`[${invType === 'SUPPLEMENTAL' ? 'X' : ' '}] Supplemental Inventory`, 10, false, 10);
    y -= 15;
    draw('SUMMARY', 12, true);
    draw(`1. Real Property (Attachment 1):     $${fieldValues.totalAttachment1 || '0.00'}`, 10, false, 10);
    draw(`2. Personal Property (Attachment 2): $${fieldValues.totalAttachment2 || '0.00'}`, 10, false, 10);
    draw(`TOTAL INVENTORY VALUE:               $${fieldValues.totalInventory || '0.00'}`, 11, true, 10);
    y -= 20;
    const realAssets = assets.filter((a) => a.inventoryCategory === 'ATTACHMENT_1');
    const personalAssets = assets.filter((a) => a.inventoryCategory === 'ATTACHMENT_2');
    const otherAssets = assets.filter((a) => !['ATTACHMENT_1', 'ATTACHMENT_2'].includes(a.inventoryCategory));
    const drawAssetSection = (title, sectionAssets) => {
        if (sectionAssets.length === 0)
            return;
        if (y < 100) {
            const np = addPage();
            page = np.page;
            y = np.y;
        }
        draw(title, 11, true);
        sectionAssets.forEach((a) => {
            if (y < 60) {
                const np = addPage();
                page = np.page;
                y = np.y;
            }
            const desc = `  ${String(a.institution || 'Unknown')} – ${String(a.assetType || 'Asset')}`;
            const val = `$${formatCurrency(Number(a.inventoryValue || a.value || 0))}`;
            draw(desc.substring(0, 70), 9, false, 10);
            draw(val, 9, false, 0, y + 9 + 5);
        });
        y -= 10;
    };
    drawAssetSection('Attachment 1: Real Property', realAssets);
    drawAssetSection('Attachment 2: Personal Property', personalAssets);
    drawAssetSection('Unclassified Assets', otherAssets);
    return await doc.save();
}
async function buildFallbackDE310(fieldValues, assets) {
    const doc = await PDFDocument.create();
    const page = doc.addPage([612, 792]);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
    const { height } = page.getSize();
    let y = height - 50;
    const draw = (text, size = 10, bold = false, indent = 0) => {
        page.drawText(sanitizePdfText(text), { x: 50 + indent, y, size, font: bold ? fontBold : fontRegular });
        y -= size + 5;
    };
    draw('PETITION TO DETERMINE SUCCESSION TO REAL PROPERTY (DE-310)', 13, true);
    y -= 5;
    draw(`Superior Court of California, County of: ${fieldValues.courtCounty || '[County]'}`, 10);
    draw(`ESTATE OF: ${fieldValues.decedentName || '[Decedent Name]'}`, 12, true);
    draw(`Case Number: ${fieldValues.caseNumber || 'PENDING'}`, 10);
    y -= 15;
    draw('1. CHARACTER OF PROPERTY', 11, true);
    draw(`Total Inventory Value: $${fieldValues.totalInventoryValue || '0.00'}`, 10, false, 15);
    y -= 10;
    draw('2. STATUTORY FEES (CA Probate Code § 10800)', 11, true);
    draw(`Calculated Fee: $${fieldValues.statutoryFee || '0.00'}`, 10, false, 15);
    draw(`Executor Commission: $${fieldValues.statutoryFee || '0.00'}`, 10, false, 15);
    draw(`Attorney Fees: $${fieldValues.statutoryFee || '0.00'}`, 10, false, 15);
    y -= 10;
    draw('3. PETITIONER INFORMATION', 11, true);
    draw(`Petitioner: ${fieldValues.petitionerName || ''}`, 10, false, 15);
    draw(`Date of Death: ${fieldValues.dateOfDeath || '[Date]'}`, 10, false, 15);
    y -= 10;
    draw('4. DESCRIPTION OF REAL PROPERTY', 11, true);
    draw(fieldValues.realPropertyDescription || '[Real Property Legal Description Required]', 10, false, 15);
    if (fieldValues.realPropertyValue) {
        draw(`Appraised Value: $${fieldValues.realPropertyValue}`, 10, false, 15);
    }
    y -= 10;
    if (fieldValues.successionBasis) {
        draw('5. BASIS FOR SUCCESSION', 11, true);
        draw(fieldValues.successionBasis, 10, false, 15);
        y -= 10;
    }
    y -= 20;
    draw(`Date: ${new Date().toLocaleDateString()}`, 10);
    y -= 30;
    draw('___________________________________________________', 10);
    y -= 15;
    draw(`${fieldValues.petitionerName || 'Petitioner'}`, 10);
    draw('Personal Representative', 9);
    return await doc.save();
}
// ─── Template-based fill ──────────────────────────────────────────────────────
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
        const safeRendered = sanitizePdfText(rendered);
        if (def.pdfFieldName && fieldNames.has(def.pdfFieldName)) {
            try {
                if (def.type === 'checkbox') {
                    const cb = form.getCheckBox(def.pdfFieldName);
                    rawValue ? cb.check() : cb.uncheck();
                }
                else {
                    const tf = form.getTextField(def.pdfFieldName);
                    tf.setText(safeRendered);
                }
            }
            catch {
                // AcroForm field unavailable — fall through to overlay
            }
        }
        if (def.coord) {
            const pageIdx = def.coord.page || 0;
            if (pageIdx < pages.length) {
                if (def.type !== 'checkbox') {
                    pages[pageIdx].drawText(safeRendered, {
                        x: def.coord.x,
                        y: def.coord.y,
                        size: def.coord.size || 10,
                        font: def.coord.bold ? fontBold : font,
                        color: rgb(0, 0, 0),
                    });
                }
                else if (rawValue) {
                    pages[pageIdx].drawText('X', {
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
        // Not all PDFs support flattening
    }
    return await pdfDoc.save();
}
// ─── Public API ───────────────────────────────────────────────────────────────
export const CAFormService = {
    /**
     * Resolves all field values for a given form from estate data + overrides.
     * Returns both the resolved map and validation errors.
     */
    resolveFields(input) {
        const registry = CA_FORM_REGISTRY[input.formId];
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
        const validationErrors = validateCAFormData(input.formId, {
            ...Object.fromEntries(Object.entries(input.estate).filter(([, v]) => v !== undefined)),
            ...input.overrides,
        });
        return { fieldValues, validationErrors };
    },
    /**
     * Generates a filled PDF for the given CA form.
     * Falls back to a structured text layout if no template exists.
     */
    async generate(input) {
        const registry = CA_FORM_REGISTRY[input.formId];
        if (!registry) {
            throw new Error(`Unknown CA form: ${input.formId}`);
        }
        const { fieldValues, validationErrors } = this.resolveFields(input);
        let pdfBytes;
        const dbTemplate = await prisma.formTemplate.findUnique({
            where: { name: input.formId },
        }).catch(() => null);
        const localTemplatePath = path.join(process.cwd(), 'server', 'templates', `${input.formId}.pdf`);
        const localTemplateBytes = fs.existsSync(localTemplatePath) ? fs.readFileSync(localTemplatePath) : null;
        const templateCandidates = [];
        if (dbTemplate) {
            templateCandidates.push({ source: 'DB', bytes: Buffer.from(dbTemplate.data) });
        }
        if (localTemplateBytes) {
            templateCandidates.push({ source: 'filesystem', bytes: localTemplateBytes });
            logger.info(`[CAFormService] Using local template file for ${input.formId}`);
        }
        let templateFillError = null;
        for (const candidate of templateCandidates) {
            try {
                logger.info(`[CAFormService] Using template from ${candidate.source} for ${input.formId}`);
                pdfBytes = await fillTemplateFields(candidate.bytes, fieldValues, registry);
                templateFillError = null;
                break;
            }
            catch (error) {
                templateFillError = error;
                logger.warn(`[CAFormService] Template fill failed from ${candidate.source} for ${input.formId}: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        if (!pdfBytes) {
            if (templateFillError) {
                logger.warn(`[CAFormService] Falling back to structured builder for ${input.formId} after template parse failures`);
            }
            logger.warn(`[CAFormService] No usable template found for ${input.formId}, using fallback builder`);
            switch (input.formId) {
                case 'DE-111':
                    pdfBytes = await buildFallbackDE111(fieldValues);
                    break;
                case 'DE-160':
                    pdfBytes = await buildFallbackDE160(fieldValues, input.assets || []);
                    break;
                case 'DE-310':
                    pdfBytes = await buildFallbackDE310(fieldValues, input.assets || []);
                    break;
                default:
                    throw new Error(`No fallback builder for ${input.formId}`);
            }
        }
        return { pdfBytes, fieldValues, validationErrors };
    },
    /**
     * Returns a field schema suitable for the UI override form.
     * Strips computed fields and coordinates.
     */
    getUISchema(formId) {
        const registry = CA_FORM_REGISTRY[formId];
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
