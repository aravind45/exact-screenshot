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
        // 1. Register
        await page.goto('/auth');

        const signUpTab = page.getByRole('tab', { name: /sign up/i });
        if (await signUpTab.isVisible()) {
            await signUpTab.click();
        }

        await page.fill('input[name="fullName"]', testUser.fullName);
        await page.fill('input[name="email"]', testUser.email);
        await page.fill('input[name="password"]', testUser.password);

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

        // 4. Call verification endpoint
        await page.goto(`/verify-email?token=${user?.verificationToken}`);

        // Should see a success message or be redirected
        await page.waitForSelector('text=/success|verified/i', { timeout: 10000 });
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
