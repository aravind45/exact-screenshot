import { test, expect } from '@playwright/test';
import { prisma } from '../server/db.js';

test.describe('Document Generation Unification', () => {
    test('should verify document readiness and generation flow', async ({ page }) => {
        const email = `doc_test_${Date.now()}@example.com`;
        const password = 'TestPassword123!';

        // 1. Navigate to Registration via Login Page
        await page.goto('/auth');
        await page.waitForSelector('button:has-text("Register Now")');
        await page.click('button:has-text("Register Now")');

        await page.waitForSelector('button:has-text("I am an Executor")');
        await page.click('button:has-text("I am an Executor")');

        // 2. Fill Form
        try {
            const fullNameInput = page.locator('label:has-text("Full Name") + div input, input[name="fullName"], #fullName');
            await fullNameInput.first().waitFor({ state: 'visible', timeout: 5000 });
            await fullNameInput.first().fill('Doc Tester');
        } catch (e) {
            console.log('DOM Content on failure:', await page.content());
            throw e;
        }

        const emailInput = page.locator('label:has-text("Email Address") + div input, input[name="email"], #email');
        await emailInput.first().fill(email);

        const passwordInput = page.locator('label:has-text("Password") + div input, input[name="password"], #password');
        await passwordInput.first().fill(password);

        await page.click('button:has-text("Create Account")');

        await page.waitForURL(/onboarding/, { timeout: 15000 });

        // 3. Simulate Verification (Backend Bypass)
        const user: any = await prisma.user.findUnique({ where: { email } });
        await page.goto(`/verify-email?token=${user?.verificationToken}`);
        await page.waitForSelector('text=/success|verified/i');

        // 4. Verify Templates Listing
        await page.goto('/documents');
        const [templatesResponse] = await Promise.all([
            page.waitForResponse(r => r.url().includes('/api/documents/templates') && r.status() === 200),
            page.reload()
        ]);
        const templates = await templatesResponse.json();
        expect(templates.length).toBeGreaterThan(0);

        // 5. Verify Readiness
        const [readinessResponse] = await Promise.all([
            page.waitForResponse(r => r.url().includes('/api/documents/readiness') && r.status() === 200),
            page.goto('/documents')
        ]);
        const readiness = await readinessResponse.json();
        expect(readiness).toHaveProperty('DE-111');

        console.log('✅ Document unification E2E verified');

        // Cleanup
        await prisma.estate.deleteMany({ where: { userId: user.id } });
        await prisma.user.delete({ where: { id: user.id } });
    });
});
