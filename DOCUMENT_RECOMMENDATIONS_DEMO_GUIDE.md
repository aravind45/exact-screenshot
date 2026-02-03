# Smart Document Recommendations - Demo Guide

**Feature**: Smart Document Recommendations  
**Status**: ✅ Ready to Test  
**Date**: February 2, 2026

---

## Quick Start

### 1. Start the Servers

Make sure both servers are running:

```bash
# Terminal 1: Frontend (Vite)
npm run dev
# Runs on http://localhost:8080

# Terminal 2: Backend API
npm run api
# Runs on http://localhost:3000
```

---

## How to Test the Feature

### Step 1: Login

1. Go to http://localhost:8080
2. Login with test user:
   - Email: `pth01-probate@test.com`
   - Password: `Test123!`

### Step 2: Navigate to Assets

1. Click on "Assets" in the sidebar
2. You should see 3 test assets (Fidelity, Chase, Vanguard)

### Step 3: Open Communication Log

1. Click on any asset (e.g., "Fidelity")
2. Click the "Log Communication" button
3. **The magic happens here!** 🎉

---

## What You'll See

### Smart Recommendations Section

When the Communication Log Dialog opens, you'll see a new **"Smart Recommendations"** section with:

#### 1. Completeness Indicator
- Shows percentage of required documents you have
- Example: "0% Complete" (if no documents uploaded yet)

#### 2. Missing Documents Alert (Red)
If you're missing required documents:
```
⚠️ Missing Required Documents
You're missing 1 required document(s). This may delay approval.
```

#### 3. All Documents Ready Alert (Green)
If you have all required documents:
```
✓ All Required Documents Ready
You have all required documents for this communication.
```

#### 4. Required Documents List
Shows each required document with:
- ✅ Green checkmark if you have it
- ❌ Red alert icon if missing
- Clear reason why it's needed

Example:
```
Required Documents
  ✅ DEATH CERTIFICATE (high)
     Required by all institutions to verify death
  
  ❌ DE-150 LETTERS (high)
     Required for individually-owned assets
```

#### 5. Suggested Documents List
Shows optional documents that could help:
```
Suggested Documents (Optional)
  💡 FIDELITY CLAIM FORM (medium)
     Fidelity-specific claim form (can be obtained from their website)
```

---

## Testing Different Scenarios

### Scenario 1: Initial Contact (Default)
**What to expect**:
- Required: Death Certificate only
- Suggested: Institution-specific claim form
- Completeness: 0% (no documents uploaded yet)

### Scenario 2: Change Communication Type
1. Change "Type" dropdown to "Document Submission"
2. Watch recommendations update automatically
3. Should now show more required documents:
   - Death Certificate
   - DE-150 Letters (if INDIVIDUAL ownership)
   - DE-111 Petition (if INDIVIDUAL ownership)
   - Claim Form

### Scenario 3: Different Institutions
Test with different assets to see institution-specific recommendations:

**Fidelity**:
- Suggests: Fidelity Claim Form

**Chase**:
- Suggests: Bank Statement

**Vanguard**:
- Suggests: Vanguard Claim Form

---

## Visual Guide

### Before (Old Dialog)
```
┌─────────────────────────────────────┐
│ Log Activity & Communication        │
├─────────────────────────────────────┤
│ Method: [Email ▼]                   │
│ Subject: [____________]             │
│ Notes: [____________]               │
│                                     │
│ [Attachments Section]               │
│ (Manual selection only)             │
│                                     │
│ [Cancel] [Log Communication]        │
└─────────────────────────────────────┘
```

### After (With Smart Recommendations)
```
┌─────────────────────────────────────┐
│ Log Activity & Communication        │
├─────────────────────────────────────┤
│ Method: [Email ▼]                   │
│ Subject: [____________]             │
│ Notes: [____________]               │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ✨ Smart Recommendations         │ │
│ │ 0% Complete                      │ │
│ ├─────────────────────────────────┤ │
│ │ ⚠️ Missing Required Documents    │ │
│ │ You're missing 1 required doc    │ │
│ ├─────────────────────────────────┤ │
│ │ Required Documents               │ │
│ │ ❌ DEATH CERTIFICATE (high)      │ │
│ │    Required by all institutions  │ │
│ ├─────────────────────────────────┤ │
│ │ Suggested Documents (Optional)   │ │
│ │ 💡 FIDELITY CLAIM FORM (medium)  │ │
│ │    Fidelity-specific form        │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Attachments Section]               │
│ (Auto-selects required docs)        │
│                                     │
│ [Cancel] [Log Communication]        │
└─────────────────────────────────────┘
```

---

## Expected Behavior

### Auto-Loading
- ✅ Recommendations load automatically when dialog opens
- ✅ Shows loading spinner while fetching
- ✅ Updates based on workflow step

### Auto-Selection
- ✅ Required documents that exist in vault are auto-selected
- ✅ User can manually deselect if needed
- ✅ Visual feedback shows what's selected

### Visual Feedback
- ✅ Green = Document available and ready
- ✅ Red = Document missing (required)
- ✅ Blue = Document suggested (optional)
- ✅ Completeness percentage updates in real-time

---

## Testing Checklist

- [ ] Dialog opens without errors
- [ ] Recommendations section appears
- [ ] Completeness percentage shows
- [ ] Required documents list displays
- [ ] Suggested documents list displays
- [ ] Missing documents alert shows (if applicable)
- [ ] Visual indicators (checkmarks, alerts) work
- [ ] Different workflow steps show different requirements
- [ ] Different institutions show different suggestions
- [ ] Loading states work properly

---

## Troubleshooting

### Issue: Recommendations don't load
**Solution**: Check that backend API is running on port 3000
```bash
npm run api
```

### Issue: No recommendations show
**Solution**: Check browser console for errors
- Open DevTools (F12)
- Look for API errors
- Check Network tab for failed requests

### Issue: Wrong recommendations
**Solution**: Verify asset data
- Check asset ownership type
- Check workflow step
- Check institution name

---

## API Testing (Optional)

You can also test the API directly:

### Get Recommendations
```bash
# Get auth token first
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"pth01-probate@test.com","password":"Test123!"}'

# Use token to get recommendations
curl http://localhost:3000/api/communications/asset/ASSET_ID/document-recommendations?workflowStep=initial_contact \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Available Documents
```bash
curl http://localhost:3000/api/communications/estate/available-documents \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Next Steps After Testing

1. **Upload Test Documents**
   - Upload a death certificate
   - Watch completeness percentage increase
   - See green checkmarks appear

2. **Test Different Workflows**
   - Change workflow steps
   - See recommendations update
   - Verify logic is correct

3. **Test Different Assets**
   - Try different institutions
   - Verify institution-specific suggestions
   - Check ownership type logic

4. **Provide Feedback**
   - What works well?
   - What's confusing?
   - What's missing?

---

## Success Criteria

The feature is working correctly if:

✅ Recommendations load automatically  
✅ Required documents are clearly marked  
✅ Suggested documents are shown separately  
✅ Completeness percentage is accurate  
✅ Visual feedback is clear and helpful  
✅ Auto-selection works for available documents  
✅ Different scenarios show different recommendations  

---

## Demo Script (For Presentations)

### Opening
"Let me show you our new Smart Document Recommendations feature. This helps users know exactly what documents they need before submitting communications."

### Demo Flow
1. "I'm going to log a communication with Fidelity..."
2. "Notice the Smart Recommendations section appears automatically"
3. "It tells me I need a Death Certificate - that's required by all institutions"
4. "It also suggests a Fidelity-specific claim form - that's optional but helpful"
5. "The completeness indicator shows I'm at 0% because I haven't uploaded any documents yet"
6. "If I change the communication type to 'Document Submission'..."
7. "Watch how the recommendations update - now it's asking for probate documents too"
8. "This prevents rejections and speeds up approvals by ensuring complete submissions"

### Closing
"This is just one of five high-impact features we're adding to take the platform from good to industry-leading."

---

**Happy Testing!** 🎉

If you encounter any issues, check:
1. Both servers are running
2. Browser console for errors
3. Network tab for failed API calls
4. Test user credentials are correct
