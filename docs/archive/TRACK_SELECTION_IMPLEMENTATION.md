# Track Selection Onboarding + Confidence-Based Authority Classification - Implementation Summary

## Overview

This implementation adds explicit track selection onboarding with confidence-based authority classification and fail-closed defaults to prevent accidental BOTH roadmaps.

---

## Changes Made

### 1. Database Schema (`prisma/schema.prisma`)

Added 7 new fields to the `Estate` model for track selection governance:

- `userSelectedEstateAuthorityType` - User's explicit selection (PROBATE | TRUST | BOTH)
- `userSelectedAuthorityAt` - When user made selection
- `hasProbateAssets` - User answer: has probate assets
- `hasTrustAssets` - User answer: has trust assets
- `hasBeneficiaryAssets` - User answer: has POD/TOD/beneficiary assets
- `assistedDecisionAnswers` - Store "help me decide" question answers
- `authorityConfidenceScore` - 0-100 confidence score
- `authorityDeterminationSource` - "USER_SELECTION" | "ENGINE_HIGH_CONFIDENCE" | "ENGINE_LOW_CONFIDENCE" | "DEFAULT_FAIL_CLOSED"

**Note:** Migration needs to be applied: `npx prisma migrate dev --name add_track_selection_fields`

---

### 2. Authority Engine Enhancements (`src/lib/authorityEngine.ts`)

#### a. Updated `deriveEstateAuthorityType` Function
Added fail-closed default option:
```typescript
export function deriveEstateAuthorityType(
  activeEngines: string[],
  options?: { failClosedDefault?: "PROBATE" | "BOTH" }
): EstateAuthorityType
```

**Behavior:**
- If TRUST only → "TRUST"
- If PROBATE only → "PROBATE"
- If both → "BOTH"
- If neither → defaults to "PROBATE" (fail-closed, not BOTH)

#### b. Added Confidence Scoring

**New Interface:**
```typescript
export interface ConfidenceSignals {
  probateAssetsPresent: boolean;
  trustAssetsPresent: boolean;
  beneficiaryAssetsPresent: boolean;
  hasWill?: boolean;
  isTrustRevocable?: boolean;
  hasProbateTotal: boolean;
  assetCount: number;
  totalAssetValue: number;
}
```

**New Function:**
```typescript
function calculateAuthorityConfidence(
  assets: any[],
  probateTotal: number,
  metadata?: { hasWill?, isTrustRevocable?, ... }
): { confidence: number; confidenceSignals: ConfidenceSignals }
```

**Scoring Logic:**
- **Asset presence signals (40 points max):**
  - Probate assets: 20 points
  - Trust assets: 20 points
- **Will/trust information (30 points max):**
  - Has will defined: 15 points
  - Trust revocability defined: 15 points
- **Beneficiary assets (10 points max):**
  - Beneficiary assets present: 10 points
- **Total value confirmation (20 points max):**
  - Total asset value > 0: 20 points

**Result:** Normalized confidence score 0-100

**Updated `AuthorityRecommendation` interface:**
```typescript
export interface AuthorityRecommendation {
  // ... existing fields ...
  confidence?: number;           // 0-100 confidence score
  confidenceSignals?: ConfidenceSignals;
}
```

#### c. Updated `calculateAuthorityRecommendation` Function
Now returns confidence score and signals:
```typescript
const { confidence, confidenceSignals } = calculateAuthorityConfidence(assets, probateTotal, metadata);
return {
  // ... existing fields ...
  confidence,
  confidenceSignals,
};
```

---

### 3. Effective Authority Governance (`server/services/roadmapService.ts`)

#### a. New Interface: `EffectiveAuthorityResult`
```typescript
export interface EffectiveAuthorityResult {
  estateAuthorityType: EstateAuthorityType;
  confidence: number;
  source: "USER_SELECTION" | "ENGINE_HIGH_CONFIDENCE" | "ENGINE_LOW_CONFIDENCE" | "DEFAULT_FAIL_CLOSED";
  recommendation: string;
  userSelection?: EstateAuthorityType;
  confidenceSignals?: any;
}
```

#### b. New Function: `determineEffectiveAuthority`

**Priority Layers (Highest to Lowest):**
1. **User Selection** (100% confidence) - User explicitly selected track
2. **Engine High Confidence** (>= 70) - Clear signals present
3. **Engine Low Confidence** (< 70) - Some signals present
4. **Fail-Closed Default** - No signals, default to PROBATE (not BOTH)

```typescript
export function determineEffectiveAuthority(
  estate: any,
  engineRec: any,
  confidence: number,
  confidenceSignals: any
): EffectiveAuthorityResult
```

#### c. Updated `EstateProfile` Interface
Added `effectiveAuthority?: EffectiveAuthorityResult` field.

#### d. Updated `RoadmapResponse` Interface
Added track selection governance fields:
```typescript
export interface RoadmapResponse {
  // ... existing fields ...
  // Track selection governance fields
  estateAuthorityType: EstateAuthorityType;
  authorityConfidence: number;
  authoritySource: string;
  authorityRecommendation: string;
  userSelectedAuthorityType?: EstateAuthorityType;
  requiresTrackSelection?: boolean; // Banner flag for DEFAULT_FAIL_CLOSED mode
}
```

#### e. Updated `analyzeEstateProfile` Function
- Computes confidence score
- Calls `determineEffectiveAuthority` with governance logic
- Stores result in `effectiveAuthority` field of profile

#### f. Updated `getEstateRoadmap` Function
- Extracts effective authority from profile
- Populates roadmap response with authority governance fields
- Sets `requiresTrackSelection` flag for low confidence cases

---

### 4. API Layer (`server/routes/estateRoutes.ts`)

Added new endpoint:

**POST /api/estates/:id/select-track**

**Request Body:**
```typescript
{
  estateAuthorityType: "PROBATE" | "TRUST" | "BOTH",
  hasProbateAssets?: boolean,
  hasTrustAssets?: boolean,
  hasBeneficiaryAssets?: boolean,
  assistedDecisionAnswers?: Record<string, unknown>,
}
```

**Response:**
```typescript
{
  success: true,
  estateId: string,
  selectedTrack: "PROBATE" | "TRUST" | "BOTH",
  selectedAt: DateTime,
}
```

**Features:**
- Validates user has estate access
- Validates request body with Zod schema
- Updates estate with track selection
- Logs activity for audit trail
- Returns 400 for invalid data, 500 for errors

---

### 5. UI Components (React/TypeScript)

#### a. Track Selection Step (`src/components/onboarding/TrackSelectionStep.tsx`)

**Purpose:** Main onboarding UI for track selection

**Features:**
- Three-card layout: PROBATE only, TRUST only, BOTH Mixed
- Visual icons and descriptions for each track
- Selection state management with visual feedback (ring, checkmark)
- "Help me decide" flow with yes/no questions
- Color coding (blue/green/purple)
- Feature list for each track type

**Props Interface:**
```typescript
interface TrackSelectionStepProps {
  onSelect: (selection: TrackSelection) => void;
  initialSelection?: 'PROBATE' | 'TRUST' | 'BOTH';
  loading?: boolean;
}
```

**Assisted Decision Questions:**
1. "Did the deceased have a will?" → suggests PROBATE
2. "Did the deceased have a living trust?" → suggests TRUST
3. "Are there assets owned personally (not in trust)?" → suggests BOTH if trust also present

#### b. Authority Banner (`src/components/roadmap/AuthorityBanner.tsx`)

**Purpose:** Contextual banners for different authority determination states

**Banner Types:**

1. **DEFAULT_FAIL_CLOSED** (amber/yellow)
   - Shows when confidence is low or missing
   - Explains defaulting to PROBATE for safety
   - CTA to complete track selection
   - Confidence score display

2. **ENGINE_LOW_CONFIDENCE** (yellow)
   - Shows when confidence is moderate (50-69%)
   - Recommends adding more asset details
   - CTA to review track selection

3. **ENGINE_HIGH_CONFIDENCE** (green)
   - Informational only - shows high confidence (>70%)
   - Confirms roadmap is based on clear signals

4. **BOTH mode** (purple)
   - Explains mixed estate with both probate and trust
   - Lists what each track covers

5. **USER_SELECTION** (blue)
   - Confirmation banner showing locked track
   - Displays user's explicit selection

**Props Interface:**
```typescript
interface AuthorityBannerProps {
  estateAuthorityType: 'PROBATE' | 'TRUST' | 'BOTH';
  authoritySource: "USER_SELECTION" | "ENGINE_HIGH_CONFIDENCE" | "ENGINE_LOW_CONFIDENCE" | "DEFAULT_FAIL_CLOSED";
  confidence: number;
  userSelectedAuthorityType?: 'PROBATE' | 'TRUST' | 'BOTH';
  onCompleteTrackSelection?: () => void;
}
```

#### c. Track Tag (`src/components/roadmap/TrackTag.tsx`)

**Purpose:** Visual tag showing track assignment (PROBATE, TRUST, or BOTH)

**Features:**
- Color coding (blue/green/purple)
- Size variants (sm, md, lg)
- Optional label text
- Dual-dot icon for BOTH mode
- Tooltip with track description

**Props Interface:**
```typescript
interface TrackTagProps {
  authorityScope?: 'PROBATE' | 'TRUST' | 'BOTH';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}
```

**Convenience Exports:**
- `<ProbateTag />`
- `<TrustTag />`
- `<BothTag />`

---

### 6. Test Implementation (`src/tests/authority/track-selection.test.ts`)

**Purpose:** Comprehensive test suite for track selection and confidence scoring

**Test Suites:**

#### a. Missing Signals → PROBATE (not BOTH)
- Default to PROBATE when no assets entered
- Default to PROBATE when asset ownership is unknown
- Use fail-closed PROBATE default for empty signals

#### b. Confidence Scoring
- High confidence (>70) with clear signals
- Low confidence (<50) with missing signals
- Moderate confidence (50-69) with partial signals
- Track probate assets presence
- Track trust assets presence

#### c. User Selection Overrides Weak Signals
- Use USER_SELECTION when provided (via governance layer)
- Ignore engine recommendation when user has explicitly selected

#### d. Assisted Decision Accuracy
- Recommend TRUST for trust=yes, will=no
- Recommend PROBATE for will=yes, trust=no
- Recommend BOTH for will=yes, trust=yes, personalAssets=yes

#### e. Pinning Stability
- Store confidence score with pinning
- Flag low confidence cases

#### f. WA Regression
- Correctly classify WA estates with only probate assets
- Correctly classify WA estates with only trust assets
- NOT default to BOTH for WA probate-only estates
- NOT incorrectly activate TRUST engine when isTrustRevocable=false

#### g. Edge Cases
- Handle undefined isTrustRevocable correctly
- Handle zero-value assets
- Handle beneficiary assets correctly

---

## Governance Flow

### Determination Priority (Highest to Lowest)

1. **USER_SELECTION**
   - User explicitly selects track
   - Confidence: 100%
   - Overrides engine recommendation
   - Stored in `userSelectedEstateAuthorityType`

2. **ENGINE_HIGH_CONFIDENCE**
   - Confidence >= 70%
   - Clear signals present (assets, will, trust info)
   - Automatic recommendation accepted

3. **ENGINE_LOW_CONFIDENCE**
   - Confidence < 70% but > 0%
   - Some signals present
   - Shows recommendation banner
   - Allows user to review/change

4. **DEFAULT_FAIL_CLOSED**
   - Confidence = 0% or very low
   - No clear signals
   - Defaults to PROBATE (safer than BOTH)
   - Shows prominent banner requiring action

---

## Fail-Closed Design Principles

### 1. No Accidental BOTH Roadmaps
- Empty signals → PROBATE (not BOTH)
- Unknown signals → PROBATE (not BOTH)
- Low confidence → PROBATE (not BOTH)
- Explicit user selection required for BOTH

### 2. Module Leakage Prevention
- `filterPhasesByAuthorityScope` already implements fail-closed filtering
- Tasks without matching `authorityScope` are dropped
- Both tracks only shown when explicitly needed

### 3. Backward Compatibility
- All new DB fields are nullable
- Estates without new fields continue working with engine-based recommendations
- Confidence scoring returns 0 for missing data
- UI components handle undefined states gracefully

---

## Integration Points

### 1. Onboarding Flow
```
User creates estate
  ↓
TrackSelectionStep displayed
  ↓
User selects track OR uses "Help me decide"
  ↓
POST /api/estates/:id/select-track
  ↓
Roadmap generated with effective authority
  ↓
AuthorityBanner shows appropriate message
```

### 2. Roadmap Display
```
GET /api/estates/:id/roadmap
  ↓
analyzeEstateProfile called
  ↓
determineEffectiveAuthority computes governance
  ↓
RoadmapResponse includes:
  - estateAuthorityType
  - authorityConfidence
  - authoritySource
  - authorityRecommendation
  - userSelectedAuthorityType
  - requiresTrackSelection (banner flag)
  ↓
Client renders AuthorityBanner + tasks with TrackTags
```

### 3. Authority Change (Pinning)
```
User adds/changes assets
  ↓
Confidence recalculated
  ↓
If pinned: Check if recommendation changed
  ↓
If changed: Set authorityChangePending = true
  ↓
Show warning in UI
  ↓
User can repin with explicit confirmation
```

---

## Migration Notes

### Database Migration Required

```bash
npx prisma migrate dev --name add_track_selection_fields
```

**Note:** There may be a Prisma v7 compatibility issue with `url` in datasource. The migration can be applied once the DATABASE_URL configuration is updated for Prisma 7.

### Client-Side Migration

Existing estates will continue working:
- Engine-based recommendations still active
- Old roadmaps use existing authorityType
- New fields default to null
- Banners shown for DEFAULT_FAIL_CLOSED mode
- Users can complete track selection at any time

---

## Testing Strategy

### Unit Tests
- Confidence scoring logic
- Fail-closed defaults
- User selection overrides
- Assisted decision accuracy

### Integration Tests
- Track selection API endpoint
- Roadmap service governance
- Authority pinning stability

### Regression Tests
- WA probate-only estates (no BOTH)
- Trust revocability checks
- Module leakage prevention

### E2E Tests (Playwright)
- Complete onboarding flow
- Track selection submission
- Banner display and interaction
- Roadmap generation with correct tasks

---

## Key Benefits

1. **Prevents Accidental BOTH Roadmaps**
   - Fail-closed defaults to PROBATE
   - Explicit selection required for BOTH mode
   - High confidence threshold (70%)

2. **User Control**
   - Explicit track selection overrides engine
   - "Help me decide" wizard for guidance
   - Can change selection later

3. **Transparency**
   - Confidence scores displayed
   - Authority source shown (USER_SELECTION, ENGINE_HIGH, etc.)
   - Banner explanations for each state

4. **Governance-Led**
   - Clear priority layers
   - Audit trail of all changes
   - Pinning stability with explicit repin workflow

5. **Fail-Closed Safety**
   - Default to safest option (PROBATE, not BOTH)
   - Tasks filtered by authorityScope
   - Module leakage prevented

---

## Files Changed

| File | Change Type | Lines Added |
|-------|-------------|-------------|
| `prisma/schema.prisma` | MODIFY | +8 fields |
| `src/lib/authorityEngine.ts` | MODIFY | +80 lines |
| `src/types/authorityScope.ts` | MODIFY | +3 lines (fail-closed option) |
| `server/services/roadmapService.ts` | MODIFY | +150 lines (governance functions) |
| `server/routes/estateRoutes.ts` | MODIFY | +75 lines (track selection endpoint) |
| `src/components/onboarding/TrackSelectionStep.tsx` | CREATE | +320 lines |
| `src/components/roadmap/AuthorityBanner.tsx` | CREATE | +200 lines |
| `src/components/roadmap/TrackTag.tsx` | CREATE | +65 lines |
| `src/tests/authority/track-selection.test.ts` | CREATE | +280 lines |

**Total:** ~1,200 lines of code added

---

## Next Steps for Deployment

1. **Database Migration**
   - Apply Prisma migration for new fields
   - Verify all estates migrate successfully

2. **UI Integration**
   - Add TrackSelectionStep to onboarding flow
   - Integrate AuthorityBanner into roadmap view
   - Add TrackTags to task list items

3. **Testing**
   - Run unit tests to verify confidence scoring
   - Run integration tests for API endpoints
   - Run E2E tests with Playwright
   - Verify WA regression tests pass

4. **Feature Flag (Optional)**
   - Initially enable for new estates only
   - Gradually migrate existing estates
   - Monitor for issues before full rollout

5. **Documentation**
   - Update user-facing documentation
   - Add API documentation for new endpoints
   - Document governance flow for developers

---

## Rollback Plan

If issues arise:

1. **Database**: Revert migration using `npx prisma migrate resolve --rolled-back <migration-name>`
2. **Backend**: Comment out effective authority logic, use existing engine directly
3. **Frontend**: Hide TrackSelectionStep, use existing onboarding
4. **API**: Comment out `/select-track` endpoint

---

## Success Criteria

✅ Database schema includes all track selection fields
✅ Confidence scoring function returns 0-100 score
✅ `deriveEstateAuthorityType` has fail-closed PROBATE default
✅ `determineEffectiveAuthority` implements priority layers
✅ Track selection API endpoint validates and stores selection
✅ Roadmap response includes authority governance fields
✅ AuthorityBanner shows for all authority sources
✅ TrackTag component for visual track display
✅ Test suite covers all scenarios including WA regression
✅ Backward compatibility maintained (null fields safe)
✅ Fail-closed defaults prevent accidental BOTH roadmaps
