// Simple test to verify GA filtering logic

// Test data
const GA_EXCLUDED_TASK_IDS = new Set([
  "file_spousal_petition",
  "give_spousal_notice",
  "obtain_spousal_order",
  "file_succession_petition",
  "give_succession_notice",
  "obtain_succession_order",
  "wait_claim_period",
]);

const GA_ONLY_TASK_IDS = new Set([
  "ga_years_support_petition",
  "ga_years_support_citation",
  "ga_years_support_order",
  "file_ga_no_admin",
]);

// Simulated tasks
const sampleTasks = [
  { id: "file_spousal_petition", title: "File Spousal Property Petition" },
  { id: "give_spousal_notice", title: "Give Notice of Hearing" },
  { id: "obtain_spousal_order", title: "Obtain Spousal Property Order" },
  { id: "file_succession_petition", title: "File Petition to Determine Succession" },
  { id: "give_succession_notice", title: "Give Notice of Hearing" },
  { id: "obtain_succession_order", title: "Obtain Order Determining Succession" },
  { id: "wait_claim_period", title: "Monitor State-Specific Creditor Exposure Period" },
  { id: "publish_notice", title: "Publish Notice to Creditors" },
  { id: "ga_years_support_petition", title: "File Petition for Year's Support" },
  { id: "file_ga_no_admin", title: "File 'No Administration Necessary' Petition" },
];

// Test for GA state
console.log("\n=== Testing for GA state ===");
const gaFiltered = sampleTasks.filter(task => {
  // GA-only tasks should show
  if (GA_ONLY_TASK_IDS.has(task.id)) return true;

  // GA-excluded tasks should NOT show
  if (GA_EXCLUDED_TASK_IDS.has(task.id)) return false;

  return true;
});

console.log("GA tasks:", gaFiltered.map(t => t.id));
console.log("Expected: ga_years_support_petition, ga_years_support_citation, ga_years_support_order, file_ga_no_admin, publish_notice");
console.log("Match:", gaFiltered.length === 5 ? "✓ PASS" : "✗ FAIL");

// Test for non-GA state (e.g., NY)
console.log("\n=== Testing for NY state ===");
const nyFiltered = sampleTasks.filter(task => {
  // GA-only tasks should NOT show
  if (GA_ONLY_TASK_IDS.has(task.id)) return false;

  // GA-excluded tasks SHOULD show
  if (GA_EXCLUDED_TASK_IDS.has(task.id)) return true;

  return true;
});

console.log("NY tasks:", nyFiltered.map(t => t.id));
console.log("Expected: file_spousal_petition, give_spousal_notice, obtain_spousal_order, file_succession_petition, give_succession_notice, obtain_succession_order, wait_claim_period, publish_notice");
console.log("Match:", nyFiltered.length === 8 ? "✓ PASS" : "✗ FAIL");

console.log("\n=== All tests complete ===");
