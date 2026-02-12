import { prisma } from "./server/db.js";
import axios from "axios";

// Standard trial period
const TRIAL_DAYS = 7;
const API_URL = "http://localhost:3000/api";

async function verifyTrial() {
    console.log("🚀 Starting Trial Verification...");

    const testEmail = `trial_tester_${Date.now()}@example.com`;
    const testPassword = "password123";

    try {
        // 1. Register a new user
        console.log(`📝 Registering test user: ${testEmail}`);
        const regRes = await axios.post(`${API_URL}/auth/register`, {
            email: testEmail,
            password: testPassword,
            fullName: "Trial Tester",
            state: "CA"
        });

        const token = regRes.data.token;
        const headers = { Authorization: `Bearer ${token}` };

        // 2. Check /me endpoint for isTrialing
        console.log("🔍 Checking /auth/me for trial status...");
        const meRes = await axios.get(`${API_URL}/auth/me`, { headers });
        console.log("User Data:", JSON.stringify(meRes.data, null, 2));

        if (meRes.data.isTrialing === true) {
            console.log("✅ isTrialing flag correctly set to true");
        } else {
            console.log("❌ isTrialing flag is false or missing");
            process.exit(1);
        }

        // 3. Try to hit a protected route (e.g., /documents/scan - we'll just check if we get 403)
        console.log("🔒 Checking access to protected route (/documents/scan)...");
        try {
            // We don't need a real file if we just want to see if we get passed the subscription check
            const scanRes = await axios.post(`${API_URL}/documents/scan`, {}, { headers });
            // If we get here (or get a 400 No file provided), it means we passed the subscription check
            console.log("✅ Access granted (passed subscription check)");
        } catch (e: any) {
            if (e.response && e.response.status === 403) {
                console.log("❌ Access denied with 403 (Subscription Required). Trial not working.");
                process.exit(1);
            } else if (e.response && e.response.status === 400) {
                console.log("✅ Access granted (returned 400 as expected without file, passed 403)");
            } else {
                console.log("❓ Unexpected response:", e.response?.status, e.message);
            }
        }

        // 4. Clean up
        await prisma.user.delete({ where: { email: testEmail } });
        console.log("🧹 Cleaned up test user.");
        console.log("🎉 Verification Successful!");

    } catch (error: any) {
        console.error("❌ Verification Failed:", error.response?.data || error.message);
        process.exit(1);
    }
}

verifyTrial();
