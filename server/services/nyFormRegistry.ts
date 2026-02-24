/**
 * NY Form Field Registry
 *
 * Defines the field mapping schema and PDF field registry for
 * New York Surrogate's Court probate forms.
 *
 * Supported forms: ET-1, ET-2, ET-3, ET-8, ET-13
 */

export type FieldSource =
    | 'estate'
    | 'user'
    | 'assets'
    | 'heirs'
    | 'computed'
    | 'override';

export type FieldType = 'text' | 'checkbox' | 'date' | 'currency' | 'number';

export interface NYFieldDefinition {
    label: string;
    source: FieldSource;
    path?: string;
    type: FieldType;
    required?: boolean;
    coord?: { x: number; y: number; size?: number; bold?: boolean; page?: number };
    pdfFieldName?: string;
    transform?: 'uppercase' | 'formatDate' | 'formatCurrency' | 'formatPhone';
    description?: string;
}

export type NYFormFieldMap = Record<string, NYFieldDefinition>;

const NY_HEADER_FIELDS: NYFormFieldMap = {
    petitionerName: {
        label: 'Petitioner Name',
        source: 'user',
        path: 'fullName',
        type: 'text',
        required: true,
        pdfFieldName: 'PetitionerName',
        coord: { x: 50, y: 710, size: 11, bold: true },
        description: 'Name of the petitioner or executor filing the form',
    },
    petitionerAddress: {
        label: 'Petitioner Address',
        source: 'user',
        path: 'address',
        type: 'text',
        pdfFieldName: 'PetitionerAddress',
        coord: { x: 50, y: 696, size: 10 },
    },
    petitionerCity: {
        label: 'Petitioner City',
        source: 'user',
        path: 'city',
        type: 'text',
        pdfFieldName: 'PetitionerCity',
        coord: { x: 50, y: 682, size: 10 },
    },
    petitionerState: {
        label: 'Petitioner State',
        source: 'user',
        path: 'state',
        type: 'text',
        pdfFieldName: 'PetitionerState',
        coord: { x: 200, y: 682, size: 10 },
    },
    petitionerZip: {
        label: 'Petitioner ZIP',
        source: 'user',
        path: 'zip',
        type: 'text',
        pdfFieldName: 'PetitionerZip',
        coord: { x: 260, y: 682, size: 10 },
    },
    petitionerPhone: {
        label: 'Petitioner Phone',
        source: 'estate',
        path: 'petitionerPhone',
        type: 'text',
        pdfFieldName: 'PetitionerPhone',
        coord: { x: 50, y: 668, size: 10 },
        transform: 'formatPhone',
    },
    petitionerEmail: {
        label: 'Petitioner Email',
        source: 'user',
        path: 'personalEmail',
        type: 'text',
        pdfFieldName: 'PetitionerEmail',
        coord: { x: 220, y: 668, size: 10 },
    },
    courtCounty: {
        label: 'Surrogate Court County',
        source: 'estate',
        path: 'probateCounty',
        type: 'text',
        required: true,
        pdfFieldName: 'CourtCounty',
        coord: { x: 160, y: 640, size: 11, bold: true },
        description: 'County where the Surrogate’s Court is located',
    },
    decedentName: {
        label: 'Decedent Full Name',
        source: 'computed',
        type: 'text',
        required: true,
        pdfFieldName: 'DecedentName',
        coord: { x: 160, y: 612, size: 12, bold: true },
        transform: 'uppercase',
        description: 'Full legal name of the deceased person',
    },
    dateOfDeath: {
        label: 'Date of Death',
        source: 'estate',
        path: 'deceasedDateOfDeath',
        type: 'date',
        required: true,
        pdfFieldName: 'DateOfDeath',
        coord: { x: 160, y: 598, size: 10 },
        transform: 'formatDate',
    },
    caseNumber: {
        label: 'File / Case Number',
        source: 'estate',
        path: 'courtCaseNumber',
        type: 'text',
        pdfFieldName: 'CaseNumber',
        coord: { x: 420, y: 610, size: 10 },
    },
};

export const ET1_FIELD_REGISTRY: NYFormFieldMap = {
    ...NY_HEADER_FIELDS,
    domicileCounty: {
        label: 'County of Domicile',
        source: 'estate',
        path: 'probateCounty',
        type: 'text',
        required: true,
        pdfFieldName: 'DomicileCounty',
        coord: { x: 160, y: 560, size: 10 },
    },
    domicileState: {
        label: 'State of Domicile',
        source: 'estate',
        path: 'deceasedState',
        type: 'text',
        required: true,
        pdfFieldName: 'DomicileState',
        coord: { x: 320, y: 560, size: 10 },
    },
    willDate: {
        label: 'Will Execution Date',
        source: 'estate',
        path: 'willDate',
        type: 'date',
        pdfFieldName: 'WillDate',
        coord: { x: 160, y: 544, size: 10 },
        transform: 'formatDate',
    },
    executorName: {
        label: 'Executor Name',
        source: 'computed',
        type: 'text',
        pdfFieldName: 'ExecutorName',
        coord: { x: 160, y: 528, size: 10 },
    },
    estimatedEstateValue: {
        label: 'Estimated Estate Value ($)',
        source: 'computed',
        type: 'currency',
        pdfFieldName: 'EstimatedEstateValue',
        coord: { x: 160, y: 512, size: 10 },
        transform: 'formatCurrency',
    },
};

export const ET2_FIELD_REGISTRY: NYFormFieldMap = {
    ...NY_HEADER_FIELDS,
    domicileCounty: {
        label: 'County of Domicile',
        source: 'estate',
        path: 'probateCounty',
        type: 'text',
        required: true,
        pdfFieldName: 'DomicileCounty',
        coord: { x: 160, y: 560, size: 10 },
    },
    domicileState: {
        label: 'State of Domicile',
        source: 'estate',
        path: 'deceasedState',
        type: 'text',
        required: true,
        pdfFieldName: 'DomicileState',
        coord: { x: 320, y: 560, size: 10 },
    },
    administratorName: {
        label: 'Proposed Administrator',
        source: 'computed',
        type: 'text',
        pdfFieldName: 'AdministratorName',
        coord: { x: 160, y: 544, size: 10 },
    },
    heirSummary: {
        label: 'Heir Summary',
        source: 'computed',
        type: 'text',
        pdfFieldName: 'HeirSummary',
        coord: { x: 160, y: 528, size: 10 },
        description: 'Summary of next of kin and relationships',
    },
};

export const ET3_FIELD_REGISTRY: NYFormFieldMap = {
    ...NY_HEADER_FIELDS,
    foreignWillState: {
        label: 'Foreign Will State',
        source: 'override',
        type: 'text',
        required: true,
        pdfFieldName: 'ForeignWillState',
        coord: { x: 160, y: 560, size: 10 },
        description: 'State where the original probate was filed',
    },
    foreignCaseNumber: {
        label: 'Foreign Case Number',
        source: 'override',
        type: 'text',
        pdfFieldName: 'ForeignCaseNumber',
        coord: { x: 160, y: 544, size: 10 },
    },
    ancillaryExecutor: {
        label: 'Ancillary Executor',
        source: 'computed',
        type: 'text',
        pdfFieldName: 'AncillaryExecutor',
        coord: { x: 160, y: 528, size: 10 },
    },
};

export const ET8_FIELD_REGISTRY: NYFormFieldMap = {
    ...NY_HEADER_FIELDS,
    inventoryDate: {
        label: 'Inventory Date',
        source: 'computed',
        type: 'date',
        pdfFieldName: 'InventoryDate',
        coord: { x: 160, y: 560, size: 10 },
        transform: 'formatDate',
    },
    inventoryPreparedBy: {
        label: 'Prepared By',
        source: 'computed',
        type: 'text',
        pdfFieldName: 'PreparedBy',
        coord: { x: 160, y: 544, size: 10 },
    },
    totalRealProperty: {
        label: 'Total Real Property ($)',
        source: 'computed',
        type: 'currency',
        pdfFieldName: 'TotalRealProperty',
        coord: { x: 160, y: 528, size: 10 },
        transform: 'formatCurrency',
    },
    totalPersonalProperty: {
        label: 'Total Personal Property ($)',
        source: 'computed',
        type: 'currency',
        pdfFieldName: 'TotalPersonalProperty',
        coord: { x: 160, y: 512, size: 10 },
        transform: 'formatCurrency',
    },
    totalEstateValue: {
        label: 'Total Estate Value ($)',
        source: 'computed',
        type: 'currency',
        pdfFieldName: 'TotalEstateValue',
        coord: { x: 160, y: 496, size: 10 },
        transform: 'formatCurrency',
    },
};

export const ET13_FIELD_REGISTRY: NYFormFieldMap = {
    ...NY_HEADER_FIELDS,
    distributionDate: {
        label: 'Proposed Distribution Date',
        source: 'override',
        type: 'date',
        pdfFieldName: 'DistributionDate',
        coord: { x: 160, y: 560, size: 10 },
        transform: 'formatDate',
    },
    totalEstateValue: {
        label: 'Total Estate Value ($)',
        source: 'computed',
        type: 'currency',
        pdfFieldName: 'TotalEstateValue',
        coord: { x: 160, y: 544, size: 10 },
        transform: 'formatCurrency',
    },
    distributionPlan: {
        label: 'Distribution Plan Summary',
        source: 'override',
        type: 'text',
        required: true,
        pdfFieldName: 'DistributionPlan',
        coord: { x: 160, y: 528, size: 10 },
        description: 'Brief summary of how the estate will be distributed',
    },
};

export const NY_FORM_REGISTRY: Record<string, NYFormFieldMap> = {
    'ET-1': ET1_FIELD_REGISTRY,
    'ET-2': ET2_FIELD_REGISTRY,
    'ET-3': ET3_FIELD_REGISTRY,
    'ET-8': ET8_FIELD_REGISTRY,
    'ET-13': ET13_FIELD_REGISTRY,
};

export type NYFormId = keyof typeof NY_FORM_REGISTRY;

export const NY_FORM_TITLES: Record<NYFormId, string> = {
    'ET-1': 'Petition for Probate',
    'ET-2': 'Petition for Administration',
    'ET-3': 'Petition for Ancillary Probate',
    'ET-8': 'Inventory of Assets',
    'ET-13': 'Petition for Final Distribution',
};

export function validateNYFormData(
    formId: NYFormId,
    data: Record<string, any>,
): string[] {
    const registry = NY_FORM_REGISTRY[formId];
    if (!registry) return [`Unknown form ID: ${formId}`];

    const errors: string[] = [];
    for (const [key, def] of Object.entries(registry)) {
        if (!def.required) continue;
        if (def.source === 'computed') continue;
        const base = def.source === 'user' ? data.user : data;
        const value = def.path ? getNestedValue(base, def.path) : data[key];
        if (value === undefined || value === null || value === '') {
            errors.push(`${def.label} is required`);
        }
    }
    return errors;
}

function getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, key) => acc?.[key], obj);
}
