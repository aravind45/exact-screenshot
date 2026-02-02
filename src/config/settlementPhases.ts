import { SettlementPhase } from "@/components/SettlementPhaseChevron";
import { AuthorityType, MasterMode } from "@/lib/authorityEngine";

export interface PhaseTask {
  id: string;
  title: string;
  description: string;
  estimatedTime?: string;
  requiredDocs?: string[];
  alerts?: {
    type: "info" | "warning" | "important" | "caution";
    message: string;
  }[];
  category?: "probate" | "court-issued";
  utility?: string;
  isLongHorizon?: boolean;
  exclusiveGroup?: string;
  links?: {
    label: string;
    url: string;
  }[];
  // New features
  isOptional?: boolean;
  dependencies?: string[]; // IDs of tasks that must be completed first
  deadlineWarningId?: string; // ID of the deadline to check for warnings
  helpArticleId?: string; // ID of the help article/section to link to

  // Semantic Categories (Gap D)
  tags?: ("statutory" | "fiduciary" | "communication" | "tax" | "court-order" | "risk-guardrail")[];
  applicability?: {
    masterModes?: MasterMode[];
    authorityTypes?: AuthorityType[];
    states?: string[];
  };
}

export interface PhaseTaskList {
  phase: SettlementPhase;
  title: string;
  subtitle: string;
  duration: string;
  description: string;
  tasks: PhaseTask[];
}

export const SETTLEMENT_PHASE_TASKS: PhaseTaskList[] = [
  {
    phase: "immediate_actions",
    title: "Preliminary Assessment",
    subtitle: "Determine Strategy",
    duration: "Day 1-7",
    description: "Determine the legal path for the estate before taking irrevocable actions.",
    tasks: [
      {
        id: "check_small_estate",
        title: "Check Small Estate Eligibility",
        description: "Determine if total California assets are under $184,500. You may be able to avoid probate entirely using an Affidavit (Section 13100).",
        utility: "Shortcut: Avoid full probate if the estate is small enough.",
        estimatedTime: "1 hour",
        exclusiveGroup: "filing_path",
        helpArticleId: "small-estate-affidavit",
        alerts: [
          {
            type: "important",
            message: "Avoid full probate if possible. Small estates can be settled in 40 days without court."
          }
        ]
      },
      {
        id: "confirm_executor_role",
        title: "Confirm Executor/Trustee Role",
        description: "Review the Will or Trust to confirm your appointment and willingness to serve.",
        estimatedTime: "2 hours",
        helpArticleId: "executor-duties",
        alerts: [
          {
            type: "info",
            message: "You have the right to decline. Once you start 'intermeddling' with assets, you may be legally committed."
          }
        ]
      },
      {
        id: "secure_property",
        title: "Secure the Property",
        description: "Change locks, forward mail, and ensure the home is protected from theft or damage.",
        estimatedTime: "1-2 days",
        alerts: [
          {
            type: "important",
            message: "Vacant homes are high-risk. Contact insurance to ensure coverage remains active."
          }
        ]
      }
    ]
  },
  {
    phase: "immediate_actions",
    title: "Immediate Actions",
    subtitle: "Secure & Notify",
    duration: "Week 1-2",
    description: "Critical tasks to complete immediately after death.",
    tasks: [
      {
        id: "secure_property_2", // Deduped ID for second occurrence or handled via UI logic, assuming list structure implies distinct phases
        title: "Secure the Property",
        description: "Change locks, forward mail, and ensure the home is protected from theft or damage.",
        estimatedTime: "1-2 days",
        alerts: [
          {
            type: "important",
            message: "Vacant homes are high-risk for theft and insurance claims. Act immediately."
          }
        ]
      },
      {
        id: "notify_ssa",
        title: "Notify Social Security Administration",
        description: "Report the death to stop benefit payments and prevent overpayment recovery.",
        estimatedTime: "30 minutes",
        requiredDocs: ["Death Certificate"],
        alerts: [
          {
            type: "warning",
            message: "SSA may claw back payments made after death. Notify within 1 week."
          }
        ],
        links: [
          {
            label: "Report Death to SSA",
            url: "https://www.ssa.gov/benefits/survivors/ifyou.html"
          }
        ]
      },
      {
        id: "cancel_cards",
        title: "Cancel Credit Cards & Subscriptions",
        description: "Stop recurring charges and prevent identity theft by closing accounts.",
        estimatedTime: "2-3 hours",
        alerts: [
          {
            type: "caution",
            message: "Keep one utility account open for estate expenses (electricity, water)."
          }
        ]
      },
      {
        id: "genealogical_search",
        title: "Conduct Genealogical Search",
        description: "If heirs are unknown or missing, you must perform a formal search to identify all legal beneficiaries. This is required for your final distribution decree.",
        estimatedTime: "4-8 weeks",
        isOptional: true,
        category: "probate",
        tags: ["fiduciary", "risk-guardrail"],
        applicability: {
          authorityTypes: ["INTESTATE", "FORMAL_PROBATE", "INFORMAL_PROBATE"]
        },
        alerts: [
          {
            type: "important",
            message: "Failing to locate all heirs can lead to personal liability and gridlock during distribution."
          }
        ]
      },
      {
        id: "locate_will",
        title: "Locate Will and Important Documents",
        description: "Find the original Will, trust documents, insurance policies, and account statements.",
        estimatedTime: "1-2 days",
        alerts: [
          {
            type: "info",
            message: "Check safe deposit boxes, home safes, attorney offices, and online storage."
          }
        ]
      },
      {
        id: "open_estate_account",
        title: "Open Estate Bank Account",
        description: "Create a separate checking account for estate income and expenses.",
        estimatedTime: "1 hour",
        requiredDocs: ["Death Certificate", "Executor ID"],
        alerts: [
          {
            type: "important",
            message: "NEVER mix estate funds with personal funds. This is a legal requirement."
          }
        ]
      },
      {
        id: "pay_immediate_bills",
        title: "Pay Immediate Bills",
        description: "Keep utilities, mortgage, and insurance current to protect estate assets.",
        estimatedTime: "Ongoing",
        alerts: [
          {
            type: "warning",
            message: "Use estate funds only. Keep receipts for court accounting."
          }
        ]
      }
    ]
  },
  {
    phase: "court_filing",
    title: "Court Filing",
    subtitle: "Petition & Letters",
    duration: "Week 3-8",
    description: "File probate petition, publish creditor notice, and obtain Letters Testamentary.",
    tasks: [
      {
        id: "file_petition",
        title: "File Petition for Probate (DE-111)",
        description: "Submit the probate petition to the Superior Court to open the estate case.",
        utility: "Required to obtain legal authority to access accounts.",
        estimatedTime: "2-4 hours",
        category: "probate",
        exclusiveGroup: "filing_path",
        helpArticleId: "probate-steps",
        requiredDocs: [
          "Original Will",
          "Death Certificate",
          "DE-111",
          "DE-121"
        ],
        alerts: [
          {
            type: "info",
            message: "Filing fee: ~$435 in California. File within 30 days for best practice."
          }
        ],
        links: [
          {
            label: "Download DE-111",
            url: "https://www.courts.ca.gov/documents/de111.pdf"
          }
        ]
      },
      {
        id: "publish_notice",
        title: "Publish Creditor Notice",
        description: "Publish notice in a local newspaper for 3 consecutive weeks to notify creditors.",
        estimatedTime: "1 week",
        requiredDocs: ["Court Case Number", "DE-130"],
        category: "probate",
        deadlineWarningId: "CREDITOR_NOTICE_DEADLINE", // New deadline link
        dependencies: ["file_petition"], // New dependency
        helpArticleId: "creditor-notice",
        alerts: [
          {
            type: "important",
            message: "This starts the 4-month creditor claim period. Must be done within 4 months of Letters."
          }
        ]
      },
      {
        id: "mail_notice",
        title: "Mail Notice to Known Creditors",
        description: "Send formal notice to all known creditors (banks, credit cards, medical providers).",
        estimatedTime: "2-3 hours",
        requiredDocs: ["DE-157"],
        category: "probate",
        dependencies: ["file_petition"],
        alerts: [
          {
            type: "warning",
            message: "Keep proof of mailing. This protects you from late claims."
          }
        ]
      },
      {
        id: "attend_hearing",
        title: "Attend Probate Hearing",
        description: "Appear in court for the probate hearing (usually 60-90 days after filing).",
        estimatedTime: "2-3 hours",
        requiredDocs: ["Valid ID", "DE-130"],
        dependencies: ["file_petition"],
        alerts: [
          {
            type: "info",
            message: "Dress professionally. Bring all documents. Hearing is usually brief (5-10 minutes)."
          }
        ]
      },
      {
        id: "receive_letters",
        title: "Receive Letters Testamentary (DE-150)",
        description: "Obtain certified copies of your Letters - this is your legal authority to act.",
        estimatedTime: "1-2 weeks after hearing",
        category: "court-issued",
        requiredDocs: ["DE-150"],
        dependencies: ["attend_hearing"],
        alerts: [
          {
            type: "important",
            message: "Order 10-15 certified copies ($15 each). You'll need them for every institution."
          }
        ]
      },
      {
        id: "file_affidavit",
        title: "File Small Estate Affidavit (DE-310)",
        description: "For estates under threshold, use this shortcut to bypass court probate.",
        utility: "Bypass court entirely for estates under $184,500.",
        estimatedTime: "40 days after death",
        category: "court-issued",
        exclusiveGroup: "filing_path",
        isOptional: true, // Only if eligible
        helpArticleId: "small-estate-affidavit",
        requiredDocs: ["DE-310", "Death Certificate"]
      },
      {
        id: "file_spousal_petition",
        title: "File Spousal Property Petition (DE-221)",
        description: "Request court order to transfer property to surviving spouse without full probate.",
        estimatedTime: "4-6 weeks",
        category: "probate",
        isOptional: true, // Only if spouse
        helpArticleId: "spousal-property",
        requiredDocs: ["DE-221", "Death Certificate"]
      },
      {
        id: "issue_cert_trust",
        title: "Issue Certificate of Trust",
        description: "Formalize successor trustee authority for trust-held assets.",
        estimatedTime: "1 week",
        category: "court-issued",
        isOptional: true, // Only if trust
        helpArticleId: "trust-administration",
        requiredDocs: ["Trust Agreement"]
      },
      {
        id: "manage_business_authority",
        title: "Obtain Business Operating Authority",
        description: "If the decedent owned a business, you may need a court order to continue operations and pay employees.",
        estimatedTime: "1-2 weeks",
        category: "probate",
        isOptional: true,
        alerts: [{ type: "important", message: "Do not let business operations lapse; it can severely devalue the estate." }]
      }
    ]
  },
  {
    phase: "asset_discovery",
    title: "Asset Discovery",
    subtitle: "Inventory & Appraisal",
    duration: "Month 2-4",
    description: "Identify all assets, obtain date-of-death values, and file Inventory & Appraisal.",
    tasks: [
      {
        id: "check_unclaimed_property",
        title: "Search State Unclaimed Property",
        description: "Check state databases for dormant accounts, uncashed checks, or forgotten insurance policies.",
        estimatedTime: "1 hour",
        helpArticleId: "asset-discovery",
        links: [{ label: "Search CA Unclaimed Property", url: "https://www.sco.ca.gov/up.html" }]
      },
      {
        id: "business_valuation",
        title: "Hire Business Valuation Expert",
        description: "If the estate includes an ongoing business, a professional valuation is required for tax and distribution purposes.",
        estimatedTime: "2-4 weeks",
        isOptional: true
      },
      {
        id: "freeze_accounts",
        title: "Freeze All Financial Accounts",
        description: "Contact every bank, brokerage, and insurance company to freeze accounts.",
        estimatedTime: "2-4 weeks",
        requiredDocs: ["Death Certificate", "Letters (DE-150)"],
        alerts: [
          {
            type: "important",
            message: "This prevents unauthorized access and locks in values for tax purposes."
          }
        ]
      },
      {
        id: "get_dod_values",
        title: "Obtain Date-of-Death Values",
        description: "Request official DOD statements from every financial institution.",
        estimatedTime: "2-4 weeks",
        requiredDocs: ["Letters (DE-150)"],
        alerts: [
          {
            type: "info",
            message: "These values determine the estate's tax basis and court inventory."
          }
        ]
      },
      {
        id: "hire_appraiser",
        title: "Hire Probate Referee for Real Property",
        description: "Court-appointed appraiser must value real estate, business interests, and collectibles.",
        estimatedTime: "2-3 weeks",
        requiredDocs: ["Court Appointment"],
        isOptional: true, // Only if court probate
        alerts: [
          {
            type: "important",
            message: "Fee: 0.1% of appraised value (minimum $75). Court assigns the referee."
          }
        ]
      },
      {
        id: "complete_inventory",
        title: "Complete Inventory & Appraisal (DE-160)",
        description: "List ALL assets with DOD values and attach appraisal reports.",
        estimatedTime: "1-2 weeks",
        requiredDocs: ["All DOD Statements", "Appraisal Reports"],
        category: "court-issued",
        deadlineWarningId: "INVENTORY_DUE_DATE",
        helpArticleId: "inventory-appraisal",
        alerts: [
          {
            type: "warning",
            message: "Due within 4 months of Letters. Late filing can delay distribution by months."
          }
        ]
      },
      {
        id: "file_inventory",
        title: "File Inventory with Court",
        description: "Submit DE-160 to court and serve copies on all heirs.",
        estimatedTime: "1 day",
        category: "probate",
        dependencies: ["complete_inventory"],
        alerts: [
          {
            type: "info",
            message: "Keep proof of service. This becomes the official estate value."
          }
        ]
      }
    ]
  },
  {
    phase: "creditor_claims",
    title: "Creditor Claims",
    subtitle: "Notice & Payment",
    duration: "Month 4-8",
    description: "Wait for creditor claim period, review claims, and pay approved debts.",
    tasks: [
      {
        id: "evaluate_solvency",
        title: "Evaluate Estate Solvency",
        description: "Compare total assets to total liabilities and funeral/admin expenses.",
        estimatedTime: "2-3 hours",
        alerts: [{ type: "caution", message: "If liabilities exceed assets, the estate is insolvent. Different rules apply." }]
      },
      {
        id: "wait_claim_period",
        title: "Wait for 4-Month Claim Period",
        description: "Creditors have 4 months from notice publication to file claims.",
        utility: "Mandatory waiting period to protect you from future debt liability.",
        isLongHorizon: true,
        estimatedTime: "4 months",
        dependencies: ["publish_notice"],
        alerts: [
          {
            type: "info",
            message: "You cannot distribute assets until this period expires. Use this time to prepare."
          }
        ]
      },
      {
        id: "review_claims",
        title: "Review Submitted Claims",
        description: "Examine each creditor claim for validity, amount, and supporting documentation.",
        estimatedTime: "1-2 weeks",
        helpArticleId: "creditor-claims",
        alerts: [
          {
            type: "caution",
            message: "You have 30 days to approve or reject each claim. Get attorney help if unsure."
          }
        ]
      },
      {
        id: "reject_invalid",
        title: "Reject Invalid Claims",
        description: "File formal rejections for claims that are incorrect, unsupported, or time-barred.",
        estimatedTime: "1 week",
        isOptional: true, // Only if bad claims exist
        requiredDocs: ["DE-174 Allowance or Rejection"],
        alerts: [
          {
            type: "warning",
            message: "Rejected creditors can sue the estate. Document your reasons carefully."
          }
        ]
      },
      {
        id: "pay_approved",
        title: "Pay Approved Claims",
        description: "Pay valid debts in order of priority (funeral, taxes, secured debts, then unsecured).",
        estimatedTime: "2-4 weeks",
        dependencies: ["review_claims"],
        alerts: [
          {
            type: "important",
            message: "Follow legal priority order. Paying wrong creditors first can make you personally liable."
          }
        ]
      },
      {
        id: "file_proof",
        title: "File Proof of Notice",
        description: "Submit proof that you properly notified all creditors.",
        estimatedTime: "1 day",
        requiredDocs: ["Proof of Publication", "Proof of Mailing"],
        dependencies: ["publish_notice"],
        alerts: [
          {
            type: "info",
            message: "This protects you from late claims after distribution."
          }
        ]
      }
    ]
  },
  {
    phase: "asset_liquidation",
    title: "Asset Liquidation",
    subtitle: "Transfer & Sell",
    duration: "Month 6-12",
    description: "Present Letters to institutions, transfer or sell assets, and pay final bills.",
    tasks: [
      {
        id: "minor_beneficiary_court_approval",
        title: "Obtain Court Approval for Minor Distributions",
        description: "Distributions to minors usually require a guardianship or court order to be placed in a blocked account.",
        estimatedTime: "4-8 weeks",
        isOptional: true,
        category: "probate"
      },
      {
        id: "present_letters",
        title: "Present Letters to All Institutions",
        description: "Submit certified Letters (DE-150) to every bank, brokerage, and insurance company.",
        estimatedTime: "2-4 weeks",
        requiredDocs: ["Letters (DE-150)", "Death Certificate"],
        alerts: [
          {
            type: "info",
            message: "Each institution has different forms and timelines. Be patient and persistent."
          }
        ]
      },
      {
        id: "transfer_accounts",
        title: "Transfer Financial Accounts",
        description: "Move stocks, bonds, and cash to estate account or directly to beneficiaries.",
        estimatedTime: "4-8 weeks",
        dependencies: ["present_letters"],
        alerts: [
          {
            type: "important",
            message: "Verify cost basis step-up to DOD value. This saves heirs thousands in taxes."
          }
        ]
      },
      {
        id: "sell_property",
        title: "Sell Real Property (if needed)",
        description: "List and sell real estate if required by Will or to pay debts.",
        estimatedTime: "3-6 months",
        isOptional: true, // Only if needed/willed
        requiredDocs: ["Court Authorization (if required)"],
        alerts: [
          {
            type: "warning",
            message: "Some sales require court approval. Check with attorney before listing."
          }
        ]
      },
      {
        id: "file_form_1041",
        title: "File Form 1041 (Fiduciary Income Tax)",
        description: "Report income, deductions, and credits for a trust or estate that has gross income of $600 or more in a tax year.",
        estimatedTime: "4-8 hours",
        tags: ["tax", "statutory"],
        applicability: {
          authorityTypes: ["TRUST_ADMIN_IRREVOCABLE", "TRUST_ADMIN_REVOCABLE", "FORMAL_PROBATE", "INFORMAL_PROBATE"]
        },
        alerts: [{ type: "important", message: "Required for irrevocable trusts and estates with significant income. Consult a tax professional." }]
      },
      {
        id: "issue_k1",
        title: "Issue Schedule K-1 to Beneficiaries",
        description: "Provide beneficiaries with their share of income, deductions, and credits to report on their individual tax returns.",
        estimatedTime: "2-3 hours",
        tags: ["tax", "communication"],
        applicability: {
          authorityTypes: ["TRUST_ADMIN_IRREVOCABLE", "TRUST_ADMIN_REVOCABLE", "FORMAL_PROBATE", "INFORMAL_PROBATE"]
        }
      },
      {
        id: "pay_taxes",
        title: "Pay Final Taxes",
        description: "File final individual 1040, estate 1041, and any estate tax returns.",
        utility: "Clears your personal liability with the IRS.",
        isLongHorizon: true,
        estimatedTime: "2-4 weeks",
        requiredDocs: ["All Tax Documents"],
        deadlineWarningId: "TAX_FILING_DEADLINE",
        helpArticleId: "tax-returns",
        alerts: [
          {
            type: "important",
            message: "Deadlines: 1040 by April 15, 1041 by April 15, 706 within 9 months."
          }
        ]
      },
      {
        id: "prepare_accounting",
        title: "Prepare Final Accounting",
        description: "Document all income, expenses, and distributions for court review.",
        utility: "Required to prove you didn't miss any funds.",
        isLongHorizon: true,
        estimatedTime: "1-2 weeks",
        dependencies: ["pay_taxes"],
        alerts: [
          {
            type: "info",
            message: "Keep every receipt. The court will review your accounting line by line."
          }
        ]
      }
    ]
  },
  {
    phase: "final_distribution",
    title: "Final Distribution",
    subtitle: "Close Estate",
    duration: "Month 12-18",
    description: "File petition for final distribution, distribute assets to heirs, and close estate.",
    tasks: [
      {
        id: "blocked_account_minors",
        title: "Setup Blocked Accounts for Minors",
        description: "Ensure funds for minor beneficiaries are placed in court-approved blocked accounts.",
        estimatedTime: "2 weeks",
        isOptional: true
      },
      {
        id: "file_final_petition",
        title: "File Petition for Final Distribution",
        description: "Request court approval to distribute remaining assets to heirs.",
        estimatedTime: "2-4 hours",
        requiredDocs: ["Final Accounting", "Proposed Distribution Plan"],
        dependencies: ["prepare_accounting"],
        alerts: [
          {
            type: "info",
            message: "Hearing scheduled 30-60 days after filing. All heirs must be notified."
          }
        ]
      },
      {
        id: "attend_final_hearing",
        title: "Attend Final Hearing",
        description: "Appear in court for approval of final accounting and distribution.",
        estimatedTime: "1-2 hours",
        dependencies: ["file_final_petition"],
        alerts: [
          {
            type: "important",
            message: "Bring all receipts and documentation. Judge may ask questions about expenses."
          }
        ]
      },
      {
        id: "distribute_assets",
        title: "Distribute Assets to Heirs",
        description: "Transfer remaining assets according to Will and court order.",
        estimatedTime: "2-4 weeks",
        requiredDocs: ["Order for Final Distribution"],
        dependencies: ["attend_final_hearing"],
        alerts: [
          {
            type: "warning",
            message: "Get signed receipts from every heir. This protects you from future claims."
          }
        ]
      },
      {
        id: "file_final_accounting",
        title: "File Final Accounting with Court",
        description: "Submit final report showing all transactions and distributions.",
        estimatedTime: "1 day",
        dependencies: ["distribute_assets"],
        alerts: [
          {
            type: "info",
            message: "This is your final legal obligation. Keep copies forever."
          }
        ]
      },
      {
        id: "close_estate",
        title: "Close Estate",
        description: "File final discharge and close estate bank account.",
        estimatedTime: "1-2 weeks",
        requiredDocs: ["DE-295 Petition for Final Discharge"],
        dependencies: ["file_final_accounting"],
        alerts: [
          {
            type: "important",
            message: "Congratulations! You've completed one of life's most difficult responsibilities."
          }
        ]
      }
    ]
  }
];
