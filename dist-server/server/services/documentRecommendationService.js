import { prisma } from "../db.js";
export class DocumentRecommendationService {
    /**
     * Get document recommendations for a communication
     */
    static async getRecommendations(params) {
        const { assetId, workflowStep, communicationType, institution } = params;
        // Get asset details
        const asset = await prisma.asset.findUnique({
            where: { id: assetId },
            include: { estate: true }
        });
        if (!asset) {
            throw new Error('Asset not found');
        }
        // Get existing estate documents
        const estateDocuments = await prisma.estateDocument.findMany({
            where: { estateId: asset.estateId }
        });
        const existingDocTypes = estateDocuments.map(d => d.documentType);
        // Determine required documents based on workflow step
        const requirements = this.getRequirementsByStep(workflowStep || 'initial_contact', asset.category, asset.ownershipType, institution || asset.institution);
        // Separate into required and suggested
        const required = requirements.filter(r => r.required);
        const suggested = requirements.filter(r => !r.required);
        // Find missing required documents
        const missing = required
            .filter(r => !existingDocTypes.includes(r.documentType))
            .map(r => r.documentType);
        // Calculate completeness percentage
        const completeness = required.length > 0
            ? Math.round(((required.length - missing.length) / required.length) * 100)
            : 100;
        return {
            required,
            suggested,
            missing,
            completeness
        };
    }
    /**
     * Get document requirements based on workflow step
     */
    static getRequirementsByStep(step, assetCategory, ownershipType, institution) {
        const requirements = [];
        // Universal requirements (always needed)
        requirements.push({
            documentType: 'DEATH_CERTIFICATE',
            required: true,
            reason: 'Required by all institutions to verify death',
            priority: 'high'
        });
        // Step-specific requirements
        switch (step) {
            case 'initial_contact':
            case 'initial_notification':
                // Just death certificate for initial contact
                break;
            case 'documents_requested':
            case 'obtain_balance':
                // Add Letters if probate required
                if (ownershipType === 'INDIVIDUAL') {
                    requirements.push({
                        documentType: 'DE_150_LETTERS',
                        required: true,
                        reason: 'Required for individually-owned assets',
                        priority: 'high'
                    });
                    requirements.push({
                        documentType: 'DE_111_PETITION',
                        required: true,
                        reason: 'Court petition for probate',
                        priority: 'high'
                    });
                }
                // Add claim form
                requirements.push({
                    documentType: 'CLAIM_FORM',
                    required: false,
                    reason: 'Institution-specific claim form',
                    priority: 'medium'
                });
                break;
            case 'claim_submitted':
            case 'documents_submitted':
                // All previous documents plus supporting docs
                if (ownershipType === 'INDIVIDUAL') {
                    requirements.push({
                        documentType: 'DE_150_LETTERS',
                        required: true,
                        reason: 'Required for individually-owned assets',
                        priority: 'high'
                    });
                    requirements.push({
                        documentType: 'DE_111_PETITION',
                        required: true,
                        reason: 'Court petition for probate',
                        priority: 'high'
                    });
                }
                requirements.push({
                    documentType: 'CLAIM_FORM',
                    required: true,
                    reason: 'Required to process claim',
                    priority: 'high'
                });
                requirements.push({
                    documentType: 'ACCOUNT_STATEMENT',
                    required: false,
                    reason: 'Helps verify account ownership',
                    priority: 'low'
                });
                break;
            case 'under_review':
            case 'approved':
                // All documents should be submitted by now
                if (ownershipType === 'INDIVIDUAL') {
                    requirements.push({
                        documentType: 'DE_150_LETTERS',
                        required: true,
                        reason: 'Required for individually-owned assets',
                        priority: 'high'
                    });
                }
                break;
        }
        // Institution-specific requirements
        const institutionReqs = this.getInstitutionRequirements(institution);
        requirements.push(...institutionReqs);
        // Remove duplicates
        const uniqueReqs = requirements.reduce((acc, curr) => {
            const existing = acc.find(r => r.documentType === curr.documentType);
            if (!existing) {
                acc.push(curr);
            }
            else if (curr.required && !existing.required) {
                // Upgrade to required if any rule says it's required
                existing.required = true;
                existing.priority = 'high';
            }
            return acc;
        }, []);
        return uniqueReqs;
    }
    /**
     * Get institution-specific requirements
     */
    static getInstitutionRequirements(institution) {
        const lowerInst = institution.toLowerCase();
        // Fidelity-specific
        if (lowerInst.includes('fidelity')) {
            return [
                {
                    documentType: 'FIDELITY_CLAIM_FORM',
                    required: false,
                    reason: 'Fidelity-specific claim form (can be obtained from their website)',
                    priority: 'medium'
                }
            ];
        }
        // Chase-specific
        if (lowerInst.includes('chase')) {
            return [
                {
                    documentType: 'BANK_STATEMENT',
                    required: false,
                    reason: 'Chase often requests recent bank statements',
                    priority: 'medium'
                }
            ];
        }
        // Vanguard-specific
        if (lowerInst.includes('vanguard')) {
            return [
                {
                    documentType: 'VANGUARD_CLAIM_FORM',
                    required: false,
                    reason: 'Vanguard-specific claim form',
                    priority: 'medium'
                }
            ];
        }
        return [];
    }
    /**
     * Get available documents for auto-attach
     */
    static async getAvailableDocuments(estateId) {
        const documents = await prisma.estateDocument.findMany({
            where: { estateId },
            orderBy: { createdAt: 'desc' }
        });
        return documents.map(doc => ({
            id: doc.id,
            name: doc.name,
            documentType: doc.documentType,
            uploadedAt: doc.createdAt,
            fileUrl: doc.fileUrl
        }));
    }
    /**
     * Auto-attach required documents to a communication
     */
    static async autoAttachDocuments(communicationId, documentIds) {
        // This would create communication_attachment records
        // For now, we'll just validate the documents exist
        const documents = await prisma.estateDocument.findMany({
            where: { id: { in: documentIds } }
        });
        if (documents.length !== documentIds.length) {
            throw new Error('Some documents not found');
        }
        // In a real implementation, you'd create attachment records here
        console.log(`Would attach ${documentIds.length} documents to communication ${communicationId}`);
    }
    /**
     * Validate document completeness
     */
    static async validateCompleteness(assetId, attachedDocumentIds) {
        const asset = await prisma.asset.findUnique({
            where: { id: assetId }
        });
        if (!asset) {
            throw new Error('Asset not found');
        }
        // Get current workflow step from asset
        const workflowState = asset.workflowState;
        const currentStep = workflowState?.currentStepId || 'initial_contact';
        // Get recommendations
        const recommendations = await this.getRecommendations({
            assetId,
            workflowStep: currentStep,
            institution: asset.institution
        });
        // Get attached document types
        const attachedDocs = await prisma.estateDocument.findMany({
            where: { id: { in: attachedDocumentIds } }
        });
        const attachedTypes = attachedDocs.map(d => d.documentType);
        // Find missing required documents
        const missing = recommendations.required
            .filter(r => !attachedTypes.includes(r.documentType))
            .map(r => r.documentType);
        const complete = missing.length === 0;
        const percentage = recommendations.completeness;
        return {
            complete,
            missing,
            percentage
        };
    }
}
