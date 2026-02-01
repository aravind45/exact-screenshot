
import "dotenv/config";
import { AuthService } from "./server/services/authService.js";
import { prisma } from "./server/db.js";

async function simulateForgotPassword() {
    const testEmail = "aravind45@gmail.com"; // Use the test email you're using

    console.log(`--- AuthService.forgotPassword Simulation ---`);
    console.log(`Target Email: ${testEmail}`);

    try {
        // Check if user exists first
        const user = await prisma.user.findUnique({ where: { email: testEmail } });
        if (!user) {
            console.error(`❌ User ${testEmail} not found in database. Please use an existing user email.`);
            return;
        }

        console.log("Calling AuthService.forgotPassword...");
        const result = await AuthService.forgotPassword(testEmail);
        console.log("✅ AuthService returned:", result);
    } catch (error) {
        console.error("❌ Simulation Error:", error.message);
        if (error.stack) console.error(error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

simulateForgotPassword();
