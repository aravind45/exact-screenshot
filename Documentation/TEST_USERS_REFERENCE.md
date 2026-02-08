# 21-Path Test Users Reference

**Created**: February 2, 2026  
**Purpose**: Test users for Estate 21-Path Acceptance Matrix  
**Password**: `Test123!` (all users)

---

## Quick Access Table

| Path ID | Email | Estate Type | Key Features | Test Focus |
|---------|-------|-------------|--------------|------------|
| **PTH-01** | pth01-probate@test.com | FORMAL_PROBATE | $500k estate, will, brokerage + real estate | Standard probate workflow |
| **PTH-02** | pth02-intestate@test.com | INTESTATE | $400k estate, no will | Heir determination |
| **PTH-03** | pth03-summary@test.com | SUMMARY_ADMINISTRATION | $60k FL estate | Simplified probate |
| **PTH-04** | pth04-ancillary@test.com | ANCILLARY_PROBATE | CA + AZ property | Multi-state overlay |
| **PTH-05** | pth05-muniment@test.com | MUNIMENT_OF_TITLE | TX real property only | TX shortcut |
| **PTH-06** | pth06-contested@test.com | CONTESTED_ESTATE | Will contest filed | Litigation overlay |
| **PTH-07** | pth07-trust-revocable@test.com | TRUST_ADMIN_REVOCABLE | $800k in trust | Trust administration |
| **PTH-08** | pth08-trust-irrevocable@test.com | TRUST_ADMIN_IRREVOCABLE | $1.2M irrevocable trust | Tax implications |
| **PTH-09** | pth09-pourover@test.com | POUR_OVER_WILL | Trust + probate + POD | Hybrid workflow |
| **PTH-10** | pth10-business@test.com | BUSINESS_ESTATE | LLC interest | Business valuation |
| **PTH-11** | pth11-insolvent@test.com | INSOLVENT_ESTATE | $50k assets, $120k debts | Priority enforcement |
| **PTH-12** | pth12-minor@test.com | ESTATE_WITH_MINORS | Minor beneficiary | Distribution locks |
| **PTH-13** | pth13-smallestate@test.com | SMALL_ESTATE | $120k CA estate | DE-310 affidavit |
| **PTH-14** | pth14-joint@test.com | JOINT_TRANSFER | Joint tenancy property | Survivorship transfer |
| **PTH-15** | pth15-podtod@test.com | POD_TOD_TRANSFER | POD/TOD accounts | Beneficiary claims |
| **PTH-16** | pth16-beneficiary@test.com | BENEFICIARY_DESIGNATED | Life insurance + 401k | Beneficiary claims |
| **PTH-17** | pth17-toddeed@test.com | TOD_DEED | TOD deed property | County recording |
| **PTH-18** | pth18-unclaimed@test.com | FORMAL_PROBATE | Unclaimed property found | State registry |
| **PTH-19** | pth19-escheat@test.com | FORMAL_PROBATE | Dormant account | Escheat risk |
| **PTH-20** | pth20-elective@test.com | FORMAL_PROBATE | Spousal election | Distribution lock |
| **PTH-21** | pth21-unknownheirs@test.com | INTESTATE | Unknown heirs | Genealogical search |

---

## Testing Scenarios by Category

### Court-Supervised Paths (Test Authority & Phase Locking)

**Basic Probate**:
- PTH-01: Standard probate with will
- PTH-02: Intestate probate (no will)

**Simplified Court**:
- PTH-03: FL summary administration
- PTH-05: TX muniment of title

**Complex Court**:
- PTH-04: Ancillary probate (multi-state)
- PTH-06: Contested estate (litigation)
- PTH-20: Spousal election
- PTH-21: Unknown heirs

**Hybrid**:
- PTH-09: Pour-over (trust + probate)

---

### Fiduciary-Administered Paths (Test Trust & Overlays)

**Trust Administration**:
- PTH-07: Revocable trust
- PTH-08: Irrevocable trust (tax implications)

**Overlays**:
- PTH-10: Business estate (valuation required)
- PTH-11: Insolvent estate (priority enforcement)
- PTH-12: Minor beneficiaries (distribution locks)

---

### Transfer-Only Paths (Test Direct Transfers)

**Small Estate**:
- PTH-13: CA small estate affidavit

**Survivorship**:
- PTH-14: Joint tenancy transfer

**Beneficiary Designations**:
- PTH-15: POD/TOD accounts
- PTH-16: Life insurance + retirement
- PTH-17: TOD deed (real estate)

**Special Cases**:
- PTH-18: Unclaimed property
- PTH-19: Escheat risk

---

## How to Use

### 1. Run the Seed Script

```bash
# Install dependencies if needed
npm install

# Run the seed script
npx tsx scripts/seed-21-paths.ts
```

### 2. Login to Test

```
URL: http://localhost:5000 (or your deployment URL)
Email: pth[01-21]-[name]@test.com
Password: Test123!
```

### 3. Test Specific Paths

**Example: Test Full Probate (PTH-01)**
```
1. Login: pth01-probate@test.com / Test123!
2. Navigate to Dashboard
3. Check estate type: Should show "FORMAL PROBATE TRACK"
4. Navigate to Roadmap
5. Verify Phase 3 is locked (requires DE-150)
6. Navigate to Forms → Upload DE-150
7. Return to Roadmap → Phase 3 should unlock
8. Check assets: 3 assets (brokerage, checking, real estate)
```

**Example: Test Small Estate (PTH-13)**
```
1. Login: pth13-smallestate@test.com / Test123!
2. Navigate to Roadmap
3. Phase 2 should show "Prepare Small Estate Affidavit (DE-310)"
4. Should NOT show "File Petition (DE-111)"
5. Phase 3 locked until DE-310 uploaded
6. Check assets: 2 assets totaling $120k (under threshold)
```

**Example: Test Pour-Over Hybrid (PTH-09)**
```
1. Login: pth09-pourover@test.com / Test123!
2. Check assets: Should have 3 assets with different ownership types:
   - Trust home (TRUST)
   - Brokerage (INDIVIDUAL - requires probate)
   - Checking (BENEFICIARY - direct transfer)
3. Roadmap should handle mixed authority types
4. Test if system can distinguish which assets need probate
```

---

## Expected Test Results

### Paths That Should PASS ✅

- **PTH-01**: Full probate workflow, phase locking works
- **PTH-13**: Small estate affidavit, DE-310 tasks shown
- **PTH-14**: Joint tenancy, no authority required
- **PTH-15**: POD/TOD, direct transfer workflow
- **PTH-16**: Beneficiary designated, claim workflow

### Paths That Should Be PARTIAL ⚠️

- **PTH-02**: Intestate detected but no heir wizard
- **PTH-03**: Summary admin detected but not integrated
- **PTH-07**: Trust admin works but no trust-specific tasks
- **PTH-17**: TOD deed type exists but no specific workflow
- **PTH-21**: Heirs table exists but no search workflow

### Paths That Should FAIL ❌

- **PTH-04**: Ancillary probate - no overlay system
- **PTH-05**: Muniment - not implemented
- **PTH-06**: Contested - no litigation workflow
- **PTH-08**: Irrevocable trust - no differentiation
- **PTH-09**: Pour-over - no hybrid support
- **PTH-10**: Business - no valuation workflow
- **PTH-11**: Insolvent - priority engine not integrated
- **PTH-12**: Minor - no distribution locks
- **PTH-18**: Unclaimed - no workflow
- **PTH-19**: Escheat - no workflow
- **PTH-20**: Elective share - no workflow

---

## Testing Checklist

For each path, verify:

- [ ] **Path Detection**: Authority engine identifies correct type
- [ ] **Roadmap Adaptation**: Roadmap shows appropriate tasks
- [ ] **Form Gating**: Correct forms enabled/disabled
- [ ] **Phase Locking**: Appropriate phases locked/unlocked
- [ ] **Asset Display**: Assets show correct ownership types
- [ ] **Document Upload**: Can upload authority documents
- [ ] **Settlement Trail**: Events logged correctly

---

## Troubleshooting

### Users Not Created
```bash
# Check database connection
npx prisma db push

# Verify users
npx prisma studio
# Navigate to User table
```

### Can't Login
```bash
# Password hash needs to be generated
# Update the seed script with proper bcrypt hash
npm install bcryptjs
```

### Estate Not Showing
```bash
# Check estate creation
# Verify userId matches user.id
# Check estateType field
```

---

## Database Cleanup

To remove test users and start fresh:

```sql
-- Delete all test users and their estates
DELETE FROM "estates" WHERE "user_id" IN (
  SELECT id FROM "profiles" WHERE email LIKE 'pth%@test.com'
);

DELETE FROM "profiles" WHERE email LIKE 'pth%@test.com';
```

Or use Prisma:

```bash
npx prisma studio
# Manually delete test users
```

---

## Notes

- All test users have the same password: `Test123!`
- Estate dates are staggered to show different timelines
- Asset values are realistic for each path type
- Some paths have liabilities or heirs pre-configured
- All estates are in "active" state, ready for testing

---

**Last Updated**: February 2, 2026  
**Maintained By**: Development Team
