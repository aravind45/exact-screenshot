import { prisma } from '../db.js';

async function cleanupDuplicateTasks() {
  console.log('Starting duplicate cleanup for issue_cert_trust...');

  const duplicates = await prisma.$queryRaw<Array<{ id: string; phase_id: string; task_code: string; created_at: Date }>>`
    SELECT id, phase_id, task_code, created_at
    FROM roadmap_tasks
    WHERE task_code = 'issue_cert_trust'
    ORDER BY created_at DESC
  `;

  const uniqueMap = new Map<string, { id: string; phase_id: string; task_code: string; created_at: Date }>();
  const toDelete: string[] = [];

  for (const row of duplicates) {
    const key = `${row.phase_id}|${row.task_code}`;
    if (uniqueMap.has(key)) {
      toDelete.push(row.id);
      console.log(`Marking for deletion: ${row.id} (duplicate, created: ${row.created_at})`);
    } else {
      uniqueMap.set(key, row);
    }
  }

  if (toDelete.length > 0) {
    console.log(`Deleting ${toDelete.length} duplicate task rows...`);
    await prisma.roadmapTask.deleteMany({
      where: { id: { in: toDelete } },
    });
    console.log(`✅ Cleanup complete: ${toDelete.length} duplicates removed`);
  } else {
    console.log('✅ No duplicates found for issue_cert_trust');
  }
}

cleanupDuplicateTasks()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
