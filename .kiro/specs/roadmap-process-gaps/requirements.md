# Settlement Roadmap Process Gaps - Requirements

**Feature Name**: roadmap-process-gaps  
**Created**: February 3, 2026  
**Status**: Requirements Phase

---

## 1. Executive Summary

### Problem Statement
Our current settlement roadmap covers the "happy path" probate process but is missing critical workflows for special situations that affect 30-40% of estates:
- Estates with minor beneficiaries (requires guardian ad litem process)
- Primary residence succession (simplified process for estates under $100k)
- Special notice procedures (used in almost all estates)
- Bond waiver processes (optional but common)

The user's insight: **Value is in process guidance, not form collection**. Users can download forms themselves if we show them the clear process roadmap.

### Current State
- 6-phase roadmap with 30+ tasks
- Covers standard probate workflow (petition → letters → inventory → claims → liquidation → distribution)
- Missing specialized processes identified in California Probate Forms audit

### Desired State
- Comprehensive roadmap covering 80%+ of real-world estate scenarios
- Clear guidance for guardian ad litem appointments
- Primary residence succession workflow
- Special notice request procedures
- Process-first approach (not form-first)

---

## 2. User Stories

### US-1: Executor with Minor Beneficiaries
**As an** executor of an estate with minor beneficiaries  
**I want** clear guidance on the guardian ad litem appointment process  
**So that** I can properly protect minors' interests and avoid personal liability

**Acceptance Criteria**:
- AC 1.1: Roadmap identifies when guardian ad litem is required (estates with minors under 18)
- AC 1.2: Task list includes "Petition for Guardian Ad Litem" with clear description
- AC 1.3: Task explains what a guardian ad litem does (represents minor's interests in court)
- AC 1.4: Task includes timeline (typically 2-4 weeks for appointment)
- AC 1.5: Task links to DE-350 and DE-351 forms
- AC 1.6: Alert warns: "Distributions to minors require court approval and blocked accounts"

### US-2: Executor with Small Primary Residence Estate
**As an** executor of an estate with only a primary residence under $100k  
**I want** guidance on the simplified succession process  
**So that** I can avoid full probate and save time/money

**Acceptance Criteria**:
- AC 2.1: Roadmap includes "Check Primary Residence Succession Eligibility" task in Phase 0
- AC 2.2: Task explains eligibility (primary residence, total estate under $100k)
- AC 2.3: Task is marked as optional and part of "filing_path" exclusive group
- AC 2.4: Task includes "Petition to Determine Succession to Real Property" workflow
- AC 2.5: Task links to DE-310 and DE-315 forms
- AC 2.6: Alert explains: "This shortcut avoids full probate for qualifying estates"

### US-3: Interested Party Requesting Special Notice
**As an** interested party (heir, creditor, or beneficiary)  
**I want** to understand how to request special notice of all proceedings  
**So that** I can stay informed about the estate administration

**Acceptance Criteria**:
- AC 3.1: Roadmap includes "Respond to Special Notice Requests" task in Phase 1
- AC 3.2: Task explains what special notice is (notification of all court filings)
- AC 3.3: Task describes executor's obligation to honor requests
- AC 3.4: Task links to DE-154 form
- AC 3.5: Task includes tracking mechanism for who requested notice
- AC 3.6: Alert warns: "Failure to provide notice can invalidate court orders"

### US-4: Executor Seeking Bond Waiver
**As an** executor who wants to avoid posting bond  
**I want** guidance on obtaining bond waivers from heirs  
**So that** I can save the estate money on bond premiums

**Acceptance Criteria**:
- AC 4.1: Roadmap includes "Request Bond Waiver" task in Phase 1
- AC 4.2: Task is marked as optional
- AC 4.3: Task explains bond purpose (protects heirs from executor misconduct)
- AC 4.4: Task describes waiver process (all heirs must consent)
- AC 4.5: Task links to DE-142 and DE-143 forms
- AC 4.6: Alert explains: "Bond costs 0.5-1% of estate value annually"

### US-5: Executor with Contested Estate
**As an** executor facing a will contest or objection  
**I want** guidance on the contested probate process  
**So that** I can properly respond and protect the estate

**Acceptance Criteria**:
- AC 5.1: Roadmap includes "Respond to Objections" task in Phase 1
- AC 5.2: Task is marked as optional (only if objection filed)
- AC 5.3: Task explains common objection grounds (undue influence, lack of capacity, fraud)
- AC 5.4: Task recommends hiring attorney for contested matters
- AC 5.5: Task links to DE-115 and DE-116 forms
- AC 5.6: Alert warns: "Contested probate can extend timeline by 6-24 months"

---

## 3. Functional Requirements

### FR-1: Guardian Ad Litem Process
**Priority**: 🔴 HIGH (affects ~30% of estates with minor children)

**Requirements**:
- FR 1.1: Add "Identify Minor Beneficiaries" task to Phase 0 (Immediate Actions)
- FR 1.2: Add "Petition for Guardian Ad Litem" task to Phase 1 (Court Filing)
- FR 1.3: Add "Obtain Guardian Ad Litem Order" task to Phase 1
- FR 1.4: Add "Coordinate with Guardian Ad Litem" task to Phase 2 (Asset Discovery)
- FR 1.5: Add "Guardian Ad Litem Approval" task to Phase 5 (Final Distribution)
- FR 1.6: Add "Setup Blocked Accounts for Minors" task to Phase 5

**Process Flow**:
```
Phase 0: Identify minors in Will/intestacy
  ↓
Phase 1: File DE-350 (Petition for Guardian Ad Litem)
  ↓
Phase 1: Court issues DE-351 (Order Appointing Guardian)
  ↓
Phase 2-4: Guardian reviews all actions affecting minors
  ↓
Phase 5: Guardian approves final distribution
  ↓
Phase 5: Funds placed in blocked accounts until age 18
```

### FR-2: Primary Residence Succession Process
**Priority**: 🔴 HIGH (affects ~15% of estates)

**Requirements**:
- FR 2.1: Add "Check Primary Residence Succession Eligibility" task to Phase 0
- FR 2.2: Add "File Petition to Determine Succession" task to Phase 1
- FR 2.3: Add "Obtain Order Determining Succession" task to Phase 1
- FR 2.4: Mark tasks as exclusive with full probate (exclusiveGroup: "filing_path")
- FR 2.5: Add eligibility checker (primary residence + total estate < $100k)

**Process Flow**:
```
Phase 0: Check eligibility (primary residence, estate < $100k)
  ↓
Phase 1: File DE-310 (Petition to Determine Succession)
  ↓
Phase 1: Court issues DE-315 (Order Determining Succession)
  ↓
DONE: Property transfers directly to heirs, no full probate
```

### FR-3: Special Notice Process
**Priority**: 🔴 HIGH (used in ~90% of estates)

**Requirements**:
- FR 3.1: Add "Track Special Notice Requests" task to Phase 1
- FR 3.2: Add "Serve Special Notice Recipients" task to Phase 1 (ongoing)
- FR 3.3: Add tracking system for who requested special notice
- FR 3.4: Add reminder system to serve notice on all filings

**Process Flow**:
```
Phase 1: Interested party files DE-154 (Request for Special Notice)
  ↓
Phase 1+: Executor must serve copy of ALL court filings to requestor
  ↓
Ongoing: Track service dates and proof of service
```

### FR-4: Bond Waiver Process
**Priority**: 🟡 MEDIUM (optional but saves money)

**Requirements**:
- FR 4.1: Add "Request Bond Waiver from Heirs" task to Phase 1
- FR 4.2: Add "File Waiver of Bond" task to Phase 1
- FR 4.3: Add "Obtain Order Waiving Bond" task to Phase 1
- FR 4.4: Mark tasks as optional
- FR 4.5: Add cost calculator (bond costs 0.5-1% of estate value annually)

**Process Flow**:
```
Phase 1: Request all heirs sign DE-142 (Waiver of Bond)
  ↓
Phase 1: File waivers with court
  ↓
Phase 1: Court issues DE-143 (Order Waiving Bond)
  ↓
Result: Estate saves $500-$5,000+ annually
```

### FR-5: Contested Probate Process
**Priority**: 🟡 MEDIUM (affects ~10% of estates)

**Requirements**:
- FR 5.1: Add "Respond to Objections" task to Phase 1
- FR 5.2: Add "Attend Contest Hearing" task to Phase 1
- FR 5.3: Add "Resolve Will Contest" task to Phase 1
- FR 5.4: Mark tasks as optional (only if objection filed)
- FR 5.5: Add timeline warning (can extend probate by 6-24 months)

**Process Flow**:
```
Phase 1: Interested party files DE-115 (Objection to Petition)
  ↓
Phase 1: Court issues DE-116 (Notice of Objection)
  ↓
Phase 1: Executor responds (hire attorney recommended)
  ↓
Phase 1: Contest hearing scheduled
  ↓
Phase 1: Court rules on objection
  ↓
Continue: Proceed with probate based on court ruling
```

---

## 4. Non-Functional Requirements

### NFR-1: Usability
- NFR 1.1: New tasks must follow existing task structure (title, description, estimatedTime, alerts, links)
- NFR 1.2: Optional tasks must be clearly marked with `isOptional: true`
- NFR 1.3: Exclusive tasks must use `exclusiveGroup` to prevent confusion
- NFR 1.4: Alerts must use appropriate severity (info, warning, important, caution)

### NFR-2: Maintainability
- NFR 2.1: All new tasks must be added to `src/config/settlementPhases.ts`
- NFR 2.2: Task IDs must be unique and descriptive
- NFR 2.3: Form references must link to official California courts website
- NFR 2.4: Process flows must be documented in comments

### NFR-3: Accessibility
- NFR 3.1: All new tasks must be keyboard navigable
- NFR 3.2: Alerts must have appropriate ARIA labels
- NFR 3.3: Links must have descriptive text (not "click here")

### NFR-4: Performance
- NFR 4.1: Adding new tasks must not impact page load time
- NFR 4.2: Task filtering (optional vs required) must be instant
- NFR 4.3: Phase expansion must remain smooth with additional tasks

---

## 5. Out of Scope

### What We Are NOT Building
- ❌ Form download functionality (users can download from courts website)
- ❌ Form filling/generation (future enhancement)
- ❌ Automated form submission (future enhancement)
- ❌ Attorney matching service (future enhancement)
- ❌ Court filing tracking API (future enhancement)

### Why These Are Out of Scope
- **Focus on Process Guidance**: User clarified value is in showing the roadmap, not being a form repository
- **Complexity**: Form generation requires PDF manipulation, field mapping, validation
- **Legal Risk**: Auto-filling legal forms carries liability concerns
- **Resource Constraints**: Limited development time, focus on high-impact features

---

## 6. Assumptions and Constraints

### Assumptions
- A 6.1: Users can download forms from California courts website
- A 6.2: Users have basic understanding of probate process
- A 6.3: Users will consult attorney for complex situations
- A 6.4: Current roadmap structure (6 phases, task lists) is effective

### Constraints
- C 6.1: Must maintain backward compatibility with existing roadmap
- C 6.2: Must not break existing task completion tracking
- C 6.3: Must follow California probate law (Probate Code)
- C 6.4: Must link to official court forms only (no third-party sources)

---

## 7. Dependencies

### Internal Dependencies
- D 7.1: Existing roadmap implementation (`src/config/settlementPhases.ts`)
- D 7.2: Phase task list component (`src/components/PhaseTaskList.tsx`)
- D 7.3: Settlement phase chevron (`src/components/SettlementPhaseChevron.tsx`)

### External Dependencies
- D 7.4: California Judicial Council forms (https://www.courts.ca.gov/forms.htm)
- D 7.5: California Probate Code (legal requirements)
- D 7.6: California probate forms audit (`CALIFORNIA_PROBATE_FORMS_COMPLETE_AUDIT.md`)

---

## 8. Success Metrics

### Quantitative Metrics
- M 8.1: Roadmap coverage increases from 60% to 80%+ of real-world scenarios
- M 8.2: User engagement with roadmap increases by 20%+
- M 8.3: Support tickets about "missing processes" decrease by 50%+
- M 8.4: Task completion rate increases by 15%+

### Qualitative Metrics
- M 8.5: User feedback indicates roadmap is "comprehensive"
- M 8.6: Users report feeling "confident" about next steps
- M 8.7: Attorneys recommend our roadmap to executor clients
- M 8.8: Users successfully navigate special situations (minors, small estates)

---

## 9. Risks and Mitigations

### Risk 1: Legal Accuracy
**Risk**: Providing incorrect legal guidance could harm users  
**Likelihood**: Medium  
**Impact**: High  
**Mitigation**: 
- Review all tasks with California probate attorney
- Include disclaimers on all legal guidance
- Link to official court resources
- Recommend attorney consultation for complex situations

### Risk 2: Overwhelming Users
**Risk**: Adding too many tasks could overwhelm users  
**Likelihood**: Medium  
**Impact**: Medium  
**Mitigation**:
- Mark specialized tasks as optional
- Use progressive disclosure (expand to see details)
- Provide clear eligibility criteria
- Group related tasks together

### Risk 3: Maintenance Burden
**Risk**: California law changes could require frequent updates  
**Likelihood**: Low  
**Impact**: Medium  
**Mitigation**:
- Document all legal sources
- Set up annual review process
- Monitor California Judicial Council for form updates
- Use version control for roadmap configuration

---

## 10. Open Questions

### Q1: Form Numbering Conflict
**Question**: Is DE-315 "Order for Final Distribution" or "Order Determining Succession to Real Property"?  
**Status**: ❓ Needs Research  
**Action**: Verify on California courts website

### Q2: Guardian Ad Litem Fees
**Question**: Who pays guardian ad litem fees - estate or minors?  
**Status**: ❓ Needs Research  
**Action**: Consult California Probate Code Section 1470

### Q3: Blocked Account Requirements
**Question**: What are exact requirements for blocked accounts for minors?  
**Status**: ❓ Needs Research  
**Action**: Research California Probate Code Section 3400-3413

### Q4: Special Notice Scope
**Question**: Does special notice apply to ALL filings or only major ones?  
**Status**: ❓ Needs Research  
**Action**: Research California Probate Code Section 1250

---

## 11. Next Steps

### Immediate (This Week)
1. ✅ Create requirements document (this document)
2. ⏳ Research open questions (form numbering, fees, requirements)
3. ⏳ Create design document with detailed task specifications
4. ⏳ Review with user for approval

### Short-Term (Next 2 Weeks)
5. ⏳ Implement Phase 1 tasks (guardian ad litem, primary residence)
6. ⏳ Implement Phase 2 tasks (special notice, bond waiver)
7. ⏳ Test with real estate scenarios
8. ⏳ Deploy to production

### Long-Term (Next Month)
9. ⏳ Gather user feedback on new processes
10. ⏳ Iterate based on feedback
11. ⏳ Add additional specialized processes (contested probate, ancillary administration)
12. ⏳ Create help articles for each new process

---

## 12. Appendix

### A. Current Roadmap Structure
```typescript
interface PhaseTask {
  id: string;
  title: string;
  description: string;
  estimatedTime?: string;
  requiredDocs?: string[];
  alerts?: Alert[];
  category?: "probate" | "court-issued";
  utility?: string;
  isLongHorizon?: boolean;
  exclusiveGroup?: string;
  links?: Link[];
  isOptional?: boolean;
  dependencies?: string[];
  deadlineWarningId?: string;
  helpArticleId?: string;
  tags?: string[];
  applicability?: Applicability;
  isInternationalOnly?: boolean;
}
```

### B. Missing Forms Summary
| Form | Title | Priority | Process |
|------|-------|----------|---------|
| DE-350 | Petition for Guardian Ad Litem | 🔴 HIGH | Minor beneficiaries |
| DE-351 | Order Appointing Guardian Ad Litem | 🔴 HIGH | Minor beneficiaries |
| DE-310 | Petition to Determine Succession | 🔴 HIGH | Primary residence |
| DE-315 | Order Determining Succession | 🔴 HIGH | Primary residence |
| DE-154 | Request for Special Notice | 🔴 HIGH | Notice procedures |
| DE-200 | Order Prescribing Notice | 🔴 HIGH | Notice procedures |
| DE-142 | Waiver of Bond | 🟡 MEDIUM | Bond waiver |
| DE-143 | Order Waiving Bond | 🟡 MEDIUM | Bond waiver |
| DE-115 | Objection to Petition | 🟡 MEDIUM | Contested probate |
| DE-116 | Notice of Objection | 🟡 MEDIUM | Contested probate |

### C. References
- California Judicial Council Forms: https://www.courts.ca.gov/forms.htm
- California Probate Code: https://leginfo.legislature.ca.gov/faces/codes.xhtml
- California Probate Forms Audit: `CALIFORNIA_PROBATE_FORMS_COMPLETE_AUDIT.md`
- Current Roadmap Implementation: `SETTLEMENT_ROADMAP_IMPLEMENTATION.md`
- Enhanced Phase Tasks: `ENHANCED_PHASE_TASKS.md`

---

**Document Status**: ✅ Complete  
**Next Phase**: Design Document  
**Estimated Effort**: 2-3 days implementation  
**Target Release**: Sprint 7
