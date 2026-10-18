import { test, expect } from '@playwright/test';

test.describe('Lab 4 Issue 5: Client Routing and Role-aware Application Shell (E2E-NAV)', () => {
  // Run on desktop chromium for deterministic routing checks
  test.skip(({ browserName, isMobile }) => browserName !== 'chromium' || !!isMobile, 'Routing tests run once on Chromium desktop');

  const ADMIN_EMAIL = 'e2e.admin@example.com';
  const STAFF_EMAIL = 'e2e.staff@example.com';
  const REQUESTER_EMAIL = 'e2e.requester@example.com';
  const PASSWORD = 'Password123!';

  test('E2E-NAV-01: Admin Operational Parity - Admin navigates queue and ticket detail', async ({ page }) => {
    // 1. Admin login
    await page.goto('/login');
    await page.fill('#emailInput', ADMIN_EMAIL);
    await page.fill('#passwordInput', PASSWORD);
    await page.click('button:has-text("Sign In")');

    // 2. Lands on Dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible();

    // 3. Admin navbar exposes Dashboard, Ticket Queue, User Management
    const nav = page.locator('nav.navbar');
    await expect(nav.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Ticket Queue' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'User Management' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'My Tickets' })).toBeHidden();

    // 4. Navigate to Ticket Queue via navbar
    await nav.getByRole('link', { name: 'Ticket Queue' }).click();
    await expect(page).toHaveURL(/\/queue/);
    await expect(page.locator('h2', { hasText: 'Ticket Queue' })).toBeVisible();

    // 5. Open first ticket in queue table
    const ticketRow = page.locator('tbody tr, div.card').first();
    await expect(ticketRow).toBeVisible();
    await ticketRow.click();
    await expect(page).toHaveURL(/\/tickets\/\d+/);
    await expect(page.locator('text=Ticket Details').first()).toBeVisible();
  });

  test('E2E-NAV-02: Role Boundary Enforcement - Requester accessing /queue or /admin/users gets in-place 403', async ({ page }) => {
    // 1. Requester login
    await page.goto('/login');
    await page.fill('#emailInput', REQUESTER_EMAIL);
    await page.fill('#passwordInput', PASSWORD);
    await page.click('button:has-text("Sign In")');

    await expect(page).toHaveURL(/\/dashboard/);

    // 2. Directly navigate to /queue
    await page.goto('/queue');

    // 3. In-place 403 Forbidden rendered at /queue
    await expect(page).toHaveURL(/\/queue/);
    await expect(page.getByTestId('forbidden-screen')).toBeVisible();
    await expect(page.getByRole('heading', { name: '403 - Access Forbidden' })).toBeVisible();

    // 4. Directly navigate to /admin/users
    await page.goto('/admin/users');

    // 5. In-place 403 Forbidden rendered at /admin/users
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByTestId('forbidden-screen')).toBeVisible();
    await expect(page.getByRole('heading', { name: '403 - Access Forbidden' })).toBeVisible();
  });

  test('E2E-NAV-03: Deep Linking & Post-Login Return - unauthenticated access to /tickets/1 redirects to login then returns', async ({ page }) => {
    // 1. Unauthenticated direct access to /tickets/1
    await page.goto('/tickets/1');

    // 2. Redirected to /login
    await expect(page).toHaveURL(/\/login/);

    // 3. Log in with Staff credentials
    await page.fill('#emailInput', STAFF_EMAIL);
    await page.fill('#passwordInput', PASSWORD);
    await page.click('button:has-text("Sign In")');

    // 4. Upon login, automatically returns to /tickets/1
    await expect(page).toHaveURL(/\/tickets\/1/);
    await expect(page.locator('text=Ticket Details').first()).toBeVisible();
  });

  test('E2E-NAV-04: Deep Link In-App Back Fallback - opening /tickets/1 directly falls back to /queue without exiting app', async ({ page }) => {
    // 1. Log in first as Staff
    await page.goto('/login');
    await page.fill('#emailInput', STAFF_EMAIL);
    await page.fill('#passwordInput', PASSWORD);
    await page.click('button:has-text("Sign In")');
    await expect(page).toHaveURL(/\/dashboard/);

    // 2. Open ticket detail directly (simulates new tab / direct link with default history key)
    await page.goto('/tickets/1');
    await expect(page.locator('text=Ticket Details').first()).toBeVisible();

    // 3. Click in-app "Back to Queue" / "Back" button
    const backBtn = page.getByRole('button', { name: /Back/i }).first();
    await backBtn.click();

    // 4. Falls back safely to /queue without exiting application
    await expect(page).toHaveURL(/\/queue/);
    await expect(page.locator('h2', { hasText: 'Ticket Queue' })).toBeVisible();
  });

  test('E2E-NAV-05: Filter Persistence & History - Back button preserves URL searchParams', async ({ page }) => {
    // 1. Log in as Staff
    await page.goto('/login');
    await page.fill('#emailInput', STAFF_EMAIL);
    await page.fill('#passwordInput', PASSWORD);
    await page.click('button:has-text("Sign In")');
    await expect(page).toHaveURL(/\/dashboard/);

    // 2. Navigate to queue with filters
    await page.goto('/queue?status=InProgress&itPriority=HIGH');
    await expect(page.locator('h2', { hasText: 'Ticket Queue' })).toBeVisible();

    // Verify filter dropdowns reflect URL query params
    const statusSelect = page.locator('#statusFilter, select[aria-label="Filter by Status"]').first();
    if (await statusSelect.isVisible()) {
      await expect(statusSelect).toHaveValue('InProgress');
    }

    // 3. Click a ticket row
    const ticketRow = page.locator('tr, div.card', { hasText: 'TKT-2026-' }).first();
    await ticketRow.click();

    await expect(page).toHaveURL(/\/tickets\/\d+/);
    await expect(page.locator('text=Ticket Details').first()).toBeVisible();

    // 4. Click Back button
    const backBtn = page.getByRole('button', { name: /Back/i }).first();
    await backBtn.click();

    // 5. Returns to /queue with query params intact
    await expect(page).toHaveURL(/\/queue\?status=InProgress&itPriority=HIGH/);
  });

  test('E2E-NAV-06: Unknown Route Handling - /unknown-route-12345 renders 404 with Back to Dashboard button', async ({ page }) => {
    // 1. Log in as Requester
    await page.goto('/login');
    await page.fill('#emailInput', REQUESTER_EMAIL);
    await page.fill('#passwordInput', PASSWORD);
    await page.click('button:has-text("Sign In")');
    await expect(page).toHaveURL(/\/dashboard/);

    // 2. Navigate to unknown route
    await page.goto('/unknown-route-12345');

    // 3. 404 Not Found screen is rendered
    await expect(page.getByTestId('not-found-screen')).toBeVisible();
    await expect(page.getByRole('heading', { name: '404 - Page Not Found' })).toBeVisible();

    // 4. Click "Back to Dashboard"
    await page.getByRole('link', { name: 'Back to Dashboard' }).click();

    // 5. Safely navigates to /dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible();
  });
});
