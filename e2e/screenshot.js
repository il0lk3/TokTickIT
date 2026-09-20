const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('http://localhost:5173/');
  await page.fill('input[type="email"]', 'admin@example.com');
  await page.fill('input[type="password"]', 'TokTickIT!2024');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
  await page.goto('http://localhost:5173/admin/users');
  await page.waitForTimeout(1000);
  await page.click('text=Create User');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '../modal-debug.png' });
  await browser.close();
})();
