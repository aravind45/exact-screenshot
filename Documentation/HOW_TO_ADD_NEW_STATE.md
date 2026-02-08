# How to Add a New State's Probate Forms

This guide shows you how to add probate forms for a new state in ~3-4 hours.

## 📋 Prerequisites

- Access to the state's official court website
- List of 10-20 core probate forms
- Form URLs (direct PDF links)

## 🚀 Step-by-Step Process

### Step 1: Research the State (1-2 hours)

1. **Find the official forms website**
   ```
   Google: "[State] probate forms official court"
   Example: "New York probate forms official court"
   ```

2. **Identify core forms** (aim for 10-20)
   - Petition for Probate
   - Notice to Creditors
   - Letters Testamentary/Administration
   - Inventory and Appraisal
   - Accounting forms
   - Final Distribution
   - Discharge/Closing

3. **Document form information**
   Create a spreadsheet with:
   - Form Code (e.g., "Form 1.1", "ET-1")
   - Form Title
   - Direct PDF URL
   - Category
   - Description

### Step 2: Create State Downloader (30 minutes)

1. **Copy the template**
   ```bash
   cp scripts/download-forms-template.ts scripts/download-forms-[STATE].ts
   ```
   Example: `scripts/download-forms-ny.ts`

2. **Update the form definitions**
   ```typescript
   const FORMS_TO_DOWNLOAD: FormDefinition[] = [
       {
           code: "ET-1",  // State's form code
           filename: "ET-1.pdf",
           url: "https://state-courts.gov/forms/et1.pdf",
           title: "Petition for Probate",
           description: "Initial petition to open probate",
           category: "Probate Initialization",
           icon: "FileText"
       },
       // ... add 10-20 forms
   ];
   ```

3. **Update state-specific variables**
   ```typescript
   const STATE_CODE = "NY";  // Two-letter state code
   const STATE_NAME = "New York";
   ```

4. **Test the downloader**
   ```bash
   npx tsx scripts/download-forms-ny.ts
   ```

### Step 3: Add NPM Scripts (5 minutes)

Add to `package.json`:
```json
{
  "scripts": {
    "download-forms-ny": "tsx scripts/download-forms-ny.ts",
    "download-forms-ny:force": "tsx scripts/download-forms-ny.ts --force",
    "download-forms-ny:list": "tsx scripts/download-forms-ny.ts --list"
  }
}
```

### Step 4: Update Form Seeding Service (15 minutes)

1. **Generate the forms list**
   ```bash
   npm run download-forms-ny:list
   ```

2. **Copy output to `server/services/formSeedingService.ts`**
   ```typescript
   const NY_TEMPLATES: DefaultTemplate[] = [
       {
           name: "ET-1",
           filename: "ET-1.pdf",
           title: "Petition for Probate",
           description: "Initial petition to open probate",
           category: "Probate Initialization",
           icon: "FileText"
       },
       // ... paste generated list
   ];
   ```

3. **Add to DEFAULT_TEMPLATES array**
   ```typescript
   const DEFAULT_TEMPLATES: DefaultTemplate[] = [
       ...CA_TEMPLATES,  // Existing California forms
       ...NY_TEMPLATES,  // New York forms
   ];
   ```

4. **Update the seeding logic**
   ```typescript
   // In seedDefaults() method
   for (const t of DEFAULT_TEMPLATES) {
       // ... existing code
       create: {
           name: t.name,
           title: t.title,
           description: t.description,
           category: t.category,
           icon: t.icon,
           data: fileData,
           state: t.state || "CA"  // Add state field
       }
   }
   ```

### Step 5: Update Forms Page UI (10 minutes)

The Forms page already supports all 50 states! Just update the supported states list:

```typescript
// In src/pages/Forms.tsx
const STATES = [
    { id: "CA", name: "California", icon: "🌴", supported: true },
    { id: "NY", name: "New York", icon: "🗽", supported: true },  // Change to true
    { id: "TX", name: "Texas", icon: "🤠", supported: true },     // Change to true
    // ... rest of states
];
```

### Step 6: Test Everything (30 minutes)

1. **Download forms**
   ```bash
   npm run download-forms-ny
   ```

2. **Verify downloads**
   ```bash
   ls server/templates/ET-*.pdf
   ```

3. **Seed database**
   ```bash
   npm run seed-forms
   ```

4. **Start server and test UI**
   ```bash
   npm run api
   # Visit http://localhost:8080/forms
   # Select New York from dropdown
   # Verify forms appear
   ```

5. **Test form actions**
   - Preview button
   - Blank download button
   - Auto-fill button (if ready)

### Step 7: Document (15 minutes)

1. **Update MULTI_STATE_FORMS_EXPANSION_PLAN.md**
   - Mark state as complete
   - Add form count
   - Note any special considerations

2. **Create state-specific notes** (optional)
   ```markdown
   # New York Probate Forms

   ## Official Source
   https://ww2.nycourts.gov/forms/surrogates/

   ## Forms Included (15)
   - ET-1: Petition for Probate
   - ET-2: Notice to Creditors
   ...

   ## State-Specific Notes
   - New York uses "Surrogate's Court"
   - Forms are organized by proceeding type
   - All forms are fillable PDFs
   ```

## 🎯 Quick Reference Checklist

- [ ] Research state forms (1-2 hours)
- [ ] Create downloader script (30 min)
- [ ] Add NPM scripts (5 min)
- [ ] Update seeding service (15 min)
- [ ] Update Forms page UI (10 min)
- [ ] Test everything (30 min)
- [ ] Document (15 min)

**Total Time**: ~3-4 hours per state

## 💡 Tips & Tricks

### Finding Form URLs
```bash
# Use browser dev tools to find direct PDF links
# Right-click form link → Copy Link Address
```

### Handling Redirects
The downloader automatically handles 301/302 redirects.

### State-Specific Icons
Choose appropriate Lucide React icons:
- FileText, ScrollText - General documents
- Bell - Notices
- Gavel - Court orders
- ShieldCheck - Authority
- Scale - Inventory
- Users - Distribution
- CheckCircle - Closing

### Form Naming Conventions
- Use state's official form codes
- Keep filenames simple: `[CODE].pdf`
- Example: `ET-1.pdf`, `Form-1.1.pdf`

## 🚧 Common Issues

### Issue: Form URL returns 404
**Solution**: Check if form was moved/renamed on state website

### Issue: PDF is password-protected
**Solution**: Contact state court for unprotected version

### Issue: Forms are county-specific
**Solution**: Choose most populous county or provide multiple versions

### Issue: State has no centralized forms
**Solution**: Research most common county forms, add disclaimer

## 📞 Need Help?

1. Check existing state implementations (CA, NY, TX)
2. Review `download-forms-template.ts`
3. Test with a small subset of forms first
4. Reach out to team for state-specific questions

---

**Last Updated**: February 2026
**Template Version**: 1.0
