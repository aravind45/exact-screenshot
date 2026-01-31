import path from 'path';
export const AiService = {
    /**
     * Analyzes a document to find potential assets.
     * Uses Heuristic Analysis (Regex/Keywords) + Simulated AI for demo.
     */
    async analyzeDocument(filePath) {
        console.log(`Analyzing document: ${filePath}`);
        // Simulating text extraction (in real app, use pdf-parse or tesseract.js)
        const filename = path.basename(filePath).toLowerCase();
        let extractedText = "";
        // Simulate content based on filename for demo purposes
        if (filename.includes("tax")) {
            extractedText = `
                Form 1040 U.S. Individual Income Tax Return 2023
                ...
                Interest Income:
                - Chase Bank NA ... $12.45
                - Fidelity Investments ... $450.00
                ...
                Mortgage Interest:
                - Wells Fargo Home Mortgage ... $12,000
            `;
        }
        else if (filename.includes("bank") || filename.includes("stmt")) {
            extractedText = `
                Bank of America
                Ending Balance: $45,231.22
                Account: 4455-2211
            `;
        }
        else {
            // Fallback generic text
            extractedText = "Contains references to Charles Schwab account #998877 and a Tesla Model 3.";
        }
        // Logic to extract assets
        const findings = [];
        // 1. Keyword Heuristics
        const institutions = [
            { name: "Chase", type: 'CHECKING' },
            { name: "Bank of America", type: 'CHECKING' },
            { name: "Wells Fargo", type: 'OTHER' }, // Could be mortgage
            { name: "Fidelity", type: 'INVESTMENT' },
            { name: "Charles Schwab", type: 'INVESTMENT' },
            { name: "Vanguard", type: 'INVESTMENT' },
            { name: "Coinbase", type: 'OTHER' },
        ];
        institutions.forEach(inst => {
            if (extractedText.includes(inst.name)) {
                findings.push({
                    confidence: 0.85,
                    sourceText: `Found mention of ${inst.name}`,
                    asset: {
                        name: `${inst.name} Account`,
                        institution: inst.name,
                        assetType: inst.type,
                        // Simulate value extraction
                        value: Math.floor(Math.random() * 10000) + 1000
                    }
                });
            }
        });
        // 2. Regex for specific patterns (e.g., "Account #1234")
        const accountRegex = /Account\s*[:#]\s*(\d{4,})/i;
        const match = extractedText.match(accountRegex);
        if (match) {
            // Try to associate with previous finding or create new
            if (findings.length > 0) {
                findings[0].asset.accountNumber = match[1];
            }
        }
        // 3. Simulated "AI" Hallucination/insight (Demo magic)
        if (findings.length === 0) {
            findings.push({
                confidence: 0.60,
                sourceText: "AI inferred potential unlisted asset based on transaction history.",
                asset: {
                    name: "Unknown Cash Account",
                    institution: "Unknown",
                    assetType: "CHECKING",
                }
            });
        }
        return findings;
    }
};
