import Groq from "groq-sdk";
import "dotenv/config";
// Lazy init or global init
let groq;
try {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
}
catch (e) {
    console.error("Failed to initialize Groq client:", e);
}
export async function analyzeDocument(text, imageBase64) {
    const prompt = `You are a forensic "Detective Agent" for the ExpectedEstate platform. 
    Analyze the provided document (Text or Image) to extract financial assets.
    
    CRITICAL: Identify the INSTITUTION (Bank, Brokerage, Employer) and the ASSET TYPE.
    
    SPECIAL HANDLING BY DOCUMENT TYPE:
    1. W-2:
       - institution: [Employer Name] from Box c.
       - assetType: If Box 13 "Retirement Plan" is checked, use "401k/Pension (Employer-sponsored)". Otherwise "Employment Record".
       - value: Box 1 "Wages" (Annual).
    2. 1099-B / 1099-DIV / 1099-INT / 1099-R:
       - institution: [Payer Name] (e.g. Robinhood, Fidelity, Charles Schwab, Chase, Vanguard). 
       - LOOK AT THE TOP HEADER, "PAYER NAME", OR FOOTER. 
       - If you see "Robinhood Securities" or "Robinhood Financial", the institution is "Robinhood".
       - assetType: "Brokerage Account", "Cryptocurrency", "IRA", or "Savings/Checking" based on the form.
       - value: Look for "Total Proceeds", "Fair Market Value", or "Total Distribution".
    3. Bank Statements:
       - institution: Look for the logo or bank name at the very top.
       - value: Ending Balance.
       - assetType: Checking or Savings.

    Standard Fields for JSON:
    {
      "institution": "Name of Bank, Brokerage, or Employer",
      "accountNumber": "Last 4 digits",
      "value": 1234.56,
      "assetType": "checking, brokerage, 401k, crypto, insurance, property, etc.",
      "category": "financial, retirement, insurance, employer, etc.",
      "reasoningChain": "1-2 sentences on what clues were found.",
      "suggestNextSteps": ["Step 1", "Step 2"]
    }
    
    If you cannot find the EXACT name, use the most likely candidate or "Unknown".
    Return ONLY valid JSON.`;
    try {
        const contentMessage = [];
        if (text)
            contentMessage.push({ type: "text", text: `Analyze this document text:\n\n${text.substring(0, 10000)}` });
        if (imageBase64)
            contentMessage.push({
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
            });
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: prompt },
                { role: "user", content: imageBase64 ? contentMessage : (text || "") },
            ],
            // meta-llama/llama-4-maverick-17b-128e-instruct is the active vision model in 2026
            model: imageBase64 ? "meta-llama/llama-4-maverick-17b-128e-instruct" : "llama-3.3-70b-versatile",
            temperature: 0,
            response_format: { type: "json_object" },
        });
        const content = completion.choices[0]?.message?.content || "";
        console.log(`[AI] analyzeDocument response: ${content.substring(0, 200)}...`);
        if (!content)
            return null;
        const parsed = JSON.parse(content);
        // Handle cases where AI might wrap the result in a key
        const result = parsed.result || parsed.asset || parsed.extracted || parsed.findings?.[0] || parsed;
        return {
            institution: result.institution || "Unknown",
            accountNumber: result.accountNumber,
            value: typeof result.value === 'string' ? parseFloat(result.value.replace(/[^0-9.]/g, '')) : (result.value || 0),
            assetType: result.assetType || "Account",
            category: result.category || "financial",
            reasoningChain: result.reasoningChain,
            suggestNextSteps: result.suggestNextSteps
        };
    }
    catch (error) {
        console.error("AI Analysis Error:", error.message);
        if (error.response?.data)
            console.error("Groq Error Body:", JSON.stringify(error.response.data));
        return null;
    }
}
/**
 * The "Detective Agent": Scans documents for clues pointing to OTHER related assets.
 */
export async function discoverRelatedAssets(text, imageBase64) {
    console.log(`[AI] discoverRelatedAssets called. Text length: ${text?.length || 0}, Image: ${!!imageBase64}`);
    if (!groq) {
        console.error(`[AI] ERROR: Groq client not initialized. Check GROQ_API_KEY environment variable.`);
        return [];
    }
    const prompt = `You are a forensic "Detective Agent" for the ExpectedEstate platform. 
    Your mission is to find hidden financial assets by scanning the document text for "clues".
    
    CRITICAL INSTRUCTIONS:
    1. ALWAYS look for institution names in headers, footers, and letterheads
    2. Common brokerage firms: Robinhood, Fidelity, Vanguard, Charles Schwab, ETrade, TD Ameritrade, Webull, Public, M1 Finance
    3. Common banks: Wells Fargo, Bank of America, Chase, Citibank, US Bank, Capital One
    4. Crypto platforms: Coinbase, Binance, Kraken, Gemini, Crypto.com
    
    DOCUMENT TYPES TO DETECT:
    - Brokerage Statements: Look for "Account Summary", "Holdings", "Portfolio Value", "Positions"
    - 1099-B: Brokerage proceeds - institution name is in "PAYER" field
    - 1099-INT: Interest income - proves bank account exists
    - 1099-DIV: Dividend income - proves investment account exists
    - 1099-R: Retirement distribution - proves 401k/IRA exists
    - W-2: Check Box 13 for "Retirement Plan" checkbox
    - Bank Statements: Look for account numbers, balances, transactions
    
    SPECIFIC PATTERNS:
    - "Robinhood" anywhere in document = Robinhood Brokerage Account
    - "Account ending in XXXX" = Active account
    - "Total Portfolio Value" = Investment account
    - "Available Balance" = Bank account
    - "Cryptocurrency" or "BTC" or "ETH" = Crypto holdings
    
    Return JSON with this EXACT structure:
    {
      "clues": [
        {
          "potentialAsset": "Brokerage Account" or "Bank Account" or "401k" or "IRA" or "Crypto Wallet",
          "institution": "Exact institution name found in document",
          "sourceClue": "Exact text snippet that proves this asset exists",
          "confidence": 0.95
        }
      ]
    }
    
    IMPORTANT: 
    - If you see ANY institution name, return it with at least 0.6 confidence
    - Be generous with confidence scores for clear institution names
    - Return empty array ONLY if absolutely no financial institutions are mentioned`;
    try {
        const contentMessage = [];
        if (text) {
            console.log(`[AI] Adding text content to message (${text.length} chars)`);
            console.log(`[AI] Text preview:`, text.substring(0, 300));
            contentMessage.push({ type: "text", text: `Detect clues in this text:\n\n${text.substring(0, 10000)}` });
        }
        if (imageBase64) {
            console.log(`[AI] Adding image content to message (${imageBase64.length} chars base64)`);
            contentMessage.push({
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
            });
        }
        const model = imageBase64 ? "meta-llama/llama-4-maverick-17b-128e-instruct" : "llama-3.3-70b-versatile";
        console.log(`[AI] Using model: ${model}`);
        console.log(`[AI] Calling Groq API...`);
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: prompt },
                { role: "user", content: imageBase64 ? contentMessage : (text || "") }
            ],
            model,
            response_format: { type: "json_object" },
            temperature: 0,
        });
        console.log(`[AI] Groq API call successful`);
        const content = completion.choices[0]?.message?.content;
        console.log(`[AI] Response content length:`, content?.length || 0);
        console.log(`[AI] Response content:`, content);
        if (!content) {
            console.log(`[AI] WARNING: No content returned from AI`);
            return [];
        }
        const parsed = JSON.parse(content);
        console.log(`[AI] Parsed JSON:`, JSON.stringify(parsed, null, 2));
        // Extremely robust parsing for various list formats
        let clues = [];
        if (Array.isArray(parsed)) {
            console.log(`[AI] Response is array, using directly`);
            clues = parsed;
        }
        else if (Array.isArray(parsed.clues)) {
            console.log(`[AI] Found clues array in response.clues`);
            clues = parsed.clues;
        }
        else if (Array.isArray(parsed.assets)) {
            console.log(`[AI] Found clues array in response.assets`);
            clues = parsed.assets;
        }
        else if (Array.isArray(parsed.findings)) {
            console.log(`[AI] Found clues array in response.findings`);
            clues = parsed.findings;
        }
        else if (typeof parsed === 'object' && parsed !== null) {
            // Check for single object response
            if (parsed.institution && parsed.potentialAsset) {
                console.log(`[AI] Response is single object, wrapping in array`);
                clues = [parsed];
            }
            else {
                console.log(`[AI] Searching for array in object values`);
                clues = Object.values(parsed).find(v => Array.isArray(v)) || [];
            }
        }
        console.log(`[AI] Extracted ${clues.length} clues from response`);
        if (clues.length === 0) {
            console.log(`[AI] WARNING: No clues extracted. This could mean:`);
            console.log(`[AI]   1. The AI didn't find any financial institutions in the text`);
            console.log(`[AI]   2. The response format was unexpected`);
            console.log(`[AI]   3. The text doesn't contain recognizable financial content`);
        }
        return clues;
    }
    catch (error) {
        console.error("[AI] ========== GROQ API ERROR ==========");
        console.error("[AI] Error:", error);
        console.error("[AI] Error message:", error.message);
        console.error("[AI] Error stack:", error.stack);
        if (error.response?.data) {
            console.error("[AI] Groq Error Response:", JSON.stringify(error.response.data, null, 2));
        }
        console.error("[AI] =====================================");
        return [];
    }
}
export async function extractContactInfo(text) {
    const prompt = `
    Extract contact information for an institution's "Death Notification", "Estate Services", or "Trust Settlement" department.
    Return JSON only with these keys (use null if not found):
    - institutionPhone: The direct line for estate/death notifications.
    - institutionEmail: The email for submitting documents.
    - institutionFax: Look for fax numbers specifically for "Estate Documents" or "Letters".
    - mailingAddress: The physical address where executors should mail original court certified documents.

    Text:
    ${text.substring(0, 4000)}
    `;
    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" },
            temperature: 0,
        });
        const content = completion.choices[0]?.message?.content;
        return content ? JSON.parse(content) : null;
    }
    catch (error) {
        console.error("AI Extraction Error:", error);
        return null;
    }
}
export async function generateCommunicationDraft(params) {
    const prompt = `
    You are an expert assistant for estate settlement.
    A user needs to log a communication with a financial institution.
    
    Context:
    - Institution: ${params.institutionName}
    - Asset Type: ${params.assetType}
    - Current Step: ${params.workflowStepTitle}
    - Step Description: ${params.workflowStepDescription}
    ${params.deceasedName ? `- Deceased Name: ${params.deceasedName}` : ''}

    Task:
    Generate a professional "Subject" and "Notes" for a communication log.
    The notes should be concise but comprehensive, as if the user just finished a call or sent an email.
    
    Return JSON only with these keys:
    - subject
    - notes
    `;
    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" },
            temperature: 0.7
        });
        const content = completion.choices[0]?.message?.content;
        return content ? JSON.parse(content) : null;
    }
    catch (error) {
        console.error("AI Generation Error:", error);
        return null;
    }
}
/**
 * Generic text generation helper.
 */
export async function generateText(prompt, profile = "medium") {
    try {
        const model = profile === "fast" ? "llama-3.1-8b-instant" :
            profile === "heavy" ? "llama-3.3-70b-versatile" :
                "llama-3.1-8b-instant";
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model,
            temperature: 0,
        });
        return completion.choices[0]?.message?.content || "";
    }
    catch (error) {
        console.error("AI Text Generation Error:", error);
        return "";
    }
}
export const ai = {
    analyzeDocument,
    discoverRelatedAssets,
    extractContactInfo,
    generateCommunicationDraft,
    generateText
};
