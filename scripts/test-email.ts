import 'dotenv/config';
import fetch from 'node-fetch';

async function testMailgun() {
    const apiKey = process.env.MAILGUN_API_KEY;
    const domain = process.env.MAILGUN_DOMAIN;
    const baseUrl = process.env.MAILGUN_BASE_URL || "https://api.mailgun.net";

    console.log(`Testing Mailgun...`);
    console.log(`Domain: ${domain}`);
    console.log(`Base URL: ${baseUrl}`);
    console.log(`API Key set: ${!!apiKey}`);

    if (!apiKey || !domain) {
        console.error("Missing MAILGUN_API_KEY or MAILGUN_DOMAIN");
        return;
    }

    const encodedKey = Buffer.from(`api:${apiKey}`).toString("base64");
    const formData = new URLSearchParams();
    formData.append("from", `Tester <postmaster@${domain}>`);
    formData.append("to", "aravind.77479@gmail.com");
    formData.append("subject", "Mailgun Configuration Test");
    formData.append("text", "This is a test email to verify Mailgun configuration.");

    try {
        const response = await fetch(`${baseUrl}/v3/${domain}/messages`, {
            method: "POST",
            headers: {
                "Authorization": `Basic ${encodedKey}`
            },
            body: formData
        });

        console.log(`Response Status: ${response.status}`);
        const result = await response.text();
        console.log(`Response Body: ${result}`);

        if (response.ok) {
            console.log("✅ Test email sent successfully (or accepted by Mailgun)!");
        } else {
            console.error("❌ Failed to send test email.");
        }
    } catch (error) {
        console.error("❌ Request Error:", error);
    }
}

testMailgun();
