/**
 * Database Integrity Invariants Integrity Check
 *
 * Validates database integrity - null authorityScope, duplicates, invalid scopes.
 * This check focuses on data integrity in the roadmap task definitions.
 */
/**
 * Valid authority scopes
 */
const VALID_AUTHORITY_SCOPES = new Set(['PROBATE', 'TRUST', 'BOTH']);
/**
 * Validates database integrity invariants
 */
export function validateDbIntegrityInvariants(stateCode, _estateProfile, tasks) {
    const startTime = Date.now();
    const findings = [];
    // Track task IDs for duplicate detection
    const taskIdMap = new Map();
    // First pass: collect all tasks by ID
    for (const task of tasks) {
        if (!taskIdMap.has(task.id)) {
            taskIdMap.set(task.id, []);
        }
        taskIdMap.get(task.id).push(task);
    }
    // Check for duplicate task IDs
    for (const [taskId, taskList] of taskIdMap.entries()) {
        if (taskList.length > 1) {
            findings.push({
                checkId: 'dbIntegrityInvariants',
                checkName: 'Database Integrity Invariants',
                stateCode,
                severity: 'BLOCKER',
                code: 'DUPLICATE_TASK_ID',
                message: `Duplicate task ID "${taskId}" found ${taskList.length} times`,
                taskId,
                context: {
                    duplicateCount: taskList.length,
                    taskTitles: taskList.map(t => t.title),
                },
                suggestion: 'Resolve duplicate task IDs - each task must have a unique ID',
                remediation: {
                    type: 'code',
                    steps: [
                        `Locate all instances of task ID "${taskId}" in settlementPhases.ts`,
                        `Review the task definitions to determine which is correct`,
                        `Rename or remove duplicate task IDs`,
                        `Ensure all task IDs are unique across the entire roadmap`,
                    ],
                },
            });
        }
    }
    // Check for null or undefined authorityScope
    for (const task of tasks) {
        if (task.authorityScope === undefined || task.authorityScope === null) {
            findings.push({
                checkId: 'dbIntegrityInvariants',
                checkName: 'Database Integrity Invariants',
                stateCode,
                severity: 'BLOCKER',
                code: 'NULL_AUTHORITY_SCOPE',
                message: `Task "${task.title}" (${task.id}) has null or undefined authorityScope`,
                taskId: task.id,
                context: {
                    taskTitle: task.title,
                    authorityScope: task.authorityScope,
                },
                suggestion: 'Add explicit authorityScope field with value "PROBATE", "TRUST", or "BOTH"',
                remediation: {
                    type: 'code',
                    steps: [
                        `Locate task "${task.title}" in settlementPhases.ts`,
                        `Add authorityScope: "PROBATE" | "TRUST" | "BOTH"`,
                        'This field is required for all tasks (fail-closed)',
                    ],
                },
            });
        }
        else if (!VALID_AUTHORITY_SCOPES.has(task.authorityScope)) {
            findings.push({
                checkId: 'dbIntegrityInvariants',
                checkName: 'Database Integrity Invariants',
                stateCode,
                severity: 'BLOCKER',
                code: 'INVALID_AUTHORITY_SCOPE',
                message: `Task "${task.title}" (${task.id}) has invalid authorityScope "${task.authorityScope}"`,
                taskId: task.id,
                context: {
                    taskTitle: task.title,
                    authorityScope: task.authorityScope,
                    validScopes: Array.from(VALID_AUTHORITY_SCOPES),
                },
                suggestion: 'Set authorityScope to "PROBATE", "TRUST", or "BOTH"',
                remediation: {
                    type: 'code',
                    steps: [
                        `Locate task "${task.title}" in settlementPhases.ts`,
                        `Change authorityScope from "${task.authorityScope}" to valid value`,
                        'Valid values: "PROBATE", "TRUST", "BOTH"',
                    ],
                },
            });
        }
    }
    // Check for missing required fields
    for (const task of tasks) {
        if (!task.title || task.title.trim() === '') {
            findings.push({
                checkId: 'dbIntegrityInvariants',
                checkName: 'Database Integrity Invariants',
                stateCode,
                severity: 'CRITICAL',
                code: 'MISSING_TASK_TITLE',
                message: `Task (${task.id}) has missing or empty title`,
                taskId: task.id,
                context: {
                    taskId: task.id,
                    title: task.title,
                },
                suggestion: 'Add a descriptive title for this task',
                remediation: {
                    type: 'code',
                    steps: [
                        `Locate task ID "${task.id}" in settlementPhases.ts`,
                        'Add a descriptive title field',
                    ],
                },
            });
        }
        if (!task.scope || task.scope === 'UNSCOPED') {
            findings.push({
                checkId: 'dbIntegrityInvariants',
                checkName: 'Database Integrity Invariants',
                stateCode,
                severity: 'BLOCKER',
                code: 'MISSING_OR_INVALID_SCOPE',
                message: `Task "${task.title}" (${task.id}) has missing or invalid scope "${task.scope}"`,
                taskId: task.id,
                context: {
                    taskTitle: task.title,
                    scope: task.scope,
                },
                suggestion: 'Set scope to "CORE" for all-state tasks or "US-{stateCode}" for state-specific tasks',
                remediation: {
                    type: 'code',
                    steps: [
                        `Locate task "${task.title}" in settlementPhases.ts`,
                        'Set scope: "CORE" if task applies to all states',
                        'Set scope: "US-{stateCode}" if task is state-specific',
                        'Use allowedStates array for multi-state tasks',
                    ],
                },
            });
        }
    }
    // Check for malformed state overrides
    for (const task of tasks) {
        if (task.stateOverrides) {
            for (const [overrideStateCode, override] of Object.entries(task.stateOverrides)) {
                // Skip if override is empty object
                if (Object.keys(override).length === 0) {
                    findings.push({
                        checkId: 'dbIntegrityInvariants',
                        checkName: 'Database Integrity Invariants',
                        stateCode,
                        severity: 'WARNING',
                        code: 'EMPTY_STATE_OVERRIDE',
                        message: `Task "${task.title}" has empty state override for ${overrideStateCode}`,
                        taskId: task.id,
                        context: {
                            overrideState: overrideStateCode,
                            override,
                        },
                        suggestion: 'Remove empty state override or add override content',
                        remediation: {
                            type: 'code',
                            steps: [
                                `Locate task "${task.title}" in settlementPhases.ts`,
                                `Review state override for ${overrideStateCode}`,
                                'Either add override content or remove the empty override object',
                            ],
                        },
                    });
                }
                // Check for invalid override fields
                if (override && typeof override === 'object') {
                    const overrideKeys = Object.keys(override);
                    const validOverrideFields = [
                        'title', 'description', 'estimatedTime', 'formNames',
                        'primaryActionLabel', 'primaryActionUrl', 'links',
                        'sourceUrl', 'lastVerifiedAt', 'reviewedBy', 'confidence',
                        'changeLog', 'officialForms', 'utility', 'dependencies',
                        'isOptional', 'deadlineWarningId', 'isConditional',
                        'conditionalRequirementLabel', 'requiredDocs', 'alerts',
                        'applicability',
                    ];
                    const invalidFields = overrideKeys.filter(k => !validOverrideFields.includes(k));
                    if (invalidFields.length > 0) {
                        findings.push({
                            checkId: 'dbIntegrityInvariants',
                            checkName: 'Database Integrity Invariants',
                            stateCode,
                            severity: 'WARNING',
                            code: 'INVALID_OVERRIDE_FIELD',
                            message: `Task "${task.title}" state override for ${overrideStateCode} has invalid fields: ${invalidFields.join(', ')}`,
                            taskId: task.id,
                            context: {
                                overrideState: overrideStateCode,
                                invalidFields,
                            },
                            suggestion: 'Remove invalid fields from state override',
                            remediation: {
                                type: 'code',
                                steps: [
                                    `Locate task "${task.title}" in settlementPhases.ts`,
                                    `Review state override for ${overrideStateCode}`,
                                    `Remove invalid fields: ${invalidFields.join(', ')}`,
                                ],
                            },
                        });
                    }
                }
            }
        }
    }
    // Check for invalid allowedStates format
    for (const task of tasks) {
        if (task.allowedStates) {
            if (!Array.isArray(task.allowedStates)) {
                findings.push({
                    checkId: 'dbIntegrityInvariants',
                    checkName: 'Database Integrity Invariants',
                    stateCode,
                    severity: 'CRITICAL',
                    code: 'INVALID_ALLOWED_STATES_FORMAT',
                    message: `Task "${task.title}" allowedStates is not an array`,
                    taskId: task.id,
                    context: {
                        allowedStates: task.allowedStates,
                    },
                    suggestion: 'Set allowedStates to an array of state codes',
                    remediation: {
                        type: 'code',
                        steps: [
                            `Locate task "${task.title}" in settlementPhases.ts`,
                            'Convert allowedStates to array: ["CA", "TX", "NY"]',
                        ],
                    },
                });
            }
            else {
                // Check for invalid state codes in allowedStates
                const validStateCodes = new Set([
                    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
                    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
                    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
                    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
                    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
                ]);
                const invalidStateCodes = task.allowedStates.filter(sc => !validStateCodes.has(sc));
                if (invalidStateCodes.length > 0) {
                    findings.push({
                        checkId: 'dbIntegrityInvariants',
                        checkName: 'Database Integrity Invariants',
                        stateCode,
                        severity: 'WARNING',
                        code: 'INVALID_STATE_CODE',
                        message: `Task "${task.title}" has invalid state codes in allowedStates: ${invalidStateCodes.join(', ')}`,
                        taskId: task.id,
                        context: {
                            invalidStateCodes,
                            allowedStates: task.allowedStates,
                        },
                        suggestion: 'Remove invalid state codes from allowedStates',
                        remediation: {
                            type: 'code',
                            steps: [
                                `Locate task "${task.title}" in settlementPhases.ts`,
                                `Remove invalid state codes: ${invalidStateCodes.join(', ')}`,
                                'Use valid 2-letter state codes',
                            ],
                        },
                    });
                }
            }
        }
    }
    const severityCounts = findings.reduce((acc, f) => {
        acc[f.severity]++;
        return acc;
    }, { BLOCKER: 0, CRITICAL: 0, WARNING: 0, INFO: 0 });
    return {
        passed: findings.filter(f => f.severity === 'BLOCKER').length === 0,
        checkId: 'dbIntegrityInvariants',
        checkName: 'Database Integrity Invariants',
        findings,
        severityCounts,
        executionTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
    };
}
