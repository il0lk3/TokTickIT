import { test, expect } from '@playwright/test';

test.describe('E2E-03: Authentication and Identity Flow', () => {

  test.beforeEach(async ({ page }) => {
    // Reset database or seed required users if possible. 
    // This assumes backend is running at localhost:3000 and has a /api/health or test-reset endpoint
    // For now we will test standard flows assuming some seeded data like test@example.com
  });

  test('should login successfully and load application shell', async ({ page }) => {
    await page.goto('/');

    // 1. Check Login UI is displayed
    await expect(page.getByRole('heading', { name: 'TokTickIT' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();

    // 2. Perform Login with known credentials (assumes lab-03 DB seed has active user)
    await page.fill('input[type="email"]', 'karn@toktick.com'); // example user from DB
    await page.fill('input[type="password"]', 'P@ssword123'); // example valid password

    // Submit form
    await page.getByRole('button', { name: 'Sign In' }).click();

    // 3. Verify successful redirection / App Shell loads
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

  test('should enforce password change if required', async ({ page }) => {
    await page.goto('/');

    // Perform Login with a user that requires password change
    await page.fill('input[type="email"]', 'newstaff@toktick.com'); 
    await page.fill('input[type="password"]', 'Changeme1!'); 
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Should redirect to change password UI instead of main app
    await expect(page.getByRole('heading', { name: 'Update Password' })).toBeVisible();
    
    // Validate live checklist interactions
    await page.fill('input[id="newPasswordInput"]', 'weak');
    
    // Check that length rule is not met
    const lengthRule = page.getByText('At least 8 characters');
    await expect(lengthRule).not.toHaveClass(/text-success/);

    await page.fill('input[id="newPasswordInput"]', 'StrongPass1!');
    await expect(lengthRule).toHaveClass(/text-success/);
    
    // Confirm password mismatch validation
    await page.fill('input[id="confirmPasswordInput"]', 'WrongMatch1!');
    await expect(page.getByText('Passwords do not match')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Update Password' })).toBeDisabled();

    // Correctly matching passwords
    await page.fill('input[id="confirmPasswordInput"]', 'StrongPass1!');
    await expect(page.getByRole('button', { name: 'Update Password' })).toBeEnabled();
  });

});
