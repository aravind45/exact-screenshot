import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding Neon DB...");

    // 1. Create User
    const user = await prisma.user.upsert({
        where: { email: "demo@example.com" },
        update: {},
        create: {
            email: "demo@example.com",
            fullName: "Demo Executor",
            role: "EXECUTOR",
            state: "CA"
        }
    });
    console.log("User created:", user.id);

    // 2. Create Estate
    const estate = await prisma.estate.create({
        data: {
            userId: user.id,
            name: "Demo Estate",
            deceasedFirstName: "John",
            deceasedLastName: "Doe",
            deceasedDateOfDeath: new Date("2025-12-01"),
            deceasedState: "CA",
            status: "INITIATION"
        }
    });
    console.log("Estate created:", estate.id);

    // 3. Create Sample Asset
    const asset = await prisma.asset.create({
        data: {
            estateId: estate.id,
            userId: user.id,
            institution: "Neon Bank",
            assetType: "checking",
            category: "financial",
            value: 10000,
            priority: "medium",
            status: "DISCOVERED"
        }
    });
    console.log("Asset created:", asset.id);
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
