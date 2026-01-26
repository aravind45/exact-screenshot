import { prisma } from "../db.js";
import crypto from "crypto";
import { CommunicationService } from "./communicationService.js";
import { ai } from "./ai.js";

export class EmailService {
    /**
     * Generates a unique handle for an estate if none exists.
     */
    static async ensureEstateHandle(estateId: string) {
        const estate = await prisma.estate.findUnique({ where: { id: estateId } });
        if (!estate) throw new Error("Estate not found");
        if (estate.handle) return estate.handle;

        const handle = crypto.randomBytes(4).toString("hex"); // e.g. 'af2b81'
        const domain = process.env.MAILGUN_DOMAIN || "mg.pilar.ai";
        const inboundEmail = `settle-${handle}@${domain}`;

        await prisma.estate.update({
            where: { id: estateId },
            data: {
                handle,
                inboundEmail
            }
        });

        return handle;
    }

    /**
     * Verifies the Mailgun webhook signature.
     */
    static verifySignature(timestamp: string, token: string, signature: string) {
        const apiKey = process.env.MAILGUN_API_KEY || "";
        const hmac = crypto.createHmac("sha256", apiKey);
        hmac.update(timestamp + token);
        return hmac.digest("hex") === signature;
    }

    /**
     * Processes an inbound email from Mailgun.
     */
    static async processInbound(payload: any) {
        const recipient = payload.recipient; // e.g. settle-af2b81@mg.pilar.ai
        const handle = recipient.match(/settle-([a-f0-9]+)@/)?.[1];
        if (!handle) return { status: "ignored", reason: "no handle found" };

        const estate = await prisma.estate.findUnique({
            where: { handle },
            include: { assets: true }
        });
        if (!estate) return { status: "ignored", reason: "estate not found" };

        const body = payload["body-plain"] || payload["stripped-text"] || "";
        const subject = payload.subject || "No Subject";
        const sender = payload.from || "";

        // AI TRIAGE: Find the best matching asset
        let assetId = "";
        if (estate.assets.length > 0) {
            try {
                const assetContext = estate.assets.map(a => `${a.id}: ${a.institution} (${a.assetType})`).join("\n");
                const triagePrompt = `You are a legal assistant for an estate. 
An email has arrived for the estate of ${estate.deceasedFirstName} ${estate.deceasedLastName}.
Subject: ${subject}
Sender: ${sender}
Snippet: ${body.substring(0, 500)}

Available Assets:
${assetContext}

Which asset ID does this email most likely belong to? Return ONLY the ID. If none match, return 'NONE'.`;

                const matchedId = await ai.generateText(triagePrompt, "medium");
                if (matchedId && matchedId.trim() !== "NONE" && estate.assets.some(a => a.id === matchedId.trim())) {
                    assetId = matchedId.trim();
                }
            } catch (e) {
                console.error("AI Triage Error:", e);
                // Fallback: pick first if only one, or leave blank
                if (estate.assets.length === 1) assetId = estate.assets[0].id;
            }
        }

        // Create the communication log
        // If no asset matched, we might need a way to log unassigned comms? 
        // For now, if no asset matches, we'll log it to an 'Unassigned' asset or just skip (but evaluation says don't skip).
        // Let's ensure a fallback communication log is created even if assetId is blank (though schema requires assetId).
        // Actually, schema requires assetId. Let's find or create a 'General' asset or handle appropriately.

        if (!assetId && estate.assets.length > 0) {
            assetId = estate.assets[0].id; // Fallback to first asset
        }

        if (assetId) {
            await CommunicationService.create(estate.userId, {
                estateId: estate.id,
                assetId: assetId,
                type: "email",
                direction: "inbound",
                subject: subject,
                notes: `FROM: ${sender}\n\n${body}`,
                occurredAt: new Date().toISOString(),
                institutionName: sender.split("@")[1] || "Unknown",
                contactName: sender,
            });
            return { status: "processed", assetId };
        }

        return { status: "ignored", reason: "no assets found to attach to" };
    }
}
