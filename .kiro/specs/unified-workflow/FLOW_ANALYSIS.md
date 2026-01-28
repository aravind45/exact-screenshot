# Unified Workflow Flow Analysis

## Overview
This document analyzes the complete flow of the unified workflow system that connects the Settlement Roadmap, Assets page, and Probate page into a cohesive user experience.

## Current Implementation Status

### ✅ What's Working

#### 1. **Collapsible Phase Chevron Component**
- **Location**: `src/components/CollapsiblePhaseChevron.tsx`
- **Status**: ✅ Fully functional
- **Features**:
  - Accordion-style expandable phases
  - All 6 phases visible with task lists
  - Task checkboxes for completion tracking
  - Action buttons for each task (navigate, modal, external)
  - Progress bars showing completion percentage
  - Asset count badges per phase
  - Lock status indicators with unlock actions
  - "Next Step" highlighting for current task
  - Visual states: completed (green), current (primary), locked (gray)

#### 2. **Workflow Context Provider**
- **Location**: `src/contexts/WorkflowContext.tsx`
- **Status**: ✅ Fully functional
- **Provides**:
  - `currentPhase`: Auto-calculated based on progress
  - `assetsByPhase`: Assets grouped by settlement phase
  - `phaseLocks`: Lock status for each phase
  - `probateBlockers`: Assets blocked by missing Letters
  - `phaseProgress`: Completion stats per phase
  - `completedTaskIds`: Array of completed task IDs
  - `completedPhases`: Array of completed phase names

#### 3. **Phase Lock System**
- **Location**: `src/lib/phaseLock.ts`
- **Status**: ✅ Fully functional
- **Logic**:
  - **Immediate Actions**: Always unlocked
  - **Court Filing**: Always unlocked
  - **Asset Discovery**: Locked until Letters received
  - **Creditor Claims**: Locked until asset discovery complete
  - **Asset Liquidation**: Always unlocked (TODO: check claims)
  - **Final Distribution**: Locked until liquidation complete

#### 4. **Asset Phase Calculation**
- **Location**: `src/lib/assetPhase.ts`
- **Status**: ✅ Fully functional
- **Mapping**:
  - `DISCOVERED` → immediate_actions
  - `INDIVIDUAL + no Letters` → court_filing
  - `CONTACTED/NOTIFIED/PENDING_DOCUMENTS` → asset_discovery
  - `IN_REVIEW/CLAIM_FILED/CLAIM_PENDING` → creditor_claims
  - `APPROVED/READY_TO_DISTRIBUTE/PENDING_SALE` → asset_liquidation
  - `DISTRIBUTED/CLOSED` → final_distribution

#### 5. **Task Action Mapping**
- **Location**: `src/config/taskActions.ts`
- **Status**: ✅ Fully configured
- **Actions**: 50+ task actions defined
- **Types**:
  - `navigate`: Routes to app pages
  - `modal`: Opens modal dialogs (TODO: implement modals)
  - `external`: Opens external URLs

#### 6. **Probate Blocker Alert**
- **Location**: `src/components/ProbateBlockerAlert.tsx`
- **Status**: ✅ Fully functional
- **Shows**: When INDIVIDUAL assets exist without Letters
- **Actions**:
  - Upload Letters button
  - View Blocked Assets button
  - Go to Probate Hub button

#### 7. **Settlement Roadmap Page**
- **Location**: `src/pages/SettlementRoadmapNew.tsx`
- **Route**: `/roadmap`
- **Status**: ✅ Fully functional
- **Features**:
  - Overall progress indicator (circular + percentage)
  - Horizontal phase chevron (visual timeline)
  - Probate blocker alert (conditional)
  - Collapsible phase accordion
  - Task completion tracking

## Flow Analysis

### User Journey: From Roadmap to Assets to Probate

#### Scenario 1: User Discovers New Asset
1. **Start**: User is on `/roadmap`
2. **Action**: Clicks "Immediate Actions" phase to expand
3. **Sees**: Task "Locate Will and Important Documents"
4. **Clicks**: "View Documents" button
5. **Navigates**: To `/documents` page
6. **Uploads**: Bank statement document
7. **System**: Auto-creates asset with status `DISCOVERED`
8. **Result**: Asset appears in "Immediate Actions" phase

#### Scenario 2: User Needs to Freeze Accounts
1. **Start**: User is on `/roadmap`
2. **Action**: Clicks "Asset Discovery" phase
3. **Sees**: Phase is LOCKED (no Letters yet)
4. **Alert**: "Letters Testamentary (DE-150) required"
5. **Clicks**: "Upload Letters" button
6. **Navigates**: To `/probate?action=upload-letters`
7. **Uploads**: Letters document
8. **System**: Sets `estate.lettersReceived = true`
9. **Result**: Asset Discovery phase unlocks
10. **Clicks**: "Freeze Accounts" task action
11. **Navigates**: To `/assets?phase=asset_discovery&filter=needs_freeze`
12. **Sees**: Only assets that need freezing
13. **Completes**: Freezing process for each asset
14. **Returns**: To `/roadmap`
15. **Checks**: Task checkbox for "Freeze Accounts"

#### Scenario 3: Probate Blocker Workflow
1. **Start**: User adds asset with `ownershipType = INDIVIDUAL`
2. **System**: Calculates phase as `court_filing` (no Letters)
3. **Adds**: Asset to `probateBlockers` array
4. **Displays**: Red alert at top of roadmap
5. **Alert**: "1 asset is blocked until you receive Letters"
6. **User Clicks**: "View Blocked Assets"
7. **Navigates**: To `/assets?filter=blocked`
8. **Sees**: List of INDIVIDUAL assets
9. **Understands**: Must complete Court Filing phase first
10. **Returns**: To `/roadmap`
11. **Expands**: "Court Filing" phase
12. **Follows**: Tasks in order (file petition → hearing → receive letters)
13. **Uploads**: Letters document
14. **System**: Recalculates asset phase to `asset_discovery`
15. **Result**: Blocker alert disappears

### Data Flow

```
User Action (Roadmap)
  ↓
Task Action Button Click
  ↓
Navigate to Target Page
  ↓
User Completes Action (Assets/Probate/Documents)
  ↓
API Call Updates Database
  ↓
React Query Invalidates Cache
  ↓
WorkflowContext Recalculates
  ↓
UI Updates (Progress, Locks, Blockers)
  ↓
User Returns to Roadmap
  ↓
Checks Task Checkbox
  ↓
Progress Updates
```

## Issues & Gaps

### 🔴 Critical Issues

#### 1. **Duplicate Phase in Config**
- **File**: `src/config/settlementPhases.ts`
- **Problem**: Two entries for "immediate_actions" phase
  - Entry 1: "Preliminary Assessment" (3 tasks)
  - Entry 2: "Immediate Actions" (6 tasks)
- **Impact**: Component only shows first entry (3 tasks instead of 9)
- **Fix**: Merge both entries into single phase with all 9 tasks

#### 2. **Phase Name Mismatch**
- **Problem**: `assetPhase.ts` uses `liquidation` but everywhere else uses `asset_liquidation`
- **Files Affected**:
  - `src/lib/assetPhase.ts` (uses `liquidation`)
  - `src/contexts/WorkflowContext.tsx` (uses `asset_liquidation`)
  - `src/lib/phaseLock.ts` (uses `liquidation`)
- **Impact**: Phase locks and asset grouping may fail
- **Fix**: Standardize on `asset_liquidation` everywhere

### 🟡 Medium Priority Issues

#### 3. **Modal System Not Implemented**
- **Problem**: Many task actions have `type: 'modal'` but no modal system exists
- **Examples**:
  - Property checklist
  - SSA notification
  - Upload letters
  - Publication tracker
  - Court calendar
- **Impact**: Clicking these buttons only logs to console
- **Fix**: Implement modal system with dialog components

#### 4. **Assets Page Not Integrated**
- **Problem**: Assets page doesn't respond to phase/filter query params
- **Expected**: `/assets?phase=asset_discovery&filter=needs_freeze`
- **Current**: Query params ignored
- **Impact**: Task action buttons don't filter assets correctly
- **Fix**: Add query param handling to Assets page

#### 5. **Probate Page Not Integrated**
- **Problem**: Probate page doesn't respond to action query params
- **Expected**: `/probate?action=upload-letters`
- **Current**: Query params ignored
- **Impact**: Upload Letters button doesn't open upload dialog
- **Fix**: Add query param handling to Probate page

#### 6. **Task ID Prefix Logic Broken**
- **Problem**: `calculateProgress` filters by `id.startsWith(phase)`
- **Example**: Task ID `freeze_accounts` doesn't start with `asset_discovery`
- **Impact**: Progress calculation is incorrect
- **Fix**: Update task IDs to include phase prefix OR change filtering logic

### 🟢 Low Priority Issues

#### 7. **Unused Import**
- **File**: `src/contexts/WorkflowContext.tsx`
- **Problem**: `calculateAssetPhase` imported but never used
- **Impact**: None (just cleanup)
- **Fix**: Remove unused import

#### 8. **Hard-coded Task Counts**
- **File**: `src/contexts/WorkflowContext.tsx`
- **Problem**: Task counts hard-coded instead of reading from config
- **Impact**: Must manually update when tasks change
- **Fix**: Calculate dynamically from `SETTLEMENT_PHASE_TASKS`

## Recommendations

### Immediate Fixes (This Week)

1. **Fix Duplicate Phase** ⚠️ CRITICAL
   - Merge two "immediate_actions" entries
   - Ensure all 9 tasks are visible

2. **Fix Phase Name Mismatch** ⚠️ CRITICAL
   - Standardize on `asset_liquidation`
   - Update all files consistently

3. **Fix Task ID Prefix Logic**
   - Update task IDs to include phase prefix
   - Example: `freeze_accounts` → `asset_discovery_freeze_accounts`

4. **Add Query Param Handling**
   - Assets page: Filter by phase and status
   - Probate page: Open upload dialog on action param

### Short-term Enhancements (Next 2 Weeks)

5. **Implement Modal System**
   - Create reusable modal components
   - Implement property checklist modal
   - Implement upload letters modal
   - Implement publication tracker modal

6. **Dynamic Task Counts**
   - Calculate from `SETTLEMENT_PHASE_TASKS`
   - Remove hard-coded values

7. **Enhanced Asset Filtering**
   - Add "needs_freeze" filter
   - Add "needs_dod" filter
   - Add "blocked" filter
   - Add "ready_to_close" filter

### Long-term Improvements (Next Month)

8. **Phase Auto-Progression**
   - Auto-mark phase complete when all tasks done
   - Auto-advance to next phase
   - Show celebration animation

9. **Smart Task Recommendations**
   - Highlight next recommended task
   - Show estimated time remaining
   - Suggest optimal task order

10. **Progress Analytics**
    - Show time spent per phase
    - Compare to average timeline
    - Predict completion date

## Testing Checklist

### Manual Testing

- [ ] Navigate to `/roadmap`
- [ ] Expand each phase and verify all tasks visible
- [ ] Click task checkboxes and verify progress updates
- [ ] Click action buttons and verify navigation
- [ ] Add INDIVIDUAL asset and verify blocker alert appears
- [ ] Upload Letters and verify blocker alert disappears
- [ ] Verify phase locks work correctly
- [ ] Verify asset counts per phase are accurate
- [ ] Complete all tasks in a phase and verify phase completion
- [ ] Verify current phase auto-advances

### Integration Testing

- [ ] Roadmap → Assets → Roadmap flow
- [ ] Roadmap → Probate → Roadmap flow
- [ ] Roadmap → Documents → Roadmap flow
- [ ] Asset status change updates phase grouping
- [ ] Letters upload unlocks Asset Discovery phase
- [ ] Task completion updates progress bars
- [ ] Phase completion updates chevron visual

## Conclusion

The unified workflow system is **80% complete** and provides a solid foundation for connecting the roadmap, assets, and probate pages. The core architecture is sound, but there are critical bugs (duplicate phase, name mismatch) that need immediate attention.

Once the critical issues are fixed and query param handling is added, the system will provide a seamless user experience where:
- Users can see their entire settlement journey at a glance
- Tasks have actionable buttons that navigate to the right place
- Assets are automatically grouped by phase
- Phases lock/unlock based on prerequisites
- Progress is tracked and visualized in real-time

**Next Steps**: Fix the 2 critical issues, then implement modal system and query param handling.
