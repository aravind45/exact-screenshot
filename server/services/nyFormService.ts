/**
 * NYFormService
 *
 * Generation pipeline for New York Surrogate's Court probate forms.
 * Handles field extraction, value resolution, formatting and PDF output
 * for ET-1, ET-2, ET-3, ET-8, and ET-13.
 */

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { prisma } from '../db.js';
import { logger } from '../lib/logger.js';
import {
    NY_FORM_REGISTRY,
    NYFormId,
    NYFormFieldMap,
    NYFieldDefinition,
    validateNYFormData,
} from './nyFormRegistry.js';

export interface NYFormInput {
    formId: NYFormId;
    estate: any;
    assets?: any[];
    heirs?: any[];
    overrides?: Record<string, any>;
}

export interface NYFormResult {
    pdfBytes: Uint8Array;
    fieldValues: Record<string, any>;
    validationErrors: string[];
}

function formatDate(value: any): string {
    if (!value) return '';
    try {
        return new Date(value).toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    } catch {
        return String(value);
    }
}

function formatCurrency(value: any): string {
    const num = Number(value);
    if (isNaN(num)) return '0.00';
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatPhone(value: any): string {
    if (!value) return '';
    const digits = String(value).replace(/\D/g, '');
    if (digits.length === 10) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return String(value);
}

function applyTransform(value: any, transform?: string): string {
    if (!transform) return value === null || value === undefined ? '' : String(value);
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

function getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

function resolveFieldValue(
    key: string,
    def: NYFieldDefinition,
    input: NYFormInput,
): any {
    const { estate, assets = [], heirs = [], overrides = {} } = input;

    if (overrides[key] !== undefined) return overrides[key];

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

function resolveComputed(key: string, input: NYFormInput): any {
    const { estate, assets = [], heirs = [] } = input;

    switch (key) {
        case 'decedentName':
            return `${estate.deceasedFirstName || ''} ${estate.deceasedLastName || ''}`.trim();

        case 'executorName':
        case 'administratorName':
        case 'inventoryPreparedBy':
        case 'ancillaryExecutor':
            return estate.user?.fullName || '';

        case 'estimatedEstateValue': {
            const personal = Number(estate.estimatedPersonalProperty || 0);
            const real = Number(estate.estimatedRealProperty || 0);
            return personal + real;
        }

        case 'totalRealProperty': {
            const realAssets = assets.filter((a: any) => a.inventoryCategory === 'ATTACHMENT_1');
            return realAssets.reduce((sum: number, a: any) => sum + Number(a.inventoryValue || a.value || 0), 0);
        }

        case 'totalPersonalProperty': {
            const personalAssets = assets.filter((a: any) => a.inventoryCategory !== 'ATTACHMENT_1');
            return personalAssets.reduce((sum: number, a: any) => sum + Number(a.inventoryValue || a.value || 0), 0);
        }

        case 'totalEstateValue': {
            return assets.reduce((sum: number, a: any) => sum + Number(a.inventoryValue || a.value || 0), 0);
        }

        case 'inventoryDate':
            return new Date();

        case 'heirSummary':
            return heirs.length
                ? heirs.map((h: any) => `${h.name} (${h.relationship})`).join('; ')
                : '';

        default:
            return undefined;
    }
}

async function buildFallbackET1(fieldValues: Record<string, any>): Promise<Uint8Array> {
    const doc = await PDFDocument.create();
    const page = doc.addPage([612, 792]);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
    const { height } = page.getSize();
    let y = height - 50;

    const draw = (text: string, size = 10, bold = false, indent = 0) => {
        page.drawText(text, { x: 50 + indent, y, size, font: bold ? fontBold : fontRegular });
        y -= size + 6;
    };

    draw("PETITION FOR PROBATE (ET-1)", 16, true);
    y -= 4;
    draw(`Surrogate's Court County: ${fieldValues.courtCounty || '[County]'}`, 10);
    draw(`Estate of: ${fieldValues.decedentName || '[Decedent Name]'}`, 12, true);
    draw(`Date of Death: ${fieldValues.dateOfDeath || '[Date]'}`, 10);
    y -= 10;

    draw('PETITIONER', 11, true);
    draw(`Petitioner: ${fieldValues.petitionerName || ''}`, 10, false, 10);
    draw(`Address: ${fieldValues.petitionerAddress || ''}`, 10, false, 10);
    draw(`Phone: ${fieldValues.petitionerPhone || ''}`, 10, false, 10);
    y -= 10;

    draw('DOMICILE', 11, true);
    draw(`County: ${fieldValues.domicileCounty || ''}`, 10, false, 10);
    draw(`State: ${fieldValues.domicileState || ''}`, 10, false, 10);
    y -= 10;

    draw('WILL', 11, true);
    draw(`Will Date: ${fieldValues.willDate || '[Not Provided]'}`, 10, false, 10);
    draw(`Executor: ${fieldValues.executorName || ''}`, 10, false, 10);
    y -= 10;

    draw('ESTATE VALUE', 11, true);
    draw(`Estimated Value: $${fieldValues.estimatedEstateValue || '0.00'}`, 10, false, 10);
    y -= 15;

    draw('Note: Upload the official ET-1 template for field-level auto-fill.', 8);

    return await doc.save();
}

async function buildFallbackET2(fieldValues: Record<string, any>): Promise<Uint8Array> {
    const doc = await PDFDocument.create();
    const page = doc.addPage([612, 792]);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
    let y = page.getSize().height - 50;

    const draw = (text: string, size = 10, bold = false, indent = 0) => {
        page.drawText(text, { x: 50 + indent, y, size, font: bold ? fontBold : fontRegular });
        y -= size + 6;
    };

    draw('PETITION FOR ADMINISTRATION (ET-2)', 16, true);
    y -= 4;
    draw(`Surrogate's Court County: ${fieldValues.courtCounty || '[County]'}`, 10);
    draw(`Estate of: ${fieldValues.decedentName || '[Decedent Name]'}`, 12, true);
    draw(`Date of Death: ${fieldValues.dateOfDeath || '[Date]'}`, 10);
    y -= 10;

    draw('ADMINISTRATOR', 11, true);
    draw(`Proposed Administrator: ${fieldValues.administratorName || ''}`, 10, false, 10);
    draw(`Petitioner: ${fieldValues.petitionerName || ''}`, 10, false, 10);
    y -= 10;

    draw('DOMICILE', 11, true);
    draw(`County: ${fieldValues.domicileCounty || ''}`, 10, false, 10);
    draw(`State: ${fieldValues.domicileState || ''}`, 10, false, 10);
    y -= 10;

    draw('HEIRS', 11, true);
    draw(fieldValues.heirSummary || 'Heir summary not provided.', 9, false, 10);
    y -= 10;

    draw('Note: Upload the official ET-2 template for field-level auto-fill.', 8);

    return await doc.save();
}

async function buildFallbackET3(fieldValues: Record<string, any>): Promise<Uint8Array> {
    const doc = await PDFDocument.create();
    const page = doc.addPage([612, 792]);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
    let y = page.getSize().height - 50;

    const draw = (text: string, size = 10, bold = false, indent = 0) => {
        page.drawText(text, { x: 50 + indent, y, size, font: bold ? fontBold : fontRegular });
        y -= size + 6;
    };

    draw('PETITION FOR ANCILLARY PROBATE (ET-3)', 15, true);
    y -= 4;
    draw(`Surrogate's Court County: ${fieldValues.courtCounty || '[County]'}`, 10);
    draw(`Estate of: ${fieldValues.decedentName || '[Decedent Name]'}`, 12, true);
    draw(`Date of Death: ${fieldValues.dateOfDeath || '[Date]'}`, 10);
    y -= 10;

    draw('FOREIGN PROBATE', 11, true);
    draw(`Original State: ${fieldValues.foreignWillState || ''}`, 10, false, 10);
    draw(`Foreign Case #: ${fieldValues.foreignCaseNumber || ''}`, 10, false, 10);
    draw(`Ancillary Executor: ${fieldValues.ancillaryExecutor || ''}`, 10, false, 10);
    y -= 10;

    draw('Note: Upload the official ET-3 template for field-level auto-fill.', 8);

    return await doc.save();
}

async function buildFallbackET8(fieldValues: Record<string, any>, assets: any[]): Promise<Uint8Array> {
    const doc = await PDFDocument.create();
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await doc.embedFont(StandardFonts.Helvetica);

    const addPage = () => {
        const p = doc.addPage([612, 792]);
        return { page: p, y: p.getSize().height - 50 };
    };

    let { page, y } = addPage();

    const draw = (text: string, size = 10, bold = false, indent = 0, curY?: number) => {
        const useY = curY !== undefined ? curY : y;
        page.drawText(text, { x: 50 + indent, y: useY, size, font: bold ? fontBold : fontRegular });
        if (curY === undefined) y -= size + 6;
    };

    draw('INVENTORY OF ASSETS (ET-8)', 15, true);
    y -= 4;
    draw(`Surrogate's Court County: ${fieldValues.courtCounty || '[County]'}`, 10);
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
        assets.slice(0, 15).forEach((asset: any) => {
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
    draw('Note: Upload the official ET-8 template for field-level auto-fill.', 8);

    return await doc.save();
}

async function buildFallbackET13(fieldValues: Record<string, any>): Promise<Uint8Array> {
    const doc = await PDFDocument.create();
    const page = doc.addPage([612, 792]);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
    let y = page.getSize().height - 50;

    const draw = (text: string, size = 10, bold = false, indent = 0) => {
        page.drawText(text, { x: 50 + indent, y, size, font: bold ? fontBold : fontRegular });
        y -= size + 6;
    };

    draw('PETITION FOR FINAL DISTRIBUTION (ET-13)', 14, true);
    y -= 4;
    draw(`Surrogate's Court County: ${fieldValues.courtCounty || '[County]'}`, 10);
    draw(`Estate of: ${fieldValues.decedentName || '[Decedent Name]'}`, 12, true);
    draw(`Date of Death: ${fieldValues.dateOfDeath || '[Date]'}`, 10);
    y -= 10;

    draw('DISTRIBUTION PLAN', 11, true);
    draw(`Proposed Date: ${fieldValues.distributionDate || '[Not Provided]'}`, 10, false, 10);
    draw(`Total Estate Value: $${fieldValues.totalEstateValue || '0.00'}`, 10, false, 10);
    draw(fieldValues.distributionPlan || 'Distribution plan summary required.', 9, false, 10);
    y -= 10;

    draw('Note: Upload the official ET-13 template for field-level auto-fill.', 8);

    return await doc.save();
}

async function fillTemplateFields(
    templateBytes: Buffer,
    fieldValues: Record<string, any>,
    registry: NYFormFieldMap,
): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(templateBytes, { ignoreEncryption: true });
    const form = pdfDoc.getForm();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();

    const fields = form.getFields();
    const fieldNames = new Set(fields.map(f => f.getName()));

    for (const [key, def] of Object.entries(registry)) {
        const rawValue = fieldValues[key];
        if (rawValue === undefined || rawValue === null) continue;
        const rendered = applyTransform(rawValue, def.transform);

        if (def.pdfFieldName && fieldNames.has(def.pdfFieldName)) {
            try {
                if (def.type === 'checkbox') {
                    const cb = form.getCheckBox(def.pdfFieldName);
                    rawValue ? cb.check() : cb.uncheck();
                } else {
                    const tf = form.getTextField(def.pdfFieldName);
                    tf.setText(rendered);
                }
            } catch {
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
                } else if (rawValue) {
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
    } catch {
        // ignore
    }

    return await pdfDoc.save();
}

export const NYFormService = {
    resolveFields(input: NYFormInput): { fieldValues: Record<string, any>; validationErrors: string[] } {
        const registry = NY_FORM_REGISTRY[input.formId];
        if (!registry) {
            return { fieldValues: {}, validationErrors: [`Unknown form: ${input.formId}`] };
        }

        const fieldValues: Record<string, any> = {};
        for (const [key, def] of Object.entries(registry)) {
            const raw = resolveFieldValue(key, def, input);
            if (raw !== undefined) {
                fieldValues[key] = applyTransform(raw, def.transform);
            }
        }

        const validationErrors = validateNYFormData(input.formId, {
            ...Object.fromEntries(Object.entries(input.estate).filter(([, v]) => v !== undefined)),
            ...input.overrides,
        });

        return { fieldValues, validationErrors };
    },

    async generate(input: NYFormInput): Promise<NYFormResult> {
        const registry = NY_FORM_REGISTRY[input.formId];
        if (!registry) {
            throw new Error(`Unknown NY form: ${input.formId}`);
        }

        const { fieldValues, validationErrors } = this.resolveFields(input);
        let pdfBytes: Uint8Array;

        const dbTemplate = await prisma.formTemplate.findUnique({
            where: { name: input.formId },
        }).catch(() => null);

        const templateBytes = dbTemplate ? Buffer.from(dbTemplate.data) : null;

        if (templateBytes) {
            logger.info(`[NYFormService] Using template from DB for ${input.formId}`);
            pdfBytes = await fillTemplateFields(templateBytes, fieldValues, registry);
        } else {
            logger.warn(`[NYFormService] No template found for ${input.formId}, using fallback builder`);
            switch (input.formId) {
                case 'ET-1':
                    pdfBytes = await buildFallbackET1(fieldValues);
                    break;
                case 'ET-2':
                    pdfBytes = await buildFallbackET2(fieldValues);
                    break;
                case 'ET-3':
                    pdfBytes = await buildFallbackET3(fieldValues);
                    break;
                case 'ET-8':
                    pdfBytes = await buildFallbackET8(fieldValues, input.assets || []);
                    break;
                case 'ET-13':
                    pdfBytes = await buildFallbackET13(fieldValues);
                    break;
                default:
                    throw new Error(`No fallback builder for ${input.formId}`);
            }
        }

        return { pdfBytes, fieldValues, validationErrors };
    },

    getUISchema(formId: NYFormId): Array<{
        key: string;
        label: string;
        type: string;
        required: boolean;
        description?: string;
        overridable: boolean;
    }> {
        const registry = NY_FORM_REGISTRY[formId];
        if (!registry) return [];

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
