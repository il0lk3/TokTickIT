import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  
  await page.goto('http://localhost:3000/');
  await page.fill('input[type="email"]', 'e2e.staff@example.com');
  await page.fill('input[type="password"]', 'Password123!');
  await page.click('button[type="submit"]');
  
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'screenshot.png' });
  await browser.close();
})();
