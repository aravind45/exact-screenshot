import { test, expect } from '@playwright/test';
import { prisma } from '../server/db.js';

/**
 * E2E Tests for Email Verification and Protected Routes
 */

const testUser = {
    fullName: 'Verification Test User',
    email: `verify-test-${Date.now()}@example.com`,
    password: 'TestPassword123!'
};

test.describe('Email Verification Flow', () => {

    test('should register user and block access until email is verified', async ({ page }) => {
        // 1. Register — Auth.tsx uses button flow (no tabs)
        await page.goto('/auth');

        // Click "Register Now" to open type-selection screen
        await page.click('button:has-text("Register Now")');

        // Select Executor account type
        await page.waitForSelector('button:has-text("I am an Executor")', { timeout: 5000 });
        await page.click('button:has-text("I am an Executor")');

        // Fill form using id selectors (Auth.tsx uses id not name attributes)
        await page.waitForSelector('#fullName', { timeout: 5000 });
        await page.fill('#fullName', testUser.fullName);
        await page.fill('#email', testUser.email);
        await page.fill('#password', testUser.password);

        await page.screenshot({ path: 'e2e/screenshots/auth-01-register.png' });
        await page.click('button[type="submit"]');

        // Should be on onboarding, but let's try to access assets
        await page.waitForURL(/onboarding/, { timeout: 10000 });

        // 2. Verify blocked access to protected API
        // We can check this by trying to navigate to Assets page or checking a direct API call
        await page.goto('/assets');

        // The frontend should handle the 403. Usually it might show a toast or a dedicated "Verify Email" screen.
        // For now, let's just check if we see a message or if the API returned 403.
        // Since playright runs in a browser, we can check the response of an API call.
        const [response] = await Promise.all([
            page.waitForResponse(response => response.url().includes('/api/assets') && response.status() === 403),
            page.goto('/assets')
        ]);

        expect(response.status()).toBe(403);
        const errorData = await response.json();
        expect(errorData.error).toBe('UNVERIFIED_EMAIL');

        await page.screenshot({ path: 'e2e/screenshots/auth-02-blocked-assets.png' });

        // 3. Simulate email verification (Backend Bypass in Test)
        // Find user and token in DB
        const user = await prisma.user.findUnique({
            where: { email: testUser.email }
        });

        expect(user?.verificationToken).toBeTruthy();

        // 4. Call verification endpoint (both email AND token required by VerifyEmail page)
        await page.goto(`/verify-email?email=${encodeURIComponent(testUser.email)}&token=${user?.verificationToken}`);

        // Should see a success message or be redirected
        await page.waitForSelector('[data-testid="verify-email-success"]', { timeout: 15000 });
        await page.screenshot({ path: 'e2e/screenshots/auth-03-verified-success.png' });

        // 5. Verify access is now granted
        await page.goto('/assets');
        const [grantedResponse] = await Promise.all([
            page.waitForResponse(response => response.url().includes('/api/assets') && response.status() === 200),
            page.reload()
        ]);

        expect(grantedResponse.status()).toBe(200);
        await page.screenshot({ path: 'e2e/screenshots/auth-04-access-granted.png' });

        console.log('✅ Email verification flow verified');
    });
});
