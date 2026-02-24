import { calculateAuthorityRecommendation } from './src/lib/authorityEngine';
import { generateRoadmap } from './src/config/roadmapGenerator';

// Test Massachusetts-specific roadmap generation
console.log('Testing Massachusetts Probate Roadmap Generation...\n');

// Test 1: MA Informal Probate (uncontested will)
console.log('=== Test 1: MA Informal Probate ===');
const maInformal = calculateAuthorityRecommendation([], 'MA', {
    hasWill: true,
    hasContest: false
});
console.log('Authority Type:', maInformal.type);
console.log('Master Mode:', maInformal.masterMode);
console.log('Procedure Type:', maInformal.procedureType);
console.log('Active Engines:', maInformal.activeEngines);
console.log('Reason:', maInformal.reason);
console.log();

// Test 2: MA Formal Probate (contested will)
console.log('=== Test 2: MA Formal Probate ===');
const maFormal = calculateAuthorityRecommendation([], 'MA', {
    hasWill: true,
    hasContest: true
});
console.log('Authority Type:', maFormal.type);
console.log('Master Mode:', maFormal.masterMode);
console.log('Procedure Type:', maFormal.procedureType);
console.log('Active Engines:', maFormal.activeEngines);
console.log('Reason:', maFormal.reason);
console.log();

// Test 3: MA Voluntary Administration (small estate)
console.log('=== Test 3: MA Voluntary Administration ===');
const maVoluntary = calculateAuthorityRecommendation([], 'MA', {
    hasWill: false,
    estimatedValue: 20000
});
console.log('Authority Type:', maVoluntary.type);
console.log('Master Mode:', maVoluntary.masterMode);
console.log('Procedure Type:', maVoluntary.procedureType);
console.log('Active Engines:', maVoluntary.activeEngines);
console.log('Is Eligible for Small Estate:', maVoluntary.isEligibleForSmallEstate);
console.log();

// Test 4: Generate MA roadmap for Informal Probate
console.log('=== Test 4: MA Informal Probate Roadmap ===');
const maRoadmap = generateRoadmap(maInformal.type, 'MA', [], maInformal.activeEngines, true);
console.log('Number of Phases:', maRoadmap.length);
console.log('Phase Titles:');
maRoadmap.forEach((phase, index) => {
    console.log(`  ${index + 1}. ${phase.title} (${phase.phase})`);
    console.log(`     Subtitle: ${phase.subtitle}`);
    console.log(`     Tasks: ${phase.tasks.length}`);
    
    // Check for MA-specific tasks
    const maTasks = phase.tasks.filter(task => 
        task.title.includes('MA') || 
        task.title.includes('Massachusetts') ||
        task.description?.includes('MA') ||
        task.description?.includes('Massachusetts')
    );
    if (maTasks.length > 0) {
        console.log(`     MA-Specific Tasks: ${maTasks.map(t => t.title).join(', ')}`);
    }
});
console.log();

// Test 5: Check MA state rules
console.log('=== Test 5: MA State Rules ===');
import { getStateRule } from './src/lib/stateRules';
const maRules = getStateRule('MA');
console.log('Threshold:', maRules.threshold);
console.log('Small Estate Term:', maRules.smallEstateTerm);
console.log('Letters Term:', maRules.lettersTerm);
console.log('Is UPC:', maRules.isUPC);
console.log('Probate System:', maRules.probateSystem);
console.log('Claim Window Days:', maRules.claimWindowDays);
console.log('Estate Tax Threshold:', maRules.estateTaxThreshold);
console.log('Bond Default Required:', maRules.bondDefaultRequired);
console.log();

console.log('✅ Massachusetts roadmap generation tests completed!');