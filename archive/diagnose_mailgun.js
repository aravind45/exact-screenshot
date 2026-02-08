
import "dotenv/config";
import fetch from "node-fetch";

async function testMailgun() {
    const apiKey = process.env.MAILGUN_API_KEY;
    const domain = process.env.MAILGUN_DOMAIN;
    const baseUrl = process.env.MAILGUN_BASE_URL || "https://api.mailgun.net";

    console.log("--- Mailgun Diagnostic ---");
    console.log(`API Key: ${apiKey ? "FOUND (Ends with " + apiKey.slice(-4) + ")" : "MISSING"}`);
    console.log(`Domain: ${domain || "MISSING"}`);
    console.log(`Base URL: ${baseUrl}`);

    if (!apiKey || !domain) {
        console.error("❌ Missing configuration in .env");
        return;
    }

    const encodedKey = Buffer.from(`api:${apiKey}`).toString("base64");
    const formData = new URLSearchParams();
    formData.append("from", `Test <postmaster@${domain}>`);
    formData.append("to", "aravind45@gmail.com"); // Using a placeholder, change to your email
    formData.append("subject", "Mailgun Diagnostic Test");
    formData.append("text", "If you receive this, Mailgun and your .env are working correctly.");

    console.log("\nSending test email...");
    try {
        const response = await fetch(`${baseUrl}/v3/${domain}/messages`, {
            method: "POST",
            headers: {
                "Authorization": `Basic ${encodedKey}`
            },
            body: formData
        });

        const result = await response.text();
        if (response.ok) {
            console.log("✅ Success! Mailgun accepted the message.");
            console.log("Response:", result);
            console.log("\nIMPORTANT: If no email arrives, check:");
            console.log("1. Spam folder");
            console.log("2. Mailgun 'Authorized Recipients' (REQUIRED for sandbox domains)");
        } else {
            console.error("❌ Mailgun Error:", result);
        }
    } catch (error) {
        console.error("❌ Network/Fetch Error:", error.message);
    }
}

testMailgun();
