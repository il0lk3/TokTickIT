# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: lab-02/requester-ticket-flow.spec.ts >> Requester Ticket Flow (Lab 2) >> Complete submission flow & Search
- Location: lab-02/requester-ticket-flow.spec.ts:5:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('link', { name: 'Create Ticket' })

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - navigation [ref=e4]:
    - generic [ref=e5]:
      - link "TokTickIT" [ref=e6] [cursor=pointer]:
        - /url: "#"
      - generic [ref=e10]:
        - list [ref=e11]:
          - listitem [ref=e12]:
            - button "Create Ticket" [ref=e13] [cursor=pointer]
          - listitem [ref=e14]:
            - button "My Tickets" [ref=e15] [cursor=pointer]
        - generic [ref=e16]:
          - generic [ref=e17]:
            - generic [ref=e18]: C
            - generic [ref=e19]: Cream Su
          - button "Switch User" [ref=e20] [cursor=pointer]
  - main [ref=e21]:
    - generic [ref=e25]:
      - generic [ref=e26]:
        - heading "Submit a New Request" [level=2] [ref=e27]
        - paragraph [ref=e31]: Please fill out the form below to report an IT issue or request a service.
      - generic [ref=e33]:
        - generic [ref=e34]:
          - generic [ref=e35]: Category *
          - combobox "Category *" [ref=e36]:
            - option "Select a category..." [selected]
            - option "Account and Access"
            - option "Hardware"
            - option "Software"
            - option "Network"
        - generic [ref=e37]:
          - generic [ref=e38]: Related System *
          - combobox "Related System *" [ref=e39]:
            - option "Select a system..." [selected]
            - option "Email"
            - option "Campus Wi-Fi"
            - option "VPN"
            - option "LEB2 App"
            - option "Grade Submission App"
            - option "Printer"
            - option "Corporate Laptop"
            - option "Student Registration"
            - option "Library Portal"
        - generic [ref=e40]:
          - generic [ref=e41]: Priority *
          - combobox "Priority *" [ref=e42]:
            - option "Low"
            - option "Medium" [selected]
            - option "High"
        - generic [ref=e43]:
          - generic [ref=e44]: Summary *
          - textbox "Summary *" [ref=e45]:
            - /placeholder: Brief summary of the issue (max 150 chars)
        - generic [ref=e46]:
          - generic [ref=e47]: Description *
          - textbox "Description *" [ref=e48]:
            - /placeholder: Detailed description of the issue... (max 1000 chars)
        - generic [ref=e49]:
          - generic [ref=e50]: Attachments (Optional)
          - generic [ref=e53]:
            - generic [ref=e54] [cursor=pointer]: Browse Files
            - paragraph [ref=e55]: Drag and drop files here. (Upload functionality arriving in Issue 7)
        - button "Submit Request" [ref=e57] [cursor=pointer]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import path from 'path';
  3  | 
  4  | test.describe('Requester Ticket Flow (Lab 2)', () => {
  5  |   test('Complete submission flow & Search', async ({ page }) => {
  6  |     // 1. Navigate to the app (Requester Selection)
  7  |     await page.goto('/');
  8  |     
  9  |     // Select "Cream Su" or "Bew Su" (Active Requester)
  10 |     await expect(page.locator('text=Welcome to TokTickIT')).toBeVisible();
  11 |     await page.selectOption('select', { label: 'Cream Su (cream.su@example.com)' }); // Select Cream Su
  12 |     await page.getByRole('button', { name: 'Continue' }).click();
  13 | 
  14 |     // 2. We should be on My Tickets, go to Create Ticket
  15 |     await expect(page.locator('text=My Tickets')).toBeVisible();
> 16 |     await page.getByRole('link', { name: 'Create Ticket' }).click();
     |                                                             ^ Error: locator.click: Test timeout of 30000ms exceeded.
  17 | 
  18 |     // 3. Fill out the Create Ticket form
  19 |     const timestamp = Date.now();
  20 |     const testSummary = `E2E Test Ticket ${timestamp}`;
  21 |     
  22 |     await page.fill('input[placeholder="Brief summary of the issue"]', testSummary);
  23 |     await page.fill('textarea[placeholder="Detailed description..."]', 'This is an automated E2E test to verify the complete ticket creation flow.');
  24 |     
  25 |     // Select dropdowns
  26 |     await page.selectOption('select:has(option[value="1"])', { index: 1 }); // Select first category
  27 |     await page.selectOption('select:has(option[value="2"])', { index: 1 }); // Select first system
  28 |     await page.selectOption('select:has(option[value="MEDIUM"])', 'HIGH'); // Priority
  29 | 
  30 |     // Wait for the form to be ready
  31 |     await page.waitForTimeout(500);
  32 | 
  33 |     // 4. Submit the ticket
  34 |     await page.getByRole('button', { name: 'Submit Ticket' }).click();
  35 | 
  36 |     // 5. Success screen verification
  37 |     await expect(page.locator('text=Ticket Created Successfully!')).toBeVisible();
  38 |     
  39 |     // Extract ticket number
  40 |     const successText = await page.locator('.alert-success').innerText();
  41 |     const ticketNumberMatch = successText.match(/(TKT-\d{4}-\d+)/);
  42 |     expect(ticketNumberMatch).toBeTruthy();
  43 |     const ticketNumber = ticketNumberMatch![1];
  44 | 
  45 |     // Go back to My Tickets
  46 |     await page.getByRole('button', { name: 'Back to My Tickets' }).click();
  47 | 
  48 |     // 6. Search for the created ticket
  49 |     await expect(page.locator('h2', { hasText: 'My Tickets' })).toBeVisible();
  50 |     await page.fill('input[placeholder="Search by ticket number or summary..."]', ticketNumber);
  51 | 
  52 |     // Wait for debounce and fetch
  53 |     await page.waitForTimeout(1000);
  54 | 
  55 |     // Verify the ticket appears in the table
  56 |     const row = page.locator(`tr:has-text("${ticketNumber}")`);
  57 |     await expect(row).toBeVisible();
  58 |     await expect(row.locator(`text=${testSummary}`)).toBeVisible();
  59 |   });
  60 | });
  61 | 
```