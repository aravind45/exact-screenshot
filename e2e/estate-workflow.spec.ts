/**
 * E2E Test: Estate Settlement Workflow
 *
 * Tests key user flows using selectors that match the actual Auth.tsx and
 * Sidebar.tsx implementations. Registration uses the button-based type-selection
 * flow (no tabs). Sidebar navigation uses exact label text.
 */

import { test, expect } from '@playwright/test';

// ─── Shared helpers ───────────────────────────────────────────────────────────

async function registerAsExecutor(page: any, email: string, password: string, fullName = 'Test Executor') {
    await page.goto('/auth');
    // Auth.tsx: default is login; click "Register Now" to open type-selection
    await page.click('button:has-text("Register Now")');
    await page.waitForSelector('button:has-text("I am an Executor")', { timeout: 8000 });
    await page.click('button:has-text("I am an Executor")');
    // Form uses id attributes (not name)
    await page.waitForSelector('#fullName', { timeout: 5000 });
    await page.fill('#fullName', fullName);
    await page.fill('#email', email);
    await page.fill('#password', password);
    await page.click('button[type="submit"]');
}

async function loginAs(page: any, email: string, password: string) {
    await page.goto('/auth');
    // Login form shows by default; #email and #password are the ids
    await page.waitForSelector('#email', { timeout: 5000 });
    await page.fill('#email', email);
    await page.fill('#password', password);
    await page.click('button[type="submit"]');
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('Registration Flow', () => {
    test('executor registration navigates to onboarding', async ({ page }) => {
        const email = `executor-reg-${Date.now()}@example.com`;

        await registerAsExecutor(page, email, 'TestPassword123!');

        // Should land on onboarding
        await page.waitForURL(/onboarding/, { timeout: 15000 });
        await expect(page).toHaveURL(/onboarding/);

        await page.screenshot({ path: 'e2e/screenshots/wf-01-onboarding.png' });
    });

    test('advisor registration navigates to advisor onboarding', async ({ page }) => {
        const email = `advisor-reg-${Date.now()}@example.com`;

        await page.goto('/auth');
        await page.click('button:has-text("Register Now")');
        await page.waitForSelector('button:has-text("I am an Advisor")', { timeout: 8000 });
        await page.click('button:has-text("I am an Advisor")');
        await page.waitForSelector('#fullName', { timeout: 5000 });
        await page.fill('#fullName', 'Test Advisor');
        await page.fill('#email', email);
        await page.fill('#password', 'TestPassword123!');
        await page.click('button[type="submit"]');

        await page.waitForURL(/advisor\/onboarding|onboarding/, { timeout: 15000 });

        await page.screenshot({ path: 'e2e/screenshots/wf-02-advisor-onboarding.png' });
    });

    test('rejects duplicate email with helpful message', async ({ page }) => {
        // Use a fixed known email that likely already exists, or register twice
        const email = `dup-test-${Date.now()}@example.com`;

        // First registration
        await registerAsExecutor(page, email, 'TestPassword123!');
        await page.waitForURL(/onboarding/, { timeout: 15000 });

        // Second registration attempt with same email
        await registerAsExecutor(page, email, 'TestPassword123!');

        // Should see an error toast or message about duplicate email
        await page.waitForSelector(
            'text=/already registered|account exists|already in use/i',
            { timeout: 10000 }
        );

        await page.screenshot({ path: 'e2e/screenshots/wf-03-dup-email-error.png' });
    });
});

test.describe('Form Validation', () => {
    test('rejects invalid email format', async ({ page }) => {
        await page.goto('/auth');
        await page.click('button:has-text("Register Now")');
        await page.waitForSelector('button:has-text("I am an Executor")', { timeout: 8000 });
        await page.click('button:has-text("I am an Executor")');
        await page.waitForSelector('#fullName', { timeout: 5000 });
        await page.fill('#fullName', 'Test User');
        await page.fill('#email', 'not-an-email');
        await page.fill('#password', 'TestPassword123!');
        await page.click('button[type="submit"]');

        // Zod validation runs client-side
        await page.waitForSelector('text=/valid email/i', { timeout: 5000 });

        await page.screenshot({ path: 'e2e/screenshots/wf-04-invalid-email.png' });
    });

    test('rejects passwords under 8 characters', async ({ page }) => {
        await page.goto('/auth');
        await page.click('button:has-text("Register Now")');
        await page.waitForSelector('button:has-text("I am an Executor")', { timeout: 8000 });
        await page.click('button:has-text("I am an Executor")');
        await page.waitForSelector('#fullName', { timeout: 5000 });
        await page.fill('#fullName', 'Test User');
        await page.fill('#email', `pw-test-${Date.now()}@example.com`);
        await page.fill('#password', 'short');
        await page.click('button[type="submit"]');

        await page.waitForSelector('text=/at least 8/i', { timeout: 5000 });

        await page.screenshot({ path: 'e2e/screenshots/wf-05-weak-password.png' });
    });

    test('login shows error for wrong password', async ({ page }) => {
        await page.goto('/auth');
        await page.waitForSelector('#email', { timeout: 5000 });
        await page.fill('#email', 'nonexistent@example.com');
        await page.fill('#password', 'WrongPassword123!');
        await page.click('button[type="submit"]');

        // Should show a toast/error
        await page.waitForSelector(
            'text=/invalid credentials|check your email|sign in failed/i',
            { timeout: 10000 }
        );

        await page.screenshot({ path: 'e2e/screenshots/wf-06-login-error.png' });
    });
});

test.describe('Sidebar Navigation', () => {
    // These tests require an authenticated session — they rely on a pre-registered
    // user completing onboarding. They are deliberately lightweight: just verify
    // that each page loads without a crash or redirect to /auth.
    //
    // Each test registers a UNIQUE user so parallel execution doesn't collide.

    const SEED_PASS = 'TestPassword123!';

    test.beforeEach(async ({ page }) => {
        // Unique email per test execution to avoid duplicate-email conflicts
        const seedEmail = `nav-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`;
        await registerAsExecutor(page, seedEmail, SEED_PASS);
        await page.waitForURL(/onboarding|dashboard/, { timeout: 15000 });
    });

    test('Asset Ledger page loads', async ({ page }) => {
        await page.goto('/assets');
        // Should not bounce to /auth
        await page.waitForURL(/assets/, { timeout: 10000 });
        await expect(page).toHaveURL(/assets/);
        await page.screenshot({ path: 'e2e/screenshots/wf-07-assets.png' });
    });

    test('Liabilities page loads', async ({ page }) => {
        await page.goto('/liabilities');
        await page.waitForURL(/liabilities/, { timeout: 10000 });
        await expect(page).toHaveURL(/liabilities/);
        await page.screenshot({ path: 'e2e/screenshots/wf-08-liabilities.png' });
    });

    test('Action Plan (roadmap) page loads', async ({ page }) => {
        await page.goto('/roadmap');
        await page.waitForURL(/roadmap/, { timeout: 10000 });
        await expect(page).toHaveURL(/roadmap/);
        await page.screenshot({ path: 'e2e/screenshots/wf-09-roadmap.png' });
    });

    test('Document Vault page loads', async ({ page }) => {
        await page.goto('/documents');
        await page.waitForURL(/documents/, { timeout: 10000 });
        await expect(page).toHaveURL(/documents/);
        await page.screenshot({ path: 'e2e/screenshots/wf-10-documents.png' });
    });

    test('Marketplace page loads', async ({ page }) => {
        await page.goto('/marketplace');
        await page.waitForURL(/marketplace/, { timeout: 10000 });
        await expect(page).toHaveURL(/marketplace/);
        await page.screenshot({ path: 'e2e/screenshots/wf-11-marketplace.png' });
    });
});
