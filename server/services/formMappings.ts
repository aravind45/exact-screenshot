
import { FormMapping } from './formService.js';

export const DE160_MAPPING: FormMapping = {
    // Top Left: Attorney/Party Information
    'partyName': { x: 50, y: 755 },
    'partyAddress': { x: 50, y: 742 },
    'partyPhone': { x: 50, y: 729 },
    'partyEmail': { x: 50, y: 716 },
    'attorneyFor': { x: 50, y: 703 },

    // Court Information
    'courtName': { x: 85, y: 675 },
    'courtAddress': { x: 85, y: 663 },
    'courtBranch': { x: 85, y: 638 },

    // Case Header
    'estateOf': { x: 160, y: 605, size: 12, font: 'HelveticaBold' },
    'caseNumber': { x: 420, y: 565, size: 12 },

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
    'estateOf': { x: 160, y: 648, size: 12, font: 'HelveticaBold' },
    'caseNumber': { x: 420, y: 610, size: 12 },
    'lettersType': { x: 50, y: 580 }, // Placeholder for specific letter type X
};

export const DE111_MAPPING: FormMapping = {
    'attorneyName': { x: 50, y: 755 },
    'estateOf': { x: 160, y: 650, size: 12, font: 'HelveticaBold' },
    'caseNumber': { x: 420, y: 585, size: 12 },
};

export const FORM_MAPPINGS: Record<string, FormMapping> = {
    'DE-111': DE111_MAPPING,
    'DE-150': DE150_MAPPING,
    'DE-160': DE160_MAPPING,
};
