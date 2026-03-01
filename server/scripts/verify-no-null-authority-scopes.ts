import { prisma } from '../db.js';

async function verifyNoNullAuthorityScopes() {
  console.log('Checking for NULL authority_scope values in roadmap_tasks...');

  const result = await prisma.$queryRaw<Array<{ task_code: string; id: string }>>`
    SELECT task_code, id
    FROM roadmap_tasks
    WHERE authority_scope IS NULL
  `;

  if (result.length > 0) {
    console.error(`❌ FAIL: Found ${result.length} tasks with NULL authority_scope:`);
    result.forEach((row) => {
      console.error(`  - task_code: ${row.task_code}, id: ${row.id}`);
    });
    process.exit(1);
  } else {
    console.log('✅ PASS: No tasks with NULL authority_scope found');
  }
}

verifyNoNullAuthorityScopes()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
