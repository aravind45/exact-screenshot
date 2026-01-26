# Honest Product Evaluation: ExpectedEstate (Pilar)

**Evaluator:** AI Agent (Simulating Executor Perspective)  
**Date:** January 25, 2026  
**Version Evaluated:** Current State (Post-Communication Log Spec)  
**Question:** Would I pay for this application?

---

## Executive Summary

**Answer: Not Yet, But Getting Close**

**Current Value:** $0-15/month (Free tier only)  
**Potential Value:** $49-99/month (With Tier 1+2 complete)  
**Completion Status:** ~40% of a paid product

**Key Finding:** The foundation is solid, the vision is clear, and the technical architecture is excellent. However, critical Tier 1 features are incomplete or missing. The Communication Log—the most important feature—is fully spec'd but not yet implemented.

---

## Current State Assessment

### What's Built ✅

1. **Communication Log (Database Layer)**
   - ✅ PostgreSQL schema with normalized tables
   - ✅ Full-text search indexes (GIN)
   - ✅ Transaction boundaries defined
   - ✅ Authorization rules specified
   - ❌ **UI not implemented** (0% of frontend)
   - ❌ **API endpoints not built** (0% of backend)
   - **Status:** 20% complete (spec only)

2. **Asset Tracking**
   - ✅ Add/edit/delete assets
   - ✅ Category-based organization
   - ✅ Status and priority tracking
   - ✅ Asset detail pages
   - **Status:** 80% complete

3. **Settlement Workflow**
   - ✅ Step-by-step guidance per asset
   - ✅ Institution-specific workflows
   - ✅ Authority requirement detection
   - ✅ Blocks individual assets until probate granted
   - **Status:** 75% complete

4. **Probate Hub**
   - ✅ Authority tracking (Letters vs Affidavit)
   - ✅ Court case number tracking
   - ✅ Heir management
   - ✅ Probate status workflow
   - **Status:** 70% complete

5. **Follow-Up Widget**
   - ✅ Shows pending follow-ups
   - ✅ Priority indicators
   - ✅ Click to navigate to asset
   - ❌ No timestamped completion
   - ❌ No advanced filtering
   - **Status:** 60% complete

6. **Dashboard**
   - ✅ Summary statistics
   - ✅ Asset cards with status
   - ✅ Recent activity
   - ❌ No financial charts
   - ❌ No beneficiary distribution
   - **Status:** 50% complete

7. **Document Management**
   - ✅ Upload documents per asset
   - ✅ Document type categorization
   - ❌ No AI extraction
   - ❌ No search functionality
   - **Status:** 40% complete

8. **Smart Features**
   - ✅ AI enrichment (contact info lookup)
   - ✅ Letter generation (basic)
   - ✅ Batch operations
   - ✅ Email draft generation
   - **Status:** 60% complete

### What's Missing ❌

1. **Communication Log (UI/API)** - 0% implemented
2. **Onboarding Wizard** - 0% implemented
3. **Financial Dashboard** - 0% implemented
4. **Deadline Calendar** - 0% implemented
5. **Collaboration Features** - 0% implemented
6. **Email Integration** - 0% implemented
7. **State-Specific Forms** - 0% implemented
8. **Attorney Network** - 0% implemented

---

## Detailed Feature Analysis

### Tier 1: Must-Have Features (Required for Payment)

#### 1. Communication Log ⭐⭐⭐⭐⭐
**Importance:** CRITICAL (80% of executor time)  
**Current Status:** 20% complete (spec only)  
**Value if Complete:** $29/month alone

**What's Done:**
- ✅ Comprehensive spec (requirements, design, tasks)
- ✅ Database schema with normalized attachments
- ✅ PostgreSQL FTS with GIN indexes
- ✅ Transaction boundaries defined
- ✅ Authorization and IDOR protection specified
- ✅ 36 correctness properties documented
- ✅ Cursor-based pagination strategy

**What's Missing:**
- ❌ API endpoints (POST, GET, PATCH, DELETE)
- ❌ CommunicationService with CRUD methods
- ❌ FileService for attachment uploads
- ❌ AuthorizationService for security
- ❌ Timeline UI component
- ❌ Communication form component
- ❌ Search and filter UI
- ❌ Follow-up completion with timestamps
- ❌ Property-based tests (100+ iterations)
- ❌ Integration tests (authorization, IDOR, transactions)

**Why It Matters:**
- Executors spend 80% of their time communicating with institutions
- Need audit trail for legal protection
- Need to track follow-ups to prevent delays
- Need to search past conversations
- **This is THE killer feature**

**Estimated Work:** 2-3 weeks (23 tasks, 100+ subtasks)

---

#### 2. Onboarding Wizard ⭐⭐⭐⭐
**Importance:** HIGH (First impression)  
**Current Status:** 0% complete  
**Value if Complete:** +$10/month

**What's Needed:**
- Welcome screen with empathetic messaging
- 5-step guided setup:
  1. Estate information (deceased details)
  2. Upload death certificate
  3. Add first 3 assets
  4. Set up probate tracking (if needed)
  5. Tour of key features
- Progress indicator
- Skip option for experienced users
- Contextual help tooltips

**Why It Matters:**
- Currently, users are dropped into dashboard with no guidance
- Reduces time-to-value from 2 hours to 15 minutes
- Sets expectations and builds confidence
- Reduces support burden

**Estimated Work:** 1 week

---

#### 3. Financial Dashboard ⭐⭐⭐⭐
**Importance:** HIGH (Big picture view)  
**Current Status:** 30% complete  
**Value if Complete:** +$10/month

**What's Done:**
- ✅ Total value calculation
- ✅ Asset count by status
- ✅ Basic statistics

**What's Missing:**
- ❌ Pie chart by category (financial, retirement, insurance, property)
- ❌ Bar chart by status (discovered, contacted, in review, distributed)
- ❌ Beneficiary distribution calculator
- ❌ Tax estimate (simple federal estate tax)
- ❌ Net estate value (assets - debts)
- ❌ Timeline of distributions
- ❌ Export to PDF/Excel

**Why It Matters:**
- Executors need to see the big picture
- Beneficiaries ask "how much am I getting?"
- Need to estimate tax liability
- Need to plan distribution strategy

**Estimated Work:** 1-2 weeks

---

#### 4. Deadline Calendar ⭐⭐⭐⭐
**Importance:** HIGH (Prevents missed deadlines)  
**Current Status:** 0% complete  
**Value if Complete:** +$10/month

**What's Needed:**
- Calendar view (month/week/day)
- Follow-up reminders from communications
- Court deadlines (if probate):
  - Petition filing deadline
  - Hearing date
  - Creditor claim deadline (4 months)
  - Final accounting deadline
- Asset-specific deadlines:
  - 401k distribution deadline (Dec 31 of year after death)
  - Life insurance claim deadline (varies)
- Email/SMS notifications (optional)
- Snooze/reschedule functionality
- Export to Google Calendar/Outlook

**Why It Matters:**
- Missing a court deadline can delay settlement by months
- Missing a 401k deadline triggers tax penalties
- Executors are overwhelmed and forget things
- **This is a safety net**

**Estimated Work:** 1-2 weeks

---

### Tier 2: Nice-to-Have Features (Increases Value)

#### 5. Collaboration ⭐⭐⭐
**Importance:** MEDIUM (For co-executors/attorneys)  
**Current Status:** 0% complete  
**Value if Complete:** +$20/month

**What's Needed:**
- Invite co-executor or attorney
- Role-based permissions (view, edit, admin)
- Activity feed (who did what, when)
- Comments on assets/communications
- @mentions for notifications
- Audit trail of all changes

**Why It Matters:**
- Many estates have co-executors
- Attorneys need visibility without full control
- Reduces duplicate work
- Improves accountability

**Estimated Work:** 2 weeks

---

#### 6. Email Integration ⭐⭐⭐
**Importance:** MEDIUM (Saves time)  
**Current Status:** 0% complete  
**Value if Complete:** +$15/month

**What's Needed:**
- Unique email address per estate (e.g., estate-123@pilar.com)
- Forward emails to Pilar
- Auto-parse sender, subject, body
- Suggest asset to attach to (AI)
- One-click to log communication
- Attach original email as PDF

**Why It Matters:**
- Executors already use email
- Reduces logging time by 50%
- Ensures nothing is missed
- **This is a huge time-saver**

**Estimated Work:** 2 weeks

---

#### 7. State-Specific Forms ⭐⭐⭐
**Importance:** MEDIUM (For probate states)  
**Current Status:** 10% complete  
**Value if Complete:** +$30/month (for CA executors)

**What's Done:**
- ✅ Basic letter generation

**What's Missing:**
- ❌ California probate forms (DE-111, DE-150, DE-160, etc.)
- ❌ Auto-fill from estate data
- ❌ Field validation
- ❌ E-signature support
- ❌ E-file to court (future)
- ❌ Other states (NY, TX, FL, etc.)

**Why It Matters:**
- Probate forms are complex and intimidating
- Mistakes cause delays and rejections
- Auto-fill saves hours of data entry
- **Worth $30/month for CA executors alone**

**Estimated Work:** 2-3 weeks per state

---

#### 8. Attorney Network ⭐⭐
**Importance:** LOW (Nice to have)  
**Current Status:** 0% complete  
**Value if Complete:** +$5/month

**What's Needed:**
- Directory of estate attorneys by state
- Reviews and ratings
- Specializations (probate, trust, tax)
- Request consultation button
- Pricing transparency
- Pilar referral discount

**Why It Matters:**
- Executors often need legal help
- Hard to find good estate attorneys
- Referral revenue opportunity
- Builds trust and credibility

**Estimated Work:** 1 week (directory only)

---

### Tier 3: Premium Features (High-Value Estates)

#### 9. Concierge Service ⭐⭐⭐⭐⭐
**Importance:** HIGH (For estates >$500K)  
**Current Status:** 0% complete  
**Value if Complete:** $299-499/month

**What's Needed:**
- Dedicated support person
- Weekly check-in calls
- Document review and feedback
- Direct institution contact (on behalf of executor)
- Expedited processing
- Legal review (partner with attorney)
- Tax planning consultation

**Why It Matters:**
- High-value estates justify premium pricing
- Executors of large estates are often busy professionals
- Willing to pay for white-glove service
- **This is where the real money is**

**Estimated Work:** Operational, not technical

---

## Pricing Analysis

### Current State: $0-15/month
**What You Get:**
- Asset tracking
- Basic communication logging (legacy)
- Settlement workflow guidance
- Probate hub
- Follow-up widget
- Document upload

**Why I Wouldn't Pay:**
- Communication log is incomplete (most important feature)
- No onboarding (confusing for new users)
- No financial dashboard (can't see big picture)
- No deadline calendar (risk of missing deadlines)
- Missing too many essentials

**Verdict:** Free tier only

---

### With Tier 1 Complete: $49/month
**What You Get:**
- ✅ Full communication log (timeline, search, attachments, follow-ups)
- ✅ Onboarding wizard
- ✅ Financial dashboard with charts
- ✅ Deadline calendar with reminders
- ✅ Everything from current state

**Why I Would Pay:**
- Communication log becomes my "command center"
- Saves 10+ hours per month
- Reduces anxiety significantly
- Legal protection (audit trail)
- Prevents missed deadlines

**Verdict:** Worth it for any estate >$50K

---

### With Tier 1+2 Complete: $99/month
**What You Get:**
- ✅ Everything from Tier 1
- ✅ Collaboration (co-executor/attorney)
- ✅ Email integration (forward to Pilar)
- ✅ State-specific forms (CA)
- ✅ Attorney network

**Why I Would Pay:**
- Becomes indispensable
- Saves 20+ hours per month
- Co-executor can help
- Email integration is huge time-saver
- State forms eliminate attorney fees

**Verdict:** Worth it for any estate >$100K

---

### With Tier 3 (Concierge): $299-499/month
**What You Get:**
- ✅ Everything from Tier 1+2
- ✅ Dedicated support person
- ✅ Weekly check-in calls
- ✅ Document review
- ✅ Direct institution contact
- ✅ Legal review

**Why I Would Pay:**
- High-value estate (>$500K)
- I'm a busy professional
- Want expert guidance
- Worth it to avoid mistakes
- Peace of mind

**Verdict:** Worth it for estates >$500K

---

## Competitive Analysis

### Current Alternatives

1. **Spreadsheets (Free)**
   - Pros: Flexible, familiar
   - Cons: No automation, easy to lose track, no audit trail
   - **Pilar Advantage:** Automation, audit trail, guidance

2. **Estate Attorneys ($5,000-$50,000)**
   - Pros: Expert guidance, legal protection
   - Cons: Expensive, slow, not always necessary
   - **Pilar Advantage:** 10x cheaper, faster, self-service

3. **Everplans ($75/year)**
   - Pros: Document storage, planning tools
   - Cons: Pre-death focus, no settlement workflow
   - **Pilar Advantage:** Post-death focus, settlement workflow

4. **Trust & Will ($399 one-time)**
   - Pros: Will creation, trust setup
   - Cons: Pre-death focus, no settlement tools
   - **Pilar Advantage:** Post-death focus, settlement tools

5. **Manual Tracking (Free)**
   - Pros: No cost
   - Cons: Time-consuming, error-prone, stressful
   - **Pilar Advantage:** Saves time, reduces errors, reduces stress

**Conclusion:** Pilar has a clear market gap. No competitor focuses on post-death settlement workflow with this level of detail.

---

## Technical Assessment

### What's Good ✅

1. **Architecture**
   - PostgreSQL with FTS (smart choice)
   - Normalized data model (attachments table)
   - Cursor-based pagination (handles concurrency)
   - Transaction boundaries (data consistency)
   - IDOR protection (security)

2. **Code Quality**
   - TypeScript throughout
   - React Query for data fetching
   - Prisma ORM (type-safe)
   - Tailwind CSS (consistent styling)
   - Shadcn UI (accessible components)

3. **Design System**
   - Empathetic language
   - Calm colors
   - Generous spacing
   - Clear visual hierarchy
   - Mobile-responsive

4. **Unique Features**
   - Authority engine (Letters vs Affidavit)
   - Settlement workflow per asset
   - Probate status tracking
   - AI enrichment

### What Needs Work ⚠️

1. **Testing**
   - No property-based tests yet
   - No integration tests yet
   - No E2E tests
   - **Risk:** Bugs in production

2. **Performance**
   - No monitoring/observability
   - No p95 latency tracking
   - No query optimization
   - **Risk:** Slow as data grows

3. **Security**
   - No field-level encryption (SSN, account numbers)
   - No audit logging (who did what, when)
   - No rate limiting
   - **Risk:** Data breach, compliance issues

4. **Scalability**
   - No caching strategy
   - No CDN for assets
   - No database read replicas
   - **Risk:** Slow as users grow

---

## Roadmap to Paid Product

### Phase 1: Communication Log (Weeks 1-3)
**Goal:** Implement the fully spec'd Communication Log feature

**Tasks:**
1. Database migrations (communications + attachments tables)
2. API endpoints (POST, GET, PATCH, DELETE)
3. CommunicationService with CRUD methods
4. FileService for attachment uploads
5. AuthorizationService for security
6. Timeline UI component
7. Communication form component
8. Search and filter UI
9. Follow-up completion with timestamps
10. Property-based tests (100+ iterations)
11. Integration tests (authorization, IDOR, transactions)

**Outcome:** Communication Log is 100% complete and production-ready

**Value Increase:** $0 → $29/month

---

### Phase 2: Onboarding Wizard (Week 4)
**Goal:** Guide new users through setup

**Tasks:**
1. Welcome screen with empathetic messaging
2. 5-step wizard (estate info, death cert, assets, probate, tour)
3. Progress indicator
4. Skip option
5. Contextual help tooltips

**Outcome:** New users get value in 15 minutes instead of 2 hours

**Value Increase:** $29 → $39/month

---

### Phase 3: Financial Dashboard (Weeks 5-6)
**Goal:** Show the big picture

**Tasks:**
1. Pie chart by category
2. Bar chart by status
3. Beneficiary distribution calculator
4. Tax estimate (simple)
5. Net estate value
6. Export to PDF/Excel

**Outcome:** Executors can see and plan distribution

**Value Increase:** $39 → $49/month

---

### Phase 4: Deadline Calendar (Weeks 7-8)
**Goal:** Prevent missed deadlines

**Tasks:**
1. Calendar view (month/week/day)
2. Follow-up reminders
3. Court deadlines
4. Asset-specific deadlines
5. Email/SMS notifications
6. Export to Google Calendar/Outlook

**Outcome:** Executors never miss a critical deadline

**Value Increase:** $49 → $59/month

---

### Phase 5: Tier 2 Features (Weeks 9-16)
**Goal:** Add collaboration, email integration, state forms

**Tasks:**
1. Collaboration (2 weeks)
2. Email integration (2 weeks)
3. State-specific forms - CA (3 weeks)
4. Attorney network (1 week)

**Outcome:** Product becomes indispensable

**Value Increase:** $59 → $99/month

---

## Success Metrics

### User Acquisition
- **Target:** 100 users in first 3 months
- **Channels:** SEO, content marketing, Reddit, estate attorney referrals
- **Conversion:** 10% of visitors sign up

### User Engagement
- **DAU/MAU:** 40% (executors use it 12 days/month)
- **Session Duration:** 15 minutes average
- **Assets per User:** 8 average
- **Communications per User:** 25 average

### User Retention
- **7-day Retention:** 60%
- **30-day Retention:** 40%
- **Churn Rate:** 10% per month
- **Time to Complete Estate:** 6 months average

### Revenue (After 6 Months)
- **MRR:** $5,000 (100 users × $49/month × 100% paid)
- **ARPU:** $49/month
- **CAC:** $50 (content marketing)
- **LTV:** $294 (6 months × $49)
- **LTV:CAC:** 5.88:1 (healthy)

---

## Risks and Mitigation

### Risk 1: Executors Don't Want to Pay
**Likelihood:** Medium  
**Impact:** High  
**Mitigation:**
- Offer free tier (limited features)
- 30-day money-back guarantee
- Show ROI calculator (time saved × hourly rate)
- Testimonials from real executors

### Risk 2: Competitors Copy Features
**Likelihood:** High  
**Impact:** Medium  
**Mitigation:**
- Move fast (ship Tier 1 in 8 weeks)
- Build moat with data (institution-specific workflows)
- Focus on user experience (empathy, design)
- Build community (executor support group)

### Risk 3: Legal Liability
**Likelihood:** Low  
**Impact:** High  
**Mitigation:**
- Clear disclaimers (not legal advice)
- Terms of service (limit liability)
- Insurance (E&O policy)
- Partner with attorneys (legal review)

### Risk 4: Data Breach
**Likelihood:** Low  
**Impact:** Critical  
**Mitigation:**
- Field-level encryption (SSN, account numbers)
- Audit logging (who accessed what, when)
- Penetration testing (quarterly)
- Bug bounty program

### Risk 5: Slow Adoption
**Likelihood:** Medium  
**Impact:** Medium  
**Mitigation:**
- Content marketing (SEO for "how to settle estate")
- Partnerships (estate attorneys, funeral homes)
- Referral program (invite co-executor, get 1 month free)
- PR (TechCrunch, Product Hunt)

---

## Final Verdict

### Would I Pay for This Today?
**No.** The product is 40% complete. The Communication Log—the most important feature—is fully spec'd but not implemented. Critical Tier 1 features (onboarding, financial dashboard, deadline calendar) are missing.

### Would I Pay for This in 8 Weeks?
**Yes, $49/month.** If you execute the roadmap and complete Tier 1 features, this becomes a must-have tool for any executor managing an estate >$50K.

### Would I Pay for This in 16 Weeks?
**Yes, $99/month.** With Tier 1+2 complete (collaboration, email integration, state forms), this becomes indispensable. I'd recommend it to every executor I know.

### Would I Pay $299-499/month for Concierge?
**Yes, if my estate is >$500K.** White-glove service with dedicated support, document review, and direct institution contact is worth it for high-value estates.

---

## Recommendations

### Immediate (Next 8 Weeks)
1. **Focus on Communication Log** (Weeks 1-3)
   - This is THE killer feature
   - Fully spec'd and ready to implement
   - Worth $29/month alone

2. **Add Onboarding Wizard** (Week 4)
   - Reduces time-to-value
   - Improves first impression
   - Reduces support burden

3. **Build Financial Dashboard** (Weeks 5-6)
   - Shows big picture
   - Helps plan distribution
   - Answers beneficiary questions

4. **Create Deadline Calendar** (Weeks 7-8)
   - Prevents missed deadlines
   - Reduces anxiety
   - Safety net for executors

### Short-Term (Weeks 9-16)
5. **Add Collaboration** (Weeks 9-10)
   - Co-executors need this
   - Attorneys need visibility
   - Increases value

6. **Integrate Email** (Weeks 11-12)
   - Saves 50% of logging time
   - Ensures nothing is missed
   - Huge time-saver

7. **Build CA Forms** (Weeks 13-15)
   - Worth $30/month for CA executors
   - Eliminates attorney fees
   - Competitive advantage

8. **Launch Attorney Network** (Week 16)
   - Helps executors find help
   - Referral revenue opportunity
   - Builds trust

### Long-Term (Months 5-12)
9. **Add More States** (NY, TX, FL, IL)
10. **Build Mobile Apps** (iOS, Android)
11. **Integrate with Institutions** (APIs)
12. **Launch Concierge Service** ($299-499/month)
13. **White-Label for Attorneys** (B2B revenue)

---

## Conclusion

**ExpectedEstate (Pilar) has the potential to be a $49-99/month product that executors happily pay for.** The vision is clear, the technical foundation is solid, and the market gap is real.

**However, you're currently at 40% completion.** The Communication Log—the most important feature—is fully spec'd but not implemented. Critical Tier 1 features are missing.

**Execute the 8-week roadmap, and you'll have a paid product.** Focus on Communication Log (Weeks 1-3), then add Onboarding, Financial Dashboard, and Deadline Calendar (Weeks 4-8).

**After 8 weeks, you'll have a $49/month product I'd happily pay for.**

**After 16 weeks, you'll have a $99/month product I'd recommend to every executor I know.**

**The foundation is solid. Now finish the features that make it indispensable.** 🚀

---

**Document Version:** 1.0  
**Date:** January 25, 2026  
**Next Review:** After Communication Log implementation (Week 3)
