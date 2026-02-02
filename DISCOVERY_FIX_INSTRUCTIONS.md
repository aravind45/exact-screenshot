# Document Discovery - Fix Instructions

## Current Status

✅ **AI Service**: Working perfectly - tested and confirmed detecting Robinhood
✅ **Server**: Running on http://localhost:8080
✅ **Logging**: Comprehensive logging added throughout the pipeline
✅ **Code**: All fixes from previous session are in place

## The Issue

Document discovery should be working now. The AI correctly detects institutions like Robinhood, Fidelity, Vanguard, etc.

## How to Test

### 1. Open the Application
Navigate to: http://localhost:8080

### 2. Log In
Use your credentials to log in

### 3. Go to Discovery Assistant
Click "Discovery Assistant" in the sidebar

### 4. Upload a Document
- Click "Select File" or drag & drop a document
- Supported formats: PDF, JPG, PNG, TXT
- Test with a Robinhood statement, bank statement, or 1099 form

### 5. Check Results
You should see:
- "Analyzing Intelligence..." animation
- Then "AI-Identified Potential Assets" section with findings
- Each finding shows: Institution name, Asset type, Confidence level
- Click "Add" to add the asset to your ledger

## What to Look For

### Success Indicators:
- ✅ File uploads without errors
- ✅ "Analyzing..." animation appears
- ✅ Findings appear in the results section
- ✅ Institution names are correctly identified (Robinhood, Fidelity, etc.)

### If It's Not Working:

#### Check Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Look for errors (red text)
4. Share any errors you see

#### Check Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Upload a document
4. Find the `/api/discovery/analyze` request
5. Click on it and check:
   - Status code (should be 200)
   - Response tab (should show findings)
   - If status is 401: Authentication issue
   - If status is 500: Server error (check server logs)

#### Check Server Logs
The server console should show:
```
[DiscoveryRoute] Received file upload request
[DiscoveryRoute] File details: { originalname, mimetype, size }
[DiscoveryRoute] Processing PDF file
[DiscoveryRoute] Extracted X characters from PDF
[DiscoveryService] Starting analysis...
[AI] discoverRelatedAssets response content: ...
[DiscoveryService] Returning X findings
```

If you don't see these logs, the request isn't reaching the server.

## Common Issues & Solutions

### Issue 1: "No file uploaded" Error
**Cause**: File input not working
**Solution**: Try drag & drop instead of clicking "Select File"

### Issue 2: "Analysis failed" Error
**Cause**: Server error or authentication issue
**Solution**: 
1. Check if you're logged in
2. Check server logs for errors
3. Try refreshing the page and logging in again

### Issue 3: "No obvious assets found"
**Cause**: Document doesn't contain clear institution names
**Solution**: 
1. Try a different document (1099 forms work best)
2. Check if the PDF text is extractable (some PDFs are images)
3. The AI is conservative - it only returns high-confidence findings

### Issue 4: Findings Not Showing
**Cause**: Frontend state issue
**Solution**:
1. Check browser console for React errors
2. Try refreshing the page
3. Clear browser cache and try again

## Test Documents

### Good Test Documents:
- ✅ 1099-B from Robinhood, Fidelity, Vanguard
- ✅ 1099-INT from banks
- ✅ 1099-DIV from investment accounts
- ✅ Bank statements with institution logos
- ✅ Brokerage statements with account summaries

### Poor Test Documents:
- ❌ Scanned images without OCR
- ❌ Handwritten notes
- ❌ Documents without institution names
- ❌ Generic receipts

## Expected Behavior

### Example 1: Robinhood 1099-B
**Input**: PDF with "ROBINHOOD SECURITIES, LLC" header
**Expected Output**:
```
Institution: Robinhood
Asset Type: Brokerage Account
Confidence: 99%
Category: INVESTMENTS
```

### Example 2: Bank Statement
**Input**: PDF with "Wells Fargo" logo and account balance
**Expected Output**:
```
Institution: Wells Fargo
Asset Type: Bank Account
Confidence: 95%
Category: BANK_ACCOUNTS
```

### Example 3: 401k Statement
**Input**: PDF mentioning "401(k) Plan" and employer name
**Expected Output**:
```
Institution: [Employer Name]
Asset Type: 401k
Confidence: 90%
Category: EMPLOYER_BENEFITS
```

## Debugging Commands

### Test AI Service Directly
```bash
npx tsx test-discovery-debug.ts
```

### Check Server Status
```bash
# Server should be running on port 8080
curl http://localhost:8080/api/health
```

### Test Upload Endpoint
```bash
# Create test file
echo "ROBINHOOD SECURITIES, LLC" > test.txt

# Upload (replace YOUR_TOKEN with actual token from localStorage)
curl -X POST http://localhost:8080/api/discovery/analyze \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.txt"
```

## What Changed (Previous Session)

1. **Enhanced AI Prompt**: Added explicit list of common institutions
2. **Improved Category Mapping**: Added specific checks for Robinhood, Fidelity, Vanguard, Coinbase, Binance
3. **Comprehensive Logging**: Added detailed logs throughout the pipeline
4. **Better Error Handling**: Improved error messages and logging

## Next Steps

1. **Test the feature**: Upload a Robinhood document
2. **Check the logs**: Look at server console output
3. **Report results**: Let me know what you see:
   - Does it work?
   - What errors do you see?
   - What does the server log show?

## Summary

The document discovery feature should now be working. The AI correctly detects institutions and the code has comprehensive logging to help debug any issues. 

**Try uploading a document and let me know what happens!**

If it's still not working, share:
1. Browser console errors
2. Network tab response
3. Server log output

This will help me identify exactly where the issue is.
