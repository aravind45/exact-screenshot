/**
 * NJ Form Field Registry
 *
 * Defines the field mapping schema and PDF field registry for New Jersey
 * Surrogate's Court probate forms.
 *
 * Supported forms: NJ-1 (Application for Probate), NJ-2 (Authorization)
 */
const NJ_HEADER_FIELDS = {
    petitionerName: {
        label: 'Petitioner Full Name',
        source: 'user',
        path: 'fullName',
        type: 'text',
        required: true,
        description: 'Full legal name of the executor or administrator',
    },
    petitionerAddress: {
        label: 'Petitioner Address',
        source: 'user',
        path: 'address',
        type: 'text',
        description: 'Street address of the petitioner',
    },
    surrogateCounty: {
        label: 'Surrogate Court County',
        source: 'estate',
        path: 'probateCounty',
        type: 'text',
        required: true,
        description: 'New Jersey county where the decedent resided',
    },
    decedentName: {
        label: 'Decedent Full Name',
        source: 'computed',
        type: 'text',
        required: true,
        transform: 'uppercase',
    },
    dateOfDeath: {
        label: 'Date of Death',
        source: 'estate',
        path: 'deceasedDateOfDeath',
        type: 'date',
        transform: 'formatDate',
    },
};
export const NJ1_FIELD_REGISTRY = {
    ...NJ_HEADER_FIELDS,
    decedentResidence: {
        label: 'Decedent Residence',
        source: 'estate',
        path: 'deceasedAddress',
        type: 'text',
        required: true,
    },
    hasWill: {
        label: 'Has Will',
        source: 'estate',
        path: 'hasWill',
        type: 'checkbox',
    },
};
export const NJ2_FIELD_REGISTRY = {
    ...NJ_HEADER_FIELDS,
};
export const NJ_FORM_REGISTRY = {
    'NJ-1': NJ1_FIELD_REGISTRY,
    'NJ-2': NJ2_FIELD_REGISTRY,
};
export const NJ_FORM_TITLES = {
    'NJ-1': 'Application for Probate',
    'NJ-2': 'Authorization to Accept Service of Process',
};
export function validateNJFormData(formId, data) {
    const registry = NJ_FORM_REGISTRY[formId];
    if (!registry)
        return [`Unknown form ID: ${formId}`];
    const errors = [];
    for (const [key, def] of Object.entries(registry)) {
        if (!def.required)
            continue;
        if (def.source === 'computed')
            continue;
        const value = def.path ? getNestedValue(data, def.path) : data[key];
        if (value === undefined || value === null || value === '') {
            errors.push(`${def.label} is required`);
        }
    }
    return errors;
}
function getNestedValue(obj, path) {
    return path.split('.').reduce((acc, key) => acc?.[key], obj);
}
