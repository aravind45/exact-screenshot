
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
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
