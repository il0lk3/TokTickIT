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
| [#74](https://github.com/il0lk3/TokTickIT/pull/74) | Issue 6 — Actions Taken UI on Ticket Detail | `feature/lab4-actions-taken-ui` | Approved & Merged |
| [#75](https://github.com/il0lk3/TokTickIT/pull/75) | Issue 7 — Ticket Workflow UI and Resolution Feedback | `feature/lab4-ticket-workflow-ui` | Approved & Merged |
| [#76](https://github.com/il0lk3/TokTickIT/pull/76) | Issue 8 — Dashboard APIs (Requester and IT Staff) | `feature/lab4-dashboard-api` | Approved & Merged |
| [#77](https://github.com/il0lk3/TokTickIT/pull/77) | Issue 9 — Dashboard UIs, Navigation, and Drill-down | `feature/lab4-dashboard-ui` | Approved & Merged |
| [#78](https://github.com/il0lk3/TokTickIT/pull/78) | Issue 10 — Regression Hardening, Polish & Evidence | `feature/lab4-regression-hardening` | Approved & Merged |
| [#79](https://github.com/il0lk3/TokTickIT/pull/79) | Issue 11 — Visual, Responsive, and Accessibility Pass + Release Evidence | `feature/lab4-release-evidence` | Pending Review |

> *Note: PR #67 was prematurely merged during automated script setup before peer review; base branch `lab4-staging` was immediately reset to `main`, and the official deliverable was submitted in PR #69 for review by @Achikan.*

---

### PR #69 — Issue 1: Sprint 4 Engineering Contract (Spec DD + Test DD)

| Field | Detail |
|---|---|
| **PR Link** | [https://github.com/il0lk3/TokTickIT/pull/69](https://github.com/il0lk3/TokTickIT/pull/69) |
| **Reviewer** | [@Achikan](https://github.com/Achikan) |
| **Review Verdict** | Approved ([Review #5556815718](https://github.com/il0lk3/TokTickIT/pull/69#pullrequestreview-5556815718)) |
| **Review Comments** | 1. **Missing Advisory Resolution API & Schema:** Requester advisory-signal (`appearsResolved = true`) was missing in `api-spec.md` and `Ticket` schema in `specification.md`.<br>2. **Client Route Inconsistency:** Inconsistent path references between documents (`/staff/queue` vs `/queue`, `/staff/dashboard` vs `/dashboard`).<br>3. **Authorization Matrix Contradiction:** Section 5.1 marked "Create Ticket" as `No` for IT Staff and Admin, contradicting Section 11 and UI spec. |
| **My Response / Actions Taken** | 1. Added `PATCH /api/tickets/:id/appears-resolved` specification in [api-spec.md](./api-spec.md) with full validation, RBAC, and response schema. Added `appearsResolved Boolean @default(false)` to `Ticket` schema in [specification.md](./specification.md).<br>2. Standardized all frontend routes across [specification.md](./specification.md), [ui-spec.md](./ui-spec.md), and [api-spec.md](./api-spec.md) to use canonical paths (`/dashboard`, `/tickets`, `/tickets/new`, `/tickets/:ticketId`, `/queue`, `/admin/users`).<br>3. Updated Section 5.1 Authorization Matrix in [specification.md](./specification.md) for `Create Ticket` to `Yes (on behalf of user)` for both IT Staff and Administrator. |
| **Outcome** | Approved & Merged into `lab4-staging` by @Achikan |

---

### PR #70 — Issue 2: Database Increment — ActionTaken Model, Migration, Backfill, Seed

| Field | Detail |
|---|---|
| **PR Link** | [https://github.com/il0lk3/TokTickIT/pull/70](https://github.com/il0lk3/TokTickIT/pull/70) |
| **Reviewer** | [@Achikan](https://github.com/Achikan) |
| **Review Verdict** | Changes Requested ([Review #5557454686](https://github.com/il0lk3/TokTickIT/pull/70#pullrequestreview-5557454686)), addressed and approved |
| **Review Comments** | 1. **Missing Attachment Seeding in Clean Setup:** `server/prisma/seed.ts` lacked an `Attachment` seed, causing `API-MIG-01` to fail on fresh environments where `attachmentCount` starts at 0.<br>2. **Avoid Hardcoded IDs for Comments/Notes:** In `seed.ts`, comments and notes used fixed `id: 1` which can cause PK conflicts if database sequences diverge. |
| **My Response / Actions Taken** | 1. Added `upsertAttachment` helper to [seed.ts](../../server/prisma/seed.ts) and seeded a sample attachment (`duplexer-gear.png`) for Ticket 1.<br>2. Replaced hardcoded IDs with dynamic `upsertPublicComment` and `upsertInternalNote` lookup helpers, and added PostgreSQL sequence realignment (`setval`) across all tables at the end of seed execution. |
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
| **Review Comments** | 1. **Hardcoded Screenshot Output Paths in `actions-taken.spec.ts`**: Screenshots wrote to absolute paths (`/Users/karn/...`), which fails on CI or other developer environments.<br>2. **Responsive Breakpoint Contradiction (`991.98px` vs `767.98px`)**: CSS media query used `max-width: 991.98px` collapsing the table at tablet view (768px), contradicting UI Spec §5.2 and §7 stating tablets (>=768px) display the table view and only mobile (<768px) collapses to card layout.<br>3. **Missing Viewport Overflow Assertions on Tablet and Desktop in `E2E-ACT-06`**: E2E only asserted `scrollWidth <= clientWidth` on mobile (375px), missing verification for tablet (768px) and desktop (1280px), as well as table header visibility on tablet.<br>4. **`UI-ACT-04` Test & Doc Alignment**: `docs/lab-04/tests.md` stated handling of HTTP 200 duplicate responses gracefully, but the test suite lacked explicit unit assertion for idempotent 200 duplicate handling. |
| **My Response / Actions Taken** | 1. **Repo-Relative Paths in E2E**: Replaced all hardcoded absolute screenshot paths in [actions-taken.spec.ts](../../e2e/lab-04/actions-taken.spec.ts) with `path.resolve(__dirname, '../../artifacts/lab-04/screenshots/actions-taken')` with automatic directory creation via `fs.mkdirSync(..., { recursive: true })`.<br>2. **Tablet Responsive Breakpoint Fixed**: Changed `@media (max-width: 991.98px)` to `@media (max-width: 767.98px)` in [index.css](../../client/src/index.css) so tablets (>=768px) render the clean tabular view while mobile (<768px) collapses to cards.<br>3. **Comprehensive Viewport Overflow Assertions**: Added `expect(scrollWidth <= clientWidth)` assertions for Desktop (1280px), Tablet (768px), and Mobile (375px) in `E2E-ACT-06`, along with asserting `thead` visibility on tablet.<br>4. **UI-ACT-04B Test & Doc Alignment**: Added unit test `UI-ACT-04B` in [ActionsTaken.test.tsx](../../client/tests/lab-04/ActionsTaken.test.tsx) explicitly asserting graceful handling of HTTP 200 duplicate responses without UI errors; aligned description in [tests.md](./tests.md).<br>5. **UI Polish & Spacing**: Cleaned table headers in `ActionsTakenSection.tsx` by removing inline emoji icons and adding distinct cell division (`border-end border-light-subtle px-3`), and added `mb-4` margin below the top ticket details card in `TicketDetail.tsx` for visual separation.<br>6. **Full Suite Verification**: Verified 100% test pass rate: 10 client test suites (79/79 passed), 16 server test suites (165/165 passed), 6/6 Playwright E2E tests passed, and 0 TypeScript errors on client and server. |
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
| **Review Verdict** | Changes Requested ([Review #5571550643](https://github.com/il0lk3/TokTickIT/pull/76#pullrequestreview-5571550643)), addressed |
| **Review Feedback** | 1. **`urgentTickets` ordering contradicts contract**: `dashboard.ts` sorted by `ownerId ASC` first instead of `updatedAt DESC, id DESC`. Dropped `ownerId` and added ordering assertions in `API-DSH-16`.<br>2. **`active=true` overwrote `status` filter**: `where.currentStatus` was reassigned when `active=true`, discarding the `status` filter. Composed with `AND` array in `staff.ts` and `tickets.ts`.<br>3. **Internal spec consistency**: `specification.md` FR-07/FR-08 still used `openTickets`, staff `waitingForRequester`, and `Asia/Bangkok`. Aligned with `api-spec.md` (`openRequests`, `appearsResolved`, rolling UTC intervals).<br>4. **Response shape drift**: Staff lists lacked `category` and `requester.id`; requester lists lacked `category.id`. Selected complete objects matching spec.<br>5. **Evidence snippets alignment**: Updated `dashboard-sql-comparison.md` to reflect actual `prisma.ticket.count` queries instead of `groupBy`. |
| **My Response / Actions Taken** | 1. **Urgent Tickets Recency Sorting**: Updated `dashboard.ts:254` to sort strictly by `[{ updatedAt: "desc" }, { id: "desc" }]`. Added ordering assertions in `API-DSH-16` verifying chronological descent with secondary tiebreaker.<br>2. **Filter Composition with `where.AND`**: Refactored `staff.ts` and `tickets.ts` using `statusConditions` array so filtering with both `status` and `active=true` composes cleanly with `where.AND`. Added tests `API-DSH-16b` and `API-DSH-09b` verifying `?status=Open&active=true` and `?status=Closed&active=true`.<br>3. **Full Spec Synchronization**: Updated `docs/lab-04/specification.md` FR-07, FR-08, Section 6.1, and Section 11 to match `api-spec.md` (`openRequests`, `appearsResolved`, `myRecentTickets`, `urgentTickets`, and deterministic UTC millisecond rolling boundaries).<br>4. **Response Shape Precision**: Added `category: { select: { id: true, name: true } }` and `requester: { select: { id: true, name: true } }` to `myRecentTickets` and `urgentTickets`; added `category.id` to Requester `attentionTickets` and `recentTickets`.<br>5. **Evidence Documentation Polish**: Updated `artifacts/lab-04/evidence/dashboard-sql-comparison.md` application query snippets to reflect `prisma.ticket.count`.<br>6. **Suite Verification**: 191/191 server tests passed (26/26 dashboard tests), 102/102 client tests passed, and 0 TypeScript errors on client and server. |
| **Outcome** | Approved and merged into `lab4-staging` by @Achikan (commit `6cf6524`) |

---

### PR #77 — Issue 9: Dashboard UIs, Navigation, and Drill-down

| Field | Detail |
|---|---|
| **PR Link** | [https://github.com/il0lk3/TokTickIT/pull/77](https://github.com/il0lk3/TokTickIT/pull/77) |
| **Reviewer** | [@Achikan](https://github.com/Achikan) |
| **Review Verdict** | Changes Requested ([Review #5574123342](https://github.com/il0lk3/TokTickIT/pull/77#pullrequestreview-5574123342)), addressed |
| **Review Scope** | Requester & Staff/Admin Dashboard UIs, 1-to-1 Metric Drill-Down Parity (DoD-6), Active Filter Chips, Accessibility, Visual Evidence |
| **Review Feedback** | 1. **False empty states (both dashboards)**: `RequesterDashboard.tsx` computed "no tickets" by summing subset metrics excluding Cancelled and older Resolved tickets; `StaffDashboard.tsx` used overlapping subset metrics which hid the queue breakdown when active tickets existed.<br>2. **`UNSET` priority is a dead control**: `itPriority` is non-nullable (`TicketPriority @default(LOW)`). `byPriority.UNSET` was always 0 and filter was vacuous.<br>3. **Quick Actions missing**: Populated dashboards lacked Quick Action navigation buttons required by handout mockups and `specification.md`.<br>4. **`ui-spec.md` Attention Needed mismatch**: Stated `appearsResolved` but API returns only `WaitingForRequester`.<br>5. **Staff `recentlyUpdated` fallback drill-down**: Omitted `updatedSince`. |
| **My Response / Actions Taken** | 1. **Correct Empty State Criteria**: In `RequesterDashboard.tsx`, empty state is gated on `totalCount === 0 && recentTickets.length === 0`, ensuring requesters with cancelled or older resolved tickets retain full access to their ticket history and recent list. Added test `UI-DSH-05b`. In `StaffDashboard.tsx`, empty queue state is computed from active non-terminal statuses (`New`, `Open`, `InProgress`, `WaitingForRequester`, `Resolved`, `Reopened`) in `byStatus`, guaranteeing active tickets are never hidden.<br>2. **Dropped Dead `UNSET` Priority Control**: Removed `UNSET` priority across UI, API, test suites, and documentation per handout §7. Simplified `validItPriorities` to `["LOW", "MEDIUM", "HIGH"]` in `staff.ts`, normalized `byPriority` to `LOW`, `MEDIUM`, `HIGH` in `dashboard.ts`, removed obsolete `staff-queue-unset.api.test.ts`, and updated chip configurations.<br>3. **Added Quick Actions**: Integrated Quick Action navigation buttons in headers: Requester Dashboard (`+ Create Ticket` -> `/tickets/new`, `View My Tickets` -> `/tickets`); Staff Dashboard (`+ Create Ticket` -> `/tickets/new`, `Search Tickets` -> `/queue`, `My Queue` -> `/queue?ownerId=me&active=true`).<br>4. **Aligned `ui-spec.md`**: Corrected Attention Needed definition to `WaitingForRequester` requiring requester response.<br>5. **Added `updatedSince` Fallback**: Updated `recentlyUpdated` fallback query in `StaffDashboard.tsx` to include `updatedSince: ISO`.<br>6. **Full Suite Verification**: 191/191 server tests passed (18 files), 139/139 client tests passed (15 files), 7/7 Playwright dashboard E2E tests passed, 6/6 navigation E2E tests passed, and 0 TypeScript compilation errors on client and server. |
| **Outcome** | Changes addressed and pushed to `feature/lab4-dashboard-ui`. Reply posted on PR #77 requesting re-review. |

#### Reviewer Verification Commands

```bash
# 1. Verify Unit & Integration Tests (100% Pass)
npm test --prefix server
# Expected: 18 test files, 191 passed (100%)

npm test --prefix client
# Expected: 15 test files, 139 passed (100%)

# 2. Verify Playwright End-to-End Tests
npm test --prefix e2e -- lab-04/dashboards.spec.ts
# Expected: 7 passed (100%) - covers E2E-DSH-01 to E2E-DSH-07

npm test --prefix e2e -- lab-04/navigation.spec.ts
# Expected: 6 passed (100%) - covers routing and RBAC

# 3. Verify Zero Residual References to DashboardPlaceholder / DashboardShell
git grep "DashboardPlaceholder" client/src/
git grep "DashboardShell" client/src/
# Expected: 0 matches

# 4. Verify Zero Emojis in Workspace Code & Docs
git grep -P "[\x{1F300}-\x{1F6FF}\x{2600}-\x{26FF}\x{2700}-\x{27BF}]" client/src/ docs/lab-04/
# Expected: 0 matches
```

#### Screenshot Evidence Cross-Reference

| Viewport | State | Requester Dashboard | Staff / Admin Dashboard |
|---|---|---|---|
| Desktop (1280px) | Populated | `artifacts/lab-04/screenshots/requester-dashboard/01-overview-desktop.png` | `artifacts/lab-04/screenshots/staff-dashboard/01-overview-desktop.png` |
| Tablet (768px) | Populated | `artifacts/lab-04/screenshots/requester-dashboard/01-overview-tablet.png` | `artifacts/lab-04/screenshots/staff-dashboard/01-overview-tablet.png` |
| Mobile (375px) | Populated | `artifacts/lab-04/screenshots/requester-dashboard/01-overview-mobile-top.png` | `artifacts/lab-04/screenshots/staff-dashboard/01-overview-mobile-top.png` |
| Desktop (1280px) | Empty | `artifacts/lab-04/screenshots/requester-dashboard/20-empty-zero-state-desktop.png` | `artifacts/lab-04/screenshots/staff-dashboard/21-empty-zero-state-desktop.png` |
| Mobile (375px) | Empty | `artifacts/lab-04/screenshots/requester-dashboard/20-empty-zero-state-mobile.png` | `artifacts/lab-04/screenshots/staff-dashboard/21-empty-zero-state-mobile.png` |
| Desktop (1280px) | Error | `artifacts/lab-04/screenshots/requester-dashboard/22-error-retry-desktop.png` | `artifacts/lab-04/screenshots/staff-dashboard/23-error-retry-desktop.png` |
| Desktop (1280px) | Forbidden | N/A | `artifacts/lab-04/screenshots/staff-dashboard/22-forbidden-desktop.png` |

---

### PR #78 — Issue 10: Regression Hardening, Polish & Evidence

| Field | Detail |
|---|---|
| **PR Link** | [https://github.com/il0lk3/TokTickIT/pull/78](https://github.com/il0lk3/TokTickIT/pull/78) |
| **Reviewer** | [@Achikan](https://github.com/Achikan) |
| **Review Verdict** | Approved & Merged |
| **Review Scope** | Labs 1–4 Cross-Sprint Regression, Lab Sheet Section 8.5 Hardening, UNSET Dead Control Removal, E2E Concurrency & Multi-Viewport Quality Sweeps, Security & Latency Hardening, Traceability Verification |
| **Review Feedback Addressed** | 1. **Complete Removal of UNSET Dead Control**: Peer review identified remaining references in `TicketQueue.tsx` (`<option value="UNSET">`), `TicketQueueRoute.tsx` (`VALID_PRIORITIES`), and `api.ts` (`StaffDashboardResponse.byPriority.UNSET`).<br>2. **Labs 1–4 Cross-Sprint Regression Integration**: Verifying all historical features (attachments, comments vs internal notes isolation, cross-tenant authorization rejections, admin user management) work seamlessly together with zero regressions.<br>3. **Zero Skipped Tests Policy**: Removed all `test.skip` across E2E test files; isolated mutating test suites to Chromium and viewport sweeps to `quality-smoke.spec.ts`.<br>4. **Security & Error Hardening**: Implemented Express payload limits (1MB), JSON syntax error middleware (HTTP 400), disabled `x-powered-by`, unknown `/api/*` route 404 handler, and production error handler.<br>5. **Performance Latency**: Validated critical API endpoints complete under 500ms.<br>6. **Requirements & Test Traceability**: Automated traceability verifier confirming 100% of specification ACs and BRs map to test files on disk. |
| **My Response / Actions Taken** | 1. **Removed UNSET completely**: Dropped `<option value="UNSET">` from `TicketQueue.tsx`, removed `UNSET` from `VALID_PRIORITIES` in `TicketQueueRoute.tsx`, removed `UNSET` property from `StaffDashboardResponse.byPriority` in `api.ts`, and added unit test in `StaffTicketQueue.test.tsx` asserting only valid priorities (`LOW`, `MEDIUM`, `HIGH`) are rendered.<br>2. **E2E Cross-Sprint Regression Suite**: Created `e2e/lab-04/regression-lab1-3.spec.ts` testing attachments management, public comments vs internal notes isolation, cross-tenant 403/404 rejection, and admin user management with self-deactivation guard.<br>3. **E2E Multi-Session Concurrency**: Implemented `E2E-RES-03b` in `ticket-resolution.spec.ts` using two independent browser contexts editing the same ticket, proving real-time 409 conflict detection and recovery with zero skips.<br>4. **Quality & Smoke Sweep (quality-smoke.spec.ts)**: Validated Requester, IT Staff, and Administrator across all registered routes on Desktop Chromium (1280px), Tablet WebKit (iPad 768px), and Mobile Chromium (Pixel 5 375px), asserting zero console/page errors and valid DOM semantics.<br>5. **Security & Production Hardening**: Hardened `server/src/app.ts` with 1MB body limit, JSON parser error trap returning 400, disabled Express fingerprinting, added 404 for unknown `/api/*` routes, and verified with 4 automated security tests in `security-error-hardening.api.test.ts`.<br>6. **Performance Smoke Test**: Added `server/tests/lab-04/performance-smoke.api.test.ts` verifying warm endpoints return under 500ms (averaging < 50ms).<br>7. **Traceability Verification**: Added `scripts/verify-traceability.js` proving 100% of ACs, BRs, and test files exist on disk.<br>8. **Documentation**: Updated `README.md` with complete test accounts, universal password, clean database reset instructions, role demo walkthrough script (Rubric Parts 5–8), and accurate layout. |
| **Outcome** | Approved and merged into `lab4-staging` by @Achikan (Merge commit `465c7b2`). |

#### Reviewer Verification Commands

```bash
# 1. Run Complete Backend Test Suite (Lab 1–4)
npm test --prefix server
# Expected: 20 test files, 199 passed (100%), 0 failed

# 2. Run Complete Frontend Test Suite (Lab 2–4)
npm test --prefix client
# Expected: 15 test files, 140 passed (100%), 0 failed

# 3. Run Playwright E2E Suite (All Tests across Lab 3 and Lab 4)
npm test --prefix e2e
# Expected: 51 passed (100%), 0 skipped, 0 failed across Chromium, Tablet WebKit, Mobile Chromium

# Or target Lab 4 E2E tests specifically
npm test --prefix e2e -- lab-04
# Expected: 38 passed (100%)

# 4. Verify 100% Specification & Test Traceability (Bidirectional)
node scripts/verify-traceability.js
# Expected: 100% bidirectional traceability verified successfully

# 5. Verify Zero Skipped Tests Across E2E Workspace
git grep "test.skip" e2e/
# Expected: 0 matches

# 6. Verify Zero UNSET Dead Control References in Client Code
git grep "UNSET" client/src/
# Expected: 0 matches
```

---

#### Review 2 (Round 2 Feedback from @Achikan)

| Field | Detail |
|---|---|
| **Review Date** | 2026-10-20 |
| **Reviewer** | [@Achikan](https://github.com/Achikan) |
| **Review Verdict** | `CHANGES_REQUESTED` -> Addressed |
| **Review Comments** | 1. **Setup does not run without exported env vars**: Running `npm run dev` or `npm test` after copying `.env.example` to `.env` failed with missing `JWT_SECRET` because server had no `dotenv` loader.<br>2. **Traceability Table References Undefined Requirement IDs**: `tests.md` mapped rows to `Sec-1`, `Perf-1`, and `Rubric-8`, which were absent from `specification.md`, and mapped `API-SEC-01` to `AC-10`. Verifier only checked forward direction.<br>3. **Regression Suite Conditional Guard Issue**: `regression-lab1-3.spec.ts` wrapped note and comment creation in `if (await ...isVisible())`, silently skipping execution. `REG-01` only checked attachment file input existence without an upload/delete round-trip.<br>4. **README Demo Script Drift**: Staff dashboard documented legacy card names ("Total Open / In Progress...") instead of shipped cards (**Unassigned / Assigned to Me / Appears Resolved / Updated in 24h**), used `/queue?status=IN_PROGRESS` instead of `InProgress`, and missed 5 requester cards.<br>5. **Minor**: `specification.md` DoD and `tests.md` intro said "AC-01 through AC-13"; `tests.md:224` cited old test counts; `security-error-hardening.api.test.ts` case 4 only checked `/api` prefix rather than auth guard; verification commands used author-local paths; and `ai-use.md` attributed UNSET removal to Issue 9 instead of Issue 10. |
| **My Response / Actions Taken** | 1. **Automatic .env Loading**: Installed `dotenv` in `server`, created `server/src/env.ts` loading candidates from cwd, `./server/.env`, and `../.env` with development fallback. Configured `server/src/index.ts`, `server/src/app.ts`, `server/prisma/seed.ts`, and `server/vitest.config.ts` to load environment automatically without manual `export`.<br>2. **Spec Alignment & Bidirectional Verifier**: Added `AC-16` (Security Hardening) and `AC-17` (Performance Benchmarks) to `specification.md`. Mapped `API-SEC-01` and `API-DSH-24` to `AC-16`, `API-PRF-01` to `AC-17`, `E2E-REG-01` to `AC-13, DoD-3`, and `E2E-SMK-01` to `DoD-4, DoD-5`. Updated `scripts/verify-traceability.js` to strictly fail if any requirement ID in `tests.md` is undefined in `specification.md`.<br>3. **Real Regression Test Execution**: Refactored `regression-lab1-3.spec.ts`: `REG-01` performs a real PNG attachment upload and prompt-dialog deletion round-trip; `REG-02` unconditionally switches to the Internal Notes tab, posts a confidential note, and verifies strictly 0 instances on Requester view, followed by posting a public comment.<br>4. **README Demo Walkthrough Alignment**: Aligned Staff dashboard cards to shipped names (**Unassigned**, **Assigned to Me**, **Appears Resolved**, **Updated in 24h**), fixed drill-down query to `/queue?status=InProgress`, and updated Requester metrics to list all 5 cards with drill-down.<br>5. **Documentation & Tests Polish**: Updated `specification.md` DoD and `tests.md` intro to cite AC-01 through AC-17 and accurate test totals (199 server, 140 client, 51 E2E); updated `security-error-hardening.api.test.ts` case 4 to actively test 401 rejection on unauthenticated write routes; converted all verification commands to repo-relative paths; and updated `ai-use.md` to credit UNSET cleanup to Issue 10. |
| **Outcome** | All review items resolved cleanly. Verified 199/199 server, 140/140 client, and 51/51 E2E tests pass 100%. |

---

#### Review 3 (Round 3 Feedback from @Achikan)

| Field | Detail |
|---|---|
| **Review Date** | 2026-10-30 |
| **Reviewer** | [@Achikan](https://github.com/Achikan) |
| **Review Verdict** | `CHANGES_REQUESTED` -> Addressed |
| **Review Comments** | 1. **README Test Setup on Clean Clone**: Setup only installed `server` and `client`, missing `e2e` dependencies and Playwright browser binaries (`cd e2e && npm install` and `npx playwright install`). Also test execution commands did not chain with `cd ../client`.<br>2. **JWT Secret Fallback Scope**: `server/src/env.ts` fallback applied whenever `NODE_ENV !== "production"`, contradicting the strict hardening requirement and `README.md` ("no fallback, by design"). Must be restricted to `NODE_ENV === "test"` or fail fast.<br>3. **Nit on REG-04 Self-Deactivation Guard**: `regression-lab1-3.spec.ts` asserted self-deactivation inside an `if (await ...isVisible())` block. |
| **My Response / Actions Taken** | 1. **Reproducible Clean Setup & Chained Test Commands**: Added `cd ../e2e && npm install` and `npx playwright install` to Setup in `README.md`, and updated all test execution command blocks to chain seamlessly using `cd ../client`, `cd ../e2e`, and `cd .. && node scripts/verify-traceability.js`.<br>2. **Strict JWT Fallback Restricted to Automated Tests**: Updated `server/src/env.ts` so `JWT_SECRET` fallback applies strictly when `NODE_ENV === "test"`. Running the server without `JWT_SECRET` in `.env` now immediately fails fast with `FATAL ERROR: JWT_SECRET environment variable is missing.`, matching the hardened specification and aligned in `README.md`.<br>3. **Unconditional REG-04 Self-Deactivation Assertion**: Refactored `REG-04` in `e2e/lab-04/regression-lab1-3.spec.ts` to open the Edit modal for self and unconditionally assert that `Deactivate User` is visible and disabled, and the warning text "You cannot deactivate your own account." is displayed.<br>4. **Full Verification**: Ran server tests (199/199 passed), client tests (140/140 passed), Playwright regression suite (4/4 passed), and bidirectional traceability (100% passed). |
| **Outcome** | Approved and merged into `lab4-staging` by @Achikan (Merge commit `465c7b2`). |

---

### PR #79 — Issue 11: Visual, Responsive, and Accessibility Pass + Release Evidence

| Field | Detail |
|---|---|
| **PR Link** | [https://github.com/il0lk3/TokTickIT/pull/79](https://github.com/il0lk3/TokTickIT/pull/79) |
| **Reviewer** | [@Achikan](https://github.com/Achikan) |
| **Review Verdict** | Changes Addressed (Pending Re-review) |
| **Description** | 1. **Automated Evidence Suite**: Comprehensive Playwright test suite `e2e/lab-04/screenshots.spec.ts` capturing exactly 161 high-resolution evidence screenshots with `deviceScaleFactor: 2` across Desktop (1280x800), Tablet (768x1024), and Mobile (375x812) with zero empty/corrupt files.<br>2. **Staff Dashboard (`staff-dashboard/`, 42 images)**: Overview across 3 viewports, 4 operational metric cards, status breakdown chips, priority overview chips, urgent tickets table, my recent tickets table, role-difference proof (admin user counts vs staff view), 6 drill-down pairs with URL banners, loading skeleton, zero state, 403 forbidden, 500 retry, refresh success/failure, mobile nav, text wrapping, keyboard focus rings, and automated live PostgreSQL raw SQL equivalence matching.<br>3. **Requester Dashboard (`requester-dashboard/`, 37 images)**: Overview across 3 viewports, 5 requester metric cards, attention needed panel, empty attention state, recent activity list, quick actions, requester data isolation proof (Bob vs Pueng), 5 drill-down pairs, ticket detail clicks, cross-requester ticket forbidden 403/404, role forbidden queue 403, skeleton, zero tickets, retry, unauthenticated login redirect, refresh, and live PostgreSQL raw SQL equivalence evidence.<br>4. **Actions Taken (`actions-taken/`, 47 images)**: Single ticket with multiple actions by different actors (IT Staff 1, IT Staff 2), full column detail crop, staff/requester empty state, requester read-only view with zero write controls, admin controls, non-owner staff logging proof (BR-02), create form default/filled across 3 viewports, follow-up disclosure, 4 client validation errors (required, note, whitespace, future date), submitting spinner, success insertion, server error data preservation, field errors, 403 rejection, terminal locked rejection, inline edit mode across 3 viewports, edit validation across 3 viewports, edit success, cancel revert, 409 concurrency conflict dialog, locked closed/cancelled states, loading list skeleton, fetch error retry, tablet layout, and keyboard focus management.<br>5. **Workflow Transitions (`ticket-workflow/`, 27 images)**: Assign owner success across 3 viewports (desktop, tablet, mobile-top, mobile-bottom), inactive user rejection, non-eligible user rejection, role status options across New/InProgress/Resolved across 3 viewports, requester status control prohibition, resolution gate blocked warning banner, resolve success across 3 viewports, close confirmation dialog, cancel confirmation dialog, cancelled terminal lock across 3 viewports, concurrency conflict dialog, forbidden transition rejection, requester advisory button and confirm modal, staff advisory banner, and append-only audit proof.<br>6. **Regression Verification (`regression/`, 8 images)**: Representative proof across Labs 1-3 including login screen, My Tickets, public comments tab, attachments tab, internal notes tab for staff, internal notes tab hidden for requester, admin user management, and admin self-deactivation disabled. |
| **Peer Review Feedback (@Achikan)** | **Round 1 (`pullrequestreview-5734829384`)**:<br>1. Correct screenshot counts across PR description and documentation.<br>2. Add tablet + mobile captures for ticket-workflow and actions-taken, expand ui-spec.md §8 checklist.<br>3. Replace mocked SQL images with real PostgreSQL query results via `prisma.$queryRawUnsafe`.<br>4. Restore deterministic test fixtures via `scripts/reset-test-fixtures.cjs`.<br>5. Eliminate ungrounded visibility guards and assert non-empty screenshots.<br>6. Restore documentation links in `docs/lab-04/reviewer.md`.<br>7. Isolate screenshots suite under `@screenshots` with `npm run test:screenshots`.<br>**Round 2 (`issuecomment-6580423570`)**:<br>8. Update PR #78 detail `Outcome` line in `docs/lab-04/reviewer.md` so it matches "Approved & Merged" (`465c7b2`). |
| **My Response / Actions Taken** | 1. Synchronized all counts to exactly 161 images (Staff: 42, Requester: 37, Actions: 47, Workflow: 27, Regression: 8).<br>2. Added 15 responsive tablet/mobile captures and expanded `ui-spec.md §8` to 7 comprehensive subsections.<br>3. Implemented `scripts/get-sql-evidence.cjs` executing live raw SQL against database measuring genuine query duration.<br>4. Added `scripts/reset-test-fixtures.cjs` executed before each scenario.<br>5. Enforced `verifyScreenshotsGenerated()` asserting all 161 files exist and are > 1,000 bytes.<br>6. Pruned deleted image references in `reviewer.md` and removed temporary `plan-issue-11.md` to keep `docs/lab-04/` strictly aligned with Lab 4 Sheet §12.<br>7. Isolated screenshots execution under `RUN_SCREENSHOTS=true npm run test:screenshots --prefix e2e`.<br>8. Updated PR #78 detail `Outcome` in `docs/lab-04/reviewer.md` to reflect merge commit `465c7b2`. |


