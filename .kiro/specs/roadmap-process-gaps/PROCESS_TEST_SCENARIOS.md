# Roadmap Process Testing - Process-Focused Scenarios

**Feature**: roadmap-process-gaps  
**Created**: February 3, 2026  
**Focus**: Test PROCESS GUIDANCE value, not form availability

---

## Testing Philosophy

**What We're Testing**:
✅ Does the process guidance help users understand WHAT to do?
✅ Does the process guidance help users understand WHEN to do it?
✅ Does the process guidance help users understand WHY it matters?
✅ Do users feel more confident after seeing the process?
✅ Do users understand the workflow sequence?

**What We're NOT Testing**:
❌ Whether forms are available for download
❌ Whether form links work
❌ Form coverage percentages
❌ PDF generation or filling

---

## Test Scenario 1: Guardian Ad Litem Process (Estates with Minors)

### User Story
"I'm an executor. My deceased mother left her estate to her 3 children, including my 15-year-old sister. I don't know what special steps I need to take to protect her interests."

### Current Experience (Before New Processes)
- User sees standard probate roadmap
- No mention of minors requiring special handling
- User discovers guardian ad litem requirement at court hearing (too late)
- User feels unprepared and anxious

### New Experience (With Guardian Ad Litem Process)
**Phase 0 - Immediate Actions**:
- ✅ Task: "Identify Minor Beneficiaries"
- Description: "Review all heirs and identify any beneficiaries under age 18. Minors require special court protection through a guardian ad litem."
- Alert: "Estates with minor beneficiaries require additional court oversight and blocked accounts."

**Phase 1 - Court Filing**:
- ✅ Task: "File Petition for Guardian Ad Litem"
- Description: "Request court appointment of a guardian ad litem to represent minor beneficiaries' interests throughout probate."
- Alert: "Guardian ad litem must approve all actions affecting minors' inheritance."
- Estimated Time: "2-4 hours"

- ✅ Task: "Obtain Guardian Ad Litem Order"
- Description: "Receive court order appointing guardian ad litem. Provide guardian with all estate information."
- Alert: "Guardian ad litem fees are paid by the estate, typically $150-300/hour."

**Phase 2-4 - Asset Discovery/Claims/Liquidation**:
- ✅ Task: "Coordinate with Guardian Ad Litem"
- Description: "Keep guardian informed of all estate actions. Obtain guardian's approval before major decisions affecting minors."
- Alert: "Guardian must review and approve inventory, accounting, and distribution plans."

**Phase 5 - Final Distribution**:
- ✅ Task: "Obtain Guardian Approval for Distribution"
- Description: "Present final distribution plan to guardian ad litem for review and approval before court hearing."
- Alert: "Guardian will verify that minors' shares are properly protected in blocked accounts."

- ✅ Task: "Setup Blocked Accounts for Minors"
- Description: "Ensure funds for minor beneficiaries are placed in court-approved blocked accounts."

### Test Questions (Process-Focused)

**Understanding**:
1. After reading these tasks, do you understand WHAT a guardian ad litem is?
2. Do you understand WHY a guardian ad litem is required?
3. Do you understand WHEN to petition for a guardian ad litem?
4. Do you understand the guardian's role throughout the process?

**Confidence**:
5. Do you feel more prepared to handle an estate with minor beneficiaries?
6. Do you know what to expect at each phase?
7. Do you understand the timeline (2-4 weeks for appointment)?
8. Do you understand the costs ($150-300/hour)?

**Workflow**:
9. Is the sequence of tasks logical?
10. Are the dependencies clear (must file petition before getting order)?
11. Do you understand this is an ongoing process (not one-time)?

**Value**:
12. Would this guidance have helped you avoid mistakes?
13. Would you have felt more confident going into court?
14. Does this make the roadmap more valuable to you?

### Success Criteria
- ✅ 80%+ users understand what/why/when
- ✅ 70%+ users feel more confident
- ✅ 90%+ users find workflow sequence logical
- ✅ 80%+ users say guidance would prevent mistakes

---

## Test Scenario 2: Primary Residence Succession (Small Estates)

### User Story
"My father passed away. His only asset is his house worth $85,000. I heard there might be a shortcut to avoid full probate, but I don't know what it is or if I qualify."

### Current Experience (Before New Processes)
- User sees full probate roadmap (12-18 months)
- No mention of simplified succession process
- User goes through full probate unnecessarily
- Wastes 6-12 months and $5,000+ in fees

### New Experience (With Primary Residence Succession Process)
**Phase 0 - Immediate Actions**:
- ✅ Task: "Check Primary Residence Succession Eligibility"
- Description: "If the estate consists primarily of a primary residence valued under $100,000, you may qualify for simplified succession process."
- Utility: "Shortcut: Avoid full probate for qualifying primary residences."
- Alert: "This process is ONLY for primary residences. Other assets require different procedures."
- Estimated Time: "1 hour"

**Phase 1 - Court Filing**:
- ✅ Task: "File Petition to Determine Succession"
- Description: "File petition with court to determine who inherits the primary residence without full probate."
- Alert: "Filing fee: ~$435. Hearing typically scheduled 30-45 days after filing."
- Estimated Time: "2-4 hours"

- ✅ Task: "Obtain Order Determining Succession"
- Description: "Receive court order determining property succession. Record order with county recorder."
- Alert: "Record certified copy of order with county recorder to transfer title."
- Estimated Time: "1-2 weeks after hearing"

### Test Questions (Process-Focused)

**Understanding**:
1. Do you understand WHAT the simplified succession process is?
2. Do you understand the eligibility criteria (primary residence + under $100k)?
3. Do you understand this is an ALTERNATIVE to full probate?
4. Do you understand the timeline (6-8 weeks vs 12-18 months)?

**Confidence**:
5. Do you feel confident determining if you qualify?
6. Do you understand the cost savings (avoid full probate fees)?
7. Do you understand the time savings (6-8 weeks vs 12-18 months)?

**Workflow**:
8. Is it clear this is a shortcut that replaces full probate?
9. Do you understand you can't use this if you have other significant assets?
10. Is the sequence logical (check eligibility → file petition → get order)?

**Value**:
11. Would this guidance have saved you time and money?
12. Would you have known about this option without this guidance?
13. Does this make the roadmap more valuable to you?

### Success Criteria
- ✅ 90%+ users understand eligibility criteria
- ✅ 80%+ users understand this is an alternative to full probate
- ✅ 85%+ users understand time/cost savings
- ✅ 90%+ users say they wouldn't have known about this option

---

## Test Scenario 3: Special Notice Process (All Estates)

### User Story
"I'm an executor. My deceased uncle's estranged daughter filed a 'Request for Special Notice' with the court. I don't know what this means or what I'm supposed to do."

### Current Experience (Before New Processes)
- User sees standard probate roadmap
- No mention of special notice obligations
- User fails to serve notice on requestor
- Court invalidates executor's actions (major setback)

### New Experience (With Special Notice Process)
**Phase 1 - Court Filing**:
- ✅ Task: "Track Special Notice Requests"
- Description: "Maintain list of all parties who have requested special notice. You must serve them copies of ALL court filings."
- Alert: "Failure to serve special notice can invalidate court orders. Keep meticulous records."
- Estimated Time: "Ongoing"

- ✅ Task: "Serve All Special Notice Recipients"
- Description: "Each time you file a document with the court, serve copies on all parties who requested special notice."
- Alert: "Service must be by mail with proof of service filed with court."
- Estimated Time: "1-2 hours per filing"

### Test Questions (Process-Focused)

**Understanding**:
1. Do you understand WHAT special notice is?
2. Do you understand WHO can request special notice?
3. Do you understand WHAT you must serve (all court filings)?
4. Do you understand HOW to serve (by mail with proof)?

**Confidence**:
5. Do you feel prepared to handle special notice requests?
6. Do you understand the consequences of failing to serve notice?
7. Do you know how to track who requested notice?

**Workflow**:
8. Is it clear this is an ongoing obligation (not one-time)?
9. Do you understand you must serve notice on EVERY filing?
10. Is the process for serving notice clear?

**Value**:
11. Would this guidance have prevented you from making a mistake?
12. Would you have known about this obligation without this guidance?
13. Does this make the roadmap more valuable to you?

### Success Criteria
- ✅ 85%+ users understand what special notice is
- ✅ 90%+ users understand the consequences of failure
- ✅ 80%+ users feel prepared to handle requests
- ✅ 85%+ users say guidance would prevent mistakes

---

## Test Scenario 4: Bond Waiver Process (Optional Cost Savings)

### User Story
"I'm an executor. The court said I need to post a $300,000 bond that will cost $3,000/year. My siblings trust me - is there a way to avoid this cost?"

### Current Experience (Before New Processes)
- User sees standard probate roadmap
- No mention of bond waiver option
- User pays $3,000/year unnecessarily
- Estate loses $3,000-$6,000 over probate period

### New Experience (With Bond Waiver Process)
**Phase 1 - Court Filing**:
- ✅ Task: "Request Bond Waiver from Heirs"
- Description: "Ask all heirs to sign waivers of bond requirement. Bond costs 0.5-1% of estate value annually."
- Utility: "Cost Savings: Eliminate bond premium (typically $500-$5,000/year)."
- Alert: "ALL heirs must sign. If even one refuses, bond is required."
- Estimated Time: "1-2 weeks"

- ✅ Task: "File Waiver of Bond"
- Description: "Submit signed waivers to court and request order waiving bond requirement."
- Alert: "File before probate hearing to avoid bond requirement in initial order."
- Estimated Time: "1 day"

- ✅ Task: "Obtain Order Waiving Bond"
- Description: "Verify that the court has officially waived the bond requirement."
- Alert: "If bond is waived, you still have full fiduciary liability to heirs."
- Estimated Time: "At hearing"

### Test Questions (Process-Focused)

**Understanding**:
1. Do you understand WHAT a bond is and WHY it's required?
2. Do you understand HOW MUCH bond costs (0.5-1% annually)?
3. Do you understand the waiver process (all heirs must sign)?
4. Do you understand WHEN to file (before hearing)?

**Confidence**:
5. Do you feel confident requesting waivers from heirs?
6. Do you understand the cost savings ($500-$5,000/year)?
7. Do you understand you still have fiduciary liability?

**Workflow**:
8. Is the sequence logical (request → file → obtain order)?
9. Is the timing clear (before hearing)?
10. Do you understand this is optional but valuable?

**Value**:
11. Would this guidance have saved the estate money?
12. Would you have known about this option without this guidance?
13. Does this make the roadmap more valuable to you?

### Success Criteria
- ✅ 90%+ users understand cost savings potential
- ✅ 85%+ users understand waiver process
- ✅ 80%+ users feel confident requesting waivers
- ✅ 95%+ users say they wouldn't have known about this option

---

## Test Scenario 5: Contested Probate Process (Disputed Estates)

### User Story
"I'm an executor. My deceased father's second wife filed an objection claiming the will is invalid due to undue influence. I don't know what to do or how long this will take."

### Current Experience (Before New Processes)
- User sees standard probate roadmap (12-18 months)
- No mention of will contest procedures
- User is blindsided by objection
- User doesn't know timeline or next steps

### New Experience (With Contested Probate Process)
**Phase 1 - Court Filing**:
- ✅ Task: "Respond to Objections"
- Description: "If someone files an objection to the petition or will, you must respond formally and prepare for contest hearing."
- Alert: "Hire an attorney immediately. Will contests are complex and high-stakes."
- Estimated Time: "2-4 weeks"

- ✅ Task: "Attend Will Contest Hearing"
- Description: "Appear in court for hearing on objection. Be prepared to present evidence supporting will validity."
- Alert: "Bring all witnesses who can testify to decedent's mental capacity and lack of undue influence."
- Estimated Time: "4-8 hours"

- ✅ Task: "Resolve Will Contest"
- Description: "Obtain court ruling on objection. If will is upheld, proceed with probate. If invalidated, estate becomes intestate."
- Alert: "Contested probate significantly extends timeline and increases costs. Consider settlement."
- Estimated Time: "Varies (can take 6-24 months)"

### Test Questions (Process-Focused)

**Understanding**:
1. Do you understand WHAT a will contest is?
2. Do you understand common grounds for objection (undue influence, lack of capacity)?
3. Do you understand the timeline (6-24 months extension)?
4. Do you understand the recommendation to hire an attorney?

**Confidence**:
5. Do you feel more prepared to handle an objection?
6. Do you understand what evidence you'll need?
7. Do you understand the potential outcomes (upheld vs invalidated)?

**Workflow**:
8. Is the sequence logical (respond → hearing → resolution)?
9. Do you understand this significantly extends the timeline?
10. Is the recommendation to consider settlement clear?

**Value**:
11. Would this guidance have helped you prepare for the contest?
12. Would you have known to hire an attorney immediately?
13. Does this make the roadmap more valuable to you?

### Success Criteria
- ✅ 85%+ users understand what a will contest is
- ✅ 90%+ users understand to hire an attorney
- ✅ 80%+ users understand timeline extension
- ✅ 85%+ users feel more prepared

---

## Test Scenario 6: Standard Estate (Control Group)

### User Story
"I'm an executor of a straightforward estate. My mother passed away with a will, 3 adult children as heirs, and assets worth $400,000. No complications."

### Current Experience (Before New Processes)
- User sees standard probate roadmap
- All tasks are relevant
- Clean, focused experience

### New Experience (With Process Filtering)
**What User SHOULD See**:
- ✅ All standard probate tasks
- ✅ Bond waiver tasks (optional, always shown)
- ✅ Special notice tasks (always shown)

**What User SHOULD NOT See**:
- ❌ Guardian ad litem tasks (no minors)
- ❌ Primary residence succession tasks (estate > $100k)
- ❌ Contested probate tasks (no contest)

### Test Questions (Process-Focused)

**Understanding**:
1. Do you see only tasks relevant to your estate?
2. Are you overwhelmed by too many tasks?
3. Is the roadmap focused and clear?

**Confidence**:
4. Do you feel the roadmap is tailored to your situation?
5. Do you trust the roadmap is showing you everything you need?

**Workflow**:
6. Is the roadmap easy to navigate?
7. Are the tasks in logical order?

**Value**:
8. Does the roadmap feel comprehensive but not overwhelming?
9. Would you recommend this roadmap to other executors?

### Success Criteria
- ✅ 90%+ users say roadmap is focused and clear
- ✅ <20% users feel overwhelmed
- ✅ 85%+ users trust roadmap is complete
- ✅ 80%+ users would recommend to others

---

## Overall Testing Approach

### Phase 1: Internal Testing (Week 1)
**Test all 6 scenarios above with internal team**:
- Create test estates for each scenario
- Walk through roadmap as if you're the executor
- Answer all test questions
- Identify confusing or unclear guidance
- Refine task descriptions and alerts

### Phase 2: Beta User Testing (Week 2-3)
**Recruit 20 beta users across scenarios**:
- 5 users with minors (Scenario 1)
- 5 users with small estates (Scenario 2)
- 3 users with contested estates (Scenario 5)
- 7 users with standard estates (Scenario 6)

**Testing Method**:
- Send users link to roadmap
- Ask them to use it for 1-2 weeks
- Conduct 15-minute interview
- Ask test questions from scenarios above
- Collect feedback on clarity and value

### Phase 3: Measure Success
**Quantitative Metrics**:
- % users who understand what/why/when
- % users who feel more confident
- % users who find workflow logical
- % users who say guidance prevents mistakes

**Qualitative Feedback**:
- "This would have saved me so much time"
- "I didn't know about this option"
- "The guidance is clear and actionable"
- "I feel more prepared now"

### Success Threshold
**GO to full rollout if**:
- ✅ 80%+ users understand the processes
- ✅ 75%+ users feel more confident
- ✅ 85%+ users find workflow logical
- ✅ 80%+ users say guidance prevents mistakes
- ✅ Positive qualitative feedback

**NO-GO (iterate) if**:
- ❌ <70% users understand the processes
- ❌ <60% users feel more confident
- ❌ Users report confusion or overwhelm
- ❌ Negative qualitative feedback

---

## Key Testing Principles

### Focus on PROCESS VALUE, not FORMS
- ✅ Test if users understand the WORKFLOW
- ✅ Test if users feel more CONFIDENT
- ✅ Test if users know WHAT to do and WHEN
- ❌ Don't test if forms are available
- ❌ Don't test if form links work
- ❌ Don't test PDF generation

### Focus on USER OUTCOMES
- ✅ Does this help users avoid mistakes?
- ✅ Does this save users time and money?
- ✅ Does this make users feel prepared?
- ✅ Does this increase user confidence?

### Focus on CLARITY
- ✅ Are task descriptions clear?
- ✅ Are alerts helpful?
- ✅ Is the workflow sequence logical?
- ✅ Are dependencies clear?

---

**Document Status**: ✅ Complete  
**Focus**: Process guidance value, not form availability  
**Next Step**: Begin Phase 1 internal testing with 6 scenarios

