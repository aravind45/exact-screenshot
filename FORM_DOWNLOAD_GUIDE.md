# California Probate Forms - Official Download Sources

## ✅ Authentic Source: California Courts Website

All California probate forms should be downloaded from the **official California Courts website**:

**Primary Source:** https://www.courts.ca.gov/forms.htm

**Direct Probate Forms Link:** https://www.courts.ca.gov/forms.htm?filter=DE

---

## 📋 How to Download Forms

### Method 1: Search by Form Number
1. Go to https://www.courts.ca.gov/forms.htm
2. Enter the form number (e.g., "DE-111") in the search box
3. Click on the form name in the results
4. Download the PDF (usually has a "Download" or "PDF" link)

### Method 2: Browse Probate Category
1. Go to https://www.courts.ca.gov/forms.htm
2. Select "Probate—Decedents' Estates" from the category dropdown
3. Browse the list of forms
4. Click to download individual forms

---

## 🔍 Forms We Need to Download

### Currently Have (9 forms):
- ✅ DE-111 - Petition for Probate
- ✅ DE-121 - Notice of Petition to Administer Estate
- ✅ DE-140 - Order for Probate
- ✅ DE-150 - Letters
- ✅ DE-160 - Inventory and Appraisal
- ✅ DE-165 - Notice of Proposed Action
- ✅ DE-221 - Spousal/Domestic Partner Property Petition
- ✅ DE-270 - Ex Parte Petition for Authority to Sell Securities
- ✅ DE-295 - Ex Parte Petition for Final Discharge

### Priority Forms to Add:

#### Court Filing Phase:
- **DE-110** - Petition for Probate of Will and for Letters Testamentary
  - URL: https://www.courts.ca.gov/documents/de110.pdf
  
- **DE-120** - Notice of Hearing (Probate)
  - URL: https://www.courts.ca.gov/documents/de120.pdf

- **DE-131** - Proof of Subscribing Witness
  - URL: https://www.courts.ca.gov/documents/de131.pdf

#### Authority & Administration:
- **DE-147** - Duties and Liabilities of Personal Representative
  - URL: https://www.courts.ca.gov/documents/de147.pdf

- **DE-157** - Notice of Administration to Creditors
  - URL: https://www.courts.ca.gov/documents/de157.pdf

#### Asset Management:
- **DE-161** - Inventory and Appraisal Attachment
  - URL: https://www.courts.ca.gov/documents/de161.pdf

- **DE-260** - Ex Parte Petition for Authority to Sell Real Property
  - URL: https://www.courts.ca.gov/documents/de260.pdf

#### Creditor Claims:
- **DE-174** - Allowance or Rejection of Creditor's Claim
  - URL: https://www.courts.ca.gov/documents/de174.pdf

- **DE-172** - Creditor's Claim
  - URL: https://www.courts.ca.gov/documents/de172.pdf

#### Distribution:
- **DE-305** - Affidavit Re Real Property of Small Value
  - URL: https://www.courts.ca.gov/documents/de305.pdf

- **DE-310** - Petition for Final Distribution
  - URL: https://www.courts.ca.gov/documents/de310.pdf

- **DE-315** - Order for Final Distribution
  - URL: https://www.courts.ca.gov/documents/de315.pdf

---

## 📥 Download Instructions

### Using Command Line (Windows):
```powershell
# Create downloads directory
mkdir server\templates\new-forms

# Download a form (example)
Invoke-WebRequest -Uri "https://www.courts.ca.gov/documents/de110.pdf" -OutFile "server\templates\DE-110.pdf"
```

### Using Browser:
1. Right-click the download link
2. Select "Save Link As..."
3. Save to `server/templates/` directory
4. Use the exact filename format: `DE-XXX FORM NAME.pdf`

---

## ⚠️ Important Notes

### Legal Compliance:
- ✅ **Public Domain**: California Judicial Council forms are public domain
- ✅ **Free to Use**: No licensing fees or restrictions
- ✅ **Official Source**: Always use courts.ca.gov for authenticity
- ✅ **Current Versions**: Forms are regularly updated - check revision dates

### File Naming Convention:
Use the exact format from the official website:
- `DE-111 PETITION FOR PROBATE.pdf`
- `DE-150 LETTERS (Probate).pdf`
- `DE-160 INVENTORY AND APPRAISAL.pdf`

### After Downloading:
1. Place PDF in `server/templates/` directory
2. Add entry to `server/services/formSeedingService.ts`
3. Run seed command: `npm run seed-forms`
4. Verify in Forms page

---

## 🔄 Keeping Forms Updated

California courts update forms periodically. Check for updates:

1. **Revision Date**: Each form has a revision date (e.g., "Rev. January 1, 2024")
2. **Check Quarterly**: Review forms every 3 months
3. **Update Process**:
   - Download new version
   - Replace old PDF in `server/templates/`
   - Re-run seed command
   - Test auto-fill functionality

---

## 🌐 Other State Resources

### New York:
- **Source**: https://ww2.nycourts.gov/forms/surrogates/index.shtml
- **Forms**: Surrogate's Court forms

### Texas:
- **Source**: https://www.txcourts.gov/rules-forms/forms/
- **Forms**: Probate forms by county

### Florida:
- **Source**: https://www.flcourts.gov/Resources-Services/Court-Forms
- **Forms**: Probate and guardianship forms

### General:
Most states have official court websites with free downloadable forms. Always use the official state court website as the source.

---

## 📞 Support

If you need help finding a specific form:
1. Check the California Courts website first
2. Contact the local probate court clerk
3. Consult with a probate attorney

**California Courts Contact**: 
- Website: https://www.courts.ca.gov
- Phone: (415) 865-4200 (Judicial Council)
