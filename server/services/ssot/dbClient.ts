/**
 * SSOT Database Client - Raw SQL access for SSOT tables
 * Since SSOT tables use raw SQL (not Prisma models), we use $queryRawUnsafe
 */
import { prisma } from '../../db.js';
import { logger } from '../../lib/logger.js';

export type SSOTStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface ChangeLogEntry {
  entityType: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'PUBLISH' | 'ARCHIVE' | 'ROLLBACK';
  oldValue?: any;
  newValue?: any;
  changedBy?: string;
  changeReason?: string;
}

export async function logChange(entry: ChangeLogEntry) {
  try {
    await prisma.$executeRawUnsafe(`
      INSERT INTO ssot_change_logs (id, entity_type, entity_id, action, old_value, new_value, changed_by, change_reason)
      VALUES (gen_random_uuid()::text, $1, $2, $3, $4::jsonb, $5::jsonb, $6, $7)
    `, entry.entityType, entry.entityId, entry.action,
      entry.oldValue ? JSON.stringify(entry.oldValue) : null,
      entry.newValue ? JSON.stringify(entry.newValue) : null,
      entry.changedBy || null, entry.changeReason || null);
  } catch (err: any) {
    logger.error('Failed to log SSOT change:', err.message);
  }
}

export async function queryRows<T = any>(sql: string, ...params: any[]): Promise<T[]> {
  return prisma.$queryRawUnsafe<T[]>(sql, ...params);
}

export async function executeSQL(sql: string, ...params: any[]): Promise<number> {
  return prisma.$executeRawUnsafe(sql, ...params);
}

export { prisma };
