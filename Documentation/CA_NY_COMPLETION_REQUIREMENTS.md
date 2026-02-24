# CA + NY Estate Settlement Completion Requirements

**Purpose**: Define what it takes to make ExpectedEstate production-ready to monetize for full estate-settlement execution in California and New York.  
**Date**: February 24, 2026  
**Source**: Internal repo audit of all codebase files vs requirements spec.

---

## Executive Summary

The product has **significant infrastructure already built** but is not yet production-ready as a full-service estate settlement platform for CA/NY. The visual roadmap is strong, backend services for claims/deadlines/accounting exist, and CA has 20+ PDF generators. However, automation workflows, form validation, NY form generation, and E2E testing remain incomplete.

### Overall Readiness Score

| Area | CA Status | NY Status |
|------|-----------|-----------|
| **Forms & Filing Automation** | 🟡 65% | 🔴 25% |
| **State-Specific Roadmap Branching** | 🟡 60% | 🟡 55% |
| **Legal Validation & Claims Priority** | 🟡 70% | 🟡 35% |
| **Deadlines & Court Calendar** | 🟡 65% | 🟡 40% |
| **Roadmap Automation (Phase 0-5)** | 🟡 55% | 🟡 40% |
| **QA & Compliance** | 🔴 30% | 🔴 15% |
| **OVERALL** | **🟡 58%** | **🔴 35%** |

---

## California (CA) — Completion Requirements

### 1) Forms & Filing Automation (CA) — 🟡 65%

**What EXISTS in codebase:**
- `DocumentService.ts`: 20+ CA form generators built with `pdf-lib`:
  - `generateDE111()` — Petition for Probate (template-based auto-fill)
  - `generateDE221()` — Spousal Property Petition (template-based auto-fill)
  - `generateDE160()` — Inventory & Appraisal
  - `generateDE121()` — Notice of Petition
  - `generateDE120()` — Notice of Hearing
  - `generateDE150()` — Letters
  - `generateDE165()` — Notice of Proposed Action
  - `generateDE174()` — Creditor Claim Allowance/Rejection
  - `generateDE226()` — Spousal Petition Order
  - `generateDE260()` — Sale of Real Property
  - `generateDE265()` — Sale of Securities
  - `generateDE295()` — Final Discharge
  - `generateDE305()` — (referenced in seeding, no dedicated generator)
  - `generateDE310()` — Petition for Final Distribution
  - `generateDE315()` — Order for Final Distribution
  - `generateDE350()`, `generateDE351()` — Closing forms
  - `generateDE142()`, `generateDE143()` — Additional probate forms
  - `generateDE154()`, `generateDE115()`, `generateDE116()` — Supplemental forms
  - `generateOverlayPdf()` — Generic template overlay for any seeded form
- `formSeedingService.ts`: All DE-* forms seeded with PDF templates in DB
- `formRoutes.ts`: `/api/forms/generate` endpoint returns filled PDFs; `/api/forms/templates/:name/download` serves blank PDFs
- `ProbatePetition.tsx`: Full DE-111 page with preview, download, upload filed copy
- `PetitionWizard.tsx`: Multi-step wizard for DE-111 data collection
- `InventoryAppraisal.tsx` / `InventoryGenerator.tsx`: DE-160 generation UI
- `SpousalPropertyPetition.tsx`: DE-221 page
- `AssetSaleAuthorization.tsx`: DE-165 generation
- `FinalDistribution.tsx`: DE-295 "Auto-Fill Discharge" button
- `Distribution.tsx`: DE-310 preview
- `src/lib/autofill.ts`: `generateMagicPipeUrl()` for institutional auto-fill

**What's MISSING to complete:**

| Gap | Priority | Effort |
|-----|----------|--------|
| DE-305 Small Estate Affidavit dedicated generator | HIGH | 1 day |
| Form field validation before PDF generation (required fields check) | HIGH | 2-3 days |
| PDF preview-before-download for all forms (only DE-111 has it) | MEDIUM | 3-4 days |
| Version tracking / archiving (no form version history) | MEDIUM | 2-3 days |
| Phase gating tie-in: block DE-160 until Letters received | HIGH | 1 day |
| Upload workflow: scan → OCR → verify for all filed forms | LOW | 5+ days |

### 2) State-Specific Roadmap Branching (CA) — 🟡 60%

**What EXISTS:**
- `spousal_petition.ts`: Complete workflow config (Phase 1-6 for DE-221 path)
- `roadmapGenerator.ts`: CA contamination guards, Muniment of Title reduction
- `settlementPhases.ts`: 3 CA-only tasks (prepare_notice_proposed_action, wait_proposed_action_period, petition_confirm_sale)
- `authorityEngine.ts`: CA spousal petition path, small estate path, formal/informal probate
- `AssetSaleAuthorization.tsx`: DE-260 real property, DE-270 securities pages

**What's MISSING:**

| Gap | Priority | Effort |
|-----|----------|--------|
| Small Estate Affidavit (DE-305) as dedicated roadmap branch | HIGH | 2 days |
| Asset Sale path should inject DE-260/DE-270 tasks into roadmap automatically | MEDIUM | 1-2 days |
| Spousal petition path should auto-skip creditor claims phase | MEDIUM | 1 day |

### 3) Legal Validation & Claims Priority (CA) — 🟡 70%

**What EXISTS:**
- `liabilityRoutes.ts`: Full CRUD for liabilities with Zod validation, status tracking (DISCOVERED/PAID/REJECTED)
- `priorityService.ts`: `checkPaymentEligibility()` — enforces notice period restrictions, state-specific priority rules
- `riskService.ts`: `validatePayment()` — solvency checks, blocks ALL payments except ADMINISTRATION_EXPENSES when CRITICALLY insolvent
- `Notices.tsx`: Full creditor notice workflow — CA 120-day period, 7-rank priority chart, publication tracking
- `generateDE174()`: Creditor claim rejection letter generator
- `generateCreditorClaimPriorityWorksheet()`: PDF worksheet for claim priority

**What's MISSING:**

| Gap | Priority | Effort |
|-----|----------|--------|
| Creditor claims ledger UI (submit → review → approve/reject in one view) | HIGH | 3-4 days |
| Distribution blocking tied to claims resolution (UI enforcement) | HIGH | 2 days |
| CA-specific priority rules hardcoded vs. configurable | LOW | 1-2 days |
| Claim rejection workflow end-to-end test | MEDIUM | 1 day |

### 4) Deadlines & Court Calendar (CA) — 🟡 65%

**What EXISTS:**
- `deadlineService.ts`: 50-state rules table, generates deadlines from anchor dates (filingDate, letterIssuedDate, noticePublishedDate, dateOfDeath), path-specific generation
- `DeadlineTracker.tsx`: UI widget showing deadlines with auto-generate, overdue alerts, completion tracking
- `NextActionWidget.tsx`: Cross-references roadmap tasks with live deadlines for urgency coloring
- `WorkflowContext.tsx`: Phase lock system (`phaseLocks`) based on authority type
- `CaliforniaProbateDeadlines.tsx`: SEO guide page with all CA statutory deadlines

**What's MISSING:**

| Gap | Priority | Effort |
|-----|----------|--------|
| Court hearing calendar integration (no actual date picker for court dates) | MEDIUM | 3-4 days |
| Phase advance/lock based on deadline expiry (auto-advance when claims window closes) | HIGH | 2-3 days |
| Push notification / email alerts for approaching deadlines | MEDIUM | 2-3 days |
| Publication deadline tracking (newspaper notice confirmation) | LOW | 1-2 days |

### 5) Roadmap Automation Gaps (CA) — 🟡 55%

**Phase-by-phase status (from ROADMAP_COMPLETION_SUMMARY cross-ref):**

| Phase | Module | Status | Evidence |
|-------|--------|--------|----------|
| **Phase 0** | Practical Kit Checklist | ❌ Missing | No kit module found |
| **Phase 0** | Early Notifier System | ❌ Missing | No notification templates for SSA/employers |
| **Phase 1** | DE-111 Generator | ✅ Built | `generateDE111()`, `PetitionWizard.tsx` |
| **Phase 1** | Court Calendar Module | ⚠️ Partial | `deadlineService.ts` generates dates, no calendar UI |
| **Phase 1** | Authority Hub Gate | ✅ Built | `authorityGate.ts`, `AssetAuthorityBlocker.tsx`, `WorkflowContext.phaseLocks` |
| **Phase 2** | Asset Freeze Tracking | ⚠️ Partial | Assets have status fields, no dedicated freeze UI |
| **Phase 2** | DE-160 Generator | ✅ Built | `generateDE160()`, `InventoryGenerator.tsx` |
| **Phase 3** | Liabilities Ledger | ✅ Built | `liabilityRoutes.ts`, `Notices.tsx` with full CRUD |
| **Phase 3** | Claims Priority Engine | ✅ Built | `priorityService.ts`, `riskService.ts` |
| **Phase 3** | Rejection Letters | ✅ Built | `generateDE174()` |
| **Phase 4** | Liquidation Tracking | ⚠️ Partial | `AssetSaleAuthorization.tsx` exists, no sale tracker |
| **Phase 4** | Tax Checklist | ⚠️ Partial | `TaxManagement.tsx` page exists |
| **Phase 4** | Accounting Hub | ✅ Built | `AccountingService.getReadiness()` |
| **Phase 5** | Distribution Petition | ✅ Built | `generateDE310()`, `Distribution.tsx` |
| **Phase 5** | Receipt Tracker | ✅ Built | `generateReceiptOfDistribution()` |
| **Phase 5** | Closing Statement | ✅ Built | `ClosingStatement.tsx`, `generateDE295()` |

### 6) QA & Compliance (CA) — 🔴 30%

**What EXISTS:**
- `workflow_clarity.test.tsx`: Tests DE-111 download links
- `tier2_settlement_types.test.tsx`: Tests spousal petition path
- `auto_detection.test.tsx`: Tests DE-221 detection
- `trust_roadmap.test.ts`: Tests trust path exclusions
- `golden-dataset/06-probate-process.test.ts`: Golden dataset probate tests

**What's MISSING:**

| Gap | Priority | Effort |
|-----|----------|--------|
| E2E test: testate CA probate (full lifecycle) | CRITICAL | 3-5 days |
| E2E test: intestate CA probate | HIGH | 2-3 days |
| E2E test: small estate CA path | HIGH | 1-2 days |
| E2E test: spousal property petition | HIGH | 1-2 days |
| E2E test: insolvent estate | MEDIUM | 2-3 days |
| E2E test: contested estate | MEDIUM | 2-3 days |
| E2E test: ancillary probate | LOW | 2-3 days |
| Attorney review of CA form auto-fill logic | CRITICAL | External |
| Attorney review of claims priority engine | CRITICAL | External |

## New York (NY) — Completion Requirements

### 1) Forms Implementation (NY) — 🔴 25%

**What EXISTS in codebase:**
- `formSeedingService.ts`: ALL 15 NY forms seeded with PDF filenames:
  - ET-1 (Petition for Probate), ET-2 (Petition for Administration), ET-3 (Ancillary Probate)
  - ET-4 (Citation), ET-5 (Waiver & Consent), ET-6 (Letters Testamentary)
  - ET-7 (Letters of Administration), ET-8 (Inventory), ET-9 (Account)
  - ET-10 (Petition for Judicial Settlement), ET-11 (Decree), ET-12 (Receipt & Release)
  - ET-13 (Petition for Final Distribution), ET-14 (Affidavit of Heirship), ET-15 (Voluntary Administration)
- `DocumentService.ts`: Only `generateNYVoluntaryAdministration()` exists (1 of 15)
- `estateRoutes.ts`: NY petition route dispatches to `generateNYVoluntaryAdministration()`
- `Forms.tsx`: ET-1, ET-2, ET-10 mapped to roadmap phases; form-to-roadmap mapping partial
- Blank PDF download works via `/api/forms/templates/:name/download` for any seeded form

**What's MISSING to complete:**

| Gap | Priority | Effort |
|-----|----------|--------|
| `generateET1()` — NY Petition for Probate auto-fill | CRITICAL | 2-3 days |
| `generateET2()` — NY Petition for Administration auto-fill | CRITICAL | 2-3 days |
| `generateET3()` — NY Ancillary Probate auto-fill | HIGH | 1-2 days |
| `generateET8()` — NY Inventory auto-fill | HIGH | 2 days |
| `generateET9()` — NY Account auto-fill | HIGH | 2 days |
| `generateET10()` — NY Judicial Settlement auto-fill | MEDIUM | 2 days |
| `generateET12()` — NY Receipt & Release auto-fill | MEDIUM | 1 day |
| `generateET13()` — NY Final Distribution auto-fill | MEDIUM | 1-2 days |
| `generateET15()` — Voluntary Administration (exists but needs validation) | MEDIUM | 1 day |
| NY form field mapping (data fields → ET-form fields) | CRITICAL | 3-5 days |
| NY form preview UI pages (like `ProbatePetition.tsx` for CA) | HIGH | 5-7 days |
| NY form-to-roadmap mapping completion in `Forms.tsx` | MEDIUM | 1 day |

### 2) State-Specific Roadmap Branching (NY) — 🟡 55%

**What EXISTS:**
- `settlementPhases.ts`: Extensive NY-specific content:
  - `file_ny_surrogate_probate`: File with Surrogate's Court (SCPA references)
  - `file_ny_ancillary_probate`: ET-3 ancillary filing with Surrogate's Court
  - NY court_filing subtasks: Validate venue (SCPA §205), fee schedule (SCPA §2402), assemble packet (P-1/A-1)
  - NY-specific tasks for: File P-1 petition, File A-1 petition, Obtain Letters Testamentary, Obtain Letters of Administration
  - NY creditor notice tasks (optional risk mitigation, proof retention)
  - NY property sale task (references no IAEA)
  - NY final settlement (Petition for Final Settlement & Decree)
- `settlementStages.ts`: NY Surrogate's Court stages with detailed task breakdowns (oath, citation, service)
- `roadmapMetadata.ts`: NY overrides for `court_filing` ("Surrogate's Court Filing") and `creditor_claims` ("7-Month Exposure Management")
- `roadmapGenerator.ts`: Ancillary phase injection for out-of-state modifiers
- `stateRules.ts`: NY threshold=$50k, "Voluntary Administration", SCPA citations

**What's MISSING:**

| Gap | Priority | Effort |
|-----|----------|--------|
| NY authority engine logic (currently falls to generic `isUPC=false` → FORMAL_PROBATE) | HIGH | 1-2 days |
| NY Voluntary Administration (small estate) roadmap branch with ET-15 tasks | HIGH | 2 days |
| NY-specific creditor claims window integration (7 months from Letters) | MEDIUM | 1-2 days |
| NY accounting workflow (ET-9/ET-10/ET-11 tied to roadmap) | MEDIUM | 2-3 days |

### 3) Legal Validation & Claims (NY) — 🟡 35%

**What EXISTS:**
- Generic creditor claims system works for NY (liabilityRoutes, priorityService, riskService)
- `Notices.tsx`: NY 210-day creditor notice period configured
- ET-9 (Account), ET-10 (Judicial Settlement), ET-11 (Decree) seeded in formSeedingService
- `generateCreditorClaimPriorityWorksheet()`: Works generically for any state

**What's MISSING:**

| Gap | Priority | Effort |
|-----|----------|--------|
| NY creditor claims workflow (notice → response → accounting cycle) | HIGH | 3-4 days |
| NY accounting forms (ET-9/ET-10/ET-11) auto-fill generators | HIGH | 4-5 days |
| NY-specific priority rules (differ from CA in ranking) | MEDIUM | 1-2 days |
| NY Judicial Settlement petition automation | MEDIUM | 2-3 days |

### 4) Deadlines & Court Calendar (NY) — 🟡 40%

**What EXISTS:**
- `deadlineService.ts`: NY in 50-state rules table with creditorClaimDays, inventoryDays
- `DeadlineTracker.tsx`: Works for any state including NY
- `NextActionWidget.tsx`: Cross-references with NY deadlines
- No NY-specific deadline guide page (CA, TX, FL have dedicated guide pages)

**What's MISSING:**

| Gap | Priority | Effort |
|-----|----------|--------|
| `NewYorkProbateDeadlines.tsx` — SEO guide page (like CA/TX/FL have) | MEDIUM | 2-3 days |
| NY-specific statutory deadline rules in deadlineService | MEDIUM | 1-2 days |
| Surrogate's Court citation timeline tracking | LOW | 1-2 days |
| NY phase gates based on citation service deadlines | LOW | 1-2 days |

### 5) Roadmap Automation Gaps (NY) — 🟡 40%

Same global Phase 0-5 automation gaps as CA, PLUS:

| Phase | Module | NY-Specific Status |
|-------|--------|--------------------|
| **Phase 1** | ET-1/ET-2 Generator | ❌ Only `generateNYVoluntaryAdministration()` built |
| **Phase 1** | Surrogate's Court Filing | ⚠️ Task descriptions exist, no automation |
| **Phase 2** | ET-8 Inventory Generator | ❌ Missing |
| **Phase 3** | NY Claims Workflow | ⚠️ Generic system works, no NY-specific accounting |
| **Phase 5** | ET-13 Distribution | ❌ Missing |
| **Phase 5** | ET-10 Judicial Settlement | ❌ Missing |

### 6) QA & Compliance (NY) — 🔴 15%

**What EXISTS:**
- `settlement_types.test.tsx`: References NY domicile with ancillary probate
- `tier4_settlement_types.test.tsx`: Tests ancillary probate stages
- `21-paths-api.test.ts`: PTH-04 ancillary probate test case

**What's MISSING:**

| Gap | Priority | Effort |
|-----|----------|--------|
| E2E test: NY testate probate (Surrogate's Court lifecycle) | CRITICAL | 3-5 days |
| E2E test: NY intestate administration | HIGH | 2-3 days |
| E2E test: NY Voluntary Administration (small estate) | HIGH | 1-2 days |
| E2E test: NY ancillary probate | MEDIUM | 2-3 days |
| Attorney review of NY form accuracy | CRITICAL | External |
| Attorney review of NY claims logic | CRITICAL | External |

## Cross-State Requirements (CA + NY)

### A) Claims & Insolvency Controls — 🟡 65%

**What EXISTS:**
- `priorityService.ts`: `checkPaymentEligibility()` enforces notice period restrictions, state-specific priority engine
- `riskService.ts`: `validatePayment()` blocks ALL payments except ADMINISTRATION_EXPENSES when CRITICALLY insolvent
- `liabilityRoutes.ts`: PUT handler checks `RiskService.validatePayment()` before allowing PAID status (unless `forcePay` flag)
- `Notices.tsx`: State-specific creditor periods (CA=120d, TX=180d, FL=90d, NY=210d), 7-rank priority display
- `DistributionService.checkReadiness()`: Validates readiness before distribution

**What's MISSING:**

| Gap | Priority | Effort |
|-----|----------|--------|
| Unified claims dashboard (one view across all creditors) | HIGH | 3-4 days |
| Insolvency handling UI (visual indicator + automatic blocking) | HIGH | 2-3 days |
| Distribution blocking enforced in UI (not just API-level) | MEDIUM | 1-2 days |

### B) Deadline & Dependency Enforcement — 🟡 60%

**What EXISTS:**
- `deadlineService.ts`: 50-state rules, anchor dates, path-specific deadlines, overdue detection
- `DeadlineTracker.tsx`: Auto-generate, mark complete, overdue alerts
- `NextActionWidget.tsx`: Cross-references tasks with deadlines, urgency coloring
- `WorkflowContext.tsx`: `phaseLocks` based on authority type
- `settlementPhases.ts`: Task dependencies array per task

**What's MISSING:**

| Gap | Priority | Effort |
|-----|----------|--------|
| Email/push notifications for approaching deadlines | HIGH | 2-3 days |
| Dependency enforcement in UI (block dependent tasks) | MEDIUM | 2-3 days |
| Auto-advance phases when prerequisite deadlines pass | MEDIUM | 2-3 days |

### C) Accounting & Distribution Outputs — 🟡 55%

**What EXISTS:**
- `AccountingService.getReadiness()`: Checks accounting readiness
- `DistributionService.checkReadiness()` + `logEvent()`: Distribution validation + event logging
- `generateActivityLogPdf()`: Full PDF activity log with pending tasks, negative findings, chain verification
- `generateReceiptOfDistribution()`: Beneficiary distribution receipts
- `generateCreditorClaimPriorityWorksheet()`: PDF priority worksheet
- `ClosingStatement.tsx`: CA DE-295 compatible closing page
- `auditService.ts`: `logActivity()` + `verifyChain()` for audit trail integrity

**What's MISSING:**

| Gap | Priority | Effort |
|-----|----------|--------|
| Full accounting report generator (income/expense/distribution summary) | HIGH | 3-5 days |
| Closing statement generator for NY (not just CA DE-295) | HIGH | 2-3 days |
| Beneficiary distribution tracking (who received what, when, signed) | MEDIUM | 2-3 days |
| Export-to-court-format for accounting (CA DE-* / NY ET-9) | MEDIUM | 2-3 days |

### D) Legal Review & Risk Controls — 🟡 45%

**What EXISTS:**
- `AttorneyReviewWidget.tsx`: Widget for attorney review interface
- `advisorMarketplaceService.ts`: Full advisor marketplace with booking, reviews, verification
- `riskService.ts`: `assessEstateRisk()` returns risk report
- Legal disclaimers scattered across pages
- `auditService.ts`: Activity logging with chain verification
- Document vault with encrypted storage

**What's MISSING:**

| Gap | Priority | Effort |
|-----|----------|--------|
| State-specific legal disclaimer system (CA vs. NY differences) | MEDIUM | 1-2 days |
| Document retention policy / audit export package | MEDIUM | 2-3 days |
| Formal attorney sign-off workflow (review → approve → timestamp) | LOW | 3-5 days |
| Risk controls dashboard (aggregated estate risk view) | LOW | 2-3 days |

---

## Final Readiness Conclusion

### CA: Closest to Completion (~58%)

**Strengths**: 20+ form generators built, authority engine with CA-specific paths, claims priority engine, deadline tracking, phase locks, comprehensive roadmap tasks.

**Critical gaps before monetization**:
1. Form field validation before PDF generation
2. E2E test coverage for all CA probate paths
3. Phase advance/lock tied to deadline expiry
4. Attorney review of auto-fill logic and claims engine
5. Creditor claims ledger UI consolidation

**Estimated effort to reach production**: 6-8 weeks of focused development + external attorney review.

### NY: Requires Major Investment (~35%)

**Strengths**: All 15 ET forms seeded, roadmap tasks with Surrogate's Court references, creditor period configured, deadline service covers NY.

**Critical gaps before monetization**:
1. 8+ NY form auto-fill generators need to be built (only 1 of 15 exists)
2. NY form preview UI pages (equivalent to CA's dedicated pages)
3. NY authority engine logic (currently generic)
4. NY accounting forms workflow (ET-9/ET-10/ET-11)
5. NY probate deadlines SEO guide page
6. E2E test coverage for all NY paths
7. Attorney review of NY forms and claims logic

**Estimated effort to reach production**: 12-16 weeks of focused development + external attorney review.

### Priority Implementation Order

| Sprint | Focus | Impact |
|--------|-------|--------|
| **Sprint 1 (Weeks 1-2)** | CA form validation + CA E2E tests | CA launch-ready validation |
| **Sprint 2 (Weeks 3-4)** | NY ET-1/ET-2/ET-8 generators + NY authority engine | NY core forms |
| **Sprint 3 (Weeks 5-6)** | Cross-state claims dashboard + deadline notifications | Both states benefit |
| **Sprint 4 (Weeks 7-8)** | NY remaining form generators (ET-3/9/10/12/13) | NY forms complete |
| **Sprint 5 (Weeks 9-10)** | Accounting reports + distribution tracking | Court compliance |
| **Sprint 6 (Weeks 11-12)** | NY E2E tests + NY deadlines page + attorney review prep | NY launch-ready |

### Not Production-Ready Until:
- ✅ All CRITICAL-priority gaps resolved
- ✅ E2E tests pass for all primary CA/NY probate paths
- ✅ Attorney has reviewed form auto-fill accuracy for both states
- ✅ Attorney has reviewed claims priority logic for both states
- ✅ Form field validation prevents incomplete/invalid PDFs
- ✅ Deadline alerts reach users before statutory windows close

---

**Created**: February 24, 2026  
**Methodology**: Full codebase audit of `server/services/`, `src/pages/`, `src/config/`, `src/lib/`, `src/components/` against CA/NY completion requirements spec  
**Files audited**: 50+ source files across frontend and backend
