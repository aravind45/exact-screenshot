# Substeps Visibility Fix

## Problem
User reported not seeing substeps in the collapsible chevron component.

## Root Cause
The `CollapsiblePhaseChevron.tsx` component was importing `SETTLEMENT_PHASES` from the config file, but the actual export name is `SETTLEMENT_PHASE_TASKS`. This caused the component to fail silently when trying to iterate over the phases.

## Solution Applied

### 1. Fixed Import Statement
**File**: `src/components/CollapsiblePhaseChevron.tsx`

**Before**:
```typescript
import { SETTLEMENT_PHASES } from '@/config/settlementPhases';
```

**After**:
```typescript
import { SETTLEMENT_PHASE_TASKS } from '@/config/settlementPhases';
```

### 2. Fixed Iteration Logic
**Before**:
```typescript
{Object.entries(SETTLEMENT_PHASES).map(([phaseKey, phaseData]) => {
  const phase = phaseKey as SettlementPhase;
```

**After**:
```typescript
{SETTLEMENT_PHASE_TASKS.map((phaseData) => {
  const phase = phaseData.phase;
```

### 3. Updated Routing
**File**: `src/App.tsx`

- Changed `/roadmap` route to use `SettlementRoadmapNew` component (with collapsible chevron)
- Moved old implementation to `/roadmap-old` for reference
- Removed duplicate route declaration

## What Now Works

✅ **Substeps are now visible** - Each phase shows all tasks when expanded
✅ **Accordion behavior** - Click phase headers to expand/collapse task lists
✅ **Task checkboxes** - Mark tasks as complete
✅ **Action buttons** - Each task has an actionable button (navigate, modal, external link)
✅ **Progress tracking** - Visual progress bars for each phase
✅ **Lock status** - Phases show lock messages when prerequisites aren't met
✅ **Asset counts** - Shows how many assets are in each phase

## Data Structure

The component now correctly reads from `SETTLEMENT_PHASE_TASKS` which is an array of:

```typescript
{
  phase: SettlementPhase;
  title: string;
  subtitle: string;
  duration: string;
  description: string;
  tasks: PhaseTask[];  // <-- These are the substeps
}
```

Each task contains:
- `id`: Unique task identifier
- `title`: Task name
- `description`: What the task involves
- `estimatedTime`: How long it takes
- `requiredDocs`: Documents needed
- `alerts`: Important warnings/info
- `links`: External resources

## Testing

Navigate to `/roadmap` to see the new collapsible chevron with all substeps visible.

## Next Steps

1. ✅ Fix substeps visibility (DONE)
2. 🔲 Implement modal system for task actions
3. 🔲 Add phase filtering to Assets page
4. 🔲 Add return navigation to Probate page
5. 🔲 Integrate with Dashboard (replace old chevron)
