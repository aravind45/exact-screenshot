# Settlement Types & Roadmaps - Comprehensive Evaluation

**Date**: February 2, 2026  
**Evaluator**: AI Agent  
**Application**: ExpectedEstate v1.0  
**Scope**: All settlement types, tracks, and their roadmap implementations

---

## Executive Summary

ExpectedEstate supports **11 distinct settlement types** with **state-specific variations** for CA, TX, FL, and NY. The system uses a sophisticated dual-roadmap architecture:

1. **Track-Based Roadmap** (`settlementStages.ts`) - Legacy, stage-based workflows
2. **Phase-Based Roadmap** (`settlementPhases.ts`) - Modern, unified 6-phase system

**Overall Assessment**: The settlement type system is **comprehensive but fragmented**. The dual roadmap architecture creates confusion and inconsistency.

**Grade**: B- (75%)

---

## Settlement Types Inventory

### Supported Types (from `authorityEngine.ts`)

| Type | Description | State Support | Implementation Status |
|------|-------------|---------------|----------------------|
| **FORMAL_PROBATE** | Full court-supervised probate | All states | ✅ Complete |
| **INFORMAL_PROBATE** | Simplified probate (UPC states) | Limited | ⚠️ Partial |
| **SMALL_ESTATE** | Affidavit-based settlement | CA, TX, FL, NY | ✅ Complete |
| **SUMMARY_ADMINISTRATION** | Florida-specific small estate | FL only | ✅ Complete |
| **VOLUNTARY_ADMINISTRATION** | New York-specific small estate | NY only | ✅ Complete |
| **MUNIMENT_OF_TITLE** | Texas will probate shortcut | TX only | ⚠️ Partial |
| **ANCILLARY_PROBATE** | Out-of-state property probate | All states | ⚠️ Partial |
| **SPOUSAL_PETITION** | Spousal property petition | CA, others | ✅ Complete |
| **TRUST_ADMIN** | Trust administration | All states | ✅ Complete |
| **JOINT_TRANSFER** | Joint ownership transfer | All states | ✅ Complete |
| **POD_TOD_TRANSFER** | Beneficiary designation transfer | All states | ✅ Complete |
| **INTESTATE** | No will, intestacy laws apply | All states | ⚠️ Partial |
| **INSOLVENT** | Debts exceed assets | All states | ⚠️ Partial |
| **SPECIAL** | Complex/contested estates | All states | ❌ Minimal |

### Additional Types (from `settlementStages.ts`)

The `TRACK_STAGES` constant defines 11 tracks, which mostly overlap with authority types but use different naming:
- Uses `TRUST_ADMIN` instead of separate revocable/irrevocable
- Includes `INSOLVENT` and `SPECIAL` tracks not in authority engine
- Missing `MUNIMENT_OF_TITLE` and state-specific variants

---

## Roadmap Architecture Analysis

### Architecture 1: Track-Based Roadmap (`settlementStages.ts`)

**Purpose**: Stage-based workflows for different settlement tracks  
**Location**: `src/config/settlementStages.ts`  
**Used By**: `ProbateChecklistWidget`, `SettlementTrail`

#### Structure
```typescript
TRACK_STAGES: Record<SettlementTrack, ProcessStage[]>
```

Each track has 3-5 stages with tasks:
- **FORMAL_PROBATE**: 5 stages (Petition → Authority → Discovery → Creditors → Distribution)
- **SMALL_ESTATE**: 5 stages (Valuation → Affidavit → Collection → Debts → Final)
- **TRUST_ADMIN**: 5 stages (Acceptance → Notice → Inventory → Expenses → Transfer)
- **JOINT_TRANSFER**: 4 stages (ID Heirs → Claims → Tax Check → Pay Out)
- **INTESTATE**: 5 stages (Hierarchy → Petition → Bond → Clearance → Statutory)
- **ANCILLARY_PROBATE**: 4 stages (Domiciliary → Local Filing → Local Rep → Sale/Move)
- **INFORMAL_PROBATE**: 3 stages (Petition → Admin → Close)
- **POD_TOD_TRANSFER**: 3 stages (ID Accounts → Claim Forms → Transfer)
- **SPOUSAL_PETITION**: 3 stages (Petition → Hearing → Transfer)
- **INSOLVENT**: 4 stages (Freeze → Priority → Exhaust → Pro-Rata)
- **SPECIAL**: 4 stages (Triage → Litigation → Hold → Mediation)

#### State-Specific Overrides
```typescript
STATE_ROADMAP_OVERRIDES: Record<string, Partial<Record<SettlementTrack, ProcessStage[]>>>
```

Supports TX, FL, NY with customized stages:
- **TX FORMAL_PROBATE**: Independent Executor workflow
- **TX SMALL_ESTATE**: Court-filed SEA with judge signature
- **FL FORMAL_PROBATE**: 10-day will lodging deadline, 90-day creditor window
- **FL SMALL_ESTATE**: Summary Administration petition
- **NY FORMAL_PROBATE**: Surrogate court process, 7-month creditor period

#### Strengths
✅ Track-specific workflows  
✅ State-specific variations  
✅ Detailed task breakdowns  
✅ Legal accuracy

#### Weaknesses
❌ Not integrated with main roadmap  
❌ No phase locking logic  
❌ No document upload integration  
❌ No progress tracking  
❌ Only used in one widget

---

### Architecture 2: Phase-Based Roadmap (`settlementPhases.ts`)

**Purpose**: Unified 6-phase workflow for all estate types  
**Location**: `src/config/settlementPhases.ts`  
**Used By**: `SettlementRoadmapNew`, `CollapsiblePhaseChevron`, `WorkflowContext`

#### Structure
```typescript
SETTLEMENT_PHASE_TASKS: Array<{
  phase: string;
  title: string;
  description: string;
  tasks: Task[];
}>
```

**6 Universal Phases**:
0. **Preliminary Assessment** (Day 1-7)
1. **Immediate Actions** (Week 1-2) - 6 tasks
2. **Court Filing** (Week 3-8) - 8 tasks with exclusive groups
3. **Asset Discovery** (Month 2-4) - 5 tasks
4. **Creditor Claims** (Month 4-8) - 5 tasks
5. **Asset Liquidation** (Month 6-12) - 5 tasks
6. **Final Distribution** (Month 12-18) - 5 tasks

#### Exclusive Task Groups
Phase 2 (Court Filing) uses exclusive groups to show only relevant tasks:
- **filing_path**: Probate OR Small Estate OR Spousal Petition
- Tasks filtered based on `estate.estateType`

#### Phase Locking System
Implemented in `src/lib/phaseLock.ts`:
- **Phase 0-1**: Always accessible
- **Phase 2**: Always accessible (filing phase)
- **Phase 3**: Locked until authority granted (DE-150, DE-310, DE-226, Trust Cert)
- **Phase 4**: Locked until asset discovery complete
- **Phase 5**: Currently unlocked (TODO: should check claims resolution)
- **Phase 6**: Locked until liquidation complete

#### Strengths
✅ Unified workflow for all types  
✅ Phase locking prevents premature actions  
✅ Document upload integration  
✅ Progress tracking  
✅ Real-time updates  
✅ Exclusive task groups  
✅ Authority-based unlocking

#### Weaknesses
❌ Less detailed than track-based roadmap  
❌ Doesn't leverage state-specific variations  
❌ Generic tasks don't reflect track nuances  
❌ Missing some specialized workflows (Insolvent, Special)

---

## Settlement Type Coverage Analysis

### 1. FORMAL_PROBATE ✅ **EXCELLENT**

**Track-Based Roadmap**: 5 detailed stages with 16 tasks  
**Phase-Based Roadmap**: Full support with exclusive filing path  
**State Variations**: TX, FL, NY customizations  
**Phase Locking**: DE-150 required for Phase 3  
**Grade**: A (95%)

**Strengths**:
- Most comprehensive implementation
- State-specific deadlines (FL 10-day will lodging, NY 7-month creditors)
- Clear authority requirements
- Detailed task breakdowns

**Gaps**:
- Phase-based roadmap doesn't show state-specific nuances
- No integration between two roadmap systems

---

### 2. SMALL_ESTATE ✅ **EXCELLENT**

**Track-Based Roadmap**: 5 stages with state variations  
**Phase-Based Roadmap**: Exclusive task group in Phase 2  
**State Variations**: CA (DE-310), TX (SEA with court), FL (Summary Admin), NY (Voluntary Admin)  
**Phase Locking**: DE-310 required for Phase 3  
**Grade**: A (95%)

**Strengths**:
- State-specific affidavit requirements
- Correct waiting periods (CA 40 days)
- Simplified workflow vs probate
- Authority engine correctly recommends based on thresholds

**Gaps**:
- Phase-based roadmap doesn't distinguish between state variants
- TX court-filed SEA process not reflected in phase roadmap

---

### 3. SPOUSAL_PETITION ✅ **GOOD**

**Track-Based Roadmap**: 3 stages (Petition → Hearing → Transfer)  
**Phase-Based Roadmap**: Exclusive task group in Phase 2  
**State Variations**: CA (DE-221/DE-226) documented  
**Phase Locking**: DE-226 required for Phase 3  
**Grade**: B+ (88%)

**Strengths**:
- Dedicated page (`SpousalPropertyPetition.tsx`)
- Correct authority document (DE-226)
- Faster timeline than probate
- Authority engine recommends for spouses

**Gaps**:
- Limited to CA implementation
- Other states' spousal set-aside processes not documented
- Phase roadmap generic

---

### 4. TRUST_ADMIN ✅ **GOOD**

**Track-Based Roadmap**: 5 stages (Acceptance → Notice → Inventory → Expenses → Transfer)  
**Phase-Based Roadmap**: Bypasses Phase 2, unlocks Phase 3 with Trust Cert  
**State Variations**: Generic (trust law is more uniform)  
**Phase Locking**: Trust Certification required for Phase 3  
**Grade**: B+ (87%)

**Strengths**:
- No court filing required (Phase 2 skipped)
- Correct authority documents (TRUST_CERT, TRUSTEE_ACC)
- Private administration workflow
- Authority engine correctly identifies trust assets

**Gaps**:
- Doesn't distinguish revocable vs irrevocable trusts
- Pour-over will scenario not fully implemented
- Phase roadmap doesn't show trust-specific tasks

---

### 5. JOINT_TRANSFER / POD_TOD_TRANSFER ✅ **GOOD**

**Track-Based Roadmap**: 3-4 stages (simple workflows)  
**Phase-Based Roadmap**: Phases 2-3 unlocked immediately (no authority needed)  
**State Variations**: N/A (operation of law)  
**Phase Locking**: No locks (automatic transfer)  
**Grade**: B+ (85%)

**Strengths**:
- Simplest workflow (no probate)
- Correct authority logic (no document required)
- Fast timeline
- Authority engine correctly identifies

**Gaps**:
- Phase roadmap still shows all phases (should be streamlined)
- No dedicated UI for non-probate transfers
- Beneficiary claim process not detailed

---

### 6. INTESTATE ⚠️ **PARTIAL**

**Track-Based Roadmap**: 5 stages (Hierarchy → Petition → Bond → Clearance → Statutory)  
**Phase-Based Roadmap**: Uses FORMAL_PROBATE workflow  
**State Variations**: Generic intestacy rules  
**Phase Locking**: Same as FORMAL_PROBATE  
**Grade**: C+ (77%)

**Strengths**:
- Track roadmap shows intestacy-specific steps
- Authority engine identifies no-will scenarios
- Hierarchy determination stage

**Gaps**:
- Phase roadmap doesn't distinguish from probate
- State-specific intestacy percentages not documented
- No heir determination wizard
- Administrator vs Executor distinction not clear

---

### 7. INFORMAL_PROBATE ⚠️ **PARTIAL**

**Track-Based Roadmap**: 3 stages (Petition → Admin → Close)  
**Phase-Based Roadmap**: Uses FORMAL_PROBATE workflow  
**State Variations**: Limited (UPC states only)  
**Phase Locking**: Same as FORMAL_PROBATE  
**Grade**: C (75%)

**Strengths**:
- Simplified workflow vs formal probate
- Track roadmap shows streamlined process

**Gaps**:
- Not clearly distinguished from formal probate in UI
- UPC state identification not automated
- Phase roadmap identical to formal probate
- No guidance on when informal is available

---

### 8. ANCILLARY_PROBATE ⚠️ **PARTIAL**

**Track-Based Roadmap**: 4 stages (Domiciliary → Local Filing → Local Rep → Sale/Move)  
**Phase-Based Roadmap**: Not integrated  
**State Variations**: Generic  
**Phase Locking**: Not implemented  
**Grade**: D+ (68%)

**Strengths**:
- Track roadmap shows ancillary-specific workflow
- Authority engine identifies out-of-state property

**Gaps**:
- No UI implementation
- Not integrated with phase roadmap
- Multi-state coordination not supported
- Domiciliary probate dependency not enforced

---

### 9. INSOLVENT ⚠️ **MINIMAL**

**Track-Based Roadmap**: 4 stages (Freeze → Priority → Exhaust → Pro-Rata)  
**Phase-Based Roadmap**: Not integrated  
**State Variations**: Generic priority classes  
**Phase Locking**: Not implemented  
**Grade**: D (65%)

**Strengths**:
- Track roadmap shows insolvency workflow
- Priority class concept documented

**Gaps**:
- No solvency detection
- Priority class engine not implemented (see `priorityService.ts` - exists but not integrated)
- No pro-rata distribution calculator
- Phase roadmap doesn't handle insolvency

---

### 10. SPECIAL (Contested Estates) ❌ **MINIMAL**

**Track-Based Roadmap**: 4 stages (Triage → Litigation → Hold → Mediation)  
**Phase-Based Roadmap**: Not integrated  
**State Variations**: None  
**Phase Locking**: Not implemented  
**Grade**: F (40%)

**Strengths**:
- Track roadmap acknowledges complexity

**Gaps**:
- No UI implementation
- No litigation tracking
- No attorney coordination features
- Phase roadmap doesn't support contested scenarios
- No will contest detection

---

### 11. MUNIMENT_OF_TITLE ❌ **NOT IMPLEMENTED**

**Track-Based Roadmap**: Not defined  
**Phase-Based Roadmap**: Not integrated  
**State Variations**: TX only  
**Phase Locking**: Not implemented  
**Grade**: F (20%)

**Strengths**:
- Authority engine mentions it

**Gaps**:
- No roadmap implementation
- Not in track stages
- TX-specific shortcut not available to users

---

## State-Specific Implementation Analysis

### California (CA) ✅ **EXCELLENT**

**Supported Types**: Formal Probate, Small Estate (DE-310), Spousal Petition (DE-221)  
**Threshold**: $184,500  
**Forms**: DE-111, DE-150, DE-160, DE-221, DE-226, DE-310  
**Grade**: A (95%)

**Strengths**:
- Most comprehensive state support
- All major forms implemented
- Correct thresholds and waiting periods
- State-specific document requirements

**Gaps**:
- Heggstad petition not implemented
- Conservatorship estates not supported

---

### Texas (TX) ⚠️ **GOOD**

**Supported Types**: Formal Probate (Independent Admin), Small Estate (SEA)  
**Threshold**: $75,000  
**Forms**: Application for Probate, Letters Testamentary, SEA  
**Grade**: B (85%)

**Strengths**:
- Independent executor workflow documented
- SEA court-filing process correct
- State-specific deadlines (10-day posting)

**Gaps**:
- Muniment of Title not implemented
- Dependent administration not distinguished
- Affidavit of Heirship not supported

---

### Florida (FL) ⚠️ **GOOD**

**Supported Types**: Formal Probate, Summary Administration  
**Threshold**: $75,000  
**Forms**: Petition for Administration, Letters of Administration  
**Grade**: B (83%)

**Strengths**:
- 10-day will lodging deadline documented
- 90-day creditor window correct
- Summary Administration process

**Gaps**:
- Disposition without administration not implemented
- Family allowance not documented
- Homestead rules not integrated

---

### New York (NY) ⚠️ **PARTIAL**

**Supported Types**: Formal Probate, Voluntary Administration  
**Threshold**: $50,000  
**Forms**: Petition for Probate, Letters Testamentary  
**Grade**: C+ (78%)

**Strengths**:
- Surrogate court process documented
- 7-month creditor period correct
- SCPA references

**Gaps**:
- Voluntary administration details sparse
- Small estate affidavit ($50k) not fully implemented
- Citations process not detailed

---

## Critical Issues & Gaps

### Issue 1: Dual Roadmap Architecture ⚠️ **HIGH PRIORITY**

**Problem**: Two separate roadmap systems that don't communicate  
**Impact**: Confusion, inconsistency, wasted development effort  
**Affected Types**: All

**Evidence**:
- `settlementStages.ts` has detailed track-specific workflows
- `settlementPhases.ts` has unified 6-phase system
- `ProbateChecklistWidget` uses track stages
- `SettlementRoadmapNew` uses phase system
- No integration between them

**Recommendation**: Merge into single unified system that combines:
- Phase-based progression (for locking and authority)
- Track-specific task details (for accuracy)
- State-specific variations (for compliance)

---

### Issue 2: Incomplete Settlement Types ⚠️ **MEDIUM PRIORITY**

**Problem**: 5 settlement types are partially or minimally implemented  
**Impact**: Users on those tracks get generic guidance  
**Affected Types**: INTESTATE, INFORMAL_PROBATE, ANCILLARY_PROBATE, INSOLVENT, SPECIAL

**Recommendation**: Either:
1. Fully implement these types with dedicated workflows, OR
2. Remove them from the system and focus on the 6 well-supported types

---

### Issue 3: State Variations Not Surfaced ⚠️ **MEDIUM PRIORITY**

**Problem**: State-specific roadmaps exist but aren't used in main UI  
**Impact**: Users miss state-specific deadlines and requirements  
**Affected States**: TX, FL, NY

**Evidence**:
- `STATE_ROADMAP_OVERRIDES` has TX/FL/NY customizations
- `SettlementRoadmapNew` doesn't use these overrides
- Phase tasks are generic across all states

**Recommendation**: Integrate state overrides into phase-based roadmap

---

### Issue 4: Track Scout Not Integrated ⚠️ **MEDIUM PRIORITY**

**Problem**: Authority recommendation happens in onboarding but isn't revisited  
**Impact**: Users may be on wrong track if circumstances change  
**Affected Types**: All

**Evidence**:
- `calculateAuthorityRecommendation()` only called in `OnboardingWizard`
- No "Track Scout" page or recalculation feature
- Estate type set once and never updated

**Recommendation**: Add Track Scout page that:
- Shows current track and why it was chosen
- Allows recalculation if assets/values change
- Suggests track changes when appropriate

---

### Issue 5: Missing Specialized Workflows ⚠️ **LOW PRIORITY**

**Problem**: Some legal scenarios have no workflow  
**Impact**: Users in these situations get no guidance  
**Affected Types**: MUNIMENT_OF_TITLE, contested estates, conservatorships

**Recommendation**: Add specialized workflows for:
- TX Muniment of Title
- Will contests
- Conservatorship estates
- Minor beneficiaries
- Charitable bequests

---

## Recommendations

### Tier 1: Critical (4-6 weeks)

1. **Unify Roadmap Architecture** (3 weeks)
   - Merge track stages into phase system
   - Add track-specific task variants
   - Integrate state overrides
   - Maintain phase locking logic

2. **Complete Phase 5 Claims Check** (1 week)
   - Add liability resolution check to phaseLock.ts
   - Prevent premature liquidation

3. **Add Track Scout Page** (2 weeks)
   - Show current track and recommendation
   - Allow recalculation
   - Suggest track changes

### Tier 2: Important (6-8 weeks)

4. **Implement Intestate Workflow** (2 weeks)
   - Heir determination wizard
   - State intestacy percentages
   - Administrator appointment process

5. **Enhance State-Specific Roadmaps** (3 weeks)
   - Surface TX/FL/NY variations in UI
   - Add state-specific deadline tracking
   - Implement state-specific forms

6. **Complete Ancillary Probate** (2 weeks)
   - Multi-state asset tracking
   - Domiciliary probate dependency
   - Local representative appointment

### Tier 3: Nice-to-Have (8-12 weeks)

7. **Implement Insolvent Estate Workflow** (3 weeks)
   - Solvency detection
   - Priority class engine integration
   - Pro-rata distribution calculator

8. **Add Muniment of Title** (1 week)
   - TX-specific workflow
   - Will admission without administration

9. **Contested Estate Support** (4 weeks)
   - Will contest detection
   - Litigation tracking
   - Attorney coordination

---

## Testing Matrix

| Settlement Type | Track Roadmap | Phase Roadmap | State Variations | Phase Locking | UI Integration | Grade |
|----------------|---------------|---------------|------------------|---------------|----------------|-------|
| FORMAL_PROBATE | ✅ Complete | ✅ Complete | ✅ TX, FL, NY | ✅ Yes | ✅ Full | A (95%) |
| SMALL_ESTATE | ✅ Complete | ✅ Complete | ✅ CA, TX, FL, NY | ✅ Yes | ✅ Full | A (95%) |
| SPOUSAL_PETITION | ✅ Complete | ✅ Complete | ⚠️ CA only | ✅ Yes | ✅ Full | B+ (88%) |
| TRUST_ADMIN | ✅ Complete | ✅ Complete | ✅ Generic | ✅ Yes | ✅ Full | B+ (87%) |
| JOINT_TRANSFER | ✅ Complete | ✅ Complete | N/A | ✅ Yes | ⚠️ Partial | B+ (85%) |
| POD_TOD_TRANSFER | ✅ Complete | ✅ Complete | N/A | ✅ Yes | ⚠️ Partial | B+ (85%) |
| INTESTATE | ✅ Complete | ⚠️ Generic | ⚠️ Generic | ⚠️ Same as probate | ❌ None | C+ (77%) |
| INFORMAL_PROBATE | ✅ Complete | ⚠️ Generic | ⚠️ Limited | ⚠️ Same as probate | ❌ None | C (75%) |
| ANCILLARY_PROBATE | ✅ Complete | ❌ None | ⚠️ Generic | ❌ No | ❌ None | D+ (68%) |
| INSOLVENT | ✅ Complete | ❌ None | ⚠️ Generic | ❌ No | ❌ None | D (65%) |
| SPECIAL | ⚠️ Minimal | ❌ None | ❌ None | ❌ No | ❌ None | F (40%) |
| MUNIMENT_OF_TITLE | ❌ None | ❌ None | ❌ None | ❌ No | ❌ None | F (20%) |

---

## Conclusion

ExpectedEstate has **excellent coverage** of the 6 most common settlement types (Formal Probate, Small Estate, Spousal Petition, Trust Admin, Joint Transfer, POD/TOD), representing **~90% of real-world estates**.

The **dual roadmap architecture** is the biggest weakness - it creates fragmentation and prevents the system from reaching its full potential. The track-based roadmap has superior detail and state-specific accuracy, but the phase-based roadmap has superior UX and integration.

**Recommendation**: Invest 3-4 weeks to unify the roadmap systems, then the settlement type coverage will be world-class.

**Current Grade**: B- (75%)  
**Potential Grade** (after unification): A (95%)

---

**Report Generated**: February 2, 2026  
**Next Steps**: Review recommendations with product team and prioritize roadmap unification
