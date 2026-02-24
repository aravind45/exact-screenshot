
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Jurisdiction Rules...');

    const rules = [
        {
            stateCode: 'MA',
            probateSystem: 'MUPC',
            smallEstateThreshold: 25000,
            smallEstateTerm: 'Voluntary Administration',
            claimWindowDays: 365,
            shortenedWindowDays: 120, // 4 months after publication
            estateTaxThreshold: 2000000,
            bondDefaultRequired: true,
            bondWaiverRules: {
                waiverConditions: ["Assent of all heirs/devisees", "Waiver in Will"],
                suretyDistinction: true
            },
            citations: {
                smallEstate: "M.G.L. c. 190B, § 3-1201",
                probate: "M.G.L. c. 190B",
                tax: "M.G.L. c. 65C"
            }
        },
        {
            stateCode: 'TX',
            probateSystem: 'GENERIC', // Texas is unique but following Generic template for now
            smallEstateThreshold: 75000,
            smallEstateTerm: 'Small Estate Affidavit',
            claimWindowDays: 365,
            shortenedWindowDays: 120,
            estateTaxThreshold: null,
            bondDefaultRequired: false, // Independent administration often waives bond
            bondWaiverRules: {
                waiverConditions: ["Request for Independent Administration"],
                suretyDistinction: false
            },
            citations: {
                smallEstate: "TX Estates Code §205",
                probate: "TX Estates Code §401"
            }
        }
    ];

    for (const rule of rules) {
        await prisma.jurisdictionRule.upsert({
            where: { stateCode: rule.stateCode },
            update: rule,
            create: rule
        });
        console.log(`✅ Rule for ${rule.stateCode} ensured.`);
    }

    console.log('✨ Jurisdiction Rules seeding complete!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
