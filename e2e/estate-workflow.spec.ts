/**
 * E2E Test: Complete Estate Settlement Workflow
 * Tests the full user journey from registration through estate completion
 */

import { test, expect } from '@playwright/test';

test.describe('Estate Settlement Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
  });

  test('Complete user registration flow', async ({ page }) => {
    // Navigate to registration
    await page.click('text=Sign Up');

    // Fill registration form
    await page.fill('input[name="email"]', 'testuser@example.com');
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Smith');

    // Submit form
    await page.click('button[type="submit"]');

    // Verify redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('Create new estate and classify', async ({ page }) => {
    // Login first
    await page.goto('/auth');
    await page.fill('input[name="email"]', 'testuser@example.com');
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');

    // Navigate to create estate
    await page.click('text=Create Estate');

    // Fill estate details
    await page.fill('input[name="deceasedName"]', 'Jane Doe');
    await page.fill('input[name="dateOfDeath"]', '2024-01-15');
    await page.selectOption('select[name="state"]', 'CA');

    // Estimate estate value
    await page.fill('input[name="estimatedValue"]', '500000');

    // Submit
    await page.click('button[type="submit"]');

    // Verify estate created
    await expect(page.locator('text=Estate created successfully')).toBeVisible();
  });

  test('Add assets to estate', async ({ page }) => {
    // Login and navigate to estate
    await page.goto('/auth');
    await page.fill('input[name="email"]', 'testuser@example.com');
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');

    // Go to asset ledger
    await page.click('text=Asset Ledger');

    // Add real property
    await page.click('text=Add Asset');
    await page.selectOption('select[name="assetType"]', 'real-property');
    await page.fill('input[name="description"]', '123 Main St, Anytown, CA');
    await page.fill('input[name="value"]', '750000');
    await page.click('button[type="submit"]');

    // Verify asset added and check for Probate/Non-Probate badges
    await expect(page.locator('text=123 Main St')).toBeVisible();
    await expect(page.locator('text=Probate Estate')).toBeVisible();

    // Add a non-probate asset
    await page.click('text=Add Asset');
    await page.fill('input[name="description"]', 'Living Trust House');
    await page.selectOption('select[name="assetType"]', 'real-property');
    await page.fill('input[name="value"]', '1000000');
    await page.selectOption('select[name="ownershipType"]', 'TRUST');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Living Trust House')).toBeVisible();
    await expect(page.locator('text=Non-Probate')).toBeVisible();

    // Add financial account
    await page.click('text=Add Asset');
    await page.selectOption('select[name="assetType"]', 'checking-account');
    await page.fill('input[name="description"]', 'Chase Checking');
    await page.fill('input[name="value"]', '25000');
    await page.click('button[type="submit"]');

    // Verify total value updated
    await expect(page.locator('text=Total Assets')).toBeVisible();
  });

  test('Add liabilities to estate', async ({ page }) => {
    // Login and navigate
    await page.goto('/auth');
    await page.fill('input[name="email"]', 'testuser@example.com');
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');

    // Go to liabilities
    await page.click('text=Liabilities');

    // Add mortgage
    await page.click('text=Add Liability');
    await page.selectOption('select[name="debtType"]', 'mortgage');
    await page.fill('input[name="creditor"]', 'Wells Fargo');
    await page.fill('input[name="amount"]', '350000');
    await page.click('button[type="submit"]');

    // Verify liability added
    await expect(page.locator('text=Wells Fargo')).toBeVisible();
  });

  test('Add beneficiaries', async ({ page }) => {
    // Login and navigate
    await page.goto('/auth');
    await page.fill('input[name="email"]', 'testuser@example.com');
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');

    // Go to beneficiaries
    await page.click('text=Beneficiaries');

    // Add spouse
    await page.click('text=Add Beneficiary');
    await page.fill('input[name="name"]', 'John Doe');
    await page.selectOption('select[name="relationship"]', 'spouse');
    await page.fill('input[name="share"]', '50');
    await page.click('button[type="submit"]');

    // Add child
    await page.click('text=Add Beneficiary');
    await page.fill('input[name="name"]', 'Sarah Doe');
    await page.selectOption('select[name="relationship"]', 'child');
    await page.fill('input[name="share"]', '50');
    await page.click('button[type="submit"]');

    // Verify beneficiaries added
    await expect(page.locator('text=John Doe')).toBeVisible();
    await expect(page.locator('text=Sarah Doe')).toBeVisible();
  });

  test('View settlement roadmap', async ({ page }) => {
    // Login and navigate
    await page.goto('/auth');
    await page.fill('input[name="email"]', 'testuser@example.com');
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');

    // Go to roadmap
    await page.click('text=Roadmap');

    // Verify phases visible
    await expect(page.locator('text=Immediate Actions')).toBeVisible();
    await expect(page.locator('text=Probate Filing')).toBeVisible();
    await expect(page.locator('text=Asset Management')).toBeVisible();
    await expect(page.locator('text=Final Distribution')).toBeVisible();
  });

  test('Complete task in roadmap', async ({ page }) => {
    // Login and navigate
    await page.goto('/auth');
    await page.fill('input[name="email"]', 'testuser@example.com');
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');

    // Go to roadmap
    await page.click('text=Roadmap');

    // Find first incomplete task
    const firstTask = page.locator('[data-testid="task-checkbox"]').first();
    await firstTask.click();

    // Verify task marked complete
    await expect(firstTask).toBeChecked();
  });

  test('Use AI agent for guidance', async ({ page }) => {
    // Login and navigate
    await page.goto('/auth');
    await page.fill('input[name="email"]', 'testuser@example.com');
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');

    // Go to AI agents
    await page.click('text=AI Agents');

    // Ask a question
    await page.fill('textarea[name="question"]', 'What documents do I need to file for probate in California?');
    await page.click('button[type="submit"]');

    // Wait for response
    await page.waitForSelector('text=probate', { timeout: 10000 });

    // Verify response contains relevant information
    await expect(page.locator('[data-testid="agent-response"]')).toContainText('California');
  });
});

test.describe('Edge Cases', () => {
  test('Handle invalid email during registration', async ({ page }) => {
    await page.goto('/auth');
    await page.click('text=Sign Up');

    // Try invalid email
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');

    // Verify error message
    await expect(page.locator('text=Invalid email')).toBeVisible();
  });

  test('Handle weak password during registration', async ({ page }) => {
    await page.goto('/auth');
    await page.click('text=Sign Up');

    // Try weak password
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'weak');
    await page.click('button[type="submit"]');

    // Verify error message
    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible();
  });

  test('Handle negative estate value', async ({ page }) => {
    // Login first
    await page.goto('/auth');
    await page.fill('input[name="email"]', 'testuser@example.com');
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');

    // Try to create estate with negative value
    await page.click('text=Create Estate');
    await page.fill('input[name="estimatedValue"]', '-50000');
    await page.click('button[type="submit"]');

    // Should accept (insolvent estate) or show appropriate message
    await expect(page.locator('text=insolvent')).toBeVisible();
  });
});
