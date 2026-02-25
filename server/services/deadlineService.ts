import { prisma } from '../db.js';
import type { Estate } from '@prisma/client';

export interface Deadline {
    id: string;
    estateId: string;
    warningId: string;
    title: string;
    description: string;
    dueDate: Date;
    isStatutory: boolean;
    isCompleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface DeadlineWarning {
    id: string;
    title: string;
    description: string;
    daysFromAnchor: number;
    anchorDateField: 'filingDate' | 'letterIssuedDate' | 'noticePublishedDate' | 'dateOfDeath';
    isStatutory: boolean;
    priority?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

// ─────────────────────────────────────────────────────────────────────────────
// 50-STATE RULES TABLE
// creditorClaimDays: days from notice publication for creditors to file claims
// inventoryDays:    days from letters issued for inventory to be filed
// hasStateTax:      whether state imposes a separate estate/inheritance tax
// ─────────────────────────────────────────────────────────────────────────────
interface StateRule {
    creditorClaimDays: number;
    inventoryDays: number;
    hasStateTax: boolean;
    // CA-specific: creditor claim period uses max(4 months after Letters, 60 days after notice)
    creditorClaimFromLettersDays?: number;
    creditorClaimFromNoticeDays?: number;
}

const STATE_RULES: Record<string, StateRule> = {
    AL: { creditorClaimDays: 180, inventoryDays: 90,  hasStateTax: false },
    AK: { creditorClaimDays: 120, inventoryDays: 90,  hasStateTax: false },
    AZ: { creditorClaimDays: 120, inventoryDays: 90,  hasStateTax: false },
    AR: { creditorClaimDays: 180, inventoryDays: 90,  hasStateTax: false },
    CA: {
        creditorClaimDays: 120, // Legacy field - CA uses MAX(4 months after Letters, 60 days after notice)
        inventoryDays: 120,
        hasStateTax: false,
        // CA Probate Code §9154: Creditor claim period is LATER of:
        // - 4 months after Letters issued (120 days), OR
        // - 60 days after notice mailed/published
        creditorClaimFromLettersDays: 120,
        creditorClaimFromNoticeDays: 60,
    },
    CO: { creditorClaimDays: 120, inventoryDays: 90,  hasStateTax: false },
    CT: { creditorClaimDays: 150, inventoryDays: 90,  hasStateTax: true  },
    DE: { creditorClaimDays: 240, inventoryDays: 90,  hasStateTax: false },
    FL: { creditorClaimDays: 90,  inventoryDays: 60,  hasStateTax: false },
    GA: { creditorClaimDays: 90,  inventoryDays: 90,  hasStateTax: false },
    HI: { creditorClaimDays: 120, inventoryDays: 90,  hasStateTax: true  },
    ID: { creditorClaimDays: 120, inventoryDays: 90,  hasStateTax: false },
    IL: { creditorClaimDays: 180, inventoryDays: 90,  hasStateTax: true  },
    IN: { creditorClaimDays: 90,  inventoryDays: 90,  hasStateTax: false },
    IA: { creditorClaimDays: 120, inventoryDays: 90,  hasStateTax: false },
    KS: { creditorClaimDays: 180, inventoryDays: 90,  hasStateTax: false },
    KY: { creditorClaimDays: 180, inventoryDays: 90,  hasStateTax: false },
    LA: { creditorClaimDays: 90,  inventoryDays: 90,  hasStateTax: false },
    ME: { creditorClaimDays: 120, inventoryDays: 90,  hasStateTax: true  },
    MD: { creditorClaimDays: 180, inventoryDays: 90,  hasStateTax: true  },
    MA: { creditorClaimDays: 365, inventoryDays: 90,  hasStateTax: true  },
    MI: { creditorClaimDays: 120, inventoryDays: 90,  hasStateTax: false },
    MN: { creditorClaimDays: 120, inventoryDays: 90,  hasStateTax: true  },
    MS: { creditorClaimDays: 90,  inventoryDays: 90,  hasStateTax: false },
    MO: { creditorClaimDays: 180, inventoryDays: 90,  hasStateTax: false },
    MT: { creditorClaimDays: 120, inventoryDays: 90,  hasStateTax: false },
    NE: { creditorClaimDays: 60,  inventoryDays: 90,  hasStateTax: false },
    NV: { creditorClaimDays: 90,  inventoryDays: 90,  hasStateTax: false },
    NH: { creditorClaimDays: 180, inventoryDays: 90,  hasStateTax: false },
    NJ: { creditorClaimDays: 180, inventoryDays: 90,  hasStateTax: false },
    NM: { creditorClaimDays: 120, inventoryDays: 90,  hasStateTax: false },
    NY: { creditorClaimDays: 210, inventoryDays: 180, hasStateTax: true  },
    NC: { creditorClaimDays: 90,  inventoryDays: 90,  hasStateTax: false },
    ND: { creditorClaimDays: 120, inventoryDays: 90,  hasStateTax: false },
    OH: { creditorClaimDays: 180, inventoryDays: 90,  hasStateTax: false },
    OK: { creditorClaimDays: 60,  inventoryDays: 90,  hasStateTax: false },
    OR: { creditorClaimDays: 120, inventoryDays: 90,  hasStateTax: true  },
    PA: { creditorClaimDays: 365, inventoryDays: 90,  hasStateTax: false },
    RI: { creditorClaimDays: 180, inventoryDays: 90,  hasStateTax: true  },
    SC: { creditorClaimDays: 240, inventoryDays: 90,  hasStateTax: false },
    SD: { creditorClaimDays: 120, inventoryDays: 90,  hasStateTax: false },
    TN: { creditorClaimDays: 120, inventoryDays: 90,  hasStateTax: false },
    TX: { creditorClaimDays: 90,  inventoryDays: 90,  hasStateTax: false },
    UT: { creditorClaimDays: 120, inventoryDays: 90,  hasStateTax: false },
    VT: { creditorClaimDays: 120, inventoryDays: 90,  hasStateTax: true  },
    VA: { creditorClaimDays: 180, inventoryDays: 90,  hasStateTax: false },
    WA: { creditorClaimDays: 120, inventoryDays: 90,  hasStateTax: true  },
    WV: { creditorClaimDays: 60,  inventoryDays: 90,  hasStateTax: false },
    WI: { creditorClaimDays: 120, inventoryDays: 90,  hasStateTax: false },
    WY: { creditorClaimDays: 90,  inventoryDays: 90,  hasStateTax: false },
    DC: { creditorClaimDays: 180, inventoryDays: 90,  hasStateTax: true  },
};

// Fallback if state not found (uses CA values)
const DEFAULT_STATE_RULE: StateRule = { creditorClaimDays: 120, inventoryDays: 90, hasStateTax: false };

// ─────────────────────────────────────────────────────────────────────────────
// PATH TYPES (mirrors authorityType values set by pathEngine / authorityEngine)
// ─────────────────────────────────────────────────────────────────────────────
const TRUST_PATHS = new Set([
    'TRUST_ADMIN_REVOCABLE',
    'TRUST_ADMIN_IRREVOCABLE',
]);

const PROBATE_PATHS = new Set([
    'FORMAL_PROBATE',
    'INFORMAL_PROBATE',
    'INTESTATE',
    'SMALL_ESTATE',
    'SUMMARY_ADMINISTRATION',
    'MUNIMENT_OF_TITLE',
    'SPOUSAL_PETITION',
    'INSOLVENT_ESTATE',
    'ANCILLARY_PROBATE',
    'CONTESTED_ESTATE',
]);

export class DeadlineService {
    /**
     * Generate statutory deadlines for an estate based on state rules and path type
     */
    async generateDeadlines(estateId: string): Promise<Deadline[]> {
        const estate = await prisma.estate.findUnique({
            where: { id: estateId }
        });

        if (!estate) {
            throw new Error('Estate not found');
        }

        const state = (estate.deceasedState || '').toUpperCase();
        const deadlineData = this.computeDeadlines(estate, state);

        // Replace existing deadlines for this estate
        await prisma.deadline.deleteMany({ where: { estateId } });

        await prisma.deadline.createMany({
            data: deadlineData.map(d => ({
                estateId,
                warningId: d.warningId,
                title: d.title,
                description: d.description,
                dueDate: d.dueDate,
                isStatutory: d.isStatutory,
                isCompleted: false,
            }))
        });

        return prisma.deadline.findMany({
            where: { estateId },
            orderBy: { dueDate: 'asc' }
        });
    }

    /**
     * Compute deadlines based on estate path type and state rules.
     *
     * KEY RULES:
     *  - Trust paths → NO court creditor publication; trustee notice to beneficiaries instead
     *  - Insolvent estates → creditor deadlines marked CRITICAL; tax clearance required
     *  - Ancillary probate → secondary-state filing deadline added
     *  - Contested estates → will contest response deadline added
     *  - All probate paths → state-accurate creditor claim period + inventory
     *  - States with estate tax → state estate tax return deadline added
     */
    private computeDeadlines(
        estate: Estate,
        state: string
    ): Array<{
        warningId: string;
        title: string;
        description: string;
        dueDate: Date;
        isStatutory: boolean;
    }> {
        const rules = STATE_RULES[state] || DEFAULT_STATE_RULE;
        const pathType = (estate.authorityType || 'FORMAL_PROBATE') as string;

        const isTrust     = TRUST_PATHS.has(pathType);
        const isInsolvent = pathType === 'INSOLVENT_ESTATE';
        const isAncillary = pathType === 'ANCILLARY_PROBATE';
        const isContested = pathType === 'CONTESTED_ESTATE';

        const result: Array<{
            warningId: string;
            title: string;
            description: string;
            dueDate: Date;
            isStatutory: boolean;
        }> = [];

        // Helper: push a deadline only when anchor date is available
        const push = (
            warningId: string,
            title: string,
            description: string,
            daysFromAnchor: number,
            anchorField: 'filingDate' | 'letterIssuedDate' | 'noticePublishedDate' | 'dateOfDeath',
            isStatutory = true
        ) => {
            const anchor = this.getAnchorDate(estate, anchorField);
            if (!anchor) return; // skip if anchor date not yet recorded
            const dueDate = new Date(anchor);
            dueDate.setDate(dueDate.getDate() + daysFromAnchor);
            result.push({ warningId, title, description, dueDate, isStatutory });
        };

        // ── TRUST PATHS ─────────────────────────────────────────────────────
        if (isTrust) {
            const isIrrevocable = pathType === 'TRUST_ADMIN_IRREVOCABLE';

            push(
                'TRUSTEE_NOTICE_BENEFICIARIES',
                '⚠️ Trustee Notice to Beneficiaries Required',
                'Notify all trust beneficiaries and heirs of your role as successor trustee, the existence of the trust, and their right to request a copy. Required by statute (e.g., CA Prob. Code §16061.7 = 60 days; most states 30–90 days).',
                60, 'dateOfDeath'
            );

            push(
                'TRUST_ACCOUNTING_DUE',
                'Trust Accounting to Beneficiaries',
                'Provide a detailed accounting of all trust assets, income, expenses, and distributions to beneficiaries. Required annually and upon trust termination.',
                365, 'dateOfDeath'
            );

            push(
                'TRUST_TAX_RETURN',
                'Trust Income Tax Return (Form 1041) Due',
                'File federal fiduciary income tax return (Form 1041) for the trust. Due by April 15 of the year following death, or 9 months from date of death — whichever comes first.',
                270, 'dateOfDeath'
            );

            if (isIrrevocable) {
                push(
                    'IRREVOCABLE_TRUST_EIN',
                    'Obtain Trust EIN from IRS',
                    'An irrevocable trust requires its own Employer Identification Number (EIN) immediately upon the grantor\'s death. Apply online at IRS.gov — typically same-day issuance.',
                    7, 'dateOfDeath'
                );
            }

            push(
                'FEDERAL_ESTATE_TAX_RETURN',
                'Federal Estate Tax Return (Form 706) Due',
                'File Form 706 if gross estate exceeds federal exemption (~$13.61M for 2024). Due 9 months from date of death; 6-month extension available.',
                270, 'dateOfDeath'
            );

            if (rules.hasStateTax) {
                push(
                    'STATE_ESTATE_TAX_RETURN',
                    `${state} State Estate Tax Return Due`,
                    `File ${state} state estate tax return. State exemptions are often lower than federal. Consult a CPA familiar with ${state} estate tax rules.`,
                    270, 'dateOfDeath'
                );
            }

        // ── ALL OTHER (PROBATE) PATHS ────────────────────────────────────────
        } else {
            // 1. Creditor notice publication
            push(
                'CREDITOR_NOTICE_PUBLICATION',
                isInsolvent
                    ? '⚠️ CRITICAL: Publish Notice to Creditors (Insolvent Estate)'
                    : 'Publish Notice to Creditors',
                isInsolvent
                    ? `INSOLVENT ESTATE — Publishing creditor notice is mandatory and time-sensitive. Creditors must be given ${rules.creditorClaimDays} days to file claims. DO NOT make any distribution to heirs until ALL creditors are paid in statutory priority order.`
                    : 'Publish notice to creditors in a newspaper of general circulation in the county. Required within 30 days of appointment as personal representative.',
                30, 'filingDate'
            );

            // 2. Creditor claim period end
            // CA-SPECIFIC: Probate Code §9154 uses MAX(4 months after Letters, 60 days after notice)
            const caCreditorDescription = state === 'CA' && rules.creditorClaimFromLettersDays && rules.creditorClaimFromNoticeDays
                ? `CA Probate Code §9154: Creditor claim period ends on the LATER of: (1) ${rules.creditorClaimFromLettersDays} days after Letters issued, OR (2) ${rules.creditorClaimFromNoticeDays} days after notice mailed/published. The claim period is calculated as whichever date occurs later.`
                : `Creditors have ${rules.creditorClaimDays} days from the date of notice publication to file claims against the estate. After this period, most untimely claims are barred.`;

            push(
                'CREDITOR_CLAIM_PERIOD_END',
                isInsolvent
                    ? `⚠️ CRITICAL: Creditor Claim Period End — ${rules.creditorClaimDays} Days (${state})`
                    : `Creditor Claim Period End — ${rules.creditorClaimDays} Days (${state})`,
                isInsolvent
                    ? `Creditors have ${rules.creditorClaimDays} days from notice publication to file claims. This estate is INSOLVENT — you must pay creditors in statutory priority order before distributing ANY assets to heirs. Violation may result in personal liability for the executor.`
                    : caCreditorDescription,
                rules.creditorClaimDays, 'noticePublishedDate'
            );

            // 3. Inventory due
            push(
                'INVENTORY_DUE',
                'Inventory and Appraisement Due',
                `File a complete inventory of estate assets with the probate court within ${rules.inventoryDays} days of receiving Letters Testamentary/Administration. Include all real and personal property, with appraised values.`,
                rules.inventoryDays, 'letterIssuedDate'
            );

            // 4. Federal estate tax
            push(
                'FEDERAL_ESTATE_TAX_RETURN',
                'Federal Estate Tax Return (Form 706) Due',
                'File Form 706 if gross estate exceeds the federal exemption (~$13.61M for 2024). Due 9 months from date of death; automatic 6-month extension available with Form 4768.',
                270, 'dateOfDeath'
            );

            // 5. State estate tax (only for applicable states)
            if (rules.hasStateTax) {
                push(
                    'STATE_ESTATE_TAX_RETURN',
                    `${state} State Estate Tax Return Due`,
                    `File ${state} state estate tax return. Note: ${state}'s estate tax exemption is lower than the federal exemption — many mid-size estates owe state tax but not federal tax. Consult a local estate tax attorney.`,
                    270, 'dateOfDeath'
                );
            }

            // ── INSOLVENT-SPECIFIC ─────────────────────────────────────────
            if (isInsolvent) {
                push(
                    'INSOLVENT_TAX_CLEARANCE',
                    '⚠️ CRITICAL: Obtain Tax Clearance Before Any Distribution',
                    'Federal and state tax obligations are FIRST-PRIORITY debts in an insolvent estate. Obtain IRS tax clearance (estate closing letter or transcript) and any required state tax clearance BEFORE making any payments to unsecured creditors or heirs. Failure to do so may result in executor personal liability.',
                    rules.creditorClaimDays + 30, 'noticePublishedDate'
                );

                push(
                    'INSOLVENT_CREDITOR_PRIORITY',
                    '⚠️ CRITICAL: Pay Creditors in Statutory Priority Order',
                    'Insolvent estate — assets must be distributed in this statutory order: (1) Funeral and administration expenses, (2) Federal taxes, (3) State taxes, (4) Secured creditors, (5) Unsecured creditors. Heirs receive NOTHING until all creditors are satisfied. Document every payment.',
                    rules.creditorClaimDays + 45, 'noticePublishedDate'
                );
            }

            // ── ANCILLARY-SPECIFIC ─────────────────────────────────────────
            if (isAncillary) {
                push(
                    'ANCILLARY_PROBATE_FILING',
                    'File Ancillary Probate in Secondary State',
                    'Out-of-state real property cannot be transferred using Letters from the primary state. File an ancillary (auxiliary) probate proceeding in the state where the out-of-state property is located. File within 60–90 days of receiving primary Letters to avoid delays.',
                    90, 'letterIssuedDate'
                );

                push(
                    'ANCILLARY_CREDITOR_NOTICE',
                    'Secondary State: Publish Creditor Notice',
                    'After ancillary letters are issued, publish notice to creditors in the secondary state as required by that state\'s law. Creditor claim periods vary by state.',
                    120, 'letterIssuedDate'
                );

                push(
                    'ANCILLARY_INVENTORY',
                    'Secondary State: File Ancillary Inventory',
                    'File an inventory of the out-of-state assets with the ancillary probate court within the time required by that state (typically 60–90 days after ancillary letters).',
                    150, 'letterIssuedDate'
                );
            }

            // ── CONTESTED-SPECIFIC ─────────────────────────────────────────
            if (isContested) {
                push(
                    'CONTEST_RESPONSE_DEADLINE',
                    '⚠️ CRITICAL: Respond to Will Contest — 30 Days',
                    'A will contest has been filed. You must file a formal written response with the probate court, typically within 30 days. ENGAGE A PROBATE LITIGATION ATTORNEY IMMEDIATELY. All asset distributions are SUSPENDED until the contest is fully resolved by the court.',
                    30, 'filingDate'
                );

                push(
                    'CONTEST_DISCOVERY_PERIOD',
                    'Will Contest: Discovery Period',
                    'The court will set a discovery period (typically 120–180 days) during which both sides exchange evidence, take depositions, and prepare for hearing. No distributions may occur during this period.',
                    120, 'filingDate'
                );
            }
        }

        return result;
    }

    /**
     * Map anchor field names to estate date fields
     */
    private getAnchorDate(estate: Estate, anchorField: string): Date | null {
        switch (anchorField) {
            case 'filingDate':
                // Use court filing date if stored, otherwise fall back to estate creation date
                return (estate as any).courtFilingDate || estate.createdAt || null;
            case 'letterIssuedDate':
                return estate.authorityEffectiveDate || null;
            case 'noticePublishedDate':
                // Use hearing date as proxy for notice publication date
                return estate.hearingDate || null;
            case 'dateOfDeath':
                return estate.deceasedDateOfDeath || null;
            default:
                return null;
        }
    }

    // ── PUBLIC API METHODS (unchanged signatures) ────────────────────────────

    async getDeadlines(estateId: string): Promise<Deadline[]> {
        return prisma.deadline.findMany({
            where: { estateId },
            orderBy: { dueDate: 'asc' }
        });
    }

    async getUpcomingDeadlines(estateId: string): Promise<Deadline[]> {
        const now = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(now.getDate() + 30);

        return prisma.deadline.findMany({
            where: {
                estateId,
                dueDate: { gte: now, lte: thirtyDaysFromNow },
                isCompleted: false
            },
            orderBy: { dueDate: 'asc' }
        });
    }

    async markCompleted(deadlineId: string): Promise<Deadline> {
        return prisma.deadline.update({
            where: { id: deadlineId },
            data: { isCompleted: true, updatedAt: new Date() }
        });
    }

    async markIncomplete(deadlineId: string): Promise<Deadline> {
        return prisma.deadline.update({
            where: { id: deadlineId },
            data: { isCompleted: false, updatedAt: new Date() }
        });
    }

    async updateDeadline(deadlineId: string, dueDate: Date): Promise<Deadline> {
        return prisma.deadline.update({
            where: { id: deadlineId },
            data: { dueDate, updatedAt: new Date() }
        });
    }

    async getDeadline(deadlineId: string): Promise<Deadline | null> {
        return prisma.deadline.findUnique({
            where: { id: deadlineId }
        });
    }

    async getOverdueDeadlines(estateId: string): Promise<Deadline[]> {
        const now = new Date();
        return prisma.deadline.findMany({
            where: {
                estateId,
                dueDate: { lt: now },
                isCompleted: false
            },
            orderBy: { dueDate: 'asc' }
        });
    }
}
