import { AssetService } from './server/services/assetService.js'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const email = 'aravind.77479@gmail.com'
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
        console.error('User not found')
        return
    }

    console.log('Testing asset creation for user:', user.email)

    try {
        const asset = await AssetService.create(user.id, {
            institution: "Robinhood Brokerage and Crypto",
            assetType: "BROKERAGE_AND_CRYPTO",
            category: "financial",
            status: "discovered",
            priority: "medium",
            notes: "Manually added via test script to verify fix."
        })
        console.log('Asset created successfully:', asset.institution, 'ID:', asset.id)

        const assets = await AssetService.getAll(user.id)
        console.log('Ledger count for user:', assets.length)
        assets.forEach(a => console.log(` - ${a.institution}`))
    } catch (error: any) {
        console.error('Asset creation failed:', error.message)
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
