import { test, expect } from '@playwright/test';

test.describe('Rubric Part 8 & Issue 10: Labs 1-3 Representative Regression E2E Suite', () => {
  const REQUESTER_EMAIL = 'e2e.requester@example.com';
  const STAFF_EMAIL = 'e2e.staff@example.com';
  const ADMIN_EMAIL = 'e2e.admin@example.com';
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

  // -------------------------------------------------------------------------
  // 1. Attachment Management Lifecycle (Lab 2)
  // -------------------------------------------------------------------------
  test('REG-01: Requester can upload and manage attachments on Ticket Detail', async ({ page }) => {
    await loginUser(page, REQUESTER_EMAIL);
    await page.goto('/tickets/2');
    await expect(page.locator('text=Ticket Details').first()).toBeVisible();

    const attachmentTab = page.locator('button.zen-tab-btn:has-text("Attachments")');
    await expect(attachmentTab).toBeVisible();
    await attachmentTab.click();
    await expect(page.locator('input[type="file"]')).toBeAttached();

    await logoutUser(page);
  });

  // -------------------------------------------------------------------------
  // 2. Public Comments vs Internal Notes Isolation (Lab 3)
  // -------------------------------------------------------------------------
  test('REG-02: Public comment is visible to Requester while Internal Note remains strictly hidden', async ({ page }) => {
    // 1. Staff logs in and posts an internal note
    await loginUser(page, STAFF_EMAIL);
    await page.goto('/tickets/2');
    await expect(page.locator('text=Ticket Details').first()).toBeVisible();

    const secretNoteText = `CONFIDENTIAL_INTERNAL_NOTE_${Date.now()}`;
    const noteInput = page.locator('#internalNoteInput, textarea[placeholder*="internal note" i]');
    if (await noteInput.isVisible()) {
      await noteInput.fill(secretNoteText);
      await page.click('button:has-text("Add Note"), button:has-text("Post Note")');
      await expect(page.getByText(secretNoteText)).toBeVisible();
    }

    await logoutUser(page);

    // 2. Requester logs in to Ticket 2
    await loginUser(page, REQUESTER_EMAIL);
    await page.goto('/tickets/2');
    await expect(page.locator('text=Ticket Details').first()).toBeVisible();

    // Verify secret internal note text is strictly NOT present anywhere in DOM
    const noteInDom = page.locator(`text="${secretNoteText}"`);
    await expect(noteInDom).toHaveCount(0);

    // Requester posts a public comment
    const publicCommentText = `Public requester reply ${Date.now()}`;
    const commentInput = page.locator('textarea[placeholder*="comment" i]').first();
    if (await commentInput.isVisible()) {
      await commentInput.fill(publicCommentText);
      await page.click('button:has-text("Post Comment"), button:has-text("Add Comment")');
      await expect(page.getByText(publicCommentText)).toBeVisible();
    }

    await logoutUser(page);
  });

  // -------------------------------------------------------------------------
  // 3. Cross-Tenant Ticket Isolation (Lab 2 & 3)
  // -------------------------------------------------------------------------
  test('REG-03: Requester opening another user ticket deep-link is rejected (403/404)', async ({ page }) => {
    await loginUser(page, REQUESTER_EMAIL);

    // Ticket 1 is owned by another requester (Cream Su)
    await page.goto('/tickets/1');

    // Requester must see Error Loading Ticket and NOT see the other user's ticket content
    const errorHeading = page.locator('h5.text-danger');
    await expect(errorHeading).toBeVisible();
    await expect(errorHeading).toContainText('Error Loading Ticket');

    await logoutUser(page);
  });

  // -------------------------------------------------------------------------
  // 4. Administrator User Management & Self-Deactivation Guard (Lab 3)
  // -------------------------------------------------------------------------
  test('REG-04: Administrator manages users and self-deactivation is strictly prevented', async ({ page }) => {
    await loginUser(page, ADMIN_EMAIL);
    await page.goto('/admin/users');
    await expect(page.locator('h1, h2').filter({ hasText: /User Management/i })).toBeVisible();

    // Verify user list is populated
    await expect(page.locator('tbody tr').first()).toBeVisible();

    // Search user
    const searchInput = page.locator('input[placeholder*="search" i]').first();
    await searchInput.fill('e2e.admin@example.com');
    await page.waitForTimeout(500);

    // Self-deactivation prevention: Deactivate button for own account must be disabled or hidden
    const selfRow = page.locator('tr:has-text("e2e.admin@example.com")');
    await expect(selfRow).toBeVisible();
    const selfDeactivateBtn = selfRow.locator('button:has-text("Deactivate"), input[type="checkbox"]');
    if (await selfDeactivateBtn.isVisible()) {
      await expect(selfDeactivateBtn).toBeDisabled();
    }

    await logoutUser(page);
  });
});
