import { test, expect } from '@playwright/test';

test.describe('Issue 10 Task 1: Actions Taken Complete Lifecycle Flow (actions-taken-flow.spec.ts)', () => {
  const STAFF_EMAIL = 'e2e.staff@example.com';
  const REQUESTER_EMAIL = 'e2e.requester@example.com';
  const PASSWORD = 'Password123!';

  async function loginUser(page: any, email: string) {
    await page.goto('/login');
    await page.fill('#emailInput', email);
    await page.fill('#passwordInput', PASSWORD);
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

  test('Staff logs in -> opens ticket -> creates and edits action -> Requester sees it read-only', async ({ page }) => {
    // 1. Staff logs in
    await loginUser(page, STAFF_EMAIL);

    // 2. Open Ticket 2 (owned by e2e.requester)
    await page.goto('/tickets/2');
    await expect(page.getByTestId('actions-taken-section')).toBeVisible();

    // 3. Create Action Taken
    const uniqueActionDesc = `Lifecycle Flow Action ${Date.now()}`;
    const initialResult = `Initial diagnostic step ${Date.now()}`;
    await page.getByRole('button', { name: /\+ log action taken/i }).click();
    await page.fill('#create-description', uniqueActionDesc);
    await page.fill('#create-result', initialResult);
    await page.locator('[data-testid="create-action-form"] button[type="submit"]').click();

    // Verify created in table for this specific action
    const actionRow = page.locator(`tr.action-row:has-text("${uniqueActionDesc}")`);
    await expect(actionRow).toBeVisible();
    await expect(actionRow).toContainText(initialResult);

    // 4. Staff edits the action
    const editBtn = actionRow.locator('button:has-text("Edit")').first();
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    const updatedResult = `Updated diagnostic step ${Date.now()}`;
    const resultTextarea = page.locator('tr.action-edit-row textarea[id^="edit-result-"]');
    await expect(resultTextarea).toBeVisible();
    await resultTextarea.fill(updatedResult);
    await page.click('button:has-text("Save Changes")');

    // Verify updated result in table for this specific action
    await expect(actionRow).toContainText(updatedResult);

    // 5. Staff logs out
    await logoutUser(page);

    // 6. Requester logs in
    await loginUser(page, REQUESTER_EMAIL);

    // 7. Requester opens Ticket 2
    await page.goto('/tickets/2');
    await expect(page.getByTestId('actions-taken-section')).toBeVisible();

    // Requester sees the action content in read-only mode
    const requesterActionRow = page.locator(`tr.action-row:has-text("${uniqueActionDesc}")`);
    await expect(requesterActionRow).toBeVisible();
    await expect(requesterActionRow).toContainText(updatedResult);

    // Create and Edit buttons must NOT exist for Requester
    await expect(page.getByRole('button', { name: /\+ log action taken/i })).toBeHidden();
    await expect(requesterActionRow.locator('button:has-text("Edit")')).toBeHidden();

    await logoutUser(page);
  });
});
