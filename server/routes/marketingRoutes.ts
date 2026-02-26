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
        const appUrl = (await EmailService.getAppUrl()).replace(/\/$/, "");
        const intakeUrl = `${appUrl}/auth`;

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

        await EmailService.sendMarketingEmail({
            to: email,
            subject: "Your First 30 Days Action Plan",
            body: body
        });
        logger.info(`[Marketing] Checklist email sent to ${email}`);

        res.json({ success: true, message: "Checklist sent" });
    } catch (error: any) {
        logger.error("Marketing Checklist Submission Error:", error.message);
        res.status(500).json({ error: "Failed to process checklist submission" });
    }
});

/**
 * Handles general contact form submissions.
 */
router.post("/contact", async (req, res) => {
    const { name, email, message, source } = req.body;

    if (!email || !message) {
        return res.status(400).json({ error: "Email and message are required" });
    }

    try {
        // 1. Log the contact event
        await prisma.marketingEvent.create({
            data: {
                event: "contact_form_submitted",
                email,
                source: source || "website_contact",
                metadata: { name, message }
            }
        });

        // 2. Send email to support
        await EmailService.sendInternalNotification(
            `New Contact: ${name || email}`,
            `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
        );
        logger.info(`[Marketing] Contact email forwarded for ${email}`);

        res.json({ success: true, message: "Message sent" });
    } catch (error: any) {
        logger.error("Contact Form Error:", error.message);
        res.status(500).json({ error: "Failed to send message" });
    }
});

/**
 * Handles "Request Pilot Access" submissions for B2B.
 */
router.post("/pilot-request", async (req, res) => {
    const { email, event, metadata } = req.body;
    const { firmName, attorneyName, casesPerYear } = metadata || {};

    if (!email || !firmName || !attorneyName) {
        return res.status(400).json({ error: "Required fields missing" });
    }

    try {
        // 1. Log the pilot request event
        await prisma.marketingEvent.create({
            data: {
                event: event || "pilot_request_submitted",
                email,
                source: "texas_b2b_landing",
                metadata: { firmName, attorneyName, casesPerYear }
            }
        });

        // 2. Send email to support
        const subject = `🚀 B2B Pilot Request: ${firmName}`;
        const body = `
New Texas Lawyer Pilot Request Received:

Firm Name: ${firmName}
Attorney: ${attorneyName}
Email: ${email}
Cases/Year: ${casesPerYear}

Next Steps:
1. Review the firm.
2. Manually provision the account (Set role=ATTORNEY, isPilot=true).
3. Contact the attorney via ${email}.
        `.trim();

        await EmailService.sendInternalNotification(subject, body);
        logger.info(`[Marketing] Pilot request forwarded for ${email}`);

        res.json({ success: true, message: "Pilot request submitted" });
    } catch (error: any) {
        logger.error("Pilot Request Error:", error.message);
        res.status(500).json({ error: "Failed to process pilot request" });
    }
});

export default router;
