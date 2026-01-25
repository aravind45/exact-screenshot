import { prisma } from "../db.js";
import { CommunicationService } from "./communicationService.js";

interface FaxPayload {
    assetId: string;
    userId: string;
    faxNumber: string;
    documentType?: string;
    subject?: string;
}

export const FaxService = {
    async sendFax(payload: FaxPayload) {
        const { assetId, userId, faxNumber, documentType, subject = "Document Submission" } = payload;

        console.log(`[FaxService] Sending Fax to ${faxNumber} for Asset ${assetId}`);

        // In a real implementation, we would call the PamFax / Interfax API
        // const response = await pamFax.send({ number: faxNumber, file: ... });

        // MOCK SUCCESS
        const faxId = `fax_${Date.now()}`;
        const mockSuccess = true;

        if (!mockSuccess) {
            throw new Error("Fax Provider Error: Service unavailable");
        }

        const asset = await prisma.asset.findUnique({ where: { id: assetId } });
        if (!asset) throw new Error("Asset not found");

        const estate = await prisma.estate.findUnique({ where: { id: asset.estateId } });
        if (!estate) throw new Error("Estate not found");

        // 1. Log Communication
        await CommunicationService.create(userId, {
            estateId: estate.id,
            assetId: asset.id,
            type: "fax",
            direction: "outbound",
            occurredAt: new Date().toISOString(),
            institutionName: asset.institution,
            subject: `Outbound Fax: ${subject}`,
            notes: `Fax ID: ${faxId}. Sent to ${faxNumber}. Document: ${documentType || "N/A"}`,
            contactChannel: "fax",
            statusChange: asset.status === 'discovered' ? 'contacted' : undefined
        });

        // 2. If asset was in 'discovered', advance to 'contacted'
        if (asset.status === 'discovered') {
            await prisma.asset.update({
                where: { id: assetId },
                data: { status: 'contacted' }
            });
        }

        return {
            success: true,
            faxId,
            message: "Fax queued successfully"
        };
    }
};
