
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
const prisma = new PrismaClient()

async function main() {
    const users = await prisma.user.findMany();
    let matchCount = 0;
    for (const user of users) {
        if (user.passwordHash) {
            const matches = await bcrypt.compare('password', user.passwordHash);
            if (matches) {
                matchCount++;
                console.log(`Match found: ${user.email}`);
            }
        }
    }
    console.log(`Total users: ${users.length}, Matches for 'password': ${matchCount}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
