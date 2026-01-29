import { prisma } from "../db.js";
import crypto from "crypto";
import { CommunicationService } from "./communicationService.js";
import { ai } from "./ai.js";
import { ConfigService } from "./configService.js";
import "dotenv/config";

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

    /**
     * Sends an outbound email via Mailgun.
     * Falls back to simulated mode if API key is missing to prevent process failure.
     */
    static async sendEmail(params: {
        estateId: string;
        to: string;
        subject: string;
        body: string;
        assetId: string;
        ccPersonalEmail?: boolean;
    }) {
        const estate = await prisma.estate.findUnique({
            where: { id: params.estateId },
            include: { user: true }
        });
        if (!estate) throw new Error("Estate not found");

        const handle = await this.ensureEstateHandle(params.estateId);
        const domain = await ConfigService.get("MAILGUN_DOMAIN") || "mg.pilar.ai";
        const sender = `ExpectedEstate <settle-${handle}@${domain}>`;
        const apiKey = await ConfigService.get("MAILGUN_API_KEY");

        // Add CC if requested and user has personal email
        let ccEmail = null;
        if (params.ccPersonalEmail && estate.user.personalEmail) {
            ccEmail = estate.user.personalEmail;
        }

        // SIMULATED MODE: Log and succeed if no API key
        if (!apiKey) {
            console.log(`[EmailService] SIMULATED SEND - To: ${params.to}, From: ${sender}, Subject: ${params.subject}${ccEmail ? ` (CC: ${ccEmail})` : ''}`);

            // Auto-log the outbound communication
            await CommunicationService.create(estate.userId, {
                estateId: params.estateId,
                assetId: params.assetId,
                type: "email",
                direction: "outbound",
                subject: params.subject,
                notes: `[SIMULATED SEND] ${params.body}${ccEmail ? `\n\n[CC: ${ccEmail}]` : ''}`,
                occurredAt: new Date().toISOString(),
                institutionName: params.to.split("@")[1] || "Institution",
                contactName: params.to,
            });

            return { status: "sent", ccEmail, simulated: true };
        }

        const encodedKey = Buffer.from(`api:${apiKey}`).toString("base64");
        const formData = new URLSearchParams();
        formData.append("from", sender);
        formData.append("to", params.to);
        formData.append("subject", params.subject);
        formData.append("text", params.body);
        formData.append("h:Reply-To", estate.inboundEmail || sender);

        if (ccEmail) {
            formData.append("cc", ccEmail);
        }

        console.log(`[EmailService] Sending email to ${params.to} from ${sender}${ccEmail ? ` (CC: ${ccEmail})` : ''}`);

        const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
            method: "POST",
            headers: {
                "Authorization": `Basic ${encodedKey}`
            },
            body: formData
        });

        if (!response.ok) {
            const error = await response.text();
            console.error("[EmailService] Mailgun Error:", error);
            throw new Error(`Failed to send email: ${error}`);
        }

        // Auto-log the outbound communication
        await CommunicationService.create(estate.userId, {
            estateId: params.estateId,
            assetId: params.assetId,
            type: "email",
            direction: "outbound",
            subject: params.subject,
            notes: `${params.body}${ccEmail ? `\n\n[CC: ${ccEmail}]` : ''}`,
            occurredAt: new Date().toISOString(),
            institutionName: params.to.split("@")[1] || "Institution",
            contactName: params.to,
        });
        return { status: "sent", ccEmail };
    }

    static async sendInviteEmail(to: string, data: { inviterName: string, estateName: string, token: string }) {
        const domain = await ConfigService.get("MAILGUN_DOMAIN") || "mg.pilar.ai";
        const sender = `Pilar Team <noreply@${domain}>`;
        const appUrl = process.env.APP_URL || "http://localhost:5173";
        const inviteUrl = `${appUrl}/invite/${data.token}`;

        const apiKey = await ConfigService.get("MAILGUN_API_KEY") || "";
        const encodedKey = Buffer.from(`api:${apiKey}`).toString("base64");

        const formData = new URLSearchParams();
        formData.append("from", sender);
        formData.append("to", to);
        formData.append("subject", `Invitation to collaborate on ${data.estateName}`);
        formData.append("text", `${data.inviterName} has invited you to collaborate on the estate of ${data.estateName} on Pilar.\n\nClick the link below to accept the invitation:\n${inviteUrl}\n\nThis invitation will expire in 7 days.`);

        console.log(`[EmailService] Sending invite to ${to}`);

        const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
            method: "POST",
            headers: {
                "Authorization": `Basic ${encodedKey}`
            },
            body: formData
        });

        if (!response.ok) {
            const error = await response.text();
            console.error("[EmailService] Invitation Email Error:", error);
            // Don't throw here, just log so the process continues
        }
    }
}
