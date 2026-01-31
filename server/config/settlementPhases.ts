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
            { id: "file_petition", title: "File Petition for Probate (DE-111)" },
            { id: "publish_notice", title: "Publish Creditor Notice" },
            { id: "mail_notice", title: "Mail Notice to Known Creditors" },
            { id: "attend_hearing", title: "Attend Probate Hearing" },
            { id: "receive_letters", title: "Receive Letters Testamentary (DE-150)" }
        ]
    },
    {
        phase: "asset_discovery",
        tasks: [
            { id: "freeze_accounts", title: "Freeze All Financial Accounts" },
            { id: "get_dod_values", title: "Obtain Date-of-Death Values" },
            { id: "hire_appraiser", title: "Hire Probate Referee for Real Property" },
            { id: "complete_inventory", title: "Complete Inventory & Appraisal (DE-160)" },
            { id: "file_inventory", title: "File Inventory with Court" }
        ]
    },
    {
        phase: "creditor_claims",
        tasks: [
            { id: "wait_claim_period", title: "Wait for 4-Month Claim Period" },
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
            { id: "sell_property", title: "Sell Real Property (if needed)" },
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
