/**
 * Simple test to verify the AI discovery service is working
 * Run with: npx tsx test-discovery-simple.ts
 */

import { ai } from './server/services/ai.js';
import 'dotenv/config';

async function testDiscovery() {
    console.log('='.repeat(60));
    console.log('DOCUMENT DISCOVERY AI TEST');
    console.log('='.repeat(60));
    console.log('');
    
    // Check environment
    console.log('Environment Check:');
    console.log('  GROQ_API_KEY present:', !!process.env.GROQ_API_KEY);
    console.log('  GROQ_API_KEY length:', process.env.GROQ_API_KEY?.length || 0);
    console.log('');
    
    // Test document
    const testDocument = `
ROBINHOOD SECURITIES, LLC
1099-B Proceeds From Broker and Barter Exchange Transactions

Account Number: XXXX-1234
Tax Year: 2024

Total Proceeds: $15,234.56

This form reports the sale of securities in your Robinhood brokerage account.
For questions, contact Robinhood at 1-800-ROBINHOOD.
    `.trim();
    
    console.log('Test Document:');
    console.log('-'.repeat(60));
    console.log(testDocument);
    console.log('-'.repeat(60));
    console.log('');
    
    try {
        console.log('Calling AI Discovery Service...');
        console.log('');
        
        const clues = await ai.discoverRelatedAssets(testDocument);
        
        console.log('');
        console.log('='.repeat(60));
        console.log('RESULTS');
        console.log('='.repeat(60));
        console.log('');
        console.log('Number of clues found:', clues.length);
        console.log('');
        
        if (clues.length > 0) {
            console.log('✅ SUCCESS! AI detected the following assets:');
            console.log('');
            
            clues.forEach((clue, idx) => {
                console.log(`Clue ${idx + 1}:`);
                console.log('  Institution:', clue.institution);
                console.log('  Asset Type:', clue.potentialAsset);
                console.log('  Source:', clue.sourceClue);
                console.log('  Confidence:', (clue.confidence * 100).toFixed(0) + '%');
                console.log('');
            });
            
            console.log('✅ Document discovery is working correctly!');
        } else {
            console.log('❌ PROBLEM: No clues found!');
            console.log('');
            console.log('This means the AI is not detecting institutions in the document.');
            console.log('');
            console.log('Possible causes:');
            console.log('  1. Groq API key is invalid or expired');
            console.log('  2. Groq API is down or rate limited');
            console.log('  3. AI model is not responding correctly');
            console.log('');
            console.log('Check the logs above for error messages.');
        }
        
    } catch (error) {
        console.log('');
        console.log('='.repeat(60));
        console.log('ERROR');
        console.log('='.repeat(60));
        console.log('');
        console.error('❌ Test failed with error:');
        console.error(error);
        console.log('');
        
        if (error instanceof Error) {
            console.log('Error message:', error.message);
            console.log('');
            if (error.stack) {
                console.log('Stack trace:');
                console.log(error.stack);
            }
        }
    }
    
    console.log('');
    console.log('='.repeat(60));
    console.log('TEST COMPLETE');
    console.log('='.repeat(60));
}

// Run the test
testDiscovery().catch(console.error);
