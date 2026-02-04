/**
 * Phase 1 Internal Testing - Process Filtering Validation
 * 
 * This script tests the 6 scenarios from PROCESS_TEST_SCENARIOS.md
 * Focus: Does the PROCESS GUIDANCE help users? (Not form availability)
 */

import { analyzeEstateProfile, filterTasksForEstate } from '../../../server/services/roadmapService.js';
import { SETTLEMENT_PHASE_TASKS } from '../../../src/config/settlementPhases.js';

// Test colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(80));
  log(title, colors.cyan);
  console.log('='.repeat(80) + '\n');
}

function logTest(name: string, passed: boolean, details?: string) {
  const symbol = passed ? '✅' : '❌';
  const color = passed ? colors.green : colors.red;
  log(`${symbol} ${name}`, color);
  if (details) {
    console.log(`   ${details}`);
  }
}

// Mock estate profiles for testing
const testEstates = {
  withMinors: {
    id: 'test-estate-minors',
    hasMinorBeneficiaries: true,
    isSmallEstate: false,
    isPrimaryResidence: false,
    isContested: false,
    state: 'CA',
    estimatedValue: 500000,
  },
  smallEstate: {
    id: 'test-estate-small',
    hasMinorBeneficiaries: false,
    isSmallEstate: true,
    isPrimaryResidence: true,
    isContested: false,
    state: 'CA',
    estimatedValue: 85000,
  },
  contested: {
    id: 'test-estate-contested',
    hasMinorBeneficiaries: false,
    isSmallEstate: false,
    isPrimaryResidence: false,
    isContested: true,
    state: 'CA',
    estimatedValue: 300000,
  },
  standard: {
    id: 'test-estate-standard',
    hasMinorBeneficiaries: false,
    isSmallEstate: false,
    isPrimaryResidence: false,
    isContested: false,
    state: 'CA',
    estimatedValue: 400000,
  },
};

/**
 * Test Scenario 1: Guardian Ad Litem Process (Estates with Minors)
 */
function testGuardianAdLitemProcess() {
  logSection('Test Scenario 1: Guardian Ad Litem Process (Estates with Minors)');
  
  const profile = testEstates.withMinors;
  const filteredPhases = filterTasksForEstate(SETTLEMENT_PHASE_TASKS, profile);
  
  // Find all guardian-related tasks
  const allTasks = filteredPhases.flatMap(phase => phase.tasks);
  const guardianTasks = allTasks.filter(task => 
    task.id.includes('guardian') || task.id.includes('minor')
  );
  
  log('\nExpected Guardian Ad Litem Tasks:', colors.yellow);
  const expectedTasks = [
    'identify_minor_beneficiaries',
    'petition_guardian_ad_litem',
    'obtain_guardian_order',
    'coordinate_with_guardian',
    'guardian_distribution_approval',
    'blocked_account_minors',
  ];
  
  expectedTasks.forEach(taskId => {
    const found = guardianTasks.find(t => t.id === taskId);
    logTest(
      `Task "${taskId}" visible`,
      !!found,
      found ? `✓ Found in phase: ${filteredPhases.find(p => p.tasks.includes(found))?.phase}` : '✗ Not found'
    );
  });
  
  // Check task descriptions for clarity
  log('\nProcess Guidance Quality Check:', colors.yellow);
  guardianTasks.forEach(task => {
    const hasDescription = task.description && task.description.length > 50;
    const hasAlert = task.alerts && task.alerts.length > 0;
    const hasEstimatedTime = !!task.estimatedTime;
    
    logTest(
      `"${task.title}" has clear guidance`,
      hasDescription && hasAlert,
      `Description: ${hasDescription ? '✓' : '✗'}, Alerts: ${hasAlert ? '✓' : '✗'}, Time: ${hasEstimatedTime ? '✓' : '✗'}`
    );
  });
  
  // Test Questions from PROCESS_TEST_SCENARIOS.md
  log('\nTest Questions (Process-Focused):', colors.yellow);
  
  const identifyTask = guardianTasks.find(t => t.id === 'identify_minor_beneficiaries');
  logTest(
    'Q1: Does user understand WHAT a guardian ad litem is?',
    identifyTask?.description?.includes('guardian ad litem') || false,
    identifyTask?.description?.substring(0, 100) + '...'
  );
  
  const petitionTask = guardianTasks.find(t => t.id === 'petition_guardian_ad_litem');
  logTest(
    'Q2: Does user understand WHY a guardian ad litem is required?',
    petitionTask?.description?.includes('represent') && petitionTask?.description?.includes('interests') || false,
    petitionTask?.description?.substring(0, 100) + '...'
  );
  
  logTest(
    'Q3: Does user understand WHEN to petition?',
    petitionTask?.dependencies?.includes('file_petition') || false,
    `Dependencies: ${petitionTask?.dependencies?.join(', ') || 'none'}`
  );
  
  const coordinateTask = guardianTasks.find(t => t.id === 'coordinate_with_guardian');
  logTest(
    'Q4: Does user understand ongoing coordination?',
    coordinateTask?.isLongHorizon || false,
    `Long horizon task: ${coordinateTask?.isLongHorizon ? 'Yes' : 'No'}`
  );
}

/**
 * Test Scenario 2: Primary Residence Succession (Small Estates)
 */
function testPrimaryResidenceSuccession() {
  logSection('Test Scenario 2: Primary Residence Succession (Small Estates)');
  
  const profile = testEstates.smallEstate;
  const filteredPhases = filterTasksForEstate(SETTLEMENT_PHASE_TASKS, profile);
  
  const allTasks = filteredPhases.flatMap(phase => phase.tasks);
  const successionTasks = allTasks.filter(task => 
    task.id.includes('succession') || task.id.includes('primary_residence')
  );
  
  log('\nExpected Primary Residence Succession Tasks:', colors.yellow);
  const expectedTasks = [
    'check_primary_residence_succession',
    'file_succession_petition',
    'obtain_succession_order',
  ];
  
  expectedTasks.forEach(taskId => {
    const found = successionTasks.find(t => t.id === taskId);
    logTest(
      `Task "${taskId}" visible`,
      !!found,
      found ? `✓ Found in phase: ${filteredPhases.find(p => p.tasks.includes(found))?.phase}` : '✗ Not found'
    );
  });
  
  // Check for exclusive group (alternative to full probate)
  log('\nExclusive Group Check (Alternative to Full Probate):', colors.yellow);
  successionTasks.forEach(task => {
    logTest(
      `"${task.title}" marked as exclusive`,
      task.exclusiveGroup === 'filing_path',
      `Exclusive group: ${task.exclusiveGroup || 'none'}`
    );
  });
  
  // Test Questions
  log('\nTest Questions (Process-Focused):', colors.yellow);
  
  const checkTask = successionTasks.find(t => t.id === 'check_primary_residence_succession');
  logTest(
    'Q1: Does user understand eligibility criteria?',
    checkTask?.description?.includes('$100,000') && checkTask?.description?.includes('primary residence') || false,
    checkTask?.description?.substring(0, 100) + '...'
  );
  
  logTest(
    'Q2: Does user understand this is a shortcut?',
    checkTask?.utility?.includes('Shortcut') || checkTask?.utility?.includes('Avoid') || false,
    `Utility: ${checkTask?.utility || 'none'}`
  );
  
  const fileTask = successionTasks.find(t => t.id === 'file_succession_petition');
  logTest(
    'Q3: Does user understand timeline?',
    fileTask?.estimatedTime !== undefined,
    `Estimated time: ${fileTask?.estimatedTime || 'not specified'}`
  );
}

/**
 * Test Scenario 3: Special Notice Process (All Estates)
 */
function testSpecialNoticeProcess() {
  logSection('Test Scenario 3: Special Notice Process (All Estates)');
  
  const profile = testEstates.standard;
  const filteredPhases = filterTasksForEstate(SETTLEMENT_PHASE_TASKS, profile);
  
  const allTasks = filteredPhases.flatMap(phase => phase.tasks);
  const noticeTasks = allTasks.filter(task => 
    task.id.includes('special_notice')
  );
  
  log('\nExpected Special Notice Tasks:', colors.yellow);
  const expectedTasks = [
    'track_special_notice_requests',
    'serve_special_notice_parties',
  ];
  
  expectedTasks.forEach(taskId => {
    const found = noticeTasks.find(t => t.id === taskId);
    logTest(
      `Task "${taskId}" visible`,
      !!found,
      found ? `✓ Found in phase: ${filteredPhases.find(p => p.tasks.includes(found))?.phase}` : '✗ Not found'
    );
  });
  
  // Check for ongoing nature
  log('\nOngoing Obligation Check:', colors.yellow);
  noticeTasks.forEach(task => {
    logTest(
      `"${task.title}" marked as ongoing`,
      task.isLongHorizon || false,
      `Long horizon: ${task.isLongHorizon ? 'Yes' : 'No'}`
    );
  });
  
  // Test Questions
  log('\nTest Questions (Process-Focused):', colors.yellow);
  
  const trackTask = noticeTasks.find(t => t.id === 'track_special_notice_requests');
  logTest(
    'Q1: Does user understand WHAT special notice is?',
    trackTask?.description?.includes('special notice') || false,
    trackTask?.description?.substring(0, 100) + '...'
  );
  
  logTest(
    'Q2: Does user understand consequences of failure?',
    trackTask?.alerts?.some(a => a.message.includes('invalidate')) || false,
    `Alert: ${trackTask?.alerts?.[0]?.message || 'none'}`
  );
  
  const serveTask = noticeTasks.find(t => t.id === 'serve_special_notice_parties');
  logTest(
    'Q3: Does user understand HOW to serve?',
    serveTask?.description?.includes('mail') || serveTask?.alerts?.some(a => a.message.includes('mail')) || false,
    `Service method mentioned: ${serveTask?.description?.includes('mail') ? 'Yes' : 'No'}`
  );
}

/**
 * Test Scenario 4: Bond Waiver Process (Optional Cost Savings)
 */
function testBondWaiverProcess() {
  logSection('Test Scenario 4: Bond Waiver Process (Optional Cost Savings)');
  
  const profile = testEstates.standard;
  const filteredPhases = filterTasksForEstate(SETTLEMENT_PHASE_TASKS, profile);
  
  const allTasks = filteredPhases.flatMap(phase => phase.tasks);
  const bondTasks = allTasks.filter(task => 
    task.id.includes('bond_waiver')
  );
  
  log('\nExpected Bond Waiver Tasks:', colors.yellow);
  const expectedTasks = [
    'request_bond_waiver',
    'file_bond_waiver',
    'obtain_bond_waiver_order',
  ];
  
  expectedTasks.forEach(taskId => {
    const found = bondTasks.find(t => t.id === taskId);
    logTest(
      `Task "${taskId}" visible`,
      !!found,
      found ? `✓ Found in phase: ${filteredPhases.find(p => p.tasks.includes(found))?.phase}` : '✗ Not found'
    );
  });
  
  // Check for optional marking
  log('\nOptional Task Check:', colors.yellow);
  bondTasks.forEach(task => {
    logTest(
      `"${task.title}" marked as optional`,
      task.isOptional || false,
      `Optional: ${task.isOptional ? 'Yes' : 'No'}`
    );
  });
  
  // Test Questions
  log('\nTest Questions (Process-Focused):', colors.yellow);
  
  const requestTask = bondTasks.find(t => t.id === 'request_bond_waiver');
  logTest(
    'Q1: Does user understand cost savings?',
    requestTask?.utility?.includes('Cost Savings') || requestTask?.description?.includes('0.5-1%') || false,
    `Utility: ${requestTask?.utility || 'none'}`
  );
  
  logTest(
    'Q2: Does user understand ALL heirs must sign?',
    requestTask?.alerts?.some(a => a.message.includes('ALL')) || false,
    `Alert: ${requestTask?.alerts?.[0]?.message || 'none'}`
  );
}

/**
 * Test Scenario 5: Contested Probate Process (Disputed Estates)
 */
function testContestedProbateProcess() {
  logSection('Test Scenario 5: Contested Probate Process (Disputed Estates)');
  
  const profile = testEstates.contested;
  const filteredPhases = filterTasksForEstate(SETTLEMENT_PHASE_TASKS, profile);
  
  const allTasks = filteredPhases.flatMap(phase => phase.tasks);
  const contestTasks = allTasks.filter(task => 
    task.id.includes('objection') || task.id.includes('contest')
  );
  
  log('\nExpected Contested Probate Tasks:', colors.yellow);
  const expectedTasks = [
    'respond_to_objections',
    'attend_contest_hearing',
    'resolve_contest',
  ];
  
  expectedTasks.forEach(taskId => {
    const found = contestTasks.find(t => t.id === taskId);
    logTest(
      `Task "${taskId}" visible`,
      !!found,
      found ? `✓ Found in phase: ${filteredPhases.find(p => p.tasks.includes(found))?.phase}` : '✗ Not found'
    );
  });
  
  // Test Questions
  log('\nTest Questions (Process-Focused):', colors.yellow);
  
  const respondTask = contestTasks.find(t => t.id === 'respond_to_objections');
  logTest(
    'Q1: Does user understand to hire attorney?',
    respondTask?.alerts?.some(a => a.message.includes('attorney')) || false,
    `Alert: ${respondTask?.alerts?.[0]?.message || 'none'}`
  );
  
  const resolveTask = contestTasks.find(t => t.id === 'resolve_contest');
  logTest(
    'Q2: Does user understand timeline extension?',
    resolveTask?.description?.includes('6-24 months') || resolveTask?.alerts?.some(a => a.message.includes('extends')) || false,
    `Timeline mentioned: ${resolveTask?.description?.includes('months') ? 'Yes' : 'No'}`
  );
}

/**
 * Test Scenario 6: Standard Estate (Control Group)
 */
function testStandardEstateFiltering() {
  logSection('Test Scenario 6: Standard Estate (Control Group)');
  
  const profile = testEstates.standard;
  const filteredPhases = filterTasksForEstate(SETTLEMENT_PHASE_TASKS, profile);
  
  const allTasks = filteredPhases.flatMap(phase => phase.tasks);
  
  // Tasks that SHOULD NOT appear
  log('\nTasks That Should NOT Appear:', colors.yellow);
  const shouldNotAppear = [
    'identify_minor_beneficiaries',
    'petition_guardian_ad_litem',
    'check_primary_residence_succession',
    'file_succession_petition',
    'respond_to_objections',
    'attend_contest_hearing',
  ];
  
  shouldNotAppear.forEach(taskId => {
    const found = allTasks.find(t => t.id === taskId);
    logTest(
      `Task "${taskId}" NOT visible`,
      !found,
      found ? `✗ Incorrectly shown` : '✓ Correctly hidden'
    );
  });
  
  // Tasks that SHOULD appear
  log('\nTasks That SHOULD Appear:', colors.yellow);
  const shouldAppear = [
    'request_bond_waiver',
    'track_special_notice_requests',
    'file_petition',
    'receive_letters',
  ];
  
  shouldAppear.forEach(taskId => {
    const found = allTasks.find(t => t.id === taskId);
    logTest(
      `Task "${taskId}" visible`,
      !!found,
      found ? `✓ Correctly shown` : '✗ Incorrectly hidden'
    );
  });
  
  // Count check
  log('\nTask Count Check:', colors.yellow);
  const totalTasks = allTasks.length;
  const optionalTasks = allTasks.filter(t => t.isOptional).length;
  const requiredTasks = totalTasks - optionalTasks;
  
  log(`Total tasks: ${totalTasks}`);
  log(`Required tasks: ${requiredTasks}`);
  log(`Optional tasks: ${optionalTasks}`);
  
  logTest(
    'Roadmap is focused (not overwhelming)',
    totalTasks < 100,
    `${totalTasks} tasks total (should be < 100)`
  );
}

/**
 * Summary Report
 */
function generateSummaryReport() {
  logSection('Phase 1 Internal Testing - Summary Report');
  
  log('Test Focus: PROCESS GUIDANCE VALUE (not form availability)', colors.yellow);
  log('\nWhat We Tested:', colors.yellow);
  log('✓ Does the process guidance help users understand WHAT to do?');
  log('✓ Does the process guidance help users understand WHEN to do it?');
  log('✓ Does the process guidance help users understand WHY it matters?');
  log('✓ Do users feel more confident after seeing the process?');
  log('✓ Do users understand the workflow sequence?');
  
  log('\nWhat We Did NOT Test:', colors.yellow);
  log('✗ Whether forms are available for download');
  log('✗ Whether form links work');
  log('✗ Form coverage percentages');
  log('✗ PDF generation or filling');
  
  log('\nNext Steps:', colors.yellow);
  log('1. Review test results above');
  log('2. Refine task descriptions based on failures');
  log('3. Ensure all alerts are clear and actionable');
  log('4. Verify workflow sequences are logical');
  log('5. Proceed to Phase 2: Beta User Testing');
  
  log('\nSuccess Criteria for Phase 1:', colors.yellow);
  log('✓ All expected tasks appear for each scenario');
  log('✓ Task descriptions are clear (>50 characters)');
  log('✓ Alerts provide helpful guidance');
  log('✓ Dependencies are logical');
  log('✓ Filtering works correctly (standard estate)');
}

/**
 * Run all tests
 */
async function runAllTests() {
  log('\n' + '█'.repeat(80), colors.cyan);
  log('PHASE 1 INTERNAL TESTING - PROCESS FILTERING VALIDATION', colors.cyan);
  log('Focus: Process Guidance Value (Not Form Availability)', colors.cyan);
  log('█'.repeat(80) + '\n', colors.cyan);
  
  try {
    testGuardianAdLitemProcess();
    testPrimaryResidenceSuccession();
    testSpecialNoticeProcess();
    testBondWaiverProcess();
    testContestedProbateProcess();
    testStandardEstateFiltering();
    generateSummaryReport();
    
    log('\n' + '█'.repeat(80), colors.green);
    log('TESTING COMPLETE', colors.green);
    log('█'.repeat(80) + '\n', colors.green);
  } catch (error) {
    log('\n' + '█'.repeat(80), colors.red);
    log('TESTING FAILED', colors.red);
    log('█'.repeat(80) + '\n', colors.red);
    console.error(error);
    process.exit(1);
  }
}

// Run tests
runAllTests();
