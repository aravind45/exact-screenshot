# Settlement Processes & Required Forms Mapping

**Date**: February 3, 2026  
**State**: California (Primary)  
**Purpose**: Map each settlement process to required court forms

---

## Overview

This document maps all settlement processes to their required California probate forms (DE-series). Each process includes the forms needed, their purpose, and when they're used in the workflow.

---

## 📋 Table of Contents

1. [Standard Probate Process](#1-standard-probate-process)
2. [Small Estate Affidavit Process](#2-small-estate-affidavit-process)
3. [Spousal Property Petition Process](#3-spousal-property-petition-process)
4. [Primary Residence Succession Process](#4-primary-residence-succession-process)
5. [Guardian Ad Litem Process](#5-guardian-ad-litem-process)
6. [Bond Waiver Process](#6-bond-waiver-process)
7. [Special Notice Process](#7-special-notice-process)
8. [Contested Probate Process](#8-contested-probate-process)
9. [Asset Sale Authorization Process](#9-asset-sale-authorization-process)
10. [Creditor Claims Process](#10-creditor-claims-process)
11. [Final Distribution Process](#11-final-distribution-process)

---

## 1. Standard Probate Process

**When Used**: Estates that require full court supervision  
**Trigger**: Estate value > $184,500 OR real property OR complex assets  
**Timeline**: 12-18 months

### Required Forms

| Form | Title | When Filed | Purpose | Status |
|------|-------|------------|---------|--------|
| **DE-111** | Petition for Probate | Week 3-4 | Initiate probate case | ✅ Have |
| **DE-110** | Petition for Probate of Will and Letters Testamentary | Week 3-4 | Alternative to DE-111 (with will) | ✅ Have |
| **DE-121** | Notice of Petition to Administer Estate | Week 3-4 | Public notice of petition | ✅ Have |
| **DE-120** | Notice of Hearing | Week 3-4 | Notice of court hearing date | ✅ Have |
| **DE-131** | Proof of Subscribing Witness | Week 4-5 | Witness testimony for will | ✅ Have |
| **DE-135** | Proof of Holographic Instrument | Week 4-5 | Validate handwritten will | ✅ Have |
| **DE-140** | Order for Probate | Week 8-12 | Court grants probate | ✅ Have |
| **DE-147** | Duties and Liabilities of Personal Representative | Week 8-12 | Executor acknowledgment | ✅ Have |
| **DE-150** | Letters Testamentary/Administration | Week 8-12 | Legal authority document | ✅ Have |
| **DE-157** | Notice of Administration to Creditors | Week 9-13 | Notify known creditors | ✅ Have |
| **DE-160** | Inventory and Appraisal | Month 4-5 | List all assets with values | ✅ Have |
| **DE-161** | Inventory and Appraisal Attachment | Month 4-5 | Additional asset pages | ✅ Have |
| **DE-295** | Ex Parte Petition for Final Discharge | Month 12-18 | Close estate | ✅ Have |

### Process Flow
```
1. File DE-111 + DE-121 → Initiate probate
2. Publish DE-121 in newspaper → Public notice
3. File DE-131/135 (if needed) → Validate will
4. Attend hearing → Court reviews
5. Receive DE-140 + DE-147 + DE-150 → Authority granted
6. Mail DE-157 to creditors → Start claims period
7. File DE-160 + DE-161 → Inventory assets
8. Wait 4 months → Claims period
9. File DE-295 → Close estate
```

**Coverage**: ✅ 100% - All forms available

---

## 2. Small Estate Affidavit Process

**When Used**: Estates under $184,500 (CA threshold)  
**Trigger**: Total personal property < $184,500 AND no real property  
**Timeline**: 40 days minimum

### Required Forms

| Form | Title | When Filed | Purpose | Status |
|------|-------|------------|---------|--------|
| **DE-305** | Affidavit Re Real Property of Small Value | Day 40+ | Transfer real property under $61,500 | ✅ Have |
| **DE-310** | Petition for Final Distribution | Alternative | Small estate petition (if needed) | ✅ Have |

### Supporting Documents
- Death Certificate (certified copy)
- Proof of relationship to deceased
- List of all heirs
- Asset documentation

### Process Flow
```
1. Wait 40 days after death
2. Complete DE-305 affidavit
3. Get notarized
4. Present to institution with death certificate
5. Institution transfers asset
```

**Coverage**: ✅ 100% - All forms available

---

## 3. Spousal Property Petition Process

**When Used**: Surviving spouse wants to transfer property without full probate  
**Trigger**: Surviving spouse + community property OR quasi-community property  
**Timeline**: 4-6 weeks

### Required Forms

| Form | Title | When Filed | Purpose | Status |
|------|-------|------------|---------|--------|
| **DE-221** | Spousal or Domestic Partner Property Petition | Week 3-4 | Request property transfer | ✅ Have |
| **DE-226** | Spousal Property Order | Week 6-8 | Court order granting transfer | ❌ Missing |

### Supporting Documents
- Death Certificate
- Marriage Certificate
- Property deeds
- Asset documentation

### Process Flow
```
1. File DE-221 → Request transfer
2. Attend hearing
3. Receive DE-226 → Court grants transfer
4. Record DE-226 with county recorder
```

**Coverage**: ⚠️ 50% - Missing DE-226 (companion order)

---

## 4. Primary Residence Succession Process

**When Used**: Estate consists primarily of primary residence under $100k  
**Trigger**: Primary residence + total estate < $100k + CA resident  
**Timeline**: 6-8 weeks

### Required Forms

| Form | Title | When Filed | Purpose | Status |
|------|-------|------------|---------|--------|
| **DE-310** | Petition to Determine Succession to Real Property | Week 3-4 | Request succession determination | ⚠️ Conflict |
| **DE-315** | Order Determining Succession to Real Property | Week 6-8 | Court determines succession | ⚠️ Conflict |

**⚠️ FORM NUMBERING CONFLICT**:
- Our DE-310 = "Petition for Final Distribution"
- CA DE-310 = "Petition to Determine Succession to Real Property"
- Our DE-315 = "Order for Final Distribution"
- CA DE-315 = "Order Determining Succession to Real Property"

### Supporting Documents
- Death Certificate
- Property deed
- Property appraisal (under $100k)
- Proof of primary residence

### Process Flow
```
1. File DE-310 → Request succession determination
2. Provide property appraisal
3. Attend hearing
4. Receive DE-315 → Court determines heirs
5. Record DE-315 with county recorder
```

**Coverage**: ⚠️ 100% but NUMBERING CONFLICT - Need to resolve

---

## 5. Guardian Ad Litem Process

**When Used**: Estate has minor beneficiaries (under 18)  
**Trigger**: Any heir with `isMinor: true`  
**Timeline**: 2-4 weeks for appointment, ongoing through distribution

### Required Forms

| Form | Title | When Filed | Purpose | Status |
|------|-------|------------|---------|--------|
| **DE-350** | Petition for Appointment of Guardian Ad Litem | Week 4-6 | Request guardian appointment | ❌ Missing |
| **DE-351** | Order Appointing Guardian Ad Litem | Week 6-8 | Court appoints guardian | ❌ Missing |

### Supporting Documents
- Birth certificates of minors
- Proposed guardian information
- Reason for appointment

### Process Flow
```
1. Identify minor beneficiaries
2. File DE-350 → Request guardian
3. Attend hearing
4. Receive DE-351 → Guardian appointed
5. Coordinate with guardian on all actions
6. Guardian approves final distribution
7. Setup blocked accounts for minors
```

**Coverage**: ❌ 0% - Both forms missing (CRITICAL GAP)

**Impact**: Affects ~30% of estates with minor children

---

## 6. Bond Waiver Process

**When Used**: Executor wants to avoid posting bond (saves money)  
**Trigger**: Optional - all heirs must consent  
**Timeline**: 1-2 weeks

### Required Forms

| Form | Title | When Filed | Purpose | Status |
|------|-------|------------|---------|--------|
| **DE-142** | Waiver of Bond by Heir or Beneficiary | Week 3-4 | Heirs waive bond requirement | ❌ Missing |
| **DE-143** | Order Waiving Bond | Week 4-6 | Court waives bond | ❌ Missing |

### Supporting Documents
- List of all heirs
- Signed waivers from ALL heirs

### Process Flow
```
1. Request all heirs sign DE-142
2. Collect signed waivers
3. File waivers with court
4. Request DE-143 order
5. Receive DE-143 → Bond waived
```

**Coverage**: ❌ 0% - Both forms missing

**Benefit**: Saves $500-$5,000+ annually in bond premiums

---

## 7. Special Notice Process

**When Used**: Interested parties want notice of all court filings  
**Trigger**: Any interested party requests (used in ~90% of estates)  
**Timeline**: Ongoing throughout probate

### Required Forms

| Form | Title | When Filed | Purpose | Status |
|------|-------|------------|---------|--------|
| **DE-154** | Request for Special Notice | Anytime | Party requests notice | ❌ Missing |
| **DE-200** | Order Prescribing Notice | As needed | Court orders specific notice | ❌ Missing |

### Supporting Documents
- List of parties requesting notice
- Proof of service for each filing

### Process Flow
```
1. Interested party files DE-154
2. Executor maintains list of requestors
3. Executor serves copy of ALL filings to requestors
4. Keep proof of service
5. If dispute, court issues DE-200
```

**Coverage**: ❌ 0% - Both forms missing

**Impact**: Used in almost all estates (very common)

---

## 8. Contested Probate Process

**When Used**: Someone objects to will or petition  
**Trigger**: `hasContest: true` OR objection filed  
**Timeline**: 6-24 months (significantly extends probate)

### Required Forms

| Form | Title | When Filed | Purpose | Status |
|------|-------|------------|---------|--------|
| **DE-115** | Objection to Petition for Probate | Week 4-8 | Contest will or petition | ❌ Missing |
| **DE-116** | Notice of Objection | Week 4-8 | Notice of will contest | ❌ Missing |

### Supporting Documents
- Grounds for objection
- Evidence supporting objection
- Witness statements

### Process Flow
```
1. Objector files DE-115 → Contest will
2. Court issues DE-116 → Notice of contest
3. Executor responds (hire attorney)
4. Discovery period
5. Contest hearing
6. Court rules on objection
7. Proceed based on ruling
```

**Coverage**: ❌ 0% - Both forms missing

**Impact**: Affects ~10% of estates, but critical when needed

---

## 9. Asset Sale Authorization Process

**When Used**: Executor needs to sell estate assets  
**Trigger**: Need to liquidate assets to pay debts or distribute  
**Timeline**: 2-4 weeks per sale

### Required Forms

| Form | Title | When Filed | Purpose | Status |
|------|-------|------------|---------|--------|
| **DE-260** | Ex Parte Petition for Authority to Sell Real Property | As needed | Sell real estate | ✅ Have |
| **DE-270** | Ex Parte Petition for Authority to Sell Securities | As needed | Sell stocks/bonds | ✅ Have |
| **DE-165** | Notice of Proposed Action | Before sale | Notify heirs of sale | ✅ Have |
| **DE-166** | Waiver of Notice of Proposed Action | Optional | Heirs waive notice | ❌ Missing |

### Supporting Documents
- Property appraisal
- Purchase offer (if applicable)
- Reason for sale

### Process Flow
```
1. Get property appraised
2. File DE-165 → Notify heirs
3. Wait for objections (15 days)
4. If no objections, file DE-260 or DE-270
5. Receive court authorization
6. Complete sale
```

**Coverage**: ✅ 75% - Missing DE-166 (optional waiver)

---

## 10. Creditor Claims Process

**When Used**: All estates (mandatory 4-month period)  
**Trigger**: Always required in probate  
**Timeline**: 4 months minimum

### Required Forms

| Form | Title | When Filed | Purpose | Status |
|------|-------|------------|---------|--------|
| **DE-157** | Notice of Administration to Creditors | Week 9-13 | Notify known creditors | ✅ Have |
| **DE-172** | Creditor's Claim | Month 1-4 | Creditor files claim | ✅ Have |
| **DE-174** | Allowance or Rejection of Creditor's Claim | Month 4-5 | Approve/reject claims | ✅ Have |

### Supporting Documents
- List of known creditors
- Proof of publication
- Proof of mailing
- Claim documentation

### Process Flow
```
1. Publish notice in newspaper (3 weeks)
2. Mail DE-157 to known creditors
3. Wait 4 months
4. Creditors file DE-172 claims
5. Review each claim
6. File DE-174 to approve/reject
7. Pay approved claims
```

**Coverage**: ✅ 100% - All forms available

---

## 11. Final Distribution Process

**When Used**: Close estate and distribute assets  
**Trigger**: All debts paid, taxes filed, assets liquidated  
**Timeline**: 2-4 months

### Required Forms

| Form | Title | When Filed | Purpose | Status |
|------|-------|------------|---------|--------|
| **DE-310** | Petition for Final Distribution | Month 12-15 | Request distribution approval | ✅ Have |
| **DE-315** | Order for Final Distribution | Month 13-16 | Court approves distribution | ✅ Have |
| **DE-295** | Ex Parte Petition for Final Discharge | Month 16-18 | Close estate | ✅ Have |
| **DE-190** | Waiver of Accounting | Optional | Heirs waive accounting | ❌ Missing |

### Supporting Documents
- Final accounting
- Receipts from heirs
- Tax clearance letters
- Proof all debts paid

### Process Flow
```
1. Prepare final accounting
2. File DE-310 → Request distribution
3. Notify all heirs
4. Attend final hearing
5. Receive DE-315 → Distribution approved
6. Distribute assets
7. Get signed receipts
8. File DE-295 → Close estate
```

**Coverage**: ✅ 75% - Missing DE-190 (optional waiver)

---

## 📊 Summary by Process

| Process | Forms Needed | Forms Have | Coverage | Priority |
|---------|--------------|------------|----------|----------|
| **Standard Probate** | 13 | 13 | 100% | ✅ Complete |
| **Small Estate** | 2 | 2 | 100% | ✅ Complete |
| **Spousal Property** | 2 | 1 | 50% | 🔴 HIGH |
| **Primary Residence** | 2 | 2* | 100%* | ⚠️ Conflict |
| **Guardian Ad Litem** | 2 | 0 | 0% | 🔴 CRITICAL |
| **Bond Waiver** | 2 | 0 | 0% | 🟡 MEDIUM |
| **Special Notice** | 2 | 0 | 0% | 🔴 HIGH |
| **Contested Probate** | 2 | 0 | 0% | 🟡 MEDIUM |
| **Asset Sales** | 4 | 3 | 75% | 🟢 LOW |
| **Creditor Claims** | 3 | 3 | 100% | ✅ Complete |
| **Final Distribution** | 4 | 3 | 75% | 🟢 LOW |

**Total**: 38 unique forms needed, 27 forms have (71% coverage)

---

## 🎯 Priority Missing Forms

### 🔴 CRITICAL (Affects 30%+ of estates)
1. **DE-350** - Petition for Guardian Ad Litem
2. **DE-351** - Order Appointing Guardian Ad Litem

### 🔴 HIGH (Used in 90%+ of estates)
3. **DE-154** - Request for Special Notice
4. **DE-226** - Spousal Property Order

### 🟡 MEDIUM (Optional but valuable)
5. **DE-142** - Waiver of Bond
6. **DE-143** - Order Waiving Bond
7. **DE-200** - Order Prescribing Notice
8. **DE-115** - Objection to Petition
9. **DE-116** - Notice of Objection

### 🟢 LOW (Nice to have)
10. **DE-166** - Waiver of Notice of Proposed Action
11. **DE-190** - Waiver of Accounting

---

## ⚠️ Form Numbering Conflicts

### DE-310 Conflict
- **Our System**: "Petition for Final Distribution"
- **California**: "Petition to Determine Succession to Real Property"
- **Resolution Needed**: Verify correct usage

### DE-315 Conflict
- **Our System**: "Order for Final Distribution"
- **California**: "Order Determining Succession to Real Property"
- **Resolution Needed**: Verify correct usage

**Action Required**: Research California Judicial Council website to resolve conflicts

---

## 📋 Implementation Roadmap

### Phase 1: Critical Forms (Week 1)
- [ ] Download DE-350, DE-351 (Guardian Ad Litem)
- [ ] Download DE-154 (Special Notice)
- [ ] Download DE-226 (Spousal Property Order)
- [ ] Resolve DE-310/315 numbering conflicts
- [ ] Add to form seeding service
- [ ] Update roadmap tasks with form links

### Phase 2: Medium Priority (Week 2)
- [ ] Download DE-142, DE-143 (Bond Waiver)
- [ ] Download DE-200 (Order Prescribing Notice)
- [ ] Download DE-115, DE-116 (Contested Probate)
- [ ] Add to form seeding service
- [ ] Update roadmap tasks with form links

### Phase 3: Optional Forms (Week 3)
- [ ] Download DE-166 (Waiver of Notice)
- [ ] Download DE-190 (Waiver of Accounting)
- [ ] Add to form seeding service
- [ ] Update roadmap tasks with form links

---

## 🔗 Official Form Sources

**California Judicial Council Forms**:
- Main Page: https://www.courts.ca.gov/forms.htm
- Probate Forms: https://www.courts.ca.gov/forms.htm?filter=DE
- Form Search: https://www.courts.ca.gov/forms.htm

**Download Instructions**:
1. Visit forms page
2. Search for form number (e.g., "DE-350")
3. Download PDF
4. Save to `server/templates/`
5. Add to `formSeedingService.ts`

---

## 📝 Notes

- All forms are free from California Judicial Council
- Forms are updated periodically - check for latest versions
- Some forms have fillable PDF versions
- Some forms require court-specific information
- Always use official forms (not third-party versions)
- Keep forms updated annually

---

**Document Status**: ✅ Complete  
**Last Updated**: February 3, 2026  
**Next Review**: March 2026
