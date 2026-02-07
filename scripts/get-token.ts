import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "a-very-secret-key-that-you-should-change-in-production";

async function main() {
    const user = await prisma.user.findFirst({
        where: { email: 'special@test.com' } // Using the user from the screenshot
    });

    if (!user) {
        console.log("User not found");
        return;
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET);
    console.log(token);
}

main().finally(() => prisma.$disconnect());
