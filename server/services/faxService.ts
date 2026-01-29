import { prisma } from "../db.js";
import { CommunicationService } from "./communicationService.js";
import { ConfigService } from "./configService.js";

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

        const apiKey = await ConfigService.get("PHAXIO_API_KEY");
        const apiSecret = await ConfigService.get("PHAXIO_API_SECRET");

        if (!apiKey || !apiSecret) {
            console.warn("[FaxService] PHAXIO_API_KEY or PHAXIO_API_SECRET missing. Falling back to simulation.");
            return this.simulateFax(payload);
        }

        console.log(`[FaxService] Sending Real Fax to ${faxNumber} via Phaxio...`);

        try {
            const formData = new FormData();
            formData.append("to", faxNumber);
            // In a real app, we'd attach a file here. For now, we send a string/script if no file provided.
            formData.append("string_data", `Subject: ${subject}\nAsset ID: ${assetId}\nType: ${documentType || "Manual Notice"}`);
            formData.append("string_data_type", "text");

            const response = await fetch("https://api.phaxio.com/v2.1/faxes", {
                method: "POST",
                headers: {
                    "Authorization": `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`
                },
                body: formData
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                console.error("[FaxService] Phaxio Error:", result);
                throw new Error(result.message || "Fax Provider reported failure");
            }

            const faxId = result.data.id;
            await this.logCommunication(userId, assetId, faxNumber, faxId, documentType, subject);

            return {
                success: true,
                faxId,
                message: "Fax sent successfully via Phaxio"
            };
        } catch (error: any) {
            console.error("[FaxService] Exception:", error);
            throw new Error(`Fax failure: ${error.message}`);
        }
    },

    async simulateFax(payload: FaxPayload) {
        const { assetId, userId, faxNumber, documentType, subject = "Document Submission" } = payload;
        const faxId = `sim_${Date.now()}`;

        await this.logCommunication(userId, assetId, faxNumber, faxId, documentType, subject, true);

        return {
            success: true,
            faxId,
            message: "Fax simulated successfully (No API Keys provided)"
        };
    },

    async logCommunication(userId: string, assetId: string, faxNumber: string, faxId: string, documentType?: string, subject?: string, isSimulated = false) {
        const asset = await prisma.asset.findUnique({ where: { id: assetId } });
        if (!asset) throw new Error("Asset not found");

        const estate = await prisma.estate.findUnique({ where: { id: asset.estateId } });
        if (!estate) throw new Error("Estate not found");

        await CommunicationService.create(userId, {
            estateId: estate.id,
            assetId: asset.id,
            type: "fax",
            direction: "outbound",
            occurredAt: new Date().toISOString(),
            institutionName: asset.institution,
            subject: `${isSimulated ? '[SIMULATED] ' : ''}Outbound Fax: ${subject}`,
            notes: `Fax ID: ${faxId}. Sent to ${faxNumber}. Document: ${documentType || "N/A"}${isSimulated ? '\n(Simulation Mode)' : ''}`,
            contactChannel: "fax",
            statusChange: asset.status === 'discovered' ? 'contacted' : undefined
        });

        if (asset.status === 'discovered') {
            await prisma.asset.update({
                where: { id: assetId },
                data: { status: 'contacted' }
            });
        }
    }
};
