import { FormMapping } from './formService.js';

/**
 * Standard California Judicial Council Form Header (Top Sections)
 * Matches box positions for DE-111, DE-160, DE-150, DE-121, etc.
 */
export const CA_HEADER: FormMapping = {
    // ATTORNEY OR PARTY WITHOUT ATTORNEY (Name, State Bar number, and address)
    'partyName': { x: 50, y: 755 },
    'attorneyName': { x: 50, y: 755 },
    'partyAddress': { x: 50, y: 742 },
    'partyPhone': { x: 50, y: 729 },
    'partyEmail': { x: 50, y: 716 },
    'attorneyFor': { x: 50, y: 703 },

    // SUPERIOR COURT OF CALIFORNIA, COUNTY OF
    'courtCounty': { x: 130, y: 675, font: 'HelveticaBold' },
    'courtName': { x: 85, y: 675 },
    'courtAddress': { x: 85, y: 663 },
    'courtBranch': { x: 85, y: 638 },

    // ESTATE OF (Name): DECEDENT
    'estateOf': { x: 160, y: 605, size: 12, font: 'HelveticaBold' },

    // CASE NUMBER (Right side box)
    'caseNumber': { x: 420, y: 565, size: 12 },
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
    'petitionerName': { x: 160, y: 652 },

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
