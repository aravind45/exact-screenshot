/**
 * SSOT Database Client - Raw SQL access for SSOT tables
 * Since SSOT tables use raw SQL (not Prisma models), we use $queryRawUnsafe
 */
import { prisma } from '../../db.js';
import { logger } from '../../lib/logger.js';
export async function logChange(entry) {
    try {
        await prisma.$executeRawUnsafe(`
      INSERT INTO ssot_change_logs (id, entity_type, entity_id, action, old_value, new_value, changed_by, change_reason)
      VALUES (gen_random_uuid()::text, $1, $2, $3, $4::jsonb, $5::jsonb, $6, $7)
    `, entry.entityType, entry.entityId, entry.action, entry.oldValue ? JSON.stringify(entry.oldValue) : null, entry.newValue ? JSON.stringify(entry.newValue) : null, entry.changedBy || null, entry.changeReason || null);
    }
    catch (err) {
        logger.error('Failed to log SSOT change:', err.message);
    }
}
export async function queryRows(sql, ...params) {
    return prisma.$queryRawUnsafe(sql, ...params);
}
export async function executeSQL(sql, ...params) {
    return prisma.$executeRawUnsafe(sql, ...params);
}
export { prisma };
