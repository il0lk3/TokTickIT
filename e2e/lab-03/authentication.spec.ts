import { test, expect } from '@playwright/test';

test.describe('E2E-03: Authentication and Identity Flow', () => {
  // Mutating tests should only run on a single viewport to avoid data corruption
  test.skip(({ browserName, isMobile }) => browserName !== 'chromium' || !!isMobile, 'Mutating auth flow only needs to be verified once');

  test('should login and navigate to app shell after mandatory password change', async ({ page }) => {
    await page.goto('/');

    // 1. Check Login UI is displayed
    await expect(page.getByRole('heading', { name: 'TokTickIT' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();

    // 2. Perform Login with known credentials (Requester)
    await page.fill('input[type="email"]', 'cream.su@example.com'); 
    await page.fill('input[type="password"]', 'Password123!');

    // Submit form
    await page.getByRole('button', { name: 'Sign In' }).click();

    // 3. User requires password change on first login
    await expect(page.getByRole('heading', { name: 'Change Your Password' })).toBeVisible();

    // Complete password change
    await page.fill('input[id="currentPasswordInput"]', 'Password123!');
    await page.fill('input[id="newPasswordInput"]', 'StrongPass1!');
    await page.fill('input[id="confirmPasswordInput"]', 'StrongPass1!');
    await page.getByRole('button', { name: 'Continue' }).click();

    // 4. Verify successful redirection / App Shell loads
    await expect(page.getByRole('button', { name: 'My Tickets' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Ticket' })).toBeVisible();
    
    // Verify user profile is rendered
    await expect(page.getByText('Logout')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/');
    
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpass');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Verify error message
    await expect(page.getByText('Invalid email or password')).toBeVisible();
  });

  test('should enforce password change rules and live validation', async ({ page }) => {
    await page.goto('/');

    // Perform Login with another user that requires password change (IT Staff)
    await page.fill('input[type="email"]', 'staff1@example.com'); 
    await page.fill('input[type="password"]', 'Password123!'); 
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Should redirect to change password UI
    await expect(page.getByRole('heading', { name: 'Change Your Password' })).toBeVisible();

    // Fill current password so the form becomes valid later
    await page.fill('input[id="currentPasswordInput"]', 'Password123!');

    // Type weak password, button should be disabled
    await page.fill('input[id="newPasswordInput"]', 'weak');
    await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled();

    // Verify visual checklist feedback (Playwright can verify class/visuals, but basic DOM check is fine)
    // For simplicity, we just trust the component logic verified via unit tests
    
    // Type strong password
    await page.fill('input[id="newPasswordInput"]', 'StrongPass1!');
    
    // Still disabled because passwords don't match
    await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled();

    // Confirm password mismatch validation
    await page.fill('input[id="confirmPasswordInput"]', 'WrongMatch1!');
    await expect(page.getByText('Passwords do not match')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled();

    // Correctly matching passwords
    await page.fill('input[id="confirmPasswordInput"]', 'StrongPass1!');
    await expect(page.getByRole('button', { name: 'Continue' })).toBeEnabled();
  });

});
