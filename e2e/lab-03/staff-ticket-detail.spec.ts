import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

test.describe('IT Staff Ticket Detail', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure the database is fresh for each browser project run
    execSync('cd ../server && npx tsx prisma/seed.ts', { stdio: 'ignore' });

    await page.goto('/');
    // Login as IT Staff
    await page.fill('input[type="email"]', 'e2e.staff@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    // Wait for the queue to load
    await expect(page.locator('h2', { hasText: 'Ticket Queue' })).toBeVisible();
  });

  test('should allow IT Staff to claim ticket and post note', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    
    // Search for the specific ticket so it appears on page 1
    await page.fill('input[placeholder="Search ticket number or summary..."]', 'TKT-2026-000002');
    await page.waitForResponse(response => response.url().includes('/api/staff/tickets') && response.request().method() === 'GET');

    // Click on the New ticket (TKT-2026-000002) - target the row or card
    const openTicketRow = page.locator('tr, div.card', { hasText: 'TKT-2026-000002' }).first();
    await openTicketRow.click();

    // Verify detail page
    await expect(page.locator('text=Ticket Details')).toBeVisible();

    // Claim Ticket
    const claimPromise = page.waitForResponse(res => res.url().includes('/api/staff/tickets/') && res.request().method() === 'PATCH');
    await page.click('button:has-text("Claim Ticket")');
    await claimPromise;
    await page.waitForLoadState('networkidle'); // Wait for subsequent GET request

    // Verify it transitioned to Open
    await expect(page.locator('select').nth(1)).toHaveValue('Open');

    // Switch to Internal Notes tab
    await page.click('button:has-text("Internal Notes")');

    // Type a note
    await page.fill('textarea[placeholder="Type a private internal note..."]', 'E2E test note');
    const notePromise = page.waitForResponse(res => res.url().includes('/notes') && res.request().method() === 'POST');
    await page.click('button:has-text("Post Note")');
    await notePromise;
    await page.waitForLoadState('networkidle');

    // Note should appear
    await expect(page.locator('text=E2E test note').last()).toBeVisible();

    // Change IT Priority
    const prioritySelect = page.locator('select').nth(0); // IT Priority is first select now? No, wait. 
    // In Staff view, IT Priority and Status are selects, plus owner. 
    // Let's use more specific locators.
    
    // Select In Progress
    const statusSelect = page.locator('select').nth(1);
    const statusPromise = page.waitForResponse(res => res.url().includes('/api/staff/tickets/') && res.request().method() === 'PATCH');
    await statusSelect.selectOption('InProgress');
    await statusPromise;
    await page.waitForLoadState('networkidle');

    // Change IT Priority
    const prioritySelectFixed = page.locator('select').nth(0);
    const priorityPromise = page.waitForResponse(res => res.url().includes('/api/staff/tickets/') && res.request().method() === 'PATCH');
    await prioritySelectFixed.selectOption('HIGH');
    await priorityPromise;
    await page.waitForLoadState('networkidle');
    
    // Reload and assert persistence
    await page.reload();

    // After reload, we are back at the queue because state is reset.
    // Search for the ticket again
    await page.fill('input[placeholder="Search ticket number or summary..."]', 'TKT-2026-000002');
    await page.waitForResponse(response => response.url().includes('/api/staff/tickets') && response.request().method() === 'GET');
    
    // We must click the ticket again (it is now InProgress).
    const reloadedTicketRow = page.locator('tr, div.card', { hasText: 'TKT-2026-000002' }).first();
    await reloadedTicketRow.click();
    await expect(page.locator('text=Ticket Details')).toBeVisible();

    await expect(page.locator('select').nth(0)).toHaveValue('HIGH');
    await expect(page.locator('select').nth(1)).toHaveValue('InProgress');
  });
});
