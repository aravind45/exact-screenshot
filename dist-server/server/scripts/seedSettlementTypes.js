import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const CORE_SETTLEMENT_TYPES = [
    { code: 'FORMAL_PROBATE', name: 'Formal Probate', description: 'Standard court-supervised probate for estates with a will', tier: 1 },
    { code: 'INTESTATE', name: 'Intestate Admin', description: 'Court-supervised administration for estates without a will', tier: 1 },
    { code: 'TRUST_ADMIN_REVOCABLE', name: 'Revocable Trust Admin', description: 'Private settlement via a revocable living trust', tier: 2 },
    { code: 'TRUST_ADMIN_IRREVOCABLE', name: 'Irrevocable Trust Admin', description: 'Private settlement via an irrevocable trust', tier: 2 },
    { code: 'ANCILLARY_PROBATE', name: 'Ancillary Probate', description: 'Secondary probate proceeding for out-of-state property', tier: 2 },
    { code: 'CONTESTED_ESTATE', name: 'Contested Estate', description: 'Probate proceeding involving litigation or will contests', tier: 3 },
    { code: 'INSOLVENT_ESTATE', name: 'Insolvent Estate', description: 'Court-supervised administration for estates where debts exceed assets', tier: 3 },
];
async function main() {
    console.log('Seeding core settlement types...');
    for (const type of CORE_SETTLEMENT_TYPES) {
        await prisma.settlementType.upsert({
            where: { code: type.code },
            update: {
                name: type.name,
                description: type.description,
                tier: type.tier,
                isActive: true
            },
            create: {
                code: type.code,
                name: type.name,
                description: type.description,
                tier: type.tier,
                isActive: true
            }
        });
        console.log(`Upserted settlement type: ${type.code}`);
    }
    console.log('Finished seeding settlement types.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
