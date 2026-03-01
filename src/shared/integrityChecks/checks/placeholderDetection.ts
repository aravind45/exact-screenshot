/**
 * Placeholder Detection Integrity Check
 * 
 * Validates that no placeholder content ({{ }}, TBD, varies by state) exists
 * in task titles and descriptions that would be visible to users.
 * 
 * Placeholders indicate incomplete content and should be resolved before deployment.
 */

import type { IntegrityCheckResult, IntegrityFinding } from '../types.js';
import type { EstateProfile, DiagnosticTask } from '../../../jurisdiction/diagnostics/types.js';

/**
 * Placeholder patterns to detect
 */
const PLACEHOLDER_PATTERNS = [
  {
    pattern: /\{\{[^}]+\}\}/,
    name: 'Template Variable ({{ }})',
    description: 'Double-brace template variables should be resolved',
  },
  {
    pattern: /\{[^}]+\}/,
    name: 'Single Brace Placeholder ({ })',
    description: 'Single-brace placeholders should be resolved',
  },
  {
    pattern: /\[\[.+?\]\]/,
    name: 'Double Bracket Placeholder ([[ ]])',
    description: 'Double-bracket placeholders should be resolved',
  },
  {
    pattern: /\bTBD\b/i,
    name: 'TBD Marker',
    description: '"TBD" markers indicate incomplete content',
  },
  {
    pattern: /\bTODO\b/i,
    name: 'TODO Marker',
    description: '"TODO" markers indicate incomplete content',
  },
  {
    pattern: /\bXXX\b/,
    name: 'XXX Placeholder',
    description: '"XXX" placeholders should be resolved',
  },
  {
    pattern: /\bFIXME\b/i,
    name: 'FIXME Marker',
    description: '"FIXME" markers indicate incomplete content',
  },
  {
    pattern: /\bvaries by state\b/i,
    name: '"varies by state"',
    description: 'Generic "varies by state" should be replaced with specific state information',
  },
  {
    pattern: /\bdepends on state\b/i,
    name: '"depends on state"',
    description: 'Generic "depends on state" should be replaced with specific state information',
  },
  {
    pattern: /\bcheck local rules\b/i,
    name: '"check local rules"',
    description: 'Generic "check local rules" should be replaced with specific guidance',
  },
  {
    pattern: /\[insert .+?\]/i,
    name: '[insert ...] placeholder',
    description: 'Insert placeholders should be resolved',
  },
  {
    pattern: /<placeholder>/i,
    name: '<placeholder> tag',
    description: 'Placeholder tags should be resolved',
  },
  {
    pattern: /\$\{[^}]+\}/,
    name: 'Dollar-brace placeholder (${ })',
    description: 'Dollar-brace placeholders (often template syntax) should be resolved',
  },
];

/**
 * Scans text for placeholders
 */
function scanForPlaceholders(text: string): Array<{ pattern: string; match: string; name: string; description: string }> {
  const found: Array<{ pattern: string; match: string; name: string; description: string }> = [];

  for (const { pattern, name, description } of PLACEHOLDER_PATTERNS) {
    const regex = new RegExp(pattern.source, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      found.push({
        pattern: pattern.source,
        match: match[0],
        name,
        description,
      });
    }
  }

  return found;
}

/**
 * Validates placeholder integrity in tasks
 */
export function validatePlaceholderDetection(
  _stateCode: string,
  _estateProfile: EstateProfile,
  tasks: DiagnosticTask[]
): IntegrityCheckResult {
  const startTime = Date.now();
  const findings: IntegrityFinding[] = [];

  for (const task of tasks) {
    // Check task title
    if (task.title) {
      const titlePlaceholders = scanForPlaceholders(task.title);
      for (const ph of titlePlaceholders) {
        findings.push({
          checkId: 'placeholderDetection',
          checkName: 'Placeholder Detection',
          stateCode: _stateCode,
          severity: 'BLOCKER',
          code: 'PLACEHOLDER_IN_TITLE',
          message: `Task "${task.title}" contains placeholder "${ph.match}" (${ph.name}) in title`,
          taskId: task.id,
          context: {
            field: 'title',
            placeholder: ph.match,
            placeholderType: ph.name,
          },
          suggestion: ph.description,
          remediation: {
            type: 'content',
            steps: [
              `Review task "${task.title}" in the codebase`,
              `Replace placeholder "${ph.match}" with actual content`,
              `Use stateOverrides if the value varies by state`,
            ],
          },
        });
      }
    }

    // Check task description
    if (task.description) {
      const descPlaceholders = scanForPlaceholders(task.description);
      for (const ph of descPlaceholders) {
        // "varies by state" and similar in descriptions are warnings, not critical
        const isGenericStateRef = ['"varies by state"', '"depends on state"', '"check local rules"'].includes(ph.name);
        
        findings.push({
          checkId: 'placeholderDetection',
          checkName: 'Placeholder Detection',
          stateCode: _stateCode,
          severity: isGenericStateRef ? 'WARNING' : 'BLOCKER',
          code: 'PLACEHOLDER_IN_DESCRIPTION',
          message: `Task "${task.title}" contains placeholder "${ph.match}" (${ph.name}) in description`,
          taskId: task.id,
          context: {
            field: 'description',
            placeholder: ph.match,
            placeholderType: ph.name,
          },
          suggestion: isGenericStateRef 
            ? `Add specific ${ph.name.includes('state') ? 'state' : ''} information via stateOverrides`
            : ph.description,
          remediation: {
            type: isGenericStateRef ? 'stateOverride' : 'content',
            steps: isGenericStateRef
              ? [
                  `Review task "${task.title}" description`,
                  `Add state-specific content in stateOverrides for each state`,
                  `Remove generic "${ph.match}" text`,
                ]
              : [
                  `Review task "${task.title}" description in the codebase`,
                  `Replace placeholder "${ph.match}" with actual content`,
                  `Use stateOverrides if the value varies by state`,
                ],
          },
        });
      }
    }

    // Check state overrides for placeholders
    const stateOverride = task.stateOverrides;
    if (stateOverride) {
      const overrideText = JSON.stringify(stateOverride);
      const overridePlaceholders = scanForPlaceholders(overrideText);
      
      for (const ph of overridePlaceholders) {
        findings.push({
          checkId: 'placeholderDetection',
          checkName: 'Placeholder Detection',
          stateCode: _stateCode,
          severity: 'BLOCKER',
          code: 'PLACEHOLDER_IN_STATE_OVERRIDE',
          message: `Task "${task.title}" contains placeholder "${ph.match}" (${ph.name}) in state override`,
          taskId: task.id,
          context: {
            field: 'stateOverrides',
            placeholder: ph.match,
            placeholderType: ph.name,
          },
          suggestion: ph.description,
          remediation: {
            type: 'content',
            steps: [
              `Review state override for task "${task.title}"`,
              `Replace placeholder "${ph.match}" with actual content`,
              `Ensure all fields are populated with real data`,
            ],
          },
        });
      }
    }

    // Check form names for placeholders
    if (task.formNames) {
      for (const formName of task.formNames) {
        const formPlaceholders = scanForPlaceholders(formName);
        for (const ph of formPlaceholders) {
          findings.push({
            checkId: 'placeholderDetection',
            checkName: 'Placeholder Detection',
            stateCode: _stateCode,
            severity: 'BLOCKER',
            code: 'PLACEHOLDER_IN_FORM_NAME',
            message: `Task "${task.title}" form name "${formName}" contains placeholder "${ph.match}"`,
            taskId: task.id,
            context: {
              field: 'formNames',
              formName,
              placeholder: ph.match,
            },
            suggestion: 'Provide specific form names or remove placeholder',
            remediation: {
              type: 'content',
              steps: [
                `Review task "${task.title}" form names`,
                `Replace placeholder "${ph.match}" with actual form name`,
                `Use official form names from the state court website`,
              ],
            },
          });
        }
      }
    }

    // Check links for placeholders
    if (task.links) {
      for (const link of task.links) {
        const labelPlaceholders = scanForPlaceholders(link.label);
        const urlPlaceholders = scanForPlaceholders(link.url);
        
        for (const ph of [...labelPlaceholders, ...urlPlaceholders]) {
          findings.push({
            checkId: 'placeholderDetection',
            checkName: 'Placeholder Detection',
            stateCode: _stateCode,
            severity: 'BLOCKER',
            code: 'PLACEHOLDER_IN_LINK',
            message: `Task "${task.title}" link contains placeholder "${ph.match}"`,
            taskId: task.id,
            context: {
              field: 'links',
              linkLabel: link.label,
              placeholder: ph.match,
            },
            suggestion: 'Provide valid URLs and labels',
            remediation: {
              type: 'content',
              steps: [
                `Review task "${task.title}" links`,
                `Replace placeholder "${ph.match}" with actual URL or label`,
                `Ensure links point to valid resources`,
              ],
            },
          });
        }
      }
    }

    // Check primaryActionUrl for placeholders
    if (task.primaryActionUrl) {
      const urlPlaceholders = scanForPlaceholders(task.primaryActionUrl);
      for (const ph of urlPlaceholders) {
        findings.push({
          checkId: 'placeholderDetection',
          checkName: 'Placeholder Detection',
          stateCode: _stateCode,
          severity: 'BLOCKER',
          code: 'PLACEHOLDER_IN_ACTION_URL',
          message: `Task "${task.title}" primaryActionUrl contains placeholder "${ph.match}"`,
          taskId: task.id,
          context: {
            field: 'primaryActionUrl',
            url: task.primaryActionUrl,
            placeholder: ph.match,
          },
          suggestion: 'Provide a valid action URL',
          remediation: {
            type: 'content',
            steps: [
              `Review task "${task.title}" primaryActionUrl`,
              `Replace placeholder "${ph.match}" with actual URL`,
              `Ensure URL points to the correct route or external resource`,
            ],
          },
        });
      }
    }
  }

  const severityCounts = findings.reduce(
    (acc, f) => {
      acc[f.severity]++;
      return acc;
    },
    { BLOCKER: 0, CRITICAL: 0, WARNING: 0, INFO: 0 }
  );

  return {
    passed: findings.filter(f => f.severity === 'BLOCKER').length === 0,
    checkId: 'placeholderDetection',
    checkName: 'Placeholder Detection',
    findings,
    severityCounts,
    executionTimeMs: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  };
}
