import { test, expect } from '@playwright/test';

test.describe('IT Staff Ticket Queue', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Login as IT Staff
    await page.fill('input[type="email"]', 'e2e.staff@example.com'); // We will seed this if needed, or use default seed
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    // Wait for the queue to load
    await expect(page.locator('h2', { hasText: 'Ticket Queue' })).toBeVisible();
  });

  test('should display responsive layouts based on viewport size', async ({ page }) => {
    // 1. Desktop Viewport (default in Playwright config is usually desktop)
    await page.setViewportSize({ width: 1280, height: 800 });
    
    // Table should be visible
    const tableContainer = page.getByTestId('desktop-table');
    await expect(tableContainer).toBeVisible();
    
    // Mobile cards should be hidden
    const mobileCardsContainer = page.getByTestId('mobile-cards');
    await expect(mobileCardsContainer).toBeHidden();

    // 2. Mobile Viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Table should be hidden
    await expect(tableContainer).toBeHidden();
    
    // Mobile cards should be visible
    await expect(mobileCardsContainer).toBeVisible();
    
    // Mobile sorting dropdown should be visible
    const mobileSortDropdown = page.locator('select.form-select-sm');
    await expect(mobileSortDropdown).toBeVisible();
  });
  
  test('should filter tickets correctly', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    
    // Search for a non-existent ticket
    const searchInput = page.locator('input[placeholder="Search ticket number or summary..."]');
    await searchInput.fill('NONEXISTENT-999');
    
    // Wait for debounce and API response
    await expect(page.locator('h5', { hasText: 'No tickets found' })).toBeVisible({ timeout: 5000 });
    
    // Clear search
    await searchInput.fill('');
    await expect(page.locator('h5', { hasText: 'No tickets found' })).toBeHidden({ timeout: 5000 });
  });
});
