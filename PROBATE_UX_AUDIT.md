# Probate & Estate Settlement UX Audit

**Document Created:** February 19, 2026  
**Auditor:** AI Code Analysis  
**Scope:** User flow analysis for executors managing probate, assets, and institution follow-ups

---

## Executive Summary

**Overall Assessment:** The platform has comprehensive probate features but presents a fragmented, overwhelming experience for first-time executors. The UX assumes users understand probate concepts rather than guiding them through an unfamiliar, emotionally difficult process.

| Aspect | Score | Reason |
|--------|-------|--------|
| First-time executor clarity | 3/10 | Overwhelming, too many concepts |
| Asset tracking efficiency | 5/10 | Works but fragmented |
| Institution follow-up | 6/10 | Good tracking, poor integration |
| Overall flow coherence | 4/10 | Features exist but don't connect |
| "What do I do next?" | 7/10 | Next Action Widget saves it |

---

## Part 1: Top 5 User Flows

### Flow 1: Registration/Auth Flow
**File:** `src/pages/Auth.tsx`

**Purpose:** User account creation and authentication

**Steps:**
1. User selects account type (Executor, Advisor, or Heir/Beneficiary)
2. Enters full name, email, and password
3. Form validation (email format, password min 8 chars)
4. Account creation with role-based routing:
   - **Executor** → `/onboarding`
   - **Advisor** → `/advisor/onboarding`
   - **Heir** → `/dashboard` (if from invite) or invite link
5. Login mode supports forgot-password flow

**Key Features:** Role-based redirects, discovery data pre-population, invite flow detection

---

### Flow 2: Executor Onboarding Wizard
**File:** `src/pages/OnboardingWizard.tsx`

**Purpose:** New executor estate setup (8 steps)

**Steps:**
1. **Welcome** - Role confirmation (executor vs heir)
2. **Estate Basics** - Deceased name, date of death, state, estimated value/debt
3. **Track Scout** - Auto-calculates probate track (Small Estate, Spousal Petition, Formal Probate, etc.)
4. **Heirs & Beneficiaries** - Add heirs with relationships, minor status
5. **Death Certificate** - Upload vital document
6. **Key Assets** - Add institutions (banks, real estate, retirement accounts)
7. **Team Assembly** - Invite co-executors, attorneys, viewers
8. **Completion** - Redirect to dashboard

**Key Features:** State-specific guidance, intestacy distribution preview, authority recommendations

---

### Flow 3: Advisor Onboarding Flow
**File:** `src/pages/AdvisorOnboarding.tsx`

**Purpose:** Professional advisor profile setup for marketplace participation

**Steps:**
1. **Profile Setup** - Upload profile photo, write bio
2. **Expertise Selection** - Add specialties (Probate, Estate Tax, Trust Admin, etc.)
3. **Pricing** - Set hourly rate
4. **Verification** - Submit license number and document
5. **Stripe Connect** - Payment setup for receiving funds
6. **Admin Review** - Verification status (PENDING → VERIFIED)
7. **Dashboard Access** - Start accepting clients

**Key Features:** Document encryption, Stripe integration, verification workflow

---

### Flow 4: Heir/Beneficiary Invite Acceptance
**File:** `src/pages/AcceptInvite.tsx`

**Purpose:** Heirs join existing estate via secure invitation

**Steps:**
1. Executor sends invitation with unique token
2. Heir clicks invite link (`/invite/{token}`)
3. If not logged in:
   - Redirect to `/auth?mode=signup`
   - Pre-select HEIR role
   - Store redirect URL in session
4. After login/registration:
   - Auto-accept invitation via API
   - Grant view access to estate
5. Redirect to dashboard with limited "viewer" permissions

**Key Features:** Token validation, automatic role assignment, seamless auth-to-access flow

---

### Flow 5: Advisor Marketplace Booking
**File:** `src/pages/marketplace/AdvisorDirectory.tsx`

**Purpose:** Find and book verified estate professionals

**Steps:**
1. **Browse Directory** - Search by name, specialty, state
2. **Filter Results** - By:
   - Specialty (Probate, Estate Tax, Litigation, etc.)
   - Advisor Type (Attorney, CPA, Paralegal, Coach)
   - State served
   - Hourly rate range
   - Minimum rating
3. **View Profile** - See bio, credentials, reviews
4. **Book Consultation** - Select time slot and book
5. **Payment Processing** - Via Stripe

**Key Features:** Real-time filtering, verified badges, rating system, state-specific search

---

## Part 2: Probate Workflow Deep Dive

### Phase 1: Estate Setup & Track Determination
**Location:** `OnboardingWizard.tsx`

User enters estate basics (deceased name, date of death, state, estimated value). System auto-calculates the appropriate **probate track**:

| Track | Description |
|-------|-------------|
| `SMALL_ESTATE` | Under state threshold (e.g., $184,500 in CA) |
| `SPOUSAL_PETITION` | Surviving spouse simplified process |
| `FORMAL_PROBATE` | Full court proceedings |
| `TRUST_ADMIN` | Revocable/Irrevocable trust administration |
| `SUMMARY_ADMINISTRATION` | Florida-specific expedited process |

---

### Asset Finding & Discovery Flow

#### 1. Asset Detective (AI-Powered Discovery)
**Location:** `Assets.tsx` → "Asset Detective" tab

```
User uploads document (bank statement, tax return, insurance policy)
    ↓
DocumentScanner component processes via AI
    ↓
AI extracts:
  - Institution names
  - Account types
  - Potential hidden accounts (via ACH transfers, wire instructions)
    ↓
"Clues" displayed with confidence scores (e.g., 85%)
    ↓
User clicks "Claim" → Asset added to inventory
```

**Key Features:**
- Forensic analysis finds hidden accounts
- Cross-references transfers to discover unknown institutions
- Confidence scoring for each discovery

#### 2. Manual Asset Entry
**Location:** `AddAsset.tsx` + `Assets.tsx`

Users can manually add assets with:
- Institution name (searchable dropdown)
- Asset type (bank account, real estate, retirement, etc.)
- Authority type (court required, trustee direct, affidavit, etc.)
- Status tracking (discovered → notified → claimed → collected → closed)

#### 3. Asset Classification System
Assets are auto-classified by **authority requirement**:

| Authority Type | Description | Action Required |
|----------------|-------------|-----------------|
| `COURT_REQUIRED` | Requires Letters Testamentary | Probate process |
| `TRUSTEE_DIRECT` | Trust-owned assets | Trustee authorization |
| `AFFIDAVIT_SMALL` | Small estate transfer | Affidavit only |
| `BENEFICIARY_CONTRACT` | POD/TOD accounts | Death certificate |
| `SURVIVORSHIP_TITLE` | Joint tenancy | Death certificate |
| `LITIGATION_HOLD` | Contested/disputed | Legal resolution |

---

### Asset Tracking & Status Management

#### Taxonomy States
**File:** `src/lib/taxonomy.ts`

Each asset has a computed state that determines its priority:

| State | Meaning | UI Indicator |
|-------|---------|--------------|
| `action_required` | Needs immediate attention | 🔴 Red badge |
| `waiting` | Awaiting external response | 🟡 Amber badge |
| `blocked` | Missing authority/documents | 🟠 Orange badge |
| `ready` | Ready for next step | 🟢 Green badge |
| `monitoring` | In progress | 🔵 Blue badge |
| `resolved` | Completed | ⚪ Gray badge |

---

### Institution Follow-Up System

#### Follow-Ups Dashboard
**File:** `src/pages/FollowUps.tsx`

```
┌─────────────────────────────────────────────────────────┐
│  OVERDUE (Red)                                          │
│  ├── Follow-ups past due date                           │
│  ├── Shows days late                                    │
│  └── "Resolve" button to mark complete                  │
├─────────────────────────────────────────────────────────┤
│  SCHEDULED (Amber)                                      │
│  ├── Follow-ups due this week                           │
│  └── Date-based prioritization                          │
├─────────────────────────────────────────────────────────┤
│  WAITING ON THEM (Indigo)                               │
│  ├── Outbound communications awaiting response          │
│  ├── Response window tracking (5-10 days normal)        │
│  └── Auto-suggests follow-up after 10 days              │
└─────────────────────────────────────────────────────────┘
```

#### Communication Logging
**File:** `src/components/CommunicationLogDialog.tsx`

For each asset interaction, log:
- Method (phone, email, mail, in-person)
- Direction (inbound/outbound)
- Contact person & channel
- Subject & notes
- Status change (if any)
- Follow-up due date

#### Institution Dispatch Tracker
**File:** `src/pages/probate/Letters.tsx`

Specifically for **Letters Testamentary** tracking:

```
┌────────────────────────────────────────────────────────┐
│  Institution         │ Type      │ Status             │
├────────────────────────────────────────────────────────┤
│  Primary Bank        │ Bank      │ ✓ Acknowledged     │
│  Brokerage           │ Financial │ Sent (Mar 15)      │
│  Life Insurance      │ Insurance │ Requested          │
│  DMV                 │ Govt      │ Not Sent           │
│  ⚠️ Returned Stale   │ Bank      │ Returned — Stale   │
└────────────────────────────────────────────────────────┘
```

**Status Options:**
- `not_sent` → `requested` → `sent` → `acknowledged`
- `returned_stale` (triggers alert - letters >6 months old)

---

### Settlement Roadmap

**File:** `src/pages/SettlementRoadmapNew.tsx`

#### 6-Phase Action Plan

```
Phase 1: IMMEDIATE_ACTIONS
├── Obtain death certificates (10+ copies)
├── Secure the residence
├── Notify Social Security
└── Locate important documents

Phase 2: COURT_FILING
├── File probate petition
├── Attend hearing
├── Receive Letters Testamentary
└── Order certified copies

Phase 3: AUTHORITY_ESTABLISHMENT
├── Send Letters to banks
├── Open estate bank account
├── Notify creditors
└── File IRS Form 56

Phase 4: INVENTORY_ACCOUNTING
├── Complete asset inventory
├── Appraise real property
├── File inventory with court
└── Prepare accounting

Phase 5: CREDITOR_RESOLUTION
├── Review creditor claims
├── Pay valid debts
├── Reject invalid claims
└── File final tax returns

Phase 6: DISTRIBUTION_CLOSING
├── Distribute to beneficiaries
├── Obtain receipts
├── File final accounting
└── Close estate with court
```

---

## Part 3: UX Problems (Brutal Honesty)

### Problem 1: Information Overload on Dashboard

**File:** `src/pages/Dashboard.tsx`

A new executor sees **10+ widgets** competing for attention:

```
┌─────────────────────────────────────────────────────────────┐
│  4 stat cards (Gross Estate Value, Progress, Tasks, Track) │
│  + Estate Journey Banner                                    │
│  + "New to estate settlement?" tip                          │
│  + Next Action Widget                                       │
│  + Critical Dates (deadlines)                               │
│  + Tax Alerts                                               │
│  + Support Requested (Follow-ups)                          │
│  + Recent Proof of Work (timeline)                         │
│  + Attorney Review Widget                                   │
│  + Settlement Health Engine (4 scores)                     │
│  + Safety Net Widget                                        │
└─────────────────────────────────────────────────────────────┘
```

**Impact:** A grieving executor doesn't know where to look first.

---

### Problem 2: Fragmented Asset Management

Assets are split across **multiple pages with unclear relationships**:

| Page | What it does | When to use |
|------|--------------|-------------|
| `Assets.tsx` | Main ledger | Always? |
| `AddAsset.tsx` | Add new asset | When discovering assets |
| `AssetDetail.tsx` | Single asset view | To update status? |
| `AssetSaleAuthorization.tsx` | Sale approval | When selling? |
| `probate/Letters.tsx` | Authority tracking | For probate assets? |
| `FollowUps.tsx` | Asset follow-ups | When waiting on institutions? |

**Impact:** An executor with 15 assets has no clear path. Do I add an asset in Assets page? Track follow-ups there or in Follow-Ups page? Where do I log that Wells Fargo acknowledged my Letters?

---

### Problem 3: Confusing Status Systems

There are **at least 3 different status systems**:

**Asset Status** (from `StatusBadge.tsx`):
```
discovered → notified → claimed → collected → closed
```

**Taxonomy State** (computed from `taxonomy.ts`):
```
action_required | waiting | blocked | ready | monitoring | resolved
```

**Authority Type** (legal classification):
```
COURT_REQUIRED | TRUSTEE_DIRECT | AFFIDAVIT_SMALL | BENEFICIARY_CONTRACT | SURVIVORSHIP_TITLE | LITIGATION_HOLD
```

**Impact:** An asset shows "Status: Notified" but also "State: action_required" and "Authority: COURT_REQUIRED". What does this mean? Which one matters? The executor just wants to know: *"What do I do next?"*

---

### Problem 4: Follow-Ups vs. Roadmap Tasks - Disconnected

```
FollowUps.tsx:  Institution follow-ups, overdue items, waiting-on-them
SettlementRoadmapNew.tsx:  6 phases with checkable tasks
```

**Impact:** Both show "things to do" but they're different systems:
- Roadmap: "File probate petition" (high-level)
- Follow-Ups: "Call Wells Fargo about account #1234" (specific)

An executor asks: *"If I complete a Follow-Up, does it update the Roadmap? Are they connected?"* **No, they're not.**

---

### Problem 5: Asset Detective Buried in a Tab

**File:** `src/pages/Assets.tsx`

The AI-powered asset discovery (the coolest feature!) is hidden under a tab:

```tsx
<TabsTrigger value="detective">
    <Sparkles className="w-3.5 h-3.5 mr-2" />
    Asset Detective
</TabsTrigger>
```

**Impact:** A new executor who just lost someone might not even know what assets exist. The tool that helps them **discover hidden accounts** should be prominent, not buried behind a tab with a confusing name.

---

### Problem 6: Letters Testamentary Tracking is Separate from Assets

**File:** `src/pages/probate/Letters.tsx`

This page has its own institution tracker:

```typescript
const DEFAULT_INSTITUTIONS: Institution[] = [
  { id: "bank_primary", name: "Primary Bank / Checking", ... },
  { id: "brokerage", name: "Investment / Brokerage Account", ... },
];
```

**Impact:** This is **separate** from the Assets ledger. So an executor:
1. Adds "Chase Bank" as an asset in Assets page
2. Then goes to Letters page
3. Sees "Primary Bank / Checking" (not linked to the asset they added)
4. Has to manually track status in TWO places

**This is duplicated effort and will drift out of sync.**

---

### Problem 7: No Clear "Start Here" for New Executors

The onboarding wizard collects information, but after completion, the executor lands on a dashboard with 10+ widgets. There's no:

- "First, do this" (except the Next Action Widget, which is one of many)
- Progress indicator showing "You're on step 1 of 50"
- Guided tour or checklist for the first week

---

## Part 4: What Works Well

1. **Next Action Widget** (`NextActionWidget.tsx`) - Shows ONE thing to do
2. **Deadline Tracker** - Clear statutory deadlines with consequences
3. **Authority recommendation** in onboarding - Correctly identifies probate track
4. **Asset Detective AI** - Actually helpful for discovery (if you find it)
5. **Communication logging** - Good audit trail for institution interactions

---

## Part 5: Recommendations

### Recommendation 1: Single Source of Truth for Assets

Merge the institution tracking from `Letters.tsx` INTO the asset records. Each asset should have:
- Institution name
- Authority document sent (yes/no/date)
- Institution acknowledgment status
- All in ONE place

**Implementation:**
- Add `lettersSentAt` and `lettersAcknowledgedAt` fields to Asset model
- Remove duplicate institution list from Letters.tsx
- Show Letters tracking inline with each asset

---

### Recommendation 2: Simplify Status to One System

Replace the 3 status systems with a single, intuitive flow:

```
DISCOVERED → DOCUMENTED → AUTHORITY_SENT → CLAIMED → DISTRIBUTED
```

With clear "blocked" flags when something is preventing progress.

**Implementation:**
- Deprecate Taxonomy State in favor of Asset Status
- Make Authority Type informational only (not a status)
- Add "blockedReason" field when asset can't progress

---

### Recommendation 3: Guided First Week

After onboarding, instead of the full dashboard, show:

```
┌─────────────────────────────────────────┐
│  Your First Week Checklist               │
│                                          │
│  ☐ Day 1: Order 10 death certificates   │
│  ☐ Day 2: Secure the residence          │
│  ☐ Day 3: Locate the will               │
│  ☐ Day 4: Notify Social Security        │
│  ☐ Day 5: Find all bank accounts        │
│                                          │
│  [Start Guided Tasks]                    │
└─────────────────────────────────────────┘
```

**Implementation:**
- Create `FirstWeekChecklist.tsx` component
- Show for first 7 days after onboarding completion
- Gradually reveal more dashboard widgets as tasks complete

---

### Recommendation 4: Prominent Asset Discovery

Put the "Asset Detective" on the main dashboard during the first 30 days:

```
┌─────────────────────────────────────────────────────────┐
│  🔍 Find Hidden Assets                                   │
│                                                          │
│  Upload bank statements, tax returns, or insurance      │
│  policies to discover accounts you might not know about │
│                                                          │
│  [Upload Document]  [Enter Manually]                    │
│                                                          │
│  Already found: 3 accounts                               │
└─────────────────────────────────────────────────────────┘
```

**Implementation:**
- Create `AssetDiscoveryWidget.tsx` for dashboard
- Show prominently for first 30 days
- Collapse to sidebar once user has 5+ assets

---

### Recommendation 5: Connect Follow-Ups to Roadmap

When an executor logs "Called Wells Fargo, they acknowledged Letters":
- Auto-update the Roadmap task "Send Letters to banks"
- Show progress: "3 of 8 institutions acknowledged"

**Implementation:**
- Create relationship between FollowUps and Roadmap tasks
- Add `roadmapTaskId` field to Communication model
- Auto-complete roadmap tasks when related follow-ups resolve

---

### Recommendation 6: Consolidate Dashboard Widgets

Reduce dashboard from 10+ widgets to 4 focused areas:

```
┌─────────────────────────────────────────────────────────┐
│  1. NEXT ACTION (What to do today)                      │
│     Single, prominent call-to-action                     │
├─────────────────────────────────────────────────────────┤
│  2. PROGRESS (Where you are)                            │
│     Phase indicator + percentage complete                │
├─────────────────────────────────────────────────────────┤
│  3. DEADLINES (What's urgent)                           │
│     Next 3 statutory deadlines                           │
├─────────────────────────────────────────────────────────┤
│  4. ASSETS (Your inventory)                             │
│     Count + quick link to ledger                         │
└─────────────────────────────────────────────────────────┘
```

Move other widgets (Health Engine, Safety Net, Attorney Review) to secondary pages.

---

## Conclusion

The ExpectedEstate platform has **comprehensive features** for probate and estate settlement, but the UX **assumes the executor already understands probate**. For someone who just lost a loved one and has never done this before, it's:

- **Too much** - Information overload from day one
- **Too fragmented** - Related features scattered across pages
- **Too technical** - Multiple status systems, legal terminology everywhere

The fix isn't adding more features—it's **simplifying and connecting** what already exists. A grieving executor needs a clear path, not a powerful toolbox they have to figure out.

---

**Priority Actions:**
1. Merge Letters tracking into Assets (eliminate duplication)
2. Unify status systems (one clear progress indicator)
3. Add guided first-week experience
4. Prominently feature Asset Discovery
5. Connect Follow-Ups to Roadmap progress