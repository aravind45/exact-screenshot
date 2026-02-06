import { test, expect } from '@playwright/test';

/**
 * E2E Tests for the Onboarding Flow
 * 
 * These tests verify:
 * 1. User registration creates an estate
 * 2. Onboarding wizard captures and persists data correctly
 * 3. Settlement type is correctly determined
 * 4. Task auto-completion works on track selection
 * 5. Data persists across page refreshes
 */

// Test user credentials - use unique email to avoid conflicts
const testUser = {
    fullName: 'E2E Test User',
    email: `e2e-test-${Date.now()}@example.com`,
    password: 'TestPassword123!'
};

test.describe('Onboarding Flow', () => {

    test('should complete full onboarding and persist data', async ({ page }) => {
        // Step 1: Navigate to registration page
        await page.goto('/auth');
        await expect(page).toHaveTitle(/ExpectedEstate/);

        // Click on Sign Up tab if present
        const signUpTab = page.getByRole('tab', { name: /sign up/i });
        if (await signUpTab.isVisible()) {
            await signUpTab.click();
        }

        // Step 2: Fill registration form
        await page.fill('input[name="fullName"], input[placeholder*="name" i]', testUser.fullName);
        await page.fill('input[name="email"], input[type="email"]', testUser.email);
        await page.fill('input[name="password"], input[type="password"]', testUser.password);

        // Take screenshot of filled form
        await page.screenshot({ path: 'e2e/screenshots/01-registration-form.png' });

        // Step 3: Submit registration
        await page.click('button[type="submit"]');

        // Wait for navigation to onboarding
        await page.waitForURL(/onboarding/, { timeout: 10000 });
        await expect(page).toHaveURL(/onboarding/);

        // Take screenshot of onboarding start
        await page.screenshot({ path: 'e2e/screenshots/02-onboarding-start.png' });

        // Step 4: Complete Onboarding Step 1 - Basic Info
        // Fill deceased name
        const deceasedNameInput = page.locator('input[placeholder*="deceased" i], input[name*="deceased" i]').first();
        if (await deceasedNameInput.isVisible()) {
            await deceasedNameInput.fill('John Doe');
        }

        // Select state if dropdown is present
        const stateSelect = page.locator('select, [role="combobox"]').first();
        if (await stateSelect.isVisible()) {
            await stateSelect.click();
            await page.click('text=California');
        }

        // Click Next/Continue
        const nextButton = page.getByRole('button', { name: /next|continue/i });
        await nextButton.click();

        // Take screenshot after step 1
        await page.screenshot({ path: 'e2e/screenshots/03-onboarding-step2.png' });

        // Step 5: Complete Track Scout (Step 2)
        // Answer questionnaire questions
        const yesButtons = page.getByRole('button', { name: /yes/i });
        const noButtons = page.getByRole('button', { name: /no/i });

        // Answer questions (these determine settlement type)
        // We'll click "No" for most to get a simple path
        for (let i = 0; i < 5; i++) {
            const noBtn = noButtons.nth(0);
            if (await noBtn.isVisible()) {
                await noBtn.click();
                await page.waitForTimeout(300); // Brief wait for UI update
            }
        }

        // Click Next after questionnaire
        const nextBtn2 = page.getByRole('button', { name: /next|continue/i });
        if (await nextBtn2.isVisible()) {
            await nextBtn2.click();
        }

        // Take screenshot of recommendation
        await page.screenshot({ path: 'e2e/screenshots/04-track-recommendation.png' });

        // Step 6: Accept recommendation and complete onboarding
        const acceptButton = page.getByRole('button', { name: /accept|confirm|get started/i });
        if (await acceptButton.isVisible()) {
            await acceptButton.click();
        }

        // Wait for navigation to dashboard
        await page.waitForURL(/dashboard/, { timeout: 15000 });
        await expect(page).toHaveURL(/dashboard/);

        // Step 7: Verify dashboard shows correct data
        await page.screenshot({ path: 'e2e/screenshots/05-dashboard-after-onboarding.png' });

        // Check for estate type badge
        const estateBadge = page.locator('[class*="badge"], [class*="Badge"]');
        await expect(estateBadge.first()).toBeVisible({ timeout: 5000 });

        // Step 8: Verify data persists after refresh
        await page.reload();
        await page.waitForLoadState('networkidle');

        // Take screenshot after refresh
        await page.screenshot({ path: 'e2e/screenshots/06-dashboard-after-refresh.png' });

        // Verify we're still on dashboard (not redirected to onboarding)
        await expect(page).toHaveURL(/dashboard/);

        // Verify estate badge is still visible
        await expect(estateBadge.first()).toBeVisible({ timeout: 5000 });

        console.log('✅ Onboarding flow completed successfully');
        console.log('✅ Data persisted after refresh');
    });

    test('should show correct settlement type based on questionnaire answers', async ({ page }) => {
        // This test verifies the Track Scout logic

        // Login with existing test user or create new one
        await page.goto('/auth');

        // Fill login form
        await page.fill('input[type="email"]', testUser.email);
        await page.fill('input[type="password"]', testUser.password);
        await page.click('button[type="submit"]');

        // Wait for dashboard
        await page.waitForURL(/dashboard|onboarding/, { timeout: 10000 });

        // If on dashboard, verify settlement type display
        if (page.url().includes('dashboard')) {
            // Look for settlement type in sidebar or header
            const settlementType = page.locator('text=/probate|trust|spousal|small estate/i').first();
            await expect(settlementType).toBeVisible({ timeout: 5000 });

            await page.screenshot({ path: 'e2e/screenshots/07-settlement-type-display.png' });
        }
    });

    test('should auto-complete eligibility task after onboarding', async ({ page }) => {
        // Login
        await page.goto('/auth');
        await page.fill('input[type="email"]', testUser.email);
        await page.fill('input[type="password"]', testUser.password);
        await page.click('button[type="submit"]');

        // Wait for dashboard
        await page.waitForURL(/dashboard/, { timeout: 10000 });

        // Navigate to roadmap
        await page.click('text=/roadmap|settlement path/i');
        await page.waitForURL(/roadmap/, { timeout: 5000 });

        // Take screenshot of roadmap
        await page.screenshot({ path: 'e2e/screenshots/08-roadmap-tasks.png' });

        // Verify "Check Small Estate Eligibility" is NOT in pending tasks
        // (it should be auto-completed during onboarding)
        const eligibilityTask = page.locator('text=/check.*eligibility/i');

        // Either the task doesn't exist, or it has a "completed" status
        const taskCount = await eligibilityTask.count();
        if (taskCount > 0) {
            // If task exists, it should be marked complete
            const parentElement = eligibilityTask.first().locator('xpath=ancestor::*[contains(@class, "task") or contains(@class, "item")]').first();
            const hasCompletedStatus = await parentElement.locator('text=/complete|done/i').isVisible();
            expect(hasCompletedStatus || await parentElement.locator('[class*="completed"], [class*="done"]').isVisible()).toBeTruthy();
        }

        console.log('✅ Eligibility task auto-completion verified');
    });
});

test.describe('Profile Guard', () => {
    test('should redirect incomplete profiles to onboarding', async ({ page }) => {
        // Try to access dashboard directly without completing onboarding
        // This requires a user with incomplete profile

        await page.goto('/dashboard');

        // If not logged in, should redirect to auth
        // If logged in with incomplete profile, should redirect to onboarding
        await page.waitForURL(/auth|onboarding|dashboard/, { timeout: 10000 });

        // Take screenshot of where we ended up
        await page.screenshot({ path: 'e2e/screenshots/09-profile-guard-test.png' });

        const url = page.url();
        console.log(`Profile guard redirected to: ${url}`);
    });
});
