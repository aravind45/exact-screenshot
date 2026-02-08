# Enhanced Settlement Phase Tasks (Antigravity Aligned)

## Overview

This document outlines the enhanced task list that integrates Antigravity's recommendations into our existing 6-phase roadmap. Each phase now includes both **manual tasks** (current) and **automated features** (to be built).

---

## PHASE 0: IMMEDIATE ACTIONS (Week 1-2)

### Manual Tasks (✅ Implemented)
1. Secure the Property
2. Notify Social Security Administration
3. Cancel Credit Cards & Subscriptions
4. Locate Will and Important Documents
5. Open Estate Bank Account
6. Pay Immediate Bills

### Automated Features (❌ To Build)

#### 1. Practical Kit Checklist Module
**Component**: `PracticalKitChecklist.tsx`

**Features**:
- **Property Security Tracker**
  - [ ] Change locks (date completed, locksmith contact)
  - [ ] Install timers on lights
  - [ ] Forward mail to executor address
  - [ ] Notify neighbors
  - [ ] Check insurance coverage
  
- **Pet Care Tracker**
  - [ ] Temporary housing location
  - [ ] Caretaker contact info
  - [ ] Vet information
  - [ ] Food/medication schedule
  - [ ] Permanent placement plan
  
- **Mail Forwarding Wizard**
  - [ ] USPS change of address form
  - [ ] Notify important senders
  - [ ] Set up mail scanning service
  - [ ] Track forwarding expiration

**UI Location**: Dashboard widget + dedicated page

---

#### 2. Early Notifier System
**Component**: `NotificationWizard.tsx`

**Templates**:
1. **SSA Notification**
   - Pre-filled with deceased info
   - One-click send or print
   - Track notification date
   - Upload confirmation

2. **Former Employer Notification**
   - Template letter
   - List of employers from asset discovery
   - Batch send capability
   - Track responses

3. **Utility Notification**
   - Electric, gas, water, internet, phone
   - Transfer to estate account
   - Track account numbers
   - Monitor final bills

**UI Location**: Phase 0 task list + notification center

---

## PHASE 1: COURT FILING (Week 3-8)

### Manual Tasks (✅ Implemented)
1. File Petition for Probate (DE-111)
2. Publish Creditor Notice
3. Mail Notice to Known Creditors
4. Attend Probate Hearing
5. Receive Letters Testamentary (DE-150)

### Automated Features (❌ To Build)

#### 1. DE-111 Form Generator
**Component**: `DE111Generator.tsx`

**Features**:
- Auto-populate from estate profile
  - Deceased name, DOB, DOD, SSN
  - Executor name, address, phone
  - Attorney info (if applicable)
  - Heirs and beneficiaries
  - Asset summary
- Generate court-ready PDF
- Preview before download
- Save draft for editing
- Track filing status
- Upload filed copy

**Data Sources**:
- Estate profile
- Asset ledger
- Heir information
- Document vault

**UI Location**: Probate Hub + Phase 1 tasks

---

#### 2. Court Calendar Module
**Component**: `CourtCalendar.tsx`

**Features**:
- **Hearing Date Tracking**
  - Add hearing date
  - Countdown timer (X days until hearing)
  - Email/SMS reminders (7 days, 3 days, 1 day before)
  - Court location and room number
  - Judge name
  
- **Publication Deadline Tracking**
  - 3-week publication requirement
  - Track publication dates
  - Upload proof of publication
  - Deadline alerts
  
- **Calendar Integration**
  - Export to Google Calendar
  - Export to Outlook
  - iCal download
  - Sync with phone calendar

**UI Location**: Dashboard widget + Probate Hub

---

#### 3. Authority Hub Enhancement
**Component**: `AuthorityGate.tsx`

**Features**:
- **Letters Received Gate**
  - Checkbox: "Letters Testamentary Received"
  - Date received field
  - Upload Letters (DE-150) PDF
  - Number of certified copies ordered
  
- **Phase Gating**
  - Block Phase 2+ tasks until Letters received
  - Show "🔒 Locked until Letters received" message
  - Visual indicator in roadmap chevron
  - Unlock animation when Letters uploaded
  
- **Letters Management**
  - Track which institutions received copies
  - Log copy numbers used
  - Reorder reminder when running low

**UI Location**: Probate Hub + roadmap chevron

---

## PHASE 2: ASSET DISCOVERY & VALUATION (Month 2-4)

### Manual Tasks (✅ Implemented)
1. Freeze All Financial Accounts
2. Obtain Date-of-Death Values
3. Hire Probate Referee for Real Property
4. Complete Inventory & Appraisal (DE-160)
5. File Inventory with Court

### Automated Features (❌ To Build)

#### 1. Asset Ledger Enhancements
**Component**: Enhanced `AssetCard.tsx` and `AssetDetail.tsx`

**New Fields**:
```typescript
interface Asset {
  // ... existing fields ...
  
  // Freeze tracking
  freezeStatus: 'PENDING' | 'FROZEN' | 'UNFROZEN';
  freezeRequestDate?: Date;
  frozenDate?: Date;
  freezeConfirmationUrl?: string;
  
  // DOD valuation
  dodValue?: number;
  dodValueDate?: Date;
  dodValueProofUrl?: string;
  dodValueSource?: string; // 'STATEMENT' | 'APPRAISAL' | 'ESTIMATE'
  
  // Appraisal tracking
  appraisalStatus?: 'NOT_NEEDED' | 'HIRED' | 'IN_PROGRESS' | 'COMPLETE';
  appraisalCompany?: string;
  appraisalOrderDate?: Date;
  appraisalCompletionDate?: Date;
  appraisalValue?: number;
  appraisalUrl?: string;
}
```

**New Actions**:
- **Freeze Account Button**
  - Click to mark as "Freeze Requested"
  - Upload freeze confirmation letter
  - Mark as "Frozen" when confirmed
  
- **DOD Value Entry**
  - Enter value from statement
  - Upload proof document
  - Auto-calculate total estate value
  
- **Appraisal Tracking**
  - Mark "Appraisal Hired"
  - Enter appraiser contact
  - Upload appraisal report
  - Mark "Complete"

**UI Location**: Asset detail page + asset cards

---

#### 2. DE-160 Inventory Generator
**Component**: `DE160Generator.tsx`

**Features**:
- Export all assets to DE-160 format
- Group by asset type (real property, personal property, etc.)
- Calculate total estate value
- Include appraisal attachments
- Generate court-ready PDF
- Track submission status
- Upload filed copy

**Data Sources**:
- Asset ledger (all assets)
- DOD values
- Appraisal reports

**UI Location**: Probate Hub + Phase 2 tasks

---

## PHASE 3: CREDITOR CLAIMS (Month 4-8)

### Manual Tasks (✅ Implemented)
1. Wait for 4-Month Claim Period
2. Review Submitted Claims
3. Reject Invalid Claims
4. Pay Approved Claims
5. File Proof of Notice

### Automated Features (❌ To Build)

#### 1. Liabilities Ledger
**Component**: `LiabilitiesLedger.tsx`

**Features**:
- **Add Liability**
  - Type: Mortgage, Credit Card, Medical, Funeral, Tax, Other
  - Creditor name
  - Amount owed
  - Due date
  - Account number
  - Contact info
  
- **Track Claims**
  - Claim filed date
  - Claim amount
  - Supporting documents
  - Review status
  - Approval/rejection decision
  
- **Payment Tracking**
  - Payment date
  - Payment amount
  - Payment method
  - Confirmation number
  - Receipt upload

**UI Location**: New "Liabilities" page + dashboard widget

---

#### 2. Claims Priority Engine
**Component**: `ClaimsPriorityEngine.tsx`

**California Priority Rules**:
1. **Priority 1**: Funeral and burial expenses (up to $15,000)
2. **Priority 2**: Estate administration costs (attorney, executor fees)
3. **Priority 3**: Secured debts (mortgage, car loans)
4. **Priority 4**: Taxes (federal, state, property)
5. **Priority 5**: Unsecured debts (credit cards, medical bills)

**Features**:
- Auto-assign priority based on liability type
- Show priority order in liabilities list
- **Payment Validation**:
  - Block payment of Priority 5 if Priority 1-4 unpaid
  - Show error: "Must pay [Priority X] before [Priority Y]"
  - Suggest correct payment order
  
- **Priority Dashboard**
  - Show total owed by priority
  - Show total paid by priority
  - Visual progress bars
  - Warnings for out-of-order payments

**UI Location**: Liabilities page + payment workflow

---

#### 3. Claim Rejection Workflow
**Component**: `ClaimRejectionWorkflow.tsx`

**Features**:
- **Rejection Reasons**
  - Claim filed after deadline
  - Insufficient documentation
  - Amount disputed
  - Debt not valid
  - Already paid
  - Other (custom reason)
  
- **Generate Rejection Letter**
  - Template with reason
  - Creditor address
  - Legal language
  - Deadline to appeal
  - Download/print/email
  
- **Track Rejections**
  - Rejection date
  - Reason
  - Letter sent date
  - Appeal deadline
  - Appeal received?
  - Resolution

**UI Location**: Liability detail page

---

## PHASE 4: ASSET LIQUIDATION (Month 6-12)

### Manual Tasks (✅ Implemented)
1. Present Letters to All Institutions
2. Transfer Financial Accounts
3. Sell Real Property (if needed)
4. Pay Final Taxes
5. Prepare Final Accounting

### Automated Features (❌ To Build)

#### 1. Liquidation Tracking Module
**Component**: `LiquidationTracker.tsx`

**Features**:
- **Real Estate Sales**
  - Listing date
  - Listing price
  - Realtor contact
  - Offers received
  - Accepted offer amount
  - Closing date
  - Final sale price
  - Closing costs
  - Net proceeds
  
- **Vehicle Sales**
  - Make/model/year
  - VIN
  - Listing platform
  - Sale price
  - Buyer info
  - Title transfer date
  
- **Personal Property Sales**
  - Estate sale date
  - Auction date
  - Online listings
  - Total proceeds
  
- **Capital Gains Calculation**
  - DOD value (basis)
  - Sale price
  - Gain/loss
  - Tax implications

**UI Location**: Asset detail page + new "Liquidation" page

---

#### 2. Tax Management Module
**Component**: `TaxManagement.tsx`

**Features**:
- **Form 1040 (Final Personal) Checklist**
  - [ ] Gather W-2s and 1099s
  - [ ] Calculate income through DOD
  - [ ] File by April 15
  - [ ] Mark "DECEASED" on return
  - [ ] Upload filed return
  
- **Form 1041 (Estate Income) Checklist**
  - [ ] Track estate income (interest, dividends, rent)
  - [ ] Calculate taxable income
  - [ ] File by April 15 (year after death)
  - [ ] Pay estimated taxes quarterly
  - [ ] Upload filed return
  
- **Form 706 (Estate Tax) Checklist** (if estate > $13.61M)
  - [ ] Calculate gross estate value
  - [ ] Determine if filing required
  - [ ] File within 9 months of death
  - [ ] Request extension if needed
  - [ ] Upload filed return
  
- **Tax Deadline Tracker**
  - Countdown timers
  - Email reminders
  - Extension tracking
  - Payment tracking

**UI Location**: New "Taxes" page + dashboard widget

---

#### 3. Accounting Hub Enhancement
**Component**: `AccountingHub.tsx`

**Features**:
- **Income Tracking**
  - Interest income
  - Dividend income
  - Rental income
  - Sale proceeds
  - Other income
  - Category by IRS categories
  
- **Expense Tracking**
  - Funeral expenses
  - Legal fees
  - Executor fees
  - Property maintenance
  - Utilities
  - Insurance
  - Taxes
  - Other expenses
  - Category by IRS categories
  
- **Accounting Reports**
  - Income statement
  - Expense report
  - Net estate value
  - Distribution calculation
  - Export to Excel
  - Export to PDF
  - Court-ready format

**UI Location**: New "Accounting" page + dashboard widget

---

## PHASE 5: FINAL DISTRIBUTION (Month 12-18)

### Manual Tasks (✅ Implemented)
1. File Petition for Final Distribution
2. Attend Final Hearing
3. Distribute Assets to Heirs
4. File Final Accounting with Court
5. Close Estate

### Automated Features (❌ To Build)

#### 1. Distribution Petition Tool
**Component**: `DistributionPetition.tsx`

**Features**:
- Generate Petition for Final Distribution
- Auto-populate from estate data
- Include final accounting
- List all distributions
- Calculate executor fees
- Generate court-ready PDF
- Track filing status
- Upload filed copy

**Data Sources**:
- Estate profile
- Asset ledger
- Accounting hub
- Heir information

**UI Location**: Probate Hub + Phase 5 tasks

---

#### 2. Receipt Tracker
**Component**: `ReceiptTracker.tsx`

**Features**:
- **Log Distributions**
  - Heir name
  - Distribution amount
  - Distribution date
  - Distribution method (check, wire, asset transfer)
  - Description of assets
  
- **Receipt Management**
  - Generate receipt template
  - Track signature status
  - Upload signed receipt
  - Store receipt PDF
  
- **Completion Report**
  - List all distributions
  - Show receipt status
  - Generate "all receipts received" report
  - Release executor liability

**UI Location**: New "Distributions" page

---

#### 3. Closing Statement Generator
**Component**: `ClosingStatement.tsx`

**Features**:
- **Final Estate Statement**
  - Opening estate value
  - Income received
  - Expenses paid
  - Distributions made
  - Closing estate value (should be $0)
  
- **Transaction Summary**
  - All income transactions
  - All expense transactions
  - All distribution transactions
  - Supporting documents
  
- **Court Filing**
  - Generate DE-295 (Petition for Final Discharge)
  - Court-ready PDF
  - Track filing status
  
- **Archive**
  - Download complete estate file
  - All documents in one ZIP
  - Permanent record for executor

**UI Location**: Probate Hub + Phase 5 tasks

---

## Implementation Priority Matrix

| Feature | Phase | Priority | Effort | Impact | Timeline |
|---------|-------|----------|--------|--------|----------|
| Practical Kit Checklist | 0 | 🔴 HIGH | Medium | High | Sprint 1 |
| Early Notifier | 0 | 🔴 HIGH | Medium | High | Sprint 1 |
| DE-111 Generator | 1 | 🔴 HIGH | High | Very High | Sprint 2 |
| Court Calendar | 1 | 🔴 HIGH | Low | High | Sprint 2 |
| Authority Gate | 1 | 🔴 HIGH | Low | High | Sprint 2 |
| Asset Freeze Tracking | 2 | 🟡 MEDIUM | Medium | Medium | Sprint 3 |
| DE-160 Generator | 2 | 🟡 MEDIUM | High | High | Sprint 3 |
| Liabilities Ledger | 3 | 🟡 MEDIUM | High | High | Sprint 4 |
| Priority Engine | 3 | 🟡 MEDIUM | Medium | Very High | Sprint 4 |
| Claim Rejection | 3 | 🟡 MEDIUM | Low | Medium | Sprint 4 |
| Liquidation Tracker | 4 | 🟢 LOW | Medium | Medium | Sprint 5 |
| Tax Management | 4 | 🟢 LOW | Medium | High | Sprint 5 |
| Accounting Hub | 4 | 🟢 LOW | High | High | Sprint 5 |
| Distribution Petition | 5 | 🟢 LOW | Medium | Medium | Sprint 6 |
| Receipt Tracker | 5 | 🟢 LOW | Low | Medium | Sprint 6 |
| Closing Statement | 5 | 🟢 LOW | Medium | Medium | Sprint 6 |

---

## Next Steps

1. **Review with Antigravity**: Confirm alignment with their vision
2. **Create Detailed Specs**: Write full requirements for Phase 0 & 1 features
3. **Design UI Mockups**: Create wireframes for new components
4. **Database Schema**: Update Prisma schema with new models
5. **Start Sprint 1**: Begin building Phase 0 features

---

**Created**: January 27, 2026  
**Last Updated**: January 27, 2026  
**Version**: 1.0
