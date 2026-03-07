import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { determinePath, type UserAnswers } from '../../lib/pathEngine';

type WorkbookRow = {
  'TOD Deed': 'Yes' | 'No';
  'Contested': 'Yes' | 'No';
  'Will': 'Yes' | 'No';
  'Surviving Spouse': 'Yes' | 'No';
  'Trust Type': 'None' | 'Revocable' | 'Irrevocable';
  'Out of State Property': 'Yes' | 'No';
  'Debt Status': 'Solvent' | 'Insolvent';
  'Primary Path Outcome': string;
  'Complexity': 'Simple' | 'Medium' | 'Complex';
  'Approx Time': string;
};

const thisDir = dirname(fileURLToPath(import.meta.url));
const workbookJsonPath = resolve(thisDir, '../../../estate_roadmap_data.json');
const workbookRows = JSON.parse(readFileSync(workbookJsonPath, 'utf8')) as WorkbookRow[];

const outcomeToPathId: Record<string, string> = {
  'Contested Probate Litigation': 'CONTESTED_ESTATE',
  'Insolvent Estate Administration': 'INSOLVENT_ESTATE',
  'Trust Administration (Revocable Living Trust)': 'TRUST_ADMIN_REVOCABLE',
  'Irrevocable Trust Administration': 'TRUST_ADMIN_IRREVOCABLE',
  'Ancillary Probate Required': 'ANCILLARY_PROBATE',
  'General Probate Administration': 'FORMAL_PROBATE',
  'Intestate Probate': 'INTESTATE',
};

const GENERAL_PROBATE_PATHS = new Set([
  'FORMAL_PROBATE',
  'INFORMAL_PROBATE',
  'SMALL_ESTATE',
  'SPOUSAL_PETITION',
  'MUNIMENT_OF_TITLE',
]);

function toAnswers(row: WorkbookRow): UserAnswers {
  return {
    hasWill: row['Will'] === 'Yes' ? 'yes' : 'no',
    hasTrust: row['Trust Type'] !== 'None' ? 'yes' : 'no',
    trustType:
      row['Trust Type'] === 'Revocable'
        ? 'revocable'
        : row['Trust Type'] === 'Irrevocable'
          ? 'irrevocable'
          : 'none',
    hasTODDeed: row['TOD Deed'] === 'Yes' ? 'yes' : 'no',
    hasContest: row['Contested'] === 'Yes' ? 'yes' : 'no',
    isOutOfState: row['Out of State Property'] === 'Yes' ? 'yes' : 'no',
    isSpouse: row['Surviving Spouse'] === 'Yes' ? 'yes' : 'no',
    debtStatus: row['Debt Status'] === 'Insolvent' ? 'insolvent' : 'solvent',
  };
}

describe('Workbook Path Alignment (192 combinations)', () => {
  it('matches primary path outcome, complexity, and timeline for every row', () => {
    const mismatches: Array<{
      row: number;
      expectedOutcome: string;
      expectedPathId: string;
      actualPathId: string;
      expectedComplexity: string;
      actualComplexity: string;
      expectedTimeline: string;
      actualTimeline: string;
    }> = [];

    workbookRows.forEach((row, index) => {
      const result = determinePath(toAnswers(row), 'CA');
      const expectedPathId = outcomeToPathId[row['Primary Path Outcome']];

      const outcomeMatches =
        result.pathId === expectedPathId ||
        (row['Primary Path Outcome'] === 'General Probate Administration' && GENERAL_PROBATE_PATHS.has(result.pathId));

      const complexityMatches = result.complexity === row['Complexity'];
      const timelineMatches = result.timeline === row['Approx Time'];

      if (!outcomeMatches || !complexityMatches || !timelineMatches) {
        mismatches.push({
          row: index + 1,
          expectedOutcome: row['Primary Path Outcome'],
          expectedPathId,
          actualPathId: result.pathId,
          expectedComplexity: row['Complexity'],
          actualComplexity: result.complexity,
          expectedTimeline: row['Approx Time'],
          actualTimeline: result.timeline,
        });
      }
    });

    expect(mismatches).toEqual([]);
  });
});
