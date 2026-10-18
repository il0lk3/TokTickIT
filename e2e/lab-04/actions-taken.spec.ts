import { test, expect } from '@playwright/test';

test.describe('Lab 4 Issue 6: Actions Taken UI on Ticket Detail (E2E-ACT)', () => {
  test.skip(({ browserName, isMobile }) => browserName !== 'chromium' || !!isMobile, 'Actions Taken E2E runs once on Chromium desktop');

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

  test('E2E-ACT-01: Cross-Role Action Lifecycle - Staff logs action, Requester views read-only', async ({ page }) => {
    // 1. Staff logs in
    await loginUser(page, STAFF_EMAIL);

    // 2. Navigate to Ticket 2 (owned by e2e.requester)
    await page.goto('/tickets/2');
    await expect(page.getByTestId('actions-taken-section')).toBeVisible();

    // 3. Open Log Action form
    const logBtn = page.getByRole('button', { name: /\+ log action taken/i });
    await expect(logBtn).toBeVisible();
    await logBtn.click();

    // 4. Fill form with unique timestamped description
    const uniqueDesc = `E2E Diagnostic Action ${Date.now()}`;
    await page.fill('#create-description', uniqueDesc);
    await page.fill('#create-result', 'Verified exchange endpoint and TLS certificate');

    // Tick Follow-Up
    await page.click('#create-follow-up-check');
    const noteInput = page.locator('#create-follow-up-note');
    await expect(noteInput).toBeVisible();
    await noteInput.fill('Recheck sync logs in 24 hours');

    await page.fill('#create-attachment-notes', 'outlook_trace.log');

    // 5. Submit action
    await page.click('button:has-text("Log Action")');

    // 6. Verify action appears in table
    const actionRow = page.locator('tr.action-row', { hasText: uniqueDesc });
    await expect(actionRow).toBeVisible();
    await expect(actionRow).toContainText('E2E Staff');
    await expect(actionRow).toContainText('Yes');
    await expect(actionRow).toContainText('Recheck sync logs in 24 hours');

    // 7. Logout
    await logoutUser(page);

    // 8. Requester logs in
    await loginUser(page, REQUESTER_EMAIL);

    // 9. Requester navigates to Ticket 2
    await page.goto('/tickets/2');
    await expect(page.getByTestId('actions-taken-section')).toBeVisible();

    // Verify action row is visible
    const reqActionRow = page.locator('tr.action-row', { hasText: uniqueDesc });
    await expect(reqActionRow).toBeVisible();
    await expect(reqActionRow).toContainText('E2E Staff');

    // Verify that neither + Log Action Taken nor Edit buttons exist
    await expect(page.getByRole('button', { name: /\+ log action taken/i })).toBeHidden();
    await expect(reqActionRow.getByRole('button', { name: /edit/i })).toBeHidden();

    await logoutUser(page);
  });

  test('E2E-ACT-02: Inline Action Editing - Staff updates action outcome', async ({ page }) => {
    // 1. Staff logs in
    await loginUser(page, STAFF_EMAIL);

    await page.goto('/tickets/2');
    await expect(page.getByTestId('actions-taken-section')).toBeVisible();

    // 2. Click Edit on the latest action row
    const editBtn = page.locator('tr.action-row button:has-text("Edit")').first();
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    // 3. Edit Result
    const updatedResult = `Updated result check at ${Date.now()}`;
    const resultTextarea = page.locator('tr.action-edit-row textarea[id^="edit-result-"]');
    await expect(resultTextarea).toBeVisible();
    await resultTextarea.fill(updatedResult);

    // 4. Save Changes
    await page.click('button:has-text("Save Changes")');

    // 5. Verify updated text in table
    await expect(page.locator('tr.action-row', { hasText: updatedResult })).toBeVisible();

    await logoutUser(page);
  });

  test('E2E-ACT-03: Client Validation - Ticking follow-up without note blocks submission', async ({ page }) => {
    await loginUser(page, STAFF_EMAIL);

    await page.goto('/tickets/2');
    await expect(page.getByTestId('actions-taken-section')).toBeVisible();
    await page.click('button:has-text("+ Log Action Taken")');

    await page.fill('#create-description', 'Testing validation');
    await page.fill('#create-result', 'Result test');
    await page.click('#create-follow-up-check');

    // Leave note empty and attempt submit
    await page.click('button:has-text("Log Action")');

    // Expect validation message
    await expect(page.locator('text=Follow-up note is required when follow-up is requested')).toBeVisible();
    await expect(page.locator('#create-follow-up-note')).toBeFocused();

    await logoutUser(page);
  });

  test('E2E-ACT-04: Terminal State Locking - Closed ticket hides create and edit controls', async ({ page }) => {
    await loginUser(page, STAFF_EMAIL);

    // Ticket 3 is seeded as Closed
    await page.goto('/tickets/3');
    await expect(page.getByTestId('actions-taken-section')).toBeVisible();

    // Verify locked badge
    await expect(page.locator('text=Ticket is Closed (Actions locked)')).toBeVisible();

    // Verify + Log Action Taken and Edit buttons are absent
    await expect(page.getByRole('button', { name: /\+ log action taken/i })).toBeHidden();
    await expect(page.locator('tr.action-row button:has-text("Edit")')).toBeHidden();

    await logoutUser(page);
  });

  test('E2E-ACT-05: Administrator Operational Parity - Admin records an action', async ({ page }) => {
    await loginUser(page, ADMIN_EMAIL);

    await page.goto('/tickets/2');
    await expect(page.getByTestId('actions-taken-section')).toBeVisible();

    await page.click('button:has-text("+ Log Action Taken")');

    const adminDesc = `Admin Diagnostic Check ${Date.now()}`;
    await page.fill('#create-description', adminDesc);
    await page.fill('#create-result', 'Server configuration confirmed compliant');
    await page.click('button:has-text("Log Action")');

    const actionRow = page.locator('tr.action-row', { hasText: adminDesc });
    await expect(actionRow).toBeVisible();
    await expect(actionRow).toContainText('E2E Admin');

    await logoutUser(page);
  });

  test('E2E-ACT-06: Responsive Verification & Evidence Screenshots (AC-12)', async ({ page }) => {
    await loginUser(page, STAFF_EMAIL);

    await page.goto('/tickets/2');
    await expect(page.getByTestId('actions-taken-section')).toBeVisible();

    // 1. Desktop Viewport (1280px)
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.screenshot({ path: '/Users/karn/Downloads/toktickit/artifacts/lab-04/screenshots/actions-taken/actions-taken-desktop-table.png', fullPage: true });

    // 2. Tablet Viewport (768px)
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.screenshot({ path: '/Users/karn/Downloads/toktickit/artifacts/lab-04/screenshots/actions-taken/actions-taken-tablet.png', fullPage: true });

    // 3. Mobile Viewport (375px)
    await page.setViewportSize({ width: 375, height: 812 });
    await page.screenshot({ path: '/Users/karn/Downloads/toktickit/artifacts/lab-04/screenshots/actions-taken/actions-taken-mobile-cards.png', fullPage: true });

    // Verify 0 horizontal scrolling at 375px
    const isOverflowing = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(isOverflowing).toBe(false);

    // 4. Create Form & Validation Error Screenshots
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.click('button:has-text("+ Log Action Taken")');
    await page.screenshot({ path: '/Users/karn/Downloads/toktickit/artifacts/lab-04/screenshots/actions-taken/actions-taken-create-form.png' });

    // Trigger validation error
    await page.click('button:has-text("Log Action")');
    await page.screenshot({ path: '/Users/karn/Downloads/toktickit/artifacts/lab-04/screenshots/actions-taken/actions-taken-validation-error.png' });

    // 5. Terminal Locked Screenshot on Ticket 3
    await page.goto('/tickets/3');
    await expect(page.getByTestId('actions-taken-section')).toBeVisible();
    await page.screenshot({ path: '/Users/karn/Downloads/toktickit/artifacts/lab-04/screenshots/actions-taken/actions-taken-terminal-locked.png' });

    // 6. Requester Read-Only Screenshot
    await logoutUser(page);
    await loginUser(page, REQUESTER_EMAIL);
    await page.goto('/tickets/2');
    await expect(page.getByTestId('actions-taken-section')).toBeVisible();
    await page.screenshot({ path: '/Users/karn/Downloads/toktickit/artifacts/lab-04/screenshots/actions-taken/actions-taken-requester-readonly.png' });
  });
});
