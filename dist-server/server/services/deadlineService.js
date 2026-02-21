import { prisma } from '../db.js';
// Statutory deadline definitions for each state
const STATUTORY_DEADLINES = {
    // California
    'CA': [
        {
            id: 'CREDITOR_NOTICE_DEADLINE',
            title: 'Creditor Notice Publication Deadline',
            description: 'Publish notice to creditors in local newspaper',
            daysFromAnchor: 30,
            anchorDateField: 'filingDate',
            isStatutory: true
        },
        {
            id: 'CREDITOR_CLAIM_PERIOD_END',
            title: 'Creditor Claim Period End',
            description: 'Creditors have 4 months from notice publication to file claims',
            daysFromAnchor: 120,
            anchorDateField: 'noticePublishedDate',
            isStatutory: true
        },
        {
            id: 'INVENTORY_DUE_DATE',
            title: 'Inventory and Appraisement Due',
            description: 'File inventory of estate assets with court',
            daysFromAnchor: 90,
            anchorDateField: 'letterIssuedDate',
            isStatutory: true
        },
        {
            id: 'FEDERAL_ESTATE_TAX_RETURN',
            title: 'Federal Estate Tax Return Due',
            description: 'File Form 706 if estate exceeds federal exemption',
            daysFromAnchor: 270,
            anchorDateField: 'dateOfDeath',
            isStatutory: true
        },
        {
            id: 'CALIFORNIA_ESTATE_TAX_RETURN',
            title: 'California Estate Tax Return Due',
            description: 'File California estate tax return if applicable',
            daysFromAnchor: 90,
            anchorDateField: 'dateOfDeath',
            isStatutory: true
        }
    ],
    // Texas
    'TX': [
        {
            id: 'CREDITOR_NOTICE_DEADLINE',
            title: 'Creditor Notice Publication Deadline',
            description: 'Publish notice to creditors in local newspaper',
            daysFromAnchor: 30,
            anchorDateField: 'filingDate',
            isStatutory: true
        },
        {
            id: 'CREDITOR_CLAIM_PERIOD_END',
            title: 'Creditor Claim Period End',
            description: 'Creditors have 90 days from notice publication to file claims',
            daysFromAnchor: 90,
            anchorDateField: 'noticePublishedDate',
            isStatutory: true
        },
        {
            id: 'INVENTORY_DUE_DATE',
            title: 'Inventory Due',
            description: 'File inventory of estate assets with court',
            daysFromAnchor: 90,
            anchorDateField: 'letterIssuedDate',
            isStatutory: true
        },
        {
            id: 'FEDERAL_ESTATE_TAX_RETURN',
            title: 'Federal Estate Tax Return Due',
            description: 'File Form 706 if estate exceeds federal exemption',
            daysFromAnchor: 270,
            anchorDateField: 'dateOfDeath',
            isStatutory: true
        }
    ],
    // Florida
    'FL': [
        {
            id: 'CREDITOR_NOTICE_DEADLINE',
            title: 'Creditor Notice Publication Deadline',
            description: 'Publish notice to creditors in local newspaper',
            daysFromAnchor: 30,
            anchorDateField: 'filingDate',
            isStatutory: true
        },
        {
            id: 'CREDITOR_CLAIM_PERIOD_END',
            title: 'Creditor Claim Period End',
            description: 'Creditors have 3 months from notice publication to file claims',
            daysFromAnchor: 90,
            anchorDateField: 'noticePublishedDate',
            isStatutory: true
        },
        {
            id: 'INVENTORY_DUE_DATE',
            title: 'Inventory Due',
            description: 'File inventory of estate assets with court',
            daysFromAnchor: 60,
            anchorDateField: 'letterIssuedDate',
            isStatutory: true
        },
        {
            id: 'FEDERAL_ESTATE_TAX_RETURN',
            title: 'Federal Estate Tax Return Due',
            description: 'File Form 706 if estate exceeds federal exemption',
            daysFromAnchor: 270,
            anchorDateField: 'dateOfDeath',
            isStatutory: true
        }
    ],
    // New York
    'NY': [
        {
            id: 'CREDITOR_NOTICE_DEADLINE',
            title: 'Creditor Notice Publication Deadline',
            description: 'Publish notice to creditors in local newspaper',
            daysFromAnchor: 30,
            anchorDateField: 'filingDate',
            isStatutory: true
        },
        {
            id: 'CREDITOR_CLAIM_PERIOD_END',
            title: 'Creditor Claim Period End',
            description: 'Creditors have 7 months from notice publication to file claims',
            daysFromAnchor: 210,
            anchorDateField: 'noticePublishedDate',
            isStatutory: true
        },
        {
            id: 'INVENTORY_DUE_DATE',
            title: 'Inventory Due',
            description: 'File inventory of estate assets with court',
            daysFromAnchor: 180,
            anchorDateField: 'letterIssuedDate',
            isStatutory: true
        },
        {
            id: 'FEDERAL_ESTATE_TAX_RETURN',
            title: 'Federal Estate Tax Return Due',
            description: 'File Form 706 if estate exceeds federal exemption',
            daysFromAnchor: 270,
            anchorDateField: 'dateOfDeath',
            isStatutory: true
        },
        {
            id: 'NEW_YORK_ESTATE_TAX_RETURN',
            title: 'New York Estate Tax Return Due',
            description: 'File New York estate tax return if applicable',
            daysFromAnchor: 270,
            anchorDateField: 'dateOfDeath',
            isStatutory: true
        }
    ]
};
// Generic deadlines for states not specifically defined
const GENERIC_DEADLINES = [
    {
        id: 'CREDITOR_NOTICE_DEADLINE',
        title: 'Creditor Notice Publication Deadline',
        description: 'Publish notice to creditors in local newspaper',
        daysFromAnchor: 30,
        anchorDateField: 'filingDate',
        isStatutory: true
    },
    {
        id: 'CREDITOR_CLAIM_PERIOD_END',
        title: 'Creditor Claim Period End',
        description: 'Creditors have 4 months from notice publication to file claims',
        daysFromAnchor: 120,
        anchorDateField: 'noticePublishedDate',
        isStatutory: true
    },
    {
        id: 'INVENTORY_DUE_DATE',
        title: 'Inventory Due',
        description: 'File inventory of estate assets with court',
        daysFromAnchor: 90,
        anchorDateField: 'letterIssuedDate',
        isStatutory: true
    },
    {
        id: 'FEDERAL_ESTATE_TAX_RETURN',
        title: 'Federal Estate Tax Return Due',
        description: 'File Form 706 if estate exceeds federal exemption',
        daysFromAnchor: 270,
        anchorDateField: 'dateOfDeath',
        isStatutory: true
    }
];
export class DeadlineService {
    /**
     * Generate statutory deadlines for an estate based on state rules and anchor dates
     */
    async generateDeadlines(estateId) {
        const estate = await prisma.estate.findUnique({
            where: { id: estateId }
        });
        if (!estate) {
            throw new Error('Estate not found');
        }
        const state = estate.deceasedState || 'CA';
        const deadlines = await this.computeDeadlines(estate, state);
        // Delete existing deadlines for this estate
        await prisma.deadline.deleteMany({
            where: { estateId }
        });
        // Create new deadlines
        const createdDeadlines = await prisma.deadline.createMany({
            data: deadlines.map(d => ({
                estateId: estateId,
                warningId: d.warningId,
                title: d.title,
                description: d.description,
                dueDate: d.dueDate,
                isStatutory: d.isStatutory,
                isCompleted: false
            }))
        });
        // Return the created deadlines
        return prisma.deadline.findMany({
            where: { estateId }
        });
    }
    /**
     * Compute deadlines based on estate data and state rules
     */
    computeDeadlines(estate, state) {
        const stateDeadlines = STATUTORY_DEADLINES[state] || GENERIC_DEADLINES;
        const computedDeadlines = [];
        for (const deadlineDef of stateDeadlines) {
            const anchorDate = this.getAnchorDate(estate, deadlineDef.anchorDateField);
            if (anchorDate) {
                const dueDate = new Date(anchorDate);
                dueDate.setDate(dueDate.getDate() + deadlineDef.daysFromAnchor);
                computedDeadlines.push({
                    warningId: deadlineDef.id,
                    title: deadlineDef.title,
                    description: deadlineDef.description,
                    dueDate,
                    isStatutory: deadlineDef.isStatutory
                });
            }
        }
        return computedDeadlines;
    }
    /**
     * Get the appropriate anchor date for deadline calculation
     */
    getAnchorDate(estate, anchorField) {
        switch (anchorField) {
            case 'filingDate':
                return estate.createdAt || null;
            case 'letterIssuedDate':
                return estate.authorityEffectiveDate || null;
            case 'noticePublishedDate':
                return estate.hearingDate || null;
            case 'dateOfDeath':
                return estate.deceasedDateOfDeath || null;
            default:
                return null;
        }
    }
    /**
     * Get all deadlines for an estate
     */
    async getDeadlines(estateId) {
        return prisma.deadline.findMany({
            where: { estateId },
            orderBy: { dueDate: 'asc' }
        });
    }
    /**
     * Get upcoming deadlines (within next 30 days)
     */
    async getUpcomingDeadlines(estateId) {
        const now = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(now.getDate() + 30);
        return prisma.deadline.findMany({
            where: {
                estateId,
                dueDate: {
                    gte: now,
                    lte: thirtyDaysFromNow
                },
                isCompleted: false
            },
            orderBy: { dueDate: 'asc' }
        });
    }
    /**
     * Mark a deadline as completed
     */
    async markCompleted(deadlineId) {
        return prisma.deadline.update({
            where: { id: deadlineId },
            data: { isCompleted: true, updatedAt: new Date() }
        });
    }
    /**
     * Mark a deadline as incomplete
     */
    async markIncomplete(deadlineId) {
        return prisma.deadline.update({
            where: { id: deadlineId },
            data: { isCompleted: false, updatedAt: new Date() }
        });
    }
    /**
     * Update deadline due date
     */
    async updateDeadline(deadlineId, dueDate) {
        return prisma.deadline.update({
            where: { id: deadlineId },
            data: { dueDate, updatedAt: new Date() }
        });
    }
    /**
     * Get deadline by ID
     */
    async getDeadline(deadlineId) {
        return prisma.deadline.findUnique({
            where: { id: deadlineId }
        });
    }
    /**
     * Get overdue deadlines
     */
    async getOverdueDeadlines(estateId) {
        const now = new Date();
        return prisma.deadline.findMany({
            where: {
                estateId,
                dueDate: {
                    lt: now
                },
                isCompleted: false
            },
            orderBy: { dueDate: 'asc' }
        });
    }
}
