import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const VALID_SCOPES = new Set(['PROBATE', 'TRUST', 'BOTH']);

async function verifyAuthorityIntegrity() {
  console.log('🔍 Verifying authority scope integrity...');

  const nullResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count
    FROM roadmap_tasks
    WHERE authority_scope IS NULL
  `;
  const nullCount = Number(nullResult[0].count);

  if (nullCount > 0) {
    console.error(`❌ FAIL: Found ${nullCount} tasks with NULL authorityScope`);
    process.exit(1);
  }

  console.log('✅ PASS: No NULL authorityScope values found');

  const invalidResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count
    FROM roadmap_tasks
    WHERE authority_scope NOT IN ('PROBATE', 'TRUST', 'BOTH')
  `;
  const invalidCount = Number(invalidResult[0].count);

  if (invalidCount > 0) {
    console.error(`❌ FAIL: Found ${invalidCount} tasks with invalid authorityScope`);
    process.exit(1);
  }

  console.log('✅ PASS: All authorityScope values are valid (PROBATE/TRUST/BOTH)');

  const dupResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count FROM (
      SELECT phase_id, "taskCode", COUNT(*) as dup_count
      FROM roadmap_tasks
      GROUP BY phase_id, "taskCode"
      HAVING COUNT(*) > 1
    ) dups
  `;
  const dupCount = Number(dupResult[0].count);

  if (dupCount > 0) {
    console.error(`❌ FAIL: Found ${dupCount} duplicate (phase_id, taskCode) combinations`);
    process.exit(1);
  }

  console.log('✅ PASS: No duplicate (phase_id, taskCode) combinations found');

  const totalResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count FROM roadmap_tasks
  `;
  const totalCount = Number(totalResult[0].count);

  const breakdown = await prisma.$queryRaw<Array<{ authority_scope: string; count: bigint }>>`
    SELECT authority_scope, COUNT(*) as count
    FROM roadmap_tasks
    GROUP BY authority_scope
    ORDER BY authority_scope
  `;

  console.log(`\n📊 Authority scope breakdown (${totalCount} total tasks):`);
  for (const row of breakdown) {
    console.log(`   ${row.authority_scope}: ${Number(row.count)}`);
  }

  console.log('\n✅ All authority scope integrity checks passed');
}

verifyAuthorityIntegrity()
  .catch((error) => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
