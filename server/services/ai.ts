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
    
    SPECIAL HANDLING BY DOCUMENT TYPE:
    1. W-2:
       - institution: [Employer Name] from Box c.
       - assetType: If Box 13 "Retirement Plan" is checked, use "401k/Pension (Employer-sponsored)". Otherwise "Employment Record".
       - value: Box 1 "Wages" (Annual).
    2. 1099-B / 1099-DIV / 1099-INT (Brokerage/Bank):
       - institution: [Payer Name] (e.g. Robinhood, Fidelity, Charles Schwab, Chase). LOOK AT THE TOP HEADER OR "PAYER" SECTION.
       - assetType: "Brokerage Account", "Cryptocurrency", or "Savings/Checking" based on the form.
       - value: Total proceeds, dividends, or interest reported.
    3. Form 1098-T (Education):
       - institution: [School Name].
       - assetType: "Education Credit/Expense".

    Standard Fields for JSON:
    - institution: Name of Bank, Brokerage, or Employer.
    - accountNumber: Last 4 digits (if found).
    - value: Numeric dollar amount reported.
    - assetType: checking, brokerage, 401k, crypto, insurance, property, etc.
    - category: financial, retirement, insurance, employer, etc.
    - reasoningChain: 1-2 sentences on what clues were found.
    - suggestNextSteps: 2-3 specific actions for an executor.
    
    Return ONLY valid JSON.`;

    try {
        const contentMessage: any[] = [];
        if (text) contentMessage.push({ type: "text", text: `Analyze this document text: ${text.substring(0, 8000)}` });
        if (imageBase64) contentMessage.push({
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
        });

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: prompt,
                },
                {
                    role: "user",
                    content: imageBase64 ? contentMessage : (text || ""),
                },
            ],
            model: imageBase64 ? "llama-3.2-11b-vision-preview" : "llama-3.3-70b-versatile",
            temperature: 0,
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) return null;

        return JSON.parse(content) as ExtractedAsset;
    } catch (error: any) {
        console.error("AI Analysis Error:", error.message, error);
        return null;
    }
}

/**
 * The "Detective Agent": Scans documents for clues pointing to OTHER related assets.
 */
export async function discoverRelatedAssets(text: string): Promise<DiscoveryClue[]> {
    const prompt = `You are a forensic "Detective Agent" for the ExpectedEstate platform. 
    Your mission is to find hidden financial assets by scanning the document text for "clues".
    
    CRITICAL: You are specialized in TAX DOCUMENTS (W-2, 1099-INT, 1099-DIV, 1040).
    - If you see a 1099-B / Brokerage Statement: Look for "Robinhood", "Public", "Coinbase", or "ETrade". This proves an active trading account.
    - If you see a W-2: Look at the "Employer" section. If "Retirement Plan" (Box 13) is checked, there IS a 401k/403b/Pension.
    - If you see a 1099-INT: It proves an account at the specified bank exists.
    - If you see a 1099-DIV: It proves a brokerage account or specific stock holdings exist.
    
    Also look for:
    - Cryptocurrency keywords (BTC, ETH, Coinbase).
    - Transfers to/from other banks (Vanguard, Fidelity, etc.)
    - Mentions of "Consolidated" accounts or "Summary of other holdings"
    - Multiple account types listed in one statement (e.g. "Your IRA ending in 4455")
    - Dividends and Capital Gains reported.

    Return JSON list of objects:
    {
      "clues": [
        {
          "potentialAsset": "Brokerage, 401k, or Crypto",
          "institution": "Robinhood, Vanguard, or Coinbase",
          "sourceClue": "Direct evidence found (e.g. 1099-B Payer is Robinhood)",
          "confidence": 0.98
        }
      ]
    }
    
    Return empty list if no clear clues found.
    Only return VERY high confidence clues (0.7+).`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: prompt },
                { role: "user", content: `Detect clues in this text:\n\n${text.substring(0, 10000)}` }
            ],
            model: "llama-3.3-70b-versatile",
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
