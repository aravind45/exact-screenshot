# Document Discovery Troubleshooting Guide

## Quick Start

Your document discovery feature is not detecting assets. I've added comprehensive logging to help diagnose the issue.

## Test the AI Service Directly

Run this command to test if the AI service is working:

```bash
npx tsx test-discovery-simple.ts
```

This will:
1. Check if your GROQ_API_KEY is configured
2. Send a sample Robinhood document to the AI
3. Show you exactly what the AI returns
4. Tell you if it's working or not

**Expected Output (Success)**:
```
✅ SUCCESS! AI detected the following assets:

Clue 1:
  Institution: Robinhood Securities, LLC
  Asset Type: Brokerage Account
  Source: ROBINHOOD SECURITIES, LLC
  Confidence: 95%

✅ Document discovery is working correctly!
```

**If you see this**, the AI service is working and the issue is elsewhere.

**If you see "No clues found"**, there's an issue with the AI service.

## Test the Full Upload Flow

1. **Start the server** (already running at http://localhost:8080)
2. **Open the app** in your browser
3. **Go to Discovery page**
4. **Upload a document** (Robinhood statement or create a test file)
5. **Watch the server console** for detailed logs

### Create a Test File

Create `test-robinhood.txt`:
```
ROBINHOOD SECURITIES, LLC
1099-B Proceeds From Broker and Barter Exchange Transactions

Account Number: XXXX-1234
Tax Year: 2024

Total Proceeds: $15,234.56
```

Upload this file - it should definitely be detected.

## What the Logs Tell You

### Successful Upload
```
[DiscoveryRoute] ========== NEW UPLOAD REQUEST ==========
[DiscoveryRoute] File details: { originalname: 'test.txt', mimetype: 'text/plain', size: 123 }
[DiscoveryRoute] Text file length: 123
[DiscoveryService] Starting analysis. Text length: 123
[AI] discoverRelatedAssets called. Text length: 123
[AI] Using model: llama-3.3-70b-versatile
[AI] Calling Groq API...
[AI] Groq API call successful
[AI] Extracted 1 clues from response
[DiscoveryService] AI returned 1 clues
[DiscoveryRoute] Found 1 findings
[DiscoveryRoute] ========== REQUEST COMPLETE ==========
```

### Common Error Patterns

#### 1. PDF Extraction Failed
```
[DiscoveryRoute] Extracted 0 characters from PDF
[DiscoveryRoute] WARNING: PDF text extraction returned 0 characters
```
**Solution**: PDF is image-based or encrypted. Convert to text or use OCR.

#### 2. Groq API Not Initialized
```
[AI] ERROR: Groq client not initialized. Check GROQ_API_KEY
```
**Solution**: Add GROQ_API_KEY to .env file and restart server.

#### 3. AI Returns No Clues
```
[AI] Extracted 0 clues from response
[AI] WARNING: No clues extracted
```
**Solution**: Check if the text contains recognizable institution names.

#### 4. Groq API Error
```
[AI] ========== GROQ API ERROR ==========
[AI] Error: 401 Unauthorized
```
**Solution**: GROQ_API_KEY is invalid or expired. Get a new key.

## Diagnostic Checklist

Run through this checklist:

- [ ] **Server is running**: Check http://localhost:8080 loads
- [ ] **GROQ_API_KEY is set**: Check `.env` file
- [ ] **Test script works**: Run `npx tsx test-discovery-simple.ts`
- [ ] **File uploads**: Try uploading the test file
- [ ] **Check logs**: Look for errors in server console
- [ ] **PDF extraction**: If using PDF, check character count in logs

## Common Solutions

### Solution 1: Restart Everything
```bash
# Stop the server (Ctrl+C)
# Restart it
npm run dev
```

### Solution 2: Check Environment Variables
```bash
# View .env file
type .env

# Should see:
# GROQ_API_KEY="gsk_..."
```

### Solution 3: Test with Simple Text File
Don't use PDF initially. Create a simple .txt file with institution names and upload that first.

### Solution 4: Check Groq API Status
Visit https://console.groq.com to check if:
- Your API key is valid
- You have API credits remaining
- The service is operational

## Still Not Working?

If you've tried everything above and it's still not working:

1. **Run the test script** and share the output with me
2. **Upload a test file** and share the server console logs
3. **Check the browser console** (F12) for any frontend errors

The enhanced logging will show exactly where the issue is occurring.

## Files to Check

- **Backend Logs**: Server console (where you ran `npm run dev`)
- **Frontend Logs**: Browser console (F12 → Console tab)
- **Environment**: `.env` file (check GROQ_API_KEY)

## Quick Reference

| Issue | Log Pattern | Solution |
|-------|-------------|----------|
| PDF not readable | `Extracted 0 characters` | Use text file or OCR |
| API key missing | `Groq client not initialized` | Add to .env and restart |
| No institutions found | `Extracted 0 clues` | Check text content |
| API error | `GROQ API ERROR` | Check API key validity |

## Next Steps

1. Run `npx tsx test-discovery-simple.ts`
2. Check the output
3. If it works, try uploading through the UI
4. Share any error messages you see

The comprehensive logging will help us identify the exact issue quickly!
