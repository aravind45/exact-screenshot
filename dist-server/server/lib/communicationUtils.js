import { CommunicationDirections, CommunicationTypes, CommunicationChannels } from './communicationConstants.js';
export const normalizeDirection = (val) => {
    const upper = val.toUpperCase().trim();
    if (upper === 'INBOUND' || upper === 'IN')
        return CommunicationDirections.INBOUND;
    if (upper === 'OUTBOUND' || upper === 'OUT')
        return CommunicationDirections.OUTBOUND;
    return upper; // Fallback to raw if not matched
};
export const normalizeType = (val) => {
    const upper = val.toUpperCase().trim();
    // Common mappings
    if (upper === 'PHONE' || upper === 'CALL')
        return CommunicationTypes.CALL;
    if (upper === 'EMAIL')
        return CommunicationTypes.EMAIL;
    if (upper === 'MAIL' || upper === 'POSTAL')
        return CommunicationTypes.POSTAL_MAIL;
    if (upper === 'FAX')
        return CommunicationTypes.FAX;
    if (upper === 'NOTE' || upper === 'ACTIVITY_NOTE')
        return CommunicationTypes.NOTE;
    return upper;
};
export const normalizeChannel = (val) => {
    const upper = val.toUpperCase().trim();
    if (upper === 'PHONE')
        return CommunicationChannels.PHONE;
    if (upper === 'EMAIL')
        return CommunicationChannels.EMAIL;
    if (upper === 'MAIL' || upper === 'PHYSICAL')
        return CommunicationChannels.PHYSICAL_MAIL;
    if (upper === 'FAX')
        return CommunicationChannels.FAX;
    if (upper === 'PORTAL')
        return CommunicationChannels.PORTAL;
    if (upper === 'IN_PERSON' || upper === 'IN PERSON')
        return CommunicationChannels.IN_PERSON;
    return upper;
};
