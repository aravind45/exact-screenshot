
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
    tasks?: { id: string; title: string, status?: 'pending' | 'completed' }[];
}

export const TRACK_STAGES: Record<SettlementTrack, ProcessStage[]> = {
    PROBATE: [
        {
            id: "petition", title: "Petition", description: "File petition and original Will with the court.",
            tasks: [
                { id: "file_petition", title: "File Petition (DE-111)" },
                { id: "lodge_will", title: "Lodge Original Will" },
                { id: "publish_notice", title: "Publish Notice in Newspaper" },
                { id: "mail_notice", title: "Mail Notice to Heirs" }
            ]
        },
        {
            id: "authority", title: "Authority", description: "Court issues Letters Testamentary to the Executor.",
            tasks: [
                { id: "attend_hearing", title: "Attend Probate Hearing" },
                { id: "bond", title: "File Bond (if required)" },
                { id: "letters", title: "Obtain Certified Letters" },
                { id: "ein", title: "Obtain EIN for Estate" }
            ]
        },
        {
            id: "discovery", title: "Discovery", description: "Identify and inventory all estate assets and debts.",
            tasks: [
                { id: "notify_banks", title: "Notify Financial Institutions" },
                { id: "inventory_assets", title: "Inventory All Assets" },
                { id: "appraisal", title: "Get Referee Appraisal" },
                { id: "file_inventory", title: "File Inventory & Appraisal (DE-160)" }
            ]
        },
        {
            id: "creditors", title: "Creditors", description: "Publish notice and handle valid creditor claims.",
            tasks: [
                { id: "notify_creditors", title: "Send Notice to Creditors" },
                { id: "review_claims", title: "Review & Approve/Reject Claims" },
                { id: "pay_debts", title: "Pay Valid Debts" },
                { id: "tax_returns", title: "File Final Tax Returns" }
            ]
        },
        {
            id: "distribution", title: "Distribution", description: "Final court order and distribution to heirs.",
            tasks: [
                { id: "final_petition", title: "File Final Petition" },
                { id: "court_order", title: "Obtain Order for Distribution" },
                { id: "distribute", title: "Distribute Assets to Heirs" },
                { id: "discharge", title: "File Receipt & Discharge" }
            ]
        }
    ],
    SMALL_ESTATE: [
        {
            id: "valuation", title: "Valuation", description: "Confirm total estate value is below state threshold.",
            tasks: [
                { id: "list_assets", title: "List All Assets" },
                { id: "appraise_real_property", title: "Appraise Real Property" },
                { id: "check_limit", title: "Verify Total < $184,500" }
            ]
        },
        {
            id: "affidavit", title: "Affidavit", description: "Wait required period (e.g. 40 days) and sign Affidavit.",
            tasks: [
                { id: "prepare_affidavit", title: "Prepare 13100 Affidavit" },
                { id: "notarize", title: "Sign & Notarize" },
                { id: "attach_docs", title: "Attach Death Certificate" }
            ]
        },
        {
            id: "collection", title: "Collection", description: "Present Affidavit to banks and institutions.",
            tasks: [
                { id: "present_bank", title: "Present to Banks" },
                { id: "record_deed", title: "Record Deed (if Real Estate)" },
                { id: "collect_funds", title: "Collect Funds into Estate Account" }
            ]
        },
        {
            id: "debts", title: "Debts", description: "Pay funeral expenses and decedent's final bills.",
            tasks: [
                { id: "pay_funeral", title: "Pay Funeral Expenses" },
                { id: "pay_medial", title: "Pay Last Illness Expenses" },
                { id: "pay_other", title: "Pay Other Debts" }
            ]
        },
        {
            id: "final", title: "Final", description: "Distribute remaining funds to named successors.",
            tasks: [
                { id: "calc_shares", title: "Calculate Heir Shares" },
                { id: "distribute_funds", title: "Write Distribution Checks" },
                { id: "close_account", title: "Close Estate Account" }
            ]
        }
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
