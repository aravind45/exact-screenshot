import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    try {
        console.log("Checking Estate model fields...");
        // @ts-ignore - Check if field exists at runtime
        const estateFields = Object.keys(prisma.estate);
        console.log("Estate accessors:", estateFields);

        const estate = await prisma.estate.findFirst({
            include: { grants: true, invitations: true } as any
        });
        console.log("Estate found:", !!estate);
        if (estate) {
            console.log("Estate grants:", (estate as any).grants);
        }
    } catch (e) {
        console.error("Prisma Access Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
