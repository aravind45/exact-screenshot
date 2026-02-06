
import { prisma } from "../server/db.js";
import { AuthService } from "../server/services/authService.js";

async function main() {
    console.log("🔍 Starting Debug Script...");

    // 1. Check DB Connection
    try {
        console.log("Checking DB connection...");
        await prisma.$connect();
        console.log("✅ DB Connected successfully.");
    } catch (e: any) {
        console.error("❌ DB Connection Failed:", e.message);
        process.exit(1);
    }

    // 2. Check User (Read only)
    const email = "special@test.com";
    try {
        console.log(`Searching for user: ${email}...`);
        const user = await prisma.user.findUnique({ where: { email } });
        if (user) {
            console.log("✅ User found:", user.id, user.email, user.role);
        } else {
            console.warn("⚠️ User NOT found.");
        }
    } catch (e: any) {
        console.error("❌ Error finding user:", e);
    }

    // 3. Test simple query
    try {
        const count = await prisma.estate.count();
        console.log(`📊 Estate count: ${count}`);
    } catch (e: any) {
        console.error("❌ Error counting estates:", e);
    }

    // 4. Test Auth Flow (Register + Login)
    try {
        console.log("Testing Auth Logic (Bcrypt)...");
        const testEmail = `debug_${Date.now()}@test.com`;
        const testPass = "password123";

        console.log("Registering temp user...", testEmail);
        const { user } = await AuthService.register({
            email: testEmail,
            password: testPass,
            fullName: "Debug User",
            state: "CA",
            ip: "127.0.0.1"
        });
        console.log("✅ Registered:", user.id);

        console.log("Logging in...");
        const loginRes = await AuthService.login(testEmail, testPass, "127.0.0.1");
        console.log("✅ Login Successful:", loginRes.user.email);

        // Cleanup
        await prisma.estate.deleteMany({ where: { userId: user.id } });
        await prisma.user.delete({ where: { id: user.id } });
        console.log("🧹 Cleanup complete");

    } catch (e: any) {
        console.error("❌ Auth Flow Failed:", e);
        console.error(e.stack);
    }

    await prisma.$disconnect();
}

main();
