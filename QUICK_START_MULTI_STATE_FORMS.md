# Quick Start: Multi-State Forms

## 🚀 Get Started in 3 Steps

### Step 1: Download Forms

```bash
# Download New York forms (15 forms)
npm run download-forms-ny

# Download Texas forms (12 forms)
npm run download-forms-tx

# Download Florida forms (15 forms)
npm run download-forms-fl
```

**Expected Output**: Each command will download PDFs to `server/templates/`

### Step 2: Seed Database

```bash
npm run seed-forms
```

**Expected Output**: 
```
🌱 Seeding default form templates...
✅ Seeded template: ET-1 (NY)
✅ Seeded template: TX-1 (TX)
✅ Seeded template: FL-1 (FL)
...
🏁 Default form templates seeding complete.
```

### Step 3: Test in UI

1. Start your server: `npm run dev`
2. Navigate to Forms page
3. Select state from dropdown: New York, Texas, or Florida
4. Verify forms appear

---

## ⚠️ If Downloads Fail

Some form URLs may need verification. If you see download errors:

### New York
Visit: https://ww2.nycourts.gov/forms/surrogates/probate.shtml
- Right-click each form → Copy Link Address
- Update URLs in `scripts/download-forms-ny.ts`

### Texas
Visit: https://www.txcourts.gov/rules-forms/forms/
- Or check county websites (Harris, Dallas, Travis)
- Update URLs in `scripts/download-forms-tx.ts`

### Florida
Visit: https://www.jud11.flcourts.org/probate-smart-forms
- Or check your local circuit court
- Update URLs in `scripts/download-forms-fl.ts`

---

## 📊 What You Get

- **4 states**: California, New York, Texas, Florida
- **64 forms**: 22 CA + 15 NY + 12 TX + 15 FL
- **111.5M people**: 34% of US population covered

---

## 🔧 Troubleshooting

### Forms not appearing in UI?
- Check that PDFs downloaded to `server/templates/`
- Run `npm run seed-forms` again
- Restart your server

### Download errors?
- URLs may need verification (see above)
- Check internet connection
- Try force re-download: `npm run download-forms-ny:force`

### Database errors?
- Ensure Prisma is up to date: `npx prisma generate`
- Check database connection
- Verify `server/templates/` directory exists

---

## 📚 More Information

- Full details: `MULTI_STATE_FORMS_IMPLEMENTATION_COMPLETE.md`
- Add more states: `HOW_TO_ADD_NEW_STATE.md`
- Implementation guide: `THREE_STATE_IMPLEMENTATION_GUIDE.md`

