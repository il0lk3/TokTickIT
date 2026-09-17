import { test, expect } from '@playwright/test';

test.describe('E2E-05: Requester Flow (Lab 3)', () => {
  // Use je.su who has requiresPasswordChange: false in the modified seed
  const USER_EMAIL = 'je.su@example.com';
  const PASSWORD = 'Password123!';

  test('Requester can login, create ticket, view detail, and post comments', async ({ page }) => {
    // 1. Login
    await page.goto('/');
    await page.fill('#emailInput', USER_EMAIL);
    await page.fill('#passwordInput', PASSWORD);
    await page.click('button:has-text("Sign In")');

    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'debug-login.png' });
    // Verify successful login to dashboard
    await expect(page.getByRole('heading', { name: 'My Tickets' })).toBeVisible();

    // 2. Create Ticket
    if (await page.locator('.navbar-toggler').isVisible()) {
      await page.locator('.navbar-toggler').click();
    }
    await page.click('button:has-text("Create Ticket")');
    const summaryText = `E2E Network Issue ${Date.now()}`;
    await page.getByPlaceholder('Brief summary of the issue').fill(summaryText);
    await page.getByPlaceholder('Detailed description of the issue').fill('Cannot connect to the VPN.');
    await page.locator('#categoryId').selectOption({ label: 'Network' });
    await page.locator('#relatedSystemId').selectOption({ label: 'VPN' });
    await page.click('button:has-text("Submit Request")');

    // Verify success screen
    await expect(page.getByRole('heading', { name: 'Ticket Created Successfully!' })).toBeVisible();

    // Go back to dashboard
    if (await page.locator('.navbar-toggler').isVisible()) {
      await page.locator('.navbar-toggler').click();
    }
    await page.click('button:has-text("My Tickets")');

    // Wait for redirect to dashboard
    await expect(page.getByRole('heading', { name: 'My Tickets' })).toBeVisible();

    // 3. Search for the ticket
    await page.fill('input[placeholder="Search tickets..."]', summaryText);
    
    // Click on the ticket to view details
    await page.getByText(summaryText).filter({ state: 'visible' }).first().click();

    // 4. View Detail
    await expect(page.locator('text=Ticket Details').first()).toBeVisible();
    await expect(page.locator(`input[value="${summaryText}"]`)).toBeVisible();

    // 5. Add a comment
    const commentInput = page.locator('textarea[placeholder="Type a comment..."]');
    await commentInput.fill('This is a test public comment.');
    await page.click('button:has-text("Post Comment")');

    // Verify comment appears
    await expect(page.locator('text=This is a test public comment.')).toBeVisible();

    // 6. Click "Problem Appears Resolved"
    await page.click('button:has-text("Problem Appears Resolved")');

    // Verify the resolved comment appears
    await expect(page.locator('text=The problem appears to be resolved.')).toBeVisible();
  });
});
