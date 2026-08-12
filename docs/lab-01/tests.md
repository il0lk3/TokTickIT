# Lab 1 — Test Plan and Evidence  (fill this in)

All test files live under server/tests/lab-01/ and client/tests/lab-01/.

| # | Tool | Test | Result |
|---|------|------|--------|
| 1 | Supertest | GET /api/health returns 200, status=ok | PASS |
| 2 | Supertest | GET /api/categories returns 4 seeded categories in id order | PASS |
| 3 | Vitest | Heading renders | PASS |
| 4 | Vitest | Success state shows Online + category list | PASS |
| 5 | Vitest | Error state shows Offline + message | PASS |

Paste your passing terminal output / screenshot below.

```
> toktickit-server@1.0.0 test
> vitest run

 RUN  v2.1.9 /Users/karn/Downloads/toktickit/server
 ✓ tests/lab-01/health.test.ts (1 test) 9ms
 ✓ tests/lab-01/categories.test.ts (1 test) 94ms

 Test Files  2 passed (2)
      Tests  2 passed (2)

> toktickit-client@1.0.0 test
> vitest run

 RUN  v2.1.9 /Users/karn/Downloads/toktickit/client
 ✓ tests/lab-01/App.test.tsx (3 tests) 22ms

 Test Files  1 passed (1)
      Tests  3 passed (3)
```
