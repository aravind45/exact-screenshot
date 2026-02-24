/**
 * FL Form Field Registry
 *
 * Defines the field mapping schema and PDF field registry for
 * Florida probate forms. Florida has unique forms including
 * summary administration and homestead property petitions.
 *
 * Supported forms: FL-1, FL-2, FL-3, FL-4, FL-5, FL-6, FL-7, FL-8, FL-9, FL-10, FL-11, FL-12, FL-13, FL-14, FL-15
 */

export type FieldSource =
    | 'estate'
    | 'user'
    | 'assets'
    | 'heirs'
    | 'computed'
    | 'override';

export type FieldType = 'text' | 'checkbox' | 'date' | 'currency' | 'number';

export interface FLFieldDefinition {
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

export type FLFormFieldMap = Record<string, FLFieldDefinition>;

const FL_HEADER_FIELDS: FLFormFieldMap = {
    petitionerName: {
        label: 'Petitioner Name',
        source: 'user',
        path: 'fullName',
        type: 'text',
        required: true,
        pdfFieldName: 'PetitionerName',
        coord: { x: 50, y: 710, size: 11, bold: true },
        description: 'Name of the petitioner (personal representative or attorney)',
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
        label: 'Probate Court County',
        source: 'estate',
        path: 'probateCounty',
        type: 'text',
        required: true,
        pdfFieldName: 'CourtCounty',
        coord: { x: 160, y: 640, size: 11, bold: true },
        description: 'County where the probate court is located',
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

// FL-1: Petition for Administration
export const FL1_FIELD_REGISTRY: FLFormFieldMap = {
    ...FL_HEADER_FIELDS,
    testamentary: {
        label: 'Testamentary (With Will)',
        source: 'estate',
        path: 'hasWill',
        type: 'checkbox',
        pdfFieldName: 'TestamentaryBox',
        coord: { x: 58, y: 560 },
        description: 'Check if decedent left a will',
    },
    intestate: {
        label: 'Intestate (No Will)',
        source: 'computed',
        type: 'checkbox',
        pdfFieldName: 'IntestateBox',
        coord: { x: 58, y: 548 },
        description: 'Check if decedent died without a will',
    },
    personalRepresentativeName: {
        label: 'Personal Representative Name',
        source: 'computed',
        type: 'text',
        pdfFieldName: 'PRName',
        coord: { x: 160, y: 532, size: 10 },
    },
    estimatedEstateValue: {
        label: 'Estimated Estate Value ($)',
        source: 'computed',
        type: 'currency',
        pdfFieldName: 'EstimatedEstateValue',
        coord: { x: 160, y: 516, size: 10 },
        transform: 'formatCurrency',
    },
};

// FL-2: Petition for Summary Administration
export const FL2_FIELD_REGISTRY: FLFormFieldMap = {
    ...FL_HEADER_FIELDS,
    smallEstateValue: {
        label: 'Estate Value ($)',
        source: 'computed',
        type: 'currency',
        required: true,
        pdfFieldName: 'SmallEstateValue',
        coord: { x: 160, y: 560, size: 10 },
        transform: 'formatCurrency',
        description: 'Total estate value (must be under $75,000 for summary administration)',
    },
    summaryAdministrationBasis: {
        label: 'Summary Administration Basis',
        source: 'override',
        type: 'text',
        required: true,
        pdfFieldName: 'SummaryBasis',
        coord: { x: 160, y: 544, size: 10 },
        description: 'Reason for summary administration (deceased over 2 years or small estate)',
    },
    heirSummary: {
        label: 'Heir Summary',
        source: 'computed',
        type: 'text',
        pdfFieldName: 'HeirSummary',
        coord: { x: 160, y: 528, size: 10 },
    },
};

// FL-3: Notice of Administration
export const FL3_FIELD_REGISTRY: FLFormFieldMap = {
    ...FL_HEADER_FIELDS,
    noticeDate: {
        label: 'Notice Date',
        source: 'computed',
        type: 'date',
        pdfFieldName: 'NoticeDate',
        coord: { x: 160, y: 560, size: 10 },
        transform: 'formatDate',
    },
    personalRepresentativeName: {
        label: 'Personal Representative Name',
        source: 'computed',
        type: 'text',
        pdfFieldName: 'PRName',
        coord: { x: 160, y: 544, size: 10 },
    },
    creditorClaimDeadline: {
        label: 'Creditor Claim Deadline',
        source: 'override',
        type: 'date',
        pdfFieldName: 'ClaimDeadline',
        coord: { x: 160, y: 528, size: 10 },
        transform: 'formatDate',
        description: 'Deadline for creditors to file claims (typically 30 days)',
    },
};

// FL-4: Oath of Personal Representative
export const FL4_FIELD_REGISTRY: FLFormFieldMap = {
    ...FL_HEADER_FIELDS,
    personalRepresentativeName: {
        label: 'Personal Representative Name',
        source: 'computed',
        type: 'text',
        required: true,
        pdfFieldName: 'PRName',
        coord: { x: 160, y: 560, size: 10 },
    },
    oathDate: {
        label: 'Oath Date',
        source: 'computed',
        type: 'date',
        pdfFieldName: 'OathDate',
        coord: { x: 160, y: 544, size: 10 },
        transform: 'formatDate',
    },
};

// FL-5: Letters of Administration
export const FL5_FIELD_REGISTRY: FLFormFieldMap = {
    ...FL_HEADER_FIELDS,
    personalRepresentativeName: {
        label: 'Personal Representative Name',
        source: 'computed',
        type: 'text',
        required: true,
        pdfFieldName: 'PRName',
        coord: { x: 160, y: 560, size: 10 },
    },
    dateOfDeath: {
        label: 'Date of Death',
        source: 'estate',
        path: 'deceasedDateOfDeath',
        type: 'date',
        pdfFieldName: 'DateOfDeath',
        coord: { x: 160, y: 544, size: 10 },
        transform: 'formatDate',
    },
};

// FL-6: Inventory
export const FL6_FIELD_REGISTRY: FLFormFieldMap = {
    ...FL_HEADER_FIELDS,
    inventoryDate: {
        label: 'Inventory Date',
        source: 'computed',
        type: 'date',
        pdfFieldName: 'InventoryDate',
        coord: { x: 160, y: 560, size: 10 },
        transform: 'formatDate',
    },
    totalRealProperty: {
        label: 'Total Real Property ($)',
        source: 'computed',
        type: 'currency',
        pdfFieldName: 'TotalRealProperty',
        coord: { x: 160, y: 544, size: 10 },
        transform: 'formatCurrency',
    },
    totalPersonalProperty: {
        label: 'Total Personal Property ($)',
        source: 'computed',
        type: 'currency',
        pdfFieldName: 'TotalPersonalProperty',
        coord: { x: 160, y: 528, size: 10 },
        transform: 'formatCurrency',
    },
    totalEstateValue: {
        label: 'Total Estate Value ($)',
        source: 'computed',
        type: 'currency',
        pdfFieldName: 'TotalEstateValue',
        coord: { x: 160, y: 512, size: 10 },
        transform: 'formatCurrency',
    },
};

// FL-7: Notice to Creditors
export const FL7_FIELD_REGISTRY: FLFormFieldMap = {
    ...FL_HEADER_FIELDS,
    noticeDate: {
        label: 'Notice Date',
        source: 'computed',
        type: 'date',
        pdfFieldName: 'NoticeDate',
        coord: { x: 160, y: 560, size: 10 },
        transform: 'formatDate',
    },
    personalRepresentativeName: {
        label: 'Personal Representative Name',
        source: 'computed',
        type: 'text',
        pdfFieldName: 'PRName',
        coord: { x: 160, y: 544, size: 10 },
    },
    creditorClaimDeadline: {
        label: 'Creditor Claim Deadline',
        source: 'override',
        type: 'date',
        pdfFieldName: 'ClaimDeadline',
        coord: { x: 160, y: 528, size: 10 },
        transform: 'formatDate',
    },
};

// FL-8: Proof of Claim
export const FL8_FIELD_REGISTRY: FLFormFieldMap = {
    ...FL_HEADER_FIELDS,
    creditorName: {
        label: 'Creditor Name',
        source: 'override',
        type: 'text',
        required: true,
        pdfFieldName: 'CreditorName',
        coord: { x: 160, y: 560, size: 10 },
    },
    claimAmount: {
        label: 'Claim Amount ($)',
        source: 'override',
        type: 'currency',
        required: true,
        pdfFieldName: 'ClaimAmount',
        coord: { x: 160, y: 544, size: 10 },
        transform: 'formatCurrency',
    },
    claimBasis: {
        label: 'Basis of Claim',
        source: 'override',
        type: 'text',
        required: true,
        pdfFieldName: 'ClaimBasis',
        coord: { x: 160, y: 528, size: 10 },
        description: 'Description of the debt or claim',
    },
};

// FL-9: Objection to Claim
export const FL9_FIELD_REGISTRY: FLFormFieldMap = {
    ...FL_HEADER_FIELDS,
    creditorName: {
        label: 'Creditor Name',
        source: 'override',
        type: 'text',
        required: true,
        pdfFieldName: 'CreditorName',
        coord: { x: 160, y: 560, size: 10 },
    },
    claimAmount: {
        label: 'Claim Amount ($)',
        source: 'override',
        type: 'currency',
        pdfFieldName: 'ClaimAmount',
        coord: { x: 160, y: 544, size: 10 },
        transform: 'formatCurrency',
    },
    objectionReason: {
        label: 'Reason for Objection',
        source: 'override',
        type: 'text',
        required: true,
        pdfFieldName: 'ObjectionReason',
        coord: { x: 160, y: 528, size: 10 },
    },
};

// FL-10: Accounting
export const FL10_FIELD_REGISTRY: FLFormFieldMap = {
    ...FL_HEADER_FIELDS,
    accountingPeriodStart: {
        label: 'Accounting Period Start',
        source: 'override',
        type: 'date',
        pdfFieldName: 'PeriodStart',
        coord: { x: 160, y: 560, size: 10 },
        transform: 'formatDate',
    },
    accountingPeriodEnd: {
        label: 'Accounting Period End',
        source: 'override',
        type: 'date',
        pdfFieldName: 'PeriodEnd',
        coord: { x: 160, y: 544, size: 10 },
        transform: 'formatDate',
    },
    totalReceipts: {
        label: 'Total Receipts ($)',
        source: 'override',
        type: 'currency',
        pdfFieldName: 'TotalReceipts',
        coord: { x: 160, y: 528, size: 10 },
        transform: 'formatCurrency',
    },
    totalDisbursements: {
        label: 'Total Disbursements ($)',
        source: 'override',
        type: 'currency',
        pdfFieldName: 'TotalDisbursements',
        coord: { x: 160, y: 512, size: 10 },
        transform: 'formatCurrency',
    },
    netBalance: {
        label: 'Net Balance ($)',
        source: 'override',
        type: 'currency',
        pdfFieldName: 'NetBalance',
        coord: { x: 160, y: 496, size: 10 },
        transform: 'formatCurrency',
    },
};

// FL-11: Petition for Discharge
export const FL11_FIELD_REGISTRY: FLFormFieldMap = {
    ...FL_HEADER_FIELDS,
    finalDistributionDate: {
        label: 'Proposed Distribution Date',
        source: 'override',
        type: 'date',
        pdfFieldName: 'FinalDistributionDate',
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
    },
};

// FL-12: Final Accounting
export const FL12_FIELD_REGISTRY: FLFormFieldMap = {
    ...FL_HEADER_FIELDS,
    accountingPeriodStart: {
        label: 'Accounting Period Start',
        source: 'override',
        type: 'date',
        pdfFieldName: 'PeriodStart',
        coord: { x: 160, y: 560, size: 10 },
        transform: 'formatDate',
    },
    accountingPeriodEnd: {
        label: 'Accounting Period End',
        source: 'override',
        type: 'date',
        pdfFieldName: 'PeriodEnd',
        coord: { x: 160, y: 544, size: 10 },
        transform: 'formatDate',
    },
    totalReceipts: {
        label: 'Total Receipts ($)',
        source: 'override',
        type: 'currency',
        pdfFieldName: 'TotalReceipts',
        coord: { x: 160, y: 528, size: 10 },
        transform: 'formatCurrency',
    },
    totalDisbursements: {
        label: 'Total Disbursements ($)',
        source: 'override',
        type: 'currency',
        pdfFieldName: 'TotalDisbursements',
        coord: { x: 160, y: 512, size: 10 },
        transform: 'formatCurrency',
    },
    finalBalance: {
        label: 'Final Balance ($)',
        source: 'override',
        type: 'currency',
        pdfFieldName: 'FinalBalance',
        coord: { x: 160, y: 496, size: 10 },
        transform: 'formatCurrency',
    },
};

// FL-13: Receipt and Release
export const FL13_FIELD_REGISTRY: FLFormFieldMap = {
    ...FL_HEADER_FIELDS,
    beneficiaryName: {
        label: 'Beneficiary Name',
        source: 'override',
        type: 'text',
        required: true,
        pdfFieldName: 'BeneficiaryName',
        coord: { x: 160, y: 560, size: 10 },
    },
    distributionAmount: {
        label: 'Distribution Amount ($)',
        source: 'override',
        type: 'currency',
        required: true,
        pdfFieldName: 'DistributionAmount',
        coord: { x: 160, y: 544, size: 10 },
        transform: 'formatCurrency',
    },
    releaseDate: {
        label: 'Release Date',
        source: 'computed',
        type: 'date',
        pdfFieldName: 'ReleaseDate',
        coord: { x: 160, y: 528, size: 10 },
        transform: 'formatDate',
    },
};

// FL-14: Disposition Without Administration
export const FL14_FIELD_REGISTRY: FLFormFieldMap = {
    ...FL_HEADER_FIELDS,
    smallEstateValue: {
        label: 'Estate Value ($)',
        source: 'computed',
        type: 'currency',
        required: true,
        pdfFieldName: 'SmallEstateValue',
        coord: { x: 160, y: 560, size: 10 },
        transform: 'formatCurrency',
        description: 'Total estate value (must be under $10,000 for disposition without administration)',
    },
    claimantName: {
        label: 'Claimant Name',
        source: 'override',
        type: 'text',
        required: true,
        pdfFieldName: 'ClaimantName',
        coord: { x: 160, y: 544, size: 10 },
    },
    relationshipToDecedent: {
        label: 'Relationship to Decedent',
        source: 'override',
        type: 'text',
        required: true,
        pdfFieldName: 'Relationship',
        coord: { x: 160, y: 528, size: 10 },
    },
};

// FL-15: Homestead Property Petition
export const FL15_FIELD_REGISTRY: FLFormFieldMap = {
    ...FL_HEADER_FIELDS,
    propertyAddress: {
        label: 'Homestead Property Address',
        source: 'override',
        type: 'text',
        required: true,
        pdfFieldName: 'PropertyAddress',
        coord: { x: 160, y: 560, size: 10 },
    },
    propertyValue: {
        label: 'Property Value ($)',
        source: 'override',
        type: 'currency',
        required: true,
        pdfFieldName: 'PropertyValue',
        coord: { x: 160, y: 544, size: 10 },
        transform: 'formatCurrency',
    },
    survivingSpouseName: {
        label: 'Surviving Spouse Name',
        source: 'override',
        type: 'text',
        required: true,
        pdfFieldName: 'SpouseName',
        coord: { x: 160, y: 528, size: 10 },
    },
    minorChildNames: {
        label: 'Minor Children Names',
        source: 'override',
        type: 'text',
        pdfFieldName: 'MinorChildren',
        coord: { x: 160, y: 512, size: 10 },
    },
};

export const FL_FORM_REGISTRY: Record<string, FLFormFieldMap> = {
    'FL-1': FL1_FIELD_REGISTRY,
    'FL-2': FL2_FIELD_REGISTRY,
    'FL-3': FL3_FIELD_REGISTRY,
    'FL-4': FL4_FIELD_REGISTRY,
    'FL-5': FL5_FIELD_REGISTRY,
    'FL-6': FL6_FIELD_REGISTRY,
    'FL-7': FL7_FIELD_REGISTRY,
    'FL-8': FL8_FIELD_REGISTRY,
    'FL-9': FL9_FIELD_REGISTRY,
    'FL-10': FL10_FIELD_REGISTRY,
    'FL-11': FL11_FIELD_REGISTRY,
    'FL-12': FL12_FIELD_REGISTRY,
    'FL-13': FL13_FIELD_REGISTRY,
    'FL-14': FL14_FIELD_REGISTRY,
    'FL-15': FL15_FIELD_REGISTRY,
};

export type FLFormId = keyof typeof FL_FORM_REGISTRY;

export const FL_FORM_TITLES: Record<FLFormId, string> = {
    'FL-1': 'Petition for Administration',
    'FL-2': 'Petition for Summary Administration',
    'FL-3': 'Notice of Administration',
    'FL-4': 'Oath of Personal Representative',
    'FL-5': 'Letters of Administration',
    'FL-6': 'Inventory',
    'FL-7': 'Notice to Creditors',
    'FL-8': 'Proof of Claim',
    'FL-9': 'Objection to Claim',
    'FL-10': 'Accounting',
    'FL-11': 'Petition for Discharge',
    'FL-12': 'Final Accounting',
    'FL-13': 'Receipt and Release',
    'FL-14': 'Disposition Without Administration',
    'FL-15': 'Homestead Property Petition',
};

export function validateFLFormData(
    formId: FLFormId,
    data: Record<string, any>,
): string[] {
    const registry = FL_FORM_REGISTRY[formId];
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
