import { FormMapping } from './DocumentService.js';

/**
 * Standard California Judicial Council Form Header (Top Sections)
 * Matches box positions for DE-111, DE-160, DE-150, DE-121, etc.
 */
export const CA_HEADER: FormMapping = {
    // ATTORNEY OR PARTY WITHOUT ATTORNEY (Name, State Bar number, and address)
    'partyName': { x: 50, y: 715 },
    'attorneyName': { x: 50, y: 715 },
    'partyAddress': { x: 50, y: 702 },
    'partyPhone': { x: 50, y: 689 },
    'partyEmail': { x: 50, y: 676 },
    'attorneyFor': { x: 50, y: 663 },

    // SUPERIOR COURT OF CALIFORNIA, COUNTY OF
    'courtCounty': { x: 130, y: 635, font: 'HelveticaBold' },
    'courtName': { x: 85, y: 635 },
    'courtAddress': { x: 85, y: 623 },
    'courtBranch': { x: 85, y: 598 },

    // ESTATE OF (Name): DECEDENT
    'estateOf': { x: 160, y: 575, size: 12, font: 'HelveticaBold' },

    // CASE NUMBER (Right side box)
    'caseNumber': { x: 420, y: 540, size: 12 },
};

export const DE160_MAPPING: FormMapping = {
    ...CA_HEADER,
    // checkboxes (Simplified examples)
    'checkInventoryTypeFinal': { x: 88, y: 538 },
    'checkInventoryTypePartial': { x: 88, y: 525 },
    'checkInventoryTypeSupplemental': { x: 88, y: 512 },

    // Totals
    'totalAttachment1': { x: 480, y: 395 },
    'totalAttachment2': { x: 480, y: 382 },
    'totalInventory': { x: 480, y: 369 },
};

export const DE150_MAPPING: FormMapping = {
    ...CA_HEADER,
    // Appointment Checkboxes
    'checkExecutor': { x: 58, y: 554 },
    'checkAdministratorWithWill': { x: 58, y: 542 },
    'checkAdministrator': { x: 58, y: 530 },
    'checkSpecialAdministrator': { x: 58, y: 518 },

    // IAEA
    'iaeaFull': { x: 124, y: 505 },
    'iaeaLimited': { x: 124, y: 492 },

    // Dates
    'dateAppointed': { x: 160, y: 468 },
};

export const DE111_MAPPING: FormMapping = {
    ...CA_HEADER,
    'petitionerName': { x: 160, y: 612 },

    // Probate type checkboxes
    'checkProbateOfWill': { x: 58, y: 545 },
    'checkLettersOfAdministration': { x: 58, y: 533 },
    'checkLettersOfAmSpecial': { x: 58, y: 521 },
};

export const DE121_MAPPING: FormMapping = {
    ...CA_HEADER,
    'noticeDate': { x: 160, y: 450 },
    'noticeTime': { x: 300, y: 450 },
};

export const FORM_MAPPINGS: Record<string, FormMapping> = {
    'DE-111': DE111_MAPPING,
    'DE-121': DE121_MAPPING,
    'DE-150': DE150_MAPPING,
    'DE-160': DE160_MAPPING,
};

/**
 * Maps Judicial Council and statutory forms to their required Authority Engines.
 * Used for authority-driven filtering and readiness logic.
 */
export const FORM_AUTHORITIES: Record<string, string> = {
    // ── California (DE-*) ───────────────────────────────────────────────
    'DE-111': 'COURT_REQUIRED',
    'DE-121': 'COURT_REQUIRED',
    'DE-150': 'COURT_REQUIRED',
    'DE-160': 'COURT_REQUIRED',
    'DE-110': 'COURT_REQUIRED',
    'DE-112': 'COURT_REQUIRED',
    'DE-120': 'COURT_REQUIRED',
    'DE-122': 'COURT_REQUIRED',
    'DE-157': 'COURT_REQUIRED',
    'DE-161': 'COURT_REQUIRED',
    'DE-165': 'COURT_REQUIRED',
    'DE-172': 'COURT_REQUIRED',
    'DE-174': 'COURT_REQUIRED',
    'DE-221': 'COURT_REQUIRED',
    'DE-226': 'COURT_REQUIRED',
    'DE-295': 'COURT_REQUIRED',
    'DE-305': 'COURT_REQUIRED',
    'DE-310': 'COURT_REQUIRED',
    'DE-350': 'COURT_REQUIRED',

    // ── New York (ET-*) ─────────────────────────────────────────────────
    'ET-1': 'COURT_REQUIRED',
    'ET-2': 'COURT_REQUIRED',
    'ET-3': 'COURT_REQUIRED',
    'ET-4': 'COURT_REQUIRED',
    'ET-5': 'COURT_REQUIRED',
    'ET-6': 'COURT_REQUIRED',
    'ET-7': 'COURT_REQUIRED',
    'ET-8': 'COURT_REQUIRED',
    'ET-9': 'COURT_REQUIRED',
    'ET-10': 'COURT_REQUIRED',
    'ET-11': 'COURT_REQUIRED',
    'ET-12': 'COURT_REQUIRED',
    'ET-13': 'COURT_REQUIRED',
    'ET-14': 'AFFIDAVIT_SMALL',
    'ET-15': 'AFFIDAVIT_SMALL',

    // ── Texas (TX-*) ────────────────────────────────────────────────────
    'TX-1': 'COURT_REQUIRED',
    'TX-2': 'COURT_REQUIRED',
    'TX-3': 'COURT_REQUIRED',
    'TX-4': 'COURT_REQUIRED',
    'TX-5': 'COURT_REQUIRED',
    'TX-6': 'COURT_REQUIRED',
    'TX-7': 'COURT_REQUIRED',
    'TX-8': 'COURT_REQUIRED',
    'TX-9': 'COURT_REQUIRED',
    'TX-10': 'COURT_REQUIRED',
    'TX-11': 'AFFIDAVIT_SMALL',
    'TX-12': 'COURT_REQUIRED',

    // ── Florida (FL-*) ──────────────────────────────────────────────────
    'FL-1': 'COURT_REQUIRED',
    'FL-2': 'AFFIDAVIT_SMALL',
    'FL-3': 'COURT_REQUIRED',
    'FL-4': 'COURT_REQUIRED',
    'FL-5': 'COURT_REQUIRED',
    'FL-6': 'COURT_REQUIRED',
    'FL-7': 'COURT_REQUIRED',
    'FL-8': 'COURT_REQUIRED',
    'FL-9': 'COURT_REQUIRED',
    'FL-10': 'COURT_REQUIRED',
    'FL-11': 'COURT_REQUIRED',
    'FL-12': 'COURT_REQUIRED',
    'FL-13': 'COURT_REQUIRED',
    'FL-14': 'AFFIDAVIT_SMALL',
    'FL-15': 'COURT_REQUIRED',

    // ── Generic / Cross-State ───────────────────────────────────────────
    // Trustee Direct (Templates)
    'Notice 16061.7': 'TRUSTEE_DIRECT',
    'Certification of Trust': 'TRUSTEE_DIRECT',
    'Notice to Creditors (Trust)': 'TRUSTEE_DIRECT',

    // Small Estate Affidavit
    'Affidavit for Collection': 'AFFIDAVIT_SMALL',
    'Small Estate Affidavit': 'AFFIDAVIT_SMALL',

    // Beneficiary / Joint
    'Claim for Life Insurance': 'BENEFICIARY_CONTRACT',
    'Affidavit of Death of Joint Tenant': 'SURVIVORSHIP_TITLE',
};
