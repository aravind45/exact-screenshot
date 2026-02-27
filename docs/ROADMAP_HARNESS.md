# Roadmap Compliance Harness

The CI Roadmap Compliance Harness is a testing framework that validates roadmap data against governance policies to ensure quality and prevent policy violations from reaching production.

## Overview

The harness runs a series of policy validators against estate roadmaps for different states and estate profiles. It blocks merges on CRITICAL violations and reports all violations (CRITICAL, WARNING, INFO) for review.

## Running the Harness

### In CI/CD

The harness runs automatically on every pull request and push to main/develop branches via GitHub Actions:

```yaml
- name: Run roadmap compliance harness
  run: npm run test:roadmap-harness
```

### Locally

```bash
# Run once
npm run test:roadmap-harness

# Watch mode
npm run test:roadmap-harness:watch

# Update snapshots
npm run test:roadmap-harness:update
```

## Policy Validators

### 1. Cross-State Statute Leak (`crossStateStatuteLeak`)

Detects when a state's roadmap contains statute citations from other states.

**Severity:** CRITICAL

**Example violation:**
- Ohio roadmap containing "N.J.S.A." references
- California form references in Texas tasks

### 2. Authority Leakage (`authorityLeakage`)

Ensures PROBATE estates don't see TRUST tasks and vice versa.

**Severity:** CRITICAL for leakage, WARNING for terminology

**Checks:**
- Task authorityScope matches estate authorityType
- TRUST tasks don't contain probate terminology
- PROBATE tasks don't contain trust terminology

### 3. Placeholder Integrity (`placeholderIntegrity`)

Validates that no placeholder content exists in user-facing text.

**Severity:** CRITICAL for templates, WARNING for generic state refs

**Detects:**
- `{{ }}` template variables
- `TBD`, `TODO`, `FIXME`, `XXX` markers
- "varies by state", "depends on state" generic text

### 4. State Blacklist (`stateBlacklist`)

Enforces state-specific prohibitions on tasks and terms.

**Severity:** CRITICAL for forbidden terms, WARNING for missing expected concepts

**Example:**
- Ohio shouldn't have "Spousal Property Petition" (California-specific)
- Texas shouldn't have "Release from Administration" (Ohio-specific)

### 5. Structural Invariants (`structuralInvariants`)

Validates required structural elements in roadmaps.

**Severity:** CRITICAL for orphans/duplicates, WARNING for missing categories

**Checks:**
- Real property tasks when estate has real property
- Small estate citations when applicable
- No orphaned dependencies
- No duplicate task IDs
- Proper task ordering

## Fixtures

Test fixtures are located in `tests/roadmap_harness/fixtures/` and define estate profiles:

```json
{
  "id": "ohio_probate_real",
  "name": "Ohio Probate Estate with Real Property",
  "stateCode": "OH",
  "county": "Franklin",
  "authorityType": "PROBATE",
  "hasRealProperty": true,
  "estateValue": 250000,
  "hasWill": true,
  "characteristics": {
    "isSmallEstate": false,
    "hasMinorBeneficiaries": false,
    "hasContest": false
  }
}
```

### Available Fixtures

| Fixture | State | Authority | Real Property |
|---------|-------|-----------|---------------|
| ohio_probate_real | OH | PROBATE | Yes |
| ohio_probate_no_real | OH | PROBATE | No |
| ohio_trust | OH | TRUST | Yes |
| ca_probate_real | CA | PROBATE | Yes |
| ca_probate_no_real | CA | PROBATE | No |
| ca_trust | CA | TRUST | Yes |
| ny_probate_real | NY | PROBATE | Yes |
| ny_probate_no_real | NY | PROBATE | No |
| ny_trust | NY | TRUST | Yes |
| tx_probate_real | TX | PROBATE | Yes |
| tx_probate_no_real | TX | PROBATE | No |
| tx_trust | TX | TRUST | Yes |
| fl_probate_real | FL | PROBATE | Yes |
| fl_probate_no_real | FL | PROBATE | No |
| fl_trust | FL | TRUST | Yes |

## Snapshots

The harness uses snapshots to track roadmap changes over time. Snapshots are stored in `tests/roadmap_harness/snapshots/`.

### Snapshot Format

```json
{
  "profileId": "ohio_probate_real",
  "stateCode": "OH",
  "authorityType": "PROBATE",
  "tasks": [...],
  "taskCount": 42,
  "phaseCount": 6,
  "hash": "abc123...",
  "generatedAt": "2024-01-15T10:30:00Z",
  "version": "1.0.0"
}
```

### Updating Snapshots

When intentional roadmap changes are made:

```bash
npm run test:roadmap-harness:update
```

Review the changes before committing updated snapshots.

## Health Score

The harness calculates a health score (0-100) for each jurisdiction:

- Start at 100
- Deduct 20 points per CRITICAL violation
- Deduct 5 points per WARNING violation  
- Deduct 1 point per INFO violation
- Floor at 0

**Thresholds:**
- 90-100: Healthy
- 70-89: Degraded
- 0-69: Critical

## CI Integration

### GitHub Actions Annotations

The harness outputs GitHub Actions annotations for violations:

```
::error title=FORBIDDEN_TERM::ohio_probate_real: Task "X" contains blacklisted term "Y"
::warning title=MISSING_EXPECTED_CONCEPT::ca_probate_real: Expected concept "Z" not found
```

### Blocking Merges

The harness fails the build if any CRITICAL violations are found:

```
❌ 3 CRITICAL violations found:
  [ohio_probate_real] Task "X" contains NJ statute citation
  [ca_probate_real] Task "Y" has undefined authorityScope
  [ny_trust] Missing required category task
```

## Adding New Policies

1. Create a new validator in `src/jurisdiction/diagnostics/policies/`
2. Export it from `src/jurisdiction/diagnostics/index.ts`
3. Add to `ALL_POLICY_VALIDATORS` array
4. Add to `POLICY_NAMES` const

Example:

```typescript
export function validateMyPolicy(
  stateCode: string,
  estateProfile: EstateProfile,
  tasks: DiagnosticTask[]
): DiagnosticResult {
  const violations: Violation[] = [];
  
  // Validation logic here
  
  return {
    passed: violations.length === 0,
    policyName: 'myPolicy',
    violations,
    severityCounts: { CRITICAL: 0, WARNING: 0, INFO: 0 },
    executionTimeMs: 0,
    timestamp: new Date().toISOString(),
  };
}
```

## Troubleshooting

### "No blacklist configuration found for state X"

This INFO-level message indicates the state doesn't have custom blacklist rules yet. Add configuration to `STATE_BLACKLISTS` in `stateBlacklist.ts`.

### Health score unexpectedly low

Check for:
1. Placeholder content in tasks
2. Cross-state statute citations
3. Missing authorityScope properties
4. Orphaned dependencies

### Snapshot mismatch

If snapshots differ from expected:
1. Review the diff output
2. If changes are intentional: `npm run test:roadmap-harness:update`
3. If changes are unintentional: fix the underlying issue
