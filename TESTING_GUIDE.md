# ExpectedEstate Testing Guide

Complete guide to the automated testing infrastructure for ExpectedEstate.

## Overview

This project uses a comprehensive testing strategy covering:
- **Unit Tests**: 420 edge cases across 7 test files
- **Integration Tests**: API and service layer tests
- **E2E Tests**: Complete user journey tests with Playwright
- **CI/CD**: Automated testing on every push and PR

## Quick Start

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run E2E Tests
```bash
npm run e2e
```

## Test Categories

### 1. Golden Dataset Tests (420 Edge Cases)

Located in `src/tests/golden-dataset/`, these tests cover every edge case in estate settlement:

#### Test Files:
- `01-registration.test.ts` - 50 tests for email, password, name validation
- `02-estate-classification.test.ts` - 50 tests for estate values, states, process determination
- `03-asset-ledger.test.ts` - 60+ tests for assets, ownership, probate determination
- `04-liabilities.test.ts` - 40 tests for debts, liens, creditor claims
- `05-beneficiaries.test.ts` - 40 tests for heirs, distributions, complications
- `06-probate-process.test.ts` - 30 tests for filing scenarios and timeline complications
- `07-special-situations.test.ts` - 30 tests for complex estates and family disputes

#### Run Golden Dataset Tests:
```bash
# All golden dataset tests
npm run test:golden

# Watch mode
npm run test:golden:watch

# Specific category
npm test src/tests/golden-dataset/01-registration.test.ts
```

### 2. E2E Tests (Playwright)

Located in `e2e/`, these tests verify complete user workflows:

#### Test Scenarios:
- User registration and authentication
- Estate creation and classification
- Asset and liability management
- Beneficiary management
- Settlement roadmap navigation
- AI agent interactions
- Edge case handling

#### Run E2E Tests:
```bash
# Run all E2E tests
npm run e2e

# Run with UI (interactive mode)
npm run e2e:ui

# Run with debugger
npm run e2e:debug

# Run specific browser
npx playwright test --project=chromium
```

### 3. API Tests

Located in `src/tests/api/`, these tests verify API endpoints and services.

## Test Commands Reference

### Unit Tests
```bash
npm test                    # Run all tests once
npm run test:watch          # Run in watch mode
npm run test:golden         # Run golden dataset only
npm run test:golden:watch   # Golden dataset watch mode
npm run test:ui             # Run with Vitest UI
```

### Coverage
```bash
npm run test:coverage       # Run with coverage report
# Then open: coverage/index.html
```

### E2E Tests
```bash
npm run e2e                 # Run all E2E tests
npm run e2e:ui              # Interactive UI mode
npm run e2e:debug           # Debug mode
```

## Coverage Thresholds

Configured in `vitest.config.ts`:

- **Lines**: 70%
- **Functions**: 70%
- **Branches**: 65%
- **Statements**: 70%

### View Coverage Report:
After running `npm run test:coverage`, open `coverage/index.html` in your browser.

## CI/CD Pipeline

### GitHub Actions Workflow

Located in `.github/workflows/test.yml`, runs on:
- Every push to `main` or `develop`
- Every pull request to `main` or `develop`

### Pipeline Steps:
1. **Linting** - ESLint checks
2. **Unit Tests** - All Vitest tests
3. **Coverage** - Generate and upload coverage reports
4. **E2E Tests** - Playwright tests across browsers
5. **Artifacts** - Upload test results and reports

### Test Matrix:
- Node.js versions: 18.x, 20.x
- Browsers: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari

## Writing New Tests

### Unit Test Template

```typescript
import { describe, it, expect } from 'vitest';

describe('Feature Name', () => {
  it('should handle valid input', () => {
    const result = myFunction('valid-input');
    expect(result.valid).toBe(true);
  });

  it('should reject invalid input', () => {
    const result = myFunction('invalid');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });
});
```

### E2E Test Template

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should complete user flow', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Button');
    await expect(page).toHaveURL(/\/expected-path/);
  });
});
```

## Test Data

### Realistic Test Data
All tests use realistic data from `test-data/GOLDEN_DATASET_EDGE_CASES.md`:

**Names:**
- John Smith, Mary Johnson, José García, Wei Chen
- O'Brien, McDonald, Van Der Berg

**Addresses:**
- 123 Main St, Anytown, CA 90210
- 456 Oak Ave, Los Angeles, CA 90001

**Values:**
- Estate value: $500,000
- Home value: $750,000
- Checking account: $25,000

## Debugging Tests

### Debug Unit Tests
```bash
# Run specific test file
npm test src/tests/golden-dataset/01-registration.test.ts

# Run specific test by name
npm test -- -t "Case 1: Valid standard email"

# Run with UI for debugging
npm run test:ui
```

### Debug E2E Tests
```bash
# Run with headed browser
npx playwright test --headed

# Run with debugger
npm run e2e:debug

# Run specific test
npx playwright test e2e/estate-workflow.spec.ts
```

### View Test Reports
```bash
# Vitest HTML report
open test-results/index.html

# Playwright HTML report
npx playwright show-report
```

## Performance Benchmarks

- All tests should complete in < 30 seconds
- Individual test suites in < 5 seconds
- No single test should take > 1 second
- E2E tests should complete in < 5 minutes

## Best Practices

### Unit Tests
1. Test one thing per test
2. Use descriptive test names
3. Follow AAA pattern (Arrange, Act, Assert)
4. Mock external dependencies
5. Keep tests fast and isolated

### E2E Tests
1. Test complete user workflows
2. Use data-testid attributes for selectors
3. Wait for elements properly
4. Clean up test data
5. Run against staging environment

### Test Data
1. Use realistic data
2. Cover edge cases
3. Test boundary conditions
4. Include error scenarios
5. Document expected behaviors

## Troubleshooting

### Tests Failing Locally

1. **Clear cache:**
   ```bash
   npm run test -- --clearCache
   ```

2. **Update snapshots:**
   ```bash
   npm test -- -u
   ```

3. **Check dependencies:**
   ```bash
   npm install
   npx playwright install
   ```

### Tests Passing Locally but Failing in CI

1. Check Node.js version compatibility
2. Verify environment variables
3. Check for timing issues (add waits)
4. Review CI logs for specific errors

### E2E Tests Timing Out

1. Increase timeout in `playwright.config.ts`
2. Add explicit waits for elements
3. Check network requests
4. Verify dev server is running

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [Golden Dataset](./test-data/GOLDEN_DATASET_EDGE_CASES.md)
- [Test README](./src/tests/golden-dataset/README.md)

## Maintenance

### Regular Tasks

1. **Weekly**: Review failing tests
2. **Monthly**: Update test data
3. **Quarterly**: Review coverage thresholds
4. **As needed**: Add new edge cases

### Adding New Edge Cases

1. Add case to `test-data/GOLDEN_DATASET_EDGE_CASES.md`
2. Create test in appropriate category file
3. Document expected behavior
4. Run test suite to ensure no regressions
5. Update README if needed

## Support

For questions or issues with tests:
1. Check this guide
2. Review test documentation
3. Check CI logs
4. Ask the team

---

**Total Test Coverage:**
- 420+ edge cases in golden dataset
- 8+ E2E user workflows
- 70%+ code coverage target
- Multi-browser E2E testing
- Automated CI/CD pipeline
