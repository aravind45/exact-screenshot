/**
 * Cross-State Statute Leak Policy Validator
 *
 * Detects when a state's roadmap contains statute citations from other states.
 * For example, Ohio roadmap containing "N.J.S.A." references would be a leak.
 *
 * This is a CRITICAL violation as it could mislead users about applicable law.
 */
/**
 * State statute patterns - maps state codes to their citation formats
 */
const STATE_STATUTE_PATTERNS = {
    // California
    'CA': [/\bCal\.?\s*Prob\.?\s*Code\b/i, /\bCal\.?\s*Code\s*Civ\.?\s*Proc\.?/i, /\bCal\.?\s*Gov\.?\s*Code\b/i],
    // New York
    'NY': [/\bEPTL\s+\S+/i, /\bSCPA\s+\S+/i, /\bS\.?\s*C\.?\s*P\.?\s*A\.?/i],
    // Texas
    'TX': [/\bTex\.?\s*Est\.?\s*Code\b/i, /\bTex\.?\s*Prob\.?\s*Code\b/i],
    // Florida
    'FL': [/\bFla\.?\s*Stat\.?\s*\S+/i, /\bFlorida\s+Statutes\b/i],
    // Ohio
    'OH': [/\bOhio\s+Rev\.?\s*Code\b/i, /\bORC\s+\S+/i],
    // New Jersey
    'NJ': [/\bN\.?\s*J\.?\s*S\.?\s*A\.?/i, /\bNJSA\s+\S+/i],
    // Illinois
    'IL': [/\b755\s+ILCS\b/i, /\bIll\.?\s*Comp\.?\s*Stat\.?/i],
    // Pennsylvania
    'PA': [/\b20\s+Pa\.?\s*C\.?\s*S\.?/i, /\bPa\.?\s*C\.?\s*S\.?/i],
    // Massachusetts
    'MA': [/\bMass\.?\s*Gen\.?\s*Laws?/i, /\bM\.?\s*G\.?\s*L\.?/i],
    // Washington
    'WA': [/\bRCW\s+\S+/i, /\bRev\.?\s*Code\s+Wash\.?/i],
    // Arizona
    'AZ': [/\bA\.?\s*R\.?\s*S\.?\s*\S+/i, /\bArizona\s+Rev\.?\s*Stat\.?/i],
    // Colorado
    'CO': [/\bC\.?\s*R\.?\s*S\.?\s*\S+/i, /\bColorado\s+Rev\.?\s*Stat\.?/i],
    // Georgia
    'GA': [/\bO\.?\s*C\.?\s*G\.?\s*A\.?/i, /\bOfficial\s+Code\s+Ga\.?/i],
    // North Carolina
    'NC': [/\bN\.?\s*C\.?\s*Gen\.?\s*Stat\.?/i, /\bNorth\s+Carolina\s+Gen\.?\s*Stat\.?/i],
    // Michigan
    'MI': [/\bMCL\s+\S+/i, /\bMich\.?\s*Comp\.?\s*Laws?/i],
    // Virginia
    'VA': [/\bVa\.?\s*Code\s+Ann\.?/i, /\bVirginia\s+Code\b/i],
    // Tennessee
    'TN': [/\bTenn\.?\s*Code\s+Ann\.?/i, /\bTennessee\s+Code\b/i],
    // Indiana
    'IN': [/\bI\.?\s*C\.?\s*\S+/i, /\bInd\.?\s*Code\b/i],
    // Missouri
    'MO': [/\bV\.?\s*A\.\s*M\.\s*S\.?/i, /\bVernon's\s+Ann\.?/i, /\bMo\.?\s*Rev\.?\s*Stat\.?/i],
    // Maryland
    'MD': [/\bMd\.?\s*Code\b/i, /\bEst\.?\s*&\s*Trusts\b/i],
    // Wisconsin
    'WI': [/\bWis\.?\s*Stat\.?/i, /\bWisconsin\s+Statutes\b/i],
    // Minnesota
    'MN': [/\bMinn\.?\s*Stat\.?/i, /\bMinnesota\s+Statutes\b/i],
    // South Carolina
    'SC': [/\bS\.?\s*C\.?\s*Code\b/i, /\bSouth\s+Carolina\s+Code\b/i],
    // Louisiana
    'LA': [/\bLa\.?\s*C\.?\s*C\.?\s*P\.?/i, /\bLouisiana\s+Civil\s+Code\b/i],
    // Alabama
    'AL': [/\bAla\.?\s*Code\b/i, /\bCode\s+of\s+Ala\.?/i],
    // Kentucky
    'KY': [/\bKRS\s+\S+/i, /\bKy\.?\s*Rev\.?\s*Stat\.?/i],
    // Oregon
    'OR': [/\bORS\s+\S+/i, /\bOregon\s+Rev\.?\s*Stat\.?/i],
    // Oklahoma
    'OK': [/\bOkla\.?\s*Stat\.?/i, /\bOklahoma\s+Statutes\b/i],
    // Connecticut
    'CT': [/\bConn\.?\s*Gen\.?\s*Stat\.?/i, /\bCGS\s+\S+/i],
    // Iowa
    'IA': [/\bIowa\s+Code\b/i],
    // Mississippi
    'MS': [/\bMiss\.?\s*Code\s+Ann\.?/i],
    // Arkansas
    'AR': [/\bArk\.?\s*Code\s+Ann\.?/i, /\bACA\s+\S+/i],
    // Kansas
    'KS': [/\bK\.?\s*S\.?\s*A\.?/i, /\bKansas\s+Stat\.?\s*Ann\.?/i],
    // Utah
    'UT': [/\bUtah\s+Code\s+Ann\.?/i],
    // Nevada
    'NV': [/\bNRS\s+\S+/i, /\bNev\.?\s*Rev\.?\s*Stat\.?/i],
    // New Mexico
    'NM': [/\bN\.?\s*M\.?\s*Stat\.?/i, /\bNMSA\s+\S+/i],
    // Nebraska
    'NE': [/\bNeb\.?\s*Rev\.?\s*Stat\.?/i, /\bNRS\s+\S+/i],
    // West Virginia
    'WV': [/\bW\.?\s*Va\.?\s*Code\b/i, /\bWest\s+Virginia\s+Code\b/i],
    // Idaho
    'ID': [/\bIdaho\s+Code\b/i],
    // Hawaii
    'HI': [/\bHaw\.?\s*Rev\.?\s*Stat\.?/i, /\bHRS\s+\S+/i],
    // New Hampshire
    'NH': [/\bN\.?\s*H\.?\s*Rev\.?\s*Stat\.?\s*Ann\.?/i, /\bRSA\s+\S+/i],
    // Maine
    'ME': [/\bMe\.?\s*Rev\.?\s*Stat\.?/i, /\bMaine\s+Rev\.?\s*Stat\.?/i],
    // Rhode Island
    'RI': [/\bR\.?\s*I\.?\s*Gen\.?\s*Laws?/i],
    // Montana
    'MT': [/\bMont\.?\s*Code\s+Ann\.?/i, /\bMCA\s+\S+/i],
    // Delaware
    'DE': [/\bDel\.?\s*Code\s+Ann\.?/i, /\bDelaware\s+Code\b/i],
    // South Dakota
    'SD': [/\bS\.?\s*D\.?\s*Codified\s+Laws?/i, /\bSDCL\s+\S+/i],
    // North Dakota
    'ND': [/\bN\.?\s*D\.?\s*Cent\.?\s*Code\b/i, /\bNDCC\s+\S+/i],
    // Alaska
    'AK': [/\bAlaska\s+Stat\.?/i],
    // Vermont
    'VT': [/\bVt\.?\s*Stat\.?\s*Ann\.?/i],
    // Wyoming
    'WY': [/\bWyo\.?\s*Stat\.?\s*Ann\.?/i],
    // District of Columbia
    'DC': [/\bD\.?\s*C\.?\s*Code\b/i, /\bDistrict\s+of\s+Columbia\s+Code\b/i],
};
/**
 * Gets statute patterns that belong to OTHER states
 */
function getOtherStatePatterns(stateCode) {
    return Object.entries(STATE_STATUTE_PATTERNS)
        .filter(([code]) => code !== stateCode)
        .map(([code, patterns]) => ({ state: code, patterns }));
}
/**
 * Scans text for out-of-state statute citations
 */
function scanForLeaks(text, stateCode) {
    const leaks = [];
    const otherStates = getOtherStatePatterns(stateCode);
    for (const { state, patterns } of otherStates) {
        for (const pattern of patterns) {
            const matches = text.match(pattern);
            if (matches) {
                leaks.push({
                    foundState: state,
                    pattern: pattern.source,
                    match: matches[0],
                });
            }
        }
    }
    return leaks;
}
/**
 * Validates that no out-of-state statute citations exist in task content
 */
export function validateCrossStateStatuteLeak(stateCode, _estateProfile, tasks) {
    const startTime = Date.now();
    const violations = [];
    for (const task of tasks) {
        // Check task title
        if (task.title) {
            const titleLeaks = scanForLeaks(task.title, stateCode);
            for (const leak of titleLeaks) {
                violations.push({
                    code: 'CROSS_STATE_STATUTE_LEAK_TITLE',
                    message: `Task "${task.title}" contains ${leak.foundState} statute citation "${leak.match}" in title`,
                    severity: 'CRITICAL',
                    taskId: task.id,
                    context: {
                        field: 'title',
                        foundState: leak.foundState,
                        citation: leak.match,
                    },
                    suggestion: `Remove ${leak.foundState} citation or replace with ${stateCode} equivalent`,
                });
            }
        }
        // Check task description
        if (task.description) {
            const descLeaks = scanForLeaks(task.description, stateCode);
            for (const leak of descLeaks) {
                violations.push({
                    code: 'CROSS_STATE_STATUTE_LEAK_DESCRIPTION',
                    message: `Task "${task.title}" contains ${leak.foundState} statute citation "${leak.match}" in description`,
                    severity: 'CRITICAL',
                    taskId: task.id,
                    context: {
                        field: 'description',
                        foundState: leak.foundState,
                        citation: leak.match,
                    },
                    suggestion: `Remove ${leak.foundState} citation or replace with ${stateCode} equivalent`,
                });
            }
        }
        // Check state overrides for this state (they should not contain other state citations either)
        const stateOverride = task.stateOverrides?.[stateCode];
        if (stateOverride) {
            const overrideText = JSON.stringify(stateOverride);
            const overrideLeaks = scanForLeaks(overrideText, stateCode);
            for (const leak of overrideLeaks) {
                violations.push({
                    code: 'CROSS_STATE_STATUTE_LEAK_OVERRIDE',
                    message: `Task "${task.title}" ${stateCode} override contains ${leak.foundState} statute citation "${leak.match}"`,
                    severity: 'CRITICAL',
                    taskId: task.id,
                    context: {
                        field: 'stateOverrides',
                        foundState: leak.foundState,
                        citation: leak.match,
                    },
                    suggestion: `Remove ${leak.foundState} citation from ${stateCode} override`,
                });
            }
        }
    }
    const criticalCount = violations.filter(v => v.severity === 'CRITICAL').length;
    const warningCount = violations.filter(v => v.severity === 'WARNING').length;
    const infoCount = violations.filter(v => v.severity === 'INFO').length;
    return {
        passed: violations.length === 0,
        policyName: 'crossStateStatuteLeak',
        violations,
        severityCounts: {
            CRITICAL: criticalCount,
            WARNING: warningCount,
            INFO: infoCount,
        },
        executionTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
    };
}
