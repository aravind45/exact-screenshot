import { prisma } from "../db.js";
import { AgentService } from "./agentService.js";
import { encrypt, decrypt } from "../utils/encryption.js";
import { AuditService } from "../services/auditService.js";
import { logger } from "../lib/logger.js";
export const AssetService = {
    async getAll(userId, estateId) {
        const assets = await prisma.asset.findMany({
            where: {
                estateId: estateId || undefined,
                OR: [
                    { userId },
                    { estate: { grants: { some: { userId } } } }
                ]
            }
        });
        // Decrypt account numbers
        return assets.map(asset => ({
            ...asset,
            accountNumber: asset.accountNumber ? decrypt(asset.accountNumber) : asset.accountNumber
        }));
    },
    async getById(id, userId) {
        const asset = await prisma.asset.findFirst({
            where: {
                id,
                OR: [
                    { userId },
                    { estate: { grants: { some: { userId } } } }
                ]
            },
            include: { communications: true, newCommunications: true }
        });
        if (asset) {
            asset.accountNumber = asset.accountNumber ? decrypt(asset.accountNumber) : asset.accountNumber;
        }
        return asset;
    },
    async create(userId, data, explicitEstateId) {
        const estate = explicitEstateId
            ? await prisma.estate.findUnique({ where: { id: explicitEstateId } })
            : await prisma.estate.findFirst({
                where: {
                    OR: [
                        { userId },
                        { grants: { some: { userId } } }
                    ]
                }
            });
        if (!estate)
            throw new Error("No estate found.");
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
            logger.info(`Asset already exists: ${institution} (${assetType})`);
            return {
                ...existingAsset,
                accountNumber: existingAsset.accountNumber ? decrypt(existingAsset.accountNumber) : existingAsset.accountNumber
            };
        }
        const { getAssetAuthorityType, getStateRule } = await import("../../src/lib/authorityEngine.js");
        const rule = getStateRule(estate.deceasedState);
        const authType = getAssetAuthorityType({
            ownershipType: ownershipType || "INDIVIDUAL",
            value: value ? parseFloat(value) : 0
        }, rule.threshold);
        const asset = await prisma.asset.create({
            data: {
                userId,
                estateId: estate.id,
                institution,
                assetType,
                category,
                ownershipType: ownershipType || "INDIVIDUAL",
                authorityType: authType,
                value: value ? parseFloat(value) : 0,
                dateOfDeathValue: dateOfDeathValue ? parseFloat(dateOfDeathValue) : undefined,
                priority: priority || 'medium',
                status: status || 'discovered',
                accountNumber: data.accountNumber ? encrypt(data.accountNumber) : null,
                institutionPhone: data.institutionPhone,
                institutionEmail: data.institutionEmail,
                notes: data.notes
            },
        });
        // Agent Action: The Concierge (Proactive Enrichment)
        AgentService.runConciergeEnrichment(asset.id).catch(err => logger.error("Concierge Enrichment Error:", err.message));
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
        // Trigger Authority Re-assessment (Gap B)
        try {
            const { AuthorityService } = await import("./authorityService.js");
            const allAssets = await this.getAll(userId, estate.id); // Get all for this specific estate
            const { calculateAuthorityRecommendation } = await import("../../src/lib/authorityEngine.js");
            const newRec = calculateAuthorityRecommendation(allAssets, estate.deceasedState, {
                hasWill: estate.hasWill,
                isSpouse: estate.isSurvivingSpouse
            });
            await AuthorityService.handleReclassification(estate.id, userId, newRec);
        }
        catch (authErr) {
            logger.warn("Authority re-assessment failed (non-fatal):", authErr.message);
        }
        return {
            ...asset,
            accountNumber: asset.accountNumber ? decrypt(asset.accountNumber) : asset.accountNumber
        };
    },
    async update(id, userId, data) {
        const existing = await prisma.asset.findFirst({ where: { id, userId } });
        if (!existing)
            throw new Error("Access denied");
        const { institution, assetType, category, ownershipType, value, dateOfDeathValue, priority, status, accountNumber, institutionPhone, institutionEmail, institutionFax, institutionAddress, institutionUrl, notes, workflowState, settledValue, settledAt } = data;
        const { getAssetAuthorityType, getStateRule } = await import("../../src/lib/authorityEngine.js");
        const estateRecordForAuth = await prisma.estate.findUnique({
            where: { id: existing.estateId },
            select: { deceasedState: true }
        });
        const rule = getStateRule(estateRecordForAuth?.deceasedState);
        const authType = getAssetAuthorityType({
            ownershipType: ownershipType || existing.ownershipType,
            value: value !== undefined ? parseFloat(value) : (existing.value || 0)
        }, rule.threshold);
        const updated = await prisma.asset.update({
            where: { id },
            data: {
                institution,
                assetType,
                category,
                ownershipType,
                authorityType: authType,
                value: value ? parseFloat(value) : undefined,
                dateOfDeathValue: dateOfDeathValue ? parseFloat(dateOfDeathValue) : undefined,
                priority,
                status,
                accountNumber: accountNumber ? encrypt(accountNumber) : undefined,
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
        // Log Activity with intent and change detection
        let activityNote = `Updated asset: ${updated.institution} (${updated.assetType})`;
        if (existing.status !== updated.status) {
            activityNote = `ASSET – ${updated.institution} status changed from ${existing.status} to ${updated.status}`;
        }
        if (data.executorNote) {
            activityNote += ` | Note: ${data.executorNote}`;
        }
        await prisma.settlementActivity.create({
            data: {
                estateId: existing.estateId,
                userId,
                type: 'ASSET',
                action: 'UPDATED',
                notes: activityNote
            }
        });
        // Trigger Authority Re-assessment (Gap B)
        try {
            const { AuthorityService } = await import("./authorityService.js");
            const estate = await prisma.estate.findUnique({ where: { id: existing.estateId } });
            const allAssets = await this.getAll(userId, existing.estateId);
            const { calculateAuthorityRecommendation } = await import("../../src/lib/authorityEngine.js");
            if (estate) {
                const newRec = calculateAuthorityRecommendation(allAssets, estate.deceasedState, {
                    hasWill: estate.hasWill,
                    isSpouse: estate.isSurvivingSpouse
                });
                await AuthorityService.handleReclassification(estate.id, userId, newRec);
            }
        }
        catch (authErr) {
            logger.warn("Authority re-assessment failed (non-fatal):", authErr.message);
        }
        return {
            ...updated,
            accountNumber: updated.accountNumber ? decrypt(updated.accountNumber) : updated.accountNumber
        };
    },
    async delete(id, userId) {
        const existing = await prisma.asset.findFirst({ where: { id, userId } });
        if (!existing)
            throw new Error("Access denied");
        await prisma.asset.delete({
            where: { id }
        });
        // Log Activity
        await AuditService.logActivity(existing.estateId, userId, 'ASSET', 'DELETED', `Removed asset: ${existing.institution} (${existing.assetType})`);
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
        logger.info(`Auto-synced ${updated.count} assets for estate ${estateId} to 'contacted' status.`);
        return updated;
    }
};
