import { ai } from './server/services/ai.js';
import 'dotenv/config';

async function testAIDiscovery() {
    console.log('Testing AI Discovery Service...\n');
    console.log('GROQ_API_KEY present:', !!process.env.GROQ_API_KEY);
    console.log('');

    const sampleText = `
ROBINHOOD SECURITIES, LLC
1099-B Proceeds From Broker and Barter Exchange Transactions

Account Number: XXXX-1234
Tax Year: 2024

Total Proceeds: $15,234.56

This form reports the sale of securities in your Robinhood brokerage account.
For questions, contact Robinhood at 1-800-ROBINHOOD.
    `;

    console.log('Sample text to analyze:');
    console.log(sampleText);
    console.log('\n---\n');

    try {
        console.log('Calling ai.discoverRelatedAssets()...');
        const clues = await ai.discoverRelatedAssets(sampleText);
        
        console.log('\nResult:');
        console.log('Number of clues found:', clues.length);
        console.log('');
        
        if (clues.length > 0) {
            console.log('✅ SUCCESS! Found assets:');
            clues.forEach((clue, idx) => {
                console.log(`\nClue ${idx + 1}:`);
                console.log('  Institution:', clue.institution);
                console.log('  Potential Asset:', clue.potentialAsset);
                console.log('  Source Clue:', clue.sourceClue);
                console.log('  Confidence:', clue.confidence);
            });
        } else {
            console.log('❌ PROBLEM: No clues found!');
            console.log('This means the AI is not detecting the Robinhood institution.');
        }
    } catch (error) {
        console.error('❌ ERROR:', error);
    }
}

testAIDiscovery();
