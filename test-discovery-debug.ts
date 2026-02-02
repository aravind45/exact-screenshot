import { ai } from './server/services/ai.js';
import fs from 'fs';
import pdf from 'pdf-parse';

async function testDiscovery() {
    console.log('=== Testing Document Discovery ===\n');

    // Test with sample Robinhood text
    const sampleText = `
    ROBINHOOD SECURITIES, LLC
    1099-B Proceeds From Broker and Barter Exchange Transactions
    
    Account Number: XXXX1234
    Total Proceeds: $15,234.56
    
    This form reports your investment activity for the tax year 2024.
    `;

    console.log('Sample Text:');
    console.log(sampleText);
    console.log('\n--- Calling AI Discovery ---\n');

    try {
        const clues = await ai.discoverRelatedAssets(sampleText);
        console.log(`Found ${clues.length} clues:`);
        console.log(JSON.stringify(clues, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

testDiscovery();
