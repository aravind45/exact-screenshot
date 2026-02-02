# Quick Test Guide - 21-Path API Tests

## TL;DR - Run Tests Now

### 1. Unit Tests (No Server Required) ✅
```bash
npm test src/tests/api/authority-engine.test.ts
```
**Status**: ✅ All 37 tests passing

### 2. Integration Tests (Requires Server) ⏳
```bash
# Terminal 1: Start server
npm run dev

# Terminal 2: Run tests
npm test src/tests/api/21-paths-api.test.ts
```
**Status**: ⏳ Ready to run

## Prerequisites Checklist

- [ ] Database is active (Neon auto-suspends after 5 min)
- [ ] Test users are seeded
- [ ] Server is running on port 5000

### Wake Database & Seed Users
```bash
npx tsx scripts/seed-21-paths.ts
```

### Start Server
```bash
npm run dev
```

## Test Commands

| Command | Description | Status |
|---------|-------------|--------|
| `npm test src/tests/api/authority-engine.test.ts` | Unit tests only | ✅ Passing |
| `npm test src/tests/api/21-paths-api.test.ts` | Integration tests | ⏳ Ready |
| `npm test src/tests/api` | All API tests | ⏳ Ready |
| `npm test src/tests/api -- --watch` | Watch mode | ⏳ Ready |
| `npm test src/tests/api -- --coverage` | With coverage | ⏳ Ready |

## Test User Quick Reference

**Password**: `Test123!` (all users)

| Path | Email | Type |
|------|-------|------|
| PTH-01 | pth01-probate@test.com | Full Probate |
| PTH-02 | pth02-intestate@test.com | Intestate |
| PTH-13 | pth13-smallestate@test.com | Small Estate |
| PTH-14 | pth14-joint@test.com | Joint Tenancy |
| PTH-15 | pth15-podtod@test.com | POD/TOD |

[See `TEST_USERS_REFERENCE.md` for all 21 users]

## Troubleshooting

### Database Connection Error
```
Error: Can't reach database server
```
**Fix**: Wake database
```bash
npx tsx scripts/seed-21-paths.ts
```

### Server Not Running
```
Error: fetch failed
```
**Fix**: Start server
```bash
npm run dev
```

### Authentication Failed
```
Error: 401 Unauthorized
```
**Fix**: Re-seed users
```bash
npx tsx scripts/seed-21-paths.ts
```

## Expected Results

### Should PASS ✅
- PTH-01: Full Probate
- PTH-13: Small Estate
- PTH-14: Joint Tenancy
- PTH-15: POD/TOD
- PTH-16: Beneficiary

### Should Be PARTIAL ⚠️
- PTH-02: Intestate (no heir wizard)
- PTH-03: Summary Admin (not integrated)
- PTH-07: Trust Admin (basic only)

### Known to FAIL ❌
- PTH-04: Ancillary (no overlay)
- PTH-05: Muniment (not implemented)
- PTH-06: Contested (no litigation)
- PTH-08: Irrevocable (no differentiation)
- PTH-09: Pour-Over (no hybrid)
- PTH-10: Business (no valuation)
- PTH-11: Insolvent (not integrated)
- PTH-12: Minors (no locks)

## Full Documentation

- **Detailed Guide**: `src/tests/api/README.md`
- **Implementation Summary**: `TEST_IMPLEMENTATION_SUMMARY.md`
- **Test Users**: `TEST_USERS_REFERENCE.md`
- **Expected Results**: `ESTATE_PATH_ACCEPTANCE_TEST_REPORT.md`

---

**Quick Start**: Run `npm test src/tests/api/authority-engine.test.ts` to see tests in action!
