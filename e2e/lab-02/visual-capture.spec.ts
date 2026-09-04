import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Automated Visual Capture', () => {
  test('Capture all required states across viewports', async ({ page, isMobile }, testInfo) => {
    test.setTimeout(120000); // 2 minutes timeout for this exhaustive test
    const viewportRaw = testInfo.project.name;
    const viewport = viewportRaw === 'chromium' ? 'desktop' : viewportRaw;
    const outDir = path.join('..', 'artifacts', 'lab-02', 'screenshots');

    const snap = async (folder: string, name: string) => {
      await page.waitForTimeout(600); // Wait for animations/transitions
      
      // Temporarily disable sticky-top on navbar for clean full-page screenshots
      await page.evaluate(() => {
        const nav = document.querySelector('.navbar.sticky-top');
        if (nav) {
          nav.classList.remove('sticky-top');
          nav.setAttribute('data-removed-sticky', 'true');
        }
      });

      await page.screenshot({ path: path.join(outDir, folder, `${viewport}-${name}.png`), fullPage: true });

      // Restore sticky-top
      await page.evaluate(() => {
        const nav = document.querySelector('.navbar[data-removed-sticky="true"]');
        if (nav) {
          nav.classList.add('sticky-top');
          nav.removeAttribute('data-removed-sticky');
        }
      });
    };

    // 1. Requester Selection
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Select Development Requester' })).toBeVisible();
    await snap('requester-selection', 'initial');

    // 2. Select User with NO tickets (Empty State)
    await page.selectOption('select', { label: 'Kanta Su' });
    await page.getByRole('button', { name: 'Continue' }).click();

    // 3. My Tickets - Empty State
    if (isMobile) {
      const toggler = page.locator('.navbar-toggler');
      if (await toggler.isVisible()) {
        await toggler.click();
        await page.waitForTimeout(500);
      }
    }
    await page.getByText('My Tickets').click();
    await expect(page.getByRole('heading', { name: 'My Tickets', exact: true })).toBeVisible();
    await page.waitForTimeout(1500);
    await snap('my-tickets', 'empty');

    // 4. Switch to Cream Su
    await page.evaluate(() => localStorage.setItem('toktickit_requester', JSON.stringify({id: 1, name: 'Cream Su'})));
    await page.goto('/');

    // 5. Create Ticket - Initial
    await expect(page.getByRole('heading', { name: 'Submit a New Request' })).toBeVisible();
    await snap('create-ticket', 'initial');

    // 6. Create Ticket - Validation
    await page.getByRole('button', { name: 'Submit Request' }).click();
    await page.waitForTimeout(500);
    await snap('create-ticket', 'validation-error');

    // 7. Create Ticket - Invalid Attachment
    await page.getByLabel('Summary *').fill('Test Invalid Attachment');
    await page.getByLabel('Description *').fill('Test description');
    await page.getByLabel('Category *').selectOption({ index: 1 });
    await page.getByLabel('Related System *').selectOption({ index: 1 });
    await page.getByLabel('Priority *').selectOption('MEDIUM');
    // Upload invalid file type
    await page.locator('input[type="file"]').setInputFiles({
      name: 'invalid.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('invalid')
    });
    await page.waitForTimeout(500);
    await snap('create-ticket', 'attachment-invalid');
    await page.locator('input[type="file"]').setInputFiles([]); // clear it

    // 8. Create Ticket - API Error State
    await page.route('**/api/tickets', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 500, json: { message: 'Internal Server Error' } });
      } else {
        await route.fallback();
      }
    });
    await page.getByRole('button', { name: 'Submit Request' }).click();
    await page.waitForTimeout(500);
    await snap('create-ticket', 'api-error');
    await page.unroute('**/api/tickets');

    // 9. Create Ticket - Submitting State (Delayed Route)
    await page.route('**/api/tickets', async route => {
      if (route.request().method() === 'POST') {
        setTimeout(() => route.continue(), 2000); // Delay 2s asynchronously
      } else {
        await route.fallback();
      }
    });
    await page.getByLabel('Summary *').fill('E2E Screenshot Capture Ticket'); // fix summary
    const responsePromise = page.waitForResponse(r => r.url().includes('/api/tickets') && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Submit Request' }).click();
    await page.waitForTimeout(500); // Wait for busy state to render
    await snap('create-ticket', 'submitting');
    await responsePromise; // Wait for it to finish
    await page.unroute('**/api/tickets');
    
    // 10. Create Ticket - Success
    await expect(page.getByRole('heading', { name: 'Ticket Created Successfully!' })).toBeVisible();
    await snap('create-ticket', 'success');
    
    const successText = await page.locator('strong.fs-3.text-dark').innerText();
    const ticketNumber = successText.trim();

    // 11. My Tickets - List State
    await page.goto('/'); // reset
    if (isMobile) {
      const toggler = page.locator('.navbar-toggler');
      if (await toggler.isVisible()) {
        await toggler.click();
        await page.waitForTimeout(500);
      }
    }
    await page.getByText('My Tickets').click();
    await expect(page.getByRole('heading', { name: 'My Tickets', exact: true })).toBeVisible();
    await page.waitForTimeout(1500);
    await snap('my-tickets', 'list');

    // 12. My Tickets - Search
    await page.getByPlaceholder('Search tickets...').fill(ticketNumber);
    await page.waitForTimeout(1500);
    await snap('my-tickets', 'search');
    await page.getByPlaceholder('Search tickets...').fill(''); // clear
    await page.waitForTimeout(1000);

    // 13. My Tickets - Filter
    if (isMobile) {
      // open filter modal/dropdown if needed? Actually they are just selects
    }
    await page.locator('select').first().selectOption({ index: 2 }); // First filter is Category
    await page.waitForTimeout(1500);
    await snap('my-tickets', 'filter');
    await page.locator('select').first().selectOption({ index: 0 }); // Reset
    await page.waitForTimeout(1000);

    // 14. My Tickets - Sorted
    if (isMobile) {
      // Mobile uses a sort dropdown if implemented, else just skip
      const sortSelect = page.locator('select').nth(1); // usually second select is sort
      if (await sortSelect.isVisible()) {
         await sortSelect.selectOption({ index: 1 });
         await page.waitForTimeout(1500);
      }
    } else {
      await page.locator('th').filter({ hasText: 'Last Updated' }).click(); // Click sort header
      await page.waitForTimeout(1500);
    }
    await snap('my-tickets', 'sorted');

    // 15. My Tickets - Pagination (Assume Cream Su has enough tickets for page 2)
    const nextBtn = page.getByRole('button', { name: 'Next' });
    if (await nextBtn.isVisible() && await nextBtn.isEnabled()) {
      await nextBtn.click();
      await page.waitForTimeout(1500);
      await snap('my-tickets', 'pagination');
    }

    // 16. My Tickets - No Results
    // Reset state by clicking My Tickets again to clear pagination and sort
    await page.goto('/');
    if (isMobile) {
      const toggler = page.locator('.navbar-toggler');
      if (await toggler.isVisible()) {
        await toggler.click();
        await page.waitForTimeout(500);
      }
    }
    await page.getByText('My Tickets').click();
    await page.waitForTimeout(1000);

    await page.getByPlaceholder('Search tickets...').fill('asdfghjkl12345');
    await page.waitForTimeout(1500);
    await snap('my-tickets', 'no-results');

    // 17. Ticket Detail - View Mode
    await page.getByPlaceholder('Search tickets...').fill(''); // clear
    await page.waitForTimeout(1000);
    // Find the ticket we just created
    await page.getByPlaceholder('Search tickets...').fill(ticketNumber);
    await page.waitForTimeout(1500);
    
    // Click the first ticket in the list
    const isSmallScreen = page.viewportSize()?.width! < 768;
    if (isSmallScreen) {
      await page.locator('.ticket-card, .card').first().click({ force: true });
    } else {
      await page.locator('tbody tr').first().click({ force: true });
    }
    await expect(page.getByText('Back to My Tickets').first()).toBeVisible();
    await page.waitForTimeout(1500);
    await snap('ticket-detail', 'view-mode');

    // 18. Ticket Detail - Add Attachment
    // Need to upload a file in detail view
    // Let's check if there's an upload input in TicketDetail
    // The attachment form uses an input type="file"
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.count() > 0) {
      await fileInput.setInputFiles({
        name: 'test-evidence.png',
        mimeType: 'image/png',
        buffer: Buffer.from('test')
      });
      await page.getByRole('button', { name: /Upload/i }).click();
      await page.waitForTimeout(1500);
      await snap('ticket-detail', 'attachment-added');
    }

    // Removed unimplemented features (attachment removal, unauthorized)
  });
});
