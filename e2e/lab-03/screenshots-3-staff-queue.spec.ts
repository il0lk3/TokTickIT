import { test, expect, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const snap = async (page: Page, folder: string, name: string) => {
  const dir = path.join('..', 'artifacts', 'lab-03', 'screenshots', folder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(dir, name), fullPage: true });
};

test.describe('3. Staff Queue Screenshots', () => {
  test('Capture Queue states', async ({ page }) => {
    // 10. queue-forbidden.png
    await page.goto('/login');
    await page.fill('input[type="email"]', 'e2e.requester@example.com'); // Requester
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('text=My Tickets');
    await snap(page, 'staff-queue', 'queue-forbidden.png');
    if (await page.isVisible('.navbar-toggler')) { await page.click('.navbar-toggler'); await page.waitForTimeout(500); }
    await page.click('button:has-text("Logout")', { force: true });

    // Login as Staff
    await page.goto('/login');
    await page.fill('input[type="email"]', 'e2e.staff@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle'); 
    await page.waitForLoadState('networkidle');

    // 1. queue-default-view.png
    await snap(page, 'staff-queue', 'queue-default-view.png');
    await snap(page, 'staff-queue', 'queue-desktop-table.png');

    // Responsive tablet/mobile
    await page.setViewportSize({ width: 768, height: 1024 });
    await snap(page, 'staff-queue', 'queue-tablet-card.png');
    await page.setViewportSize({ width: 375, height: 812 });
    await snap(page, 'staff-queue', 'queue-mobile-card.png');
    await page.setViewportSize({ width: 1280, height: 800 });

    // 2. queue-loading.png
    await page.route('**/api/staff/tickets*', async route => {
      await new Promise(r => setTimeout(r, 1000));
      await route.fallback();
    });
    await page.fill('input[placeholder="Search ticket number or summary..."]', 'NO_MATCH_1'); await page.waitForResponse('**/api/staff/tickets*'); await page.fill('input[placeholder="Search ticket number or summary..."]', 'NO_MATCH_2'); await snap(page, 'staff-queue', 'queue-loading.png'); await page.waitForResponse('**/api/staff/tickets*');
    

    // 3. queue-empty.png
    
    await page.fill('input[placeholder="Search ticket number or summary..."]', 'NO_MATCH_3'); await page.waitForResponse('**/api/staff/tickets*'); await snap(page, 'staff-queue', 'queue-empty.png');
    

    // 4. queue-no-results.png
    await page.fill('input[placeholder="Search ticket number or summary..."]', 'NonExistentTicket12345');
    await page.waitForTimeout(1000);
    await snap(page, 'staff-queue', 'queue-no-results.png');

    // 5. queue-search-active.png
    await page.fill('input[placeholder="Search ticket number or summary..."]', 'Login');
    await page.waitForTimeout(1000);
    await snap(page, 'staff-queue', 'queue-search-active.png');
    await page.fill('input[placeholder="Search ticket number or summary..."]', '');

    // 6. queue-filters-active.png
    await page.selectOption('select:has(option[value="New"])', 'New');
    await page.waitForTimeout(1000);
    await snap(page, 'staff-queue', 'queue-filters-active.png');
    await page.selectOption('select:has(option[value="New"])', '');

    // 7. queue-sorted.png
    await page.click('th:has-text("Date")');
    await page.waitForTimeout(1000);
    await snap(page, 'staff-queue', 'queue-sorted.png');
    
    // 9. queue-unassigned-badge.png
    await page.selectOption('select:has(option[value="unassigned"])', 'unassigned');
    await page.waitForTimeout(1000);
    await snap(page, 'staff-queue', 'queue-unassigned-badge.png');
    await page.selectOption('select:has(option[value="unassigned"])', '');
    
    // 8. queue-pagination.png
    // Generate many tickets if needed, or if pagination button exists, click it
    if (await page.locator('button:has-text("Next")').isVisible()) {
        await page.click('button:has-text("Next")');
        await page.waitForTimeout(1000);
        await snap(page, 'staff-queue', 'queue-pagination.png');
    }
  });
});
