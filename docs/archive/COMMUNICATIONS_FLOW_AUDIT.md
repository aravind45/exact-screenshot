# COMMUNICATIONS FLOW AUDIT
## Brutal Honest Assessment from an Executor's Perspective

**Audited:** February 19, 2026  
**Auditor:** AI Assistant  
**Focus:** Institution contact + follow-up workflow for probate executors

---

## EXECUTIVE SUMMARY

**Verdict: 🚨 CRITICAL GAPS — The system has THREE separate, disconnected tracking mechanisms for the same real-world activity. An executor trying to "contact a bank and follow up" must navigate three different pages with no cross-linking. This is the #1 UX failure in the platform.**

---

## THE THREE DISCONNECTED SYSTEMS

### 1. Letters Testamentary Tracker (`/probate/letters`)
**Purpose:** Track which institutions received certified copies of Letters Testamentary

**What it does:**
- Lists 12 DEFAULT_INSTITUTIONS hardcoded in the frontend
- Tracks status: `not_sent` → `requested` → `sent` → `acknowledged` → `returned_stale`
- Stores data in **localStorage only** (`letters_tracker_${estateId}`)
- No backend persistence, no audit trail, no cross-device sync

**Critical Flaws:**
| Issue | Impact |
|-------|--------|
| Hardcoded list | Executor with 5 bank accounts must manually add 4 custom entries |
| localStorage only | Data lost if user clears browser or switches devices |
| No link to Assets | "Primary Bank" in tracker has no connection to actual Asset record |
| No follow-up dates | Can track "sent" but no reminder to follow up in 10 days |
| No audit log | If an institution claims they never received letters, executor has no proof |

### 2. Communications Model (Database)
**Purpose:** Store all communications with institutions

**Schema:**
```
Communication {
  estateId, assetId, type, direction, occurredAt,
  institutionName, contactName, contactChannel,
  subject, notes,
  followUpDueAt, followUpCompletedAt, followUpCompletedBy,
  statusChange, statusChangeEffectiveAt
}
```

**Critical Flaws:**
| Issue | Impact |
|-------|--------|
| Requires `assetId` | Cannot log a communication WITHOUT an asset (but Letters are pre-asset) |
| No `communicationType` for Letters | No distinction between "sent Letters Testamentary" vs "called about balance" |
| `institutionName` is free-text | No FK to Institution table → no unified view by institution |
| No staleness tracking | Letters go stale after 6 months — no automated warning |

### 3. FollowUps Page (`/follow-ups`)
**Purpose:** Show overdue/upcoming follow-ups

**What it does:**
- Shows Communications where `followUpDueAt` is set
- Groups into: Overdue, This Week, Waiting on Them
- Has "Waiting on Them" logic: if >10 days since outbound, suggests follow-up

**Critical Flaws:**
| Issue | Impact |
|-------|--------|
| Only shows Communication records | Letters tracker entries don't appear here |
| No "Waiting for Letters Acknowledgment" | The most common executor follow-up is invisible |
| No escalation automation | After 10 days, shows "Follow-Up Recommended" but doesn't CREATE the follow-up |
| No link back to Letters page | Executor sees "Chase Bank" in follow-up but no way to see Letters status |

---

## THE REAL-WORLD WORKFLOW (What Executors Actually Do)

### Phase 1: Getting Letters Testamentary
1. Attend probate hearing → receive signed Order
2. Go to court clerk → order certified copies
3. **DECISION: Which institutions need copies?**

### Phase 2: Sending Letters to Institutions
4. For each institution:
   - Find contact info (phone/address)
   - Call or mail certified copy
   - **TRACK: When sent, to whom, expected response**
   - **FOLLOW UP: If no response in 10 days**

### Phase 3: Asset-Specific Communications
5. Once Letters acknowledged:
   - Request account balance
   - Request transfer forms
   - Submit claims
   - **TRACK: Each interaction per asset**

---

## WHERE THE PLATFORM FAILS EACH PHASE

### Phase 1: ✅ Partially Solved
- `/probate/letters` Tab 1 has good guidance (4 steps)
- **Missing:** Integration with court deadline tracking

### Phase 2: ❌ BROKEN
- Letters tracker uses localStorage (lost on device switch)
- No follow-up reminders for "sent but not acknowledged"
- No proof-of-mailing tracking
- **Executor has no visibility into which institutions are ghosting them**

### Phase 3: ⚠️ FRAGMENTED
- Communications require an Asset, but many communications happen BEFORE assets are known
- FollowUps page shows only a slice of communications
- No unified "Institution 360°" view

---

## BRUTAL HONEST ASSESSMENT

### What's Broken

**1. The "Letters Tracker" is a toy, not a tool**
- localStorage in 2026 for financial/legal tracking is unacceptable
- No audit trail = no legal protection
- If an executor gets sued for "failure to diligently administer," they have NO proof from this tracker

**2. "Follow-Ups" is a view, not a workflow**
- It shows what's due but doesn't help CREATE follow-ups
- No "Schedule follow-up in 10 days" button when marking something as "sent"
- No escalation path (e.g., "After 3 attempts, recommend certified mail")

**3. No Institution-Centric View**
- Executor cannot see: "Show me everything about Chase Bank"
- Must jump between: Assets page, Letters page, Follow-ups page
- Each page has different institution names (free-text, no normalization)

**4. Asset-First Bias**
- Communications require `assetId` — but executor communicates about the ESTATE before assets are known
- Letters Testamentary are estate-level, not asset-level
- Creditor notices are estate-level

---

## RECOMMENDATIONS

### Immediate Fixes (1-2 days)

**1. Persist Letters Tracker to Database**
```sql
-- New table
model LettersDispatch {
  id               String   @id @default(uuid())
  estateId         String   @map("estate_id")
  institutionName  String
  institutionType  String
  status           String   @default("not_sent")
  sentAt           DateTime?
  acknowledgedAt   DateTime?
  followUpDueAt    DateTime?
  certifiedCopyUrl String?  -- proof of mailing
  notes            String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  
  estate Estate @relation(fields: [estateId], references: [id])
  @@index([estateId, status])
}
```

**2. Auto-Generate Follow-Ups**
When user sets status to `sent`:
- Auto-create `followUpDueAt = now + 10 days`
- Show in FollowUps page automatically

**3. Link Letters to Follow-Ups**
Add to FollowUps page:
```tsx
// Show LettersDispatch items that need follow-up
const lettersNeedingFollowUp = lettersDispatches.filter(
  l => l.status === 'sent' && !l.acknowledgedAt && isPast(l.followUpDueAt)
);
```

### Medium-Term (1 week)

**4. Institution 360° View**
Create `/institutions/:name` page showing:
- All assets with this institution
- All communications (including Letters)
- All follow-ups
- Contact info

**5. Communication Log Improvements**
- Allow `assetId` to be NULL (estate-level communications)
- Add `communicationCategory`: `LETTERS_TESTAMENTARY` | `CREDITOR_NOTICE` | `ASSET_INQUIRY` | `CLAIM_SUBMISSION`

**6. Staleness Alerts**
Letters go stale after 6 months. Add:
- `expiresAt` on LettersDispatch
- Dashboard warning when Letters are approaching staleness
- One-click "Request Reissuance" workflow

### Long-Term (2+ weeks)

**7. Automated Follow-Up Sequences**
- After sending Letters: "Day 10: Call if no acknowledgment"
- After creditor notice: "Day 30: Follow up if no claim"
- After asset claim: "Day 14: Check claim status"

**8. Proof of Mailing Integration**
- Generate cover letters with tracking numbers
- Store USPS/certified mail receipts
- Export for legal defense

---

## THE "HAPPY PATH" THAT SHOULD EXIST

### Executor Workflow (Desired State)

1. **Letters Page**
   - Click "Mark as Sent" for Chase Bank
   - System prompts: "When did you send it?" → Date picker
   - System auto-creates: Follow-up due in 10 days
   - System shows: "We'll remind you to follow up on Feb 29"

2. **Dashboard**
   - "You have 3 Letters awaiting acknowledgment"
   - "Chase Bank: 8 days since sent — response window active"

3. **Follow-Ups Page**
   - Shows Letters follow-ups AND asset communications
   - One unified view of "What am I waiting for?"

4. **Institution Click**
   - Click "Chase Bank" → See all interactions, assets, and status

---

## CONCLUSION

The current communications flow is **fragmented across three disconnected systems** with no data sharing. An executor who sends Letters Testamentary to a bank has:
- No reminder to follow up
- No proof of mailing
- No unified view of that relationship

**The #1 priority fix:** Persist the Letters Tracker to the database and auto-generate follow-ups. This single change would close the biggest gap in the executor workflow.

**The #2 priority fix:** Create an Institution-centric view so executors can see all interactions with a given institution in one place.

Without these fixes, the platform fails executors at the most critical, repetitive task in estate settlement: **contacting institutions and following up until they respond.**