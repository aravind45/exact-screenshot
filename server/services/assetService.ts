import { prisma } from "../db.js";
import { AgentService } from "./agentService.js";

export const AssetService = {
    async getAll(userId: string) {
        return await prisma.asset.findMany({
            where: { userId }
        });
    },

    async getById(id: string, userId: string) {
        return await prisma.asset.findFirst({
            where: { id, userId },
            include: { communications: true, newCommunications: true }
        });
    },

    async create(userId: string, data: any) {
        const estate = await prisma.estate.findFirst({ where: { userId } });
        if (!estate) throw new Error("No estate found for user.");

        const { institution, assetType, category, ownershipType, value, priority, status } = data;

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
                priority: priority || 'medium',
                status: status || 'discovered',
                accountNumber: data.accountNumber,
                institutionPhone: data.institutionPhone,
                institutionEmail: data.institutionEmail,
                notes: data.notes
            },
        });

        // Agent Action: The Concierge (Proactive Enrichment)
        AgentService.runConciergeEnrichment(asset.id).catch(err =>
            console.error("Concierge Enrichment Error:", err)
        );

        return asset;
    },

    async update(id: string, userId: string, data: any) {
        const existing = await prisma.asset.findFirst({ where: { id, userId } });
        if (!existing) throw new Error("Access denied");

        const {
            institution,
            assetType,
            category,
            ownershipType,
            value,
            priority,
            status,
            accountNumber,
            institutionPhone,
            institutionEmail,
            institutionFax,
            institutionAddress,
            institutionUrl,
            notes,
            workflowState
        } = data;

        return await prisma.asset.update({
            where: { id },
            data: {
                institution,
                assetType,
                category,
                ownershipType,
                value: value ? parseFloat(value) : undefined,
                priority,
                status,
                accountNumber,
                institutionPhone,
                institutionEmail,
                institutionFax,
                institutionAddress,
                institutionUrl,
                notes,
                workflowState: workflowState !== undefined ? workflowState : undefined
            }
        });
    },

    async delete(id: string, userId: string) {
        const existing = await prisma.asset.findFirst({ where: { id, userId } });
        if (!existing) throw new Error("Access denied");

        await prisma.asset.delete({
            where: { id }
        });
        return { success: true };
    }
};
