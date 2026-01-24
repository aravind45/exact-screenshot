import "dotenv/config";
import { PrismaClient } from "@prisma/client";

async function main() {
    try {
        const prisma = new PrismaClient();
        console.log("Prisma instantiated successfully");
        await prisma.$connect();
        console.log("Connected to database");
        await prisma.$disconnect();
    } catch (e) {
        console.error("Full Error:", e);
    }
}

main();
