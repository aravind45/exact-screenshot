
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function checkSettings() {
    const settings = await prisma.appSetting.findMany();
    console.log("--- Database Settings ---");
    console.log(JSON.stringify(settings, null, 2));
    await prisma.$disconnect();
}

checkSettings();
