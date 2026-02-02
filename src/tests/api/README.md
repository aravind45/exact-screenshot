# 21-Path Estate Settlement API Tests

Automated API/backend tests for all 21 estate settlement paths defined in the Estate 21-Path Acceptance Matrix.

## Test Files

### 1. `21-paths-api.test.ts`
Comprehensive integration tests that validate:
- **Authentication**: Login for all 21 test users
- **Estate Data**: Retrieval and validation of estate information
- **Asset Data**: Count, types, values, and ownership validation
- **Authority Detection**: Correct authority type identification
- **Special Data**: Liabilities (PTH-11), heirs (PTH-12)
- **Data Consistency**: Estate type matches authority type
- **Error Handling**: Invalid credentials, missing auth, etc.

### 2. `authority-engine.test.ts`
Unit tests for the authority recommendation engine:
- **Path Detection**: All 21 paths correctly identified
- **Master Mode Classification**: Court-supervised, fiduciary, transfer-only
- **State Thresholds**: Correct thresholds for CA, FL, TX, NY
- **Institution Requirements**: Letters vs affidavit requirements
- **Modifiers**: Insolvent, minors, business, contested
- **Edge Cases**: Empty assets, threshold boundaries, etc.

## Prerequisites

### 1. Database Setup
Ensure the Neon database is active and seeded with test data:

```bash
# Check database connection
npx prisma db push

# Seed 21 test users
npx tsx scripts/seed-21-paths.ts
```

**Note**: Neon database auto-suspends after ~5 minutes of inactivity. If tests fail with connection errors, the database may need to be woken up by running the seed script again.

### 2. Server Running
The API server must be running on `http://localhost:5000`:

```bash
# Start the development server
npm run dev
```

Or if using a different command:
```bash
npm start
```

## Running the Tests

### Run All API Tests
```bash
npm test src/tests/api
```

### Run Specific Test File
```bash
# Integration tests
npm test src/tests/api/21-paths-api.test.ts

# Authority engine unit tests
npm test src/tests/api/authority-engine.test.ts
```

### Run Tests in Watch Mode
```bash
npm test src/tests/api -- --watch
```

### Run Tests with Coverage
```bash
npm test src/tests/api -- --coverage
```

## Test User Credentials

All test users use the same password: `Test123!`

| Path ID | Email | Estate Type | Assets | Special Data |
|---------|-------|-------------|--------|--------------|
| PTH-01 | pth01-probate@test.com | FORMAL_PROBATE | 3 | - |
| PTH-02 | pth02-intestate@test.com | INTESTATE | 2 | - |
| PTH-03 | pth03-summary@test.com | SUMMARY_ADMINISTRATION | 2 | FL estate |
| PTH-04 | pth04-ancillary@test.com | ANCILLARY_PROBATE | 2 | Multi-state |
| PTH-05 | pth05-muniment@test.com | MUNIMENT_OF_TITLE | 1 | TX estate |
| PTH-06 | pth06-contested@test.com | FORMAL_PROBATE | 1 | Contested |
| PTH-07 | pth07-trust-revocable@test.com | TRUST_ADMIN_REVOCABLE | 2 | Trust assets |
| PTH-08 | pth08-trust-irrevocable@test.com | TRUST_ADMIN_IRREVOCABLE | 1 | Irrevocable |
| PTH-09 | pth09-pourover@test.com | POUR_OVER_WILL | 3 | Hybrid |
| PTH-10 | pth10-business@test.com | FORMAL_PROBATE | 2 | Business |
| PTH-11 | pth11-insolvent@test.com | INSOLVENT_ESTATE | 1 | 2 liabilities |
| PTH-12 | pth12-minor@test.com | ESTATE_WITH_MINORS | 1 | 1 heir (minor) |
| PTH-13 | pth13-smallestate@test.com | SMALL_ESTATE | 2 | Under threshold |
| PTH-14 | pth14-joint@test.com | JOINT_TRANSFER | 1 | Joint ownership |
| PTH-15 | pth15-podtod@test.com | POD_TOD_TRANSFER | 2 | POD/TOD |
| PTH-16 | pth16-beneficiary@test.com | BENEFICIARY_DESIGNATED | 2 | Insurance + 401k |
| PTH-17 | pth17-toddeed@test.com | TOD_DEED | 1 | TOD deed |
| PTH-18 | pth18-unclaimed@test.com | FORMAL_PROBATE | 2 | Unclaimed property |
| PTH-19 | pth19-escheat@test.com | FORMAL_PROBATE | 1 | Escheat risk |
| PTH-20 | pth20-elective@test.com | FORMAL_PROBATE | 1 | Elective share |
| PTH-21 | pth21-unknownheirs@test.com | INTESTATE | 1 | Unknown heirs |

## Expected Test Results

### Should PASS ✅
- **PTH-01**: Full probate workflow
- **PTH-02**: Intestate detection (partial - no heir wizard)
- **PTH-13**: Small estate affidavit
- **PTH-14**: Joint tenancy transfer
- **PTH-15**: POD/TOD transfer
- **PTH-16**: Beneficiary designated
- **PTH-07**: Trust administration (basic)

### Should Be PARTIAL ⚠️
- **PTH-03**: Summary admin detected but not fully integrated
- **PTH-17**: TOD deed type exists but no specific workflow
- **PTH-21**: Heirs table exists but no search workflow

### Known Limitations ❌
- **PTH-04**: Ancillary probate - no overlay system
- **PTH-05**: Muniment - not implemented
- **PTH-06**: Contested - no litigation workflow
- **PTH-08**: Irrevocable trust - no differentiation from revocable
- **PTH-09**: Pour-over - no hybrid support
- **PTH-10**: Business - no valuation workflow
- **PTH-11**: Insolvent - priority engine not integrated
- **PTH-12**: Minor - no distribution locks
- **PTH-18**: Unclaimed - no workflow
- **PTH-19**: Escheat - no workflow
- **PTH-20**: Elective share - no workflow

## Troubleshooting

### Database Connection Errors
```
Error: Can't reach database server
```
**Solution**: Neon database auto-suspended. Run seed script to wake it:
```bash
npx tsx scripts/seed-21-paths.ts
```

### Server Not Running
```
Error: fetch failed
```
**Solution**: Start the development server:
```bash
npm run dev
```

### Authentication Failures
```
Error: 401 Unauthorized
```
**Solution**: Verify test users exist in database:
```bash
npx prisma studio
# Check User table for pth01-probate@test.com, etc.
```

### Test Data Missing
```
Error: Expected 3 assets, received 0
```
**Solution**: Re-run seed script:
```bash
npx tsx scripts/seed-21-paths.ts
```

### Clean Up Test Data
To remove all test users and start fresh:
```bash
npx tsx scripts/cleanup-test-users.ts
```

## Test Coverage Goals

- ✅ **Authentication**: 100% (21/21 paths)
- ✅ **Estate Data**: 100% (21/21 paths)
- ✅ **Asset Data**: 100% (21/21 paths)
- ✅ **Authority Detection**: 100% (21/21 paths)
- ⚠️ **Roadmap Generation**: Partial (basic paths only)
- ⚠️ **Phase Locking**: Partial (basic paths only)
- ❌ **Form Gating**: Not tested (requires UI)
- ❌ **Overlay System**: Not implemented

## Next Steps

1. **Run Tests**: Execute all tests and verify results
2. **Fix Failures**: Address any failing tests
3. **Add Roadmap Tests**: Test roadmap generation for each path
4. **Add Phase Lock Tests**: Test phase locking logic
5. **Integration Tests**: Test end-to-end workflows
6. **Performance Tests**: Test with larger datasets

## References

- **Test Users**: `TEST_USERS_REFERENCE.md`
- **Expected Results**: `ESTATE_PATH_ACCEPTANCE_TEST_REPORT.md`
- **Acceptance Matrix**: `Estate_21-Path_Acceptance_Matrix.csv`
- **Seed Script**: `scripts/seed-21-paths.ts`
- **Cleanup Script**: `scripts/cleanup-test-users.ts`

## Contributing

When adding new tests:
1. Follow existing test structure
2. Use descriptive test names
3. Include expected vs actual comparisons
4. Document any known limitations
5. Update this README with new test coverage

---

**Last Updated**: February 2, 2026  
**Test Framework**: Vitest  
**Total Test Paths**: 21  
**Total Test Cases**: 100+
