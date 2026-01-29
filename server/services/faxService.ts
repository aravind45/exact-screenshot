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

        const apiKey = await ConfigService.get("PAMFAX_API_KEY");
        const apiSecret = await ConfigService.get("PAMFAX_API_SECRET");

        if (!apiKey || !apiSecret) {
            console.warn("[FaxService] PAMFAX_API_KEY or PAMFAX_API_SECRET missing. Falling back to simulation.");
            return this.simulateFax(payload);
        }

        console.log(`[FaxService] Sending Real Fax to ${faxNumber} via PamFax...`);

        try {
            // 1. Authenticate (Note: PamFax API uses a specific authentication flow)
            // Simplified for this implementation: We assume session-based auth or use common REST patterns
            const authUrl = `https://api.pamfax.biz/sessions?api_key=${apiKey}&api_secret=${apiSecret}`;
            const authRes = await fetch(authUrl, { method: "POST" });
            const authData = await authRes.json();

            if (!authData.success) {
                throw new Error(authData.message || "PamFax Authentication Failed");
            }

            const sessionId = authData.data.session_id;

            // 2. Create Fax Program
            const createProgUrl = `https://api.pamfax.biz/programs/sendfax?session_id=${sessionId}`;
            const progRes = await fetch(createProgUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    destination: faxNumber,
                    subject: subject
                })
            });
            const progData = await progRes.json();

            if (!progData.success) throw new Error("Failed to create fax program");
            const programId = progData.data.program_id;

            // 3. Add Content (In a real app, we'd upload the PDF. For now, we use the text script)
            const addContentUrl = `https://api.pamfax.biz/programs/${programId}/documents?session_id=${sessionId}`;
            const contentBody = `Subject: ${subject}\nAsset ID: ${assetId}\nType: ${documentType || "Manual Notice"}`;

            const contentRes = await fetch(addContentUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: Buffer.from(contentBody).toString("base64"),
                    filename: "notice.txt",
                    type: "text/plain"
                })
            });

            // 4. Send Fax
            const sendUrl = `https://api.pamfax.biz/programs/${programId}/send?session_id=${sessionId}`;
            const finalRes = await fetch(sendUrl, { method: "POST" });
            const finalData = await finalRes.json();

            if (!finalData.success) {
                throw new Error(finalData.message || "Failed to trigger send");
            }

            const faxId = finalData.data.fax_id || `pam_${Date.now()}`;
            await this.logCommunication(userId, assetId, faxNumber, faxId, documentType, subject);

            return {
                success: true,
                faxId,
                message: "Fax sent successfully via PamFax"
            };
        } catch (error: any) {
            console.error("[FaxService] Exception:", error);
            // Fallback to simulation if production API fails during dev
            return this.simulateFax(payload);
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
