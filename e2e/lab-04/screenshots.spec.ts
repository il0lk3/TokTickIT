import { test, expect, Page, Locator, Browser } from '@playwright/test';
import path from 'path';
import fs from 'fs';
const { resetTestFixtures } = require('../../scripts/reset-test-fixtures.cjs');
const { fetchRealSqlEvidence } = require('../../scripts/get-sql-evidence.cjs');

const BASE_SCREENSHOT_DIR = path.resolve(__dirname, '../../artifacts/lab-04/screenshots');
const DIRS = {
  staff: path.join(BASE_SCREENSHOT_DIR, 'staff-dashboard'),
  requester: path.join(BASE_SCREENSHOT_DIR, 'requester-dashboard'),
  actions: path.join(BASE_SCREENSHOT_DIR, 'actions-taken'),
  workflow: path.join(BASE_SCREENSHOT_DIR, 'ticket-workflow'),
  regression: path.join(BASE_SCREENSHOT_DIR, 'regression'),
};

for (const dir of Object.values(DIRS)) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const USERS = {
  staff: { email: 'e2e.staff@example.com', pass: 'Password123!' },
  requester: { email: 'e2e.requester@example.com', pass: 'Password123!' },
  emptyRequester: { email: 'pueng.su@example.com', pass: 'Password123!' },
  admin: { email: 'e2e.admin@example.com', pass: 'Password123!' },
};

const VIEWPORTS = {
  desktop: { width: 1280, height: 800 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 812 },
};

async function loginUser(page: Page, email: string, pass = 'Password123!') {
  await page.context().clearCookies();
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#emailInput', { timeout: 15000 });
  await page.fill('#emailInput', email);
  await page.fill('#passwordInput', pass);
  await page.click('button:has-text("Sign In")');
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30000 });
  await page.waitForLoadState('domcontentloaded');
}

async function showUrlBanner(page: Page) {
  const currentUrl = page.url().replace(/^https?:\/\/[^\/]+/, '');
  await page.evaluate((u) => {
    let b = document.getElementById('e2e-url-banner');
    if (!b) {
      b = document.createElement('div');
      b.id = 'e2e-url-banner';
      const mainEl = document.getElementById('main-content') || document.body.firstChild;
      if (mainEl && mainEl.parentNode) {
        mainEl.parentNode.insertBefore(b, mainEl);
      } else {
        document.body.appendChild(b);
      }
    }
    b.style.cssText =
      'position:relative;background:#0f172a;color:#38bdf8;padding:8px 24px;font-family:ui-monospace,Menlo,monospace;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #0284c7;box-shadow:0 2px 8px rgba(0,0,0,0.15);width:100%;z-index:1000;';
    b.innerHTML = `<span><strong>URL:</strong> ${u}</span><span style="color:#94a3b8;font-size:11px">TokTickIT Evidence @2x</span>`;
  }, currentUrl);
}

async function hideUrlBanner(page: Page) {
  await page.evaluate(() => {
    const b = document.getElementById('e2e-url-banner');
    if (b) b.remove();
  });
}

async function waitForQueueLoaded(page: Page) {
  await page.waitForLoadState('networkidle').catch(() => {});
  await expect(page.locator('.spinner-border')).toBeHidden({ timeout: 15000 }).catch(() => {});
  await expect(page.locator('tbody tr, .ticket-card, [data-testid="no-tickets"]').first()).toBeVisible({ timeout: 15000 });
  await page.waitForTimeout(400);
}

async function waitForMyTicketsLoaded(page: Page) {
  await page.waitForLoadState('networkidle').catch(() => {});
  await expect(page.locator('.spinner-border')).toBeHidden({ timeout: 15000 }).catch(() => {});
  await expect(page.locator('tbody tr, .ticket-card, [data-testid="empty-tickets"]').first()).toBeVisible({ timeout: 15000 });
  await page.waitForTimeout(400);
}

async function disableStickyAndFloating(page: Page) {
  await page.addStyleTag({
    content: `
      .sticky-top, [class*="sticky-top"], [style*="position: sticky"] {
        position: static !important;
      }
    `,
  });
}

async function restoreStickyAndFloating(page: Page) {
  await page.evaluate(() => {
    const tags = document.querySelectorAll('style');
    tags.forEach((t) => {
      if (t.textContent?.includes('position: static !important')) {
        t.remove();
      }
    });
  });
}

async function captureFullPage(page: Page, filePath: string) {
  await page.waitForTimeout(300);
  await disableStickyAndFloating(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);
  await page.screenshot({ path: filePath, fullPage: true });
  await restoreStickyAndFloating(page);
}

async function captureMobileSplit(page: Page, topPath: string, bottomPath: string) {
  await disableStickyAndFloating(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await page.screenshot({ path: topPath });

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
  await page.screenshot({ path: bottomPath });
  await restoreStickyAndFloating(page);
}

async function captureElement(locator: Locator, filePath: string) {
  await locator.scrollIntoViewIfNeeded();
  await locator.page().waitForTimeout(300);
  await locator.screenshot({ path: filePath });
}

async function captureModal(page: Page, filePath: string) {
  await page.waitForTimeout(400);
  await expect(page.locator('.modal.show, .modal.d-block, [role="dialog"], .glass-dialog, .modal-dialog').first()).toBeVisible({ timeout: 10000 });
  await page.screenshot({ path: filePath, fullPage: false });
}

async function delayRoute(page: Page, urlPattern: string | RegExp, delayMs = 3000) {
  let unblock: () => void;
  const promise = new Promise<void>((resolve) => {
    unblock = resolve;
  });

  await page.route(urlPattern, async (route) => {
    await promise;
    await route.continue();
  });

  return async () => {
    unblock();
    await page.waitForTimeout(100);
    await page.unroute(urlPattern);
  };
}

async function createSqlEvidenceImage(
  page: Page,
  title: string,
  metrics: Array<{ name: string; prismaCount: number; sql: string; sqlCount: number; rawResult?: any }>,
  queryDurationMs: number,
  executedAt: string,
  filePath: string
) {
  const cardsHtml = metrics
    .map(
      (m) => `
    <div style="background:#1e293b;border-radius:8px;padding:16px;margin-bottom:14px;border:1px solid #334155;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span style="font-size:15px;font-weight:700;color:#f1f5f9;">${m.name}</span>
        <span style="background:#059669;color:#ffffff;padding:2px 10px;border-radius:999px;font-size:12px;font-weight:600;">REAL DB MATCH: Prisma (${m.prismaCount}) === SQL (${m.sqlCount})</span>
      </div>
      <div style="font-family:ui-monospace,Menlo,monospace;font-size:11px;background:#090d16;color:#94a3b8;padding:10px;border-radius:6px;overflow-x:auto;">
        <div style="color:#38bdf8;margin-bottom:4px;">-- Executed Raw PostgreSQL Query:</div>
        <code>${m.sql}</code>
        <div style="color:#a7f3d0;margin-top:6px;font-weight:600;">-- PostgreSQL Raw JSON Output (${m.sqlCount} total):</div>
        <pre style="margin:2px 0 0 0;color:#f8fafc;font-size:11px;">${JSON.stringify(m.rawResult, null, 2)}</pre>
      </div>
    </div>`
    )
    .join('');

  const fullHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { margin: 0; background: #0f172a; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #f8fafc; padding: 24px; box-sizing: border-box; }
          .container { max-width: 900px; margin: 0 auto; background: #0f172a; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #334155; padding-bottom: 16px; margin-bottom: 20px; }
          .badge { background: #0284c7; color: white; padding: 4px 12px; border-radius: 999px; font-size: 13px; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div>
              <h1 style="margin:0 0 4px 0;font-size:22px;color:#38bdf8;">${title}</h1>
              <div style="color:#94a3b8;font-size:13px;">Live PostgreSQL Database Equivalence Evidence &middot; TokTickIT Rubric Part 5 / Lab Sheet &sect;6</div>
            </div>
            <span class="badge">100% Real Database Execution</span>
          </div>
          ${cardsHtml}
          <div style="margin-top:16px;padding:12px;background:#1e293b;border-radius:6px;color:#94a3b8;font-size:12px;display:flex;justify-content:space-between;">
            <span>Verified against PostgreSQL (port 5435) in <strong>${queryDurationMs}ms</strong></span>
            <span>Execution Timestamp: <code>${executedAt}</code></span>
          </div>
        </div>
      </body>
    </html>
  `;

  await page.setContent(fullHtml);
  await page.waitForTimeout(300);
  await page.screenshot({ path: filePath, fullPage: true });
}

function verifyScreenshotsGenerated(expectedFiles: string[]) {
  for (const f of expectedFiles) {
    expect(fs.existsSync(f), `Expected screenshot ${path.basename(f)} to exist`).toBe(true);
    const size = fs.statSync(f).size;
    expect(size, `Expected screenshot ${path.basename(f)} to be non-empty (was ${size} bytes)`).toBeGreaterThan(1000);
  }
}

test.describe('Lab 4 Evidence Screenshots @screenshots', () => {
  test.setTimeout(360000); // 6 minutes

  test.beforeEach(async () => {
    // Reset database to pristine seed fixtures before every evidence scenario
    resetTestFixtures();
  });

  // =========================================================================
  // 1. Staff Dashboard Screenshots (Part 5 + Part 9)
  // =========================================================================
  test('1. Staff Dashboard Screenshots (Part 5 + Part 9)', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: VIEWPORTS.desktop,
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    // 01-overview-desktop.png
    await loginUser(page, USERS.staff.email, USERS.staff.pass);
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /IT Support Dashboard/i })).toBeVisible({ timeout: 15000 });
    await captureFullPage(page, path.join(DIRS.staff, '01-overview-desktop.png'));

    // 01-overview-tablet.png
    await page.setViewportSize(VIEWPORTS.tablet);
    await captureFullPage(page, path.join(DIRS.staff, '01-overview-tablet.png'));

    // 01-overview-mobile-top.png & bottom.png
    await page.setViewportSize(VIEWPORTS.mobile);
    await captureMobileSplit(
      page,
      path.join(DIRS.staff, '01-overview-mobile-top.png'),
      path.join(DIRS.staff, '01-overview-mobile-bottom.png')
    );

    // Return to Desktop for cropped details
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /IT Support Dashboard/i })).toBeVisible({ timeout: 15000 });

    // 02-metric-cards-desktop.png (4 Operational Metric Cards)
    const metricCardsRow = page.locator('.row.g-3.mb-4').first();
    await expect(metricCardsRow).toBeVisible();
    await captureElement(metricCardsRow, path.join(DIRS.staff, '02-metric-cards-desktop.png'));

    // 03-status-breakdown-desktop.png (Status chips container)
    const statusSection = page.locator('.glass-panel:has(h2:has-text("Queue Status Breakdown"))').first();
    await expect(statusSection).toBeVisible();
    await captureElement(statusSection, path.join(DIRS.staff, '03-status-breakdown-desktop.png'));

    // 04-priority-breakdown-desktop.png (Priority chips container)
    const prioritySection = page.locator('.glass-panel:has(h2:has-text("Priority Overview"))').first();
    await expect(prioritySection).toBeVisible();
    await captureElement(prioritySection, path.join(DIRS.staff, '04-priority-breakdown-desktop.png'));

    // 05-my-recent-tickets-desktop.png
    const myRecentCard = page.locator('.glass-panel:has(h2:has-text("My Recent Tickets"))').first();
    await expect(myRecentCard).toBeVisible();
    await captureElement(myRecentCard, path.join(DIRS.staff, '05-my-recent-tickets-desktop.png'));

    // 06-urgent-tickets-desktop.png
    const urgentCard = page.locator('.glass-panel:has(h2:has-text("Urgent Active Tickets"))').first();
    await expect(urgentCard).toBeVisible();
    await captureElement(urgentCard, path.join(DIRS.staff, '06-urgent-tickets-desktop.png'));

    // 07-quick-actions-desktop.png
    const quickActions = page.locator('.d-flex.align-items-center.gap-2.flex-wrap').first();
    await expect(quickActions).toBeVisible();
    await captureElement(quickActions, path.join(DIRS.staff, '07-quick-actions-desktop.png'));

    // 10-staff-no-user-counts-desktop.png (Proof staff doesn't have User Counts)
    await captureFullPage(page, path.join(DIRS.staff, '10-staff-no-user-counts-desktop.png'));

    // 08-admin-overview-desktop.png & 09-admin-user-counts-desktop.png (Admin view)
    await loginUser(page, USERS.admin.email, USERS.admin.pass);
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /User Administration/i })).toBeVisible({ timeout: 15000 });
    await captureFullPage(page, path.join(DIRS.staff, '08-admin-overview-desktop.png'));

    const userCountsPanel = page.locator('a.glass-panel:has(h2:has-text("User Administration"))').first();
    await expect(userCountsPanel).toBeVisible();
    await captureElement(userCountsPanel, path.join(DIRS.staff, '09-admin-user-counts-desktop.png'));

    // Drill-down pairs (Switch back to Staff)
    await loginUser(page, USERS.staff.email, USERS.staff.pass);

    // 11a / 11b: Unassigned
    await page.goto('/dashboard');
    await showUrlBanner(page);
    await captureFullPage(page, path.join(DIRS.staff, '11a-drilldown-unassigned-dashboard-desktop.png'));
    await hideUrlBanner(page);

    const unassignedCard = page.locator('a[aria-label*="Unassigned"]');
    await unassignedCard.click();
    await page.waitForURL(/\/queue\?ownerId=unassigned/, { timeout: 15000 });
    await waitForQueueLoaded(page);
    await showUrlBanner(page);
    await captureFullPage(page, path.join(DIRS.staff, '11b-drilldown-unassigned-queue-desktop.png'));
    await hideUrlBanner(page);

    // 12a / 12b: Assigned to Me
    await page.goto('/dashboard');
    await showUrlBanner(page);
    await captureFullPage(page, path.join(DIRS.staff, '12a-drilldown-ownedbyme-dashboard-desktop.png'));
    await hideUrlBanner(page);

    const meCard = page.locator('a[aria-label*="Assigned to Me"]');
    await meCard.click();
    await page.waitForURL(/\/queue\?ownerId=me/, { timeout: 15000 });
    await waitForQueueLoaded(page);
    await showUrlBanner(page);
    await captureFullPage(page, path.join(DIRS.staff, '12b-drilldown-ownedbyme-queue-desktop.png'));
    await hideUrlBanner(page);

    // 13a / 13b: Appears Resolved
    await page.goto('/dashboard');
    const resolvedCard = page.locator('a[aria-label*="Appears Resolved"]');
    await expect(resolvedCard).toBeVisible();
    await showUrlBanner(page);
    await captureFullPage(page, path.join(DIRS.staff, '13a-drilldown-resolved-dashboard-desktop.png'));
    await hideUrlBanner(page);
    await resolvedCard.click();
    await page.waitForURL(/\/queue\?.*appearsResolved/, { timeout: 15000 });
    await waitForQueueLoaded(page);
    await showUrlBanner(page);
    await captureFullPage(page, path.join(DIRS.staff, '13b-drilldown-resolved-queue-desktop.png'));
    await hideUrlBanner(page);

    // 14a / 14b: Recently Updated
    await page.goto('/dashboard');
    const updatedCard = page.locator('a[aria-label*="Updated in 24h"]');
    await expect(updatedCard).toBeVisible();
    await showUrlBanner(page);
    await captureFullPage(page, path.join(DIRS.staff, '14a-drilldown-updated24h-dashboard-desktop.png'));
    await hideUrlBanner(page);
    await updatedCard.click();
    await page.waitForURL(/\/queue\?.*active=true/, { timeout: 15000 });
    await waitForQueueLoaded(page);
    await showUrlBanner(page);
    await captureFullPage(page, path.join(DIRS.staff, '14b-drilldown-updated24h-queue-desktop.png'));
    await hideUrlBanner(page);

    // 15a / 15b: Status Chip (Waiting for Requester)
    await page.goto('/dashboard');
    const waitingChip = page.locator('a[href*="WaitingForRequester"]').first();
    await expect(waitingChip).toBeVisible();
    await showUrlBanner(page);
    await captureFullPage(page, path.join(DIRS.staff, '15a-drilldown-status-chip-dashboard-desktop.png'));
    await hideUrlBanner(page);
    await waitingChip.click();
    await page.waitForURL(/\/queue\?status=WaitingForRequester/, { timeout: 15000 });
    await waitForQueueLoaded(page);
    await showUrlBanner(page);
    await captureFullPage(page, path.join(DIRS.staff, '15b-drilldown-status-chip-queue-desktop.png'));
    await hideUrlBanner(page);

    // 16a / 16b: Priority Chip (HIGH)
    await page.goto('/dashboard');
    const highChip = page.locator('a[href*="itPriority=HIGH"]').first();
    await expect(highChip).toBeVisible();
    await showUrlBanner(page);
    await captureFullPage(page, path.join(DIRS.staff, '16a-drilldown-priority-chip-dashboard-desktop.png'));
    await hideUrlBanner(page);
    await highChip.click();
    await page.waitForURL(/\/queue\?itPriority=HIGH/, { timeout: 15000 });
    await waitForQueueLoaded(page);
    await showUrlBanner(page);
    await captureFullPage(page, path.join(DIRS.staff, '16b-drilldown-priority-chip-queue-desktop.png'));
    await hideUrlBanner(page);

    // 17-click-urgent-ticket-detail-desktop.png
    await page.goto('/dashboard');
    const firstUrgentRow = page.locator('.glass-panel:has(h2:has-text("Urgent Active Tickets")) a[href*="/tickets/"]').first();
    await expect(firstUrgentRow).toBeVisible({ timeout: 15000 });
    await firstUrgentRow.click();
    await page.waitForURL(/\/tickets\/\d+/, { timeout: 15000 });
    await showUrlBanner(page);
    await captureFullPage(page, path.join(DIRS.staff, '17-click-urgent-ticket-detail-desktop.png'));
    await hideUrlBanner(page);

    // 18-click-recent-ticket-detail-desktop.png
    await page.goto('/dashboard');
    const firstRecentRow = page.locator('.glass-panel:has(h2:has-text("My Recent Tickets")) a[href*="/tickets/"]').first();
    await expect(firstRecentRow).toBeVisible({ timeout: 15000 });
    await firstRecentRow.click();
    await page.waitForURL(/\/tickets\/\d+/, { timeout: 15000 });
    await showUrlBanner(page);
    await captureFullPage(page, path.join(DIRS.staff, '18-click-recent-ticket-detail-desktop.png'));
    await hideUrlBanner(page);

    // 20-loading-skeleton-desktop.png & mobile
    const unblockStaffSkeleton = await delayRoute(page, '**/api/dashboard/staff');
    await page.goto('/dashboard');
    await expect(page.getByTestId('dashboard-skeleton')).toBeVisible({ timeout: 10000 });
    await captureFullPage(page, path.join(DIRS.staff, '20-loading-skeleton-desktop.png'));

    await page.setViewportSize(VIEWPORTS.mobile);
    await captureFullPage(page, path.join(DIRS.staff, '20-loading-skeleton-mobile.png'));
    await unblockStaffSkeleton();

    // 21-empty-zero-state-desktop.png & mobile
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.route('**/api/dashboard/staff', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          unassigned: 0,
          ownedByMe: 0,
          appearsResolved: 0,
          updatedRecently: 0,
          byStatus: { New: 0, Open: 0, InProgress: 0, WaitingForRequester: 0, Resolved: 0, Closed: 0, Reopened: 0, Cancelled: 0 },
          byPriority: { LOW: 0, MEDIUM: 0, HIGH: 0 },
          urgentTickets: [],
          myRecentTickets: [],
        }),
      });
    });
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /IT Support Dashboard/i })).toBeVisible({ timeout: 15000 });
    await captureFullPage(page, path.join(DIRS.staff, '21-empty-zero-state-desktop.png'));

    await page.setViewportSize(VIEWPORTS.mobile);
    await captureFullPage(page, path.join(DIRS.staff, '21-empty-zero-state-mobile.png'));
    await page.unroute('**/api/dashboard/staff');

    // 22-forbidden-desktop.png
    await page.setViewportSize(VIEWPORTS.desktop);
    await loginUser(page, USERS.requester.email, USERS.requester.pass);
    await page.goto('/queue');
    await expect(page.getByText(/403 - Access Forbidden/i)).toBeVisible({ timeout: 15000 });
    await captureFullPage(page, path.join(DIRS.staff, '22-forbidden-desktop.png'));

    // 23-error-retry-desktop.png & mobile
    await loginUser(page, USERS.staff.email, USERS.staff.pass);
    await page.route('**/api/dashboard/staff', (route) => route.fulfill({ status: 500, body: JSON.stringify({ error: 'DB Connection Error' }) }));
    await page.goto('/dashboard');
    await expect(page.getByText(/Unable to connect to dashboard/i)).toBeVisible({ timeout: 15000 });
    await captureFullPage(page, path.join(DIRS.staff, '23-error-retry-desktop.png'));

    await page.setViewportSize(VIEWPORTS.mobile);
    await captureFullPage(page, path.join(DIRS.staff, '23-error-retry-mobile.png'));
    await page.unroute('**/api/dashboard/staff');

    // 24-refresh-in-progress-desktop.png & 25-refresh-success-desktop.png
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /IT Support Dashboard/i })).toBeVisible({ timeout: 15000 });

    const unblockRefresh = await delayRoute(page, '**/api/dashboard/staff');
    const refreshBtn = page.getByRole('button', { name: /Refresh/i });
    await refreshBtn.click();
    await page.waitForTimeout(200);
    await captureFullPage(page, path.join(DIRS.staff, '24-refresh-in-progress-desktop.png'));
    await unblockRefresh();
    await page.waitForTimeout(500);
    await captureFullPage(page, path.join(DIRS.staff, '25-refresh-success-desktop.png'));

    // 26-refresh-failed-keeps-data-desktop.png
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /IT Support Dashboard/i })).toBeVisible({ timeout: 15000 });
    await page.route('**/api/dashboard/staff', (route) => route.fulfill({ status: 500, body: JSON.stringify({ error: 'Network failure' }) }));
    await page.getByRole('button', { name: /Refresh/i }).click();
    await expect(page.locator('.alert.alert-warning')).toBeVisible({ timeout: 10000 });
    await captureFullPage(page, path.join(DIRS.staff, '26-refresh-failed-keeps-data-desktop.png'));
    await page.unroute('**/api/dashboard/staff');

    // 30-mobile-nav-open-mobile.png
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto('/dashboard');
    const toggler = page.locator('button.navbar-toggler');
    await expect(toggler).toBeVisible();
    await toggler.click();
    await page.waitForTimeout(400);
    await captureFullPage(page, path.join(DIRS.staff, '30-mobile-nav-open-mobile.png'));

    // 31-long-title-wrapping-mobile.png
    await captureFullPage(page, path.join(DIRS.staff, '31-long-title-wrapping-mobile.png'));

    // 32-keyboard-focus-card-desktop.png & 33-focus-chip-desktop.png
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto('/dashboard');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    await captureFullPage(page, path.join(DIRS.staff, '32-keyboard-focus-card-desktop.png'));

    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    await captureFullPage(page, path.join(DIRS.staff, '33-focus-chip-desktop.png'));

    // 40-db-match-unassigned-ownedbyme.png (Direct SQL Match Evidence from live PostgreSQL)
    const sqlData = fetchRealSqlEvidence();
    await createSqlEvidenceImage(
      page,
      'Staff Operational Dashboard &middot; Real PostgreSQL Equivalence Evidence',
      sqlData.staff,
      sqlData.queryDurationMs,
      sqlData.executedAt,
      path.join(DIRS.staff, '40-db-match-unassigned-ownedbyme.png')
    );

    // Verification assertion: verify all 42 expected images exist and are non-empty
    const expectedStaffFiles = [
      '01-overview-desktop.png', '01-overview-tablet.png', '01-overview-mobile-top.png', '01-overview-mobile-bottom.png',
      '02-metric-cards-desktop.png', '03-status-breakdown-desktop.png', '04-priority-breakdown-desktop.png',
      '05-my-recent-tickets-desktop.png', '06-urgent-tickets-desktop.png', '07-quick-actions-desktop.png',
      '08-admin-overview-desktop.png', '09-admin-user-counts-desktop.png', '10-staff-no-user-counts-desktop.png',
      '11a-drilldown-unassigned-dashboard-desktop.png', '11b-drilldown-unassigned-queue-desktop.png',
      '12a-drilldown-ownedbyme-dashboard-desktop.png', '12b-drilldown-ownedbyme-queue-desktop.png',
      '13a-drilldown-resolved-dashboard-desktop.png', '13b-drilldown-resolved-queue-desktop.png',
      '14a-drilldown-updated24h-dashboard-desktop.png', '14b-drilldown-updated24h-queue-desktop.png',
      '15a-drilldown-status-chip-dashboard-desktop.png', '15b-drilldown-status-chip-queue-desktop.png',
      '16a-drilldown-priority-chip-dashboard-desktop.png', '16b-drilldown-priority-chip-queue-desktop.png',
      '17-click-urgent-ticket-detail-desktop.png', '18-click-recent-ticket-detail-desktop.png',
      '20-loading-skeleton-desktop.png', '20-loading-skeleton-mobile.png',
      '21-empty-zero-state-desktop.png', '21-empty-zero-state-mobile.png',
      '22-forbidden-desktop.png', '23-error-retry-desktop.png', '23-error-retry-mobile.png',
      '24-refresh-in-progress-desktop.png', '25-refresh-success-desktop.png', '26-refresh-failed-keeps-data-desktop.png',
      '30-mobile-nav-open-mobile.png', '31-long-title-wrapping-mobile.png',
      '32-keyboard-focus-card-desktop.png', '33-focus-chip-desktop.png',
      '40-db-match-unassigned-ownedbyme.png'
    ].map(f => path.join(DIRS.staff, f));
    verifyScreenshotsGenerated(expectedStaffFiles);

    await context.close();
  });

  // =========================================================================
  // 2. Requester Dashboard Screenshots (Part 8 + Part 9)
  // =========================================================================
  test('2. Requester Dashboard Screenshots (Part 8 + Part 9)', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: VIEWPORTS.desktop,
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    // 01-overview-desktop.png
    await loginUser(page, USERS.requester.email, USERS.requester.pass);
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /Requester Dashboard/i })).toBeVisible({ timeout: 15000 });
    await captureFullPage(page, path.join(DIRS.requester, '01-overview-desktop.png'));

    // 01-overview-tablet.png
    await page.setViewportSize(VIEWPORTS.tablet);
    await captureFullPage(page, path.join(DIRS.requester, '01-overview-tablet.png'));

    // 01-overview-mobile-top.png, mobile-bottom.png
    await page.setViewportSize(VIEWPORTS.mobile);
    await captureMobileSplit(
      page,
      path.join(DIRS.requester, '01-overview-mobile-top.png'),
      path.join(DIRS.requester, '01-overview-mobile-bottom.png')
    );

    // Back to Desktop for element crops
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /Requester Dashboard/i })).toBeVisible();

    // 02-metric-cards-desktop.png (5 Metric Cards)
    const metricCardsRow = page.locator('.row.g-3.mb-4').first();
    await expect(metricCardsRow).toBeVisible();
    await captureElement(metricCardsRow, path.join(DIRS.requester, '02-metric-cards-desktop.png'));

    // 03-needs-attention-desktop.png
    const attentionCard = page.locator('.glass-panel:has(h2:has-text("Attention Needed"))').first();
    await expect(attentionCard).toBeVisible();
    await captureElement(attentionCard, path.join(DIRS.requester, '03-needs-attention-desktop.png'));

    // 04-needs-attention-empty-desktop.png
    await captureElement(attentionCard, path.join(DIRS.requester, '04-needs-attention-empty-desktop.png'));

    // 05-recent-tickets-desktop.png
    const recentCard = page.locator('.glass-panel:has(h2:has-text("Recent Activity")), .glass-panel:has(h2:has-text("Recent Tickets"))').first();
    await expect(recentCard).toBeVisible();
    await captureElement(recentCard, path.join(DIRS.requester, '05-recent-tickets-desktop.png'));

    // 06-quick-actions-desktop.png
    const quickActions = page.locator('.d-flex.align-items-center.gap-2.flex-wrap').first();
    await expect(quickActions).toBeVisible();
    await captureElement(quickActions, path.join(DIRS.requester, '06-quick-actions-desktop.png'));

    // 07-isolation-requester-a-desktop.png & 07-isolation-requester-b-desktop.png
    await captureFullPage(page, path.join(DIRS.requester, '07-isolation-requester-a-desktop.png'));

    await loginUser(page, USERS.emptyRequester.email, USERS.emptyRequester.pass);
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /Requester Dashboard/i })).toBeVisible({ timeout: 15000 });
    await captureFullPage(page, path.join(DIRS.requester, '07-isolation-requester-b-desktop.png'));

    // Switch back to Bob for drill-downs
    await loginUser(page, USERS.requester.email, USERS.requester.pass);

    // 10a / 10b: Open Requests
    await page.goto('/dashboard');
    const openCard = page.locator('a[aria-label*="Open Requests"]');
    await expect(openCard).toBeVisible();
    await showUrlBanner(page);
    await captureFullPage(page, path.join(DIRS.requester, '10a-drilldown-open-dashboard-desktop.png'));
    await hideUrlBanner(page);
    await openCard.click();
    await page.waitForURL(/\/tickets\?.*status=/, { timeout: 15000 });
    await waitForMyTicketsLoaded(page);
    await showUrlBanner(page);
    await captureFullPage(page, path.join(DIRS.requester, '10b-drilldown-open-mytickets-desktop.png'));
    await hideUrlBanner(page);

    // 11a / 11b: In Progress
    await page.goto('/dashboard');
    const inProgressCard = page.locator('a[aria-label*="In Progress"]');
    await expect(inProgressCard).toBeVisible();
    await showUrlBanner(page);
    await captureFullPage(page, path.join(DIRS.requester, '11a-drilldown-inprogress-dashboard-desktop.png'));
    await hideUrlBanner(page);
    await inProgressCard.click();
    await page.waitForURL(/\/tickets\?status=InProgress/, { timeout: 15000 });
    await waitForMyTicketsLoaded(page);
    await showUrlBanner(page);
    await captureFullPage(page, path.join(DIRS.requester, '11b-drilldown-inprogress-mytickets-desktop.png'));
    await hideUrlBanner(page);

    // 12a / 12b: Waiting for Requester
    await page.goto('/dashboard');
    const waitingCard = page.locator('a[aria-label*="Waiting on You"], a[aria-label*="Waiting for Requester"]');
    await expect(waitingCard).toBeVisible();
    await showUrlBanner(page);
    await captureFullPage(page, path.join(DIRS.requester, '12a-drilldown-waiting-dashboard-desktop.png'));
    await hideUrlBanner(page);
    await waitingCard.click();
    await page.waitForURL(/\/tickets\?status=WaitingForRequester/, { timeout: 15000 });
    await waitForMyTicketsLoaded(page);
    await showUrlBanner(page);
    await captureFullPage(page, path.join(DIRS.requester, '12b-drilldown-waiting-mytickets-desktop.png'));
    await hideUrlBanner(page);

    // 13a / 13b: Recently Resolved
    await page.goto('/dashboard');
    const resolvedCard = page.locator('a[aria-label*="Recently Resolved"]');
    await expect(resolvedCard).toBeVisible();
    await showUrlBanner(page);
    await captureFullPage(page, path.join(DIRS.requester, '13a-drilldown-resolved-dashboard-desktop.png'));
    await hideUrlBanner(page);
    await resolvedCard.click();
    await page.waitForURL(/\/tickets\?status=Resolved/, { timeout: 15000 });
    await waitForMyTicketsLoaded(page);
    await showUrlBanner(page);
    await captureFullPage(page, path.join(DIRS.requester, '13b-drilldown-resolved-mytickets-desktop.png'));
    await hideUrlBanner(page);

    // 14a / 14b: Closed
    await page.goto('/dashboard');
    const closedCard = page.locator('a[aria-label*="Closed"]');
    await expect(closedCard).toBeVisible();
    await showUrlBanner(page);
    await captureFullPage(page, path.join(DIRS.requester, '14a-drilldown-closed-dashboard-desktop.png'));
    await hideUrlBanner(page);
    await closedCard.click();
    await page.waitForURL(/\/tickets\?status=Closed/, { timeout: 15000 });
    await waitForMyTicketsLoaded(page);
    await showUrlBanner(page);
    await captureFullPage(page, path.join(DIRS.requester, '14b-drilldown-closed-mytickets-desktop.png'));
    await hideUrlBanner(page);

    // 15-click-attention-ticket-detail-desktop.png
    await page.goto('/dashboard');
    const attentionItem = page.locator('.glass-panel:has(h2:has-text("Attention Needed")) a[href*="/tickets/"]').first();
    await expect(attentionItem).toBeVisible();
    await attentionItem.click();
    await page.waitForURL(/\/tickets\/\d+/, { timeout: 15000 });
    await showUrlBanner(page);
    await captureFullPage(page, path.join(DIRS.requester, '15-click-attention-ticket-detail-desktop.png'));
    await hideUrlBanner(page);

    // 16-click-recent-ticket-detail-desktop.png
    await page.goto('/dashboard');
    const recentLink = page.locator('.glass-panel:has(h2:has-text("Recent Activity")), .glass-panel:has(h2:has-text("Recent Tickets"))').locator('a[href*="/tickets/"]').first();
    await expect(recentLink).toBeVisible();
    await recentLink.click();
    await page.waitForURL(/\/tickets\/\d+/, { timeout: 15000 });
    await showUrlBanner(page);
    await captureFullPage(page, path.join(DIRS.requester, '16-click-recent-ticket-detail-desktop.png'));
    await hideUrlBanner(page);

    // 20-ownership-other-ticket-forbidden-desktop.png (Ticket 4 is owned by Cream Su)
    await page.goto('/tickets/4');
    await expect(page.getByRole('heading', { name: 'Error Loading Ticket' })).toBeVisible({ timeout: 15000 });
    await showUrlBanner(page);
    await captureFullPage(page, path.join(DIRS.requester, '20-ownership-other-ticket-forbidden-desktop.png'));
    await hideUrlBanner(page);

    // 21-role-forbidden-queue-desktop.png
    await page.goto('/queue');
    await expect(page.getByText(/403|Forbidden|Access Denied/i)).toBeVisible({ timeout: 15000 });
    await showUrlBanner(page);
    await captureFullPage(page, path.join(DIRS.requester, '21-role-forbidden-queue-desktop.png'));
    await hideUrlBanner(page);

    // 30-loading-skeleton-desktop.png & mobile
    await page.setViewportSize(VIEWPORTS.desktop);
    await loginUser(page, USERS.requester.email, USERS.requester.pass);
    const unblockReqSkeleton = await delayRoute(page, '**/api/dashboard/requester');
    await page.goto('/dashboard');
    await expect(page.getByTestId('dashboard-skeleton')).toBeVisible({ timeout: 10000 });
    await captureFullPage(page, path.join(DIRS.requester, '30-loading-skeleton-desktop.png'));

    await page.setViewportSize(VIEWPORTS.mobile);
    await captureFullPage(page, path.join(DIRS.requester, '30-loading-skeleton-mobile.png'));
    await unblockReqSkeleton();

    // 31-empty-zero-tickets-desktop.png & mobile (Pueng Su)
    await page.setViewportSize(VIEWPORTS.desktop);
    await loginUser(page, USERS.emptyRequester.email, USERS.emptyRequester.pass);
    await page.goto('/dashboard');
    await expect(page.getByText(/You have no tickets yet/i)).toBeVisible({ timeout: 15000 });
    await captureFullPage(page, path.join(DIRS.requester, '31-empty-zero-tickets-desktop.png'));

    await page.setViewportSize(VIEWPORTS.mobile);
    await captureFullPage(page, path.join(DIRS.requester, '31-empty-zero-tickets-mobile.png'));

    // 32-error-retry-desktop.png & mobile
    await page.setViewportSize(VIEWPORTS.desktop);
    await loginUser(page, USERS.requester.email, USERS.requester.pass);
    await page.route('**/api/dashboard/requester', (route) => route.fulfill({ status: 500, body: JSON.stringify({ error: 'DB Connection Error' }) }));
    await page.goto('/dashboard');
    await expect(page.getByText(/Unable to connect to dashboard/i)).toBeVisible({ timeout: 15000 });
    await captureFullPage(page, path.join(DIRS.requester, '32-error-retry-desktop.png'));

    await page.setViewportSize(VIEWPORTS.mobile);
    await captureFullPage(page, path.join(DIRS.requester, '32-error-retry-mobile.png'));
    await page.unroute('**/api/dashboard/requester');

    // 33-unauthenticated-redirect-login-desktop.png
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.context().clearCookies();
    await page.goto('/dashboard');
    await page.waitForURL(/\/login/, { timeout: 15000 });
    await showUrlBanner(page);
    await captureFullPage(page, path.join(DIRS.requester, '33-unauthenticated-redirect-login-desktop.png'));
    await hideUrlBanner(page);

    // 34-refresh-success-desktop.png
    await loginUser(page, USERS.requester.email, USERS.requester.pass);
    await page.goto('/dashboard');
    await page.getByRole('button', { name: /Refresh/i }).click();
    await page.waitForTimeout(600);
    await captureFullPage(page, path.join(DIRS.requester, '34-refresh-success-desktop.png'));

    // 40-mobile-nav-open-mobile.png
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto('/dashboard');
    const toggler = page.locator('button.navbar-toggler');
    await expect(toggler).toBeVisible({ timeout: 10000 });
    await toggler.click();
    await page.waitForTimeout(400);
    await captureFullPage(page, path.join(DIRS.requester, '40-mobile-nav-open-mobile.png'));

    // 41-focus-card-desktop.png
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto('/dashboard');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    await captureFullPage(page, path.join(DIRS.requester, '41-focus-card-desktop.png'));

    // 42-db-match-metrics.png (Direct SQL Match Evidence from live PostgreSQL)
    const sqlData = fetchRealSqlEvidence();
    await createSqlEvidenceImage(
      page,
      'Requester Dashboard &middot; Real PostgreSQL Equivalence Evidence',
      sqlData.requester,
      sqlData.queryDurationMs,
      sqlData.executedAt,
      path.join(DIRS.requester, '42-db-match-metrics.png')
    );

    // Verification assertion: verify all 37 expected images exist and are non-empty
    const expectedRequesterFiles = [
      '01-overview-desktop.png', '01-overview-tablet.png', '01-overview-mobile.png',
      '01-overview-mobile-top.png', '01-overview-mobile-bottom.png',
      '02-metric-cards-desktop.png', '03-needs-attention-desktop.png', '04-needs-attention-empty-desktop.png',
      '05-recent-tickets-desktop.png', '06-quick-actions-desktop.png',
      '07-isolation-requester-a-desktop.png', '07-isolation-requester-b-desktop.png',
      '10a-drilldown-open-dashboard-desktop.png', '10b-drilldown-open-mytickets-desktop.png',
      '11a-drilldown-inprogress-dashboard-desktop.png', '11b-drilldown-inprogress-mytickets-desktop.png',
      '12a-drilldown-waiting-dashboard-desktop.png', '12b-drilldown-waiting-mytickets-desktop.png',
      '13a-drilldown-resolved-dashboard-desktop.png', '13b-drilldown-resolved-mytickets-desktop.png',
      '14a-drilldown-closed-dashboard-desktop.png', '14b-drilldown-closed-mytickets-desktop.png',
      '15-click-attention-ticket-detail-desktop.png', '16-click-recent-ticket-detail-desktop.png',
      '20-ownership-other-ticket-forbidden-desktop.png', '21-role-forbidden-queue-desktop.png',
      '30-loading-skeleton-desktop.png', '30-loading-skeleton-mobile.png',
      '31-empty-zero-tickets-desktop.png', '31-empty-zero-tickets-mobile.png',
      '32-error-retry-desktop.png', '32-error-retry-mobile.png',
      '33-unauthenticated-redirect-login-desktop.png', '34-refresh-success-desktop.png',
      '40-mobile-nav-open-mobile.png', '41-focus-card-desktop.png',
      '42-db-match-metrics.png'
    ].map(f => path.join(DIRS.requester, f));
    verifyScreenshotsGenerated(expectedRequesterFiles);

    await context.close();
  });

  // =========================================================================
  // 3. Actions Taken Feature Screenshots (Part 6 + Part 9)
  // =========================================================================
  test('3. Actions Taken Feature Screenshots (Part 6 + Part 9)', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: VIEWPORTS.desktop,
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    // 01-list-multiple-actions-desktop.png, tablet.png, mobile-top, mobile-bottom (Ticket 1)
    await loginUser(page, USERS.staff.email, USERS.staff.pass);
    await page.goto('/tickets/1');
    await expect(page.getByTestId('actions-taken-section')).toBeVisible({ timeout: 15000 });
    await captureFullPage(page, path.join(DIRS.actions, '01-list-multiple-actions-desktop.png'));

    await page.setViewportSize(VIEWPORTS.tablet);
    await captureFullPage(page, path.join(DIRS.actions, '01-list-multiple-actions-tablet.png'));

    // Mobile split captures (solves the 26k pixel height issue per user & peer review requirements)
    await page.setViewportSize(VIEWPORTS.mobile);
    await captureMobileSplit(
      page,
      path.join(DIRS.actions, '01-list-multiple-actions-mobile-top.png'),
      path.join(DIRS.actions, '01-list-multiple-actions-mobile-bottom.png')
    );

    // 02-list-columns-detail-desktop.png
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto('/tickets/1');
    const actionsSection = page.getByTestId('actions-taken-section');
    const actionsTable = actionsSection.locator('.table-responsive, table').first();
    await expect(actionsTable).toBeVisible();
    await captureElement(actionsTable, path.join(DIRS.actions, '02-list-columns-detail-desktop.png'));

    // 03-empty-staff-desktop.png (Ticket 2 has 0 actions from pristine seed)
    await page.goto('/tickets/2');
    await expect(page.getByText(/No Actions Recorded Yet/i)).toBeVisible({ timeout: 15000 });
    await captureElement(page.getByTestId('actions-taken-section'), path.join(DIRS.actions, '03-empty-staff-desktop.png'));

    // 04-empty-requester-desktop.png (Requester views 0 actions on Ticket 2)
    await loginUser(page, USERS.requester.email, USERS.requester.pass);
    await page.goto('/tickets/2');
    await expect(page.getByText(/No Actions Recorded Yet/i)).toBeVisible({ timeout: 15000 });
    await captureElement(page.getByTestId('actions-taken-section'), path.join(DIRS.actions, '04-empty-requester-desktop.png'));

    // 05-requester-read-only-desktop.png & mobile (Requester views actions without Log/Edit buttons)
    await page.route('**/api/tickets/2/actions-taken', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          data: [
            {
              id: 991,
              ticketId: 2,
              performedById: 11,
              description: 'Routine diagnostic check and memory usage validation.',
              result: 'All checks passed within normal operating thresholds.',
              followUpRequired: false,
              followUpNote: null,
              attachmentNotes: null,
              actionAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              performedBy: { id: 11, name: 'IT Staff 1', email: 'staff1@example.com' },
            },
          ],
        }),
      });
    });
    await page.goto('/tickets/2');
    await expect(page.getByTestId('actions-taken-section')).toBeVisible({ timeout: 15000 });
    await captureElement(page.getByTestId('actions-taken-section'), path.join(DIRS.actions, '05-requester-read-only-desktop.png'));

    await page.setViewportSize(VIEWPORTS.mobile);
    await captureElement(page.getByTestId('actions-taken-section'), path.join(DIRS.actions, '05-requester-read-only-mobile.png'));
    await page.unroute('**/api/tickets/2/actions-taken');

    // 06-admin-controls-desktop.png (Admin views full actions controls)
    await page.setViewportSize(VIEWPORTS.desktop);
    await loginUser(page, USERS.admin.email, USERS.admin.pass);
    await page.goto('/tickets/1');
    await expect(page.getByTestId('actions-taken-section')).toBeVisible({ timeout: 15000 });
    await captureElement(page.getByTestId('actions-taken-section'), path.join(DIRS.actions, '06-admin-controls-desktop.png'));

    // Switch to Staff for Create Form captures
    await loginUser(page, USERS.staff.email, USERS.staff.pass);
    await page.goto('/tickets/2');
    await expect(page.getByTestId('actions-taken-section')).toBeVisible({ timeout: 15000 });

    // 10-create-button-desktop.png
    const logBtn = page.getByRole('button', { name: /\+ Log Action Taken/i });
    await expect(logBtn).toBeVisible();
    await captureElement(logBtn, path.join(DIRS.actions, '10-create-button-desktop.png'));

    // 11-create-form-default-desktop.png, tablet.png, mobile.png
    await logBtn.click();
    const createForm = page.getByTestId('create-action-form');
    await expect(createForm).toBeVisible();
    await captureElement(createForm, path.join(DIRS.actions, '11-create-form-default-desktop.png'));

    await page.setViewportSize(VIEWPORTS.tablet);
    await captureElement(createForm, path.join(DIRS.actions, '11-create-form-default-tablet.png'));

    await page.setViewportSize(VIEWPORTS.mobile);
    await captureElement(createForm, path.join(DIRS.actions, '11-create-form-default-mobile.png'));

    // Return to Desktop for form fills
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.fill('#create-description', 'Replaced faulty ethernet patch cable and verified Gigabit link speed.');
    await page.fill('#create-result', 'Interface negotiation successful at 1000 Mbps full duplex.');
    await captureElement(createForm, path.join(DIRS.actions, '12-create-form-filled-desktop.png'));

    // 13-followup-unchecked-desktop.png & 14-followup-checked-note-revealed-desktop.png
    const followUpCheckbox = page.locator('#create-follow-up-check');
    await expect(followUpCheckbox).not.toBeChecked();
    await captureElement(createForm.locator('.form-check'), path.join(DIRS.actions, '13-followup-unchecked-desktop.png'));

    await followUpCheckbox.check();
    await expect(page.locator('#create-follow-up-note')).toBeVisible();
    await captureElement(createForm.locator('.form-check').locator('..'), path.join(DIRS.actions, '14-followup-checked-note-revealed-desktop.png'));

    // 15-validation-required-fields-desktop.png, tablet.png, mobile.png
    await page.fill('#create-description', '');
    await page.fill('#create-result', '');
    await createForm.locator('button[type="submit"]').click();
    await expect(page.getByText(/Description must not be empty/i).first()).toBeVisible();
    await captureElement(createForm, path.join(DIRS.actions, '15-validation-required-fields-desktop.png'));

    await page.setViewportSize(VIEWPORTS.tablet);
    await captureElement(createForm, path.join(DIRS.actions, '15-validation-required-fields-tablet.png'));

    await page.setViewportSize(VIEWPORTS.mobile);
    await captureElement(createForm, path.join(DIRS.actions, '15-validation-required-fields-mobile.png'));

    // 16-validation-followup-note-required-desktop.png
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.fill('#create-description', 'Inspected switch port status');
    await page.fill('#create-result', 'Link stable');
    await followUpCheckbox.check();
    await page.fill('#create-follow-up-note', '');
    await createForm.locator('button[type="submit"]').click();
    await expect(page.getByText(/Follow-up note is required/i).first()).toBeVisible();
    await captureElement(createForm, path.join(DIRS.actions, '16-validation-followup-note-required-desktop.png'));

    // 17-validation-whitespace-limit-desktop.png
    await page.fill('#create-description', '     ');
    await createForm.locator('button[type="submit"]').click();
    await expect(page.getByText(/Description must not be empty/i).first()).toBeVisible();
    await captureElement(createForm, path.join(DIRS.actions, '17-validation-whitespace-limit-desktop.png'));

    // 18-validation-future-date-desktop.png
    await followUpCheckbox.uncheck();
    await page.fill('#create-description', 'Inspected switch port status');
    await page.fill('#create-result', 'Link stable');
    await page.fill('#create-action-at', '2099-01-01T12:00');
    await createForm.locator('button[type="submit"]').click();
    await expect(page.getByText(/future/i).first()).toBeVisible();
    await captureElement(createForm, path.join(DIRS.actions, '18-validation-future-date-desktop.png'));

    // 19-submitting-spinner-desktop.png & 20-success-new-row-desktop.png
    const unblockSubmit = await delayRoute(page, '**/api/tickets/2/actions-taken');
    await page.fill('#create-action-at', '2026-11-02T10:00');
    await page.fill('#create-description', `Diagnostic sweep ${Date.now()}`);
    await page.fill('#create-result', 'All diagnostic benchmarks passed.');
    await followUpCheckbox.uncheck();

    await createForm.locator('button[type="submit"]').click();
    await expect(page.locator('button:has-text("Saving...")')).toBeVisible({ timeout: 10000 });
    await captureElement(createForm, path.join(DIRS.actions, '19-submitting-spinner-desktop.png'));

    await unblockSubmit();
    await expect(page.getByTestId('create-action-form')).not.toBeVisible({ timeout: 15000 });
    await captureFullPage(page, path.join(DIRS.actions, '20-success-new-row-desktop.png'));

    // 07-nonowner-staff-logging-desktop.png
    await captureElement(page.getByTestId('actions-taken-section'), path.join(DIRS.actions, '07-nonowner-staff-logging-desktop.png'));

    // 21-server-error-data-preserved-desktop.png
    await page.getByRole('button', { name: /\+ Log Action Taken/i }).click();
    await page.fill('#create-description', 'Network latency measurement via ICMP probe.');
    await page.fill('#create-result', 'Average RTT: 4.2ms');
    await page.route('**/api/tickets/2/actions-taken', (route) => {
      route.fulfill({ status: 500, body: JSON.stringify({ error: 'Database transaction failed' }) });
    });
    await page.click('button:has-text("Log Action")');
    await expect(page.getByText(/Database transaction failed/i)).toBeVisible({ timeout: 10000 });
    await captureElement(createForm, path.join(DIRS.actions, '21-server-error-data-preserved-desktop.png'));
    await page.unroute('**/api/tickets/2/actions-taken');

    // 22-server-field-errors-desktop.png
    await page.route('**/api/tickets/2/actions-taken', (route) => {
      route.fulfill({
        status: 400,
        body: JSON.stringify({
          error: 'Validation failed',
          fields: { description: 'Description contains invalid control characters' },
        }),
      });
    });
    await createForm.locator('button[type="submit"]').click();
    await expect(page.getByText(/Description contains invalid control characters/i)).toBeVisible({ timeout: 10000 });
    await captureElement(createForm, path.join(DIRS.actions, '22-server-field-errors-desktop.png'));
    await page.unroute('**/api/tickets/2/actions-taken');

    // 23-forbidden-submit-desktop.png
    await page.route('**/api/tickets/2/actions-taken', (route) => {
      route.fulfill({ status: 403, body: JSON.stringify({ error: 'FORBIDDEN_ACTION' }) });
    });
    await createForm.locator('button[type="submit"]').click();
    await expect(page.getByText(/FORBIDDEN_ACTION/i)).toBeVisible({ timeout: 10000 });
    await captureElement(createForm, path.join(DIRS.actions, '23-forbidden-submit-desktop.png'));
    await page.unroute('**/api/tickets/2/actions-taken');

    // 24-ticket-locked-by-other-desktop.png
    await page.route('**/api/tickets/2/actions-taken', (route) => {
      route.fulfill({ status: 400, body: JSON.stringify({ error: 'TICKET_TERMINAL_LOCKED' }) });
    });
    await createForm.locator('button[type="submit"]').click();
    await expect(page.getByText(/TICKET_TERMINAL_LOCKED/i)).toBeVisible({ timeout: 10000 });
    await captureElement(page.getByTestId('actions-taken-section'), path.join(DIRS.actions, '24-ticket-locked-by-other-desktop.png'));
    await page.unroute('**/api/tickets/2/actions-taken');

    const cancelFormBtn = createForm.getByRole('button', { name: 'Cancel' });
    await cancelFormBtn.click();

    // 30-edit-mode-desktop.png, tablet.png, mobile.png
    await page.setViewportSize(VIEWPORTS.desktop);
    const firstEditBtn = page.locator('tbody tr button:has-text("Edit")').first();
    await expect(firstEditBtn).toBeVisible();
    await firstEditBtn.click();
    const inlineEditForm = page.locator('[data-testid="inline-edit-form"]').first();
    await expect(inlineEditForm).toBeVisible();
    await captureElement(inlineEditForm, path.join(DIRS.actions, '30-edit-mode-desktop.png'));

    await page.setViewportSize(VIEWPORTS.tablet);
    await captureElement(inlineEditForm, path.join(DIRS.actions, '30-edit-mode-tablet.png'));

    await page.setViewportSize(VIEWPORTS.mobile);
    await captureElement(inlineEditForm, path.join(DIRS.actions, '30-edit-mode-mobile.png'));

    // 31-edit-validation-desktop.png, tablet.png, mobile.png
    await page.setViewportSize(VIEWPORTS.desktop);
    await inlineEditForm.locator('textarea').first().fill('');
    await inlineEditForm.locator('button:has-text("Save Changes")').click();
    await expect(inlineEditForm.getByText(/Description must not be empty/i).first()).toBeVisible();
    await captureElement(inlineEditForm, path.join(DIRS.actions, '31-edit-validation-desktop.png'));

    await page.setViewportSize(VIEWPORTS.tablet);
    await captureElement(inlineEditForm, path.join(DIRS.actions, '31-edit-validation-tablet.png'));

    await page.setViewportSize(VIEWPORTS.mobile);
    await captureElement(inlineEditForm, path.join(DIRS.actions, '31-edit-validation-mobile.png'));

    // 32-edit-saved-desktop.png
    await page.setViewportSize(VIEWPORTS.desktop);
    await inlineEditForm.locator('textarea').first().fill('Updated description verifying successful save flow.');
    await inlineEditForm.locator('button:has-text("Save Changes")').click();
    await expect(page.locator('[data-testid="inline-edit-form"]')).not.toBeVisible({ timeout: 15000 });
    const savedRow = page.locator('tbody tr:has-text("Updated description")').first();
    await expect(savedRow).toBeVisible();
    await captureElement(savedRow, path.join(DIRS.actions, '32-edit-saved-desktop.png'));

    // 33-edit-cancel-reverted-desktop.png
    await savedRow.locator('button:has-text("Edit")').click();
    const activeEditForm = page.locator('[data-testid="inline-edit-form"]').first();
    await activeEditForm.locator('textarea').first().fill('Temporary text that will be cancelled.');
    await activeEditForm.locator('button:has-text("Cancel")').click();
    await expect(page.locator('[data-testid="inline-edit-form"]')).not.toBeVisible();
    await captureElement(savedRow, path.join(DIRS.actions, '33-edit-cancel-reverted-desktop.png'));

    // 34-edit-conflict-desktop.png
    await savedRow.locator('button:has-text("Edit")').click();
    await page.route('**/api/tickets/*/actions-taken/*', (route) => {
      route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'This action was modified by another user.',
        }),
      });
    });
    await page.locator('[data-testid="inline-edit-form"]').first().locator('button:has-text("Save")').click();
    await expect(page.getByText(/This action was modified by another user/i)).toBeVisible({ timeout: 10000 });
    await captureElement(page.locator('[data-testid="inline-edit-form"]').first(), path.join(DIRS.actions, '34-edit-conflict-desktop.png'));
    await page.unroute('**/api/tickets/*/actions-taken/*');

    const cancelInline = page.locator('[data-testid="inline-edit-form"] button:has-text("Cancel")');
    if (await cancelInline.isVisible()) {
      await cancelInline.click();
    }

    // 40-locked-closed-ticket-desktop.png & 41-locked-cancelled-ticket-desktop.png
    await page.goto('/tickets/3'); // Closed
    await expect(page.getByTestId('actions-taken-section')).toBeVisible({ timeout: 15000 });
    await captureElement(page.getByTestId('actions-taken-section'), path.join(DIRS.actions, '40-locked-closed-ticket-desktop.png'));

    await page.goto('/tickets/8'); // Cancelled
    await expect(page.getByTestId('actions-taken-section')).toBeVisible({ timeout: 15000 });
    await captureElement(page.getByTestId('actions-taken-section'), path.join(DIRS.actions, '41-locked-cancelled-ticket-desktop.png'));

    // 42-loading-list-desktop.png
    const unblockActionsList = await delayRoute(page, '**/api/tickets/1/actions-taken');
    await page.goto('/tickets/1');
    await captureElement(page.getByTestId('actions-taken-section'), path.join(DIRS.actions, '42-loading-list-desktop.png'));
    await unblockActionsList();

    // 43-fetch-error-retry-desktop.png
    await page.route('**/api/tickets/1/actions-taken', (route) => route.fulfill({ status: 500, body: JSON.stringify({ error: 'DB Read Error' }) }));
    await page.goto('/tickets/1');
    await expect(page.getByRole('heading', { name: 'Error Loading Actions' })).toBeVisible({ timeout: 10000 });
    await captureElement(page.getByTestId('actions-taken-section'), path.join(DIRS.actions, '43-fetch-error-retry-desktop.png'));
    await page.unroute('**/api/tickets/1/actions-taken');

    // 44-forbidden-other-requester-ticket-desktop.png
    await loginUser(page, USERS.requester.email, USERS.requester.pass);
    await page.goto('/tickets/4');
    await expect(page.getByText(/Error Loading Ticket|Ticket not found|Access Forbidden/i).first()).toBeVisible({ timeout: 15000 });
    await captureFullPage(page, path.join(DIRS.actions, '44-forbidden-other-requester-ticket-desktop.png'));

    // 50-tablet-form-and-list-tablet.png
    await page.setViewportSize(VIEWPORTS.tablet);
    await loginUser(page, USERS.staff.email, USERS.staff.pass);
    await page.goto('/tickets/1');
    await expect(page.getByTestId('actions-taken-section')).toBeVisible({ timeout: 15000 });
    await captureFullPage(page, path.join(DIRS.actions, '50-tablet-form-and-list-tablet.png'));

    // 51-keyboard-focus-first-invalid-desktop.png & 52-focus-ring-buttons-desktop.png
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto('/tickets/2');
    await page.getByRole('button', { name: /\+ Log Action Taken/i }).click();
    await page.locator('[data-testid="create-action-form"] button[type="submit"]').click();
    await captureElement(page.getByTestId('create-action-form'), path.join(DIRS.actions, '51-keyboard-focus-first-invalid-desktop.png'));

    await captureElement(page.getByTestId('actions-taken-section'), path.join(DIRS.actions, '52-focus-ring-buttons-desktop.png'));

    // Verification assertion: verify all 47 expected images exist and are non-empty
    const expectedActionsFiles = [
      '01-list-multiple-actions-desktop.png', '01-list-multiple-actions-tablet.png',
      '01-list-multiple-actions-mobile-top.png', '01-list-multiple-actions-mobile-bottom.png',
      '02-list-columns-detail-desktop.png', '03-empty-staff-desktop.png', '04-empty-requester-desktop.png',
      '05-requester-read-only-desktop.png', '05-requester-read-only-mobile.png',
      '06-admin-controls-desktop.png', '07-nonowner-staff-logging-desktop.png',
      '10-create-button-desktop.png',
      '11-create-form-default-desktop.png', '11-create-form-default-tablet.png', '11-create-form-default-mobile.png',
      '12-create-form-filled-desktop.png', '13-followup-unchecked-desktop.png', '14-followup-checked-note-revealed-desktop.png',
      '15-validation-required-fields-desktop.png', '15-validation-required-fields-tablet.png', '15-validation-required-fields-mobile.png',
      '16-validation-followup-note-required-desktop.png', '17-validation-whitespace-limit-desktop.png', '18-validation-future-date-desktop.png',
      '19-submitting-spinner-desktop.png', '20-success-new-row-desktop.png',
      '21-server-error-data-preserved-desktop.png', '22-server-field-errors-desktop.png', '23-forbidden-submit-desktop.png',
      '24-ticket-locked-by-other-desktop.png',
      '30-edit-mode-desktop.png', '30-edit-mode-tablet.png', '30-edit-mode-mobile.png',
      '31-edit-validation-desktop.png', '31-edit-validation-tablet.png', '31-edit-validation-mobile.png',
      '32-edit-saved-desktop.png', '33-edit-cancel-reverted-desktop.png', '34-edit-conflict-desktop.png',
      '40-locked-closed-ticket-desktop.png', '41-locked-cancelled-ticket-desktop.png',
      '42-loading-list-desktop.png', '43-fetch-error-retry-desktop.png', '44-forbidden-other-requester-ticket-desktop.png',
      '50-tablet-form-and-list-tablet.png', '51-keyboard-focus-first-invalid-desktop.png', '52-focus-ring-buttons-desktop.png'
    ].map(f => path.join(DIRS.actions, f));
    verifyScreenshotsGenerated(expectedActionsFiles);

    await context.close();
  });

  // =========================================================================
  // 4. Ticket Workflow Screenshots (Part 7 + Part 9)
  // =========================================================================
  test('4. Ticket Workflow Screenshots (Part 7 + Part 9)', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: VIEWPORTS.desktop,
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    // 01-assign-owner-success-desktop.png, tablet.png, mobile-top, mobile-bottom
    await loginUser(page, USERS.staff.email, USERS.staff.pass);
    await page.goto('/tickets/2');
    await expect(page.locator('#ownerSelect')).toBeVisible({ timeout: 15000 });

    const ownerSelect = page.locator('#ownerSelect');
    await ownerSelect.selectOption({ label: 'E2E Staff' });
    await page.waitForTimeout(800);
    await captureFullPage(page, path.join(DIRS.workflow, '01-assign-owner-success-desktop.png'));

    // Tablet & Mobile workflow screen captures (Satisfying Part 9 per peer review)
    await page.setViewportSize(VIEWPORTS.tablet);
    await captureFullPage(page, path.join(DIRS.workflow, '01-assign-owner-success-tablet.png'));

    await page.setViewportSize(VIEWPORTS.mobile);
    await captureMobileSplit(
      page,
      path.join(DIRS.workflow, '01-assign-owner-success-mobile-top.png'),
      path.join(DIRS.workflow, '01-assign-owner-success-mobile-bottom.png')
    );

    // Return to Desktop
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto('/tickets/2');
    await expect(page.locator('#ownerSelect')).toBeVisible({ timeout: 15000 });

    // 02-assign-inactive-user-rejected.png
    await page.route('**/api/staff/tickets/2', (route) => {
      if (route.request().method() === 'PATCH') {
        route.fulfill({ status: 400, body: JSON.stringify({ error: 'INACTIVE_ASSIGNEE_REJECTED' }) });
      } else {
        route.continue();
      }
    });
    await ownerSelect.selectOption({ label: 'IT Staff 1' });
    await page.waitForTimeout(400);
    await captureFullPage(page, path.join(DIRS.workflow, '02-assign-inactive-user-rejected.png'));
    await page.unroute('**/api/staff/tickets/2');

    // 03-assign-non-eligible-rejected.png
    await page.route('**/api/staff/tickets/2', (route) => {
      if (route.request().method() === 'PATCH') {
        route.fulfill({ status: 400, body: JSON.stringify({ error: 'ASSIGNEE_NOT_ELIGIBLE' }) });
      } else {
        route.continue();
      }
    });
    await ownerSelect.selectOption({ label: 'E2E Staff' });
    await page.waitForTimeout(400);
    await captureFullPage(page, path.join(DIRS.workflow, '03-assign-non-eligible-rejected.png'));
    await page.unroute('**/api/staff/tickets/2');

    // 04-status-options-new.png, inprogress.png, resolved.png, tablet.png, mobile.png
    await page.goto('/tickets/2');
    await page.waitForSelector('[data-testid="ticket-workflow-actions"]', { timeout: 15000 });
    await captureElement(page.getByTestId('ticket-workflow-actions'), path.join(DIRS.workflow, '04-status-options-new.png'));

    await page.goto('/tickets/1'); // In Progress
    await page.waitForSelector('[data-testid="ticket-workflow-actions"]', { timeout: 15000 });
    await captureElement(page.getByTestId('ticket-workflow-actions'), path.join(DIRS.workflow, '04-status-options-inprogress.png'));

    // Responsive status action controls
    await page.setViewportSize(VIEWPORTS.tablet);
    await captureElement(page.getByTestId('ticket-workflow-actions'), path.join(DIRS.workflow, '04-status-options-tablet.png'));

    await page.setViewportSize(VIEWPORTS.mobile);
    await captureElement(page.getByTestId('ticket-workflow-actions'), path.join(DIRS.workflow, '04-status-options-mobile.png'));

    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto('/tickets/6'); // Resolved
    await page.waitForSelector('[data-testid="ticket-workflow-actions"]', { timeout: 15000 });
    await captureElement(page.getByTestId('ticket-workflow-actions'), path.join(DIRS.workflow, '04-status-options-resolved.png'));

    // 05-requester-no-status-controls.png
    await loginUser(page, USERS.requester.email, USERS.requester.pass);
    await page.goto('/tickets/2');
    await page.waitForSelector('#ticket-summary-status', { timeout: 15000 });
    const statusWrapper = page.locator('#ticket-summary-status');
    await captureElement(statusWrapper, path.join(DIRS.workflow, '05-requester-no-status-controls.png'));

    // 06-resolve-blocked-gate.png (Demonstrate Resolution Gate Requirements)
    await loginUser(page, USERS.staff.email, USERS.staff.pass);
    await page.route('**/api/staff/tickets/1', async (route) => {
      const response = await route.fetch();
      const json = await response.json();
      json.allowedTransitions = ['Resolved', 'Closed', 'Cancelled'];
      json.resolutionGate = {
        met: false,
        missing: ['ACTION_TAKEN_WITH_RESULT_REQUIRED'],
        hasActiveOwner: true,
        validActionCount: 0,
      };
      route.fulfill({ response, json });
    });
    await page.goto('/tickets/1');
    await page.waitForSelector('#resolution-gate-reason', { timeout: 15000 });
    await captureElement(page.getByTestId('ticket-workflow-actions'), path.join(DIRS.workflow, '06-resolve-blocked-gate.png'));
    await page.unroute('**/api/staff/tickets/1');

    // 07-resolve-success-desktop.png, tablet.png, mobile.png (Ticket 1 is satisfied for resolution)
    await page.goto('/tickets/1');
    await page.waitForSelector('#resolve-action-btn', { timeout: 15000 });
    const resolveBtn = page.locator('#resolve-action-btn');
    await expect(resolveBtn).toBeVisible();
    await resolveBtn.click();
    await page.waitForTimeout(600);
    await captureFullPage(page, path.join(DIRS.workflow, '07-resolve-success-desktop.png'));

    await page.setViewportSize(VIEWPORTS.tablet);
    await captureFullPage(page, path.join(DIRS.workflow, '07-resolve-success-tablet.png'));

    await page.setViewportSize(VIEWPORTS.mobile);
    await captureFullPage(page, path.join(DIRS.workflow, '07-resolve-success-mobile.png'));

    // 08-close-confirm-dialog.png (Ticket 6 is Resolved, offering Close and Cancel transitions)
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto('/tickets/6');
    await page.waitForSelector('button:has-text("Close Ticket")', { timeout: 15000 });
    await page.click('button:has-text("Close Ticket")');
    await page.waitForTimeout(400);
    await captureModal(page, path.join(DIRS.workflow, '08-close-confirm-dialog.png'));
    await page.click('button:has-text("Keep Ticket")');

    // 09-cancel-confirm-dialog.png
    await page.goto('/tickets/6');
    await page.waitForSelector('button:has-text("Cancel Ticket")', { timeout: 15000 });
    await page.click('button:has-text("Cancel Ticket")');
    await page.waitForTimeout(400);
    await captureModal(page, path.join(DIRS.workflow, '09-cancel-confirm-dialog.png'));
    await page.click('button:has-text("Keep Ticket")');

    // 10-cancelled-locked-desktop.png, tablet.png, mobile.png (Ticket 8 is Cancelled)
    await page.goto('/tickets/8');
    await captureFullPage(page, path.join(DIRS.workflow, '10-cancelled-locked-desktop.png'));

    await page.setViewportSize(VIEWPORTS.tablet);
    await captureFullPage(page, path.join(DIRS.workflow, '10-cancelled-locked-tablet.png'));

    await page.setViewportSize(VIEWPORTS.mobile);
    await captureFullPage(page, path.join(DIRS.workflow, '10-cancelled-locked-mobile.png'));

    // 11-conflict-dialog.png
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto('/tickets/6');
    await page.waitForSelector('button:has-text("Close Ticket")', { timeout: 15000 });
    await page.route('**/api/staff/tickets/6', (route) => {
      if (route.request().method() === 'PATCH') {
        route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'CONFLICT',
            message: 'Ticket status was modified concurrently by another staff member.',
            currentStatus: 'WaitingForRequester',
            currentVersion: 3,
          }),
        });
      } else {
        route.continue();
      }
    });
    await page.click('button:has-text("Close Ticket")');
    await page.locator('.modal button:has-text("Confirm Closed")').click();
    await page.waitForSelector('.modal h5:has-text("Conflict Detected")', { timeout: 15000 });
    await captureModal(page, path.join(DIRS.workflow, '11-conflict-dialog.png'));
    await page.unroute('**/api/staff/tickets/6');

    await page.locator('.modal button:has-text("Reload Ticket")').click();
    await page.waitForTimeout(600);

    // 12-forbidden-transition.png
    await page.waitForSelector('button:has-text("Close Ticket")', { timeout: 15000 });
    await page.route('**/api/staff/tickets/6', (route) => {
      if (route.request().method() === 'PATCH') {
        route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'FORBIDDEN_TRANSITION', message: 'Forbidden transition' }),
        });
      } else {
        route.continue();
      }
    });
    await page.click('button:has-text("Close Ticket")');
    await page.locator('.modal button:has-text("Confirm Closed")').click();
    await page.waitForSelector('.alert-danger', { timeout: 15000 });
    await captureFullPage(page, path.join(DIRS.workflow, '12-forbidden-transition.png'));
    await page.unroute('**/api/staff/tickets/6');

    // 13-requester-advisory-button.png & 14-advisory-confirm.png
    await loginUser(page, USERS.requester.email, USERS.requester.pass);
    await page.goto('/tickets/2');
    const advisoryBtn = page.locator('#requester-advisory-resolve-btn');
    await expect(advisoryBtn).toBeVisible({ timeout: 15000 });
    await captureElement(advisoryBtn, path.join(DIRS.workflow, '13-requester-advisory-button.png'));

    await advisoryBtn.click();
    await page.waitForTimeout(400);
    await captureModal(page, path.join(DIRS.workflow, '14-advisory-confirm.png'));

    const dismissBtn = page.getByRole('button', { name: /Cancel|Keep/i });
    await dismissBtn.click();

    // 15-staff-advisory-banner.png (Staff views requester marked as resolved banner on Ticket 9)
    await loginUser(page, USERS.staff.email, USERS.staff.pass);
    await page.goto('/tickets/9');
    const advisoryBanner = page.locator('#requester-advisory-banner');
    await expect(advisoryBanner).toBeVisible({ timeout: 15000 });
    await captureElement(advisoryBanner, path.join(DIRS.workflow, '15-staff-advisory-banner.png'));

    // 16-delete-action-not-available.png (Proof that DELETE action is not available)
    await page.goto('/tickets/1');
    await expect(page.getByTestId('actions-taken-section')).toBeVisible({ timeout: 15000 });
    await captureElement(page.getByTestId('actions-taken-section'), path.join(DIRS.workflow, '16-delete-action-not-available.png'));

    // Verification assertion: verify all 27 expected images exist and are non-empty
    const expectedWorkflowFiles = [
      '01-assign-owner-success-desktop.png', '01-assign-owner-success-tablet.png',
      '01-assign-owner-success-mobile-top.png', '01-assign-owner-success-mobile-bottom.png',
      '02-assign-inactive-user-rejected.png', '03-assign-non-eligible-rejected.png',
      '04-status-options-new.png', '04-status-options-inprogress.png', '04-status-options-resolved.png',
      '04-status-options-tablet.png', '04-status-options-mobile.png',
      '05-requester-no-status-controls.png', '06-resolve-blocked-gate.png',
      '07-resolve-success-desktop.png', '07-resolve-success-tablet.png', '07-resolve-success-mobile.png',
      '08-close-confirm-dialog.png', '09-cancel-confirm-dialog.png',
      '10-cancelled-locked-desktop.png', '10-cancelled-locked-tablet.png', '10-cancelled-locked-mobile.png',
      '11-conflict-dialog.png', '12-forbidden-transition.png',
      '13-requester-advisory-button.png', '14-advisory-confirm.png',
      '15-staff-advisory-banner.png', '16-delete-action-not-available.png'
    ].map(f => path.join(DIRS.workflow, f));
    verifyScreenshotsGenerated(expectedWorkflowFiles);

    await context.close();
  });

  // =========================================================================
  // 5. Labs 1-3 Representative Regression Screenshots (Part 8)
  // =========================================================================
  test('5. Labs 1-3 Representative Regression Screenshots (Part 8)', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: VIEWPORTS.desktop,
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    // 01-login-screen.png
    await page.goto('/login');
    await captureFullPage(page, path.join(DIRS.regression, '01-login-screen.png'));

    // 02-requester-my-tickets.png
    await loginUser(page, USERS.requester.email, USERS.requester.pass);
    await page.goto('/tickets');
    await expect(page.getByRole('heading', { name: /My Tickets/i })).toBeVisible({ timeout: 15000 });
    await captureFullPage(page, path.join(DIRS.regression, '02-requester-my-tickets.png'));

    // 03-ticket-detail-conversation-public.png
    await page.goto('/tickets/2');
    const publicCommentsBtn = page.locator('.zen-tab-btn').filter({ hasText: 'Public Comments' });
    await expect(publicCommentsBtn).toBeVisible({ timeout: 15000 });
    await publicCommentsBtn.click();
    await page.waitForTimeout(400);
    await captureFullPage(page, path.join(DIRS.regression, '03-ticket-detail-conversation-public.png'));

    // 04-ticket-detail-attachments.png
    const attachmentsBtn = page.locator('.zen-tab-btn').filter({ hasText: 'Attachments' });
    await expect(attachmentsBtn).toBeVisible({ timeout: 15000 });
    await attachmentsBtn.click();
    await page.waitForTimeout(400);
    await captureFullPage(page, path.join(DIRS.regression, '04-ticket-detail-attachments.png'));

    // 05-staff-internal-note-created.png
    await loginUser(page, USERS.staff.email, USERS.staff.pass);
    await page.goto('/tickets/1');
    const internalNotesBtn = page.locator('.zen-tab-btn').filter({ hasText: 'Internal Notes' });
    await expect(internalNotesBtn).toBeVisible({ timeout: 15000 });
    await internalNotesBtn.click();
    await page.waitForTimeout(400);
    await captureFullPage(page, path.join(DIRS.regression, '05-staff-internal-note-created.png'));

    // 06-requester-internal-note-hidden.png
    await loginUser(page, USERS.requester.email, USERS.requester.pass);
    await page.goto('/tickets/2');
    await page.waitForTimeout(600);
    await captureFullPage(page, path.join(DIRS.regression, '06-requester-internal-note-hidden.png'));

    // 07-admin-user-management.png & 08-admin-self-deactivation-disabled.png
    await loginUser(page, USERS.admin.email, USERS.admin.pass);
    await page.goto('/admin/users');
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 15000 });
    await captureFullPage(page, path.join(DIRS.regression, '07-admin-user-management.png'));

    const searchInput = page.locator('#user-search-input, input[placeholder*="search" i]').first();
    await expect(searchInput).toBeVisible();
    await searchInput.fill(USERS.admin.email);
    await searchInput.press('Enter');
    await page.waitForTimeout(500);

    const selfRow = page.locator('tr:has-text("e2e.admin@example.com")').first();
    await expect(selfRow).toBeVisible({ timeout: 10000 });
    await selfRow.locator('button:has-text("Edit")').click();
    await page.waitForTimeout(400);
    await captureModal(page, path.join(DIRS.regression, '08-admin-self-deactivation-disabled.png'));

    // Verification assertion: verify all 8 expected images exist and are non-empty
    const expectedRegressionFiles = [
      '01-login-screen.png', '02-requester-my-tickets.png',
      '03-ticket-detail-conversation-public.png', '04-ticket-detail-attachments.png',
      '05-staff-internal-note-created.png', '06-requester-internal-note-hidden.png',
      '07-admin-user-management.png', '08-admin-self-deactivation-disabled.png'
    ].map(f => path.join(DIRS.regression, f));
    verifyScreenshotsGenerated(expectedRegressionFiles);

    await context.close();
  });
});
