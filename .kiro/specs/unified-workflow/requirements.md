# Unified Workflow Integration - Requirements

## Problem Statement

**Current State**: The application has three disconnected experiences:
1. **Roadmap** - Shows 6 phases and 30+ tasks but doesn't connect to actual work
2. **Assets Page** - Shows assets but no context of which roadmap phase they're in
3. **Probate Page** - Critical legal workflow sitting in isolation

**User Pain**: Executors don't know:
- "Which assets need attention for THIS phase?"
- "What probate step unlocks my asset work?"
- "How do I complete this roadmap task?"

**Business Impact**: Users see a fancy to-do list with no actionable workflow. Not monetizable.

---

## Vision

**Unified Workflow**: The roadmap becomes the central nervous system that:
1. **Filters assets by phase** - "Phase 1: Court Filing" shows only assets blocked by probate
2. **Links tasks to actions** - Click "File DE-111" → Opens Probate Wizard
3. **Shows blockers** - "3 assets waiting for Letters" with direct links
4. **Guides next steps** - "Complete probate to unlock 5 assets"

---

## User Stories

### 1. As an executor, I want to see which assets are relevant to my current phase
**Acceptance Criteria**:
- [ ] Roadmap shows asset count per phase (e.g., "Phase 2: 5 assets need DOD values")
- [ ] Clicking a phase filters the Assets page to show only relevant assets
- [ ] Asset cards show which phase they're in
- [ ] Dashboard shows "Current Phase Focus" with filtered asset list

### 2. As an executor, I want roadmap tasks to be actionable, not just checkboxes
**Acceptance Criteria**:
- [ ] Task "File DE-111 Petition" has a button → Opens Probate Wizard
- [ ] Task "Freeze all accounts" has a button → Opens Assets page filtered to "Needs Freeze"
- [ ] Task "Get DOD values" has a button → Opens Assets page filtered to "Needs Valuation"
- [ ] Task "Upload Letters" has a button → Opens Document Upload
- [ ] Completing the action auto-checks the task

### 3. As an executor, I want to understand probate blockers
**Acceptance Criteria**:
- [ ] Dashboard shows "Probate Gate: 3 assets blocked until Letters received"
- [ ] Clicking blocker opens Probate Hub with clear next steps
- [ ] Assets page shows "Blocked by Probate" badge on INDIVIDUAL ownership assets
- [ ] Roadmap Phase 2+ shows lock icon until Phase 1 complete

### 4. As an executor, I want the roadmap to guide me through the entire process
**Acceptance Criteria**:
- [ ] Roadmap shows "Start Here" on current phase
- [ ] Completed phases show checkmark and collapse
- [ ] Future phases show lock icon with unlock condition
- [ ] Each task shows estimated time and difficulty

### 5. As an executor, I want to see my progress in context
**Acceptance Criteria**:
- [ ] Dashboard shows "Phase 1: 3/5 tasks complete"
- [ ] Assets page shows "Phase 2 Ready: 2 assets | Phase 2 Blocked: 3 assets"
- [ ] Probate page shows "Unlock 5 assets by completing this step"

---

## Functional Requirements

### FR-1: Phase-Based Asset Filtering

**Description**: Assets are tagged with their current phase based on status and blockers.

**Logic**:
```typescript
function getAssetPhase(asset: Asset, estate: Estate): SettlementPhase {
  // Phase 0: All assets (immediate actions)
  if (asset.status === 'DISCOVERED') return 'immediate_actions';
  
  // Phase 1: Assets blocked by probate
  if (asset.ownershipType === 'INDIVIDUAL' && !estate.lettersReceived) {
    return 'court_filing';
  }
  
  // Phase 2: Assets ready for discovery/valuation
  if (asset.status === 'CONTACTED' || asset.status === 'NOTIFIED') {
    return 'asset_discovery';
  }
  
  // Phase 3: Assets with creditor claims
  if (asset.status === 'IN_REVIEW' || asset.status === 'CLAIM_FILED') {
    return 'creditor_claims';
  }
  
  // Phase 4: Assets ready for liquidation
  if (asset.status === 'APPROVED' || asset.status === 'READY_TO_DISTRIBUTE') {
    return 'liquidation';
  }
  
  // Phase 5: Distributed assets
  if (asset.status === 'DISTRIBUTED' || asset.status === 'CLOSED') {
    return 'final_distribution';
  }
  
  return 'immediate_actions'; // Default
}
```

**UI Changes**:
- Asset cards show phase badge (e.g., "Phase 2: Discovery")
- Assets page has phase filter dropdown
- Dashboard shows asset breakdown by phase

---

### FR-2: Actionable Task Buttons

**Description**: Each roadmap task has a primary action button that opens the relevant page/modal.

**Task → Action Mapping**:

**Phase 0: Immediate Actions**
- "Secure property and change locks" → Opens checklist modal
- "Notify Social Security Administration" → Opens notification wizard
- "Forward mail to executor address" → Opens USPS form helper

**Phase 1: Court Filing**
- "File DE-111 Petition for Probate" → Opens `/probate/petition-wizard`
- "Publish legal notice in newspaper" → Opens publication tracker
- "Attend probate hearing" → Opens court calendar
- "Upload Letters Testamentary (DE-150)" → Opens document upload modal
- "Order certified copies of Letters" → Opens copy tracker

**Phase 2: Asset Discovery**
- "Identify all financial accounts" → Opens `/assets` with "Add Asset" modal
- "Freeze all accounts" → Opens `/assets` filtered to "Needs Freeze" + batch action
- "Request date-of-death values" → Opens `/assets` filtered to "Needs DOD Value"
- "Order property appraisals" → Opens appraisal tracker
- "Generate DE-160 Inventory" → Opens DE-160 generator

**Phase 3: Creditor Claims**
- "Publish creditor notice" → Opens publication tracker
- "Review incoming claims" → Opens claims ledger
- "Pay priority debts" → Opens liabilities ledger with priority engine
- "Reject invalid claims" → Opens rejection workflow

**Phase 4: Liquidation**
- "List real estate for sale" → Opens liquidation tracker
- "Sell vehicles and personal property" → Opens liquidation tracker
- "File final tax returns" → Opens tax management
- "Generate accounting report" → Opens accounting hub

**Phase 5: Final Distribution**
- "File petition for final distribution" → Opens distribution petition generator
- "Distribute assets to heirs" → Opens distribution tracker
- "Collect signed receipts" → Opens receipt tracker
- "File closing statement" → Opens closing statement generator

**Implementation**:
```typescript
interface RoadmapTask {
  id: string;
  title: string;
  description: string;
  action?: {
    type: 'navigate' | 'modal' | 'external';
    target: string; // URL or modal ID
    label: string; // Button text
    icon?: string;
  };
  estimatedTime?: string; // "15 min", "2 hours"
  difficulty?: 'easy' | 'medium' | 'hard';
}
```

---

### FR-3: Probate Gate System

**Description**: Phase 2+ tasks are locked until probate authority is granted.

**Logic**:
```typescript
function isPhaseLocked(phase: SettlementPhase, estate: Estate): boolean {
  if (phase === 'immediate_actions' || phase === 'court_filing') {
    return false; // Always accessible
  }
  
  // Phase 2+ requires Letters
  return !estate.lettersReceived;
}

function getPhaseUnlockCondition(phase: SettlementPhase): string {
  switch (phase) {
    case 'asset_discovery':
      return 'Upload Letters Testamentary (DE-150) to unlock';
    case 'creditor_claims':
      return 'Complete asset discovery to unlock';
    case 'liquidation':
      return 'Resolve all creditor claims to unlock';
    case 'final_distribution':
      return 'Complete liquidation to unlock';
    default:
      return '';
  }
}
```

**UI Changes**:
- Locked phases show lock icon
- Clicking locked phase shows modal: "This phase is locked. [Unlock condition]. [Go to Probate Hub]"
- Dashboard shows "Probate Blocker" alert with asset count
- Assets page shows "Blocked by Probate" badge on affected assets

---

### FR-4: Context-Aware Navigation

**Description**: Navigation between pages maintains context (phase, filters, selected asset).

**URL Structure**:
```
/roadmap?phase=court_filing
/assets?phase=asset_discovery&status=needs_dod_value
/probate?returnTo=/roadmap&phase=court_filing
/asset/:id?fromPhase=asset_discovery
```

**Breadcrumb Navigation**:
```
Roadmap > Phase 2: Asset Discovery > 5 Assets Need Attention
```

**Implementation**:
- Use URL query params to maintain state
- Add breadcrumb component
- Add "Back to Roadmap" button on Assets/Probate pages
- Preserve filters when navigating

---

### FR-5: Progress Indicators

**Description**: Show progress within each phase and overall.

**Metrics**:
- Phase completion: "Phase 1: 4/5 tasks complete (80%)"
- Asset progress: "Phase 2: 2/5 assets ready, 3/5 blocked"
- Overall progress: "Overall: 12/30 tasks complete (40%)"

**UI Components**:
- Progress bar on each phase card
- Asset count badges on phase cards
- Dashboard summary widget

---

## Non-Functional Requirements

### NFR-1: Performance
- Phase filtering should be instant (< 100ms)
- Asset page should load filtered view in < 500ms
- No full page reloads when navigating between phases

### NFR-2: Mobile Responsiveness
- Phase cards should stack vertically on mobile
- Action buttons should be thumb-friendly (min 44px height)
- Filters should be accessible via bottom sheet on mobile

### NFR-3: Accessibility
- Locked phases should announce "Locked: [condition]" to screen readers
- Action buttons should have clear aria-labels
- Keyboard navigation should work for all phase interactions

---

## User Experience Flow

### Scenario 1: New Executor Starting Out

1. **Dashboard** - Shows "Start Here: Phase 0 - Immediate Actions"
2. **Click Phase 0** - Opens roadmap with Phase 0 expanded
3. **See Task**: "Secure property and change locks"
4. **Click "Open Checklist"** - Modal opens with checklist
5. **Complete checklist** - Task auto-checks
6. **See Next Task**: "File DE-111 Petition"
7. **Click "Start Petition"** - Opens Probate Wizard
8. **Complete wizard** - Downloads DE-111 PDF
9. **Check task** - Phase 1 progress updates to 1/5

### Scenario 2: Executor with Assets Blocked by Probate

1. **Dashboard** - Shows "Probate Blocker: 3 assets waiting for Letters"
2. **Click blocker alert** - Opens Probate Hub
3. **See status**: "Letters not yet received"
4. **Click "Upload Letters"** - Opens document upload
5. **Upload DE-150** - System detects Letters
6. **Automatic unlock** - Phase 2 unlocks, 3 assets move to "Ready"
7. **Dashboard updates** - "Phase 2: 3 assets need DOD values"
8. **Click "Get DOD Values"** - Opens Assets page filtered to "Needs DOD Value"

### Scenario 3: Executor Working Through Phase 2

1. **Roadmap** - Phase 2 expanded, shows "5 assets need attention"
2. **Click "Request DOD Values"** - Opens Assets page filtered
3. **See 5 assets** - Each shows "Phase 2: Needs DOD Value"
4. **Click asset** - Opens asset detail
5. **Log communication** - "Requested DOD statement from Chase"
6. **Asset status updates** - Moves to "In Review"
7. **Return to roadmap** - Asset count updates to "4 assets need attention"

---

## Success Metrics

### Quantitative
- [ ] 80%+ of users complete Phase 0 tasks (vs. 40% current)
- [ ] Average time to Phase 1 completion: < 2 weeks (vs. 4 weeks current)
- [ ] 90%+ of users understand probate blockers (vs. 50% current)
- [ ] Task completion rate: 70%+ (vs. 30% current)

### Qualitative
- [ ] Users report feeling "guided" not "lost"
- [ ] Users understand which assets need attention
- [ ] Users know how to complete each task
- [ ] Users see clear progress toward completion

---

## Out of Scope (Future Enhancements)

- AI agent suggesting next tasks
- Automatic phase progression
- Smart task reordering based on dependencies
- Multi-estate management
- Collaborative executor workflows

---

## Dependencies

- Existing roadmap implementation
- Existing assets page
- Existing probate hub
- Estate schema with `lettersReceived` field
- Asset schema with status tracking

---

## Risks & Mitigations

### Risk 1: Complex State Management
**Mitigation**: Use URL query params for filters, React Context for shared state

### Risk 2: Performance with Large Asset Lists
**Mitigation**: Implement pagination, virtual scrolling for 100+ assets

### Risk 3: User Confusion with Phase Logic
**Mitigation**: Clear unlock conditions, tooltips, onboarding tour

---

## Open Questions

1. Should we auto-advance phases or require manual progression?
2. How do we handle assets that span multiple phases?
3. Should we allow skipping phases for advanced users?
4. How do we handle estates that don't require probate?

---

**Created**: January 27, 2026  
**Status**: Draft - Ready for Review  
**Priority**: 🔴 CRITICAL - Blocks monetization
