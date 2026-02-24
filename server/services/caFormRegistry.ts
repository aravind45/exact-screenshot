/**
 * CA Form Field Registry
 *
 * Defines the field mapping schema and PDF field registry for California
 * Judicial Council probate forms. Each entry describes how estate data maps
 * onto a fillable PDF field or text overlay coordinate.
 *
 * Supported forms: DE-111, DE-160, DE-310
 */

export type FieldSource =
    | 'estate'
    | 'user'
    | 'assets'
    | 'heirs'
    | 'computed'
    | 'override';

export type FieldType = 'text' | 'checkbox' | 'date' | 'currency' | 'number';

export interface CAFieldDefinition {
    /** Human-readable label shown in the UI override form */
    label: string;
    /** Where the value originates from */
    source: FieldSource;
    /** Data path within the source object (dot notation) */
    path?: string;
    /** Field type for formatting and input rendering */
    type: FieldType;
    /** Whether this field is required for form generation */
    required?: boolean;
    /** Overlay coordinate on the PDF (x, y in pdf-lib points from bottom-left) */
    coord?: { x: number; y: number; size?: number; bold?: boolean; page?: number };
    /** PDF AcroForm field name if the template has fillable fields */
    pdfFieldName?: string;
    /** Optional transform applied to the raw value before rendering */
    transform?: 'uppercase' | 'formatDate' | 'formatCurrency' | 'formatPhone';
    /** Description shown in the UI tooltip */
    description?: string;
}

export type CAFormFieldMap = Record<string, CAFieldDefinition>;

// ─── Shared header fields used on all CA Judicial Council forms ──────────────

const CA_HEADER_FIELDS: CAFormFieldMap = {
    petitionerName: {
        label: 'Petitioner / Party Name',
        source: 'user',
        path: 'fullName',
        type: 'text',
        required: true,
        pdfFieldName: 'PetitionerName',
        coord: { x: 50, y: 710 },
        description: 'Name of the person filing the form (executor or attorney)',
    },
    petitionerAddress: {
        label: 'Petitioner Address',
        source: 'user',
        path: 'address',
        type: 'text',
        coord: { x: 50, y: 698 },
        description: 'Street address of the petitioner',
    },
    petitionerPhone: {
        label: 'Petitioner Phone',
        source: 'estate',
        path: 'petitionerPhone',
        type: 'text',
        pdfFieldName: 'PetitionerPhone',
        coord: { x: 50, y: 686 },
        transform: 'formatPhone',
    },
    courtCounty: {
        label: 'Superior Court County',
        source: 'estate',
        path: 'probateCounty',
        type: 'text',
        required: true,
        pdfFieldName: 'County',
        coord: { x: 160, y: 640, bold: true },
        description: 'County where the probate court is located',
    },
    decedentName: {
        label: 'Decedent Full Name',
        source: 'computed',
        type: 'text',
        required: true,
        pdfFieldName: 'DecedentName',
        coord: { x: 160, y: 578, size: 12, bold: true },
        transform: 'uppercase',
        description: 'Full legal name of the deceased person',
    },
    caseNumber: {
        label: 'Case Number',
        source: 'estate',
        path: 'courtCaseNumber',
        type: 'text',
        pdfFieldName: 'CaseNumber',
        coord: { x: 430, y: 545, size: 11 },
        description: 'Court-assigned probate case number (leave blank if not yet assigned)',
    },
    dateOfDeath: {
        label: 'Date of Death',
        source: 'estate',
        path: 'deceasedDateOfDeath',
        type: 'date',
        pdfFieldName: 'DeathDate',
        transform: 'formatDate',
        description: 'Date the decedent passed away',
    },
};

// ─── DE-111: Petition for Probate ────────────────────────────────────────────

export const DE111_FIELD_REGISTRY: CAFormFieldMap = {
    ...CA_HEADER_FIELDS,

    checkProbateOfWill: {
        label: 'Probate of Will',
        source: 'estate',
        path: 'hasWill',
        type: 'checkbox',
        pdfFieldName: 'HasWillBox',
        coord: { x: 58, y: 548 },
        description: 'Check if the decedent had a valid will',
    },
    checkLettersTestamentary: {
        label: 'Letters Testamentary',
        source: 'computed',
        type: 'checkbox',
        pdfFieldName: 'LettersTestamentaryBox',
        coord: { x: 58, y: 536 },
        description: 'Request authority as executor under a will',
    },
    checkLettersAdministration: {
        label: 'Letters of Administration (no will)',
        source: 'computed',
        type: 'checkbox',
        pdfFieldName: 'LettersOfAdministrationBox',
        coord: { x: 58, y: 524 },
        description: 'Request authority as administrator when there is no will',
    },
    willDate: {
        label: 'Will Date',
        source: 'estate',
        path: 'willDate',
        type: 'date',
        pdfFieldName: 'WillDate',
        transform: 'formatDate',
        description: 'Date the will was executed',
    },
    valuePersonalProperty: {
        label: 'Estimated Personal Property Value ($)',
        source: 'estate',
        path: 'estimatedPersonalProperty',
        type: 'currency',
        required: true,
        pdfFieldName: 'ValuePersonalProperty',
        coord: { x: 300, y: 466 },
        transform: 'formatCurrency',
        description: 'Estimated value of personal property (bank accounts, vehicles, etc.)',
    },
    valueRealProperty: {
        label: 'Estimated Real Property Value ($)',
        source: 'estate',
        path: 'estimatedRealProperty',
        type: 'currency',
        pdfFieldName: 'ValueRealProperty',
        coord: { x: 300, y: 454 },
        transform: 'formatCurrency',
        description: 'Estimated value of real estate',
    },
    valueAnnualIncome: {
        label: 'Estimated Annual Gross Income ($)',
        source: 'estate',
        path: 'estimatedAnnualIncome',
        type: 'currency',
        pdfFieldName: 'ValueAnnualIncome',
        coord: { x: 300, y: 442 },
        transform: 'formatCurrency',
        description: 'Estimated gross annual income from estate assets',
    },
    bondWaived: {
        label: 'Bond Waived',
        source: 'estate',
        path: 'bondWaived',
        type: 'checkbox',
        pdfFieldName: 'BondWaivedBox',
        coord: { x: 58, y: 408 },
        description: 'Check if bond requirement is waived by will or all heirs',
    },
    bondAmount: {
        label: 'Bond Amount ($)',
        source: 'estate',
        path: 'bondAmount',
        type: 'currency',
        pdfFieldName: 'BondAmount',
        transform: 'formatCurrency',
        description: 'Amount of executor bond required by the court',
    },
    publicationNewspaper: {
        label: 'Publication Newspaper',
        source: 'estate',
        path: 'publicationNewspaper',
        type: 'text',
        pdfFieldName: 'PublicationNewspaper',
        description: 'Name of newspaper where notice will be published',
    },
};

// ─── DE-160: Inventory and Appraisal ─────────────────────────────────────────

export const DE160_FIELD_REGISTRY: CAFormFieldMap = {
    ...CA_HEADER_FIELDS,

    inventoryType: {
        label: 'Inventory Type',
        source: 'override',
        type: 'text',
        required: true,
        description: 'Select: FINAL, PARTIAL, or SUPPLEMENTAL',
    },
    checkInventoryFinal: {
        label: 'Final Inventory',
        source: 'computed',
        type: 'checkbox',
        coord: { x: 88, y: 540 },
        description: 'Check if this is the final inventory',
    },
    checkInventoryPartial: {
        label: 'Partial Inventory',
        source: 'computed',
        type: 'checkbox',
        coord: { x: 88, y: 528 },
        description: 'Check if more assets are still being discovered',
    },
    checkInventorySupplemental: {
        label: 'Supplemental Inventory',
        source: 'computed',
        type: 'checkbox',
        coord: { x: 88, y: 516 },
        description: 'Check if assets were discovered after initial filing',
    },
    totalAttachment1: {
        label: 'Total Real Property (Attachment 1) ($)',
        source: 'computed',
        type: 'currency',
        pdfFieldName: 'TotalAttachment1',
        coord: { x: 460, y: 398 },
        transform: 'formatCurrency',
        description: 'Sum of all real property values listed in Attachment 1',
    },
    totalAttachment2: {
        label: 'Total Personal Property (Attachment 2) ($)',
        source: 'computed',
        type: 'currency',
        pdfFieldName: 'TotalAttachment2',
        coord: { x: 460, y: 385 },
        transform: 'formatCurrency',
        description: 'Sum of all personal property values listed in Attachment 2',
    },
    totalInventory: {
        label: 'Total Inventory Value ($)',
        source: 'computed',
        type: 'currency',
        pdfFieldName: 'TotalInventory',
        coord: { x: 460, y: 372 },
        transform: 'formatCurrency',
        description: 'Combined total value of all estate assets',
    },
    appraisalDate: {
        label: 'Appraisal Date',
        source: 'computed',
        type: 'date',
        transform: 'formatDate',
        description: 'Date the appraisal was completed (defaults to today)',
    },
};

// ─── DE-310: Petition to Determine Succession to Real Property ───────────────

export const DE310_FIELD_REGISTRY: CAFormFieldMap = {
    ...CA_HEADER_FIELDS,

    totalInventoryValue: {
        label: 'Total Inventory Value ($)',
        source: 'computed',
        type: 'currency',
        required: true,
        transform: 'formatCurrency',
        description: 'Total appraised value of all estate assets',
    },
    statutoryFee: {
        label: 'Statutory Attorney / Executor Fee ($)',
        source: 'computed',
        type: 'currency',
        transform: 'formatCurrency',
        description: 'Calculated per CA Probate Code § 10800',
    },
    realPropertyDescription: {
        label: 'Real Property Description',
        source: 'override',
        type: 'text',
        required: true,
        description: 'Legal description of the real property (APN, lot, block)',
    },
    realPropertyValue: {
        label: 'Real Property Value ($)',
        source: 'override',
        type: 'currency',
        transform: 'formatCurrency',
        description: 'Appraised value of the real property',
    },
    successionBasis: {
        label: 'Succession Basis',
        source: 'override',
        type: 'text',
        description: 'Legal basis for succession (e.g., intestate heir, will beneficiary)',
    },
};

// ─── Registry export ──────────────────────────────────────────────────────────

export const CA_FORM_REGISTRY: Record<string, CAFormFieldMap> = {
    'DE-111': DE111_FIELD_REGISTRY,
    'DE-160': DE160_FIELD_REGISTRY,
    'DE-310': DE310_FIELD_REGISTRY,
};

export type CAFormId = keyof typeof CA_FORM_REGISTRY;

export const CA_FORM_TITLES: Record<CAFormId, string> = {
    'DE-111': 'Petition for Probate',
    'DE-160': 'Inventory and Appraisal',
    'DE-310': 'Petition to Determine Succession to Real Property',
};

/**
 * Returns validation errors for a given form's data payload.
 * Checks that all required fields with `source !== 'computed'` have values.
 */
export function validateCAFormData(
    formId: CAFormId,
    data: Record<string, any>,
): string[] {
    const registry = CA_FORM_REGISTRY[formId];
    if (!registry) return [`Unknown form ID: ${formId}`];

    const errors: string[] = [];
    for (const [key, def] of Object.entries(registry)) {
        if (!def.required) continue;
        if (def.source === 'computed') continue;
        const value = def.path ? getNestedValue(data, def.path) : data[key];
        if (value === undefined || value === null || value === '') {
            errors.push(`${def.label} is required`);
        }
    }
    return errors;
}

function getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, key) => acc?.[key], obj);
}
