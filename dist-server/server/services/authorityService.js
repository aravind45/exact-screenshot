import { prisma } from "../db.js";
import { AuditService } from "./auditService.js";
import { logger } from "../lib/logger.js";
export const AuthorityService = {
    /**
     * Snapshot the current inputs and decision for auditability (Gap A)
     */
    async trackDecision(estateId, userId, inputs, decision, recalcReason) {
        // ruleVersion can be a hash or a date-based version
        const ruleVersion = "2026-02-02-V1";
        const record = await prisma.authorityDecision.create({
            data: {
                estateId,
                inputs,
                decision,
                ruleVersion,
                recalcReason
            }
        });
        // Update the estate with the latest decision
        await prisma.estate.update({
            where: { id: estateId },
            data: {
                authorityDecision: decision,
                authorityType: decision.type
            }
        });
        await AuditService.logActivity(estateId, userId, 'CONFIGURATION', 'UPDATED', `AUTHORITY – Path re-assessed: ${decision.legalTerm} (${decision.masterMode}). Reason: ${recalcReason || 'Initial assessment'}`);
        return record;
    },
    /**
     * Handle reclassification (Gap B)
     * Compares new recommendation with old one and determines migration strategy
     */
    async handleReclassification(estateId, userId, newRecommendation) {
        const estate = await prisma.estate.findUnique({
            where: { id: estateId },
            select: { authorityDecision: true, authorityType: true, roadmapProgress: true }
        });
        const oldDecision = estate?.authorityDecision;
        const oldType = estate?.authorityType;
        if (oldType && oldType !== newRecommendation.type) {
            logger.info(`Estate ${estateId} reclassified from ${oldType} to ${newRecommendation.type}`);
            // Log reclassification event
            await this.trackDecision(estateId, userId, { /* snapshot would go here */}, newRecommendation, `Automated reclassification from ${oldType} to ${newRecommendation.type}`);
            // TODO: Logic for carrying forward completed tasks that still exist in the new roadmap
            // For now, we keep the roadmapProgress as is, the frontend dynamic roadmap will filter 
            // the completedTaskIds based on what's applicable to the new path.
            return {
                reclassified: true,
                oldType,
                newType: newRecommendation.type,
                warning: `Your estate path has changed due to updated asset values or information. Your roadmap has been updated to ${newRecommendation.legalTerm}.`
            };
        }
        return { reclassified: false };
    }
};
