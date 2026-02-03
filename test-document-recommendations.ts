/**
 * Test Script for Document Recommendations Feature
 * 
 * This script tests the new document recommendation endpoints
 */

const API_URL = "http://localhost:3000/api";

// Test user credentials (from TEST_USERS_REFERENCE.md)
const TEST_USER = {
  email: "pth01-probate@test.com",
  password: "Test123!"
};

async function login() {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(TEST_USER)
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Login failed: ${data.error}`);
  }
  
  console.log("✓ Login successful");
  return data.token;
}

async function getAssets(token: string) {
  const response = await fetch(`${API_URL}/assets`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });
  
  const assets = await response.json();
  console.log(`✓ Found ${assets.length} assets`);
  return assets;
}

async function testDocumentRecommendations(token: string, assetId: string) {
  console.log("\n--- Testing Document Recommendations ---");
  
  const response = await fetch(
    `${API_URL}/communications/asset/${assetId}/document-recommendations?workflowStep=initial_contact`,
    {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    }
  );
  
  const recommendations = await response.json();
  
  if (!response.ok) {
    throw new Error(`Failed to get recommendations: ${recommendations.error}`);
  }
  
  console.log("✓ Document Recommendations Retrieved:");
  console.log(`  - Required Documents: ${recommendations.required.length}`);
  console.log(`  - Suggested Documents: ${recommendations.suggested.length}`);
  console.log(`  - Missing Documents: ${recommendations.missing.length}`);
  console.log(`  - Completeness: ${recommendations.completeness}%`);
  
  if (recommendations.required.length > 0) {
    console.log("\n  Required Documents:");
    recommendations.required.forEach((doc: any) => {
      console.log(`    • ${doc.documentType} (${doc.priority}) - ${doc.reason}`);
    });
  }
  
  if (recommendations.suggested.length > 0) {
    console.log("\n  Suggested Documents:");
    recommendations.suggested.forEach((doc: any) => {
      console.log(`    • ${doc.documentType} (${doc.priority}) - ${doc.reason}`);
    });
  }
  
  if (recommendations.missing.length > 0) {
    console.log("\n  Missing Documents:");
    recommendations.missing.forEach((doc: string) => {
      console.log(`    ⚠ ${doc}`);
    });
  }
  
  return recommendations;
}

async function testAvailableDocuments(token: string) {
  console.log("\n--- Testing Available Documents ---");
  
  const response = await fetch(`${API_URL}/communications/estate/available-documents`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });
  
  const documents = await response.json();
  
  if (!response.ok) {
    throw new Error(`Failed to get available documents: ${documents.error}`);
  }
  
  console.log(`✓ Found ${documents.length} available documents in vault`);
  
  if (documents.length > 0) {
    console.log("\n  Available Documents:");
    documents.forEach((doc: any) => {
      console.log(`    • ${doc.name} (${doc.documentType})`);
    });
  }
  
  return documents;
}

async function testDocumentCompleteness(token: string, assetId: string, documentIds: string[]) {
  console.log("\n--- Testing Document Completeness Validation ---");
  
  const response = await fetch(`${API_URL}/communications/validate-completeness`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      assetId,
      attachedDocumentIds: documentIds
    })
  });
  
  const validation = await response.json();
  
  if (!response.ok) {
    throw new Error(`Failed to validate completeness: ${validation.error}`);
  }
  
  console.log("✓ Completeness Validation:");
  console.log(`  - Complete: ${validation.complete ? "Yes" : "No"}`);
  console.log(`  - Percentage: ${validation.percentage}%`);
  
  if (validation.missing.length > 0) {
    console.log(`  - Missing: ${validation.missing.join(", ")}`);
  }
  
  return validation;
}

async function runTests() {
  try {
    console.log("=== Document Recommendations Feature Test ===\n");
    
    // Step 1: Login
    const token = await login();
    
    // Step 2: Get assets
    const assets = await getAssets(token);
    
    if (assets.length === 0) {
      console.log("\n⚠ No assets found. Please create an asset first.");
      return;
    }
    
    const testAsset = assets[0];
    console.log(`\nUsing asset: ${testAsset.name || testAsset.institution} (${testAsset.id})`);
    
    // Step 3: Test document recommendations
    const recommendations = await testDocumentRecommendations(token, testAsset.id);
    
    // Step 4: Test available documents
    const availableDocs = await testAvailableDocuments(token);
    
    // Step 5: Test completeness validation
    const docIds = availableDocs.slice(0, 2).map((d: any) => d.id);
    if (docIds.length > 0) {
      await testDocumentCompleteness(token, testAsset.id, docIds);
    }
    
    console.log("\n=== All Tests Passed! ===\n");
    
  } catch (error: any) {
    console.error("\n❌ Test Failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runTests();
