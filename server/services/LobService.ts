import Lob from 'lob';
import { prisma } from '../db.js';
import { logger } from '../lib/logger.js';

// Lob API Key should be in .env as LOB_SECRET_KEY
const LOB_SECRET_KEY = process.env.LOB_SECRET_KEY || 'test_secret_xxxxxxxx';
const lob = new (Lob as any)(LOB_SECRET_KEY);

export const LobService = {
    /**
     * Sends a letter via Lob.com
     * @param estateId The estate associated with the mailing
     * @param recipient The recipient details (name, address)
     * @param fileBuffer The PDF buffer to mail
     * @param targetType The type of recipient (HEIR, CREDITOR, INSTITUTION)
     * @param targetId The ID of the recipient record
     */
    async sendLetter(
        estateId: string,
        recipient: {
            name: string;
            address_line1: string;
            address_line2?: string;
            address_city: string;
            address_state: string;
            address_zip: string;
            address_country?: string;
        },
        fileBuffer: Buffer,
        targetType: 'HEIR' | 'CREDITOR' | 'INSTITUTION',
        targetId: string
    ) {
        try {
            logger.info(`📬 [LOB] Preparing to mail letter to ${recipient.name} (${targetType})`);

            // 1. Create the letter via Lob API
            const response = await lob.letters.create({
                description: `Probate Notification for Estate ${estateId}`,
                to: {
                    name: recipient.name,
                    address_line1: recipient.address_line1,
                    address_line2: recipient.address_line2,
                    address_city: recipient.address_city,
                    address_state: recipient.address_state,
                    address_zip: recipient.address_zip,
                    address_country: recipient.address_country || 'US',
                },
                from: {
                    name: 'Estate Administrator', // Should ideally pull from Estate/User profile
                    address_line1: '123 Main St', // Placeholder - implement sender address lookup
                    address_city: 'San Francisco',
                    address_state: 'CA',
                    address_zip: '94105',
                    address_country: 'US',
                },
                file: fileBuffer,
                color: false,
            });

            logger.info(`✅ [LOB] Letter created successfully. Lob ID: ${response.id}`);

            // 2. Track the mailing in our database
            const mailing = await (prisma as any).mailing.create({
                data: {
                    estateId,
                    targetType,
                    targetId,
                    lobId: response.id,
                    status: 'PENDING',
                    trackingUrl: response.tracking_events?.[0]?.url || null,
                },
            });

            return {
                success: true,
                lobId: response.id,
                mailingId: mailing.id,
                expectedDeliveryDate: response.expected_delivery_date,
            };
        } catch (error: any) {
            logger.error(`❌ [LOB] Failed to send letter: ${error.message}`);
            throw new Error(`Lob Mailing Error: ${error.message}`);
        }
    },

    /**
     * Syncs the status of a mailing from Lob
     */
    async syncMailingStatus(lobId: string) {
        try {
            const response = await lob.letters.retrieve(lobId);

            let status = 'PENDING';
            if (response.tracking_events?.some((e: any) => e.name === 'Delivered')) {
                status = 'DELIVERED';
            } else if (response.send_date) {
                status = 'SENT';
            }

            await (prisma as any).mailing.update({
                where: { lobId },
                data: {
                    status,
                    trackingUrl: response.tracking_events?.[0]?.url || null
                },
            });

            return status;
        } catch (error: any) {
            logger.error(`❌ [LOB] Sync failed for ${lobId}: ${error.message}`);
            return null;
        }
    }
};
