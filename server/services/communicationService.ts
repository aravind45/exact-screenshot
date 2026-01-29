import { prisma } from "../db.js";

export const CommunicationService = {
    async create(userId: string, data: any) {
        return await prisma.$transaction(async (tx) => {
            // 1. Create communication
            const communication = await tx.communication.create({
                data: {
                    estateId: data.estateId,
                    assetId: data.assetId,
                    type: data.type,
                    direction: data.direction,
                    occurredAt: new Date(data.occurredAt),
                    institutionName: data.institutionName,
                    contactName: data.contactName,
                    contactChannel: data.contactChannel,
                    subject: data.subject,
                    notes: data.notes,
                    followUpDueAt: data.followUpDueAt ? new Date(data.followUpDueAt) : null,
                    statusChange: data.statusChange,
                    statusChangeEffectiveAt: data.statusChangeEffectiveAt ? new Date(data.statusChangeEffectiveAt) : null,
                    createdBy: userId
                }
            });

            // 2. Update asset last contact and status
            const assetUpdateData: any = {
                lastContactDate: new Date(data.occurredAt)
            };

            if (data.statusChange && data.statusChange !== 'none') {
                assetUpdateData.status = data.statusChange;
            }

            await tx.asset.update({
                where: { id: data.assetId },
                data: assetUpdateData
            });

            // 3. Log Activity
            await tx.settlementActivity.create({
                data: {
                    estateId: data.estateId,
                    userId,
                    type: 'COMMUNICATION',
                    action: 'CREATED',
                    notes: `${data.direction === 'outbound' ? 'Sent' : 'Received'} ${data.type}: ${data.subject} (${data.institutionName})`
                }
            });

            return communication;
        });
    },

    async getByAsset(assetId: string, estateId: string) {
        return await prisma.communication.findMany({
            where: { assetId, estateId },
            orderBy: { occurredAt: 'desc' },
            include: { attachments: true }
        });
    },

    async getRecentByEstate(estateId: string, limit = 5) {
        return await prisma.communication.findMany({
            where: { estateId },
            take: limit,
            orderBy: { occurredAt: 'desc' },
            include: { asset: true }
        });
    },

    async delete(id: string, estateId: string) {
        return await prisma.$transaction(async (tx) => {
            const comm = await tx.communication.findUnique({ where: { id } });
            if (!comm || comm.estateId !== estateId) throw new Error("Not found or unauthorized");

            const assetId = comm.assetId;
            await tx.communication.delete({ where: { id } });

            // Recalculate last contact
            const latest = await tx.communication.findFirst({
                where: { assetId },
                orderBy: { occurredAt: 'desc' }
            });

            await tx.asset.update({
                where: { id: assetId },
                data: { lastContactDate: latest?.occurredAt || null }
            });

            // 3. Log Activity
            await tx.settlementActivity.create({
                data: {
                    estateId: estateId,
                    userId: comm.createdBy, // Use the creator's ID for the log
                    type: 'COMMUNICATION',
                    action: 'DELETED',
                    notes: `Deleted communication record for ${comm.institutionName}: ${comm.subject}`
                }
            });

            return { success: true };
        });
    },

    async getTimelineByEstate(estateId: string) {
        return await prisma.communication.findMany({
            where: { estateId },
            orderBy: { occurredAt: 'desc' },
            include: { asset: true, attachments: true }
        });
    },

    async search(estateId: string, query: string) {
        // Basic Prisma searching (Postgres FTS would be better but this is a start)
        return await prisma.communication.findMany({
            where: {
                estateId,
                OR: [
                    { subject: { contains: query, mode: 'insensitive' } },
                    { notes: { contains: query, mode: 'insensitive' } },
                    { institutionName: { contains: query, mode: 'insensitive' } },
                    { contactName: { contains: query, mode: 'insensitive' } }
                ]
            },
            orderBy: { occurredAt: 'desc' },
            include: { asset: true }
        });
    },

    async getInbox(estateId: string) {
        return await prisma.communication.findMany({
            where: {
                estateId,
                direction: 'inbound',
                type: 'email'
            },
            orderBy: { occurredAt: 'desc' },
            include: { asset: true, attachments: true }
        });
    },

    async getOutbox(estateId: string) {
        return await prisma.communication.findMany({
            where: {
                estateId,
                direction: 'outbound',
                type: 'email'
            },
            orderBy: { occurredAt: 'desc' },
            include: { asset: true, attachments: true }
        });
    },

    async update(id: string, userId: string, data: any) {
        return await prisma.$transaction(async (tx) => {
            const comm = await tx.communication.findUnique({ where: { id } });
            if (!comm || comm.createdBy !== userId) throw new Error("Not found or unauthorized");

            const updated = await tx.communication.update({
                where: { id },
                data: {
                    type: data.type,
                    direction: data.direction,
                    occurredAt: data.occurredAt ? new Date(data.occurredAt) : undefined,
                    institutionName: data.institutionName,
                    contactName: data.contactName,
                    contactChannel: data.contactChannel,
                    subject: data.subject,
                    notes: data.notes,
                    followUpDueAt: data.followUpDueAt ? new Date(data.followUpDueAt) : null,
                    statusChange: data.statusChange,
                }
            });

            // Sync status if changed
            if (data.statusChange && data.statusChange !== 'none') {
                await tx.asset.update({
                    where: { id: updated.assetId },
                    data: { status: data.statusChange }
                });
            }

            return updated;
        });
    }
};
