import { prisma } from "../server/db.js";

async function getInvitations() {
    const invitations = await prisma.invitation.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        take: 10
    });

    if (invitations.length === 0) {
        console.log("No pending invitations found.");
        return;
    }

    console.log("\n📧 PENDING INVITATIONS:\n");
    console.log("=".repeat(80));

    for (const inv of invitations) {
        const appUrl = process.env.APP_URL || "http://localhost:5173";
        const inviteUrl = `${appUrl}/invite/${inv.token}`;

        console.log(`\nEmail: ${inv.email}`);
        console.log(`Role: ${inv.role}`);
        console.log(`Created: ${inv.createdAt.toLocaleString()}`);
        console.log(`Expires: ${inv.expiresAt.toLocaleString()}`);
        console.log(`Invite Link: ${inviteUrl}`);
        console.log("-".repeat(80));
    }

    await prisma.$disconnect();
}

getInvitations().catch(console.error);
