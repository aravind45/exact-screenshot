
import { prisma } from "../server/db.js";

async function main() {
    const users = await prisma.user.findMany({ select: { email: true, id: true, role: true } });
    console.log("Registered Users:", JSON.stringify(users, null, 2));

    const email = "aravind.77479@gmail.com";
    console.log(`Searching for user: ${email}...`);

    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        console.error("❌ User not found! Please verify the email above.");
        return;
    }

    console.log(`User found: ${user.id} (${user.fullName}). Current Role: ${user.role || 'None'}`);

    const updated = await prisma.user.update({
        where: { email },
        data: { role: 'ADMIN' }
    });

    console.log(`✅ Successfully promoted ${updated.email} to ADMIN.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
