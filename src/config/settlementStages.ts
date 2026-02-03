export type SettlementTrack =
    | "FORMAL_PROBATE"
    | "INFORMAL_PROBATE"
    | "SMALL_ESTATE"
    | "TRUST_ADMIN"
    | "INTESTATE"
    | "JOINT_TRANSFER"
    | "POD_TOD_TRANSFER"
    | "SPOUSAL_PETITION"
    | "ANCILLARY_PROBATE"
    | "INSOLVENT"
    | "SPECIAL"
    | "DISCOVERY";

export interface ProcessStage {
    id: string;
    title: string;
    description: string;
    tasks?: { id: string; title: string, status?: 'pending' | 'completed' }[];
}

export const TRACK_STAGES: Record<SettlementTrack, ProcessStage[]> = {
    FORMAL_PROBATE: [
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
    TRUST_ADMIN: [
        { id: "acceptance", title: "Acceptance", description: "Successor Trustee signs Certificate of Trust." },
        { id: "notification", title: "Notice", description: "Send mandatory notices to all Trust beneficiaries." },
        { id: "inventory", title: "Inventory", description: "Identify assets specifically titled in the Trust." },
        { id: "expenses", title: "Expenses", description: "Pay Trust-related taxes and administration costs." },
        { id: "transfer", title: "Transfer", description: "Direct distribution per Trust terms without court." }
    ],
    JOINT_TRANSFER: [
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
    ANCILLARY_PROBATE: [
        { id: "domiciliary", title: "Domiciliary", description: "Complete primary probate in decedent's home state." },
        { id: "local_filing", title: "Local Filing", description: "File 'Foreign Will' in state where property exists." },
        { id: "local_rep", title: "Local Rep", description: "Appoint representative for out-of-state property." },
        { id: "sale_transfer", title: "Sale/Move", description: "Sell or transfer the out-of-state real property." }
    ],
    INFORMAL_PROBATE: [
        {
            id: "petition", title: "Petition", description: "Simplified court petition for uncontested estates.",
            tasks: [
                { id: "file_petition", title: "File Informal Petition" },
                { id: "appoint_rep", title: "Appoint Personal Rep" },
                { id: "notify_heirs", title: "Notify All Heirs" }
            ]
        },
        {
            id: "admin", title: "Admin", description: "Collect assets and pay debts without frequent hearings.",
            tasks: [
                { id: "inventory", title: "List All Assets" },
                { id: "pay_creditors", title: "Pay Debts" }
            ]
        },
        { id: "close", title: "Close", description: "Final accounting and distribution." }
    ],
    POD_TOD_TRANSFER: [
        { id: "id_accounts", title: "ID Accounts", description: "Locate accounts with designated beneficiaries." },
        { id: "claim_forms", title: "Claim Forms", description: "Submit POD/TOD claim packets to institutions." },
        { id: "transfer", title: "Transfer", description: "Direct transfer of funds to beneficiaries." }
    ],
    SPOUSAL_PETITION: [
        {
            id: "petition", title: "Petition", description: "File Spousal Property Petition (DE-221).",
            tasks: [
                { id: "prepare_de221", title: "Prepare DE-221" },
                { id: "file_court", title: "File with Local Court" }
            ]
        },
        { id: "hearing", title: "Hearing", description: "Attend hearing for Spousal Property Order." },
        { id: "transfer", title: "Transfer", description: "Transfer title to surviving spouse." }
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
    ],
    DISCOVERY: [
        {
            id: "initial_search", title: "Initial Search", description: "Review physical mail, records, and digital trails.",
            tasks: [
                { id: "review_mail", title: "Review Physical Mail (Last 3 Months)" },
                { id: "check_statements", title: "Check Bank & Credit Statements" },
                { id: "digital_sweep", title: "Sweep Emails & Digital Accounts" }
            ]
        },
        {
            id: "valuation_sweep", title: "Valuation Sweep", description: "Estimate total probate value across all identified accounts.",
            tasks: [
                { id: "list_individuals", title: "Identify Solely-Owned Assets" },
                { id: "check_thresholds", title: "Compare to State Small Estate Limits" }
            ]
        },
        {
            id: "heirship_search", title: "Heirship Search", description: "Identify legal heirs and find any original Will/Trust.",
            tasks: [
                { id: "locate_will", title: "Locate Original Will/Trust" },
                { id: "verify_heirs", title: "Verify Legal Heir Contact Info" }
            ]
        },
        {
            id: "select_track", title: "Track Selection", description: "Commit to the correct legal path based on findings.",
            tasks: [
                { id: "finalize_track", title: "Finalize Settlement Track" }
            ]
        }
    ]
};
// State-specific form names and deadlines
export const STATE_ROADMAP_OVERRIDES: Record<string, Partial<Record<SettlementTrack, ProcessStage[]>>> = {
    TX: {
        FORMAL_PROBATE: [
            {
                id: "petition", title: "Application", description: "File Application for Probate & Original Will.",
                tasks: [
                    { id: "file_app", title: "File Application for Probate" },
                    { id: "lodge_will", title: "Lodge Original Will" },
                    { id: "notice_posting", title: "Wait for Posting of Notice (10 days)" }
                ]
            },
            {
                id: "authority", title: "Independent Authority", description: "Court appoints Independent Executor.",
                tasks: [
                    { id: "attend_hearing", title: "Attend Hearing" },
                    { id: "oath", title: "Take Oath of Office" },
                    { id: "letters", title: "Get Letters Testamentary" },
                    { id: "ein", title: "Obtain EIN" }
                ]
            },
            {
                id: "creditors", title: "Notice to Creditors", description: "Publish notice and notify secured creditors.",
                tasks: [
                    { id: "publish_notice", title: "Publish Notice (within 30 days)" },
                    { id: "notify_secured", title: "Certified Mail to Secured Creditors" },
                    { id: "pay_debts", title: "Pay Valid Debts per Priority" }
                ]
            },
            {
                id: "inventory", title: "Inventory / Affidavit", description: "File inventory or Affidavit in Lieu.",
                tasks: [
                    { id: "prepare_inventory", title: "Prepare Asset Inventory" },
                    { id: "file_inventory", title: "File Inventory (within 90 days)" },
                    { id: "affidavit_lieu", title: "OR: File Affidavit in Lieu of Inventory" }
                ]
            },
            {
                id: "distribution", title: "Closing", description: "Independent distribution of estate assets.",
                tasks: [
                    { id: "distribute", title: "Distribute Assets" },
                    { id: "close_files", title: "Close Internal Files" }
                ]
            }
        ],
        SMALL_ESTATE: [
            {
                id: "qualification", title: "Qualification", description: "Verify estate is < $75,000 (excluding homestead).",
                tasks: [
                    { id: "asset_list", title: "List All Assets" },
                    { id: "id_homestead", title: "Identify Homestead Property" },
                    { id: "verify_limit", title: "Verify Total < $75,000" }
                ]
            },
            {
                id: "affidavit", title: "Affidavit & Order", description: "File SEA with court and obtain Judge's signature.",
                tasks: [
                    { id: "prepare_sea", title: "Prepare Small Estate Affidavit" },
                    { id: "heir_signatures", title: "Obtain All Heir Signatures" },
                    { id: "file_sea", title: "File SEA with Probate Court" },
                    { id: "obtain_order", title: "Obtain Signed Order from Judge" }
                ]
            },
            {
                id: "collection", title: "Collection", description: "Present the Signed Order to institutions.",
                tasks: [
                    { id: "present_order", title: "Present Signed Order to Banks" },
                    { id: "transfer_title", title: "Transfer Title to Heirs" }
                ]
            }
        ]
    },
    FL: {
        FORMAL_PROBATE: [
            {
                id: "petition", title: "Opening Estate", description: "File Will and Petition for Administration.",
                tasks: [
                    { id: "lodge_will", title: "Lodge Will (10-day deadline!)" },
                    { id: "file_petition", title: "File Petition for Administration" },
                    { id: "notice_beneficiaries", title: "Serve Formal Notice to Beneficiaries" }
                ]
            },
            {
                id: "authority", title: "Letters", description: "Court issues Letters of Administration.",
                tasks: [
                    { id: "oath", title: "Oath of Personal Representative" },
                    { id: "bond", title: "File Bond" },
                    { id: "letters", title: "Letters of Administration" }
                ]
            },
            {
                id: "creditors", title: "90-Day Creditors", description: "Notice to Creditors and 90-day claim window.",
                tasks: [
                    { id: "publish_notice", title: "Publish Notice to Creditors" },
                    { id: "search_creditors", title: "Diligent Search for Creditors" },
                    { id: "90_day_wait", title: "Wait 90 Days for Claims" },
                    { id: "pay_priorities", title: "Pay Class 1-8 Priority Claims" }
                ]
            },
            { id: "discovery", title: "Inventory", description: "Identify and inventory all probate assets.", tasks: [{ id: "file_inventory", title: "File Inventory" }] },
            { id: "distribution", title: "Final Distribution", description: "Closing petition and discharge.", tasks: [{ id: "discharge", title: "Final Discharge" }] }
        ],
        SMALL_ESTATE: [
            {
                id: "eligibility", title: "Eligibility", description: "Confirm assets < $75k or decedent dead > 2 years.",
                tasks: [
                    { id: "valuation", title: "Appraise All Assets" },
                    { id: "check_debts", title: "List All Known Debts" }
                ]
            },
            {
                id: "petition", title: "Petition for Summary", description: "File for Summary Administration with the court.",
                tasks: [
                    { id: "prepare_petition", title: "Prepare Petition for Summary Admin" },
                    { id: "file_petition", title: "File with Probate Court" }
                ]
            },
            {
                id: "authority", title: "Order of Summary", description: "Judge issues Order of Summary Administration.",
                tasks: [
                    { id: "obtain_order", title: "Obtain Certified Order" },
                    { id: "distribute", title: "Distribute Assets per Order" }
                ]
            }
        ]
    },
    NY: {
        FORMAL_PROBATE: [
            {
                id: "petition", title: "Probate Petition", description: "File Petition and original Will (SCPA).",
                tasks: [
                    { id: "file_petition", title: "File Petition for Probate" },
                    { id: "lodge_will", title: "Lodge Original Will" },
                    { id: "citations", title: "Issue Citations to Heirs" }
                ]
            },
            {
                id: "authority", title: "Letters", description: "Surrogate court issues Letters Testamentary.",
                tasks: [
                    { id: "oath", title: "Oath & Designation" },
                    { id: "letters", title: "Letters Testamentary" }
                ]
            },
            {
                id: "creditors", title: "Claims", description: "7-month period for generic claims.",
                tasks: [
                    { id: "7_month_window", title: "Wait 7 Months for Creditors" },
                    { id: "pay_debts", title: "Pay SCPA 1811 Priorities" }
                ]
            }
        ]
    }
};

export const getPrimaryAuthorityDocName = (stateCode: string, track: SettlementTrack): string => {
    switch (track) {
        case 'SMALL_ESTATE':
            if (stateCode === 'CA') return 'Affidavit (DE-310)';
            if (stateCode === 'TX') return 'Small Estate Affidavit';
            return 'Small Estate Affidavit';
        case 'TRUST_ADMIN':
            return 'Certification of Trust';
        case 'SPOUSAL_PETITION':
            if (stateCode === 'CA') return 'Spousal Property Order (DE-226)';
            return 'Spousal Property Order';
        case 'DISCOVERY':
            return 'Preliminary Asset Log';
        default:
            if (stateCode === 'FL') return 'Letters of Administration';
            if (stateCode === 'TX') return 'Letters Testamentary';
            if (stateCode === 'NY') return 'Letters Testamentary';
            if (stateCode === 'CA') return 'Letters Testamentary (DE-150)';
            return 'Letters Testamentary';
    }
};

export const getTrackStages = (track: SettlementTrack, stateCode: string = "CA"): ProcessStage[] => {
    return STATE_ROADMAP_OVERRIDES[stateCode]?.[track] || TRACK_STAGES[track] || [];
};
