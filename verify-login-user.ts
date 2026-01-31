import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkUser() {
    const email = "aravind45@gmail.com";
    console.log(`Checking user: ${email}`);

    try {
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (user) {
            console.log("✅ User found in database.");
            console.log(`Full Name: ${user.fullName}`);
            console.log(`Role: ${user.role}`);
            console.log(`Password Hash starts with: ${user.passwordHash?.substring(0, 10)}...`);
        } else {
            console.log("❌ User NOT found in database.");
        }
    } catch (e) {
        console.error("Error connecting to database:", e);
    } finally {
        await prisma.$disconnect();
    }
}

checkUser();
