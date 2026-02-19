export const CommunicationDirections = {
    INBOUND: 'INBOUND',
    OUTBOUND: 'OUTBOUND'
} as const;

export const CommunicationTypes = {
    CALL: 'CALL',
    EMAIL: 'EMAIL',
    FACE_TO_FACE: 'FACE_TO_FACE',
    POSTAL_MAIL: 'POSTAL_MAIL',
    FAX: 'FAX',
    NOTE: 'NOTE',
    OTHER: 'OTHER'
} as const;

export const CommunicationChannels = {
    PHONE: 'PHONE',
    EMAIL: 'EMAIL',
    PHYSICAL_MAIL: 'PHYSICAL_MAIL',
    FAX: 'FAX',
    IN_PERSON: 'IN_PERSON',
    PORTAL: 'PORTAL',
    OTHER: 'OTHER'
} as const;

export type CommunicationDirection = keyof typeof CommunicationDirections;
export type CommunicationType = keyof typeof CommunicationTypes;
export type CommunicationChannel = keyof typeof CommunicationChannels;
