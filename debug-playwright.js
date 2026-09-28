const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="email"]', 'e2e.admin@example.com');
  await page.fill('input[type="password"]', 'Password123!');
  await page.click('button[type="submit"]');
  await page.waitForResponse(r => r.url().includes('/api/auth/login') && r.status() === 200);
  await page.goto('http://localhost:5173/admin/users');
  await page.waitForResponse(r => r.url().includes('/api/admin/users') && r.status() === 200);
  
  await page.click('button:has-text("Create User")');
  await page.fill('input[name="name"]', 'Duplicate');
  await page.fill('input[name="email"]', 'e2e.staff@example.com');
  await page.fill('input[name="password"]', 'Password123!');
  await page.click('.modal button:has-text("Create User")');
  await page.waitForSelector('.alert-danger');
  
  await page.fill('input[name="email"]', 'newe2e.requester@example.com');
  await Promise.all([
    page.waitForResponse(r => r.url().includes('/api/admin/users') && r.request().method() === 'POST'),
    page.click('.modal button:has-text("Create User")')
  ]);
  
  await page.waitForTimeout(1000);
  const count = await page.locator('.modal-content').count();
  console.log('Modal count:', count);
  
  const html = await page.content();
  const fs = require('fs');
  fs.writeFileSync('page-dump.html', html);
  
  await browser.close();
})();
