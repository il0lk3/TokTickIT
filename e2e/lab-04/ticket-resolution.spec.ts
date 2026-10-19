import { test, expect } from '@playwright/test';

test.describe('Lab 4 Issue 7: Ticket Workflow & Resolution Feedback (E2E-RES)', () => {
  test.skip(({ browserName, isMobile }) => browserName !== 'chromium' || !!isMobile, 'Resolution Flow E2E runs once on Chromium desktop');

  const STAFF_EMAIL = 'e2e.staff@example.com';
  const ADMIN_EMAIL = 'e2e.admin@example.com';
  const REQUESTER_EMAIL = 'e2e.requester@example.com';
  const PASSWORD = 'Password123!';

  async function loginUser(page: any, email: string, password = PASSWORD) {
    await page.goto('/login');
    await page.fill('#emailInput', email);
    await page.fill('#passwordInput', password);
    await page.click('button:has-text("Sign In")');
    await expect(page).not.toHaveURL(/\/login/);
  }

  async function logoutUser(page: any) {
    const logoutBtn = page.locator('button:has-text("Logout"), button:has-text("Sign Out")');
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await expect(page).toHaveURL(/\/login/);
    }
  }

  // =========================================================================
  // E2E-RES-01: Resolution Gate Lifecycle - Gate blocks until Action + Owner
  // =========================================================================
  test('E2E-RES-01: Gate block and unblock via action and owner assignment', async ({ page, request }) => {
    // 1. Create a fresh ticket via Requester API
    await request.post('http://localhost:3000/api/auth/login', {
      data: { email: REQUESTER_EMAIL, password: PASSWORD },
    });

    const createRes = await request.post('http://localhost:3000/api/tickets', {
      data: {
        categoryId: 1,
        relatedSystemId: 1,
        summary: `Gate Lifecycle Ticket ${Date.now()}`,
        description: 'Testing resolution gate blocking and unblocking',
        requestedPriority: 'HIGH',
      },
    });
    expect(createRes.ok()).toBeTruthy();
    const createdTicket = await createRes.json();
    const ticketId = createdTicket.id;

    // 2. Staff logs in
    await loginUser(page, STAFF_EMAIL);

    // 3. Open the fresh ticket (starts as New, unassigned, 0 actions taken)
    await page.goto(`/tickets/${ticketId}`);
    await expect(page.locator('text=Ticket Details').first()).toBeVisible();

    const statusBadge = page.getByTestId('status-badge');
    await expect(statusBadge).toBeVisible();
    await expect(statusBadge).toContainText('New');

    // 4. Transition from New to Open
    const openBtn = page.getByRole('button', { name: /^Open Ticket$/i });
    await expect(openBtn).toBeVisible();
    await openBtn.click();
    await expect(statusBadge).toContainText('Open');

    // 5. On Open ticket with no action taken, Resolve action is aria-disabled
    const resolveBtn = page.locator('#resolve-action-btn');
    await expect(resolveBtn).toBeVisible();
    await expect(resolveBtn).toHaveAttribute('aria-disabled', 'true');

    // Resolution Gate banner is shown
    const gateBanner = page.locator('#resolution-gate-reason');
    await expect(gateBanner).toBeVisible();
    await expect(gateBanner).toContainText('Resolution Gate Requirements');

    // 6. Assign owner
    const claimBtn = page.getByRole('button', { name: /Claim Ticket/i });
    if (await claimBtn.isVisible()) {
      await claimBtn.click();
    } else {
      await page.selectOption('#ownerSelect', { label: 'E2E Staff' });
    }

    // 7. Log Action Taken
    const logActionBtn = page.getByRole('button', { name: /\+ log action taken/i });
    await logActionBtn.click();

    const uniqueDesc = `Resolution requirement met ${Date.now()}`;
    await page.fill('#create-description', uniqueDesc);
    await page.fill('#create-result', 'Verified fix and all diagnostics passed');
    await page.locator('[data-testid="create-action-form"] button[type="submit"]').click();

    // Verify action appeared
    await expect(page.locator('tr.action-row', { hasText: uniqueDesc })).toBeVisible();

    // 8. Gate banner must now disappear and Resolve button must become enabled
    await expect(gateBanner).toBeHidden();
    await expect(resolveBtn).toHaveAttribute('aria-disabled', 'false');

    // 9. Staff clicks Resolve
    await resolveBtn.click();

    // Verify ticket status transitioned to Resolved
    await expect(statusBadge).toContainText('Resolved');

    await logoutUser(page);
  });

  // =========================================================================
  // E2E-RES-02: Requester Advisory Signal and Staff Banner Feedback
  // =========================================================================
  test('E2E-RES-02: Requester advisory signal shows staff banner and scrolls to actions', async ({ page, request }) => {
    // 1. Create a fresh ticket via Requester API
    await request.post('http://localhost:3000/api/auth/login', {
      data: { email: REQUESTER_EMAIL, password: PASSWORD },
    });

    const createRes = await request.post('http://localhost:3000/api/tickets', {
      data: {
        categoryId: 1,
        relatedSystemId: 1,
        summary: `Requester Advisory Test Ticket ${Date.now()}`,
        description: 'Issue to test advisory feedback workflow',
        requestedPriority: 'MEDIUM',
      },
    });
    expect(createRes.ok()).toBeTruthy();
    const createdTicket = await createRes.json();
    const ticketId = createdTicket.id;

    // Transition ticket to Open via Staff API so Requester can signal resolved
    await request.post('http://localhost:3000/api/auth/login', {
      data: { email: STAFF_EMAIL, password: PASSWORD },
    });
    const patchRes = await request.patch(`http://localhost:3000/api/staff/tickets/${ticketId}`, {
      data: { status: 'Open', expectedVersion: createdTicket.version || 1 },
    });
    expect(patchRes.ok()).toBeTruthy();

    // 2. Requester logs in
    await loginUser(page, REQUESTER_EMAIL);

    // 3. Requester opens their Open ticket
    await page.goto(`/tickets/${ticketId}`);
    await expect(page.locator('text=Ticket Details').first()).toBeVisible();

    // 4. Problem Appears Resolved button is visible
    const advisoryBtn = page.getByRole('button', { name: /Problem Appears Resolved/i });
    await expect(advisoryBtn).toBeVisible();
    await advisoryBtn.click();

    // Modal confirmation
    const modal = page.getByRole('dialog', { name: /Confirm Resolution Signal/i });
    await expect(modal).toBeVisible();
    await modal.getByRole('button', { name: 'Confirm' }).click();

    // Badge confirms report
    await expect(page.locator('text=You reported this problem appears resolved')).toBeVisible();

    // 5. Logout Requester
    await logoutUser(page);

    // 6. Staff logs in
    await loginUser(page, STAFF_EMAIL);

    // 7. Staff views the ticket
    await page.goto(`/tickets/${ticketId}`);
    await expect(page.locator('text=Ticket Details').first()).toBeVisible();

    // Staff sees advisory banner
    const staffBanner = page.locator('#requester-advisory-banner');
    await expect(staffBanner).toBeVisible();
    await expect(staffBanner).toContainText('Requester marked issue as resolved');

    // Click button to scroll to actions taken
    const reviewBtn = staffBanner.getByRole('button', { name: 'Review Actions Taken' });
    await expect(reviewBtn).toBeVisible();
    await reviewBtn.click();

    // Actions taken section is in viewport
    const actionsSection = page.getByTestId('actions-taken-section');
    await expect(actionsSection).toBeVisible();

    // 8. Staff satisfies gate and transitions to Resolved
    await page.getByRole('button', { name: /Claim Ticket/i }).click();
    await page.getByRole('button', { name: /\+ log action taken/i }).click();
    await page.fill('#create-description', 'Verified advisory resolution');
    await page.fill('#create-result', 'Issue confirmed fixed by requester');
    await page.locator('[data-testid="create-action-form"] button[type="submit"]').click();

    const resolveBtn = page.locator('#resolve-action-btn');
    await expect(resolveBtn).toHaveAttribute('aria-disabled', 'false');
    await resolveBtn.click();

    await expect(page.getByTestId('status-badge')).toContainText('Resolved');
    await expect(staffBanner).toBeHidden();

    await logoutUser(page);
  });

  // =========================================================================
  // E2E-RES-03: Optimistic Concurrency 409 Conflict Dialog & Reload
  // =========================================================================
  test('E2E-RES-03: Stale version conflict 409 displays accessible dialog with reload', async ({ page, request }) => {
    // 1. Staff logs in
    await loginUser(page, STAFF_EMAIL);

    // 2. Open Ticket 2
    await page.goto('/tickets/2');
    await expect(page.locator('text=Ticket Details').first()).toBeVisible();

    // 3. Simulate concurrent background update via direct API call with admin session
    await request.post('http://localhost:3000/api/auth/login', {
      data: { email: ADMIN_EMAIL, password: PASSWORD },
    });

    const getRes = await request.get('http://localhost:3000/api/staff/tickets/2');
    expect(getRes.ok()).toBeTruthy();
    const currentTicket = await getRes.json();

    const patchRes = await request.patch('http://localhost:3000/api/staff/tickets/2', {
      data: {
        itPriority: currentTicket.itPriority === 'HIGH' ? 'MEDIUM' : 'HIGH',
        expectedVersion: currentTicket.version,
      },
    });
    expect(patchRes.ok()).toBeTruthy();

    // 4. In browser page (which still holds old version), staff tries to change priority
    await page.selectOption('#itPrioritySelect', { value: 'LOW' });

    // 5. 409 Conflict Dialog must appear
    const conflictDialog = page.getByRole('alertdialog', { name: /Conflict Detected/i });
    await expect(conflictDialog).toBeVisible();
    await expect(conflictDialog).toContainText('This ticket has been modified by another user');

    // 6. Click Reload Ticket
    const reloadBtn = conflictDialog.getByRole('button', { name: 'Reload Ticket' });
    await reloadBtn.click();

    // Dialog closes and ticket updates
    await expect(conflictDialog).toBeHidden();

    await logoutUser(page);
  });

  // =========================================================================
  // E2E-RES-04: Terminal State Locking & Reopen Transition
  // =========================================================================
  test('E2E-RES-04: Terminal ticket locks staff controls, Reopen enables them', async ({ page }) => {
    // 1. Staff logs in
    await loginUser(page, STAFF_EMAIL);

    // 2. Open Ticket 3 (seeded as Closed)
    await page.goto('/tickets/3');
    await expect(page.locator('text=Ticket Details').first()).toBeVisible();

    // Status badge is Closed
    await expect(page.getByTestId('status-badge')).toContainText('Closed');

    // 3. Verify staff controls are locked
    await expect(page.locator('#ownerSelect')).toBeDisabled();
    await expect(page.locator('#itPrioritySelect')).toBeDisabled();

    // Dedicated action button has Reopen
    const reopenBtn = page.getByRole('button', { name: /^Reopen$/i });
    await expect(reopenBtn).toBeVisible();

    // 4. Click Reopen
    await reopenBtn.click();

    // Status changes to Reopened or InProgress
    await expect(page.getByTestId('status-badge')).toContainText(/Reopened|In Progress/i);

    // 5. Controls are unlocked
    await expect(page.locator('#ownerSelect')).toBeEnabled();
    await expect(page.locator('#itPrioritySelect')).toBeEnabled();

    await logoutUser(page);
  });
});
