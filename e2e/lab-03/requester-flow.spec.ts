import { test, expect } from '@playwright/test';

test.describe('E2E-05: Requester Flow (Lab 3)', () => {
  // Use the dedicated e2e fixture user
  const USER_EMAIL = 'e2e.requester@example.com';
  const PASSWORD = 'Password123!';

  test('Requester can login, create ticket, view detail, and post comments', async ({ page }) => {
    // 1. Login
    await page.goto('/');
    await page.fill('#emailInput', USER_EMAIL);
    await page.fill('#passwordInput', PASSWORD);
    await page.click('button:has-text("Sign In")');

    // Verify successful login to dashboard
    await expect(page.getByRole('heading', { name: 'My Tickets' })).toBeVisible();

    // 2. Create Ticket
    if (await page.locator('.navbar-toggler').isVisible()) {
      await page.locator('.navbar-toggler').click();
      await page.waitForTimeout(300); // wait for collapse animation
    }
    await page.getByRole('button', { name: 'Create Ticket' }).click();
    
    const summaryText = `E2E Network Issue ${Date.now()}`;
    await page.getByPlaceholder('Brief summary of the issue').fill(summaryText);
    await page.getByPlaceholder('Detailed description of the issue').fill('Cannot connect to the VPN.');
    await page.locator('#categoryId').selectOption({ label: 'Network' });
    await page.locator('#relatedSystemId').selectOption({ label: 'VPN' });
    await page.click('button:has-text("Submit Request")');

    // Verify creation success
    await expect(page.getByRole('heading', { name: 'Ticket Created Successfully!' })).toBeVisible();
    
    // Navigate to Dashboard
    if (await page.locator('.navbar-toggler').isVisible()) {
      const isExpanded = await page.locator('.navbar-toggler').getAttribute('aria-expanded');
      if (isExpanded !== 'true') {
        await page.locator('.navbar-toggler').click();
        await page.waitForTimeout(300); // wait for collapse animation
      }
    }
    await page.getByRole('button', { name: 'My Tickets' }).click();
    
    // Close the navbar on mobile so it doesn't cover the ticket list
    if (await page.locator('.navbar-toggler').isVisible()) {
      await page.locator('.navbar-toggler').click();
      await page.waitForTimeout(300);
    }
    
    // Wait for the Dashboard to appear
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

    // Verify comment displays
    await expect(page.getByText('This is a test public comment')).toBeVisible();

    // 5. Test "Problem Appears Resolved" feature
    // Button should be visible
    const appearsResolvedBtn = page.getByRole('button', { name: 'Problem Appears Resolved' });
    await expect(appearsResolvedBtn).toBeVisible();

    // Click it
    await appearsResolvedBtn.click();

    // Verify comment is posted automatically
    await expect(page.getByText('The problem appears to be resolved.')).toBeVisible();

    // Verify badge appears
    await expect(page.getByText('Appears Resolved')).toBeVisible();

    // Verify button disappears (cannot click repeatedly)
    await expect(appearsResolvedBtn).toBeHidden();
  });
});
