# 13 Probate Types — Path & Task Evaluation
**ExpectedEstate | Executor/User Perspective**
*Generated: February 2026*

---

## Overview

The ExpectedEstate platform's Authority Engine (`src/lib/authorityEngine.ts`) routes every estate into one of **13 legal tracks** based on:
- Whether a Will exists
- Estate value vs. state threshold
- Whether a Trust exists (revocable or irrevocable)
- Surviving spouse status
- Out-of-state real property
- State of domicile (UPC vs. non-UPC)

Each track activates a different roadmap, different master mode, and different authority document requirement.

---

## Master Mode Classifications

| Mode | Meaning | Who is in charge |
|------|---------|-----------------|
| **COURT_SUPERVISED** | Judge oversees all major actions | Executor appointed by court |
| **FIDUCIARY_ADMINISTERED** | Trustee acts under trust document | Successor Trustee |
| **TRANSFER_ONLY** | No court needed; direct transfer | Beneficiary or surviving joint owner |

---

## The 13 Probate Types

---

### 1. 🏛️ FORMAL PROBATE
**`AuthorityType: FORMAL_PROBATE` | Master Mode: COURT_SUPERVISED**

**When triggered:**
- Estate value > state threshold (e.g., > $208,850 in CA)
- A valid Will exists
- NOT a UPC state OR estate is contested

**What it means for you (Executor):**
You have been named in a Will and must go to court to be officially appointed. Every major action — selling property, accessing bank accounts, distributing funds — requires court-issued **Letters Testamentary (DE-150 in CA)**. This is the most involved track, typically taking **9 months to 2 years**.

**Path & Tasks:**
| Stage | Key Tasks | Trigger |
|-------|-----------|---------|
| **1. Preliminary Assessment** | Create asset list, estimate value, identify jurisdiction, order 10+ death certificates, estimate bond | Immediate (after death) |
| **2. Court Petition** | File Petition (DE-111), lodge original Will, publish notice in newspaper, mail notice to all heirs | After preliminary inventory |
| **3. Fiduciary Authority** | Attend probate hearing, file bond (if required), obtain Letters Testamentary (DE-150), get EIN for estate | After petition filed |
| **4. Discovery & Inventory** | Notify all financial institutions (requires Letters), inventory all assets, get referee appraisal, file Inventory & Appraisal (DE-160) | After Letters issued |
| **5. Creditor Management** | Send notice to known creditors, **wait 4-month claim period**, categorize claims (secured/unsecured), apply statutory priority, pay valid debts, file final tax returns (1040 + 1041) | After notice published |
| **6. Final Distribution** | File final petition, obtain court Order for Distribution, distribute assets to heirs, file Receipt & Discharge | After 4-month creditor window closes |

**Key Risk:** Paying debts before the claim period closes may create **personal liability** for the executor.

**State Overrides:** TX uses "Application for Probate" (not DE-111). FL has a 10-day Will lodging deadline. NY has a 7-month creditor window.

---

### 2. 📋 INFORMAL PROBATE
**`AuthorityType: INFORMAL_PROBATE` | Master Mode: COURT_SUPERVISED**

**When triggered:**
- Estate value > state threshold
- State has adopted the Uniform Probate Code (UPC states: AZ, CO, HI, ID, ME, MI, MN, MT, NE, NM, ND, SC, SD, UT, etc.)
- Will exists AND estate is NOT contested

**What it means for you (Executor):**
Think of this as "probate lite." The court issues Letters Testamentary but does **minimal supervision** after that. No ongoing court hearings for routine actions. Typically **30–60% faster** than formal probate.

**Path & Tasks:**
| Stage | Key Tasks |
|-------|-----------|
| **1. Verify Uncontested** | Review Will for clarity, contact all beneficiaries, confirm no objections, document absence of disputes |
| **2. Simplified Petition** | Prepare simplified petition, attach Will + death certificate, request waiver of bond, request independent administration, file with court, pay reduced fees |
| **3. Streamlined Authority** | Attend brief hearing (or waived), receive Letters Testamentary, note independent administration granted |
| **4. Informal Administration** | Collect and manage assets, pay debts and expenses, file tax returns, communicate with beneficiaries, maintain records (no formal accounting required in most states) |
| **5. Simplified Distribution** | Prepare distribution plan, obtain beneficiary consents, distribute per Will, obtain signed receipts, file closing statement (if required) |

**Key Advantage:** No Inventory & Appraisal filing required in many UPC states. No formal court accounting.

---

### 3. ⚖️ INTESTATE PROBATE
**`AuthorityType: INTESTATE` | Master Mode: COURT_SUPERVISED**

**When triggered:**
- No valid Will exists (or Will is declared invalid)
- Estate value > state threshold

**What it means for you (Administrator):**
You are NOT called an "Executor" — you are an **Administrator**. There is no Will to follow. State law dictates exactly who gets what. This is often the most emotionally contentious path because family members may disagree about who is the rightful heir.

**Path & Tasks:**
| Stage | Key Tasks |
|-------|-----------|
| **1. Heir Hierarchy** | Identify surviving spouse, children, parents, siblings in that order. Apply state intestacy calculator. Document complete family tree. Verify no Will exists anywhere. Determine each heir's percentage share. |
| **2. Administrator Petition** | Prepare Petition (DE-111), request **Administrator** appointment (not Executor), list ALL heirs with addresses, determine bond requirement, file with probate court, serve notice to all heirs, publish in newspaper |
| **3. Bond & Authority** | Attend court hearing, post surety bond (almost always required), receive **Letters of Administration**, order certified copies |
| **4. Creditor Clearance** | Publish creditor notice (4 months), inventory all assets, pay funeral expenses, pay valid creditor claims, file final tax returns, obtain tax clearances |
| **5. Statutory Distribution** | Calculate shares per state law (NOT per anyone's wishes), prepare distribution petition, file Petition for Final Distribution, obtain court approval, distribute to heirs per court order, obtain receipts, file final accounting, close estate |

**Key Reality:** Heirs who expected to inherit more often contest this path. Bond is almost always mandatory. Distribution is rigid — state law, not family sentiment.

---

### 4. 📄 SMALL ESTATE (Affidavit)
**`AuthorityType: SMALL_ESTATE` | Master Mode: TRANSFER_ONLY**

**When triggered:**
- Estate value ≤ state threshold (e.g., ≤ $208,850 in CA, ≤ $75,000 in TX/FL, ≤ $50,000 in NY)
- No (or minimal) real property
- NOT in Florida (→ Summary Administration) or New York (→ Voluntary Administration)

**What it means for you (Petitioner):**
No court supervision needed. You fill out a form, wait a mandatory period (typically **40 days** in CA), get it notarized, and hand it to the bank. Banks are legally required to release funds. This is the fastest and cheapest path.

**Path & Tasks:**
| Stage | Key Tasks |
|-------|-----------|
| **1. Valuation** | List all assets, appraise real property if any, verify total is below the state threshold |
| **2. Affidavit** | Wait required period (40 days in CA), prepare 13100 Affidavit (DE-310 in CA), sign & notarize, attach certified death certificate |
| **3. Collection** | Present affidavit to each bank/institution, record deed if real estate involved, collect funds into an estate account |
| **4. Debts** | Pay funeral expenses, pay last illness expenses, pay other debts |
| **5. Final Distribution** | Calculate heir shares, write distribution checks, close estate account |

**Key Warning:** Banks may still demand Letters Testamentary for accounts over $50,000 even when state law allows affidavits. Escalate if rejected.

---

### 5. 🌴 SUMMARY ADMINISTRATION (Florida Only)
**`AuthorityType: SMALL_ESTATE` + `procedureType: SUMMARY_ADMINISTRATION` | Master Mode: TRANSFER_ONLY**

**When triggered:**
- Florida estate
- Estate value < $75,000 OR decedent died more than 2 years ago

**What it means for you (Petitioner):**
Florida's simplified probate for small estates. Still requires a court **petition**, but far less oversight than formal administration. No personal representative appointment needed.

**Path & Tasks:**
| Stage | Key Tasks |
|-------|-----------|
| **1. Eligibility** | Appraise all assets, list all known debts, confirm total assets < $75,000 (or 2+ years since death) |
| **2. Petition for Summary** | Prepare Petition for Summary Administration, file with probate court |
| **3. Order of Summary** | Obtain certified Order of Summary Administration from judge, distribute assets per order |

**Key Difference from standard Small Estate:** Florida requires a court-issued **Order** before distributions, even for small estates.

---

### 6. 🗽 VOLUNTARY ADMINISTRATION (New York Only)
**`AuthorityType: SMALL_ESTATE` + `procedureType: VOLUNTARY_ADMINISTRATION` | Master Mode: TRANSFER_ONLY**

**When triggered:**
- New York estate
- Estate value < $50,000 in personal property (real estate excluded)

**What it means for you (Petitioner):**
NY's simplified process under SCPA Article 13. You file a simple petition with the Surrogate's Court, pay a small fee, and receive a court order that lets you collect and distribute assets.

**Path & Tasks:**
| Stage | Key Tasks |
|-------|-----------|
| **1. Valuation** | Confirm personal property < $50,000 |
| **2. Petition** | File Voluntary Administration petition with Surrogate's Court |
| **3. Authority** | Receive Letters of Voluntary Administration |
| **4. Collection & Distribution** | Collect assets, pay debts, distribute to heirs |

---

### 7. 🤠 MUNIMENT OF TITLE (Texas Only)
**`AuthorityType: MUNIMENT_OF_TITLE` | Master Mode: COURT_SUPERVISED**

**When triggered:**
- Texas estate
- Valid Will exists
- No unpaid debts (except liens on real property)
- No need for ongoing estate administration

**What it means for you:**
The most streamlined court process in Texas. The court admits the Will to probate as a **"muniment of title"** only — no executor is appointed, no letters issued, no ongoing administration. The Will itself becomes the transfer document for real estate.

**Path & Tasks:**
| Stage | Key Tasks |
|-------|-----------|
| **1. Application** | File Application for Muniment of Title, lodge original Will, confirm no outstanding debts |
| **2. Hearing** | Attend brief hearing, court admits Will to probate |
| **3. Certified Will** | Obtain certified copies of Will (this IS the authority document) |
| **4. Transfer** | Present certified Will to institutions and county recorder to transfer title |
| **5. Record** | Record certified Will at county deed records for real property |

**Key Limitation:** Cannot be used if there are unpaid debts. Does NOT grant Letters Testamentary. Only useful for title transfer, not ongoing estate administration.

---

### 8. 🗺️ ANCILLARY PROBATE
**`AuthorityType: ANCILLARY_PROBATE` | Master Mode: COURT_SUPERVISED**

**When triggered:**
- Decedent owned real property in a state OTHER than their state of domicile
- Requires a **second** probate proceeding in the property's state

**What it means for you (Executor):**
You are juggling two (or more) probate cases simultaneously in different states. The "primary" probate is in the home state; the "ancillary" is in each state where out-of-state property exists. Each state has its own forms, fees, and local requirements.

**Path & Tasks:**
| Stage | Key Tasks |
|-------|-----------|
| **1. Domiciliary Completion** | Complete primary probate in home state, obtain certified Letters Testamentary, identify ALL out-of-state property, determine which states need ancillary, estimate ancillary costs, consider selling vs. transferring |
| **2. Exemplified Documents** | Obtain **exemplified** (court-certified) copy of Will, obtain exemplified Letters Testamentary, get multiple certified death certificates, research local state filing requirements |
| **3. Local Counsel & Filing** | Retain local attorney in property state, file Petition for Ancillary Probate, submit exemplified Will and Letters, appoint local personal representative (if required), publish local creditor notice |
| **4. Local Administration** | Obtain local Letters Testamentary, open local estate bank account, pay local property taxes, maintain property, resolve local creditor claims, coordinate with domiciliary executor, file local taxes |
| **5. Property Disposition** | Decide: sell or transfer to heirs. If selling: list, accept offer, close sale. If transferring: prepare deeds. Pay local closing costs, transfer proceeds to home-state estate, file final local accounting, close ancillary probate |

**Key Tip:** Putting real estate into an LLC or Revocable Trust **before death** eliminates the need for ancillary probate entirely.

---

### 9. 💍 SPOUSAL PROPERTY PETITION
**`AuthorityType: SPOUSAL_PETITION` | Master Mode: COURT_SUPERVISED**

**When triggered:**
- Surviving spouse exists
- There are probate assets that need to be transferred
- Spouse qualifies for community property or spousal set-aside

**What it means for you (Surviving Spouse/Petitioner):**
Faster than full probate, but still requires a court petition. In California, you file a **DE-221** petition and obtain a **DE-226 Order**. This is the primary shortcut for surviving spouses with community property. Typically takes **2–3 months** vs. 12+ months for formal probate.

**Path & Tasks:**
| Stage | Key Tasks |
|-------|-----------|
| **1. Eligibility** | Confirm surviving spouse status, verify community property, check for other heirs |
| **2. Documents** | Obtain death certificate, obtain marriage certificate, gather property deeds/titles, locate original Will (if exists) |
| **3. Petition** | Prepare **DE-221** (Spousal Property Petition), notarize signature, file with Probate Court, pay filing fees (~$435 in CA) |
| **4. Hearing** | Receive hearing notice (typically 6–8 weeks out), prepare hearing documents, attend court hearing |
| **5. Order** | Obtain certified **DE-226** (Spousal Property Order), get multiple certified copies |
| **6. Transfer** | Present DE-226 to all financial institutions, record deed at County Recorder (real estate), transfer bank/brokerage accounts, transfer vehicle titles at DMV |

**Critical Risk:** If the surviving spouse assumes personal liability for the decedent's debts (to skip the 4-month creditor notice period), they become personally responsible for those debts out of their own pocket — even beyond the estate assets.

---

### 10. 🔐 TRUST ADMINISTRATION — REVOCABLE
**`AuthorityType: TRUST_ADMIN_REVOCABLE` | Master Mode: FIDUCIARY_ADMINISTERED**

**When triggered:**
- Decedent had a Revocable Living Trust (funded during life)
- Assets are titled in the trust's name

**What it means for you (Successor Trustee):**
**No court involvement at all** — unless unfunded assets trigger a pour-over probate. You act under the authority of the trust document itself. This is what estate planning attorneys mean when they say "avoid probate." The tradeoff is that you have **strict fiduciary duties** and must follow the trust terms exactly.

**Path & Tasks:**
| Stage | Key Tasks |
|-------|-----------|
| **1. Authority (Trustee Acceptance)** | Review original trust document, sign **Acceptance of Trusteeship**, prepare and notarize **Certificate of Trust**, issue Certificate to banks and institutions |
| **2. Notice to Beneficiaries** | Identify all trust beneficiaries, prepare **mandatory notice (Probate Code §16061.7 in CA)**, send via **certified mail**, **wait 120-day contest period** |
| **3. Trust Asset Inventory** | Verify trust titling on ALL assets (anything NOT in the trust needs a pour-over probate), obtain date-of-death valuations, create Trust Asset Inventory |
| **4. Tax & Expenses** | File final Form 1040 (decedent's last income tax), file Trust Income Tax (Form 1041), pay trust debts, pay administration expenses |
| **5. Distribution** | Calculate beneficiary shares per trust terms, distribute assets to beneficiaries, obtain signed receipts from all beneficiaries, prepare final accounting (optional but recommended) |

**Key Warning:** If the trust was **not funded** (assets not transferred into trust during life), those assets must go through probate. This is the #1 failure mode of trust planning.

---

### 11. 🔒 TRUST ADMINISTRATION — IRREVOCABLE
**`AuthorityType: TRUST_ADMIN_IRREVOCABLE` | Master Mode: FIDUCIARY_ADMINISTERED**

**When triggered:**
- Decedent had an Irrevocable Trust (could not be changed after creation)
- Common types: Irrevocable Life Insurance Trust (ILIT), Special Needs Trust, Charitable Trust

**What it means for you (Trustee):**
Similar to revocable trust administration, but the trust terms are **locked** — you cannot deviate from them. Often used for estate tax planning or asset protection. Independent trustee (not a family member) is typically required.

**Path & Tasks:**
The path is identical to Revocable Trust Administration, but with additional constraints:
- You **cannot** modify distribution terms even if circumstances have changed
- Court petition required for any modification (trust decanting or reformation)
- Stricter investment duties under Prudent Investor Act
- May require annual accounting to beneficiaries

**Key Distinction from Revocable:** Assets in an irrevocable trust are **removed from the taxable estate** — which is the whole point. Distributions must follow the trust's precise terms.

---

### 12. ➡️ NON-PROBATE / TOD DEED TRANSFER
**`AuthorityType: TOD_DEED` or `POD_TOD_TRANSFER` | Master Mode: TRANSFER_ONLY**

**When triggered:**
- Real property has a recorded Transfer-on-Death (TOD) deed
- Bank accounts have Payable-on-Death (POD) designations
- Retirement accounts/life insurance have named beneficiaries
- Jointly-owned assets (Joint Tenancy with Right of Survivorship)

**What it means for you (Beneficiary):**
**No court. No attorney required.** You are a named beneficiary. Present the death certificate and a claim form directly to the institution. Assets transfer directly to you within 2–4 weeks.

**5-State Attorney Model for TOD:**

| Stage | Key Tasks |
|-------|-----------|
| **State 1: Eligibility Validation** | Confirm TOD deed is properly recorded, check for revocation, verify beneficiary survives decedent, check if joint tenancy overrides TOD |
| **State 2: Beneficiary Authority** | Prepare beneficiary authority packet (death certificate + your ID + claim form) |
| **State 3: Title Transfer** | Record Affidavit of Death of Transferor with county recorder, notify Assessor's office, coordinate institutional transfer |
| **State 4: Creditor Exposure Review** | Review whether creditors of the estate can reach TOD assets (silent review — does NOT require creditor notice period in most states) |
| **State 5: Exception Escalation** | If TOD deed is challenged, defective, or creditors make claims → trigger probate escalation |

**POD/TOD Account Path:**
1. Contact institution, request copy of beneficiary form
2. Verify your name is listed
3. Assemble packet: certified death certificate + your ID + claim form + W-9
4. Submit to institution (mail or in-person)
5. Choose transfer method (check/wire/new account)
6. Note tax implications for retirement accounts

**Key Warning:** TOD/POD assets bypass probate but are **still part of the taxable estate**. Creditors may still have claims in some states. For retirement accounts, non-spouse beneficiaries must distribute within 10 years (SECURE Act 2.0).

---

### 13. 🔍 DISCOVERY MODE
**`AuthorityType: DISCOVERY` | Master Mode: COURT_SUPERVISED**

**When triggered:**
- Executor/user has no information about assets, will, or estate value
- System cannot determine the correct legal track yet
- No assets entered, no estate value provided

**What it means for you:**
You're in "forensic investigation" mode. The platform cannot route you to the right legal path until you locate assets and determine the estate's value. This is not a permanent track — it's a temporary state until you have enough data to commit to one of the other 12 tracks.

**Path & Tasks:**
| Stage | Key Tasks |
|-------|-----------|
| **1. Initial Search** | Review physical mail (last 3 months), check bank & credit card statements, sweep emails and digital accounts, **initialize forensic discovery protocol** |
| **2. Valuation Sweep** | Identify solely-owned (individual) assets, compare total to state small estate limits, estimate probate vs. non-probate split |
| **3. Heirship Search** | Locate original Will or Trust document, verify legal heir contact info and addresses |
| **4. Track Selection** | Commit to the correct legal path based on findings — this unlocks the appropriate roadmap from Types 1–12 |

---

## Decision Tree Summary

```
DEATH EVENT
    │
    ├─ Death Certificate? NO → STOP
    │
    ├─ Revocable Trust (funded)? → TRUST_ADMIN_REVOCABLE (#10)
    ├─ Irrevocable Trust? → TRUST_ADMIN_IRREVOCABLE (#11)
    │
    ├─ Out-of-state real property? → ANCILLARY_PROBATE (#8)
    │
    ├─ Surviving Spouse + probate assets? → SPOUSAL_PETITION (#9)
    │
    ├─ TOD deed / POD accounts / Joint? → NON_PROBATE (#12)
    │
    ├─ No assets identified yet? → DISCOVERY (#13)
    │
    ├─ Estate > State Threshold?
    │    ├─ TX + Will + no debts → MUNIMENT_OF_TITLE (#7)
    │    ├─ UPC state + Will + uncontested → INFORMAL_PROBATE (#2)
    │    ├─ No Will → INTESTATE (#3)
    │    └─ Default → FORMAL_PROBATE (#1)
    │
    └─ Estate ≤ State Threshold?
         ├─ FL (< $75k) → SUMMARY_ADMINISTRATION (#5)
         ├─ NY (< $50k) → VOLUNTARY_ADMINISTRATION (#6)
         └─ Default → SMALL_ESTATE Affidavit (#4)
```

---

## Comparative Quick Reference

| # | Track | Court? | Attorney | Authority Doc | Typical Time | Cost |
|---|-------|--------|----------|---------------|-------------|------|
| 1 | Formal Probate | ✅ Required | Strongly recommended | Letters Testamentary | 9–18 months | $$$$ |
| 2 | Informal Probate | ✅ Initial only | Optional | Letters Testamentary | 4–9 months | $$$ |
| 3 | Intestate | ✅ Required | Recommended | Letters of Administration | 9–18 months | $$$$ |
| 4 | Small Estate Affidavit | ❌ None | Not needed | Notarized Affidavit | 6–12 weeks | $ |
| 5 | Summary Admin (FL) | ✅ Petition | Optional | Court Order | 6–10 weeks | $$ |
| 6 | Voluntary Admin (NY) | ✅ Petition | Optional | Letters Vol. Admin | 4–8 weeks | $$ |
| 7 | Muniment of Title (TX) | ✅ Hearing | Optional | Certified Will | 6–10 weeks | $$ |
| 8 | Ancillary Probate | ✅ 2 states | Required | 2 sets of Letters | 12–24 months | $$$$$ |
| 9 | Spousal Petition | ✅ Hearing | Optional | DE-226 Order (CA) | 6–12 weeks | $$ |
| 10 | Trust Admin (Revocable) | ❌ None | Optional | Certificate of Trust | 3–9 months | $$ |
| 11 | Trust Admin (Irrevocable) | ❌ None | Recommended | Certificate of Trust | 3–9 months | $$$ |
| 12 | Non-Probate / TOD | ❌ None | Not needed | Death Certificate | 2–6 weeks | $ |
| 13 | Discovery | Depends | Depends | Depends | Depends | — |

---

## Executor Risk Flags by Track

### 🔴 HIGH RISK — Personal Liability Exposure
- **FORMAL_PROBATE + INTESTATE:** Paying debts before 4-month creditor period = personal liability
- **INSOLVENT overlay:** Paying lower-priority debts before higher-priority = surcharge
- **SPOUSAL_PETITION:** Assuming debt liability to skip creditor notice = personal exposure
- **ANY TRACK with MINOR HEIRS:** Direct distribution to minors = violation of probate law

### 🟡 MEDIUM RISK — Process Failure Points  
- **TRUST_ADMIN:** Unfunded trust assets fall into probate (most common trust failure)
- **SMALL_ESTATE:** Banks may reject affidavit for large balances despite legal eligibility
- **ANCILLARY:** Missing out-of-state property until after estate closes = need to reopen
- **INTESTATE:** Unknown heirs discovered after distribution = claw-back risk

### 🟢 LOW RISK — Straightforward Paths
- **NON_PROBATE/TOD:** Beneficiary designation controls; minimal executor involvement
- **SMALL_ESTATE (below threshold, no real estate):** Affidavit + waiting period = clean transfer
- **MUNIMENT OF TITLE (TX, no debts):** Will serves as its own transfer instrument

---

## Modifier Overlays (Activated Regardless of Base Track)

These are injected on top of any base track when conditions are detected:

| Modifier | Trigger | Impact |
|----------|---------|--------|
| `INSOLVENT` | Liabilities > Assets | Freeze distributions; strict statutory priority required |
| `MINOR_HEIRS` | Any heir under 18 | Court-approved blocked accounts or testamentary trust required |
| `BUSINESS_ESTATE` | Decedent owned business/LLC | Operating orders needed; formal business valuation required |
| `CONTESTED` | Will contest or disputes | Litigation hold; **all distributions frozen** |
| `PROBATE_ESCALATION` | Unfunded trust assets | Trust track + court filing phase for the probate portion |
| `ELECTIVE_SHARE` | Spouse claims against will | Recalculate distribution priorities; adjust shares |

---

## What Every Executor Must Do First (Universal)

Regardless of track, these actions apply **immediately** after death:

1. ✅ **Secure the property** — Change locks, freeze joint accounts from new transactions
2. ✅ **Order 10+ certified death certificates** — Every institution needs one; they can't be photocopied
3. ✅ **Locate the original Will** — A photocopy is NOT acceptable in court; locate the wet-ink original
4. ✅ **Get an EIN** — The estate needs its own tax ID number (free at IRS.gov, takes 5 minutes online)
5. ✅ **Open an estate bank account** — Never commingle estate funds with personal funds (fiduciary violation)
6. ✅ **Do NOT distribute anything yet** — Even obvious distributions can create personal liability before the creditor period closes
7. ✅ **Do NOT pay yourself** — Executor compensation requires court approval or beneficiary consent

---

*Document generated from analysis of: `src/lib/authorityEngine.ts`, `src/lib/stateRules.ts`, `src/config/settlementStages.ts`, `src/config/roadmapGenerator.ts`, `RAg_Docs/ExpectedEstate_Probate_Decision_Tree.txt`*
