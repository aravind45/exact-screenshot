/**
 * TX Form Field Registry
 *
 * Defines the field mapping schema and PDF field registry for
 * Texas probate forms. Texas has unique forms including
 * independent administration and muniment of title.
 *
 * Supported forms: TX-1, TX-2, TX-3, TX-4, TX-5, TX-6, TX-7, TX-8, TX-9, TX-10, TX-11, TX-12
 */
const TX_HEADER_FIELDS = {
    applicantName: {
        label: 'Applicant Name',
        source: 'user',
        path: 'fullName',
        type: 'text',
        required: true,
        pdfFieldName: 'ApplicantName',
        coord: { x: 50, y: 710, size: 11, bold: true },
        description: 'Name of the applicant (executor or administrator)',
    },
    applicantAddress: {
        label: 'Applicant Address',
        source: 'user',
        path: 'address',
        type: 'text',
        pdfFieldName: 'ApplicantAddress',
        coord: { x: 50, y: 696, size: 10 },
    },
    applicantCity: {
        label: 'Applicant City',
        source: 'user',
        path: 'city',
        type: 'text',
        pdfFieldName: 'ApplicantCity',
        coord: { x: 50, y: 682, size: 10 },
    },
    applicantState: {
        label: 'Applicant State',
        source: 'user',
        path: 'state',
        type: 'text',
        pdfFieldName: 'ApplicantState',
        coord: { x: 200, y: 682, size: 10 },
    },
    applicantZip: {
        label: 'Applicant ZIP',
        source: 'user',
        path: 'zip',
        type: 'text',
        pdfFieldName: 'ApplicantZip',
        coord: { x: 260, y: 682, size: 10 },
    },
    applicantPhone: {
        label: 'Applicant Phone',
        source: 'estate',
        path: 'petitionerPhone',
        type: 'text',
        pdfFieldName: 'ApplicantPhone',
        coord: { x: 50, y: 668, size: 10 },
        transform: 'formatPhone',
    },
    applicantEmail: {
        label: 'Applicant Email',
        source: 'user',
        path: 'personalEmail',
        type: 'text',
        pdfFieldName: 'ApplicantEmail',
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
// TX-1: Application for Probate of Will
export const TX1_FIELD_REGISTRY = {
    ...TX_HEADER_FIELDS,
    willDate: {
        label: 'Will Execution Date',
        source: 'estate',
        path: 'willDate',
        type: 'date',
        pdfFieldName: 'WillDate',
        coord: { x: 160, y: 560, size: 10 },
        transform: 'formatDate',
    },
    executorName: {
        label: 'Executor Name',
        source: 'computed',
        type: 'text',
        pdfFieldName: 'ExecutorName',
        coord: { x: 160, y: 544, size: 10 },
    },
    independentAdministration: {
        label: 'Independent Administration',
        source: 'estate',
        path: 'administrationType',
        type: 'checkbox',
        pdfFieldName: 'IndependentAdmin',
        coord: { x: 58, y: 528, size: 10 },
        description: 'Request for independent administration (Texas unique)',
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
// TX-2: Application for Letters of Administration
export const TX2_FIELD_REGISTRY = {
    ...TX_HEADER_FIELDS,
    administratorName: {
        label: 'Proposed Administrator',
        source: 'computed',
        type: 'text',
        pdfFieldName: 'AdministratorName',
        coord: { x: 160, y: 560, size: 10 },
    },
    heirSummary: {
        label: 'Heir Summary',
        source: 'computed',
        type: 'text',
        pdfFieldName: 'HeirSummary',
        coord: { x: 160, y: 544, size: 10 },
        description: 'Summary of next of kin and relationships',
    },
};
// TX-3: Application for Independent Administration
export const TX3_FIELD_REGISTRY = {
    ...TX_HEADER_FIELDS,
    independentAdministration: {
        label: 'Independent Administration Requested',
        source: 'estate',
        path: 'administrationType',
        type: 'checkbox',
        pdfFieldName: 'IndependentAdmin',
        coord: { x: 58, y: 560, size: 10 },
        description: 'Texas unique: Independent administration without court supervision',
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
};
// TX-4: Order Admitting Will to Probate
export const TX4_FIELD_REGISTRY = {
    ...TX_HEADER_FIELDS,
    orderDate: {
        label: 'Order Date',
        source: 'computed',
        type: 'date',
        pdfFieldName: 'OrderDate',
        coord: { x: 160, y: 560, size: 10 },
        transform: 'formatDate',
    },
    executorName: {
        label: 'Executor Name',
        source: 'computed',
        type: 'text',
        pdfFieldName: 'ExecutorName',
        coord: { x: 160, y: 544, size: 10 },
    },
};
// TX-5: Letters Testamentary
export const TX5_FIELD_REGISTRY = {
    ...TX_HEADER_FIELDS,
    executorName: {
        label: 'Executor Name',
        source: 'computed',
        type: 'text',
        pdfFieldName: 'ExecutorName',
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
// TX-6: Letters of Administration
export const TX6_FIELD_REGISTRY = {
    ...TX_HEADER_FIELDS,
    administratorName: {
        label: 'Administrator Name',
        source: 'computed',
        type: 'text',
        pdfFieldName: 'AdministratorName',
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
// TX-7: Inventory, Appraisement and List of Claims
export const TX7_FIELD_REGISTRY = {
    ...TX_HEADER_FIELDS,
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
    claimsOwed: {
        label: 'Total Claims Owed ($)',
        source: 'estate',
        path: 'estimatedLiabilities',
        type: 'currency',
        pdfFieldName: 'ClaimsOwed',
        coord: { x: 160, y: 496, size: 10 },
        transform: 'formatCurrency',
    },
};
// TX-8: Annual Account
export const TX8_FIELD_REGISTRY = {
    ...TX_HEADER_FIELDS,
    accountPeriodStart: {
        label: 'Account Period Start',
        source: 'override',
        type: 'date',
        pdfFieldName: 'AccountPeriodStart',
        coord: { x: 160, y: 560, size: 10 },
        transform: 'formatDate',
    },
    accountPeriodEnd: {
        label: 'Account Period End',
        source: 'override',
        type: 'date',
        pdfFieldName: 'AccountPeriodEnd',
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
// TX-9: Application to Close Estate
export const TX9_FIELD_REGISTRY = {
    ...TX_HEADER_FIELDS,
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
        description: 'Brief summary of how the estate will be distributed',
    },
};
// TX-10: Final Account
export const TX10_FIELD_REGISTRY = {
    ...TX_HEADER_FIELDS,
    accountPeriodStart: {
        label: 'Account Period Start',
        source: 'override',
        type: 'date',
        pdfFieldName: 'AccountPeriodStart',
        coord: { x: 160, y: 560, size: 10 },
        transform: 'formatDate',
    },
    accountPeriodEnd: {
        label: 'Account Period End',
        source: 'override',
        type: 'date',
        pdfFieldName: 'AccountPeriodEnd',
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
// TX-11: Small Estate Affidavit
export const TX11_FIELD_REGISTRY = {
    ...TX_HEADER_FIELDS,
    smallEstateValue: {
        label: 'Small Estate Value ($)',
        source: 'computed',
        type: 'currency',
        required: true,
        pdfFieldName: 'SmallEstateValue',
        coord: { x: 160, y: 560, size: 10 },
        transform: 'formatCurrency',
        description: 'Total estate value (must be under $75,000 for small estate affidavit)',
    },
    heirSummary: {
        label: 'Heir Summary',
        source: 'computed',
        type: 'text',
        pdfFieldName: 'HeirSummary',
        coord: { x: 160, y: 544, size: 10 },
        description: 'Summary of heirs and their relationships',
    },
};
// TX-12: Muniment of Title (Texas unique)
export const TX12_FIELD_REGISTRY = {
    ...TX_HEADER_FIELDS,
    willDate: {
        label: 'Will Execution Date',
        source: 'estate',
        path: 'willDate',
        type: 'date',
        pdfFieldName: 'WillDate',
        coord: { x: 160, y: 560, size: 10 },
        transform: 'formatDate',
    },
    executorName: {
        label: 'Executor Name',
        source: 'computed',
        type: 'text',
        pdfFieldName: 'ExecutorName',
        coord: { x: 160, y: 544, size: 10 },
    },
    propertyDescription: {
        label: 'Property Description',
        source: 'override',
        type: 'text',
        required: true,
        pdfFieldName: 'PropertyDescription',
        coord: { x: 160, y: 528, size: 10 },
        description: 'Legal description of property to be transferred',
    },
};
export const TX_FORM_REGISTRY = {
    'TX-1': TX1_FIELD_REGISTRY,
    'TX-2': TX2_FIELD_REGISTRY,
    'TX-3': TX3_FIELD_REGISTRY,
    'TX-4': TX4_FIELD_REGISTRY,
    'TX-5': TX5_FIELD_REGISTRY,
    'TX-6': TX6_FIELD_REGISTRY,
    'TX-7': TX7_FIELD_REGISTRY,
    'TX-8': TX8_FIELD_REGISTRY,
    'TX-9': TX9_FIELD_REGISTRY,
    'TX-10': TX10_FIELD_REGISTRY,
    'TX-11': TX11_FIELD_REGISTRY,
    'TX-12': TX12_FIELD_REGISTRY,
};
export const TX_FORM_TITLES = {
    'TX-1': 'Application for Probate of Will',
    'TX-2': 'Application for Letters of Administration',
    'TX-3': 'Application for Independent Administration',
    'TX-4': 'Order Admitting Will to Probate',
    'TX-5': 'Letters Testamentary',
    'TX-6': 'Letters of Administration',
    'TX-7': 'Inventory, Appraisement and List of Claims',
    'TX-8': 'Annual Account',
    'TX-9': 'Application to Close Estate',
    'TX-10': 'Final Account',
    'TX-11': 'Small Estate Affidavit',
    'TX-12': 'Muniment of Title',
};
export function validateTXFormData(formId, data) {
    const registry = TX_FORM_REGISTRY[formId];
    if (!registry)
        return [`Unknown form ID: ${formId}`];
    const errors = [];
    for (const [key, def] of Object.entries(registry)) {
        if (!def.required)
            continue;
        if (def.source === 'computed')
            continue;
        const base = def.source === 'user' ? data.user : data;
        const value = def.path ? getNestedValue(base, def.path) : data[key];
        if (value === undefined || value === null || value === '') {
            errors.push(`${def.label} is required`);
        }
    }
    return errors;
}
function getNestedValue(obj, path) {
    return path.split('.').reduce((acc, key) => acc?.[key], obj);
}
