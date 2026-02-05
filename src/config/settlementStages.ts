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
                { id: "check_limit", title: "Verify Total < Threshold" }
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
        {
            id: "acceptance", title: "Acceptance", description: "Successor Trustee signs Certificate of Trust.",
            tasks: [
                { id: "review_trust", title: "Review Original Trust Document" },
                { id: "sign_acceptance", title: "Sign Acceptance of Trusteeship" },
                { id: "prepare_cert", title: "Prepare Certificate of Trust" },
                { id: "notarize_cert", title: "Notarize Certificate" }
            ]
        },
        {
            id: "notification", title: "Notice", description: "Send mandatory notices to all Trust beneficiaries.",
            tasks: [
                { id: "identify_beneficiaries", title: "Identify All Beneficiaries" },
                { id: "prepare_notice", title: "Prepare Notice (Probate Code §16061.7)" },
                { id: "send_certified", title: "Send via Certified Mail" },
                { id: "wait_120_days", title: "Wait 120-Day Contest Period" }
            ]
        },
        {
            id: "inventory", title: "Inventory", description: "Identify assets specifically titled in the Trust.",
            tasks: [
                { id: "verify_titles", title: "Verify Trust Titling on All Assets" },
                { id: "dod_valuations", title: "Obtain Date-of-Death Valuations" },
                { id: "create_inventory", title: "Create Trust Asset Inventory" }
            ]
        },
        {
            id: "expenses", title: "Expenses", description: "Pay Trust-related taxes and administration costs.",
            tasks: [
                { id: "file_1040", title: "File Final Form 1040" },
                { id: "file_1041", title: "File Trust Income Tax (Form 1041)" },
                { id: "pay_debts", title: "Pay Trust Debts" },
                { id: "admin_expenses", title: "Pay Administration Expenses" }
            ]
        },
        {
            id: "transfer", title: "Transfer", description: "Direct distribution per Trust terms without court.",
            tasks: [
                { id: "calculate_shares", title: "Calculate Beneficiary Shares" },
                { id: "distribute_assets", title: "Distribute Assets to Beneficiaries" },
                { id: "get_receipts", title: "Obtain Signed Receipts" },
                { id: "final_accounting", title: "Prepare Final Accounting (Optional)" }
            ]
        }
    ],
    JOINT_TRANSFER: [
        {
            id: "verify_ownership", title: "Verify Ownership", description: "Confirm JTWROS vs Tenants in Common.",
            tasks: [
                { id: "check_title", title: "Review Title Document" },
                { id: "confirm_jtwros", title: "Confirm 'Joint Tenants with Right of Survivorship'" },
                { id: "identify_survivor", title: "Identify Surviving Owner" }
            ]
        },
        {
            id: "gather_docs", title: "Documents", description: "Assemble transfer documents.",
            tasks: [
                { id: "death_cert", title: "Obtain Certified Death Certificate" },
                { id: "affidavit", title: "Prepare Affidavit of Death (for real estate)" },
                { id: "survivor_id", title: "Gather Survivor's ID" }
            ]
        },
        {
            id: "submit_claim", title: "Submit Claim", description: "Request transfer to sole ownership.",
            tasks: [
                { id: "contact_institution", title: "Contact Institution" },
                { id: "complete_forms", title: "Complete Claim Forms" },
                { id: "submit_docs", title: "Submit Documents" }
            ]
        },
        {
            id: "complete_transfer", title: "Complete", description: "Confirm transfer and update records.",
            tasks: [
                { id: "verify_transfer", title: "Verify Transfer Complete" },
                { id: "update_beneficiaries", title: "Update Beneficiary Designations" },
                { id: "record_affidavit", title: "Record Affidavit (if real estate)" }
            ]
        }
    ],
    INTESTATE: [
        {
            id: "hierarchy",
            title: "Heir Hierarchy",
            description: "Determine legal heirs per state intestacy law.",
            tasks: [
                { id: "spouse", title: "Identify surviving spouse (if any)" },
                { id: "children", title: "Identify children and descendants" },
                { id: "parents", title: "Identify parents if no descendants" },
                { id: "siblings", title: "Identify siblings if no parents" },
                { id: "calculator", title: "Apply state intestacy calculator" },
                { id: "family_tree", title: "Document complete family tree" },
                { id: "verify_no_will", title: "Verify no Will exists" },
                { id: "shares", title: "Determine each heir percentage share" }
            ]
        },
        {
            id: "admin_petition",
            title: "Administrator Petition",
            description: "File petition for Letters of Administration.",
            tasks: [
                { id: "prepare_de111", title: "Prepare Petition (DE-111)" },
                { id: "admin_not_executor", title: "Request Administrator appointment" },
                { id: "list_heirs", title: "List all heirs with addresses" },
                { id: "bond_amount", title: "Determine bond requirement" },
                { id: "file_court", title: "File with probate court" },
                { id: "pay_fees", title: "Pay filing fees" },
                { id: "serve_heirs", title: "Serve notice to all heirs" },
                { id: "publish", title: "Publish notice in newspaper" }
            ]
        },
        {
            id: "bond",
            title: "Bond & Authority",
            description: "Post bond and obtain Letters of Administration.",
            tasks: [
                { id: "hearing", title: "Attend court hearing" },
                { id: "post_bond", title: "Post surety bond (if required)" },
                { id: "receive_letters", title: "Receive Letters of Administration" },
                { id: "certified_copies", title: "Order certified copies" },
                { id: "admin_note", title: "Note: Administrator, not Executor" },
                { id: "duties", title: "Understand fiduciary duties" }
            ]
        },
        {
            id: "clearance",
            title: "Creditor Clearance",
            description: "Publish notice, pay debts, file taxes.",
            tasks: [
                { id: "creditor_notice", title: "Publish creditor notice (4 months)" },
                { id: "inventory", title: "Collect and inventory all assets" },
                { id: "funeral", title: "Pay funeral expenses" },
                { id: "creditors", title: "Pay valid creditor claims" },
                { id: "taxes", title: "File final tax returns" },
                { id: "clearances", title: "Obtain tax clearances" }
            ]
        },
        {
            id: "statutory",
            title: "Statutory Distribution",
            description: "Distribute per state intestacy law (not Will).",
            tasks: [
                { id: "calc_shares", title: "Calculate shares per state law" },
                { id: "prepare_petition", title: "Prepare distribution petition" },
                { id: "file_petition", title: "File Petition for Final Distribution" },
                { id: "court_approval", title: "Obtain court approval" },
                { id: "distribute", title: "Distribute to heirs per court order" },
                { id: "receipts", title: "Obtain receipts from all heirs" },
                { id: "accounting", title: "File final accounting" },
                { id: "close", title: "Close estate" }
            ]
        }
    ],
    ANCILLARY_PROBATE: [
        {
            id: "domiciliary_completion",
            title: "Domiciliary Probate Completion",
            description: "Complete primary probate in decedent's home state.",
            tasks: [
                { id: "complete_primary", title: "Complete primary probate in home state" },
                { id: "obtain_letters", title: "Obtain certified Letters Testamentary" },
                { id: "identify_property", title: "Identify all out-of-state property" },
                { id: "determine_states", title: "Determine which states require ancillary" },
                { id: "research_requirements", title: "Research each state's requirements" },
                { id: "estimate_costs", title: "Estimate ancillary probate costs" },
                { id: "consider_options", title: "Consider selling vs transferring property" }
            ]
        },
        {
            id: "exemplified_documents",
            title: "Exemplified Will & Documents",
            description: "Obtain court-certified exemplified documents.",
            tasks: [
                { id: "exemplified_will", title: "Obtain exemplified copy of Will" },
                { id: "exemplified_letters", title: "Obtain exemplified Letters Testamentary" },
                { id: "death_certificates", title: "Get certified death certificates (multiple)" },
                { id: "authenticated_docs", title: "Prepare authenticated court documents" },
                { id: "research_local", title: "Research local state filing requirements" },
                { id: "identify_forms", title: "Identify required local forms" }
            ]
        },
        {
            id: "local_counsel_filing",
            title: "Local Counsel & Filing",
            description: "Retain local attorney and file ancillary petition.",
            tasks: [
                { id: "retain_attorney", title: "Retain local attorney in property state" },
                { id: "file_petition", title: "File Petition for Ancillary Probate" },
                { id: "submit_will", title: "Submit exemplified Will and Letters" },
                { id: "appoint_rep", title: "Appoint local personal representative (if required)" },
                { id: "pay_fees", title: "Pay local filing fees" },
                { id: "publish_notice", title: "Publish local creditor notice" },
                { id: "serve_heirs", title: "Serve local heirs/beneficiaries" }
            ]
        },
        {
            id: "local_administration",
            title: "Local Administration",
            description: "Administer ancillary estate in property state.",
            tasks: [
                { id: "local_letters", title: "Obtain local Letters Testamentary" },
                { id: "open_account", title: "Open local estate bank account" },
                { id: "pay_taxes", title: "Pay local property taxes" },
                { id: "maintain_property", title: "Maintain property during probate" },
                { id: "resolve_claims", title: "Resolve local creditor claims" },
                { id: "coordinate", title: "Coordinate with domiciliary executor" },
                { id: "file_taxes", title: "File local tax returns (if required)" }
            ]
        },
        {
            id: "property_disposition",
            title: "Property Transfer or Sale",
            description: "Transfer or sell out-of-state property.",
            tasks: [
                { id: "decide_disposition", title: "Decide: sell property or transfer to heirs" },
                { id: "list_property", title: "If selling: list property and accept offer" },
                { id: "close_sale", title: "If selling: close sale" },
                { id: "prepare_deeds", title: "If transferring: prepare deeds to beneficiaries" },
                { id: "pay_closing", title: "Pay local closing costs" },
                { id: "transfer_proceeds", title: "Transfer proceeds to domiciliary estate" },
                { id: "file_accounting", title: "File final local accounting" },
                { id: "close_ancillary", title: "Close ancillary probate" },
                { id: "record_docs", title: "Record final documents with county" }
            ]
        }
    ],
    INFORMAL_PROBATE: [
        {
            id: "verify_uncontested",
            title: "Verify Uncontested Status",
            description: "Confirm estate qualifies for informal/simplified probate.",
            tasks: [
                { id: "review_will", title: "Review Will for clarity and validity" },
                { id: "contact_beneficiaries", title: "Contact all beneficiaries" },
                { id: "written_consent", title: "Obtain written consent from heirs" },
                { id: "verify_no_disputes", title: "Verify no creditor disputes" },
                { id: "document_agreement", title: "Document unanimous agreement" },
                { id: "no_contests", title: "Confirm no Will contests expected" },
                { id: "state_requirements", title: "Verify estate meets state requirements" }
            ]
        },
        {
            id: "simplified_petition",
            title: "Simplified Petition",
            description: "File simplified petition with court.",
            tasks: [
                { id: "prepare_petition", title: "Prepare simplified probate petition" },
                { id: "attach_will", title: "Attach Will and death certificate" },
                { id: "waive_bond", title: "Request waiver of bond" },
                { id: "independent_admin", title: "Request independent administration" },
                { id: "file_court", title: "File with probate court" },
                { id: "reduced_fees", title: "Pay reduced filing fees" },
                { id: "expedited_hearing", title: "Request expedited hearing (if required)" }
            ]
        },
        {
            id: "streamlined_authority",
            title: "Streamlined Authority",
            description: "Obtain Letters with minimal court supervision.",
            tasks: [
                { id: "brief_hearing", title: "Attend brief hearing (or waived)" },
                { id: "receive_letters", title: "Receive Letters Testamentary" },
                { id: "certified_copies", title: "Order certified copies" },
                { id: "independent_note", title: "Note: Independent administration granted" },
                { id: "minimal_supervision", title: "Minimal ongoing court supervision" },
                { id: "no_inventory", title: "No Inventory & Appraisal (some states)" }
            ]
        },
        {
            id: "informal_administration",
            title: "Informal Administration",
            description: "Administer estate with minimal court oversight.",
            tasks: [
                { id: "collect_assets", title: "Collect and manage assets" },
                { id: "pay_debts", title: "Pay debts and expenses" },
                { id: "file_taxes", title: "File tax returns" },
                { id: "no_accounting", title: "No formal accounting required (most states)" },
                { id: "communicate", title: "Communicate with beneficiaries" },
                { id: "records", title: "Maintain detailed records" }
            ]
        },
        {
            id: "simplified_distribution",
            title: "Simplified Distribution",
            description: "Distribute assets with minimal court involvement.",
            tasks: [
                { id: "distribution_plan", title: "Prepare distribution plan" },
                { id: "beneficiary_consents", title: "Obtain beneficiary consents" },
                { id: "distribute", title: "Distribute per Will terms" },
                { id: "receipts", title: "Obtain receipts from beneficiaries" },
                { id: "closing_statement", title: "File closing statement (if required)" },
                { id: "close_estate", title: "Close estate without formal hearing" }
            ]
        }
    ],
    POD_TOD_TRANSFER: [
        {
            id: "verify_designation", title: "Verify Beneficiary", description: "Confirm beneficiary designation on file.",
            tasks: [
                { id: "contact_institution", title: "Contact Institution" },
                { id: "request_designation", title: "Request Copy of Beneficiary Form" },
                { id: "verify_name", title: "Verify Your Name is Listed" }
            ]
        },
        {
            id: "assemble_packet", title: "Assemble Packet", description: "Gather all required claim documents.",
            tasks: [
                { id: "death_cert", title: "Obtain Certified Death Certificate" },
                { id: "beneficiary_id", title: "Gather Your ID" },
                { id: "claim_form", title: "Complete Institution's Claim Form" },
                { id: "w9_form", title: "Complete W-9 Form" }
            ]
        },
        {
            id: "submit_claim", title: "Submit Claim", description: "File claim packet with institution.",
            tasks: [
                { id: "review_packet", title: "Review Packet for Completeness" },
                { id: "submit_docs", title: "Submit via Mail or In-Person" },
                { id: "track_submission", title: "Track Submission Status" }
            ]
        },
        {
            id: "receive_transfer", title: "Receive Transfer", description: "Direct transfer to beneficiary.",
            tasks: [
                { id: "choose_method", title: "Choose Transfer Method (Check/Wire/Account)" },
                { id: "receive_funds", title: "Receive Funds" },
                { id: "tax_reporting", title: "Note Tax Implications (if retirement account)" }
            ]
        }
    ],
    SPOUSAL_PETITION: [
        {
            id: "eligibility", title: "Eligibility", description: "Verify qualification for spousal petition.",
            tasks: [
                { id: "confirm_spouse", title: "Confirm Surviving Spouse Status" },
                { id: "verify_property", title: "Verify Community Property" },
                { id: "check_heirs", title: "Check for Other Heirs" }
            ]
        },
        {
            id: "documents", title: "Documents", description: "Assemble required documents.",
            tasks: [
                { id: "death_cert", title: "Obtain Death Certificate" },
                { id: "marriage_cert", title: "Obtain Marriage Certificate" },
                { id: "property_docs", title: "Gather Property Deeds/Titles" },
                { id: "will_if_exists", title: "Locate Original Will (if exists)" }
            ]
        },
        {
            id: "petition", title: "Petition", description: "File Spousal Property Petition (DE-221).",
            tasks: [
                { id: "prepare_de221", title: "Prepare DE-221" },
                { id: "notarize", title: "Notarize Signature" },
                { id: "file_court", title: "File with Probate Court" },
                { id: "pay_fees", title: "Pay Filing Fees (~$435)" }
            ]
        },
        {
            id: "hearing", title: "Hearing", description: "Attend hearing for Spousal Property Order.",
            tasks: [
                { id: "receive_notice", title: "Receive Hearing Notice" },
                { id: "prepare_docs", title: "Prepare Hearing Documents" },
                { id: "attend_hearing", title: "Attend Court Hearing" }
            ]
        },
        {
            id: "order", title: "Order", description: "Obtain Spousal Property Order (DE-226).",
            tasks: [
                { id: "obtain_de226", title: "Obtain Certified DE-226 Order" },
                { id: "get_copies", title: "Get Multiple Certified Copies" }
            ]
        },
        {
            id: "transfer", title: "Transfer", description: "Transfer title to surviving spouse.",
            tasks: [
                { id: "present_order", title: "Present DE-226 to Institutions" },
                { id: "record_deed", title: "Record with County Recorder (real estate)" },
                { id: "transfer_accounts", title: "Transfer Bank/Brokerage Accounts" },
                { id: "dmv_transfer", title: "Transfer Vehicle Titles at DMV" }
            ]
        }
    ],
    INSOLVENT: [
        {
            id: "insolvency_determination",
            title: "Insolvency Determination",
            description: "Determine if estate debts exceed assets.",
            tasks: [
                { id: "inventory_assets", title: "Inventory all estate assets" },
                { id: "appraise_assets", title: "Appraise assets at fair market value" },
                { id: "list_debts", title: "List all known debts and claims" },
                { id: "calculate_totals", title: "Calculate total assets vs liabilities" },
                { id: "determine_insolvent", title: "Determine if estate is insolvent" },
                { id: "document_analysis", title: "Document insolvency analysis" },
                { id: "consult_attorney", title: "Consult with probate attorney" }
            ]
        },
        {
            id: "creditor_priority",
            title: "Creditor Priority Classification",
            description: "Classify debts by statutory priority order.",
            tasks: [
                { id: "classify_debts", title: "Classify each debt by priority" },
                { id: "priority_1", title: "Priority 1: Administration costs" },
                { id: "priority_2", title: "Priority 2: Funeral and last illness" },
                { id: "priority_3", title: "Priority 3: Family allowance" },
                { id: "priority_4", title: "Priority 4: Secured creditors" },
                { id: "priority_5", title: "Priority 5: Taxes (federal, state)" },
                { id: "priority_6", title: "Priority 6: Medical bills (last 60 days)" },
                { id: "priority_7", title: "Priority 7: General unsecured creditors" },
                { id: "priority_8", title: "Priority 8: Lower priority claims" }
            ]
        },
        {
            id: "court_approval",
            title: "Court Approval & Notice",
            description: "File insolvency notice and obtain court approval.",
            tasks: [
                { id: "file_notice", title: "File Notice of Insolvency with court" },
                { id: "request_approval", title: "Request court approval for payment plan" },
                { id: "publish_notice", title: "Publish extended creditor notice (4 months)" },
                { id: "individual_notice", title: "Send notice to known creditors" },
                { id: "explain_prorata", title: "Explain pro-rata distribution" },
                { id: "set_deadline", title: "Set claims deadline" },
                { id: "file_report", title: "File preliminary insolvency report" }
            ]
        },
        {
            id: "asset_liquidation",
            title: "Asset Liquidation",
            description: "Liquidate assets to maximize creditor pool.",
            tasks: [
                { id: "court_approval_sell", title: "Obtain court approval to sell assets" },
                { id: "liquidate_assets", title: "Liquidate non-exempt assets" },
                { id: "estate_sales", title: "Conduct estate sales if needed" },
                { id: "sell_property", title: "Sell real property (if authorized)" },
                { id: "collect_receivables", title: "Collect all receivables" },
                { id: "close_accounts", title: "Close bank accounts" },
                { id: "deposit_funds", title: "Deposit all funds in estate account" },
                { id: "maintain_records", title: "Maintain detailed liquidation records" }
            ]
        },
        {
            id: "prorata_distribution",
            title: "Pro-Rata Distribution",
            description: "Distribute funds to creditors by priority.",
            tasks: [
                { id: "calculate_available", title: "Calculate total funds available" },
                { id: "pay_priority_1", title: "Pay Priority 1 claims in full" },
                { id: "pay_priority_2", title: "Pay Priority 2 claims in full" },
                { id: "calculate_prorata", title: "Calculate pro-rata percentage" },
                { id: "prepare_schedule", title: "Prepare distribution schedule" },
                { id: "obtain_approval", title: "Obtain court approval of distribution" },
                { id: "issue_checks", title: "Issue checks to approved creditors" },
                { id: "obtain_releases", title: "Obtain releases from creditors" },
                { id: "file_proof", title: "File proof of payment with court" }
            ]
        },
        {
            id: "final_accounting",
            title: "Final Accounting & Closure",
            description: "Complete final accounting and close estate.",
            tasks: [
                { id: "prepare_accounting", title: "Prepare final accounting" },
                { id: "document_compliance", title: "Document priority order compliance" },
                { id: "file_final_report", title: "File final report with court" },
                { id: "notify_creditors", title: "Notify all creditors of final distribution" },
                { id: "explain_shortfall", title: "Explain why lower priority creditors received nothing" },
                { id: "request_discharge", title: "Request discharge as executor" },
                { id: "close_account", title: "Close estate bank account" },
                { id: "obtain_order", title: "Obtain court order closing estate" }
            ]
        }
    ],
    SPECIAL: [
        {
            id: "attorney_required",
            title: "⚠️ Attorney Required",
            description: "This case requires specialized legal counsel. Do not proceed without an attorney.",
            tasks: [
                { id: "recognize_complexity", title: "Recognize this is beyond self-service" },
                { id: "stop_diy", title: "STOP: Do not attempt to handle this yourself" },
                { id: "consult_attorney", title: "Consult with probate litigation attorney" },
                { id: "understand_risks", title: "Understand legal and financial risks" },
                { id: "attorney_retainer", title: "Retain specialized probate attorney" }
            ]
        },
        {
            id: "case_assessment",
            title: "Case Assessment",
            description: "Attorney evaluates the specific legal challenge.",
            tasks: [
                { id: "identify_issue", title: "Identify specific legal issue (Will contest, fraud, etc.)" },
                { id: "assess_merits", title: "Attorney assesses merits of case" },
                { id: "estimate_costs", title: "Estimate litigation costs and timeline" },
                { id: "evaluate_settlement", title: "Evaluate settlement vs litigation options" },
                { id: "develop_strategy", title: "Develop legal strategy" }
            ]
        },
        {
            id: "litigation_process",
            title: "Litigation Process",
            description: "Attorney handles court proceedings and legal filings.",
            tasks: [
                { id: "file_pleadings", title: "Attorney files necessary pleadings" },
                { id: "discovery", title: "Attorney conducts discovery" },
                { id: "depositions", title: "Attorney handles depositions" },
                { id: "motions", title: "Attorney files motions" },
                { id: "court_hearings", title: "Attorney represents you in court hearings" },
                { id: "trial_prep", title: "Attorney prepares for trial (if necessary)" }
            ]
        },
        {
            id: "resolution",
            title: "Resolution",
            description: "Case is resolved through settlement or court judgment.",
            tasks: [
                { id: "negotiate_settlement", title: "Attorney negotiates settlement (if applicable)" },
                { id: "mediation", title: "Participate in mediation (if ordered)" },
                { id: "trial", title: "Attorney represents you at trial (if necessary)" },
                { id: "judgment", title: "Court issues judgment or order" },
                { id: "appeal_period", title: "Wait for appeal period to expire" },
                { id: "implement_order", title: "Implement court's order" }
            ]
        }
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
