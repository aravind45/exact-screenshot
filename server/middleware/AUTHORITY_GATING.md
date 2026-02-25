# Authority Gating System

## Overview

The Authority Gating System provides a comprehensive backend mechanism for enforcing legal authority requirements on estate operations. It ensures that users can only perform actions they are legally authorized to perform based on their estate's current authority status and type.

## Core Concepts

### Authority Status Lifecycle

```
NOT_STARTED → PENDING_FILING → PENDING_HEARING → PENDING_LETTERS → GRANTED
                                                    ↓
                                              LIMITED_GRANTED
                                                    ↓
                                              EXPIRED / REVOKED
```

| Status | Description |
|--------|-------------|
| `NOT_STARTED` | Initial state, no authority established |
| `PENDING_FILING` | Forms prepared, waiting for court filing |
| `PENDING_HEARING` | Filed, waiting for court hearing |
| `PENDING_LETTERS` | Granted, waiting for Letters issuance |
| `GRANTED` | Full legal authority established |
| `LIMITED_GRANTED` | Limited authority (e.g., small estate affidavit) |
| `EXPIRED` | Authority has expired |
| `REVOKED` | Authority revoked by court |

### Authority Types

| Type | Description | Gates Available |
|------|-------------|-----------------|
| `FORMAL_PROBATE` | Court-supervised probate | All gates |
| `INFORMAL_PROBATE` | Streamlined probate (UPC states) | All gates |
| `SMALL_ESTATE` | Small estate affidavit | Limited gates |
| `SUMMARY_ADMINISTRATION` | Summary administration (FL) | Limited gates |
| `TRUST_ADMIN_*` | Trust administration | Asset/Distribution only |
| `POD_TOD_TRANSFER` | Non-probate transfer | Asset/Distribution only |
| `JOINT_TRANSFER` | Joint tenancy transfer | Asset/Distribution only |

### Gates

Gates represent functional areas that require specific authority levels:

| Gate | Required Status | Excluded Types | Description |
|------|----------------|----------------|-------------|
| `ASSET_INVENTORY` | All | None | Inventory and document assets |
| `ASSET_COLLECTION` | GRANTED, LIMITED_GRANTED | UNSET | Collect and take possession |
| `CREDITOR_CLAIMS` | GRANTED, LIMITED_GRANTED, PENDING_LETTERS | Non-probate | Handle creditor claims |
| `DISTRIBUTION` | GRANTED, LIMITED_GRANTED | UNSET, Pending | Distribute to beneficiaries |
| `REAL_ESTATE` | GRANTED, LIMITED_GRANTED | Small estates | Sell/transfer real property |
| `FINANCIAL_ACCOUNTS` | GRANTED, LIMITED_GRANTED | Pending | Access financial accounts |
| `LEGAL_ACTIONS` | GRANTED | Limited types | Take legal actions |
| `TAX_FILING` | PENDING_HEARING+ | UNSET | File estate tax returns |
| `FULL_ADMINISTRATION` | GRANTED | Small, Limited | Complete administration |

## Usage

### Basic Gate Check

```typescript
import { resolveEstateGates } from './middleware/authorityGating';

const resolution = await resolveEstateGates('estate-id');

if (resolution.gates.ASSET_COLLECTION.isOpen) {
    // Allow asset collection
}
```

### Operation Check

```typescript
import { checkOperationAllowed } from './middleware/authorityGating';

const check = await checkOperationAllowed('estate-id', 'assets:collect');

if (check.allowed) {
    // Perform operation
} else {
    // Return error with check.message
}
```

### Middleware Usage

```typescript
import { requireAuthorityStatus } from './middleware/authorityGating';

// Protect a route with operation check
router.post('/collect',
    requireEstateAccess,
    requireAuthorityStatus({
        operation: 'assets:collect',
        customMessage: 'Asset collection requires legal authority'
    }),
    assetController.collect
);

// Protect with specific gates
router.post('/distribute',
    requireEstateAccess,
    requireAuthorityStatus({
        gates: ['DISTRIBUTION', 'FULL_ADMINISTRATION']
    }),
    distributionController.execute
);

// Allow pending status
router.post('/preliminary',
    requireAuthorityStatus({
        gates: ['ASSET_INVENTORY'],
        allowPending: true
    }),
    controller.preliminary
);
```

### Service Usage

```typescript
import { EstateGatingService } from './services/estateGatingService';

// Get authority summary
const summary = await EstateGatingService.getAuthoritySummary('estate-id');
console.log(summary.canCollectAssets); // boolean
console.log(summary.nextSteps); // string[]

// Validate multiple operations
const checks = await EstateGatingService.validateOperations(
    'estate-id',
    ['assets:collect', 'distributions:execute']
);

// Check upgrade options
const upgrade = await EstateGatingService.canUpgradeAuthority('estate-id');
if (upgrade.canUpgrade) {
    // Show upgrade options to user
}
```

## Enforcement Matrix

The enforcement matrix maps operations to required gates:

```typescript
const ENFORCEMENT_MATRIX = {
    // Asset operations
    "assets:create": ["ASSET_INVENTORY"],
    "assets:update": ["ASSET_INVENTORY"],
    "assets:collect": ["ASSET_COLLECTION"],
    "assets:transfer": ["ASSET_COLLECTION", "FULL_ADMINISTRATION"],
    "assets:liquidate": ["ASSET_COLLECTION", "FULL_ADMINISTRATION"],

    // Financial operations
    "accounts:access": ["FINANCIAL_ACCOUNTS"],
    "accounts:withdraw": ["FINANCIAL_ACCOUNTS", "FULL_ADMINISTRATION"],
    "accounts:close": ["FINANCIAL_ACCOUNTS", "FULL_ADMINISTRATION"],

    // Real estate operations
    "realestate:sell": ["REAL_ESTATE", "FULL_ADMINISTRATION"],
    "realestate:transfer": ["REAL_ESTATE", "FULL_ADMINISTRATION"],

    // Creditor operations
    "creditors:pay": ["CREDITOR_CLAIMS", "FULL_ADMINISTRATION"],
    "creditors:reject": ["CREDITOR_CLAIMS", "FULL_ADMINISTRATION"],

    // Distribution operations
    "distributions:create": ["DISTRIBUTION"],
    "distributions:execute": ["DISTRIBUTION", "FULL_ADMINISTRATION"],

    // Legal operations
    "legal:sue": ["LEGAL_ACTIONS", "FULL_ADMINISTRATION"],
    "legal:settle": ["LEGAL_ACTIONS", "FULL_ADMINISTRATION"],

    // Tax operations
    "tax:file": ["TAX_FILING"],
    "tax:pay": ["TAX_FILING", "FULL_ADMINISTRATION"],

    // Administrative operations
    "estate:close": ["FULL_ADMINISTRATION"],
};
```

## API Endpoints

### Get Gate Status
```http
GET /api/estates/:estateId/gates
```

Returns the current status of all gates for an estate.

### Get Gate Resolution
```http
GET /api/estates/:estateId/gates/resolution
```

Returns detailed gate resolution with all check results.

### Get Authority Summary
```http
GET /api/estates/:estateId/authority/summary
```

Returns a human-readable summary of authority status and available actions.

### Check Operations
```http
POST /api/estates/:estateId/operations/check
Content-Type: application/json

{
    "operations": ["assets:collect", "distributions:execute"]
}
```

Validates multiple operations at once.

### Get Available Operations
```http
GET /api/estates/:estateId/operations/available
```

Returns all operations with their availability status.

### Get Upgrade Options
```http
GET /api/estates/:estateId/authority/upgrade-options
```

Returns available authority upgrade paths.

### Verify Gate Access
```http
POST /api/estates/:estateId/gates/:gate/verify
```

Verifies access to a specific gate (with audit logging).

## Response Format

### Gate Check Response
```json
{
    "estateId": "estate-123",
    "authorityStatus": "GRANTED",
    "authorityType": "FORMAL_PROBATE",
    "isFullyAuthorized": true,
    "gates": {
        "ASSET_COLLECTION": {
            "open": true,
            "message": "Authority requirements satisfied"
        },
        "REAL_ESTATE": {
            "open": true,
            "message": "Authority requirements satisfied"
        }
    },
    "availableOperations": ["assets:collect", "realestate:sell", "..."]
}
```

### Operation Check Response
```json
{
    "allowed": false,
    "requiredGates": ["ASSET_COLLECTION"],
    "blockedGates": ["ASSET_COLLECTION"],
    "message": "Asset collection requires legal authority to be granted",
    "currentStatus": "PENDING_FILING",
    "authorityType": "FORMAL_PROBATE"
}
```

## Error Responses

### 400 - Bad Request
```json
{
    "error": "Bad Request",
    "message": "Estate ID is required for authority check"
}
```

### 401 - Unauthorized
```json
{
    "error": "Unauthorized",
    "message": "Authentication required"
}
```

### 403 - Forbidden (Authority Required)
```json
{
    "error": "Authority Required",
    "message": "This operation requires full probate authority",
    "currentStatus": "PENDING_FILING",
    "authorityType": "FORMAL_PROBATE",
    "blockedGates": ["FULL_ADMINISTRATION"],
    "requiredGates": ["FULL_ADMINISTRATION"]
}
```

## Testing

Run the test suite:

```bash
# Run all authority gating tests
npm test -- src/tests/middleware/authorityGating.test.ts

# Run estate gating service tests
npm test -- src/tests/services/estateGatingService.test.ts

# Run with coverage
npm run test:coverage -- src/tests/middleware/authorityGating.test.ts
```

## Audit Logging

All gate access attempts are logged to the `settlementActivity` table:

- **Type**: `AUTHORITY_GATE`
- **Action**: `ACCESS_GRANTED` or `ACCESS_DENIED`
- **Notes**: Contains operation and gate information
- **Hash**: JSON metadata including timestamp

## Security Considerations

1. **Always use with authentication**: The middleware assumes `req.user` is populated
2. **Combine with estate access**: Use `requireEstateAccess` before authority checks
3. **Log all access attempts**: Audit trail is maintained automatically
4. **Graceful degradation**: Operations not in matrix are allowed by default
5. **Type safety**: All authority types and statuses are strongly typed

## Future Enhancements

- Time-based gate restrictions (e.g., creditor claim windows)
- Estate-specific custom gates
- Integration with state-specific rules
- Automated authority status transitions
- Gate override workflows with approval chains
