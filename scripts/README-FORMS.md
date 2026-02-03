# 🤖 Automated Form Downloader Agent

This script automatically downloads California probate forms from the official California Courts website.

## 🚀 Quick Start

### Download All Forms
```bash
npm run download-forms
```

This will:
- ✅ Download 22 California probate forms
- ✅ Skip forms that already exist
- ✅ Save to `server/templates/` directory
- ✅ Show progress and summary

### Force Re-download
```bash
npm run download-forms:force
```

Re-downloads all forms even if they already exist (useful for updates).

### Generate Forms List
```bash
npm run download-forms:list
```

Generates the code snippet for `formSeedingService.ts`.

## 📋 Forms Downloaded

The agent downloads 22 essential California probate forms:

### Probate Initialization (5 forms)
- DE-110 - Petition for Probate of Will
- DE-111 - Petition for Probate
- DE-131 - Proof of Subscribing Witness
- DE-135 - Proof of Holographic Instrument

### Notices (5 forms)
- DE-120 - Notice of Hearing
- DE-121 - Notice of Petition to Administer Estate
- DE-157 - Notice of Administration to Creditors
- DE-165 - Notice of Proposed Action

### Authority (3 forms)
- DE-140 - Order for Probate
- DE-147 - Duties and Liabilities
- DE-150 - Letters

### Assets (2 forms)
- DE-160 - Inventory and Appraisal
- DE-161 - Inventory and Appraisal Attachment

### Creditor Claims (2 forms)
- DE-172 - Creditor's Claim
- DE-174 - Allowance or Rejection of Claim

### Asset Sales (2 forms)
- DE-260 - Authority to Sell Real Property
- DE-270 - Authority to Sell Securities

### Distribution & Closing (3 forms)
- DE-221 - Spousal Property Petition
- DE-295 - Final Discharge
- DE-305 - Small Estate Affidavit
- DE-310 - Petition for Final Distribution
- DE-315 - Order for Final Distribution

## 🔧 How It Works

1. **Connects** to California Courts website (courts.ca.gov)
2. **Downloads** PDF forms using official URLs
3. **Validates** file size and integrity
4. **Saves** to `server/templates/` directory
5. **Reports** success/failure for each form

## 📊 Output Example

```
🚀 California Probate Forms Downloader
=====================================

📂 Target directory: /server/templates
📋 Forms to download: 22

⬇️  Downloading DE-111: Petition for Probate...
✅ Downloaded DE-111: 245.3 KB
⏭️  Skipped DE-150: Already exists (198.7 KB)
⬇️  Downloading DE-160: Inventory and Appraisal...
✅ Downloaded DE-160: 312.5 KB

=====================================
📊 Download Summary:
   ✅ Downloaded: 15
   ⏭️  Skipped: 7
   ❌ Failed: 0
   📁 Total files: 22
=====================================

✨ Next steps:
   1. Run: npm run seed-forms
   2. Restart your server
   3. Check the Forms page
```

## 🛡️ Safety Features

- ✅ **Checks existing files** - Won't re-download unless forced
- ✅ **Validates downloads** - Checks file size > 0
- ✅ **Handles redirects** - Follows 301/302 redirects
- ✅ **Error handling** - Continues even if some forms fail
- ✅ **Rate limiting** - 500ms delay between downloads
- ✅ **Official source** - Only downloads from courts.ca.gov

## 🔄 After Downloading

### 1. Seed the Database
```bash
npm run seed-forms
```

This loads the PDFs into your database.

### 2. Restart Server
```bash
npm run api
```

### 3. Verify
Go to http://localhost:8080/forms and check that all forms appear.

## 🆘 Troubleshooting

### "Failed to download" errors
- **Cause**: California Courts website may have moved/renamed forms
- **Solution**: Visit https://www.courts.ca.gov/forms.htm to find new URLs
- **Fix**: Update URLs in `scripts/download-forms.ts`

### "File already exists" but want to update
```bash
npm run download-forms:force
```

### Forms not appearing in UI
1. Check files exist: `ls server/templates/`
2. Run seed: `npm run seed-forms`
3. Restart server
4. Clear browser cache

## 📝 Adding New Forms

To add more forms to the downloader:

1. Open `scripts/download-forms.ts`
2. Add to `FORMS_TO_DOWNLOAD` array:
```typescript
{
    code: "DE-XXX",
    filename: "DE-XXX.pdf",
    url: "https://www.courts.ca.gov/documents/deXXX.pdf",
    title: "Form Title",
    description: "Form description",
    category: "Category Name",
    icon: "IconName"
}
```
3. Run `npm run download-forms`

## 🌐 Other States

To add forms from other states:

1. Find the official state courts website
2. Locate the probate forms section
3. Copy the download URLs
4. Create a new downloader script (e.g., `download-forms-ny.ts`)
5. Update the `FORMS_TO_DOWNLOAD` array with new state forms

### State Court Websites:
- **California**: https://www.courts.ca.gov/forms.htm
- **New York**: https://ww2.nycourts.gov/forms/surrogates/
- **Texas**: https://www.txcourts.gov/rules-forms/forms/
- **Florida**: https://www.flcourts.gov/Resources-Services/Court-Forms

## ⚖️ Legal Compliance

- ✅ All forms are **public domain**
- ✅ Downloaded from **official government sources**
- ✅ **No licensing fees** or restrictions
- ✅ **Free to use** for any purpose
- ✅ **Regularly updated** by the courts

## 🔐 Security

- Uses **HTTPS** for all downloads
- Downloads only from **verified government domains**
- **Validates** file integrity
- **No external dependencies** for downloading

## 📞 Support

If you encounter issues:
1. Check the California Courts website is accessible
2. Verify your internet connection
3. Try force re-download: `npm run download-forms:force`
4. Check the error messages for specific form codes
5. Manually download problematic forms from courts.ca.gov

---

**Last Updated**: February 2026
**Forms Version**: California Judicial Council Forms (current)
