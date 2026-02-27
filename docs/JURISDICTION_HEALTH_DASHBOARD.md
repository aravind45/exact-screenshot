# Jurisdiction Health Dashboard

The Jurisdiction Health Dashboard provides administrators with a comprehensive view of roadmap compliance across all supported jurisdictions.

## Access

Navigate to: `/admin/jurisdiction-health`

Or click the "Jurisdiction Health" card on the main Admin Dashboard.

## Features

### 1. Overview Tab

Displays a grid of all jurisdictions with:
- **Health Score**: 0-100 score based on policy compliance
- **Status**: Healthy (90+), Degraded (70-89), or Critical (<70)
- **Violation Counts**: Critical, Warning, and Info level counts
- **Pending Overrides**: Number of county overrides awaiting approval
- **Trend**: Improving, Stable, or Declining (last 7 days)

Click any jurisdiction card to view detailed diagnostics.

### 2. Diagnostics Tab

Select a state to view:

#### Summary Panel
- Overall pass/fail status
- Health score with visual indicator
- Violation counts by severity

#### Violations List
Filterable and searchable list of all violations:
- Grouped by severity (Critical, Warning, Info)
- Filter by policy validator
- Search by task ID, message, or violation code
- Expand to see context and suggestions

#### Diagnostic History
Historical diagnostic runs for the state:
- Timestamp, health score, and status
- Click to view previous reports

### 3. Roadmap Preview Tab

Interactive roadmap preview for testing estate profiles:

#### Configuration Options
- **State**: Select from supported states
- **Authority Type**: Probate, Trust, or Both
- **County**: Optional county for county-specific overrides
- **Estate Value**: For small estate threshold checking
- **Characteristics**: Toggle various estate attributes

#### Preview Results
- Phase-by-phase task breakdown
- Task authority scope indicators
- Filtered vs total task count

Use this to verify roadmap behavior for specific estate configurations.

### 4. County Override Governance Tab

Manage county-specific task overrides:

#### Pending Review
Overrides awaiting admin approval:
- View override details
- See diff from original task
- Approve or reject with notes

#### All Overrides
Browse all overrides with filtering:
- Filter by state
- Filter by status (Draft, Pending, Approved, Rejected)
- Search by county or task ID

## Health Score Calculation

```
Health Score = 100
  - (CRITICAL violations × 20)
  - (WARNING violations × 5)
  - (INFO violations × 1)
  (minimum 0)
```

## Policy Validators

The dashboard uses the same policy validators as the CI harness:

1. **Cross-State Statute Leak**: Detects out-of-state citations
2. **Authority Leakage**: Prevents trust/probate module leakage
3. **Placeholder Integrity**: Validates no placeholder content
4. **State Blacklist**: Enforces state-specific prohibitions
5. **Structural Invariants**: Validates required elements

## API Endpoints

The dashboard consumes these admin API endpoints:

### GET /api/admin/jurisdictions/health
Returns health summaries for all jurisdictions.

### GET /api/admin/jurisdictions/:stateCode/diagnostics
Runs and returns diagnostics for a specific state.

### GET /api/admin/jurisdictions/:stateCode/history
Returns diagnostic history for a state.

### GET /api/admin/jurisdictions/:stateCode/trend
Returns health trend data (last N days).

### POST /api/admin/jurisdictions/preview-roadmap
Generates roadmap preview for an estate profile.

### POST /api/admin/jurisdictions/:stateCode/run-diagnostics
Manually triggers diagnostic run.

### County Override Endpoints
- `GET /api/admin/county-overrides/pending`
- `GET /api/admin/county-overrides`
- `POST /api/admin/county-overrides/:id/approve`
- `POST /api/admin/county-overrides/:id/reject`
- `GET /api/admin/county-overrides/:id/diff`

## Database Schema

### DiagnosticRun Table
Stores diagnostic execution history:
- `id`: UUID
- `stateCode`: State being diagnosed
- `overallStatus`: PASS or FAIL
- `healthScore`: Calculated score
- `criticalCount`, `warningCount`, `infoCount`: Violation counts
- `resultsJson`: Full diagnostic results
- `triggeredBy`: User or system that triggered
- `commitSha`, `branchName`: Git info (if CI)
- `durationMs`: Execution time
- `createdAt`: Timestamp

### CountyOverride Table (Updated)
Enhanced with approval workflow:
- `status`: DRAFT, PENDING_REVIEW, APPROVED, REJECTED
- `submittedBy`, `submittedAt`: Submitter info
- `reviewedBy`, `reviewedAt`: Reviewer info
- `reviewNotes`: Review comments

## Caching

Diagnostic results are cached for 5 minutes to improve performance. Cache is invalidated when:
- County overrides are approved/rejected
- Manual diagnostic run is triggered

## Troubleshooting

### "No data available"
- Run diagnostics manually via API or wait for scheduled run
- Check that DiagnosticRun table has records

### Health score seems wrong
- Click into diagnostics to see detailed violations
- Check if cache is stale (data > 5 minutes old)
- Manually re-run diagnostics

### County override not appearing
- Verify override has status PENDING_REVIEW
- Check filters on the overrides tab
- Verify database record exists

## Best Practices

1. **Review Critical Violations First**: These block CI merges
2. **Watch Trends**: Declining trends indicate regressions
3. **Approve Overrides Carefully**: Verify diff before approving
4. **Document Rejections**: Always provide rejection reasons
5. **Monitor Regularly**: Check dashboard weekly for issues
