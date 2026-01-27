# Antigravity Phased Roadmap Alignment Plan

## Executive Summary

This document maps Antigravity's 6-phase legal roadmap recommendations against our current implementation and identifies gaps that need to be filled.

## Current State vs. Antigravity Recommendations

### ✅ WHAT WE HAVE (Implemented)

1. **Settlement Phase Chevron** - Visual 6-phase roadmap
2. **Phase Task Lists** - 30+ tasks across all phases
3. **Task Tracking** - Checkboxes and progress indicators
4. **Dashboard Integration** - Roadmap visible on main dashboard
5. **Full Roadmap Page** - Dedicated `/roadmap` experience

### ❌ WHAT WE'RE MISSING (Antigravity Gaps)

## PHASE 0: IMMEDIATE ACTIONS (Week 1-2)

### Current Implementation
- ✅ Task list with 6 immediate action tasks
- ✅ Alerts and warnings embedded in tasks
- ✅ Required documents tracking

### Missing Features (Antigravity Recommendations)
- ❌ **Practical Kit Checklist Module**
  - Property Security tracking (lock changes, timers)
  - Pet Care temporary housing tracker
  - Mail Forwarding setup wizard
  
- ❌ **Early Notifier System**
  - Pre-configured SSA notification template
  - Former employer notification templates
  - Utility notification templates
  - One-click send functionality

### Implementation Priority: 🔴 HIGH
**Why**: These are the first things executors need. Without automation, they're overwhelmed.

---

## PHASE 1: COURT FILING (Week 3-8)

### Current Implementation
- ✅ Task list with 5 court filing tasks
- ✅ Links to court forms
- ✅ Hearing date reminders in tasks

### Missing Features (Antigravity Recommendations)
- ❌ **Form Generator (DE-111)**
  - Auto-populate Petition for Probate
  - Pull data from estate profile
  - Generate PDF ready for filing
  
- ❌ **Court Calendar Module**
  - Track hearing dates
  - Track publication deadlines
  - Countdown timers for critical dates
  - Calendar integration (Google/Outlook)
  
- ❌ **Authority Hub Enhancement**
  - Explicit "Letters Received" gate
  - Block Phase 2+ actions until Letters obtained
  - Upload and store Letters (DE-150)
  - Verify Letters before proceeding

### Implementation Priority: 🔴 HIGH
**Why**: Form generation is THE killer feature. Saves 2-4 hours of manual work.

---

## PHASE 2: ASSET DISCOVERY & VALUATION (Month 2-4)

### Current Implementation
- ✅ Task list with 5 asset discovery tasks
- ✅ Asset Ledger (existing feature)
- ✅ Document upload capability

### Missing Features (Antigravity Recommendations)
- ❌ **Asset Ledger Enhancements**
  - "Freeze Account" action button per asset
  - "Freeze Status" field (Pending, Frozen, Unfrozen)
  - "Date of Death (DOD) Value" field
  - "Proof of Valuation" document upload
  - "Appraisal Status" tracking (Hired, In Progress, Complete)
  - Appraisal document storage
  
- ❌ **Inventory Generator (DE-160)**
  - Export all assets to DE-160 format
  - Auto-calculate total estate value
  - Generate court-ready PDF
  - Track submission status

### Implementation Priority: 🟡 MEDIUM
**Why**: Asset ledger exists but needs enhancements. DE-160 generator is valuable but not urgent.

---

## PHASE 3: CREDITOR CLAIMS (Month 4-8)

### Current Implementation
- ✅ Task list with 5 creditor claim tasks
- ✅ Guidance on claim review and rejection

### Missing Features (Antigravity Recommendations)
- ❌ **Liabilities Ledger** (NEW MODULE)
  - Track all estate debts
  - Categories: Mortgage, Credit Cards, Medical, Funeral, Taxes
  - Amount, creditor, due date, status
  - Link to claim documents
  
- ❌ **Claims Priority Engine** (NEW FEATURE)
  - Auto-rank claims by California priority law
  - Priority 1: Funeral expenses
  - Priority 2: Administration costs
  - Priority 3: Secured debts (mortgage)
  - Priority 4: Taxes
  - Priority 5: Unsecured debts (credit cards)
  - Prevent payment of lower priority until higher paid
  
- ❌ **Rejection Workflow**
  - Generate formal Claim Rejection letters
  - Track rejection reasons
  - Log rejection dates
  - Monitor appeal deadlines

### Implementation Priority: 🟡 MEDIUM
**Why**: Critical for legal compliance but happens later in process. Can be built after Phase 0-1 features.

---

## PHASE 4: ASSET LIQUIDATION (Month 6-12)

### Current Implementation
- ✅ Task list with 5 liquidation tasks
- ✅ Tax filing reminders

### Missing Features (Antigravity Recommendations)
- ❌ **Liquidation Tracking Module**
  - Track sale of real estate (listing, offers, closing)
  - Track vehicle sales
  - Track personal property sales
  - Sale price vs. DOD value comparison
  - Capital gains/loss calculation
  
- ❌ **Tax Management Module**
  - Form 1040 (final personal) checklist
  - Form 1041 (estate income) checklist
  - Form 706 (estate tax) if applicable
  - Tax deadline tracking
  - Tax document upload
  
- ❌ **Accounting Hub Enhancement**
  - Track ALL estate income (interest, dividends, sales)
  - Track ALL estate expenses (funeral, legal, maintenance)
  - Categorize by IRS categories
  - Generate accounting report for court
  - Export to Excel/PDF

### Implementation Priority: 🟢 LOW
**Why**: Happens 6-12 months in. Can be built after earlier phases proven.

---

## PHASE 5: FINAL DISTRIBUTION (Month 12-18)

### Current Implementation
- ✅ Task list with 5 final distribution tasks
- ✅ Guidance on distribution and closing

### Missing Features (Antigravity Recommendations)
- ❌ **Distribution Petition Tool**
  - Generate Petition for Final Distribution
  - Auto-populate from estate data
  - Include final accounting
  - Generate court-ready PDF
  
- ❌ **Receipt Tracker**
  - Log each heir's receipt of distribution
  - Track signature dates
  - Store signed receipts
  - Generate "all receipts received" report
  - Release executor liability
  
- ❌ **Closing Statement Generator**
  - Generate final estate closing statement
  - Summary of all transactions
  - Proof of distributions
  - Court filing ready
  - Archive for executor records

### Implementation Priority: 🟢 LOW
**Why**: Final phase, 12-18 months out. Build after earlier phases validated.

---

## Implementation Roadmap

### Sprint 1: Phase 0 Enhancements (Week 1-2)
**Goal**: Make immediate actions actionable

1. **Practical Kit Checklist Module**
   - [ ] Create `PracticalKitChecklist.tsx` component
   - [ ] Add property security checklist
   - [ ] Add pet care tracker
   - [ ] Add mail forwarding wizard
   - [ ] Integrate into Dashboard

2. **Early Notifier System**
   - [ ] Create notification templates (SSA, employers, utilities)
   - [ ] Build `NotificationWizard.tsx` component
   - [ ] Add email/print functionality
   - [ ] Track notification status

**Deliverable**: Executors can complete Week 1-2 tasks without leaving app

---

### Sprint 2: Phase 1 Form Generation (Week 3-4)
**Goal**: Automate court filing

1. **DE-111 Form Generator**
   - [ ] Create `DE111Generator.tsx` component
   - [ ] Map estate data to form fields
   - [ ] Generate PDF with pdf-lib
   - [ ] Add preview and download
   - [ ] Track filing status

2. **Court Calendar Module**
   - [ ] Create `CourtCalendar.tsx` component
   - [ ] Add hearing date tracking
   - [ ] Add publication deadline tracking
   - [ ] Add countdown timers
   - [ ] Calendar export (iCal format)

3. **Authority Hub Gate**
   - [ ] Add "Letters Received" checkbox to estate
   - [ ] Block Phase 2+ until Letters received
   - [ ] Add Letters upload
   - [ ] Show gate status in roadmap

**Deliverable**: Executors can generate DE-111 and track court deadlines

---

### Sprint 3: Phase 2 Asset Enhancements (Week 5-6)
**Goal**: Enhance asset tracking

1. **Asset Ledger Enhancements**
   - [ ] Add "Freeze Status" field to Asset model
   - [ ] Add "DOD Value" field
   - [ ] Add "Appraisal Status" field
   - [ ] Add "Freeze Account" action button
   - [ ] Add proof of valuation upload

2. **DE-160 Inventory Generator**
   - [ ] Create `DE160Generator.tsx` component
   - [ ] Export assets to DE-160 format
   - [ ] Calculate total estate value
   - [ ] Generate court-ready PDF
   - [ ] Track submission

**Deliverable**: Executors can track asset freezing and generate DE-160

---

### Sprint 4: Phase 3 Creditor Management (Week 7-8)
**Goal**: Manage liabilities legally

1. **Liabilities Ledger**
   - [ ] Create Liability model (Prisma schema)
   - [ ] Create `LiabilitiesLedger.tsx` component
   - [ ] Add CRUD operations
   - [ ] Link to claim documents
   - [ ] Track payment status

2. **Claims Priority Engine**
   - [ ] Create `priorityEngine.ts` service
   - [ ] Implement California priority rules
   - [ ] Add priority validation
   - [ ] Prevent out-of-order payments
   - [ ] Show priority warnings

3. **Rejection Workflow**
   - [ ] Create rejection letter templates
   - [ ] Build `ClaimRejection.tsx` component
   - [ ] Generate rejection letters
   - [ ] Track rejection dates
   - [ ] Monitor appeal deadlines

**Deliverable**: Executors can manage creditor claims legally

---

### Sprint 5: Phase 4 Liquidation (Week 9-10)
**Goal**: Track sales and taxes

1. **Liquidation Tracking**
   - [ ] Add "Sale Status" to Asset model
   - [ ] Create `LiquidationTracker.tsx` component
   - [ ] Track sale process (listing → offer → closing)
   - [ ] Calculate gains/losses
   - [ ] Link to sale documents

2. **Tax Management**
   - [ ] Create `TaxManagement.tsx` component
   - [ ] Add Form 1040 checklist
   - [ ] Add Form 1041 checklist
   - [ ] Add Form 706 checklist (if needed)
   - [ ] Track tax deadlines
   - [ ] Upload tax documents

3. **Accounting Hub**
   - [ ] Create Transaction model
   - [ ] Build `AccountingHub.tsx` component
   - [ ] Track income and expenses
   - [ ] Categorize by IRS categories
   - [ ] Generate accounting report
   - [ ] Export to Excel/PDF

**Deliverable**: Executors can track liquidation and prepare taxes

---

### Sprint 6: Phase 5 Final Distribution (Week 11-12)
**Goal**: Close estate properly

1. **Distribution Petition Tool**
   - [ ] Create `DistributionPetition.tsx` component
   - [ ] Generate petition from data
   - [ ] Include final accounting
   - [ ] Generate court-ready PDF

2. **Receipt Tracker**
   - [ ] Create Receipt model
   - [ ] Build `ReceiptTracker.tsx` component
   - [ ] Log heir receipts
   - [ ] Store signed documents
   - [ ] Generate completion report

3. **Closing Statement**
   - [ ] Create `ClosingStatement.tsx` component
   - [ ] Generate final statement
   - [ ] Summary of all transactions
   - [ ] Archive for records

**Deliverable**: Executors can close estate and release liability

---

## Database Schema Changes

### New Tables Needed

```prisma
// Liabilities (Phase 3)
model Liability {
  id              String   @id @default(uuid())
  estateId        String
  estate          Estate   @relation(fields: [estateId], references: [id])
  type            String   // MORTGAGE, CREDIT_CARD, MEDICAL, FUNERAL, TAX
  creditorName    String
  amount          Decimal
  priority        Int      // 1-5 based on California law
  status          String   // PENDING, APPROVED, REJECTED, PAID
  claimDate       DateTime?
  dueDate         DateTime?
  paidDate        DateTime?
  paidAmount      Decimal?
  rejectionReason String?
  rejectionDate   DateTime?
  documentUrl     String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

// Transactions (Phase 4)
model Transaction {
  id          String   @id @default(uuid())
  estateId    String
  estate      Estate   @relation(fields: [estateId], references: [id])
  type        String   // INCOME, EXPENSE
  category    String   // IRS categories
  description String
  amount      Decimal
  date        DateTime
  payee       String?
  documentUrl String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// Distribution Receipts (Phase 5)
model DistributionReceipt {
  id            String   @id @default(uuid())
  estateId      String
  estate        Estate   @relation(fields: [estateId], references: [id])
  heirId        String
  heir          Heir     @relation(fields: [heirId], references: [id])
  amount        Decimal
  description   String
  receivedDate  DateTime
  signedDate    DateTime?
  receiptUrl    String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

### Existing Table Enhancements

```prisma
// Asset enhancements (Phase 2)
model Asset {
  // ... existing fields ...
  freezeStatus      String?   // PENDING, FROZEN, UNFROZEN
  frozenDate        DateTime?
  dodValue          Decimal?
  dodValueProofUrl  String?
  appraisalStatus   String?   // NOT_NEEDED, HIRED, IN_PROGRESS, COMPLETE
  appraisalDate     DateTime?
  appraisalUrl      String?
  
  // Liquidation tracking (Phase 4)
  saleStatus        String?   // NOT_FOR_SALE, LISTED, OFFER, CLOSING, SOLD
  listingDate       DateTime?
  saleDate          DateTime?
  salePrice         Decimal?
  capitalGain       Decimal?
}

// Estate enhancements (Phase 1)
model Estate {
  // ... existing fields ...
  lettersReceived   Boolean   @default(false)
  lettersDate       DateTime?
  lettersUrl        String?
  courtCaseNumber   String?
  hearingDate       DateTime?
  publicationDate   DateTime?
}
```

---

## Verification Plan (Antigravity Requirements)

### 1. Legal Workflow Test
**Objective**: Walk through mock estate from Phase 0 to Phase 5

**Test Scenario**: John Doe Estate
- Deceased: John Doe, died 1/1/2026
- Assets: House ($500K), Bank ($50K), 401k ($100K)
- Debts: Mortgage ($200K), Credit Card ($5K), Funeral ($10K)
- Heirs: 2 children (50% each)

**Test Steps**:
1. ✅ Phase 0: Complete practical kit checklist
2. ✅ Phase 0: Send SSA notification
3. ✅ Phase 1: Generate DE-111 form
4. ✅ Phase 1: Track hearing date
5. ✅ Phase 1: Upload Letters (DE-150)
6. ✅ Phase 2: Freeze all accounts
7. ✅ Phase 2: Get DOD values
8. ✅ Phase 2: Generate DE-160 inventory
9. ✅ Phase 3: Add liabilities
10. ✅ Phase 3: Verify priority engine (funeral before credit card)
11. ✅ Phase 3: Pay debts in correct order
12. ✅ Phase 4: Track house sale
13. ✅ Phase 4: Complete tax checklists
14. ✅ Phase 5: Generate distribution petition
15. ✅ Phase 5: Log heir receipts
16. ✅ Phase 5: Generate closing statement

**Success Criteria**: Complete all steps without errors, all forms generated correctly

---

### 2. Form Accuracy Test
**Objective**: Validate DE-111 and DE-160 PDFs meet California court standards

**Test Cases**:
- [ ] DE-111 has all required fields
- [ ] DE-111 matches official court template layout
- [ ] DE-111 fonts and spacing match court requirements
- [ ] DE-111 can be printed and filed
- [ ] DE-160 lists all assets correctly
- [ ] DE-160 calculates total value correctly
- [ ] DE-160 includes appraisal attachments
- [ ] DE-160 matches official court template

**Success Criteria**: Forms accepted by court clerk (or pass visual inspection by attorney)

---

### 3. Priority Engine Logic Test
**Objective**: Verify Claims Priority Engine prevents incorrect payments

**Test Scenarios**:

**Scenario 1: Funeral Unpaid**
- Liabilities: Funeral ($10K unpaid), Credit Card ($5K unpaid)
- Action: Try to pay Credit Card
- Expected: ❌ Blocked with error "Must pay Funeral Expenses (Priority 1) before Credit Card (Priority 5)"

**Scenario 2: Correct Order**
- Liabilities: Funeral ($10K), Admin ($2K), Mortgage ($200K), Tax ($15K), Credit Card ($5K)
- Action: Pay in order: Funeral → Admin → Mortgage → Tax → Credit Card
- Expected: ✅ All payments allowed

**Scenario 3: Skip Priority**
- Liabilities: Funeral ($10K paid), Admin ($2K unpaid), Mortgage ($200K unpaid)
- Action: Try to pay Mortgage
- Expected: ❌ Blocked with error "Must pay Administration Costs (Priority 2) before Mortgage (Priority 3)"

**Success Criteria**: All scenarios pass, no incorrect payments allowed

---

## File Structure (New Components)

```
src/
├── components/
│   ├── phase0/
│   │   ├── PracticalKitChecklist.tsx
│   │   └── NotificationWizard.tsx
│   ├── phase1/
│   │   ├── DE111Generator.tsx
│   │   ├── CourtCalendar.tsx
│   │   └── AuthorityGate.tsx
│   ├── phase2/
│   │   ├── AssetFreezeTracker.tsx
│   │   └── DE160Generator.tsx
│   ├── phase3/
│   │   ├── LiabilitiesLedger.tsx
│   │   ├── ClaimsPriorityEngine.tsx
│   │   └── ClaimRejectionWorkflow.tsx
│   ├── phase4/
│   │   ├── LiquidationTracker.tsx
│   │   ├── TaxManagement.tsx
│   │   └── AccountingHub.tsx
│   └── phase5/
│       ├── DistributionPetition.tsx
│       ├── ReceiptTracker.tsx
│       └── ClosingStatement.tsx
├── services/
│   ├── formGenerator.ts
│   ├── priorityEngine.ts
│   └── pdfGenerator.ts
└── lib/
    └── californiaLaw.ts (priority rules)
```

---

## Success Metrics

### Quantitative
- [ ] 90% of executors complete Phase 0 checklist
- [ ] 80% of executors use DE-111 generator
- [ ] 100% of payments follow priority rules (no violations)
- [ ] 70% of executors complete all 6 phases
- [ ] Average time to settlement: 12-15 months (vs. 18-24 industry average)

### Qualitative
- [ ] Executors report feeling "guided" not "lost"
- [ ] Attorneys approve generated forms
- [ ] Court clerks accept generated forms
- [ ] Executors understand priority rules
- [ ] Executors feel confident in legal compliance

---

## Risk Assessment

### High Risk
- **Form Generation Accuracy**: If forms are wrong, executors face court rejection
  - Mitigation: Attorney review, extensive testing, disclaimer
  
- **Priority Engine Bugs**: If engine allows wrong payments, executor personally liable
  - Mitigation: Comprehensive test suite, legal review, warnings

### Medium Risk
- **Scope Creep**: 6 phases × multiple features = large project
  - Mitigation: Phased rollout, MVP first, iterate

- **Legal Liability**: Giving legal guidance without being attorneys
  - Mitigation: Disclaimers, "informational only", attorney review

### Low Risk
- **User Adoption**: Users may not use all features
  - Mitigation: Onboarding, tutorials, progressive disclosure

---

## Conclusion

Antigravity's recommendations are comprehensive and legally sound. Our current implementation covers the **visual roadmap and task tracking** but is missing the **actionable tools and automation** that make the roadmap truly valuable.

**Priority Order**:
1. 🔴 Phase 0 & 1 (Immediate Actions + Court Filing) - Highest impact
2. 🟡 Phase 2 & 3 (Asset Discovery + Creditor Claims) - Legal compliance
3. 🟢 Phase 4 & 5 (Liquidation + Distribution) - Later in process

**Estimated Timeline**: 12 weeks (3 months) for full implementation

**Next Step**: Create detailed specs for Phase 0 & 1 features

---

**Created**: January 27, 2026  
**Last Updated**: January 27, 2026  
**Version**: 1.0
