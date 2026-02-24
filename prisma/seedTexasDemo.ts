import { PrismaClient, UserRole } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🌵 Starting Texas B2B Pilot Demo Seed...');

    const attorneyEmail = 'texas.pilot@expectedestate.com';

    // 1. Create/Ensure Pilot Attorney
    const passwordHash = '$2b$10$w9dg8Ssyf.xSkQDsvviHSOxmJLUmUdmo4bmas5DoaIcoygz1V7Vo.'; // 'password'

    const attorney = await prisma.user.upsert({
        where: { email: attorneyEmail },
        update: {
            role: 'ATTORNEY' as UserRole,
            isPilot: true,
            subscriptionStatus: 'ACTIVE'
        },
        create: {
            email: attorneyEmail,
            fullName: 'Sarah Jennings, J.D.',
            passwordHash: passwordHash,
            role: 'ATTORNEY' as UserRole,
            isPilot: true,
            state: 'TX',
            subscriptionStatus: 'ACTIVE'
        }
    });

    console.log(`✅ Attorney ensured: ${attorney.email}`);

    // 2. Clear old demo data for this attorney to prevent duplicates on re-run
    const oldEstates = await prisma.estate.findMany({ where: { userId: attorney.id } });
    for (const e of oldEstates) {
        await prisma.asset.deleteMany({ where: { estateId: e.id } });
        await prisma.deadline.deleteMany({ where: { estateId: e.id } });
        await prisma.estate.delete({ where: { id: e.id } });
    }

    // 3. Create Sample Cases (Estates)
    const cases = [
        { first: 'George', last: 'Benson', caseNum: 'PR-2024-00123', admin: 'Independent', assets: 1245000 },
        { first: 'Maria', last: 'Garcia', caseNum: 'PR-2024-00456', admin: 'Dependent', assets: 650000 },
        { first: 'William', last: 'Travis', caseNum: 'PR-2024-00789', admin: 'Independent', assets: 2100000 }
    ];

    for (const c of cases) {
        const estate = await prisma.estate.create({
            data: {
                userId: attorney.id,
                name: `${c.first} ${c.last} Case`,
                deceasedFirstName: c.first,
                deceasedLastName: c.last,
                deceasedState: 'TX',
                courtCaseNumber: c.caseNum,
                probateStatus: 'EXECUTOR_APPOINTED',
                administrationType: c.admin,
                estimatedPersonalProperty: Math.round(c.assets * 0.4),
                estimatedRealProperty: Math.round(c.assets * 0.6),
                status: 'active'
            } as any
        });

        // Add some assets
        await prisma.asset.create({
            data: {
                estateId: estate.id,
                userId: attorney.id,
                institution: 'Frost Bank',
                assetType: 'BANK_ACCOUNT',
                category: 'CASH',
                value: 45000,
                status: 'verified',
                ownershipType: 'INDIVIDUAL'
            }
        });

        await prisma.asset.create({
            data: {
                estateId: estate.id,
                userId: attorney.id,
                institution: 'Texas Real Estate',
                assetType: 'REAL_PROPERTY',
                category: 'REAL_ESTATE',
                value: c.assets * 0.6,
                status: 'discovered',
                ownershipType: 'INDIVIDUAL'
            }
        });

        // Add some deadlines
        await prisma.deadline.create({
            data: {
                estateId: estate.id,
                title: 'File Inventory',
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                status: 'PENDING',
                isStatutory: true
            }
        });

        await prisma.deadline.create({
            data: {
                estateId: estate.id,
                title: 'Notice to Creditors',
                dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Past
                status: 'COMPLETED',
                isStatutory: true,
                isCompleted: true
            }
        });
    }

    console.log('✅ Texas Demo Cases seeded!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
