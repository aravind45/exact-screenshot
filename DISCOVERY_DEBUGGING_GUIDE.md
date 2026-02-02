# Document Discovery Debugging Guide

## Issue
Document discovery is not detecting assets from uploaded documents (e.g., Robinhood statements).

## Test Results

### ✅ AI Service Works Correctly
Tested the AI service directly with sample Robinhood text:
```
Input: "ROBINHOOD SECURITIES, LLC 1099-B..."
Output: Found 1 clue - Robinhood Brokerage Account (99% confidence)
```

The AI detection is working perfectly. The issue is elsewhere in the pipeline.

## Potential Issues

### 1. Server Not Running
**Check:** Is the development server running?
```bash
npm run dev
```

**Expected:** Server should start on port 5000 (or configured port)

### 2. PDF Text Extraction Failing
**Check:** Is the PDF text being extracted correctly?

The route uses `pdf-parse` library:
```typescript
const data = await pdf(req.file.buffer);
text = data.text;
```

**Test:** Upload a PDF and check server logs for:
- `[DiscoveryRoute] Extracted X characters from PDF`
- `[DiscoveryRoute] PDF text preview: ...`

### 3. Authentication Issues
**Check:** Is the auth token being sent correctly?

The frontend sends:
```typescript
const token = localStorage.getItem("auth_token");
headers: { "Authorization": `Bearer ${token}` }
```

**Test:** Check browser DevTools → Network tab → Request Headers

### 4. CORS Issues
**Check:** Are CORS headers configured correctly?

**Test:** Check browser console for CORS errors

### 5. File Upload Issues
**Check:** Is multer configured correctly?

The route uses:
```typescript
const upload = multer({ storage: multer.memoryStorage() });
router.post('/analyze', upload.single('file'), ...)
```

**Test:** Check if `req.file` exists in the route handler

## Debugging Steps

### Step 1: Check Server Logs
Start the server and watch for logs:
```bash
npm run dev
```

Upload a document and look for:
```
[DiscoveryRoute] Received file upload request
[DiscoveryRoute] File details: { originalname, mimetype, size }
[DiscoveryRoute] Processing PDF file
[DiscoveryRoute] Extracted X characters from PDF
[DiscoveryRoute] PDF text preview: ...
[DiscoveryService] Starting analysis...
[AI] discoverRelatedAssets response content: ...
[DiscoveryService] Returning X findings
```

### Step 2: Check Browser Console
Open browser DevTools → Console and look for:
- JavaScript errors
- Network request failures
- CORS errors

### Step 3: Check Network Tab
Open browser DevTools → Network tab:
1. Upload a document
2. Find the `/api/discovery/analyze` request
3. Check:
   - Status code (should be 200)
   - Request payload (should contain file)
   - Response body (should contain findings)

### Step 4: Test with Sample Document
Create a simple text file with:
```
ROBINHOOD SECURITIES, LLC
Account Number: 1234
Total Value: $10,000
```

Save as `test-robinhood.txt` and upload it.

### Step 5: Check Database
If findings are returned but not showing in UI:
```sql
SELECT * FROM "DiscoveryCategory" WHERE "estateId" = 'YOUR_ESTATE_ID';
```

## Common Fixes

### Fix 1: Restart Server
Sometimes the server needs a restart after code changes:
```bash
# Stop server (Ctrl+C)
npm run dev
```

### Fix 2: Clear Browser Cache
Clear browser cache and localStorage:
```javascript
// In browser console:
localStorage.clear();
location.reload();
```

### Fix 3: Check Environment Variables
Ensure `GROQ_API_KEY` is set in `.env`:
```bash
GROQ_API_KEY=your_key_here
```

### Fix 4: Increase Logging
The code already has comprehensive logging. Check server console output.

### Fix 5: Test AI Service Directly
Run the test script:
```bash
npx tsx test-discovery-debug.ts
```

Expected output:
```
Found 1 clues:
[
  {
    "potentialAsset": "Brokerage Account",
    "institution": "Robinhood",
    "sourceClue": "ROBINHOOD SECURITIES, LLC",
    "confidence": 0.99
  }
]
```

## Expected Flow

1. **User uploads file** → Frontend sends FormData to `/api/discovery/analyze`
2. **Server receives file** → Logs: `[DiscoveryRoute] Received file upload request`
3. **Extract text** → Uses `pdf-parse` for PDFs, logs extracted text
4. **Call AI service** → `DiscoveryService.analyzeDocument()`
5. **AI analyzes** → `ai.discoverRelatedAssets()` returns clues
6. **Map categories** → Service maps institution names to categories
7. **Return findings** → Frontend displays in "AI-Identified Potential Assets" section

## Current Status

✅ AI service works correctly
✅ Logging is comprehensive
✅ Category mapping includes Robinhood, Fidelity, Vanguard, etc.
❓ Need to verify: Server running, file upload working, auth token present

## Next Steps

1. **Start the server**: `npm run dev`
2. **Upload a Robinhood document**
3. **Check server logs** for the flow above
4. **Check browser console** for errors
5. **Check Network tab** for API response

If you see findings in the API response but not in the UI, the issue is in the frontend state management. If you don't see findings in the API response, check the server logs to see where the flow breaks.

## Quick Test

Run this in your terminal while the server is running:
```bash
# Create a test file
echo "ROBINHOOD SECURITIES, LLC
Account: 1234
Value: $10,000" > test.txt

# Upload it (replace TOKEN with your auth token)
curl -X POST http://localhost:5000/api/discovery/analyze \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.txt"
```

Expected response:
```json
{
  "findings": [
    {
      "confidence": 0.99,
      "category": "INVESTMENTS",
      "asset": {
        "name": "Robinhood Brokerage Account",
        "institution": "Robinhood",
        "assetType": "Brokerage Account"
      }
    }
  ]
}
```
