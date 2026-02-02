import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

async function testDiscoveryUpload() {
    console.log('Testing Discovery Document Upload...\n');

    // Test with a sample Robinhood text
    const sampleText = `
ROBINHOOD SECURITIES, LLC
1099-B Proceeds From Broker and Barter Exchange Transactions

Account Number: XXXX-1234
Tax Year: 2024

Total Proceeds: $15,234.56

This form reports the sale of securities in your Robinhood brokerage account.
    `;

    // Create a temporary file
    const tempFile = 'temp-robinhood-test.txt';
    fs.writeFileSync(tempFile, sampleText);

    try {
        // Get auth token (you'll need to replace this with a valid token)
        const token = process.env.TEST_AUTH_TOKEN || 'your-token-here';

        // Create form data
        const formData = new FormData();
        formData.append('file', fs.createReadStream(tempFile));

        // Upload to discovery endpoint
        console.log('Uploading test document to /api/discovery/analyze...');
        const response = await fetch('http://localhost:8080/api/discovery/analyze', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData
        });

        const result = await response.json();
        console.log('\nResponse Status:', response.status);
        console.log('Response Body:', JSON.stringify(result, null, 2));

        if (result.findings && result.findings.length > 0) {
            console.log('\n✅ SUCCESS: Found', result.findings.length, 'assets');
            result.findings.forEach((finding: any, idx: number) => {
                console.log(`\nFinding ${idx + 1}:`);
                console.log('  Institution:', finding.asset.institution);
                console.log('  Asset Type:', finding.asset.assetType);
                console.log('  Confidence:', finding.confidence);
            });
        } else {
            console.log('\n❌ ISSUE: No findings returned');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        // Clean up temp file
        if (fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile);
        }
    }
}

testDiscoveryUpload();
