import { test, expect } from '@playwright/test';

test.describe('User Administration', () => {
  // Use a unique suffix for this test run
  const uniqueSuffix = Date.now().toString();
  const testUserName = `Test User ${uniqueSuffix}`;
  const testUserEmail = `testuser${uniqueSuffix}@example.com`;

  test.beforeEach(async ({ page }) => {
    // Navigate to login
    await page.goto('/');
    
    // Login as Admin
    await page.fill('input[type="email"]', 'e2e.admin@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    // Admin lands directly on User Management
    await expect(page.getByRole('heading', { name: 'User Management' })).toBeVisible();
  });

  test('should create, search, edit, and set initial password for a user', async ({ page }) => {
    // 1. Create User
    await page.getByRole('button', { name: '+ Create User' }).click();
    await expect(page.getByText('Create New User')).toBeVisible();

    await page.locator('.modal input[type="text"]').fill(testUserName);
    await page.locator('.modal input[type="email"]').fill(testUserEmail);
    await page.locator('.modal select.form-select').selectOption('REQUESTER');
    await page.locator('.modal input[type="password"]').fill('NewPass123!');
    
    const [response] = await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/admin/users') && res.request().method() === 'POST'),
      page.getByRole('button', { name: 'Create User', exact: true }).click()
    ]);
    
    // Verify success message
    await expect(page.getByText('User created successfully')).toBeVisible();

    // 2. Search for the created user
    await page.fill('input[placeholder="Search by name or email"]', testUserName);
    await page.getByRole('button', { name: 'Search' }).click();

    // Verify user is in the table
    const row = page.locator('tr').filter({ hasText: testUserName });
    await expect(row).toBeVisible();
    await expect(row.locator('td').nth(1)).toHaveText(testUserEmail);
    await expect(row.locator('td').nth(2)).toContainText('Requester');
    await expect(row.locator('td').nth(3)).toContainText('Active');

    // 3. Edit User
    await row.getByRole('button', { name: 'Edit' }).click();
    await expect(page.getByText(`Edit User: ${testUserName}`)).toBeVisible();

    // Change role to IT_STAFF
    await page.locator('.modal select.form-select').selectOption('IT_STAFF');
    await page.getByRole('button', { name: 'Save Changes' }).click();

    // Verify success message
    await expect(page.getByText('User updated successfully')).toBeVisible();

    // Re-search to confirm role change (if needed, though React state might already update it)
    await expect(row.locator('td').nth(2)).toContainText('IT Staff');

    // 4. Set Initial Password
    await row.getByRole('button', { name: 'Edit' }).click();
    await page.getByRole('button', { name: 'Set New Initial Password...' }).click();
    await expect(page.getByText(`Set Initial Password for ${testUserName}`)).toBeVisible();

    await page.locator('.modal input[type="password"]').fill('AnotherPass123!');
    await page.getByRole('button', { name: 'Set Password' }).click();

    // Verify success message
    await expect(page.getByText(`Initial password set for ${testUserName}`)).toBeVisible();
  });

  test('should prevent self-deactivation and changing own role', async ({ page }) => {
    // Search for admin self
    await page.fill('input[placeholder="Search by name or email"]', 'e2e.admin@example.com');
    await page.getByRole('button', { name: 'Search' }).click();

    const row = page.locator('tr').filter({ hasText: 'e2e.admin@example.com' });
    await expect(row).toBeVisible();

    // Open Edit Modal for self
    await row.getByRole('button', { name: 'Edit' }).click();
    await expect(page.getByText(`Edit User: E2E Admin`)).toBeVisible();

    // Verify Role dropdown is disabled
    const roleSelect = page.locator('.modal select.form-select');
    await expect(roleSelect).toBeDisabled();
    await expect(page.getByText('You cannot change your own role.')).toBeVisible();

    // Verify Active switch is disabled
    const activeSwitch = page.locator('.modal input[type="checkbox"]');
    await expect(activeSwitch).toBeDisabled();
    await expect(page.getByText('You cannot deactivate your own account.')).toBeVisible();
  });
});
