import { test, expect, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const snap = async (page: Page, folder: string, name: string) => {
  const dir = path.join('..', 'artifacts', 'lab-03', 'screenshots', folder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(dir, name), fullPage: true, style: 'body { position: relative !important; } .modal, .glass-overlay, .modal-backdrop { position: absolute !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important; height: auto !important; min-height: 100% !important; } .sticky-top { position: static !important; }' });
};

test.describe('4. Staff Ticket Detail Screenshots', () => {
  test.setTimeout(120000);

  test('Capture Ticket Detail states', async ({ page }) => {
    
    await page.goto('/login');
    await page.fill('input[type="email"]', 'e2e.staff@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/auth/login') && r.status() === 200),
      page.click('button[type="submit"]')
    ]);
    await page.waitForSelector('.glass-panel'); await page.waitForTimeout(1000);

    // Find an unassigned ticket
    await page.locator('select:has(option[value="unassigned"])').last().selectOption('unassigned');
    await page.waitForTimeout(1000);
    
    // Click the first unassigned ticket
    const ticketLocator = page.locator('tbody tr, .card');
    if (await ticketLocator.first().isVisible()) {
      await ticketLocator.first().click();
      await page.waitForSelector('text="Ticket Details"');
      
      // 2. ticket-detail-unassigned.png
      await snap(page, 'staff-ticket-detail', 'ticket-detail-unassigned.png');
      
      // 3. ticket-detail-claim-action.png
      await page.hover('button:has-text("Claim Ticket")');
      await snap(page, 'staff-ticket-detail', 'ticket-detail-claim-action.png');
      await page.click('button:has-text("Claim Ticket")');
      await page.waitForTimeout(1000);
    }
    
    // Find an assigned ticket (owned by me)
    await page.goto('/'); // resets state
    await page.waitForSelector('.glass-panel'); await page.waitForTimeout(1000);
    
    // In Staff view, queue is default
    await page.locator('select:has(option[value="unassigned"])').last().selectOption({ label: 'E2E Staff' });
    await page.waitForTimeout(1000);
    await ticketLocator.first().click();
    await page.waitForSelector('text="Ticket Details"');

    // 1. ticket-detail-default.png / desktop / tablet / mobile
    await snap(page, 'staff-ticket-detail', 'ticket-detail-default.png');
    await snap(page, 'staff-ticket-detail', 'ticket-detail-desktop.png');
    await page.setViewportSize({ width: 768, height: 1024 });
    await snap(page, 'staff-ticket-detail', 'ticket-detail-tablet.png');
    await page.setViewportSize({ width: 375, height: 812 });
    await snap(page, 'staff-ticket-detail', 'ticket-detail-mobile.png');
    await page.setViewportSize({ width: 1280, height: 800 });

    // 4. ticket-detail-priority-change.png
    await page.locator('select:has(option[value="HIGH"])').last().selectOption('HIGH');
    await snap(page, 'staff-ticket-detail', 'ticket-detail-priority-change.png');
    await page.waitForTimeout(1000);

    // 5. ticket-detail-status-change.png
    await page.locator('select:has(option[value="InProgress"])').last().selectOption('InProgress');
    await snap(page, 'staff-ticket-detail', 'ticket-detail-status-change.png');
    await page.waitForTimeout(1000);

    // 6. ticket-detail-invalid-transition.png
    await page.route('**/api/staff/tickets/*/status', async route => {
      await route.fulfill({ status: 400, json: { error: 'Invalid transition' } });
    });
    await page.locator('select:has(option[value="InProgress"])').last().selectOption('InProgress');
    await page.waitForTimeout(1000);
    await snap(page, 'staff-ticket-detail', 'ticket-detail-invalid-transition.png');
    await page.unroute('**/api/staff/tickets/*/status');
    await page.goto('/');
    await page.waitForSelector('.glass-panel'); await page.waitForTimeout(1000);
    await page.locator('select:has(option[value="unassigned"])').last().selectOption({ label: 'E2E Staff' });
    await page.waitForTimeout(1000);
    await ticketLocator.first().click();
    await page.waitForSelector('text="Ticket Details"');

    // 7. ticket-detail-public-comments.png
    await page.click('button:has-text("Public Comments")');
    await snap(page, 'staff-ticket-detail', 'ticket-detail-public-comments.png');

    // 9. ticket-detail-post-comment.png
    await page.fill('textarea[placeholder="Type a comment..."]', 'This is a test comment from staff');
    await snap(page, 'staff-ticket-detail', 'ticket-detail-post-comment.png');
    await page.click('button:has-text("Post Comment")');

    // 8. ticket-detail-internal-notes.png
    await page.click('button:has-text("Internal Notes")');
    await snap(page, 'staff-ticket-detail', 'ticket-detail-internal-notes.png');
    
    // 12. ticket-detail-attachments.png
    if (await page.locator('text=Attachments').isVisible()) {
        await snap(page, 'staff-ticket-detail', 'ticket-detail-attachments.png');
    }

    // Resolve ticket to test "Appears Resolved" badge
    await page.locator('select:has(option[value="InProgress"])').last().selectOption('Resolved');
    await page.waitForTimeout(1000);

    // Get the ticket summary so we can find it as requester
    const summaryText = await page.locator('label:has-text("Summary") + input').inputValue();

    // Login as Requester to mark Appears Resolved
    await page.context().clearCookies();
    await page.goto('/login');
    await page.fill('input[type="email"]', 'e2e.requester@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/auth/login') && r.status() === 200),
      page.click('button[type="submit"]')
    ]);
    await page.waitForSelector('.glass-panel'); await page.waitForTimeout(1000);
    
    // Click the ticket in My Tickets list
    await page.locator('tbody tr, .card').filter({ hasText: summaryText }).first().click();
    await page.waitForSelector('text="Ticket Details"');
    
    // Post comment as requester to trigger "Problem Appears Resolved" badge
    await page.fill('textarea[placeholder="Type a comment..."]', 'Thank you! It works now.');
    await page.click('button:has-text("Post Comment")');
    await page.waitForTimeout(1000);
    
    // Log back as Staff
    await page.context().clearCookies();
    await page.goto('/login');
    await page.fill('input[type="email"]', 'e2e.staff@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/auth/login') && r.status() === 200),
      page.click('button[type="submit"]')
    ]);
    await page.waitForSelector('.glass-panel'); await page.waitForTimeout(1000);
    
    await page.locator('select:has(option[value="unassigned"])').last().selectOption({ label: 'E2E Staff' });
    await page.waitForTimeout(1000);
    await page.locator('tbody tr, .card').filter({ hasText: summaryText }).first().click();
    await page.waitForSelector('text="Ticket Details"');
    
    // 10. ticket-detail-appears-resolved-badge.png
    await snap(page, 'staff-ticket-detail', 'ticket-detail-appears-resolved-badge.png');

    // 11. ticket-detail-terminal-blocked.png
    // Close the ticket
    await page.locator('select:has(option[value="InProgress"])').last().selectOption('Closed');
    await page.waitForTimeout(1000);
    await snap(page, 'staff-ticket-detail', 'ticket-detail-terminal-blocked.png');
  });
});
