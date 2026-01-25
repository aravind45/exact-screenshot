import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const email = 'aravind.77479@gmail.com'
    const user = await prisma.user.findUnique({
        where: { email }
    })

    if (user) {
        console.log('User found:', user.email)
        console.log('Has password hash:', !!user.passwordHash)

        // Check if common passwords work
        const passwords = ['password', '123456', 'Aravind123']
        for (const pw of passwords) {
            const match = await bcrypt.compare(pw, user.passwordHash!)
            console.log(`Password "${pw}" match:`, match)
        }
    } else {
        console.log('User not found')

        // Let's create the user if not found to ensure they can log in
        const passwordHash = await bcrypt.hash('password', 10)
        await prisma.user.create({
            data: {
                email,
                passwordHash,
                fullName: 'Aravind',
                state: 'CA',
                role: 'EXECUTOR'
            }
        })
        console.log('User created with password: "password"')
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
