import { test, expect } from '@playwright/test';

test.describe('Issue 10 Task 3: Quality & Smoke Sweep (quality-smoke.spec.ts)', () => {
  const ROLES = [
    { name: 'Requester', email: 'e2e.requester@example.com', routes: ['/dashboard', '/tickets', '/tickets/new'] },
    { name: 'IT Staff', email: 'e2e.staff@example.com', routes: ['/dashboard', '/queue', '/tickets/2'] },
    { name: 'Administrator', email: 'e2e.admin@example.com', routes: ['/dashboard', '/queue', '/admin/users'] },
  ];
  const PASSWORD = 'Password123!';

  for (const roleConfig of ROLES) {
    test(`Quality sweep for ${roleConfig.name} across registered routes`, async ({ page }) => {
      const consoleErrors: string[] = [];
      const pageErrors: string[] = [];
      const unexpectedNetworkErrors: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          const text = msg.text();
          // Ignore favicon 404, expected 401 unauthenticated probe, and WebKit access control check logs
          if (
            !text.includes('favicon.ico') &&
            !text.includes('401 (Unauthorized)') &&
            !text.includes('status of 401') &&
            !text.includes('access control checks')
          ) {
            consoleErrors.push(text);
          }
        }
      });

      page.on('pageerror', (err) => {
        // In WebKit (tablet/iPad), aborted/probe fetch requests trigger "access control checks" error
        if (!err.message.includes('access control checks')) {
          pageErrors.push(err.message);
        }
      });

      page.on('response', (res) => {
        if (res.status() >= 500) {
          unexpectedNetworkErrors.push(`${res.status()} ${res.url()}`);
        }
      });

      // 1. Login
      await page.goto('/login');
      await page.fill('#emailInput', roleConfig.email);
      await page.fill('#passwordInput', PASSWORD);
      await page.click('button:has-text("Sign In")');
      await expect(page).not.toHaveURL(/\/login/);

      // 2. Visit each registered route for this role
      for (const route of roleConfig.routes) {
        await page.goto(route);
        await page.waitForLoadState('networkidle');

        // Check for DOM anomalies
        const bodyText = await page.innerText('body');

        // Verify absence of unrendered placeholders or runtime error artifacts
        expect(bodyText).not.toContain('undefined');
        expect(bodyText).not.toContain('NaN');
        expect(bodyText).not.toContain('[object Object]');
        expect(bodyText).not.toContain('Lorem ipsum');
        expect(bodyText).not.toContain('TODO');

        // Check links on page: none should have empty href or href="#"
        const links = page.locator('a[href]');
        const linkCount = await links.count();
        for (let i = 0; i < linkCount; i++) {
          const href = await links.nth(i).getAttribute('href');
          expect(href).not.toBe('');
          expect(href).not.toBe('#');
        }
      }

      // Assert zero console and page errors
      expect(consoleErrors).toEqual([]);
      expect(pageErrors).toEqual([]);
      expect(unexpectedNetworkErrors).toEqual([]);
    });
  }
});
