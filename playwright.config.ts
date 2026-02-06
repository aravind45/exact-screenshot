import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for ExpectedEstate E2E tests.
 * These tests verify the onboarding flow, data persistence, and task auto-completion.
 */
export default defineConfig({
    testDir: './e2e',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: 1,
    reporter: 'html',

    use: {
        baseURL: 'http://localhost:8080',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'on-first-retry',
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    /* Run your local dev server before starting the tests */
    webServer: [
        {
            command: 'npm run dev',
            url: 'http://localhost:8080',
            reuseExistingServer: true,
            timeout: 120 * 1000,
        },
        {
            command: 'npm run api',
            url: 'http://localhost:3000/api/health',
            reuseExistingServer: true,
            timeout: 120 * 1000,
        },
    ],
});
