import { test, expect } from '@playwright/test';

test.describe('Time Tracking Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Authenticate
        await page.goto('/auth/login');
        await page.fill('input[type="email"]', 'admin.test@solistech.pro');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForURL(/\/dashboard/);
    });

    test('should allow check-in and check-out', async ({ page }) => {
        // Mock Geolocation
        await page.context().setGeolocation({ latitude: 40.4168, longitude: -3.7038 });
        await page.context().grantPermissions(['geolocation']);

        await page.goto('/dashboard/time-tracking');

        // Check In
        const startButton = page.getByText(/COMENZAR \(ENTRADA\)/i);
        await expect(startButton).toBeVisible();
        await startButton.click();

        // Verify Active State
        await expect(page.getByText('JORNADA ACTIVA')).toBeVisible();
        await expect(page.getByText('FINALIZAR (SALIDA)')).toBeVisible();

        // Wait a bit (simulating work)
        // await page.waitForTimeout(1000); 

        // Check Out
        await page.click('button:has-text("FINALIZAR (SALIDA)")');

        // Verify active state is gone
        await expect(startButton).toBeVisible();
        await expect(page.getByText('Salida registrada')).toBeVisible();
    });
});
