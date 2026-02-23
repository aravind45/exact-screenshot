/**
 * Script to create/promote aravind45@gmail.com as ADMIN.
 * 
 * Usage: npx tsx scripts/promote-admin.ts
 * 
 * Requires DATABASE_URL in .env
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ADMIN_EMAIL = 'aravind45@gmail.com';
const ADMIN_NAME = 'Aravind';
const TEMP_PASSWORD = 'Admin@2026!'; // User should change on first login

async function promoteOrCreateAdmin() {
  console.log(`🔍 Looking up user: ${ADMIN_EMAIL}`);
  
  let user = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL }
  });

  if (!user) {
    console.log(`⚡ User not found. Creating ADMIN account...`);
    
    const passwordHash = await bcrypt.hash(TEMP_PASSWORD, 10);
    
    user = await prisma.user.create({
      data: {
        email: ADMIN_EMAIL,
        passwordHash,
        fullName: ADMIN_NAME,
        role: 'ADMIN' as any,
        userType: 'EXECUTOR',
        lastLoginAt: new Date(),
        trialStartedAt: new Date(),
        emailVerifiedAt: new Date(), // Auto-verify admin
      } as any
    });

    console.log(`✅ ADMIN account created!`);
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${TEMP_PASSWORD}`);
    console.log(`   ⚠️  Please change the password after first login.`);
  } else {
    console.log(`👤 Found user: ${user.fullName} (ID: ${user.id})`);
    console.log(`   Current role: ${user.role}`);

    if (user.role === 'ADMIN') {
      console.log(`✅ User is already ADMIN. No changes needed.`);
      process.exit(0);
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { role: 'ADMIN' as any }
    });

    console.log(`✅ Promoted ${ADMIN_EMAIL} to ADMIN.`);
    console.log(`   Previous role: ${user.role} → New role: ${updated.role}`);
  }
}

promoteOrCreateAdmin()
  .catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
