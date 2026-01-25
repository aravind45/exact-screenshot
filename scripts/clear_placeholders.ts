import { prisma } from "../server/db.js";

async function main() {
    console.log("Deleting placeholder templates from database...\n");

    const result = await prisma.formTemplate.deleteMany({
        where: {
            OR: [
                { name: "DE-111" },
                { name: "DE-121" },
                { name: "DE-150" }
            ]
        }
    });

    console.log(`✅ Deleted ${result.count} placeholder templates`);
    console.log("\nNow you can upload the REAL forms via Admin UI:");
    console.log("1. Download from: https://www.courts.ca.gov/documents/de111.pdf");
    console.log("2. Go to Admin Console -> Form Templates");
    console.log("3. Upload the downloaded PDF");
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
