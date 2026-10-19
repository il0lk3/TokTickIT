# Lab 4 Peer Review Record

A living document tracking the code review process. Reviews run in both directions with my partner.

## My Information

| Field | Detail |
|---|---|
| **Name** | Thanakorn Pahunrat |
| **Student ID** | 67070505217 |
| **GitHub** | [@il0lk3](https://github.com/il0lk3) |

---

## Peer Reviewer

| Field | Detail |
|---|---|
| **Reviewer Name** | Achiraya Inta |
| **Student ID** | 67070505229 |
| **Reviewer GitHub** | [@Achikan](https://github.com/Achikan) |

---

# Pull Requests I Authored

> My partner reviewed the following PRs that I submitted to `lab4-staging`.

| PR | Issue | Branch | Reviewer Verdict |
|---|---|---|---|
| [#69](https://github.com/il0lk3/TokTickIT/pull/69) | Issue 1 — Sprint 4 Engineering Contract (Spec DD + Test DD) | `feature/lab4-specs` | Approved & Merged |
| [#70](https://github.com/il0lk3/TokTickIT/pull/70) | Issue 2 — Database Increment — ActionTaken Model, Migration, Backfill, Seed | `feature/lab4-db-actions-taken` | Approved & Merged |
| [#71](https://github.com/il0lk3/TokTickIT/pull/71) | Issue 3 — Actions Taken API and Authorization (TDD) | `feature/lab4-actions-taken-api` | Approved & Merged |
| [#72](https://github.com/il0lk3/TokTickIT/pull/72) | Issue 4 — Ticket Workflow Rules and Conflict Handling (API) | `feature/lab4-ticket-workflow-api` | Approved & Merged |
| [#73](https://github.com/il0lk3/TokTickIT/pull/73) | Issue 5 — Client Routing and Role-aware Application Shell | `feature/lab4-client-routing-shell` | Approved & Merged |
| [#74](https://github.com/il0lk3/TokTickIT/pull/74) | Issue 6 — Actions Taken UI on Ticket Detail | `feature/lab4-actions-taken-ui` | Pending Review |

> *Note: PR #67 was prematurely merged during automated script setup before peer review; base branch `lab4-staging` was immediately reset to `main`, and the official deliverable was submitted in PR #69 for review by @Achikan.*

---

### PR #69 — Issue 1: Sprint 4 Engineering Contract (Spec DD + Test DD)

| Field | Detail |
|---|---|
| **PR Link** | [https://github.com/il0lk3/TokTickIT/pull/69](https://github.com/il0lk3/TokTickIT/pull/69) |
| **Reviewer** | [@Achikan](https://github.com/Achikan) |
| **Review Verdict** | Approved ([Review #5556815718](https://github.com/il0lk3/TokTickIT/pull/69#pullrequestreview-5556815718)) |
| **Review Comments** | 1. **Missing Advisory Resolution API & Schema:** Requester advisory-signal (`appearsResolved = true`) was missing in `api-spec.md` and `Ticket` schema in `specification.md`.<br>2. **Client Route Inconsistency:** Inconsistent path references between documents (`/staff/queue` vs `/queue`, `/staff/dashboard` vs `/dashboard`).<br>3. **Authorization Matrix Contradiction:** Section 5.1 marked "Create Ticket" as `No` for IT Staff and Admin, contradicting Section 11 and UI spec. |
| **My Response / Actions Taken** | 1. Added `PATCH /api/tickets/:id/appears-resolved` specification in [api-spec.md](file:///Users/karn/Downloads/toktickit/docs/lab-04/api-spec.md#L233) with full validation, RBAC, and response schema. Added `appearsResolved Boolean @default(false)` to `Ticket` schema in [specification.md](file:///Users/karn/Downloads/toktickit/docs/lab-04/specification.md#L207).<br>2. Standardized all frontend routes across [specification.md](file:///Users/karn/Downloads/toktickit/docs/lab-04/specification.md), [ui-spec.md](file:///Users/karn/Downloads/toktickit/docs/lab-04/ui-spec.md), and [api-spec.md](file:///Users/karn/Downloads/toktickit/docs/lab-04/api-spec.md) to use canonical paths (`/dashboard`, `/tickets`, `/tickets/new`, `/tickets/:ticketId`, `/queue`, `/admin/users`).<br>3. Updated Section 5.1 Authorization Matrix in [specification.md](file:///Users/karn/Downloads/toktickit/docs/lab-04/specification.md#L78) for `Create Ticket` to `Yes (on behalf of user)` for both IT Staff and Administrator. |
| **Outcome** | Approved & Merged into `lab4-staging` by @Achikan |

---

### PR #70 — Issue 2: Database Increment — ActionTaken Model, Migration, Backfill, Seed

| Field | Detail |
|---|---|
| **PR Link** | [https://github.com/il0lk3/TokTickIT/pull/70](https://github.com/il0lk3/TokTickIT/pull/70) |
| **Reviewer** | [@Achikan](https://github.com/Achikan) |
| **Review Verdict** | Changes Requested ([Review #5557454686](https://github.com/il0lk3/TokTickIT/pull/70#pullrequestreview-5557454686)), addressed and approved |
| **Review Comments** | 1. **Missing Attachment Seeding in Clean Setup:** `server/prisma/seed.ts` lacked an `Attachment` seed, causing `API-MIG-01` to fail on fresh environments where `attachmentCount` starts at 0.<br>2. **Avoid Hardcoded IDs for Comments/Notes:** In `seed.ts`, comments and notes used fixed `id: 1` which can cause PK conflicts if database sequences diverge. |
| **My Response / Actions Taken** | 1. Added `upsertAttachment` helper to [seed.ts](file:///Users/karn/Downloads/toktickit/server/prisma/seed.ts) and seeded a sample attachment (`duplexer-gear.png`) for Ticket 1.<br>2. Replaced hardcoded IDs with dynamic `upsertPublicComment` and `upsertInternalNote` lookup helpers, and added PostgreSQL sequence realignment (`setval`) across all tables at the end of seed execution. |
| **Outcome** | Approved & Merged into `lab4-staging` by @Achikan |

---

### PR #71 — Issue 3: Actions Taken API and Authorization (TDD)

| Field | Detail |
|---|---|
| **PR Link** | [https://github.com/il0lk3/TokTickIT/pull/71](https://github.com/il0lk3/TokTickIT/pull/71) |
| **Reviewer** | [@Achikan](https://github.com/Achikan) |
| **Review Verdict** | Approved |
| **Review Comments** | "LGTM! The Actions Taken API implementation is thorough, clean, and fully compliant with the Lab 4 handout and specifications. Role authorization, terminal status guards, follow-up validations, session-bound performer derivations, and 5-second duplicate protection are all properly enforced and backed by 27 passing tests. Excellent work! Approved!" |
| **My Response / Actions Taken** | Addressed all 27 TDD test requirements and peer review criteria cleanly. |
| **Outcome** | Approved & Merged into `lab4-staging` by @Achikan |

---

### PR #72 — Issue 4: Ticket Workflow Rules and Conflict Handling (API)

| Field | Detail |
|---|---|
| **PR Link** | [https://github.com/il0lk3/TokTickIT/pull/72](https://github.com/il0lk3/TokTickIT/pull/72) |
| **Reviewer** | [@Achikan](https://github.com/Achikan) |
| **Review Verdict** | Changes Requested ([Review #5561575083](https://github.com/il0lk3/TokTickIT/pull/72#pullrequestreview-5561575083)), addressed and approved |
| **Review Comments** | 1. **Guard against Ineligible Owner in `POST /api/staff/tickets/:id/claim` (BR-12)**: In `/claim`, verify caller has active `IT_STAFF` role (`ASSIGNEE_NOT_ELIGIBLE` if ineligible, `INACTIVE_ASSIGNEE_REJECTED` if inactive) because Administrator access was permitted on `/api/staff/*` (BR-13) and assigning an Admin causes Resolution Gate to fail.<br>2. **Validate Non-Empty Update Payload in `PATCH /api/staff/tickets/:id`**: Reject payloads providing only `{ expectedVersion }` without `ownerId`, `itPriority`, or `status` with 400 Bad Request (`NO_FIELDS_TO_UPDATE`). |
| **My Response / Actions Taken** | 1. Added role and active status checks in `POST /api/staff/tickets/:id/claim` returning 400 Bad Request (`ASSIGNEE_NOT_ELIGIBLE`) if caller is not `IT_STAFF` and (`INACTIVE_ASSIGNEE_REJECTED`) if inactive.<br>2. Added empty update payload guard in `PATCH /api/staff/tickets/:id` returning 400 Bad Request (`NO_FIELDS_TO_UPDATE`) when none of `ownerId`, `itPriority`, or `status` are supplied.<br>3. Added automated test cases `API-WKF-VAL-07` and `API-WKF-OWN-04` covering both scenarios in `server/tests/lab-04/ticket-workflow.api.test.ts`. All 38 workflow tests pass (100%).<br>4. Verified zero regressions across all server suites (16 suites, 165 tests pass) and client suites (8 suites, 25 tests pass); TypeScript compilation passes with 0 errors.<br>5. Updated API specification (`docs/lab-04/api-spec.md`) and testing matrix (`docs/lab-04/tests.md`). |
| **Outcome** | Approved & Merged into `lab4-staging` by @Achikan |

---

### PR #73 — Issue 5: Client Routing and Role-aware Application Shell

| Field | Detail |
|---|---|
| **PR Link** | [https://github.com/il0lk3/TokTickIT/pull/73](https://github.com/il0lk3/TokTickIT/pull/73) |
| **Reviewer** | [@Achikan](https://github.com/Achikan) |
| **Review Verdict** | Approved ([Review #5562656247](https://github.com/il0lk3/TokTickIT/pull/73#pullrequestreview-5562656247)) |
| **Review Comments** | 1. **`AppRoutes` `useEffect` loading state flash on session restore**: The `useEffect` depends on `user` object reference. On mount/session restore, `user` transition triggers `setAppState("loading")` synchronously before cleanup, causing a brief spinner flash.<br>2. **`DashboardShell` is a navigation shortcut, not a real dashboard**: Lab 4 requires backend-driven metrics. Renaming to `DashboardPlaceholder` with an explicit `// TODO(issue-9): implement dashboard metrics` comment is required until Issue 8 & Issue 9 deliver live metric cards.<br>3. **`TicketQueueRoute` & `MyTicketsRoute` contradictory controlled/uncontrolled prop contract**: Both `initial*` seed props and live controlled props are passed, causing ambiguity and risk of desync on browser Back/Forward navigation.<br>4. **Clean up orphaned `RequesterContext`**: Verify whether `useRequester` is still imported anywhere.<br>5. **`NotFound` icon color**: Change green error icon styling (`bg-success bg-opacity-10 text-success`) to neutral `text-muted`. |
| **My Response / Actions Taken** | 1. Updated `useEffect` dependency in `AppRoutes` (`client/src/App.tsx`) to `[user?.id, user?.requiresPasswordChange]` so re-renders or session restores do not trigger false loading state resets.<br>2. Renamed component to `DashboardPlaceholder` (`client/src/components/dashboard/DashboardPlaceholder.tsx`) and added explicit `// TODO(issue-9)` comment documenting follow-up in Issue 8 & 9. Maintained `DashboardShell` alias for backwards compatibility.<br>3. Removed all `initial*` seed props from `TicketQueueRoute`, `MyTicketsRoute`, `TicketQueue`, and `MyTickets`. Derived filter inputs directly from live props when provided, preserving URL searchParams as the single source of truth during browser Back/Forward navigation.<br>4. Verified `client/src/` has zero occurrences or imports of `RequesterContext` (already cleaned up in Lab 3).<br>5. Updated `NotFound.tsx` icon container style to `bg-secondary bg-opacity-10 text-muted` for semantic clarity.<br>6. Updated `e2e/lab-04/navigation.spec.ts` (`E2E-NAV-05`) selector to click `tbody tr` directly to handle dynamic ticket prefixes.<br>7. Verified 100% test pass: 60/60 client tests (35/35 `AppRouting`), 165/165 server tests, 6/6 E2E navigation tests, and 0 TypeScript build errors. |
| **Outcome** | Approved & Merged into `lab4-staging` by @Achikan |

---

### PR #74 — Issue 6: Actions Taken UI on Ticket Detail

| Field | Detail |
|---|---|
| **PR Link** | [https://github.com/il0lk3/TokTickIT/pull/74](https://github.com/il0lk3/TokTickIT/pull/74) |
| **Reviewer** | [@Achikan](https://github.com/Achikan) |
| **Review Verdict** | Changes Requested ([Review #5564014620](https://github.com/il0lk3/TokTickIT/pull/74#pullrequestreview-5564014620)), addressed |
| **Review Comments** | 1. **Hardcoded Screenshot Output Paths in `actions-taken.spec.ts`**: Screenshots wrote to absolute paths (`/Users/karn/Downloads/toktickit/artifacts/...`), which fails on CI or other developer environments.<br>2. **Responsive Breakpoint Contradiction (`991.98px` vs `767.98px`)**: CSS media query used `max-width: 991.98px` collapsing the table at tablet view (768px), contradicting UI Spec §5.2 and §7 stating tablets (>=768px) display the table view and only mobile (<768px) collapses to card layout.<br>3. **Missing Viewport Overflow Assertions on Tablet and Desktop in `E2E-ACT-06`**: E2E only asserted `scrollWidth <= clientWidth` on mobile (375px), missing verification for tablet (768px) and desktop (1280px), as well as table header visibility on tablet.<br>4. **`UI-ACT-04` Test & Doc Alignment**: `docs/lab-04/tests.md` stated handling of HTTP 200 duplicate responses gracefully, but the test suite lacked explicit unit assertion for idempotent 200 duplicate handling. |
| **My Response / Actions Taken** | 1. **Repo-Relative Paths in E2E**: Replaced all hardcoded absolute screenshot paths in [actions-taken.spec.ts](file:///Users/karn/Downloads/toktickit/e2e/lab-04/actions-taken.spec.ts) with `path.resolve(__dirname, '../../artifacts/lab-04/screenshots/actions-taken')` with automatic directory creation via `fs.mkdirSync(..., { recursive: true })`.<br>2. **Tablet Responsive Breakpoint Fixed**: Changed `@media (max-width: 991.98px)` to `@media (max-width: 767.98px)` in [index.css](file:///Users/karn/Downloads/toktickit/client/src/index.css#L160) so tablets (>=768px) render the clean tabular view while mobile (<768px) collapses to cards.<br>3. **Comprehensive Viewport Overflow Assertions**: Added `expect(scrollWidth <= clientWidth)` assertions for Desktop (1280px), Tablet (768px), and Mobile (375px) in `E2E-ACT-06`, along with asserting `thead` visibility on tablet.<br>4. **UI-ACT-04B Test & Doc Alignment**: Added unit test `UI-ACT-04B` in [ActionsTaken.test.tsx](file:///Users/karn/Downloads/toktickit/client/tests/lab-04/ActionsTaken.test.tsx) explicitly asserting graceful handling of HTTP 200 duplicate responses without UI errors; aligned description in [tests.md](file:///Users/karn/Downloads/toktickit/docs/lab-04/tests.md).<br>5. **UI Polish & Spacing**: Cleaned table headers in `ActionsTakenSection.tsx` by removing inline emoji icons and adding distinct cell division (`border-end border-light-subtle px-3`), and added `mb-4` margin below the top ticket details card in `TicketDetail.tsx` for visual separation.<br>6. **Full Suite Verification**: Verified 100% test pass rate: 10 client test suites (79/79 passed), 16 server test suites (165/165 passed), 6/6 Playwright E2E tests passed, and 0 TypeScript errors on client and server. |
| **Outcome** | Changes addressed and pushed to `feature/lab4-actions-taken-ui`. Reply comment posted on PR #74 requesting re-review. |

---

### PR #75 — Issue 7: Ticket Workflow UI and Resolution Feedback

| Field | Detail |
|---|---|
| **PR Link** | [https://github.com/il0lk3/TokTickIT/pull/75](https://github.com/il0lk3/TokTickIT/pull/75) |
| **Reviewer** | [@Achikan](https://github.com/Achikan) |
| **Review Verdict** | Changes Requested (Addressed) |
| **Review Feedback** | 1. **Resolution-gate "Log Action" shortcut is broken**: `document.querySelector('... , button:has-text("+ Log Action Taken")')` uses a Playwright pseudo-class throwing `SyntaxError` in browser DOM/JSDOM, and button lacked `aria-label`.<br>2. **"Review Actions Taken" banner button does nothing**: Called `document.getElementById("actions-taken-section")`, but section lacked matching `id` and `tabIndex={-1}`.<br>3. **Comment regression on `Resolved` tickets**: `isTerminal` was changed to `["Closed","Cancelled"]`, allowing comment/note inputs to render on `Resolved` tickets which API rejects with 400. Need to split `isWorkflowLocked` vs `isCommentLocked`.<br>4. **`badge-zen-primary` is undefined**: `getStatusBadgeClass("Open")` returns `badge-zen-primary`, which was missing in `index.css`.<br>5. **Missing test coverage for shortcuts**: `UI-WKF-03` and `UI-WKF-19` only asserted buttons exist without verifying focus/scroll and form opening.<br>6. **`AccessibleDialog` re-renders on inline `onClose`**: Effect re-ran on every render, re-toggling `modal-open`/`inert` and re-capturing previous focus. |
| **My Response / Actions Taken** | 1. **Robust Ref & Imperative Handle on `ActionsTakenSection`**: Converted `ActionsTakenSection` to `React.forwardRef<ActionsTakenSectionHandle>` with `openCreateForm()` and `focusSection()`, added `id="actions-taken-section"` and `tabIndex={-1}` to container, and added `id="log-action-btn"`, `data-testid="log-action-btn"`, and `aria-label="+ Log Action Taken"` to the button.<br>2. **Functional Banner & Shortcut Wiring**: Updated `TicketDetail.tsx` to invoke `actionsTakenRef.current?.openCreateForm()` and `actionsTakenRef.current?.focusSection()` with smooth scrolling and element focus; added safe fallback to DOM selector if ref is not yet mounted.<br>3. **Separated Lock Flags (`isWorkflowLocked` vs `isCommentLocked`)**: In `TicketDetail.tsx`, defined `isWorkflowLocked = ["Closed", "Cancelled"].includes(ticket.currentStatus)` for Owner/Claim/Priority controls, and `isCommentLocked = ["Resolved", "Closed", "Cancelled"].includes(ticket.currentStatus)` for public comments and internal notes. Added unit test `UI-WKF-16b` verifying comments are locked while workflow controls remain operational.<br>4. **Defined `.badge-zen-primary` in `index.css`**: Added `.badge-zen-primary` using `--zen-primary` palette with 10% background and 25% border opacity to render the `Open` badge crisply.<br>5. **Thorough Shortcut Test Assertions**: Updated `UI-WKF-03` to assert clicking "Assign Owner" shortcut focuses `#ownerSelect` and "Log Action" opens `#create-action-form`. Updated `UI-WKF-19` to assert clicking "Review Actions Taken" focuses `#actions-taken-section`.<br>6. **Stabilized `AccessibleDialog` Effect**: Refactored `AccessibleDialog` to store `onClose`, `isSubmitting`, and `initialFocusSafe` in refs and keyed `useEffect` on `[isOpen]` only, preventing re-execution and stale focus restoration on parent re-renders.<br>7. **Exhaustive Automated Verification**: 23/23 unit tests in `TicketWorkflow.test.tsx`, 102/102 client tests, 165/165 server tests, and 16/16 Lab 4 Playwright E2E tests passed. |
| **Outcome** | Approved and merged into `lab4-staging` by @Achikan (commit `320e8ce`) |

---

### PR #76 — Issue 8: Dashboard APIs (Requester and IT Staff)

| Field | Detail |
|---|---|
| **PR Link** | [https://github.com/il0lk3/TokTickIT/pull/76](https://github.com/il0lk3/TokTickIT/pull/76) |
| **Reviewer** | [@Achikan](https://github.com/Achikan) |
| **Review Verdict** | Pending Peer Review |
| **Review Feedback / Pre-Code Design Alignment** | Addressed all 8 pre-code feedback points from design review before coding:<br>1. **Card-to-List Count Consistency**: Drill-down query parameters align 1-to-1 with `/api/tickets` and `/api/staff/tickets` list filters (`status`, `ownerId=me`, `ownerId=unassigned`, `active=true`, `appearsResolved=true`, `updatedSince`).<br>2. **Single Aggregate Database Queries**: Aggregated status counts using Prisma `groupBy` and count queries rather than in-memory filtering.<br>3. **Server-Side RBAC Enforcement**: `requireRole(["REQUESTER"])` blocks IT Staff / Admin from Requester dashboard; `requireRole(["IT_STAFF", "ADMINISTRATOR"])` blocks Requesters from Staff dashboard with 403 Forbidden.<br>4. **Rolling UTC Time Windows**: 7 rolling days for `recentlyResolved` and 24 rolling hours for `recentlyUpdated` using millisecond offsets.<br>5. **Normalized Metric Maps**: `byPriority` guarantees `LOW`, `MEDIUM`, `HIGH`, `UNSET` keys; `byStatus` guarantees all 8 lifecycle statuses (all values >= 0).<br>6. **Admin-Only Sensitive Metrics**: `adminUserCounts` populated for Administrator only, `null` for IT Staff.<br>7. **Deterministic Tiebreaker Sorting**: Secondary `id DESC` sort order applied whenever `updatedAt` is tied.<br>8. **Direct SQL Query Equivalence**: Raw SQL comparisons verified in `API-DSH-10` and `API-DSH-21`; documented in evidence artifact. |
| **My Response / Actions Taken** | 1. Implemented `GET /api/dashboard/requester` and `GET /api/dashboard/staff` in [server/src/routes/dashboard.ts](file:///Users/karn/Downloads/toktickit/server/src/routes/dashboard.ts).<br>2. Mounted `dashboardRouter` under `/api/dashboard` in [server/src/app.ts](file:///Users/karn/Downloads/toktickit/server/src/app.ts).<br>3. Extended [server/src/routes/tickets.ts](file:///Users/karn/Downloads/toktickit/server/src/routes/tickets.ts) and [server/src/routes/staff.ts](file:///Users/karn/Downloads/toktickit/server/src/routes/staff.ts) with multi-status comma-separated parsing, `ownerId="me"`, `ownerId="unassigned"`, `active=true`, `appearsResolved=true`, `updatedSince`, and secondary `id DESC` sort order.<br>4. Authored comprehensive test suites: [requester-dashboard.api.test.ts](file:///Users/karn/Downloads/toktickit/server/tests/lab-04/requester-dashboard.api.test.ts) (`API-DSH-01` to `API-DSH-10`) and [staff-dashboard.api.test.ts](file:///Users/karn/Downloads/toktickit/server/tests/lab-04/staff-dashboard.api.test.ts) (`API-DSH-11` to `API-DSH-24`).<br>5. Created SQL comparison evidence document in [artifacts/lab-04/evidence/dashboard-sql-comparison.md](file:///Users/karn/Downloads/toktickit/artifacts/lab-04/evidence/dashboard-sql-comparison.md).<br>6. Verified 100% test pass: 189/189 server tests, 102/102 client tests, 0 build errors, zero emojis. |
| **Outcome** | Pushed to `feature/lab4-dashboard-api`; PR #76 submitted to `lab4-staging` for review. |









