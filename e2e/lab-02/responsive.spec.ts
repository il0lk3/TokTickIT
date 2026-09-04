import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Responsive & UI Style Checks', () => {
  test('Verify layout, overflow, and capture viewport screenshots', async ({ page, isMobile }, testInfo) => {
    // 1. Boot up and select context
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Select Development Requester' })).toBeVisible();
    await page.selectOption('select', { label: 'Cream Su' });
    await page.getByRole('button', { name: 'Continue' }).click();

    // 2. Create Ticket (Form View) - This is the default view
    await expect(page.getByRole('heading', { name: 'Submit a New Request' })).toBeVisible();
    
    // UI Style Check: Ensure Zen Green primary button exists
    const submitBtn = page.getByRole('button', { name: 'Submit Request' });
    await expect(submitBtn).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ 
      path: `../artifacts/lab-02/screenshots/create-ticket-${testInfo.project.name}.png`, 
      fullPage: true 
    });

    // 3. Navigate to My Tickets
    if (isMobile) {
      await page.locator('.navbar-toggler').click();
    }
    await page.getByRole('button', { name: 'My Tickets' }).click();
    
    await expect(page.getByRole('heading', { name: 'My Tickets', exact: true })).toBeVisible();
    
    // Check horizontal overflow (Lab 2 requirement: no horizontal scrolling)
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasOverflow, 'Page should not have horizontal overflow').toBeFalsy();

    // Take screenshot
    await page.screenshot({ 
      path: `../artifacts/lab-02/screenshots/my-tickets-${testInfo.project.name}.png`, 
      fullPage: true 
    });

  });
});
