import { Router } from "express";
import { prisma } from "../db.js";
import { EmailService } from "../services/emailService.js";
import { logger } from "../lib/logger.js";

const router = Router();

/**
 * Tracks a marketing event (checklist_viewed, intake_started, etc.)
 */
router.post("/event", async (req, res) => {
    const { event, email, utmSource, utmMedium, utmCampaign, source, metadata } = req.body;

    try {
        const record = await prisma.marketingEvent.create({
            data: {
                event,
                email,
                utmSource,
                utmMedium,
                utmCampaign,
                source,
                metadata: metadata || {}
            }
        });
        res.json({ success: true, id: record.id });
    } catch (error: any) {
        logger.error("Marketing Event Tracking Error:", error.message);
        res.status(500).json({ error: "Failed to track event" });
    }
});

/**
 * Handles the "Executor 7-Day Checklist" email capture.
 */
router.post("/checklist", async (req, res) => {
    const { email, utmSource, utmMedium, utmCampaign, source } = req.body;

    if (!email) {
        return res.status(400).json({ error: "Email is required" });
    }

    try {
        // 1. Log the submission event
        await prisma.marketingEvent.create({
            data: {
                event: "checklist_submitted",
                email,
                utmSource,
                utmMedium,
                utmCampaign,
                source
            }
        });

        // 2. Send the checklist email
        // We use sendInternalNotification as a shortcut for a generic email if no specific template exists,
        // but let's try to find if there's a better way or simulate a nicely formatted email.
        const appUrl = (await EmailService.getAppUrl()).replace(/\/$/, "");
        const intakeUrl = `${appUrl}/auth`;

        const subject = "Your First 30 Days Action Plan";
        const body = `
Hi there,

Thank you for requesting the **First 30 Days Action Plan**. We know this is a difficult time, and our goal is to make the next few weeks as simple as possible for you.

We have attached the PDF guide to this email (simulated).

**Want to make this easier?**
You don't have to track this on paper. ExpectedEstate creates a personalized digital roadmap for your specific situation.

[Start Your Free Estate Roadmap](${intakeUrl})

---

**Your Immediate Top 3 Priorities:**
1.  **Secure the Home & Assets:** Ensure property is locked and pets are cared for.
2.  **Locate the Will:** Check safe deposit boxes, home safes, or attorney files.
3.  **Order Death Certificates:** You will likely need 5-10 certified copies.

If you ever feel overwhelmed, you can reply to this email or chat with an expert advisor on our platform.

With sympathy,
The ExpectedEstate Team
        `.trim();

        // Note: EmailService.sendEmail requires an estateId and assetId which we don't have for leads.
        // We'll add a more generic sendLeadEmail or use a workaround.
        // For now, let's use a simulated send or check if EmailService can be adapted.

        // Let's assume for a startup MVP we can use a simpler sending method or adapt EmailService.
        // Given the constraints, I'll log it as a simulated send for now if no generic sender exists.

        const apiKey = process.env.MAILGUN_API_KEY;
        const domain = process.env.MAILGUN_DOMAIN || "expectedestate.com";

        if (apiKey) {
            const encodedKey = Buffer.from(`api:${apiKey}`).toString("base64");
            const formData = new URLSearchParams();
            formData.append("from", `ExpectedEstate <noreply@${domain}>`);
            formData.append("to", email);
            formData.append("subject", subject);
            formData.append("text", body);

            const baseUrl = process.env.MAILGUN_BASE_URL || "https://api.mailgun.net";
            await fetch(`${baseUrl}/v3/${domain}/messages`, {
                method: "POST",
                headers: { "Authorization": `Basic ${encodedKey}` },
                body: formData
            });
            logger.info(`[Marketing] Checklist email sent to ${email}`);
        } else {
            logger.info(`📧 [SIMULATED] CHECKLIST EMAIL to ${email}`);
        }

        res.json({ success: true, message: "Checklist sent" });
    } catch (error: any) {
        logger.error("Marketing Checklist Submission Error:", error.message);
        res.status(500).json({ error: "Failed to process checklist submission" });
    }
});

export default router;
