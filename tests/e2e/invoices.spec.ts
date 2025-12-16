import { test, expect } from '@playwright/test';

test.describe('Invoicing Flow', () => {
    // Use global setup or beforeAll to authenticate if possible, 
    // or a helper function to bypass login screen (e.g. session storage)

    test.beforeEach(async ({ page }) => {
        // Determine how to mock auth or login quickly
        await page.goto('/auth/login');
        await page.fill('input[type="email"]', 'admin.test@solistech.pro');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForURL(/\/dashboard/);
    });

    test('should create a new invoice', async ({ page }) => {
        await page.goto('/dashboard/invoices/new');

        // Select customer
        // Assuming Select component acts like a combobox or listbox
        // Need specific selectors for Shadcn Select. 
        // Usually a hidden input or button trigger.
        // This is a simplified example valid for standard implementation.

        // 1. Open customer select
        // await page.click('text=Seleccionar cliente'); 
        // await page.click('text=Cliente A'); // Select first client

        // 2. Add Line Item
        await page.fill('input[name="lines.0.description"]', 'Consultoria Solar');
        await page.fill('input[name="lines.0.quantity"]', '10');
        await page.fill('input[name="lines.0.unitPrice"]', '50');

        // 3. Submit
        await page.click('button[type="submit"]');

        // 4. Verify Invoice Details Page or List
        await expect(page).toHaveURL(/\/dashboard\/invoices/);
        await expect(page.getByText('Factura creada correctamente')).toBeVisible();
    });
});
