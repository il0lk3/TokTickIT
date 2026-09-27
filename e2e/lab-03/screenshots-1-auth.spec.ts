import { test, expect, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const snap = async (page: Page, folder: string, name: string) => {
  const dir = path.join('artifacts', 'lab-03', 'screenshots', folder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(dir, name), fullPage: true });
};

const loginAs = async (page: Page, email: string, pass: string) => {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', pass);
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
};

test.describe('1. Authentication Screenshots', () => {
  test('Capture Auth states', async ({ page }) => {
    await page.goto('/login');
    await snap(page, 'authentication', 'login-empty.png');

    await page.fill('input[type="email"]', 'notanemail');
    await page.fill('input[type="password"]', 'TokTickIT!2024');
    await page.click('button[type="submit"]');
    await snap(page, 'authentication', 'login-validation.png');

    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await expect(page.locator('.alert-danger')).toBeVisible();
    await snap(page, 'authentication', 'login-invalid-credentials.png');

    await page.route('**/api/auth/login', async route => {
      await new Promise(r => setTimeout(r, 2000));
      await route.continue();
    });
    await page.fill('input[type="password"]', 'TokTickIT!2024');
    const submitPromise = page.click('button[type="submit"]');
    await snap(page, 'authentication', 'login-busy-state.png');
    await submitPromise;
    await page.unroute('**/api/auth/login');

    await expect(page.locator('text=Users')).toBeVisible();
    await snap(page, 'authentication', 'app-shell-role-admin.png');

    await page.click('button:has-text("Logout")');
    await page.goto('/queue'); 
    await expect(page).toHaveURL(/.*login/);
    await snap(page, 'authentication', 'logout-blocked-access.png');

    await loginAs(page, 'user@example.com', 'TokTickIT!2024');
    await snap(page, 'authentication', 'app-shell-role-requester.png');
    await page.click('button:has-text("Logout")');

    await loginAs(page, 'staff@example.com', 'TokTickIT!2024');
    await snap(page, 'authentication', 'app-shell-role-it-staff.png');
    await page.click('button:has-text("Logout")');

    const ctx = page.request;
    const loginRes = await ctx.post('/api/auth/login', { data: { email: 'admin@example.com', password: 'TokTickIT!2024' } });
    const authHeaders = { cookie: loginRes.headers()['set-cookie'] };
    const tempEmail = 'changepw@example.com';
    await ctx.post('/api/admin/users', {
      headers: authHeaders,
      data: { name: 'Temp', email: tempEmail, role: 'Requester', password: 'Password1!', isActive: true }
    });
    
    await page.goto('/login');
    await page.fill('input[type="email"]', tempEmail);
    await page.fill('input[type="password"]', 'Password1!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*change-password/);
    
    await snap(page, 'authentication', 'change-password-form.png');

    await page.fill('input[type="password"]', 'weak');
    await snap(page, 'authentication', 'change-password-validation.png');

    await page.fill('input[type="password"]', 'NewPass1!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*tickets/);
    await snap(page, 'authentication', 'change-password-success.png');
    
    // Test inactive account
    await ctx.patch('/api/admin/users/1', { // Admin user is 1, let's create another inactive user
      headers: authHeaders,
      data: { email: 'inactive@example.com', name: 'Inactive', role: 'Requester', password: 'Password1!', isActive: false }
    }).catch(e => {}); // Ignore error if exists
    
    await page.click('button:has-text("Logout")');
    await page.fill('input[type="email"]', 'inactive@example.com');
    await page.fill('input[type="password"]', 'Password1!');
    await page.click('button[type="submit"]');
    await expect(page.locator('.alert-danger')).toBeVisible();
    await snap(page, 'authentication', 'login-inactive-account.png');
  });
});
