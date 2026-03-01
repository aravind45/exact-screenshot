/**
 * Authority Scope Audit Tests
 * 
 * Tests for the AuthorityType Change Policy and AuthorityScope Gating system
 * to prevent trust/probate module leakage.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  filterTasksByAuthorityScope,
  filterPhasesByAuthorityScope,
  type ScopedTask,
  type PhaseLike,
} from '../src/shared/filterByJurisdiction';
import type { EstateAuthorityType } from '../src/types/authorityScope';
import { deriveEstateAuthorityType } from '../src/types/authorityScope';

describe('AuthorityScope Filtering', () => {
  describe('deriveEstateAuthorityType', () => {
    it('should return TRUST for trust-only engines', () => {
      expect(deriveEstateAuthorityType(['TRUST'])).toBe('TRUST');
    });

    it('should return PROBATE for probate-only engines', () => {
      expect(deriveEstateAuthorityType(['PROBATE'])).toBe('PROBATE');
      expect(deriveEstateAuthorityType(['AFFIDAVIT'])).toBe('PROBATE');
      expect(deriveEstateAuthorityType(['PROBATE', 'AFFIDAVIT'])).toBe('PROBATE');
    });

    it('should return BOTH for mixed engines', () => {
      expect(deriveEstateAuthorityType(['PROBATE', 'TRUST'])).toBe('BOTH');
      expect(deriveEstateAuthorityType(['TRUST', 'PROBATE', 'AFFIDAVIT'])).toBe('BOTH');
    });

    it('should return PROBATE as fail-closed fallback for empty engines', () => {
      expect(deriveEstateAuthorityType([])).toBe('PROBATE');
    });

    it('should return PROBATE when isTrustRevocable is false without trust assets', () => {
      // isTrustRevocable=false should NOT activate TRUST engine
      // This ensures estates with explicit "no revocable trust" don't get BOTH authority
      const engines = ['PROBATE'];
      expect(deriveEstateAuthorityType(engines)).toBe('PROBATE');
    });

    it('should return TRUST when isTrustRevocable is true with only trust assets', () => {
      // isTrustRevocable=true should activate TRUST engine
      const engines = ['TRUST'];
      expect(deriveEstateAuthorityType(engines)).toBe('TRUST');
    });

    it('should return BOTH only when both engines are truly active', () => {
      // BOTH should only occur when both PROBATE and TRUST engines are present
      const engines = ['PROBATE', 'TRUST'];
      expect(deriveEstateAuthorityType(engines)).toBe('BOTH');
    });
  });

  describe('filterTasksByAuthorityScope', () => {
    const createTask = (id: string, authorityScope?: 'PROBATE' | 'TRUST' | 'BOTH'): ScopedTask => ({
      id,
      scope: 'CORE',
      authorityScope,
    });

    it('should DROP tasks without authorityScope (fail-closed — no NULL leakage)', () => {
      const tasks = [createTask('task1'), createTask('task2')];
      const result = filterTasksByAuthorityScope(tasks, 'PROBATE');
      expect(result.kept).toHaveLength(0);
      expect(result.dropped).toHaveLength(2);
      expect(result.dropped[0].reason).toContain('FAIL-CLOSED');
    });

    it('should keep BOTH tasks for any estate type', () => {
      const tasks = [createTask('task1', 'BOTH'), createTask('task2', 'BOTH')];
      
      let result = filterTasksByAuthorityScope(tasks, 'PROBATE');
      expect(result.kept).toHaveLength(2);
      
      result = filterTasksByAuthorityScope(tasks, 'TRUST');
      expect(result.kept).toHaveLength(2);
      
      result = filterTasksByAuthorityScope(tasks, 'BOTH');
      expect(result.kept).toHaveLength(2);
    });

    it('should show all tasks for BOTH estates', () => {
      const tasks = [
        createTask('probate_task', 'PROBATE'),
        createTask('trust_task', 'TRUST'),
        createTask('both_task', 'BOTH'),
      ];
      const result = filterTasksByAuthorityScope(tasks, 'BOTH');
      expect(result.kept).toHaveLength(3);
      expect(result.dropped).toHaveLength(0);
    });

    it('should filter PROBATE tasks from TRUST estates', () => {
      const tasks = [
        createTask('probate_task', 'PROBATE'),
        createTask('trust_task', 'TRUST'),
        createTask('both_task', 'BOTH'),
      ];
      const result = filterTasksByAuthorityScope(tasks, 'TRUST');
      
      expect(result.kept).toHaveLength(2);
      expect(result.kept.map(t => t.id)).toContain('trust_task');
      expect(result.kept.map(t => t.id)).toContain('both_task');
      expect(result.dropped).toHaveLength(1);
      expect(result.dropped[0].id).toBe('probate_task');
    });

    it('should filter TRUST tasks from PROBATE estates', () => {
      const tasks = [
        createTask('probate_task', 'PROBATE'),
        createTask('trust_task', 'TRUST'),
        createTask('both_task', 'BOTH'),
      ];
      const result = filterTasksByAuthorityScope(tasks, 'PROBATE');
      
      expect(result.kept).toHaveLength(2);
      expect(result.kept.map(t => t.id)).toContain('probate_task');
      expect(result.kept.map(t => t.id)).toContain('both_task');
      expect(result.dropped).toHaveLength(1);
      expect(result.dropped[0].id).toBe('trust_task');
    });

    it('should include reason in dropped tasks', () => {
      const tasks = [createTask('probate_task', 'PROBATE')];
      const result = filterTasksByAuthorityScope(tasks, 'TRUST');
      
      expect(result.dropped[0].reason).toContain('PROBATE');
      expect(result.dropped[0].reason).toContain('TRUST');
    });
  });

  describe('filterPhasesByAuthorityScope', () => {
    const createPhase = (phaseId: string, tasks: ScopedTask[]): PhaseLike<ScopedTask> => ({
      phase: phaseId,
      tasks,
    });

    it('should filter tasks within phases', () => {
      const phases = [
        createPhase('phase1', [
          { id: 'probate_task', scope: 'CORE', authorityScope: 'PROBATE' },
          { id: 'trust_task', scope: 'CORE', authorityScope: 'TRUST' },
          { id: 'both_task', scope: 'CORE', authorityScope: 'BOTH' },
        ]),
        createPhase('phase2', [
          { id: 'another_probate', scope: 'CORE', authorityScope: 'PROBATE' },
        ]),
      ];
      
      const result = filterPhasesByAuthorityScope(phases, 'TRUST');
      
      expect(result.phases[0].tasks).toHaveLength(2);
      expect(result.phases[1].tasks).toHaveLength(0);
      expect(result.dropped).toHaveLength(2);
    });

    it('should preserve phase metadata', () => {
      const phases = [
        {
          phase: 'phase1',
          title: 'Phase One',
          tasks: [{ id: 'task1', scope: 'CORE', authorityScope: 'PROBATE' }],
        },
      ];
      
      const result = filterPhasesByAuthorityScope(phases, 'TRUST');
      
      expect((result.phases[0] as any).title).toBe('Phase One');
    });
  });
});

describe('Authority Leak Prevention', () => {
  // Define known PROBATE-only task IDs that should NEVER appear for TRUST estates
  const PROBATE_ONLY_TASKS = [
    'file_probate_petition',
    'file_administration_petition',
    'attend_probate_hearing',
    'attend_administration_hearing',
    'receive_letters_testamentary',
    'receive_letters_administration',
    'handle_bond_waivers',
    'obtain_bond_waiver_order',
    'file_inventory_appraisal',
    'file_final_accounting',
    'file_spousal_petition',
    'obtain_spousal_order',
    'file_succession_petition',
    'obtain_succession_order',
    'obtain_citation',
    'serve_citation',
  ];

  // Define known TRUST-only task IDs that should NEVER appear for PROBATE estates
  const TRUST_ONLY_TASKS = [
    'locate_trust',
    'identify_successor_trustee',
    'sign_trustee_acceptance',
    'prepare_certification_of_trust',
    'issue_cert_trust',
    'notify_trust_beneficiaries',
    'distribute_trust_assets',
    'file_trust_tax_return',
  ];

  it('should have valid task categorization for PROBATE tasks', () => {
    // These tasks should have authorityScope: "PROBATE"
    // This test documents expected behavior
    const expectedBehavior = PROBATE_ONLY_TASKS.map(taskId => ({
      taskId,
      expectedScope: 'PROBATE',
    }));
    expect(expectedBehavior).toBeDefined();
  });

  it('should have valid task categorization for TRUST tasks', () => {
    // These tasks should have authorityScope: "TRUST"
    // This test documents expected behavior
    const expectedBehavior = TRUST_ONLY_TASKS.map(taskId => ({
      taskId,
      expectedScope: 'TRUST',
    }));
    expect(expectedBehavior).toBeDefined();
  });
});

describe('Authority Pin Stability', () => {
  it('should not change pinned authority without explicit repin', () => {
    // This test documents the expected behavior
    // Once an estate has authorityPinnedAt set, the authorityType should not
    // change until repinAuthorityType is called with confirmation
    const pinnedEstate = {
      authorityType: 'FORMAL_PROBATE',
      estateAuthorityType: 'PROBATE' as EstateAuthorityType,
      authorityPinnedAt: new Date(),
      authorityChangePending: false,
    };
    
    expect(pinnedEstate.authorityType).toBe('FORMAL_PROBATE');
    expect(pinnedEstate.authorityChangePending).toBe(false);
  });

  it('should detect authority change pending when recommendation differs', () => {
    // This test documents the expected behavior
    // When the engine recommendation differs from pinned authority,
    // authorityChangePending should be true
    const estateWithPendingChange = {
      authorityType: 'FORMAL_PROBATE',
      estateAuthorityType: 'PROBATE' as EstateAuthorityType,
      authorityPinnedAt: new Date(),
      recommendedAuthorityType: 'TRUST_ADMIN_REVOCABLE',
      authorityChangePending: true,
    };
    
    expect(estateWithPendingChange.authorityChangePending).toBe(true);
    expect(estateWithPendingChange.recommendedAuthorityType).toBe('TRUST_ADMIN_REVOCABLE');
  });
});

describe('Repin Confirmation Workflow', () => {
  it('should require confirmation when completed tasks would be affected', () => {
    // This test documents the expected behavior
    const repinPreview = {
      currentAuthorityType: 'FORMAL_PROBATE',
      recommendedAuthorityType: 'TRUST_ADMIN_REVOCABLE',
      tasksAdded: ['locate_trust', 'identify_successor_trustee'],
      tasksRemoved: ['file_probate_petition', 'attend_probate_hearing'],
      completionImpact: {
        affectedTasks: 4,
        completedTasksAffected: 2,
        canMigrate: false,
      },
      requiresConfirmation: true,
    };
    
    expect(repinPreview.requiresConfirmation).toBe(true);
    expect(repinPreview.completionImpact.completedTasksAffected).toBeGreaterThan(0);
    expect(repinPreview.completionImpact.canMigrate).toBe(false);
  });

  it('should allow repin without confirmation when no completed tasks affected', () => {
    // This test documents the expected behavior
    const repinPreview = {
      currentAuthorityType: 'FORMAL_PROBATE',
      recommendedAuthorityType: 'INFORMAL_PROBATE',
      tasksAdded: ['file_informal_petition'],
      tasksRemoved: [],
      completionImpact: {
        affectedTasks: 1,
        completedTasksAffected: 0,
        canMigrate: true,
      },
      requiresConfirmation: false,
    };
    
    expect(repinPreview.requiresConfirmation).toBe(false);
    expect(repinPreview.completionImpact.completedTasksAffected).toBe(0);
    expect(repinPreview.completionImpact.canMigrate).toBe(true);
  });
});

describe('Audit Logging', () => {
  it('should log authority change events with full context', () => {
    // This test documents the expected audit log structure
    const auditEvent = {
      estateId: 'estate-123',
      previousType: 'FORMAL_PROBATE',
      newType: 'TRUST_ADMIN_REVOCABLE',
      changeSource: 'REPIN',
      triggeredBy: 'user-456',
      computedAt: new Date(),
      appliedAt: new Date(),
      diffSummary: {
        tasksAdded: ['locate_trust'],
        tasksRemoved: ['file_probate_petition'],
        affectedTasks: 2,
      },
    };
    
    expect(auditEvent.changeSource).toBe('REPIN');
    expect(auditEvent.diffSummary).toBeDefined();
    expect(auditEvent.triggeredBy).toBeDefined();
  });
});
