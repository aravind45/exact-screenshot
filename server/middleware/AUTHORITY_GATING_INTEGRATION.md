# Authority Gating Integration Guide

This guide shows how to integrate the authority gating middleware with existing routes.

## Quick Start

### 1. Import the Middleware

```typescript
import { requireAuthorityStatus } from "../middleware/authorityGating.js";
```

### 2. Apply to Routes

```typescript
// Basic operation protection
router.post("/collect",
    requireEstateAccess,
    requireAuthorityStatus({
        operation: "assets:collect",
        customMessage: "Asset collection requires legal authority"
    }),
    handler
);

// Multiple gates
router.post("/distribute",
    requireEstateAccess,
    requireAuthorityStatus({
        gates: ["DISTRIBUTION", "FULL_ADMINISTRATION"]
    }),
    handler
);
```

## Route Integration Examples

### Asset Routes

```typescript
// server/routes/assetRoutes.ts

import { requireAuthorityStatus } from "../middleware/authorityGating.js";

// Asset inventory - always allowed
router.get("/", async (req, res) => { /* ... */ });
router.post("/", async (req, res) => { /* ... */ });

// Asset collection - requires authority
router.post("/:id/collect",
    requireAuthorityStatus({
        operation: "assets:collect",
        customMessage: "Asset collection requires legal authority to be granted"
    }),
    async (req, res) => { /* ... */ }
);

// Asset transfer - requires full administration
router.post("/:id/transfer",
    requireAuthorityStatus({
        operation: "assets:transfer",
        customMessage: "Asset transfer requires full probate authority"
    }),
    async (req, res) => { /* ... */ }
);

// Real estate sale - requires real estate gate
router.post("/:id/sell",
    requireAuthorityStatus({
        operation: "realestate:sell",
        customMessage: "Real estate sales require full probate authority"
    }),
    async (req, res) => { /* ... */ }
);
```

### Liability Routes

```typescript
// server/routes/liabilityRoutes.ts

import { requireAuthorityStatus } from "../middleware/authorityGating.js";

// View liabilities - always allowed
router.get("/", async (req, res) => { /* ... */ });

// Pay liability - requires creditor authority
router.put("/:id/pay",
    requireAuthorityStatus({
        operation: "creditors:pay",
        customMessage: "Paying creditors requires probate authority"
    }),
    async (req, res) => { /* ... */ }
);

// Settle liability - requires creditor authority
router.post("/:id/settle",
    requireAuthorityStatus({
        operation: "creditors:settle",
        customMessage: "Settling claims requires probate authority"
    }),
    async (req, res) => { /* ... */ }
);
```

### Distribution Routes

```typescript
// server/routes/distributionRoutes.ts (or in estateRoutes.ts)

import { requireAuthorityStatus } from "../middleware/authorityGating.js";

// Create distribution plan - requires distribution gate
router.post("/distributions",
    requireAuthorityStatus({
        operation: "distributions:create",
        customMessage: "Creating distributions requires legal authority"
    }),
    async (req, res) => { /* ... */ }
);

// Execute distribution - requires full authority
router.post("/distributions/:id/execute",
    requireAuthorityStatus({
        operation: "distributions:execute",
        customMessage: "Executing distributions requires granted legal authority"
    }),
    async (req, res) => { /* ... */ }
);

// Finalize distribution - requires full administration
router.post("/distributions/:id/finalize",
    requireAuthorityStatus({
        operation: "distributions:finalize",
        customMessage: "Finalizing distributions requires full probate authority"
    }),
    async (req, res) => { /* ... */ }
);
```

### Estate Routes

```typescript
// server/routes/estateRoutes.ts

import { requireAuthorityStatus } from "../middleware/authorityGating.js";

// Estate close - requires full administration
router.post("/my/close",
    requireAuthorityStatus({
        operation: "estate:close",
        customMessage: "Closing an estate requires full probate authority"
    }),
    async (req, res) => { /* ... */ }
);
```

## Client-Side Integration

### Checking Authority Before Action

```typescript
// Check if operation is allowed before showing UI
async function canPerformOperation(estateId: string, operation: string): Promise<boolean> {
    const response = await fetch(`/api/estates/${estateId}/operations/${operation}/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    });
    const result = await response.json();
    return result.allowed;
}

// Usage
const canCollect = await canPerformOperation(estateId, 'assets:collect');
if (!canCollect) {
    showAuthorityWarning();
}
```

### Getting Authority Summary

```typescript
async function getAuthoritySummary(estateId: string) {
    const response = await fetch(`/api/estates/${estateId}/authority/summary`);
    return await response.json();
}

// Usage
const summary = await getAuthoritySummary(estateId);
console.log(summary.canCollectAssets);  // boolean
console.log(summary.canDistribute);     // boolean
console.log(summary.nextSteps);         // string[]
```

### Getting Available Operations

```typescript
async function getAvailableOperations(estateId: string) {
    const response = await fetch(`/api/estates/${estateId}/operations/available`);
    const { allowed, blocked } = await response.json();
    return { allowed, blocked };
}

// Usage
const { allowed, blocked } = await getAvailableOperations(estateId);
// Enable/disable UI elements based on allowed operations
```

## UI Patterns

### Authority Status Badge

```tsx
function AuthorityStatusBadge({ estateId }: { estateId: string }) {
    const [summary, setSummary] = useState(null);

    useEffect(() => {
        getAuthoritySummary(estateId).then(setSummary);
    }, [estateId]);

    if (!summary) return null;

    const colors = {
        NOT_STARTED: 'gray',
        PENDING_FILING: 'yellow',
        PENDING_HEARING: 'orange',
        PENDING_LETTERS: 'blue',
        GRANTED: 'green',
        LIMITED_GRANTED: 'teal',
        EXPIRED: 'red',
        REVOKED: 'red'
    };

    return (
        <Badge color={colors[summary.authorityStatus]}>
            {summary.authorityStatus.replace('_', ' ')}
        </Badge>
    );
}
```

### Gated Action Button

```tsx
function GatedActionButton({
    operation,
    estateId,
    children,
    ...props
}: {
    operation: string;
    estateId: string;
    children: React.ReactNode;
}) {
    const [allowed, setAllowed] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        canPerformOperation(estateId, operation)
            .then(setAllowed)
            .finally(() => setLoading(false));
    }, [estateId, operation]);

    if (loading) return <Button disabled>Loading...</Button>;

    if (!allowed) {
        return (
            <Tooltip content="This action requires legal authority">
                <Button disabled {...props}>
                    {children}
                </Button>
            </Tooltip>
        );
    }

    return <Button {...props}>{children}</Button>;
}

// Usage
<GatedActionButton
    operation="assets:collect"
    estateId={estateId}
    onClick={handleCollect}
>
    Collect Asset
</GatedActionButton>
```

### Authority Gate Panel

```tsx
function AuthorityGatePanel({ estateId }: { estateId: string }) {
    const [gates, setGates] = useState(null);

    useEffect(() => {
        fetch(`/api/estates/${estateId}/gates`)
            .then(r => r.json())
            .then(setGates);
    }, [estateId]);

    if (!gates) return null;

    const gateIcons = {
        ASSET_INVENTORY: <Package />,
        ASSET_COLLECTION: <DollarSign />,
        CREDITOR_CLAIMS: <FileText />,
        DISTRIBUTION: <Share2 />,
        REAL_ESTATE: <Home />,
        FINANCIAL_ACCOUNTS: <CreditCard />,
        LEGAL_ACTIONS: <Scale />,
        TAX_FILING: <FileText />,
        FULL_ADMINISTRATION: <Shield />
    };

    return (
        <div className="gate-panel">
            <h3>Authority Gates</h3>
            {Object.entries(gates.gates).map(([gate, status]: [string, any]) => (
                <div
                    key={gate}
                    className={`gate-item ${status.open ? 'open' : 'closed'}`}
                >
                    {gateIcons[gate]}
                    <span>{gate.replace('_', ' ')}</span>
                    {status.open ? <Unlock /> : <Lock />}
                </div>
            ))}
        </div>
    );
}
```

## Testing Integration

### Mocking Authority in Tests

```typescript
// Mock estate with specific authority
const mockGrantedEstate = {
    id: 'estate-1',
    authorityStatus: 'GRANTED',
    authorityType: 'FORMAL_PROBATE'
};

const mockPendingEstate = {
    id: 'estate-1',
    authorityStatus: 'PENDING_FILING',
    authorityType: 'FORMAL_PROBATE'
};

// Test with different authority states
it('should allow collection with GRANTED authority', async () => {
    (prisma.estate.findUnique as any).mockResolvedValue(mockGrantedEstate);

    const response = await request(app)
        .post('/api/assets/123/collect')
        .set('Authorization', 'Bearer token');

    expect(response.status).toBe(200);
});

it('should block collection with PENDING authority', async () => {
    (prisma.estate.findUnique as any).mockResolvedValue(mockPendingEstate);

    const response = await request(app)
        .post('/api/assets/123/collect')
        .set('Authorization', 'Bearer token');

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Authority Required');
});
```

## Common Patterns

### Pattern 1: Read-Only vs Read-Write

```typescript
// Read operations - no gating
router.get("/assets", getAssetsHandler);
router.get("/assets/:id", getAssetHandler);

// Write operations - with gating
router.post("/assets",
    requireAuthorityStatus({ gates: ["ASSET_INVENTORY"] }),
    createAssetHandler
);

router.post("/assets/:id/collect",
    requireAuthorityStatus({ operation: "assets:collect" }),
    collectAssetHandler
);
```

### Pattern 2: Progressive Enhancement

```typescript
// Stage 1: Inventory (always allowed)
router.post("/assets", createAssetHandler);

// Stage 2: Collection (requires authority)
router.post("/assets/:id/collect",
    requireAuthorityStatus({ gates: ["ASSET_COLLECTION"] }),
    collectHandler
);

// Stage 3: Transfer (requires full authority)
router.post("/assets/:id/transfer",
    requireAuthorityStatus({ gates: ["FULL_ADMINISTRATION"] }),
    transferHandler
);
```

### Pattern 3: Authority-Specific Routes

```typescript
// Small estate affidavit route
router.post("/small-estate-affidavit",
    requireAuthorityStatus({
        gates: ["ASSET_COLLECTION"],
        allowPending: true
    }),
    smallEstateHandler
);

// Full probate route
router.post("/probate-petition",
    requireAuthorityStatus({
        gates: ["FULL_ADMINISTRATION"]
    }),
    probateHandler
);
```

## Troubleshooting

### Common Issues

1. **Gate always closed**
   - Check that estate has correct `authorityStatus` and `authorityType`
   - Verify the gate definition allows the current status/type combination

2. **Operation not in matrix**
   - Add the operation to `ENFORCEMENT_MATRIX`
   - Or use explicit `gates` parameter in middleware

3. **Middleware not blocking**
   - Ensure middleware is placed after `requireEstateAccess`
   - Check that `estateId` is in `req.params` or `req.estateId`

4. **Type errors**
   - Ensure you're using the correct `AuthorityStatus` and `AuthorityType` enums
   - Check that all imports are from the correct paths

## Migration Checklist

- [ ] Import `requireAuthorityStatus` middleware
- [ ] Identify routes that need gating
- [ ] Add middleware to protected routes
- [ ] Update client to check authority before actions
- [ ] Add UI indicators for blocked actions
- [ ] Test with different authority states
- [ ] Document any custom gates or operations added
