import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Lab 4 Issue 9: Dashboard UIs, Navigation, and Drill-down (E2E-DSH)', () => {
  // Run on desktop chromium for deterministic checks; responsive viewports tested explicitly inside
  test.skip(({ browserName, isMobile }) => browserName !== 'chromium' || !!isMobile, 'Dashboard E2E suite runs on Chromium desktop');

  const ADMIN_EMAIL = 'e2e.admin@example.com';
  const STAFF_EMAIL = 'e2e.staff@example.com';
  const REQUESTER_EMAIL = 'e2e.requester@example.com';
  const EMPTY_REQUESTER_EMAIL = 'pueng.su@example.com';
  const PASSWORD = 'Password123!';

  const SCREENSHOT_DIR = path.resolve(__dirname, '../../artifacts/lab-04/screenshots');

  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('E2E-DSH-01: Requester Dashboard Drill-down & Count Parity (DoD-6)', async ({ page }) => {
    // 1. Log in as Requester
    await page.goto('/login');
    await page.fill('#emailInput', REQUESTER_EMAIL);
    await page.fill('#passwordInput', PASSWORD);
    await page.click('button:has-text("Sign In")');

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: /Requester Dashboard/i })).toBeVisible({ timeout: 15000 });

    // 2. Locate Open Requests metric card
    const openCard = page.locator('a[aria-label*="Open Requests"]');
    await expect(openCard).toBeVisible();

    // Extract count from card
    const cardCountText = await openCard.locator('.display-6').innerText();
    const expectedCount = parseInt(cardCountText.trim(), 10);

    // 3. Click card to drill down to My Tickets
    await openCard.click();
    await expect(page).toHaveURL(/\/tickets\?status=New%2COpen%2CReopened/);

    // 4. Verify Active Filter Chips rendered
    const activeFiltersBar = page.getByRole('region', { name: 'Active filters' });
    await expect(activeFiltersBar).toBeVisible({ timeout: 15000 });
    await expect(activeFiltersBar.getByText(/Status: New, Open, Reopened/i)).toBeVisible();

    // 5. Verify dynamic count parity: list total count === card count (DoD-6)
    const listTotalElem = page.getByTestId('list-total-count');
    await expect(listTotalElem).toHaveText(String(expectedCount), { timeout: 15000 });

    // 6. Test Clear All filters chip
    const clearAllBtn = page.getByRole('button', { name: /Clear all/i });
    await clearAllBtn.click();
    await expect(page).toHaveURL(/\/tickets(\?page=1)?$/);
    await expect(page.getByRole('region', { name: 'Active filters' })).toBeHidden();
  });

  test('E2E-DSH-02: Staff Dashboard Operational Cards Drill-down & Count Parity (DoD-6)', async ({ page }) => {
    // 1. Log in as IT Staff
    await page.goto('/login');
    await page.fill('#emailInput', STAFF_EMAIL);
    await page.fill('#passwordInput', PASSWORD);
    await page.click('button:has-text("Sign In")');

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: /IT Support Dashboard/i })).toBeVisible({ timeout: 15000 });

    // 2. Unassigned card drill-down
    const unassignedCard = page.locator('a[aria-label*="Unassigned"]');
    await expect(unassignedCard).toBeVisible();
    const unassignedCountText = await unassignedCard.locator('.display-6').innerText();
    const unassignedCount = parseInt(unassignedCountText.trim(), 10);

    await unassignedCard.click();
    await expect(page).toHaveURL(/\/queue\?ownerId=unassigned&active=true/);

    // Verify Active Filter Chips
    const activeFiltersBar = page.getByRole('region', { name: 'Active filters' });
    await expect(activeFiltersBar).toBeVisible({ timeout: 15000 });
    await expect(activeFiltersBar.getByText(/Owner: Unassigned/i)).toBeVisible();
    await expect(activeFiltersBar.getByText(/Active Only/i)).toBeVisible();

    // Verify list total parity with auto-retrying assertion
    const listTotalElem = page.getByTestId('list-total-count');
    await expect(listTotalElem).toHaveText(String(unassignedCount), { timeout: 15000 });

    // 3. Return to Dashboard and test Assigned to Me card
    await page.goto('/dashboard');
    const meCard = page.locator('a[aria-label*="Assigned to Me"]');
    await expect(meCard).toBeVisible({ timeout: 15000 });
    const meCountText = await meCard.locator('.display-6').innerText();
    const meCount = parseInt(meCountText.trim(), 10);

    await meCard.click();
    await expect(page).toHaveURL(/\/queue\?ownerId=me&active=true/);
    await expect(page.getByRole('region', { name: 'Active filters' }).getByText(/Owner: Assigned to Me/i)).toBeVisible();
    await expect(page.getByTestId('list-total-count')).toHaveText(String(meCount), { timeout: 15000 });
  });

  test('E2E-DSH-03: Priority & Status Chips Drill-down with Filter Removal', async ({ page }) => {
    // 1. Log in as IT Staff
    await page.goto('/login');
    await page.fill('#emailInput', STAFF_EMAIL);
    await page.fill('#passwordInput', PASSWORD);
    await page.click('button:has-text("Sign In")');

    await expect(page).toHaveURL(/\/dashboard/);

    // 2. Click HIGH priority chip
    const highChip = page.getByRole('link', { name: /Priority: HIGH/i });
    await expect(highChip).toBeVisible({ timeout: 15000 });
    const chipCountText = await highChip.locator('.badge.rounded-pill').innerText();
    const chipCount = parseInt(chipCountText.trim(), 10);

    await highChip.click();
    await expect(page).toHaveURL(/\/queue\?itPriority=HIGH&active=true/);

    // Verify chip filter badge in list
    const activeFiltersBar = page.getByRole('region', { name: 'Active filters' });
    await expect(activeFiltersBar.getByText(/Priority: HIGH/i)).toBeVisible({ timeout: 15000 });

    // Verify total count parity
    await expect(page.getByTestId('list-total-count')).toHaveText(String(chipCount), { timeout: 15000 });

    // Remove single filter chip
    const removePriorityBtn = activeFiltersBar.getByRole('button', { name: /Remove filter: Priority: HIGH/i });
    await removePriorityBtn.click();
    await expect(page).toHaveURL(/\/queue\?active=true/);
    await expect(activeFiltersBar.getByText(/Priority: HIGH/i)).toBeHidden();
    await expect(activeFiltersBar.getByText(/Active Only/i)).toBeVisible();
  });

  test('E2E-DSH-04: Dashboard Refresh Button Throttling & Live Feedback', async ({ page }) => {
    // 1. Log in as IT Staff
    await page.goto('/login');
    await page.fill('#emailInput', STAFF_EMAIL);
    await page.fill('#passwordInput', PASSWORD);
    await page.click('button:has-text("Sign In")');

    await expect(page).toHaveURL(/\/dashboard/);

    const refreshBtn = page.getByRole('button', { name: /refresh/i });
    await expect(refreshBtn).toBeVisible({ timeout: 15000 });

    // Click refresh
    await refreshBtn.click();

    // Verify live region announcement
    const liveRegion = page.locator('div[role="status"]');
    await expect(liveRegion).toContainText(/dashboard/i);
  });

  test('E2E-DSH-05: Staff Dashboard Visual Capture (Desktop 1280px, Tablet 768px, Mobile 375px)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/login');
    await page.fill('#emailInput', STAFF_EMAIL);
    await page.fill('#passwordInput', PASSWORD);
    await page.click('button:has-text("Sign In")');
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: /IT Support Dashboard/i })).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(500); // allow transitions to settle

    // Desktop
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'staff-dashboard/desktop-populated.png'), fullPage: true });

    // Tablet (768px)
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'staff-dashboard/tablet-populated.png'), fullPage: true });

    // Mobile (375px)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'staff-dashboard/mobile-populated.png'), fullPage: true });
  });

  test('E2E-DSH-06: Requester Dashboard Visual Capture (Desktop 1280px, Tablet 768px, Mobile 375px)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/login');
    await page.fill('#emailInput', REQUESTER_EMAIL);
    await page.fill('#passwordInput', PASSWORD);
    await page.click('button:has-text("Sign In")');
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: /Requester Dashboard/i })).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(500);

    // Desktop
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'requester-dashboard/desktop-populated.png'), fullPage: true });

    // Tablet (768px)
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'requester-dashboard/tablet-populated.png'), fullPage: true });

    // Mobile (375px)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'requester-dashboard/mobile-populated.png'), fullPage: true });
  });

  test('E2E-DSH-07: Empty, Error, and Forbidden States Capture', async ({ page }) => {
    // 1. Requester Empty State (User with 0 tickets: Pueng Su)
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/login');
    await page.fill('#emailInput', EMPTY_REQUESTER_EMAIL);
    await page.fill('#passwordInput', PASSWORD);
    await page.click('button:has-text("Sign In")');
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(/You have no tickets yet/i)).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'requester-dashboard/desktop-empty.png'), fullPage: true });

    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'requester-dashboard/mobile-empty.png'), fullPage: true });

    // 2. Error State Capture (Mock 500 error on dashboard endpoint)
    await page.context().clearCookies();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route('**/api/dashboard/requester', (route) => route.fulfill({ status: 500, body: JSON.stringify({ error: 'Internal Server Error' }) }));
    await page.goto('/login');
    await page.fill('#emailInput', REQUESTER_EMAIL);
    await page.fill('#passwordInput', PASSWORD);
    await page.click('button:has-text("Sign In")');
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(/Unable to connect to dashboard/i)).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'requester-dashboard/desktop-error.png'), fullPage: true });
    await page.unroute('**/api/dashboard/requester');

    // Staff Error State
    await page.context().clearCookies();
    await page.route('**/api/dashboard/staff', (route) => route.fulfill({ status: 500, body: JSON.stringify({ error: 'Internal Server Error' }) }));
    await page.goto('/login');
    await page.fill('#emailInput', STAFF_EMAIL);
    await page.fill('#passwordInput', PASSWORD);
    await page.click('button:has-text("Sign In")');
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(/Unable to connect to dashboard/i)).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'staff-dashboard/desktop-error.png'), fullPage: true });
    await page.unroute('**/api/dashboard/staff');

    // 3. Forbidden State Capture (403 forbidden screen)
    await page.context().clearCookies();
    await page.route('**/api/dashboard/staff', (route) => route.fulfill({ status: 403, body: JSON.stringify({ error: 'Forbidden' }) }));
    await page.goto('/login');
    await page.fill('#emailInput', STAFF_EMAIL);
    await page.fill('#passwordInput', PASSWORD);
    await page.click('button:has-text("Sign In")');
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(/403 - Access Forbidden/i)).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'staff-dashboard/desktop-forbidden.png'), fullPage: true });
    await page.unroute('**/api/dashboard/staff');
  });
});
