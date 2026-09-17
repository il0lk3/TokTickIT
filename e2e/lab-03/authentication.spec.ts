import { test, expect } from '@playwright/test';

test.describe('E2E-03: Authentication and Identity Flow', () => {

  test.beforeAll(() => {
    // Reset database to known state before tests run
    // Assuming backend is accessible and we can run prisma commands
    try {
      require('child_process').execSync('npx prisma db seed', { cwd: '../server', stdio: 'ignore' });
    } catch (e) {
      console.log('Failed to run seed, tests might depend on prior state');
    }
  });

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
    await expect(page.getByRole('heading', { name: 'Update Password' })).toBeVisible();
    
    // Complete password change
    await page.fill('input[id="currentPasswordInput"]', 'Password123!');
    await page.fill('input[id="newPasswordInput"]', 'StrongPass1!');
    await page.fill('input[id="confirmPasswordInput"]', 'StrongPass1!');
    await page.getByRole('button', { name: 'Update Password' }).click();

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
