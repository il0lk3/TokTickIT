import { test, expect, Page } from '@playwright/test';
import { PrismaClient } from '../../server/node_modules/@prisma/client';
const prisma = new PrismaClient();
import fs from 'fs';
import path from 'path';

const snap = async (page: Page, folder: string, name: string) => {
  const dir = path.join('..', 'docs', 'lab-03', 'screenshots', folder);
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
    await page.goto('/queue');
    await page.waitForSelector('.glass-panel'); await page.waitForTimeout(1000);

    // Find an unassigned ticket
    await page.locator('select:has(option[value="unassigned"])').last().selectOption('unassigned');
    await page.waitForTimeout(1000);
    
    // Click the first unassigned ticket
    const ticketLocator = page.locator('tbody tr, .card');
    await expect(ticketLocator.first()).toBeVisible();
    await ticketLocator.first().click();
    await page.waitForSelector('text="Ticket Details"');
    
    // Remember this ticket URL
    const ticketUrl = page.url();

    // 2. ticket-detail-unassigned.png
    await snap(page, 'staff-ticket-detail', 'ticket-detail-unassigned.png');
    
    // 3. ticket-detail-claim-action.png
    await page.hover('button:has-text("Claim Ticket")');
    await snap(page, 'staff-ticket-detail', 'ticket-detail-claim-action.png');
    await page.click('button:has-text("Claim Ticket")');
    await page.waitForTimeout(1000);
    
    // Navigate directly to the claimed ticket
    await page.goto(ticketUrl);
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
    const statusSelect = page.locator('select[aria-label="Current Status"], select.form-select').last();
    if (await statusSelect.locator('option[value="Open"]').count() > 0) {
      await statusSelect.selectOption('Open');
      await page.waitForTimeout(500);
    }
    if (await statusSelect.locator('option[value="InProgress"]').count() > 0) {
      await statusSelect.selectOption('InProgress');
      await page.waitForTimeout(500);
    }
    await snap(page, 'staff-ticket-detail', 'ticket-detail-status-change.png');
    await page.waitForTimeout(1000);

    // 6. ticket-detail-invalid-transition.png
    await page.route('**/api/staff/tickets/*', async route => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({ status: 400, json: { error: 'Invalid transition' } });
      } else {
        await route.fallback();
      }
    });
    await statusSelect.selectOption({ index: 1 });
    await page.waitForTimeout(1000);
    await snap(page, 'staff-ticket-detail', 'ticket-detail-invalid-transition.png');
    await page.unroute('**/api/staff/tickets/*');
    
    // Reload ticket to restore clean in-progress state
    await page.goto(ticketUrl);
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

    // Get the ticket summary so we can identify it in DB
    const summaryText = await page.locator('label:has-text("Summary") + input').inputValue();

    // Test "Appears Resolved" badge
    await prisma.ticket.updateMany({
      where: { summary: summaryText },
      data: { currentStatus: 'Resolved', appearsResolved: true }
    });
    await page.reload();
    await page.waitForTimeout(1000);

    // 10. ticket-detail-appears-resolved-badge.png
    await snap(page, 'staff-ticket-detail', 'ticket-detail-appears-resolved-badge.png');

    // 11. ticket-detail-terminal-blocked.png
    // Close the ticket
    await prisma.ticket.updateMany({
      where: { summary: summaryText },
      data: { currentStatus: 'Closed' }
    });
    await page.reload();
    await page.waitForTimeout(1000);
    await snap(page, 'staff-ticket-detail', 'ticket-detail-terminal-blocked.png');
  });
});
