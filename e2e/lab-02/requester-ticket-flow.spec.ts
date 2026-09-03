import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Requester Ticket Flow (Lab 2)', () => {
  test('Complete submission flow & Search', async ({ page }) => {
    // 1. Navigate to the app (Requester Selection)
    await page.goto('/');
    
    // Select "Cream Su" or "Bew Su" (Active Requester)
    await expect(page.locator('text=Welcome to TokTickIT')).toBeVisible();
    await page.selectOption('select', { label: 'Cream Su (cream.su@example.com)' }); // Select Cream Su
    await page.getByRole('button', { name: 'Continue' }).click();

    // 2. We should be on My Tickets, go to Create Ticket
    await expect(page.locator('text=My Tickets')).toBeVisible();
    await page.getByRole('button', { name: 'Create Ticket', exact: true }).click();

    // 3. Fill out the Create Ticket form
    const timestamp = Date.now();
    const testSummary = `E2E Test Ticket ${timestamp}`;
    
    await page.getByLabel('Summary *').fill(testSummary);
    await page.getByLabel('Description *').fill('This is an automated E2E test to verify the complete ticket creation flow.');
    
    // Select dropdowns
    await page.getByLabel('Category *').selectOption({ index: 1 });
    await page.getByLabel('Related System *').selectOption({ index: 1 });
    await page.getByLabel('Priority *').selectOption('HIGH');

    // Wait for the form to be ready
    await page.waitForTimeout(500);

    // 4. Submit the ticket
    await page.getByRole('button', { name: 'Submit Request' }).click();

    // 5. Success screen verification
    await expect(page.locator('text=Ticket Created Successfully!')).toBeVisible();
    
    // Extract ticket number
    const successText = await page.locator('strong.fs-3.text-dark').innerText();
    const ticketNumber = successText.trim();
    expect(ticketNumber).toMatch(/^TKT-/);

    // Go back to My Tickets
    await page.getByRole('button', { name: 'Create Another Ticket' }).click();
    await page.getByRole('button', { name: 'My Tickets' }).click();

    // 6. Search for the created ticket
    await expect(page.locator('h2', { hasText: 'My Tickets' })).toBeVisible();
    await page.getByPlaceholder('Search tickets...').fill(ticketNumber);

    // Wait for debounce and fetch
    await page.waitForTimeout(1000);

    // Verify the ticket appears in the table
    const row = page.locator(`tr:has-text("${ticketNumber}")`);
    await expect(row).toBeVisible();
    await expect(row.locator(`text=${testSummary}`)).toBeVisible();
  });
});
