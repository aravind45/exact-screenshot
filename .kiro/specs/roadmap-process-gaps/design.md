# Settlement Roadmap Process Gaps - Design Document

**Feature Name**: roadmap-process-gaps  
**Created**: February 3, 2026  
**Status**: Design Phase

---

## 1. Executive Summary

### Problem
Current roadmap covers "happy path" probate but misses critical workflows affecting 30-40% of estates. User journey from registration → onboarding → roadmap needs seamless integration of specialized processes.

### Solution
Enhance roadmap with 5 missing process workflows, triggered by onboarding data:
1. **Guardian Ad Litem** (estates with minors)
2. **Primary Residence Succession** (small estates)
3. **Special Notice Procedures** (all estates)
4. **Bond Waiver Process** (optional cost savings)
5. **Contested Probate** (disputed estates)

### User Journey Integration
```
Registration → Onboarding Wizard → Estate Profile Created → Roadmap Generated
     ↓              ↓                      ↓                        ↓
  Auth.tsx    OnboardingWizard.tsx    Estate Data Saved    settlementPhases.ts
                                      (heirs, assets,       (tasks filtered by
                                       estate type)          estate profile)
```

---

## 2. Complete User Journey Map

### Step 1: Registration (Auth.tsx)
**User Actions**:
- Sign up with email/password/name
- Create account

**System Actions**:
- Create user record
- Generate auth token
- Redirect to onboarding

**Data Captured**: email, password, fullName

---

### Step 2: Onboarding Wizard (OnboardingWizard.tsx)

#### Step 2.1: Welcome & Role Selection
**User Actions**: Select "Executor" or "Heir"
**Data Captured**: `role`

#### Step 2.2: Estate Basics
**User Actions**: Enter deceased info, estate details
**Data Captured**:
- `deceasedName`, `dateOfDeath`, `location` (state)
- `estimatedValue`, `estimatedDebt`
- `hasWill`, `isSpouse`, `isOutOfState`
- `hasUnknownHeirs`, `isTrustRevocable`
- `hasTODDeed`, `hasContest`

**System Actions**:
- Calculate authority recommendation
- Determine estate type (SMALL_ESTATE, SPOUSAL_PETITION, FORMAL_PROBATE, etc.)

#### Step 2.3: Track Scout
**User Actions**: Review calculated estate track
**Data Captured**: Confirmation of estate type
**System Actions**: Save `estateType`, `authorityType`

#### Step 2.4: Heirs & Beneficiaries
**User Actions**: Add heirs with details
**Data Captured**: 
- Heir `name`, `relationship`, `email`, `isMinor`
- `hasUnknownHeirs` flag

**🔑 KEY TRIGGER**: If any heir has `isMinor: true` → Enable Guardian Ad Litem tasks

#### Step 2.5: Death Certificate
**User Actions**: Upload death certificate (optional)
**Data Captured**: Death certificate file

#### Step 2.6: Key Assets
**User Actions**: Add primary assets/institutions
**Data Captured**: Asset `name`, `type`, `institutionId`

#### Step 2.7: The Team
**User Actions**: Invite collaborators (optional)
**Data Captured**: Collaborator `email`, `role`

#### Step 2.8: Completion
**System Actions**: 
- Navigate to `/dashboard`
- Display roadmap with personalized tasks

---

### Step 3: Dashboard & Roadmap Display

**Roadmap Personalization Logic**:
```typescript
// Pseudo-code for task filtering
const visibleTasks = SETTLEMENT_PHASE_TASKS.map(phase => ({
  ...phase,
  tasks: phase.tasks.filter(task => {
    // Show all non-optional tasks
    if (!task.isOptional) return true;
    
    // Filter optional tasks based on estate profile
    if (task.id === 'identify_minor_beneficiaries') {
      return estate.heirs.some(h => h.isMinor);
    }
    if (task.id === 'check_primary_residence_succession') {
      return estate.estimatedValue < 100000 && estate.location === 'CA';
    }
    if (task.id === 'request_bond_waiver') {
      return true; // Always show as optional
    }
    if (task.id === 'respond_to_objections') {
      return estate.hasContest;
    }
    
    return task.isOptional; // Show other optional tasks
  })
}));
```

---

## 3. New Tasks to Add to Roadmap

### 3.1 Guardian Ad Litem Process (Minors)

**Trigger**: `estate.heirs.some(h => h.isMinor === true)`

**Tasks to Add**:

```typescript
// Phase 0: Immediate Actions
{
  id: "identify_minor_beneficiaries",
  title: "Identify Minor Beneficiaries",
  description: "Review all heirs and identify any beneficiaries under age 18. Minors require special court protection through a guardian ad litem.",
  estimatedTime: "30 minutes",
  isOptional: false, // Required if minors exist
  applicability: {
    // Only show if minors exist
  },
  alerts: [{
    type: "important",
    message: "Estates with minor beneficiaries require additional court oversight and blocked accounts."
  }]
}
```


// Phase 1: Court Filing
{
  id: "petition_guardian_ad_litem",
  title: "File Petition for Guardian Ad Litem (DE-350)",
  description: "Request court appointment of a guardian ad litem to represent minor beneficiaries' interests throughout probate.",
  estimatedTime: "2-4 hours",
  category: "probate",
  isOptional: false,
  requiredDocs: ["DE-350", "Death Certificate", "Birth Certificates of Minors"],
  dependencies: ["file_petition"],
  links: [{
    label: "Download DE-350",
    url: "https://www.courts.ca.gov/documents/de350.pdf"
  }],
  alerts: [{
    type: "important",
    message: "Guardian ad litem must approve all actions affecting minors' inheritance."
  }]
},
{
  id: "obtain_guardian_order",
  title: "Obtain Guardian Ad Litem Order (DE-351)",
  description: "Receive court order appointing guardian ad litem. Provide guardian with all estate information.",
  estimatedTime: "2-3 weeks",
  category: "court-issued",
  requiredDocs: ["DE-351"],
  dependencies: ["petition_guardian_ad_litem"],
  alerts: [{
    type: "info",
    message: "Guardian ad litem fees are paid by the estate, typically $150-300/hour."
  }]
},

// Phase 2-4: Ongoing coordination
{
  id: "coordinate_with_guardian",
  title: "Coordinate with Guardian Ad Litem",
  description: "Keep guardian informed of all estate actions. Obtain guardian's approval before major decisions affecting minors.",
  estimatedTime: "Ongoing",
  isLongHorizon: true,
  dependencies: ["obtain_guardian_order"],
  alerts: [{
    type: "caution",
    message: "Guardian must review and approve inventory, accounting, and distribution plans."
  }]
},

// Phase 5: Final Distribution
{
  id: "guardian_distribution_approval",
  title: "Obtain Guardian Approval for Distribution",
  description: "Present final distribution plan to guardian ad litem for review and approval before court hearing.",
  estimatedTime: "1-2 weeks",
  dependencies: ["file_final_petition"],
  alerts: [{
    type: "important",
    message: "Guardian will verify that minors' shares are properly protected in blocked accounts."
  }]
}
```

---

### 3.2 Primary Residence Succession (Small Estates)

**Trigger**: `estate.estimatedValue < 100000 && estate.location === 'CA'`

**Tasks to Add**:

```typescript
// Phase 0: Immediate Actions
{
  id: "check_primary_residence_succession",
  title: "Check Primary Residence Succession Eligibility",
  description: "If the estate consists primarily of a primary residence valued under $100,000, you may qualify for simplified succession process (DE-310/315).",
  utility: "Shortcut: Avoid full probate for qualifying primary residences.",
  estimatedTime: "1 hour",
  exclusiveGroup: "filing_path",
  isOptional: true,
  helpArticleId: "primary-residence-succession",
  alerts: [{
    type: "important",
    message: "This process is ONLY for primary residences. Other assets require different procedures."
  }]
},

// Phase 1: Court Filing
{
  id: "file_succession_petition",
  title: "File Petition to Determine Succession (DE-310)",
  description: "File petition with court to determine who inherits the primary residence without full probate.",
  estimatedTime: "2-4 hours",
  category: "probate",
  exclusiveGroup: "filing_path",
  isOptional: true,
  requiredDocs: ["DE-310", "Death Certificate", "Property Deed", "Property Appraisal"],
  links: [{
    label: "Download DE-310",
    url: "https://www.courts.ca.gov/documents/de310.pdf"
  }],
  alerts: [{
    type: "info",
    message: "Filing fee: ~$435. Hearing typically scheduled 30-45 days after filing."
  }]
},
{
  id: "obtain_succession_order",
  title: "Obtain Order Determining Succession (DE-315)",
  description: "Receive court order determining property succession. Record order with county recorder.",
  estimatedTime: "1-2 weeks after hearing",
  category: "court-issued",
  requiredDocs: ["DE-315"],
  dependencies: ["file_succession_petition"],
  alerts: [{
    type: "important",
    message: "Record certified copy of order with county recorder to transfer title."
  }]
}
```

---

### 3.3 Special Notice Procedures

**Trigger**: Always show (used in ~90% of estates)

**Tasks to Add**:

```typescript
// Phase 1: Court Filing
{
  id: "track_special_notice_requests",
  title: "Track Special Notice Requests (DE-154)",
  description: "Maintain list of all parties who have requested special notice. You must serve them copies of ALL court filings.",
  estimatedTime: "Ongoing",
  isLongHorizon: true,
  category: "probate",
  dependencies: ["file_petition"],
  links: [{
    label: "Download DE-154",
    url: "https://www.courts.ca.gov/documents/de154.pdf"
  }],
  alerts: [{
    type: "warning",
    message: "Failure to serve special notice can invalidate court orders. Keep meticulous records."
  }]
},
{
  id: "serve_special_notice_parties",
  title: "Serve All Special Notice Recipients",
  description: "Each time you file a document with the court, serve copies on all parties who requested special notice.",
  estimatedTime: "1-2 hours per filing",
  isLongHorizon: true,
  dependencies: ["track_special_notice_requests"],
  alerts: [{
    type: "important",
    message: "Service must be by mail with proof of service filed with court."
  }]
}
```

---

### 3.4 Bond Waiver Process

**Trigger**: Always show as optional (saves money)

**Tasks to Add**:

```typescript
// Phase 1: Court Filing
{
  id: "request_bond_waiver",
  title: "Request Bond Waiver from Heirs (DE-142)",
  description: "Ask all heirs to sign waivers of bond requirement. Bond costs 0.5-1% of estate value annually.",
  utility: "Cost Savings: Eliminate bond premium (typically $500-$5,000/year).",
  estimatedTime: "1-2 weeks",
  category: "probate",
  isOptional: true,
  requiredDocs: ["DE-142"],
  dependencies: ["file_petition"],
  links: [{
    label: "Download DE-142",
    url: "https://www.courts.ca.gov/documents/de142.pdf"
  }],
  alerts: [{
    type: "info",
    message: "ALL heirs must sign. If even one refuses, bond is required."
  }]
},
{
  id: "file_bond_waiver",
  title: "File Waiver of Bond with Court",
  description: "Submit signed waivers to court and request order waiving bond requirement.",
  estimatedTime: "1 day",
  category: "probate",
  isOptional: true,
  requiredDocs: ["DE-142 (signed)", "DE-143 (proposed order)"],
  dependencies: ["request_bond_waiver"],
  alerts: [{
    type: "important",
    message: "File before probate hearing to avoid bond requirement in initial order."
  }]
},
{
  id: "obtain_bond_waiver_order",
  title: "Obtain Order Waiving Bond (DE-143)",
  description: "Receive court order waiving bond requirement. Saves estate significant ongoing costs.",
  estimatedTime: "At hearing",
  category: "court-issued",
  requiredDocs: ["DE-143"],
  dependencies: ["file_bond_waiver"],
  alerts: [{
    type: "info",
    message: "If bond is waived, you still have full fiduciary liability to heirs."
  }]
}
```

---

### 3.5 Contested Probate Process

**Trigger**: `estate.hasContest === true`

**Tasks to Add**:

```typescript
// Phase 1: Court Filing
{
  id: "respond_to_objections",
  title: "Respond to Objections (DE-115/116)",
  description: "If someone files an objection to the petition or will, you must respond formally and prepare for contest hearing.",
  estimatedTime: "2-4 weeks",
  category: "probate",
  isOptional: true, // Only if objection filed
  requiredDocs: ["Response to Objection"],
  dependencies: ["file_petition"],
  links: [{
    label: "Download DE-115",
    url: "https://www.courts.ca.gov/documents/de115.pdf"
  }],
  alerts: [{
    type: "warning",
    message: "Hire an attorney immediately. Will contests are complex and high-stakes."
  }]
},
{
  id: "attend_contest_hearing",
  title: "Attend Will Contest Hearing",
  description: "Appear in court for hearing on objection. Be prepared to present evidence supporting will validity.",
  estimatedTime: "4-8 hours",
  dependencies: ["respond_to_objections"],
  alerts: [{
    type: "important",
    message: "Bring all witnesses who can testify to decedent's mental capacity and lack of undue influence."
  }]
},
{
  id: "resolve_contest",
  title: "Resolve Will Contest",
  description: "Obtain court ruling on objection. If will is upheld, proceed with probate. If invalidated, estate becomes intestate.",
  estimatedTime: "Varies (can take 6-24 months)",
  isLongHorizon: true,
  dependencies: ["attend_contest_hearing"],
  alerts: [{
    type: "caution",
    message: "Contested probate significantly extends timeline and increases costs. Consider settlement."
  }]
}
```

---

## 4. Task Filtering Logic

### 4.1 Backend API Enhancement

**New Endpoint**: `GET /api/estates/:id/roadmap`

**Response**:
```typescript
{
  estateId: string;
  phases: Array<{
    phase: SettlementPhase;
    title: string;
    tasks: Array<PhaseTask>; // Filtered based on estate profile
  }>;
  triggers: {
    hasMinors: boolean;
    isSmallEstate: boolean;
    isContested: boolean;
    // ... other triggers
  };
}
```

**Filtering Logic**:
```typescript
export function filterTasksForEstate(
  allTasks: PhaseTaskList[],
  estate: Estate
): PhaseTaskList[] {
  const hasMinors = estate.heirs?.some(h => !h.isAdult) || false;
  const isSmallEstate = (estate.estimatedPersonalProperty || 0) < 100000;
  const isContested = estate.hasContest || false;
  const isPrimaryResidence = estate.assets?.some(a => 
    a.assetType === 'real_estate' && a.isPrimaryResidence
  ) || false;

  return allTasks.map(phaseList => ({
    ...phaseList,
    tasks: phaseList.tasks.filter(task => {
      // Always show non-optional tasks
      if (!task.isOptional) return true;

      // Filter based on task ID and estate profile
      switch (task.id) {
        case 'identify_minor_beneficiaries':
        case 'petition_guardian_ad_litem':
        case 'obtain_guardian_order':
        case 'coordinate_with_guardian':
        case 'guardian_distribution_approval':
          return hasMinors;

        case 'check_primary_residence_succession':
        case 'file_succession_petition':
        case 'obtain_succession_order':
          return isSmallEstate && isPrimaryResidence && estate.deceasedState === 'CA';

        case 'respond_to_objections':
        case 'attend_contest_hearing':
        case 'resolve_contest':
          return isContested;

        case 'request_bond_waiver':
        case 'file_bond_waiver':
        case 'obtain_bond_waiver_order':
          return true; // Always show as optional

        case 'track_special_notice_requests':
        case 'serve_special_notice_parties':
          return true; // Always show (common in all estates)

        default:
          return task.isOptional; // Show other optional tasks
      }
    })
  }));
}
```

---

### 4.2 Frontend Integration

**Update**: `src/pages/SettlementRoadmap.tsx`

```typescript
// Fetch filtered roadmap from API
const { data: roadmap } = useQuery({
  queryKey: ['roadmap', estateId],
  queryFn: () => api.getEstateRoadmap(estateId)
});

// Display filtered tasks
<PhaseTaskList
  phase={phase}
  tasks={roadmap.phases.find(p => p.phase === phase)?.tasks || []}
  onTaskComplete={handleTaskComplete}
/>
```

---

## 5. UI/UX Enhancements

### 5.1 Task Badges

**Visual Indicators**:
- 🔴 **Required** - Red badge for critical tasks
- 🟡 **Recommended** - Yellow badge for optional but beneficial tasks
- 🔵 **Conditional** - Blue badge for tasks that appear based on estate profile

**Implementation**:
```typescript
<Badge variant={
  task.isOptional ? "secondary" : "default"
}>
  {task.isOptional ? "Optional" : "Required"}
</Badge>
```

---

### 5.2 Process Explainers

**Expandable Info Sections**:
```typescript
{task.id === 'petition_guardian_ad_litem' && (
  <Collapsible>
    <CollapsibleTrigger>
      <Info className="w-4 h-4" /> Why is this needed?
    </CollapsibleTrigger>
    <CollapsibleContent>
      <p className="text-sm text-muted-foreground">
        California law requires a guardian ad litem to represent minor 
        beneficiaries' interests in probate. This protects minors from 
        potential conflicts of interest and ensures their inheritance is 
        properly managed until they reach age 18.
      </p>
    </CollapsibleContent>
  </Collapsible>
)}
```

---

### 5.3 Progress Tracking

**Enhanced Progress Bar**:
```typescript
const progress = {
  required: tasks.filter(t => !t.isOptional && t.completed).length,
  totalRequired: tasks.filter(t => !t.isOptional).length,
  optional: tasks.filter(t => t.isOptional && t.completed).length,
  totalOptional: tasks.filter(t => t.isOptional).length
};

<div className="space-y-2">
  <div className="flex justify-between text-sm">
    <span>Required Tasks</span>
    <span>{progress.required}/{progress.totalRequired}</span>
  </div>
  <Progress value={(progress.required / progress.totalRequired) * 100} />
  
  <div className="flex justify-between text-sm text-muted-foreground">
    <span>Optional Tasks</span>
    <span>{progress.optional}/{progress.totalOptional}</span>
  </div>
  <Progress 
    value={(progress.optional / progress.totalOptional) * 100}
    className="opacity-50"
  />
</div>
```

---

## 6. Data Model Updates

### 6.1 Estate Model Enhancement

**Add Fields**:
```typescript
interface Estate {
  // ... existing fields ...
  
  // New fields for process triggers
  hasMinorBeneficiaries: boolean;
  hasContest: boolean;
  hasPrimaryResidence: boolean;
  bondWaiverStatus: 'NOT_REQUESTED' | 'REQUESTED' | 'APPROVED' | 'DENIED';
  guardianAdLitemId?: string;
  guardianAdLitemStatus?: 'NOT_NEEDED' | 'PETITION_FILED' | 'APPOINTED';
  specialNoticeParties: Array<{
    name: string;
    address: string;
    requestDate: Date;
  }>;
}
```

---

### 6.2 Task Completion Tracking

**New Model**: `TaskCompletion`

```typescript
interface TaskCompletion {
  id: string;
  estateId: string;
  taskId: string; // e.g., "petition_guardian_ad_litem"
  phase: SettlementPhase;
  completed: boolean;
  completedAt?: Date;
  completedBy?: string; // userId
  notes?: string;
  attachments?: string[]; // URLs to uploaded documents
}
```

---

## 7. Implementation Plan

### Phase 1: Backend (Week 1)
- [ ] Add new fields to Estate model
- [ ] Create TaskCompletion model
- [ ] Implement `filterTasksForEstate()` function
- [ ] Create `/api/estates/:id/roadmap` endpoint
- [ ] Add task completion endpoints

### Phase 2: Roadmap Configuration (Week 1)
- [ ] Add all new tasks to `settlementPhases.ts`
- [ ] Set proper `isOptional`, `dependencies`, `applicability` flags
- [ ] Add form links and help article IDs
- [ ] Test task filtering logic

### Phase 3: Frontend Integration (Week 2)
- [ ] Update SettlementRoadmap.tsx to use filtered API
- [ ] Add task badges (Required/Optional/Conditional)
- [ ] Implement process explainers
- [ ] Enhanced progress tracking
- [ ] Task completion UI

### Phase 4: Onboarding Integration (Week 2)
- [ ] Ensure onboarding captures all trigger data
- [ ] Auto-calculate `hasMinorBeneficiaries` from heirs
- [ ] Set `hasContest` flag from onboarding
- [ ] Detect primary residence from assets

### Phase 5: Testing & Refinement (Week 3)
- [ ] Test all 5 process workflows
- [ ] Verify task filtering for different estate profiles
- [ ] User acceptance testing
- [ ] Bug fixes and polish

---

## 8. Success Metrics

### Quantitative
- Roadmap coverage: 40% → 80%+ of real-world scenarios
- Task completion rate: +15%
- User engagement with roadmap: +20%
- Support tickets about missing processes: -50%

### Qualitative
- Users report feeling "confident" about next steps
- Attorneys recommend roadmap to executor clients
- Users successfully navigate special situations

---

## 9. Open Questions

### Q1: Form Numbering Conflict
**Question**: Is DE-315 "Order for Final Distribution" or "Order Determining Succession"?
**Resolution**: Research California courts website
**Impact**: Medium - affects primary residence succession workflow

### Q2: Guardian Ad Litem Fees
**Question**: Who pays guardian fees - estate or minors?
**Resolution**: Consult California Probate Code Section 1470
**Impact**: Low - informational only

### Q3: Special Notice Scope
**Question**: Does special notice apply to ALL filings or only major ones?
**Resolution**: Research California Probate Code Section 1250
**Impact**: Medium - affects workload estimation

---

## 10. Next Steps

1. ✅ Requirements document complete
2. ✅ Design document complete
3. ⏳ Create tasks.md with implementation checklist
4. ⏳ Begin Phase 1 implementation (backend)
5. ⏳ User review and approval

---

**Document Status**: ✅ Complete  
**Next Phase**: Tasks Document  
**Estimated Effort**: 3 weeks implementation  
**Target Release**: Sprint 7-9
