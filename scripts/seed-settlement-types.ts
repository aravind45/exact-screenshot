import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// All test users use the same password
const PASSWORD = 'Test123!';
let hashedPassword: string;

const SETTLEMENT_TYPE_USERS = [
    {
        // 1. FORMAL_PROBATE (Tier 1 - A Grade) - 35% of estates
        email: 'formal@test.com',
        fullName: 'Formal Probate Tester',
        estate: {
            name: 'John Formal Smith Estate',
            deceasedFirstName: 'John',
            deceasedLastName: 'Formal Smith',
            deceasedDateOfDeath: new Date('2025-12-01'),
            deceasedState: 'CA',
            estateType: 'FORMAL_PROBATE',
            authorityType: 'LETTERS_TESTAMENTARY',
            settlementPath: 'FORMAL_PROBATE',
            hasWill: true,
            estimatedPersonalProperty: 200000,
            estimatedRealProperty: 300000,
        },
        assets: [
            { institution: 'Fidelity', assetType: 'BROKERAGE', category: 'financial', value: 150000, ownershipType: 'INDIVIDUAL' },
            { institution: 'Wells Fargo', assetType: 'CHECKING', category: 'financial', value: 50000, ownershipType: 'INDIVIDUAL' },
            { institution: 'Primary Residence', assetType: 'REAL_ESTATE', category: 'real_estate', value: 300000, ownershipType: 'INDIVIDUAL' },
        ],
    },
    {
        // 2. SMALL_ESTATE (Tier 1 - A Grade) - 30% of estates
        email: 'small@test.com',
        fullName: 'Small Estate Tester',
        estate: {
            name: 'Mary Small Jones Estate',
            deceasedFirstName: 'Mary',
            deceasedLastName: 'Small Jones',
            deceasedDateOfDeath: new Date('2025-11-15'),
            deceasedState: 'CA',
            estateType: 'SMALL_ESTATE',
            authorityType: 'AFFIDAVIT',
            settlementPath: 'SMALL_ESTATE',
            hasWill: false,
            estimatedPersonalProperty: 50000,
            estimatedRealProperty: 25000,
        },
        assets: [
            { institution: 'Chase', assetType: 'CHECKING', category: 'financial', value: 50000, ownershipType: 'INDIVIDUAL' },
            { institution: 'Condo', assetType: 'REAL_ESTATE', category: 'real_estate', value: 25000, ownershipType: 'INDIVIDUAL' },
        ],
    },
    {
        // 3. SPOUSAL_PETITION (Tier 2 - A- Grade) - 5% of estates
        email: 'spousal@test.com',
        fullName: 'Spousal Petition Tester',
        estate: {
            name: 'Robert Spouse Williams Estate',
            deceasedFirstName: 'Robert',
            deceasedLastName: 'Spouse Williams',
            deceasedDateOfDeath: new Date('2025-10-20'),
            deceasedState: 'CA',
            estateType: 'SPOUSAL_PETITION',
            authorityType: 'SPOUSAL_PROPERTY_ORDER',
            settlementPath: 'SPOUSAL_PETITION',
            hasWill: true,
            isSurvivingSpouse: true,
            estimatedPersonalProperty: 100000,
            estimatedRealProperty: 200000,
        },
        assets: [
            { institution: 'Bank of America', assetType: 'CHECKING', category: 'financial', value: 100000, ownershipType: 'INDIVIDUAL', notes: 'Community property' },
            { institution: 'Family Home', assetType: 'REAL_ESTATE', category: 'real_estate', value: 200000, ownershipType: 'INDIVIDUAL', notes: 'Community property' },
        ],
    },
    {
        // 4. TRUST_ADMIN (Tier 2 - A- Grade) - 15% of estates
        email: 'trust@test.com',
        fullName: 'Trust Admin Tester',
        estate: {
            name: 'Elizabeth Trust Anderson Estate',
            deceasedFirstName: 'Elizabeth',
            deceasedLastName: 'Trust Anderson',
            deceasedDateOfDeath: new Date('2025-09-30'),
            deceasedState: 'CA',
            estateType: 'TRUST_ADMIN',
            authorityType: 'SUCCESSOR_TRUSTEE',
            settlementPath: 'TRUST_ADMIN',
            hasWill: true,
            isTrustRevocable: true,
            estimatedPersonalProperty: 300000,
            estimatedRealProperty: 500000,
        },
        assets: [
            { institution: 'Trust Brokerage', assetType: 'BROKERAGE', category: 'financial', value: 300000, ownershipType: 'TRUST', inTrust: true },
            { institution: 'Trust Property', assetType: 'REAL_ESTATE', category: 'real_estate', value: 500000, ownershipType: 'TRUST', inTrust: true },
        ],
    },
    {
        // 5. JOINT_TRANSFER (Tier 2 - B+ Grade) - ~5% of estates
        email: 'joint@test.com',
        fullName: 'Joint Transfer Tester',
        estate: {
            name: 'Michael Joint Davis Estate',
            deceasedFirstName: 'Michael',
            deceasedLastName: 'Joint Davis',
            deceasedDateOfDeath: new Date('2025-08-15'),
            deceasedState: 'CA',
            estateType: 'JOINT_TRANSFER',
            authorityType: 'AFFIDAVIT_OF_DEATH',
            settlementPath: 'JOINT_TRANSFER',
            hasWill: false,
            estimatedPersonalProperty: 50000,
            estimatedRealProperty: 150000,
        },
        assets: [
            { institution: 'Joint Account', assetType: 'CHECKING', category: 'financial', value: 50000, ownershipType: 'JOINT', notes: 'Joint tenancy with right of survivorship' },
            { institution: 'Joint Property', assetType: 'REAL_ESTATE', category: 'real_estate', value: 150000, ownershipType: 'JOINT', notes: 'Joint tenancy with right of survivorship' },
        ],
    },
    {
        // 6. POD_TOD_TRANSFER (Tier 2 - B+ Grade) - ~5% of estates
        email: 'podtod@test.com',
        fullName: 'POD TOD Tester',
        estate: {
            name: 'Sarah POD Martinez Estate',
            deceasedFirstName: 'Sarah',
            deceasedLastName: 'POD Martinez',
            deceasedDateOfDeath: new Date('2025-07-10'),
            deceasedState: 'CA',
            estateType: 'POD_TOD_TRANSFER',
            authorityType: 'BENEFICIARY_CLAIM',
            settlementPath: 'POD_TOD_TRANSFER',
            hasWill: true,
            hasTODDeed: true,
            estimatedPersonalProperty: 50000,
            estimatedRealProperty: 100000,
        },
        assets: [
            { institution: 'Chase', assetType: 'CHECKING', category: 'financial', value: 50000, ownershipType: 'BENEFICIARY', beneficiaryDesignation: 'POD to daughter', notes: 'POD designation' },
            { institution: 'TOD Property', assetType: 'REAL_ESTATE', category: 'real_estate', value: 100000, ownershipType: 'BENEFICIARY', todDeedRecorded: true, notes: 'TOD deed recorded' },
        ],
    },
    {
        // 7. INTESTATE (Tier 3 - B+ Grade) - 3% of estates
        email: 'intestate@test.com',
        fullName: 'Intestate Tester',
        estate: {
            name: 'James Intestate Wilson Estate',
            deceasedFirstName: 'James',
            deceasedLastName: 'Intestate Wilson',
            deceasedDateOfDeath: new Date('2025-06-05'),
            deceasedState: 'CA',
            estateType: 'INTESTATE',
            authorityType: 'LETTERS_OF_ADMINISTRATION',
            settlementPath: 'INTESTATE',
            hasWill: false,
            estimatedPersonalProperty: 150000,
            estimatedRealProperty: 250000,
        },
        assets: [
            { institution: 'Schwab', assetType: 'BROKERAGE', category: 'financial', value: 150000, ownershipType: 'INDIVIDUAL' },
            { institution: 'Rental Property', assetType: 'REAL_ESTATE', category: 'real_estate', value: 250000, ownershipType: 'INDIVIDUAL' },
        ],
    },
    {
        // 8. INFORMAL_PROBATE (Tier 3 - B+ Grade) - 3% of estates
        email: 'informal@test.com',
        fullName: 'Informal Probate Tester',
        estate: {
            name: 'Patricia Informal Taylor Estate',
            deceasedFirstName: 'Patricia',
            deceasedLastName: 'Informal Taylor',
            deceasedDateOfDeath: new Date('2025-05-20'),
            deceasedState: 'CO', // UPC state
            estateType: 'INFORMAL_PROBATE',
            authorityType: 'INFORMAL_APPOINTMENT',
            settlementPath: 'INFORMAL_PROBATE',
            hasWill: true,
            estimatedPersonalProperty: 100000,
            estimatedRealProperty: 150000,
        },
        assets: [
            { institution: 'US Bank', assetType: 'CHECKING', category: 'financial', value: 100000, ownershipType: 'INDIVIDUAL' },
            { institution: 'CO Property', assetType: 'REAL_ESTATE', category: 'real_estate', value: 150000, ownershipType: 'INDIVIDUAL' },
        ],
    },
    {
        // 9. ANCILLARY_PROBATE (Tier 4 - B+ Grade) - 1% of estates
        email: 'ancillary@test.com',
        fullName: 'Ancillary Probate Tester',
        estate: {
            name: 'Richard Ancillary Brown Estate',
            deceasedFirstName: 'Richard',
            deceasedLastName: 'Ancillary Brown',
            deceasedDateOfDeath: new Date('2025-04-10'),
            deceasedState: 'CA',
            estateType: 'ANCILLARY_PROBATE',
            authorityType: 'ANCILLARY_LETTERS',
            settlementPath: 'ANCILLARY_PROBATE',
            hasWill: true,
            hasOutOfStateProperty: true,
            estimatedPersonalProperty: 200000,
            estimatedRealProperty: 400000,
        },
        assets: [
            { institution: 'Fidelity', assetType: 'BROKERAGE', category: 'financial', value: 200000, ownershipType: 'INDIVIDUAL' },
            { institution: 'CA Primary Home', assetType: 'REAL_ESTATE', category: 'real_estate', value: 250000, ownershipType: 'INDIVIDUAL', notes: 'California domicile property' },
            { institution: 'FL Vacation Home', assetType: 'REAL_ESTATE', category: 'real_estate', value: 150000, ownershipType: 'INDIVIDUAL', notes: 'Florida property - requires ancillary probate' },
        ],
    },
    {
        // 10. INSOLVENT (Tier 4 - B+ Grade) - 1% of estates
        email: 'insolvent@test.com',
        fullName: 'Insolvent Estate Tester',
        estate: {
            name: 'Thomas Insolvent Garcia Estate',
            deceasedFirstName: 'Thomas',
            deceasedLastName: 'Insolvent Garcia',
            deceasedDateOfDeath: new Date('2025-03-15'),
            deceasedState: 'CA',
            estateType: 'INSOLVENT',
            authorityType: 'LETTERS_TESTAMENTARY',
            settlementPath: 'INSOLVENT',
            hasWill: true,
            estimatedPersonalProperty: 50000,
            estimatedLiabilities: 150000,
        },
        assets: [
            { institution: 'Chase', assetType: 'CHECKING', category: 'financial', value: 50000, ownershipType: 'INDIVIDUAL' },
        ],
        liabilities: [
            { name: 'Medical Bills - Hospital', amount: 80000, status: 'DISCOVERED', priorityClass: 'MEDICAL_EXPENSES', priority: 'HIGH' },
            { name: 'Credit Card Debt', amount: 40000, status: 'DISCOVERED', priorityClass: 'GENERAL_DEBTS', priority: 'MEDIUM' },
            { name: 'Personal Loan', amount: 30000, status: 'DISCOVERED', priorityClass: 'GENERAL_DEBTS', priority: 'MEDIUM' },
        ],
    },
    {
        // 11. SPECIAL (Tier 5 - F Grade) - <1% of estates
        email: 'special@test.com',
        fullName: 'Special Contested Tester',
        estate: {
            name: 'William Special Rodriguez Estate',
            deceasedFirstName: 'William',
            deceasedLastName: 'Special Rodriguez',
            deceasedDateOfDeath: new Date('2025-02-01'),
            deceasedState: 'CA',
            estateType: 'SPECIAL',
            authorityType: 'PENDING_LITIGATION',
            settlementPath: 'SPECIAL',
            hasWill: true,
            hasContest: true,
            estimatedPersonalProperty: 400000,
            estimatedRealProperty: 600000,
            probateNotes: 'Will contest filed - litigation pending',
        },
        assets: [
            { institution: 'Vanguard', assetType: 'BROKERAGE', category: 'financial', value: 400000, ownershipType: 'INDIVIDUAL', notes: 'Distribution frozen due to will contest' },
            { institution: 'Estate Property', assetType: 'REAL_ESTATE', category: 'real_estate', value: 600000, ownershipType: 'INDIVIDUAL', notes: 'Subject to will contest' },
        ],
    },
];

async function main() {
    console.log('🌱 Seeding 11 Settlement Type Test Users...\\n');

    // Hash password once for all users
    console.log('🔐 Hashing password...');
    hashedPassword = await bcrypt.hash(PASSWORD, 10);
    console.log('✅ Password hashed\\n');

    for (const userData of SETTLEMENT_TYPE_USERS) {
        try {
            // Create or Update user
            const user = await prisma.user.upsert({
                where: { email: userData.email },
                update: {
                    fullName: userData.fullName,
                    passwordHash: hashedPassword,
                },
                create: {
                    email: userData.email,
                    fullName: userData.fullName,
                    passwordHash: hashedPassword,
                    role: 'EXECUTOR',
                },
            });

            console.log(`✅ User: ${userData.email}`);

            // Create or Update estate
            let estate = await prisma.estate.findFirst({
                where: { userId: user.id }
            });

            const { ...estateData } = userData.estate;

            if (estate) {
                // Clear related data for a fresh seed
                await prisma.asset.deleteMany({ where: { estateId: estate.id } });
                await prisma.liability.deleteMany({ where: { estateId: estate.id } });

                estate = await prisma.estate.update({
                    where: { id: estate.id },
                    data: { ...estateData }
                });
                console.log(`   📋 Updated estate: ${userData.estate.name}`);
            } else {
                estate = await prisma.estate.create({
                    data: {
                        ...estateData,
                        userId: user.id,
                    },
                });
                console.log(`   📋 Created estate: ${userData.estate.name}`);
            }

            // Create assets
            if (userData.assets) {
                for (const assetData of userData.assets) {
                    await prisma.asset.create({
                        data: {
                            ...assetData,
                            estateId: estate.id,
                            userId: user.id,
                            status: 'DISCOVERED',
                            priority: 'medium',
                        },
                    });
                }
                console.log(`   💰 Created ${userData.assets.length} assets`);
            }

            // Create liabilities (if any)
            if (userData.liabilities) {
                for (const liabilityData of userData.liabilities) {
                    await prisma.liability.create({
                        data: {
                            ...liabilityData,
                            estateId: estate.id,
                        },
                    });
                }
                console.log(`   💳 Created ${userData.liabilities.length} liabilities`);
            }

            console.log('');
        } catch (error) {
            console.error(`❌ Error seeding ${userData.email}:`, error);
        }
    }

    console.log('✨ Seeding complete!\\n');
    console.log('📝 Test User Credentials (all use password: Test123!):');
    console.log('');
    console.log('   Tier 1 (90% coverage):');
    console.log('   • formal@test.com       - FORMAL_PROBATE');
    console.log('   • small@test.com        - SMALL_ESTATE');
    console.log('   • trust@test.com        - TRUST_ADMIN');
    console.log('   • spousal@test.com      - SPOUSAL_PETITION');
    console.log('');
    console.log('   Tier 2 (10% coverage):');
    console.log('   • joint@test.com        - JOINT_TRANSFER');
    console.log('   • podtod@test.com       - POD_TOD_TRANSFER');
    console.log('');
    console.log('   Tier 3 (6% coverage):');
    console.log('   • intestate@test.com    - INTESTATE');
    console.log('   • informal@test.com     - INFORMAL_PROBATE');
    console.log('');
    console.log('   Tier 4 (2% coverage):');
    console.log('   • ancillary@test.com    - ANCILLARY_PROBATE');
    console.log('   • insolvent@test.com    - INSOLVENT');
    console.log('');
    console.log('   Tier 5 (<1% coverage):');
    console.log('   • special@test.com      - SPECIAL (Contested)');
    console.log('');
    console.log('📚 See test_users.md for detailed testing instructions');
    console.log('');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
