import { test, expect, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const snap = async (page: Page, folder: string, name: string) => {
  const dir = path.join('..', 'artifacts', 'lab-03', 'screenshots', folder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(dir, name), fullPage: true });
};

test.describe('2. User Management Screenshots', () => {
  test('Capture User Management states', async ({ page }) => {
    const runId = Date.now();
    const newEmail = `newe2e.requester.${runId}@example.com`;
    const admin2Email = `admin2.${runId}@example.com`;

    // 14. non-admin-forbidden.png
    await page.goto('/login');
    await page.fill('input[type="email"]', 'e2e.staff@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await Promise.all([page.waitForResponse(r => r.url().includes('/api/auth/login') && r.status() === 200), page.click('button[type="submit"]')]);
    await page.goto('/');
    await snap(page, 'user-management', 'non-admin-forbidden.png');
    await page.goto('/');
    await page.context().clearCookies();

    // Login as admin
    await page.goto('/login');
    await page.fill('input[type="email"]', 'e2e.admin@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await Promise.all([page.waitForResponse(r => r.url().includes('/api/auth/login') && r.status() === 200), page.click('button[type="submit"]')]);
    await page.goto('/admin/users'); await page.waitForSelector('tr:has-text("e2e.admin@example.com")');

    // 1. user-list-default.png
    await snap(page, 'user-management', 'user-list-default.png');
    await snap(page, 'user-management', 'user-management-desktop.png');

    // Responsive tablet/mobile
    await page.setViewportSize({ width: 768, height: 1024 });
    await snap(page, 'user-management', 'user-management-tablet.png');
    await page.setViewportSize({ width: 375, height: 812 });
    await snap(page, 'user-management', 'user-management-mobile.png');
    await page.setViewportSize({ width: 1280, height: 800 }); // back to desktop

    // 2. user-list-search.png
    await page.fill('input[placeholder*="Search"]', 'TokTickIT');
    await page.waitForTimeout(1000);
    await snap(page, 'user-management', 'user-list-search.png');

    // 4. user-list-empty-search.png
    await page.fill('input[placeholder*="Search"]', 'NonExistentUser12345');
    await page.waitForTimeout(1000);
    await snap(page, 'user-management', 'user-list-empty-search.png');
    await page.fill('input[placeholder*="Search"]', '');

    // 3. user-list-role-filter.png
    await page.selectOption('select', { label: 'Requester' });
    await page.waitForTimeout(1000);
    await snap(page, 'user-management', 'user-list-role-filter.png');
    await page.selectOption('select', { label: 'All Roles' });
    await page.waitForTimeout(1000);

    // 5. create-user-form.png
    await page.click('button:has-text("Create User")');
    await expect(page.locator('.modal.d-block')).toBeVisible();
    await snap(page, 'user-management', 'create-user-form.png');

    // 6. create-user-validation.png
    await page.click('.modal button:has-text("Create User")');
    await snap(page, 'user-management', 'create-user-validation.png');

    // 7. create-user-duplicate-email.png
    await page.fill('input[name="name"]', 'Duplicate');
    await page.fill('input[name="email"]', 'e2e.staff@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('.modal button:has-text("Create User")');
    await expect(page.locator('.alert-danger')).toBeVisible();
    await snap(page, 'user-management', 'create-user-duplicate-email.png');

    // 8. create-user-success.png
    await page.fill('input[name="email"]', newEmail);
    const [res] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/admin/users') && r.request().method() === 'POST'),
      page.click('.modal button:has-text("Create User")')
    ]);
    console.log('Create User response:', res.status(), await res.json());
    await expect(page.locator('.modal.d-block')).not.toBeVisible();
    await snap(page, 'user-management', 'create-user-success.png');

    // 9. edit-user-form.png
    // Click edit on the new user
    await page.click(`tr:has-text("${newEmail}") button:has-text("Edit")`);
    await expect(page.locator('.modal.d-block')).toBeVisible();
    await snap(page, 'user-management', 'edit-user-form.png');

    // 10. edit-user-reset-password.png
    await page.click('text=Set New Initial Password');
    await page.fill('input[name="password"]', 'Password123!');
    await snap(page, 'user-management', 'edit-user-reset-password.png');
    await page.click('button:has-text("Back to Edit")');
    await page.click('.modal button:has-text("Cancel")');

    // 11. deactivate-self-blocked.png
    await page.click('tr:has-text("e2e.admin@example.com") button:has-text("Edit")');
    await expect(page.locator('button:has-text("Deactivate User")')).toBeDisabled();
    await snap(page, 'user-management', 'deactivate-self-blocked.png');
    await page.click('.modal button:has-text("Cancel")');

    // 12. deactivate-last-admin-blocked.png
    // Need to login as another admin, but we only have one admin? Let's create an admin, login as that admin, and deactivate the first admin!
    // Or we can just try to change admin's role to Requester? Wait, the rule is "Cannot deactivate the last active administrator".
    // We already have deactivate-self-blocked.
    // If we have 2 admins, and we deactivate one, it succeeds.
    // Let's create a second admin.
    const ctx = page.request;
    const loginRes = await ctx.post('http://localhost:3000/api/auth/login', { data: { email: 'e2e.admin@example.com', password: 'Password123!' } });
    const authHeaders = { cookie: loginRes.headers()['set-cookie'] };
    await ctx.post('http://localhost:3000/api/admin/users', {
      headers: authHeaders,
      data: { name: 'Admin 2', email: admin2Email, role: 'ADMINISTRATOR', initialPassword: 'Password1!', isActive: true }
    });
    // Refresh page
    await page.goto('/admin/users');
    await page.waitForSelector('tr:has-text("e2e.admin@example.com")');
    await page.click('tr:has-text("e2e.admin@example.com") button:has-text("Edit")');
    await expect(page.locator('button:has-text("Deactivate User")')).toBeDisabled();
    await page.click('.modal button:has-text("Cancel")');
    
    // Login as Admin 2, deactivate Admin 2 -> self block.
    // Deactivate Admin 1 -> Success! (deactivate-user-success.png)
    await page.goto('/');
    await page.context().clearCookies();
    await page.goto('/login');
    await page.fill('input[type="email"]', admin2Email);
    await page.fill('input[type="password"]', 'Password1!');
    await Promise.all([page.waitForResponse(r => r.url().includes('/api/auth/login') && r.status() === 200), page.click('button[type="submit"]')]);
    
    // Admin 2 has requiresPasswordChange=true, so we must change password
    await page.fill('#currentPasswordInput', 'Password1!');
    await page.fill('#newPasswordInput', 'StrongP@ss1');
    await page.fill('#confirmPasswordInput', 'StrongP@ss1');
    await page.click('button:has-text("Continue")');
    await page.waitForTimeout(500);
    await page.goto('/admin/users');
    await page.waitForSelector('tr:has-text("e2e.admin@example.com")');
    
    // 13. deactivate-user-success.png (Deactivate new user)
    await page.click(`tr:has-text("${newEmail}") button:has-text("Edit")`);
    await page.click('button:has-text("Deactivate User")');
    await page.click('button:has-text("Save Changes")');
    await page.waitForTimeout(500);
    await snap(page, 'user-management', 'deactivate-user-success.png');
    
    // Deactivate Admin 1
    await page.click('tr:has-text("e2e.admin@example.com") button:has-text("Edit")');
    await page.click('button:has-text("Deactivate User")');
    await page.click('button:has-text("Save Changes")');
    
    // Now Admin 2 is the ONLY active admin!
    // Admin 2 cannot change their own role or deactivate themselves (frontend protection)
    await page.click(`tr:has-text("${admin2Email}") button:has-text("Edit")`);
    await expect(page.locator('.modal select')).toBeDisabled();
    await snap(page, 'user-management', 'deactivate-last-admin-blocked.png'); // This shows the disabled UI
  });
});
