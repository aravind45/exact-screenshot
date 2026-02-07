import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    const estateId = "dd220058-5bcb-4122-ab04-7c4625540a00";

    console.log(`Checking collaborators for estate: ${estateId}`);

    const grants = await prisma.estateGrant.findMany({
        where: { estateId }
    });

    const invites = await prisma.invitation.findMany({
        where: { estateId, status: 'PENDING' }
    });

    console.log(`Current Grants count: ${grants.length}`);
    grants.forEach(g => console.log(` - User ${g.userId} as ${g.role}`));

    console.log(`Pending Invites count: ${invites.length}`);
    invites.forEach(i => console.log(` - Extra ${i.email} as ${i.role} (Created: ${i.createdAt})`));

    const total = grants.length + invites.length;
    console.log(`Total: ${total}`);

    if (total >= 5) {
        console.log("ALERT: Collaborator limit (5) reached!");
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
