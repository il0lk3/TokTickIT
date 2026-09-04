import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Automated Visual Capture', () => {
  test('Capture all required states across viewports', async ({ page, isMobile }, testInfo) => {
    const viewport = testInfo.project.name; // 'chromium', 'tablet', 'mobile'
    const outDir = path.join('..', 'artifacts', 'lab-02', 'screenshots');

    const snap = async (folder: string, name: string) => {
      await page.waitForTimeout(600); // Wait for animations/transitions
      await page.screenshot({ path: path.join(outDir, folder, `${viewport}-${name}.png`), fullPage: true });
    };

    // 1. Requester Selection
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Select Development Requester' })).toBeVisible();
    await snap('requester-selection', 'initial');

    // 2. Select User with NO tickets (Kanta Su)
    await page.selectOption('select', { label: 'Kanta Su' });
    await page.getByRole('button', { name: 'Continue' }).click();

    // 3. My Tickets - Empty State
    if (isMobile) await page.locator('.navbar-toggler').click();
    await page.getByText('My Tickets').click();
    await expect(page.getByRole('heading', { name: 'My Tickets', exact: true })).toBeVisible();
    await page.waitForTimeout(1500);
    await snap('my-tickets', 'empty-state');

    // 4. Switch to Cream Su
    await page.evaluate(() => localStorage.setItem('toktickit_requester', JSON.stringify({id: 1, name: 'Cream Su'})));
    await page.goto('/');

    // 5. Create Ticket - Initial
    await expect(page.getByRole('heading', { name: 'Submit a New Request' })).toBeVisible();
    await snap('create-ticket', 'initial');

    // 6. Create Ticket - Validation
    await page.getByRole('button', { name: 'Submit Request' }).click();
    await page.waitForTimeout(500); // wait for validation text
    await snap('create-ticket', 'validation');

    // 7. Create Ticket - Success
    await page.getByLabel('Summary *').fill('E2E Screenshot Capture Ticket');
    await page.getByLabel('Description *').fill('This is a ticket created automatically for capturing responsive UI states.');
    await page.getByLabel('Category *').selectOption({ index: 1 });
    await page.getByLabel('Related System *').selectOption({ index: 1 });
    await page.getByLabel('Priority *').selectOption('MEDIUM');
    await page.getByRole('button', { name: 'Submit Request' }).click();
    
    await expect(page.getByRole('heading', { name: 'Ticket Created Successfully!' })).toBeVisible();
    await snap('create-ticket', 'success');
    
    const successText = await page.locator('strong.fs-3.text-dark').innerText();
    const ticketNumber = successText.trim();

    // 8. My Tickets - List State
    await page.goto('/'); // reset to create
    if (isMobile) await page.locator('.navbar-toggler').click();
    await page.getByText('My Tickets').click();
    await expect(page.getByRole('heading', { name: 'My Tickets', exact: true })).toBeVisible();
    await page.waitForTimeout(1500);
    await snap('my-tickets', 'list-state');

    // 9. My Tickets - No Results State
    await page.getByPlaceholder('Search tickets...').fill('asdfghjkl12345');
    await page.waitForTimeout(1500);
    await snap('my-tickets', 'no-results');

    // 10. Ticket Detail - View Mode
    await page.getByPlaceholder('Search tickets...').fill(''); // clear
    await page.waitForTimeout(1000);

    // Click the first ticket in the list
    if (isMobile) {
      await page.locator('.ticket-card, .card').first().click({ force: true });
    } else {
      await page.locator('tbody tr').first().click({ force: true });
    }
    await expect(page.getByText('Back to My Tickets').first()).toBeVisible();
    await page.waitForTimeout(1500);
    await snap('ticket-detail', 'view-mode');
  });
});
