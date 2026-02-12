# AGENTS.md Evaluation & Recommendations

## Executive Summary
**Overall Grade: B+ (85/100)**

Your agent architecture is well-structured with clear separation of concerns, but has some gaps in implementation details and potential compliance risks.

---

## ✅ Strengths

### 1. Clear Compliance Framework
- Strong emphasis on "educational only, no legal advice"
- Explicit prohibition on sensitive data collection
- Compliance guard agent dedicated to safety
- Appropriate disclaimers built into routing

### 2. Well-Designed Agent Separation
- Clean orchestrator pattern (main agent)
- Specialized agents with focused responsibilities
- Marketing mesh properly separated from intake
- Good use of handoffs between agents

### 3. WhatsApp-Optimized UX
- Short replies (1-3 sentences)
- One question at a time
- Empathy-first approach for grief situations
- Appropriate for mobile messaging

### 4. Structured Task Output
- Standardized TASK card format
- Clear ownership and status tracking
- Multi-channel support
- Asset requirements specified

### 5. Practical Intake Flow
- Minimal data collection (6-10 messages)
- Non-binding classification
- Range-based questions (reduces friction)
- Clear success criteria

---

## ⚠️ Weaknesses & Risks

### 1. **CRITICAL: Compliance Gaps**

**Issue:** "Non-binding classification" may still be interpreted as legal advice
```
settlement_classifier: "Non-binding classification into a likely settlement path"
```

**Risk:** Even with disclaimers, suggesting a "likely path" could be construed as legal guidance.

**Recommendation:**
```markdown
# Agent: settlement_classifier
Role: Information organizer (NOT path recommender)

Output: "Based on what you've shared, here's how your situation 
breaks down: [facts only]. A qualified professional can help 
determine the best path for your specific circumstances."

NEVER say: "You likely need probate" or "This looks like a trust administration"
ALWAYS say: "You mentioned [facts]. A professional can advise on the process."
```

### 2. **Missing: Error Handling & Edge Cases**

**Gaps:**
- What if user provides conflicting information?
- How to handle multi-state estates?
- What if user is international but deceased was in US?
- How to handle partial information after 10 messages?
- What if user goes silent mid-conversation?

**Recommendation:**
```markdown
## Error Handling Protocol

### Conflicting Information
- Flag inconsistency gently: "Earlier you mentioned [X], but now [Y]. 
  Which is correct?"
- Update case summary with latest info
- Note discrepancy for human review

### Incomplete After 10 Messages
- Summarize what's collected
- Offer intake link anyway: "We have enough to get started. 
  You can complete the rest at [link]"
- Set follow-up reminder (24h)

### Multi-State Estates
- Ask: "Which state did [deceased] live in at time of death?"
- Note other states in case summary
- Flag for complex handling

### User Abandonment
- After 24h: Gentle nudge with value reminder
- After 72h: Final message with intake link
- After 7d: Archive conversation
```

### 3. **Vague: Routing Heuristics**

**Issue:** "death-related → grief_intake" is too broad

**Examples of ambiguity:**
- "My father died 2 years ago, I'm finally ready to deal with this" → grief_intake or settlement_classifier?
- "What happens when someone dies without a will?" → educator or settlement_classifier?
- "I'm an executor and need help NOW" → converter or settlement_classifier?

**Recommendation:**
```markdown
## Routing Decision Tree

### Priority 1: Urgency Signals
Keywords: "urgent", "court date", "deadline", "need help now"
→ handoff: converter (fast-track to intake)

### Priority 2: Active Grief
Keywords: "just died", "passed away [<30 days]", "funeral", "still processing"
→ handoff: grief_intake

### Priority 3: Information Seeking
Keywords: "what is", "how does", "explain", "difference between"
→ handoff: educator

### Priority 4: Ready to Start
Keywords: "ready", "start", "sign up", "get started", "need the link"
→ handoff: converter

### Priority 5: Classification Needed
Keywords: "my situation", "what do I need", "which process"
→ handoff: settlement_classifier

### Default: Main orchestrator asks clarifying question
```

### 4. **Missing: Conversation State Management**

**Issue:** No clear specification of how "case summary" is maintained

**Questions:**
- Where is session data stored?
- How long is it retained?
- Can user resume conversation later?
- How is data synced with ExpectedEstate platform?

**Recommendation:**
```markdown
## Session Management

### Data Storage
- Platform: WhatsApp Business API + CRM integration
- Retention: 30 days for incomplete, 90 days for completed
- Format: JSON case summary

### Case Summary Schema
{
  "conversation_id": "uuid",
  "started_at": "timestamp",
  "last_message_at": "timestamp",
  "user_phone": "hashed",
  "status": "in_progress|completed|abandoned",
  "facts_collected": {
    "state": "CA|null",
    "has_trust": "yes|no|unknown",
    "has_will": "yes|no|unknown",
    "has_real_estate": "yes|no|unknown",
    "estate_size_band": "<150k|150k-500k|500k-1M|1M+|unknown",
    "urgency": "low|medium|high",
    "user_location": "US|international"
  },
  "suggested_next_step": "intake_link|call_attorney|more_info_needed",
  "messages_exchanged": 0,
  "agent_handoffs": []
}
```

### 5. **Unclear: Marketing Agent Activation**

**Issue:** When/how are marketing agents triggered?

**Questions:**
- Are these for internal team use only?
- Do users trigger them via WhatsApp?
- Is there a separate interface?

**Recommendation:**
```markdown
## Marketing Agent Access Control

### User-Facing Agents (WhatsApp)
- main
- grief_intake
- settlement_classifier
- educator
- converter
- compliance_guard

### Internal-Only Agents (Team Dashboard/Slack)
- launch_coordinator
- positioning_agent
- linkedin_writer
- seo_planner
- creative_brief
- distribution_agent
- launch_ops
- founder_review

### Activation Method
- WhatsApp users: NEVER see marketing agents
- Team members: Use command prefix in Slack
  Example: `/launch plan 7d` or `/linkedin post about [topic]`
```

### 6. **Missing: Quality Assurance**

**Issue:** No mention of monitoring, testing, or improvement loops

**Recommendation:**
```markdown
## Quality Assurance Protocol

### Conversation Monitoring
- Random sample review: 10% of conversations weekly
- Flag patterns: Legal advice slips, user confusion, abandonment
- Success metrics: Conversion rate, messages to intake, user satisfaction

### A/B Testing Framework
- Test variations of:
  - Empathy statements
  - Question phrasing
  - CTA timing
  - Intake link presentation

### Compliance Audits
- Weekly: Review flagged conversations
- Monthly: Full compliance audit
- Quarterly: Legal review of agent outputs

### Continuous Improvement
- Track common user questions → update educator agent
- Identify confusion points → refine routing
- Monitor abandonment → optimize flow
```

### 7. **Weak: Converter Agent Specification**

**Issue:** Just says "deliver intake link" - no strategy for timing or framing

**Current:**
```markdown
# Agent: converter
Role: Convert to ExpectedEstate intake workflow.
CTA: https://www.expectedestate.com/auth
```

**Recommended:**
```markdown
# Agent: converter
Role: Transition user to ExpectedEstate platform with clear value proposition

## Timing Triggers
- User says "ready", "start", "sign up", "get started"
- After 6+ messages with sufficient info collected
- User asks "what's next" or "how do I begin"
- Urgency detected (court date, deadline)

## Conversion Script Templates

### Standard (after classification)
"Based on what you've shared, ExpectedEstate can help you organize 
everything step-by-step. Create your free account here: 
https://www.expectedestate.com/auth

It takes 2 minutes and you'll get a personalized roadmap."

### Urgent (deadline detected)
"Since you mentioned [deadline], let's get you set up right away: 
https://www.expectedestate.com/auth

You'll immediately see your timeline and critical next steps."

### Uncertain (incomplete info)
"No problem if you're not sure about everything yet. Start your 
account and we'll help you figure it out as you go: 
https://www.expectedestate.com/auth"

### Value Reinforcement
After link sent, add: "Once you're in, you'll get:
• State-specific checklist
• Deadline calculator  
• Form library
• AI help anytime"

## Follow-Up Protocol
- If no click within 2 hours: "Any questions about getting started?"
- If clicked but didn't complete: "Need help with anything in the signup?"
- If completed: "Great! Check your email for next steps."
```

---

## 🎯 Specific Recommendations

### 1. Add Conversation Examples

Your doc would benefit from example conversations:

```markdown
## Example Conversation Flow

### Scenario 1: Recent Death, Needs Guidance

User: "My mom just passed away and I don't know where to start"

main → grief_intake
Bot: "I'm so sorry for your loss. Let's take this one step at a time. 
     Was your mom living in the US?"

User: "Yes, California"

grief_intake → settlement_classifier  
Bot: "Thank you. Did your mom have a trust set up?"

User: "I think so, but I'm not sure"

Bot: "That's okay. Did she own a home or other real estate?"

User: "Yes, a house"

Bot: "Got it. Do you know roughly what the total estate is worth? 
     Under $150k, $150k-$500k, $500k-$1M, or over $1M?"

User: "Probably around $600k"

settlement_classifier → converter
Bot: "Based on what you've shared (CA, possible trust, real estate, 
     ~$600k), there are a few possible paths. ExpectedEstate can help 
     you organize everything and figure out the right process.
     
     Create your free account: https://www.expectedestate.com/auth
     
     You'll get a personalized roadmap in 2 minutes."

### Scenario 2: Legal Advice Request

User: "Do I need to go through probate?"

main → compliance_guard
Bot: "That depends on several factors specific to your situation - 
     I can't make that determination. But I can help you organize 
     the information a professional would need to advise you.
     
     Want to walk through the key details?"

User: "Yes"

compliance_guard → settlement_classifier
Bot: "Great. Which state did the deceased live in?"
```

### 2. Add Prohibited Phrases List

```markdown
## Compliance: Prohibited Phrases

### NEVER Say:
❌ "You need to..."
❌ "You should..."
❌ "You must..."
❌ "The law requires..."
❌ "You don't need probate"
❌ "This qualifies for..."
❌ "You're required to..."
❌ "The deadline is..." (unless citing public statute)

### ALWAYS Say:
✅ "Based on what you've shared..."
✅ "A professional can advise whether..."
✅ "Common next steps include..."
✅ "Many people in similar situations..."
✅ "You might want to ask a professional about..."
✅ "This information can help a professional determine..."
```

### 3. Add Metrics Dashboard Spec

```markdown
## Success Metrics (Track Weekly)

### Conversion Funnel
- Conversations started: [count]
- Reached converter agent: [count] ([%])
- Clicked intake link: [count] ([%])
- Completed signup: [count] ([%])
- Overall conversion rate: [%]

### Engagement Quality
- Avg messages to conversion: [number]
- Avg conversation duration: [minutes]
- Abandonment rate: [%]
- Abandonment point (avg message #): [number]

### Compliance Health
- Conversations flagged: [count]
- Legal advice slips: [count]
- Sensitive data requests: [count]
- Compliance score: [%]

### Agent Performance
- Most common path: [agent sequence]
- Avg handoffs per conversation: [number]
- Educator agent usage: [%]
- Compliance guard triggers: [count]

### User Satisfaction (if surveyed)
- Helpful rating: [1-5]
- Would recommend: [%]
- Felt supported: [%]
```

---

## 🔧 Implementation Checklist

Before going live, ensure:

- [ ] All agents have example conversations documented
- [ ] Compliance guard has comprehensive phrase detection
- [ ] Session state management is implemented and tested
- [ ] Error handling covers all edge cases
- [ ] Marketing agents are access-controlled (not user-facing)
- [ ] Monitoring dashboard is set up
- [ ] Legal review of all agent outputs completed
- [ ] A/B testing framework is ready
- [ ] Abandonment follow-up automation is configured
- [ ] Integration with ExpectedEstate platform is tested
- [ ] WhatsApp Business API is properly configured
- [ ] Team training on agent system completed
- [ ] Escalation path to human support defined
- [ ] Data retention and privacy policy aligned
- [ ] GDPR/CCPA compliance verified (if applicable)

---

## 🚀 Enhancement Opportunities

### Short-Term (Next 30 Days)
1. Add conversation examples to each agent
2. Implement prohibited phrases detection
3. Set up basic metrics tracking
4. Create internal testing protocol

### Medium-Term (Next 90 Days)
1. Build A/B testing framework
2. Implement ML-based intent classification
3. Add sentiment analysis for grief detection
4. Create agent performance dashboard

### Long-Term (Next 6 Months)
1. Multi-language support
2. Voice message handling
3. Proactive outreach based on user behavior
4. Integration with attorney network for referrals

---

## 💡 Creative Ideas

### 1. "Confidence Score" for Classification
Instead of suggesting a path, show confidence in collected info:

```
"Based on what you've shared, we have:
✅ State (CA)
✅ Estate size (~$600k)
⚠️  Trust status (uncertain)
⚠️  Will status (unknown)

A professional can determine the exact process. Want to get 
organized in ExpectedEstate while you gather more details?"
```

### 2. "Ask an Expert" Escape Hatch
When compliance_guard triggers repeatedly:

```
"These are great questions that really need personalized legal 
advice. Would you like me to:

1. Help you organize your info for an attorney consultation
2. Continue with general educational information
3. Connect you with our partner attorney network (coming soon)"
```

### 3. Progress Indicator
Show user where they are in the intake:

```
"Great! We're halfway there. 🎯

✅ State
✅ Trust status  
✅ Estate size
⏳ Real estate (next)
⏳ Timeline urgency

Just 2 more quick questions..."
```

---

## Final Recommendations

### Priority 1 (Must Fix Before Launch)
1. ✅ Strengthen compliance language in settlement_classifier
2. ✅ Add comprehensive error handling
3. ✅ Clarify marketing agent access control
4. ✅ Implement session state management
5. ✅ Add prohibited phrases detection

### Priority 2 (Should Have)
1. Add conversation examples
2. Enhance converter agent with timing strategy
3. Implement metrics tracking
4. Create testing protocol

### Priority 3 (Nice to Have)
1. A/B testing framework
2. Confidence scoring
3. Progress indicators
4. Multi-language support

---

## Overall Assessment

**What's Working:**
- Strong compliance foundation
- Clean agent architecture
- WhatsApp-optimized UX
- Clear separation of concerns

**What Needs Work:**
- Implementation details are vague
- Error handling is missing
- Compliance could be stronger
- No quality assurance framework

**Bottom Line:**
This is a solid foundation that needs operational details filled in before production deployment. The architecture is sound, but execution details will make or break the user experience and compliance posture.

**Recommended Next Step:**
Create a "Conversation Playbook" document with 20+ example conversations covering edge cases, then test with real users in a controlled beta.

---

**Grade Breakdown:**
- Architecture: A (95/100)
- Compliance: B+ (87/100)
- Implementation Details: C+ (78/100)
- Error Handling: C (75/100)
- Documentation: B (85/100)

**Overall: B+ (85/100)**

With the recommended fixes, this could easily be an A (95/100) system.
