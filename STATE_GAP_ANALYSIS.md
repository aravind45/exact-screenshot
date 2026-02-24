# State Implementation Gap Analysis
## Cross-referencing State_check.xlsx + THREE_STATE_IMPLEMENTATION_GUIDE.md vs Codebase

**Date**: February 24, 2026  
**Files Analyzed**: stateRules.ts, authorityEngine.ts, roadmapMetadata.ts, roadmapGenerator.ts, settlementPhases.ts, settlementStages.ts, roadmapService.ts, Forms.tsx

---

## Executive Summary

| State | stateRules | authorityEngine | roadmapMetadata | settlementPhases | Forms | Server Roadmap | Overall |
|-------|-----------|-----------------|-----------------|-----------------|-------|---------------|---------|
| **CA** | ✅ Full | ✅ Full | ✅ 2 overrides | ✅ 3 CA-only tasks | ✅ Supported | ✅ Full | ✅ **Complete** |
| **NY** | ✅ Full | ⚠️ Generic UPC=false | ✅ 1 override | ❌ 0 tasks | ✅ Supported | ⚠️ Partial | 🟡 **60%** |
| **TX** | ✅ Full | ❌ No Muniment path | ❌ 0 overrides | ❌ 0 tasks | ✅ Supported | ⚠️ Partial | 🟡 **50%** |
| **FL** | ✅ Full | ⚠️ Generic | ❌ 0 overrides | ❌ 0 tasks | ✅ Supported | ⚠️ Partial | 🟡 **50%** |
| **MA** | ✅ Full (MUPC) | ✅ MA-specific paths | ✅ 1 override | ❌ 0 tasks | ❌ Not supported | ⚠️ Partial | 🟡 **65%** |
| **GA** | ✅ Basic | ❌ No GA paths | ❌ 0 overrides | ❌ 0 tasks | ❌ Not supported | ❌ None | 🔴 **15%** |

---

## Detailed Gap Analysis by State

### 🗽 NEW YORK (NY) — 60% Complete

#### ✅ What's Working:
- `stateRules.ts`: threshold=50k, "Voluntary Administration", NY SCPA citations, Letters of Authority
- `roadmapMetadata.ts`: creditor_claims override ("7-Month Exposure Management")
- `Forms.tsx`: supported=true, download scripts exist
- `roadmapService.ts`: Pre-filing compliance phase auto-injected for NY

#### ❌ Gaps (from State_check.xlsx):
| Required Item | Status | Fix Needed |
|--------------|--------|------------|
| Surrogate's Court track (Phase 2) | ❌ Missing | Add NY court_filing tasks referencing Surrogate's Court |
| Ancillary Probate Petition ET-3 (Phase 2) | ❌ Missing | Add NY-specific ancillary task |
| Voluntary Administration ET-15 (Phase 3) | ❌ Missing | Add NY small-estate specific task |
| Exclude CA Spousal Petition | ✅ Working | CA contamination guards active |
| Exclude FL Homestead | ✅ Working | No FL tasks leak to NY |
| Exclude TX Independent Admin | ✅ Working | No TX tasks leak to NY |

#### ❌ Additional Gaps:
- `authorityEngine.ts`: No NY-specific logic — falls through to generic `isUPC=false` → FORMAL_PROBATE
- `settlementPhases.ts`: Zero NY-specific tasks (applicability.states never includes "NY")
- `roadmapMetadata.ts`: Missing overrides for court_filing phase (should reference Surrogate's Court)

---

### 🤠 TEXAS (TX) — 50% Complete

#### ✅ What's Working:
- `stateRules.ts`: threshold=75k, "Independent Administration", TX Estates Code citations
- `roadmapGenerator.ts`: Muniment of Title reduces creditor_claims and asset_liquidation phases
- `Forms.tsx`: supported=true, download scripts exist

#### ❌ Gaps (from State_check.xlsx):
| Required Item | Status | Fix Needed |
|--------------|--------|------------|
| Independent Administration (Phase 2) | ⚠️ Partial | stateRules mentions it, no specific tasks |
| Muniment of Title (Phase 2) | ⚠️ Partial | roadmapGenerator filters but no dedicated tasks |
| Small Estate Affidavit TX-11 (Phase 3) | ❌ Missing | Add TX small-estate task |
| Exclude CA Spousal Petition | ✅ Working | |
| Exclude FL Homestead | ✅ Working | |
| Exclude NY Surrogate's Court | ✅ Working | |

#### ❌ Additional Gaps:
- `authorityEngine.ts`: **No TX-specific Muniment of Title path** — TX with will never routes to MUNIMENT_OF_TITLE
- `roadmapMetadata.ts`: **Zero TX overrides** — no TX-specific phase milestones
- `settlementPhases.ts`: Zero TX-specific tasks
- `roadmapService.ts`: No TX-specific text normalization

---

### 🌴 FLORIDA (FL) — 50% Complete

#### ✅ What's Working:
- `stateRules.ts`: threshold=75k, "Summary Administration", FL Stat citations, spousalSetAside
- `roadmapGenerator.ts`: FL Summary Administration generates reduced 3-phase path for SMALL_ESTATE
- `Forms.tsx`: supported=true, download scripts exist

#### ❌ Gaps (from State_check.xlsx):
| Required Item | Status | Fix Needed |
|--------------|--------|------------|
| Summary Administration (Phase 2) | ✅ Working | roadmapGenerator handles it |
| Disposition Without Administration (Phase 2) | ❌ Missing | Very small FL estates need a distinct path |
| Homestead Property Petition FL-15 (Phase 6) | ❌ Missing | FL homestead rules need dedicated task |
| Exclude CA Spousal Petition | ✅ Working | |
| Exclude TX Independent Admin | ✅ Working | |
| Exclude NY Surrogate's Court | ✅ Working | |

#### ❌ Additional Gaps:
- `roadmapMetadata.ts`: **Zero FL overrides** — no FL-specific phase milestones
- `settlementPhases.ts`: Zero FL-specific tasks
- `authorityEngine.ts`: FL Summary Admin only triggers via generic small estate path, no FL-specific nuance
- No FL "Disposition Without Administration" path for very small estates (< ~$6,000 or no real property)

---

### 🏛️ MASSACHUSETTS (MA) — 65% Complete

#### ✅ What's Working:
- `stateRules.ts`: Full MUPC config (threshold=25k, bond options, creditor publication, tax forms)
- `authorityEngine.ts`: MA-specific paths (Informal/Formal/Voluntary Administration)
- `roadmapMetadata.ts`: creditor_claims override (1-Year/4-Month window)
- Client-side roadmap generation works via WorkflowContext fallback
- Server-side has MA text normalization

#### ❌ Gaps (from State_check.xlsx):
| Required Item | Status | Fix Needed |
|--------------|--------|------------|
| MA-specific roadmap/forms plan | ⚠️ Partial | Roadmap works generically, no MA-specific tasks |
| Exclude CA/NY/TX/FL-specific steps | ✅ Working | CA contamination guards active |

#### ❌ Additional Gaps:
- `settlementPhases.ts`: Zero MA-specific tasks
- `Forms.tsx`: **MA NOT supported** (supported: false) — no form download script
- `roadmapMetadata.ts`: Only creditor_claims override, missing court_filing override (should reference "Probate & Family Court")
- No MA-specific creditor publication task (strategic 4-month shortening option)
- No MA estate tax task (estates > $2M threshold)

---

### 🍑 GEORGIA (GA) — 15% Complete

#### ✅ What's Working:
- `stateRules.ts`: threshold=10k, "No Administration Necessary", O.C.G.A. citations

#### ❌ Gaps (from State_check.xlsx):
| Required Item | Status | Fix Needed |
|--------------|--------|------------|
| GA-specific roadmap/forms plan | ❌ Not started | Needs full implementation |
| Exclude CA/NY/TX/FL-specific steps | ✅ Working | Generic CA guards handle this |

#### ❌ Additional Gaps:
- **Zero GA-specific code** anywhere in src/
- No STATE_PHASE_OVERRIDES
- No authority engine paths
- No form support
- GA has unique "Year's Support" (spousal/minor support from estate) — not implemented
- GA Probate Court system not referenced
- GA "No Administration Necessary" for estates < $10k — no task

---

## Cross-Cutting Gaps

### 1. settlementPhases.ts — CA-Only Problem
Only 3 tasks in the entire file use `applicability.states`, and ALL are CA-only:
- `prepare_notice_proposed_action` → CA only
- `wait_proposed_action_period` → CA only  
- `petition_confirm_sale` → CA only

**No tasks are tagged for NY, TX, FL, MA, or GA.** This means state-specific requirements from State_check.xlsx have no dedicated tasks.

### 2. roadmapMetadata.ts — Missing Overrides
Only CA, MA, NY have phase overrides. Missing:
- **TX**: court_filing (should reference "County Probate Court"), creditor_claims
- **FL**: court_filing (should reference "Circuit Court"), final_distribution (Homestead)
- **GA**: court_filing (should reference "Probate Court"), all phases

### 3. authorityEngine.ts — Missing State Paths
- **TX Muniment of Title**: No detection logic. TX estates with a will and no debts should route to MUNIMENT_OF_TITLE
- **FL Disposition Without Administration**: No path for very small FL estates
- **GA No Administration Necessary**: No path for GA estates < $10k

---

## Priority Fixes (Implemented Below)

1. ✅ Add STATE_PHASE_OVERRIDES for TX, FL, GA
2. ✅ Add TX Muniment of Title path in authorityEngine.ts
3. ✅ Add FL Disposition Without Administration path
4. ✅ Add GA "No Administration Necessary" path
5. ✅ Add state-specific tasks in settlementPhases.ts for NY, TX, FL, MA, GA
6. ✅ Add MA court_filing phase override in roadmapMetadata.ts
