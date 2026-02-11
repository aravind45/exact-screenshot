import { Router, Request, Response } from "express";
import { EmailService } from "../services/emailService.js";
import { logger } from "../lib/logger.js";

const router = Router();

/**
 * Handle inbound emails from Mailgun.
 * Mailgun sends a POST request with the email data and a signature for security.
 */
router.post("/inbound-email", async (req: Request, res: Response) => {
    try {
        const { timestamp, token, signature } = req.body.signature || {};

        // 1. Verify that this actually came from Mailgun
        if (!EmailService.verifySignature(timestamp, token, signature)) {
            logger.warn("[Webhook] Invalid signature received");
            return res.status(401).json({ error: "Invalid signature" });
        }

        // 2. Process the email content
        // Note: req.body contains the fields from the multipart/form-data or json payload
        // Mailgun typically sends as multipart, but if we use their 'JSON' option or body-parser:
        const result = await EmailService.processInbound(req.body);

        logger.info(`[Webhook] Processed inbound email: ${result.status} ${result.reason || ""}`);

        // Mailgun expects a 200 OK to stop retrying
        res.status(200).json({ status: "ok", result });
    } catch (error: any) {
        logger.error("[Webhook] Error processing inbound email:", error.message);
        // Still return 200 to Mailgun unless we want it to retry (which can be messy)
        res.status(200).json({ error: error.message });
    }
});

export default router;
