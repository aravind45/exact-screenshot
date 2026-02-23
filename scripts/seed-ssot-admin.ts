/**
 * Ensure Super Admin user exists with ADMIN role
 * Usage: npx tsx scripts/seed-ssot-admin.ts
 */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const email = "aravind45@gmail.com";
  const existing = await prisma.user.findUnique({ where: { email } });

  if (!existing) {
    console.log(`⚠️  User ${email} not found. Please register first, then re-run this script.`);
    return;
  }

  if (existing.role === "ADMIN") {
    console.log(`✅ ${email} already has ADMIN role`);
    return;
  }

  await prisma.user.update({
    where: { email },
    data: { role: "ADMIN" },
  });
  console.log(`✅ Promoted ${email} to ADMIN role`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
