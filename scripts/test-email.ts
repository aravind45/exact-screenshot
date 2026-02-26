import 'dotenv/config';
import fetch from 'node-fetch';

async function testResend() {
    const apiKey = process.env.RESEND_API_KEY;
    const domain = process.env.RESEND_DOMAIN || "expectedestate.com";

    console.log(`Testing Resend...`);
    console.log(`Domain: ${domain}`);
    console.log(`API Key set: ${!!apiKey}`);

    if (!apiKey) {
        console.error("Missing RESEND_API_KEY");
        return;
    }

    try {
        const { Resend } = await import('resend');
        const resend = new Resend(apiKey);

        console.log("Sending test email...");
        const { data, error } = await resend.emails.send({
            from: `Tester <noreply@${domain}>`,
            to: ["aravind.77479@gmail.com"],
            subject: "Resend Configuration Test",
            text: "This is a test email to verify Resend configuration."
        });

        if (error) {
            console.error("❌ Failed to send test email:", error);
        } else {
            console.log("✅ Test email sent successfully!", data);
        }
    } catch (error) {
        console.error("❌ Request Error:", error);
    }
}

testResend();
