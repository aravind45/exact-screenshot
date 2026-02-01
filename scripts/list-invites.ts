import { prisma } from "../server/db.js";

async function main() {
    const invitations = await prisma.invitation.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' }
    });

    console.log(JSON.stringify(invitations, null, 2));
    await prisma.$disconnect();
}

main();
