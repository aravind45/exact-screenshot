import { prisma } from '../server/db.js';

async function verifyAllAdvisors() {
    console.log("🔍 Finding all PENDING advisors...");
    const advisors = await prisma.advisorProfile.findMany({
        where: { verificationStatus: 'PENDING' }
    });

    console.log(`📋 Found ${advisors.length} pending advisors. Verifying...`);

    for (const advisor of advisors) {
        await prisma.advisorProfile.update({
            where: { id: advisor.id },
            data: {
                verificationStatus: 'VERIFIED',
                isVerified: true
            }
        });
        console.log(`✅ Advisor ${advisor.id} is now VERIFIED.`);
    }

    console.log("🎉 Done!");
    process.exit(0);
}

verifyAllAdvisors().catch(err => {
    console.error(err);
    process.exit(1);
});
