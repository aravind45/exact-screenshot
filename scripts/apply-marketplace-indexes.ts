/**
 * Apply marketplace performance indexes to the database.
 * Run with: npx tsx scripts/apply-marketplace-indexes.ts
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

// Split on statement-level semicolons, skipping DO $$ blocks properly
async function applyIndexes() {
  console.log("🔧 Applying marketplace performance indexes...\n");

  const indexes = [
    // GIN indexes for array search
    `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_advisor_specialties_gin ON advisor_profiles USING gin(specialties)`,
    `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_advisor_states_gin ON advisor_profiles USING gin(states_served)`,
    // Partial indexes for advisor status
    `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_advisor_approved ON advisor_profiles(created_at DESC) WHERE status = 'APPROVED'`,
    `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_advisor_pending_review ON advisor_profiles(created_at ASC) WHERE status = 'PENDING_REVIEW'`,
    `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_advisor_approved_rating ON advisor_profiles(avg_rating DESC NULLS LAST, hourly_rate ASC) WHERE status = 'APPROVED'`,
    // Booking conflict check index (critical hot path)
    `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_booking_conflict_check ON bookings(advisor_id, start_time, end_time) WHERE status IN ('REQUESTED', 'CONFIRMED')`,
    // Admin audit log indexes
    `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_admin_created ON admin_action_logs(admin_id, created_at DESC)`,
    `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_target ON admin_action_logs(target_type, target_id, created_at DESC)`,
    // Availability lookup indexes
    `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_avail_rule_advisor_dow ON availability_rules(advisor_id, day_of_week) WHERE is_active = true`,
    `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_avail_exception_advisor_date_b ON availability_exceptions(advisor_id, date)`,
    // License document expiry index
    `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_license_expiry_active ON advisor_license_documents(expiration_date ASC) WHERE status = 'VERIFIED' AND expiration_date IS NOT NULL`,
    // Dispute indexes
    `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dispute_status_created ON disputes(status, created_at DESC) WHERE status IN ('OPEN', 'UNDER_REVIEW')`,
    // Payment lookup
    `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_intent_id ON marketplace_payments(stripe_payment_intent_id)`,
    // Booking by user
    `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_booking_user_status ON bookings(user_id, status, start_time DESC)`,
  ];

  let created = 0;
  let skipped = 0;

  for (const sql of indexes) {
    const name = sql.match(/idx_\w+/)?.[0] ?? "unknown";
    try {
      await prisma.$executeRawUnsafe(sql);
      console.log(`  ✅ ${name}`);
      created++;
    } catch (err: any) {
      if (err.message?.includes("already exists")) {
        console.log(`  ⏭️  ${name} (already exists)`);
        skipped++;
      } else {
        console.error(`  ❌ ${name}: ${err.message}`);
      }
    }
  }

  // Verify
  const result: any[] = await prisma.$queryRaw`
    SELECT COUNT(*) as cnt FROM pg_indexes
    WHERE schemaname = 'public' AND indexname IN (
      'idx_advisor_specialties_gin', 'idx_advisor_states_gin',
      'idx_advisor_approved', 'idx_advisor_pending_review',
      'idx_advisor_approved_rating', 'idx_booking_conflict_check',
      'idx_audit_log_admin_created', 'idx_audit_log_target',
      'idx_avail_rule_advisor_dow', 'idx_avail_exception_advisor_date_b',
      'idx_license_expiry_active', 'idx_dispute_status_created',
      'idx_payment_intent_id', 'idx_booking_user_status'
    )
  `;
  const verified = Number(result[0]?.cnt ?? 0);

  console.log(`\n✅ Done. Created: ${created}, Skipped: ${skipped}`);
  console.log(`📊 Verified ${verified} of 14 marketplace indexes in pg_indexes`);
  await prisma.$disconnect();
}

applyIndexes().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
