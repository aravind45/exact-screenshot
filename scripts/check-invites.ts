import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const invitations = await prisma.invitation.findMany({
        where: { status: 'PENDING' },
        select: { id: true, email: true, status: true }
    });
    console.log(JSON.stringify(invitations, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
