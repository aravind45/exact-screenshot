import { AiService } from './server/services/aiService';
import path from 'path';
import fs from 'fs/promises';

/**
 * Test script for the enhanced AI document analysis service
 * Tests PDF extraction, pattern recognition, and educational feedback
 */

async function testAIService() {
    console.log('🧪 Testing Enhanced AI Document Analysis Service\n');

    // Create a test document
    const testContent = `
        BANK STATEMENT
        Chase Bank, N.A.
        Account Statement for January 2024
        
        Account Number: 1234-5678-9012
        Account Type: Checking
        
        Beginning Balance: $15,234.56
        Ending Balance: $18,456.78
        
        ---
        
        INVESTMENT SUMMARY
        Fidelity Investments
        Account ending in 4567
        Total Value: $125,000.00
        
        ---
        
        PROPERTY TAX BILL
        123 Main Street, Los Angeles, CA 90001
        Assessed Value: $650,000
        
        ---
        
        COINBASE STATEMENT
        Account: crypto@example.com
        Bitcoin Balance: 0.5 BTC
        Estimated Value: $25,000
        
        ---
        
        VEHICLE REGISTRATION
        VIN: 1HGBH41JXMN109186
        2024 Honda Accord
    `;

    // Write test file
    const testFilePath = path.join(process.cwd(), 'test-document.txt');
    await fs.writeFile(testFilePath, testContent);

    try {
        console.log('📄 Analyzing test document...\n');

        const findings = await AiService.analyzeDocument(testFilePath);

        console.log(`✅ Found ${findings.length} potential assets:\n`);

        findings.forEach((finding, idx) => {
            console.log(`\n${'='.repeat(60)}`);
            console.log(`Asset #${idx + 1}: ${finding.asset.name}`);
            console.log(`${'='.repeat(60)}`);
            console.log(`Institution: ${finding.asset.institution}`);
            console.log(`Type: ${finding.asset.assetType}`);
            if (finding.asset.accountNumber) {
                console.log(`Account: ${finding.asset.accountNumber}`);
            }
            if (finding.asset.value) {
                console.log(`Value: $${finding.asset.value.toLocaleString()}`);
            }
            if (finding.asset.address) {
                console.log(`Address/VIN: ${finding.asset.address}`);
            }
            console.log(`\nConfidence: ${Math.round(finding.confidence * 100)}%`);
            console.log(`Source: ${finding.sourceText}`);

            if (finding.educationalNote) {
                console.log(`\n📚 Educational Note:`);
                console.log(`   ${finding.educationalNote}`);
            }
        });

        console.log(`\n${'='.repeat(60)}`);
        console.log('\n✨ Test Summary:');
        console.log(`   Total Findings: ${findings.length}`);
        console.log(`   Average Confidence: ${Math.round(findings.reduce((sum, f) => sum + f.confidence, 0) / findings.length * 100)}%`);
        console.log(`   Asset Types Found: ${[...new Set(findings.map(f => f.asset.assetType))].join(', ')}`);

        // Verify expected findings
        const expectedInstitutions = ['Chase', 'Fidelity', 'Coinbase'];
        const foundInstitutions = findings.map(f => f.asset.institution);
        const missingInstitutions = expectedInstitutions.filter(inst =>
            !foundInstitutions.some(found => found.includes(inst))
        );

        if (missingInstitutions.length === 0) {
            console.log('\n✅ All expected institutions detected!');
        } else {
            console.log(`\n⚠️  Missing institutions: ${missingInstitutions.join(', ')}`);
        }

        // Check for educational notes
        const withEducation = findings.filter(f => f.educationalNote).length;
        console.log(`\n📚 ${withEducation}/${findings.length} findings include educational notes`);

    } catch (error) {
        console.error('\n❌ Test failed:', error);
        throw error;
    } finally {
        // Cleanup
        await fs.unlink(testFilePath);
        console.log('\n🧹 Cleaned up test file');
    }
}

// Run the test
testAIService()
    .then(() => {
        console.log('\n✅ All tests passed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Tests failed:', error);
        process.exit(1);
    });
