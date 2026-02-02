# Document Discovery Debugging Guide

## Issue
Document discovery is not detecting assets from uploaded documents (e.g., Robinhood statements).

## What I've Done

### 1. Enhanced Logging Throughout the Pipeline

I've added comprehensive logging at every step of the document discovery process:

#### **Frontend (src/pages/Discovery.tsx)**
- File upload mutation logs when files are selected
- Success/error handling with toast notifications

#### **Backend Routes (server/routes/discoveryRoutes.ts)**
- `[DiscoveryRoute]` logs show:
  - File upload details (name, type, size)
  - PDF text extraction results
  - Content preparation for AI analysis
  - Final results with findings count
  - Detailed error messages with stack traces

#### **Discovery Service (server/services/discoveryService.ts)**
- `[DiscoveryService]` logs show:
  - Text preview (first 500 chars)
  - AI response processing
  - Category mapping logic
  - Final findings with full details

#### **AI Service (server/services/ai.ts)**
- `[AI]` logs show:
  - Groq client initialization status
  - Input text preview
  - Model selection (text vs image)
  - Groq API call status
  - Raw AI response
  - JSON parsing results
  - Clue extraction logic

### 2. How to Debug

#### Step 1: Check Server Logs
The server is running at `http://localhost:8080`. When you upload a document, you should see logs like:

```
[DiscoveryRoute] ========== NEW UPLOAD REQUEST ==========
[DiscoveryRoute] File details: { originalname: 'robinhood.pdf', mimetype: 'application/pdf', size: 12345 }
[DiscoveryRoute] Extracted 1234 characters from PDF
[DiscoveryRoute] PDF text preview: ROBINHOOD SECURITIES, LLC...
[DiscoveryService] Starting analysis. Text length: 1234, Image: false
[DiscoveryService] Text preview: ROBINHOOD SECURITIES, LLC...
[AI] discoverRelatedAssets called. Text length: 1234, Image: false
[AI] Using model: llama-3.3-70b-versatile
[AI] Calling Groq API...
[AI] Groq API call successful
[AI] Response content: {"clues":[...]}
[AI] Extracted 1 clues from response
[DiscoveryService] AI returned 1 clues
[DiscoveryService] Mapped clue: Robinhood Brokerage Account -> INVESTMENTS
[DiscoveryRoute] Analysis complete. Found 1 findings.
```

#### Step 2: Common Issues and Solutions

**Issue: "No findings returned"**
- Check if PDF text extraction worked: Look for `[DiscoveryRoute] Extracted X characters from PDF`
- If 0 characters extracted, the PDF might be image-based (scanned) or encrypted
- Solution: Try uploading a text-based PDF or use OCR

**Issue: "Groq client not initialized"**
- Check if `GROQ_API_KEY` is set in `.env` file
- Restart the server after adding the key
- Look for `[AI] ERROR: Groq client not initialized` in logs

**Issue: "AI returned 0 clues"**
- Check the text preview in logs to see what was sent to AI
- The AI might not recognize the institution name
- Try uploading a document with clearer institution names (e.g., "Robinhood", "Fidelity", "Chase")

**Issue: "PDF Parsing Failed"**
- The PDF might be corrupted or use an unsupported format
- Try converting the PDF to text first
- Try uploading as a text file (.txt) instead

#### Step 3: Test with Sample Document

Create a simple text file with this content:

```
ROBINHOOD SECURITIES, LLC
1099-B Proceeds From Broker and Barter Exchange Transactions

Account Number: XXXX-1234
Tax Year: 2024

Total Proceeds: $15,234.56
```

Save as `test-robinhood.txt` and upload it. This should definitely be detected.

### 3. What to Look For in Logs

When you upload a document, check the server console for:

1. **File Upload Success**: `[DiscoveryRoute] File details: {...}`
2. **Text Extraction**: `[DiscoveryRoute] Extracted X characters`
3. **AI Call**: `[AI] Calling Groq API...`
4. **AI Response**: `[AI] Response content: {...}`
5. **Findings**: `[DiscoveryRoute] Found X findings`

If any of these steps fail, the logs will show detailed error messages.

### 4. Next Steps

1. **Upload a test document** (Robinhood statement or the sample text above)
2. **Check the server console** for the detailed logs
3. **Look for errors** at any step in the pipeline
4. **Share the logs** with me if you see any errors

The enhanced logging will help us pinpoint exactly where the issue is occurring.

## Expected Behavior

When you upload a Robinhood document, you should see:

1. **Frontend**: "Analyzing Intelligence..." animation
2. **Server Logs**: Detailed processing logs
3. **Frontend**: Toast notification "Found 1 potential assets!"
4. **UI**: Card showing "Robinhood Brokerage Account" with "Add" button

## Files Modified

- `server/services/discoveryService.ts` - Enhanced logging and error handling
- `server/routes/discoveryRoutes.ts` - Comprehensive request/response logging
- `server/services/ai.ts` - Detailed AI service logging with Groq API debugging

## Testing

The server is currently running at `http://localhost:8080`. Try uploading a document and watch the console output.
