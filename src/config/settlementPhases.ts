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
  isInternationalOnly?: boolean; // New flag for International Mode
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
      },
      {
        id: "identify_minor_beneficiaries",
        title: "Identify Minor Beneficiaries",
        description: "Review all heirs and identify any beneficiaries under age 18. Minors require special court protection through a guardian ad litem.",
        estimatedTime: "30 minutes",
        isOptional: true, // Controlled by filtering logic based on profile
        alerts: [{
          type: "important",
          message: "Estates with minor beneficiaries require additional court oversight and blocked accounts."
        }]
      },
      {
        id: "check_primary_residence_succession",
        title: "Check Primary Residence Succession Eligibility",
        description: "If the estate consists primarily of a primary residence valued under $100,000, you may qualify for simplified succession process (DE-310/315).",
        utility: "Shortcut: Avoid full probate for qualifying primary residences.",
        estimatedTime: "1 hour",
        exclusiveGroup: "filing_path",
        isOptional: true,
        helpArticleId: "primary-residence-succession",
        alerts: [{
          type: "important",
          message: "This process is ONLY for primary residences. Other assets require different procedures."
        }]
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
      },
      // International Mode Tasks - Group 1: Representation
      {
        id: "confirm_us_rep",
        title: "Confirm U.S. Legal Representative",
        description: "Decide if you will hire a U.S. probate attorney or appoint a local co-executor/agent to handle on-the-ground tasks.",
        estimatedTime: "1 week",
        isInternationalOnly: true,
        alerts: [
          {
            type: "important",
            message: "Most U.S. institutions will not coordinate directly with foreign executors without U.S. counsel or agent."
          }
        ]
      },
      {
        id: "check_apostille",
        title: "Check Apostille Requirements",
        description: "Determine if your country is part of the Hague Apostille Convention for notarizing documents.",
        estimatedTime: "1 hour",
        isInternationalOnly: true,
        alerts: [
          {
            type: "warning",
            message: "Foreign notarization without apostille is frequently rejected by U.S. banks."
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
        isOptional: true,
        helpArticleId: "spousal-property",
        requiredDocs: ["DE-221", "Death Certificate"]
      },
      {
        id: "give_spousal_notice",
        title: "Give Notice of Hearing (DE-120)",
        description: "Notify all interested parties about the court hearing date for the Spousal Property Petition.",
        estimatedTime: "2 hours",
        category: "probate",
        isOptional: true,
        dependencies: ["file_spousal_petition"],
        requiredDocs: ["DE-120"],
        alerts: [{
          type: "important",
          message: "Notice must be served at least 15 days before the hearing date."
        }]
      },
      {
        id: "obtain_spousal_order",
        title: "Obtain Spousal Property Order (DE-226)",
        description: "Receive signed court order confirming property ownership transfer to spouse. Record with county recorder if real estate is involved.",
        estimatedTime: "1-2 weeks after hearing",
        category: "court-issued",
        isOptional: true,
        dependencies: ["give_spousal_notice"],
        requiredDocs: ["DE-226"],
        alerts: [{
          type: "important",
          message: "A certified copy of this order serves as the new deed for real property."
        }]
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
      },
      {
        id: "petition_guardian_ad_litem",
        title: "File Petition for Guardian Ad Litem (DE-350)",
        description: "Request court appointment of a guardian ad litem to represent minor beneficiaries' interests throughout probate.",
        estimatedTime: "2-4 hours",
        category: "probate",
        isOptional: true,
        requiredDocs: ["DE-350", "Death Certificate"],
        dependencies: ["file_petition"],
        links: [{
          label: "Download DE-350",
          url: "https://www.courts.ca.gov/documents/de350.pdf"
        }],
        alerts: [{
          type: "important",
          message: "Guardian ad litem must approve all actions affecting minors' inheritance."
        }]
      },
      {
        id: "obtain_guardian_order",
        title: "Obtain Guardian Ad Litem Order (DE-351)",
        description: "Receive court order appointing guardian ad litem. Provide guardian with all estate information.",
        estimatedTime: "2-3 weeks",
        category: "court-issued",
        isOptional: true,
        requiredDocs: ["DE-351"],
        dependencies: ["petition_guardian_ad_litem"],
        links: [{
          label: "Download DE-351",
          url: "https://www.courts.ca.gov/documents/de351.pdf"
        }],
        alerts: [{
          type: "info",
          message: "Guardian ad litem fees are paid by the estate, typically $150-300/hour."
        }]
      },
      {
        id: "file_succession_petition",
        title: "File Petition to Determine Succession (DE-310)",
        description: "File petition with court to determine who inherits the primary residence without full probate.",
        estimatedTime: "2-4 hours",
        category: "probate",
        exclusiveGroup: "filing_path",
        isOptional: true,
        requiredDocs: ["DE-310", "Death Certificate", "Property Deed"],
        links: [{
          label: "Download DE-310",
          url: "https://www.courts.ca.gov/documents/de310.pdf"
        }],
        alerts: [{
          type: "info",
          message: "Filing fee: ~$435. Hearing typically scheduled 30-45 days after filing."
        }]
      },
      {
        id: "give_succession_notice",
        title: "Give Notice of Hearing (DE-120)",
        description: "Notify all interested parties of the hearing date for the succession petition.",
        estimatedTime: "2 hours",
        category: "probate",
        isOptional: true,
        dependencies: ["file_succession_petition"],
        requiredDocs: ["DE-120"],
        links: [{
          label: "Download DE-120",
          url: "https://www.courts.ca.gov/documents/de120.pdf"
        }],
        alerts: [{
          type: "important",
          message: "Notice must be mailed at least 15 days before the hearing."
        }]
      },
      {
        id: "obtain_succession_order",
        title: "Obtain Order Determining Succession (DE-315)",
        description: "Receive court order determining property succession. Record order with county recorder.",
        estimatedTime: "1-2 weeks after hearing",
        category: "court-issued",
        isOptional: true,
        requiredDocs: ["DE-315"],
        dependencies: ["file_succession_petition", "give_succession_notice"],
        links: [{
          label: "Download DE-315",
          url: "https://www.courts.ca.gov/documents/de315.pdf"
        }],
        alerts: [{
          type: "important",
          message: "Record certified copy of order with county recorder to transfer title."
        }]
      },
      {
        id: "track_special_notice_requests",
        title: "Track Special Notice Requests (DE-154)",
        description: "Maintain list of all parties who have requested special notice. You must serve them copies of ALL court filings.",
        estimatedTime: "Ongoing",
        isLongHorizon: true,
        category: "probate",
        isOptional: true,
        dependencies: ["file_petition"],
        requiredDocs: ["DE-154", "DE-130"],
        links: [{
          label: "Download DE-154",
          url: "https://www.courts.ca.gov/documents/de154.pdf"
        }],
        alerts: [{
          type: "warning",
          message: "Failure to serve special notice can invalidate court orders. Keep meticulous records."
        }]
      },
      {
        id: "serve_special_notice_parties",
        title: "Serve All Special Notice Recipients",
        description: "Each time you file a document with the court, serve copies on all parties who requested special notice.",
        estimatedTime: "1-2 hours per filing",
        isLongHorizon: true,
        isOptional: true,
        dependencies: ["track_special_notice_requests"],
        alerts: [{
          type: "important",
          message: "Service must be by mail with proof of service filed with court."
        }]
      },
      {
        id: "request_bond_waiver",
        title: "Request Bond Waiver from Heirs (DE-142)",
        description: "Ask all heirs to sign waivers of bond requirement. Bond costs 0.5-1% of estate value annually.",
        utility: "Cost Savings: Eliminate bond premium (typically $500-$5,000/year).",
        estimatedTime: "1-2 weeks",
        category: "probate",
        isOptional: true,
        requiredDocs: ["DE-142"],
        dependencies: ["file_petition"],
        links: [{
          label: "Download DE-142",
          url: "https://www.courts.ca.gov/documents/de142.pdf"
        }],
        alerts: [{
          type: "info",
          message: "ALL heirs must sign. If even one refuses, bond is required."
        }]
      },
      {
        id: "file_bond_waiver",
        title: "File Waiver of Bond (DE-142)",
        description: "Submit signed waivers to court and request order waiving bond requirement.",
        estimatedTime: "1 day",
        category: "probate",
        isOptional: true,
        requiredDocs: ["DE-142"],
        dependencies: ["request_bond_waiver"],
        alerts: [{
          type: "important",
          message: "File before probate hearing to avoid bond requirement in initial order."
        }]
      },
      {
        id: "obtain_bond_waiver_order",
        title: "Obtain Order Waiving Bond (DE-143)",
        description: "Verify that the court has officially waived the bond requirement, typically reflected in a separate Order (DE-143) or the Order for Probate.",
        estimatedTime: "At hearing",
        category: "court-issued",
        isOptional: true,
        requiredDocs: ["DE-143", "DE-140"],
        dependencies: ["file_bond_waiver"],
        alerts: [{
          type: "info",
          message: "The bond waiver is officially granted within the Order for Probate (DE-140) or a specific Bond Order (DE-143)."
        }]
      },
      {
        id: "respond_to_objections",
        title: "Respond to Objections (DE-115/116)",
        description: "If someone files an objection to the petition or will, you must respond formally and prepare for contest hearing.",
        estimatedTime: "2-4 weeks",
        category: "probate",
        isOptional: true,
        requiredDocs: ["DE-115", "DE-116"],
        dependencies: ["file_petition"],
        links: [{
          label: "Download DE-115",
          url: "https://www.courts.ca.gov/documents/de115.pdf"
        }],
        alerts: [{
          type: "warning",
          message: "Hire an attorney immediately. Will contests are complex and high-stakes."
        }]
      },
      {
        id: "attend_contest_hearing",
        title: "Attend Will Contest Hearing",
        description: "Appear in court for hearing on objection. Be prepared to present evidence supporting will validity.",
        estimatedTime: "4-8 hours",
        isOptional: true,
        dependencies: ["respond_to_objections"],
        alerts: [{
          type: "important",
          message: "Bring all witnesses who can testify to decedent's mental capacity and lack of undue influence."
        }]
      },
      {
        id: "resolve_contest",
        title: "Resolve Will Contest",
        description: "Obtain court ruling on objection. If will is upheld, proceed with probate. If invalidated, estate becomes intestate.",
        estimatedTime: "Varies (can take 6-24 months)",
        isLongHorizon: true,
        isOptional: true,
        dependencies: ["attend_contest_hearing"],
        alerts: [{
          type: "caution",
          message: "Contested probate significantly extends timeline and increases costs. Consider settlement."
        }]
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
      },
      // International Mode - Tax
      {
        id: "tax_withholding_review",
        title: "International Tax Withholding Review",
        description: "Identify beneficiary residency and citizenship to determine if 30% withholding applies.",
        estimatedTime: "1-2 weeks",
        isInternationalOnly: true,
        alerts: [
          {
            type: "caution",
            message: "Institutions may over-withhold by default for foreign beneficiaries. Review treaty benefits before distribution."
          }
        ]
      },
      {
        id: "coordinate_with_guardian",
        title: "Coordinate with Guardian Ad Litem",
        description: "Keep guardian informed of all estate actions. Obtain guardian's approval before major decisions affecting minors.",
        estimatedTime: "Ongoing",
        isLongHorizon: true,
        isOptional: true,
        dependencies: ["obtain_guardian_order"],
        alerts: [{
          type: "caution",
          message: "Guardian must review and approve inventory, accounting, and distribution plans."
        }]
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
        id: "prepare_notice_proposed_action",
        title: "Prepare Notice of Proposed Action (DE-165)",
        description: "If you have Independent Administration of Estates Act (IAEA) authority, you must notify heirs of your intent to sell real property.",
        estimatedTime: "1 week",
        category: "probate",
        isOptional: true,
        requiredDocs: ["DE-165"],
        links: [{
          label: "Download DE-165",
          url: "https://www.courts.ca.gov/documents/de165.pdf"
        }],
        alerts: [{
          type: "info",
          message: "Heirs have 15 days to object. If no one objects, you can proceed without a court hearing."
        }]
      },
      {
        id: "wait_proposed_action_period",
        title: "Wait for 15-Day Objection Period",
        description: "Mandatory waiting period after serving Notice of Proposed Action to allow heirs to respond or object.",
        estimatedTime: "15 days",
        isLongHorizon: true,
        isOptional: true,
        dependencies: ["prepare_notice_proposed_action"]
      },
      {
        id: "petition_confirm_sale",
        title: "File Petition to Confirm Sale (DE-260)",
        description: "If you do NOT have IAEA authority, or if someone objects, you must petition the court to confirm the sale of real property.",
        estimatedTime: "2-4 hours",
        category: "probate",
        isOptional: true,
        requiredDocs: ["DE-260"],
        links: [{
          label: "Download DE-260",
          url: "https://www.courts.ca.gov/documents/de260.pdf"
        }],
        alerts: [{
          type: "warning",
          message: "Court-confirmed sales include an 'overbid' process where others can outbid the buyer at the hearing."
        }]
      },
      {
        id: "obtain_sale_confirmation_order",
        title: "Obtain Sale Confirmation Order (DE-265)",
        description: "Receive signed court order confirming the real estate sale and allowing the close of escrow.",
        estimatedTime: "1-2 weeks after hearing",
        category: "court-issued",
        isOptional: true,
        dependencies: ["petition_confirm_sale"],
        requiredDocs: ["DE-265"]
      },
      {
        id: "sell_property",
        title: "Complete Property Sale & Close Escrow",
        description: "Finalize the sale of real estate, sign closing documents, and receive sale proceeds into the estate account.",
        estimatedTime: "4-8 weeks",
        isOptional: true,
        dependencies: ["obtain_sale_confirmation_order", "wait_proposed_action_period"],
        requiredDocs: ["Final Hud-1/Closing Statement"]
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
        id: "guardian_distribution_approval",
        title: "Obtain Guardian Approval for Distribution",
        description: "Present final distribution plan to guardian ad litem for review and approval before court hearing.",
        estimatedTime: "1-2 weeks",
        isOptional: true,
        dependencies: ["file_final_petition"],
        alerts: [{
          type: "important",
          message: "Guardian will verify that minors' shares are properly protected in blocked accounts."
        }]
      },
      {
        id: "blocked_account_minors",
        title: "Setup Blocked Accounts for Minors",
        description: "Ensure funds for minor beneficiaries are placed in court-approved blocked accounts.",
        estimatedTime: "2 weeks",
        isOptional: true,
        alerts: [{
          type: "important",
          message: "Required by court if distributions are made directly to minors."
        }]
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
      // International Mode - Distribution
      {
        id: "international_distribution_prep",
        title: "Prepare International Distribution",
        description: "Collect exact beneficiary bank details, Swift codes, and pre-validate wire requirements.",
        estimatedTime: "2-3 weeks",
        isInternationalOnly: true,
        dependencies: ["pay_taxes"],
        alerts: [
          {
            type: "warning",
            message: "International wires are strictly scrutinized. Ensure 'Exact Name Match' on all accounts."
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

