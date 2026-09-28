import { test, expect, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const snap = async (page: Page, folder: string, name: string) => {
  const dir = path.join('..', 'artifacts', 'lab-03', 'screenshots', folder);
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
    await snap(page, 'authentication', 'login-desktop.png');
    await page.setViewportSize({ width: 768, height: 1024 });
    await snap(page, 'authentication', 'login-tablet.png');
    await page.setViewportSize({ width: 375, height: 812 });
    await snap(page, 'authentication', 'login-mobile.png');
    await page.setViewportSize({ width: 1280, height: 800 });


    await page.fill('input[type="email"]', 'notanemail');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await snap(page, 'authentication', 'login-validation.png');

    await page.fill('input[type="email"]', 'e2e.admin@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await expect(page.locator('.alert-danger')).toBeVisible();
    await snap(page, 'authentication', 'login-invalid-credentials.png');

    await page.route('**http://localhost:3000/api/auth/login', async route => {
      await new Promise(r => setTimeout(r, 2000));
      await route.fallback();
    });
    await page.fill('input[type="password"]', 'Password123!');
    const submitPromise = page.click('button[type="submit"]');
    await snap(page, 'authentication', 'login-busy-state.png');
    await submitPromise;
    await page.unroute('**http://localhost:3000/api/auth/login');

    await page.waitForLoadState('networkidle'); await page.waitForTimeout(500);
    await snap(page, 'authentication', 'app-shell-role-admin.png');

    await page.context().clearCookies();
    await page.goto('/queue'); 
    await expect(page.locator('h5:has-text("Sign in to your account")')).toBeVisible();
    await snap(page, 'authentication', 'logout-blocked-access.png');

    await loginAs(page, 'e2e.requester@example.com', 'Password123!');
    await snap(page, 'authentication', 'app-shell-role-requester.png');
    await page.context().clearCookies();

    await loginAs(page, 'e2e.staff@example.com', 'Password123!');
    await snap(page, 'authentication', 'app-shell-role-it-staff.png');
    await page.context().clearCookies();

    const ctx = page.request;
    const loginRes = await ctx.post('http://localhost:3000/api/auth/login', { data: { email: 'e2e.admin@example.com', password: 'Password123!' } });
    const authHeaders = { cookie: loginRes.headers()['set-cookie'] };
    const tempEmail = 'changepw' + Date.now() + '@example.com';
    const createRes = await ctx.post('http://localhost:3000/api/admin/users', {
      headers: authHeaders,
      data: { name: 'Temp', email: tempEmail, role: 'REQUESTER', initialPassword: 'Password1!', isActive: true }
    });
    
    await page.context().clearCookies();
    await page.goto('/login');
    await page.fill('input[type="email"]', tempEmail);
    await page.fill('input[type="password"]', 'Password1!');
    await page.click('button[type="submit"]');
    await expect(page.locator('h4:has-text("Change Your Password")')).toBeVisible();
    
    await snap(page, 'authentication', 'change-password-form.png');

    await page.fill('input[type="password"]', 'weak');
    await snap(page, 'authentication', 'change-password-validation.png');

    await page.fill('#currentPasswordInput', 'Password1!');
    await page.fill('#newPasswordInput', 'NewPass1!');
    await page.fill('#confirmPasswordInput', 'NewPass1!');
    await page.click('button[type="submit"]');
    await expect(page.locator('.navbar')).toBeVisible();
    await snap(page, 'authentication', 'change-password-success.png');
    
    // Test inactive account
    await ctx.patch('http://localhost:3000/api/admin/users/1', { // Admin user is 1, let's create another inactive user
      headers: authHeaders,
      data: { email: 'inactive.user@example.com', name: 'Inactive', role: 'REQUESTER', initialPassword: 'Password1!', isActive: false }
    }).catch(e => {}); // Ignore error if exists
    
    await page.context().clearCookies();
    await page.goto('/login');
    await page.fill('input[type="email"]', 'inactive.user@example.com');
    await page.fill('input[type="password"]', 'Password1!');
    await page.click('button[type="submit"]');
    await expect(page.locator('.alert-danger')).toBeVisible();
    await snap(page, 'authentication', 'login-inactive-account.png');
  });
});
