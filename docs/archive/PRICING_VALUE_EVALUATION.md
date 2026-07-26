# Pricing & Value Evaluation: Would I Pay $49/month?

## Executive Summary

**Honest Answer: Getting there — the core automation is now built.**

The product has crossed from "task tracker + educational guide" into genuine automation territory. Form generation, letter generation, and deadline automation are now implemented. The remaining gap is mobile, e-filing, and physical mailing.

---

## 🗂️ Implementation Status (Updated Feb 2026)

### ✅ IMPLEMENTED

| Feature | What Was Built | Value Delivered |
|---------|---------------|-----------------|
| **Form Generation** | DE-111, DE-140, DE-150, DE-160, DE-165 auto-filled PDFs via DocumentService — pulls estate name, case number, executor, assets | Saves 3-5 hours of form-filling |
| **Letter Generation** | "Letter PDF" button on every institution row in Letters page → generates professional US Letter PDF via `pdf-lib` with executor details, case number, institution name, formal body, word-wrap | Saves 1-2 hours per letter |
| **DB-backed Letters Tracking** | `LettersDispatch` model with CRUD + status tracking (pending → sent → acknowledged) + auto-scheduled follow-up items | No more manual spreadsheet tracking |
| **Deadline Automation** | `DeadlineTracker` widget: "Auto-Generate" button cascades deadlines from hearing date; "Recompute" button updates on new data; deadlines calculated per state rules | Never miss a court deadline |
| **Follow-Ups Integration** | LettersDispatch items surface in FollowUps page with pending-followup endpoint | Unified action list |
| **Advisor/Attorney Review** | Advisor Marketplace with bookings, profiles, availability, and review UI built | Trust and peace of mind pathway |

### 🔮 FUTURE (Not Yet Implemented)

| Feature | What's Needed | Estimated Effort |
|---------|--------------|-----------------|
| **Push Notifications** | Browser/email alerts: "Claim deadline in 3 days" — needs notification service (SendGrid/Firebase) | 1-2 weeks |
| **Mobile App** | Native iOS/Android with push notifications, camera scan for document upload, offline mode | 4-8 weeks |
| **E-filing API** | Court e-filing integration where available (Tyler Technologies / Odyssey API) | 4-6 weeks + court partnerships |
| **Print & Mail Service** | Physical mailing API (Lob.com) — user clicks, we print and USPS-mail the letter | 1-2 weeks |
| **Attorney Liability Guarantee** | Attorney review add-on with liability coverage for generated documents | Partnership / legal work |
| **Email Deadline Reminders** | Scheduled jobs to send email reminders at 7-day, 3-day, 1-day intervals | 1 week |

---

## The Core Gap: Tracking vs. Doing

### What Users Still Do Manually (Before This Build)

| Task | Current Experience | Time Spent |
|------|-------------------|------------|
| Download court forms | Visit external websites, find right forms | 30-60 min |
| Fill forms | Manually type name, case number, asset lists | 2-4 hours |
| Write letters to banks | Compose from scratch in Word | 1-2 hours per letter |
| Mail documents | Print, envelope, stamp, post office | 30 min per batch |
| Track deadlines | Check against court rules manually | Ongoing |
| Determine required forms | Read guides, cross-reference | 1-2 hours |

**Total manual work: 8-15 hours** → most of this is now handled by the app.

---

## Value Comparison

| Alternative | Cost | What You Get |
|-------------|------|--------------|
| **Probate Attorney** | $3,000 - $10,000 | Full service + liability protection + peace of mind |
| **LegalZoom** | $79 - $99 one-time | Form templates, no guidance |
| **Court Self-Help Center** | Free | Guidance + blank forms |
| **This Product (Current)** | $49/mo = **$588/year** | ✅ Form gen + letter gen + deadline automation + tracking |
| **This Product (Full Vision)** | $49/mo | 80% of attorney work at 5% cost + e-filing + mobile |

---

## What's Missing for $49/month

### 1. Form Generation (Critical) ✅ IMPLEMENTED

**Current:** Auto-generates filled PDFs — DE-111, DE-140, DE-150, DE-160, DE-165 — with estate data (estate name, case number, executor name, address, asset list, heir names). User prints, signs, files.

**Value unlocked:** Saves 3-5 hours of form-filling ✅

### 2. Letter Generation (Critical) ✅ IMPLEMENTED

**Current:** "Letter PDF" button next to each institution in the Letters page. Pulls executor name, estate, case number, institution name. Outputs professional PDF letter ready to print and mail. System auto-tracks follow-up.

**Value unlocked:** Saves 1-2 hours per letter ✅

🔮 **Future:** "Print and mail" service via Lob.com API — one click sends physical letter without user touching printer.

### 3. Deadline Automation (Important) ✅ IMPLEMENTED

**Current:** Enter hearing date once → "Auto-Generate Deadlines" cascades all deadlines (notice to creditors, claims deadline, inventory deadline, etc.) using state-specific rules. "Recompute" updates on data changes.

**Value unlocked:** Never miss a deadline ✅

🔮 **Future:** Push notifications (browser + email) — "Claim deadline in 3 days" automated reminders.

### 4. Filing Assistance (Important) 🔮 FUTURE

**Current:** "File with court" instruction only.

**Needed:** 
- E-filing API integration (Tyler Technologies / Odyssey where available)
- "Print and mail" service option (Lob.com)
- Filing checklist with court-specific requirements

**Value unlocked:** One-click filing

### 5. Mobile Experience (Nice to Have) 🔮 FUTURE

**Current:** Web only — responsive but not native.

**Needed:**
- Native app with push notifications
- Camera scan for document upload
- Quick status checks on the go

### 6. Attorney Safety Net (Differentiator) — Partially Implemented

**Current:** Advisor Marketplace with bookings, profiles, availability — attorneys can be booked through the platform.

🔮 **Future needed:**
- "Attorney review" add-on with explicit liability guarantee for generated documents
- Revenue share / partnership model formalized
- On-demand attorney consultation via video call integration

---

## The "Magic Moment" — Now Implemented ✅

### Generate Letter to Bank (LIVE)

```
User clicks: [Letter PDF] next to "Primary Bank - Checking"

System pulls:
- Estate name: "Estate of John Smith"
- Case number: "24STPB00123"
- Executor: "Jane Smith"
- Executor address: "456 Oak Ave, Los Angeles, CA 90001"
- Institution: "Bank of America"

System outputs:
┌────────────────────────────────────────────────────────────┐
│  LETTER OF AUTHORITY                                        │
│                                                             │
│  Bank of America                                            │
│  PO Box 982234                                              │
│  Los Angeles, CA 90098                                      │
│                                                             │
│  Re: Estate of John Smith, Deceased                         │
│      Case No: 24STPB00123                                   │
│                                                             │
│  To Whom It May Concern:                                    │
│                                                             │
│  I am the duly appointed Executor of the Estate of          │
│  John Smith, who died on January 15, 2024. Letters          │
│  Testamentary were issued to me by the Superior Court       │
│  of California, County of Los Angeles on February 20,       │
│  2024.                                                      │
│                                                             │
│  Please close the following account(s) and remit            │
│  the balance to the estate:                                 │
│                                                             │
│  • Checking Account ending in 4521                          │
│                                                             │
│  Enclosed please find a certified copy of the Letters       │
│  Testamentary. Please confirm receipt and process           │
│  this request within 30 days.                               │
│                                                             │
│  Sincerely,                                                 │
│  Jane Smith, Executor                                       │
│  456 Oak Ave, Los Angeles, CA 90001                         │
│  (555) 123-4567                                             │
└────────────────────────────────────────────────────────────┘

User downloads PDF → Prints → Mails → System auto-tracks follow-up ✅
```

**This workflow now exists.** Built with `pdf-lib` on the server, triggered by a per-row "Letter PDF" button in the Letters page.

---

## Pricing Recommendations

### Current State Positioning (With Automation ✅)

| Tier | Price | Value Proposition |
|------|-------|-------------------|
| Basic | $15/month or $49/year | Task tracker + deadline reminders |
| Pro | $29/month | + Form generation + letter generation |
| **Premium** | **$49/month** | **✅ NOW JUSTIFIED** — Full automation: forms, letters, deadline auto-cascade, advisor access |

### Target State Positioning (With E-filing + Mobile 🔮)

| Tier | Price | Value Proposition |
|------|-------|-------------------|
| Self-Service | $49/month | Form generation + letter generation + deadline automation |
| Assisted | $99/month | + Attorney review of all documents |
| Full-Service | $199 flat + $49/month | + E-filing + print-and-mail + dedicated support |

### One-Time vs. Subscription

| Model | Price | Duration | Psychology |
|-------|-------|----------|------------|
| One-time | $199 | Lifetime access | "I pay once, I'm done" |
| Subscription | $49/month | Until estate closes (avg 8 months) | $392 total |

**Recommendation:** Hybrid — $99 one-time setup + $29/month for ongoing tracking.

---

## Priority Build Order (Remaining 🔮)

1. **Email Deadline Reminders** — Highest impact / easiest to build
   - SendGrid scheduled jobs at 7-day, 3-day, 1-day before deadline
   - Estimated effort: 1 week

2. **Print & Mail Service** — Removes last manual step in letter workflow
   - Lob.com API integration
   - Estimated effort: 1-2 weeks

3. **E-filing Integration** — Major differentiator
   - Tyler Technologies / Odyssey API where available
   - Estimated effort: 4-6 weeks + court approvals

4. **Mobile App** — Convenience + push notifications
   - React Native or PWA first
   - Estimated effort: 4-8 weeks

5. **Attorney Liability Add-on** — Trust + upsell
   - Formalize partnership model
   - Estimated effort: 2-4 weeks (partnership) + legal

---

## Conclusion

**Previous state:** Better spreadsheet for probate → Worth $15-29/month or $49-99 one-time

**Current state (Feb 2026):** ✅ **Form generation + letter generation + deadline automation = $49/month justified**

**Full vision state:** TurboTax for Probate with e-filing + mobile → Worth $49-99/month

**The gap to full vision:** Email reminders (1 wk) + print-and-mail (2 wks) + e-filing (6 wks) = ~2-3 months of focused build.

The estate data is captured. The PDF pipeline is live. The attorney marketplace exists. The next unlock is notifications and physical mail automation.
