import { prisma } from "../db.js";
import crypto from "crypto";
import { CommunicationService } from "./communicationService.js";
import { ConfigService } from "./configService.js";
import "dotenv/config";
import { logger } from "../lib/logger.js";
import { Resend } from "resend";

export class EmailService {
    private static resend: Resend | null = null;

    private static async getResendClient() {
        if (this.resend) return this.resend;
        const apiKey = await ConfigService.get("RESEND_API_KEY") || process.env.RESEND_API_KEY;
        if (!apiKey) {
            logger.warn("[EmailService] RESEND_API_KEY not found. Operating in simulated mode.");
            return null;
        }
        this.resend = new Resend(apiKey);
        return this.resend;
    }

    /**
     * Generates a unique handle for an estate if none exists.
     */
    static async ensureEstateHandle(estateId: string) {
        const estate = await prisma.estate.findUnique({ where: { id: estateId } });
        if (!estate) throw new Error("Estate not found");
        if (estate.handle) return estate.handle;

        const handle = crypto.randomBytes(4).toString("hex"); // e.g. 'af2b81'
        const domain = process.env.RESEND_DOMAIN || process.env.MAILGUN_DOMAIN || "expectedestate.com";
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
     * Verifies the Resend webhook signature.
     * Note: Resend uses Svix for webhooks. For now, we'll keep a simple placeholder 
     * or implement Svix verification if needed.
     */
    static verifySignature(payload: any, headers: any) {
        // In a real implementation, we would use SVIX to verify headers['svix-signature']
        // For the MVP, we might trust the endpoint or use a simple shared secret if configured.
        const secret = process.env.RESEND_WEBHOOK_SECRET;
        if (!secret) return true; // If no secret configured, skip verification (not recommended for prod)

        // Simplified check for now
        return headers['x-resend-webhook-secret'] === secret;
    }

    /**
     * Processes an inbound email from Resend (usually via social/webhook).
     */
    static async processInbound(payload: any) {
        // Resend inbound payload structure (usually email.received)
        const data = payload.data || payload;
        const recipient = data.to?.[0] || ""; // e.g. settle-af2b81@expectedestate.com
        const handle = recipient.match(/settle-([a-f0-9]+)@/)?.[1];

        if (!handle) {
            logger.info(`[EmailService] Inbound email ignored: no handle in recipient ${recipient}`);
            return { status: "ignored", reason: "no handle found" };
        }

        const estate = await prisma.estate.findUnique({
            where: { handle },
            include: { assets: true }
        });
        if (!estate) return { status: "ignored", reason: "estate not found" };

        const body = data.text || data.html || "";
        const subject = data.subject || "No Subject";
        const sender = data.from || "";

        // AI triaging logic remains the same...
        // ... (rest of the logic for asset association)
        let assetId = "";
        if (estate.assets.length > 0) {
            try {
                // Reuse triage implementation
                const { ai } = await import("./ai.js");
                const assetContext = estate.assets.map(a => `${a.id}: ${a.institution} (${a.assetType})`).join("\n");
                const triagePrompt = `You are a settlement assistant for an estate. 
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
                logger.error("AI Triage Error:", e);
                if (estate.assets.length === 1) assetId = estate.assets[0].id;
            }
        }

        if (!assetId && estate.assets.length > 0) {
            assetId = estate.assets[0].id;
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
     * Sends an outbound email via Resend.
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
        const domain = await ConfigService.get("RESEND_DOMAIN") || process.env.RESEND_DOMAIN || "expectedestate.com";
        const from = `ExpectedEstate <settle-${handle}@${domain}>`;

        // Add CC if requested
        const cc: string[] = [];
        if (params.ccPersonalEmail && estate.user.personalEmail) {
            cc.push(estate.user.personalEmail);
        }

        const client = await this.getResendClient();

        if (!client) {
            logger.info(`[EmailService] SIMULATED SEND - To: ${params.to}, Subject: ${params.subject}`);
            await CommunicationService.create(estate.userId, {
                estateId: params.estateId,
                assetId: params.assetId,
                type: "email",
                direction: "outbound",
                subject: params.subject,
                notes: `[SIMULATED SEND] ${params.body}${cc.length > 0 ? `\n\n[CC: ${cc.join(', ')}]` : ''}`,
                occurredAt: new Date().toISOString(),
                institutionName: params.to.split("@")[1] || "Institution",
                contactName: params.to,
            });
            return { status: "sent", ccEmail: cc[0] || null, simulated: true };
        }

        logger.info(`[EmailService] Sending email to ${params.to} via Resend`);

        const { data, error } = await client.emails.send({
            from,
            to: [params.to],
            cc: cc.length > 0 ? cc : undefined,
            subject: params.subject,
            text: params.body,
            replyTo: estate.inboundEmail || from
        });

        if (error) {
            logger.error("[EmailService] Resend Error:", error);
            throw new Error(`Failed to send email: ${error.message}`);
        }

        await CommunicationService.create(estate.userId, {
            estateId: params.estateId,
            assetId: params.assetId,
            type: "email",
            direction: "outbound",
            subject: params.subject,
            notes: `${params.body}${cc.length > 0 ? `\n\n[CC: ${cc.join(', ')}]` : ''}`,
            occurredAt: new Date().toISOString(),
            institutionName: params.to.split("@")[1] || "Institution",
            contactName: params.to,
        });

        return { status: "sent", ccEmail: cc[0] || null, data };
    }

    /**
     * Generic method for marketing/lead emails without estate context
     */
    static async sendMarketingEmail(params: {
        to: string;
        subject: string;
        body: string;
        from?: string;
        replyTo?: string;
    }) {
        const client = await this.getResendClient();
        const domain = await ConfigService.get("RESEND_DOMAIN") || process.env.RESEND_DOMAIN || "expectedestate.com";
        const from = params.from || `ExpectedEstate <noreply@${domain}>`;

        if (!client) {
            logger.info(`📧 [SIMULATED MARKETING] To: ${params.to}, Subject: ${params.subject}`);
            return { status: "sent", simulated: true };
        }

        const { data, error } = await client.emails.send({
            from,
            to: [params.to],
            subject: params.subject,
            text: params.body,
            replyTo: params.replyTo
        });

        if (error) {
            logger.error("[EmailService] Resend Marketing Error:", error);
            throw new Error(`Failed to send marketing email: ${error.message}`);
        }

        return { status: "sent", data };
    }

    static async getAppUrl() {
        return await ConfigService.get("APP_URL") || process.env.APP_URL || "http://localhost:5173";
    }

    static async sendInviteEmail(to: string, data: { inviterName: string, estateName: string, token: string }) {
        const appUrl = (await this.getAppUrl()).replace(/\/$/, "");
        const inviteUrl = `${appUrl}/invite/${data.token}`;
        const subject = `Invitation to collaborate on ${data.estateName}`;
        const body = `${data.inviterName} has invited you to collaborate on the estate of ${data.estateName} on ExpectedEstate.\n\nClick the link below to accept the invitation:\n${inviteUrl}\n\nThis invitation will expire in 7 days.`;

        return this.sendMarketingEmail({ to, subject, body });
    }

    static async sendPasswordResetEmail(to: string, resetLink: string) {
        const subject = "Reset your ExpectedEstate password";
        const body = `We received a request to reset your password. Click the link below to set a new one:\n\n${resetLink}\n\nIf you did not request this, you can safely ignore this email.\n\nThis link will expire in 1 hour.`;

        return this.sendMarketingEmail({ to, subject, body });
    }

    static async sendInternalNotification(subject: string, body: string) {
        const to = await ConfigService.get("SUPPORT_EMAIL") || "expected.estate@gmail.com";
        return this.sendMarketingEmail({ to, subject, body });
    }

    static async sendVerificationEmail(to: string, verificationLink: string) {
        const subject = "Verify your ExpectedEstate account";
        const body = `Welcome to ExpectedEstate! Please verify your email address by clicking the link below:\n\n${verificationLink}\n\nIf you did not sign up for an account, you can safely ignore this email.`;

        return this.sendMarketingEmail({ to, subject, body });
    }
}
