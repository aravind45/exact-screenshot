# Probate Platform — Implementation Gap Analysis
**"Are We Missing Anything? How Confident Is the Executor?"**

*Authored: February 2026 | Perspective: First-time executor, no legal background*

---

## Executive Summary

The platform has an **exceptionally well-architected backbone** — a deterministic authority engine, a rich task library with dependency chains, statutory deadline awareness, and modifier overlays for complex estates. For a typical formal or informal probate, a moderately capable executor could follow the roadmap. However, **critical last-mile gaps** between what the backend knows and what the executor actually *sees and acts on* mean confidence varies dramatically by track.

**Overall Executor Confidence Score: 6.2 / 10**

| Category | Score | Note |
|---|---|---|
| Decision routing (authority engine) | 9.5/10 | World-class |
| Phase structure & task library | 8.5/10 | Rich, well-defined |
| Deadline management | 4.5/10 | Exists in UI but **not auto-populated** |
| Form generation | 3.5/10 | References form names; no filled PDFs |
| State coverage beyond CA/TX/FL/NY | 4.0/10 | Generic fallback for 46 states |
| Executor "what do I do TODAY" clarity | 5.0/10 | Phase tasks shown but not prioritized |
| Track-specific edge coverage | 5.5/10 | Thin for NY/FL specialty tracks |
| Attorney handoff clarity | 6.0/10 | `isAttorneyReviewNode` set, not surfaced |
| Mobile / real-world usability | 5.0/10 | Desktop-first design |

---

## Part 1: What's Working Well (Strengths)

### 1.1 Authority Engine — Best-in-Class Routing
The `calculateAuthorityRecommendation()` function correctly handles every branching condition: will/no-will, state thresholds, UPC vs non-UPC, trust type, surviving spouse, out-of-state property. The 25+ `AuthorityType` variants with clear `masterMode` (COURT_SUPERVISED / FIDUCIARY_ADMINISTERED / TRANSFER_ONLY) map directly to executor responsibilities. **No other consumer product does this deterministically.**

### 1.2 Task Library Depth
`settlementPhases.ts` defines 6 phases × 2 machines (probate + trust) with tasks that have:
- `deadlineWarningId` — statutory deadline awareness baked in
- `requiresAuthority` — blocks action until legal standing confirmed
- `isAttorneyReviewNode` — correctly flags legal review touchpoints
- `trackCompatibility` — prevents wrong-track task display
- `dependencies` — enforces correct sequencing
- `requiresPhysicalMail` / `requiresNotary` — real-world logistics flagged

This is sophisticated process engineering that would take a law firm months to replicate.

### 1.3 Modifier Overlays
INSOLVENT, MINOR_HEIRS, BUSINESS_ESTATE, CONTESTED, PROBATE_ESCALATION, ELECTIVE_SHARE overlays correctly escalate the roadmap. Most competitors ignore these entirely.

### 1.4 Settlement Health Engine
4-axis health scores (authority/accounting/risk/compliance) are genuinely useful for an executor to know where they stand. This is a premium differentiator.

### 1.5 Safety Net Widget
The 14-day inactivity detector for stuck assets is a real-world lifesaver. Institutions *do* stall. This proactively surfaces the problem.

### 1.6 Onboarding Wizard
8-step wizard with live track recommendation at step 3 is the right UX pattern. Showing the recommendation *before* asking for all details reduces abandonment.

---

## Part 2: Critical Gaps (Would Cause Executor Failure)

### GAP-01 🔴 CRITICAL — Deadline Auto-Generation Doesn't Compute Real Dates

**What exists:** `api.generateDeadlines(estateId)` endpoint, `DeadlineTracker` component with "Auto-Generate" button, `deadlineWarningId` fields on tasks.

**What's missing:** The server route for `generateDeadlines` must compute actual calendar dates from the estate's key anchor dates (filing date, letters issued date, notice publication date). Without this:
- Executor clicks "Auto-Generate" → either nothing happens or generic placeholders
- `CREDITOR_NOTICE_DEADLINE`, `INVENTORY_DUE_DATE`, `TAX_FILING_DEADLINE` never resolve to actual dates
- **The most critical feature of an estate management tool — statutory deadline tracking — is effectively non-functional unless the executor manually enters all dates**

**Impact:** An executor missing the creditor claim period or inventory filing date faces personal liability. This is the single biggest failure risk on the platform.

**Fix Required:**
```
Server: generateDeadlines(estateId) must:
  1. Read estateData.filingDate (or letterIssuedDate, noticePublishedDate)
  2. Look up STATE_RULES[state].creditorPeriod, inventoryDue, etc.
  3. Compute actual Date objects for each deadlineWarningId
  4. Store in deadlines table with isStatutory: true
```

---

### GAP-02 🔴 CRITICAL — No "What To Do TODAY" Single Next Action

**What exists:** `SettlementRoadmap` shows all tasks in current phase. `QuickActions` shows 4 generic actions.

**What's missing:** A **single, prioritized "Your Next Step"** that an overwhelmed executor can immediately act on. The executor opens the dashboard and sees:
- Health scores ✓
- 6-15 tasks in current phase (which one first?)
- Upcoming deadlines (if manually entered)
- QuickActions (generic, not estate-specific)

**The real-world executor experience:** "I don't know where to start. There are 12 tasks listed. It's been 3 weeks since the death. I'm scared I've already missed something."

**Fix Required:** A `NextActionWidget` that surfaces:
```
🎯 YOUR NEXT ACTION
"File Petition for Probate (DE-111)" 
Due in 23 days | [Start This Task →]
```

Logic: highest-priority incomplete task where all dependencies are met, weighted by days-to-deadline.

---

### GAP-03 🔴 CRITICAL — Form Generation Doesn't Fill Forms

**What exists:** `Forms.tsx` page, `FormFillingAgent.tsx` component, references to "DE-111", "DE-221", "DE-140" in QuickActions.

**What's missing:** Actual filled PDFs. The current implementation appears to *reference* form names and possibly *link* to state court PDF downloads, but does not:
- Pre-fill form fields with estate data (decedent name, date of death, asset values, heir names)
- Generate a ready-to-file document
- Handle state-specific form variants (each state has different forms)

**Impact:** An executor who can't fill DE-111 (Petition for Probate) correctly will have it rejected by the court. Court clerks are not helpful. This is a 2-3 week delay and potentially $300-500 in re-filing fees.

**What's needed:**
- PDF form library keyed by (authorityType, stateCode)
- Field mapping: estateData fields → PDF form fields
- Generated PDF download with all known fields pre-filled
- Clear "YOU STILL NEED TO FILL IN: [field list]" after generation

---

### GAP-04 🔴 CRITICAL — Letters Testamentary / Letters of Administration Workflow Missing

**What exists:** `requiresAuthority` flag on tasks. Authority type displayed in banner.

**What's missing:** A dedicated workflow for the *single most important document* an executor needs: **Letters Testamentary** (with will) or **Letters of Administration** (without will). Every bank, brokerage, and institution requires certified copies.

Executor needs:
1. Guidance on how to get Letters from the probate court
2. How many copies to order (typically 8-12 certified copies)
3. Which institutions need original certified copies vs. just copies
4. Tracking of which copies have been sent where
5. What to do when a copy is stale (courts often require "recent" letters)

**No dedicated page, task, or workflow exists for this.** It's the executor's single most-used document.

---

### GAP-05 🟠 HIGH — State Coverage: 46 States Get Generic Treatment

**What exists:** Full state rules for TX, FL, NY, CA. All 50 states + DC have threshold data and UPC flag.

**What's missing:** State-specific:
- Court filing forms (each state has unique forms)
- Court filing fees (vary by county, not just state)
- Local court contact info / filing portals
- State-specific creditor notice requirements (publication: newspaper? registered mail? website?)
- State-specific inventory rules
- State-specific homestead protections

**Impact:** An executor in Ohio, Georgia, or Colorado following the platform's generic guidance may file the wrong form, in the wrong court, with the wrong notice method.

---

### GAP-06 🟠 HIGH — No Creditor Notice Workflow

**What exists:** `creditor_claims` phase with tasks.

**What's missing:** A structured workflow for the *most legally dangerous* phase:
- Which newspaper/publication qualifies for legal notice in that county?
- How to compose the notice (legally required language by state)
- Proof of publication filing
- How to evaluate and dispute invalid creditor claims
- Priority waterfall (taxes → secured → unsecured → family allowances)
- What to do with a disputed claim (contested probate escalation)

The `ClaimsPriorityEngine.tsx` component exists in liabilities — it's promising. But the step-by-step creditor notice workflow (publish → wait → evaluate → pay/reject → document) needs to be explicit.

---

## Part 3: Medium Gaps (Significantly Reduce Executor Confidence)

### GAP-07 🟡 MEDIUM — Trust Administration Tracks Are Thin

**Tracks affected:** TRUST_ADMIN_REVOCABLE, TRUST_ADMIN_IRREVOCABLE

**Missing:**
- Trustee acceptance process (signing trustee acceptance document)
- Pour-over will coordination (if decedent had both a will AND a trust)
- Trust accounting format requirements (most states have specific formats)
- Beneficiary notice requirements (Uniform Trust Code §813 — 60-day notice in UTC states)
- Trust modification/decanting guidance for irrevocable trusts
- Basis step-up rules specific to trust assets

The trust machine has 6 states defined, but the task *content* is significantly less detailed than the probate machine.

---

### GAP-08 🟡 MEDIUM — VOLUNTARY_ADMINISTRATION (NY) and SUMMARY_ADMINISTRATION (FL) Are Under-Developed

**NY Voluntary Administration:**
- $50,000 threshold, surrogate's court, Affidavit of Voluntary Administration (form SCPA 1310)
- No dedicated task list specific to this form and process
- No guidance on what "voluntary" means (no letters issued, limited creditor protection)

**FL Summary Administration:**
- $75,000 threshold, Order of Summary Administration instead of Letters
- Homestead property treatment (FL has unique homestead rules that override probate)
- 2-year creditor bar in summary vs. 2-year in formal — different computation
- No FL-specific form (Petition for Summary Administration) in the form library

---

### GAP-09 🟡 MEDIUM — No Personal Liability Risk Alerts for the Executor

**What's missing:** Clear, prominent alerts when an executor is about to do something that creates personal liability:
- Distributing assets before paying all creditors → executor liable for the difference
- Missing the creditor claim period → personal liability for late claims
- Selling assets below fair market value → potential breach of fiduciary duty
- Failing to file estate tax return within 9 months → penalties on the estate (and executor)
- Using estate funds for non-estate purposes → surcharge

The `isAttorneyReviewNode` flag exists but is not surfaced to the executor as "⚠️ STOP — Get an Attorney Before This Step."

---

### GAP-10 🟡 MEDIUM — Accounting / Final Account Workflow Incomplete

**What exists:** `Accounting.tsx` page, `ClosingStatement.tsx` page.

**What's missing:**
- A formal **Account of Administration** document generation (required by court in formal probate before closing)
- Receipts and releases from beneficiaries (form library gap)
- Final tax clearance letter / tax closing certificate workflow
- Distribution checks vs. wire transfer documentation
- Court approval of final accounting workflow (petition + hearing date tracking)

---

### GAP-11 🟡 MEDIUM — Real Estate / Property-Specific Workflow

**What exists:** Property assets tracked in the assets module.

**What's missing:**
- Property Maintenance Protocol — who pays mortgage, taxes, insurance during probate?
- Title company coordination workflow (executor needs to provide specific docs to title)
- Property sale court approval (required in formal probate in most states)
- Property appraisal coordination (required for estate tax and equitable distribution)
- Deed transfer workflow (specific to each type: probate deed, trustee's deed, affidavit of heirship)
- Rental property management during administration (income belongs to estate)

Real estate is the most complex asset class and gets no specialized workflow beyond being an entry in the asset list.

---

### GAP-12 🟡 MEDIUM — Beneficiary Communication Module Is Passive

**What exists:** `CommunicationLog.tsx`, `SmartEmailDraft.tsx`, `LetterPreviewDialog.tsx`.

**What's missing:**
- **Formal notice to beneficiaries** (required within specific timeframes in most states)
- Notice of appointment / notice of filing
- 48-hour distribution notice
- Beneficiary portal (read-only) so they can check status without calling the executor
- Contestation response workflow (what to do when a beneficiary disputes)
- Inheritance advance coordination (if beneficiaries need funds during administration)

The communication log is excellent for executor documentation but doesn't enforce the legally-required notice obligations.

---

### GAP-13 🟡 MEDIUM — Tax Management Is Underweight

**What exists:** `TaxAlerts.tsx` component, `TaxManagement.tsx` page.

**What's missing:**
- **Final individual income tax return** (Form 1040 for year of death) — not an estate tax return
- **Estate income tax return** (Form 1041 — if estate earns income during administration, required if gross income > $600)
- **Estate tax return** (Form 706 — if gross estate > $13.6M federal, lower in some states)
- State-specific inheritance tax (PA, NJ, IA, KY, MD, NE — these states tax beneficiaries, not the estate)
- Portability election (DSUE) for married couples — 2-year deadline
- Stepped-up basis documentation (required for capital gains calculation when heirs sell)
- Qualified Opportunity Zone, installment sale, or §6166 deferral elections

The platform appears to surface "tax alerts" but doesn't walk the executor through which returns are required, when, and in what order.

---

## Part 4: Minor Gaps (Polish & Usability)

### GAP-14 ⚪ MINOR — No Glossary / Plain-Language Layer

Legal terms used throughout: "Letters Testamentary," "Testatrix," "Per Stirpes," "Cy Pres," "Ancillary Administration," "UPC State." A first-time executor encounters these without definitions. Every legal term should have an inline tooltip or link to plain-language explanation.

### GAP-15 ⚪ MINOR — No "Done — What's Next?" Post-Task Confirmation

After completing a task, the executor should see: "✅ Filed Petition for Probate. Your next step is [specific task]. Expected court response in [X weeks]." Currently tasks are checked off with no forward momentum guidance.

### GAP-16 ⚪ MINOR — Mobile Experience Not Optimized for Real-World Use

Executors often interact with the platform from their phone while at a bank branch or courthouse. The dashboard sidebar layout, dense task tables, and wide cards are desktop-first. Bottom navigation (`BottomNavBar.tsx`) exists — it needs to ensure all critical executor actions are 1-2 taps away on mobile.

### GAP-17 ⚪ MINOR — ANCILLARY_PROBATE Has No State-Pair Logic

If the decedent owned property in Florida (home state) and Texas (ancillary), the platform should guide: "File primary probate in FL, then file ancillary in TX with certified copies of FL Letters." No workflow exists for this cross-state coordination.

### GAP-18 ⚪ MINOR — No Executor Expense Tracking

Executors are entitled to statutory fees (typically 2-4% of estate value) but must document their time and expenses. No time/expense log exists. This is both a compensation tool and a legal protection.

### GAP-19 ⚪ MINOR — Document Vault Missing Institution-Specific Checklists

When an executor calls a bank, they need a specific set of documents (death certificate, Letters Testamentary, EIN, affidavit). The document vault is generic. An "Institution Checklist" that says "For Bank of America: bring these 6 things" would save hours of phone tag.

---

## Part 5: Confidence Score by Track

| Track | Confidence | Key Bottleneck |
|---|---|---|
| FORMAL_PROBATE | 6.5/10 | Form generation, creditor notice workflow |
| INFORMAL_PROBATE | 7.0/10 | Best supported track, still needs real dates |
| INTESTATE | 6.0/10 | IntestacyDistributionPreview is good; lacks heir-locator guidance |
| SMALL_ESTATE | 7.5/10 | SmallEstateAffidavit page exists, but 46-state gaps hurt |
| SUMMARY_ADMINISTRATION (FL) | 5.0/10 | FL homestead rules missing, under-developed tasks |
| VOLUNTARY_ADMINISTRATION (NY) | 4.5/10 | Minimal NY-specific guidance, wrong forms could be generated |
| MUNIMENT_OF_TITLE (TX) | 6.5/10 | TX overrides exist, but no deed recording workflow |
| ANCILLARY_PROBATE | 4.0/10 | No cross-state coordination workflow at all |
| SPOUSAL_PETITION | 6.0/10 | SpousalPropertyPetition page exists; DSUE portability missing |
| TRUST_ADMIN_REVOCABLE | 6.0/10 | Trust machine exists; beneficiary notice workflow absent |
| TRUST_ADMIN_IRREVOCABLE | 5.5/10 | Decanting, trust accounting format — both missing |
| TOD_DEED / NON_PROBATE | 6.5/10 | NonProbate page + NonProbateHub exist; beneficiary form process thin |
| DISCOVERY | 7.5/10 | Discovery module is strong; best UX on the platform |

---

## Part 6: Priority Fix Roadmap

### Sprint 1 — Critical (Weeks 1-2)
1. **[GAP-01]** Implement `generateDeadlines` server route with real date computation from anchor dates + state rules
2. **[GAP-02]** Build `NextActionWidget` — single prioritized next step on dashboard
3. **[GAP-09]** Surface `isAttorneyReviewNode` as a blocking "GET LEGAL ADVICE" interstitial

### Sprint 2 — High Impact (Weeks 3-4)
4. **[GAP-04]** Build Letters Testamentary workflow: request → certified copies → institution dispatch tracker
5. **[GAP-06]** Build Creditor Notice workflow: publication guidance → proof of publication → claim evaluation
6. **[GAP-03]** Form pre-fill for at minimum: CA (DE-111), TX (Application for Probate), FL (Petition for Summary Administration), NY (Affidavit of Voluntary Administration)

### Sprint 3 — Coverage (Weeks 5-6)
7. **[GAP-07]** Expand trust administration task library (beneficiary notice, trust accounting, pour-over coordination)
8. **[GAP-08]** FL Summary Administration and NY Voluntary Administration dedicated task lists
9. **[GAP-10]** Account of Administration document + receipts and releases workflow

### Sprint 4 — Depth (Weeks 7-8)
10. **[GAP-13]** Tax return requirements wizard (1040 final, 1041, 706, state inheritance)
11. **[GAP-11]** Real estate workflow: maintenance protocol, property sale court approval, title transfer
12. **[GAP-12]** Beneficiary notice enforcement with required-notice deadline tracking

---

## Part 7: Overall Assessment

### What Would Make This a 9+/10 Platform?

The gap between the current 6.2/10 and a 9/10 is almost entirely **last-mile execution support** — the backend intelligence is there, but the executor-facing experience still requires the executor to:

1. Know what legal deadlines apply to them (not auto-computed)
2. Figure out which task to do next (not surfaced)
3. Find and fill the right court forms themselves (not generated)
4. Know when to stop and call an attorney (not clearly flagged)
5. Understand what "Letters Testamentary" means and how to get them (no workflow)

**The platform is currently excellent at telling the executor *what category they're in*. It needs to become excellent at telling them *what to do, right now, today, with their specific estate, in their specific state.***

The authority engine is a genuine competitive moat. With the last-mile UX fixed — particularly deadline auto-computation, next-action clarity, and form pre-fill — this platform could be the definitive executor tool in the market.

---

*Gap analysis based on review of: `src/lib/authorityEngine.ts`, `src/lib/stateRules.ts`, `src/config/settlementPhases.ts`, `src/config/settlementStages.ts`, `src/config/roadmapGenerator.ts`, `src/pages/Dashboard.tsx`, `src/pages/OnboardingWizard.tsx`, `src/pages/SettlementRoadmap.tsx`, `src/components/dashboard/DeadlineTracker.tsx`, `src/components/dashboard/SafetyNetWidget.tsx`, `src/components/dashboard/QuickActions.tsx`, `src/lib/api.ts`*
