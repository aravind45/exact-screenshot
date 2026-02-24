/**
 * Upsert a Texas pilot login account with a known password.
 *
 * Usage:
 *   npx tsx scripts/upsert-texas-pilot-user.ts
 *
 * Optional env overrides:
 *   PILOT_EMAIL=texaszenister@gmail.com
 *   PILOT_PASSWORD=ttl12345
 *   PILOT_NAME="Texas Pilot Attorney"
 *   PILOT_ROLE=ATTORNEY
 *   PILOT_USER_TYPE=ADVISOR
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PILOT_EMAIL = process.env.PILOT_EMAIL || 'texaszenister@gmail.com';
const PILOT_PASSWORD = process.env.PILOT_PASSWORD || 'ttl12345';
const PILOT_NAME = process.env.PILOT_NAME || 'Texas Pilot Attorney';
const PILOT_ROLE = (process.env.PILOT_ROLE || 'ATTORNEY').toUpperCase();
const PILOT_USER_TYPE = (process.env.PILOT_USER_TYPE || 'ADVISOR').toUpperCase();

async function upsertTexasPilotUser() {
  console.log(`🔍 Upserting Texas pilot user: ${PILOT_EMAIL}`);

  const passwordHash = await bcrypt.hash(PILOT_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: PILOT_EMAIL },
    update: {
      fullName: PILOT_NAME,
      passwordHash,
      role: PILOT_ROLE as any,
      userType: PILOT_USER_TYPE,
      isPilot: true,
      emailVerifiedAt: new Date(),
      verificationToken: null,
      trialStartedAt: new Date(),
      lastLoginAt: new Date(),
    } as any,
    create: {
      email: PILOT_EMAIL,
      fullName: PILOT_NAME,
      passwordHash,
      role: PILOT_ROLE as any,
      userType: PILOT_USER_TYPE,
      isPilot: true,
      emailVerifiedAt: new Date(),
      trialStartedAt: new Date(),
      lastLoginAt: new Date(),
    } as any,
  });

  console.log('✅ Texas pilot user ready.');
  console.log(`   id: ${user.id}`);
  console.log(`   email: ${user.email}`);
  console.log(`   role: ${user.role}`);
  console.log(`   userType: ${user.userType}`);
  console.log(`   isPilot: ${user.isPilot}`);
  console.log(`   emailVerifiedAt: ${user.emailVerifiedAt ? 'set' : 'not set'}`);
  console.log('   Password has been reset to the configured pilot password.');
}

upsertTexasPilotUser()
  .catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
