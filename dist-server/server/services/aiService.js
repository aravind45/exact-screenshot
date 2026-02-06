import path from 'path';
import pdfParse from 'pdf-parse';
import fs from 'fs/promises';
import Tesseract from 'tesseract.js';
export const AiService = {
    /**
     * Analyzes a document to find potential assets.
     * Uses advanced pattern matching and entity recognition.
     */
    async analyzeDocument(filePath) {
        console.log(`[AI Service] Analyzing document: ${filePath}`);
        try {
            // 1. Extract text based on file type
            const text = await this.extractText(filePath);
            console.log(`[AI Service] Extracted ${text.length} characters`);
            // 2. Advanced pattern matching
            const patterns = await this.detectPatterns(text);
            console.log(`[AI Service] Found ${patterns.length} patterns`);
            // 3. Entity recognition
            const entities = await this.extractEntities(text);
            console.log(`[AI Service] Found ${entities.length} entities`);
            // 4. Correlation analysis
            const correlations = await this.findCorrelations(patterns, entities);
            console.log(`[AI Service] Found ${correlations.length} correlations`);
            // 5. Generate findings with education
            const findings = this.generateFindings(correlations);
            console.log(`[AI Service] Generated ${findings.length} findings`);
            return findings;
        }
        catch (error) {
            console.error('[AI Service] Error analyzing document:', error);
            throw error;
        }
    },
    async extractText(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        if (ext === '.pdf') {
            const dataBuffer = await fs.readFile(filePath);
            const data = await pdfParse(dataBuffer);
            return data.text;
        }
        else if (['.jpg', '.png', '.jpeg'].includes(ext)) {
            const { data: { text } } = await Tesseract.recognize(filePath, 'eng', {
                logger: m => console.log(`[OCR] ${m.status}: ${m.progress}`)
            });
            return text;
        }
        else if (ext === '.txt') {
            return await fs.readFile(filePath, 'utf-8');
        }
        throw new Error(`Unsupported file type: ${ext}`);
    },
    async detectPatterns(text) {
        const patterns = [];
        // Financial institutions with enhanced detection
        const institutions = [
            // Banks
            { regex: /Chase|JP\s*Morgan|JPMorgan/gi, type: 'BANK', name: 'Chase' },
            { regex: /Bank\s+of\s+America|BofA|B\.?O\.?A\.?/gi, type: 'BANK', name: 'Bank of America' },
            { regex: /Wells\s+Fargo/gi, type: 'BANK', name: 'Wells Fargo' },
            { regex: /Citibank|Citi\s+Bank/gi, type: 'BANK', name: 'Citibank' },
            { regex: /US\s+Bank|U\.S\.\s+Bank/gi, type: 'BANK', name: 'US Bank' },
            { regex: /PNC\s+Bank/gi, type: 'BANK', name: 'PNC Bank' },
            { regex: /Capital\s+One/gi, type: 'BANK', name: 'Capital One' },
            // Investment firms
            { regex: /Fidelity(?:\s+Investments)?/gi, type: 'INVESTMENT', name: 'Fidelity' },
            { regex: /Charles\s+Schwab|Schwab/gi, type: 'INVESTMENT', name: 'Charles Schwab' },
            { regex: /Vanguard/gi, type: 'INVESTMENT', name: 'Vanguard' },
            { regex: /E\*?TRADE|E-TRADE/gi, type: 'INVESTMENT', name: 'E*TRADE' },
            { regex: /TD\s+Ameritrade/gi, type: 'INVESTMENT', name: 'TD Ameritrade' },
            { regex: /Merrill\s+(?:Lynch|Edge)/gi, type: 'INVESTMENT', name: 'Merrill Lynch' },
            { regex: /Morgan\s+Stanley/gi, type: 'INVESTMENT', name: 'Morgan Stanley' },
            // Crypto exchanges
            { regex: /Coinbase(?:\s+Pro)?/gi, type: 'CRYPTO', name: 'Coinbase' },
            { regex: /Binance(?:\.US)?/gi, type: 'CRYPTO', name: 'Binance' },
            { regex: /Kraken/gi, type: 'CRYPTO', name: 'Kraken' },
            { regex: /Gemini/gi, type: 'CRYPTO', name: 'Gemini' },
            // Payment platforms
            { regex: /PayPal/gi, type: 'PAYMENT', name: 'PayPal' },
            { regex: /Venmo/gi, type: 'PAYMENT', name: 'Venmo' },
            { regex: /Cash\s+App/gi, type: 'PAYMENT', name: 'Cash App' },
        ];
        institutions.forEach(inst => {
            const matches = Array.from(text.matchAll(inst.regex));
            for (const match of matches) {
                patterns.push({
                    type: 'INSTITUTION',
                    subtype: inst.type,
                    name: inst.name,
                    position: match.index || 0,
                    confidence: 0.9
                });
            }
        });
        // Account numbers - multiple patterns
        const accountPatterns = [
            { regex: /Account\s*(?:Number|#|No\.?)?\s*:?\s*(\d{4,})/gi, type: 'ACCOUNT_NUMBER' },
            { regex: /Acct\.?\s*(?:#|No\.?)?\s*:?\s*(\d{4,})/gi, type: 'ACCOUNT_NUMBER' },
            { regex: /A\/C\s*:?\s*(\d{4,})/gi, type: 'ACCOUNT_NUMBER' },
            { regex: /\*+(\d{4})/g, type: 'MASKED_ACCOUNT' }, // Last 4 digits
            { regex: /ending\s+in\s+(\d{4})/gi, type: 'MASKED_ACCOUNT' },
        ];
        accountPatterns.forEach(pattern => {
            const matches = Array.from(text.matchAll(pattern.regex));
            for (const match of matches) {
                patterns.push({
                    type: pattern.type,
                    value: match[1],
                    position: match.index || 0,
                    confidence: 0.85
                });
            }
        });
        // Dollar amounts - enhanced detection
        const amountRegex = /\$\s*([\d,]+\.?\d*)/g;
        const amounts = Array.from(text.matchAll(amountRegex));
        for (const match of amounts) {
            const value = parseFloat(match[1].replace(/,/g, ''));
            if (value > 100) { // Filter out small amounts
                patterns.push({
                    type: 'AMOUNT',
                    value: value,
                    position: match.index || 0,
                    confidence: 0.95
                });
            }
        }
        return patterns;
    },
    async extractEntities(text) {
        const entities = [];
        // Property addresses
        const addressRegex = /\d+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Street|St\.?|Avenue|Ave\.?|Road|Rd\.?|Drive|Dr\.?|Lane|Ln\.?|Boulevard|Blvd\.?|Way|Court|Ct\.?|Place|Pl\.?)[,\s]+[A-Z][a-z]+[,\s]+[A-Z]{2}\s+\d{5}(?:-\d{4})?/g;
        const addresses = Array.from(text.matchAll(addressRegex));
        for (const match of addresses) {
            entities.push({
                type: 'ADDRESS',
                value: match[0],
                confidence: 0.8
            });
        }
        // Vehicle VINs
        const vinRegex = /\b[A-HJ-NPR-Z0-9]{17}\b/g;
        const vins = Array.from(text.matchAll(vinRegex));
        for (const match of vins) {
            entities.push({
                type: 'VIN',
                value: match[0],
                confidence: 0.9
            });
        }
        // Email addresses
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        const emails = Array.from(text.matchAll(emailRegex));
        for (const match of emails) {
            entities.push({
                type: 'EMAIL',
                value: match[0],
                confidence: 0.95
            });
        }
        // Phone numbers
        const phoneRegex = /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g;
        const phones = Array.from(text.matchAll(phoneRegex));
        for (const match of phones) {
            entities.push({
                type: 'PHONE',
                value: match[0],
                confidence: 0.85
            });
        }
        return entities;
    },
    async findCorrelations(patterns, entities) {
        const correlations = [];
        // Find institution + account number + amount combinations
        const institutions = patterns.filter(p => p.type === 'INSTITUTION');
        const accounts = patterns.filter(p => p.type === 'ACCOUNT_NUMBER' || p.type === 'MASKED_ACCOUNT');
        const amounts = patterns.filter(p => p.type === 'AMOUNT');
        institutions.forEach(inst => {
            // Find nearest account number (within 300 characters)
            const nearbyAccounts = accounts.filter(acc => Math.abs(acc.position - inst.position) < 300).sort((a, b) => Math.abs(a.position - inst.position) - Math.abs(b.position - inst.position));
            // Find nearest amount (within 300 characters)
            const nearbyAmounts = amounts.filter(amt => Math.abs(amt.position - inst.position) < 300).sort((a, b) => Math.abs(a.position - inst.position) - Math.abs(b.position - inst.position));
            // Create correlation if we have institution + (account OR amount)
            if (nearbyAccounts.length > 0 || nearbyAmounts.length > 0) {
                correlations.push({
                    institution: inst,
                    accounts: nearbyAccounts.slice(0, 2), // Top 2 closest
                    amounts: nearbyAmounts.slice(0, 3), // Top 3 closest
                    confidence: Math.min(inst.confidence, Math.max(nearbyAccounts[0]?.confidence || 0.7, nearbyAmounts[0]?.confidence || 0.7))
                });
            }
        });
        // Find addresses (potential real property)
        entities.filter(e => e.type === 'ADDRESS').forEach(addr => {
            correlations.push({
                type: 'REAL_PROPERTY',
                address: addr,
                confidence: addr.confidence
            });
        });
        // Find VINs (vehicles)
        entities.filter(e => e.type === 'VIN').forEach(vin => {
            correlations.push({
                type: 'VEHICLE',
                address: vin, // Reusing address field for VIN
                confidence: vin.confidence
            });
        });
        return correlations;
    },
    generateFindings(correlations) {
        const findings = [];
        correlations.forEach(corr => {
            if (corr.institution) {
                const finding = {
                    confidence: corr.confidence,
                    sourceText: this.buildSourceText(corr),
                    asset: {
                        name: `${corr.institution.name} Account`,
                        institution: corr.institution.name,
                        assetType: this.mapToAssetType(corr.institution.subtype),
                        accountNumber: corr.accounts?.[0]?.value,
                        value: corr.amounts?.[0]?.value
                    },
                    educationalNote: this.getEducationalNote(corr.institution.subtype)
                };
                findings.push(finding);
            }
            else if (corr.type === 'REAL_PROPERTY') {
                findings.push({
                    confidence: corr.confidence,
                    sourceText: `Found property address: ${corr.address.value}`,
                    asset: {
                        name: 'Real Property',
                        institution: 'N/A',
                        assetType: 'PROPERTY',
                        address: corr.address.value
                    },
                    educationalNote: 'Real property must go through probate unless held in trust or with transfer-on-death deed. Verify ownership through county records.'
                });
            }
            else if (corr.type === 'VEHICLE') {
                findings.push({
                    confidence: corr.confidence,
                    sourceText: `Found vehicle VIN: ${corr.address.value}`,
                    asset: {
                        name: 'Vehicle',
                        institution: 'DMV',
                        assetType: 'VEHICLE',
                        accountNumber: corr.address.value
                    },
                    educationalNote: 'Vehicles can often be transferred through DMV without probate if value is under state threshold. Check your state\'s small estate rules.'
                });
            }
        });
        return findings;
    },
    buildSourceText(corr) {
        let text = `Found ${corr.institution.name}`;
        if (corr.accounts && corr.accounts.length > 0) {
            text += ` with account ${corr.accounts[0].type === 'MASKED_ACCOUNT' ? 'ending in' : 'number'} ${corr.accounts[0].value}`;
        }
        if (corr.amounts && corr.amounts.length > 0) {
            text += ` showing balance of $${corr.amounts[0].value.toLocaleString()}`;
        }
        return text;
    },
    mapToAssetType(subtype) {
        const mapping = {
            'BANK': 'CHECKING',
            'INVESTMENT': 'INVESTMENT',
            'CRYPTO': 'OTHER',
            'PAYMENT': 'OTHER'
        };
        return mapping[subtype] || 'OTHER';
    },
    getEducationalNote(type) {
        const notes = {
            'BANK': 'Bank accounts can often be claimed with a small estate affidavit if total estate value is under $166,250 (California). Always check for POD (payable on death) designations.',
            'INVESTMENT': 'Investment accounts may have beneficiary designations that bypass probate. Contact the institution to verify. If no beneficiary, these must go through probate.',
            'CRYPTO': 'Cryptocurrency requires special handling. You\'ll need private keys or exchange login credentials. Document everything for tax purposes. Consider consulting a crypto-savvy attorney.',
            'PAYMENT': 'Digital payment accounts (PayPal, Venmo) often have small balances but can add up. Check terms of service for death procedures. Some platforms freeze accounts immediately.'
        };
        return notes[type] || 'Document this asset carefully and verify ownership through official records. Consider professional appraisal if value is significant.';
    }
};
