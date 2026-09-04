const { chromium } = require('@playwright/test');
const fs = require('fs');

async function captureViewport(browser, viewportName, width, height) {
  console.log(`\n=== Starting ${viewportName} capture ===`);
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  const baseUrl = 'http://localhost:5173';
  const prefix = `../artifacts/lab-02/screenshots/create-ticket/${viewportName}`;

  console.log('1. Requester Selection');
  await page.goto(baseUrl);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `../artifacts/lab-02/screenshots/create-ticket/${viewportName}-requester-selection.png`, fullPage: true });

  console.log('Selecting user and continuing...');
  await page.selectOption('select', { label: 'Cream Su' });
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.waitForTimeout(2000);

  console.log('2. My Tickets');
  await page.screenshot({ path: `../artifacts/lab-02/screenshots/my-tickets/${viewportName}.png`, fullPage: true });

  console.log('3. Create Ticket Initial');
  await page.goto(baseUrl + '/tickets/new');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${prefix}-initial.png`, fullPage: true });

  console.log('4. Validation Failure');
  await page.getByRole('button', { name: /Submit Request/i }).click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${prefix}-validation-failure.png`, fullPage: true });

  console.log('Filling form...');
  await page.getByLabel('Summary *').fill('Laptop won\'t turn on');
  await page.getByLabel('Description *').fill('Tried everything, still dead.');
  await page.getByLabel('Category *').selectOption({ label: 'Hardware' });
  await page.getByLabel('Related System *').selectOption({ label: 'Corporate Laptop' });
  await page.getByLabel('Priority *').selectOption('HIGH');

  console.log('5. Invalid Attachment');
  fs.writeFileSync('dummy.txt', 'This is a text file');
  const fileInput = await page.locator('input[type="file"]');
  
  page.once('dialog', async dialog => {
    console.log(`Dialog caught: ${dialog.message()}`);
    await dialog.dismiss();
  });
  
  await fileInput.setInputFiles('dummy.txt');
  await page.waitForTimeout(1000); 
  // Native alerts block rendering, so we just capture the state right after dismissing
  await page.screenshot({ path: `${prefix}-invalid-attachment.png`, fullPage: true }); 

  console.log('6. Submitting State');
  await page.route('**/api/tickets', async route => {
    if (route.request().method() === 'POST') {
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${prefix}-submitting.png`, fullPage: true });
      await route.continue();
    } else {
      await route.continue();
    }
  });

  console.log('7. Success State');
  await page.getByRole('button', { name: /Submit Request/i }).click();
  await page.waitForTimeout(1500); 
  await page.screenshot({ path: `${prefix}-success.png`, fullPage: true });

  console.log('8. Ticket Detail');
  await page.goto(baseUrl + '/tickets');
  await page.waitForTimeout(2000);
  
  const firstTicket = await page.locator('tbody tr').first();
  await firstTicket.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `../artifacts/lab-02/screenshots/ticket-detail/${viewportName}.png`, fullPage: true });

  console.log('9. API Failure State');
  await page.goto(baseUrl + '/tickets/new');
  await page.waitForTimeout(2000);
  
  await page.getByLabel('Summary *').fill('Test API Failure');
  await page.getByLabel('Description *').fill('This should fail.');
  await page.getByLabel('Category *').selectOption({ label: 'Hardware' });
  await page.getByLabel('Related System *').selectOption({ label: 'Corporate Laptop' });
  await page.getByLabel('Priority *').selectOption('HIGH');

  await page.route('**/api/tickets', route => route.abort('failed'));
  await page.getByRole('button', { name: /Submit Request/i }).click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${prefix}-api-failure.png`, fullPage: true });

  await context.close();
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  await captureViewport(browser, 'desktop', 1280, 720);
  await captureViewport(browser, 'tablet', 768, 1024);
  await captureViewport(browser, 'mobile', 375, 667);
  await browser.close();
  
  if (fs.existsSync('dummy.txt')) fs.unlinkSync('dummy.txt');
  console.log('Finished capturing ALL screenshots systematically!');
}

main().catch(console.error);
