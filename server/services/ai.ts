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
    const prompt = `You are an expert "Detective" agent for estate settlement. 
    Analyze the document to extract the primary asset.
    Also provide a "reasoningChain" explaining why you identified this asset and "suggestNextSteps" to help the executor.
    
    Fields:
    - institution: Name of firm
    - accountNumber: Last 4 digits
    - value: Number only
    - assetType: checking, 401k, brokerage, life_insurance, etc.
    - category: financial, retirement, insurance, employer, etc.
    - reasoningChain: Explain focus/evidence found.
    - suggestNextSteps: 2-3 specific actions (e.g. "Draft letters testamentary", "Check for beneficiaries").
    
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
    const prompt = `You are a forensic "Detective Agent". 
    Scan the document text for clues of OTHER assets NOT mentioned as the primary subject.
    Look for:
    - Transfers to/from other banks (Vanguard, Fidelity, etc.)
    - Mentions of "Consolidated" accounts or "Summary of other holdings"
    - Multiple account types listed in one statement (e.g. "Your IRA ending in 4455")
    - Dividends from specific stocks/firms.

    Return JSON list of objects:
    [
      {
        "potentialAsset": "401k",
        "institution": "Vanguard",
        "sourceClue": "ACH Transfer of $5,000 to Vanguard on Dec 12",
        "confidence": 0.95
      }
    ]
    
    Return empty list if no clear clues found.
    Only return VERY high confidence clues (0.7+).`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: prompt },
                { role: "user", content: `Detect clues in this text:\n\n${text.substring(0, 10000)}` }
            ],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }
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
    Extract contact information for an institution's "Death Notification" or "Estate Settlement" department from the text below.
    Return JSON only with these keys (use null if not found):
    - institutionPhone
    - institutionEmail
    - institutionFax (Look for "Fax", "Facsimile", or numbers near "to fax")
    - mailingAddress

    Text:
    ${text.substring(0, 4000)}
    `;

    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }
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
