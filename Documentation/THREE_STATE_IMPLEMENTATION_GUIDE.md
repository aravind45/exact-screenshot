# Three-State Implementation Guide
## New York, Texas, and Florida Probate Forms

This guide provides everything you need to implement forms for NY, TX, and FL.

## 🗽 New York Implementation

### Official Source
**Website**: https://ww2.nycourts.gov/forms/surrogates/

### Key Forms (15 recommended)

| Form Code | Title | Category | URL Pattern |
|-----------|-------|----------|-------------|
| ET-1 | Petition for Probate | Probate Initialization | `/pdfs/Petition_for_Probate.pdf` |
| ET-2 | Petition for Administration | Probate Initialization | `/pdfs/Petition_for_Administration.pdf` |
| ET-3 | Petition for Ancillary Probate | Probate Initialization | `/pdfs/Petition_for_Ancillary_Probate.pdf` |
| ET-4 | Citation | Notices | `/pdfs/Citation.pdf` |
| ET-5 | Waiver and Consent | Notices | `/pdfs/Waiver_and_Consent.pdf` |
| ET-6 | Letters Testamentary | Authority | `/pdfs/Letters_Testamentary.pdf` |
| ET-7 | Letters of Administration | Authority | `/pdfs/Letters_of_Administration.pdf` |
| ET-8 | Inventory | Assets | `/pdfs/Inventory.pdf` |
| ET-9 | Account | Accounting | `/pdfs/Account.pdf` |
| ET-10 | Petition for Judicial Settlement | Accounting | `/pdfs/Petition_for_Judicial_Settlement.pdf` |
| ET-11 | Decree | Court Orders | `/pdfs/Decree.pdf` |
| ET-12 | Receipt and Release | Distribution | `/pdfs/Receipt_and_Release.pdf` |
| ET-13 | Petition for Final Distribution | Distribution | `/pdfs/Petition_for_Final_Distribution.pdf` |
| ET-14 | Affidavit of Heirship | Small Estate | `/pdfs/Affidavit_of_Heirship.pdf` |
| ET-15 | Voluntary Administration | Small Estate | `/pdfs/Voluntary_Administration.pdf` |

### NY-Specific Notes:
- New York uses "Surrogate's Court" system
- Forms are organized by proceeding type
- All forms are fillable PDFs
- Some counties may have additional local forms

### How to Find Exact URLs:
1. Visit https://ww2.nycourts.gov/forms/surrogates/probate.shtml
2. Right-click each form link
3. Copy link address
4. Update `scripts/download-forms-ny.ts`

---

## 🤠 Texas Implementation

### Official Source
**Website**: https://www.txcourts.gov/forms/

### Key Forms (12 recommended)

| Form Code | Title | Category | URL Pattern |
|-----------|-------|----------|-------------|
| TX-1 | Application for Probate of Will | Probate Initialization | `/forms/probate/application-probate-will.pdf` |
| TX-2 | Application for Letters of Administration | Probate Initialization | `/forms/probate/application-letters-admin.pdf` |
| TX-3 | Application for Independent Administration | Probate Initialization | `/forms/probate/application-independent-admin.pdf` |
| TX-4 | Order Admitting Will to Probate | Court Orders | `/forms/probate/order-admitting-will.pdf` |
| TX-5 | Letters Testamentary | Authority | `/forms/probate/letters-testamentary.pdf` |
| TX-6 | Letters of Administration | Authority | `/forms/probate/letters-administration.pdf` |
| TX-7 | Inventory, Appraisement and List of Claims | Assets | `/forms/probate/inventory-appraisement.pdf` |
| TX-8 | Annual Account | Accounting | `/forms/probate/annual-account.pdf` |
| TX-9 | Application to Close Estate | Estate Closing | `/forms/probate/application-close-estate.pdf` |
| TX-10 | Final Account | Accounting | `/forms/probate/final-account.pdf` |
| TX-11 | Small Estate Affidavit | Small Estate | `/forms/probate/small-estate-affidavit.pdf` |
| TX-12 | Muniment of Title | Small Estate | `/forms/probate/muniment-of-title.pdf` |

### TX-Specific Notes:
- Texas has "Independent Administration" (unique to TX)
- County courts handle most probate
- 10 counties have dedicated Probate Courts
- "Muniment of Title" is a simplified probate process
- Forms may vary by county

### How to Find Exact URLs:
1. Visit https://www.txcourts.gov/rules-forms/forms/
2. Look for probate section
3. Note: Texas forms are less centralized
4. May need to check major county websites (Harris, Dallas, Travis)

---

## 🌴 Florida Implementation

### Official Source
**Website**: https://www.flcourts.org/ (varies by circuit)
**Recommended**: Miami-Dade (11th Circuit) - https://www.jud11.flcourts.org/probate-smart-forms

### Key Forms (15 recommended)

| Form Code | Title | Category | URL Pattern |
|-----------|-------|----------|-------------|
| FL-1 | Petition for Administration | Probate Initialization | `/forms/Petition_for_Administration.pdf` |
| FL-2 | Petition for Summary Administration | Small Estate | `/forms/Petition_for_Summary_Administration.pdf` |
| FL-3 | Notice of Administration | Notices | `/forms/Notice_of_Administration.pdf` |
| FL-4 | Oath of Personal Representative | Authority | `/forms/Oath_of_Personal_Representative.pdf` |
| FL-5 | Letters of Administration | Authority | `/forms/Letters_of_Administration.pdf` |
| FL-6 | Inventory | Assets | `/forms/Inventory.pdf` |
| FL-7 | Notice to Creditors | Notices | `/forms/Notice_to_Creditors.pdf` |
| FL-8 | Proof of Claim | Creditor Claims | `/forms/Proof_of_Claim.pdf` |
| FL-9 | Objection to Claim | Creditor Claims | `/forms/Objection_to_Claim.pdf` |
| FL-10 | Accounting | Accounting | `/forms/Accounting.pdf` |
| FL-11 | Petition for Discharge | Estate Closing | `/forms/Petition_for_Discharge.pdf` |
| FL-12 | Final Accounting | Accounting | `/forms/Final_Accounting.pdf` |
| FL-13 | Receipt and Release | Distribution | `/forms/Receipt_and_Release.pdf` |
| FL-14 | Disposition Without Administration | Small Estate | `/forms/Disposition_Without_Administration.pdf` |
| FL-15 | Homestead Property Petition | Spousal Property | `/forms/Homestead_Property_Petition.pdf` |

### FL-Specific Notes:
- Florida has 21 judicial circuits
- Each circuit may have "Smart Forms"
- Summary Administration for estates < $75,000
- Homestead property has special rules
- Recommend using 11th Circuit (Miami-Dade) as template

### How to Find Exact URLs:
1. Visit https://www.jud11.flcourts.org/probate-smart-forms
2. Download forms from the circuit
3. Alternative: Check your local circuit court website

---

## 🚀 Quick Implementation Steps

### 1. Download Form Downloader Scripts (Ready to Use)

I've created three downloader scripts with the forms listed above:
- `scripts/download-forms-ny.ts`
- `scripts/download-forms-tx.ts`
- `scripts/download-forms-fl.ts`

### 2. Update URLs (15-30 minutes per state)

Visit each state's website and update the URLs in the downloader scripts.

### 3. Run Downloaders

```bash
# New York
npm run download-forms-ny

# Texas  
npm run download-forms-tx

# Florida
npm run download-forms-fl
```

### 4. Update Forms Page

Change these states to `supported: true` in `src/pages/Forms.tsx`:

```typescript
{ id: "NY", name: "New York", icon: "🗽", supported: true },
{ id: "TX", name: "Texas", icon: "🤠", supported: true },
{ id: "FL", name: "Florida", icon: "☀️", supported: true },
```

### 5. Seed Database

```bash
npm run seed-forms
```

---

## 📊 Expected Results

### Coverage After Implementation:

| State | Population | Forms | Status |
|-------|------------|-------|--------|
| California | 39.5M | 22 | ✅ Complete |
| Texas | 30.0M | 12 | 🔄 Ready to implement |
| Florida | 22.2M | 15 | 🔄 Ready to implement |
| New York | 19.8M | 15 | 🔄 Ready to implement |
| **TOTAL** | **111.5M** | **64** | **34% of US** |

---

## 💡 Tips for Success

### Finding Form URLs:
1. Use browser dev tools (F12)
2. Right-click form links → "Copy Link Address"
3. Test URLs in browser before adding to script
4. Some states use JavaScript - look for actual PDF URLs

### Handling Missing Forms:
- Start with 10-12 core forms
- Add more later based on user demand
- Focus on most common probate scenarios

### State Variations:
- Each state has unique terminology
- Some forms combine multiple functions
- Local rules may require additional forms
- Document state-specific quirks in comments

---

## 🎯 Next Steps

1. **Choose one state to start** (recommend NY - most organized)
2. **Spend 30 minutes finding URLs** for that state
3. **Update the downloader script**
4. **Test download**
5. **Repeat for other states**

**Total time estimate**: 2-3 hours for all three states

---

**Last Updated**: February 2026
**Status**: Ready for implementation
