// Type definition (moved here to avoid importing from React component in server code)
export type SettlementPhase = string;

import { AuthorityType, MasterMode } from "../lib/authorityEngine.js";

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
  rationale?: string; // "Why This Matters" expander content

  // Semantic Categories (Gap D)
  tags?: ("statutory" | "fiduciary" | "communication" | "tax" | "court-order" | "risk-guardrail")[];
  applicability?: {
    masterModes?: MasterMode[];
    authorityTypes?: AuthorityType[];
    states?: string[];
  };
  isInternationalOnly?: boolean; // New flag for International Mode
  requiresAuthority?: boolean;  // Blocks until Letters Testamentary (DE-150)
  isAttorneyReviewNode?: boolean; // Highlight mandatory/recommended checkpoints
  attorneyReviewReason?: string; // Specific reason for attorney review (e.g. "Litigation Risk")
  milestone?: string;           // Human-readable milestone label (e.g. "After Authority Issued")
  trackCompatibility?: ("PROBATE" | "TRUST" | "AFFIDAVIT" | "NON_PROBATE")[];
  isConditional?: boolean;     // Mandatory IF a specific condition is met
  conditionalRequirementLabel?: string; // e.g. "Required if minors have interests"
  requiresNotary?: boolean;    // Task requires notarization
  requiresPhysicalMail?: boolean; // Task requires certified/physical mail
  primaryActionLabel?: string;  // Label for the primary action button
  primaryActionUrl?: string;    // URL or route for the primary action button
  formNames?: string[];         // List of form names related to this task
  stateOverrides?: {
    [stateCode: string]: {
      title?: string;
      description?: string;
      formNames?: string[];
      primaryActionLabel?: string;
      primaryActionUrl?: string;
      links?: { label: string; url: string; }[];
    }
  };
}

export interface PhaseTaskList {
  phase: SettlementPhase;
  title: string;
  subtitle: string;
  milestone: string;
  description: string;
  tasks: PhaseTask[];
  isEscalationPath?: boolean; // Flag for phases that are secondary/contingency paths
}

export const SETTLEMENT_PHASE_TASKS: PhaseTaskList[] = [
  {
    phase: "immediate_actions",
    title: "Strategic Assessment",
    subtitle: "Secure & Notify",
    milestone: "Death to Filing",
    description: "Evaluate the estate's characteristics before taking irrevocable actions.",
    tasks: [
      {
        id: "preliminary_asset_scan",
        title: "Preliminary Asset & Liability Scan",
        description: "Identify known bank accounts, real estate, and major debts. This data is critical for estimating estate value on the petition and determining bond requirements.",
        estimatedTime: "2-4 hours",
        trackCompatibility: ["PROBATE", "TRUST", "AFFIDAVIT"],
        alerts: [{
          type: "important",
          message: "Pre-Filing Requirement: Accurate estimates prevent petition amendments and delays in bond approval."
        }]
      },
      {
        id: "check_small_estate",
        title: "Evaluate Small Estate Eligibility",
        description: "Determine if total assets are under the state's small estate threshold. This may allow for a simplified Affidavit process, bypassing full probate.",
        utility: "Shortcut: Avoid full probate if the estate is small enough.",
        estimatedTime: "1 hour",
        exclusiveGroup: "filing_path",
        trackCompatibility: ["PROBATE", "AFFIDAVIT"],
        isOptional: true,
        helpArticleId: "small-estate-ca",
        primaryActionLabel: "Prepare Affidavit",
        primaryActionUrl: "/affidavit",
        formNames: ["Small Estate Affidavit"],
        alerts: [{
          type: "info",
          message: "Small estate limits vary by state (e.g., $184,500 in CA as of 2023)."
        }]
      },
      {
        id: "confirm_executor_role",
        title: "Confirm Executor/Trustee Role",
        description: "Review the Will or Trust to confirm your appointment and willingness to serve.",
        estimatedTime: "2 hours",
        trackCompatibility: ["PROBATE", "TRUST"],
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
        trackCompatibility: ["PROBATE"],
        isOptional: true, // Controlled by filtering logic based on profile
        alerts: [{
          type: "important",
          message: "Estates with minor beneficiaries require additional court oversight and blocked accounts."
        }]
      },
      {
        id: "check_primary_residence_succession",
        title: "Evaluate Primary Residence Succession",
        description: "If the estate consists primarily of a primary residence valued under $100,000, you may qualify for the simplified Succession process (DE-310/315).",
        utility: "Shortcut: Simplified path for qualifying primary residences.",
        estimatedTime: "1 hour",
        exclusiveGroup: "filing_path",
        trackCompatibility: ["PROBATE"],
        isOptional: true,
        helpArticleId: "primary-residence-succession",
        alerts: [{
          type: "important",
          message: "This procedure is limited to primary residences. Other assets require different pathways."
        }]
      },
      {
        id: "secure_property_2",
        title: "Initial Property Protection",
        description: "Ensure the decedent's residence is secured, mail is forwarded, and assets are protected from loss or damage.",
        estimatedTime: "1-2 days",
        alerts: [
          {
            type: "important",
            message: "Vacant homes are high-risk for theft and insurance claims. Act immediately."
          }
        ]
      },
      {
        id: "check_tod_recordation",
        title: "Verify TOD Deed Recordation Date",
        description: "Statutory Rule: A TOD deed must be recorded before the owner's death to be legally valid. Confirm the 'Date Filed' on the deed.",
        estimatedTime: "30 minutes",
        trackCompatibility: ["NON_PROBATE"],
        alerts: [{
          type: "important",
          message: "Deed Invalidality Alert: If the recording date is after the date of death, the TOD deed is void and the property must go through probate."
        }]
      },
      {
        id: "check_tod_revocation",
        title: "Confirm No Subsequent Revocation",
        description: "Check for any subsequently recorded 'Revocation of TOD Deed' or a newer TOD deed that might override the current one.",
        estimatedTime: "1 hour",
        trackCompatibility: ["NON_PROBATE"],
        isAttorneyReviewNode: true,
        attorneyReviewReason: "Legal Conflict: Multiple recorded deeds or revocations create high litigation risk and title clouds."
      },
      {
        id: "check_beneficiary_survival",
        title: "Confirm Beneficiary Survival Status",
        description: "Verify the named TOD beneficiary survived the transferor. If the beneficiary predeceased, the TOD deed typically fails unless 'Anti-Lapse' rules apply.",
        estimatedTime: "1 hour",
        trackCompatibility: ["NON_PROBATE"],
        alerts: [{
          type: "warning",
          message: "Survival Requirement: If the beneficiary died before the transferor, the property likely escapes the TOD track and enters the Probate track."
        }]
      },
      {
        id: "check_joint_tenancy_override",
        title: "Check for Joint Tenancy Override",
        description: "Verify the property was not held in Joint Tenancy at the time of death. In many states, Joint Tenancy survivorship overrides a TOD deed.",
        estimatedTime: "1 hour",
        trackCompatibility: ["NON_PROBATE"],
        isAttorneyReviewNode: true,
        attorneyReviewReason: "Title Priority: Joint Tenancy with Right of Survivorship usually trumps TOD deeds, which can invalidate the transfer."
      },
      {
        id: "prepare_beneficiary_authority_packet",
        title: "Establish Beneficiary Transfer Authority",
        description: "Instead of 'Letters Testamentary', the TOD beneficiary uses a 'Transfer Packet' to claim title.",
        estimatedTime: "2-4 hours",
        trackCompatibility: ["NON_PROBATE"],
        requiredDocs: ["Certified Death Certificate", "Recorded TOD Deed copy", "Affidavit of Death of Transferor", "PCOR Form"],
        alerts: [{
          type: "info",
          message: "This packet replaces court-issued authority and is presented to the county recorder or title company."
        }]
      },
      {
        id: "escalate_to_probate_trigger",
        title: "PROBATE ESCALATION: Deed Issue Detected",
        description: "If any of the validation checks failed (unrecorded deed, predeceased beneficiary, joint tenancy conflict), you must pivot to a formal probate petition.",
        estimatedTime: "Ongoing",
        trackCompatibility: ["NON_PROBATE"],
        isConditional: true,
        conditionalRequirementLabel: "Required IF TOD validation fails",
        alerts: [{
          type: "caution",
          message: "Escalation Path: Bypassing probate is only legal when the TOD deed is perfectly valid. If not, court intervention is mandatory."
        }]
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
        id: "record_affidavit_of_death",
        title: "Record Affidavit of Death (TOD)",
        description: "Prepare and record an Affidavit of Death of Transferor to formally transfer title to the TOD beneficiary.",
        estimatedTime: "2-4 hours",
        requiredDocs: ["Death Certificate", "Affidavit of Death", "Recorded TOD Deed"],
        trackCompatibility: ["NON_PROBATE"],
        links: [{
          label: "About TOD Affidavits",
          url: "https://www.courts.ca.gov/documents/de165.pdf"
        }]
      },
      {
        id: "notify_recorder_assessor",
        title: "Notify County Recorder & Assessor",
        description: "Submit Change in Ownership Statement to the county to update tax records and prevent penalties.",
        estimatedTime: "1 hour",
        trackCompatibility: ["NON_PROBATE"],
        requiredDocs: ["BOE-502-A"],
        alerts: [{
          type: "warning",
          message: "Missing the property tax reassessment deadline can lead to significant penalties."
        }]
      },
      {
        id: "cancel_cards",
        title: "Cancel Credit Cards & Subscriptions",
        description: "Stop recurring charges and prevent identity theft by closing accounts.",
        estimatedTime: "2-3 hours",
        alerts: [
          {
            type: "warning",
            message: "Fiduciary Caution: While recurring charges should stop, avoid paying off large unsecured credit card balances from estate funds until the 4-month creditor period has expired and solvency is confirmed."
          }
        ]
      },
      {
        id: "manage_utilities",
        title: "Manage Utilities",
        description: "Review decedent's utility accounts (electricity, water, gas).",
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
        isOptional: true,
        alerts: [
          {
            type: "info",
            message: "Check safe deposit boxes, home safes, attorney offices, and online storage."
          }
        ]
      },
      {
        id: "locate_docs_no_will",
        title: "Locate Important Documents (Intestate)",
        description: "Since there is no Will, search for insurance policies, real estate deeds, and final account statements to inventory the estate.",
        estimatedTime: "1-2 days",
        isOptional: true,
        alerts: [
          {
            type: "info",
            message: "Double-check for a hidden Will just in case. If one is found later, it could change everything."
          }
        ]
      },
      {
        id: "open_estate_account",
        title: "Establish Estate Financial Account",
        description: "Open a separate fiduciary account for estate income and expenses once legal authority is obtained.",
        estimatedTime: "1 hour",
        requiresAuthority: true,
        requiredDocs: ["Death Certificate", "Letters (DE-150)", "EIN"],
        alerts: [
          {
            type: "important",
            message: "Fiduciary Duty: Estate funds must never be commingled with personal funds."
          }
        ]
      },
      {
        id: "pay_immediate_bills",
        title: "Managed Payment of Immediate Bills",
        description: "Prioritize current utilities, mortgage, and insurance to protect the value of estate assets.",
        estimatedTime: "Ongoing",
        alerts: [
          {
            type: "warning",
            message: "Fiduciary Caution: While recurring charges should stop, avoid paying off large unsecured credit card balances from estate funds until the 4-month creditor period has expired and solvency is confirmed."
          },
          {
            type: "warning",
            message: "Only use estate-related funds for these payments and maintain meticulous records for the final accounting."
          }
        ]
      },
      {
        id: "obtain_ein_probate",
        title: "Obtain EIN for the Estate",
        description: "Apply for an Employer Identification Number from the IRS. This unique ID is required to open an estate bank account and for all tax filings.",
        estimatedTime: "30 minutes",
        tags: ["tax", "statutory"],
        requiredDocs: ["IRS Form SS-4"],
        trackCompatibility: ["PROBATE"],
        alerts: [{
          type: "important",
          message: "Critical Infrastructure: You cannot open a fiduciary bank account without an EIN. Apply online for immediate issuance."
        }],
        links: [{
          label: "Apply for EIN Online (IRS)",
          url: "https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online"
        }]
      },
      {
        id: "file_irs_form_56_probate",
        title: "File IRS Form 56 (Notice of Fiduciary)",
        description: "Formally notify the IRS that you have taken on the role of Executor/Administrator. This ensures that all tax correspondence regarding the decedent is sent to you.",
        estimatedTime: "1 hour",
        tags: ["tax", "fiduciary"],
        requiredDocs: ["IRS Form 56", "Certified Letters (DE-150)"],
        trackCompatibility: ["PROBATE"],
        alerts: [{
          type: "info",
          message: "Compliance Tip: This protects you from missing critical IRS deadlines by routing notices to your address."
        }],
        links: [{
          label: "Download IRS Form 56",
          url: "https://www.irs.gov/pub/irs-pdf/f56.pdf"
        }]
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
        title: "Verify Notarization Rules (Apostille)",
        description: "Check if your current country of residence is a member of the Hague Apostille Convention. This determines how documents signed abroad must be authenticated for U.S. court acceptance.",
        estimatedTime: "1 hour",
        isInternationalOnly: true,
        links: [
          {
            label: "Check HCCH Member States",
            url: "https://www.hcch.net/en/instruments/conventions/status-table/?cid=41"
          }
        ],
        alerts: [
          {
            type: "warning",
            message: "Foreign notarization without an Apostille is frequently rejected by U.S. banks and courts."
          }
        ]
      }
    ]
  },
  {
    phase: "court_filing",
    title: "Petition & Authority",
    subtitle: "Obtaining Powers",
    milestone: "After Petition Filed",
    description: "Submitting the probate petition to the court to obtain official fiduciary authority (Letters).",
    tasks: [
      {
        id: "file_petition",
        title: "File Petition for Probate (DE-111)",
        description: "Submit the probate petition to the Superior Court to open the estate case.",
        utility: "Required to obtain legal authority to access accounts.",
        estimatedTime: "2-4 hours",
        category: "probate",
        trackCompatibility: ["PROBATE"],
        exclusiveGroup: "filing_path",
        helpArticleId: "probate-steps",
        primaryActionLabel: "Generate DE-111",
        primaryActionUrl: "/probate",
        formNames: ["DE-111", "DE-121"],
        requiredDocs: [
          "Original Will",
          "Death Certificate",
          "DE-111",
          "DE-121"
        ],
        alerts: [
          {
            type: "info",
            message: "Check your local court for the current filing fee. File within the state's recommended timeframe."
          }
        ],
        links: [
          {
            label: "Download DE-111",
            url: "https://www.courts.ca.gov/documents/de111.pdf"
          }
        ],
        stateOverrides: {
          "NY": {
            title: "File Petition for Probate (ET-1)",
            description: "Submit the ET-1 petition to the Surrogate's Court.",
            formNames: ["ET-1"]
          },
          "FL": {
            title: "File Petition for Administration (FL-1)",
            description: "Submit the FL-1 petition to the local circuit court.",
            formNames: ["FL-1"]
          },
          "TX": {
            title: "File Application for Probate (TX-1)",
            description: "Submit the TX-1 application to the probate court.",
            formNames: ["TX-1"]
          }
        }
      },
      {
        id: "publish_notice",
        title: "Publish Creditor Notice",
        description: "Publish notice in a local newspaper for 3 consecutive weeks to notify creditors.",
        estimatedTime: "1 week",
        trackCompatibility: ["PROBATE"],
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
        title: "Establish Fiduciary Authority (DE-150)",
        description: "Obtain certified copies of the Letters—this document is your legal evidence of authority to manage estate assets.",
        requiresAuthority: true,
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
        title: "File Small Estate Affidavit",
        description: "For estates under threshold, use this shortcut to bypass court probate.",
        utility: "Bypass court entirely for qualifying small estates.",
        estimatedTime: "40 days after death",
        category: "court-issued",
        exclusiveGroup: "filing_path",
        isConditional: true,
        conditionalRequirementLabel: "Available if estate value is below state small estate threshold",
        helpArticleId: "small-estate-affidavit",
        requiredDocs: ["DE-310", "Death Certificate"]
      },
      {
        id: "file_spousal_petition",
        title: "File Spousal Property Petition (DE-221)",
        description: "Request court order to transfer property to surviving spouse without full probate.",
        estimatedTime: "4-6 weeks",
        category: "probate",
        isConditional: true,
        conditionalRequirementLabel: "Required if property is being transferred to a surviving spouse or domestic partner",
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
        isConditional: true,
        conditionalRequirementLabel: "Required if decedent owned an ongoing business",
        isAttorneyReviewNode: true,
        attorneyReviewReason: "Complex Asset: Continuing business operations involves significant fiduciary risk and employment law compliance.",
        alerts: [{ type: "important", message: "Do not let business operations lapse; it can severely devalue the estate." }]
      },
      {
        id: "petition_guardian_ad_litem",
        title: "File Petition for Guardian Ad Litem (DE-350)",
        description: "Request court appointment of a guardian ad litem to represent minor beneficiaries' interests throughout probate.",
        estimatedTime: "2-4 hours",
        category: "probate",
        isConditional: true,
        isOptional: true, // Controlled by filtering logic based on profile
        conditionalRequirementLabel: "Required if minors have interests",
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
          message: "Check local court filing fees. Hearing typically scheduled 30-45 days after filing."
        }]
      },
      {
        id: "give_succession_notice",
        title: "Give Notice of Hearing (DE-120)",
        description: "Notify all interested parties of the hearing date for the succession petition.",
        estimatedTime: "2 hours",
        category: "probate",
        exclusiveGroup: "filing_path",
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
        exclusiveGroup: "filing_path",
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
        description: "Each time you file a document with the court, serve copies by mail on all parties who requested special notice.",
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
        id: "handle_bond_waivers",
        title: "Avoid Bond Cost (DE-142)",
        description: "Obtain signatures from all heirs to waive the bond requirement, then file the completed DE-142 with the court.",
        utility: "Cost Savings: Eliminate bond premium (typically $500-$5,000/year).",
        estimatedTime: "1-2 weeks",
        category: "probate",
        isConditional: true,
        conditionalRequirementLabel: "Recommended to save on bond premiums if all heirs agree to waive",
        requiredDocs: ["DE-142"],
        dependencies: ["file_petition"],
        links: [{
          label: "Download DE-142",
          url: "https://www.courts.ca.gov/documents/de142.pdf"
        }],
        alerts: [{
          type: "important",
          message: "Action Required: ALL heirs must sign. File the completed waivers before the hearing."
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
        dependencies: ["handle_bond_waivers"],
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
        isOptional: true, // Controlled by profile.isContested
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
        description: "Obtain court ruling on objection. If will is upheld, proceed with probate. If invalidated, estate becomes intestate. Contested probate can extend the timeline by 6-24 months.",
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
    milestone: "After Letters Issued",
    description: "Identify all assets within the estate's jurisdiction and obtain formal Date-of-Death valuations.",
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
        title: "Coordinate with Financial Institutions",
        description: "Provide notice of your fiduciary authority to banks, brokerages, and insurance companies to secure accounts.",
        estimatedTime: "2-4 weeks",
        requiresAuthority: true,
        requiredDocs: ["Death Certificate", "Letters (DE-150)"],
        alerts: [
          {
            type: "important",
            message: "This step formalizes your control over assets and locks in values for reporting purposes."
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
            type: "info",
            message: "Recommended: Consult with counsel before filing the Inventory & Appraisal to ensure all assets are correctly categorized."
          },
          {
            type: "warning",
            message: "Due within 4 months of Letters issuance. Delays in filing can impede the overall settlement timeline."
          }
        ],
        isAttorneyReviewNode: true
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
    subtitle: "Notice & Priority",
    milestone: "After Notice Published",
    description: "Managing the statutory creditor period and determining the legal priority of submitted claims.",
    tasks: [
      {
        id: "debt_priority_risk",
        title: "FIDUCIARY RISK: Statutory Debt Priority",
        description: "Evaluate claims according to legal priority (e.g., administration costs, taxes, then general debts).",
        isAttorneyReviewNode: true,
        trackCompatibility: ["PROBATE", "TRUST", "NON_PROBATE"],
        alerts: [{
          type: "caution",
          message: "Liability Alert: Do NOT pay any debts until the statutory notice period has expired and priority is confirmed."
        }]
      },
      {
        id: "intl_w8_assessment",
        title: "International Fiduciary: W-8BEN/W-8CE Assessment",
        description: "For non-resident executors or beneficiaries, determine U.S. tax withholding requirements and treaty eligibility.",
        isInternationalOnly: true,
        isAttorneyReviewNode: true,
        attorneyReviewReason: "Tax Risk: Foreign beneficiary withholding is strictly enforced by the IRS and requires specific treaty analysis.",
        trackCompatibility: ["PROBATE", "TRUST"],
        alerts: [{
          type: "important",
          message: "Tax Liability: Failure to withhold correctly can result in the executor being personally liable for the tax."
        }]
      },
      {
        id: "itin_acquisition_protocol",
        title: "International Fiduciary: ITIN Acquisition Protocol",
        description: "Identify foreign beneficiaries without a SSN/ITIN. Coordinate acquisition of U.S. Individual Taxpayer Identification Numbers to avoid maximum backup withholding on distributions.",
        isInternationalOnly: true,
        trackCompatibility: ["PROBATE", "TRUST"],
        alerts: [{
          type: "info",
          message: "Wait times for ITINs can exceed 12 weeks. Start this process as soon as beneficiaries are identified."
        }]
      },
      {
        id: "evaluate_solvency",
        title: "Evaluate Estate Solvency",
        description: "Compare total assets to total liabilities and funeral/admin expenses.",
        estimatedTime: "2-3 hours",
        isAttorneyReviewNode: true,
        attorneyReviewReason: "Fiduciary Risk: If the estate is insolvent, the legal priority of payments changes. Paying the wrong creditor first is a major source of personal liability.",
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
        isAttorneyReviewNode: true,
        alerts: [
          {
            type: "important",
            message: "Recommended Attorney Review: Rejecting a claim can lead to litigation. Consult with counsel before issuing a rejection notice."
          },
          {
            type: "caution",
            message: "California law provides specific timeframes for approving or rejecting claims. Verify compliance with statutory deadlines."
          }
        ]
      },
      {
        id: "tod_creditor_review",
        title: "⚠️ Creditor Exposure Assessment",
        description: "Silent Legal Check: Evaluate potential beneficiary liability for decedent's debts. This is NOT a formal probate claim process, but a risk assessment of statutory 'clawback' provisions.",
        estimatedTime: "1-2 weeks",
        trackCompatibility: ["NON_PROBATE"],
        isAttorneyReviewNode: true,
        attorneyReviewReason: "Insolvency Risk: If the probate estate is empty, creditors may sue TOD beneficiaries directly. This review determines your personal exposure.",
        alerts: [
          {
            type: "caution",
            message: "Clawback Risk: In many states, creditors have 1 year to pursue TOD assets if the estate cannot pay debts."
          },
          {
            type: "important",
            message: "This is a 'Silent' review. Do NOT publish notice to creditors unless you escalate to formal probate."
          }
        ]
      },
      {
        id: "evaluate_and_document_claims",
        title: "Document Claim Evaluation & Decision",
        description: "Formally evaluate each timely creditor claim. Document whether the claim is allowed in full, partially allowed, or rejected.",
        isAttorneyReviewNode: true,
        attorneyReviewReason: "Litigation Risk: Formal claim rejection (DE-174) triggers a strict 90-day litigation window for the creditor. Legal defense strategy is critical here.",
        trackCompatibility: ["PROBATE", "TRUST"],
        alerts: [{
          type: "caution",
          message: "Legal Decision Guardrail: Formal claim rejection (DE-174) triggers a strict 90-day litigation window for the creditor. Consult with an attorney before issuing a formal rejection."
        }]
      },
      {
        id: "reject_invalid",
        title: "Reject Invalid Claims",
        description: "File formal rejections for claims that are incorrect, unsupported, or time-barred.",
        estimatedTime: "1 week",
        isConditional: true,
        conditionalRequirementLabel: "Required if creditor claims are invalid or disputed",
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
    milestone: "Month 6-12",
    description: "Present Letters to institutions, transfer or sell assets, and pay final bills.",
    tasks: [
      {
        id: "minor_beneficiary_court_approval",
        title: "Obtain Court Approval for Minor Distributions",
        description: "Distributions to minors usually require a guardianship or court order to be placed in a blocked account.",
        estimatedTime: "4-8 weeks",
        isConditional: true,
        conditionalRequirementLabel: "Required if any beneficiaries are under age 18",
        isAttorneyReviewNode: true,
        attorneyReviewReason: "Malpractice Risk: Minor beneficiaries have special statutory protections. Distributing without court-approved blocked accounts triggers personal liability.",
        category: "probate",
        alerts: [{
          type: "important",
          message: "Minors cannot receive distributions directly. Funds must be placed in court-approved blocked accounts until age 18."
        }]
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
        isConditional: true,
        conditionalRequirementLabel: "Required if estate owns real property and intention is to sell",
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
        isConditional: true,
        conditionalRequirementLabel: "Mandatory waiting period for heirs to object to proposed sale",
        dependencies: ["prepare_notice_proposed_action"]
      },
      {
        id: "petition_confirm_sale",
        title: "File Petition to Confirm Sale (DE-260)",
        description: "If you do NOT have IAEA authority, or if someone objects, you must petition the court to confirm the sale of real property.",
        estimatedTime: "2-4 hours",
        category: "probate",
        isConditional: true,
        conditionalRequirementLabel: "Required if IAEA authority is limited or restricted",
        isAttorneyReviewNode: true,
        attorneyReviewReason: "Real Estate Sale: Sales without full IAEA authority require complex court confirmation and overbid procedures.",
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
        isConditional: true,
        conditionalRequirementLabel: "Required if court-confirmed sale was necessary",
        isAttorneyReviewNode: true,
        attorneyReviewReason: "Real Estate Sale: The court order (DE-265) is a title-clearing document. Errors here can break's the buyer's title and lead to litigation.",
        dependencies: ["petition_confirm_sale"],
        requiredDocs: ["DE-265"]
      },
      {
        id: "sell_property",
        title: "Complete Property Sale & Close Escrow",
        description: "Finalize the sale of real estate, sign closing documents, and receive sale proceeds into the estate account.",
        estimatedTime: "4-8 weeks",
        isConditional: true,
        conditionalRequirementLabel: "Required if estate owns real property",
        isAttorneyReviewNode: true,
        attorneyReviewReason: "Fiduciary Risk: Property sales are often the largest transactions in an estate. Mismatched closing statements or tax withholding errors create high liability.",
        dependencies: ["obtain_sale_confirmation_order", "wait_proposed_action_period"],
        requiredDocs: ["Final Hud-1/Closing Statement"]
      },
      {
        id: "file_form_1041",
        title: "File Form 1041 (Fiduciary Income Tax)",
        description: "Report income, deductions, and credits for a trust or estate that has gross income of $600 or more in a tax year.",
        estimatedTime: "4-8 hours",
        tags: ["tax", "statutory"],
        trackCompatibility: ["PROBATE", "TRUST"],
        applicability: {
          authorityTypes: ["TRUST_ADMIN_IRREVOCABLE", "TRUST_ADMIN_REVOCABLE", "FORMAL_PROBATE", "INFORMAL_PROBATE"]
        },
        alerts: [
          { type: "important", message: "Required for irrevocable trusts and estates with significant income. Consult a tax professional." },
          { type: "info", message: "Note: Income is taxed at much higher brackets in an estate than for an individual." }
        ]
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
    milestone: "Month 6-12",
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

/**
 * TRUST ADMINISTRATION - 6-STATE MACHINE
 * 
 * Trust admin is fundamentally different from probate:
 * - Authority comes from trust instrument + death certificate, NOT court
 * - No DE-111 petition, no DE-150 Letters required
 * - Probate is only an escalation when trust funding fails
 */
export const MODIFIER_PHASE_TASKS: PhaseTaskList[] = [
  {
    phase: "ancillary_phase",
    title: "Ancillary / Multi-State",
    subtitle: "Out-of-State Property",
    milestone: "After Primary Filing",
    description: "Coordinate with other jurisdictions where the decedent owned real estate or titled assets.",
    isEscalationPath: true,
    tasks: [
      {
        id: "identify_out_of_state_assets",
        title: "Identify Out-of-State Assets",
        description: "Verify all real property and titled assets located outside of the primary probate state.",
        estimatedTime: "2-4 hours",
        alerts: [{ type: "info", message: "Real estate in other states usually requires a separate 'Ancillary' court proceeding." }]
      },
      {
        id: "confirm_ancillary_requirements",
        title: "Confirm Ancillary Requirements",
        description: "Consult with a local attorney in the secondary state to determine if formal ancillary probate or a simplified affidavit is required.",
        estimatedTime: "1-2 weeks",
        isAttorneyReviewNode: true
      },
      {
        id: "open_ancillary_proceeding",
        title: "Open Ancillary Proceeding",
        description: "File certified copies of the primary Letters and Will in the secondary jurisdiction to obtain local authority.",
        estimatedTime: "2-4 weeks",
        requiredDocs: ["Certified Letters", "Authenticated Will", "DE-111 (Ancillary)"]
      }
    ]
  },
  {
    phase: "litigation_phase",
    title: "Dispute / Litigation",
    subtitle: "Conflict Resolution",
    milestone: "Ongoing",
    description: "Manage legal challenges, will contests, or beneficiary disputes that arise during administration.",
    isEscalationPath: true,
    tasks: [
      {
        id: "preserve_litigation_evidence",
        title: "Preserve Evidence",
        description: "Secure original copies of the Will/Trust, key communications (emails, letters), and relevant financial records.",
        estimatedTime: "2-4 hours",
        tags: ["risk-guardrail"]
      },
      {
        id: "engage_litigation_counsel",
        title: "Engage Probate Litigation Counsel",
        description: "Hire specialized litigation counsel to represent the estate's interests in the dispute.",
        estimatedTime: "1-2 weeks",
        isAttorneyReviewNode: true
      },
      {
        id: "mediation_strategy",
        title: "Consider Mediation/Settlement Strategy",
        description: "Evaluate the costs and risks of litigation versus the benefits of a settlement agreement.",
        estimatedTime: "2-4 weeks",
        isAttorneyReviewNode: true
      },
      {
        id: "freeze_distributions_litigation",
        title: "Freeze Distributions until Resolution",
        description: "Mandatory: Do not distribute any contested portions of the estate until a final court order or written settlement is reached.",
        alerts: [{ type: "caution", message: "Fiduciary Risk: Premature distribution during litigation can lead to personal liability and surcharge." }]
      }
    ]
  },
  {
    phase: "insolvency_phase",
    title: "Insolvency Handling",
    subtitle: "Debt Prioritization",
    milestone: "Immediate Risk Action",
    description: "Manage estates where liabilities exceed available assets, requiring strict statutory priority for payments.",
    isEscalationPath: true,
    tasks: [
      {
        id: "stop_insolvent_distributions",
        title: "Stop All Distributions",
        description: "Cease all payments to beneficiaries until a final insolvency plan is approved by the court.",
        estimatedTime: "Immediate",
        tags: ["risk-guardrail"]
      },
      {
        id: "prioritize_claims_statutory",
        title: "Prioritize Claims per Statutory Order",
        description: "Rank all known debts according to their legal priority (e.g., admin costs, funeral, taxes, then general creditors).",
        estimatedTime: "1-2 weeks",
        isAttorneyReviewNode: true
      },
      {
        id: "negotiate_insolvency_settlements",
        title: "Negotiate Structured Payoffs",
        description: "Contact creditors to negotiate pro-rata payments or settlements based on available estate funds.",
        estimatedTime: "4-8 weeks",
        isAttorneyReviewNode: true
      },
      {
        id: "close_insolvent_accounting",
        title: "Close with Insolvency Accounting",
        description: "Submit a final accounting to the court that explicitly documents the estate's insolvency and the pro-rata distribution to creditors.",
        estimatedTime: "2-4 weeks",
        requiredDocs: ["Final Accounting (Insolvency)"]
      }
    ]
  }
];

export const TRUST_PHASE_TASKS: PhaseTaskList[] = [
  // STATE 1: Trustee Authority (not court-issued)
  {
    phase: "immediate_actions", // Reusing existing phase key for compatibility
    title: "Trustee Authority",
    subtitle: "Acceptance & Certification",
    milestone: "After Death",
    description: "Establish successor trustee authority from the trust instrument and death certificate. No court petition required.",
    tasks: [
      {
        id: "locate_trust",
        title: "Locate Trust Document & All Amendments",
        description: "Find the original signed trust document and any amendments. This is your primary legal authority.",
        estimatedTime: "1-2 days",
        requiredDocs: ["Original Trust Document", "All Amendments"],
        alerts: [{
          type: "important",
          message: "The trust document is your source of authority. Review the successor trustee clause carefully."
        }]
      },
      {
        id: "identify_successor_trustee",
        title: "Confirm Successor Trustee Designation",
        description: "Verify your appointment as successor trustee per the trust terms.",
        estimatedTime: "30 minutes",
        alerts: [{
          type: "info",
          message: "If multiple successor trustees are named, determine the order of succession and whether you serve alone or with co-trustees."
        }]
      },
      {
        id: "sign_trustee_acceptance",
        title: "Sign Trustee Acceptance / Affidavit",
        description: "Formally accept your role as successor trustee by signing an acceptance document.",
        estimatedTime: "1 hour",
        requiresNotary: true,
        requiredDocs: ["Trustee Acceptance Form"],
        alerts: [{
          type: "important",
          message: "Fiduciary Duty: By accepting trusteeship, you assume legal responsibility to act in beneficiaries' best interests."
        }]
      },
      {
        id: "prepare_certification_of_trust",
        title: "Prepare Certification of Trust",
        description: "Create a Certification of Trust (abstract of trust) to prove your authority to banks and institutions without revealing full trust terms.",
        estimatedTime: "2-4 hours",
        requiresNotary: true,
        requiredDocs: ["Certification of Trust", "Death Certificate"],
        alerts: [{
          type: "info",
          message: "Institutions may refuse if the Certification is more than 60 days old. Prepare fresh copies as needed."
        }]
      },
      {
        id: "obtain_ein_trust",
        title: "Obtain EIN for Trust/Estate",
        description: "Apply for an Employer Identification Number from the IRS. Required for opening trust bank accounts and filing tax returns.",
        estimatedTime: "30 minutes",
        requiredDocs: ["IRS Form SS-4"],
        alerts: [{
          type: "important",
          message: "The trust may need a new EIN after the grantor's death if it was previously a revocable trust."
        }],
        links: [{
          label: "Apply for EIN Online",
          url: "https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online"
        }]
      },
      {
        id: "file_irs_form_56",
        title: "File IRS Form 56",
        description: "Formally notify the IRS of your fiduciary relationship as successor trustee. This ensures tax notices are sent to you directly.",
        estimatedTime: "1 hour",
        tags: ["statutory", "tax"],
        requiredDocs: ["IRS Form 56"],
        alerts: [{
          type: "info",
          message: "Failure to file Form 56 may result in critical tax notices being sent to the decedent's old address."
        }]
      },
      {
        id: "secure_trust_property",
        title: "Secure Trust Property",
        description: "Change locks on real property, forward mail, secure valuables, and ensure insurance coverage remains active.",
        estimatedTime: "1-2 days",
        tags: ["risk-guardrail"],
        alerts: [{
          type: "warning",
          message: "Vacant properties are high-risk for theft and insurance issues. Act immediately."
        }]
      }
    ]
  },
  // STATE 2: Notice & Beneficiary Communications
  {
    phase: "court_filing", // Repurposing phase key - will be renamed in title
    title: "Notice & Communications",
    subtitle: "Beneficiary Notification",
    milestone: "Within 60 Days",
    description: "Notify all beneficiaries and heirs of the trust administration. State law may require formal notification within specific timeframes.",
    tasks: [
      {
        id: "identify_all_beneficiaries",
        title: "Identify All Trust Beneficiaries",
        description: "Review the trust to identify all current and remainder beneficiaries. Include contingent beneficiaries.",
        estimatedTime: "1-2 hours",
        requiredDocs: ["Beneficiary List"],
        alerts: [{
          type: "info",
          message: "Beneficiaries may include individuals, charities, and other trusts. Check each class of beneficiaries."
        }]
      },
      {
        id: "send_statutory_notice",
        title: "Send Statutory Notice to Beneficiaries",
        description: "California Probate Code §16061.7 requires notice to beneficiaries within 60 days. Other states have similar requirements.",
        estimatedTime: "2-4 hours",
        isAttorneyReviewNode: true,
        attorneyReviewReason: "Statutory Deadline: Missing this 60-day window can result in removal of the trustee and personal liability.",
        tags: ["statutory", "risk-guardrail"],
        requiredDocs: ["Notice Letters", "Certified Mail Receipts"],
        requiresPhysicalMail: true,
        alerts: [
          {
            type: "important",
            message: "This notice starts the 120-day contest period. Keep all certified mail receipts as proof."
          }
        ]
      },
      {
        id: "notify_state_agencies_dhcs",
        title: "Notify State Agencies (Medi-Cal/DHCS)",
        description: "In CA and other states, the trustee must notify the Department of Health Care Services of the muerte to allow for estate recovery claims.",
        estimatedTime: "1 hour",
        tags: ["statutory"],
        requiresPhysicalMail: true,
        alerts: [{
          type: "caution",
          message: "Mandatory Notice: Distributing trust assets before checking for Medi-Cal recovery claims can make the trustee personally liable for the debt."
        }]
      },
      {
        id: "handle_trust_copy_requests",
        title: "Respond to Trust Copy Requests",
        description: "Beneficiaries have the right to request a copy of the trust. Respond within the timeframe specified by state law.",
        estimatedTime: "Ongoing",
        alerts: [{
          type: "info",
          message: "You may redact provisions that don't directly affect the requesting beneficiary."
        }]
      },
      {
        id: "identify_minor_trust_beneficiaries",
        title: "Flag Minor Beneficiaries",
        description: "Identify any beneficiaries under age 18. Distributions to minors require special handling.",
        estimatedTime: "30 minutes",
        isConditional: true,
        conditionalRequirementLabel: "Required if minors are beneficiaries",
        alerts: [{
          type: "important",
          message: "Minor beneficiaries may require distributions to be held in sub-trusts or UTMA accounts."
        }]
      },
      {
        id: "wait_contest_period",
        title: "Monitor 120-Day Contest Period",
        description: "Wait 120 days from the date notice was sent before making final distributions. Document any contests or concerns raised.",
        estimatedTime: "120 days",
        isLongHorizon: true,
        alerts: [{
          type: "warning",
          message: "Making distributions before the contest period expires can create personal liability if a challenge is later filed."
        }]
      }
    ]
  },
  // STATE 3: Trust Asset Marshaling (funding verification)
  {
    phase: "asset_discovery", // Repurposing existing phase key
    title: "Trust Asset Marshaling",
    subtitle: "Funding Verification",
    milestone: "After Authority Established",
    description: "Inventory all trust assets, verify proper titling, and identify any assets outside the trust that may require probate.",
    tasks: [
      {
        id: "inventory_trust_assets",
        title: "Create Trust Asset Inventory",
        description: "List all assets titled in the trust's name. This is an internal document, not filed with court.",
        estimatedTime: "1-2 weeks",
        requiredDocs: ["Trust Asset Inventory", "Date-of-Death Statements"],
        alerts: [{
          type: "info",
          message: "Unlike probate, you do NOT file DE-160 with the court. This inventory is for accounting purposes."
        }]
      },
      {
        id: "verify_trust_titling",
        title: "Verify Trust Titling on All Assets",
        description: "Check each asset to confirm it is properly titled in the trust's name. Assets not in the trust may require probate.",
        estimatedTime: "2-4 hours per asset",
        alerts: [{
          type: "caution",
          message: "Trust vs. Probate: If an asset was never transferred into the trust, it may need to go through probate."
        }]
      },
      {
        id: "obtain_dod_valuations",
        title: "Obtain Date-of-Death Valuations",
        description: "Request statements and appraisals as of the date of death for tax basis and accounting purposes.",
        estimatedTime: "2-4 weeks",
        requiredDocs: ["Bank Statements (DOD)", "Brokerage Statements (DOD)", "Real Property Appraisal"],
        alerts: [{
          type: "important",
          message: "Step-up in basis: Most inherited assets receive a new cost basis equal to fair market value at death."
        }]
      },
      {
        id: "check_out_of_trust_assets",
        title: "Identify Out-of-Trust Assets",
        description: "Review for assets that were never funded into the trust. For each: Does it have a POD/TOD? Is it joint tenancy? Or does it require probate?",
        estimatedTime: "2-4 hours",
        alerts: [{
          type: "warning",
          message: "Assets outside the trust with no beneficiary pathway trigger a probate escalation."
        }]
      },
      {
        id: "probate_escalation_check",
        title: "Probate Escalation Decision Point",
        description: "If solely-owned assets exist outside the trust with no beneficiary designation, determine if formal probate or small estate affidavit is needed.",
        estimatedTime: "1-2 hours",
        isConditional: true,
        conditionalRequirementLabel: "Required IF out-of-trust assets are found",
        isAttorneyReviewNode: true,
        attorneyReviewReason: "Funding Failure: Assets outside trust may require court intervention.",
        alerts: [{
          type: "caution",
          message: "Escalation Path: This triggers the Probate Escalation module if unfunded assets exceed small estate limits."
        }]
      },
      {
        id: "notify_financial_institutions",
        title: "Notify Financial Institutions",
        description: "Present your Certification of Trust and death certificate to banks, brokerages, and insurance companies.",
        estimatedTime: "2-4 weeks",
        requiredDocs: ["Certification of Trust", "Death Certificate", "Trustee ID"],
        alerts: [{
          type: "info",
          message: "Institutions may require specific claim forms. Request their transfer/claim package."
        }]
      }
    ]
  },
  // STATE 4: Creditor Exposure & Expenses (non-probate)
  {
    phase: "creditor_claims", // Repurposing existing phase key
    title: "Creditor Exposure & Expenses",
    subtitle: "Non-Probate Debt Handling",
    milestone: "After Marshaling",
    description: "Evaluate creditor exposure silently and pay debts from trust assets according to trust terms and state law. This is NOT the formal probate claims process.",
    tasks: [
      {
        id: "trust_creditor_assessment",
        title: "Creditor Exposure Assessment",
        description: "Review known debts and potential claims against the trust estate. This is a silent legal check, not formal probate publication.",
        estimatedTime: "2-4 hours",
        isAttorneyReviewNode: true,
        attorneyReviewReason: "Creditor Strategy: Determining whether to voluntarily notify creditors or remain silent depends on estate solvency and risk tolerance.",
        alerts: [{
          type: "info",
          message: "Unlike probate, trust admin does NOT require public creditor notice. However, you must still pay legitimate debts."
        }]
      },
      {
        id: "pay_funeral_last_illness",
        title: "Pay Funeral & Last Illness Expenses",
        description: "These are typically the first obligations to pay from trust assets.",
        estimatedTime: "1-2 weeks",
        requiredDocs: ["Funeral Invoice", "Medical Bills"],
        alerts: [{
          type: "important",
          message: "Keep all receipts. These expenses are documented in the final accounting."
        }]
      },
      {
        id: "pay_ongoing_expenses",
        title: "Pay Ongoing Property Expenses",
        description: "Maintain trust property by paying mortgage, property taxes, insurance, and utilities from trust accounts.",
        estimatedTime: "Ongoing",
        alerts: [{
          type: "warning",
          message: "Only use trust funds for trust expenses. Maintain meticulous records for accounting."
        }]
      },
      {
        id: "evaluate_trust_solvency",
        title: "Evaluate Trust Solvency",
        description: "Compare total trust assets against all known and potential liabilities to determine solvency status.",
        estimatedTime: "1-2 hours",
        alerts: [{
          type: "caution",
          message: "Insolvent Trust Warning: If liabilities exceed assets, you must follow statutory priority rules for debt payment."
        }]
      },
      {
        id: "pay_trust_debts",
        title: "Pay Valid Debts",
        description: "Pay legitimate debts from trust accounts according to trust terms and state priority rules.",
        estimatedTime: "2-4 weeks",
        alerts: [{
          type: "warning",
          message: "Fiduciary Risk: Paying lower-priority debts before higher-priority ones can create personal liability."
        }]
      }
    ]
  },
  // STATE 5: Tax & Accounting
  {
    phase: "asset_liquidation", // Repurposing existing phase key
    title: "Tax & Accounting",
    subtitle: "Fiduciary Returns",
    milestone: "Before Distribution",
    description: "File all required tax returns and prepare accounting for beneficiaries. Note: A revocable trust becomes irrevocable at death, changing its tax posture.",
    tasks: [
      {
        id: "file_final_1040",
        title: "File Decedent's Final Form 1040",
        description: "File the decedent's final individual income tax return for the year of death.",
        estimatedTime: "2-4 weeks",
        requiredDocs: ["Form 1040", "W-2s", "1099s"],
        alerts: [{
          type: "important",
          message: "Due April 15 of the year following death. Mark 'DECEASED' on the return."
        }]
      },
      {
        id: "determine_trust_tax_posture",
        title: "Determine Post-Death Tax Posture",
        description: "A revocable trust becomes irrevocable at death. Determine whether it's now a grantor trust, complex trust, or simple trust for tax purposes.",
        estimatedTime: "1-2 hours",
        isAttorneyReviewNode: true,
        attorneyReviewReason: "Tax Election: The trust's tax classification affects reporting requirements and distribution planning.",
        alerts: [{
          type: "important",
          message: "Consult a CPA: The trust may need its own EIN and separate tax returns after the grantor's death."
        }]
      },
      {
        id: "file_form_1041",
        title: "File Trust/Estate Income Tax Return (Form 1041)",
        description: "File Form 1041 for trust income earned after death. Issue K-1s to beneficiaries for their share of income.",
        estimatedTime: "2-4 weeks",
        requiredDocs: ["Form 1041", "Schedule K-1"],
        alerts: [{
          type: "info",
          message: "Due April 15 for calendar year trusts. Complex trusts have different distribution deduction rules."
        }]
      },
      {
        id: "evaluate_form_706",
        title: "Evaluate Estate Tax Return Requirement",
        description: "Determine if Form 706 is required based on total estate value, including trust assets.",
        estimatedTime: "2-4 hours",
        isConditional: true,
        conditionalRequirementLabel: "Required if estate exceeds federal exemption (~$13M in 2024)",
        requiredDocs: ["Form 706 (if required)"],
        alerts: [{
          type: "important",
          message: "Form 706 is due 9 months after death. Extensions available but must be requested."
        }]
      },
      {
        id: "obtain_tax_clearance",
        title: "Obtain Tax Clearances",
        description: "Confirm all taxes are paid before making final distributions to beneficiaries.",
        estimatedTime: "2-4 weeks",
        alerts: [{
          type: "warning",
          message: "Personal Liability: Distributing assets before taxes are settled can make you personally liable."
        }]
      },
      {
        id: "prepare_trust_accounting",
        title: "Prepare Trust Accounting",
        description: "Create a comprehensive accounting of all receipts, disbursements, and distributions for beneficiaries.",
        estimatedTime: "1-2 weeks",
        requiredDocs: ["Trust Accounting Statement"],
        alerts: [{
          type: "info",
          message: "While not always legally required, providing an accounting protects you from future disputes."
        }]
      }
    ]
  },
  // STATE 6: Distribution & Close
  {
    phase: "final_distribution", // Repurposing existing phase key
    title: "Distribution & Close",
    subtitle: "Final Accounting",
    milestone: "After Tax Clearance",
    description: "Distribute trust assets to beneficiaries according to trust terms. Obtain receipts and close the trust administration.",
    tasks: [
      {
        id: "prepare_distribution_schedule",
        title: "Prepare Distribution Schedule",
        description: "Calculate each beneficiary's share according to the trust terms. Document all calculations.",
        estimatedTime: "2-4 hours",
        requiredDocs: ["Distribution Schedule"],
        alerts: [{
          type: "important",
          message: "Follow the trust terms exactly. You cannot modify distributions based on personal preference."
        }]
      },
      {
        id: "reserve_policy",
        title: "Establish Reserve for Unknown Liabilities",
        description: "Hold back a reasonable reserve for potential taxes, unknown bills, or administrative costs before final distribution.",
        estimatedTime: "1-2 hours",
        alerts: [{
          type: "info",
          message: "A 5-10% holdback is common practice. Distribute reserves after final tax clearances."
        }]
      },
      {
        id: "distribute_assets_to_beneficiaries",
        title: "Distribute Assets to Beneficiaries",
        description: "Transfer assets to beneficiaries per the trust terms. Real property may require new deeds.",
        estimatedTime: "2-8 weeks",
        requiredDocs: ["Transfer Documents", "Deeds (if real property)"],
        alerts: [{
          type: "warning",
          message: "Minor Beneficiaries: Do NOT distribute directly to minors. Use sub-trusts or UTMA accounts."
        }]
      },
      {
        id: "obtain_beneficiary_receipts",
        title: "Obtain Receipts & Global Releases",
        description: "Have each beneficiary sign a receipt acknowledging their distribution and a GLOBAL RELEASE waiving the right to sue the trustee for past actions.",
        estimatedTime: "1-2 weeks",
        isAttorneyReviewNode: true,
        attorneyReviewReason: "Malpractice Prevention: A distribution without a properly drafted release leaves the trustee exposed to litigation for years.",
        tags: ["risk-guardrail", "fiduciary"],
        requiredDocs: ["Distribution Receipts", "Global Release & Settlement Agreement"],
        alerts: [{
          type: "important",
          message: "Risk Limit: Receipts prove you paid the money; RELEASES prove they can't sue you for how you managed it."
        }]
      },
      {
        id: "send_final_accounting",
        title: "Send Final Accounting to Beneficiaries",
        description: "Provide each beneficiary with a complete accounting showing all transactions during the administration.",
        estimatedTime: "1-2 days",
        requiredDocs: ["Final Trust Accounting"],
        alerts: [{
          type: "info",
          message: "Transparency builds trust. Answer any questions beneficiaries have about the accounting."
        }]
      },
      {
        id: "close_trust_accounts",
        title: "Close Trust Bank Accounts",
        description: "After all distributions are complete, close the trust bank and brokerage accounts.",
        estimatedTime: "1-2 weeks",
        alerts: [{
          type: "important",
          message: "Keep copies of final statements for your records. You may need them for future tax questions."
        }]
      },
      {
        id: "complete_trust_administration",
        title: "Complete Trust Administration",
        description: "The trust administration is complete. Retain records for at least 7 years.",
        estimatedTime: "N/A",
        alerts: [{
          type: "info",
          message: "Congratulations! You have fulfilled your fiduciary duty as trustee."
        }]
      }
    ]
  }
];

/**
 * Probate Escalation Phase - Added to trust roadmap only when assets are outside trust
 */
export const PROBATE_ESCALATION_PHASE: PhaseTaskList = {
  phase: "probate_escalation", // Unique key for escalation path
  title: "⚠️ Probate Escalation",
  subtitle: "Funding Failure Only",
  milestone: "If Assets Outside Trust",
  description: "This phase is triggered ONLY when assets are found outside the trust with no beneficiary pathway. Court intervention is required for these assets only.",
  isEscalationPath: true,
  tasks: [
    {
      id: "escalation_evaluate_path",
      title: "Evaluate Probate Path",
      description: "Determine whether small estate affidavit or formal probate is needed for out-of-trust assets.",
      estimatedTime: "1-2 hours",
      isAttorneyReviewNode: true,
      attorneyReviewReason: "Probate Threshold: State thresholds determine if formal probate or affidavit applies.",
      alerts: [{
        type: "caution",
        message: "Only the assets OUTSIDE the trust require probate. Trust assets remain in the trust track."
      }]
    },
    {
      id: "escalation_file_petition",
      title: "File Probate Petition (DE-111)",
      description: "If formal probate is required for out-of-trust assets, file petition with Superior Court.",
      category: "probate",
      estimatedTime: "2-4 hours",
      requiredDocs: ["DE-111", "Death Certificate", "Original Will (if exists)"],
      alerts: [{
        type: "info",
        message: "You may serve as both Trustee and Executor, but the roles have different authority sources."
      }]
    },
    {
      id: "escalation_obtain_letters",
      title: "Obtain Letters Testamentary (DE-150)",
      description: "Attend hearing and obtain court-issued authority for probate assets only.",
      category: "court-issued",
      estimatedTime: "60-90 days",
      requiredDocs: ["Letters (DE-150)"],
      alerts: [{
        type: "important",
        message: "Letters are for probate assets ONLY. Trust assets do not require Letters."
      }]
    },
    {
      id: "escalation_transfer_to_trust",
      title: "Transfer Probate Assets to Trust",
      description: "After probate closes, pour-over will or court order transfers probate assets into the trust for unified distribution.",
      estimatedTime: "2-4 weeks",
      alerts: [{
        type: "info",
        message: "If a pour-over will exists, probate assets flow into the trust via court order."
      }]
    }
  ]
};

