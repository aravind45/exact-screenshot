/**
 * Server-side settlement phase task definitions (lightweight).
 *
 * IMPORTANT: Base task titles and descriptions MUST be state-neutral.
 * All state-specific language (form numbers, deadlines, procedures)
 * belongs in RoadmapTaskStateOverride records, NOT here.
 */
export const SETTLEMENT_PHASE_TASKS = [
    {
        phase: "immediate_actions",
        tasks: [
            { id: "check_small_estate", title: "Check Small Estate Eligibility" },
            { id: "confirm_executor_role", title: "Confirm Executor/Trustee Role" },
            { id: "secure_property", title: "Secure the Property" },
            { id: "notify_ssa", title: "Notify Social Security Administration" },
            { id: "cancel_cards", title: "Cancel Credit Cards & Subscriptions" },
            { id: "locate_will", title: "Locate Will and Important Documents" },
            { id: "open_estate_account", title: "Open Estate Bank Account" },
            { id: "pay_immediate_bills", title: "Pay Immediate Bills" }
        ]
    },
    {
        phase: "court_filing",
        tasks: [
            { id: "file_probate_petition", title: "File Petition for Probate" },
            { id: "file_administration_petition", title: "File Petition for Administration" },
            { id: "publish_notice", title: "Publish Creditor Notice" },
            { id: "mail_notice", title: "Mail Notice to Known Creditors" },
            { id: "attend_probate_hearing", title: "Attend Probate Hearing" },
            { id: "attend_administration_hearing", title: "Attend Administration Hearing" },
            { id: "receive_letters_testamentary", title: "Obtain Letters Testamentary" },
            { id: "receive_letters_administration", title: "Obtain Letters of Administration" }
        ]
    },
    {
        phase: "asset_discovery",
        tasks: [
            { id: "freeze_accounts", title: "Coordinate with Financial Institutions" },
            { id: "get_dod_values", title: "Obtain Date-of-Death Values" },
            { id: "hire_appraiser", title: "Hire Probate Referee for Real Property" },
            { id: "complete_inventory", title: "Complete Inventory & Appraisal" },
            { id: "file_inventory", title: "File Inventory with Court" }
        ]
    },
    {
        phase: "creditor_claims",
        tasks: [
            { id: "wait_claim_period", title: "Monitor State-Specific Creditor Exposure Period" },
            { id: "review_claims", title: "Review Submitted Claims" },
            { id: "reject_invalid", title: "Reject Invalid Claims" },
            { id: "pay_approved", title: "Pay Approved Claims" },
            { id: "file_proof", title: "File Proof of Notice" }
        ]
    },
    {
        phase: "asset_liquidation",
        tasks: [
            { id: "present_letters", title: "Present Letters to All Institutions" },
            { id: "transfer_accounts", title: "Transfer Financial Accounts" },
            { id: "sell_property", title: "Complete Property Sale (if needed)" },
            { id: "pay_taxes", title: "Pay Final Taxes" },
            { id: "prepare_accounting", title: "Prepare Final Accounting" }
        ]
    },
    {
        phase: "final_distribution",
        tasks: [
            { id: "file_final_petition", title: "File Petition for Final Distribution" },
            { id: "attend_final_hearing", title: "Attend Final Hearing" },
            { id: "distribute_assets", title: "Distribute Assets to Heirs" },
            { id: "file_final_accounting", title: "File Final Accounting with Court" },
            { id: "close_estate", title: "Close Estate" }
        ]
    }
];
