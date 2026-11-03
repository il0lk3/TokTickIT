# Lab 4 Peer Review Record

A living document tracking the code review process. Reviews run in both directions with my partner.

## My Information

| Field | Detail |
|-------|--------|
| **Name** | Thanakorn Pahunrat |
| **Student ID** | 67070505217 |
| **GitHub** | [@il0lk3](https://github.com/il0lk3) |

---

## Peer Reviewer

| Field | Detail |
|-------|--------|
| **Reviewer Name** | Achiraya Inta |
| **Student ID** | 67070505229 |
| **Reviewer GitHub** | [@Achikan](https://github.com/Achikan) |

---

# Pull Requests I Authored

> My partner reviewed the following PRs that I submitted to `lab4-staging`.

| PR | Issue | Branch | Reviewer Verdict |
|---|---|---|---|
| [#69](https://github.com/il0lk3/TokTickIT/pull/69) | 1 — Sprint 4 Engineering Contract (Spec DD + Test DD) | `feature/lab4-specs` | Approved (after 1 revision) |
| [#70](https://github.com/il0lk3/TokTickIT/pull/70) | 2 — Database Increment — ActionTaken Model, Migration, Backfill, Seed | `feature/lab4-db-actions-taken` | Approved (after 1 revision) |
| [#71](https://github.com/il0lk3/TokTickIT/pull/71) | 3 — Actions Taken API and Authorization (TDD) | `feature/lab4-actions-taken-api` | Approved |
| [#72](https://github.com/il0lk3/TokTickIT/pull/72) | 4 — Ticket Workflow Rules and Conflict Handling (API) | `feature/lab4-ticket-workflow-api` | Approved (after 1 revision) |
| [#73](https://github.com/il0lk3/TokTickIT/pull/73) | 5 — Client Routing and Role-aware Application Shell | `feature/lab4-client-routing-shell` | Approved (after 1 revision) |
| [#74](https://github.com/il0lk3/TokTickIT/pull/74) | 6 — Actions Taken UI on Ticket Detail | `feature/lab4-actions-taken-ui` | Approved (after 1 revision) |
| [#75](https://github.com/il0lk3/TokTickIT/pull/75) | 7 — Ticket Workflow UI and Resolution Feedback | `feature/lab4-ticket-workflow-ui` | Approved (after 1 revision) |
| [#76](https://github.com/il0lk3/TokTickIT/pull/76) | 8 — Dashboard APIs (Requester and IT Staff) | `feature/lab4-dashboard-api` | Approved (after 1 revision) |
| [#77](https://github.com/il0lk3/TokTickIT/pull/77) | 9 — Dashboard UIs, Navigation, and Drill-down | `feature/lab4-dashboard-ui` | Approved (after 2 revisions) |
| [#78](https://github.com/il0lk3/TokTickIT/pull/78) | 10 — Final Regression, E2E, and Product Hardening | `feature/lab4-regression-hardening` | Approved (after 2 revisions) |
| [#79](https://github.com/il0lk3/TokTickIT/pull/79) | 11 — Visual, Responsive, and Accessibility Pass + Release Evidence | `feature/lab4-release-evidence` | Approved (after 2 revisions) |
| [#80](https://github.com/il0lk3/TokTickIT/pull/80) | Final Release — Promote Lab 4 Sprint to main | `lab4-staging` | Approved and merged |

> *Note: PR #67 was prematurely merged during initial automated script setup before peer review; base branch `lab4-staging` was immediately reset to `main`, and the official deliverable was submitted in PR #69 for review by @Achikan.*

<br>

### PR #69 — Issue 1: Sprint 4 Engineering Contract (Spec DD + Test DD)

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/il0lk3/TokTickIT/pull/69](https://github.com/il0lk3/TokTickIT/pull/69) |
| **Reviewer** | [@Achikan](https://github.com/Achikan) |
| **Review Comment** | Hi @il0lk3, great job putting together the Sprint 4 Engineering Contract! The overall structure is solid, covering all 11 required specification sections, the Resolution Gate, optimistic concurrency with `version`, and full traceability in `tests.md`.<br><br>However, based on the **Lab 4 handout** and internal consistency between the spec documents, there are a few discrepancies that need to be resolved before this can be approved:<br><br>1. **Missing Advisory Resolution API in `api-spec.md` & Schema in `specification.md`**: `specification.md` (FR-05, BR-08, Section 5.1 footnote) and `tests.md` (`API-WKF-09`) specify that Requesters can advisory-signal that a ticket appears resolved (`appearsResolved = true`), but `docs/lab-04/api-spec.md` completely omits this endpoint. Please document the HTTP method, endpoint path, authorization guard (Requester only), and request/response schema, and update the `Ticket` model in `docs/lab-04/specification.md` (Section 7.1) to include `appearsResolved Boolean @default(false)`.<br>2. **Client Route Inconsistency across Specs**: `ui-spec.md` (Section 2.2) & `specification.md` (Section 6.1) define `/dashboard` and `/queue`, while `ui-spec.md` (Section 2.1, Section 3) and `api-spec.md` (Section 4.2) use `/staff/dashboard` and `/staff/queue`. Please standardize client URLs across all documents.<br>3. **Authorization Matrix Contradiction on "Create Ticket" (`specification.md`)**: In Section 5.1, `Create Ticket` is marked as `No` for both `IT Staff` and `Administrator`, conflicting with Section 11, Section 6.1, and `ui-spec.md` (Section 2.1). Update Section 5.1 row for `Create Ticket` to `Yes (on behalf of users)` for IT Staff and Administrator.<br><br>**Re-review:** LGTM! Thanks for addressing the review comments promptly. All specs, API contracts, route mappings, and authorization rules are now consistent with the Lab 4 requirements. Approved! |
| **My Response** | ### Updates Addressed in Commit 856d8da<br>1. **Advisory Resolution Signal Endpoint & Schema**: Added `PATCH /api/tickets/:id/appears-resolved` specification in `docs/lab-04/api-spec.md` with requester ownership validation, terminal state guards, automatic advisory comment generation, and response schema. Added `appearsResolved Boolean @default(false)` to the `Ticket` Prisma model in `docs/lab-04/specification.md` (Section 7.1).<br>2. **Client Route Canonicalization**: Standardized all client routes across `docs/lab-04/specification.md`, `docs/lab-04/ui-spec.md`, `docs/lab-04/api-spec.md`, and `docs/lab-04/tests.md` to use canonical paths (`/dashboard`, `/tickets`, `/tickets/new`, `/tickets/:ticketId`, `/queue`, and `/admin/users`).<br>3. **Authorization Matrix Alignment**: Updated Section 5.1 in `docs/lab-04/specification.md` to permit IT Staff and Administrators to create tickets on behalf of users (`Yes (on behalf of user)`). |
| **Outcome** | Approved and merged (after 1 revision) |

---

### PR #70 — Issue 2: Database Increment — ActionTaken Model, Migration, Backfill, Seed

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/il0lk3/TokTickIT/pull/70](https://github.com/il0lk3/TokTickIT/pull/70) |
| **Reviewer** | [@Achikan](https://github.com/Achikan) |
| **Review Comment** | Hi @il0lk3, great work on the Database Increment for Sprint 4! The Prisma schema, migration, and seed data are very well structured and closely follow the Lab 4 handout requirements. Before this can be approved and merged into `lab4-staging`, there is one defect regarding test reproducibility on fresh environments that needs to be addressed:<br><br>1. **Missing `Attachment` Seeding Causes Failure in Clean Environments (`database-regression.test.ts` / API-MIG-01)**: In `server/tests/lab-04/database-regression.test.ts` (line 25), the test asserts `expect(attachmentCount).toBeGreaterThanOrEqual(1);`. However, `server/prisma/seed.ts` does not seed any `Attachment` records. If a clean database is initialized (`npx prisma migrate dev && npx prisma db seed`), `attachmentCount` is `0`, causing `database-regression.test.ts` to fail. Please update `server/prisma/seed.ts` to seed at least one sample `Attachment` (e.g. `duplexer-gear.png` for Ticket 1).<br>2. **Minor: Avoid Hardcoded IDs in Seed for Comments & Notes**: In `server/prisma/seed.ts`, `publicComment` and `internalNote` are upserted with hardcoded `id: 1`. In PostgreSQL, if sequences diverge, this can lead to primary key conflicts. Consider using a helper like `upsertActionTaken` or checking by content/ticket.<br><br>**Re-review:** LGTM! All review comments have been properly addressed, including the attachment seeding for fresh environments, dynamic comment/note upserts, and PostgreSQL sequence alignments. Approved! |
| **My Response** | ### Updates Addressed in Commit 56688ab<br>1. **Attachment Seeding in Clean Setup**: Added `upsertAttachment` helper to `server/prisma/seed.ts` and seeded a sample attachment (`duplexer-gear.png`) under Ticket 1 so `database-regression.test.ts` (`API-MIG-01`) passes reliably on fresh environments initialized from scratch.<br>2. **Dynamic Comment & Note Seeding without Hardcoded IDs**: Replaced fixed `id: 1` with dynamic `upsertPublicComment` and `upsertInternalNote` lookup helpers, and added automatic PostgreSQL sequence realignment (`setval`) across `User`, `Ticket`, `ActionTaken`, `Attachment`, `PublicComment`, and `InternalNote` tables at the end of seed execution to prevent primary key collisions. |
| **Outcome** | Approved and merged (after 1 revision) |

---

### PR #71 — Issue 3: Actions Taken API and Authorization (TDD)

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/il0lk3/TokTickIT/pull/71](https://github.com/il0lk3/TokTickIT/pull/71) |
| **Reviewer** | [@Achikan](https://github.com/Achikan) |
| **Review Comment** | LGTM! The Actions Taken API implementation is thorough, clean, and fully compliant with the Lab 4 handout and specifications. Role authorization, terminal status guards, follow-up validations, session-bound performer derivations, and 5-second duplicate protection are all properly enforced and backed by 27 passing tests. Excellent work! Approved! |
| **My Response** | *(No response needed — approved on first review)* |
| **Outcome** | Approved and merged |

---

### PR #72 — Issue 4: Ticket Workflow Rules and Conflict Handling (API)

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/il0lk3/TokTickIT/pull/72](https://github.com/il0lk3/TokTickIT/pull/72) |
| **Reviewer** | [@Achikan](https://github.com/Achikan) |
| **Review Comment** | Hi @il0lk3, outstanding job implementing the Ticket Workflow Rules and Conflict Handling for Issue 4! Before this can be approved and merged into `lab4-staging`, there are two points to address:<br><br>1. **Guard against Ineligible Owner in `POST /api/staff/tickets/:id/claim` (BR-12)**: Since `staffRouter` now allows both `IT_STAFF` and `ADMINISTRATOR` (BR-13), an Administrator can call `POST /api/staff/tickets/:id/claim`. In `/claim`, `dataToUpdate.ownerId = userId` is set without role checking. Per **BR-12**, `Ticket.ownerId` is strictly restricted to active users with role `IT_STAFF`. If an Administrator claims a ticket, it assigns an Admin as owner, which subsequently causes `computeResolutionGate` (`effectiveOwner.role === 'IT_STAFF'`) to fail when attempting to resolve the ticket. Verify that the caller is an active IT Staff member (`ASSIGNEE_NOT_ELIGIBLE`).<br>2. **Validate Non-Empty Update Payload in `PATCH /api/staff/tickets/:id`**: If a client submits a payload containing only `{ expectedVersion: 1 }` without specifying `ownerId`, `itPriority`, or `status`, the server currently executes the update, increments `version`, and touches `updatedAt`. Add a guard verifying that at least one operational field is provided; otherwise, reject with `400 Bad Request` (`code: "NO_FIELDS_TO_UPDATE"`).<br><br>**Re-review:** LGTM! Both the claim owner eligibility guard (BR-12) and the empty update payload validation have been properly implemented and verified with tests. Approved! |
| **My Response** | Thank you for the review and constructive feedback. Both points have been resolved in commit `212baa2`:<br>1. **Ineligible Owner Guard in Claim Endpoint (BR-12)**: Added checks in `POST /api/staff/tickets/:id/claim` to verify that the caller is an active `IT_STAFF` member (`ASSIGNEE_NOT_ELIGIBLE` if non-`IT_STAFF`, `INACTIVE_ASSIGNEE_REJECTED` if inactive).<br>2. **Empty Update Payload Guard in Staff Ticket PATCH**: Added validation in `PATCH /api/staff/tickets/:id` ensuring at least one operational field (`ownerId`, `itPriority`, or `status`) is present alongside `expectedVersion` (`400 NO_FIELDS_TO_UPDATE`).<br>3. **Automated Tests**: Added `API-WKF-VAL-07` and `API-WKF-OWN-04` in `server/tests/lab-04/ticket-workflow.api.test.ts` (38/38 workflow tests pass). |
| **Outcome** | Approved and merged (after 1 revision) |

---

### PR #73 — Issue 5: Client Routing and Role-aware Application Shell

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/il0lk3/TokTickIT/pull/73](https://github.com/il0lk3/TokTickIT/pull/73) |
| **Reviewer** | [@Achikan](https://github.com/Achikan) |
| **Review Comment** | **Request Changes** — Overall this is solid foundational work — routing architecture, route guards, URL-as-source-of-truth for filters, and test coverage are all well-structured. However, there are 3 correctness issues and 2 minor suggestions that need to be fixed before merging:<br><br>1. **`AppRoutes` `useEffect` — loading state flash on session restore (`client/src/App.tsx`)**: The `useEffect` depends on the full `user` object. On mount, `user` goes `null` -> `AuthUser`, which triggers a brief spinner flash on page reload even when the session is already valid. Change the dependency to `user?.id`.<br>2. **`DashboardShell` is a navigation shortcut, not a real dashboard (`client/src/components/dashboard/DashboardShell.tsx`)**: Either implement the actual metric cards fetching from `/api/dashboard/*`, or explicitly rename the component to `DashboardPlaceholder` and add a `// TODO(issue-9): implement dashboard metrics` comment.<br>3. **`TicketQueueRoute` (and `MyTicketsRoute`) — contradictory controlled/uncontrolled prop contract**: Both `initial*` seed props and live controlled props are passed for the same filter fields. Drop all `initial*` props and have `TicketQueue`/`MyTickets` derive their displayed state entirely from the live props on every render.<br>4. **Minor — Clean up orphaned `RequesterContext`**: Run `grep -r "useRequester" client/src/` to confirm no component still imports it.<br>5. **Minor — `NotFound` icon color**: `NotFound.tsx` uses `bg-success bg-opacity-10 text-success` (green) for the error icon — consider a neutral `text-muted` / gray background.<br><br>**Re-review:** All requested changes addressed cleanly in commit `5d3ee41`. `useEffect` dependency fix, `DashboardPlaceholder` rename with TODO, controlled-only filter props, orphaned context confirmed clean, and `NotFound` icon updated. All 60 client tests, 165 server tests, and 6 E2E tests pass. LGTM! |
| **My Response** | Thank you @Achikan for the thoughtful review and feedback. All requested changes and suggestions have been addressed in commit `5d3ee41`:<br>1. **`AppRoutes` `useEffect` loading flash resolved**: Updated dependency array from `[user]` object reference to `[user?.id, user?.requiresPasswordChange]`.<br>2. **Dashboard Component Naming**: Renamed component to `DashboardPlaceholder` (`DashboardPlaceholder.tsx`) with explicit `// TODO(issue-9)` comment.<br>3. **Controlled Filter State Contract**: Removed all `initial*` seed props across `TicketQueueRoute.tsx`, `MyTicketsRoute.tsx`, `TicketQueue.tsx`, and `MyTickets.tsx`, deriving filter state directly from live URL-driven props.<br>4. **Orphaned `RequesterContext` Check**: Confirmed zero imports or usages in `client/src/`.<br>5. **`NotFound` Icon Styling**: Updated the 404 error icon container class to `bg-secondary bg-opacity-10 text-muted`. |
| **Outcome** | Approved and merged (after 1 revision) |

---

### PR #74 — Issue 6: Actions Taken UI on Ticket Detail

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/il0lk3/TokTickIT/pull/74](https://github.com/il0lk3/TokTickIT/pull/74) |
| **Reviewer** | [@Achikan](https://github.com/Achikan) |
| **Review Comment** | Requesting changes — two blockers plus a couple of alignments.<br><br>**Blocking**<br>1. E2E screenshot paths are hardcoded to your machine: `e2e/lab-04/actions-taken.spec.ts` uses `/Users/karn/Downloads/toktickit/artifacts/...`. This fails on the reviewer machine/CI. Use `testInfo.outputPath()` or a repo-relative path.<br>2. Responsive breakpoint contradicts ui-spec §5.2/§7: `.actions-table-responsive` switches to cards at `max-width: 991.98px`, so 768–991px (tablet) shows cards, and the "tablet" screenshot is actually cards. Spec requires a table >=768px and cards <768px. Change to `767.98px` or update the spec and justify.<br><br>**Should fix**<br>3. `E2E-ACT-06` title claims 375/768/1280 but only asserts `scrollWidth <= clientWidth` at 375px — add the same assertion at 768 and 1280.<br>4. `docs/lab-04/tests.md` `UI-ACT-04` says "handles 200 duplicate responses gracefully", but the test only asserts a single 201 submission. Add the dedup (200) case or fix the doc.<br><br>**Re-review:** All four items addressed: repo-relative screenshot paths, breakpoint corrected to 767.98px, overflow/thead assertions at 1280/768/375, and UI-ACT-04B + doc alignment. LGTM — approved. |
| **My Response** | Hi @Achikan, I have addressed all 4 review items:<br>1. **Repo-Relative Screenshot Paths**: Replaced hardcoded paths in `e2e/lab-04/actions-taken.spec.ts` with `path.resolve(__dirname, '../../artifacts/lab-04/screenshots/actions-taken')` and automated directory creation via `fs.mkdirSync(..., { recursive: true })`.<br>2. **Tablet Viewport Breakpoint**: Corrected `.actions-table-responsive` media query in `client/src/index.css` from `max-width: 991.98px` to `max-width: 767.98px`.<br>3. **Viewport Overflow & Tablet Table Assertions**: Expanded `E2E-ACT-06` to assert zero horizontal scroll across Desktop (1280px), Tablet (768px), and Mobile (375px), plus `thead` visibility on tablet.<br>4. **`UI-ACT-04B` Graceful 200 Duplicate Test**: Added dedicated unit test `UI-ACT-04B` in `client/tests/lab-04/ActionsTaken.test.tsx` and aligned `docs/lab-04/tests.md`. |
| **Outcome** | Approved and merged (after 1 revision) |

---

### PR #75 — Issue 7: Ticket Workflow UI and Resolution Feedback

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/il0lk3/TokTickIT/pull/75](https://github.com/il0lk3/TokTickIT/pull/75) |
| **Reviewer** | [@Achikan](https://github.com/Achikan) |
| **Review Comment** | Requesting changes — the workflow core is solid, but two Issue 7 shortcuts are non-functional and there is a comment regression.<br><br>**Blocking**<br>1. **Resolution-gate "Log Action" shortcut is broken.** In `TicketDetail.tsx`, `document.querySelector('... , button:has-text("+ Log Action Taken")')` uses a Playwright-only pseudo-class, so `querySelector` throws `SyntaxError`; on top of that, no button has `aria-label="+ Log Action Taken"`. Clicking "Log Action" never opens the create form. Use a ref / `useImperativeHandle` on `ActionsTakenSection`, or a `data-testid`.<br>2. **"Review Actions Taken" banner button does nothing.** It calls `document.getElementById("actions-taken-section")`, but `ActionsTakenSection` only sets `data-testid="actions-taken-section"` — there is no matching `id`, and the div has no `tabIndex`, so `focus()` would fail anyway. Spec §6.2/§6.4 require scroll + focus. Add `id="actions-taken-section"` and `tabIndex={-1}` (or use a ref).<br>3. **Comment regression on `Resolved` tickets.** `isTerminal` was changed to `["Closed","Cancelled"]`, so the comment and internal-note inputs now render for `Resolved` tickets, but the API still rejects them (`terminalStatuses = ["Resolved","Closed","Cancelled"]` -> 400). Split the flags: `isWorkflowLocked` (Closed/Cancelled) vs `isCommentLocked` (Resolved/Closed/Cancelled).<br>4. **`badge-zen-primary` is undefined.** `getStatusBadgeClass("Open")` returns `badge-zen-primary`, but `index.css` only defines success/warning/danger/info/secondary.<br><br>**Should fix**<br>5. The tests don't cover the broken paths: `UI-WKF-03` and `UI-WKF-19` only assert the buttons exist. Add assertions that clicking "Assign Owner" focuses `#ownerSelect`, and clicking "Log Action" / "Review Actions Taken" scrolls/focuses `#actions-taken-section` and opens the create form.<br>6. `AccessibleDialog`'s effect depends on the inline `onClose` (new identity every render), so it re-runs on each render. Stabilize with `useCallback`/refs and keep the effect keyed on `isOpen` only.<br><br>**Re-review:** Verified all fixes: ref-based shortcuts, `#actions-taken-section` + `tabIndex`, split `isWorkflowLocked`/`isCommentLocked`, `.badge-zen-primary`, the expanded `UI-WKF-03`/`16b`/`19` tests, and the `[isOpen]`-keyed dialog effect. LGTM — approving and merging. |
| **My Response** | @Achikan Thank you for the thorough and high-leverage review! All requested changes (both blocking and non-blocking) have been resolved:<br>1. **Resolution-gate "Log Action" shortcut**: Converted `ActionsTakenSection` to `React.forwardRef<ActionsTakenSectionHandle>` exposing `openCreateForm()` and `focusSection()`, and added `id="actions-taken-section"` and `tabIndex={-1}`.<br>2. **"Review Actions Taken" banner button**: Wired to `actionsTakenRef.current?.focusSection()` with safe DOM fallback.<br>3. **Comment/Note locking on `Resolved` tickets**: Split `isWorkflowLocked` (`Closed`, `Cancelled`) and `isCommentLocked` (`Resolved`, `Closed`, `Cancelled`) so workflow transitions (`Close`, `Reopen`) remain interactive on `Resolved` tickets while comment/note forms are locked.<br>4. **Added `.badge-zen-primary` in `index.css`**.<br>5. **Extended Unit Tests**: Updated `UI-WKF-03` and `UI-WKF-19` to assert focus and form opening, and added `UI-WKF-16b`.<br>6. **Stabilized `AccessibleDialog` Effect**: Stored callbacks in refs and keyed `useEffect` strictly on `[isOpen]`. |
| **Outcome** | Approved and merged (after 1 revision, merge commit `320e8ce`) |

---

### PR #76 — Issue 8: Dashboard APIs (Requester and IT Staff)

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/il0lk3/TokTickIT/pull/76](https://github.com/il0lk3/TokTickIT/pull/76) |
| **Reviewer** | [@Achikan](https://github.com/Achikan) |
| **Review Comment** | Requesting changes — the implementation is solid (I ran the full server suite against a fresh migrated + seeded DB: **189/189 passed**, including the 24 new dashboard tests), but a few contract/consistency issues should be fixed.<br><br>**Please fix**<br>1. **`urgentTickets` ordering contradicts the documented contract.** `server/src/routes/dashboard.ts:254` sorts by `ownerId ASC` first, but `api-spec.md` §4.2 documents `updatedAt DESC, id DESC`, and the inline comment says "unassigned first". In PostgreSQL, `ASC` puts `NULL` **last**, so unassigned tickets actually appear last and the list is not recency-ordered. Drop the `ownerId` key and add an ordering assertion to `API-DSH-16`.<br>2. **`active=true` silently discards the `status` filter.** In both `server/src/routes/staff.ts:122-123` and `server/src/routes/tickets.ts:377-378`, the `active` branch reassigns `where.currentStatus`, overwriting the status filter set a few lines earlier. Compose these with `AND`/`where.AND` instead of reassigning.<br>3. **Spec docs are now internally inconsistent.** `docs/lab-04/specification.md` FR-07/FR-08 (and the §6 appendix) still list `openTickets` and a staff `waitingForRequester` metric, while `api-spec.md` now uses `openRequests` and removes that metric in favor of `byStatus`. §5 also still says `Asia/Bangkok` for date boundaries, but the PR changes the convention to UTC rolling millisecond windows. Update `specification.md`.<br>4. **Response shape drifts from `api-spec.md` §4.** The staff `myRecentTickets`/`urgentTickets` queries don't select `category` or `requester.id`, and the requester lists return `category.name` without `category.id`.<br>5. **Nit**: `artifacts/lab-04/evidence/dashboard-sql-comparison.md` shows `prisma.ticket.groupBy` as the requester implementation, but the code uses per-status `count` queries.<br><br>**Re-review:** Verified all fixes: `urgentTickets` is now `updatedAt DESC, id DESC`, `status+active` compose via `where.AND`, spec docs are synchronized, response shapes include `category`/`requester.id`, and the evidence snippets match the code. Re-ran the full server suite on a fresh migrated+seeded DB: **191/191 passed**. LGTM — approving and merging. |
| **My Response** | All requested changes and feedback items have been addressed in commit `c44166a`:<br>1. **Urgent Tickets Recency Sorting**: Updated `server/src/routes/dashboard.ts` to sort strictly by `[{ updatedAt: 'desc' }, { id: 'desc' }]` and added ordering assertions in `API-DSH-16`.<br>2. **Filter Composition with `where.AND`**: Refactored filter logic in `server/src/routes/staff.ts` and `server/src/routes/tickets.ts` using a composed `statusConditions` array under `where.AND`. Added unit tests `API-DSH-16b` and `API-DSH-09b`.<br>3. **Internal Spec Consistency**: Synchronized `docs/lab-04/specification.md` (FR-07, FR-08, Section 6.1, Section 11) with `api-spec.md`.<br>4. **Response Shape Precision**: Included `category: { select: { id: true, name: true } }` and `requester: { select: { id: true, name: true } }` in staff lists, and `category.id` in requester lists.<br>5. **Evidence Snippets Alignment**: Aligned `artifacts/lab-04/evidence/dashboard-sql-comparison.md` with `prisma.ticket.count`. |
| **Outcome** | Approved and merged (after 1 revision, merge commit `6cf6524`) |

---

### PR #77 — Issue 9: Dashboard UIs, Navigation, and Drill-down

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/il0lk3/TokTickIT/pull/77](https://github.com/il0lk3/TokTickIT/pull/77) |
| **Reviewer** | [@Achikan](https://github.com/Achikan) |
| **Review Comment** | Request changes — I ran both suites on a fresh migrated + seeded DB (**server 193/193, client 138/138, `tsc` clean**), so the plumbing is solid. A few correctness/spec issues:<br><br>1. **False empty states (both dashboards).** `RequesterDashboard.tsx` computes "no tickets" by summing the five metric subsets, which excludes `Cancelled` and `Resolved` older than 7 days. `StaffDashboard.tsx` uses `totalActiveQueue` = overlap of subset metrics, hiding the `byStatus`/`byPriority` breakdown when active tickets exist outside those 4 cards. Derive "no active work" from `byStatus` (non-terminal statuses) instead.<br>2. **`UNSET` priority is a dead control.** `itPriority` is non-nullable (`TicketPriority @default(LOW)`), so `byPriority.UNSET` is always 0. Drop `UNSET` from the UI/API/tests (handout §7: remove obsolete controls).<br>3. **Quick Actions are missing.** Handout mockups page 5/6 and `specification.md` FR-07 / §6 require quick actions (staff: Create Ticket / Search / My Queue; requester: Create Ticket / View My Tickets).<br>4. **Minor**: `ui-spec.md:139` defines Attention Needed as `WaitingForRequester` or `appearsResolved === true`, but `/api/dashboard/requester` returns only `WaitingForRequester`.<br>5. **Minor**: Staff `recentlyUpdated` fallback drill-down omits `updatedSince`.<br><br>**Follow-up Review:** Items 1, 3, 4 and 5 look properly fixed. One leftover on item 2 — `TicketQueue.tsx:332` still renders `<option value="UNSET">Unset</option>`, `TicketQueueRoute.tsx:13` still whitelists `UNSET`, and `api.ts:645` still declares `UNSET: number`. Approved — merging per request, with the remaining 3-line `UNSET` cleanup tracked in Issue 10 (#78). |
| **My Response** | @Achikan Thank you for the review! All 5 items have been addressed:<br>1. **Fixed False Empty States (Both Dashboards)**: Gated Requester empty state on `totalCount === 0 && recentTickets.length === 0` (added test `UI-DSH-05b`) and computed Staff active queue state from non-terminal statuses in `byStatus`.<br>2. **Dropped Dead `UNSET` Priority Control (Handout §7)**: Removed `UNSET` across dashboard UI, `staff.ts`, `dashboard.ts`, test suites, and documentation, and completed the remaining `TicketQueue.tsx` / `TicketQueueRoute.tsx` / `api.ts` cleanup in PR #78.<br>3. **Added Quick Actions to Dashboards**: Integrated header Quick Action buttons on both Requester and Staff/Admin dashboards.<br>4. **Aligned `ui-spec.md` Attention Needed Definition** and **Added `updatedSince` to Staff Fallback Query**. |
| **Outcome** | Approved and merged (after 2 revisions) |

---

### PR #78 — Issue 10: Final Regression, E2E, and Product Hardening

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/il0lk3/TokTickIT/pull/78](https://github.com/il0lk3/TokTickIT/pull/78) |
| **Reviewer** | [@Achikan](https://github.com/Achikan) |
| **Review Comment** | **Round 1 (`CHANGES_REQUESTED`):** Good work overall, and thanks for also closing out the #77 leftover: `UNSET` is now fully gone (`git grep UNSET client/src` = 0). What I verified on `3acb6fb` with a fresh migrated + seeded DB: server **199/199**, client **140/140**, `tsc` clean on both, `verify-traceability.js` exits 0. A few items need fixing:<br>1. **The documented setup does not actually run (blocking, §8.5)**: Following the README (`cp .env.example .env`, set `JWT_SECRET`, `npm run dev`) fails immediately with `FATAL ERROR: JWT_SECRET environment variable is missing` because the server never loads `.env`.<br>2. **Traceability table points at requirements that don't exist (Part 3 / §10)**: `tests.md` maps rows to `Sec-1`, `Perf-1`, and `Rubric-8` — none are defined in `specification.md` — and maps `API-SEC-01` / `E2E-SMK-01` to `AC-10`. Map these to real AC/DoD items and make the script fail on IDs present in `tests.md` but absent from the spec.<br>3. **The regression suite can pass without testing the regression (Part 8)**: `regression-lab1-3.spec.ts` `REG-02` wraps the internal-note and public-comment steps in `if (await ...isVisible())`, and `REG-01` only checks that `input[type=file]` exists without uploading/removing an attachment.<br>4. **README demo script describes controls that don't exist (§8.5)**: Align the walkthrough with the shipped Staff (**Unassigned / Assigned to Me / Appears Resolved / Updated in 24h**) and Requester cards and `/queue?status=InProgress`.<br>5. **Minor**: Update AC counts (`AC-01 through AC-17`), test counts (`199/140/51`), `security-error-hardening.api.test.ts` case 4, repo-relative paths in `reviewer.md`, and `UNSET` attribution in `ai-use.md`.<br><br>**Round 2 (`CHANGES_REQUESTED`):** The four blocking items from my previous review are addressed. Two §8.5 items still need a small fix:<br>1. **README test setup is not reproducible on a clean clone**: Add `cd e2e && npm install` and `npx playwright install` to Setup (and use `cd ../client` where the test commands chain).<br>2. **`server/src/env.ts:24` hardcodes a fallback JWT secret** whenever `NODE_ENV !== "production"`. Restrict it to `NODE_ENV === "test"` or fail fast.<br>3. **Nit**: Make `REG-04` self-deactivation assertion unconditional.<br><br>**Round 3 (`APPROVED`):** All three items are addressed in `01a0a08`: clean-clone setup now installs E2E deps/browsers with chained commands, the JWT fallback is restricted to `NODE_ENV === "test"`, and `REG-04` asserts self-deactivation unconditionally. README is now consistent with the shipped behavior. Approved — merging. |
| **My Response** | **Round 1 Response:**<br>1. **Automatic `.env` Loading**: Installed `dotenv` in `server` and created `server/src/env.ts` imported at the top of `index.ts`, `app.ts`, `seed.ts`, and `vitest.config.ts`.<br>2. **Bidirectional Traceability Enforcement**: Added `AC-16` (Security Hardening) and `AC-17` (Performance Benchmarks) to `specification.md`, remapped `tests.md`, and updated `scripts/verify-traceability.js` to fail on any undefined requirement ID.<br>3. **Unconditional Regression Round-Trips**: Updated `REG-01` to upload and soft-delete a real PNG attachment and `REG-02` to unconditionally post an internal note and public comment.<br>4. **README & Docs Sync**: Aligned dashboard card names, `/queue?status=InProgress`, test totals (`199/140/51`), and repo-relative commands.<br><br>**Round 2 Response (`01a0a08`):**<br>1. **Clean Clone Setup**: Added `cd ../e2e && npm install` and `npx playwright install` to Setup step 1 in `README.md` with chained `cd ../client` / `cd ../e2e` commands.<br>2. **Strict JWT Fallback**: Restricted `JWT_SECRET` fallback in `server/src/env.ts` strictly to `process.env.NODE_ENV === "test"`.<br>3. **Unconditional `REG-04`**: Refactored `REG-04` to open the Edit modal for `e2e.admin@example.com` and unconditionally assert that `Deactivate User` is visible and disabled. |
| **Outcome** | Approved and merged into `lab4-staging` by @Achikan (Merge commit `465c7b2`). |

---

### PR #79 — Issue 11: Visual, Responsive, and Accessibility Pass + Release Evidence

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/il0lk3/TokTickIT/pull/79](https://github.com/il0lk3/TokTickIT/pull/79) |
| **Reviewer** | [@Achikan](https://github.com/Achikan) |
| **Review Comment** | **Round 1 (`CHANGES_REQUESTED`):** Reviewed against the Lab 4 handout (§12 file structure, Part 9, and the Part 5/8 evidence requirements). The coverage and 2x capture setup are good, and `node scripts/verify-traceability.js` passes 100%. But I’d like the following fixed before merge:<br>1. **Screenshot counts are wrong.** The branch contains **146** images (staff 42 / requester 37 / actions 41 / workflow 18 / regression 8), not 164. Please correct the PR description, `docs/lab-04/reviewer.md`, and `docs/lab-04/ai-use.md`.<br>2. **Part 9 coverage is incomplete.** `artifacts/lab-04/screenshots/ticket-workflow/` is desktop-only (18 images); there are no tablet/mobile captures for a major Lab 4 screen. Please add tablet + mobile evidence for the workflow screen (and key Actions Taken states), and extend the `ui-spec.md` §8 checklist.<br>3. **The SQL equivalence images are not real query results.** `createSqlEvidenceImage()` renders manually entered `prismaCount`/`sqlCount` values into HTML via `page.setContent()`. Please capture real `prisma.$queryRaw` output or the actual `API-DSH-21` test result.<br>4. **The evidence suite is not deterministic.** Please reset fixtures per test (`scripts/reset-test-fixtures.cjs`).<br>5. **The suite can pass while evidence is missing.** Use `expect(locator).toBeVisible()` / `waitForResponse()`, remove silent catches, and add a final assertion that every expected screenshot exists and is non-empty.<br>6. **Docs and old screenshot references are broken.** Clean up deleted screenshot links in `docs/lab-04/reviewer.md` and align PR #78 status.<br>7. **`screenshots.spec.ts` runs in the default E2E suite.** Isolate it under `@screenshots` and document the regeneration command.<br><br>**Round 2 Comment (`issuecomment-6580423570`):** Almost there — one docs inconsistency left before I can approve/merge. In `docs/lab-04/reviewer.md`, the #78 detail `Outcome` still says “Changes submitted in PR #78 targeting `lab4-staging`” even though the verdict is “Approved & Merged” (Round 3 says merged in `465c7b2`). Please update that line so the section is internally consistent. Everything else checks out: the 161 counts and expected-file lists match the committed screenshots, SQL evidence uses live queries, fixtures reset per test, `@screenshots` is isolated, and traceability passes 100%.<br><br>**Round 3 (`APPROVED`):** **Verdict: Approved & Merged** — Thanks for the thorough fixes and final documentation pass! Confirmed that the PR #78 outcome and bidirectional review log in `docs/lab-04/reviewer.md` are updated, and temporary planning files / local `file:///` links have been removed. All Lab 4 specifications (`specification.md`, `api-spec.md`, `ui-spec.md`), test traceability (`tests.md`), AI usage log (`ai-use.md`), `README.md`, and the 161 release evidence screenshots in `artifacts/lab-04/screenshots/` are clean, consistent, and fully aligned with the SE Lab 4 rubric. LGTM — approving and merging into `lab4-staging` now! |
| **My Response** | Hi @Achikan, thanks for the thorough and constructive review! I have addressed all requested points:<br>1. **Screenshot Counts**: Pruned obsolete unnumbered files and synchronized all counts across PR description, `docs/lab-04/reviewer.md`, and `docs/lab-04/ai-use.md` to reflect **exactly 161 screenshots** (Staff: 42, Requester: 37, Actions Taken: 47, Ticket Workflow: 27, Regression: 8).<br>2. **Part 9 Responsive Coverage**: Added 15 new tablet (`768x1024`) and mobile (`375x812`) captures for `ticket-workflow` and `actions-taken` (including mobile top/bottom splits) and expanded `docs/lab-04/ui-spec.md §8` into 7 comprehensive checklist subsections.<br>3. **Genuine SQL Equivalence Evidence**: Created `scripts/get-sql-evidence.cjs` executing live PostgreSQL raw queries (`prisma.$queryRawUnsafe`) measuring genuine query duration (ms) and raw JSON rows into `40-db-match-unassigned-ownedbyme.png` and `42-db-match-metrics.png`.<br>4. **Deterministic Fixtures**: Added `scripts/reset-test-fixtures.cjs` executed before every scenario (`beforeEach`).<br>5. **Assertion Resilience**: Replaced `if (isVisible)` guards with strict `expect().toBeVisible()` checks and enforced `verifyScreenshotsGenerated()` asserting all 161 files exist and are > 1,000 bytes.<br>6. **Isolated Evidence Generation**: Isolated screenshot tests under `@screenshots` with `process.env.RUN_SCREENSHOTS === 'true'` via `npm run test:screenshots --prefix e2e`.<br>7. **Documentation Consistency**: Removed temporary `plan-issue-11.md`, updated PR #78 `Outcome` in `docs/lab-04/reviewer.md` to reflect merge commit `465c7b2`, and completed a full consistency pass across all 6 `docs/lab-04/` files and `README.md`. |
| **Outcome** | Approved and merged into `lab4-staging` by @Achikan (after 2 revisions, merge commit `dc9a772`) |

---

### PR #80 — Final Release: Promote Lab 4 Sprint to main

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/il0lk3/TokTickIT/pull/80](https://github.com/il0lk3/TokTickIT/pull/80) |
| **Reviewer** | [@Achikan](https://github.com/Achikan) |
| **Review Comment** | Final Sprint 4 release check: All 11 Lab 4 issues (PRs #69–#79), engineering specifications, bidirectional test traceability (199 server, 140 client, 51 E2E), 161 release evidence screenshots, and peer review records are verified on `lab4-staging` and ready to merge into `main`. LGTM! |
| **My Response** | Thank you! All Lab 4 deliverables verified and promoted from `lab4-staging` to `main`. |
| **Outcome** | Approved and merged into `main` |

<br><br>

---
---

<br><br>

# Pull Requests I Reviewed

> I reviewed the following Lab 4 PRs authored and submitted by my partner (`Achikan/TokTickIT`).

| PR | Issue | Branch | My Verdict |
|---|---|---|---|
| [#78](https://github.com/Achikan/TokTickIT/pull/78) | 26 — Sprint 4 Engineering Contract (`specification.md`) | `feature/26-sprint4-contract-spec` | Approved (after 1 revision) |
| [#79](https://github.com/Achikan/TokTickIT/pull/79) | 27 — Sprint 4 Contracts (`ui-spec.md` & `api-spec.md`) | `feature/27-sprint4-contract-ui-api-spec` | Approved |
| [#80](https://github.com/Achikan/TokTickIT/pull/80) | 28 — Sprint 4 Test Plan & Traceability (`tests.md`) | `feature/28-sprint4-test-plan` | Approved |
| [#81](https://github.com/Achikan/TokTickIT/pull/81) | 29 — ActionTaken Model, Additive Migration & Idempotent Seed | `feature/29-actions-taken-migration-seed` | Approved |
| [#82](https://github.com/Achikan/TokTickIT/pull/82) | 30 — Actions Taken REST API & Backend Authorization | `feature/30-actions-taken-api` | Approved (after 1 revision) |
| [#83](https://github.com/Achikan/TokTickIT/pull/83) | 31 — Actions Taken UI on Ticket Detail | `feature/31-actions-taken-ui` | Approved (after 1 revision) |
| [#84](https://github.com/Achikan/TokTickIT/pull/84) | 32 — Ticket Workflow — Transition Matrix & Resolution Gate (Backend) | `feature/32-ticket-workflow-api` | Approved |
| [#85](https://github.com/Achikan/TokTickIT/pull/85) | 33 — Ticket Workflow — UI Status Controls | `feature/33-ticket-workflow-ui` | Approved (after 1 revision) |
| [#86](https://github.com/Achikan/TokTickIT/pull/86) | 34 — IT Staff Dashboard (API + UI) | `feature/34-staff-dashboard` | Changes Requested (2 revisions reviewed; merged after fixes) |
| [#87](https://github.com/Achikan/TokTickIT/pull/87) | 35 — Requester Dashboard (API + UI) | `feature/35-requester-dashboard` | Approved (after 1 revision) |
| [#89](https://github.com/Achikan/TokTickIT/pull/89) | 36 — Final Regression & Product Hardening | `feature/36-final-regression-product-hardening` | Approved (after 3 revisions) |
| [#90](https://github.com/Achikan/TokTickIT/pull/90) | 37 — Zen Green Polish, Accessibility, Screenshots & Release | `feature/37-zen-green-polish-release` | Approved (after 1 revision) |
| [#91](https://github.com/Achikan/TokTickIT/pull/91) | 37 — E2E Specs for Actions Taken Flow, Ticket Resolution, and Dashboards | `feature/lab4-e2e-specs` | Approved (after 2 revisions) |

> *Note: Partner PR #88 was closed by @Achikan in favor of PR #89 containing the full regression changes.*

<br>

### Partner PR #78 — Issue 26: Sprint 4 Engineering Contract (`specification.md`)

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/Achikan/TokTickIT/pull/78](https://github.com/Achikan/TokTickIT/pull/78) |
| **Reviewer** | [@il0lk3](https://github.com/il0lk3) (Me) |
| **My Review Comment** | I have a few minor technical suggestions and refinements to consider:<br>1. **Clarify Ticket Owner Preservation in AC-01**: In AC-01, we verify that the creator is recorded as `Performed By`. To make this criterion more comprehensive regarding ownership coordination, I suggest explicitly clarifying that the ticket's primary assignee remains preserved: *"Given a permitted IT Staff user and valid data, when an Actions Taken is created, then it is saved under the correct Ticket with the authenticated creator recorded as Performed By and the approved assignee (Ticket Owner) preserved."*<br>2. **Clarify Ticket Detail Integration Scope in Decisions (Section 11)**: Because the Ticket Detail screen handles both the Actions Taken work log and existing ticket-level operations (assigning owners, status transitions to resolved or cancelled), it would be beneficial to add a short note (`D-13`) clarifying how these three control groups interact on the UI (`/owner`, `/status`, `/actions`).<br><br>**Re-review:** LGTM |
| **Partner's Response** | 1. Good catch — updated AC-01 to state that the approved assignee (Ticket Owner) is preserved, and added the owner-preserved assertion to the planned `API-TA-01` test. This also matches the sheet's stakeholder quote that the primary Ticket Owner remains responsible for coordinating the Ticket.<br>2. Added `D-13` mapping the three Ticket Detail control groups: owner assignment (coordination + inactive-assignee rejection), status transitions (completion/cancellation with the BR-11 resolution gate), and the Actions Taken work log (create/edit/view only, no owner or status side effects). Each group maps to its own API path (`/owner`, `/status`, `/actions`) so frontend and E2E share one mental model. |
| **Outcome** | Approved and merged |

---

### Partner PR #79 — Issue 27: Sprint 4 Contracts (`ui-spec.md` & `api-spec.md`)

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/Achikan/TokTickIT/pull/79](https://github.com/Achikan/TokTickIT/pull/79) |
| **Reviewer** | [@il0lk3](https://github.com/il0lk3) (Me) |
| **My Review Comment** | LGTM, Both `docs/lab-04/ui-spec.md` and `docs/lab-04/api-spec.md` provide a concrete and rigorous technical foundation for the upcoming implementation PRs. |
| **Partner's Response** | *(No response needed)* |
| **Outcome** | Approved and merged |

---

### Partner PR #80 — Issue 28: Sprint 4 Test Plan & Traceability (`tests.md`)

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/Achikan/TokTickIT/pull/80](https://github.com/Achikan/TokTickIT/pull/80) |
| **Reviewer** | [@il0lk3](https://github.com/il0lk3) (Me) |
| **My Review Comment** | LGTM, The test plan in `docs/lab-04/tests.md` is thorough, well-structured, and fully aligned with the requirements. |
| **Partner's Response** | *(No response needed)* |
| **Outcome** | Approved and merged |

---

### Partner PR #81 — Issue 29: ActionTaken Model, Additive Migration & Idempotent Seed

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/Achikan/TokTickIT/pull/81](https://github.com/Achikan/TokTickIT/pull/81) |
| **Reviewer** | [@il0lk3](https://github.com/il0lk3) (Me) |
| **My Review Comment** | **Model Integrity:** `ActionTaken` in `schema.prisma` strictly implements the field contract, nullability, defaults, and composite index `(ticketId, actionDateTime)` defined in `specification.md` §7.1.<br>**Additive & Safe Migration:** The migration SQL creates the new table and indexes without touching existing tables, columns, or enums, preserving all Lab 1–3 data. The documented rollback and recovery strategy in the migration header is clear and robust.<br>**Idempotent Seed & Backfill:** The per-ticket zero-count guard in `seedActions` ensures re-runs are no-ops while properly backfilling actions for legacy tickets. The coverage matrix thoroughly satisfies BR-19 (0/1/many actions, multi-performer ticket, follow-up variants, attachment notes, and Ivy Ing as the zero-metric user for dashboard empty states).<br>**Test Integrity:** The new migration suite (`MIG-01` through `MIG-04`) validates data preservation, legacy grandfathering, row stability, and coverage. All requirements are fully met. LGTM |
| **Partner's Response** | Thanks for the review — much appreciated. I re-checked the PR against the Lab 4 handout (`docs/SE+Lab+4.pdf` §5 migration/seed and the 'Actions Taken foundation' scope) and everything you flagged lines up: additive-only migration with a documented rollback, per-ticket zero-count guard for idempotent seeding + legacy backfill, and the `MIG-01`..`MIG-04` coverage. |
| **Outcome** | Approved and merged |

---

### Partner PR #82 — Issue 30: Actions Taken REST API & Backend Authorization

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/Achikan/TokTickIT/pull/82](https://github.com/Achikan/TokTickIT/pull/82) |
| **Reviewer** | [@il0lk3](https://github.com/il0lk3) (Me) |
| **My Review Comment** | 1. **Auto-sanitize `followUpNote` when `followUpRequired` is false (`server/src/actionsTaken.ts`)**: Currently, in `validateActionInput`, we only check whether a note is present when `followUpRequired` is true. This creates two edge cases where orphaned notes linger in the database:<br>- On a patch request, if an action previously had follow-up enabled with a note, and the client updates only `followUpRequired: false` without explicitly providing `followUpNote: null`, `mergeActionInput` retains the old note and saves it with `followUpRequired: false`.<br>- On a create request, if a client submits `followUpRequired: false` while still passing text in `followUpNote`, the note is accepted and persisted.<br>To maintain clean data consistency, we should ensure that whenever `followUpRequired` evaluates to false, the returned `followUpNote` data is strictly normalized to `null`.<br>2. **Clean up unused declarations (`server/src/actionsTaken.ts`, lines 37–43)**: Remove the unused `ActionWithPerformer` type and superseded `ticketNotFound` / `actionNotFound` helpers.<br><br>**Re-review:** Both requested refinements have been cleanly addressed. |
| **Partner's Response** | Done — both points addressed in `acaedb0`:<br>1. **Follow-up Note normalization.** BR-05 is an if-and-only-if, so `validateActionInput` now forces `followUpNote = null` whenever the merged/resolved `followUpRequired` is false. Added `API-TA-03` and `API-TA-08` cases asserting both (stored row checked too).<br>2. **Dead declarations.** Removed the unused `ActionWithPerformer` type and the superseded `ticketNotFound` / `actionNotFound` helpers.<br>Re-verified on this branch: `tsc --noEmit` clean, action suite 28/28, full server suite **240 passed (22 files)** with no Lab 1–3 regressions. |
| **Outcome** | Approved and merged |

---

### Partner PR #83 — Issue 31: Actions Taken UI on Ticket Detail

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/Achikan/TokTickIT/pull/83](https://github.com/Achikan/TokTickIT/pull/83) |
| **Reviewer** | [@il0lk3](https://github.com/il0lk3) (Me) |
| **My Review Comment** | Please address the following points:<br>1. **Synchronize Ticket `updatedAt` on Action Creation (`client/src/ActionsTaken.tsx` & `client/src/StaffTicketDetail.tsx`)**: Update the parent ticket's `updatedAt` anchor when a new Action Taken is created so subsequent workflow operations do not hit false 409 `STALE_UPDATE` conflicts.<br>2. **Enforce BR-07 Ordering for Backdated Actions (`client/src/StaffTicketDetail.tsx`)**: Sort actions by `actionDateTime DESC, id DESC` rather than unconditionally prepending newly created backdated actions.<br>3. **Remove Dead Declaration (`client/src/ActionsTaken.tsx`, line 94)**: Remove the unused duplicate function `toLocalInputFromDate`.<br><br>**Re-review:** LGTM. Thank you for addressing all review comments. |
| **Partner's Response** | Thanks for the review — all three points addressed in `9dc8b32` (and cross-checked against the Lab 4 spec):<br>1. **Ticket `updatedAt` sync**: on create, `StaffTicketDetail` now updates its cached anchor from the response's `ticket.updatedAt` (BR-12), so later writes don't hit a stale version.<br>2. **BR-07 ordering**: created Actions are inserted with `actionDateTime` desc / `id` desc (backdated actions no longer prepended); the list is also sorted on load.<br>3. Removed the dead `toLocalInputFromDate` declaration. Also applied the `ui-spec §5.2`/D-6 date bounds on the Action Date/Time control (`[createdAt - 30d, now + 24h]`). |
| **Outcome** | Approved and merged |

---

### Partner PR #84 — Issue 32: Ticket Workflow — Transition Matrix & Resolution Gate (Backend)

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/Achikan/TokTickIT/pull/84](https://github.com/Achikan/TokTickIT/pull/84) |
| **Reviewer** | [@il0lk3](https://github.com/il0lk3) (Me) |
| **My Review Comment** | The backend implementation for the ticket workflow transition matrix, optimistic concurrency, and resolution gate is solid, robust, and fully compliant with the specification.<br><br>Verification summary:<br>- **Status Transition Matrix (BR-08, BR-09)**: Validated server-side enforcement across the 8-status matrix. Illegal and terminal transitions return 409 with `FORBIDDEN_TRANSITION`, thoroughly covered by exhaustive sweeps across all 64 pairs in `API-WF-01` and `API-WF-02`.<br>- **Optimistic Concurrency (BR-12, D-1)**: `PATCH /api/staff/tickets/:id/status` strictly enforces `expectedUpdatedAt`. Format validation returns 400 on invalid input, and timestamp mismatches return 409 `STALE_UPDATE` before any write operations occur.<br>- **Resolution Gate (BR-11, D-3)**: Enforces `>=1` Action requirement specifically when transitioning into `RESOLVED`, returning 409 `RESOLUTION_GATE`. Legacy zero-action tickets remain properly grandfathered for transitions into `CLOSED` or `REOPENED`.<br>- **Response Shape & Enrichment (`api-spec §2.1, §2.3`)**: Both `GET /api/staff/tickets/:id` and operational PATCH summaries consistently surface `actionsCount` and `requesterIndicatedResolvedAt`. |
| **Partner's Response** | *(No response needed)* |
| **Outcome** | Approved and merged |

---

### Partner PR #85 — Issue 33: Ticket Workflow — UI Status Controls

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/Achikan/TokTickIT/pull/85](https://github.com/Achikan/TokTickIT/pull/85) |
| **Reviewer** | [@il0lk3](https://github.com/il0lk3) (Me) |
| **My Review Comment** | Please address the following points:<br>1. **Resolve Action Button Remains Gated After Adding an Action (`client/src/StaffTicketDetail.tsx`, lines 540 & 559)**: After an IT Staff member successfully creates the first action inline, the component re-renders with `actionsCount === 0`. The "Resolve" transition button remains disabled with the helper text "Record at least one Action Taken first.", preventing immediate resolution without a full page reload. Synchronize `actionsCount` inside `setDetail` upon action creation (from `ticketSummary.actionsCount`), and ensure line 540 accurately reflects the current action count on screen (`max(detail.actionsCount, actions.length)`).<br>2. **Stale Update Warning Callout Stays Mounted After Reload (`client/src/TicketWorkflow.tsx`, lines 230–238)**: Clicking "Reload ticket" should reset/clear the internal error state, or clear it when `expectedUpdatedAt` is refreshed.<br>3. **Synchronize `actionsCount` in `applyUpdatedSummary` (`client/src/StaffTicketDetail.tsx`, lines 227–239)**: Include `actionsCount` when updating `detail` from the response summary to preserve state consistency across status transitions.<br><br>**Re-review:** LGTM, Thank you for addressing all review comments. Verified the new integration tests for un-gating on-screen actions and callout cleanup; all 127 client tests pass with zero regressions. |
| **Partner's Response** | Thanks @il0lk3 — all three are addressed in `f206e2c`:<br>1. `actionsCount` is now synced from the action-create and status-transition responses (and in `applyUpdatedSummary`), and the control uses `max(detail.actionsCount, actions.length)` — so a server `0` no longer short-circuits, and Resolve un-gates after the first inline Action with no reload.<br>2. `Reload ticket` clears the stale callout immediately, and a refreshed `expectedUpdatedAt` clears any residual conflict/gate feedback.<br>3. Same sync as (1): `StaffTicket` now carries `actionsCount` and it is preserved through transitions. Client suite: **127 passed**. |
| **Outcome** | Approved and merged |

---

### Partner PR #86 — Issue 34: IT Staff Dashboard (API + UI)

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/Achikan/TokTickIT/pull/86](https://github.com/Achikan/TokTickIT/pull/86) |
| **Reviewer** | [@il0lk3](https://github.com/il0lk3) (Me) |
| **My Review Comment** | **Round 1 (`CHANGES_REQUESTED`):** Please address the following architectural, contract, and functional issues:<br>1. **View Routing in `App.tsx` Omits `<StaffDashboard>` (`client/src/App.tsx`, lines 245–285)**.<br>2. **Metrics Calculation Violates Active Statuses & Metric Criteria (`server/src/staffDashboard.ts`, lines 62–84)**.<br>3. **In-Memory Table Scans Violate Specification D-8 and PERF-01 (`server/src/staffDashboard.ts`, lines 47–60)**.<br>4. **API Schema Discrepancy (`api-spec.md §3.1`, `server/src/staffDashboard.ts`, lines 85–118)**.<br>5. **Missing `ownerId=me` Alias in Staff Ticket Queue (`server/src/staffQueue.ts`, lines 123–134)**: Implement the `ownerId=me` alias resolution in `staffQueue.ts` to allow 1-click drill-downs from the dashboard.<br>6. **Standard Middleware Compliance (`server/src/staffDashboard.ts`)**: Route `/api/staff/dashboard` using standard middleware chains (`requireAuth`, `blockPendingPasswordChange`, `requireRole`).<br><br>**Round 2 (`CHANGES_REQUESTED`):** Thank you for pushing commit `234f426`. After reviewing the latest branch state, several critical regressions and contract discrepancies still need to be resolved:<br>1. **`server/src/staffQueue.ts` Remains Broken**: Imports non-existent `./roles.js`, calls CommonJS `require("express")` inside ESM, deletes `GET /api/staff/assignees`, and comments out `ownerId`/`sort` validation. Restore `server/src/staffQueue.ts` cleanly from `lab4-staging` and solely add `ownerId === "me"`.<br>2. **Broken Middleware Chain & Permanent 401 on Dashboard Endpoint**: Register `/api/staff/dashboard` with `requireAuth, blockPendingPasswordChange, requireRole("IT_STAFF", "ADMIN")` and use standard ESM imports.<br>3. **Metrics Calculation Violates Active Statuses (Specification §5.3)**: Filter `SD-01`, `SD-02`, and `SD-04` by active statuses, and check `itPriority IN ("URGENT", "HIGH")` for `SD-06`.<br>4. **Response Payload Schema Discrepancies (`api-spec.md §3.1`)**: Align `generatedAt`, `unassignedCount`, `ownedByMeCount`, `byPriority`, `recentlyUpdated.items`, `urgentHigh.items`, `owner: { id, name } | null`, and root-level `userCounts`. |
| **Partner's Response** | Fixed in `2bc78ab` / `178d559` / `621db34`:<br>- Restored `server/src/app.ts` and `server/src/staffQueue.ts` from `lab4-staging`; added only the Dashboard route (with `requireAuth/blockPendingPasswordChange/requireRole`) and the `ownerId=me` alias.<br>- `staffDashboard.ts`: DB clock (`SELECT NOW()`), `byStatus` all 8 statuses, `byPriority` active-only 4 keys, `urgentHigh` = URGENT+HIGH (URGENT first) capped 5, `recentlyUpdated` all statuses within 7d, 5-key `drilldown`, `owner: {id,name}|null`, top-level `userCounts` for Admin.<br>- Client `StaffDashboard.tsx`: new contract (`unassignedCount/ownedByMeCount/byPriority/...items/userCounts`), cards as real `<a>` links, `badge-status-*` mapping, and App-level drill-down tests (`AppDashboard.test.tsx`). Verified: server `tsc --noEmit` clean; client `tsc --noEmit` clean; server dashboard+queue tests 38/38, client full suite 136/136. |
| **Outcome** | All requested changes resolved and merged into `lab4-staging` |

---

### Partner PR #87 — Issue 35: Requester Dashboard (API + UI)

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/Achikan/TokTickIT/pull/87](https://github.com/Achikan/TokTickIT/pull/87) |
| **Reviewer** | [@il0lk3](https://github.com/il0lk3) (Me) |
| **My Review Comment** | The frontend wiring leaves the drill-down filter integration incomplete, uses buttons instead of accessible link elements for metric cards, and misses the specified warning styling for RD-02.<br><br>1. **Incomplete Drill-Down Filter Integration (`client/src/App.tsx` & `client/src/MyTickets.tsx`)**: Add an optional `initialFilters?: Partial<TicketQuery>` prop to `MyTickets.tsx` (analogous to `initialFilters` on `StaffTicketQueue.tsx`) and pass `requesterFilters` state down from `App.tsx` to `<MyTickets initialFilters={requesterFilters} />`.<br>2. **Metric Card Element Semantics (`client/src/RequesterDashboard.tsx`)**: Align the card markup with `StaffDashboard.tsx` by rendering `<a className="card ... text-decoration-none" href={data.drilldown.open} aria-label="...">` and preventing default navigation on click while triggering `goTickets(...)`.<br>3. **Visual Styling for "Waiting for Me" Card (`client/src/RequesterDashboard.tsx`)**: Add warning tinting or a warning badge label to the "Waiting for Me" card header.<br>4. **Test Assertion Precision (`client/tests/lab-04/RequesterDashboard.test.tsx`)**: Assert that `onViewTickets` is called with `{ status: "OPEN" }` and add a test case verifying the "Waiting for Me" card click.<br><br>**Re-review:** LGTM, All review items have been cleanly and completely addressed. |
| **Partner's Response** | Thanks. Addressed all points:<br>1. Drill-down filters: added `initialFilters` to `MyTickets`, store `requesterFilters` in `App`, pass to `<MyTickets initialFilters={requesterFilters} />` (analogous to Staff queue).<br>2. Metric cards use accessible `<a>` with `aria-label`, `href` from `drilldown`, `preventDefault` + `onViewTickets(...)` to navigate in-app.<br>3. "Waiting for Me" card gets warning tinting/badge as requested.<br>4. Tests updated: assert `onViewTickets` called with `{ status: "OPEN" }` and `{ status: "WAITING_FOR_REQUESTER" }`. Verified: server tsc + requester-dashboard API tests pass, client tsc + full suite 139/139 pass. |
| **Outcome** | Approved and merged |

---

### Partner PR #89 — Issue 36: Final Regression & Product Hardening

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/Achikan/TokTickIT/pull/89](https://github.com/Achikan/TokTickIT/pull/89) |
| **Reviewer** | [@il0lk3](https://github.com/il0lk3) (Me) |
| **My Review Comment** | **Round 1 (`CHANGES_REQUESTED`):** The server regression artifact and test plan documentation have significant omissions that must be addressed:<br>1. **Truncated Server Test Evidence (`artifacts/lab-04/test-output/server-vitest-all.txt`)**: Ends abruptly at line 60. Re-run `cd server && npm test` through full completion without truncation and capture the entire log including the final summary block.<br>2. **Zero-Byte Typecheck Evidence Files (`client-tsc.txt` and `server-tsc.txt`)**: Both files are committed as 0-byte empty files. Include an execution header or exit code confirmation so the artifact explicitly confirms execution and zero error status.<br>3. **Outdated Status in `docs/lab-04/tests.md`**: Every row in the Planned Tests table (§2) still lists `Planned` in the `Final` column, and Section 8 still reads `**Status: PLANNED**`. Update the `Final` column to `Pass` for verified automated suites, update Section 8, and include the suite count breakdown.<br><br>**Round 2 & 3 Follow-ups:** Noted that commits `845f3b8` and `b511305` still left `server-vitest-all.txt` truncated at line 63 (2 of 25 test files) and did not stage the §2 `Final` column updates.<br><br>**Final Re-review (`57b6a67`):** LGTM |
| **Partner's Response** | @il0lk3 Pushed commit `57b6a67` with all requested fixes:<br>1. **Full Server Test Log (`artifacts/lab-04/test-output/server-vitest-all.txt`)**: Ran all 25 test suites sequentially to full completion (398s). The log now contains all 25 test files (330 tests passed) and includes the complete Vitest summary block.<br>2. **Provenance Breakdown (`docs/lab-04/tests.md`)**: Updated §2 `Final` column to `Pass` and Section 8 Provenance with the exact test suite and test counts matching the terminal output (`Server: 25 files / 330 tests passed`, `Client: 19 files / 139 tests passed`).<br>3. **Lab 4 README Updates (`README.md`)**: Updated setup, Lab 4 feature summary (Actions Taken, resolution gate, Dashboards), directory structure, and Lab 4 test results per Lab 4 §8.5. |
| **Outcome** | Approved and merged |

---

### Partner PR #90 — Issue 37: Zen Green Polish, Accessibility, Screenshots & Release

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/Achikan/TokTickIT/pull/90](https://github.com/Achikan/TokTickIT/pull/90) |
| **Reviewer** | [@il0lk3](https://github.com/il0lk3) (Me) |
| **My Review Comment** | #### Findings & Action Items<br>1. **Actions Taken List Screenshots Capture Zero-Action State (`TK-001008`)**:<br>- **Location**: `artifacts/lab-04/screenshots/actions-taken/{01-desktop, 02-tablet, 03-mobile}.png`<br>- **Issue**: The screenshot script selects the first ticket link on the Staff Dashboard (`TK-001008`), which has zero recorded actions. As a result, the desktop table layout (`actions-table`), multi-performer rows, and mobile card layout (`actions-cards`) are replaced by `"No actions recorded yet."`.<br>2. **Missing Evidence: `06-actions-taken-edit-mode.png`**:<br>- **Location**: `artifacts/lab-04/screenshots/actions-taken/`<br>- **Issue**: The committed screenshots jump directly from `05-actions-taken-followup-validation.png` to `07-actions-taken-requester-readonly.png`. Because `TK-001008` contained zero actions, no edit buttons were rendered and the Playwright edit capture block was bypassed.<br>3. **`01-workflow-status-transitions.png` Shows Terminal State Without Transition Buttons**:<br>- **Location**: `artifacts/lab-04/screenshots/workflow/01-workflow-status-transitions.png`<br>- **Issue**: Because `TK-001008` is in the `CANCELLED` status, the Status operations section displays *"No further status transitions are permitted from CANCELLED."* with zero transition buttons rendered.<br>4. **`07-actions-taken-requester-readonly.png` Shows Zero-Record State**:<br>- **Location**: `artifacts/lab-04/screenshots/actions-taken/07-actions-taken-requester-readonly.png`<br>- **Issue**: The screenshot displays ticket `TK-001005` for Alice Anderson, which has zero actions.<br><br>#### Suggested Fix in `scripts/screenshots-lab4.mjs`<br>- Target ticket `TK-001003` via the Ticket Queue or direct button selector for the Staff Actions Taken and Workflow captures.<br>- Use `carol.chen@example.com` (requester of `TK-001003`) for the requester read-only capture.<br>- Re-run `npm run screenshots:lab4` and commit the updated screenshot set.<br><br>**Re-review:** LGTM |
| **Partner's Response** | Thanks for the review! Fixed in commit `4809d3d`:<br>1. **Targeted `TK-001003` (`IN_PROGRESS`)**: Staff Actions Taken captures (`actions-taken/{01-desktop, 02-tablet, 03-mobile}.png`) now render non-empty tables and cards displaying all 3 recorded actions across multiple performers (Frank Gao, Eileen Ford, Dan Das).<br>2. **Added `06-actions-taken-edit-mode.png`**: Captured the active Edit Action form with prefilled values and read-only performer.<br>3. **Updated `01-workflow-status-transitions.png`**: On `TK-001003`, active status transition buttons ("Set Waiting for Requester", "Resolve", "Cancel Ticket") are now clearly rendered.<br>4. **Switched to Carol Chen (`carol.chen@example.com`)**: `07-actions-taken-requester-readonly.png` now displays the 3 actions in read-only mode on an owned ticket, and `02-workflow-requester-advisory.png` captures the confirmed advisory banner.<br>5. Re-ran `npm run screenshots:lab4` (all 19 screenshots generated cleanly) and updated `reviewer.md` and `ai-use.md`. |
| **Outcome** | Approved and merged (after 1 revision, merge commit `a19a7da`) |

---

### Partner PR #91 — Issue 37: E2E Specs for Actions Taken Flow, Ticket Resolution, and Dashboards

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/Achikan/TokTickIT/pull/91](https://github.com/Achikan/TokTickIT/pull/91) |
| **Reviewer** | [@il0lk3](https://github.com/il0lk3) (Me) |
| **My Review Comment** | **Round 1 (`CHANGES_REQUESTED`):** Several locator and string assertions do not match the actual JSX rendered by the React components, which will cause locator timeouts when `npm run test:e2e:lab4` is executed:<br>1. **`e2e/lab-04/actions-taken-flow.spec.ts` (Line 64)**: `page.locator("#action-performedBy")` does not exist in `client/src/ActionsTaken.tsx`. Performed By is rendered as a read-only paragraph (`[data-testid="action-performer-note"]`), not an input element.<br>2. **`e2e/lab-04/dashboards.spec.ts` (Lines 28–65)**: Align string assertions with the exact labels in `StaffDashboard.tsx` and `RequesterDashboard.tsx` (`Owned by me`, `Tickets by IT Priority`, `Recently Updated (last 7 days)`, `User accounts (concise)`, `Waiting for Me`, and `No recently updated/resolved tickets.`).<br>3. **Pre-test Database State (`e2e/lab-04/ticket-resolution.spec.ts`)**: Ensure the PostgreSQL test database is freshly seeded prior to running E2E tests so `TK-001003` starts in `IN_PROGRESS` status.<br><br>**Round 2 Comment (`issuecomment-6610165973`):** Inspecting `scripts/capture-extra-evidence-lab4.mjs` and the generated report images embedded in `docs/lab-04/report.md` revealed two defects:<br>1. **Figures 7.3 & 7.4 Display 404 Route Not Found HTML Instead of 409 JSON Responses**: Update the endpoint in `scripts/capture-extra-evidence-lab4.mjs` to `PATCH /api/staff/tickets/${id}/status` and payload to `{ newStatus: "...", expectedUpdatedAt: t.updatedAt }`.<br>2. **Figures 5.7 & 8.6 Display `undefined` in DB Comparison Tables**: Update property names in `scripts/capture-extra-evidence-lab4.mjs` to match the API response schema (`unassignedCount`, `ownedByMeCount`, `openCount`, `waitingForRequesterCount`, `recentlyUpdated.items.length`, `recentlyResolved.items.length`).<br><br>**Final Re-review (`APPROVED`):** The implementation, test suites, and documentation evidence satisfy all Lab 4 specification requirements. |
| **Partner's Response** | **Round 1 Response:**<br>1. **Actions Taken Performer Note**: Updated locator to target `[data-testid="action-performer-note"]`, verifying Dan Das automatic attribution.<br>2. **Dashboard Label Alignments**: Corrected all string assertions in `e2e/lab-04/dashboards.spec.ts` to match exact component text.<br>3. **Database Pre-test State**: Added `ensureSeedData()` in `helpers.ts` and updated `npm run test:e2e:lab4` to ensure `TK-001003` is reset to seeded `IN_PROGRESS` state.<br><br>**Round 2 Response (`2339330`):**<br>1. **409 JSON API Error Evidence (Figures 7.3 & 7.4)**: Updated endpoints to `PATCH /api/staff/tickets/${id}/status` with `{ newStatus, expectedUpdatedAt }` and captured real `409 Conflict` JSON responses for `RESOLUTION_GATE`, `FORBIDDEN_TRANSITION`, `STALE_UPDATE`, and `DUPLICATE_ACTION`.<br>2. **DB Comparison Tables Schema Alignment (Figures 5.7 & 8.6)**: Fixed metric property paths in `scripts/capture-extra-evidence-lab4.mjs` so all authoritative DB counts match API values with zero `undefined` values.<br>3. **Dashboard Drill-down Consistency & PDF Build**: Added `status=open` and `status=resolved` query parameter support and verified `check-report-pdf.py` passes with `PDF CHECK OK` (Server 25/25 files, 330/330 tests; Client 19/19 files, 139/139 tests; Playwright E2E 4/4 specs). |
| **Outcome** | Approved and merged (after 2 revisions, merge commit `ce45c12`) |
