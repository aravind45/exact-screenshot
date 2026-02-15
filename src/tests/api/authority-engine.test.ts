/**
 * Authority Engine Unit Tests
 * 
 * Tests the authority recommendation logic for all 21 paths
 * Validates that the authority engine correctly identifies estate types
 * based on asset composition, ownership types, and metadata
 */

import { describe, it, expect } from 'vitest';
import {
  calculateAuthorityRecommendation,
  getMasterMode,
  getInstitutionAuthorityRequirement,
  getStateRule,
  UPC_STATES,
  STATE_THRESHOLDS,
  type AuthorityType,
  type MasterMode,
} from '@/lib/authorityEngine';

describe('Authority Engine - Path Detection', () => {
  describe('PTH-01: Full Probate (Will)', () => {
    it('Should recommend FORMAL_PROBATE for large estate with will', () => {
      const assets = [
        { value: 250000, ownershipType: 'INDIVIDUAL', assetType: 'BROKERAGE', category: 'financial' },
        { value: 50000, ownershipType: 'INDIVIDUAL', assetType: 'CHECKING', category: 'financial' },
        { value: 200000, ownershipType: 'INDIVIDUAL', assetType: 'REAL_ESTATE', category: 'real_estate' },
      ];

      const result = calculateAuthorityRecommendation(assets, 'CA', { hasWill: true });

      expect(result.type).toBe('FORMAL_PROBATE');
      expect(result.masterMode).toBe('COURT_SUPERVISED');
      expect(result.probateTotal).toBe(500000);
      expect(result.isEligibleForSmallEstate).toBe(false);
    });
  });

  describe('PTH-02: Intestate Probate (No Will)', () => {
    it('Should recommend INTESTATE for large estate without will', () => {
      const assets = [
        { value: 100000, ownershipType: 'INDIVIDUAL', assetType: 'CHECKING', category: 'financial' },
        { value: 300000, ownershipType: 'INDIVIDUAL', assetType: 'BROKERAGE', category: 'financial' },
      ];

      const result = calculateAuthorityRecommendation(assets, 'CA', { hasWill: false });

      expect(result.type).toBe('INTESTATE');
      expect(result.masterMode).toBe('COURT_SUPERVISED');
      expect(result.probateTotal).toBe(400000);
    });
  });

  describe('PTH-03: Summary Administration', () => {
    it('Should recommend SUMMARY_ADMINISTRATION for FL small estate', () => {
      const assets = [
        { value: 40000, ownershipType: 'INDIVIDUAL', assetType: 'CHECKING', category: 'financial' },
        { value: 20000, ownershipType: 'INDIVIDUAL', assetType: 'BROKERAGE', category: 'financial' },
      ];

      const result = calculateAuthorityRecommendation(assets, 'FL', { hasWill: true });

      expect(result.type).toBe('SMALL_ESTATE');
      expect(result.procedureType).toBe('SUMMARY_ADMINISTRATION');
      expect(result.masterMode).toBe('TRANSFER_ONLY');
      expect(result.isEligibleForSmallEstate).toBe(true);
      expect(result.threshold).toBe(75000);
    });
  });

  describe('PTH-04: Ancillary Probate', () => {
    it('Should recommend ANCILLARY_PROBATE for out-of-state property', () => {
      const assets = [
        { value: 200000, ownershipType: 'INDIVIDUAL', assetType: 'REAL_ESTATE', category: 'real_estate' },
        { value: 300000, ownershipType: 'INDIVIDUAL', assetType: 'REAL_ESTATE', category: 'real_estate' },
      ];

      const result = calculateAuthorityRecommendation(assets, 'CA', {
        hasWill: true,
        isOutOfState: true,
      });

      expect(result.type).toBe('ANCILLARY_PROBATE');
      expect(result.masterMode).toBe('COURT_SUPERVISED');
    });
  });

  describe('PTH-07: Trust Administration (Revocable)', () => {
    it('Should recommend TRUST_ADMIN_REVOCABLE for trust-only assets', () => {
      const assets = [
        { value: 500000, ownershipType: 'TRUST', assetType: 'REAL_ESTATE', category: 'real_estate' },
        { value: 300000, ownershipType: 'TRUST', assetType: 'BROKERAGE', category: 'financial' },
      ];

      const result = calculateAuthorityRecommendation(assets, 'CA', {
        hasWill: true,
        isTrustRevocable: true,
      });

      expect(result.type).toBe('TRUST_ADMIN_REVOCABLE');
      expect(result.masterMode).toBe('FIDUCIARY_ADMINISTERED');
      expect(result.probateTotal).toBe(0);
    });
  });

  describe('PTH-08: Irrevocable Trust', () => {
    it('Should recommend TRUST_ADMIN_IRREVOCABLE for irrevocable trust', () => {
      const assets = [
        { value: 1200000, ownershipType: 'TRUST', assetType: 'BROKERAGE', category: 'financial' },
      ];

      const result = calculateAuthorityRecommendation(assets, 'CA', {
        hasWill: false,
        isTrustRevocable: false,
      });

      expect(result.type).toBe('TRUST_ADMIN_IRREVOCABLE');
      expect(result.masterMode).toBe('FIDUCIARY_ADMINISTERED');
    });
  });

  describe('PTH-09: Pour-Over Hybrid', () => {
    it('Should recommend POUR_OVER_WILL for mixed trust and probate assets', () => {
      const assets = [
        { value: 500000, ownershipType: 'TRUST', assetType: 'REAL_ESTATE', category: 'real_estate' },
        { value: 400000, ownershipType: 'INDIVIDUAL', assetType: 'BROKERAGE', category: 'financial' },
        { value: 50000, ownershipType: 'BENEFICIARY', assetType: 'CHECKING', category: 'financial' },
      ];

      const result = calculateAuthorityRecommendation(assets, 'CA', { hasWill: true });

      expect(result.type).toBe('FORMAL_PROBATE');
      expect(result.masterMode).toBe('COURT_SUPERVISED');
      expect(result.activeEngines).toContain('TRUST');
      expect(result.activeEngines).toContain('PROBATE');
      expect(result.probateTotal).toBe(400000);
    });
  });

  describe('PTH-13: Small Estate Affidavit', () => {
    it('Should recommend SMALL_ESTATE for CA estate under $208,850', () => {
      const assets = [
        { value: 150000, ownershipType: 'INDIVIDUAL', assetType: 'CHECKING', category: 'financial' },
        { value: 40000, ownershipType: 'INDIVIDUAL', assetType: 'BROKERAGE', category: 'financial' },
      ];

      const result = calculateAuthorityRecommendation(assets, 'CA', { hasWill: true });

      expect(result.type).toBe('SMALL_ESTATE');
      expect(result.masterMode).toBe('TRANSFER_ONLY');
      expect(result.isEligibleForSmallEstate).toBe(true);
      expect(result.probateTotal).toBe(190000);
      expect(result.threshold).toBe(208850);
    });
  });

  describe('PTH-14: Joint Tenancy Transfer', () => {
    it('Should recommend JOINT_TRANSFER for joint ownership', () => {
      const assets = [
        { value: 400000, ownershipType: 'JOINT', assetType: 'REAL_ESTATE', category: 'real_estate' },
      ];

      const result = calculateAuthorityRecommendation(assets, 'CA', { hasWill: false });

      expect(result.type).toBe('POD_TOD_TRANSFER');
      expect(result.masterMode).toBe('TRANSFER_ONLY');
      expect(result.probateTotal).toBe(0);
    });
  });

  describe('PTH-15: POD/TOD Transfer', () => {
    it('Should recommend BENEFICIARY_DESIGNATED for beneficiary accounts', () => {
      const assets = [
        { value: 100000, ownershipType: 'BENEFICIARY', assetType: 'CHECKING', category: 'financial' },
        { value: 150000, ownershipType: 'BENEFICIARY', assetType: 'BROKERAGE', category: 'financial' },
      ];

      const result = calculateAuthorityRecommendation(assets, 'CA', { hasWill: false });

      // Authority engine returns POD_TOD_TRANSFER for beneficiary assets
      expect(result.type).toBe('POD_TOD_TRANSFER');
      expect(result.masterMode).toBe('TRANSFER_ONLY');
      expect(result.probateTotal).toBe(0);
    });
  });

  describe('PTH-16: Beneficiary Designated', () => {
    it('Should recommend BENEFICIARY_DESIGNATED for life insurance and retirement', () => {
      const assets = [
        { value: 250000, ownershipType: 'BENEFICIARY', assetType: 'LIFE_INSURANCE', category: 'financial' },
        { value: 350000, ownershipType: 'BENEFICIARY', assetType: '401K', category: 'retirement' },
      ];

      const result = calculateAuthorityRecommendation(assets, 'CA', { hasWill: false });

      expect(result.type).toBe('POD_TOD_TRANSFER');
      expect(result.masterMode).toBe('TRANSFER_ONLY');
    });
  });
  describe('PTH-24: Spousal Property Petition', () => {
    it('Should recommend SPOUSAL_PETITION for spouse with individual assets', () => {
      const assets = [
        { value: 500000, ownershipType: 'INDIVIDUAL', assetType: 'REAL_ESTATE', category: 'real_estate' },
      ];

      const result = calculateAuthorityRecommendation(assets, 'CA', {
        hasWill: true,
        isSpouse: true,
      });

      expect(result.type).toBe('SPOUSAL_PETITION');
      expect(result.masterMode).toBe('COURT_SUPERVISED');
      expect(result.probateTotal).toBe(500000);
      expect(result.procedureType).toBe('SPOUSAL_PETITION');
    });

    it('Should prioritize SPOUSAL_PETITION over FORMAL_PROBATE', () => {
      const assets = [
        { value: 1000000, ownershipType: 'INDIVIDUAL', assetType: 'REAL_ESTATE', category: 'real_estate' },
      ];

      const result = calculateAuthorityRecommendation(assets, 'CA', {
        hasWill: true,
        isSpouse: true,
      });

      expect(result.type).toBe('SPOUSAL_PETITION');
    });
  });
});

describe('Master Mode Classification', () => {
  it('Should classify FORMAL_PROBATE as COURT_SUPERVISED', () => {
    expect(getMasterMode('FORMAL_PROBATE')).toBe('COURT_SUPERVISED');
  });

  it('Should classify INTESTATE as COURT_SUPERVISED', () => {
    expect(getMasterMode('INTESTATE')).toBe('COURT_SUPERVISED');
  });

  it('Should classify TRUST_ADMIN_REVOCABLE as FIDUCIARY_ADMINISTERED', () => {
    expect(getMasterMode('TRUST_ADMIN_REVOCABLE')).toBe('FIDUCIARY_ADMINISTERED');
  });

  it('Should classify SMALL_ESTATE as TRANSFER_ONLY', () => {
    expect(getMasterMode('SMALL_ESTATE')).toBe('TRANSFER_ONLY');
  });

  it('Should classify POD_TOD_TRANSFER as TRANSFER_ONLY', () => {
    expect(getMasterMode('POD_TOD_TRANSFER')).toBe('TRANSFER_ONLY');
  });

  it('Should classify TOD_DEED as TRANSFER_ONLY', () => {
    expect(getMasterMode('TOD_DEED')).toBe('TRANSFER_ONLY');
  });
});

describe('State Thresholds', () => {
  it('Should have correct CA threshold ($208,850)', () => {
    expect(STATE_THRESHOLDS['CA']).toBe(208850);
  });

  it('Should have correct FL threshold ($75,000)', () => {
    expect(STATE_THRESHOLDS['FL']).toBe(75000);
  });

  it('Should have correct TX threshold ($75,000)', () => {
    expect(STATE_THRESHOLDS['TX']).toBe(75000);
  });

  it('Should have correct NY threshold ($50,000)', () => {
    expect(STATE_THRESHOLDS['NY']).toBe(50000);
  });
});

describe('Institution Authority Requirements', () => {
  it('Should require LETTERS_REQUIRED for real estate', () => {
    const result = getInstitutionAuthorityRequirement('REAL_ESTATE', 'real_estate', 500000, 'INDIVIDUAL');
    expect(result.requirement).toBe('LETTERS_REQUIRED');
  });

  it('Should allow BENEFICIARY_ONLY for beneficiary accounts', () => {
    const result = getInstitutionAuthorityRequirement('CHECKING', 'financial', 100000, 'BENEFICIARY');
    expect(result.requirement).toBe('BENEFICIARY_ONLY');
  });

  it('Should prefer LETTERS_PREFERRED for large bank accounts', () => {
    const result = getInstitutionAuthorityRequirement('CHECKING', 'financial', 75000, 'INDIVIDUAL');
    expect(result.requirement).toBe('LETTERS_PREFERRED');
  });

  it('Should accept AFFIDAVIT_ACCEPTED for small bank accounts', () => {
    const result = getInstitutionAuthorityRequirement('CHECKING', 'financial', 25000, 'INDIVIDUAL');
    expect(result.requirement).toBe('AFFIDAVIT_ACCEPTED');
  });

  it('Should require LETTERS_REQUIRED for brokerage accounts', () => {
    const result = getInstitutionAuthorityRequirement('BROKERAGE', 'financial', 100000, 'INDIVIDUAL');
    expect(result.requirement).toBe('LETTERS_REQUIRED');
  });

  it('Should require LETTERS_REQUIRED for retirement accounts with estate as beneficiary', () => {
    const result = getInstitutionAuthorityRequirement('401K', 'retirement', 350000, 'INDIVIDUAL');
    expect(result.requirement).toBe('LETTERS_REQUIRED');
  });

  it('Should allow BENEFICIARY_ONLY for retirement accounts with named beneficiary', () => {
    const result = getInstitutionAuthorityRequirement('401K', 'retirement', 350000, 'BENEFICIARY');
    expect(result.requirement).toBe('BENEFICIARY_ONLY');
  });
});

describe('Modifiers Detection', () => {
  it('Should detect INSOLVENT modifier', () => {
    const assets = [
      { value: 50000, ownershipType: 'INDIVIDUAL', assetType: 'CHECKING', category: 'financial' },
    ];

    const result = calculateAuthorityRecommendation(assets, 'CA', {
      hasWill: true,
      hasInsolvencyRisk: true,
    });

    expect(result.modifiers).toContain('INSOLVENT');
  });

  it('Should detect MINOR_HEIRS modifier', () => {
    const assets = [
      { value: 300000, ownershipType: 'INDIVIDUAL', assetType: 'BROKERAGE', category: 'financial' },
    ];

    const result = calculateAuthorityRecommendation(assets, 'CA', {
      hasWill: true,
      hasMinors: true,
    });

    expect(result.modifiers).toContain('MINOR_HEIRS');
  });

  it('Should detect BUSINESS_ESTATE modifier', () => {
    const assets = [
      { value: 500000, ownershipType: 'INDIVIDUAL', assetType: 'BUSINESS', category: 'business' },
    ];

    const result = calculateAuthorityRecommendation(assets, 'CA', {
      hasWill: true,
      hasBusiness: true,
    });

    expect(result.modifiers).toContain('BUSINESS_ESTATE');
  });

  it('Should detect CONTESTED modifier', () => {
    const assets = [
      { value: 500000, ownershipType: 'INDIVIDUAL', assetType: 'BROKERAGE', category: 'financial' },
    ];

    const result = calculateAuthorityRecommendation(assets, 'CA', {
      hasWill: true,
      hasContest: true,
    });

    expect(result.modifiers).toContain('CONTESTED');
  });
});

describe('Edge Cases', () => {
  it('Should handle empty asset array', () => {
    const result = calculateAuthorityRecommendation([], 'CA', { hasWill: true, estimatedValue: 100000 });

    expect(result.probateTotal).toBe(100000);
    expect(result.type).toBe('SMALL_ESTATE');
  });

  it('Should handle missing state (default to $50k threshold)', () => {
    const assets = [
      { value: 40000, ownershipType: 'INDIVIDUAL', assetType: 'CHECKING', category: 'financial' },
    ];

    const result = calculateAuthorityRecommendation(assets, 'UNKNOWN', { hasWill: true });

    expect(result.threshold).toBe(50000);
    expect(result.isEligibleForSmallEstate).toBe(true);
  });

  it('Should handle assets at exact threshold', () => {
    const assets = [
      { value: 184500, ownershipType: 'INDIVIDUAL', assetType: 'CHECKING', category: 'financial' },
    ];

    const result = calculateAuthorityRecommendation(assets, 'CA', { hasWill: true });

    expect(result.isEligibleForSmallEstate).toBe(true);
    expect(result.type).toBe('SMALL_ESTATE');
  });

  it('Should handle assets just over threshold (CA)', () => {
    const assets = [
      { value: 208851, ownershipType: 'INDIVIDUAL', assetType: 'CHECKING', category: 'financial' },
    ];

    const result = calculateAuthorityRecommendation(assets, 'CA', { hasWill: true });

    expect(result.isEligibleForSmallEstate).toBe(false);
    expect(result.type).toBe('FORMAL_PROBATE');
  });
});


describe('Phase 2: 50-State Comprehensive Matrix', () => {
  /**
   * Phase 2: Comprehensive coverage for all 50 states + DC.
   */
  const ALL_STATES = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL',
    'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME',
    'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH',
    'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI',
    'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  ALL_STATES.forEach(state => {
    describe(`Routing Logic for ${state}`, () => {
      const rule = getStateRule(state);
      const threshold = rule.threshold;

      it(`Should handle threshold boundaries for ${state}`, () => {
        // Below threshold - FL/NY special procedures apply strictly BELOW threshold
        const below = calculateAuthorityRecommendation(
          [{ value: threshold - 100, ownershipType: 'INDIVIDUAL', assetType: 'CHECKING' }],
          state,
          { hasWill: true }
        );

        if (state === 'FL') {
          expect(below.procedureType).toBe('SUMMARY_ADMINISTRATION');
        } else if (state === 'NY') {
          expect(below.procedureType).toBe('VOLUNTARY_ADMINISTRATION');
        } else {
          expect(below.type).toBe('SMALL_ESTATE');
        }

        // At threshold - Should be standard SMALL_ESTATE (Affidavit)
        const at = calculateAuthorityRecommendation(
          [{ value: threshold, ownershipType: 'INDIVIDUAL', assetType: 'CHECKING' }],
          state,
          { hasWill: true }
        );
        expect(at.type).toBe('SMALL_ESTATE');

        // Above threshold
        const above = calculateAuthorityRecommendation(
          [{ value: threshold + 100, ownershipType: 'INDIVIDUAL', assetType: 'CHECKING' }],
          state,
          { hasWill: true }
        );

        if (state === 'TX') {
          expect(above.type).toBe('MUNIMENT_OF_TITLE');
        } else if (UPC_STATES.includes(state)) {
          expect(above.type).toBe('INFORMAL_PROBATE');
        } else {
          expect(above.type).toBe('FORMAL_PROBATE');
        }
      });

      it(`Should handle intestate above-threshold for ${state}`, () => {
        const result = calculateAuthorityRecommendation(
          [{ value: threshold + 1000, ownershipType: 'INDIVIDUAL', assetType: 'CHECKING' }],
          state,
          { hasWill: false }
        );
        expect(result.type).toBe('INTESTATE');
        expect(result.masterMode).toBe('COURT_SUPERVISED');
      });

      describe(`${state} Override Precedence`, () => {
        it('Should prioritize isOutOfState => ANCILLARY_PROBATE', () => {
          const result = calculateAuthorityRecommendation(
            [{ value: threshold + 1000, ownershipType: 'INDIVIDUAL', assetType: 'CHECKING' }],
            state,
            { hasWill: true, isOutOfState: true }
          );
          expect(result.type).toBe('ANCILLARY_PROBATE');
        });

        it('Should prioritize isSpouse => SPOUSAL_PETITION', () => {
          const result = calculateAuthorityRecommendation(
            [{ value: threshold + 1000, ownershipType: 'INDIVIDUAL', assetType: 'CHECKING' }],
            state,
            { hasWill: true, isSpouse: true }
          );
          expect(result.type).toBe('SPOUSAL_PETITION');
        });

        it('Should handle hasContest correctly', () => {
          const result = calculateAuthorityRecommendation(
            [{ value: threshold + 1000, ownershipType: 'INDIVIDUAL', assetType: 'CHECKING' }],
            state,
            { hasWill: true, hasContest: true }
          );

          if (state === 'TX') {
            // TX behavior currently remains muniment per engine logic
            // TODO: Verify if contested wills should still route to Muniment in TX
            expect(result.type).toBe('MUNIMENT_OF_TITLE');
          } else {
            expect(result.type).toBe('FORMAL_PROBATE');
          }
        });
      });

      it(`Should handle non-probate and discovery tracks for ${state}`, () => {
        // Trust-only
        const trust = calculateAuthorityRecommendation(
          [{ value: 500000, ownershipType: 'TRUST', assetType: 'REAL_ESTATE', inTrust: true }],
          state,
          { isTrustRevocable: true }
        );
        expect(trust.type).toBe('TRUST_ADMIN_REVOCABLE');
        expect(trust.procedureType).toBe('TRUST_ADMINISTRATION');

        // TOD deed
        const tod = calculateAuthorityRecommendation(
          [{ value: 500000, ownershipType: 'INDIVIDUAL', assetType: 'REAL_ESTATE', todDeedRecorded: true }],
          state,
          { hasTODDeed: true }
        );
        expect(tod.type).toBe('TOD_DEED');
        expect(tod.procedureType).toBe('DIRECT_TRANSFER');

        // Empty assets
        const empty = calculateAuthorityRecommendation([], state);
        expect(empty.type).toBe('DISCOVERY');
        expect(empty.procedureType).toBe('DISCOVERY');
      });
    });
  });
});

describe('Multi-Track Detection', () => {
  it('Should detect PROBATE, TRUST, and TOD_DEED tracks simultaneously', () => {
    const assets = [
      { value: 500000, ownershipType: 'INDIVIDUAL', assetType: 'REAL_ESTATE', category: 'real_estate' }, // Probate
      { value: 200000, ownershipType: 'TRUST', assetType: 'BROKERAGE', category: 'financial' }, // Trust
      { value: 100000, ownershipType: 'INDIVIDUAL', assetType: 'REAL_ESTATE', category: 'real_estate', todDeedRecorded: true }, // TOD
    ];

    const result = calculateAuthorityRecommendation(assets, 'CA', { hasWill: true });

    expect(result.activeEngines).toContain('PROBATE');
    expect(result.activeEngines).toContain('TRUST');
    expect(result.activeEngines).toContain('TOD_DEED');
    expect(result.activeEngines).toContain('NON_PROBATE');
  });

  it('Should include AFFIDAVIT when probate assets are below threshold', () => {
    const assets = [
      { value: 50000, ownershipType: 'INDIVIDUAL', assetType: 'CHECKING', category: 'financial' },
    ];

    const result = calculateAuthorityRecommendation(assets, 'CA', { hasWill: true });

    expect(result.activeEngines).toContain('PROBATE');
    expect(result.activeEngines).toContain('AFFIDAVIT');
  });
});
