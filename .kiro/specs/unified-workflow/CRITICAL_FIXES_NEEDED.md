# Critical Fixes Needed for Unified Workflow

## Status: 🔴 2 Critical Bugs Found

---

## Bug #1: Duplicate "immediate_actions" Phase ⚠️ CRITICAL

### Problem
The `SETTLEMENT_PHASE_TASKS` array has TWO entries for the same phase:

```typescript
// Entry 1
{
  phase: "immediate_actions",
  title: "Preliminary Assessment",
  subtitle: "Determine Strategy",
  tasks: [
    "check_small_estate",
    "confirm_executor_role",
    "secure_property"
  ] // 3 tasks
}

// Entry 2
{
  phase: "immediate_actions",
  title: "Immediate Actions",
  subtitle: "Secure & Notify",
  tasks: [
    "secure_property",
    "notify_ssa",
    "cancel_cards",
    "locate_will",
    "open_estate_account",
    "pay_immediate_bills"
  ] // 6 tasks
}
```

### Impact
- Component only renders the FIRST entry (Preliminary Assessment with 3 tasks)
- Users never see the other 6 critical tasks
- Progress calculation is wrong (expects 6 tasks, only shows 3)
- Task IDs like `notify_ssa` are defined in actions but never visible

### Fix Options

#### Option A: Merge into Single Phase (RECOMMENDED)
Combine both into one phase with all 9 unique tasks:

```typescript
{
  phase: "immediate_actions",
  title: "Immediate Actions",
  subtitle: "Secure & Notify",
  duration: "Week 1-2",
  description: "Critical tasks to complete immediately after death.",
  tasks: [
    // Preliminary Assessment (3 tasks)
    { id: "check_small_estate", ... },
    { id: "confirm_executor_role", ... },
    
    // Immediate Actions (6 tasks)
    { id: "secure_property", ... },
    { id: "notify_ssa", ... },
    { id: "cancel_cards", ... },
    { id: "locate_will", ... },
    { id: "open_estate_account", ... },
    { id: "pay_immediate_bills", ... }
  ] // 8 unique tasks (secure_property appears in both)
}
```

#### Option B: Split into Two Phases
Create a new phase "preliminary_assessment":

```typescript
export type SettlementPhase = 
  | 'preliminary_assessment'  // NEW
  | 'immediate_actions'
  | 'court_filing'
  | 'asset_discovery'
  | 'creditor_claims'
  | 'asset_liquidation'
  | 'final_distribution';
```

**Cons**: Requires updating 10+ files, breaks existing data

---

## Bug #2: Phase Name Inconsistency ⚠️ CRITICAL

### Problem
Different files use different names for the liquidation phase:

**Uses `liquidation`:**
- `src/lib/assetPhase.ts` (line 16, 44, 59)
- `src/contexts/WorkflowContext.tsx` (line 48, 49, 50, 51, 52)

**Uses `asset_liquidation`:**
- `src/components/SettlementPhaseChevron.tsx` (type definition)
- `src/config/settlementPhases.ts` (line 380)
- `src/lib/phaseLock.ts` (line 43)

### Impact
- Type errors in TypeScript
- Phase locks may not work correctly
- Asset grouping may fail
- Progress calculation may be wrong

### Fix
Standardize on `asset_liquidation` everywhere:

**Files to Update:**

1. **src/lib/assetPhase.ts**
```typescript
// Change line 16
export type AssetPhaseStatus = 
  | 'immediate_actions'
  | 'court_filing'
  | 'asset_discovery'
  | 'creditor_claims'
  | 'asset_liquidation'  // ← Change from 'liquidation'
  | 'final_distribution';

// Change line 44
if (['APPROVED', 'READY_TO_DISTRIBUTE', 'PENDING_SALE'].includes(asset.status)) {
  return 'asset_liquidation';  // ← Change from 'liquidation'
}

// Change line 59
const byPhase: Record<AssetPhaseStatus, any[]> = {
  immediate_actions: [],
  court_filing: [],
  asset_discovery: [],
  creditor_claims: [],
  asset_liquidation: [],  // ← Change from 'liquidation'
  final_distribution: []
};

// Change line 80
asset_liquidation: 'Phase 4: Asset Liquidation',  // ← Change from 'liquidation'
```

2. **src/contexts/WorkflowContext.tsx**
```typescript
// Change lines 48-52
const phaseLocks: Record<SettlementPhase, PhaseLockStatus> = {
  immediate_actions: { isLocked: false },
  court_filing: { isLocked: false },
  asset_discovery: getPhaseLocksStatus('asset_discovery', estate, assets),
  creditor_claims: getPhaseLocksStatus('creditor_claims', estate, assets),
  asset_liquidation: getPhaseLocksStatus('asset_liquidation', estate, assets),  // ← Change
  final_distribution: getPhaseLocksStatus('final_distribution', estate, assets)
};

// Change lines 62-68
const phaseProgress: Record<SettlementPhase, PhaseProgress> = {
  immediate_actions: calculateProgress('immediate_actions', completedTaskIds),
  court_filing: calculateProgress('court_filing', completedTaskIds),
  asset_discovery: calculateProgress('asset_discovery', completedTaskIds),
  creditor_claims: calculateProgress('creditor_claims', completedTaskIds),
  asset_liquidation: calculateProgress('asset_liquidation', completedTaskIds),  // ← Change
  final_distribution: calculateProgress('final_distribution', completedTaskIds)
};

// Change lines 76-82
useEffect(() => {
  if (completedPhases.includes('immediate_actions') && !completedPhases.includes('court_filing')) {
    setCurrentPhase('court_filing');
  } else if (completedPhases.includes('court_filing') && !completedPhases.includes('asset_discovery')) {
    setCurrentPhase('asset_discovery');
  } else if (completedPhases.includes('asset_discovery') && !completedPhases.includes('creditor_claims')) {
    setCurrentPhase('creditor_claims');
  } else if (completedPhases.includes('creditor_claims') && !completedPhases.includes('asset_liquidation')) {
    setCurrentPhase('asset_liquidation');  // ← Change from 'liquidation'
  } else if (completedPhases.includes('asset_liquidation') && !completedPhases.includes('final_distribution')) {
    setCurrentPhase('final_distribution');
  }
}, [completedPhases]);

// Change lines 105-111
const taskCounts: Record<SettlementPhase, number> = {
  immediate_actions: 6,
  court_filing: 5,
  asset_discovery: 5,
  creditor_claims: 5,
  asset_liquidation: 5,  // ← Change from 'liquidation'
  final_distribution: 5
};
```

---

## Additional Issues (Non-Critical)

### Issue #3: Task ID Prefix Logic
**Problem**: Progress calculation uses `id.startsWith(phase)` but task IDs don't have phase prefixes

**Example**:
- Phase: `asset_discovery`
- Task ID: `freeze_accounts`
- Check: `'freeze_accounts'.startsWith('asset_discovery')` → FALSE ❌

**Impact**: Progress bars show 0% even when tasks are completed

**Fix**: Either:
1. Add phase prefix to all task IDs: `asset_discovery_freeze_accounts`
2. Change filtering logic to use a lookup map

### Issue #4: Hard-coded Task Counts
**Problem**: Task counts are hard-coded instead of reading from config

**Fix**:
```typescript
import { SETTLEMENT_PHASE_TASKS } from '@/config/settlementPhases';

function calculateProgress(phase: SettlementPhase, completedTaskIds: string[]): PhaseProgress {
  const phaseData = SETTLEMENT_PHASE_TASKS.find(p => p.phase === phase);
  const total = phaseData?.tasks.length || 0;
  const completed = completedTaskIds.filter(id => 
    phaseData?.tasks.some(t => t.id === id)
  ).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return { completed, total, percentage };
}
```

---

## Recommended Fix Order

1. **Fix Bug #2 (Phase Name)** - 10 minutes
   - Simple find/replace
   - Prevents type errors
   
2. **Fix Bug #1 (Duplicate Phase)** - 20 minutes
   - Merge into single phase
   - Update task count
   
3. **Fix Issue #4 (Task Counts)** - 15 minutes
   - Calculate dynamically
   - Prevents future bugs
   
4. **Fix Issue #3 (Task Prefix)** - 30 minutes
   - Update filtering logic
   - Test progress calculation

**Total Time**: ~75 minutes

---

## Testing After Fixes

1. Navigate to `/roadmap`
2. Expand "Immediate Actions" phase
3. Verify all 8-9 tasks are visible
4. Check a few task checkboxes
5. Verify progress bar updates correctly
6. Verify asset counts show correct numbers
7. Add INDIVIDUAL asset and verify blocker alert
8. Upload Letters and verify phase unlocks

---

## Summary

**Current State**: 🔴 2 critical bugs blocking proper functionality

**After Fixes**: 🟢 Fully functional unified workflow

**User Impact**: 
- Before: Missing 6 critical tasks, broken progress tracking
- After: Complete task list, accurate progress, seamless navigation

**Recommendation**: Fix both critical bugs before showing to users.
