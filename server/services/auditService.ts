import { prisma } from "../db.js";
import crypto from 'crypto';

export const AuditService = {
    /**
     * Logs an immutable, cryptographically-chained activity record.
     * This replaces direct prisma.settlementActivity.create calls.
     */
    async logActivity(
        estateId: string,
        userId: string,
        type: string,
        action: string,
        notes: string | null,
        metadata: { taskId?: string, phase?: string } = {}
    ) {
        // 1. Fetch the Previous Record for this Estate to establish the chain
        const previousRecord = await prisma.settlementActivity.findFirst({
            where: { estateId },
            orderBy: { occurredAt: 'desc' }
        });

        const previousHash = previousRecord?.hash || "GENESIS_BLOCK";
        const occurredAt = new Date();

        // 2. Generate the Hash Payload
        // We include all semantic fields to ensure any change invalidates the hash
        const payload = JSON.stringify({
            estateId,
            userId,
            type,
            action,
            notes: notes || "",
            taskId: metadata.taskId || "",
            phase: metadata.phase || "",
            occurredAt: occurredAt.toISOString(),
            previousHash
        });

        // 3. Calculate SHA-256 Hash
        const hash = crypto.createHash('sha256').update(payload).digest('hex');

        // 4. Create the Record
        return await prisma.settlementActivity.create({
            data: {
                estateId,
                userId,
                type,
                action,
                notes,
                taskId: metadata.taskId,
                phase: metadata.phase,
                occurredAt,
                previousHash,
                hash
            }
        });
    },

    /**
     * Verifies the cryptographic integrity of an estate's audit trail.
     * Returns true if valid, or throws error with details if tampered.
     */
    async verifyChain(estateId: string) {
        const activities = await prisma.settlementActivity.findMany({
            where: { estateId },
            orderBy: { occurredAt: 'asc' }
        });

        if (activities.length === 0) return { valid: true };

        for (let i = 0; i < activities.length; i++) {
            const current = activities[i];
            const previous = i === 0 ? null : activities[i - 1];
            const expectedPrevHash = previous ? previous.hash : "GENESIS_BLOCK";

            // 1. Check Chain Link
            if (current.previousHash !== expectedPrevHash) {
                return {
                    valid: false,
                    error: `Broken Chain at Index ${i} (ID: ${current.id}). Previous Hash mismatch.`
                };
            }

            // 2. data integrity verification
            const payload = JSON.stringify({
                estateId: current.estateId,
                userId: current.userId,
                type: current.type,
                action: current.action,
                notes: current.notes || "",
                taskId: current.taskId || "",
                phase: current.phase || "",
                occurredAt: current.occurredAt.toISOString(),
                previousHash: current.previousHash
            });

            const calculatedHash = crypto.createHash('sha256').update(payload).digest('hex');

            if (calculatedHash !== current.hash) {
                return {
                    valid: false,
                    error: `Tampering Detected at Index ${i} (ID: ${current.id}). Content does not match Hash.`
                };
            }
        }

        return { valid: true, count: activities.length };
    }
};
