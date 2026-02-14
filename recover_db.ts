
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
const prisma = new PrismaClient()

async function main() {
    const passwordHash = await bcrypt.hash('password', 10);

    console.log('Starting recovery...');

    // Restore Admin
    await prisma.user.upsert({
        where: { email: 'aravind45@gmail.com' },
        update: {
            role: 'ADMIN',
            passwordHash: passwordHash
        },
        create: {
            email: 'aravind45@gmail.com',
            fullName: 'Aravind Thiyagarajan',
            role: 'ADMIN',
            userType: 'EXECUTOR',
            passwordHash: passwordHash
        }
    });
    console.log('✅ aravind45@gmail.com set to ADMIN with password: password');

    // Restore Advisor
    await prisma.user.upsert({
        where: { email: 'Advisor12345@gmail.com' },
        update: {
            role: 'ADVISOR',
            passwordHash: passwordHash
        },
        create: {
            email: 'Advisor12345@gmail.com',
            fullName: 'Advisor Test',
            role: 'ADVISOR',
            userType: 'ADVISOR',
            passwordHash: passwordHash
        }
    });
    console.log('✅ Advisor12345@gmail.com set to ADVISOR with password: password');

    // Restore Seed User
    await prisma.user.upsert({
        where: { email: 'aravind.77479@gmail.com' },
        update: {
            role: 'EXECUTOR',
            passwordHash: passwordHash
        },
        create: {
            email: 'aravind.77479@gmail.com',
            fullName: 'Aravind Seed',
            role: 'EXECUTOR',
            userType: 'EXECUTOR',
            passwordHash: passwordHash
        }
    });
    console.log('✅ aravind.77479@gmail.com set to EXECUTOR with password: password');

    console.log('Recovery complete!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
