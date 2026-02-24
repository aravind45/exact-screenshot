import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding MA Task Overrides...');

    const overrides = [
        {
            stateCode: 'MA',
            taskKey: 'publish_notice',
            title: 'Strategic Option: Publish Notice to Shorten Claim Window',
            description: 'In Massachusetts, publication is not required to obtain authority, but it is STRATEGICALLY RECOMMENDED. Without publication, creditors have 1 year from the date of death to file claims. With publication, this is shortened to 4 months after the date of first publication.',
            primaryActionLabel: 'Review Publication Strategy',
            isOptional: true
        },
        {
            stateCode: 'MA',
            taskKey: 'wait_claim_period',
            title: 'Monitor 1-Year (or 4-Month) Creditor Exposure',
            description: 'Statutory Rule (MGL c.197 §9): Creditors have 1 year from the date of death to present claims. If you published a notice to creditors, this period is shortened to 4 months after publication. Do not make final distributions until this period has safely passed.'
        },
        {
            stateCode: 'MA',
            taskKey: 'file_probate_petition',
            title: 'File Petition for Probate (Informal or Formal)',
            description: 'Submit the appropriate MUPC petition (Informal or Formal) to the Probate and Family Court. Informal is faster for uncontested wills; Formal is required for contested or complex situations.',
            formNames: ['Petition for Informal Probate (MPC 150)', 'Petition for Formal Probate (MPC 160)']
        },
        {
            stateCode: 'MA',
            taskKey: 'file_voluntary_administration',
            title: 'File Voluntary Administration Statement',
            description: 'For estates under $25,000 (plus one car), file this simplified statement to obtain authority without full probate.',
            formNames: ['Voluntary Administration Statement (MPC 270)']
        },
        {
            stateCode: 'MA',
            taskKey: 'handle_bond_waivers',
            title: 'Request No Surety on Bond',
            description: 'In MA, a bond is always required, but you can request the "surety" (the expensive insurance premium) be waived if all heirs assent or the Will allows it.',
            formNames: ['Assent and Waiver of Surety (MPC 455)']
        },
        {
            stateCode: 'MA',
            taskKey: 'file_estate_tax_return',
            title: 'File MA Estate Tax Return (Form M-706)',
            description: 'Required for MA estates exceeding $2,000,000 in gross value. Must be filed within 9 months of death.',
            formNames: ['Form M-706']
        },
        {
            stateCode: 'MA',
            taskKey: 'file_form_1041',
            title: 'File MA Fiduciary Income Tax (Form 2)',
            description: 'Required if the estate earnings exceed $100 in Massachusetts.',
            formNames: ['Form 2']
        }
    ];

    for (const override of overrides) {
        const data = {
            ...override,
            formNames: override.formNames || [],
            dependencies: (override as any).dependencies || []
        };

        await (prisma as any).roadmapTaskStateOverride.upsert({
            where: {
                stateCode_taskKey: {
                    stateCode: data.stateCode,
                    taskKey: data.taskKey
                }
            },
            update: data,
            create: data as any
        });
        console.log(`   ✅ Override for ${data.taskKey} ensured.`);
    }

    console.log('✨ MA Task Overrides complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
