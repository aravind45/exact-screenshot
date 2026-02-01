import Groq from "groq-sdk";
import "dotenv/config";

// Lazy init or global init
let groq: Groq;
try {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
} catch (e) {
    console.error("Failed to initialize Groq client:", e);
}

interface ExtractedAsset {
    institution: string;
    accountNumber?: string;
    value?: number;
    assetType: string;
    category?: string;
    reasoningChain?: string; // Why the AI thinks this is an asset
    suggestNextSteps?: string[]; // Proactive suggestions
}

interface DiscoveryClue {
    potentialAsset: string;
    institution: string;
    sourceClue: string; // e.g., "ACH Transfer shown on page 2"
    confidence: number;
}

export async function analyzeDocument(text?: string, imageBase64?: string): Promise<ExtractedAsset | null> {
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
        const contentMessage: any[] = [];
        if (text) contentMessage.push({ type: "text", text: `Analyze this document text:\n\n${text.substring(0, 10000)}` });
        if (imageBase64) contentMessage.push({
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
        });

        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: prompt },
                { role: "user", content: imageBase64 ? contentMessage : (text || "") },
            ],
            // Updated to 90b-vision-preview as 11b-vision-preview is decommissioned
            model: imageBase64 ? "llama-3.2-90b-vision-preview" : "llama-3.3-70b-versatile",
            temperature: 0,
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) return null;

        const parsed = JSON.parse(content);
        // Handle cases where AI might wrap the result in a key
        const result = parsed.result || parsed.asset || parsed.extracted || parsed;

        return {
            institution: result.institution || "Unknown",
            accountNumber: result.accountNumber,
            value: typeof result.value === 'string' ? parseFloat(result.value.replace(/[^0-9.]/g, '')) : (result.value || 0),
            assetType: result.assetType || "Account",
            category: result.category || "financial",
            reasoningChain: result.reasoningChain,
            suggestNextSteps: result.suggestNextSteps
        } as ExtractedAsset;
    } catch (error: any) {
        console.error("AI Analysis Error:", error.message);
        return null;
    }
}

/**
 * The "Detective Agent": Scans documents for clues pointing to OTHER related assets.
 */
export async function discoverRelatedAssets(text?: string, imageBase64?: string): Promise<DiscoveryClue[]> {
    const prompt = `You are a forensic "Detective Agent" for the ExpectedEstate platform. 
    Your mission is to find hidden financial assets by scanning the document text for "clues".
    
    CRITICAL: You are specialized in TAX DOCUMENTS (W-2, 1099-INT, 1099-DIV, 1040) and BANK STATEMENTS.
    - If you see a 1099-B / Brokerage Statement: Look for "Robinhood", "Public", "Coinbase", or "ETrade". This proves an active trading account.
    - If you see a W-2: Look at the "Employer" section. If "Retirement Plan" (Box 13) is checked, there IS a 401k/403b/Pension.
    - If you see a 1099-INT: It proves an account at the specified bank exists.
    - If you see a 1099-DIV: It proves a brokerage account or specific stock holdings exist.
    
    Also look for:
    - Cryptocurrency keywords (BTC, ETH, Coinbase, Binance).
    - Transfers to/from other wealth managers (Vanguard, Fidelity, Charles Schwab, TD Ameritrade).
    - Mentions of "Consolidated" accounts or "Summary of other holdings" (often found on page 1 or 2).
    - Multiple account types listed in one statement (e.g. "Your IRA ending in 4455" mentioned in a checking statement).
    - Dividends and Capital Gains reported on 1099-DIV.
    - Life Insurance premiums paid or proceeds mentioned.

    Return JSON list of objects:
    {
      "clues": [
        {
          "potentialAsset": "Brokerage, 401k, Checking, or Crypto",
          "institution": "Robinhood, Vanguard, Coinbase, Wells Fargo, etc.",
          "sourceClue": "Direct evidence text (e.g. 'ACH Transfer from Fidelity' or 'Payer is Robinhood')",
          "confidence": 0.98
        }
      ]
    }
    
    If no clear clues are found, still attempt to return the PRIMARY institution mentioned in the text as a clue.
    Only return clues with confidence (0.5+).`;

    try {
        const contentMessage: any[] = [];
        if (text) contentMessage.push({ type: "text", text: `Detect clues in this text:\n\n${text.substring(0, 10000)}` });
        if (imageBase64) contentMessage.push({
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
        });

        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: prompt },
                { role: "user", content: imageBase64 ? contentMessage : (text || "") }
            ],
            model: imageBase64 ? "llama-3.2-90b-vision-preview" : "llama-3.3-70b-versatile",
            response_format: { type: "json_object" },
            temperature: 0,
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) return [];

        const parsed = JSON.parse(content);
        return Array.isArray(parsed.clues) ? parsed.clues : (parsed.assets || []);
    } catch (error) {
        console.error("Discovery Agent Error:", error);
        return [];
    }
}

export async function extractContactInfo(text: string) {
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
    } catch (error) {
        console.error("AI Extraction Error:", error);
        return null;
    }
}

export async function generateCommunicationDraft(params: {
    institutionName: string;
    assetType: string;
    workflowStepTitle: string;
    workflowStepDescription: string;
    deceasedName?: string;
}) {
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
    } catch (error) {
        console.error("AI Generation Error:", error);
        return null;
    }
}

/**
 * Generic text generation helper.
 */
export async function generateText(prompt: string, profile: "fast" | "medium" | "heavy" = "medium"): Promise<string> {
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
    } catch (error) {
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
