const { chromium } = require('@playwright/test');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1000);
  await page.selectOption('select', { label: 'Cream Su' });
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.waitForTimeout(2000);
  
  await page.goto('http://localhost:5173/tickets');
  await page.waitForTimeout(1500);
  
  const firstTicket = await page.locator('tbody tr').first();
  await firstTicket.click();
  await page.waitForTimeout(1500);
  
  await page.screenshot({ path: '../artifacts/lab-02/screenshots/ticket-detail-new.png', fullPage: true });
  await browser.close();
  console.log('Done capturing new UI');
}

main().catch(console.error);
