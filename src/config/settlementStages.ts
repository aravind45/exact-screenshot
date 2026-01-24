
export type SettlementTrack =
    | "PROBATE"
    | "SMALL_ESTATE"
    | "TRUST_BASED"
    | "NON_PROBATE"
    | "INTESTATE"
    | "ANCILLARY"
    | "INSOLVENT"
    | "SPECIAL";

export interface ProcessStage {
    id: string;
    title: string;
    description: string;
}

export const TRACK_STAGES: Record<SettlementTrack, ProcessStage[]> = {
    PROBATE: [
        { id: "petition", title: "Petition", description: "File petition and original Will with the court." },
        { id: "authority", title: "Authority", description: "Court issues Letters Testamentary to the Executor." },
        { id: "discovery", title: "Discovery", description: "Identify and inventory all estate assets and debts." },
        { id: "creditors", title: "Creditors", description: "Publish notice and handle valid creditor claims." },
        { id: "distribution", title: "Distribution", description: "Final court order and distribution to heirs." }
    ],
    SMALL_ESTATE: [
        { id: "valuation", title: "Valuation", description: "Confirm total estate value is below state threshold." },
        { id: "affidavit", title: "Affidavit", description: "Wait required period (e.g. 40 days) and sign Affidavit." },
        { id: "collection", title: "Collection", description: "Present Affidavit to banks and institutions." },
        { id: "debts", title: "Debts", description: "Pay funeral expenses and decedent's final bills." },
        { id: "final", title: "Final", description: "Distribute remaining funds to named successors." }
    ],
    TRUST_BASED: [
        { id: "acceptance", title: "Acceptance", description: "Successor Trustee signs Certificate of Trust." },
        { id: "notification", title: "Notice", description: "Send mandatory notices to all Trust beneficiaries." },
        { id: "inventory", title: "Inventory", description: "Identify assets specifically titled in the Trust." },
        { id: "expenses", title: "Expenses", description: "Pay Trust-related taxes and administration costs." },
        { id: "transfer", title: "Transfer", description: "Direct distribution per Trust terms without court." }
    ],
    NON_PROBATE: [
        { id: "id_beneficiaries", title: "ID Heirs", description: "Confirm primary and contingent beneficiaries." },
        { id: "claim_forms", title: "Claims", description: "Submit claim forms to Insurance / Retirement co's." },
        { id: "tax_check", title: "Tax Check", description: "Verify if RMDs or estate taxes are due." },
        { id: "pay_out", title: "Pay Out", description: "Direct deposit of funds to individual beneficiaries." }
    ],
    INTESTATE: [
        { id: "hierarchy", title: "Hierarchy", description: "Determine legal heirs via state intestacy laws." },
        { id: "admin_petition", title: "Petition", description: "Ask court to appoint 'Administrator' (no Will)." },
        { id: "bond", title: "Bond", description: "Court may require a surety bond to protect heirs." },
        { id: "clearance", title: "Clearance", description: "Resolve disputes over family inheritance priority." },
        { id: "statutory", title: "Statutory", description: "Distribute according to state percentage rules." }
    ],
    ANCILLARY: [
        { id: "domiciliary", title: "Domiciliary", description: "Complete primary probate in decedent's home state." },
        { id: "local_filing", title: "Local Filing", description: "File 'Foreign Will' in state where property exists." },
        { id: "local_rep", title: "Local Rep", description: "Appoint representative for out-of-state property." },
        { id: "sale_transfer", title: "Sale/Move", description: "Sell or transfer the out-of-state real property." }
    ],
    INSOLVENT: [
        { id: "freeze", title: "Freeze", description: "Stop all payments until priority is established." },
        { id: "categorize", title: "Priority", description: "Sort debts into statutory classes (Taxes vs Medical)." },
        { id: "exhaustion", title: "Exhaust", description: "Liquidate all assets to maximize creditor pool." },
        { id: "pro_rata", title: "Pro-Rata", description: "Pay creditors percentage share based on priority." }
    ],
    SPECIAL: [
        { id: "triage", title: "Triage", description: "Define the specific complex legal challenge." },
        { id: "litigation", title: "Litigation", description: "Coordinate with specialized legal counsel." },
        { id: "stay", title: "Hold", description: "Estate assets may be frozen during the contest." },
        { id: "settlement", title: "Mediation", description: "Reach legally binding agreement or judgment." }
    ]
};
