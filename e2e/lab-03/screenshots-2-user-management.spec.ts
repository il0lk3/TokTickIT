import { test, expect, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const snap = async (page: Page, folder: string, name: string) => {
  const dir = path.join('artifacts', 'lab-03', 'screenshots', folder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(dir, name), fullPage: true });
};

test.describe('2. User Management Screenshots', () => {
  test('Capture User Management states', async ({ page }) => {
    // 14. non-admin-forbidden.png
    await page.goto('/login');
    await page.fill('input[type="email"]', 'e2e.staff@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.goto('/admin/users');
    await snap(page, 'user-management', 'non-admin-forbidden.png');
    if (await page.isVisible('.navbar-toggler')) { await page.click('.navbar-toggler'); await page.waitForTimeout(500); }
    await page.click('button:has-text("Logout")', { force: true });

    // Login as admin
    await page.goto('/login');
    await page.fill('input[type="email"]', 'e2e.admin@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');

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
    await expect(page.locator('.modal-content')).toBeVisible();
    await snap(page, 'user-management', 'create-user-form.png');

    // 6. create-user-validation.png
    await page.click('button:has-text("Save User")');
    await snap(page, 'user-management', 'create-user-validation.png');

    // 7. create-user-duplicate-email.png
    await page.fill('input[name="name"]', 'Duplicate');
    await page.fill('input[name="email"]', 'e2e.staff@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button:has-text("Save User")');
    await expect(page.locator('.alert-danger')).toBeVisible();
    await snap(page, 'user-management', 'create-user-duplicate-email.png');

    // 8. create-user-success.png
    await page.fill('input[name="email"]', 'newe2e.requester@example.com');
    await page.click('button:has-text("Save User")');
    await expect(page.locator('.modal-content')).not.toBeVisible();
    await snap(page, 'user-management', 'create-user-success.png');

    // 9. edit-user-form.png
    // Click edit on newe2e.requester@example.com
    await page.click('tr:has-text("newe2e.requester@example.com") button:has-text("Edit")');
    await expect(page.locator('.modal-content')).toBeVisible();
    await snap(page, 'user-management', 'edit-user-form.png');

    // 10. edit-user-reset-password.png
    await page.click('text=Set initial password');
    await page.fill('input[name="password"]', 'Password123!');
    await snap(page, 'user-management', 'edit-user-reset-password.png');
    await page.click('button:has-text("Cancel")');

    // 11. deactivate-self-blocked.png
    await page.click('tr:has-text("e2e.admin@example.com") button:has-text("Edit")');
    await page.click('button:has-text("Deactivate User")');
    await expect(page.locator('.alert-danger')).toBeVisible();
    await snap(page, 'user-management', 'deactivate-self-blocked.png');
    await page.click('button:has-text("Cancel")');

    // 12. deactivate-last-admin-blocked.png
    // Need to login as another admin, but we only have one admin? Let's create an admin, login as that admin, and deactivate the first admin!
    // Or we can just try to change admin's role to Requester? Wait, the rule is "Cannot deactivate the last active administrator".
    // We already have deactivate-self-blocked.
    // If we have 2 admins, and we deactivate one, it succeeds.
    // Let's create a second admin.
    const ctx = page.request;
    const loginRes = await ctx.post('/api/auth/login', { data: { email: 'e2e.admin@example.com', password: 'Password123!' } });
    const authHeaders = { cookie: loginRes.headers()['set-cookie'] };
    await ctx.post('/api/admin/users', {
      headers: authHeaders,
      data: { name: 'Admin 2', email: 'admin2@example.com', role: 'Administrator', password: 'Password1!', isActive: true }
    });
    // Refresh page
    await page.goto('/admin/users');
    await page.click('tr:has-text("e2e.admin@example.com") button:has-text("Edit")');
    await page.click('button:has-text("Deactivate User")'); // Admin 1 deactivated by Admin 1? No, self deactivate blocks.
    await page.click('button:has-text("Cancel")');
    
    // Login as Admin 2, deactivate Admin 2 -> self block.
    // Deactivate Admin 1 -> Success! (deactivate-user-success.png)
    if (await page.isVisible('.navbar-toggler')) { await page.click('.navbar-toggler'); await page.waitForTimeout(500); }
    await page.click('button:has-text("Logout")', { force: true });
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin2@example.com');
    await page.fill('input[type="password"]', 'Password1!');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.goto('/admin/users');
    
    // 13. deactivate-user-success.png (Deactivate newe2e.requester@example.com)
    await page.click('tr:has-text("newe2e.requester@example.com") button:has-text("Edit")');
    await page.click('button:has-text("Deactivate User")');
    await page.click('button:has-text("Save User")');
    await page.waitForTimeout(500);
    await snap(page, 'user-management', 'deactivate-user-success.png');
    
    // Deactivate Admin 1
    await page.click('tr:has-text("e2e.admin@example.com") button:has-text("Edit")');
    await page.click('button:has-text("Deactivate User")');
    await page.click('button:has-text("Save User")');
    
    // Now Admin 2 is the ONLY active admin!
    // If Admin 2 tries to change role of Admin 2 -> last admin block!
    await page.click('tr:has-text("admin2@example.com") button:has-text("Edit")');
    await page.selectOption('select[name="role"]', 'Requester');
    await page.click('button:has-text("Save User")');
    await expect(page.locator('.alert-danger')).toBeVisible();
    await snap(page, 'user-management', 'deactivate-last-admin-blocked.png'); // This is last admin role change block
  });
});
