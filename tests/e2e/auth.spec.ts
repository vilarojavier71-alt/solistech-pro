import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    test('should allow a user to log in', async ({ page }) => {
        await page.goto('/auth/login');

        // Fill login form (Assuming standard email/password fields)
        // NOTE: In a real scenario, use test ids or specific selectors based on the implementation
        await page.fill('input[type="email"]', 'admin.test@solistech.pro');
        await page.fill('input[type="password"]', 'password123'); // Requires seed user with this password

        await page.click('button[type="submit"]');

        // Verify redirect to dashboard
        await expect(page).toHaveURL(/\/dashboard/);

        // Verify dashboard content is visible
        await expect(page.getByText('Hola,')).toBeVisible();
    });

    test('should show error on invalid credentials', async ({ page }) => {
        await page.goto('/auth/login');

        await page.fill('input[type="email"]', 'fake@user.com');
        await page.fill('input[type="password"]', 'wrongpass');
        await page.click('button[type="submit"]');

        // Expect error message
        await expect(page.getByText('Invalid login credentials')).toBeVisible(); // Or whatever the error message is
    });
});
