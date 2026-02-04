# Roadmap Process Gaps - A/B Test Plan

**Feature**: roadmap-process-gaps  
**Created**: February 3, 2026  
**Purpose**: Test new process workflows with real users before full rollout

---

## Executive Summary

We're adding 5 new process workflows to the roadmap that affect 30-40% of estates:
1. **Guardian Ad Litem** (estates with minors)
2. **Primary Residence Succession** (small estates)
3. **Special Notice Procedures** (all estates)
4. **Bond Waiver Process** (optional savings)
5. **Contested Probate** (disputed estates)

**Goal**: Validate that these processes provide value and don't overwhelm users before rolling out to 100% of users.

---

## A/B Test Strategy: Soft Launch (Recommended)

### Why Soft Launch vs Full A/B?

**Soft Launch Advantages**:
- ✅ Faster to implement (no A/B infrastructure needed)
- ✅ Lower risk (can roll back easily)
- ✅ Real user feedback from specific segments
- ✅ Iterative improvements before full launch
- ✅ No statistical complexity

**Full A/B Test Disadvantages**:
- ❌ Requires A/B testing infrastructure (feature flags, analytics, statistical analysis)
- ❌ Splits user base (some get worse experience if new version has bugs)
- ❌ Requires larger sample size for statistical significance
- ❌ More complex to implement and maintain

### Recommended Approach: Phased Soft Launch

```
Phase 1: Internal Testing (Week 1)
  ↓
Phase 2: Beta Users (Week 2-3) - 10% of users
  ↓
Phase 3: Targeted Rollout (Week 4-5) - 50% of users
  ↓
Phase 4: Full Rollout (Week 6) - 100% of users
```

---

## Phase 1: Internal Testing (Week 1)

### Objective
Validate that filtering logic works correctly and processes are clear.

### Test Scenarios

#### Scenario 1: Estate with Minors
**Setup**:
- Create test estate with 2 heirs, 1 minor (age 15)
- Estate value: $500,000
- Has will

**Expected Behavior**:
- ✅ "Identify Minor Beneficiaries" task appears in Phase 0
- ✅ "Petition for Guardian Ad Litem" task appears in Phase 1
- ✅ "Obtain Guardian Ad Litem Order" task appears in Phase 1
- ✅ "Coordinate with Guardian Ad Litem" task appears in Phase 2
- ✅ "Guardian Distribution Approval" task appears in Phase 5
- ✅ All tasks have clear descriptions and alerts
- ✅ Form links work (DE-350, DE-351)

**Success Criteria**:
- All 5 guardian tasks visible
- Tasks only appear when `hasMinorBeneficiaries: true`
- Descriptions are clear and actionable
- No console errors

---

#### Scenario 2: Small Estate with Primary Residence
**Setup**:
- Create test estate with primary residence
- Estate value: $85,000 (under $100k threshold)
- Location: California
- No other significant assets

**Expected Behavior**:
- ✅ "Check Primary Residence Succession Eligibility" task appears in Phase 0
- ✅ "File Petition to Determine Succession" task appears in Phase 1
- ✅ "Obtain Order Determining Succession" task appears in Phase 1
- ✅ Tasks marked as `exclusiveGroup: "filing_path"` (alternative to full probate)
- ✅ Alert explains this shortcut avoids full probate

**Success Criteria**:
- All 3 succession tasks visible
- Tasks only appear when estate < $100k AND has primary residence AND CA
- Exclusive group prevents showing full probate tasks simultaneously
- Clear eligibility criteria in descriptions

---

#### Scenario 3: Contested Estate
**Setup**:
- Create test estate with `hasContest: true`
- Estate value: $300,000
- Will contest filed by disinherited heir

**Expected Behavior**:
- ✅ "Respond to Objections" task appears in Phase 1
- ✅ "Attend Will Contest Hearing" task appears in Phase 1
- ✅ "Resolve Will Contest" task appears in Phase 1
- ✅ Alert warns about extended timeline (6-24 months)
- ✅ Alert recommends hiring attorney

**Success Criteria**:
- All 3 contest tasks visible
- Tasks only appear when `hasContest: true`
- Timeline warnings are prominent
- Attorney recommendation is clear

---

#### Scenario 4: Standard Estate (Control)
**Setup**:
- Create test estate with NO special circumstances
- Estate value: $400,000
- No minors, no contest, not small estate
- 3 adult heirs

**Expected Behavior**:
- ❌ Guardian ad litem tasks NOT visible
- ❌ Primary residence succession tasks NOT visible
- ❌ Contested probate tasks NOT visible
- ✅ Bond waiver tasks visible (always optional)
- ✅ Special notice tasks visible (always shown)
- ✅ Standard probate tasks visible

**Success Criteria**:
- Only standard + bond waiver + special notice tasks visible
- No unnecessary optional tasks cluttering roadmap
- Clean, focused experience

---

### Internal Testing Checklist

- [ ] Test all 4 scenarios above
- [ ] Verify filtering logic works correctly
- [ ] Check task descriptions for clarity
- [ ] Verify form links work
- [ ] Test on mobile and desktop
- [ ] Check for console errors
- [ ] Verify task completion tracking works
- [ ] Test progress bars (required vs optional)
- [ ] Verify alerts display correctly
- [ ] Check dependencies between tasks

---

## Phase 2: Beta Users (Week 2-3)

### Objective
Get real user feedback on process clarity and value.

### Beta User Selection

**Target Segments** (10% of users):
1. **Estates with Minors** (5 users)
   - Have indicated minor beneficiaries in onboarding
   - Currently in Phase 0-1 (early in process)

2. **Small Estates** (5 users)
   - Estate value < $100k
   - Have primary residence
   - California residents

3. **Contested Estates** (3 users)
   - Indicated will contest in onboarding
   - Currently in Phase 1 (court filing)

4. **Standard Estates** (7 users)
   - Control group to ensure we don't break existing experience

**Total**: 20 beta users

### Beta User Communication

**Email Template**:
```
Subject: New Roadmap Features - We Need Your Feedback!

Hi [Name],

We've added new guidance to your settlement roadmap based on your estate's specific situation:

[IF MINORS]
• Guardian ad litem appointment process for minor beneficiaries
• Blocked account setup guidance

[IF SMALL ESTATE]
• Simplified succession process for primary residences under $100k
• Shortcut to avoid full probate

[IF CONTESTED]
• Will contest response procedures
• Timeline expectations and attorney recommendations

We'd love your feedback! Please use the roadmap for the next 2 weeks and let us know:
1. Are the new tasks helpful?
2. Are the descriptions clear?
3. Is anything confusing or overwhelming?

Reply to this email or click here to schedule a 15-minute feedback call.

Thanks for helping us improve!
- The ExpectedEstate Team
```

### Feedback Collection

**Methods**:
1. **In-App Survey** (after 1 week)
   - "How helpful are the new roadmap tasks?" (1-5 scale)
   - "Are the task descriptions clear?" (Yes/No/Somewhat)
   - "Do you feel overwhelmed by the number of tasks?" (Yes/No)
   - "What would you change?" (Open text)

2. **User Interviews** (5 users, 15 min each)
   - Screen share walkthrough of roadmap
   - Ask about specific tasks
   - Observe where they get confused
   - Ask about missing information

3. **Analytics Tracking**:
   - Task completion rates (new vs existing tasks)
   - Time spent on roadmap page
   - Click-through rates on form links
   - Task abandonment rates

### Success Metrics (Beta Phase)

**Quantitative**:
- ✅ 70%+ of users rate new tasks as "helpful" (4-5 stars)
- ✅ 80%+ of users find descriptions "clear" or "somewhat clear"
- ✅ <30% of users feel "overwhelmed"
- ✅ Task completion rate ≥ existing tasks
- ✅ No increase in support tickets

**Qualitative**:
- ✅ Users report feeling "more confident" about next steps
- ✅ Users appreciate process guidance over form collection
- ✅ Users understand when tasks apply to their estate
- ✅ No major confusion or frustration

### Go/No-Go Decision Criteria

**GO to Phase 3 if**:
- All quantitative metrics met
- No critical bugs reported
- Positive qualitative feedback
- No increase in support burden

**NO-GO (iterate) if**:
- <60% helpfulness rating
- >40% feel overwhelmed
- Critical bugs or confusion
- Increase in support tickets

---

## Phase 3: Targeted Rollout (Week 4-5)

### Objective
Expand to 50% of users in target segments to validate at scale.

### Rollout Strategy

**Target Segments** (50% of each):
1. **All estates with minors** → Guardian ad litem tasks
2. **All small estates (<$100k)** → Primary residence succession tasks
3. **All contested estates** → Contested probate tasks
4. **All estates** → Bond waiver + special notice tasks (50% rollout)

**Implementation**:
```typescript
// Feature flag in roadmapService.ts
const ROLLOUT_PERCENTAGE = 0.5; // 50%

export async function getEstateRoadmap(estateId: string): Promise<RoadmapResponse> {
  const profile = await analyzeEstateProfile(estateId);
  
  // Determine if estate is in rollout group (based on estate ID hash)
  const isInRollout = hashEstateId(estateId) % 100 < (ROLLOUT_PERCENTAGE * 100);
  
  if (!isInRollout) {
    // Return standard roadmap (control group)
    return {
      estateId,
      phases: SETTLEMENT_PHASE_TASKS,
      triggers: { /* all false */ },
      profile
    };
  }
  
  // Return filtered roadmap with new processes
  const filteredPhases = filterTasksForEstate(SETTLEMENT_PHASE_TASKS, profile);
  return {
    estateId,
    phases: filteredPhases,
    triggers: {
      hasMinors: profile.hasMinorBeneficiaries,
      isSmallEstate: profile.isSmallEstate,
      isPrimaryResidence: profile.isPrimaryResidence,
      isContested: profile.isContested,
      showBondWaiver: true,
      showSpecialNotice: true
    },
    profile
  };
}
```

### Monitoring (Week 4-5)

**Daily Checks**:
- Error rates (should be <1%)
- Support ticket volume (should not increase)
- Task completion rates (should match or exceed control)

**Weekly Analysis**:
- Compare treatment vs control groups
- User satisfaction scores
- Feature adoption rates
- Time to complete phases

### Success Metrics (Targeted Rollout)

**Quantitative**:
- ✅ Error rate <1%
- ✅ Support tickets ≤ control group
- ✅ Task completion rate ≥ control group
- ✅ User satisfaction ≥ control group
- ✅ No performance degradation

**Qualitative**:
- ✅ Positive user feedback continues
- ✅ No major complaints or confusion
- ✅ Users successfully navigate new processes

### Go/No-Go Decision Criteria

**GO to Phase 4 (Full Rollout) if**:
- All quantitative metrics met
- No critical issues
- Positive user feedback
- Team confident in stability

**NO-GO (rollback or iterate) if**:
- Error rate >2%
- Support tickets increase >20%
- Task completion drops >10%
- Major user complaints

---

## Phase 4: Full Rollout (Week 6)

### Objective
Deploy new processes to 100% of users.

### Rollout Plan

**Day 1**: Increase rollout to 75%
**Day 3**: Increase rollout to 90%
**Day 5**: Increase rollout to 100%

**Gradual rollout allows**:
- Monitor for issues at each step
- Quick rollback if problems arise
- Smooth transition for support team

### Post-Launch Monitoring (Week 6-8)

**Week 6**:
- Daily error monitoring
- Support ticket tracking
- User feedback collection
- Performance monitoring

**Week 7-8**:
- Weekly analysis
- Identify improvement opportunities
- Plan next iteration

### Success Metrics (Full Rollout)

**Quantitative** (vs baseline):
- ✅ Roadmap coverage: 40% → 80%+ of scenarios
- ✅ User engagement: +20%
- ✅ Task completion rate: +15%
- ✅ Support tickets about "missing processes": -50%

**Qualitative**:
- ✅ Users report roadmap is "comprehensive"
- ✅ Users feel "confident" about next steps
- ✅ Attorneys recommend roadmap to clients
- ✅ Users successfully navigate special situations

---

## Rollback Plan

### Trigger Conditions
Rollback if:
- Error rate >5%
- Support tickets increase >50%
- Critical bug discovered
- Major user complaints
- Performance degradation

### Rollback Procedure

**Step 1**: Set rollout percentage to 0%
```typescript
const ROLLOUT_PERCENTAGE = 0.0; // Disable new processes
```

**Step 2**: Deploy rollback
- Push code change
- Verify deployment
- Monitor error rates

**Step 3**: Communicate
- Notify support team
- Email affected users (if needed)
- Post status update

**Step 4**: Investigate
- Identify root cause
- Fix issues
- Test thoroughly

**Step 5**: Re-launch
- Start at Phase 2 (Beta) again
- Follow phased rollout plan

---

## Alternative: Simple Feature Flag

If you want even simpler A/B testing without percentages:

### Environment Variable Approach

```typescript
// .env
ENABLE_NEW_ROADMAP_PROCESSES=false  // or true

// roadmapService.ts
const ENABLE_NEW_PROCESSES = process.env.ENABLE_NEW_ROADMAP_PROCESSES === 'true';

export async function getEstateRoadmap(estateId: string): Promise<RoadmapResponse> {
  const profile = await analyzeEstateProfile(estateId);
  
  if (!ENABLE_NEW_PROCESSES) {
    // Return standard roadmap
    return { estateId, phases: SETTLEMENT_PHASE_TASKS, triggers: {}, profile };
  }
  
  // Return filtered roadmap with new processes
  const filteredPhases = filterTasksForEstate(SETTLEMENT_PHASE_TASKS, profile);
  return { estateId, phases: filteredPhases, triggers: {...}, profile };
}
```

**Advantages**:
- ✅ Simplest possible implementation
- ✅ Can toggle on/off instantly
- ✅ No complex rollout logic

**Disadvantages**:
- ❌ All-or-nothing (can't do gradual rollout)
- ❌ No A/B comparison data
- ❌ Higher risk if issues arise

---

## Recommendation

**Start with Soft Launch (Phases 1-4)**:
1. Week 1: Internal testing
2. Week 2-3: Beta users (20 users)
3. Week 4-5: Targeted rollout (50%)
4. Week 6: Full rollout (100%)

**Why**:
- Lower risk than full A/B test
- Real user feedback at each stage
- Can iterate and improve
- Easy to rollback if needed
- No complex A/B infrastructure required

**If you want faster**:
- Skip Phase 2 (Beta) and go straight to Phase 3 (50% rollout)
- Reduces timeline to 3 weeks instead of 6

**If you want simplest**:
- Use environment variable feature flag
- Test internally (Phase 1)
- Deploy to 100% when confident
- Reduces timeline to 1-2 weeks

---

## Next Steps

1. **Choose approach**: Soft Launch (recommended) vs Feature Flag (simplest)
2. **Implement feature flag logic** in `roadmapService.ts`
3. **Set up analytics tracking** for new tasks
4. **Prepare beta user list** (if doing soft launch)
5. **Create feedback survey** (if doing soft launch)
6. **Begin Phase 1 internal testing**

---

**Document Status**: ✅ Complete  
**Recommended Approach**: Phased Soft Launch (4 phases, 6 weeks)  
**Alternative**: Feature Flag (1-2 weeks, higher risk)

