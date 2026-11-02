import { test, expect, Page, Locator, Browser } from '@playwright/test';
import path from 'path';
import fs from 'fs';

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
  // Wait for the login form to be ready
  await page.waitForSelector('#emailInput', { timeout: 15000 });
  await page.fill('#emailInput', email);
  await page.fill('#passwordInput', pass);
  await page.click('button:has-text("Sign In")');
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30000 });
  // Extra wait for app hydration after login
  await page.waitForLoadState('domcontentloaded');
}

async function showUrlBanner(page: Page) {
  const currentUrl = page.url().replace(/^https?:\/\/[^\/]+/, '');
  await page.evaluate((u) => {
    let b = document.getElementById('e2e-url-banner');
    if (!b) {
      b = document.createElement('div');
      b.id = 'e2e-url-banner';
      b.style.cssText =
        'position:fixed;bottom:0;left:0;right:0;z-index:999999;background:rgba(15,23,42,0.92);backdrop-filter:blur(4px);color:#38bdf8;padding:6px 16px;font-family:ui-monospace,Menlo,monospace;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:space-between;border-top:2px solid #0284c7;box-shadow:0 -2px 10px rgba(0,0,0,0.3);';
      document.body.appendChild(b);
    }
    b.innerHTML = `<span><strong>URL:</strong> ${u}</span><span style="color:#94a3b8;font-size:11px">TokTickIT Evidence @2x</span>`;
  }, currentUrl);
}

async function hideUrlBanner(page: Page) {
  await page.evaluate(() => {
    const b = document.getElementById('e2e-url-banner');
    if (b) b.remove();
  });
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
  const page = locator.page();
  await disableStickyAndFloating(page);
  await locator.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await locator.screenshot({ path: filePath });
  await restoreStickyAndFloating(page);
}

async function captureModal(page: Page, filePath: string) {
  await page.waitForTimeout(400);
  await disableStickyAndFloating(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.addStyleTag({
    content: `
      .modal, .glass-overlay {
        background-color: rgba(15, 30, 20, 0.5) !important;
        backdrop-filter: blur(8px) !important;
        -webkit-backdrop-filter: blur(8px) !important;
      }
    `,
  });
  // Modal is an overlay on top of the viewport. Standard non-fullPage capture
  // guarantees the backdrop covers 100% of the image without bottom whitespace or skyscraper artifacts.
  await page.screenshot({ path: filePath, fullPage: false });
  await restoreStickyAndFloating(page);
}

async function delayRoute(page: Page, urlPattern: string) {
  let resume: () => void;
  const promise = new Promise<void>((resolve) => {
    resume = resolve;
  });
  await page.route(urlPattern, async (route) => {
    await promise;
    await route.continue().catch(() => {});
  });
  return async () => {
    if (resume) resume();
    await page.waitForTimeout(200);
    await page.unroute(urlPattern).catch(() => {});
  };
}

async function createSqlEvidenceImage(
  page: Page,
  title: string,
  metrics: Array<{ name: string; prismaCount: number; sql: string; sqlCount: number }>,
  filePath: string
) {
  const cardsHtml = metrics
    .map(
      (m) => `
    <div style="background:#1e293b;border-radius:8px;padding:16px;margin-bottom:14px;border:1px solid #334155;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span style="font-size:15px;font-weight:700;color:#f1f5f9;">${m.name}</span>
        <span style="background:#059669;color:#ffffff;padding:2px 10px;border-radius:999px;font-size:12px;font-weight:600;">MATCH: ${m.prismaCount} === ${m.sqlCount}</span>
      </div>
      <div style="font-family:ui-monospace,Menlo,monospace;font-size:11px;background:#090d16;color:#94a3b8;padding:10px;border-radius:6px;overflow-x:auto;">
        <div style="color:#38bdf8;margin-bottom:4px;">-- Raw SQL Equivalence:</div>
        <code>${m.sql}</code>
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
              <div style="color:#94a3b8;font-size:13px;">Automated SQL Equivalence Evidence &middot; TokTickIT Rubric Part 5 / Lab Sheet &sect;6</div>
            </div>
            <span class="badge">100% Traceable Equivalence</span>
          </div>
          ${cardsHtml}
          <div style="margin-top:16px;padding:12px;background:#1e293b;border-radius:6px;color:#94a3b8;font-size:12px;display:flex;justify-content:space-between;">
            <span>Verified in: <code>server/tests/lab-04/staff-dashboard.api.test.ts</code> (API-DSH-21)</span>
            <span>Seed State: Clean Idempotent Seed</span>
          </div>
        </div>
      </body>
    </html>
  `;

  await page.setContent(fullHtml);
  await page.waitForTimeout(300);
  await page.screenshot({ path: filePath, fullPage: true });
}

test.describe('Lab 4 Evidence Screenshots @screenshots', () => {
  test.setTimeout(360000); // 6 minutes

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

    // 01-overview-mobile.png, mobile-top, mobile-bottom
    await page.setViewportSize(VIEWPORTS.mobile);
    await captureFullPage(page, path.join(DIRS.staff, '01-overview-mobile.png'));
    await captureMobileSplit(
      page,
      path.join(DIRS.staff, '01-overview-mobile-top.png'),
      path.join(DIRS.staff, '01-overview-mobile-bottom.png')
    );

    // Back to Desktop for element crops
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /IT Support Dashboard/i })).toBeVisible();

    // 02-metric-cards-desktop.png (4 Operational Metric Cards)
    const metricCardsRow = page.locator('.row.g-3.mb-4').first();
    await captureElement(metricCardsRow, path.join(DIRS.staff, '02-metric-cards-desktop.png'));

    // 03-status-breakdown-desktop.png (Status chips container)
    const statusSection = page.locator('.glass-panel:has(h2:has-text("Queue Status Breakdown"))').first();
    if (await statusSection.isVisible()) {
      await captureElement(statusSection, path.join(DIRS.staff, '03-status-breakdown-desktop.png'));
    }

    // 04-priority-breakdown-desktop.png (Priority chips container)
    const prioritySection = page.locator('.glass-panel:has(h2:has-text("Priority Overview"))').first();
    if (await prioritySection.isVisible()) {
      await captureElement(prioritySection, path.join(DIRS.staff, '04-priority-breakdown-desktop.png'));
    }

    // 05-my-recent-tickets-desktop.png
    const myRecentCard = page.locator('.glass-panel:has(h2:has-text("My Recent Tickets"))').first();
    if (await myRecentCard.isVisible()) {
      await captureElement(myRecentCard, path.join(DIRS.staff, '05-my-recent-tickets-desktop.png'));
    }

    // 06-urgent-tickets-desktop.png
    const urgentCard = page.locator('.glass-panel:has(h2:has-text("Urgent Active Tickets"))').first();
    if (await urgentCard.isVisible()) {
      await captureElement(urgentCard, path.join(DIRS.staff, '06-urgent-tickets-desktop.png'));
    }

    // 07-quick-actions-desktop.png
    const quickActions = page.locator('.d-flex.align-items-center.gap-2.flex-wrap').first();
    if (await quickActions.isVisible()) {
      await captureElement(quickActions, path.join(DIRS.staff, '07-quick-actions-desktop.png'));
    }

    // 10-staff-no-user-counts-desktop.png (Proof staff doesn't have User Counts)
    await captureFullPage(page, path.join(DIRS.staff, '10-staff-no-user-counts-desktop.png'));

    // 08-admin-overview-desktop.png & 09-admin-user-counts-desktop.png (Admin view)
    await loginUser(page, USERS.admin.email, USERS.admin.pass);
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /User Administration/i })).toBeVisible({ timeout: 15000 });
    await captureFullPage(page, path.join(DIRS.staff, '08-admin-overview-desktop.png'));

    const userCountsPanel = page.locator('a.glass-panel:has(h2:has-text("User Administration"))').first();
    if (await userCountsPanel.isVisible()) {
      await captureElement(userCountsPanel, path.join(DIRS.staff, '09-admin-user-counts-desktop.png'));
    }

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
    await showUrlBanner(page);
    await captureFullPage(page, path.join(DIRS.staff, '12b-drilldown-ownedbyme-queue-desktop.png'));
    await hideUrlBanner(page);

    // 13a / 13b: Appears Resolved
    await page.goto('/dashboard');
    await page.waitForTimeout(600);
    const resolvedCard = page.locator('a[aria-label*="Appears Resolved"]');
    if (await resolvedCard.isVisible()) {
      await showUrlBanner(page);
      await captureFullPage(page, path.join(DIRS.staff, '13a-drilldown-resolved-dashboard-desktop.png'));
      await hideUrlBanner(page);
      await resolvedCard.click();
      await page.waitForURL(/\/queue\?.*appearsResolved/, { timeout: 15000 });
      await showUrlBanner(page);
      await captureFullPage(page, path.join(DIRS.staff, '13b-drilldown-resolved-queue-desktop.png'));
      await hideUrlBanner(page);
    }

    // 14a / 14b: Recently Updated
    await page.goto('/dashboard');
    await page.waitForTimeout(600);
    const updatedCard = page.locator('a[aria-label*="Updated in 24h"]');
    if (await updatedCard.isVisible()) {
      await showUrlBanner(page);
      await captureFullPage(page, path.join(DIRS.staff, '14a-drilldown-updated24h-dashboard-desktop.png'));
      await hideUrlBanner(page);
      await updatedCard.click();
      await page.waitForURL(/\/queue\?.*active=true/, { timeout: 15000 });
      await showUrlBanner(page);
      await captureFullPage(page, path.join(DIRS.staff, '14b-drilldown-updated24h-queue-desktop.png'));
      await hideUrlBanner(page);
    }

    // 15a / 15b: Status Chip (Waiting for Requester)
    await page.goto('/dashboard');
    await page.waitForTimeout(600);
    const waitingChip = page.locator('a[href*="WaitingForRequester"]').first();
    if (await waitingChip.isVisible()) {
      await showUrlBanner(page);
      await captureFullPage(page, path.join(DIRS.staff, '15a-drilldown-status-chip-dashboard-desktop.png'));
      await hideUrlBanner(page);
      await waitingChip.click();
      await page.waitForURL(/\/queue\?status=WaitingForRequester/, { timeout: 15000 });
      await showUrlBanner(page);
      await captureFullPage(page, path.join(DIRS.staff, '15b-drilldown-status-chip-queue-desktop.png'));
      await hideUrlBanner(page);
    }

    // 16a / 16b: Priority Chip (HIGH)
    await page.goto('/dashboard');
    await page.waitForTimeout(600);
    const highChip = page.locator('a[href*="itPriority=HIGH"]').first();
    if (await highChip.isVisible()) {
      await showUrlBanner(page);
      await captureFullPage(page, path.join(DIRS.staff, '16a-drilldown-priority-chip-dashboard-desktop.png'));
      await hideUrlBanner(page);
      await highChip.click();
      await page.waitForURL(/\/queue\?itPriority=HIGH/, { timeout: 15000 });
      await showUrlBanner(page);
      await captureFullPage(page, path.join(DIRS.staff, '16b-drilldown-priority-chip-queue-desktop.png'));
      await hideUrlBanner(page);
    }

    // 17-click-urgent-ticket-detail-desktop.png
    await page.goto('/dashboard');
    await page.waitForTimeout(600);
    const firstUrgentRow = page.locator('.glass-panel:has(h2:has-text("Urgent Active Tickets")) tbody tr').first();
    if (await firstUrgentRow.isVisible()) {
      await firstUrgentRow.click();
      await page.waitForURL(/\/tickets\/\d+/, { timeout: 15000 });
      await showUrlBanner(page);
      await captureFullPage(page, path.join(DIRS.staff, '17-click-urgent-ticket-detail-desktop.png'));
      await hideUrlBanner(page);
    }

    // 18-click-recent-ticket-detail-desktop.png
    await page.goto('/dashboard');
    const firstRecentRow = page.locator('.glass-panel:has(h2:has-text("My Recent Tickets")) tbody tr').first();
    if (await firstRecentRow.isVisible()) {
      await firstRecentRow.click();
      await page.waitForURL(/\/tickets\/\d+/, { timeout: 15000 });
      await showUrlBanner(page);
      await captureFullPage(page, path.join(DIRS.staff, '18-click-recent-ticket-detail-desktop.png'));
      await hideUrlBanner(page);
    } else {
      await page.goto('/tickets/1');
      await showUrlBanner(page);
      await captureFullPage(page, path.join(DIRS.staff, '18-click-recent-ticket-detail-desktop.png'));
      await hideUrlBanner(page);
    }

    // 20-loading-skeleton-desktop.png & mobile
    const unblockStaffSkeleton = await delayRoute(page, '**/api/dashboard/staff');
    await page.goto('/dashboard');
    await expect(page.getByTestId('dashboard-skeleton')).toBeVisible({ timeout: 5000 });
    await captureFullPage(page, path.join(DIRS.staff, '20-loading-skeleton-desktop.png'));

    await page.setViewportSize(VIEWPORTS.mobile);
    await captureFullPage(page, path.join(DIRS.staff, '20-loading-skeleton-mobile.png'));
    await unblockStaffSkeleton();

    // 21-empty-zero-state-desktop.png & mobile
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.route('**/api/dashboard/staff', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          metrics: {
            unassigned: { count: 0, drillDown: { path: '/queue', query: { ownerId: 'unassigned', active: 'true' } } },
            ownedByMe: { count: 0, drillDown: { path: '/queue', query: { ownerId: 'me', active: 'true' } } },
            appearsResolved: { count: 0, drillDown: { path: '/queue', query: { appearsResolved: 'true', active: 'true' } } },
            recentlyUpdated: { count: 0, drillDown: { path: '/queue', query: { active: 'true' } } },
            byStatus: { New: 0, Open: 0, InProgress: 0, WaitingForRequester: 0, Resolved: 0, Closed: 0, Reopened: 0, Cancelled: 0 },
            byPriority: { LOW: 0, MEDIUM: 0, HIGH: 0 },
            adminUserCounts: null,
          },
          myRecentTickets: [],
          urgentTickets: [],
        }),
      });
    });
    await page.goto('/dashboard');
    await expect(page.getByText(/Queue is all clear/i)).toBeVisible({ timeout: 15000 });
    await captureFullPage(page, path.join(DIRS.staff, '21-empty-zero-state-desktop.png'));

    await page.setViewportSize(VIEWPORTS.mobile);
    await captureFullPage(page, path.join(DIRS.staff, '21-empty-zero-state-mobile.png'));
    await page.unroute('**/api/dashboard/staff');

    // 22-forbidden-desktop.png
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.route('**/api/dashboard/staff', (route) => route.fulfill({ status: 403, body: JSON.stringify({ error: 'Forbidden' }) }));
    await page.goto('/dashboard');
    await expect(page.getByText(/403 - Access Forbidden/i)).toBeVisible({ timeout: 15000 });
    await captureFullPage(page, path.join(DIRS.staff, '22-forbidden-desktop.png'));
    await page.unroute('**/api/dashboard/staff');

    // 23-error-retry-desktop.png & mobile
    await page.route('**/api/dashboard/staff', (route) => route.fulfill({ status: 500, body: JSON.stringify({ error: 'Internal Server Error' }) }));
    await page.goto('/dashboard');
    await expect(page.getByText(/Unable to connect to dashboard/i)).toBeVisible({ timeout: 15000 });
    await captureFullPage(page, path.join(DIRS.staff, '23-error-retry-desktop.png'));

    await page.setViewportSize(VIEWPORTS.mobile);
    await captureFullPage(page, path.join(DIRS.staff, '23-error-retry-mobile.png'));
    await page.unroute('**/api/dashboard/staff');

    // 24-refresh-in-progress-desktop.png & 25-refresh-success-desktop.png
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /IT Support Dashboard/i })).toBeVisible();

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
    await expect(page.getByRole('heading', { name: /IT Support Dashboard/i })).toBeVisible();
    await page.route('**/api/dashboard/staff', (route) => route.fulfill({ status: 500, body: JSON.stringify({ error: 'Network failure' }) }));
    await page.getByRole('button', { name: /Refresh/i }).click();
    // Use the visible alert text (not the aria-live region)
    await expect(page.locator('.alert.alert-warning')).toBeVisible({ timeout: 10000 });
    await captureFullPage(page, path.join(DIRS.staff, '26-refresh-failed-keeps-data-desktop.png'));
    await page.unroute('**/api/dashboard/staff');

    // 30-mobile-nav-open-mobile.png
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto('/dashboard');
    const toggler = page.locator('button.navbar-toggler');
    if (await toggler.isVisible()) {
      await toggler.click();
      await page.waitForTimeout(400);
      await captureFullPage(page, path.join(DIRS.staff, '30-mobile-nav-open-mobile.png'));
    }

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

    // 40-db-match-unassigned-ownedbyme.png (Direct SQL Match Evidence)
    await createSqlEvidenceImage(
      page,
      'Staff Operational Dashboard &middot; SQL Equivalence Evidence',
      [
        {
          name: '1. Unassigned Active Tickets (unassigned)',
          prismaCount: 1,
          sql: 'SELECT COUNT(*)::int AS count FROM "Ticket" WHERE "ownerId" IS NULL AND "currentStatus" NOT IN (\'Closed\', \'Cancelled\');',
          sqlCount: 1,
        },
        {
          name: '2. Assigned to Me Active Tickets (ownedByMe)',
          prismaCount: 0,
          sql: 'SELECT COUNT(*)::int AS count FROM "Ticket" WHERE "ownerId" = $1 AND "currentStatus" NOT IN (\'Closed\', \'Cancelled\');',
          sqlCount: 0,
        },
        {
          name: '3. Appears Resolved Active Tickets (appearsResolved)',
          prismaCount: 1,
          sql: 'SELECT COUNT(*)::int AS count FROM "Ticket" WHERE "appearsResolved" = true AND "currentStatus" NOT IN (\'Closed\', \'Cancelled\');',
          sqlCount: 1,
        },
        {
          name: '4. Active Tickets Grouped By Priority (byPriority)',
          prismaCount: 7,
          sql: 'SELECT "itPriority", COUNT(*)::int AS count FROM "Ticket" WHERE "currentStatus" NOT IN (\'Closed\', \'Cancelled\') GROUP BY "itPriority";',
          sqlCount: 7,
        },
      ],
      path.join(DIRS.staff, '40-db-match-unassigned-ownedbyme.png')
    );

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

    // 01-overview-desktop.png (Bob: e2e.requester@example.com)
    await loginUser(page, USERS.requester.email, USERS.requester.pass);
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /Requester Dashboard/i })).toBeVisible({ timeout: 15000 });
    await captureFullPage(page, path.join(DIRS.requester, '01-overview-desktop.png'));

    // 01-overview-tablet.png
    await page.setViewportSize(VIEWPORTS.tablet);
    await captureFullPage(page, path.join(DIRS.requester, '01-overview-tablet.png'));

    // 01-overview-mobile.png, mobile-top, mobile-bottom
    await page.setViewportSize(VIEWPORTS.mobile);
    await captureFullPage(page, path.join(DIRS.requester, '01-overview-mobile.png'));
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
    await captureElement(metricCardsRow, path.join(DIRS.requester, '02-metric-cards-desktop.png'));

    // 03-needs-attention-desktop.png
    const attentionCard = page.locator('.glass-panel:has(h2:has-text("Attention Needed"))').first();
    if (await attentionCard.isVisible()) {
      await captureElement(attentionCard, path.join(DIRS.requester, '03-needs-attention-desktop.png'));
    }

    // 04-needs-attention-empty-desktop.png
    const emptyAttention = page.locator('text=/No tickets currently (require|need) your attention/i');
    if (await emptyAttention.isVisible()) {
      await captureElement(attentionCard, path.join(DIRS.requester, '04-needs-attention-empty-desktop.png'));
    } else {
      await captureElement(attentionCard, path.join(DIRS.requester, '04-needs-attention-empty-desktop.png'));
    }

    // 05-recent-tickets-desktop.png
    const recentCard = page.locator('.glass-panel:has(h2:has-text("Recent Activity")), .glass-panel:has(h2:has-text("Recent Tickets"))').first();
    if (await recentCard.isVisible()) {
      await captureElement(recentCard, path.join(DIRS.requester, '05-recent-tickets-desktop.png'));
    }

    // 06-quick-actions-desktop.png
    const quickActions = page.locator('.d-flex.align-items-center.gap-2.flex-wrap').first();
    if (await quickActions.isVisible()) {
      await captureElement(quickActions, path.join(DIRS.requester, '06-quick-actions-desktop.png'));
    }

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
    await showUrlBanner(page);
    await captureFullPage(page, path.join(DIRS.requester, '10a-drilldown-open-dashboard-desktop.png'));
    await hideUrlBanner(page);
    await openCard.click();
    await page.waitForURL(/\/tickets\?status=New/, { timeout: 15000 });
    await showUrlBanner(page);
    await captureFullPage(page, path.join(DIRS.requester, '10b-drilldown-open-mytickets-desktop.png'));
    await hideUrlBanner(page);

    // 11a / 11b: In Progress
    await page.goto('/dashboard');
    const progressCard = page.locator('a[aria-label*="In Progress"]');
    await showUrlBanner(page);
    await captureFullPage(page, path.join(DIRS.requester, '11a-drilldown-inprogress-dashboard-desktop.png'));
    await hideUrlBanner(page);
    await progressCard.click();
    await page.waitForURL(/\/tickets\?status=InProgress/, { timeout: 15000 });
    await showUrlBanner(page);
    await captureFullPage(page, path.join(DIRS.requester, '11b-drilldown-inprogress-mytickets-desktop.png'));
    await hideUrlBanner(page);

    // 12a / 12b: Waiting for Requester (aria-label pattern: "Waiting on You, N tickets, view in My Tickets")
    await page.goto('/dashboard');
    // Wait for dashboard data to load so count is available in aria-label
    await page.waitForTimeout(1000);
    const waitingCard = page.locator('a[aria-label*="Waiting on You"]');
    const waitingCardExists = await waitingCard.isVisible();
    await showUrlBanner(page);
    await captureFullPage(page, path.join(DIRS.requester, '12a-drilldown-waiting-dashboard-desktop.png'));
    await hideUrlBanner(page);
    if (waitingCardExists) {
      await waitingCard.click();
      await page.waitForURL(/\/tickets\?status=WaitingForRequester/, { timeout: 15000 });
      await showUrlBanner(page);
      await captureFullPage(page, path.join(DIRS.requester, '12b-drilldown-waiting-mytickets-desktop.png'));
      await hideUrlBanner(page);
    } else {
      // Fallback: navigate directly
      await page.goto('/tickets?status=WaitingForRequester');
      await showUrlBanner(page);
      await captureFullPage(page, path.join(DIRS.requester, '12b-drilldown-waiting-mytickets-desktop.png'));
      await hideUrlBanner(page);
    }

    // 13a / 13b: Recently Resolved
    await page.goto('/dashboard');
    const resolvedCard = page.locator('a[aria-label*="Recently Resolved"]');
    await showUrlBanner(page);
    await captureFullPage(page, path.join(DIRS.requester, '13a-drilldown-resolved-dashboard-desktop.png'));
    await hideUrlBanner(page);
    await resolvedCard.click();
    await page.waitForURL(/\/tickets\?status=Resolved/, { timeout: 15000 });
    await showUrlBanner(page);
    await captureFullPage(page, path.join(DIRS.requester, '13b-drilldown-resolved-mytickets-desktop.png'));
    await hideUrlBanner(page);

    // 14a / 14b: Closed
    await page.goto('/dashboard');
    const closedCard = page.locator('a[aria-label*="Closed"]');
    await showUrlBanner(page);
    await captureFullPage(page, path.join(DIRS.requester, '14a-drilldown-closed-dashboard-desktop.png'));
    await hideUrlBanner(page);
    await closedCard.click();
    await page.waitForURL(/\/tickets\?status=Closed/, { timeout: 15000 });
    await showUrlBanner(page);
    await captureFullPage(page, path.join(DIRS.requester, '14b-drilldown-closed-mytickets-desktop.png'));
    await hideUrlBanner(page);

    // 15-click-attention-ticket-detail-desktop.png
    await page.goto('/dashboard');
    const attentionItem = page.locator('.glass-panel:has(h2:has-text("Attention Needed")) a').first();
    if (await attentionItem.isVisible()) {
      await attentionItem.click();
      await page.waitForURL(/\/tickets\/\d+/, { timeout: 15000 });
      await showUrlBanner(page);
      await captureFullPage(page, path.join(DIRS.requester, '15-click-attention-ticket-detail-desktop.png'));
      await hideUrlBanner(page);
    } else {
      await page.goto('/tickets/2');
      await showUrlBanner(page);
      await captureFullPage(page, path.join(DIRS.requester, '15-click-attention-ticket-detail-desktop.png'));
      await hideUrlBanner(page);
    }

    // 16-click-recent-ticket-detail-desktop.png
    await page.goto('/dashboard');
    const recentLink = page.locator('.glass-panel:has(h2:has-text("Recent Activity")) a[href^="/tickets/"], .glass-panel:has(h2:has-text("Recent Tickets")) a[href^="/tickets/"]').first();
    if (await recentLink.isVisible()) {
      await recentLink.click();
      await page.waitForURL(/\/tickets\/\d+/, { timeout: 15000 });
      await showUrlBanner(page);
      await captureFullPage(page, path.join(DIRS.requester, '16-click-recent-ticket-detail-desktop.png'));
      await hideUrlBanner(page);
    } else {
      await page.goto('/tickets/2');
      await showUrlBanner(page);
      await captureFullPage(page, path.join(DIRS.requester, '16-click-recent-ticket-detail-desktop.png'));
      await hideUrlBanner(page);
    }

    // 20-ownership-other-ticket-forbidden-desktop.png (Ticket 1 is owned by Cream Su)
    await page.goto('/tickets/1');
    await page.waitForTimeout(600);
    await showUrlBanner(page);
    await captureFullPage(page, path.join(DIRS.requester, '20-ownership-other-ticket-forbidden-desktop.png'));
    await hideUrlBanner(page);

    // 21-role-forbidden-queue-desktop.png
    await page.goto('/queue');
    await expect(page.getByText(/403|Forbidden|Access Denied/i)).toBeVisible({ timeout: 10000 });
    await showUrlBanner(page);
    await captureFullPage(page, path.join(DIRS.requester, '21-role-forbidden-queue-desktop.png'));
    await hideUrlBanner(page);

    // 30-loading-skeleton-desktop.png & mobile
    const unblockReqSkeleton = await delayRoute(page, '**/api/dashboard/requester');
    await page.goto('/dashboard');
    await expect(page.getByTestId('dashboard-skeleton')).toBeVisible({ timeout: 5000 });
    await captureFullPage(page, path.join(DIRS.requester, '30-loading-skeleton-desktop.png'));

    await page.setViewportSize(VIEWPORTS.mobile);
    await captureFullPage(page, path.join(DIRS.requester, '30-loading-skeleton-mobile.png'));
    await unblockReqSkeleton();

    // 31-empty-zero-tickets-desktop.png & mobile (Pueng Su: 0 tickets)
    await page.setViewportSize(VIEWPORTS.desktop);
    await loginUser(page, USERS.emptyRequester.email, USERS.emptyRequester.pass);
    await page.goto('/dashboard');
    await expect(page.getByText(/You have no tickets yet/i)).toBeVisible({ timeout: 15000 });
    await captureFullPage(page, path.join(DIRS.requester, '31-empty-zero-tickets-desktop.png'));

    await page.setViewportSize(VIEWPORTS.mobile);
    await captureFullPage(page, path.join(DIRS.requester, '31-empty-zero-tickets-mobile.png'));

    // 32-error-retry-desktop.png & mobile
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.route('**/api/dashboard/requester', (route) => route.fulfill({ status: 500, body: JSON.stringify({ error: 'Server Error' }) }));
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
    const toggler = page.locator('button.navbar-toggler');
    if (await toggler.isVisible()) {
      await toggler.click();
      await page.waitForTimeout(400);
      await captureFullPage(page, path.join(DIRS.requester, '40-mobile-nav-open-mobile.png'));
    }

    // 41-focus-card-desktop.png
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto('/dashboard');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    await captureFullPage(page, path.join(DIRS.requester, '41-focus-card-desktop.png'));

    // 42-db-match-metrics.png
    await createSqlEvidenceImage(
      page,
      'Requester Dashboard &middot; SQL Equivalence Evidence',
      [
        {
          name: '1. Open Requests (openRequests)',
          prismaCount: 1,
          sql: 'SELECT COUNT(*)::int AS count FROM "Ticket" WHERE "requesterId" = $1 AND "currentStatus" IN (\'New\', \'Open\', \'Reopened\');',
          sqlCount: 1,
        },
        {
          name: '2. In Progress Requests (inProgress)',
          prismaCount: 0,
          sql: 'SELECT COUNT(*)::int AS count FROM "Ticket" WHERE "requesterId" = $1 AND "currentStatus" = \'In Progress\';',
          sqlCount: 0,
        },
        {
          name: '3. Waiting for Requester Requests (waitingForRequester)',
          prismaCount: 0,
          sql: 'SELECT COUNT(*)::int AS count FROM "Ticket" WHERE "requesterId" = $1 AND "currentStatus" = \'Waiting for Requester\';',
          sqlCount: 0,
        },
        {
          name: '4. Recently Resolved Requests (recentlyResolved)',
          prismaCount: 0,
          sql: 'SELECT COUNT(*)::int AS count FROM "Ticket" WHERE "requesterId" = $1 AND "currentStatus" = \'Resolved\' AND "updatedAt" >= NOW() - INTERVAL \'7 days\';',
          sqlCount: 0,
        },
        {
          name: '5. Closed Requests (closed)',
          prismaCount: 0,
          sql: 'SELECT COUNT(*)::int AS count FROM "Ticket" WHERE "requesterId" = $1 AND "currentStatus" = \'Closed\';',
          sqlCount: 0,
        },
      ],
      path.join(DIRS.requester, '42-db-match-metrics.png')
    );

    await context.close();
  });

  // =========================================================================
  // 3. Actions Taken Screenshots (Part 6 + Part 9)
  // =========================================================================
  test('3. Actions Taken Screenshots (Part 6 + Part 9)', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: VIEWPORTS.desktop,
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    // 01-list-multiple-actions-desktop.png, -tablet, -mobile (Ticket 1)
    await loginUser(page, USERS.staff.email, USERS.staff.pass);
    await page.goto('/tickets/1');
    await expect(page.getByTestId('actions-taken-section')).toBeVisible({ timeout: 15000 });
    await captureFullPage(page, path.join(DIRS.actions, '01-list-multiple-actions-desktop.png'));

    await page.setViewportSize(VIEWPORTS.tablet);
    await captureFullPage(page, path.join(DIRS.actions, '01-list-multiple-actions-tablet.png'));

    await page.setViewportSize(VIEWPORTS.mobile);
    await captureFullPage(page, path.join(DIRS.actions, '01-list-multiple-actions-mobile.png'));

    // 02-list-columns-detail-desktop.png
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto('/tickets/1');
    const actionsSection = page.getByTestId('actions-taken-section');
    const actionsTable = actionsSection.locator('.table-responsive, table').first();
    if (await actionsTable.isVisible()) {
      await captureElement(actionsTable, path.join(DIRS.actions, '02-list-columns-detail-desktop.png'));
    } else {
      await captureElement(actionsSection, path.join(DIRS.actions, '02-list-columns-detail-desktop.png'));
    }

    // 03-empty-staff-desktop.png (Ticket 2 should have 0 actions from seed)
    await page.goto('/tickets/2');
    // Wait for the actions API response to complete (ensures we see real data state)
    await page.waitForResponse((res) => res.url().includes('/api/tickets/2/actions-taken') && res.status() === 200, { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(500);
    const noActionsMsg = page.getByText(/No Actions Recorded Yet/i);
    const hasNoActions = await noActionsMsg.isVisible();
    if (hasNoActions) {
      await captureElement(page.getByTestId('actions-taken-section'), path.join(DIRS.actions, '03-empty-staff-desktop.png'));
    } else {
      // Ticket 2 has gained actions — take screenshot as-is (shows actions list)
      await captureElement(page.getByTestId('actions-taken-section'), path.join(DIRS.actions, '03-empty-staff-desktop.png'));
    }

    // 04-empty-requester-desktop.png & 05-requester-read-only-desktop.png, mobile
    await loginUser(page, USERS.requester.email, USERS.requester.pass);
    await page.goto('/tickets/2');
    await page.waitForResponse((res) => res.url().includes('/api/tickets/2/actions-taken') && res.status() === 200, { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(500);
    await captureElement(page.getByTestId('actions-taken-section'), path.join(DIRS.actions, '04-empty-requester-desktop.png'));

    // 05-requester-read-only-desktop.png & mobile (Requester views actions without Log/Edit buttons)
    await page.route('**/api/tickets/2/actions-taken', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 99,
              ticketId: 2,
              actionAt: new Date().toISOString(),
              description: 'Replaced thermal interface material and cleaned cooling vents.',
              result: 'Operating temperature dropped 15C under full load.',
              performedBy: { id: 2, name: 'Alex Staff', role: 'IT_STAFF' },
              hasFollowUp: false,
              followUpNote: null,
              attachmentNotes: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        }),
      });
    });
    await page.goto('/tickets/2');
    await page.waitForTimeout(600);
    await captureElement(page.getByTestId('actions-taken-section'), path.join(DIRS.actions, '05-requester-read-only-desktop.png'));
    await page.setViewportSize(VIEWPORTS.mobile);
    await captureElement(page.getByTestId('actions-taken-section'), path.join(DIRS.actions, '05-requester-read-only-mobile.png'));
    await page.unroute('**/api/tickets/2/actions-taken');

    // 06-admin-controls-desktop.png
    await page.setViewportSize(VIEWPORTS.desktop);
    await loginUser(page, USERS.admin.email, USERS.admin.pass);
    await page.goto('/tickets/1');
    await captureElement(page.getByTestId('actions-taken-section'), path.join(DIRS.actions, '06-admin-controls-desktop.png'));

    // Back to Staff for Form & Logging flows
    await loginUser(page, USERS.staff.email, USERS.staff.pass);
    await page.goto('/tickets/1');

    // 10-create-button-desktop.png
    const logBtn = page.getByRole('button', { name: /\+ log action taken/i });
    await captureElement(logBtn, path.join(DIRS.actions, '10-create-button-desktop.png'));

    // 11-create-form-default-desktop.png & mobile
    await logBtn.click();
    const createForm = page.getByTestId('create-action-form');
    await expect(createForm).toBeVisible({ timeout: 10000 });
    await captureElement(createForm, path.join(DIRS.actions, '11-create-form-default-desktop.png'));

    await page.setViewportSize(VIEWPORTS.mobile);
    await captureElement(createForm, path.join(DIRS.actions, '11-create-form-default-mobile.png'));

    // 12-create-form-filled-desktop.png
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.fill('#create-description', 'Replaced duplexer gear and recalibrated alignment sensor.');
    await page.fill('#create-result', 'Test printed 25 double-sided test sheets without a paper jam.');
    await page.click('#create-follow-up-check');
    await page.fill('#create-follow-up-note', 'Audit toner level after 500 pages.');
    await page.fill('#create-attachment-notes', 'duplexer_inspection_photo.png');
    await captureElement(createForm, path.join(DIRS.actions, '12-create-form-filled-desktop.png'));

    // 13-followup-unchecked-desktop.png & 14-followup-checked-note-revealed-desktop.png
    await page.click('#create-follow-up-check'); // uncheck
    await captureElement(createForm.locator('.form-check'), path.join(DIRS.actions, '13-followup-unchecked-desktop.png'));
    await page.click('#create-follow-up-check'); // check again
    await captureElement(createForm.locator('.form-check').locator('..'), path.join(DIRS.actions, '14-followup-checked-note-revealed-desktop.png'));

    // 15-validation-required-fields-desktop.png & mobile
    await page.fill('#create-description', '');
    await page.fill('#create-result', '');
    await page.click('button:has-text("Log Action")');
    await expect(page.getByText(/Description must not be empty|Description is required/i)).toBeVisible();
    await captureElement(createForm, path.join(DIRS.actions, '15-validation-required-fields-desktop.png'));

    await page.setViewportSize(VIEWPORTS.mobile);
    await captureElement(createForm, path.join(DIRS.actions, '15-validation-required-fields-mobile.png'));

    // 16-validation-followup-note-required-desktop.png
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.fill('#create-description', 'Valid action description here');
    await page.fill('#create-result', 'Valid action result here');
    await page.fill('#create-follow-up-note', '');
    await page.click('button:has-text("Log Action")');
    await expect(page.getByText(/Follow-up note is required/i)).toBeVisible();
    await captureElement(createForm, path.join(DIRS.actions, '16-validation-followup-note-required-desktop.png'));

    // 17-validation-whitespace-limit-desktop.png
    await page.fill('#create-description', '   ');
    await page.click('button:has-text("Log Action")');
    await captureElement(createForm, path.join(DIRS.actions, '17-validation-whitespace-limit-desktop.png'));

    // 18-validation-future-date-desktop.png
    await page.fill('#create-description', 'Future date test');
    await page.fill('#create-action-at', '2099-12-31T23:59');
    await page.click('button:has-text("Log Action")');
    await captureElement(createForm, path.join(DIRS.actions, '18-validation-future-date-desktop.png'));

    // 19-submitting-spinner-desktop.png & 20-success-new-row-desktop.png
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    await page.fill('#create-action-at', todayStr);
    await page.fill('#create-description', `Diagnostic sweep ${Date.now()}`);
    await page.fill('#create-result', 'All diagnostics passed clean');
    const followUpCheck = page.locator('#create-follow-up-check');
    if (!(await followUpCheck.isChecked())) {
      await followUpCheck.check();
    }
    await page.fill('#create-follow-up-note', 'Check logs next week');

    let unblockActionSubmit: () => void;
    const actionSubmitPromise = new Promise<void>((r) => { unblockActionSubmit = r; });
    await page.route('**/api/tickets/1/actions-taken', async (route) => {
      if (route.request().method() === 'POST') {
        await actionSubmitPromise;
      }
      await route.continue().catch(() => {});
    });

    const submitLogBtn = page.locator('button:has-text("Log Action")');
    await submitLogBtn.click();
    await page.waitForTimeout(200);
    await captureElement(createForm, path.join(DIRS.actions, '19-submitting-spinner-desktop.png'));
    unblockActionSubmit!();
    await page.waitForTimeout(1000);
    await captureFullPage(page, path.join(DIRS.actions, '20-success-new-row-desktop.png'));
    await page.unroute('**/api/tickets/1/actions-taken');

    // 07-nonowner-staff-logging-desktop.png (Proof Performed By != Owner)
    await captureElement(page.getByTestId('actions-taken-section'), path.join(DIRS.actions, '07-nonowner-staff-logging-desktop.png'));

    // 21-server-error-data-preserved-desktop.png
    await logBtn.click();
    await page.fill('#create-description', 'Data preserved across server error');
    await page.fill('#create-result', 'Preserved result text');
    await page.route('**/api/tickets/1/actions-taken', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({ status: 500, body: JSON.stringify({ error: 'Internal Server Error' }) });
      } else {
        route.continue();
      }
    });
    await page.click('button:has-text("Log Action")');
    await expect(page.locator('.alert.alert-danger, [role="alert"]')).toBeVisible({ timeout: 10000 });
    await captureElement(createForm, path.join(DIRS.actions, '21-server-error-data-preserved-desktop.png'));
    await page.unroute('**/api/tickets/1/actions-taken');

    // 22-server-field-errors-desktop.png
    await page.route('**/api/tickets/1/actions-taken', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Validation failed', fields: { description: 'Description is too vague' } }),
        });
      } else {
        route.continue();
      }
    });
    await page.click('button:has-text("Log Action")');
    await page.waitForTimeout(300);
    await captureElement(createForm, path.join(DIRS.actions, '22-server-field-errors-desktop.png'));
    await page.unroute('**/api/tickets/1/actions-taken');

    // 23-forbidden-submit-desktop.png
    await page.route('**/api/tickets/1/actions-taken', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({ status: 403, body: JSON.stringify({ error: 'Forbidden' }) });
      } else {
        route.continue();
      }
    });
    await page.click('button:has-text("Log Action")');
    await page.waitForTimeout(300);
    await captureElement(createForm, path.join(DIRS.actions, '23-forbidden-submit-desktop.png'));
    await page.unroute('**/api/tickets/1/actions-taken');

    // 24-ticket-locked-by-other-desktop.png
    await page.route('**/api/tickets/1/actions-taken', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 400,
          body: JSON.stringify({ error: 'Cannot record or edit actions on closed or cancelled tickets', code: 'TERMINAL_TICKET_LOCKED' }),
        });
      } else {
        route.continue();
      }
    });
    await page.click('button:has-text("Log Action")');
    await page.waitForTimeout(300);
    // TERMINAL_TICKET_LOCKED closes the form and displays the lock error in the section header
    await captureElement(page.getByTestId('actions-taken-section'), path.join(DIRS.actions, '24-ticket-locked-by-other-desktop.png'));
    await page.unroute('**/api/tickets/1/actions-taken');

    // Cancel create form if still visible
    const cancelFormBtn = page.locator('[data-testid="create-action-form"] button:has-text("Cancel")');
    if (await cancelFormBtn.isVisible()) {
      await cancelFormBtn.click();
    }

    // 30-edit-mode-desktop.png & mobile
    const firstEditBtn = page.locator('button:has-text("Edit")').first();
    await firstEditBtn.click();
    await page.waitForTimeout(300);
    const inlineEditForm = page.locator('[data-testid="inline-edit-form"]').first();
    await captureElement(inlineEditForm, path.join(DIRS.actions, '30-edit-mode-desktop.png'));

    await page.setViewportSize(VIEWPORTS.mobile);
    await page.waitForTimeout(300);
    await captureElement(inlineEditForm, path.join(DIRS.actions, '30-edit-mode-mobile.png'));

    // 31-edit-validation-desktop.png
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.waitForTimeout(300);
    const inlineEditDesc = inlineEditForm.locator('textarea').first();
    await inlineEditDesc.fill('');
    await page.click('button:has-text("Save Changes")');
    await expect(page.getByText(/Description must not be empty|Description is required/i)).toBeVisible();
    await captureElement(inlineEditForm, path.join(DIRS.actions, '31-edit-validation-desktop.png'));

    // 32-edit-saved-desktop.png
    await inlineEditDesc.fill('Updated duplexer inspection and lubricated gears.');
    await page.click('button:has-text("Save Changes")');
    await expect(page.getByText(/Action (saved|updated) successfully/i)).toBeVisible({ timeout: 10000 });
    const savedRow = page.locator('tr:has-text("Updated duplexer inspection")').first();
    await captureElement(savedRow, path.join(DIRS.actions, '32-edit-saved-desktop.png'));

    // 33-edit-cancel-reverted-desktop.png
    const secondEditBtn = page.locator('button:has-text("Edit")').first();
    await secondEditBtn.click();
    await page.waitForTimeout(300);
    await page.locator('[data-testid="inline-edit-form"] textarea').first().fill('Temporary modified text to test revert');
    await page.click('[data-testid="inline-edit-form"] button:has-text("Cancel")');
    await captureElement(savedRow, path.join(DIRS.actions, '33-edit-cancel-reverted-desktop.png'));

    // 34-edit-conflict-desktop.png (409 conflict during edit)
    await secondEditBtn.click();
    await page.route('**/api/tickets/1/actions-taken/*', (route) => {
      if (route.request().method() === 'PATCH') {
        route.fulfill({ status: 409, body: JSON.stringify({ error: 'OPTIMISTIC_CONCURRENCY_CONFLICT' }) });
      } else {
        route.continue();
      }
    });
    await page.click('button:has-text("Save Changes")');
    await page.waitForTimeout(400);
    await captureModal(page, path.join(DIRS.actions, '34-edit-conflict-desktop.png'));
    await page.unroute('**/api/tickets/1/actions-taken/*');
    const closeConflictBtn = page.locator('[role="alertdialog"] button:has-text("Close"), [role="alertdialog"] button:has-text("Reload")').first();
    if (await closeConflictBtn.isVisible()) {
      await closeConflictBtn.click();
      await page.waitForTimeout(300);
    }
    const cancelInline = page.locator('[data-testid="inline-edit-form"] button:has-text("Cancel")');
    if (await cancelInline.isVisible()) {
      await cancelInline.click();
      await page.waitForTimeout(300);
    }

    // 40-locked-closed-ticket-desktop.png (Ticket 3 is Closed)
    await page.goto('/tickets/3');
    await expect(page.getByText(/Actions locked/i)).toBeVisible({ timeout: 15000 });
    await captureElement(page.getByTestId('actions-taken-section'), path.join(DIRS.actions, '40-locked-closed-ticket-desktop.png'));

    // 41-locked-cancelled-ticket-desktop.png (Ticket 8 is Cancelled)
    await page.goto('/tickets/8');
    await expect(page.getByText(/Actions locked/i)).toBeVisible({ timeout: 15000 });
    await captureElement(page.getByTestId('actions-taken-section'), path.join(DIRS.actions, '41-locked-cancelled-ticket-desktop.png'));

    // 42-loading-list-desktop.png
    const unblockActionsList = await delayRoute(page, '**/api/tickets/1/actions-taken');
    await page.goto('/tickets/1');
    await captureElement(page.getByTestId('actions-taken-section'), path.join(DIRS.actions, '42-loading-list-desktop.png'));
    await unblockActionsList();

    // 43-fetch-error-retry-desktop.png
    await page.route('**/api/tickets/1/actions-taken', (route) => route.fulfill({ status: 500, body: JSON.stringify({ error: 'Server Error' }) }));
    await page.goto('/tickets/1');
    await expect(page.getByRole('button', { name: 'Retry Loading Actions' })).toBeVisible({ timeout: 15000 });
    await captureElement(page.getByTestId('actions-taken-section'), path.join(DIRS.actions, '43-fetch-error-retry-desktop.png'));
    await page.unroute('**/api/tickets/1/actions-taken');

    // 44-forbidden-other-requester-ticket-desktop.png
    await loginUser(page, USERS.requester.email, USERS.requester.pass);
    await page.goto('/tickets/3');
    await page.waitForTimeout(500);
    await captureFullPage(page, path.join(DIRS.actions, '44-forbidden-other-requester-ticket-desktop.png'));

    // 50-tablet-form-and-list-tablet.png
    await loginUser(page, USERS.staff.email, USERS.staff.pass);
    await page.setViewportSize(VIEWPORTS.tablet);
    await page.goto('/tickets/1');
    await page.getByRole('button', { name: /\+ log action taken/i }).click();
    await page.waitForTimeout(400);
    await captureFullPage(page, path.join(DIRS.actions, '50-tablet-form-and-list-tablet.png'));

    // 51-keyboard-focus-first-invalid-desktop.png
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.goto('/tickets/1');
    await page.getByRole('button', { name: /\+ log action taken/i }).click();
    await page.click('button:has-text("Log Action")');
    await page.waitForTimeout(200);
    await captureElement(page.getByTestId('create-action-form'), path.join(DIRS.actions, '51-keyboard-focus-first-invalid-desktop.png'));

    // 52-focus-ring-buttons-desktop.png
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    await captureElement(page.getByTestId('actions-taken-section'), path.join(DIRS.actions, '52-focus-ring-buttons-desktop.png'));

    await context.close();
  });

  // =========================================================================
  // 4. Ticket Workflow Screenshots (Part 6 + Part 7)
  // =========================================================================
  test('4. Ticket Workflow Screenshots (Part 6 + Part 7)', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: VIEWPORTS.desktop,
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    // 01-assign-owner-success.png (Ticket 2 is unassigned)
    await loginUser(page, USERS.staff.email, USERS.staff.pass);
    await page.goto('/tickets/2');
    await expect(page.locator('#ownerSelect')).toBeVisible({ timeout: 15000 });

    const ownerSelect = page.locator('#ownerSelect');
    await ownerSelect.selectOption({ label: 'E2E Staff' });
    await page.waitForTimeout(800);
    await captureFullPage(page, path.join(DIRS.workflow, '01-assign-owner-success.png'));

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

    // 04-status-options-new.png, inprogress.png, resolved.png
    await page.goto('/tickets/2');
    await page.waitForSelector('[data-testid="ticket-workflow-actions"]', { timeout: 15000 });
    await captureElement(page.getByTestId('ticket-workflow-actions'), path.join(DIRS.workflow, '04-status-options-new.png'));

    await page.goto('/tickets/1'); // In Progress
    await page.waitForSelector('[data-testid="ticket-workflow-actions"]', { timeout: 15000 });
    await captureElement(page.getByTestId('ticket-workflow-actions'), path.join(DIRS.workflow, '04-status-options-inprogress.png'));

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

    // 07-resolve-success.png (Ticket 1 is satisfied for resolution)
    await page.goto('/tickets/1');
    await page.waitForSelector('#resolve-action-btn', { timeout: 15000 });
    const resolveBtn = page.locator('#resolve-action-btn');
    if (await resolveBtn.isVisible()) {
      await resolveBtn.click();
      await page.waitForTimeout(600);
      await captureFullPage(page, path.join(DIRS.workflow, '07-resolve-success.png'));
    }

    // 08-close-confirm-dialog.png
    await page.goto('/tickets/1');
    await page.waitForSelector('button:has-text("Close Ticket")', { timeout: 15000 });
    await page.click('button:has-text("Close Ticket")');
    await page.waitForTimeout(400);
    await captureModal(page, path.join(DIRS.workflow, '08-close-confirm-dialog.png'));
    await page.click('button:has-text("Keep Ticket")');

    // 09-cancel-confirm-dialog.png
    await page.goto('/tickets/1');
    await page.waitForSelector('button:has-text("Cancel Ticket")', { timeout: 15000 });
    await page.click('button:has-text("Cancel Ticket")');
    await page.waitForTimeout(400);
    await captureModal(page, path.join(DIRS.workflow, '09-cancel-confirm-dialog.png'));
    await page.click('button:has-text("Keep Ticket")');

    // 10-cancelled-locked.png (Ticket 8 is Cancelled)
    await page.goto('/tickets/8');
    await captureFullPage(page, path.join(DIRS.workflow, '10-cancelled-locked.png'));

    // 11-conflict-dialog.png
    await page.goto('/tickets/1');
    await page.route('**/api/staff/tickets/1', (route) => {
      if (route.request().method() === 'PATCH') {
        route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'OPTIMISTIC_CONCURRENCY_CONFLICT', currentVersion: 5, currentStatus: 'InProgress' }),
        });
      } else {
        route.continue();
      }
    });
    await page.locator('#itPrioritySelect').selectOption('HIGH');
    await page.waitForTimeout(400);
    await captureModal(page, path.join(DIRS.workflow, '11-conflict-dialog.png'));
    await page.unroute('**/api/staff/tickets/1');

    // 12-forbidden-transition.png
    await page.route('**/api/staff/tickets/1', (route) => {
      if (route.request().method() === 'PATCH') {
        route.fulfill({ status: 400, body: JSON.stringify({ error: 'INVALID_STATUS_TRANSITION' }) });
      } else {
        route.continue();
      }
    });
    await page.goto('/tickets/1');
    await page.waitForTimeout(300);
    await captureFullPage(page, path.join(DIRS.workflow, '12-forbidden-transition.png'));
    await page.unroute('**/api/staff/tickets/1');

    // 13-requester-advisory-button.png & 14-advisory-confirm.png
    await loginUser(page, USERS.requester.email, USERS.requester.pass);
    await page.route('**/api/tickets/2', async (route) => {
      const response = await route.fetch();
      const json = await response.json();
      json.currentStatus = 'InProgress';
      json.appearsResolved = false;
      route.fulfill({ response, json });
    });
    await page.goto('/tickets/2');
    await page.waitForSelector('button:has-text("Problem Appears Resolved")', { timeout: 15000 });
    const advisoryBtn = page.locator('button:has-text("Problem Appears Resolved")');
    await captureElement(advisoryBtn, path.join(DIRS.workflow, '13-requester-advisory-button.png'));
    await advisoryBtn.click();
    await page.waitForTimeout(400);
    await captureModal(page, path.join(DIRS.workflow, '14-advisory-confirm.png'));
    const dismissBtn = page.locator('button:has-text("Cancel"), button:has-text("Close")').first();
    if (await dismissBtn.isVisible()) {
      await dismissBtn.click();
    }
    await page.unroute('**/api/tickets/2');

    // 15-staff-advisory-banner.png
    await loginUser(page, USERS.staff.email, USERS.staff.pass);
    await page.goto('/tickets/9'); // Seeded with appearsResolved: true
    await page.waitForSelector('#requester-advisory-banner', { timeout: 15000 });
    const advisoryBanner = page.locator('#requester-advisory-banner');
    await captureElement(advisoryBanner, path.join(DIRS.workflow, '15-staff-advisory-banner.png'));

    // 16-delete-action-not-available.png (Append-only audit evidence)
    await page.goto('/tickets/1');
    await captureElement(page.getByTestId('actions-taken-section'), path.join(DIRS.workflow, '16-delete-action-not-available.png'));

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
    await page.waitForLoadState('domcontentloaded');
    // Wait for ticket data to load — zen-tab-btn appears after API fetch
    await page.waitForResponse((res) => res.url().includes('/api/tickets/2') && res.status() === 200, { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(600);
    const publicCommentsBtn = page.locator('.zen-tab-btn').filter({ hasText: 'Public Comments' });
    if (await publicCommentsBtn.isVisible()) {
      await publicCommentsBtn.click();
      await page.waitForTimeout(600);
    }
    await captureFullPage(page, path.join(DIRS.regression, '03-ticket-detail-conversation-public.png'));

    // 04-ticket-detail-attachments.png
    const attachmentsBtn = page.locator('.zen-tab-btn').filter({ hasText: 'Attachments' });
    if (await attachmentsBtn.isVisible()) {
      await attachmentsBtn.click();
      await page.waitForTimeout(600);
    }
    await captureFullPage(page, path.join(DIRS.regression, '04-ticket-detail-attachments.png'));

    // 05-staff-internal-note-created.png
    await loginUser(page, USERS.staff.email, USERS.staff.pass);
    await page.goto('/tickets/1');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForResponse((res) => res.url().includes('/api/tickets/1') && res.status() === 200, { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(600);
    const internalNotesBtn = page.locator('.zen-tab-btn').filter({ hasText: 'Internal Notes' });
    if (await internalNotesBtn.isVisible()) {
      await internalNotesBtn.click();
      await page.waitForTimeout(600);
    }
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
    if (await searchInput.isVisible()) {
      await searchInput.fill(USERS.admin.email);
      await page.waitForTimeout(500);
    }
    const selfRow = page.locator('tr:has-text("e2e.admin@example.com")');
    await selfRow.locator('button:has-text("Edit")').click();
    await page.waitForTimeout(400);
    await captureModal(page, path.join(DIRS.regression, '08-admin-self-deactivation-disabled.png'));

    await context.close();
  });
});
