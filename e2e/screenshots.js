const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

async function main() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  
  // Desktop Context
  const desktopContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await desktopContext.newPage();
  const baseUrl = 'http://localhost:5173';

  // 1. Requester Selection
  console.log('Taking Requester Selection screenshot...');
  await page.goto(baseUrl);
  await page.waitForSelector('text=Select Development Requester');
  await page.screenshot({ path: '../artifacts/lab-02/screenshots/create-ticket/1-requester-selection.png' });

  // Select User
  await page.selectOption('select', { label: 'Cream Su' });
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.waitForSelector('text=My Tickets');

  // 2. My Tickets (Desktop)
  console.log('Taking My Tickets screenshot...');
  await page.screenshot({ path: '../artifacts/lab-02/screenshots/my-tickets/1-my-tickets-desktop.png', fullPage: true });

  // 3. Create Ticket (Initial)
  console.log('Taking Create Ticket screenshot...');
  await page.getByRole('button', { name: 'Create Ticket', exact: true }).click();
  await page.waitForSelector('text=Submit Request');
  await page.screenshot({ path: '../artifacts/lab-02/screenshots/create-ticket/2-create-ticket-initial.png', fullPage: true });

  // 4. Create Ticket (Validation Failure)
  console.log('Taking Validation Failure screenshot...');
  await page.getByRole('button', { name: 'Submit Request' }).click();
  await page.waitForSelector('text=Summary is required');
  await page.screenshot({ path: '../artifacts/lab-02/screenshots/create-ticket/3-create-ticket-validation.png', fullPage: true });

  // Fill form
  await page.getByLabel('Summary *').fill('Laptop won\'t turn on');
  await page.getByLabel('Description *').fill('I tried pressing the power button but nothing happens. The battery might be dead or there is a hardware issue.');
  await page.getByLabel('Category *').selectOption({ label: 'Hardware' });
  await page.getByLabel('Related System *').selectOption({ label: 'Corporate Laptop' });
  await page.getByLabel('Priority *').selectOption('HIGH');

  // Submit
  console.log('Taking Success screenshot...');
  await page.getByRole('button', { name: 'Submit Request' }).click();
  await page.waitForSelector('text=Ticket Created Successfully!');
  await page.screenshot({ path: '../artifacts/lab-02/screenshots/create-ticket/4-create-ticket-success.png' });

  // Go to Ticket Detail
  console.log('Taking Ticket Detail screenshot...');
  const successText = await page.locator('strong.fs-3.text-dark').innerText();
  const ticketNumber = successText.trim();
  
  await page.getByRole('button', { name: 'My Tickets' }).click();
  await page.waitForSelector(`text=${ticketNumber}`);
  await page.locator(`tr:has-text("${ticketNumber}")`).click();
  await page.waitForSelector('text=Information');
  await page.screenshot({ path: '../artifacts/lab-02/screenshots/ticket-detail/1-ticket-detail-desktop.png', fullPage: true });

  // Tablet Context for Ticket Detail
  console.log('Taking Tablet Ticket Detail screenshot...');
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(500); // give UI time to reflow
  await page.screenshot({ path: '../artifacts/lab-02/screenshots/ticket-detail/2-ticket-detail-tablet.png', fullPage: true });

  // Mobile Context for My Tickets
  console.log('Taking Mobile My Tickets screenshot...');
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto(baseUrl + '/tickets');
  await page.waitForSelector('h2:has-text("My Tickets")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: '../artifacts/lab-02/screenshots/my-tickets/2-my-tickets-mobile.png', fullPage: true });

  await browser.close();
  console.log('All screenshots captured successfully!');
}

main().catch(console.error);
