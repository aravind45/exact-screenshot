/**
 * NJFormService
 *
 * Generation pipeline for New Jersey Surrogate's Court forms.
 * Handles field extraction and PDF output for NJ-1 and NJ-2.
 */

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { prisma } from '../db.js';
import { logger } from '../lib/logger.js';
import {
    NJ_FORM_REGISTRY,
    NJFormId,
    NJFormFieldMap,
    NJFieldDefinition,
    validateNJFormData,
} from './njFormRegistry.js';

export interface NJFormInput {
    formId: NJFormId;
    estate: any;
    assets?: any[];
    heirs?: any[];
    overrides?: Record<string, any>;
}

export interface NJFormResult {
    pdfBytes: Uint8Array;
    fieldValues: Record<string, any>;
    validationErrors: string[];
}

// ─── Value Transforms ─────────────────────────────────────────────────────────

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
        case 'uppercase': return String(value || '').toUpperCase();
        case 'formatDate': return formatDate(value);
        case 'formatCurrency': return formatCurrency(value);
        case 'formatPhone': return formatPhone(value);
        default: return String(value || '');
    }
}

// ─── Value Resolution ─────────────────────────────────────────────────────────

function getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

function resolveFieldValue(
    key: string,
    def: NJFieldDefinition,
    input: NJFormInput,
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

function resolveComputed(key: string, input: NJFormInput): any {
    const { estate } = input;

    switch (key) {
        case 'decedentName':
            return `${estate.deceasedFirstName || ''} ${estate.deceasedLastName || ''}`.trim();
        default:
            return undefined;
    }
}

// ─── Fallback PDF Builder ─────────────────────────────────────────────────────

async function buildFallbackNJ1(fieldValues: Record<string, any>): Promise<Uint8Array> {
    const doc = await PDFDocument.create();
    const page = doc.addPage([612, 792]);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
    const { height } = page.getSize();
    let y = height - 50;

    const draw = (text: string, size = 10, bold = false, indent = 0) => {
        page.drawText(text, { x: 50 + indent, y, size, font: bold ? fontBold : fontRegular });
        y -= size + 5;
    };

    draw('APPLICATION FOR PROBATE (NJ-1)', 16, true);
    y -= 10;
    draw(`Surrogate's Court, County of: ${fieldValues.surrogateCounty || '[County]'}`, 10);
    draw(`ESTATE OF: ${fieldValues.decedentName || '[Decedent Name]'}`, 12, true);
    y -= 15;

    draw('PETITIONER INFORMATION', 11, true);
    draw(`Name: ${fieldValues.petitionerName || ''}`, 10, false, 10);
    draw(`Address: ${fieldValues.petitionerAddress || ''}`, 10, false, 10);
    y -= 10;

    draw('DECEDENT INFORMATION', 11, true);
    draw(`Residence: ${fieldValues.decedentResidence || ''}`, 10, false, 10);
    draw(`Date of Death: ${fieldValues.dateOfDeath || '[Date]'}`, 10, false, 10);
    y -= 10;

    draw('PROBATE STATUS', 11, true);
    draw(`[${fieldValues.hasWill ? 'X' : ' '}] Application for Probate of Will`, 10, false, 10);
    draw(`[${!fieldValues.hasWill ? 'X' : ' '}] Application for Letters of Administration`, 10, false, 10);

    return await doc.save();
}

async function buildFallbackNJ2(fieldValues: Record<string, any>): Promise<Uint8Array> {
    const doc = await PDFDocument.create();
    const page = doc.addPage([612, 792]);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
    const { height } = page.getSize();
    let y = height - 50;

    const draw = (text: string, size = 10, bold = false, indent = 0) => {
        page.drawText(text, { x: 50 + indent, y, size, font: bold ? fontBold : fontRegular });
        y -= size + 5;
    };

    draw('AUTHORIZATION TO ACCEPT SERVICE OF PROCESS (NJ-2)', 14, true);
    y -= 10;
    draw(`ESTATE OF: ${fieldValues.decedentName || '[Decedent Name]'}`, 12, true);
    y -= 20;

    draw('To the Surrogate of the County of: ' + (fieldValues.surrogateCounty || ''), 10);
    y -= 15;
    draw('The undersigned, being the executor/administrator of the above estate,', 10);
    draw('hereby authorizes the Surrogate to accept service of process in any action', 10);
    draw('against the estate...', 10);

    return await doc.save();
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const NJFormService = {
    resolveFields(input: NJFormInput): { fieldValues: Record<string, any>; validationErrors: string[] } {
        const registry = NJ_FORM_REGISTRY[input.formId];
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

        const validationErrors = validateNJFormData(input.formId, {
            ...Object.fromEntries(
                Object.entries(input.estate).filter(([, v]) => v !== undefined),
            ),
            ...input.overrides,
        });

        return { fieldValues, validationErrors };
    },

    async generate(input: NJFormInput): Promise<NJFormResult> {
        const registry = NJ_FORM_REGISTRY[input.formId];
        if (!registry) {
            throw new Error(`Unknown NJ form: ${input.formId}`);
        }

        const { fieldValues, validationErrors } = this.resolveFields(input);

        let pdfBytes: Uint8Array;
        const dbTemplate = await prisma.formTemplate.findUnique({
            where: { name: input.formId },
        }).catch(() => null);

        const templateBytes = dbTemplate ? Buffer.from(dbTemplate.data) : null;

        if (templateBytes) {
            // Template implementation would go here (similar to CA)
            pdfBytes = templateBytes; // Placeholder
        } else {
            switch (input.formId) {
                case 'NJ-1':
                    pdfBytes = await buildFallbackNJ1(fieldValues);
                    break;
                case 'NJ-2':
                    pdfBytes = await buildFallbackNJ2(fieldValues);
                    break;
                default:
                    throw new Error(`No fallback builder for ${input.formId}`);
            }
        }

        return { pdfBytes, fieldValues, validationErrors };
    },

    getUISchema(formId: NJFormId) {
        const registry = NJ_FORM_REGISTRY[formId];
        if (!registry) return [];

        return Object.entries(registry)
            .filter(([, def]) => def.source !== 'computed')
            .map(([key, def]) => ({
                key,
                label: def.label,
                type: def.type,
                required: def.required ?? false,
                description: def.description,
                overridable: true,
            }));
    },
};
