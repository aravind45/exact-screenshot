export const STATE_RULES = {
    "AL": { threshold: 30000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["Ala. Code § 43-2-690"], probateTerm: "Formal Probate", probateCitation: ["Ala. Code § 43-2"], isUPC: false, lettersTerm: "Letters Testamentary" },
    "AK": { threshold: 50000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["Alaska Stat. § 13.16.680"], probateTerm: "Formal Probate", probateCitation: ["Alaska Stat. § 13.16"], isUPC: true, lettersTerm: "Letters Testamentary" },
    "AZ": { threshold: 200000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["A.R.S. § 14-3971"], probateTerm: "Informal Probate", probateCitation: ["A.R.S. § 14-3301"], isUPC: true, lettersTerm: "Letters Testamentary", notes: "Threshold increased to $200k for personal property in 2025." },
    "AR": { threshold: 50000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["Ark. Code § 28-41-101"], probateTerm: "Formal Probate", probateCitation: ["Ark. Code § 28-40"], isUPC: false, lettersTerm: "Letters Testamentary" },
    "CA": {
        threshold: 208850,
        smallEstateTerm: "CA Prob. Code 13100 Affidavit",
        smallEstateCitation: ["CA Prob. Code §13100"],
        probateTerm: "Formal Probate",
        probateCitation: ["CA Prob. Code §7000"],
        isUPC: false,
        lettersTerm: "Letters of Authority",
        spousalSetAside: {
            term: "Spousal Property Order",
            citation: ["CA Prob. Code §13500"]
        },
        notes: "Updated 2025/2026 threshold is $208,850. Creditor timing: MAX(4 months after Letters, 60 days after notice).",
        // CA-Specific Simplified Succession Configuration
        // Probate Code §13100: Personal property affidavit (40-day waiting period)
        // Probate Code §13200: Real property affidavit (rarely used due to title issues)
        // Probate Code §13500: Spousal Property Petition (no dollar limit)
        claimWindowDays: 120, // 4 months from Letters
        shortenedWindowDays: 60, // 60 days from notice (whichever is later per §9154)
        // CA simplified succession thresholds with real vs personal property split
        simplifiedSuccession: {
            personalProperty: {
                threshold: 208850, // Probate Code §13100 - adjusted annually
                waitingDays: 40, // 40 days after death
                citation: "CA Prob. Code §13100",
            },
            realProperty: {
                threshold: 208850, // Probate Code §13200 - same threshold but rarely used
                waitingDays: 40,
                citation: "CA Prob. Code §13200",
                note: "Real property affidavits are rarely accepted by title insurers; formal probate often required",
            },
            spousalProperty: {
                threshold: null, // No dollar limit
                waitingDays: 0, // Can file immediately
                citation: "CA Prob. Code §13500",
                note: "Surviving spouse/domestic partner can claim community property without dollar limit",
            },
        },
        // IAEA (Independent Administration of Estates Act) configuration
        iaeaConfiguration: {
            fullAuthority: {
                description: "Full IAEA - no court confirmation needed for most sales",
                citation: "CA Prob. Code §10400 et seq.",
            },
            limitedAuthority: {
                description: "Limited IAEA - court confirmation required for real estate sales",
                citation: "CA Prob. Code §10400 et seq.",
            },
            noticePeriodDays: 15, // 15-day objection period for Notice of Proposed Action
            overbidFormula: "MAX(bid + $500, bid + 5% of first $10k + 2.5% of excess)",
            overbidCitation: "CA Prob. Code §10310",
        },
    },
    "CO": { threshold: 82000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["C.R.S. § 15-12-1201"], probateTerm: "Informal Probate", probateCitation: ["C.R.S. § 15-12-301"], isUPC: true, lettersTerm: "Letters Testamentary", notes: "Threshold adjusted annually for inflation ($82k for 2024/25)." },
    "CT": { threshold: 40000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["Conn. Gen. Stat. § 45a-273"], probateTerm: "Formal Probate", probateCitation: ["Conn. Gen. Stat. § 45a"], isUPC: false, lettersTerm: "Letters Testamentary" },
    "DE": { threshold: 30000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["12 Del. C. § 2306"], probateTerm: "Formal Probate", probateCitation: ["12 Del. C. § 23"], isUPC: false, lettersTerm: "Letters Testamentary" },
    "DC": { threshold: 40000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["D.C. Code § 20-351"], probateTerm: "Formal Probate", probateCitation: ["D.C. Code § 20"], isUPC: false, lettersTerm: "Letters Testamentary" },
    "FL": {
        threshold: 75000,
        smallEstateTerm: "Summary Administration",
        smallEstateCitation: ["FL Stat. §735.201"],
        probateTerm: "Formal Administration",
        probateCitation: ["FL Stat. §733"],
        isUPC: false,
        lettersTerm: "Letters of Administration",
        spousalSetAside: {
            term: "Spousal Set-Aside",
            citation: ["FL Stat. §732.401"]
        }
    },
    "GA": {
        threshold: 10000,
        smallEstateTerm: "No Administration Necessary",
        smallEstateCitation: ["O.C.G.A. § 53-2-40"],
        probateTerm: "Formal Probate",
        probateCitation: ["O.C.G.A. § 53-7"],
        isUPC: false,
        lettersTerm: "Letters Testamentary",
        // GA-specific creditor timing
        claimWindowDays: 90, // 3 months from publication
        creditorPublication: {
            defaultWindow: 90,
            publicationWindow: 90,
            strategicOption: "Publication required to trigger 3-month claim bar"
        }
    },
    "HI": { threshold: 100000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["H.R.S. § 560:3-1201"], probateTerm: "Informal Probate", probateCitation: ["H.R.S. § 560:3-301"], isUPC: true, lettersTerm: "Letters Testamentary" },
    "ID": { threshold: 100000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["Idaho Code § 15-3-1201"], probateTerm: "Informal Probate", probateCitation: ["Idaho Code § 15-3-301"], isUPC: true, lettersTerm: "Letters Testamentary" },
    "IL": {
        threshold: 150000,
        smallEstateTerm: "Small Estate Affidavit",
        smallEstateCitation: ["755 ILCS 5/25-1"],
        probateTerm: "Formal Probate",
        probateCitation: ["755 ILCS 5/"],
        isUPC: false,
        lettersTerm: "Letters of Office",
        notes: "Increased to $150,000 effective August 15, 2025."
    },
    "IN": { threshold: 50000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["Ind. Code § 29-1-8-1"], probateTerm: "Formal Probate", probateCitation: ["Ind. Code § 29-1"], isUPC: false, lettersTerm: "Letters Testamentary" },
    "IA": { threshold: 50000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["Iowa Code § 633.356"], probateTerm: "Formal Probate", probateCitation: ["Iowa Code § 633"], isUPC: false, lettersTerm: "Letters Testamentary" },
    "KS": { threshold: 75000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["K.S.A. § 59-1507b"], probateTerm: "Formal Probate", probateCitation: ["K.S.A. § 59"], isUPC: false, lettersTerm: "Letters Testamentary" },
    "KY": { threshold: 30000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["K.R.S. § 395.455"], probateTerm: "Formal Probate", probateCitation: ["K.R.S. § 395"], isUPC: false, lettersTerm: "Letters Testamentary" },
    "LA": { threshold: 125000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["La. C.C.P. Art. 3421"], probateTerm: "Formal Probate", probateCitation: ["La. C.C.P."], isUPC: false, lettersTerm: "Letters of Appointment" },
    "ME": { threshold: 40000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["18-C M.R.S. § 3-1201"], probateTerm: "Informal Probate", probateCitation: ["18-C M.R.S. § 3-301"], isUPC: true, lettersTerm: "Letters Testamentary" },
    "MD": { threshold: 50000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["Md. Code, Est. & Trusts § 5-601"], probateTerm: "Formal Probate", probateCitation: ["Md. Code, Est. & Trusts"], isUPC: false, lettersTerm: "Letters of Administration" },
    "MA": {
        threshold: 25000,
        smallEstateTerm: "Voluntary Administration",
        smallEstateCitation: ["M.G.L. c. 190B, § 3-1201"],
        probateTerm: "Probate",
        probateCitation: ["M.G.L. c. 190B"],
        isUPC: true,
        lettersTerm: "Letters of Authority",
        probateSystem: "MUPC",
        claimWindowDays: 365,
        shortenedWindowDays: 120,
        estateTaxThreshold: 2000000,
        bondDefaultRequired: true,
        // MA-Specific Configuration
        probatePaths: {
            informal: {
                term: "Informal Probate",
                citation: ["M.G.L. c. 190B, § 3-301"],
                description: "Streamlined probate process for uncontested estates"
            },
            formal: {
                term: "Formal Probate",
                citation: ["M.G.L. c. 190B, § 3-302"],
                description: "Court-supervised probate for contested or complex estates"
            },
            voluntary: {
                term: "Voluntary Administration",
                citation: ["M.G.L. c. 190B, § 3-1201"],
                description: "Simplified process for small estates under $25,000"
            }
        },
        bondOptions: {
            required_with_sureties: {
                term: "Bond with Sureties",
                description: "Traditional bond requiring co-signers"
            },
            required_without_sureties: {
                term: "Bond without Sureties",
                description: "Bond without co-signers, often used in informal probate"
            },
            waived_by_assent: {
                term: "Bond Waived by Heir Assent",
                description: "All heirs sign to waive bond requirement"
            },
            waived_by_will: {
                term: "Bond Waived by Will",
                description: "Will explicitly waives bond requirement"
            }
        },
        creditorPublication: {
            defaultWindow: 365,
            publicationWindow: 120,
            strategicOption: "Publish to shorten claim window from 1 year to 4 months"
        },
        taxForms: {
            federal: "Form 1041",
            state: "Form 2 (Fiduciary Income Tax Return)",
            estateTax: "Form 1 (Massachusetts Estate Tax Return)"
        }
    },
    "MI": { threshold: 50000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["M.C.L. § 700.3983"], probateTerm: "Informal Probate", probateCitation: ["M.C.L. § 700.3301"], isUPC: true, lettersTerm: "Letters of Authority", notes: "Threshold adjusted annually for inflation ($50k for 2024)." },
    "MN": {
        threshold: 75000,
        smallEstateTerm: "Small Estate Affidavit",
        smallEstateCitation: ["Minn. Stat. § 524.3-1201"],
        probateTerm: "Informal Probate",
        probateCitation: ["Minn. Stat. § 524.3-301"],
        isUPC: true,
        lettersTerm: "Letters Testamentary",
        // MN-specific creditor timing (UPC state)
        // Minnesota uses "later of" rule: 4 months from publication OR 1 month from mailed notice
        claimWindowDays: 120, // 4 months from first publication
        shortenedWindowDays: 30, // 1 month from mailed notice
        // Small estate affidavit waiting period
        waitingDays: 30, // 30 days after death per MN Stat. §524.3-1201
        // Publication strategy configuration
        creditorPublication: {
            defaultWindow: undefined, // Publication not required, but triggers 4-month bar
            publicationWindow: 120, // 4 months from publication
            strategicOption: "Publication triggers 4-month claim bar; without it, creditors may have longer exposure"
        }
    },
    "MS": { threshold: 50000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["Miss. Code § 91-7-322"], probateTerm: "Formal Probate", probateCitation: ["Miss. Code § 91-7"], isUPC: false, lettersTerm: "Letters Testamentary" },
    "MO": { threshold: 40000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["Mo. Rev. Stat. § 473.097"], probateTerm: "Formal Probate", probateCitation: ["Mo. Rev. Stat. § 473"], isUPC: false, lettersTerm: "Letters Testamentary" },
    "MT": { threshold: 50000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["Mont. Code § 72-3-1101"], probateTerm: "Informal Probate", probateCitation: ["Mont. Code § 72-3-301"], isUPC: true, lettersTerm: "Letters Testamentary" },
    "NE": { threshold: 50000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["Neb. Rev. Stat. § 30-24,125"], probateTerm: "Informal Probate", probateCitation: ["Neb. Rev. Stat. § 30-24"], isUPC: true, lettersTerm: "Letters Testamentary" },
    "NV": { threshold: 25000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["N.R.S. § 146.080"], probateTerm: "Formal Probate", probateCitation: ["N.R.S. § 136"], isUPC: false, lettersTerm: "Letters Testamentary", notes: "Higher threshold ($100k) if surviving spouse is the heir." },
    "NH": { threshold: 10000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["N.H. Rev. Stat. § 553:31-a"], probateTerm: "Formal Probate", probateCitation: ["N.H. Rev. Stat. § 553"], isUPC: false, lettersTerm: "Letters of Administration" },
    "NJ": {
        threshold: 20000,
        smallEstateTerm: "Small Estate Affidavit",
        smallEstateCitation: ["N.J.S.A. § 3B:10-3"],
        probateTerm: "Formal Probate",
        probateCitation: ["N.J.S.A. § 3B"],
        isUPC: false,
        lettersTerm: "Letters of Administration",
        notes: "Higher threshold ($50k) if surviving spouse is sole heir. NJ has inheritance tax.",
        claimWindowDays: 180, // 6 months from first publication
        estateTaxThreshold: 0, // NJ has inheritance tax, not estate tax
        bondDefaultRequired: true, // Bond required for administrators unless waived
        smallEstateSpouseThreshold: 50000, // $50k if spouse is sole heir
        probatePaths: {
            informal: {
                term: "Uncontested Probate",
                citation: ["N.J.S.A. § 3B:10-1 et seq."],
                description: "Standard probate through County Surrogate's Court when no contests exist"
            },
            formal: {
                term: "Contested Probate",
                citation: ["N.J.S.A. § 3B:10-1 et seq.", "R. 4:80"],
                description: "Litigated probate proceeding in Superior Court, Chancery Division, Probate Part"
            },
            voluntary: {
                term: "Small Estate Affidavit",
                citation: ["N.J.S.A. § 3B:10-3"],
                description: "Simplified process for estates under $20,000 ($50,000 if spouse is sole heir)"
            }
        },
        bondOptions: {
            required_with_sureties: {
                term: "Bond with Surety",
                description: "Required for administrators unless all heirs waive or will waives"
            },
            required_without_sureties: {
                term: "Bond without Surety",
                description: "May be ordered when estate is solvent but surety waiver is appropriate"
            },
            waived_by_assent: {
                term: "Bond Waived by Written Consent",
                description: "All beneficiaries may sign written consent to waive bond requirement"
            },
            waived_by_will: {
                term: "Bond Waived by Will",
                description: "Will may expressly waive bond requirement for named executor"
            }
        },
        creditorPublication: {
            defaultWindow: 180, // 6 months from first publication
            publicationWindow: 60, // Publication must run for 4 consecutive weeks
            strategicOption: "Publication starts 6-month creditor claim period"
        },
        taxForms: {
            federal: "Form 1041",
            state: "NJ-1041 (Fiduciary Income Tax)",
            estateTax: "NJ Inheritance Tax Return (Form IT-R for residents)"
        },
        // NJ-specific: Inheritance tax applies (not estate tax)
        inheritanceTax: {
            applies: true,
            exemptionThresholds: {
                spouse: "Full exemption (Class A)",
                child: "Full exemption (Class A)",
                parent: "Full exemption (Class A)",
                sibling: "$25,000 exemption, then 11-15% tax (Class C)",
                nieceNephew: "$25,000 exemption, then 15% tax (Class C)",
                other: "No exemption, 15-16% tax (Class D)"
            },
            dueDate: "8 months after death",
            waiverRequired: "NJ Inheritance Tax Waiver required for real estate and some financial accounts"
        }
    },
    "NM": { threshold: 50000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["N.M. Stat. § 45-3-1201"], probateTerm: "Informal Probate", probateCitation: ["N.M. Stat. § 45-3-301"], isUPC: true, lettersTerm: "Letters Testamentary" },
    "NY": {
        threshold: 50000,
        smallEstateTerm: "Voluntary Administration",
        smallEstateCitation: ["NY SCPA Article 13"],
        probateTerm: "Formal Administration",
        probateCitation: ["NY SCPA Article 14"],
        isUPC: false,
        lettersTerm: "Letters of Authority"
    },
    "NC": { threshold: 20000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["N.C.G.S. § 28A-25-1"], probateTerm: "Formal Probate", probateCitation: ["N.C.G.S. § 28A"], isUPC: false, lettersTerm: "Letters Testamentary", notes: "$30k if surviving spouse is sole heir." },
    "ND": { threshold: 50000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["N.D. Cent. Code § 30.1-23-01"], probateTerm: "Informal Probate", probateCitation: ["N.D. Cent. Code § 30.1-14-01"], isUPC: true, lettersTerm: "Letters Testamentary" },
    "OH": {
        threshold: 35000,
        smallEstateTerm: "Release from Administration",
        smallEstateCitation: ["R.C. § 2113.03"],
        probateTerm: "Formal Probate",
        probateCitation: ["R.C. § 2113"],
        isUPC: false,
        lettersTerm: "Letters of Administration",
        notes: "$100k if surviving spouse is sole heir.",
        // Ohio creditor claim timing - 6 months from date of death or fiduciary appointment
        claimWindowDays: 180,
        creditorPublication: {
            defaultWindow: 180,
            publicationWindow: 180,
            strategicOption: "Publication required by ORC §2117.07 but does not affect 6-month deadline from date of death"
        }
    },
    "OK": { threshold: 50000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["58 O.S. § 393"], probateTerm: "Formal Probate", probateCitation: ["58 O.S."], isUPC: false, lettersTerm: "Letters Testamentary" },
    "OR": { threshold: 75000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["O.R.S. § 114.515"], probateTerm: "Formal Probate", probateCitation: ["O.R.S. § 113"], isUPC: false, lettersTerm: "Letters Testamentary", notes: "Limit is for personal property. Real property limit is $200k." },
    "PA": {
        threshold: 50000,
        smallEstateTerm: "Settlement of Small Estates",
        smallEstateCitation: ["20 Pa. C.S. § 3102"],
        probateTerm: "Formal Probate",
        probateCitation: ["20 Pa. C.S."],
        isUPC: false,
        lettersTerm: "Letters Testamentary"
    },
    "RI": { threshold: 25000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["R.I.G.L. § 33-24-1"], probateTerm: "Formal Probate", probateCitation: ["R.I.G.L. § 33"], isUPC: false, lettersTerm: "Letters Testamentary" },
    "SC": { threshold: 25000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["S.C. Code § 62-3-1201"], probateTerm: "Informal Probate", probateCitation: ["S.C. Code § 62-3-301"], isUPC: true, lettersTerm: "Letters Testamentary" },
    "SD": { threshold: 50000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["S.D.C.L. § 29A-3-1201"], probateTerm: "Informal Probate", probateCitation: ["S.D.C.L. § 29A-3-301"], isUPC: true, lettersTerm: "Letters Testamentary" },
    "TN": { threshold: 50000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["T.C.A. § 30-4-101"], probateTerm: "Formal Probate", probateCitation: ["T.C.A. § 30-1"], isUPC: false, lettersTerm: "Letters Testamentary" },
    "TX": {
        threshold: 75000,
        smallEstateTerm: "Small Estate Affidavit",
        smallEstateCitation: ["TX Estates Code §205"],
        probateTerm: "Independent Administration",
        probateCitation: ["TX Estates Code §401"],
        isUPC: false,
        lettersTerm: "Letters Testamentary",
        notes: "Supports Muniment of Title for uncontested wills with no debts.",
        // TX-Specific Configuration
        claimWindowDays: 120, // 4 months from published notice or personal notice
        bondDefaultRequired: false, // Bond not required unless will demands it or court orders it
        estateTaxThreshold: 0, // TX has no state estate tax
        probatePaths: {
            informal: {
                term: "Independent Administration",
                citation: ["TX Estates Code §401"],
                description: "Streamlined probate where executor acts without continuous court supervision"
            },
            formal: {
                term: "Dependent Administration",
                citation: ["TX Estates Code §359"],
                description: "Court-supervised probate with required hearings for most actions"
            },
            voluntary: {
                term: "Small Estate Affidavit",
                citation: ["TX Estates Code §205"],
                description: "Simplified process for estates under $75,000 when no real property other than homestead"
            }
        },
        bondOptions: {
            required_with_sureties: {
                term: "Bond with Sureties",
                description: "Required only if will explicitly demands it or for dependent administration"
            },
            required_without_sureties: {
                term: "Personal Bond",
                description: "Allowed in many TX counties for independent administration without surety"
            },
            waived_by_assent: {
                term: "Bond Waived by Heir Consent",
                description: "All heirs can consent to waive bond requirement"
            },
            waived_by_will: {
                term: "Bond Waived by Will",
                description: "Most wills waive bond; this is the standard TX practice"
            }
        },
        creditorPublication: {
            defaultWindow: 120, // 4 months
            publicationWindow: 60, // Publication runs for 2+ weeks typically
            strategicOption: "Publication optional but recommended to start 4-month claim period"
        },
        taxForms: {
            federal: "Form 1041",
            state: "None (TX has no state income tax)",
            estateTax: "None (TX has no state estate tax)"
        },
        // TX-specific: Muniment of Title
        munimentOfTitle: {
            available: true,
            citation: ["TX Estates Code §257"],
            requirements: ["Valid will", "No unpaid debts (except secured real property debts)", "No Medicaid recovery claims"],
            notes: "No executor appointed; court order serves as title transfer authority"
        },
        // TX-specific: Heirship proceedings
        heirshipProceeding: {
            available: true,
            citation: ["TX Estates Code §202"],
            description: "Determination of heirship required for intestate estates when heirs are unknown or disputed"
        },
        // TX-specific: Homestead protections
        homesteadProtections: {
            available: true,
            citation: ["TX Estates Code §102", "TX Constitution Art. XVI, §51"],
            description: "Homestead passes to surviving spouse and/or minor children; exempt from creditor claims"
        },
        // TX-specific: 10-day posting requirement
        postingRequirement: {
            days: 10,
            citation: ["TX Estates Code §54"],
            description: "Application must be posted at courthouse for 10 days before hearing (unless waived by court for good cause)"
        }
    },
    "UT": { threshold: 100000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["Utah Code § 75-3-1201"], probateTerm: "Informal Probate", probateCitation: ["Utah Code § 75-3-301"], isUPC: true, lettersTerm: "Letters Testamentary" },
    "VT": { threshold: 45000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["14 V.S.A. § 1902"], probateTerm: "Formal Probate", probateCitation: ["14 V.S.A."], isUPC: false, lettersTerm: "Letters Testamentary" },
    "VA": { threshold: 50000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["Va. Code § 64.2-601"], probateTerm: "Formal Probate", probateCitation: ["Va. Code § 64.2"], isUPC: false, lettersTerm: "Letters of Qualification" },
    "WA": { threshold: 100000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["R.C.W. § 11.62.010"], probateTerm: "Formal Probate", probateCitation: ["R.C.W. § 11"], isUPC: false, lettersTerm: "Letters Testamentary" },
    "WV": { threshold: 50000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["W. Va. Code § 44-1A-1"], probateTerm: "Formal Probate", probateCitation: ["W. Va. Code § 44"], isUPC: false, lettersTerm: "Letters Testamentary" },
    "WI": { threshold: 50000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["Wis. Stat. § 867.03"], probateTerm: "Formal Probate", probateCitation: ["Wis. Stat. § 867"], isUPC: false, lettersTerm: "Letters of Administration" },
    "WY": { threshold: 200000, smallEstateTerm: "Small Estate Affidavit", smallEstateCitation: ["Wyo. Stat. § 2-1-201"], probateTerm: "Formal Probate", probateCitation: ["Wyo. Stat. § 2-1"], isUPC: false, lettersTerm: "Letters Testamentary" }
};
// Default rule for unknown states or those following basic UPC patterns
export const DEFAULT_STATE_RULE = {
    threshold: 50000,
    smallEstateTerm: "Small Estate Affidavit",
    smallEstateCitation: ["State Small Estate Statute"],
    probateTerm: "Formal Probate",
    probateCitation: ["State Probate Code"],
    isUPC: false,
    lettersTerm: "Letters of Authority"
};
// UPC States Mapping
export const UPC_STATES = [
    "AK", "AZ", "CO", "HI", "ID", "ME", "MA", "MI", "MN", "MT",
    "NE", "NM", "ND", "SC", "SD", "UT"
];
// Initialize UPC states in the rules dictionary if not explicitly defined
UPC_STATES.forEach(state => {
    if (!STATE_RULES[state]) {
        STATE_RULES[state] = {
            ...DEFAULT_STATE_RULE,
            isUPC: true,
            smallEstateCitation: ["Uniform Probate Code §III"],
            probateCitation: ["Uniform Probate Code §III"]
        };
    }
    else {
        STATE_RULES[state].isUPC = true;
    }
});
export function getStateRule(state) {
    return STATE_RULES[state] || DEFAULT_STATE_RULE;
}
export function getLettersTerm(stateCode, hasWill) {
    if (!stateCode || !STATE_RULES[stateCode]) {
        return hasWill === false ? "Letters of Administration" : "Letters Testamentary";
    }
    const rule = STATE_RULES[stateCode];
    if (hasWill === false)
        return "Letters of Administration";
    if (hasWill === true)
        return "Letters Testamentary";
    return rule.lettersTerm;
}
