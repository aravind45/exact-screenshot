
import "dotenv/config";
import { AuthService } from "./server/services/authService.js";
import { prisma } from "./server/db.js";

async function simulateForgotPassword() {
    // Re-verify that we can see the env vars here
    console.log(`MAILGUN_DOMAIN: ${process.env.MAILGUN_DOMAIN}`);
    console.log(`MAILGUN_API_KEY: ${process.env.MAILGUN_API_KEY ? 'Set' : 'Not Set'}`);

    const testEmail = "aravind45@gmail.com";

    console.log(`--- AuthService.forgotPassword Simulation ---`);
    console.log(`Target Email: ${testEmail}`);

    try {
        // Check if user exists first
        const user = await prisma.user.findUnique({ where: { email: testEmail } });
        if (!user) {
            console.error(`❌ User ${testEmail} not found in database. Please use an existing user email.`);
            const allUsers = await prisma.user.findMany({ select: { email: true }, take: 5 });
            console.log("Existing users:", allUsers.map(u => u.email));
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
