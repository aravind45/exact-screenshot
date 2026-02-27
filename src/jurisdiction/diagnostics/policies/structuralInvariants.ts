/**
 * Structural Invariants Policy Validator
 * 
 * Validates that roadmaps have required structural elements:
 * - Real property tasks when estate has real property
 * - Small estate citations when applicable
 * - Creditor deadline tasks
 * - Proper task ordering
 * - No orphaned dependencies
 */

import type { DiagnosticResult, EstateProfile, DiagnosticTask, Violation } from "../types.js";

/**
 * Required task categories for different estate profiles
 */
const REQUIRED_CATEGORIES: Array<{
  predicate: (profile: EstateProfile) => boolean;
  requiredTasks: Array<{
    taskIdPattern?: RegExp;
    taskId?: string;
    description: string;
    severity: 'CRITICAL' | 'WARNING';
  }>;
}> = [
  {
    // Real property requires specific tasks
    predicate: (profile) => profile.hasRealProperty,
    requiredTasks: [
      {
        taskIdPattern: /real.*property|property.*transfer|deed|title/i,
        description: 'Task related to real property handling',
        severity: 'WARNING',
      },
    ],
  },
  {
    // Probate estates need authority-related tasks
    predicate: (profile) => profile.authorityType === 'PROBATE' || profile.authorityType === 'BOTH',
    requiredTasks: [
      {
        taskId: 'file_probate_petition',
        description: 'Probate petition filing task',
        severity: 'CRITICAL',
      },
      {
        taskIdPattern: /letters.*testamentary|letters.*administration|authority/i,
        description: 'Letters of authority issuance task',
        severity: 'WARNING',
      },
    ],
  },
  {
    // Trust estates need trust administration tasks
    predicate: (profile) => profile.authorityType === 'TRUST' || profile.authorityType === 'BOTH',
    requiredTasks: [
      {
        taskIdPattern: /trust|trustee/i,
        description: 'Trust administration task',
        severity: 'WARNING',
      },
    ],
  },
  {
    // Small estates need simplified process tasks
    predicate: (profile) => profile.characteristics.isSmallEstate === true,
    requiredTasks: [
      {
        taskIdPattern: /small.*estate|affidavit|summary/i,
        description: 'Small estate process task',
        severity: 'WARNING',
      },
    ],
  },
];

/**
 * Task dependency relationships that must be satisfied
 */
const IMPLICIT_DEPENDENCIES: Array<{
  prerequisite: RegExp;
  dependent: RegExp;
  description: string;
}> = [
  {
    prerequisite: /probate.*petition/i,
    dependent: /letters.*testamentary|letters.*administration/i,
    description: 'Letters cannot be issued before probate petition is filed',
  },
  {
    prerequisite: /letters/i,
    dependent: /asset.*collection|marshal.*assets/i,
    description: 'Assets should not be collected before authority is granted',
  },
  {
    prerequisite: /notice.*creditor/i,
    dependent: /pay.*debt|distribute/i,
    description: 'Distribution should not occur before creditor notice period',
  },
];

/**
 * Validates structural invariants
 */
export function validateStructuralInvariants(
  stateCode: string,
  estateProfile: EstateProfile,
  tasks: DiagnosticTask[]
): DiagnosticResult {
  const startTime = Date.now();
  const violations: Violation[] = [];
  const taskMap = new Map(tasks.map(t => [t.id, t]));

  // Check required categories
  for (const category of REQUIRED_CATEGORIES) {
    if (category.predicate(estateProfile)) {
      for (const required of category.requiredTasks) {
        let found = false;

        if (required.taskId) {
          found = taskMap.has(required.taskId);
        } else if (required.taskIdPattern) {
          found = tasks.some(t => required.taskIdPattern!.test(t.id));
        }

        if (!found) {
          violations.push({
            code: 'MISSING_REQUIRED_CATEGORY_TASK',
            message: `Missing required task: ${required.description} for ${estateProfile.authorityType} estate with ${JSON.stringify(estateProfile.characteristics)}`,
            severity: required.severity,
            context: {
              stateCode,
              estateProfile: {
                authorityType: estateProfile.authorityType,
                hasRealProperty: estateProfile.hasRealProperty,
                characteristics: estateProfile.characteristics,
              },
              expectedTaskId: required.taskId,
              expectedPattern: required.taskIdPattern?.source,
            },
            suggestion: `Add appropriate task for ${required.description}`,
          });
        }
      }
    }
  }

  // Check for orphaned dependencies
  for (const task of tasks) {
    if (task.dependencies && task.dependencies.length > 0) {
      for (const depId of task.dependencies) {
        if (!taskMap.has(depId)) {
          violations.push({
            code: 'ORPHANED_DEPENDENCY',
            message: `Task "${task.title}" depends on non-existent task "${depId}"`,
            severity: 'CRITICAL',
            taskId: task.id,
            context: {
              dependencyId: depId,
              availableTasks: tasks.map(t => t.id),
            },
            suggestion: `Add missing dependency task "${depId}" or remove the dependency`,
          });
        }
      }
    }
  }

  // Check implicit dependency ordering
  for (const { prerequisite, dependent, description } of IMPLICIT_DEPENDENCIES) {
    const prerequisiteTasks = tasks.filter(t => prerequisite.test(t.id));
    const dependentTasks = tasks.filter(t => dependent.test(t.id));

    if (prerequisiteTasks.length > 0 && dependentTasks.length > 0) {
      // Check if prerequisite comes before dependent
      const prereqIds = new Set(prerequisiteTasks.map(t => t.id));
      
      for (const depTask of dependentTasks) {
        if (depTask.dependencies) {
          const hasPrereqDep = depTask.dependencies.some(d => prereqIds.has(d));
          if (!hasPrereqDep) {
            violations.push({
              code: 'IMPLICIT_DEPENDENCY_VIOLATION',
              message: `Task "${depTask.title}" may need explicit dependency on prerequisite task`,
              severity: 'INFO',
              taskId: depTask.id,
              context: {
                description,
                prerequisiteTasks: prerequisiteTasks.map(t => t.id),
                currentDependencies: depTask.dependencies,
              },
              suggestion: `Consider adding dependency on prerequisite task: ${prerequisiteTasks.map(t => t.id).join(', ')}`,
            });
          }
        }
      }
    }
  }

  // Check for duplicate task IDs
  const taskIdCounts = new Map<string, number>();
  for (const task of tasks) {
    taskIdCounts.set(task.id, (taskIdCounts.get(task.id) || 0) + 1);
  }
  
  for (const [taskId, count] of taskIdCounts) {
    if (count > 1) {
      violations.push({
        code: 'DUPLICATE_TASK_ID',
        message: `Task ID "${taskId}" appears ${count} times in roadmap`,
        severity: 'CRITICAL',
        taskId,
        context: { count },
        suggestion: 'Ensure all task IDs are unique within the roadmap',
      });
    }
  }

  // Check for empty task titles or descriptions
  for (const task of tasks) {
    if (!task.title || task.title.trim() === '') {
      violations.push({
        code: 'EMPTY_TASK_TITLE',
        message: `Task ${task.id} has empty title`,
        severity: 'CRITICAL',
        taskId: task.id,
        suggestion: 'Add a descriptive title to the task',
      });
    }

    if (!task.description || task.description.trim() === '') {
      violations.push({
        code: 'EMPTY_TASK_DESCRIPTION',
        message: `Task "${task.title}" has empty description`,
        severity: 'WARNING',
        taskId: task.id,
        suggestion: 'Add a helpful description to guide users',
      });
    }
  }

  // Validate small estate threshold for applicable states
  if (estateProfile.characteristics.isSmallEstate) {
    const stateThresholds: Record<string, number> = {
      'CA': 184500, // California small estate threshold
      'TX': 75000,  // Texas small estate (affidavit) threshold
      'FL': 75000,  // Florida summary administration threshold
      'NY': 50000,  // New York voluntary administration threshold
      'OH': 35000,  // Ohio release from administration threshold
    };

    const threshold = stateThresholds[stateCode];
    if (threshold && estateProfile.estateValue > threshold) {
      violations.push({
        code: 'SMALL_ESTATE_VALUE_EXCEEDED',
        message: `Estate value $${estateProfile.estateValue} exceeds ${stateCode} small estate threshold of $${threshold}`,
        severity: 'WARNING',
        context: {
          stateCode,
          estateValue: estateProfile.estateValue,
          threshold,
        },
        suggestion: `Verify estate qualification for small estate process in ${stateCode}`,
      });
    }
  }

  const criticalCount = violations.filter(v => v.severity === 'CRITICAL').length;
  const warningCount = violations.filter(v => v.severity === 'WARNING').length;
  const infoCount = violations.filter(v => v.severity === 'INFO').length;

  return {
    passed: criticalCount === 0,
    policyName: 'structuralInvariants',
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
