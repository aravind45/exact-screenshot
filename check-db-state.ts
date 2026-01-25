import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const email = 'aravind.77479@gmail.com'
    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            estates: {
                include: {
                    assets: true
                }
            }
        }
    })

    if (!user) {
        console.log('User not found')
        return
    }

    console.log('User found:', user.email, 'ID:', user.id)
    console.log('Total Estates:', user.estates.length)

    user.estates.forEach((estate, i) => {
        console.log(`--- Estate ${i + 1} ---`)
        console.log('ID:', estate.id)
        console.log('Name:', estate.name)
        console.log('Deceased Name:', estate.deceasedFirstName, estate.deceasedLastName)
        console.log('Probate Status:', estate.probateStatus)
        console.log('Assets count:', estate.assets.length)
        estate.assets.forEach(asset => {
            console.log(`  - Asset: ${asset.institution} (${asset.assetType}) [Status: ${asset.status}]`)
        })
    })

    // Also check for orphan assets (though schema should prevent this)
    const allUserAssets = await prisma.asset.findMany({
        where: { userId: user.id }
    })
    console.log('Total assets linked to user id:', allUserAssets.length)
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
