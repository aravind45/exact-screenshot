import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const events = await prisma.marketingEvent.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5
    });
    console.log("=== Last 5 Marketing Events ===");
    console.log(JSON.stringify(events, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
