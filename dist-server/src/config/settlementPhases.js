export const SETTLEMENT_PHASE_TASKS = [
    {
        phase: "immediate_actions",
        title: "Strategic Assessment",
        subtitle: "Secure, Notify, Preserve",
        milestone: "Immediately After Death",
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
                requiredDocs: ["Certified Death Certificate", "Recorded TOD Deed copy", "Affidavit of Death of Transferor"],
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
                        label: "About TOD Transfer Requirements",
                        url: "#"
                    }]
            },
            {
                id: "notify_recorder_assessor",
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
                id: "cancel_cards",
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
        phase: "pre_filing_compliance",
        title: "Court Compliance & Eligibility",
        subtitle: "Eligibility, Venue, Parties",
        milestone: "Before Court Filing",
        description: "Ensure all jurisdictional, statutory, and documentation requirements are met prior to formal court submission. This universal layer adapts to state-specific rules.",
        tasks: [
            {
                id: "validate_venue_jurisdiction",
                title: "Validate Venue and Jurisdiction",
                description: "Confirm the decedent's legal domicile and county residency to ensure the petition is filed in the legally appropriate court.",
                utility: "Prevents immediate case dismissal due to improper venue.",
                estimatedTime: "30 minutes",
                category: "probate",
                requiredProfileFields: ["decedent_domicile", "county", "death_date", "property_location"],
                outputs: ["Verified Court of Jurisdiction"],
                alerts: [{
                        type: "important",
                        message: "Jurisdictional Error Risk: Filing in the wrong county or state can invalidate all subsequent legal actions."
                    }],
                stateOverrides: {
                    NY: {
                        title: "Validate Surrogate's Court Venue (SCPA §205)",
                        description: "Verify the decedent's domicile in NY to ensure the petition is filed in the correct Surrogate's Court (SCPA §205).",
                        utility: "Prevents case dismissal based on lack of subject matter jurisdiction."
                    }
                }
            },
            {
                id: "screen_fiduciary_eligibility",
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
            {
                id: "file_probate_petition",
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
                title: "Pay Court Filing Fee",
                description: "Pay the required court filing fee to process the petition. Fees vary by estate value.",
                estimatedTime: "1 day",
                category: "probate",
                trackCompatibility: ["PROBATE"],
                dependencies: ["file_probate_petition", "file_administration_petition"]
            },
            {
                id: "submit_oath_designation",
                title: "Submit Oath and Designation",
                description: "Sign and submit the Oath and Designation form, officially agreeing to serve as the fiduciary.",
                estimatedTime: "1-2 days",
                category: "probate",
                trackCompatibility: ["PROBATE"],
                dependencies: ["file_probate_petition", "file_administration_petition"]
            },
            {
                id: "obtain_citation",
                title: "Obtain Citation from Court",
                description: "Receive the issued Citation from the court, which sets the hearing date and commands interested parties to appear.",
                estimatedTime: "1-3 weeks",
                category: "probate",
                trackCompatibility: ["PROBATE"],
                dependencies: ["file_probate_petition", "file_administration_petition"]
            },
            {
                id: "serve_citation",
                title: "Serve Citation on Interested Parties",
                description: "Serve the Citation to all required heirs and interested parties according to strict statutory rules.",
                estimatedTime: "1-3 weeks",
                category: "probate",
                trackCompatibility: ["PROBATE"],
                dependencies: ["obtain_citation"],
                alerts: [{
                        type: "warning",
                        message: "Service must be completed within strict deadlines before the hearing date. Proper affidavits of service are required."
                    }]
            },
            {
                id: "attend_probate_hearing",
                title: "Attend Probate Hearing",
                description: "Appear in court for the probate hearing (typically 30-60 days after filing) to confirm the Will and your appointment.",
                estimatedTime: "2-3 hours",
                requiredDocs: ["Valid ID", "Proof of Notice"],
                applicability: { variants: ["TESTATE"] },
                dependencies: ["file_probate_petition"],
                alerts: [
                    {
                        type: "info",
                        message: "Dress professionally. Bring all documents. Hearing is usually brief (5-10 minutes)."
                    }
                ]
            },
            {
                id: "attend_administration_hearing",
                title: "Attend Administration Hearing",
                description: "Appear in court for the administration hearing. Since there is no Will, the court will confirm heirs and appointing you as Administrator.",
                estimatedTime: "2-3 hours",
                requiredDocs: ["Valid ID", "Proof of Notice"],
                applicability: { variants: ["INTESTATE"] },
                dependencies: ["file_administration_petition"],
                alerts: [
                    {
                        type: "info",
                        message: "Dress professionally. The judge will confirm that all distributees have been properly notified."
                    }
                ]
            },
            {
                id: "receive_letters_testamentary",
                title: "Obtain Letters Testamentary",
                description: "Once the Will is admitted to probate, obtain certified copies of your Letters Testamentary.",
                requiresAuthority: true,
                estimatedTime: "1-2 weeks after hearing",
                category: "court-issued",
                requiredDocs: ["Letters Testamentary"],
                applicability: { variants: ["TESTATE"] },
                dependencies: ["attend_probate_hearing"],
                stateOverrides: {
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
                title: "Obtain Letters of Administration",
                description: "Once the court approves the petition, obtain certified copies of your Letters of Administration.",
                requiresAuthority: true,
                estimatedTime: "1-2 weeks after hearing",
                category: "court-issued",
                requiredDocs: ["Letters of Administration"],
                applicability: { variants: ["INTESTATE"] },
                dependencies: ["attend_administration_hearing"],
                stateOverrides: {
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
                title: "File Small Estate Affidavit",
                description: "For estates under threshold, use this shortcut to bypass court probate.",
                utility: "Bypass court entirely for qualifying small estates.",
                estimatedTime: "40 days after death",
                category: "court-issued",
                exclusiveGroup: "filing_path",
                isConditional: true,
                conditionalRequirementLabel: "Available if estate value is below state small estate threshold",
                helpArticleId: "small-estate-affidavit",
                requiredDocs: ["Affidavit Form", "Death Certificate"]
            },
            {
                id: "file_spousal_petition",
                title: "File Spousal Property Petition",
                description: "Request court order to transfer property to surviving spouse without full probate.",
                estimatedTime: "4-6 weeks",
                category: "probate",
                isConditional: true,
                conditionalRequirementLabel: "Required if property is being transferred to a surviving spouse or domestic partner",
                helpArticleId: "spousal-property",
                requiredDocs: ["Petition Form", "Death Certificate"]
            },
            {
                id: "give_spousal_notice",
                title: "Give Notice of Hearing",
                description: "Notify all interested parties about the court hearing date for the petition.",
                estimatedTime: "2 hours",
                category: "probate",
                isOptional: true,
                dependencies: ["file_spousal_petition"],
                requiredDocs: ["Notice of Hearing Form"],
                alerts: [{
                        type: "important",
                        message: "Notice must be served at least 15 days before the hearing date."
                    }]
            },
            {
                id: "obtain_spousal_order",
                title: "Obtain Spousal Property Order",
                description: "Receive signed court order confirming property ownership transfer to spouse. Record with county recorder if real estate is involved.",
                estimatedTime: "1-2 weeks after hearing",
                category: "court-issued",
                isOptional: true,
                dependencies: ["give_spousal_notice"],
                requiredDocs: ["Court Order"],
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
                id: "file_succession_petition",
                title: "File Petition to Determine Succession",
                description: "File petition with court to determine who inherits the primary residence without full probate.",
                estimatedTime: "2-4 hours",
                category: "probate",
                exclusiveGroup: "filing_path",
                isOptional: true,
                requiredDocs: ["Petition Form", "Death Certificate", "Property Deed"],
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
                title: "Give Notice of Hearing",
                description: "Notify all interested parties of the hearing date for the succession petition.",
                estimatedTime: "2 hours",
                category: "probate",
                exclusiveGroup: "filing_path",
                isOptional: true,
                dependencies: ["file_succession_petition"],
                requiredDocs: ["Notice of Hearing Form"],
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
                title: "Obtain Order Determining Succession",
                description: "Receive court order determining property succession. Record order with county recorder.",
                estimatedTime: "1-2 weeks after hearing",
                category: "court-issued",
                exclusiveGroup: "filing_path",
                isOptional: true,
                requiredDocs: ["Court Order"],
                dependencies: ["file_succession_petition", "give_succession_notice"],
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
        subtitle: "Inventory & Valuation",
        milestone: "After Authority Issued",
        description: "Identify all assets within the estate's jurisdiction and obtain formal Date-of-Death valuations.",
        tasks: [
            {
                id: "check_unclaimed_property",
                title: "Search State Unclaimed Property",
                description: "Check state databases for dormant accounts, uncashed checks, or forgotten insurance policies.",
                estimatedTime: "1 hour",
                helpArticleId: "asset-discovery",
                links: [{ label: "Search State Unclaimed Property", url: "#" }]
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
        subtitle: "Claims & Exposure Management",
        milestone: "After Authority Issued",
        description: "Identify creditors, document notices, track state-specific exposure timelines, and pay approved claims in priority order.",
        tasks: [
            {
                id: "debt_priority_risk",
                title: "FIDUCIARY RISK: Statutory Debt Priority",
                description: "Assess creditor claims and potential debts under the statutory priority rules applicable in your jurisdiction (often including administration expenses and taxes before unsecured debts).",
                isAttorneyReviewNode: true,
                trackCompatibility: ["PROBATE", "TRUST", "NON_PROBATE"],
                alerts: [{
                        type: "caution",
                        message: "Liability Alert: Do not pay claims out of order. Maintain reserves and verify your state's priority rules and any notice/claims procedures before making non-essential payments."
                    }],
                outputs: ["Debt priority worksheet", "Proposed payment order / reserve plan"],
            },
            {
                id: "publish_notice",
                title: "Publish Notice to Creditors (If Required)",
                description: "If required or strategically beneficial in your jurisdiction, publish a notice to creditors using the court-approved or locally accepted format. Publication rules, timing, and whether it affects creditor deadlines vary by state and county.",
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
                        title: "Publish Notice to Creditors (CA — Starts Claims Timing)",
                        description: "In California, publication of the required notice is a standard step and commonly drives creditor claims timing. Use the court-accepted notice format and follow local publication and proof requirements for your county.",
                        isOptional: false,
                        dependencies: ["file_probate_petition", "file_administration_petition"],
                        deadlineWarningId: "CREDITOR_NOTICE_DEADLINE",
                        requiredDocs: ["Court case number", "Proposed notice", "Publication proof (when issued)"],
                        alerts: [
                            {
                                type: "important",
                                message: "For California cases, publication is used to establish creditor notice and timing. Confirm local proof-of-publication requirements.",
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
                    }
                }
            },
            {
                id: "mail_notice",
                title: "Notify Known Creditors",
                description: "Notify known creditors as appropriate and document your outreach (e.g., banks, credit cards, medical providers). Requirements and best practices vary by jurisdiction.",
                estimatedTime: "1–3 hours",
                requiredDocs: ["Creditor notice template (if used)", "Creditor contact list / notice log"],
                category: "probate",
                dependencies: [],
                alerts: [
                    {
                        type: "info",
                        message: "Keep proof of notice attempts and a dated log of communications. This supports a defensible claims process, but does not guarantee claim cutoff.",
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
                },
            },
            {
                id: "intl_w8_assessment",
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
                title: "Evaluate Estate Solvency",
                description: "Compare total estate assets to total liabilities, taxes, and administration/funeral expenses to determine whether the estate appears solvent or insolvent.",
                estimatedTime: "2–3 hours",
                isAttorneyReviewNode: true,
                attorneyReviewReason: "Fiduciary Risk: If the estate is insolvent, payment priority and distribution rules change materially. Paying the wrong creditor first is a major source of personal liability.",
                alerts: [{
                        type: "caution",
                        message: "If liabilities exceed assets, treat the estate as potentially insolvent and follow your jurisdiction's insolvency/payment priority rules before paying claims or making distributions."
                    }],
                outputs: ["Solvency worksheet (assets vs liabilities)", "Preliminary insolvency flag"],
            },
            {
                id: "wait_claim_period",
                title: "Monitor State-Specific Creditor Exposure Period",
                description: "Monitor the creditor exposure timeline applicable in your jurisdiction. The trigger event and timing vary by state and case type. Avoid final distributions until creditor risk is appropriately managed (often by holding reserves and documenting claim handling).",
                utility: "Helps reduce personal fiduciary liability by managing creditor exposure before final distributions.",
                isLongHorizon: true,
                estimatedTime: "State-specific",
                // Publication is not a universal trigger; do not hard-depend on it.
                dependencies: [],
                stateOverrides: {
                    CA: {
                        title: "Wait for 4-Month Claim Period",
                        description: "Creditors have 4 months from publication of the creditor notice to file claims against the estate.",
                        estimatedTime: "4 months",
                        dependencies: ["publish_notice"],
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
                        title: "Monitor 6-Month Creditor Claim Period",
                        description: "In Ohio, creditors have 6 months from the date of the fiduciary's appointment to present claims (ORC §2117.06).",
                        estimatedTime: "6 months",
                        dependencies: ["receive_letters_testamentary", "receive_letters_administration"],
                    },
                    IL: {
                        title: "Monitor 6-Month Creditor Claim Period",
                        description: "In Illinois, creditors have 6 months from the date of first publication of the death notice to file claims (755 ILCS 5/18-12).",
                        estimatedTime: "6 months"
                    },
                    GA: {
                        title: "Monitor 3-Month Creditor Claim Period",
                        description: "In Georgia, creditors have 3 months from the date of publication of the notice to creditors to file claims (OCGA §53-7-41).",
                        estimatedTime: "3 months"
                    },
                    NJ: {
                        title: "Monitor 6-Month Creditor Claim Period",
                        description: "In New Jersey, creditors have 6 months from the date of the first publication of notice to present claims (NJSA 3B:22-4).",
                        estimatedTime: "6 months"
                    },
                    MA: {
                        title: "Monitor 1-Year Creditor Claim Period",
                        description: "In Massachusetts, creditors have 1 year from the date of death to present claims against the estate (MGL c.197 §9).",
                        estimatedTime: "12 months"
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
                        message: "Claims handling procedures and timelines vary by state. Verify any notice, response, or objection deadlines that apply in your jurisdiction."
                    }
                ]
            },
            {
                id: "tod_creditor_review",
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
                title: "Document Claim Evaluation & Decision",
                description: "Evaluate each creditor claim and document your decision (allowed, partially allowed, disputed/rejected) with supporting rationale and evidence. Claims handling procedures vary by state and case type.",
                isAttorneyReviewNode: true,
                attorneyReviewReason: "Litigation Risk: Disputing or rejecting claims can trigger formal dispute processes and deadlines that vary by jurisdiction. Counsel guidance reduces risk.",
                trackCompatibility: ["PROBATE", "TRUST"],
                alerts: [
                    {
                        type: "caution",
                        message: "State law may impose specific notice language, delivery methods, or response deadlines when disputing a claim. Confirm local requirements before issuing a formal dispute/rejection notice.",
                    },
                ]
            },
            {
                id: "reject_invalid",
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
                        message: "Disputed or rejected creditors may pursue litigation. Consult counsel and document your reasoning carefully before sending a dispute/rejection notice.",
                    },
                    {
                        type: "caution",
                        message: "Notice requirements and deadlines vary by state. Verify local procedure before acting.",
                    },
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
                },
            },
            {
                id: "pay_approved",
                title: "Pay Approved Claims (By Statutory Priority)",
                description: "Pay valid debts in the statutory priority order applicable in your jurisdiction (commonly including administration costs, taxes, secured debts, then unsecured claims). Document each payment and retain receipts.",
                estimatedTime: "State/case dependent (often 2–6 weeks)",
                dependencies: ["review_claims"],
                alerts: [
                    {
                        type: "important",
                        message: "Follow your state's creditor priority rules. Paying the wrong creditors first can create personal fiduciary liability.",
                    },
                ],
                outputs: ["Claims payment ledger", "Receipts and proof of payment"],
            },
            {
                id: "file_proof",
                title: "Document Proof of Creditor Notice (If Applicable)",
                description: "If your jurisdiction requires proof of creditor notice (publication and/or direct notice), retain and submit the required proof in the format your court or process expects. Even when not required to file, maintaining proof supports a defensible administration record.",
                estimatedTime: "State-specific (often 1–3 days)",
                requiredDocs: ["Notice log", "Proof documents (if applicable)"],
                dependencies: [],
                alerts: [
                    {
                        type: "info",
                        message: "Notice proof requirements vary by state and case type. Keeping proof helps demonstrate reasonable notice efforts but does not guarantee claim cutoff.",
                    },
                ],
                stateOverrides: {
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
                title: "Complete Property Sale & Transfer",
                description: "If the estate owns real property and a sale is needed, confirm fiduciary authority and any required court authorization in your jurisdiction before signing a contract. Complete closing, deposit proceeds into the estate account, and retain all closing and tax documents.",
                estimatedTime: "4-8 weeks",
                isConditional: true,
                conditionalRequirementLabel: "Required if estate owns real property",
                isAttorneyReviewNode: true,
                attorneyReviewReason: "Fiduciary Risk: Property sales are often the largest transactions in an estate. Confirm jurisdiction-specific authorization requirements and retain all closing documentation.",
                dependencies: [],
                requiredDocs: ["Closing statement (HUD-1/CD/ALTA)", "Deed or transfer instrument", "Tax/withholding documents (if any)"],
                stateOverrides: {
                    CA: {
                        title: "Complete Property Sale & Close Escrow",
                        description: "Finalize the sale of real estate through IAEA or court-confirmed process, sign closing documents, and receive sale proceeds into the estate account.",
                        dependencies: ["obtain_sale_confirmation_order", "wait_proposed_action_period"],
                    },
                    NY: {
                        title: "Complete Property Sale & Transfer",
                        description: "Finalize the sale of real estate. If court authorization was required, ensure Surrogate's Court approval is obtained before closing. NY does not use the CA Independent Administration of Estates Act (IAEA) process.",
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
                                message: "CA-specific procedures (Notice of Proposed Action, IAEA, Petition to Confirm Sale) do NOT apply in New York."
                            }
                        ]
                    },
                },
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
        subtitle: "Accounting, Distribution, Close",
        milestone: "After Claims & Taxes Addressed",
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
/**
 * TRUST ADMINISTRATION - 6-STATE MACHINE
 *
 * Trust admin is fundamentally different from probate:
 * - Authority comes from trust instrument + death certificate, NOT court
 * - No formal petition or Letters required
 * - Probate is only an escalation when trust funding fails
 */
export const MODIFIER_PHASE_TASKS = [
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
export const TRUST_PHASE_TASKS = [
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
export const PROBATE_ESCALATION_PHASE = {
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
