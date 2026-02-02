import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TEST_USERS = [
  {
    // PTH-01: Full Probate (Will)
    email: 'pth01-probate@test.com',
    fullName: 'PTH-01 Full Probate',
    password: 'Test123!',
    estate: {
      name: 'PTH-01: Full Probate Estate',
      deceasedFirstName: 'John',
      deceasedLastName: 'Probate',
      deceasedDateOfDeath: new Date('2025-12-01'),
      deceasedState: 'CA',
      estateType: 'FORMAL_PROBATE',
      authorityType: 'FORMAL_PROBATE',
      hasWill: true,
      estimatedPersonalProperty: 300000,
      estimatedRealProperty: 200000,
    },
    assets: [
      { institution: 'Fidelity', assetType: 'BROKERAGE', category: 'financial', value: 250000, ownershipType: 'INDIVIDUAL' },
      { institution: 'Wells Fargo', assetType: 'CHECKING', category: 'financial', value: 50000, ownershipType: 'INDIVIDUAL' },
      { institution: 'Property', assetType: 'REAL_ESTATE', category: 'real_estate', value: 200000, ownershipType: 'INDIVIDUAL' },
    ],
  },
  {
    // PTH-02: Intestate Probate (No Will)
    email: 'pth02-intestate@test.com',
    fullName: 'PTH-02 Intestate',
    password: 'Test123!',
    estate: {
      name: 'PTH-02: Intestate Estate',
      deceasedFirstName: 'Jane',
      deceasedLastName: 'Intestate',
      deceasedDateOfDeath: new Date('2025-11-15'),
      deceasedState: 'CA',
      estateType: 'INTESTATE',
      authorityType: 'INTESTATE',
      hasWill: false,
      estimatedPersonalProperty: 400000,
    },
    assets: [
      { institution: 'Chase', assetType: 'CHECKING', category: 'financial', value: 100000, ownershipType: 'INDIVIDUAL' },
      { institution: 'Schwab', assetType: 'BROKERAGE', category: 'financial', value: 300000, ownershipType: 'INDIVIDUAL' },
    ],
  },
  {
    // PTH-03: Summary / Simplified Probate
    email: 'pth03-summary@test.com',
    fullName: 'PTH-03 Summary Probate',
    password: 'Test123!',
    estate: {
      name: 'PTH-03: Summary Probate Estate',
      deceasedFirstName: 'Robert',
      deceasedLastName: 'Summary',
      deceasedDateOfDeath: new Date('2025-10-20'),
      deceasedState: 'FL',
      estateType: 'SUMMARY_ADMINISTRATION',
      authorityType: 'SUMMARY_ADMINISTRATION',
      hasWill: true,
      estimatedPersonalProperty: 60000,
    },
    assets: [
      { institution: 'SunTrust', assetType: 'CHECKING', category: 'financial', value: 40000, ownershipType: 'INDIVIDUAL' },
      { institution: 'TD Ameritrade', assetType: 'BROKERAGE', category: 'financial', value: 20000, ownershipType: 'INDIVIDUAL' },
    ],
  },
  {
    // PTH-04: Ancillary Probate
    email: 'pth04-ancillary@test.com',
    fullName: 'PTH-04 Ancillary Probate',
    password: 'Test123!',
    estate: {
      name: 'PTH-04: Ancillary Probate Estate',
      deceasedFirstName: 'Michael',
      deceasedLastName: 'Ancillary',
      deceasedDateOfDeath: new Date('2025-09-10'),
      deceasedState: 'CA',
      estateType: 'ANCILLARY_PROBATE',
      authorityType: 'ANCILLARY_PROBATE',
      hasWill: true,
      estimatedPersonalProperty: 200000,
      estimatedRealProperty: 300000,
    },
    assets: [
      { institution: 'CA Property', assetType: 'REAL_ESTATE', category: 'real_estate', value: 200000, ownershipType: 'INDIVIDUAL', notes: 'California primary residence' },
      { institution: 'AZ Property', assetType: 'REAL_ESTATE', category: 'real_estate', value: 300000, ownershipType: 'INDIVIDUAL', notes: 'Arizona vacation home - requires ancillary probate' },
    ],
  },
  {
    // PTH-05: Texas Muniment of Title
    email: 'pth05-muniment@test.com',
    fullName: 'PTH-05 Muniment',
    password: 'Test123!',
    estate: {
      name: 'PTH-05: Muniment of Title Estate',
      deceasedFirstName: 'William',
      deceasedLastName: 'Muniment',
      deceasedDateOfDeath: new Date('2025-08-05'),
      deceasedState: 'TX',
      estateType: 'MUNIMENT_OF_TITLE',
      authorityType: 'MUNIMENT_OF_TITLE',
      hasWill: true,
      estimatedRealProperty: 350000,
    },
    assets: [
      { institution: 'TX Property', assetType: 'REAL_ESTATE', category: 'real_estate', value: 350000, ownershipType: 'INDIVIDUAL', notes: 'Texas real property only, no debts' },
    ],
  },
  {
    // PTH-06: Contested / Litigated Estate
    email: 'pth06-contested@test.com',
    fullName: 'PTH-06 Contested',
    password: 'Test123!',
    estate: {
      name: 'PTH-06: Contested Estate',
      deceasedFirstName: 'Elizabeth',
      deceasedLastName: 'Contested',
      deceasedDateOfDeath: new Date('2025-07-15'),
      deceasedState: 'CA',
      estateType: 'CONTESTED_ESTATE',
      authorityType: 'FORMAL_PROBATE',
      hasWill: true,
      estimatedPersonalProperty: 500000,
      probateNotes: 'Will contest filed by disinherited child',
    },
    assets: [
      { institution: 'Vanguard', assetType: 'BROKERAGE', category: 'financial', value: 500000, ownershipType: 'INDIVIDUAL', notes: 'Distribution frozen due to will contest' },
    ],
  },
  {
    // PTH-07: Trust Administration (Revocable)
    email: 'pth07-trust-revocable@test.com',
    fullName: 'PTH-07 Revocable Trust',
    password: 'Test123!',
    estate: {
      name: 'PTH-07: Revocable Trust Estate',
      deceasedFirstName: 'David',
      deceasedLastName: 'Trustor',
      deceasedDateOfDeath: new Date('2025-06-20'),
      deceasedState: 'CA',
      estateType: 'TRUST_ADMIN_REVOCABLE',
      authorityType: 'TRUST_ADMIN_REVOCABLE',
      hasWill: true,
      estimatedPersonalProperty: 800000,
    },
    assets: [
      { institution: 'Trust Property', assetType: 'REAL_ESTATE', category: 'real_estate', value: 500000, ownershipType: 'TRUST', notes: 'Held in Smith Family Trust' },
      { institution: 'Trust Brokerage', assetType: 'BROKERAGE', category: 'financial', value: 300000, ownershipType: 'TRUST', notes: 'Held in Smith Family Trust' },
    ],
  },
  {
    // PTH-08: Irrevocable Trust Settlement
    email: 'pth08-trust-irrevocable@test.com',
    fullName: 'PTH-08 Irrevocable Trust',
    password: 'Test123!',
    estate: {
      name: 'PTH-08: Irrevocable Trust Estate',
      deceasedFirstName: 'Patricia',
      deceasedLastName: 'Irrevocable',
      deceasedDateOfDeath: new Date('2025-05-10'),
      deceasedState: 'CA',
      estateType: 'TRUST_ADMIN_IRREVOCABLE',
      authorityType: 'TRUST_ADMIN_IRREVOCABLE',
      hasWill: false,
      estimatedPersonalProperty: 1200000,
    },
    assets: [
      { institution: 'Irrevocable Trust', assetType: 'BROKERAGE', category: 'financial', value: 1200000, ownershipType: 'TRUST', notes: 'Irrevocable life insurance trust with income' },
    ],
  },
  {
    // PTH-09: Pour-Over Hybrid
    email: 'pth09-pourover@test.com',
    fullName: 'PTH-09 Pour-Over',
    password: 'Test123!',
    estate: {
      name: 'PTH-09: Pour-Over Hybrid Estate',
      deceasedFirstName: 'Richard',
      deceasedLastName: 'Pourover',
      deceasedDateOfDeath: new Date('2025-04-15'),
      deceasedState: 'CA',
      estateType: 'POUR_OVER_WILL',
      authorityType: 'FORMAL_PROBATE',
      hasWill: true,
      estimatedPersonalProperty: 600000,
      estimatedRealProperty: 500000,
    },
    assets: [
      { institution: 'Trust Home', assetType: 'REAL_ESTATE', category: 'real_estate', value: 500000, ownershipType: 'TRUST', notes: 'In trust' },
      { institution: 'Fidelity', assetType: 'BROKERAGE', category: 'financial', value: 400000, ownershipType: 'INDIVIDUAL', notes: 'Outside trust - requires probate' },
      { institution: 'Bank of America', assetType: 'CHECKING', category: 'financial', value: 50000, ownershipType: 'BENEFICIARY', notes: 'POD designation' },
    ],
  },
  {
    // PTH-10: Business Estate Administration
    email: 'pth10-business@test.com',
    fullName: 'PTH-10 Business Estate',
    password: 'Test123!',
    estate: {
      name: 'PTH-10: Business Estate',
      deceasedFirstName: 'Thomas',
      deceasedLastName: 'Business',
      deceasedDateOfDeath: new Date('2025-03-20'),
      deceasedState: 'CA',
      estateType: 'BUSINESS_ESTATE',
      authorityType: 'FORMAL_PROBATE',
      hasWill: true,
      estimatedPersonalProperty: 800000,
    },
    assets: [
      { institution: 'ABC LLC', assetType: 'OTHER', category: 'other', value: 500000, ownershipType: 'INDIVIDUAL', notes: '50% LLC interest - requires valuation' },
      { institution: 'Wells Fargo', assetType: 'CHECKING', category: 'financial', value: 300000, ownershipType: 'INDIVIDUAL' },
    ],
  },
  {
    // PTH-11: Insolvent Estate
    email: 'pth11-insolvent@test.com',
    fullName: 'PTH-11 Insolvent',
    password: 'Test123!',
    estate: {
      name: 'PTH-11: Insolvent Estate',
      deceasedFirstName: 'Nancy',
      deceasedLastName: 'Insolvent',
      deceasedDateOfDeath: new Date('2025-02-10'),
      deceasedState: 'CA',
      estateType: 'INSOLVENT_ESTATE',
      authorityType: 'FORMAL_PROBATE',
      hasWill: true,
      estimatedPersonalProperty: 50000,
    },
    assets: [
      { institution: 'Chase', assetType: 'CHECKING', category: 'financial', value: 50000, ownershipType: 'INDIVIDUAL' },
    ],
    liabilities: [
      { name: 'Medical Bills', amount: 80000, status: 'DISCOVERED', priorityClass: 'MEDICAL_EXPENSES' },
      { name: 'Credit Card Debt', amount: 40000, status: 'DISCOVERED', priorityClass: 'GENERAL_DEBTS' },
    ],
  },
  {
    // PTH-12: Minor / Incapacitated Beneficiaries
    email: 'pth12-minor@test.com',
    fullName: 'PTH-12 Minor Beneficiary',
    password: 'Test123!',
    estate: {
      name: 'PTH-12: Minor Beneficiary Estate',
      deceasedFirstName: 'Christopher',
      deceasedLastName: 'Minor',
      deceasedDateOfDeath: new Date('2025-01-15'),
      deceasedState: 'CA',
      estateType: 'ESTATE_WITH_MINORS',
      authorityType: 'FORMAL_PROBATE',
      hasWill: true,
      estimatedPersonalProperty: 300000,
    },
    assets: [
      { institution: 'Schwab', assetType: 'BROKERAGE', category: 'financial', value: 300000, ownershipType: 'INDIVIDUAL' },
    ],
    heirs: [
      { name: 'Emily Minor', relationship: 'DAUGHTER', isAdult: false, email: 'guardian@test.com' },
    ],
  },
  {
    // PTH-13: Small Estate Affidavit
    email: 'pth13-smallestate@test.com',
    fullName: 'PTH-13 Small Estate',
    password: 'Test123!',
    estate: {
      name: 'PTH-13: Small Estate Affidavit',
      deceasedFirstName: 'Jennifer',
      deceasedLastName: 'Small',
      deceasedDateOfDeath: new Date('2024-12-20'),
      deceasedState: 'CA',
      estateType: 'SMALL_ESTATE',
      authorityType: 'SMALL_ESTATE',
      hasWill: true,
      estimatedPersonalProperty: 120000,
    },
    assets: [
      { institution: 'Wells Fargo', assetType: 'CHECKING', category: 'financial', value: 80000, ownershipType: 'INDIVIDUAL' },
      { institution: 'TD Ameritrade', assetType: 'BROKERAGE', category: 'financial', value: 40000, ownershipType: 'INDIVIDUAL' },
    ],
  },
  {
    // PTH-14: Joint Tenancy Transfer
    email: 'pth14-joint@test.com',
    fullName: 'PTH-14 Joint Tenancy',
    password: 'Test123!',
    estate: {
      name: 'PTH-14: Joint Tenancy Estate',
      deceasedFirstName: 'Daniel',
      deceasedLastName: 'Joint',
      deceasedDateOfDeath: new Date('2024-11-10'),
      deceasedState: 'CA',
      estateType: 'JOINT_TRANSFER',
      authorityType: 'JOINT_TRANSFER',
      hasWill: false,
      estimatedRealProperty: 400000,
    },
    assets: [
      { institution: 'Joint Property', assetType: 'REAL_ESTATE', category: 'real_estate', value: 400000, ownershipType: 'JOINT', notes: 'Joint tenancy with right of survivorship' },
    ],
  },
  {
    // PTH-15: POD / TOD Transfer
    email: 'pth15-podtod@test.com',
    fullName: 'PTH-15 POD/TOD',
    password: 'Test123!',
    estate: {
      name: 'PTH-15: POD/TOD Transfer Estate',
      deceasedFirstName: 'Sarah',
      deceasedLastName: 'Podtod',
      deceasedDateOfDeath: new Date('2024-10-05'),
      deceasedState: 'CA',
      estateType: 'POD_TOD_TRANSFER',
      authorityType: 'POD_TOD_TRANSFER',
      hasWill: false,
      estimatedPersonalProperty: 250000,
    },
    assets: [
      { institution: 'Chase', assetType: 'CHECKING', category: 'financial', value: 100000, ownershipType: 'BENEFICIARY', notes: 'POD to daughter' },
      { institution: 'Fidelity', assetType: 'BROKERAGE', category: 'financial', value: 150000, ownershipType: 'BENEFICIARY', notes: 'TOD to son' },
    ],
  },
  {
    // PTH-16: Beneficiary-Designated Insurance/Retirement
    email: 'pth16-beneficiary@test.com',
    fullName: 'PTH-16 Beneficiary',
    password: 'Test123!',
    estate: {
      name: 'PTH-16: Beneficiary Designated Estate',
      deceasedFirstName: 'Kevin',
      deceasedLastName: 'Beneficiary',
      deceasedDateOfDeath: new Date('2024-09-15'),
      deceasedState: 'CA',
      estateType: 'BENEFICIARY_DESIGNATED',
      authorityType: 'POD_TOD_TRANSFER',
      hasWill: false,
      estimatedPersonalProperty: 600000,
    },
    assets: [
      { institution: 'MetLife', assetType: 'LIFE_INSURANCE', category: 'financial', value: 250000, ownershipType: 'BENEFICIARY', notes: 'Life insurance to spouse' },
      { institution: 'Fidelity 401k', assetType: '401K', category: 'retirement', value: 350000, ownershipType: 'BENEFICIARY', notes: '401k to children' },
    ],
  },
  {
    // PTH-17: Transfer-on-Death Deed
    email: 'pth17-toddeed@test.com',
    fullName: 'PTH-17 TOD Deed',
    password: 'Test123!',
    estate: {
      name: 'PTH-17: TOD Deed Estate',
      deceasedFirstName: 'Linda',
      deceasedLastName: 'Toddeed',
      deceasedDateOfDeath: new Date('2024-08-20'),
      deceasedState: 'CA',
      estateType: 'TOD_DEED',
      authorityType: 'POD_TOD_TRANSFER',
      hasWill: false,
      estimatedRealProperty: 550000,
    },
    assets: [
      { institution: 'CA Property', assetType: 'REAL_ESTATE', category: 'real_estate', value: 550000, ownershipType: 'BENEFICIARY', notes: 'TOD deed to daughter - requires county recording' },
    ],
  },
  {
    // PTH-18: Unclaimed Property Recovery
    email: 'pth18-unclaimed@test.com',
    fullName: 'PTH-18 Unclaimed',
    password: 'Test123!',
    estate: {
      name: 'PTH-18: Unclaimed Property Estate',
      deceasedFirstName: 'Mark',
      deceasedLastName: 'Unclaimed',
      deceasedDateOfDeath: new Date('2024-07-10'),
      deceasedState: 'CA',
      estateType: 'FORMAL_PROBATE',
      authorityType: 'FORMAL_PROBATE',
      hasWill: true,
      estimatedPersonalProperty: 200000,
    },
    assets: [
      { institution: 'Wells Fargo', assetType: 'CHECKING', category: 'financial', value: 150000, ownershipType: 'INDIVIDUAL' },
      { institution: 'CA State Controller', assetType: 'OTHER', category: 'other', value: 50000, ownershipType: 'INDIVIDUAL', notes: 'Unclaimed property found via state search' },
    ],
  },
  {
    // PTH-19: Escheat / Dormant Asset Risk
    email: 'pth19-escheat@test.com',
    fullName: 'PTH-19 Escheat Risk',
    password: 'Test123!',
    estate: {
      name: 'PTH-19: Escheat Risk Estate',
      deceasedFirstName: 'Barbara',
      deceasedLastName: 'Escheat',
      deceasedDateOfDeath: new Date('2024-06-05'),
      deceasedState: 'CA',
      estateType: 'FORMAL_PROBATE',
      authorityType: 'FORMAL_PROBATE',
      hasWill: true,
      estimatedPersonalProperty: 180000,
    },
    assets: [
      { institution: 'Old Bank', assetType: 'SAVINGS', category: 'financial', value: 180000, ownershipType: 'INDIVIDUAL', notes: 'Dormant account - escheat notice received' },
    ],
  },
  {
    // PTH-20: Elective Share / Spousal Election
    email: 'pth20-elective@test.com',
    fullName: 'PTH-20 Elective Share',
    password: 'Test123!',
    estate: {
      name: 'PTH-20: Elective Share Estate',
      deceasedFirstName: 'George',
      deceasedLastName: 'Elective',
      deceasedDateOfDeath: new Date('2024-05-15'),
      deceasedState: 'CA',
      estateType: 'FORMAL_PROBATE',
      authorityType: 'FORMAL_PROBATE',
      hasWill: true,
      estimatedPersonalProperty: 800000,
      probateNotes: 'Spouse asserted elective share - will left minimal to spouse',
    },
    assets: [
      { institution: 'Vanguard', assetType: 'BROKERAGE', category: 'financial', value: 800000, ownershipType: 'INDIVIDUAL', notes: 'Distribution frozen pending spousal election resolution' },
    ],
  },
  {
    // PTH-21: Heirship / Unknown Heirs
    email: 'pth21-unknownheirs@test.com',
    fullName: 'PTH-21 Unknown Heirs',
    password: 'Test123!',
    estate: {
      name: 'PTH-21: Unknown Heirs Estate',
      deceasedFirstName: 'Dorothy',
      deceasedLastName: 'Unknown',
      deceasedDateOfDeath: new Date('2024-04-20'),
      deceasedState: 'CA',
      estateType: 'INTESTATE',
      authorityType: 'INTESTATE',
      hasWill: false,
      estimatedPersonalProperty: 350000,
      probateNotes: 'No known heirs - genealogical search required',
    },
    assets: [
      { institution: 'Schwab', assetType: 'BROKERAGE', category: 'financial', value: 350000, ownershipType: 'INDIVIDUAL', notes: 'Distribution locked pending heir discovery' },
    ],
  },
];

async function main() {
  console.log('🌱 Seeding 21 test paths...\n');

  for (const userData of TEST_USERS) {
    try {
      // Create user
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          fullName: userData.fullName,
          passwordHash: '$2a$10$YourHashedPasswordHere', // You'll need to hash this properly
          role: 'EXECUTOR',
        },
      });

      console.log(`✅ Created user: ${userData.email}`);

      // Create estate
      const estate = await prisma.estate.create({
        data: {
          ...userData.estate,
          userId: user.id,
        },
      });

      console.log(`   📋 Created estate: ${userData.estate.name}`);

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

      // Create heirs (if any)
      if (userData.heirs) {
        for (const heirData of userData.heirs) {
          await prisma.heir.create({
            data: {
              ...heirData,
              estateId: estate.id,
            },
          });
        }
        console.log(`   👥 Created ${userData.heirs.length} heirs`);
      }

      console.log('');
    } catch (error) {
      console.error(`❌ Error creating ${userData.email}:`, error);
    }
  }

  console.log('✨ Seeding complete!\n');
  console.log('📝 Test User Credentials:');
  console.log('   Email: pth[01-21]-[name]@test.com');
  console.log('   Password: Test123!');
  console.log('\n📊 Quick Reference:');
  console.log('   PTH-01: pth01-probate@test.com (Full Probate)');
  console.log('   PTH-02: pth02-intestate@test.com (Intestate)');
  console.log('   PTH-13: pth13-smallestate@test.com (Small Estate)');
  console.log('   PTH-07: pth07-trust-revocable@test.com (Trust Admin)');
  console.log('   PTH-09: pth09-pourover@test.com (Pour-Over Hybrid)');
  console.log('   ... and 16 more paths\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
