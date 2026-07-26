import { SettlementPhase } from "./roadmapMetadata.js";
export type { SettlementPhase };

import { AuthorityType, MasterMode } from "../lib/authorityEngine.js";

export interface OfficialForm {
  name: string;
  url: string;
  formId?: string;
  notes?: string;
}

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
    variants?: string[];
    predicatesAll?: string[];
    predicatesAny?: string[];
    excludePredicates?: string[];
    authorityTypes?: AuthorityType[];
    states?: string[];
  };
  isInternationalOnly?: boolean; // New flag for International Mode
  requiresAuthority?: boolean;  // Blocks until Letters of Authority/Testamentary are issued
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
      estimatedTime?: string;
      formNames?: string[];
      primaryActionLabel?: string;
      primaryActionUrl?: string;
      links?: { label: string; url: string; }[];
      sourceUrl?: string;
      lastVerifiedAt?: string;
      reviewedBy?: string;
      confidence?: string;
      changeLog?: { at: string; by: string; change: string; sourceUrl?: string; }[];
      officialForms?: OfficialForm[];
      utility?: string;
      dependencies?: string[];
      isOptional?: boolean;
      deadlineWarningId?: string;
      isConditional?: boolean;
      conditionalRequirementLabel?: string;
      requiredDocs?: string[];
      alerts?: {
        type: "info" | "warning" | "important" | "caution";
        message: string;
      }[];
      applicability?: {
        masterModes?: MasterMode[];
        variants?: string[];
        predicatesAll?: string[];
        predicatesAny?: string[];
        excludePredicates?: string[];
        authorityTypes?: AuthorityType[];
        states?: string[];
      };
    }
  };
  requiredProfileFields?: string[];
  outputs?: string[];
  scope?: string;
  allowedStates?: string[];
  allowedCounties?: string[];

  // Authority Scope - determines which authority track this task belongs to
  // "PROBATE" = Only shows for probate estates (file_probate_petition, attend_probate_hearing, etc.)
  // "TRUST" = Only shows for trust estates (locate_trust, identify_successor_trustee, etc.)
  // "BOTH" = Shows for both probate and trust estates (secure_property, pay_taxes, etc.)
  authorityScope: "PROBATE" | "TRUST" | "BOTH";
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
    subtitle: "Secure, Notify, Preserve",
    milestone: "Immediately After Death",
    description: "Evaluate the estate's characteristics before taking irrevocable actions.",
    tasks: [
      {
        id: "preliminary_asset_scan",
        authorityScope: "BOTH",
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
        id: "secure_property",
        authorityScope: "BOTH",
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
        authorityScope: "PROBATE",
        scope: "CORE",
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
        authorityScope: "PROBATE",
        scope: "CORE",
        title: "Evaluate Primary Residence Succession",
        description: "If the estate consists primarily of a primary residence valued under the state's simplified threshold, you may qualify for a simplified succession process.",
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
        authorityScope: "BOTH",
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
        authorityScope: "BOTH",
        scope: "CORE",
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
        authorityScope: "BOTH",
        scope: "CORE",
        title: "Confirm No Subsequent Revocation",
        description: "Check for any subsequently recorded 'Revocation of TOD Deed' or a newer TOD deed that might override the current one.",
        estimatedTime: "1 hour",
        trackCompatibility: ["NON_PROBATE"],
        isAttorneyReviewNode: true,
        attorneyReviewReason: "Legal Conflict: Multiple recorded deeds or revocations create high litigation risk and title clouds."
      },
      {
        id: "check_beneficiary_survival",
        authorityScope: "BOTH",
        scope: "CORE",
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
        authorityScope: "BOTH",
        scope: "CORE",
        title: "Check for Joint Tenancy Override",
        description: "Verify the property was not held in Joint Tenancy at the time of death. In many states, Joint Tenancy survivorship overrides a TOD deed.",
        estimatedTime: "1 hour",
        trackCompatibility: ["NON_PROBATE"],
        isAttorneyReviewNode: true,
        attorneyReviewReason: "Title Priority: Joint Tenancy with Right of Survivorship usually trumps TOD deeds, which can invalidate the transfer."
      },
      {
        id: "prepare_beneficiary_authority_packet",
        authorityScope: "BOTH",
        scope: "CORE",
        title: "Establish Beneficiary Transfer Authority",
        description: "Instead of 'Letters Testamentary', the TOD beneficiary uses a 'Transfer Packet' to claim title.",
        estimatedTime: "2-4 hours",
        trackCompatibility: ["NON_PROBATE"],
        requiredDocs: ["Certified Death Certificate", "Recorded TOD Deed copy", "Affidavit of Death of Transferor"],
        alerts: [{
          type: "info",
          message: "This packet replaces court-issued authority and is presented to the county recorder or title company."
        }]
      },
      {
        id: "escalate_to_probate_trigger",
        authorityScope: "PROBATE",
        scope: "CORE",
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
        authorityScope: "BOTH",
        scope: "CORE",
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
        authorityScope: "BOTH",
        scope: "CORE",
        title: "Record Affidavit of Death (TOD)",
        description: "Prepare and record an Affidavit of Death of Transferor to formally transfer title to the TOD beneficiary.",
        estimatedTime: "2-4 hours",
        requiredDocs: ["Death Certificate", "Affidavit of Death", "Recorded TOD Deed"],
        trackCompatibility: ["NON_PROBATE"],
        links: [{
          label: "About TOD Transfer Requirements",
          url: "#"
        }]
      },
      {
        id: "notify_recorder_assessor",
        authorityScope: "BOTH",
        scope: "CORE",
        title: "Notify County Recorder & Assessor",
        description: "Submit Change in Ownership Statement to the county to update tax records and prevent penalties.",
        estimatedTime: "1 hour",
        trackCompatibility: ["NON_PROBATE"],
        requiredDocs: ["Change in Ownership Statement"],
        alerts: [{
          type: "warning",
          message: "Missing the property tax reassessment deadline can lead to significant penalties."
        }]
      },
      {
        id: "evaluate_prop19_exclusion",
        authorityScope: "BOTH",
        scope: "CORE",
        title: "Evaluate Prop 19 Parent-Child Exclusion (CA)",
        description: "If California real property passes from parent to child, determine eligibility for the Prop 19 reassessment exclusion: the property must have been the parents' primary residence, the child must move in within 1 year and use it as their own primary residence, and only the first ~$1M of assessed value above the existing base is protected. File claim form BOE-19-P with the county assessor.",
        estimatedTime: "2-4 hours",
        requiredDocs: ["BOE-19-P Claim Form", "Death Certificate", "Evidence of primary residence"],
        applicability: { states: ["CA"] },
        tags: ["tax", "statutory", "risk-guardrail"],
        alerts: [
          {
            type: "warning",
            message: "Missing the Prop 19 exclusion on a $1.5M home can cost heirs $10,000–$15,000+ per year in additional property tax — permanently. File BOE-19-P promptly; late claims reduce relief."
          },
          {
            type: "important",
            message: "The child MUST use the property as their primary residence and move in within 1 year, or the exclusion is lost. Investment/rental transfers are fully reassessed."
          }
        ],
        links: [{
          label: "BOE Prop 19 Guidance",
          url: "https://www.boe.ca.gov/prop19/"
        }]
      },
      {
        id: "medical_estate_recovery_check",
        authorityScope: "BOTH",
        scope: "CORE",
        title: "Medi-Cal Estate Recovery Check (Mandatory Gate)",
        description: "Before any distribution, determine whether the decedent received Medi-Cal benefits after age 55 or for nursing facility care. If yes, submit a DHCS Estate Recovery inquiry and do not distribute until DHCS responds. Post-SB 833, recovery generally reaches only assets passing through probate — which is exactly the formal-probate population.",
        estimatedTime: "1-2 hours + DHCS response time",
        requiredDocs: ["Decedent's Medi-Cal history", "DHCS Estate Recovery inquiry form"],
        applicability: { states: ["CA"] },
        tags: ["statutory", "risk-guardrail"],
        isLongHorizon: true,
        alerts: [
          {
            type: "warning",
            message: "PERSONAL LIABILITY: An executor who distributes estate assets without resolving a Medi-Cal recovery claim can be personally liable to DHCS (Welf. & Inst. Code §14009.5)."
          }
        ],
        links: [{
          label: "DHCS Estate Recovery",
          url: "https://www.dhcs.ca.gov/services/Pages/EstateRecovery.aspx"
        }]
      },
      {
        id: "cancel_cards",
        authorityScope: "BOTH",
        scope: "CORE",
        title: "Cancel Credit Cards & Subscriptions",
        description: "Stop recurring charges and prevent identity theft by closing accounts.",
        estimatedTime: "2-3 hours",
        alerts: [
          {
            type: "warning",
            message: "Fiduciary Caution: While recurring charges should stop, avoid paying off large unsecured credit card balances from estate funds until the statutory creditor claim period has expired and solvency is confirmed."
          }
        ]
      },
      {
        id: "manage_utilities",
        authorityScope: "BOTH",
        scope: "CORE",
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
        authorityScope: "BOTH",
        scope: "CORE",
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
        authorityScope: "BOTH",
        scope: "CORE",
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
        authorityScope: "BOTH",
        scope: "CORE",
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
        authorityScope: "BOTH",
        title: "Establish Estate Financial Account",
        description: "Open a separate fiduciary account for estate income and expenses once legal authority is obtained.",
        estimatedTime: "1 hour",
        requiresAuthority: true,
        requiredDocs: ["Death Certificate", "Letters of Authority", "EIN"],
        alerts: [
          {
            type: "important",
            message: "Fiduciary Duty: Estate funds must never be commingled with personal funds."
          }
        ]
      },
      {
        id: "pay_immediate_bills",
        authorityScope: "BOTH",
        scope: "CORE",
        title: "Managed Payment of Immediate Bills",
        description: "Prioritize current utilities, mortgage, and insurance to protect the value of estate assets.",
        estimatedTime: "Ongoing",
        alerts: [
          {
            type: "warning",
            message: "Fiduciary Caution: While recurring charges should stop, avoid paying off large unsecured credit card balances from estate funds until the statutory creditor claim period has expired and solvency is confirmed."
          },
          {
            type: "warning",
            message: "Only use estate-related funds for these payments and maintain meticulous records for the final accounting."
          }
        ]
      },
      {
        id: "obtain_ein_probate",
        scope: "CORE",
        authorityScope: "BOTH",
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
        authorityScope: "BOTH",
        title: "File IRS Form 56 (Notice of Fiduciary)",
        description: "Formally notify the IRS that you have taken on the role of Executor/Administrator. This ensures that all tax correspondence regarding the decedent is sent to you.",
        estimatedTime: "1 hour",
        tags: ["tax", "fiduciary"],
        requiredDocs: ["IRS Form 56", "Certified Letters of Authority"],
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
        authorityScope: "BOTH",
        scope: "CORE",
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
        authorityScope: "BOTH",
        scope: "CORE",
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
    phase: "pre_filing_compliance",
    title: "Court Compliance & Eligibility",
    subtitle: "Eligibility, Venue, Parties",
    milestone: "Before Court Filing",
    description: "Ensure all statutory and documentation requirements are met prior to formal court submission. This universal layer adapts to state-specific rules.",
    tasks: [
      {
        id: "validate_venue_authority",
        authorityScope: "BOTH",
        scope: "CORE",
        title: "Validate Venue and Court Filing Authority",
        description: "Confirm the decedent's legal domicile and county residency to ensure the application is filed in the legally appropriate court.",
        utility: "Prevents immediate case dismissal due to improper venue.",
        estimatedTime: "30 minutes",
        category: "probate",
        requiredProfileFields: ["decedent_domicile", "county", "death_date", "property_location"],
        outputs: ["Verified Court for Filing"],
        alerts: [{
          type: "important",
          message: "Filing Error Risk: Filing in the wrong county or state can invalidate all subsequent legal actions."
        }],
        stateOverrides: {
          NY: {
            title: "Validate Surrogate's Court Venue (SCPA §205)",
            description: "Verify the decedent's domicile in NY to ensure the petition is filed in the correct Surrogate's Court (SCPA §205).",
            utility: "Prevents case dismissal based on lack of subject matter authority."
          },
          NJ: {
            title: "Validate County Surrogate Venue (N.J.S.A. 3B:2-3)",
            description: "Confirm the decedent's legal domicile to ensure the application is filed with the correct County Surrogate per N.J.S.A. 3B:2-3.",
            utility: "Prevents application rejection due to improper county filing.",
            alerts: [{
              type: "important",
              message: "Venue Rule: In New Jersey, probate must be filed with the Surrogate of the county where the decedent was domiciled at the time of death."
            }]
          }
        }
      },
      {
        id: "screen_fiduciary_eligibility",
        authorityScope: "BOTH",
        scope: "CORE",
        title: "Screen Fiduciary Eligibility",
        description: "Verify that the proposed executor or administrator meets all state-specific legal requirements to serve.",
        estimatedTime: "30 minutes",
        category: "probate",
        requiredProfileFields: ["fiduciary_residency", "fiduciary_citizenship", "felony_status", "fiduciary_age"],
        outputs: ["Fiduciary Eligibility Certification", "Counsel Recommendation Flag"],
        alerts: [{
          type: "caution",
          message: "Statutory Disqualification: Many states explicitly prohibit non-citizens, out-of-state residents, or individuals with certain criminal histories from serving."
        }],
        stateOverrides: {
          NY: {
            title: "Screen Fiduciary Eligibility (SCPA §707)",
            description: "NY law disqualifies certain individuals (felons, non-domiciliary aliens who aren't co-fiduciaries with a NY resident) from serving per SCPA §707."
          }
        }
      },
      {
        id: "validate_interested_parties",
        authorityScope: "PROBATE",
        scope: "CORE",
        title: "Validate Interested Parties",
        description: "Identify all individuals legally entitled to notice or inheritance, including heirs-at-law, beneficiaries, and devisees.",
        estimatedTime: "2 hours",
        category: "probate",
        requiredProfileFields: ["family_tree", "marital_status", "children", "prior_marriages", "adoptions"],
        outputs: ["Court-Ready Party List", "Required Notice Matrix"],
        alerts: [{
          type: "warning",
          message: "Failure to name and notify every legally interested party, even estranged ones, can stall the proceedings or invite later litigation."
        }],
        stateOverrides: {
          NY: {
            title: "Validate Distributees & Interested Parties (SCPA §1003/§1403)",
            description: "Identify all 'distributees' (heirs-at-law) per EPTL §4-1.1 and beneficiaries. NY requires a family tree affidavit if there is only one distributee or if they are more remote than first cousins.",
            links: [{ label: "About Family Tree Requirements", url: "#" }]
          }
        }
      },
      {
        id: "compile_will_and_proof",
        authorityScope: "PROBATE",
        scope: "CORE",
        title: "Compile Will and Testamentary Proofs",
        description: "Gather the original valid will, codicils, and secure witness affidavits or self-proving attestations.",
        estimatedTime: "1-2 weeks",
        category: "probate",
        applicability: {
          variants: ["TESTATE"]
        },
        outputs: ["Original Will", "Witness Affidavits/Proofs"],
        alerts: [{
          type: "info",
          message: "If witnesses are deceased or unlocatable, specialized 'dispense with testimony' procedures will be required."
        }],
        stateOverrides: {
          NY: {
            title: "Compile Will & Probate Proofs (SCPA §1404)",
            description: "Gather the original Will. Secure 'Affidavits of Attesting Witnesses' (Form P-3) to avoid mandatory 1404 hearings."
          }
        }
      },
      {
        id: "identify_protected_persons_and_representation",
        authorityScope: "BOTH",
        scope: "CORE",
        title: "Identify Protected Persons representation",
        description: "Screen the interested party list for minors, incapacitated adults, or unknown heirs that require a court-appointed Guardian ad Litem (GAL).",
        estimatedTime: "1 hour",
        category: "probate",
        applicability: {
          predicatesAny: ["hasMinorBeneficiaries", "hasUnknownHeirs"]
        },
        outputs: ["GAL Requirement Assessment"],
        alerts: [{
          type: "important",
          message: "Courts strictly require GAL representation to protect the interests of those who cannot represent themselves."
        }]
      },
      {
        id: "prepare_required_notices_and_waivers",
        authorityScope: "PROBATE",
        scope: "CORE",
        title: "Prepare Required Notices and Waivers",
        description: "Generate the formal notice plan to serve interested parties, or gather Signed Waivers and Consents to expedite the process.",
        estimatedTime: "1-3 weeks",
        category: "probate",
        outputs: ["Notice Plan Checklist", "Compiled Waivers"],
        stateOverrides: {
          NY: {
            title: "Prepare Waivers & Consents (SCPA §401)",
            description: "Gather signed 'Waiver and Consent' forms from all distributees to bypass the issuance of a formal Citation and a court appearance date.",
            formNames: ["Waiver & Consent (A-2 or P-3)"],
            alerts: [{
              type: "important",
              message: "Each waiver must be notarized. The court will not accept photocopies of signatures."
            }]
          }
        }
      },
      {
        id: "request_temporary_authority",
        authorityScope: "PROBATE",
        scope: "CORE",
        title: "Evaluate Need for Temporary Authority",
        description: "Determine if preliminary letters or special administration is necessary to protect assets or run a business while formal probate is pending.",
        estimatedTime: "1 hour",
        category: "probate",
        outputs: ["Temporary Authority Assessment"],
        alerts: [{
          type: "info",
          message: "Temporary authority is rarely granted for mere convenience; it is strictly intended for asset protection during delays."
        }]
      },
      {
        id: "calculate_filing_fees",
        authorityScope: "PROBATE",
        scope: "CORE",
        title: "Calculate Court Filing Fees",
        description: "Determine the exact statutory filing fee based on the estimated gross value of the probate estate.",
        estimatedTime: "15 minutes",
        category: "probate",
        outputs: ["Filing Fee Estimate"],
        alerts: [{
          type: "info",
          message: "State courts charge tiered filing fees. Accuracy in the preliminary asset scan is important here."
        }],
        stateOverrides: {
          NY: {
            title: "Evaluate NY Surrogate Fee Schedule (SCPA §2402)",
            description: "NY filing fees scale from $45 to $1,250 based on the value of the probate estate assets per SCPA §2402.",
            sourceUrl: "https://ww2.nycourts.gov/courts/11jd/surrogates/fees.shtml"
          }
        }
      },
      {
        id: "compile_required_form_pack",
        authorityScope: "PROBATE",
        scope: "CORE",
        title: "Compile Required Court Form Packet",
        description: "Synthesize the official local forms and procedural filing notes required by your specific court into a ready-to-file package.",
        estimatedTime: "1-2 hours",
        category: "probate",
        outputs: ["Required Form Pack List", "Filing Procedure Notes"],
        alerts: [{
          type: "info",
          message: "Court clerks will reject filings if mandatory local forms are missing. Double check the official packet."
        }],
        stateOverrides: {
          NY: {
            title: "Assemble NY Probate/Admin Packet",
            description: "Combine the Petition (P-1 or A-1), Original Will (if any), Death Certificate, and Waivers into the Surrogate's Court packet.",
            officialForms: [
              { name: "Probate Petition (P-1)", url: "https://www.nycourts.gov/LegacyPDFS/FORMS/surrogates/pdfs/Probate_Petition.pdf" },
              { name: "Administration Petition (A-1)", url: "https://www.nycourts.gov/LegacyPDFS/FORMS/surrogates/pdfs/Admin_Petition.pdf" }
            ],
            primaryActionLabel: "Download Forms Packet"
          }
        }
      },
      {
        id: "petition_guardian_ad_litem",
        authorityScope: "PROBATE",
        scope: "CORE",
        title: "File Petition for Guardian Ad Litem",
        description: "Request court appointment of a guardian ad litem to represent minor beneficiaries' interests throughout probate.",
        estimatedTime: "2-4 hours",
        category: "probate",
        isConditional: true,
        isOptional: true, // Controlled by filtering logic based on profile
        conditionalRequirementLabel: "Required if minors have interests",
        requiredDocs: ["Petition Form", "Death Certificate"],
        dependencies: ["file_probate_petition", "file_administration_petition"],
        links: [{
          label: "About Guardian Ad Litem Representation",
          url: "#"
        }],
        alerts: [{
          type: "important",
          message: "Guardian ad litem must approve all actions affecting minors' inheritance."
        }]
      },
      {
        id: "obtain_guardian_order",
        authorityScope: "PROBATE",
        scope: "CORE",
        title: "Obtain Guardian Ad Litem Order",
        description: "Receive court order appointing guardian ad litem. Provide guardian with all estate information.",
        estimatedTime: "2-3 weeks",
        category: "court-issued",
        isOptional: true,
        requiredDocs: ["Court Order"],
        dependencies: ["petition_guardian_ad_litem"],
        links: [{
          label: "About Guardian Appointment Orders",
          url: "#"
        }],
        alerts: [{
          type: "info",
          message: "Guardian ad litem fees are paid by the estate, typically $150-300/hour."
        }]
      },
      {
        id: "oh_family_allowance",
        authorityScope: "PROBATE",
        scope: "US-OH",
        title: "Surviving Spouse Allowance / Family Allowance (ORC Chapter 2106)",
        description: "Surviving spouse may claim statutory allowance prior to general distribution (ORC Chapter 2106).",
        estimatedTime: "2-4 weeks",
        category: "probate",
        applicability: {
          states: ["OH"],
          predicatesAny: ["isSpouse"]
        },
        links: [{ label: "ORC Chapter 2106", url: "https://codes.ohio.gov/ohio-revised-code/chapter-2106" }],
        alerts: [{
          type: "info",
          message: "Statutory Allowance: Ohio law provides a support allowance for the surviving spouse and minor children."
        }]
      }
    ]
  },
  {
    phase: "court_filing",
    title: "Petition & Authority",
    subtitle: "Petition, Notices, Letters",
    milestone: "Court Filing → Authority",
    description: "Submitting the probate petition to the court to obtain official fiduciary authority (Letters).",
    tasks: [
      // ── State-Specific Court Filing Tasks ──────────────────────────────
      {
        id: "file_tx_independent_admin",
        authorityScope: "PROBATE",
        scope: "US-TX",
        title: "File Application for Independent Administration",
        description: "Texas allows Independent Administration, which lets the executor act without continuous court supervision. File the application with the county or statutory probate court.",
        estimatedTime: "2-4 hours",
        category: "probate",
        trackCompatibility: ["PROBATE"],
        applicability: { states: ["TX"], variants: ["TESTATE"] },
        requiredDocs: ["Original Will", "Death Certificate", "Application Form"],
        alerts: [{
          type: "info",
          message: "Independent Administration is the preferred TX probate path. The will must explicitly grant or not prohibit independent administration."
        }],
        links: [{ label: "TX Estates Code §401", url: "https://statutes.capitol.texas.gov/Docs/ES/htm/ES.401.htm" }]
      },
      {
        id: "file_tx_muniment_of_title",
        authorityScope: "PROBATE",
        scope: "US-TX",
        title: "File Application to Probate Will as Muniment of Title",
        description: "For TX estates with a valid will and no unpaid debts (other than secured debts on real property), Muniment of Title allows the will to be admitted to probate without appointing an executor.",
        estimatedTime: "2-4 hours",
        category: "probate",
        trackCompatibility: ["PROBATE"],
        applicability: { states: ["TX"], variants: ["TESTATE"] },
        requiredDocs: ["Original Will", "Death Certificate", "Application Form"],
        alerts: [{
          type: "info",
          message: "Muniment of Title is a simplified TX probate. No Letters Testamentary are issued — the court order itself serves as title transfer authority."
        }],
        links: [{ label: "TX Estates Code §257", url: "https://statutes.capitol.texas.gov/Docs/ES/htm/ES.257.htm" }]
      },
      {
        id: "tx_muniment_compliance_check",
        authorityScope: "PROBATE",
        scope: "US-TX",
        title: "Verify Muniment of Title Eligibility",
        description: "Before filing for Muniment of Title, verify the estate meets all requirements: valid will, no unsecured debts, no Medicaid recovery claims, and no need for estate administration.",
        estimatedTime: "1-2 hours",
        category: "probate",
        trackCompatibility: ["PROBATE"],
        applicability: { states: ["TX"], variants: ["TESTATE"] },
        isConditional: true,
        conditionalRequirementLabel: "Required if considering Muniment of Title",
        requiredDocs: ["Will Review", "Debt Inventory", "Medicaid Status Check"],
        alerts: [
          {
            type: "important",
            message: "Muniment of Title is ONLY available if the estate has no unpaid debts (except secured debts on real property) and no Medicaid recovery claims."
          },
          {
            type: "caution",
            message: "If debts exist, you must use Independent or Dependent Administration instead."
          }
        ],
        links: [{ label: "TX Estates Code §257.001", url: "https://statutes.capitol.texas.gov/Docs/ES/htm/ES.257.htm" }]
      },
      {
        id: "file_tx_dependent_admin",
        authorityScope: "PROBATE",
        scope: "US-TX",
        title: "File Application for Dependent Administration",
        description: "For TX intestate estates or when Independent Administration is not available, file for Dependent Administration which requires court supervision for most actions.",
        estimatedTime: "2-4 hours",
        category: "probate",
        trackCompatibility: ["PROBATE"],
        applicability: { states: ["TX"], variants: ["INTESTATE"] },
        requiredDocs: ["Death Certificate", "Heirship Information", "Application Form"],
        alerts: [{
          type: "info",
          message: "Dependent Administration requires court approval for most actions including sales, payments, and distributions. It takes longer but provides more oversight."
        }],
        links: [{ label: "TX Estates Code §359", url: "https://statutes.capitol.texas.gov/Docs/ES/htm/ES.359.htm" }]
      },
      {
        id: "tx_admin_type_branching",
        authorityScope: "PROBATE",
        scope: "US-TX",
        title: "Determine TX Administration Type",
        description: "Texas requires choosing between Independent Administration (preferred, less court oversight), Dependent Administration (court-supervised), or Muniment of Title (no executor). The choice depends on will terms, debts, and heir cooperation.",
        estimatedTime: "1-2 hours",
        category: "probate",
        trackCompatibility: ["PROBATE"],
        applicability: { states: ["TX"] },
        isAttorneyReviewNode: true,
        attorneyReviewReason: "Strategic Decision: Administration type affects timeline, costs, and fiduciary responsibilities. This decision is difficult to change later.",
        alerts: [
          {
            type: "important",
            message: "Independent Administration: Available if will allows it OR all distributees agree. This is the preferred path for most TX estates."
          },
          {
            type: "info",
            message: "Muniment of Title: Only for estates with no unsecured debts and no need for administration."
          },
          {
            type: "caution",
            message: "Dependent Administration: Required if heirs don't agree to independent administration or if court supervision is needed."
          }
        ]
      },
      {
        id: "tx_ten_day_posting",
        authorityScope: "PROBATE",
        scope: "US-TX",
        title: "Post Application at Courthouse (10-Day Gate)",
        description: "Texas requires the probate application to be posted at the courthouse for 10 days before the hearing can occur. This gives interested parties notice of the proceeding.",
        estimatedTime: "10 days (mandatory)",
        category: "probate",
        trackCompatibility: ["PROBATE"],
        applicability: { states: ["TX"] },
        isLongHorizon: true,
        requiredDocs: ["Posted Application Notice"],
        alerts: [
          {
            type: "important",
            message: "MANDATORY 10-DAY POSTING: TX Estates Code §54 requires the application to be posted at the courthouse for 10 days before hearing. No hearing can occur before this period expires."
          },
          {
            type: "info",
            message: "The court clerk handles posting. Verify posting date to calculate earliest hearing date."
          }
        ],
        links: [{ label: "TX Estates Code §54.001", url: "https://statutes.capitol.texas.gov/Docs/ES/htm/ES.54.htm" }]
      },
      {
        id: "file_tx_heirship_proceeding",
        authorityScope: "PROBATE",
        scope: "US-TX",
        title: "File Proceeding to Determine Heirship",
        description: "For TX intestate estates where heirs are unknown, missing, or their shares are disputed, file a proceeding to determine heirship. This requires a court-appointed attorney ad litem to represent unknown heirs.",
        estimatedTime: "4-8 weeks",
        category: "probate",
        trackCompatibility: ["PROBATE"],
        applicability: { states: ["TX"], variants: ["INTESTATE"] },
        isConditional: true,
        conditionalRequirementLabel: "Required if heirs are unknown, missing, or disputed",
        isAttorneyReviewNode: true,
        attorneyReviewReason: "Heirship proceedings involve complex genealogy and due diligence requirements. An attorney ad litem must be appointed to represent unknown heirs.",
        requiredDocs: ["Family Tree Affidavit", "Death Certificate", "Genealogical Research"],
        alerts: [
          {
            type: "important",
            message: "An attorney ad litem will be appointed by the court to represent unknown or missing heirs. Their fees are paid by the estate."
          },
          {
            type: "warning",
            message: "Heirship proceedings can add significant time and cost. Ensure thorough genealogical research is conducted."
          }
        ],
        links: [{ label: "TX Estates Code §202", url: "https://statutes.capitol.texas.gov/Docs/ES/htm/ES.202.htm" }]
      },
      {
        id: "tx_homestead_protection",
        authorityScope: "PROBATE",
        scope: "US-TX",
        title: "Assert Texas Homestead Protections",
        description: "Texas homestead property is protected from most creditor claims and passes directly to surviving spouse and/or minor children. Assert these protections to preserve the family home.",
        estimatedTime: "1-2 hours",
        category: "probate",
        trackCompatibility: ["PROBATE", "AFFIDAVIT"],
        applicability: { states: ["TX"] },
        isConditional: true,
        conditionalRequirementLabel: "Required if decedent owned Texas homestead property",
        requiredDocs: ["Property Deed", "Homestead Affidavit"],
        alerts: [
          {
            type: "important",
            message: "Texas homestead is protected from most creditor claims (TX Constitution Art. XVI, §51). It passes to surviving spouse and/or minor children outside the probate estate."
          },
          {
            type: "info",
            message: "Rural homestead: Up to 200 acres for family. Urban homestead: Up to 1 acre."
          }
        ],
        links: [
          { label: "TX Estates Code §102", url: "https://statutes.capitol.texas.gov/Docs/ES/htm/ES.102.htm" },
          { label: "TX Constitution Art. XVI, §51", url: "https://statutes.capitol.texas.gov/Docs/CN/htm/CN.16.htm" }
        ]
      },
      {
        id: "tx_exempt_property",
        authorityScope: "PROBATE",
        scope: "US-TX",
        title: "Claim Texas Exempt Property Allowances",
        description: "Texas provides exempt property allowances including homestead, personal property exemptions up to $100,000 (family) or $50,000 (single), and family allowances for support during administration.",
        estimatedTime: "2-3 hours",
        category: "probate",
        trackCompatibility: ["PROBATE"],
        applicability: { states: ["TX"] },
        isConditional: true,
        conditionalRequirementLabel: "Available for surviving spouse and/or minor children",
        requiredDocs: ["Exempt Property Inventory", "Family Allowance Request"],
        alerts: [
          {
            type: "important",
            message: "Exempt personal property includes home furnishings, heirlooms, food, clothing, and tools (up to $100,000 for family, $50,000 for single person)."
          },
          {
            type: "info",
            message: "Family allowance provides funds for support during administration. Priority over most creditor claims."
          }
        ],
        links: [{ label: "TX Estates Code §353", url: "https://statutes.capitol.texas.gov/Docs/ES/htm/ES.353.htm" }]
      },
      {
        id: "tx_small_estate_affidavit",
        authorityScope: "PROBATE",
        scope: "US-TX",
        title: "File Small Estate Affidavit (TX §205)",
        description: "For TX estates under $75,000 with no real property (other than homestead), file a Small Estate Affidavit to collect assets without formal probate. All distributees must sign.",
        estimatedTime: "1-2 hours",
        category: "probate",
        trackCompatibility: ["PROBATE", "AFFIDAVIT"],
        applicability: { states: ["TX"] },
        isConditional: true,
        conditionalRequirementLabel: "Available if estate value ≤ $75,000 and no real property other than homestead",
        requiredDocs: ["Small Estate Affidavit", "Death Certificate", "Asset Information"],
        alerts: [
          {
            type: "important",
            message: "TX Estates Code §205 — Available 30 days after death. Estate must be ≤ $75,000 and contain no real property (except homestead)."
          },
          {
            type: "warning",
            message: "ALL distributees must sign the affidavit. If any heir refuses or is unavailable, this path is not available."
          }
        ],
        links: [{ label: "TX Estates Code §205", url: "https://statutes.capitol.texas.gov/Docs/ES/htm/ES.205.htm" }]
      },
      {
        id: "tx_bond_determination",
        authorityScope: "PROBATE",
        scope: "US-TX",
        title: "Determine TX Bond Requirement",
        description: "Texas generally does not require bond for Independent Administration if the will waives it (standard). Bond may be required for Dependent Administration or if will explicitly demands it.",
        estimatedTime: "1 hour",
        category: "probate",
        trackCompatibility: ["PROBATE"],
        applicability: { states: ["TX"] },
        tags: ["fiduciary", "statutory"],
        requiredDocs: ["Will Review (bond clause)", "Heir Consent Forms (if applicable)"],
        outputs: ["Bond Requirement Decision"],
        alerts: [
          {
            type: "info",
            message: "Most TX wills waive bond requirement. If will is silent, all heirs can consent to waive bond."
          },
          {
            type: "caution",
            message: "Dependent Administration typically requires bond unless all heirs consent to waive."
          }
        ],
        links: [{ label: "TX Estates Code §401", url: "https://statutes.capitol.texas.gov/Docs/ES/htm/ES.401.htm" }]
      },
      {
        id: "tx_filing_fee_calculation",
        authorityScope: "PROBATE",
        scope: "US-TX",
        title: "Calculate TX Court Filing Fees",
        description: "Texas probate filing fees vary by county. Calculate fees based on estate type (Muniment, Independent, Dependent) and county fee schedule.",
        estimatedTime: "30 minutes",
        category: "probate",
        trackCompatibility: ["PROBATE"],
        applicability: { states: ["TX"] },
        outputs: ["Filing Fee Estimate"],
        alerts: [
          {
            type: "info",
            message: "TX filing fees vary by county. Check with the specific statutory or county probate court for current fee schedule."
          },
          {
            type: "info",
            message: "Additional fees may apply for citations, publications, and certified copies of court orders."
          }
        ]
      },
      {
        id: "tx_citation_issuance",
        authorityScope: "PROBATE",
        scope: "US-TX",
        title: "Obtain and Serve TX Citation",
        description: "Texas requires citation to be issued and served on all distributees and named beneficiaries. Personal service is required unless waived by signed waiver.",
        estimatedTime: "1-2 weeks",
        category: "probate",
        trackCompatibility: ["PROBATE"],
        applicability: { states: ["TX"] },
        requiredDocs: ["Citation", "Proof of Service", "Waivers (if any)"],
        alerts: [
          {
            type: "important",
            message: "Personal service is required unless the distributee signs a Waiver of Citation. Publication is not a substitute for personal service on known distributees."
          }
        ],
        links: [{ label: "TX Estates Code §51", url: "https://statutes.capitol.texas.gov/Docs/ES/htm/ES.51.htm" }]
      },
      // ── Ohio-Specific Filing & Support Tasks ──────────────────────────
      {
        id: "oh_certificate_of_transfer",
        authorityScope: "PROBATE",
        scope: "US-OH",
        title: "File Application for Certificate of Transfer (ORC §2113.61)",
        description: "In Ohio, real property can be transferred by filing an application for a Certificate of Transfer (ORC §2113.61). The certificate serves as the deed and must be recorded with the county recorder where the property is located.",
        estimatedTime: "2-4 hours",
        category: "probate",
        trackCompatibility: ["PROBATE"],
        applicability: { states: ["OH"] },
        isConditional: true,
        conditionalRequirementLabel: "Required if estate includes Ohio real property",
        requiredDocs: ["Application for Certificate of Transfer", "Legal Description of Property"],
        alerts: [{
          type: "important",
          message: "The Certificate of Transfer is the primary method for transferring real estate title in Ohio probate. It must be filed with the court and then recorded in the county deed records."
        }],
        links: [{ label: "ORC §2113.61", url: "https://codes.ohio.gov/ohio-revised-code/section-2113.61" }]
      },
      {
        id: "oh_family_allowance",
        authorityScope: "PROBATE",
        scope: "US-OH",
        title: "Claim Ohio Family Allowance (ORC §2106.13)",
        description: "The surviving spouse and/or minor children are entitled to a family allowance of $40,000 for support (ORC Chapter 2106). This claim must be filed with the probate court and has priority over most general creditor claims.",
        estimatedTime: "1-2 hours",
        category: "probate",
        trackCompatibility: ["PROBATE"],
        applicability: { states: ["OH"] },
        isConditional: true,
        conditionalRequirementLabel: "Available for surviving spouse or minor children",
        requiredDocs: ["Family Allowance Claim Form"],
        alerts: [{
          type: "info",
          message: "The $40,000 allowance is a unified amount for the spouse and minor children. It is exempt from most creditors."
        }],
        links: [{ label: "ORC Chapter 2106", url: "https://codes.ohio.gov/ohio-revised-code/chapter-2106" }]
      },

      {
        id: "file_fl_disposition_without_admin",
        authorityScope: "PROBATE",
        scope: "US-FL",
        title: "File Petition for Disposition Without Administration",
        description: "For very small FL estates (no real property, assets only cover exempt property/preferences and funeral/medical expenses), file for disposition without formal administration.",
        estimatedTime: "1-2 hours",
        category: "probate",
        trackCompatibility: ["PROBATE"],
        applicability: { states: ["FL"] },
        requiredDocs: ["Death Certificate", "Petition Form"],
        alerts: [{
          type: "info",
          message: "FL Stat. §735.301 — Available when estate assets consist only of exempt property, funeral costs, and last illness expenses."
        }]
      },
      {
        id: "file_ny_surrogate_probate",
        authorityScope: "PROBATE",
        scope: "US-NY",
        title: "File Probate Petition with Surrogate's Court",
        description: "Submit the probate petition (Form P-1) to the county Surrogate's Court. NY uses the Surrogate's Court Procedure Act (SCPA) for all probate proceedings.",
        estimatedTime: "2-4 hours",
        category: "probate",
        trackCompatibility: ["PROBATE"],
        applicability: { states: ["NY"], variants: ["TESTATE"] },
        requiredDocs: ["Original Will", "Death Certificate", "P-1 Petition", "Waivers & Consents"],
        alerts: [{
          type: "info",
          message: "NY Surrogate's Court filing fees range from $45 to $1,250 based on estate value (SCPA §2402)."
        }],
        links: [{ label: "NY Surrogate's Court Forms", url: "https://ww2.nycourts.gov/forms/surrogates/" }]
      },
      {
        id: "file_ny_ancillary_probate",
        authorityScope: "PROBATE",
        scope: "US-NY",
        title: "File Petition for Ancillary Probate (NY)",
        description: "For out-of-state decedents who owned property in NY, file an ancillary probate petition (Form ET-3) with the Surrogate's Court in the county where the NY property is located.",
        estimatedTime: "2-4 hours",
        category: "probate",
        trackCompatibility: ["PROBATE"],
        applicability: { states: ["NY"] },
        requiredDocs: ["Certified Letters from Home State", "Authenticated Will", "ET-3 Petition"],
        alerts: [{
          type: "important",
          message: "Ancillary probate is required for NY real property owned by non-NY decedents."
        }]
      },
      {
        id: "file_ga_petition",
        authorityScope: "PROBATE",
        scope: "US-GA",
        title: "File Petition for Letters in Probate Court",
        description: "Submit a petition for Letters Testamentary (with will) or Letters of Administration (without will) to the Georgia Probate Court in the county of the decedent's domicile.",
        estimatedTime: "2-4 hours",
        category: "probate",
        trackCompatibility: ["PROBATE"],
        applicability: { states: ["GA"] },
        requiredDocs: ["Original Will (if any)", "Death Certificate", "Petition Form"],
        alerts: [{
          type: "info",
          message: "GA Probate Courts handle all estates. Filing fees vary by county."
        }]
      },
      {
        id: "file_ga_no_admin",
        authorityScope: "PROBATE",
        scope: "US-GA",
        title: "File 'No Administration Necessary' Petition",
        description: "For GA estates under $10,000, file a petition declaring that no administration is necessary under O.C.G.A. § 53-2-40.",
        estimatedTime: "1-2 hours",
        category: "probate",
        trackCompatibility: ["PROBATE", "AFFIDAVIT"],
        applicability: { states: ["GA"] },
        requiredDocs: ["Death Certificate", "Petition Form"],
        alerts: [{
          type: "info",
          message: "This simplified path avoids full probate for very small GA estates."
        }]
      },
      // ── GA Year's Support Workflow (3 tasks) ──────────────────────────────────
      {
        id: "ga_years_support_petition",
        authorityScope: "PROBATE",
        scope: "US-GA",
        title: "File Petition for Year's Support (O.C.G.A. §53-3-1)",
        description: "Surviving spouse and/or minor children may petition for a Year's Support award. This proceeding can take priority over creditor claims and provides a 12-month maintenance allowance for the family.",
        estimatedTime: "2-4 hours",
        category: "probate",
        trackCompatibility: ["PROBATE"],
        applicability: { states: ["GA"] },
        isConditional: true,
        conditionalRequirementLabel: "Available if surviving spouse or minor children exist",
        requiredDocs: ["Petition for Year's Support", "Death Certificate", "Asset Schedule", "Family Budget/Needs Statement"],
        alerts: [
          {
            type: "important",
            message: "Priority Claim: Year's Support awards take priority over most creditor claims under Georgia law. This is a key protection for surviving families."
          },
          {
            type: "info",
            message: "Year's Support can include personal property, real property, or both. The court considers the family's needs and the estate's value."
          }
        ],
        links: [{
          label: "O.C.G.A. §53-3-1",
          url: "https://law.justia.com/codes/georgia/2022/title-53/chapter-3/article-1/"
        }]
      },
      {
        id: "ga_years_support_citation",
        authorityScope: "PROBATE",
        scope: "US-GA",
        title: "Issue Citation for Year's Support (GA)",
        description: "The probate court will issue citation to be served on interested parties. Citation must be published and/or served to heirs and creditors.",
        estimatedTime: "1-2 weeks",
        category: "probate",
        trackCompatibility: ["PROBATE"],
        applicability: { states: ["GA"] },
        dependencies: ["ga_years_support_petition"],
        requiredDocs: ["Citation", "Proof of Service or Publication"],
        alerts: [{
          type: "info",
          message: "Objections to Year's Support must be filed within the time specified in the citation (typically 10 days after service or 30 days after publication)."
        }]
      },
      {
        id: "ga_years_support_order",
        authorityScope: "PROBATE",
        scope: "US-GA",
        title: "Obtain Year's Support Order (GA)",
        description: "Receive court order granting Year's Support award. If real property is involved, record the order with the county clerk to transfer title.",
        estimatedTime: "2-4 weeks after petition",
        category: "court-issued",
        trackCompatibility: ["PROBATE"],
        applicability: { states: ["GA"] },
        dependencies: ["ga_years_support_petition", "ga_years_support_citation"],
        requiredDocs: ["Year's Support Order"],
        outputs: ["Year's Support Award", "Recorded Order (if real property)"],
        alerts: [{
          type: "important",
          message: "If real property is awarded as Year's Support, record the certified order with the county clerk where the property is located to transfer title."
        }]
      },
      {
        id: "file_ma_informal_probate",
        authorityScope: "PROBATE",
        scope: "US-MA",
        title: "File Informal Probate Petition (MUPC)",
        description: "Under the Massachusetts Uniform Probate Code, file an informal probate petition with the Probate & Family Court. This streamlined process is for uncontested estates.",
        estimatedTime: "2-4 hours",
        category: "probate",
        trackCompatibility: ["PROBATE"],
        applicability: { states: ["MA"], variants: ["TESTATE"] },
        requiredDocs: ["Original Will", "Death Certificate", "MPC 150 Petition"],
        alerts: [{
          type: "info",
          message: "Informal probate under MUPC (M.G.L. c. 190B, § 3-301) is processed by the Magistrate without a hearing."
        }]
      },
      {
        id: "file_ma_voluntary_admin",
        authorityScope: "PROBATE",
        scope: "US-MA",
        title: "File Voluntary Administration Statement (MA)",
        description: "For MA estates ≤ $25,000 with no real property, file a Voluntary Administration statement to bypass full probate.",
        estimatedTime: "1-2 hours",
        category: "probate",
        trackCompatibility: ["PROBATE", "AFFIDAVIT"],
        applicability: { states: ["MA"] },
        requiredDocs: ["Death Certificate", "MPC 170 Form"],
        alerts: [{
          type: "info",
          message: "M.G.L. c. 190B, § 3-1201 — Available 30 days after death for qualifying estates."
        }]
      },
      // ── NJ-Specific Court Filing Tasks ──────────────────────────────────
      {
        id: "file_nj_surrogate_probate",
        authorityScope: "PROBATE",
        scope: "US-NJ",
        title: "File Probate Application with County Surrogate (NJ)",
        description: "Submit the probate application to the County Surrogate's Court. NJ probate is handled by the Surrogate in each county for uncontested matters.",
        estimatedTime: "2-4 hours",
        category: "probate",
        trackCompatibility: ["PROBATE"],
        applicability: { states: ["NJ"], variants: ["TESTATE"] },
        requiredDocs: ["Original Will", "Death Certificate", "Probate Application", "Executor Affidavit"],
        alerts: [{
          type: "info",
          message: "NJ Surrogate's Court probate is typically uncontested. If contested, the matter transfers to Superior Court, Chancery Division, Probate Part."
        }],
        links: [{ label: "NJ Judiciary Probate Information", url: "https://www.njcourts.gov/self-help/probate" }],
        formNames: ["Probate Application", "Executor's Affidavit", "Certificate of Compliances"]
      },
      {
        id: "file_nj_administration",
        authorityScope: "PROBATE",
        scope: "US-NJ",
        title: "File Application for Administration (NJ)",
        description: "Submit the administration application to the County Surrogate's Court for intestate estates. Bond is typically required unless waived by all heirs.",
        estimatedTime: "2-4 hours",
        category: "probate",
        trackCompatibility: ["PROBATE"],
        applicability: { states: ["NJ"], variants: ["INTESTATE"] },
        requiredDocs: ["Death Certificate", "Administration Application", "Bond or Waiver", "Next of Kin Affidavit"],
        alerts: [{
          type: "important",
          message: "NJ requires bond for administrators unless all heirs sign written consent to waive. Bond amount typically equals the estate value."
        }],
        links: [{ label: "NJ Surrogate's Court Forms", url: "https://www.njcourts.gov/forms/surrogates" }],
        formNames: ["Administration Application", "Administrator's Bond", "Consent to Serve"]
      },
      {
        id: "file_nj_small_estate_affidavit",
        authorityScope: "PROBATE",
        scope: "US-NJ",
        title: "File Small Estate Affidavit (NJ)",
        description: "For NJ estates under $20,000 (or $50,000 if surviving spouse is sole heir), file a Small Estate Affidavit to collect assets without formal probate.",
        estimatedTime: "1-2 hours",
        category: "probate",
        trackCompatibility: ["PROBATE", "AFFIDAVIT"],
        applicability: { states: ["NJ"] },
        isConditional: true,
        conditionalRequirementLabel: "Available if estate value ≤ $20,000 (or $50,000 if spouse is sole heir)",
        requiredDocs: ["Death Certificate", "Small Estate Affidavit Form", "Asset Information"],
        alerts: [
          {
            type: "info",
            message: "N.J.S.A. § 3B:10-3 — Small estate affidavit is available 30 days after death. No real property allowed."
          },
          {
            type: "important",
            message: "Threshold is $20,000 general or $50,000 if surviving spouse is the sole heir."
          }
        ],
        links: [{ label: "NJ Small Estate Information", url: "https://www.njcourts.gov/self-help/small-estate" }],
        formNames: ["Small Estate Affidavit"]
      },
      {
        id: "nj_bond_calculation",
        authorityScope: "PROBATE",
        scope: "US-NJ",
        title: "Calculate NJ Bond Amount (Pre-Filing Estimate)",
        description: "Estimate the NJ bond amount before filing using the preliminary asset scan. NJ calculates bond on PERSONAL PROPERTY only (not real estate): Bond = Personal Property Value + Estimated Annual Estate Income. This estimate is provided to the Surrogate at filing and can be updated after the formal inventory is completed.",
        estimatedTime: "1-2 hours",
        category: "probate",
        trackCompatibility: ["PROBATE"],
        applicability: { states: ["NJ"] },
        tags: ["fiduciary", "statutory"],
        requiredDocs: ["Preliminary Asset List", "Bank / Brokerage Statements (estimated)", "Income Estimate"],
        outputs: ["Estimated Bond Amount", "Bond Waiver Eligibility Assessment"],
        alerts: [
          {
            type: "important",
            message: "BOND FORMULA (N.J.S.A. 3B:15-1): Bond Amount = Value of Personal Property + Estimated Annual Income from Estate. Real estate is EXCLUDED from the bond calculation."
          },
          {
            type: "info",
            message: "Personal property in scope: bank accounts, brokerage/investment accounts, vehicles, household goods, and other tangible personal property. Real estate and non-probate assets (POD/TOD/joint) are excluded."
          },
          {
            type: "info",
            message: "WAIVER SHORTCUT: If the will waives bond, or if ALL heirs sign written consent to waive, the bond can be eliminated entirely — avoiding annual surety premiums."
          }
        ],
        dependencies: ["preliminary_asset_scan"],
        links: [{ label: "NJ Bond Requirements (N.J.S.A. 3B:15-1)", url: "https://www.njcourts.gov/self-help/probate#bond" }]
      },
      {
        id: "nj_elective_share_claim",
        authorityScope: "PROBATE",
        scope: "US-NJ",
        title: "Elective Share Claim (N.J.S.A. 3B:8-1)",
        description: "Surviving spouse may file elective share claim within statutory period if they choose to claim a portion of the estate regardless of the Will's provisions (N.J.S.A. 3B:8-1).",
        estimatedTime: "1-2 hours",
        category: "probate",
        trackCompatibility: ["PROBATE"],
        applicability: { states: ["NJ"] },
        isOptional: true,
        alerts: [
          {
            type: "info",
            message: "N.J.S.A. 3B:8-1: Surviving spouse has a right of election to take a one-third share of the augmented estate."
          },
          {
            type: "info",
            message: "Family Allowance: Reference N.J.S.A. 3B:15-3 for additional spouse/child protection through the family allowance."
          }
        ]
      },
      {
        id: "nj_real_property_transfer",
        authorityScope: "PROBATE",
        scope: "US-NJ",
        title: "Transfer Real Property via Executor’s Deed",
        description: "Execute and record a deed for the transfer of real property if Power of Sale exists under the Will or NJ statutory default authority.",
        estimatedTime: "2-4 hours",
        category: "probate",
        trackCompatibility: ["PROBATE"],
        applicability: { states: ["NJ"] },
        requiresAuthority: true,
        alerts: [{
          type: "important",
          message: "Check for Power of Sale: If the Will doesn't grant Power of Sale, the executor may require court approval or heir consent under N.J.S.A. 3B:14-23."
        }]
      },
      {
        id: "nj_bond_determination",
        authorityScope: "PROBATE",
        scope: "US-NJ",
        title: "Determine Bond Requirement & Waiver Gate (NJ)",
        description: "Determine whether bond is required and whether it can be waived before filing. Two waiver paths: (1) Will waives bond — executor is automatically exempt if the will contains an explicit bond waiver clause; (2) Heir consent — ALL heirs/beneficiaries must sign notarized written consent. If neither path is available, obtain a surety bond before Letters are issued.",
        estimatedTime: "1-2 hours",
        category: "probate",
        trackCompatibility: ["PROBATE"],
        applicability: { states: ["NJ"] },
        tags: ["fiduciary", "statutory"],
        requiredDocs: ["Will (review for bond waiver clause)", "Bond Amount Estimate", "Heir/Beneficiary Contact List"],
        outputs: ["Bond Requirement Decision", "Waiver Path Selection"],
        alerts: [
          {
            type: "important",
            message: "ADMINISTRATOR BOND: Mandatory for intestate estates (N.J.S.A. 3B:15-1) unless ALL heirs sign written consent to waive. Bond amount = personal property value + estimated annual income."
          },
          {
            type: "info",
            message: "EXECUTOR BOND: Required UNLESS the will explicitly waives bond. If the will is silent, collect notarized waivers from ALL beneficiaries to avoid bond cost. A single refusal means bond is required."
          },
          {
            type: "info",
            message: "NEXT STEPS: If bond can be waived → file Bond Waiver Affidavit. If bond is required → obtain surety bond or consider bond without surety (court approval required)."
          }
        ],
        dependencies: ["nj_bond_calculation"]
      },
      {
        id: "nj_bond_waiver_affidavit",
        authorityScope: "PROBATE",
        scope: "US-NJ",
        title: "File Bond Waiver Affidavit (If Applicable)",
        description: "If all heirs/beneficiaries consent to waive bond, file a Bond Waiver Affidavit with the Surrogate's Court. Each heir must sign and notarize their consent.",
        estimatedTime: "1-2 weeks",
        category: "probate",
        trackCompatibility: ["PROBATE"],
        applicability: { states: ["NJ"] },
        tags: ["fiduciary", "statutory"],
        isConditional: true,
        conditionalRequirementLabel: "Required if seeking to waive bond (all heirs must consent)",
        requiredDocs: ["Bond Waiver Affidavit", "Notarized Signatures from ALL Heirs/Beneficiaries"],
        alerts: [
          {
            type: "warning",
            message: "UNANIMOUS CONSENT REQUIRED: ALL heirs/beneficiaries must sign the waiver. A single missing signature means bond is required."
          },
          {
            type: "info",
            message: "Cost Savings: Bond premiums typically cost 0.5-2% of the bond amount annually. Waiving bond can save significant costs."
          }
        ],
        dependencies: ["nj_bond_determination"]
      },
      {
        id: "nj_bond_obtain_surety",
        authorityScope: "PROBATE",
        scope: "US-NJ",
        title: "Obtain Bond with Surety (If Required)",
        description: "If bond cannot be waived, obtain a surety bond from a licensed surety company. The bond guarantees faithful performance of fiduciary duties. Premium is paid annually.",
        estimatedTime: "1-2 weeks",
        category: "probate",
        trackCompatibility: ["PROBATE"],
        applicability: { states: ["NJ"] },
        tags: ["fiduciary", "statutory"],
        isConditional: true,
        conditionalRequirementLabel: "Required if bond waiver not obtained",
        requiredDocs: ["Bond Application", "Credit Check Authorization", "Surety Company Agreement"],
        alerts: [
          {
            type: "info",
            message: "SURETY BOND OPTIONS: Standard surety bond requires a surety company. Premium typically 0.5-2% of bond amount annually. Shop around for best rates."
          },
          {
            type: "important",
            message: "BOND WITH SURETY: The surety company guarantees the bond amount. If the fiduciary misappropriates funds, the surety pays and then pursues the fiduciary."
          }
        ],
        dependencies: ["nj_bond_determination"]
      },
      {
        id: "nj_bond_without_surety",
        authorityScope: "PROBATE",
        scope: "US-NJ",
        title: "Consider Bond Without Surety (If Applicable)",
        description: "NJ allows bond without surety (personal obligation only) if the estate is solvent and all beneficiaries consent. This option has no premium cost but exposes the fiduciary to full personal liability.",
        estimatedTime: "1-2 hours",
        category: "probate",
        trackCompatibility: ["PROBATE"],
        applicability: { states: ["NJ"] },
        tags: ["fiduciary", "statutory"],
        isConditional: true,
        conditionalRequirementLabel: "Available for solvent estates with beneficiary consent",
        alerts: [
          {
            type: "caution",
            message: "PERSONAL LIABILITY: Bond without surety means NO insurance protection. The fiduciary is personally on the hook for the full bond amount if misconduct occurs."
          },
          {
            type: "info",
            message: "Cost Savings: No annual premium. However, this option is rarely used because it requires court approval and full beneficiary consent."
          }
        ],
        dependencies: ["nj_bond_determination"]
      },
      {
        id: "nj_contested_probate_escalation",
        authorityScope: "PROBATE",
        scope: "US-NJ",
        title: "Escalate Contested Probate to Superior Court (NJ)",
        description: "If the probate is contested, the matter transfers from the County Surrogate to the Superior Court, Chancery Division, Probate Part for litigation.",
        estimatedTime: "Ongoing",
        category: "probate",
        trackCompatibility: ["PROBATE"],
        applicability: { states: ["NJ"] },
        isConditional: true,
        conditionalRequirementLabel: "Required if probate is contested",
        isAttorneyReviewNode: true,
        attorneyReviewReason: "Litigation Risk: Contested probate requires representation in Superior Court. The Surrogate cannot adjudicate disputes.",
        requiredDocs: ["Complaint/Motion", "Supporting Documents"],
        alerts: [{
          type: "caution",
          message: "Contested probate in NJ moves from Surrogate's Court to Superior Court, Chancery Division, Probate Part. This significantly increases timeline and costs."
        }],
        dependencies: ["file_nj_surrogate_probate"]
      },
      {
        id: "nj_real_estate_power_of_sale",
        authorityScope: "PROBATE",
        scope: "US-NJ",
        title: "Determine Power of Sale Authority (NJ)",
        description: "Review the will and NJ law to determine if you have power of sale for real property without court confirmation, or if court approval is required.",
        estimatedTime: "1-2 hours",
        category: "probate",
        trackCompatibility: ["PROBATE"],
        applicability: { states: ["NJ"] },
        isConditional: true,
        conditionalRequirementLabel: "Required if estate contains NJ real property",
        isAttorneyReviewNode: true,
        attorneyReviewReason: "Real Estate Sale: NJ requires determining if power of sale is granted by will or if court confirmation is needed.",
        alerts: [
          {
            type: "info",
            message: "If the will grants power of sale, you may sell without court confirmation. Otherwise, court approval of the sale may be required."
          },
          {
            type: "important",
            message: "NJ Inheritance Tax Waiver may be required before transferring title. Check with the county recording office."
          }
        ],
        dependencies: ["receive_letters_testamentary", "receive_letters_administration"]
      },
      // ── End NJ-Specific Court Filing Tasks ────────────────────────────────
      // ── End State-Specific Court Filing Tasks ──────────────────────────
      {
        id: "file_probate_petition",
        authorityScope: "PROBATE",
        title: "File Petition for Probate",
        description: "Submit the probate petition and original Will to the court to open the estate case and request appointment as Executor.",
        utility: "Required to obtain legal authority to access accounts.",
        estimatedTime: "2-4 hours",
        category: "probate",
        trackCompatibility: ["PROBATE"],
        exclusiveGroup: "filing_path",
        applicability: { variants: ["TESTATE"] },
        helpArticleId: "probate-steps",
        primaryActionLabel: "Generate Petition",
        primaryActionUrl: "/probate",
        formNames: ["Petition for Probate"],
        requiredDocs: [
          "Original Will",
          "Death Certificate",
          "Petition Form"
        ],
        alerts: [
          {
            type: "info",
            message: "Check your local court for the current filing fee. File within the state's recommended timeframe."
          }
        ],
        stateOverrides: {
          "NY": {
            title: "File Petition for Probate (Form P-1)",
            description: "Submit the P-1 petition to the Surrogate's Court. This initiates the formal probate proceeding for a person who died WITH a Will.",
            formNames: ["P-1", "Notice of Probate"],
            officialForms: [
              { name: "Probate Petition (P-1)", url: "https://www.nycourts.gov/LegacyPDFS/FORMS/surrogates/pdfs/Probate_Petition.pdf" }
            ]
          }
        }
      },
      {
        id: "file_administration_petition",
        authorityScope: "PROBATE",
        title: "File Petition for Administration",
        description: "Submit the administration petition to the court to open the estate case and request appointment as Administrator (since there is no Will).",
        utility: "Required to obtain legal authority to access accounts.",
        estimatedTime: "2-4 hours",
        category: "probate",
        trackCompatibility: ["PROBATE"],
        exclusiveGroup: "filing_path",
        applicability: { variants: ["INTESTATE"] },
        helpArticleId: "administration-steps",
        primaryActionLabel: "Generate Petition",
        primaryActionUrl: "/probate",
        formNames: ["Petition for Administration"],
        requiredDocs: [
          "Death Certificate",
          "Petition Form"
        ],
        alerts: [
          {
            type: "info",
            message: "Check your local court for the current filing fee. Since there is no Will, the court may require a bond."
          }
        ],
        stateOverrides: {
          "NY": {
            title: "File Petition for Administration (Form A-1)",
            description: "Submit the A-1 petition to the Surrogate's Court. This initiates the formal administration proceeding for a person who died WITHOUT a Will.",
            formNames: ["A-1", "Citation", "Waiver & Consent"],
            officialForms: [
              { name: "Administration Petition (A-1)", url: "https://www.nycourts.gov/LegacyPDFS/FORMS/surrogates/pdfs/Admin_Petition.pdf" }
            ]
          }
        }
      },
      {
        id: "pay_filing_fee",
        authorityScope: "PROBATE",
        title: "Pay Court Filing Fee",
        description: "Pay the required court filing fee to process the petition. Fees vary by estate value.",
        estimatedTime: "1 day",
        category: "probate",
        trackCompatibility: ["PROBATE"],
        dependencies: ["file_probate_petition", "file_administration_petition"]
      },
      {
        id: "submit_oath_designation",
        authorityScope: "PROBATE",
        title: "Submit Oath and Designation",
        description: "Sign and submit the Oath and Designation form, officially agreeing to serve as the fiduciary.",
        estimatedTime: "1-2 days",
        category: "probate",
        trackCompatibility: ["PROBATE"],
        dependencies: ["file_probate_petition", "file_administration_petition"]
      },
      {
        id: "obtain_citation",
        authorityScope: "PROBATE",
        title: "Obtain Citation from Court",
        description: "Receive the issued Citation from the court, which sets the hearing date and commands interested parties to appear.",
        estimatedTime: "1-3 weeks",
        category: "probate",
        trackCompatibility: ["PROBATE"],
        dependencies: ["file_probate_petition", "file_administration_petition"],
        isConditional: true,
        conditionalRequirementLabel: "Required when contested or court schedules a hearing",
        stateOverrides: {
          NJ: {
            title: "Obtain Citation (Contested / Surrogate-Directed Only)",
            description: "In NJ, Citation is only issued when the Surrogate determines a hearing is necessary — e.g., contested matter, missing heirs, or waivers not obtained. Standard uncontested Surrogate's Court probate does not require a Citation.",
            isConditional: true,
            conditionalRequirementLabel: "Required only if estate is contested or Surrogate requires a hearing",
            applicability: {
              predicatesAny: ["isContested", "surrogate_requires_hearing"]
            },
            alerts: [{
              type: "info",
              message: "NJ Uncontested Path: Obtain all Waivers & Consents before filing. The Surrogate probates the will administratively — no Citation or hearing issued."
            }]
          }
        }
      },
      {
        id: "serve_citation",
        authorityScope: "PROBATE",
        title: "Serve Citation on Interested Parties",
        description: "Serve the Citation to all required heirs and interested parties according to strict statutory rules.",
        estimatedTime: "1-3 weeks",
        category: "probate",
        trackCompatibility: ["PROBATE"],
        dependencies: ["obtain_citation"],
        isConditional: true,
        conditionalRequirementLabel: "Required only if a Citation was issued",
        alerts: [{
          type: "warning",
          message: "Service must be completed within strict deadlines before the hearing date. Proper affidavits of service are required."
        }],
        stateOverrides: {
          NJ: {
            title: "Serve Citation (Contested / Surrogate-Directed Only)",
            description: "Serve the Citation only if the Surrogate issued one. Not required for standard uncontested NJ Surrogate's Court probate.",
            isConditional: true,
            conditionalRequirementLabel: "Required only if Citation was issued by the Surrogate",
            applicability: {
              predicatesAny: ["isContested", "surrogate_requires_hearing"]
            }
          }
        }
      },

      {
        id: "attend_probate_hearing",
        authorityScope: "PROBATE",
        title: "Attend Probate Hearing",
        description: "Appear in court for the probate hearing (typically 30-60 days after filing) to confirm the Will and your appointment.",
        estimatedTime: "2-3 hours",
        requiredDocs: ["Valid ID", "Proof of Notice"],
        applicability: { variants: ["TESTATE"] },
        isConditional: true,
        conditionalRequirementLabel: "Required when contested or court schedules a hearing",
        dependencies: ["file_probate_petition"],
        alerts: [
          {
            type: "info",
            message: "Dress professionally. Bring all documents. Hearing is usually brief (5-10 minutes)."
          }
        ],
        stateOverrides: {
          NJ: {
            title: "Attend Probate Hearing (Contested / Surrogate-Directed Only)",
            description: "In NJ, hearings are not required for uncontested Surrogate's Court probate. The Surrogate processes the application administratively. Only attend if the Surrogate schedules a hearing due to a contest or other issue.",
            isConditional: true,
            conditionalRequirementLabel: "Required only if Surrogate schedules a hearing",
            applicability: {
              predicatesAny: ["isContested", "surrogate_requires_hearing"]
            },
            alerts: [{
              type: "info",
              message: "NJ Uncontested: Most NJ probates are processed by the Surrogate without a court hearing. A hearing is only set when disputes arise or the Surrogate determines one is needed."
            }]
          }
        }
      },
      {
        id: "attend_administration_hearing",
        authorityScope: "PROBATE",
        title: "Attend Administration Hearing",
        description: "Appear in court for the administration hearing. Since there is no Will, the court will confirm heirs and appointing you as Administrator.",
        estimatedTime: "2-3 hours",
        requiredDocs: ["Valid ID", "Proof of Notice"],
        applicability: { variants: ["INTESTATE"] },
        isConditional: true,
        conditionalRequirementLabel: "Required when contested or court schedules a hearing",
        dependencies: ["file_administration_petition"],
        alerts: [
          {
            type: "info",
            message: "Dress professionally. The judge will confirm that all distributees have been properly notified."
          }
        ],
        stateOverrides: {
          NJ: {
            title: "Attend Administration Hearing (Contested / Surrogate-Directed Only)",
            description: "In NJ, hearings are not required for uncontested Surrogate's Court administration. The Surrogate processes the application administratively. Only attend if the Surrogate schedules a hearing.",
            isConditional: true,
            conditionalRequirementLabel: "Required only if Surrogate schedules a hearing",
            applicability: {
              predicatesAny: ["isContested", "surrogate_requires_hearing"]
            }
          }
        }
      },
      {
        id: "receive_letters_testamentary",
        authorityScope: "PROBATE",
        title: "Obtain Letters Testamentary",
        description: "Once the Will is admitted to probate, obtain certified copies of your Letters Testamentary.",
        requiresAuthority: true,
        estimatedTime: "1-2 weeks after filing",
        category: "court-issued",
        requiredDocs: ["Letters Testamentary"],
        applicability: { variants: ["TESTATE"] },
        dependencies: ["file_nj_surrogate_probate"],
        stateOverrides: {
          NJ: {
            title: "Obtain Letters Testamentary (NJ)",
            description: "After the County Surrogate approves the probate application, Letters Testamentary are issued — typically at the time of filing for uncontested matters. No hearing is required.",
            estimatedTime: "Same day to 1 week after filing",
            dependencies: ["file_nj_surrogate_probate"]
          },
          NY: {
            title: "Obtain Letters Testamentary",
            description: "After the Surrogate's Court approves the petition, it issues Letters Testamentary granting the executor authority to act on behalf of the estate."
          }
        },
        alerts: [
          {
            type: "important",
            message: "Order 10-15 certified copies. You'll need them for every institution."
          }
        ]
      },
      {
        id: "receive_letters_administration",
        authorityScope: "PROBATE",
        title: "Obtain Letters of Administration",
        description: "Once the court approves the petition, obtain certified copies of your Letters of Administration.",
        requiresAuthority: true,
        estimatedTime: "1-2 weeks after filing",
        category: "court-issued",
        requiredDocs: ["Letters of Administration"],
        applicability: { variants: ["INTESTATE"] },
        dependencies: ["file_nj_administration"],
        stateOverrides: {
          NJ: {
            title: "Obtain Letters of Administration (NJ)",
            description: "After the County Surrogate approves the administration application, Letters of Administration are issued — typically within a few days of filing for uncontested matters. No hearing is required unless the Surrogate directs one.",
            estimatedTime: "Same day to 1 week after filing",
            dependencies: ["attend_administration_hearing", "file_nj_administration"]
          },
          NY: {
            title: "Obtain Letters of Administration",
            description: "The Surrogate's Court issues the Decree and Letters of Administration.",
            officialForms: [
              { name: "Notice of Administration", url: "#" }
            ]
          }
        },
        alerts: [
          {
            type: "important",
            message: "Order 10-15 certified copies. You'll need them for every institution."
          }
        ]
      },
      {
        id: "file_affidavit",
        authorityScope: "PROBATE",
        scope: "CORE",
        title: "File {{smallEstateTerm}}",
        description: "Use the {{smallEstateTerm}} to bypass court probate when probate assets are below {{smallEstateThreshold}} ({{smallEstateCitation}}).",
        utility: "Bypass court entirely for qualifying small estates under {{smallEstateThreshold}}.",
        estimatedTime: "40 days after death",
        category: "court-issued",
        exclusiveGroup: "filing_path",
        isConditional: true,
        conditionalRequirementLabel: "Available when probate assets are below {{smallEstateThreshold}}",
        helpArticleId: "small-estate-affidavit",
        requiredDocs: ["Affidavit Form", "Death Certificate"],
        // NJ has its own specific small estate affidavit task (file_nj_small_estate_affidavit)
        applicability: {
          excludePredicates: ["isNJ"]
        },
        stateOverrides: {
          MN: {
            title: "File Affidavit for Collection of Personal Property (Minnesota)",
            description: "File Affidavit for Collection of Personal Property (Available 30 days after date of death if estate value does not exceed Minnesota statutory threshold — MN Stat. §524.3-1201).",
            estimatedTime: "30 days after death",
            alerts: [{
              type: "important",
              message: "30-Day Wait Required: Minnesota law requires waiting 30 days after the date of death before filing the Small Estate Affidavit (MN Stat. §524.3-1201)."
            }],
          },
          OH: {
            title: "Apply for Release from Administration (OH)",
            description: "Apply for Release from Administration when estate value falls below Ohio statutory threshold (ORC §2113.03). Summary Release from Administration may be available for qualifying estates.",
            estimatedTime: "2-4 weeks",
            alerts: [
              { type: "info", message: "Ohio Threshold: Release from Administration is available for estates under $35,000 ($100,000 if surviving spouse is sole heir)." }
            ],
            links: [{ label: "ORC §2113.03", url: "https://codes.ohio.gov/ohio-revised-code/2113.03" }]
          }
        }
      },
      {
        id: "file_spousal_petition",
        authorityScope: "PROBATE",
        scope: "US-CA",
        title: "File Spousal Property Petition",
        description: "Request court order to transfer property to surviving spouse without full probate.",
        estimatedTime: "4-6 weeks",
        category: "probate",
        isConditional: true,
        conditionalRequirementLabel: "Required if property is being transferred to a surviving spouse or domestic partner",
        helpArticleId: "spousal-property",
        requiredDocs: ["Petition Form", "Death Certificate"],
        applicability: {
          excludePredicates: ["isNJ", "isOH"]
        }
      },
      {
        id: "give_spousal_notice",
        authorityScope: "PROBATE",
        scope: "US-CA",
        title: "Give Notice of Hearing",
        description: "Notify all interested parties about the court hearing date for the petition.",
        estimatedTime: "2 hours",
        category: "probate",
        isOptional: true,
        dependencies: ["file_spousal_petition"],
        requiredDocs: ["Notice of Hearing Form"],
        applicability: {
          excludePredicates: ["isNJ", "isOH"]
        },
        alerts: [{
          type: "important",
          message: "Notice must be served at least 15 days before the hearing date."
        }]
      },
      {
        id: "obtain_spousal_order",
        authorityScope: "PROBATE",
        scope: "US-CA",
        title: "Obtain Spousal Property Order",
        description: "Receive signed court order confirming property ownership transfer to spouse. Record with county recorder if real estate is involved.",
        estimatedTime: "1-2 weeks after hearing",
        category: "court-issued",
        isOptional: true,
        dependencies: ["give_spousal_notice"],
        requiredDocs: ["Court Order"],
        applicability: {
          excludePredicates: ["isNJ", "isOH"]
        },
        alerts: [{
          type: "important",
          message: "A certified copy of this order serves as the new deed for real property."
        }]
      },
      {
        id: "issue_cert_trust",
        authorityScope: "TRUST",
        scope: "CORE",
        title: "Issue Certificate of Trust",
        description: "Formalize successor trustee authority for trust-held assets.",
        estimatedTime: "1 week",
        category: "court-issued",
        isOptional: true,
        helpArticleId: "trust-administration",
        requiredDocs: ["Trust Agreement"]
      },
      {
        id: "manage_business_authority",
        authorityScope: "BOTH",
        scope: "CORE",
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
        id: "file_succession_petition",
        authorityScope: "PROBATE",
        scope: "CORE",
        allowedStates: ["CA", "MN"],
        title: "File Petition to Determine Succession to Real Property",
        description: "File petition with court to determine who inherits the primary residence without full probate.",
        estimatedTime: "2-4 hours",
        category: "probate",
        exclusiveGroup: "filing_path",
        isOptional: true,
        requiredDocs: ["Petition Form", "Death Certificate", "Property Deed"],
        applicability: {
          excludePredicates: ["isOH", "isNJ"]
        },
        stateOverrides: {
          CA: {
            description: "File petition with court to determine who inherits the primary residence without full probate (CA Prob. Code §13150).",
            links: [{
              label: "CA Prob. Code §13150",
              url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=13150.&lawCode=PROB"
            }]
          },
          MN: {
            title: "Obtain Decree of Distribution / Order of Probate (MN)",
            description: "File petition with court for Decree of Distribution to transfer property to heirs/beneficiaries (MN Stat. §524.3-1001).",
            links: [{
              label: "MN Stat. §524.3-1001",
              url: "https://www.revisor.mn.gov/statutes/cite/524.3-1001"
            }],
          }
        },
        links: [{
          label: "About Succession Petitions",
          url: "#"
        }],
        alerts: [{
          type: "info",
          message: "Check local court filing fees. Hearing typically scheduled 30-45 days after filing."
        }]
      },
      {
        id: "give_succession_notice",
        authorityScope: "PROBATE",
        scope: "CORE",
        allowedStates: ["CA", "MN"],
        title: "Give Notice of Hearing",
        description: "Notify all interested parties of the hearing date for the succession petition.",
        estimatedTime: "2 hours",
        category: "probate",
        exclusiveGroup: "filing_path",
        isOptional: true,
        dependencies: ["file_succession_petition"],
        requiredDocs: ["Notice of Hearing Form"],
        applicability: {
          excludePredicates: ["isOH", "isNJ"]
        },
        stateOverrides: {
          CA: {
            description: "Notify all interested parties of the hearing date for the succession petition (CA Prob. Code §13152).",
            links: [{
              label: "CA Prob. Code §13152",
              url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=13152.&lawCode=PROB"
            }]
          },
          MN: {
            title: "Give Notice of Hearing (MN)",
            description: "Notify all interested parties of the hearing date for the distribution petition under Minnesota probate procedure.",
            links: [{
              label: "MN Probate Procedure",
              url: "#"
            }],
          }
        },
        links: [{
          label: "About Notice of Hearing Forms",
          url: "#"
        }],
        alerts: [{
          type: "important",
          message: "Notice must be mailed at least 15 days before the hearing."
        }]
      },
      {
        id: "obtain_succession_order",
        authorityScope: "PROBATE",
        scope: "CORE",
        allowedStates: ["CA", "MN"],
        title: "Obtain Order Determining Succession to Real Property",
        description: "Receive court order determining property succession. Record order with county recorder.",
        estimatedTime: "1-2 weeks after hearing",
        category: "court-issued",
        exclusiveGroup: "filing_path",
        isOptional: true,
        requiredDocs: ["Court Order"],
        dependencies: ["file_succession_petition", "give_succession_notice"],
        applicability: {
          excludePredicates: ["isOH", "isNJ"]
        },
        stateOverrides: {
          CA: {
            description: "Receive court order determining property succession and record it with the county recorder (CA Prob. Code §13154).",
            links: [{
              label: "CA Prob. Code §13154",
              url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=13154.&lawCode=PROB"
            }]
          },
          MN: {
            title: "Obtain Decree of Distribution (MN)",
            description: "Receive court Decree of Distribution and record with county recorder (MN Stat. §524.3-1001).",
            alerts: [{
              type: "important",
              message: "Record the certified Decree of Distribution with the county recorder to transfer title to real property."
            }],
            links: [{
              label: "MN Stat. §524.3-1001",
              url: "https://www.revisor.mn.gov/statutes/cite/524.3-1001"
            }],
          }
        },
        links: [{
          label: "About Succession Orders",
          url: "#"
        }],
        alerts: [{
          type: "important",
          message: "Record certified copy of order with county recorder to transfer title."
        }]
      },
      {
        id: "track_special_notice_requests",
        authorityScope: "PROBATE",
        scope: "CORE",
        title: "Track Special Notice Requests",
        description: "Maintain list of all parties who have requested special notice. You must serve them copies of ALL court filings.",
        estimatedTime: "Ongoing",
        isLongHorizon: true,
        category: "probate",
        isOptional: true,
        dependencies: ["file_probate_petition", "file_administration_petition"],
        requiredDocs: ["Request for Notice Form", "Notice Form"],
        links: [{
          label: "About Special Notice Requests",
          url: "#"
        }],
        alerts: [{
          type: "warning",
          message: "Failure to serve special notice can invalidate court orders. Keep meticulous records."
        }]
      },
      {
        id: "serve_special_notice_parties",
        authorityScope: "PROBATE",
        scope: "CORE",
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
        authorityScope: "PROBATE",
        title: "Avoid Bond Cost",
        description: "Obtain signatures from all heirs to waive the bond requirement, then file the completed waiver with the court.",
        utility: "Cost Savings: Eliminate bond premium (typically $500-$5,000/year).",
        estimatedTime: "1-2 weeks",
        category: "probate",
        isConditional: true,
        conditionalRequirementLabel: "Recommended to save on bond premiums if all heirs agree to waive",
        requiredDocs: ["Bond Waiver Form"],
        dependencies: ["file_probate_petition", "file_administration_petition"],
        links: [{
          label: "About Bond Waivers",
          url: "#"
        }],
        alerts: [{
          type: "important",
          message: "Action Required: ALL heirs must sign. File the completed waivers before the hearing."
        }]
      },
      {
        id: "obtain_bond_waiver_order",
        authorityScope: "PROBATE",
        title: "Obtain Order Waiving Bond",
        description: "Verify that the court has officially waived the bond requirement, typically reflected in a separate Order or the Order for Probate.",
        estimatedTime: "At hearing",
        category: "court-issued",
        isOptional: true,
        requiredDocs: ["Bond Order", "Order for Probate"],
        dependencies: ["handle_bond_waivers"],
        alerts: [{
          type: "info",
          message: "The bond waiver is officially granted within the Order for Probate or a specific Bond Order."
        }]
      },
      {
        id: "respond_to_objections",
        authorityScope: "PROBATE",
        scope: "CORE",
        title: "Respond to Objections",
        description: "If someone files an objection to the petition or will, you must respond formally and prepare for contest hearing.",
        estimatedTime: "2-4 weeks",
        category: "probate",
        isOptional: true, // Controlled by profile.isContested
        requiredDocs: ["Objection Response Form"],
        dependencies: ["file_probate_petition", "file_administration_petition"],
        links: [{
          label: "About Responding to Objections",
          url: "#"
        }],
        alerts: [{
          type: "warning",
          message: "Hire an attorney immediately. Will contests are complex and high-stakes."
        }]
      },
      {
        id: "attend_contest_hearing",
        authorityScope: "PROBATE",
        scope: "CORE",
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
        authorityScope: "PROBATE",
        scope: "CORE",
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
    subtitle: "Inventory & Valuation",
    milestone: "After Authority Issued",
    description: "Identify all probate assets and obtain official appraisals for court filing.",
    tasks: [
      {
        id: "check_unclaimed_property",
        authorityScope: "BOTH",
        scope: "CORE",
        title: "Search State Unclaimed Property",
        description: "Check state databases for dormant accounts, uncashed checks, or forgotten insurance policies.",
        estimatedTime: "1 hour",
        helpArticleId: "asset-discovery",
        links: [{ label: "Search State Unclaimed Property", url: "#" }]
      },
      {
        id: "business_valuation",
        authorityScope: "BOTH",
        scope: "CORE",
        title: "Hire Business Valuation Expert",
        description: "If the estate includes an ongoing business, a professional valuation is required for tax and distribution purposes.",
        estimatedTime: "2-4 weeks",
        isOptional: true
      },
      {
        id: "freeze_accounts",
        authorityScope: "BOTH",
        scope: "CORE",
        title: "Coordinate with Financial Institutions",
        description: "Provide notice of your fiduciary authority to banks, brokerages, and insurance companies to secure accounts.",
        estimatedTime: "2-4 weeks",
        requiresAuthority: true,
        requiredDocs: ["Death Certificate", "Letters of Authority"],
        alerts: [
          {
            type: "important",
            message: "This step formalizes your control over assets and locks in values for reporting purposes."
          }
        ]
      },
      {
        id: "get_dod_values",
        authorityScope: "BOTH",
        scope: "CORE",
        title: "Obtain Date-of-Death Values",
        description: "Request official DOD statements from every financial institution.",
        estimatedTime: "2-4 weeks",
        requiredDocs: ["Letters of Authority"],
        alerts: [
          {
            type: "info",
            message: "These values determine the estate's tax basis and court inventory."
          }
        ]
      },
      {
        id: "hire_appraiser",
        authorityScope: "BOTH",
        scope: "CORE",
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
        authorityScope: "BOTH",
        title: "Complete Inventory & Appraisal",
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
            message: "Due within the statutory window (typically 3-4 months) of Letters issuance. Delays in filing can impede the overall settlement timeline."
          }
        ],
        isAttorneyReviewNode: true
      },

      {
        id: "file_inventory",
        authorityScope: "PROBATE",
        title: "File Inventory with Court",
        description: "Submit the Inventory Form to court and serve copies on all heirs.",
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
      {
        id: "oh_certificate_of_transfer",
        authorityScope: "PROBATE",
        scope: "US-OH",
        title: "Apply for Certificate of Transfer (ORC §2113.61)",
        description: "Probate Court issues Certificate of Transfer to transfer real property and documented interests from the decedent to heirs or beneficiaries as recorded in the county where property is located.",
        estimatedTime: "2-4 weeks",
        category: "court-issued",
        applicability: {
          states: ["OH"],
          predicatesAny: ["hasRealProperty", "isPrimaryResidence"]
        },
        requiredDocs: ["Application for Certificate of Transfer", "Description of Real Estate"],
        links: [{ label: "ORC §2113.61", url: "https://codes.ohio.gov/ohio-revised-code/section-2113.61" }],
        alerts: [{
          type: "important",
          message: "Real Property Transfer: Mandatory for transferring Ohio real estate without a transfer-on-death affidavit."
        }]
      },
      // ── NJ-Specific Inventory Tasks ─────────────────────────────────────
      {
        id: "nj_inventory_90_day_deadline",
        authorityScope: "PROBATE",
        scope: "US-NJ",
        title: "File NJ Inventory (90-Day Deadline)",
        description: "Under N.J.S.A. § 3B:15-1, the inventory must be filed with the County Surrogate within 90 days of appointment. Missing this deadline can result in court sanctions.",
        estimatedTime: "1-2 weeks",
        category: "probate",
        trackCompatibility: ["PROBATE"],
        applicability: { states: ["NJ"] },
        deadlineWarningId: "NJ_INVENTORY_DUE_DATE",
        requiredDocs: ["NJ Inventory Form", "Date-of-Death Appraisals", "Asset Documentation"],
        alerts: [
          {
            type: "important",
            message: "STATUTORY DEADLINE: NJ law requires inventory filing within 90 days of Letters issuance. Request an extension BEFORE the deadline if needed."
          }
        ],
        dependencies: ["file_nj_surrogate_probate", "file_nj_administration", "complete_inventory"],
        links: [{ label: "NJ Inventory Requirements", url: "https://www.njcourts.gov/self-help/probate#inventory" }]
      },
      {
        id: "nj_inventory_extension",
        authorityScope: "PROBATE",
        scope: "US-NJ",
        title: "Request Inventory Extension (NJ)",
        description: "If additional time is needed to complete the inventory, file a request for extension with the Surrogate's Court BEFORE the 90-day deadline expires.",
        estimatedTime: "1-2 days",
        category: "probate",
        trackCompatibility: ["PROBATE"],
        applicability: { states: ["NJ"] },
        isConditional: true,
        conditionalRequirementLabel: "Required if inventory cannot be completed within 90 days",
        alerts: [
          {
            type: "warning",
            message: "FILE BEFORE DEADLINE: Extension requests must be submitted before the 90-day period expires. Late requests may be denied."
          }
        ],
        dependencies: ["nj_inventory_90_day_deadline"]
      },
      // ── End NJ-Specific Inventory Tasks ─────────────────────────────────
      // International Mode - Tax
      {
        id: "tax_withholding_review",
        authorityScope: "BOTH",
        scope: "CORE",
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
        authorityScope: "PROBATE",
        scope: "CORE",
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
    subtitle: "Claims & Exposure Management",
    milestone: "After Authority Issued",
    description: "Identify creditors, document notices, track state-specific exposure timelines, and pay approved claims in priority order.",
    tasks: [
      {
        id: "debt_priority_risk",
        authorityScope: "BOTH",
        title: "FIDUCIARY RISK: Statutory Debt Priority",
        description: "Assess creditor claims and potential debts under the statutory priority rules applicable in your state (often including administration expenses and taxes before unsecured debts).",
        isAttorneyReviewNode: true,
        trackCompatibility: ["PROBATE", "TRUST", "NON_PROBATE"],
        alerts: [{
          type: "caution",
          message: "Liability Alert: Do not pay claims out of order. Maintain reserves and verify your state's priority rules and any notice/claims procedures before making non-essential payments."
        }],
        outputs: ["Debt priority worksheet", "Proposed payment order / reserve plan"],
        stateOverrides: {
          MN: {
            title: "FIDUCIARY RISK: Minnesota Statutory Debt Priority",
            description: "Assess creditor claims and potential debts under Minnesota statutory priority order (MN Stat. §524.3-805).",
            alerts: [{
              type: "caution",
              message: "Minnesota Priority Order (MN Stat. §524.3-805): Pay claims in statutory order - administration expenses, funeral expenses, debts/taxes with preference under federal/state law, reasonable/necessary medical/hospital expenses, debts/taxes due to state, other claims. Incorrect payment order creates personal liability."
            }],
          },
          NJ: {
            title: "FIDUCIARY RISK: NJ Statutory Debt Priority (N.J.S.A. 3B:22-2)",
            description: "Assess claims under the NJ statutory priority rules (N.J.S.A. 3B:22-2). Administration and funeral expenses take priority over unsecured debts.",
            alerts: [{
              type: "caution",
              message: "NJ Priority Order: Funeral expenses, administration expenses, and taxes must be addressed before general unsecured creditors."
            }]
          }
        }
      },
      {
        id: "publish_notice",
        authorityScope: "PROBATE",
        title: "Publish Notice to Creditors (If Required)",
        description: "If required or strategically beneficial in your state, publish a notice to creditors using the court-approved or locally accepted format. Publication rules, timing, and whether it affects creditor deadlines vary by state and county.",
        estimatedTime: "State-specific (often 1–2 weeks)",
        trackCompatibility: ["PROBATE"],
        requiredDocs: ["Draft notice text (as applicable)", "Case/filing details (if applicable)"],
        category: "probate",
        // deadlineWarningId intentionally omitted from base — only CA links publication to a deadline
        dependencies: [],
        isOptional: true,
        helpArticleId: "creditor-notice",
        alerts: [
          {
            type: "important",
            message: "Publication is not required in every state. Confirm local court practice before treating this as mandatory."
          }
        ],
        stateOverrides: {
          CA: {
            title: "Publish Notice to Creditors (CA)",
            description: "In California, publish notice to creditors in an approved newspaper and file proof of publication. Publication helps notify unknown creditors, but the claim deadline is the later of 4 months after Letters or 60 days after direct notice (CA Prob. Code §9154).",
            isOptional: false,
            dependencies: ["file_probate_petition", "file_administration_petition"],
            requiredDocs: ["Court case number", "Proposed notice", "Publication proof (when issued)"],
            alerts: [
              {
                type: "important",
                message: "Publication satisfies notice to unknown creditors. Retain proof of publication and confirm local requirements.",
              },
            ],
          },
          NY: {
            title: "Publish Creditor Notice (Optional Risk Mitigation)",
            description: "In New York, creditor publication is generally optional and may be used as a risk-mitigation step to document notice efforts and reduce unknown-creditor risk. It does not create a guaranteed claim bar. Confirm local Surrogate's Court practice or consult counsel.",
            isOptional: true,
            alerts: [
              {
                type: "important",
                message: "Seven-Month Rule (SCPA §1802): Creditors have 7 months from the date of Letters to file claims. Distributing before this period carries personal liability risk."
              }
            ]
          },
          IL: {
            title: "Publish Notice to Creditors (755 ILCS 5/18-3)",
            description: "Illinois law requires the representative to publish a notice in a newspaper of general circulation in the county where the estate is being administered. This starts the 6-month claim period for unknown creditors.",
            isOptional: false,
            alerts: [
              {
                type: "important",
                message: "Mandatory Requirement: Publication is required by 755 ILCS 5/18-3 and must be completed promptly after Letters are issued."
              }
            ]
          },
          OH: {
            title: "Publish Notice to Creditors",
            description: "Publication is required under ORC §2117.07. It does not shorten the 6-month claims bar but is part of statutory notice compliance.",
            isOptional: false,
            alerts: [
              {
                type: "important",
                message: "Mandatory Requirement (ORC §2117.07): Publication must be completed, though it does not accelerate the 6-month claim window."
              }
            ]
          },
          MN: {
            title: "Publish Notice to Creditors (Optional but Recommended - MN)",
            description: "While publication is not mandatory, failure to publish may extend creditor exposure beyond the 4-month bar. Publication triggers the 4-month claim cutoff under MN Stat. §524.3-801.",
            isOptional: true,
            alerts: [
              {
                type: "important",
                message: "Strategic Recommendation: Publication triggers the 4-month claim bar under MN Stat. §524.3-801. Without publication, creditors may have extended exposure periods."
              },
              {
                type: "info",
                message: "Minnesota does not require publication, but it provides a clear 'later of' deadline: 4 months from publication OR 1 month from mailed notice to known creditors."
              }
            ],
            links: [{
              label: "MN Stat. §524.3-801",
              url: "https://www.revisor.mn.gov/statutes/cite/524.3-801"
            }]
          },
          GA: {
            title: "Publish Notice to Creditors (Required - Georgia)",
            description: "Georgia requires publication of notice to creditors in the county where the estate is being administered. This triggers the 3-month claim bar under O.C.G.A. §53-7-41.",
            isOptional: false,
            requiredDocs: ["Notice to Creditors", "Publication Proof"],
            alerts: [
              {
                type: "important",
                message: "REQUIRED: Publication triggers the 3-month claim period in Georgia. Without publication, the claim period may not be triggered."
              },
              {
                type: "info",
                message: "Publication must run in the official county newspaper for 4 consecutive weeks. File proof of publication with the probate court."
              }
            ],
            links: [{
              label: "O.C.G.A. §53-7-40",
              url: "https://law.justia.com/codes/georgia/2022/title-53/chapter-7/article-4/"
            }]
          },
          NJ: {
            title: "Publish Notice to Creditors (N.J.S.A. 3B:22-4)",
            description: "Publish a notice to creditors in an approved New Jersey newspaper. Under N.J.S.A. 3B:22-4, creditors have 6 months from the date of the first publication to present their claims. This starts the statutory bar against unknown claims.",
            isOptional: false,
            estimatedTime: "6 months (statutory window)",
            requiredDocs: ["Notice to Creditors", "Proof of Publication"],
            alerts: [{
              type: "important",
              message: "Strict 6-Month Bar: Claims presented after 6 months from first publication may be barred under N.J.S.A. 3B:22-4. Retain the 'Proof of Publication' from the newspaper."
            }],
            links: [{ label: "N.J.S.A. 3B:22-4", url: "https://law.justia.com/codes/new-jersey/2022/title-3b/section-3b-22-4/" }]
          }
        }
      },
      {
        id: "mail_notice",
        authorityScope: "PROBATE",
        title: "Notify Known Creditors",
        description: "Notify known creditors as appropriate and document your outreach (e.g., banks, credit cards, medical providers). Requirements and best practices vary by state.",
        estimatedTime: "1–3 hours",
        requiredDocs: ["Creditor notice template (if used)", "Creditor contact list / notice log"],
        category: "probate",
        dependencies: [],
        alerts: [
          {
            type: "info",
            message: "Keep proof of notice attempts and a dated log of communications. This supports a defensible claims process, but does not guarantee claim cutoff."
          },
        ],
        stateOverrides: {
          NY: {
            title: "Notify Known Creditors (SCPA §1803)",
            description: "In New York, creditor claims are typically presented in writing. Notify known creditors and keep a written log of when and how notice was provided. If a claim is presented, document the date received and supporting details (SCPA §1803).",
            alerts: [
              {
                type: "caution",
                message: "Do not admit or pay a claim without documentation. If unsure about validity or priority, consult counsel.",
              },
            ],
          },
          CA: {
            title: "Mail Notice to Known Creditors (As Applicable)",
            description: "Notify known creditors as appropriate and retain proof of mailing/notice. Requirements can vary by county and case posture; confirm local practice.",
            dependencies: ["file_probate_petition", "file_administration_petition"],
          },
          NJ: {
            title: "Notify Known Creditors (N.J.S.A. 3B:22-4)",
            description: "Provide notice of the 6-month claim period to all known creditors of the decedent. NJ law requires proof of mailing or delivery to establish the 6-month bar against known participants.",
            alerts: [{
              type: "info",
              message: "N.J.S.A. 3B:22-4: While publication handles unknown creditors, direct notice is required for known creditors to enforce the 6-month statutory bar."
            }]
          }
        },
      },
      {
        id: "intl_w8_assessment",
        authorityScope: "BOTH",
        scope: "CORE",
        title: "International Fiduciary: W-8BEN/W-8CE Assessment",
        description: "For non-resident executors or beneficiaries, determine U.S. tax withholding requirements and treaty eligibility.",
        applicability: {
          predicatesAny: ["has_foreign_beneficiary", "executor_non_us_resident"]
        },
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
        authorityScope: "BOTH",
        scope: "CORE",
        title: "International Fiduciary: ITIN Acquisition Protocol",
        description: "Identify foreign beneficiaries without a SSN/ITIN. Coordinate acquisition of U.S. Individual Taxpayer Identification Numbers to avoid maximum backup withholding on distributions.",
        applicability: {
          predicatesAny: ["has_foreign_beneficiary", "executor_non_us_resident"]
        },
        trackCompatibility: ["PROBATE", "TRUST"],
        alerts: [{
          type: "info",
          message: "Wait times for ITINs can exceed 12 weeks. Start this process as soon as beneficiaries are identified."
        }]
      },
      {
        id: "evaluate_solvency",
        authorityScope: "BOTH",
        scope: "CORE",
        title: "Evaluate Estate Solvency",
        description: "Compare total estate assets to total liabilities, taxes, and administration/funeral expenses to determine whether the estate appears solvent or insolvent.",
        estimatedTime: "2–3 hours",
        isAttorneyReviewNode: true,
        attorneyReviewReason: "Fiduciary Risk: If the estate is insolvent, payment priority and distribution rules change materially. Paying the wrong creditor first is a major source of personal liability.",
        alerts: [{
          type: "caution",
          message: "If liabilities exceed assets, treat the estate as potentially insolvent and follow your state's insolvency/payment priority rules before paying claims or making distributions."
        }],
        outputs: ["Solvency worksheet (assets vs liabilities)", "Preliminary insolvency flag"],
      },
      {
        id: "wait_claim_period",
        authorityScope: "PROBATE",
        scope: "CORE",
        title: "Monitor State-Specific Creditor Exposure Period",
        description: "Monitor the creditor exposure timeline applicable in your state. The trigger event and timing vary by state and case type. Avoid final distributions until creditor risk is appropriately managed (often by holding reserves and documenting claim handling).",
        utility: "Helps reduce personal fiduciary liability by managing creditor exposure before final distributions.",
        isLongHorizon: true,
        estimatedTime: "State-specific",
        // Publication is not a universal trigger; do not hard-depend on it.
        dependencies: [],
        applicability: {
          excludePredicates: ["isOH", "isMN"]
        },
        stateOverrides: {
          NJ: {
            title: "6 months from first publication (N.J.S.A. 3B:22-4)",
            description: "NJ law mandates a 6-month period from the date of first publication for creditors to present claims. (N.J.S.A. 3B:22-4).",
          }
        }
      },
      {
        id: "tx_publish_creditor_notice",
        authorityScope: "PROBATE",
        scope: "US-TX",
        title: "Publish Notice to Creditors (Optional but Recommended)",
        description: "Texas allows optional publication of notice to creditors. While not required, publication starts the 4-month claim period and provides protection against late claims.",
        estimatedTime: "1-2 weeks",
        category: "probate",
        trackCompatibility: ["PROBATE"],
        applicability: { states: ["TX"] },
        isOptional: true,
        requiredDocs: ["Notice to Creditors", "Publication Proof"],
        alerts: [
          {
            type: "info",
            message: "OPTIONAL: TX does not require creditor publication, but it starts the 4-month claim bar (TX Estates Code §355)."
          },
          {
            type: "important",
            message: "Without publication, creditors may have up to 4 years to file claims (general limitations period)."
          }
        ],
        links: [{ label: "TX Estates Code §355", url: "https://statutes.capitol.texas.gov/Docs/ES/htm/ES.355.htm" }]
      },
      {
        id: "tx_personal_creditor_notice",
        authorityScope: "PROBATE",
        scope: "US-TX",
        title: "Mail Notice to Known Creditors (TX)",
        description: "Texas requires actual notice to known creditors. Mail notice by certified mail, return receipt requested, to trigger the 4-month claim period for each creditor.",
        estimatedTime: "1-3 hours",
        category: "probate",
        trackCompatibility: ["PROBATE"],
        applicability: { states: ["TX"] },
        requiredDocs: ["Certified Mail Receipts", "Creditor Notice Log"],
        alerts: [
          {
            type: "important",
            message: "Actual notice by certified mail starts the 4-month claim period for THAT creditor (TX Estates Code §355.002). Keep all proof of mailing."
          },
          {
            type: "caution",
            message: "Each creditor's 4-month period starts when THEY receive notice, not when others do."
          }
        ],
        links: [{ label: "TX Estates Code §355.002", url: "https://statutes.capitol.texas.gov/Docs/ES/htm/ES.355.htm" }]
      },
      {
        id: "tx_medicaid_recovery_check",
        authorityScope: "PROBATE",
        scope: "US-TX",
        title: "Check for Texas Medicaid Estate Recovery (MERP)",
        description: "Texas Medicaid Estate Recovery Program (MERP) may have claims against the estate for benefits paid. Check MERP status before distributing assets or filing Muniment of Title.",
        estimatedTime: "1-2 weeks",
        category: "probate",
        trackCompatibility: ["PROBATE"],
        applicability: { states: ["TX"] },
        isConditional: true,
        conditionalRequirementLabel: "Required if decedent received Medicaid benefits",
        requiredDocs: ["MERP Notice Request", "MERP Response"],
        alerts: [
          {
            type: "important",
            message: "MERP: Texas may recover Medicaid benefits from the estate. Muniment of Title is NOT available if MERP claims exist."
          },
          {
            type: "warning",
            message: "Request MERP status early. If recovery is pursued, full probate administration may be required."
          }
        ],
        links: [{ label: "Texas MERP Information", url: "https://www.hhs.texas.gov/services/financial/medicaid-chip/estate-recovery" }]
      },
      {
        id: "monitor_creditor_claim_period",
        authorityScope: "PROBATE",
        scope: "CORE",
        title: "Monitor Creditor Claim Period",
        description: "Monitor the creditor claim period applicable in your state. The timing and trigger events are governed by state-specific statutes. See the guidance below for your state's claim period rules.",
        isLongHorizon: true,
        estimatedTime: "State-specific",
        stateOverrides: {
          CA: {
            title: "Monitor Creditor Claim Deadline (CA)",
            description: "In California, the claim deadline is the later of 4 months after Letters are issued or 60 days after notice is given to the creditor (CA Prob. Code §9154).",
            estimatedTime: "Later of 4 months after Letters or 60 days after notice",
          },
          NY: {
            title: "Monitor 7-Month Creditor Exposure Period (from issuance of Letters)",
            description: "In New York, creditors have 7 months from the date Letters are issued to file claims (SCPA §1802). Publication may be used as optional risk mitigation but does not create a guaranteed claim bar.",
            estimatedTime: "7 months"
          },
          TX: {
            title: "Monitor Creditor Claim Period",
            description: "In Texas, creditors generally have 4 months from the date of the published notice or receipt of personal notice to file claims.",
            estimatedTime: "4 months"
          },
          FL: {
            title: "Monitor 3-Month Creditor Claim Period",
            description: "In Florida, creditors have 3 months from first publication of Notice to Creditors, or 30 days from actual notice, whichever is later.",
            estimatedTime: "3 months"
          },
          PA: {
            title: "Monitor 1-Year Creditor Claim Period",
            description: "In Pennsylvania, creditors have 1 year from the date of death to file claims against the estate (20 Pa.C.S. §3532).",
            estimatedTime: "12 months"
          },
          OH: {
            title: "Monitor Ohio 6-Month Creditor Claim Period",
            description: "Ohio Creditor Deadline: Claims must be presented within 6 months from the decedent's date of death (ORC §2117.06). Publication under ORC §2117.07 is required but does NOT shorten the 6-month bar.",
            estimatedTime: "6 months from date of death",
            alerts: [{
              type: "important",
              message: "Fixed Deadline: The 6-month claim period starts from the date of death, not from publication or appointment. Claims presented after 6 months are barred."
            }]
          },
          IL: {
            title: "6-Month Claim Window - Illinois Creditor Claims (755 ILCS 5/18-12)",
            description: "In Illinois, creditors have 6 months from the date of first publication of the death notice to file claims (755 ILCS 5/18-12).",
            estimatedTime: "6 months"
          },
          GA: {
            title: "Monitor Georgia 3-Month Creditor Claim Period",
            description: "Georgia Creditor Deadline: Claims are barred 3 months after publication of notice (O.C.G.A. §53-7-41). Publication is required to trigger the 3-month bar.",
            estimatedTime: "3 months from publication",
            alerts: [{
              type: "important",
              message: "Publication Required: Georgia requires publication to trigger the 3-month claim bar. Without publication, the claim period may not be triggered."
            }]
          },
          NJ: {
            title: "6-Month Claim Window – Triggered by First Publication (N.J.S.A. 3B:22-4)",
            description: "In New Jersey, creditors have 6 months from the date of the first publication of notice to present claims (N.J.S.A. 3B:22-4). The clock starts from first publication, not from Letters issuance.",
            estimatedTime: "6 months",
            alerts: [{
              type: "info",
              message: "6-Month Clock: NJ maintains a strict statutory window from first publication for unknown claims to be presented."
            }]
          },
          MA: {
            title: "Monitor 1-Year Creditor Claim Period",
            description: "In Massachusetts, creditors have 1 year from the date of death to present claims against the estate (MGL c.197 §9).",
            estimatedTime: "12 months"
          },
          MN: {
            title: "Monitor Minnesota Creditor Deadline",
            description: "Minnesota Creditor Deadline: Claims are barred the later of: (1) 4 months after first publication of notice, OR (2) 1 month after mailed notice to a known creditor (MN Stat. §524.3-801). Publication is optional but triggers the 4-month bar.",
            estimatedTime: "Later of 4 months after publication or 1 month after mailed notice",
            alerts: [
              {
                type: "important",
                message: "Later Of Formula: The deadline is MAX(4 months from publication, 1 month from mailed notice to known creditor). If no publication occurs, extended creditor exposure may apply."
              },
              {
                type: "info",
                message: "Publication triggers the 4-month claim bar. Without publication, creditors may have extended exposure under general limitations."
              }
            ],
            links: [{
              label: "MN Stat. §524.3-801",
              url: "https://www.revisor.mn.gov/statutes/cite/524.3-801"
            }]
          }
        },
        alerts: [
          {
            type: "info",
            message: "Timing varies by state. Keep appropriate reserves and document claim handling before making final distributions."
          }
        ]
      },
      {
        id: "review_claims",
        authorityScope: "BOTH",
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
            message: "Claims handling procedures and timelines vary by state. Verify any notice, response, or objection deadlines that apply in your state."
          }
        ],
        stateOverrides: {
          NJ: {
            title: "Review Submitted Claims (N.J.S.A. 3B:22-4)",
            description: "Examine claims presented within the 6-month window since first publication. Verify that each claim is supported by sufficient evidence of debt.",
            alerts: [{
              type: "important",
              message: "N.J.S.A. 3B:22-4: Claims must be presented in writing. You have the right to demand formal proof of any presented claim."
            }]
          }
        }
      },
      {
        id: "tod_creditor_review",
        authorityScope: "BOTH",
        scope: "CORE",
        title: "⚠️ Non-Probate Creditor Exposure Assessment",
        description: "Risk assessment: Evaluate whether creditors may pursue non-probate transfers (e.g., TOD/POD beneficiaries) when the probate estate is insufficient. This is not the standard probate claims workflow; it assesses potential statutory recovery mechanisms that vary by state.",
        estimatedTime: "State-specific (often 1–2 weeks)",
        trackCompatibility: ["NON_PROBATE"],
        isAttorneyReviewNode: true,
        attorneyReviewReason: "Insolvency Risk: If the probate estate is insufficient, creditors may attempt recovery against certain non-probate transfers depending on state law. This review assesses potential exposure and mitigation options.",
        alerts: [
          {
            type: "caution",
            message: "Non-probate 'clawback' / recovery rules vary by state, asset type, and timing. Verify your state's statutes before assuming a fixed deadline or exposure window.",
          },
          {
            type: "important",
            message: "This is a risk review. Avoid taking steps that may create unnecessary procedural obligations. Escalate to formal probate only if needed for authority, insolvency handling, or dispute resolution.",
          },
        ]
      },
      {
        id: "evaluate_and_document_claims",
        authorityScope: "BOTH",
        title: "Document Claim Evaluation & Decision",
        description: "Evaluate each creditor claim and document your decision (allowed, partially allowed, disputed/rejected) with supporting rationale and evidence. Claims handling procedures vary by state and case type.",
        isAttorneyReviewNode: true,
        attorneyReviewReason: "Litigation Risk: Disputing or rejecting claims can trigger formal dispute processes and deadlines that are state-specific. Counsel guidance reduces risk.",
        trackCompatibility: ["PROBATE", "TRUST"],
        alerts: [
          {
            type: "caution",
            message: "State law may impose specific notice language, delivery methods, or response deadlines when disputing a claim. Confirm local requirements before issuing a formal dispute/rejection notice.",
          },
        ],
        stateOverrides: {
          NJ: {
            title: "Document Claim Decision (N.J.S.A. 3B:22-7)",
            description: "Formally allow or reject each claim. Under N.J.S.A. 3B:22-7, you must notify the creditor of your decision.",
            alerts: [{
              type: "important",
              message: "Notice of Rejection: If you dispute a claim, you must serve a written notice of rejection to start the creditor's 3-month limitation to sue."
            }]
          }
        }
      },
      {
        id: "reject_invalid",
        authorityScope: "BOTH",
        title: "Dispute or Reject Claims (If Applicable)",
        description: "If a claim is incorrect, unsupported, or disputed, follow your state's procedure to dispute, reject, or negotiate the claim. Keep written documentation of the basis and supporting evidence.",
        estimatedTime: "State-specific (often 1–2 weeks)",
        isConditional: true,
        conditionalRequirementLabel: "Required if creditor claims are invalid or disputed",
        requiredDocs: ["Claim documentation", "Written dispute/rejection notice (if used)", "Supporting evidence"],
        dependencies: ["review_claims"],
        alerts: [
          {
            type: "warning",
            message: "Disputed or rejected creditors may pursue litigation. Consult counsel and document your reasoning carefully before sending a dispute/rejection notice."
          }, {
            type: "caution",
            message: "Notice requirements and deadlines vary by state. Verify local procedure before acting."
          }
        ],
        stateOverrides: {
          CA: {
            title: "File Formal Rejection of Claim (CA)",
            description: "If a claim is invalid or unsupported, follow California's procedure to reject the claim and retain proof of delivery. Confirm any statutory deadlines and required notice language.",
            requiredDocs: ["Notice of Rejection (as required)", "Proof of service/mailing"],
          },
          NY: {
            title: "Dispute Claim (NY — Follow SCPA/EPTL Procedure)",
            description: "If a claim is disputed, follow the applicable New York procedure to challenge or negotiate the claim and maintain written documentation of the basis for dispute. Consult counsel regarding notice requirements and deadlines.",
            requiredDocs: ["Written dispute documentation", "Counsel-reviewed notice (if required)"],
          },
          NJ: {
            title: "Reject Invalid Claims (N.J.S.A. 3B:22-7)",
            description: "Serve a formal written reject notice to the creditor. This forces the creditor to file suit within 3 months or be forever barred from recovery.",
            alerts: [{
              type: "warning",
              message: "3-Month Limitation: Once you serve a formal rejection in NJ, the creditor only has 3 months to take legal action (N.J.S.A. 3B:22-7)."
            }]
          }
        },
      },
      {
        id: "pay_approved",
        authorityScope: "BOTH",
        title: "Pay Approved Claims (By Statutory Priority)",
        description: "Pay valid debts in the statutory priority order (commonly including administration costs, taxes, secured debts, then unsecured claims). Document each payment and retain receipts.",
        estimatedTime: "State/case dependent (often 2–6 weeks)",
        dependencies: ["review_claims"],
        alerts: [{
          type: "important",
          message: "Follow state creditor priority rules. Paying the wrong creditors first can create personal fiduciary liability."
        }],
        stateOverrides: {
          NJ: {
            title: "Pay Approved Claims (N.J.S.A. 3B:22-2)",
            description: "Pay claims in NJ statutory priority order (N.J.S.A. 3B:22-2). Administration and funeral expenses take precedence.",
            alerts: [{
              type: "important",
              message: "NJ Priority: Funeral/admin expenses must be paid before general creditors."
            }]
          }
        },
        outputs: ["Claims payment ledger", "Receipts and proof of payment"],
      },
      {
        id: "file_proof",
        authorityScope: "PROBATE",
        scope: "CORE",
        title: "Document Proof of Creditor Notice (If Applicable)",
        description: "If your state requires proof of creditor notice (publication and/or direct notice), retain and submit the required proof in the format your court or process expects. Even when not required to file, maintaining proof supports a defensible administration record.",
        estimatedTime: "State-specific (often 1–3 days)",
        requiredDocs: ["Notice log", "Proof documents (if applicable)"],
        dependencies: [],
        alerts: [
          {
            type: "info",
            message: "Notice proof requirements vary by state and case type. Keeping proof helps demonstrate reasonable notice efforts but does not guarantee claim cutoff."
          },
        ],
        stateOverrides: {
          NJ: {
            title: "File Proof of Publication (N.J.S.A. 3B:22-4)",
            description: "Secure the 'Affidavit of Publication' from the newspaper and retain it for your records. This is critical proof that the 6-month claim window was properly triggered.",
            alerts: [{
              type: "info",
              message: "Statutory Proof: The Affidavit of Publication is your primary shield against future claims under N.J.S.A. 3B:22-4."
            }]
          },
          CA: {
            title: "File Proof of Creditor Notice (CA)",
            description: "Retain and submit proof of publication and any required mailed notices per local court practice. Confirm county-specific proof requirements.",
            requiredDocs: ["Proof of Publication", "Proof of Mailing (if applicable)"],
            dependencies: ["publish_notice"],
          },
          NY: {
            title: "Retain Proof of Notice Efforts (NY)",
            description: "In New York, publication is generally optional, but you should retain a dated log and proof of any notices sent to known creditors. If the court requires proof for a specific filing, follow local Surrogate's Court instructions.",
            requiredDocs: ["Creditor notice log", "Copies of notices sent (if any)"],
            dependencies: [],
          },
        },
        outputs: ["Creditor notice proof bundle / log"],
      }
    ]
  },
  {
    phase: "asset_liquidation",
    title: "Asset Liquidation",
    subtitle: "Transfers & Sales (If Needed)",
    milestone: "After Inventory Prepared",
    description: "Present Letters to institutions, transfer or sell assets, and pay final bills.",
    tasks: [
      {
        id: "minor_beneficiary_court_approval",
        authorityScope: "PROBATE",
        scope: "CORE",
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
        authorityScope: "PROBATE",
        scope: "CORE",
        title: "Present Letters to All Institutions",
        description: "Submit certified Letters of Authority to every bank, brokerage, and insurance company.",
        estimatedTime: "2-4 weeks",
        requiredDocs: ["Letters of Authority", "Death Certificate"],
        alerts: [
          {
            type: "info",
            message: "Each institution has different forms and timelines. Be patient and persistent."
          }
        ]
      },
      {
        id: "transfer_accounts",
        authorityScope: "BOTH",
        scope: "CORE",
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
        authorityScope: "PROBATE",
        title: "Prepare Notice of Proposed Action",
        description: "If you have independent administration authority, you must notify heirs of your intent to sell real property.",
        estimatedTime: "1 week",
        category: "probate",
        applicability: { states: ["CA"] },
        isConditional: true,
        conditionalRequirementLabel: "Required if estate owns real property and intention is to sell",
        requiredDocs: ["Notice of Proposed Action Form"],
        links: [{
          label: "About Notices of Proposed Action",
          url: "#"
        }],
        alerts: [{
          type: "info",
          message: "Heirs have 15 days to object. If no one objects, you can proceed without a court hearing."
        }]
      },
      {
        id: "wait_proposed_action_period",
        authorityScope: "PROBATE",
        title: "Wait for 15-Day Objection Period",
        description: "Mandatory waiting period after serving Notice of Proposed Action to allow heirs to respond or object.",
        estimatedTime: "15 days",
        isLongHorizon: true,
        isConditional: true,
        applicability: { states: ["CA"] },
        conditionalRequirementLabel: "Mandatory waiting period for heirs to object to proposed sale",
        dependencies: ["prepare_notice_proposed_action"]
      },
      {
        id: "petition_confirm_sale",
        authorityScope: "PROBATE",
        title: "File Petition to Confirm Sale",
        description: "If you do NOT have independent administration authority, or if someone objects, you must petition the court to confirm the sale of real property.",
        estimatedTime: "2-4 hours",
        category: "probate",
        applicability: { states: ["CA"] },
        isConditional: true,
        conditionalRequirementLabel: "Required if IAEA authority is limited or restricted",
        isAttorneyReviewNode: true,
        attorneyReviewReason: "Real Estate Sale: Sales without full independent administration authority require complex court confirmation and overbid procedures.",
        requiredDocs: ["Petition to Confirm Sale Form"],
        links: [{
          label: "About Sales Confirmation",
          url: "#"
        }],
        alerts: [{
          type: "warning",
          message: "Court-confirmed sales include an 'overbid' process where others can outbid the buyer at the hearing."
        }]
      },
      {
        id: "obtain_sale_confirmation_order",
        authorityScope: "PROBATE",
        title: "Obtain Sale Confirmation Order",
        description: "Receive signed court order confirming the real estate sale and allowing the close of escrow.",
        estimatedTime: "1-2 weeks after hearing",
        category: "court-issued",
        applicability: { states: ["CA"] },
        isConditional: true,
        conditionalRequirementLabel: "Required if court-confirmed sale was necessary",
        isAttorneyReviewNode: true,
        attorneyReviewReason: "Real Estate Sale: The court order is a title-clearing document. Errors here can break the buyer's title and lead to litigation.",
        dependencies: ["petition_confirm_sale"],
        requiredDocs: ["Order Confirming Sale Form"]
      },
      {
        id: "sell_property",
        authorityScope: "BOTH",
        scope: "CORE",
        title: "Complete Property Sale & Transfer",
        description: "If the estate owns real property and a sale is needed, confirm that the fiduciary has the appropriate legal authority in the target state. before signing a contract. Complete closing, deposit proceeds into the estate account, and retain all closing and tax documents.",
        estimatedTime: "4-8 weeks",
        isConditional: true,
        conditionalRequirementLabel: "Required if estate owns real property",
        isAttorneyReviewNode: true,
        attorneyReviewReason: "Fiduciary Risk: Property sales are often the largest transactions in an estate. Confirm state-specific authorization requirements and retain all closing documentation.",
        dependencies: [],
        outputs: ["Closing statement (HUD-1/CD/ALTA)", "Deed or transfer instrument", "Tax/withholding documents (if any)"],
        stateOverrides: {
          NJ: {
            title: "Complete Property Sale & Obtain Tax Waiver",
            description: "Finalize NJ real estate sale. Ensure the NJ Inheritance Tax Waiver is obtained and recorded to clear the tax lien on the property.",
            alerts: [{
              type: "important",
              message: "Tax Lien: NJ real estate is subject to an automatic tax lien. You must obtain Form C-9700 (Waiver) to clear title for sale."
            }]
          },
          CA: {
            title: "Complete Property Sale & Close Escrow",
            description: "Finalize the sale of real estate through IAEA or court-confirmed process, sign closing documents, and receive sale proceeds into the estate account.",
            dependencies: ["obtain_sale_confirmation_order", "wait_proposed_action_period"],
          },
          NY: {
            title: "Complete Property Sale & Transfer",
            description: "Finalize the sale of real estate. If court authorization was required, ensure Surrogate's Court approval is obtained before closing. New York does not use California-style independent administration procedures.",
            dependencies: [],
            alerts: [
              {
                type: "info",
                message: "Determine if a court order is required for the sale based on the Will terms and fiduciary authority granted."
              },
              {
                type: "info",
                message: "Record the deed with the County Clerk upon closing."
              },
              {
                type: "caution",
                message: "New York does not use California-style independent administration procedures. Court authorization may be required for property sales depending on the Will terms and fiduciary authority."
              }
            ]
          },
        },
      },
      // ── GA Deed of Assent Task ──────────────────────────────────
      {
        id: "ga_deed_of_assent",
        authorityScope: "PROBATE",
        scope: "US-GA",
        title: "Execute and Record Deed of Assent (O.C.G.A. §53-8-15)",
        description: "Transfer title to real property from the estate to heirs or beneficiaries by executing and recording a Deed of Assent. This is Georgia's standard method for transferring estate real property.",
        estimatedTime: "1-2 hours",
        category: "probate",
        trackCompatibility: ["PROBATE"],
        applicability: { states: ["GA"] },
        isConditional: true,
        conditionalRequirementLabel: "Required if estate includes real property to be distributed to heirs/beneficiaries",
        requiresAuthority: true,
        requiredDocs: ["Letters Testamentary or Letters of Administration", "Deed of Assent", "Property Description"],
        tags: ["fiduciary", "statutory"],
        alerts: [
          {
            type: "info",
            message: "Georgia Standard: Georgia uses the Deed of Assent (not succession petitions) to transfer real property from estates to heirs/beneficiaries."
          },
          {
            type: "important",
            message: "Record the Deed of Assent with the county clerk where the property is located. The deed must be signed by the executor/administrator."
          }
        ],
        links: [{
          label: "O.C.G.A. §53-8-15",
          url: "https://law.justia.com/codes/georgia/2022/title-53/chapter-8/"
        }]
      },
      {
        id: "file_form_1041",
        authorityScope: "BOTH",
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
        authorityScope: "BOTH",
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
        authorityScope: "BOTH",
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
        authorityScope: "PROBATE",
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
    subtitle: "Accounting, Distribution, Close",
    milestone: "After Claims & Taxes Addressed",
    description: "File petition for final distribution, distribute assets to heirs, and close estate.",
    tasks: [
      {
        id: "guardian_distribution_approval",
        authorityScope: "PROBATE",
        scope: "CORE",
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
        authorityScope: "PROBATE",
        scope: "CORE",
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
        authorityScope: "PROBATE",
        title: "File Petition for Final Distribution",
        description: "Request court approval to distribute remaining assets to heirs.",
        stateOverrides: {
          NY: {
            title: "File Petition for Final Settlement & Distribution",
            description: "Request the Surrogate's Court to settle the account and issue a Decree of Distribution.",
            formNames: ["Petition for Final Settlement", "Decree of Distribution"]
          }
        },
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
        authorityScope: "PROBATE",
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
        authorityScope: "BOTH",
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
        authorityScope: "PROBATE",
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
        authorityScope: "BOTH",
        scope: "CORE",
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
      // ── NJ-Specific Inheritance Tax Tasks (Expanded) ─────────────────────────────
      {
        id: "nj_inheritance_tax_classify_beneficiaries",
        authorityScope: "BOTH",
        scope: "US-NJ",
        title: "Classify Beneficiaries for NJ Inheritance Tax",
        description: "Classify each beneficiary according to NJ inheritance tax classes. Class A (spouse, children, parents, grandparents) = FULLY EXEMPT. Class C (siblings, sons/daughters-in-law) = $25,000 exemption then tiered tax. Class D (all others) = no exemption, 15-16% tax. Class E (charities) = exempt.",
        estimatedTime: "2-4 hours",
        category: "probate",
        trackCompatibility: ["PROBATE", "TRUST"],
        applicability: { states: ["NJ"] },
        tags: ["tax", "statutory"],
        isAttorneyReviewNode: true,
        attorneyReviewReason: "Tax Classification: Incorrect beneficiary classification can result in underpayment penalties or overpayment of tax.",
        alerts: [
          {
            type: "important",
            message: "CLASS A EXEMPTION: Spouses, children (including adopted and stepchildren), parents, and grandparents are FULLY EXEMPT from NJ inheritance tax. No return required if ALL beneficiaries are Class A."
          },
          {
            type: "info",
            message: "Class C: Siblings, sons/daughters-in-law receive $25,000 exemption per person, then 11-15% tiered tax. Class D: All others pay 15-16% with no exemption."
          }
        ],
        dependencies: ["complete_inventory"],
        outputs: ["Beneficiary Classification Worksheet", "Tax Liability Estimate"],
        links: [{ label: "NJ Inheritance Tax Beneficiary Classes", url: "https://www.nj.gov/treasury/taxation/inheritance.shtml" }]
      },
      {
        id: "nj_inheritance_tax_determine_residency",
        authorityScope: "BOTH",
        scope: "US-NJ",
        title: "Determine Decedent's Domicile for Tax Purposes",
        description: "Determine if the decedent was a NJ resident or non-resident. This determines which form to file: IT-R (Resident) for NJ domiciled decedents, or IT-NR (Non-Resident) for non-residents with NJ assets.",
        estimatedTime: "1-2 hours",
        category: "probate",
        trackCompatibility: ["PROBATE", "TRUST"],
        applicability: { states: ["NJ"] },
        tags: ["tax", "statutory"],
        alerts: [
          {
            type: "info",
            message: "RESIDENT vs NON-RESIDENT: IT-R covers ALL assets worldwide for NJ residents. IT-NR covers only NJ-situs assets (NJ real estate, tangible personal property in NJ)."
          },
          {
            type: "important",
            message: "Domicile Test: NJ considers factors like voting registration, driver's license, primary residence, and where you file state income taxes to determine domicile."
          }
        ],
        dependencies: ["nj_inheritance_tax_classify_beneficiaries"],
        formNames: ["Form IT-R (Resident Decedent)", "Form IT-NR (Non-Resident Decedent)"]
      },
      {
        id: "nj_inheritance_tax_return",
        authorityScope: "BOTH",
        scope: "US-NJ",
        title: "File NJ Inheritance Tax Return",
        description: "File Form IT-R (resident decedent) or IT-NR (non-resident decedent) within 8 months of death. Even if all beneficiaries are Class A (exempt), filing may still be required to obtain waivers for real estate transfers.",
        estimatedTime: "4-8 hours",
        category: "probate",
        trackCompatibility: ["PROBATE", "TRUST"],
        applicability: { states: ["NJ"] },
        tags: ["tax", "statutory"],
        deadlineWarningId: "NJ_INHERITANCE_TAX_DUE",
        requiredDocs: ["Form IT-R or IT-NR", "Death Certificate", "Will", "Asset Inventory", "Appraisals", "Beneficiary Classification Worksheet"],
        alerts: [
          {
            type: "important",
            message: "8-MONTH DEADLINE: NJ inheritance tax return is due 8 months after death. Late filing incurs interest and penalties."
          },
          {
            type: "info",
            message: "CLASS A SHORTCUT: If ALL beneficiaries are Class A (spouse, children, parents), you may file a simplified return or in some cases no return is needed. Consult the NJ Division of Taxation."
          }
        ],
        dependencies: ["nj_inheritance_tax_determine_residency"],
        formNames: ["Form IT-R (Resident)", "Form IT-NR (Non-Resident)"],
        links: [{ label: "NJ Inheritance Tax Forms", url: "https://www.nj.gov/treasury/taxation/inheritance_forms.shtml" }]
      },
      {
        id: "nj_inheritance_tax_payment",
        authorityScope: "BOTH",
        scope: "US-NJ",
        title: "Pay NJ Inheritance Tax (If Due)",
        description: "If inheritance tax is owed (non-Class A beneficiaries), remit payment with the return or request a payment plan. Tax is due 8 months after death regardless of when the estate closes.",
        estimatedTime: "1-2 hours",
        category: "probate",
        trackCompatibility: ["PROBATE", "TRUST"],
        applicability: { states: ["NJ"] },
        tags: ["tax", "statutory"],
        isConditional: true,
        conditionalRequirementLabel: "Required if inheritance tax is due (non-Class A beneficiaries)",
        alerts: [
          {
            type: "warning",
            message: "PERSONAL LIABILITY: The executor may be personally liable for unpaid inheritance tax if distributions are made before tax is paid."
          },
          {
            type: "info",
            message: "Tax rates: Class C (siblings, nieces/nephews): 11-15% tiered. Class D (others): 15-16% flat rate."
          }
        ],
        dependencies: ["nj_inheritance_tax_return"]
      },
      {
        id: "nj_inheritance_tax_waiver",
        authorityScope: "BOTH",
        scope: "US-NJ",
        title: "Obtain NJ Inheritance Tax Waiver (Tax Clearance)",
        description: "Request tax waivers (Form C9700) from the NJ Division of Taxation. Waivers are REQUIRED to transfer NJ real estate and certain financial accounts. Class A beneficiaries (spouse, children, parents) receive waivers shortly after filing the return — no tax payment required. Class C and D beneficiaries must pay tax before waivers are issued.",
        estimatedTime: "2-12 weeks (Class A: 2-4 weeks; Class C/D: after tax payment)",
        category: "probate",
        trackCompatibility: ["PROBATE", "TRUST"],
        applicability: { states: ["NJ"] },
        tags: ["tax", "statutory"],
        isConditional: true,
        conditionalRequirementLabel: "REQUIRED for ALL NJ real estate transfers and most financial account transfers",
        requiredDocs: ["Filed Inheritance Tax Return", "Tax Payment Proof (Class C/D only)", "Waiver Request Form C9700"],
        alerts: [
          {
            type: "important",
            message: "DISTRIBUTION BLOCKER: You CANNOT record a deed transferring NJ real property without an Inheritance Tax Waiver. Title companies and county recorders require this clearance."
          },
          {
            type: "info",
            message: "CLASS A FAST-TRACK: Waivers for Class A beneficiaries (spouse, children, parents) are issued after the return is filed — tax payment is NOT required. Class C/D waivers require tax payment first."
          }
        ],
        dependencies: ["nj_inheritance_tax_return"],
        formNames: ["Tax Waiver Request (Form C9700)"],
        links: [{ label: "NJ Tax Waiver Information", url: "https://www.nj.gov/treasury/taxation/inheritance_waiver.shtml" }]
      },
      {
        id: "nj_distribution_block_until_clearance",
        authorityScope: "BOTH",
        scope: "US-NJ",
        title: "HOLD: Do Not Distribute to Class C/D Beneficiaries Until Waiver Received",
        description: "NJ requires tax clearance before distributing assets to non-exempt (Class C or D) beneficiaries. Do not transfer real estate or make final distributions to Class C/D beneficiaries until the Inheritance Tax Waiver (Form C9700) is received from the NJ Division of Taxation. Class A distributions (spouse, children, parents) may proceed after the return is filed.",
        estimatedTime: "Ongoing until waiver received",
        category: "probate",
        trackCompatibility: ["PROBATE", "TRUST"],
        applicability: { states: ["NJ"] },
        tags: ["risk-guardrail", "statutory"],
        isLongHorizon: true,
        isConditional: true,
        conditionalRequirementLabel: "Required if estate has Class C or D beneficiaries",
        isAttorneyReviewNode: true,
        attorneyReviewReason: "Fiduciary Liability: Distributing to Class C/D beneficiaries before receiving the Inheritance Tax Waiver creates direct personal liability for unpaid tax.",
        alerts: [
          {
            type: "caution",
            message: "DISTRIBUTION HOLD — CLASS C/D ONLY: Do NOT make final distributions to Class C or D beneficiaries until you have the NJ Inheritance Tax Waiver (Form C9700) in hand."
          },
          {
            type: "info",
            message: "CLASS A EXCEPTION: Distributions to Class A beneficiaries (spouse, children, parents, grandparents) can proceed after the inheritance tax return is filed. They do NOT need to wait for the waiver."
          }
        ],
        dependencies: ["nj_inheritance_tax_waiver", "nj_inheritance_tax_payment"]
      },
      // ── End NJ-Specific Inheritance Tax Tasks ─────────────────────────────
      // ── State-Specific Final Distribution Tasks ───────────────────────
      {
        id: "fl_homestead_petition",
        authorityScope: "PROBATE",
        scope: "US-FL",
        title: "File Homestead Property Petition (FL)",
        description: "Florida homestead property has special constitutional protections. File a petition to determine homestead status and transfer the property to the surviving spouse or heirs per FL Stat. §732.401.",
        estimatedTime: "2-4 hours",
        category: "probate",
        applicability: { states: ["FL"] },
        isConditional: true,
        conditionalRequirementLabel: "Required if decedent owned FL homestead property",
        requiredDocs: ["Death Certificate", "Property Deed", "Homestead Petition Form"],
        alerts: [{
          type: "important",
          message: "FL homestead is exempt from forced sale by creditors and has special descent rules. Do not sell homestead property without legal review."
        }],
        links: [{ label: "FL Stat. §732.401", url: "http://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0700-0799/0732/Sections/0732.401.html" }]
      },
      // ── End State-Specific Final Distribution Tasks ───────────────────
      {
        id: "close_estate",
        authorityScope: "PROBATE",
        title: "Close Estate",
        description: "File final discharge and close estate bank account.",
        estimatedTime: "1-2 weeks",
        requiredDocs: ["Petition for Final Discharge"],
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

export const MODIFIER_PHASE_TASKS: PhaseTaskList[] = [
  {
    phase: "ancillary_phase",
    title: "Ancillary / Multi-State",
    subtitle: "Out-of-State Property",
    milestone: "After Primary Filing",
    description: "Coordinate with other states where the decedent owned real estate or titled assets.",
    isEscalationPath: true,
    tasks: [
      {
        id: "identify_out_of_state_assets",
        authorityScope: "PROBATE",
        title: "Identify Out-of-State Assets",
        description: "Verify all real property and titled assets located outside of the primary probate state.",
        estimatedTime: "2-4 hours",
        alerts: [{ type: "info", message: "Real estate in other states usually requires a separate 'Ancillary' court proceeding." }]
      },
      {
        id: "confirm_ancillary_requirements",
        authorityScope: "PROBATE",
        title: "Confirm Ancillary Requirements",
        description: "Consult with a local attorney in the secondary state to determine if formal ancillary probate or a simplified affidavit is required.",
        estimatedTime: "1-2 weeks",
        isAttorneyReviewNode: true
      },
      {
        id: "ancillary_filing",
        authorityScope: "PROBATE",
        title: "File Ancillary Probate",
        description: "File certified copies of the primary Letters and Will in the secondary state or court to obtain local authority.",
        estimatedTime: "2-4 weeks",
        requiredDocs: ["Certified Letters", "Authenticated Will", "Ancillary Petition"]
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
        authorityScope: "PROBATE",
        title: "Preserve Evidence",
        description: "Secure original copies of the Will/Trust, key communications (emails, letters), and relevant financial records.",
        estimatedTime: "2-4 hours",
        tags: ["risk-guardrail"]
      },
      {
        id: "engage_litigation_counsel",
        authorityScope: "PROBATE",
        title: "Engage Probate Litigation Counsel",
        description: "Hire specialized litigation counsel to represent the estate's interests in the dispute.",
        estimatedTime: "1-2 weeks",
        isAttorneyReviewNode: true
      },
      {
        id: "mediation_strategy",
        authorityScope: "PROBATE",
        title: "Consider Mediation/Settlement Strategy",
        description: "Evaluate the costs and risks of litigation versus the benefits of a settlement agreement.",
        estimatedTime: "2-4 weeks",
        isAttorneyReviewNode: true
      },
      {
        id: "freeze_distributions_litigation",
        authorityScope: "PROBATE",
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
        authorityScope: "PROBATE",
        title: "Stop All Distributions",
        description: "Cease all payments to beneficiaries until a final insolvency plan is approved by the court.",
        estimatedTime: "Immediate",
        tags: ["risk-guardrail"]
      },
      {
        id: "prioritize_claims_statutory",
        authorityScope: "PROBATE",
        title: "Prioritize Claims per Statutory Order",
        description: "Rank all known debts according to their legal priority (e.g., admin costs, funeral, taxes, then general creditors).",
        estimatedTime: "1-2 weeks",
        isAttorneyReviewNode: true
      },
      {
        id: "negotiate_insolvency_settlements",
        authorityScope: "PROBATE",
        title: "Negotiate Structured Payoffs",
        description: "Contact creditors to negotiate pro-rata payments or settlements based on available estate funds.",
        estimatedTime: "4-8 weeks",
        isAttorneyReviewNode: true
      },
      {
        id: "close_insolvent_accounting",
        authorityScope: "PROBATE",
        title: "Close with Insolvency Accounting",
        description: "Submit a final accounting to the court that explicitly documents the estate's insolvency and the pro-rata distribution to creditors.",
        estimatedTime: "2-4 weeks",
        requiredDocs: ["Final Accounting (Insolvency)"]
      }
    ]
  }
];

/**
 * TRUST ADMINISTRATION - 6-STATE MACHINE
 * 
 * Trust admin is fundamentally different from probate:
 * - Authority comes from trust instrument + death certificate, NOT court
 * - No formal petition or Letters required
 * - Probate is only an escalation when trust funding fails
 */

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
        authorityScope: "TRUST",
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
        authorityScope: "TRUST",
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
        authorityScope: "TRUST",
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
        authorityScope: "TRUST",
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
        authorityScope: "TRUST",
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
        authorityScope: "TRUST",
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
        authorityScope: "TRUST",
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
        authorityScope: "TRUST",
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
        authorityScope: "TRUST",
        title: "Send Statutory Notice to Beneficiaries",
        description: "State law typically requires formal notice to beneficiaries and heirs within a specific timeframe (e.g., 30–90 days).",
        estimatedTime: "2-4 hours",
        isAttorneyReviewNode: true,
        attorneyReviewReason: "Statutory Deadline: Missing the mandatory notice window can result in removal of the trustee and personal liability.",
        tags: ["statutory", "risk-guardrail"],
        requiredDocs: ["Notice Letters", "Certified Mail Receipts"],
        requiresPhysicalMail: true,
        alerts: [
          {
            type: "important",
            message: "This notice starts the statutory contest period. Keep all certified mail receipts as proof."
          }
        ]
      },
      {
        id: "notify_state_agencies_health",
        authorityScope: "TRUST",
        title: "Notify State Health Agencies",
        description: "The trustee must notify the state Department of Health or Medicaid recovery agency to allow for potential recovery claims.",
        estimatedTime: "1 hour",
        tags: ["statutory"],
        requiresPhysicalMail: true,
        alerts: [{
          type: "caution",
          message: "Mandatory Notice: Distributing trust assets before checking for state Medicaid recovery claims can make the trustee personally liable for the debt."
        }]
      },
      {
        id: "handle_trust_copy_requests",
        authorityScope: "TRUST",
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
        authorityScope: "TRUST",
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
        authorityScope: "TRUST",
        title: "Monitor Statutory Contest Period",
        description: "Wait for the statutory contest period to expire before making final distributions. Document any contests or concerns raised.",
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
        authorityScope: "TRUST",
        title: "Create Trust Asset Inventory",
        description: "List all assets titled in the trust's name. This is an internal document, not filed with court.",
        estimatedTime: "1-2 weeks",
        requiredDocs: ["Trust Asset Inventory", "Date-of-Death Statements"],
        alerts: [{
          type: "info",
          message: "Unlike probate, you do NOT normally file an inventory with the court. This record is for accounting purposes."
        }]
      },
      {
        id: "verify_trust_titling",
        scope: "CORE",
        authorityScope: "TRUST",
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
        scope: "CORE",
        authorityScope: "TRUST",
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
        scope: "CORE",
        authorityScope: "TRUST",
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
        scope: "CORE",
        authorityScope: "TRUST",
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
        scope: "CORE",
        authorityScope: "TRUST",
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
        scope: "CORE",
        authorityScope: "TRUST",
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
        scope: "CORE",
        authorityScope: "TRUST",
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
        scope: "CORE",
        authorityScope: "TRUST",
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
        scope: "CORE",
        authorityScope: "TRUST",
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
        scope: "CORE",
        authorityScope: "TRUST",
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
        scope: "CORE",
        authorityScope: "TRUST",
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
        scope: "CORE",
        authorityScope: "TRUST",
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
        scope: "CORE",
        authorityScope: "BOTH",
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
        scope: "CORE",
        authorityScope: "BOTH",
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
        authorityScope: "TRUST",
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
        authorityScope: "TRUST",
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
        authorityScope: "TRUST",
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
        authorityScope: "TRUST",
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
        authorityScope: "TRUST",
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
        authorityScope: "TRUST",
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
        authorityScope: "TRUST",
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
        authorityScope: "TRUST",
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
        authorityScope: "TRUST",
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
      authorityScope: "PROBATE",
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
      authorityScope: "PROBATE",
      title: "File Probate Petition",
      description: "If formal probate is required for out-of-trust assets, file petition with the appropriate Probate Court.",
      category: "probate",
      estimatedTime: "2-4 hours",
      requiredDocs: ["Petition Form", "Death Certificate", "Original Will (if exists)"],
      alerts: [{
        type: "info",
        message: "You may serve as both Trustee and Executor, but the roles have different authority sources."
      }]
    },
    {
      id: "escalation_obtain_letters",
      authorityScope: "PROBATE",
      title: "Obtain Letters Testamentary",
      description: "Attend hearing and obtain court-issued authority for probate assets only.",
      category: "court-issued",
      estimatedTime: "60-90 days",
      requiredDocs: ["Letters Testamentary / Administration"],
      alerts: [{
        type: "important",
        message: "Letters are for probate assets ONLY. Trust assets do not require Letters."
      }]
    },
    {
      id: "escalation_transfer_to_trust",
      authorityScope: "PROBATE",
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



