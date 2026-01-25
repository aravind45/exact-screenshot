
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const institutions = [
        {
            name: 'Fidelity Investments',
            website: 'fidelity.com',
            phone: '800-343-3548',
        },
        {
            name: 'The Vanguard Group',
            website: 'vanguard.com',
            phone: '877-662-7447',
        },
        {
            name: 'Charles Schwab',
            website: 'schwab.com',
            phone: '800-435-4000',
        },
        {
            name: 'Chase Bank',
            website: 'chase.com',
            phone: '800-935-9935',
        },
        {
            name: 'Bank of America',
            website: 'bankofamerica.com',
            phone: '800-432-1000',
        },
        {
            name: 'Wells Fargo',
            website: 'wellsfargo.com',
            phone: '800-869-3557',
        },
        {
            name: 'Morgan Stanley',
            website: 'morganstanley.com',
            phone: '888-454-3965',
        },
        {
            name: 'MetLife',
            website: 'metlife.com',
            phone: '800-638-5433',
        },
        {
            name: 'Prudential Financial',
            website: 'prudential.com',
            phone: '800-778-2255',
        },
        {
            name: 'Trellis',
            website: 'trellis.com',
            phone: '888-123-4567',
        }
    ]

    console.log('Seed: Starting institution population...')

    for (const inst of institutions) {
        await prisma.institution.upsert({
            where: { name: inst.name },
            update: {},
            create: {
                name: inst.name,
                website: inst.website,
                phone: inst.phone,
            },
        })
    }

    console.log('Seed: Successfully populated institutions!')

    console.log('Seed: Checking for primary user...')
    const email = 'aravind.77479@gmail.com'
    const passwordHash = '$2a$10$XmP1v43fWl/g8vJ.O2r8V.y1l6N.L3I9j9V.l/v.P/v.P/v.P/v.P' // bcrypt for 'password'

    const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            email,
            passwordHash,
            fullName: 'Aravind',
            state: 'CA',
            role: 'EXECUTOR'
        }
    })
    console.log('Seed: Primary user ensured!')

    console.log('Seed: Checking for primary estate...')
    const existingEstate = await prisma.estate.findFirst({
        where: { userId: user.id }
    })

    if (!existingEstate) {
        await prisma.estate.create({
            data: {
                userId: user.id,
                name: "Aravind's Estate",
                deceasedFirstName: "TBD",
                deceasedLastName: "TBD",
                deceasedDateOfDeath: new Date(),
                deceasedState: "CA",
                probateStatus: "NOT_STARTED"
            }
        })
        console.log('Seed: Primary estate created!')
    } else {
        console.log('Seed: Primary estate already exists.')
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
