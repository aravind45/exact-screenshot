# Settlement Type Test Users - Quick Reference

All test users created successfully! ✅

## Login Credentials

**Password for ALL users**: `Test123!`

## Test Users by Tier

### 🥇 Tier 1 (90% of estates) - Priority Testing

| Email | Settlement Type | Estate Value | Key Features |
|-------|----------------|--------------|--------------|
| formal@test.com | FORMAL_PROBATE | $500,000 | Standard probate with will |
| small@test.com | SMALL_ESTATE | $75,000 | Below CA threshold |
| trust@test.com | TRUST_ADMIN | $800,000 | Revocable trust |
| spousal@test.com | SPOUSAL_PETITION | $300,000 | Surviving spouse |

### 🥈 Tier 2 (10% of estates)

| Email | Settlement Type | Estate Value | Key Features |
|-------|----------------|--------------|--------------|
| joint@test.com | JOINT_TRANSFER | $200,000 | Joint tenancy |
| podtod@test.com | POD_TOD_TRANSFER | $150,000 | Beneficiary designations |

### 🥉 Tier 3 (6% of estates)

| Email | Settlement Type | Estate Value | Key Features |
|-------|----------------|--------------|--------------|
| intestate@test.com | INTESTATE | $400,000 | No will |
| informal@test.com | INFORMAL_PROBATE | $250,000 | UPC state (Colorado) |

### 🎯 Tier 4 (2% of estates)

| Email | Settlement Type | Estate Value | Key Features |
|-------|----------------|--------------|--------------|
| ancillary@test.com | ANCILLARY_PROBATE | $600,000 | Multi-state property |
| insolvent@test.com | INSOLVENT | $50,000 | Debts exceed assets ($150k liabilities) |

### ⚠️ Tier 5 (<1% of estates)

| Email | Settlement Type | Estate Value | Key Features |
|-------|----------------|--------------|--------------|
| special@test.com | SPECIAL | $1,000,000 | Contested estate |

## Quick Start

1. **Login** at your application URL
2. **Use any email** from the table above
3. **Password**: `Test123!`
4. **Navigate** to the dashboard to see the pre-configured estate

## Re-seeding

To re-create all test users:

```bash
npx tsx scripts/seed-settlement-types.ts
```

## Full Documentation

See `test_users.md` for:
- Detailed estate profiles
- Testing workflows
- State variations
- Priority testing order
- Expected settlement paths

---

**Created**: February 6, 2026  
**Total Users**: 11  
**Total Estates**: 11  
**Total Assets**: 23  
**Total Liabilities**: 3
