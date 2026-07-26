# NY State Isolation Fix — CA Logic Leak Elimination

## Problem Statement

California (CA) probate logic was leaking into New York (NY) and all other state roadmap renderings:

1. **Phase headers were CA-driven** — "After Notice Published", "After Inventory Filed", "After Claim Period" are CA-specific procedural triggers
2. **4-month claim period (CA)** rendered instead of 7-month (NY) creditor exposure period
3. **CA Independent Administration (IAEA) sale logic** — "Notice of Proposed Action", "15-Day Objection Period", "Petition to Confirm Sale", "Sale Confirmation Order" rendered for non-CA states
4. **CA-based gating headers** in phase metadata leaked to all states

## Root Cause

CA was the base template. NY overrides were partial. `normalizePhasesForState()` only normalized task-level text, not phase-level metadata (milestones, subtitles).

## Architecture: Option A — State-Neutral Base

All procedural specificity now lives in state overrides. Base tasks are state-neutral.

### Resolution: 3-Tier Phase Override System

```
Phase Milestone Resolution:
  1. STATE_PHASE_OVERRIDES[state][phase]  → State-specific (highest priority)
  2. NEUTRAL_PHASE_MILESTONES[phase]      → State-neutral default
  3. Original phase metadata              → Fallback (lowest priority)
```

## Files Modified

### 1. `server/services/roadmapService.ts` (Core Fix)

| Change | Description |
|--------|-------------|
| `STATE_PHASE_OVERRIDES` | Per-state phase milestone/subtitle overrides for **10 states**: NY, CA, TX, FL, PA, OH, IL, GA, NJ, MA |
| `NEUTRAL_PHASE_MILESTONES` | State-neutral defaults for all 7 phases |
| `CA_ONLY_TASK_IDS` | Hard guard Set: `prepare_notice_proposed_action`, `wait_proposed_action_period`, `petition_confirm_sale`, `obtain_sale_confirmation_order` |
| `CA_ONLY_TEXT_TOKENS` | Text patterns that must never appear for non-CA states |
| `removeCAOnlyTasks()` | Filters CA-exclusive tasks for non-CA states |
| `normalizePhasesForState()` | Rewritten to normalize **phase-level metadata** AND task content using 3-tier resolution |
| Wired into both DB and fallback paths | `removeCAOnlyTasks()` called before `normalizePhasesForState()` in both code paths |

### 2. `src/config/settlementPhases.ts` (Task-Level Overrides)

| Change | Description |
|--------|-------------|
| `creditor_claims` phase description | → "state-specific creditor exposure period" (neutral) |
| `wait_claim_period` task base title | → "Monitor State-Specific Creditor Exposure Period" (neutral) |
| `wait_claim_period.stateOverrides` | **10 states** with correct creditor periods: CA (4mo), NY (7mo), TX (4mo), FL (3mo), PA (12mo), OH (6mo), IL (6mo), GA (3mo), NJ (6mo), MA (12mo) |

### 3. `server/config/settlementPhases.ts` (Server-Side Base)

| Change | Description |
|--------|-------------|
| Removed all CA form numbers | DE-111, DE-150, DE-160 stripped from base task titles |
| Task titles state-neutralized | No CA-specific language in base definitions |

### 4. `src/components/SettlementPhaseChevron.tsx` (UI Fallback)

| Change | Description |
|--------|-------------|
| Default fallback milestones | → "After Letters Issued", "Month 6–12", "Month 6–12" (state-neutral) |

## State Coverage Matrix

### Phase-Level Overrides (`STATE_PHASE_OVERRIDES`)

| State | creditor_claims | asset_liquidation | final_distribution |
|-------|----------------|-------------------|-------------------|
| **NY** | "After Letters Issued" / "7-Month Exposure Period" | "Month 6–12" / "Transfer & Sell" | "After Accounting Approved" / "Court Settlement & Close" |
| **CA** | "After Notice Published" / "4-Month Claim Window" | "After Inventory Filed" / "IAEA / Court-Confirmed Sales" | "After Claim Period" / "Estate In Closing" |
| **TX** | "After Letters Issued" / "4-Month Claim Period" | *(neutral default)* | "After Debts Settled" / "Estate In Closing" |
| **FL** | "After Letters Issued" / "3-Month Claim Period" | *(neutral default)* | "After Claim Period" / "Estate In Closing" |
| **PA** | "After Letters Issued" / "1-Year Claim Period" | *(neutral default)* | *(neutral default)* |
| **OH** | "After Appointment" / "6-Month Claim Period" | *(neutral default)* | *(neutral default)* |
| **IL** | "After Letters Issued" / "6-Month Claim Period" | *(neutral default)* | *(neutral default)* |
| **GA** | "After Publication" / "3-Month Claim Period" | *(neutral default)* | *(neutral default)* |
| **NJ** | "After Letters Issued" / "6-Month Claim Period" | *(neutral default)* | *(neutral default)* |
| **MA** | "After Date of Death" / "1-Year Claim Period" | *(neutral default)* | *(neutral default)* |
| **Other 40 states** | *(neutral default: "After Letters Issued" / "Notice & Priority")* | *(neutral default)* | *(neutral default)* |

### Task-Level Creditor Period Overrides (`wait_claim_period.stateOverrides`)

| State | Creditor Period | Trigger Event | Statutory Cite |
|-------|----------------|---------------|----------------|
| CA | 4 months | Publication of creditor notice | CPC §9100 |
| NY | 7 months | Issuance of Letters | SCPA §1802 |
| TX | 4 months | Publication/personal notice | TEC §403.051 |
| FL | 3 months | First publication | Fla. Stat. §733.702 |
| PA | 12 months | Date of death | 20 Pa.C.S. §3532 |
| OH | 6 months | Fiduciary appointment | ORC §2117.06 |
| IL | 6 months | First publication | 755 ILCS 5/18-12 |
| GA | 3 months | Publication | OCGA §53-7-41 |
| NJ | 6 months | First publication | NJSA 3B:22-4 |
| MA | 12 months | Date of death | MGL c.197 §9 |

### Fallback Coverage (States Without Explicit Overrides)

States not in the override map get:
- **Phase milestones**: `NEUTRAL_PHASE_MILESTONES` (state-neutral defaults)
- **Task text**: `normalizeTextForState()` strips CA form numbers (DE-xxx), replaces "California" → "state", "Medi-Cal" → "Medicaid"
- **CA-only tasks**: Hard-blocked by `removeCAOnlyTasks()` — IAEA sale workflow never renders
- **Letters terminology**: `getLettersTerm(state)` from `stateRules.ts` provides correct term for all 50 states + DC

---

## Phase 2: PRO FORMS Page — Multi-State Awareness

### Problem

The PRO FORMS page was CA-only:
- `FORM_CONTEXTS` only mapped CA DE-* forms
- `FORM_AUTHORITIES` only mapped CA DE-* forms
- `/api/forms/readiness` endpoint only returned readiness for 4 CA forms (DE-111, DE-121, DE-150, DE-160)
- Fallback text said "Currently, only California forms are available"

### Files Modified

#### 5. `server/services/formMappings.ts` — Multi-State Authority Tiers

| Change | Description |
|--------|-------------|
| `FORM_AUTHORITIES` expanded | Added **15 NY** (ET-1 through ET-15), **12 TX** (TX-1 through TX-12), **15 FL** (FL-1 through FL-15) authority tier mappings |
| Correct tier assignments | ET-14/ET-15 = `AFFIDAVIT_SMALL`, TX-11 = `AFFIDAVIT_SMALL`, FL-2/FL-14 = `AFFIDAVIT_SMALL` |

#### 6. `src/pages/Forms.tsx` — Multi-State Context Labels & UI

| Change | Description |
|--------|-------------|
| `FORM_CONTEXTS` expanded | Added **7 NY**, **5 TX**, **5 FL** context labels (e.g., ET-1 → "Probate Petition", TX-4 → "Letters Testamentary") |
| Fallback text | Changed from "Currently, only California forms are available" → "Forms are currently available for California, New York, Texas, and Florida" |
| Button text | Changed from "View California Forms" → "View Available Forms" |

#### 7. `server/routes/formRoutes.ts` — State-Aware Readiness Endpoint

| Change | Description |
|--------|-------------|
| `/readiness` endpoint | Expanded from 4 CA forms to **4 CA + 15 NY + 12 TX + 15 FL = 46 forms** |
| State-aware routing | Reads `estate.state` and returns only relevant state's readiness data |
| Query param support | `?state=NY` or `?state=ALL` to request specific state or all states |
| Correct readiness logic | Each form maps to appropriate estate status checks (hasDecedentInfo, isAppointed, hasInventory) |
| Authority tier alignment | Small estate/affidavit forms tagged `AFFIDAVIT_SMALL` in readiness response |

### Form Count by State

| State | Form Prefix | Template Count | Readiness Entries |
|-------|------------|----------------|-------------------|
| **CA** | DE-* | 22 templates | 4 key readiness checks |
| **NY** | ET-* | 15 templates | 15 readiness checks |
| **TX** | TX-* | 12 templates | 12 readiness checks |
| **FL** | FL-* | 15 templates | 15 readiness checks |

### Form Generation Capability

| State | Auto-fill (PDF overlay) | Blank Download | Preview from DB |
|-------|------------------------|----------------|-----------------|
| **CA** | ✅ 14 specialized generators | ✅ | ✅ |
| **NY** | ❌ (future) | ✅ | ✅ |
| **TX** | ❌ (future) | ✅ | ✅ |
| **FL** | ❌ (future) | ✅ | ✅ |

---

## Verification

For any state, the roadmap should:
1. ✅ Show state-specific creditor period (if override exists) or neutral default
2. ✅ Never show CA form numbers (DE-xxx) for non-CA states
3. ✅ Never show IAEA tasks (Notice of Proposed Action, 15-Day Objection, etc.) for non-CA states
4. ✅ Show correct phase milestones per state or neutral defaults
5. ✅ Use correct Letters terminology per state

For the PRO FORMS page:
6. ✅ Show forms filtered by estate state with correct authority tiers
7. ✅ Display "Used in:" context labels for NY, TX, FL forms (not just CA)
8. ✅ Return state-specific readiness data from `/api/forms/readiness`
9. ✅ Support `?state=` query parameter for explicit state selection
10. ✅ Fallback text acknowledges all 4 supported states
