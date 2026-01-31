import { prisma } from "../db.js";
import { AgentService } from "./agentService.js";
export const AssetService = {
    async getAll(userId) {
        return await prisma.asset.findMany({
            where: {
                OR: [
                    { userId },
                    { estate: { grants: { some: { userId } } } }
                ]
            }
        });
    },
    async getById(id, userId) {
        return await prisma.asset.findFirst({
            where: {
                id,
                OR: [
                    { userId },
                    { estate: { grants: { some: { userId } } } }
                ]
            },
            include: { communications: true, newCommunications: true }
        });
    },
    async create(userId, data) {
        const estate = await prisma.estate.findFirst({
            where: {
                OR: [
                    { userId },
                    { grants: { some: { userId } } }
                ]
            }
        });
        if (!estate)
            throw new Error("No estate found for user.");
        const { institution, assetType, category, ownershipType, value, dateOfDeathValue, priority, status } = data;
        // Idempotency check: don't create duplicate assets for the same estate
        const existingAsset = await prisma.asset.findFirst({
            where: {
                estateId: estate.id,
                institution: { equals: institution, mode: 'insensitive' },
                assetType: { equals: assetType, mode: 'insensitive' }
            }
        });
        if (existingAsset) {
            console.log(`Asset already exists: ${institution} (${assetType})`);
            return existingAsset;
        }
        const asset = await prisma.asset.create({
            data: {
                userId,
                estateId: estate.id,
                institution,
                assetType,
                category,
                ownershipType: ownershipType || "INDIVIDUAL",
                value: value ? parseFloat(value) : 0,
                dateOfDeathValue: dateOfDeathValue ? parseFloat(dateOfDeathValue) : undefined,
                priority: priority || 'medium',
                status: status || 'discovered',
                accountNumber: data.accountNumber,
                institutionPhone: data.institutionPhone,
                institutionEmail: data.institutionEmail,
                notes: data.notes
            },
        });
        // Agent Action: The Concierge (Proactive Enrichment)
        AgentService.runConciergeEnrichment(asset.id).catch(err => console.error("Concierge Enrichment Error:", err));
        // Log Activity
        await prisma.settlementActivity.create({
            data: {
                estateId: estate.id,
                userId,
                type: 'ASSET',
                action: 'CREATED',
                notes: `Added asset: ${institution} (${assetType})`
            }
        });
        return asset;
    },
    async update(id, userId, data) {
        const existing = await prisma.asset.findFirst({ where: { id, userId } });
        if (!existing)
            throw new Error("Access denied");
        const { institution, assetType, category, ownershipType, value, dateOfDeathValue, priority, status, accountNumber, institutionPhone, institutionEmail, institutionFax, institutionAddress, institutionUrl, notes, workflowState, settledValue, settledAt } = data;
        const updated = await prisma.asset.update({
            where: { id },
            data: {
                institution,
                assetType,
                category,
                ownershipType,
                value: value ? parseFloat(value) : undefined,
                dateOfDeathValue: dateOfDeathValue ? parseFloat(dateOfDeathValue) : undefined,
                priority,
                status,
                accountNumber,
                institutionPhone,
                institutionEmail,
                institutionFax,
                institutionAddress,
                institutionUrl,
                notes,
                workflowState: workflowState !== undefined ? workflowState : undefined,
                settledValue: settledValue !== undefined ? parseFloat(settledValue) : undefined,
                settledAt: settledAt !== undefined ? new Date(settledAt) : undefined
            }
        });
        // Log Activity
        await prisma.settlementActivity.create({
            data: {
                estateId: existing.estateId,
                userId,
                type: 'ASSET',
                action: 'UPDATED',
                notes: `Updated asset: ${updated.institution} (${updated.assetType}). Status: ${updated.status || 'N/A'}`
            }
        });
        return updated;
    },
    async delete(id, userId) {
        const existing = await prisma.asset.findFirst({ where: { id, userId } });
        if (!existing)
            throw new Error("Access denied");
        await prisma.asset.delete({
            where: { id }
        });
        // Log Activity
        await prisma.settlementActivity.create({
            data: {
                estateId: existing.estateId,
                userId,
                type: 'ASSET',
                action: 'DELETED',
                notes: `Removed asset: ${existing.institution} (${existing.assetType})`
            }
        });
        return { success: true };
    },
    async autoSyncAssetsForEstate(estateId) {
        // Find all assets for this estate that are in 'discovered' status
        // and advance them to 'contacted' (In Progress) because authority is now granted
        const updated = await prisma.asset.updateMany({
            where: {
                estateId,
                status: 'discovered'
            },
            data: {
                status: 'contacted'
            }
        });
        console.log(`Auto-synced ${updated.count} assets for estate ${estateId} to 'contacted' status.`);
        return updated;
    }
};
