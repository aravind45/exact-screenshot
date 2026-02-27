/**
 * Snapshot Utilities for Roadmap Harness
 * 
 * Provides snapshot generation, hashing, and diffing capabilities.
 */

import type { EstateSnapshot, TaskSnapshot, SnapshotDiff, EstateProfile } from '@/jurisdiction/diagnostics/types';
import { createHash } from 'crypto';

/**
 * Generate a hash for a task
 */
export function hashTask(task: TaskSnapshot): string {
  const content = `${task.id}:${task.title}:${task.phase}:${task.authorityScope || 'none'}:${task.scope}`;
  return createHash('md5').update(content).digest('hex').substring(0, 16);
}

/**
 * Generate a hash for an entire estate snapshot
 */
export function hashSnapshot(snapshot: Omit<EstateSnapshot, 'hash'>): string {
  const content = `${snapshot.profileId}:${snapshot.stateCode}:${snapshot.authorityType}:${snapshot.taskCount}:${snapshot.tasks.map(t => t.hash).join('|')}`;
  return createHash('md5').update(content).digest('hex').substring(0, 16);
}

/**
 * Generate a snapshot from roadmap data
 */
export function generateSnapshot(
  profile: EstateProfile,
  phases: Array<{ phase: string; tasks: Array<{ id: string; title: string; authorityScope?: string; scope: string }> }>
): EstateSnapshot {
  const tasks: TaskSnapshot[] = [];
  
  phases.forEach((phase, phaseIndex) => {
    phase.tasks.forEach((task, taskIndex) => {
      const taskSnapshot: TaskSnapshot = {
        id: task.id,
        title: task.title,
        phase: phase.phase,
        phaseOrder: phaseIndex,
        taskOrder: taskIndex,
        authorityScope: task.authorityScope,
        scope: task.scope,
        hash: '', // Will be set below
      };
      taskSnapshot.hash = hashTask(taskSnapshot);
      tasks.push(taskSnapshot);
    });
  });

  const snapshot: EstateSnapshot = {
    profileId: profile.id,
    stateCode: profile.stateCode,
    authorityType: profile.authorityType,
    tasks,
    taskCount: tasks.length,
    phaseCount: phases.length,
    hash: '', // Will be set below
    generatedAt: new Date().toISOString(),
    version: '1.0.0',
  };

  snapshot.hash = hashSnapshot(snapshot);
  return snapshot;
}

/**
 * Compare two snapshots and return the differences
 */
export function diffSnapshots(
  baseline: EstateSnapshot,
  current: EstateSnapshot
): SnapshotDiff {
  const added: TaskSnapshot[] = [];
  const removed: TaskSnapshot[] = [];
  const modified: SnapshotDiff['modified'] = [];
  const orderChanges: SnapshotDiff['orderChanges'] = [];

  const baselineMap = new Map(baseline.tasks.map(t => [t.id, t]));
  const currentMap = new Map(current.tasks.map(t => [t.id, t]));

  // Find added tasks
  for (const task of current.tasks) {
    if (!baselineMap.has(task.id)) {
      added.push(task);
    }
  }

  // Find removed tasks
  for (const task of baseline.tasks) {
    if (!currentMap.has(task.id)) {
      removed.push(task);
    }
  }

  // Find modified tasks
  for (const task of current.tasks) {
    const baselineTask = baselineMap.get(task.id);
    if (baselineTask && baselineTask.hash !== task.hash) {
      const changes: string[] = [];
      const previous: Partial<TaskSnapshot> = {};
      const currentChanges: Partial<TaskSnapshot> = {};

      if (baselineTask.title !== task.title) {
        changes.push('title');
        previous.title = baselineTask.title;
        currentChanges.title = task.title;
      }
      if (baselineTask.phase !== task.phase) {
        changes.push('phase');
        previous.phase = baselineTask.phase;
        currentChanges.phase = task.phase;
      }
      if (baselineTask.authorityScope !== task.authorityScope) {
        changes.push('authorityScope');
        previous.authorityScope = baselineTask.authorityScope;
        currentChanges.authorityScope = task.authorityScope;
      }
      if (baselineTask.scope !== task.scope) {
        changes.push('scope');
        previous.scope = baselineTask.scope;
        currentChanges.scope = task.scope;
      }

      // Check for order changes
      if (baselineTask.phaseOrder !== task.phaseOrder || baselineTask.taskOrder !== task.taskOrder) {
        orderChanges.push({
          taskId: task.id,
          previousOrder: baselineTask.phaseOrder * 1000 + baselineTask.taskOrder,
          currentOrder: task.phaseOrder * 1000 + task.taskOrder,
        });
      }

      modified.push({
        taskId: task.id,
        previous,
        current: currentChanges,
        changes,
      });
    } else if (baselineTask) {
      // Task exists and hash matches, but check for order changes
      if (baselineTask.phaseOrder !== task.phaseOrder || baselineTask.taskOrder !== task.taskOrder) {
        orderChanges.push({
          taskId: task.id,
          previousOrder: baselineTask.phaseOrder * 1000 + baselineTask.taskOrder,
          currentOrder: task.phaseOrder * 1000 + task.taskOrder,
        });
      }
    }
  }

  return {
    profileId: current.profileId,
    matches: added.length === 0 && removed.length === 0 && modified.length === 0 && orderChanges.length === 0,
    added,
    removed,
    modified,
    orderChanges,
  };
}

/**
 * Format a snapshot diff for human-readable output
 */
export function formatDiff(diff: SnapshotDiff): string {
  const lines: string[] = [];

  if (diff.matches) {
    return `✓ Snapshot matches baseline for ${diff.profileId}`;
  }

  lines.push(`Snapshot diff for ${diff.profileId}:`);

  if (diff.added.length > 0) {
    lines.push(`\n  Added tasks (${diff.added.length}):`);
    for (const task of diff.added) {
      lines.push(`    + ${task.id}: "${task.title}" (${task.phase})`);
    }
  }

  if (diff.removed.length > 0) {
    lines.push(`\n  Removed tasks (${diff.removed.length}):`);
    for (const task of diff.removed) {
      lines.push(`    - ${task.id}: "${task.title}" (${task.phase})`);
    }
  }

  if (diff.modified.length > 0) {
    lines.push(`\n  Modified tasks (${diff.modified.length}):`);
    for (const mod of diff.modified) {
      lines.push(`    ~ ${mod.taskId}:`);
      for (const change of mod.changes) {
        const prev = mod.previous[change as keyof typeof mod.previous];
        const curr = mod.current[change as keyof typeof mod.current];
        lines.push(`      ${change}: "${prev}" → "${curr}"`);
      }
    }
  }

  if (diff.orderChanges.length > 0) {
    lines.push(`\n  Order changes (${diff.orderChanges.length}):`);
    for (const change of diff.orderChanges) {
      lines.push(`    ~ ${change.taskId}: position ${change.previousOrder} → ${change.currentOrder}`);
    }
  }

  return lines.join('\n');
}

/**
 * Load a snapshot from file
 */
export async function loadSnapshot(profileId: string): Promise<EstateSnapshot | null> {
  try {
    const snapshot = await import(`../snapshots/${profileId}.json`);
    return snapshot.default || snapshot;
  } catch {
    return null;
  }
}

/**
 * Save a snapshot to file (for updating baselines)
 */
export function serializeSnapshot(snapshot: EstateSnapshot): string {
  return JSON.stringify(snapshot, null, 2);
}
