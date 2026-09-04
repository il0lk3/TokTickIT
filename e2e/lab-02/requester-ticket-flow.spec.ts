import { test, expect } from '@playwright/test';

test.describe('Requester Ticket Flow (Lab 2)', () => {
  test('Complete submission flow & Search', async ({ page, isMobile }) => {
    // 1. Navigate to the app (Requester Selection)
    await page.goto('/');
    
    // 1. Initial State: Requester Selection
    await expect(page.getByRole('heading', { name: 'Select Development Requester' })).toBeVisible();
    await page.selectOption('select', { label: 'Cream Su' });
    await page.getByRole('button', { name: 'Continue' }).click();

    // 2. Default tab is Create Ticket
    await expect(page.getByRole('heading', { name: 'Submit a New Request' })).toBeVisible();

    // 3. Fill out the Create Ticket form
    const timestamp = Date.now();
    const testSummary = `E2E Test Ticket ${timestamp}`;
    
    await page.getByLabel('Summary *').fill(testSummary);
    await page.getByLabel('Description *').fill('This is an automated E2E test to verify the complete ticket creation flow.');
    
    // Select dropdowns
    await page.getByLabel('Category *').selectOption({ index: 1 });
    await page.getByLabel('Related System *').selectOption({ index: 1 });
    await page.getByLabel('Priority *').selectOption('HIGH');

    // Ensure form state is updated
    await expect(page.getByRole('button', { name: 'Submit Request' })).toBeEnabled();

    // 4. Submit the ticket
    await page.getByRole('button', { name: 'Submit Request' }).click();

    // 5. Success screen verification
    await expect(page.getByRole('heading', { name: 'Ticket Created Successfully!' })).toBeVisible();
    
    // Extract ticket number
    const successText = await page.locator('strong.fs-3.text-dark').innerText();
    const ticketNumber = successText.trim();
    expect(ticketNumber).toMatch(/^TKT-/);

    // Go back to My Tickets (the button in success screen says "Create Another Ticket", let's use the navbar)
    // Wait, let's just click "My Tickets" in Navbar. On mobile, we need to open hamburger first.
    if (isMobile) {
      await page.locator('.navbar-toggler').click();
    }
    await page.getByRole('button', { name: 'My Tickets' }).click();

    // 6. Search for the created ticket
    await expect(page.getByRole('heading', { name: 'My Tickets', exact: true })).toBeVisible();
    
    const searchPromise = page.waitForResponse(response => response.url().includes('/api/tickets') && response.status() === 200);
    await page.getByPlaceholder('Search tickets...').fill(ticketNumber);
    await searchPromise;

    // Verify the ticket appears
    const visibleTicketNumber = page.getByText(ticketNumber).locator('visible=true').first();
    await expect(visibleTicketNumber).toBeVisible();

    // 7. Click ticket to view Details
    await visibleTicketNumber.click();
    await expect(page.getByText('Ticket Details').locator('visible=true').first()).toBeVisible();
    await expect(page.locator(`input[value="${ticketNumber}"]`)).toBeVisible();
  });
});
