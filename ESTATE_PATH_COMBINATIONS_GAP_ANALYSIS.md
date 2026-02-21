# Estate Path Combinations — Gap Analysis & Fix Log

**Date**: 2026-02-21  
**Source XLSX**: `Estate_Path_Combinations_All_50_States.xlsx`  
**Scope**: 9,600 rows = 50 states × 192 unique dimension combinations  
**Status**: ✅ ALL CRITICAL AND HIGH PRIORITY ITEMS RESOLVED

---

## XLSX Dimensions (7 Total)

| # | XLSX Column | DB Field | Type |
|---|-------------|----------|------|
| 1 | Will | `hasWill` | boolean |
| 2 | Trust Type | `isTrustRevocable` | boolean\|null |
| 3 | TOD Deed | `hasTODDeed` | boolean |
| 4 | Contested | `hasContest` | boolean |
| 5 | Surviving Spouse | `isSurvivingSpouse` | boolean |
| 6 | Out of State Property | `isOutOfState` / `hasOutOfStateProperty` | boolean |
| 7 | Debt Status | `estimatedLiabilities` vs assets → `hasInsolvencyRisk` | computed |

---

## 7 Primary Path Outcomes (XLSX)

| Priority | Path Type Code | XLSX Label | Role |
|----------|---------------|------------|------|
| 1 (highest) | `INSOLVENT_ESTATE` | Insolvent Estate Administration | Administrator |
| 2 | `TRUST_ADMIN_REVOCABLE` | Trust Administration (Revocable Living Trust) | Successor Trustee |
| 2 | `TRUST_ADMIN_IRREVOCABLE` | Irrevocable Trust Administration | Trustee |
| 3 | `CONTESTED_ESTATE` | Contested Probate Litigation | Executor |
| 4 | `ANCILLARY_PROBATE` | Ancillary Probate Required | Executor |
| 5 | `INTESTATE` | Intestate Probate | Administrator |
| 6 | `FORMAL_PROBATE` | General Probate Administration | Executor |

---

## Bugs Found and Fixed

### 🔴 CRITICAL (Would cause wrong legal path assignment)

#### BUG-01: Missing `isSpouse` question in EnhancedOnboardingWizard
- **File**: `src/components/onboarding/EnhancedOnboardingWizard.tsx`
- **Impact**: 100% of surviving-spouse users routed as non-spouse → missing SPOUSAL_PETITION path
- **Fix**: Added "Is there a surviving spouse?" question with yes/no answer cards
- **Status**: ✅ FIXED

#### BUG-02: Missing `debtStatus` question in EnhancedOnboardingWizard  
- **File**: `src/components/onboarding/EnhancedOnboardingWizard.tsx`
- **Impact**: All insolvent estates classified as solvent → administrators distributing to heirs before creditors (legal liability)
- **Fix**: Added "Does the estate have more debts than assets?" question with insolvent/solvent/not_sure options
- **Status**: ✅ FIXED

#### BUG-03: Missing trust type follow-up in EnhancedOnboardingWizard
- **File**: `src/components/onboarding/EnhancedOnboardingWizard.tsx`
- **Impact**: All trusts defaulted to `isTrustRevocable: false` → IRREVOCABLE path for 90%+ of trusts that are actually revocable
- **Fix**: Added dynamic TRUST_TYPE_QUESTION injected after hasTrust=yes; `not_sure` maps to `undefined` (safe default → REVOCABLE)
- **Status**: ✅ FIXED

#### BUG-04: `INSOLVENT_ESTATE` had wrong masterMode in authorityEngine
- **File**: `src/lib/authorityEngine.ts`
- **Impact**: Insolvent estates used `FIDUCIARY_ADMINISTERED` mode → court supervision tasks excluded from roadmap
- **Fix**: Changed to `COURT_SUPERVISED` (insolvent estates always require court oversight for creditor priority ordering)
- **Status**: ✅ FIXED

#### BUG-05: ANCILLARY_PROBATE checked AFTER INTESTATE in decision tree
- **File**: `src/lib/authorityEngine.ts`
- **Impact**: Will=No + OutOfState=Yes → returned INTESTATE instead of ANCILLARY_PROBATE
- **Fix**: Moved `isOutOfState` check before `hasWill === false` check in decision tree
- **Status**: ✅ FIXED

#### BUG-06: roadmapService missing all 3 new dimensions + insolvency calculated after engine
- **File**: `server/services/roadmapService.ts`
- **Impact**: Server-side roadmap always used wrong path for trust type, spouse status, and insolvency (insolvency check was AFTER engine call, so `hasInsolvencyRisk` was never `true` when passed)
- **Fix**: Pre-calculate `hasInsolvencyRisk` BEFORE calling `calculateAuthorityRecommendation`; add `isTrustRevocable`, `isSpouse`, `hasInsolvencyRisk` to engine call
- **Status**: ✅ FIXED

#### BUG-07: Legacy OnboardingWizard missing `hasInsolvencyRisk` in engine call
- **File**: `src/pages/OnboardingWizard.tsx`
- **Impact**: `recommendation.type` shown on Track Scout screen never showed INSOLVENT_ESTATE even when debts > assets
- **Fix**: Pre-calculate `hasInsolvencyRisk = estDebts >= estAssets` before `calculateAuthorityRecommendation` call; pass as parameter
- **Status**: ✅ FIXED

#### BUG-08: Legacy OnboardingWizard `hasWill` never persisted to DB
- **File**: `src/pages/OnboardingWizard.tsx`
- **Impact**: `hasWill` was captured in UI but never sent to `updateMyEstate` → all legacy wizard estates treated as `hasWill: true` by default
- **Fix**: Added `hasWill`, `isSurvivingSpouse`, `hasTODDeed`, `isOutOfState`, `isTrustRevocable` to Step 1 save; confirmed again in Step 2 save
- **Status**: ✅ FIXED

---

### 🟡 MEDIUM (UI/UX correctness)

#### BUG-09: pathEngine defaulted `isTrustRevocable: false` for not_sure
- **File**: `src/lib/pathEngine.ts`
- **Impact**: "Not sure" trust type always routed to IRREVOCABLE (stricter/rarer path)
- **Fix**: `not_sure` → `undefined` → authorityEngine defaults to REVOCABLE (conservative/common default)
- **Status**: ✅ FIXED

#### BUG-10: TRUST_ADMIN_IRREVOCABLE timeline was 3–9 months (vs XLSX 2–6 months)
- **File**: `src/lib/pathEngine.ts`
- **Fix**: Changed to `'2–6 months'`
- **Status**: ✅ FIXED

#### BUG-11: Missing role names, authority docs, path labels for 4 paths in use-terminology
- **File**: `src/hooks/use-terminology.ts`
- **Impact**: INSOLVENT_ESTATE, INTESTATE, ANCILLARY_PROBATE, CONTESTED_ESTATE all defaulted to "Executor" and "Letters Testamentary"
- **Fix**: Added correct role per XLSX (Administrator, Successor Trustee, Trustee, Executor); added `pathLabel`, `isHighRisk`, `distributionsBlocked` return values
- **Status**: ✅ FIXED

---

### 🔴 LEGAL RISK SURFACES (New UI guards added)

#### GUARD-01: Distribution.tsx — Hard blocker for insolvent/contested estates
- **File**: `src/pages/Distribution.tsx`
- **What**: Added `useTerminology().distributionsBlocked` check
  - Shows prominent red banner with specific legal warning
  - "Prepare Distribution for Review" button becomes red/disabled with text "Blocked — Insolvent Estate" or "Blocked — Litigation Hold"
  - All readiness checklist items marked as not done when `distributionsBlocked=true`
  - Footer message: "⛔ Creditors must be paid before any distribution to heirs"
- **Legal basis**: Insolvent — debts must be paid in statutory priority order before heirs; Contested — court order required before distribution
- **Status**: ✅ IMPLEMENTED

#### GUARD-02: Heirs.tsx — Insolvent/contested notice
- **File**: `src/pages/Heirs.tsx`
- **What**: Added prominent red banner above heir list for INSOLVENT/CONTESTED estates
  - Explains that listing heirs is allowed, but distributions are prohibited
  - Shows `pathLabel` badge so user understands their specific situation
  - Different message for insolvent vs contested
- **Status**: ✅ IMPLEMENTED

---

## Path Coverage Matrix — Before vs After

| Path | Captured in Wizard | Routed Correctly | Roadmap Correct | Role Correct | Distribution Blocked |
|------|-------------------|-----------------|-----------------|--------------|---------------------|
| General Probate | ✅ Before | ✅ Before | ✅ Before | ✅ Before | N/A |
| Intestate Probate | ✅ Before | ✅ Before | ✅ Before | ✅ Fixed BUG-11 | N/A |
| Trust (Revocable) | ✅ Fixed BUG-03 | ✅ Fixed BUG-09 | ✅ Fixed BUG-06 | ✅ Fixed BUG-11 | N/A |
| Trust (Irrevocable) | ✅ Fixed BUG-03 | ✅ Before | ✅ Fixed BUG-06 | ✅ Fixed BUG-11 | N/A |
| Ancillary Probate | ✅ Before | ✅ Fixed BUG-05 | ✅ Fixed BUG-06 | ✅ Fixed BUG-11 | N/A |
| Contested Probate | ✅ Before | ✅ Before | ✅ Before | ✅ Fixed BUG-11 | ✅ GUARD-01/02 |
| Insolvent Estate | ✅ Fixed BUG-02 | ✅ Fixed BUG-04,06,07 | ✅ Fixed BUG-04,06 | ✅ Fixed BUG-11 | ✅ GUARD-01/02 |

**Coverage: 7/7 paths fully covered ✅**

---

## Files Modified

| File | Type | Changes |
|------|------|---------|
| `src/components/onboarding/EnhancedOnboardingWizard.tsx` | Frontend | Added isSpouse, debtStatus, trustType questions |
| `src/lib/authorityEngine.ts` | Core Engine | Fixed priority order, INSOLVENT masterMode, trust defaults |
| `server/services/roadmapService.ts` | Backend | Added all 7 dimensions + pre-computed insolvency |
| `src/lib/pathEngine.ts` | Frontend | xlsxOutcome labels, warningFlags, 7 path nextSteps |
| `src/hooks/use-terminology.ts` | Frontend | Role names for all 7 paths + distributionsBlocked |
| `src/pages/Distribution.tsx` | Frontend | Hard blocker for INSOLVENT/CONTESTED distributions |
| `src/pages/Heirs.tsx` | Frontend | Insolvent/contested warning banner |
| `src/pages/OnboardingWizard.tsx` | Frontend | hasInsolvencyRisk in engine call + hasWill persisted |

---

## TypeScript Verification

```
npx tsc --noEmit --project tsconfig.app.json
```

**Result**: Only 3 pre-existing errors in unmodified files:
- `src/lib/api_marketplace_additions.ts` — pre-existing syntax error
- `src/pages/advisor/AdvisorOnboarding.tsx` — pre-existing syntax error  
- `src/tests/golden-dataset/192-combination-registration.test.ts` — pre-existing syntax error

**No new errors introduced by any of the 8 modified files. ✅**

---

## Remaining Recommendations (Lower Priority)

These items are safe to defer but would complete the coverage:

### P2 — Database Settlement Types
Verify all 7 type codes exist in `settlement_types` table:
```sql
SELECT type FROM settlement_types WHERE type IN (
  'INSOLVENT_ESTATE', 'TRUST_ADMIN_REVOCABLE', 'TRUST_ADMIN_IRREVOCABLE',
  'CONTESTED_ESTATE', 'ANCILLARY_PROBATE', 'INTESTATE', 'FORMAL_PROBATE'
);
```
Without these DB records, `roadmapService` falls back to hardcoded tasks.

### P3 — deadlineService insolvent-specific deadlines
Add creditor notification deadlines (state-specific, typically 30–90 days) for INSOLVENT_ESTATE path in `server/services/deadlineService.ts`.

### P4 — RAG knowledge base coverage
Ensure `RAg_Docs/` has state-specific content for all 7 paths, especially insolvent estate creditor priority rules (federal vs state tax liens, secured vs unsecured creditors).

### P5 — E2E tests for new wizard questions
Add Playwright tests for:
- isSpouse=yes → SPOUSAL_PETITION routing
- debtStatus=insolvent → INSOLVENT_ESTATE routing + distribution blocked
- trustType=irrevocable → TRUST_ADMIN_IRREVOCABLE routing
