/**
 * Jurisdiction Rules seed.
 *
 * IMPORTANT: state facts come from the single source of truth
 * (src/lib/jurisdictionData.ts). Do not hardcode thresholds here —
 * update jurisdictionData.ts and re-run the seed.
 */
import { PrismaClient } from '@prisma/client';
import {
    STATE_ESTATE_TAX_THRESHOLDS,
    CALIFORNIA,
} from '../src/lib/jurisdictionData';

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
            estateTaxThreshold: STATE_ESTATE_TAX_THRESHOLDS['MA'] ?? 2000000,
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
        },
        {
            stateCode: 'CA',
            probateSystem: 'GENERIC',
            smallEstateThreshold: CALIFORNIA.smallEstateThreshold(), // $208,850 (2025-26)
            smallEstateTerm: 'CA Prob. Code §13100 Affidavit',
            claimWindowDays: CALIFORNIA.creditorWindowDaysAfterLetters,
            shortenedWindowDays: CALIFORNIA.creditorWindowDaysAfterNotice,
            estateTaxThreshold: null,
            bondDefaultRequired: true,
            bondWaiverRules: {
                waiverConditions: ["Waiver in Will", "All beneficiaries waive"],
                suretyDistinction: false
            },
            citations: {
                smallEstate: "CA Prob. Code §13100",
                probate: "CA Prob. Code §7000",
                primaryResidence: CALIFORNIA.primaryResidencePetition.citation
            }
        },
        {
            stateCode: 'IL',
            probateSystem: 'GENERIC',
            smallEstateThreshold: 150000, // P.A. 104-0346, effective 2025-08-15
            smallEstateTerm: 'Small Estate Affidavit',
            claimWindowDays: 180, // 6 months from publication
            shortenedWindowDays: 180,
            estateTaxThreshold: STATE_ESTATE_TAX_THRESHOLDS['IL'] ?? 4000000,
            bondDefaultRequired: false,
            bondWaiverRules: { waiverConditions: ["Independent administration"], suretyDistinction: false },
            citations: { smallEstate: "755 ILCS 5/25-1", probate: "755 ILCS 5" }
        },
        {
            stateCode: 'SC',
            probateSystem: 'GENERIC',
            smallEstateThreshold: 45000, // Act No. 26 (H.3472), effective 2025-05-08
            smallEstateTerm: 'Small Estate Affidavit',
            claimWindowDays: 240, // 8 months
            shortenedWindowDays: 240,
            estateTaxThreshold: null,
            bondDefaultRequired: true,
            bondWaiverRules: { waiverConditions: ["Waiver in Will"], suretyDistinction: false },
            citations: { smallEstate: "S.C. Code §62-3-1201", probate: "S.C. Code Title 62" }
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
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
