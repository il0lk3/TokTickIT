# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: lab-03/screenshots-2-user-management.spec.ts >> 2. User Management Screenshots >> Capture User Management states
- Location: lab-03/screenshots-2-user-management.spec.ts:13:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('button:has-text("Cancel")')

```

# Page snapshot

```yaml
- generic [ref=f4e1]:
  - generic [ref=f4e3]:
    - navigation [ref=f4e4]:
      - generic [ref=f4e5]:
        - link "TokTickIT" [ref=f4e6] [cursor=pointer]:
          - /url: "#"
        - generic [ref=f4e11]:
          - list [ref=f4e12]:
            - listitem [ref=f4e13]:
              - button "User Management" [ref=f4e14] [cursor=pointer]
          - generic [ref=f4e15]:
            - generic [ref=f4e16]: E2E Admin (ADMINISTRATOR)
            - button "Logout" [ref=f4e21] [cursor=pointer]
    - main [ref=f4e25]:
      - generic [ref=f4e28]:
        - generic [ref=f4e29]:
          - heading "User Management" [level=2] [ref=f4e30]
          - button "+ Create User" [ref=f4e31] [cursor=pointer]
        - generic [ref=f4e34]:
          - textbox "Search by name or email" [ref=f4e37]
          - combobox [ref=f4e39]:
            - option "All Roles" [selected]
            - option "Requester"
            - option "IT Staff"
            - option "Administrator"
          - button "Search" [ref=f4e41] [cursor=pointer]
        - table [ref=f4e44]:
          - rowgroup [ref=f4e45]:
            - row [ref=f4e46]:
              - columnheader "Sort by Name" [ref=f4e47] [cursor=pointer]:
                - generic [ref=f4e48]: Name
              - columnheader "Sort by Email" [ref=f4e52] [cursor=pointer]:
                - generic [ref=f4e53]: Email
              - columnheader "Sort by Role" [ref=f4e57] [cursor=pointer]:
                - generic [ref=f4e58]: Role
              - columnheader "Sort by Status" [ref=f4e62] [cursor=pointer]:
                - generic [ref=f4e63]: Status
              - columnheader "Actions" [ref=f4e67]
          - rowgroup [ref=f4e68]:
            - row [ref=f4e69]:
              - cell "Bew Su" [ref=f4e70]
              - cell "bew.su@example.com" [ref=f4e71]
              - cell "Requester" [ref=f4e72]
              - cell "Active" [ref=f4e74]
              - cell [ref=f4e76]:
                - button "Edit" [ref=f4e77] [cursor=pointer]
            - row [ref=f4e78]:
              - cell "Bewnoi Su" [ref=f4e79]
              - cell "bewnoi.su@example.com" [ref=f4e80]
              - cell "Requester" [ref=f4e81]
              - cell "Active" [ref=f4e83]
              - cell [ref=f4e85]:
                - button "Edit" [ref=f4e86] [cursor=pointer]
            - row [ref=f4e87]:
              - cell "Cream Su" [ref=f4e88]
              - cell "cream.su@example.com" [ref=f4e89]
              - cell "Requester" [ref=f4e90]
              - cell "Active" [ref=f4e92]
              - cell [ref=f4e94]:
                - button "Edit" [ref=f4e95] [cursor=pointer]
            - row [ref=f4e96]:
              - cell "Duplicate" [ref=f4e97]
              - cell "newe2e.requester@example.com" [ref=f4e98]
              - cell "Requester" [ref=f4e99]
              - cell "Active" [ref=f4e101]
              - cell [ref=f4e103]:
                - button "Edit" [ref=f4e104] [cursor=pointer]
            - row [ref=f4e105]:
              - cell "E2E Admin" [ref=f4e106]
              - cell "e2e.admin@example.com" [ref=f4e107]
              - cell "Administrator" [ref=f4e108]
              - cell "Active" [ref=f4e110]
              - cell [ref=f4e112]:
                - button "Edit" [ref=f4e113] [cursor=pointer]
            - row [ref=f4e114]:
              - cell "E2E Requester" [ref=f4e115]
              - cell "e2e.requester@example.com" [ref=f4e116]
              - cell "Requester" [ref=f4e117]
              - cell "Active" [ref=f4e119]
              - cell [ref=f4e121]:
                - button "Edit" [ref=f4e122] [cursor=pointer]
            - row [ref=f4e123]:
              - cell "E2E Staff" [ref=f4e124]
              - cell "e2e.staff@example.com" [ref=f4e125]
              - cell "IT Staff" [ref=f4e126]
              - cell "Active" [ref=f4e128]
              - cell [ref=f4e130]:
                - button "Edit" [ref=f4e131] [cursor=pointer]
            - row [ref=f4e132]:
              - cell "Grace Su" [ref=f4e133]
              - cell "grace.su@example.com" [ref=f4e134]
              - cell "Requester" [ref=f4e135]
              - cell "Active" [ref=f4e137]
              - cell [ref=f4e139]:
                - button "Edit" [ref=f4e140] [cursor=pointer]
            - row [ref=f4e141]:
              - cell "Inactive Staff" [ref=f4e142]
              - cell "inactive.staff@example.com" [ref=f4e143]
              - cell "IT Staff" [ref=f4e144]
              - cell "Inactive" [ref=f4e146]
              - cell [ref=f4e148]:
                - button "Edit" [ref=f4e149] [cursor=pointer]
            - row [ref=f4e150]:
              - cell "Inactive TestUser" [ref=f4e151]
              - cell "inactive.user@example.com" [ref=f4e152]
              - cell "Requester" [ref=f4e153]
              - cell "Inactive" [ref=f4e155]
              - cell [ref=f4e157]:
                - button "Edit" [ref=f4e158] [cursor=pointer]
            - row [ref=f4e159]:
              - cell "IT Staff 1" [ref=f4e160]
              - cell "staff1@example.com" [ref=f4e161]
              - cell "IT Staff" [ref=f4e162]
              - cell "Active" [ref=f4e164]
              - cell [ref=f4e166]:
                - button "Edit" [ref=f4e167] [cursor=pointer]
            - row [ref=f4e168]:
              - cell "IT Staff 2" [ref=f4e169]
              - cell "staff2@example.com" [ref=f4e170]
              - cell "IT Staff" [ref=f4e171]
              - cell "Active" [ref=f4e173]
              - cell [ref=f4e175]:
                - button "Edit" [ref=f4e176] [cursor=pointer]
            - row [ref=f4e177]:
              - cell "IT Staff 3" [ref=f4e178]
              - cell "staff3@example.com" [ref=f4e179]
              - cell "IT Staff" [ref=f4e180]
              - cell "Active" [ref=f4e182]
              - cell [ref=f4e184]:
                - button "Edit" [ref=f4e185] [cursor=pointer]
            - row [ref=f4e186]:
              - cell "Je Su" [ref=f4e187]
              - cell "je.su@example.com" [ref=f4e188]
              - cell "Requester" [ref=f4e189]
              - cell "Active" [ref=f4e191]
              - cell [ref=f4e193]:
                - button "Edit" [ref=f4e194] [cursor=pointer]
            - row [ref=f4e195]:
              - cell "Kanta Su" [ref=f4e196]
              - cell "kanta.su@example.com" [ref=f4e197]
              - cell "Requester" [ref=f4e198]
              - cell "Active" [ref=f4e200]
              - cell [ref=f4e202]:
                - button "Edit" [ref=f4e203] [cursor=pointer]
            - row [ref=f4e204]:
              - cell "Phrao Su" [ref=f4e205]
              - cell "phrao.su@example.com" [ref=f4e206]
              - cell "Requester" [ref=f4e207]
              - cell "Active" [ref=f4e209]
              - cell [ref=f4e211]:
                - button "Edit" [ref=f4e212] [cursor=pointer]
            - row [ref=f4e213]:
              - cell "Pueng Su" [ref=f4e214]
              - cell "pueng.su@example.com" [ref=f4e215]
              - cell "Requester" [ref=f4e216]
              - cell "Active" [ref=f4e218]
              - cell [ref=f4e220]:
                - button "Edit" [ref=f4e221] [cursor=pointer]
            - row [ref=f4e222]:
              - cell "System Admin" [ref=f4e223]
              - cell "admin@example.com" [ref=f4e224]
              - cell "Administrator" [ref=f4e225]
              - cell "Active" [ref=f4e227]
              - cell [ref=f4e229]:
                - button "Edit" [ref=f4e230] [cursor=pointer]
  - generic [ref=f4e233]:
    - generic [ref=f4e234]:
      - heading "Set Initial Password for Duplicate" [level=5] [ref=f4e235]
      - button [ref=f4e236] [cursor=pointer]
    - generic [ref=f4e237]:
      - paragraph [ref=f4e238]: Setting a new initial password will force the user to change their password the next time they log in.
      - generic [ref=f4e239]:
        - generic [ref=f4e240]: New Initial Password *
        - textbox [active] [ref=f4e241]: Password123!
        - generic [ref=f4e242]: Min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char.
    - generic [ref=f4e243]:
      - button "Back to Edit" [ref=f4e244] [cursor=pointer]
      - button "Set Password" [ref=f4e245] [cursor=pointer]
```

# Test source

```ts
  1   | import { test, expect, Page } from '@playwright/test';
  2   | import fs from 'fs';
  3   | import path from 'path';
  4   | 
  5   | const snap = async (page: Page, folder: string, name: string) => {
  6   |   const dir = path.join('..', 'artifacts', 'lab-03', 'screenshots', folder);
  7   |   if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  8   |   await page.waitForTimeout(300);
  9   |   await page.screenshot({ path: path.join(dir, name), fullPage: true });
  10  | };
  11  | 
  12  | test.describe('2. User Management Screenshots', () => {
  13  |   test('Capture User Management states', async ({ page }) => {
  14  |     // 14. non-admin-forbidden.png
  15  |     await page.goto('/login');
  16  |     await page.fill('input[type="email"]', 'e2e.staff@example.com');
  17  |     await page.fill('input[type="password"]', 'Password123!');
  18  |     await page.click('button[type="submit"]');
  19  |     await page.waitForResponse(r => r.url().includes('/api/auth/login') && r.status() === 200);
  20  |     await page.goto('/');
  21  |     await snap(page, 'user-management', 'non-admin-forbidden.png');
  22  |     await page.goto('/');
  23  |     await page.context().clearCookies();
  24  | 
  25  |     // Login as admin
  26  |     await page.goto('/login');
  27  |     await page.fill('input[type="email"]', 'e2e.admin@example.com');
  28  |     await page.fill('input[type="password"]', 'Password123!');
  29  |     await page.click('button[type="submit"]');
  30  |     await page.waitForResponse(r => r.url().includes('/api/auth/login') && r.status() === 200);
  31  |     await page.goto('/admin/users');
  32  |     await page.waitForResponse(r => r.url().includes('/api/admin/users') && r.status() === 200);
  33  | 
  34  |     // 1. user-list-default.png
  35  |     await snap(page, 'user-management', 'user-list-default.png');
  36  |     await snap(page, 'user-management', 'user-management-desktop.png');
  37  | 
  38  |     // Responsive tablet/mobile
  39  |     await page.setViewportSize({ width: 768, height: 1024 });
  40  |     await snap(page, 'user-management', 'user-management-tablet.png');
  41  |     await page.setViewportSize({ width: 375, height: 812 });
  42  |     await snap(page, 'user-management', 'user-management-mobile.png');
  43  |     await page.setViewportSize({ width: 1280, height: 800 }); // back to desktop
  44  | 
  45  |     // 2. user-list-search.png
  46  |     await page.fill('input[placeholder*="Search"]', 'TokTickIT');
  47  |     await page.waitForTimeout(1000);
  48  |     await snap(page, 'user-management', 'user-list-search.png');
  49  | 
  50  |     // 4. user-list-empty-search.png
  51  |     await page.fill('input[placeholder*="Search"]', 'NonExistentUser12345');
  52  |     await page.waitForTimeout(1000);
  53  |     await snap(page, 'user-management', 'user-list-empty-search.png');
  54  |     await page.fill('input[placeholder*="Search"]', '');
  55  | 
  56  |     // 3. user-list-role-filter.png
  57  |     await page.selectOption('select', { label: 'Requester' });
  58  |     await page.waitForTimeout(1000);
  59  |     await snap(page, 'user-management', 'user-list-role-filter.png');
  60  |     await page.selectOption('select', { label: 'All Roles' });
  61  |     await page.waitForTimeout(1000);
  62  | 
  63  |     // 5. create-user-form.png
  64  |     await page.click('button:has-text("Create User")');
  65  |     await expect(page.locator('.modal-content')).toBeVisible();
  66  |     await snap(page, 'user-management', 'create-user-form.png');
  67  | 
  68  |     // 6. create-user-validation.png
  69  |     await page.click('.modal button:has-text("Create User")');
  70  |     await snap(page, 'user-management', 'create-user-validation.png');
  71  | 
  72  |     // 7. create-user-duplicate-email.png
  73  |     await page.fill('input[name="name"]', 'Duplicate');
  74  |     await page.fill('input[name="email"]', 'e2e.staff@example.com');
  75  |     await page.fill('input[name="password"]', 'Password123!');
  76  |     await page.click('.modal button:has-text("Create User")');
  77  |     await expect(page.locator('.alert-danger')).toBeVisible();
  78  |     await snap(page, 'user-management', 'create-user-duplicate-email.png');
  79  | 
  80  |     // 8. create-user-success.png
  81  |     await page.fill('input[name="email"]', 'newe2e.requester@example.com');
  82  |     const [res] = await Promise.all([
  83  |       page.waitForResponse(r => r.url().includes('/api/admin/users') && r.request().method() === 'POST'),
  84  |       page.click('.modal button:has-text("Create User")')
  85  |     ]);
  86  |     console.log('Create User response:', res.status(), await res.json());
  87  |     await expect(page.locator('.modal-content')).not.toBeVisible();
  88  |     await snap(page, 'user-management', 'create-user-success.png');
  89  | 
  90  |     // 9. edit-user-form.png
  91  |     // Click edit on newe2e.requester@example.com
  92  |     await page.click('tr:has-text("newe2e.requester@example.com") button:has-text("Edit")');
  93  |     await expect(page.locator('.modal-content')).toBeVisible();
  94  |     await snap(page, 'user-management', 'edit-user-form.png');
  95  | 
  96  |     // 10. edit-user-reset-password.png
  97  |     await page.click('text=Set New Initial Password');
  98  |     await page.fill('input[name="password"]', 'Password123!');
  99  |     await snap(page, 'user-management', 'edit-user-reset-password.png');
> 100 |     await page.click('button:has-text("Cancel")');
      |                ^ Error: page.click: Test timeout of 30000ms exceeded.
  101 | 
  102 |     // 11. deactivate-self-blocked.png
  103 |     await page.click('tr:has-text("e2e.admin@example.com") button:has-text("Edit")');
  104 |     await page.click('button:has-text("Deactivate User")');
  105 |     await expect(page.locator('.alert-danger')).toBeVisible();
  106 |     await snap(page, 'user-management', 'deactivate-self-blocked.png');
  107 |     await page.click('button:has-text("Cancel")');
  108 | 
  109 |     // 12. deactivate-last-admin-blocked.png
  110 |     // Need to login as another admin, but we only have one admin? Let's create an admin, login as that admin, and deactivate the first admin!
  111 |     // Or we can just try to change admin's role to Requester? Wait, the rule is "Cannot deactivate the last active administrator".
  112 |     // We already have deactivate-self-blocked.
  113 |     // If we have 2 admins, and we deactivate one, it succeeds.
  114 |     // Let's create a second admin.
  115 |     const ctx = page.request;
  116 |     const loginRes = await ctx.post('http://localhost:3000/api/auth/login', { data: { email: 'e2e.admin@example.com', password: 'Password123!' } });
  117 |     const authHeaders = { cookie: loginRes.headers()['set-cookie'] };
  118 |     await ctx.post('http://localhost:3000/api/admin/users', {
  119 |       headers: authHeaders,
  120 |       data: { name: 'Admin 2', email: 'admin2@example.com', role: 'ADMINISTRATOR', initialPassword: 'Password1!', isActive: true }
  121 |     });
  122 |     // Refresh page
  123 |     await page.goto('/admin/users');
  124 |     await page.click('tr:has-text("e2e.admin@example.com") button:has-text("Edit")');
  125 |     await page.click('button:has-text("Deactivate User")'); // Admin 1 deactivated by Admin 1? No, self deactivate blocks.
  126 |     await page.click('button:has-text("Cancel")');
  127 |     
  128 |     // Login as Admin 2, deactivate Admin 2 -> self block.
  129 |     // Deactivate Admin 1 -> Success! (deactivate-user-success.png)
  130 |     await page.goto('/');
  131 |     await page.context().clearCookies();
  132 |     await page.goto('/login');
  133 |     await page.fill('input[type="email"]', 'admin2@example.com');
  134 |     await page.fill('input[type="password"]', 'Password1!');
  135 |     await page.click('button[type="submit"]');
  136 |     await page.waitForResponse(r => r.url().includes('/api/auth/login') && r.status() === 200);
  137 |     await page.goto('/admin/users');
  138 |     await page.waitForResponse(r => r.url().includes('/api/admin/users') && r.status() === 200);
  139 |     
  140 |     // 13. deactivate-user-success.png (Deactivate newe2e.requester@example.com)
  141 |     await page.click('tr:has-text("newe2e.requester@example.com") button:has-text("Edit")');
  142 |     await page.click('button:has-text("Deactivate User")');
  143 |     await page.click('button:has-text("Save Changes")');
  144 |     await page.waitForTimeout(500);
  145 |     await snap(page, 'user-management', 'deactivate-user-success.png');
  146 |     
  147 |     // Deactivate Admin 1
  148 |     await page.click('tr:has-text("e2e.admin@example.com") button:has-text("Edit")');
  149 |     await page.click('button:has-text("Deactivate User")');
  150 |     await page.click('button:has-text("Save Changes")');
  151 |     
  152 |     // Now Admin 2 is the ONLY active admin!
  153 |     // If Admin 2 tries to change role of Admin 2 -> last admin block!
  154 |     await page.click('tr:has-text("admin2@example.com") button:has-text("Edit")');
  155 |     await page.selectOption('select[name="role"]', 'Requester');
  156 |     await page.click('button:has-text("Save Changes")');
  157 |     await expect(page.locator('.alert-danger')).toBeVisible();
  158 |     await snap(page, 'user-management', 'deactivate-last-admin-blocked.png'); // This is last admin role change block
  159 |   });
  160 | });
  161 | 
```