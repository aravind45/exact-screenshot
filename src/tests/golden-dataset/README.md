# Golden Dataset Automated Tests

Comprehensive test suite covering 420+ edge cases from the Golden Dataset.

## Test Structure

```
src/tests/golden-dataset/
├── 01-registration.test.ts          # Cases 1-50: Email, password, name validation ✅
├── 02-estate-classification.test.ts # Cases 51-100: Estate size, state, process type ✅
├── 03-asset-ledger.test.ts          # Cases 141-280: Assets, ownership, probate determination ✅
├── 04-liabilities.test.ts           # Cases 281-320: Debts, liens, creditor claims ✅
├── 05-beneficiaries.test.ts         # Cases 321-360: Heirs, distributions, complications ✅
├── 06-probate-process.test.ts       # Cases 361-390: Filing, timeline, deadlines ✅
├── 07-special-situations.test.ts    # Cases 391-420: Complex estates, disputes ✅
├── setup.ts                          # Test setup and configuration ✅
└── README.md                         # This file ✅

e2e/
└── estate-workflow.spec.ts           # E2E tests for complete user journeys ✅

Configuration Files:
├── vitest.config.ts                  # Vitest configuration with coverage ✅
├── playwright.config.ts              # Playwright E2E configuration ✅
└── .github/workflows/test.yml        # CI/CD pipeline ✅
```

## Running Tests

### Run All Golden Dataset Tests
```bash
npm run test:golden
```

### Run Specific Category
```bash
npm run test src/tests/golden-dataset/01-registration.test.ts
```

### Run with Coverage
```bash
npm run test:coverage
```

### Watch Mode (for development)
```bash
npm run test:watch
# Or for golden dataset only:
npm run test:golden:watch
```

### Run with UI (Vitest UI)
```bash
npm run test:ui
```

### Run E2E Tests
```bash
npm run e2e
# Or with UI:
npm run e2e:ui
# Or with debugger:
npm run e2e:debug
```

## Test Categories

### 1. Registration & Onboarding (50 tests)
- Email validation (20 cases)
- Password requirements (15 cases)
- Name field handling (15 cases)

**Key Edge Cases:**
- Emails with special characters, unicode, emojis
- Passwords with various character combinations
- Names with hyphens, apostrophes, accents, suffixes

### 2. Estate Classification (50 tests)
- Estate value ranges (15 cases)
- State jurisdictions (15 cases)
- Process type determination (20 cases)

**Key Edge Cases:**
- Negative estate values (insolvent)
- Multi-state estates
- Trust vs probate determination

### 3. Asset Ledger (60 tests)
- Real property (30 cases)
- Financial accounts (20 cases)
- Investment accounts (30 cases)
- Personal property (20 cases)
- Business interests (20 cases)
- Digital assets (20 cases)

**Key Edge Cases:**
- Joint ownership vs sole ownership
- Beneficiary designations
- Trust-held assets
- Assets with liens

### 4. Liabilities & Debts (40 tests)
- Secured debts (10 cases)
- Unsecured debts (20 cases)
- Special debt situations (10 cases)

**Key Edge Cases:**
- Debts with co-signers
- Statute of limitations
- Fraudulent claims

### 5. Beneficiaries & Heirs (40 tests)
- Beneficiary types (21 cases)
- Beneficiary complications (19 cases)

**Key Edge Cases:**
- Predeceased beneficiaries
- Minor beneficiaries
- Disclaimers
- Per stirpes vs per capita

### 6. Probate Process & Timeline (30 tests)
- Filing scenarios (20 cases)
- Timeline complications (10 cases)

**Key Edge Cases:**
- Late filings
- Missing documents
- Contested wills

### 7. Special Situations (30 tests)
- Family dynamics (10 cases)
- Complex estates (20 cases)

**Key Edge Cases:**
- Blended families
- International assets
- Business interests
- Pending litigation

## Test Data

### Realistic Test Data
All tests use realistic data that mirrors actual user scenarios:

**Names:**
- John Smith, Mary Johnson, José García, Wei Chen
- O'Brien, McDonald, Van Der Berg

**Addresses:**
- 123 Main St, Anytown, CA 90210
- 456 Oak Ave, Los Angeles, CA 90001

**Dates:**
- Date of death: 2024-01-15
- Date of birth: 1950-06-20

**Values:**
- Estate value: $500,000
- Home value: $750,000
- Checking account: $25,000

## Expected Behaviors

Each test documents expected system behavior:

- ✅ **Accept**: System handles gracefully
- ⚠️ **Warn**: System accepts but shows warning
- ❌ **Reject**: System rejects with clear error message
- 🔄 **Redirect**: System redirects to appropriate flow
- 📞 **Escalate**: System suggests professional help

## Test Coverage Goals

- **Unit Tests**: 100% coverage of validation functions
- **Integration Tests**: 90% coverage of workflows
- **E2E Tests**: 80% coverage of user journeys

### Current Coverage Thresholds (vitest.config.ts):
- Lines: 70%
- Functions: 70%
- Branches: 65%
- Statements: 70%

### View Coverage Report:
After running `npm run test:coverage`, open `coverage/index.html` in your browser to see detailed coverage report.

## Adding New Tests

When adding new edge cases:

1. Add case to `GOLDEN_DATASET_EDGE_CASES.md`
2. Create test in appropriate category file
3. Document expected behavior
4. Run test suite to ensure no regressions
5. Update this README

## Continuous Integration

Tests run automatically on:
- Every push to main/develop branches
- Every pull request to main/develop
- Multiple Node.js versions (18.x, 20.x)
- Multiple browsers for E2E (Chrome, Firefox, Safari, Mobile)

### CI/CD Pipeline Features:
- ✅ Linting
- ✅ Unit tests
- ✅ Coverage reporting
- ✅ E2E tests
- ✅ Test result artifacts
- ✅ Coverage upload to Codecov
- ✅ Playwright test reports

## Performance Benchmarks

- All tests should complete in < 30 seconds
- Individual test suites in < 5 seconds
- No test should take > 1 second

## Debugging Failed Tests

If a test fails:

1. Check the error message
2. Review the specific edge case in GOLDEN_DATASET_EDGE_CASES.md
3. Verify expected behavior is correct
4. Fix code or update test as needed
5. Run full suite to check for regressions

## Test Maintenance

- Review and update tests quarterly
- Add new edge cases as discovered
- Remove obsolete tests
- Keep test data realistic and current

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](https://testingjavascript.com/)
- [Golden Dataset](../../../test-data/GOLDEN_DATASET_EDGE_CASES.md)
