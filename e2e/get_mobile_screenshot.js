const { chromium } = require('@playwright/test');
async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 375, height: 667 } });
  const page = await context.newPage();
  await page.goto('http://localhost:5173');
  await page.waitForSelector('text=Select Development Requester');
  await page.selectOption('select', { label: 'Cream Su' });
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.waitForTimeout(2000); // just wait 2 seconds
  await page.screenshot({ path: '../artifacts/lab-02/screenshots/my-tickets/2-my-tickets-mobile.png', fullPage: true });
  await browser.close();
}
main().catch(console.error);
