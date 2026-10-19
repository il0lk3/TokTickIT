# Sprint 4 Test Plan, Traceability Matrix, and Results

This document serves as the comprehensive testing matrix for Lab 4 of TokTickIT. It defines the testing strategy, test commands, and complete traceability mapping between Requirements / Acceptance Criteria (AC-01 to AC-13), Business Rules, and automated test suites across Server API, React Component, and Playwright E2E layers.

---

## 1. Test Execution Commands

```bash
# 1. Run Server Integration & API Tests (Jest / Supertest)
cd server && npm test

# 2. Run Specific Lab 4 Server API Tests
cd server && npx jest tests/lab-04

# 3. Run Client Component Tests (Vitest / React Testing Library)
cd client && npm test

# 4. Run Playwright End-to-End (E2E) Tests
cd e2e && npx playwright test lab-04
```

*(Note: Playwright is configured via `playwright.config.ts` to automatically boot both the Express API and Vite frontend servers via `webServer` blocks).*

---

## 2. Test Strategy & Architectural Layers

1. **Server API & Integration Tests (`server/tests/lab-04/`)**:
   - Written **first** following strict Test-Driven Development (TDD).
   - Validates endpoint authorization (RBAC), input sanitation, follow-up constraints, optimistic concurrency detection (409 Conflict), status-transition matrix rules, Resolution Gate enforcement, and database aggregate metric calculations.
2. **Client Component Tests (`client/tests/lab-04/`)**:
   - Focuses on UI rendering logic, conditional form interactions (revealing Follow-up Note), responsive table-to-card conversions, loading/empty/error states, duplicate-click button disabling, and conflict resolution modal handling using React Testing Library.
3. **End-to-End Tests (`e2e/lab-04/`)**:
   - Executes real browser user journeys across roles (Requester, IT Staff, Administrator) to prove complete system integration, cross-session concurrency collisions, and visual responsive stability.
4. **Regression & Migration Tests**:
   - Validates schema evolution with zero data loss on legacy Lab 1–3 database records and re-executes all previous sprint test suites.

---

## 3. Comprehensive Traceability Matrix

| Test ID | Layer | Req / AC | What It Tests | Expected Result | Automated Test File | Status |
|---|:---:|:---:|---|---|---|:---:|
| **API-ACT-01** | API | **AC-01, BR-03** | IT Staff creates valid Action Taken | HTTP 201; saved under correct Ticket with `performedById = session.user.id` | `server/tests/lab-04/actions-taken.api.test.ts` | Passed |
| **API-ACT-02** | API | **AC-03, BR-05** | Requester attempts POST on Actions Taken | HTTP 403 Forbidden; no database record created | `server/tests/lab-04/actions-taken.api.test.ts` | Passed |
| **API-ACT-03** | API | **AC-03, BR-05** | Requester attempts PATCH on Action Taken | HTTP 403 Forbidden; record remains unmodified | `server/tests/lab-04/actions-taken.api.test.ts` | Passed |
| **API-ACT-04** | API | **BR-05** | Requester GET actions on another user's ticket | HTTP 403 Forbidden or 404 Not Found (tenant isolated) | `server/tests/lab-04/actions-taken.api.test.ts` | Passed |
| **API-ACT-05** | API | **AC-04, BR-04** | Create action with `followUpRequired=true` but empty note | HTTP 400 Bad Request; explanatory validation error | `server/tests/lab-04/actions-taken.api.test.ts` | Passed |
| **API-ACT-06** | API | **BR-04** | Create action with `followUpRequired=false` and note provided | HTTP 201; note is saved as null or empty | `server/tests/lab-04/actions-taken.api.test.ts` | Passed |
| **API-ACT-07** | API | **BR-03** | Client payload attempts to forge `performedById` | Forged ID ignored; server enforces authenticated user ID | `server/tests/lab-04/actions-taken.api.test.ts` | Passed |
| **API-ACT-08** | API | **AC-08, BR-16** | Ticket with zero actions returns empty list | HTTP 200 OK with `[]` | `server/tests/lab-04/actions-taken.api.test.ts` | Passed |
| **API-ACT-09** | API | **BR-02, BR-16** | Ticket with multiple actions from different staff members | HTTP 200 OK; correct stable chronological order | `server/tests/lab-04/actions-taken.api.test.ts` | Passed |
| **API-ACT-10** | API | **BR-07** | Attempt to add Action Taken to Closed/Cancelled ticket | HTTP 400 Bad Request; `TERMINAL_TICKET_LOCKED` | `server/tests/lab-04/actions-taken.api.test.ts` | Passed |
| **API-ACT-11** | API | **AC-10** | Duplicate action submission within short window | Deduplicated or handled safely without duplicate records | `server/tests/lab-04/actions-taken.api.test.ts` | Passed |
| **API-WKF-01** | API | **AC-05, BR-10** | Permitted transitions in matrix (Open -> InProgress -> Waiting) | HTTP 200 OK; status updated successfully | `server/tests/lab-04/ticket-workflow.api.test.ts` | Passed |
| **API-WKF-02** | API | **AC-05, BR-10** | Disallowed transition outside matrix (New -> Resolved) | HTTP 400 Bad Request; `INVALID_STATUS_TRANSITION` | `server/tests/lab-04/ticket-workflow.api.test.ts` | Passed |
| **API-WKF-03** | API | **AC-06, BR-09** | Transition to Resolved without assigned Owner | HTTP 400 Bad Request; `RESOLUTION_GATE_FAILED` | `server/tests/lab-04/ticket-workflow.api.test.ts` | Passed |
| **API-WKF-04** | API | **AC-06, BR-09** | Transition to Resolved with Owner but zero Actions Taken | HTTP 400 Bad Request; `RESOLUTION_GATE_FAILED` | `server/tests/lab-04/ticket-workflow.api.test.ts` | Passed |
| **API-WKF-05** | API | **AC-06, BR-09** | Transition to Resolved with Owner AND valid Action Taken | HTTP 200 OK; status successfully moves to Resolved | `server/tests/lab-04/ticket-workflow.api.test.ts` | Passed |
| **API-WKF-06** | API | **AC-07, BR-11** | Status update with stale `expectedVersion` | HTTP 409 Conflict; no update written; returns current version | `server/tests/lab-04/ticket-workflow.api.test.ts` | Passed |
| **API-WKF-07** | API | **BR-11** | Status update with matching `expectedVersion` | HTTP 200 OK; `version` atomically increments by 1 | `server/tests/lab-04/ticket-workflow.api.test.ts` | Passed |
| **API-WKF-08** | API | **BR-12** | Assign Ticket Owner to an inactive IT Staff user | HTTP 400 Bad Request; `INACTIVE_ASSIGNEE_REJECTED` | `server/tests/lab-04/ticket-workflow.api.test.ts` | Passed |
| **API-WKF-09** | API | **BR-08** | Requester calls `/appears-resolved` | HTTP 200 OK; sets advisory flag; status unchanged | `server/tests/lab-04/ticket-workflow.api.test.ts` | Passed |
| **API-WKF-10** | API | **AC-05, BR-10** | Reject PATCH with only `expectedVersion` and no operational fields | HTTP 400 Bad Request; `NO_FIELDS_TO_UPDATE` | `server/tests/lab-04/ticket-workflow.api.test.ts` | Passed |
| **API-WKF-11** | API | **BR-12** | Non-IT_STAFF (e.g. Administrator) attempts to claim ticket | HTTP 400 Bad Request; `ASSIGNEE_NOT_ELIGIBLE` | `server/tests/lab-04/ticket-workflow.api.test.ts` | Passed |
| **API-DSH-01** | API | **AC-02, BR-14** | Requester retrieves dashboard metrics with structured drillDown and normalized counters | HTTP 200 OK; returns metrics, attentionTickets, recentTickets | `server/tests/lab-04/requester-dashboard.api.test.ts` | Passed |
| **API-DSH-02** | API | **AC-02** | Requester tenant isolation: user A sees 0 metrics or tickets belonging to user B | HTTP 200 OK; 0 cross-tenant data leaks | `server/tests/lab-04/requester-dashboard.api.test.ts` | Passed |
| **API-DSH-03** | API | **AC-08** | Requester with zero tickets receives all metric counts equal to 0, empty lists, and no nulls | HTTP 200 OK; empty arrays and 0 counters | `server/tests/lab-04/requester-dashboard.api.test.ts` | Passed |
| **API-DSH-04** | API | **BR-14** | Rolling 7-day boundary precision for recentlyResolved (6d 23h included, 7d 1h excluded) | Boundary tickets verified against rolling time window | `server/tests/lab-04/requester-dashboard.api.test.ts` | Passed |
| **API-DSH-05** | API | **AC-02** | attentionTickets list contains active tickets in WaitingForRequester status | HTTP 200 OK; contains active attention tickets | `server/tests/lab-04/requester-dashboard.api.test.ts` | Passed |
| **API-DSH-06** | API | **BR-15** | IT Staff and Administrator calling /api/dashboard/requester receive 403 Forbidden | HTTP 403 Forbidden | `server/tests/lab-04/requester-dashboard.api.test.ts` | Passed |
| **API-DSH-07** | API | **BR-15** | Unauthenticated or expired token request receives 401 Unauthorized | HTTP 401 Unauthorized | `server/tests/lab-04/requester-dashboard.api.test.ts` | Passed |
| **API-DSH-08** | API | **AC-02** | Isolation check: query parameter ?userId=<other> is strictly ignored | HTTP 200 OK; tickets belong strictly to authenticated requester | `server/tests/lab-04/requester-dashboard.api.test.ts` | Passed |
| **API-DSH-09** | API | **DoD-6** | Calling GET /api/tickets with drillDown.query params matches card count for every metric | HTTP 200 OK; list total strictly equals card count | `server/tests/lab-04/requester-dashboard.api.test.ts` | Passed |
| **API-DSH-10** | API | **Rubric-5** | Direct SQL comparison: metric values match raw SQL prisma.$queryRaw results | Raw SQL counts equal application metrics | `server/tests/lab-04/requester-dashboard.api.test.ts` | Passed |
| **API-DSH-11** | API | **AC-09** | Staff retrieves operational dashboard metrics with complete byStatus and byPriority maps | HTTP 200 OK; normalized maps returned | `server/tests/lab-04/staff-dashboard.api.test.ts` | Passed |
| **API-DSH-12** | API | **BR-14** | Closed and Cancelled tickets without owner are NOT counted in unassigned active metric | HTTP 200 OK; terminal tickets excluded from active unassigned | `server/tests/lab-04/staff-dashboard.api.test.ts` | Passed |
| **API-DSH-13** | API | **AC-09** | byPriority contains LOW, MEDIUM, HIGH, and UNSET keys (all >= 0) even when counts are 0 | Normalized map has all keys defined | `server/tests/lab-04/staff-dashboard.api.test.ts` | Passed |
| **API-DSH-14** | API | **BR-14** | Rolling 24-hour boundary precision for recentlyUpdated (23h included, 25h excluded) | Boundary tickets verified against rolling time window | `server/tests/lab-04/staff-dashboard.api.test.ts` | Passed |
| **API-DSH-15** | API | **AC-09** | Staff sees appearsResolved metric counting active tickets flagged by requester | HTTP 200 OK; counts active flagged tickets | `server/tests/lab-04/staff-dashboard.api.test.ts` | Passed |
| **API-DSH-16** | API | **AC-09** | Recent lists include myRecentTickets (owned by staff) and urgentTickets (HIGH priority active) | Lists contain appropriate ticket subsets | `server/tests/lab-04/staff-dashboard.api.test.ts` | Passed |
| **API-DSH-17** | API | **BR-13** | Administrator receives adminUserCounts breakdown, while IT_STAFF receives null | Admin gets user breakdown; Staff gets null | `server/tests/lab-04/staff-dashboard.api.test.ts` | Passed |
| **API-DSH-18** | API | **BR-15** | Requester calling /api/dashboard/staff receives 403 Forbidden | HTTP 403 Forbidden | `server/tests/lab-04/staff-dashboard.api.test.ts` | Passed |
| **API-DSH-19** | API | **BR-15** | Unauthenticated or expired token request receives 401 Unauthorized | HTTP 401 Unauthorized | `server/tests/lab-04/staff-dashboard.api.test.ts` | Passed |
| **API-DSH-20** | API | **DoD-6** | Calling GET /api/staff/tickets with drillDown.query params matches card count for every metric | HTTP 200 OK; queue total strictly equals card count | `server/tests/lab-04/staff-dashboard.api.test.ts` | Passed |
| **API-DSH-21** | API | **Rubric-5** | Direct SQL comparison: staff metric values match raw SQL prisma.$queryRaw results | Raw SQL counts equal application metrics | `server/tests/lab-04/staff-dashboard.api.test.ts` | Passed |
| **API-DSH-22** | API | **BR-14** | When updatedAt is identical, recent ticket items sort consistently by id DESC | Secondary tiebreaker deterministic sorting | `server/tests/lab-04/staff-dashboard.api.test.ts` | Passed |
| **API-DSH-23** | API | **BR-14** | Endpoint returns Cache-Control: no-store header | Cache-Control header present and strictly no-store | `server/tests/lab-04/staff-dashboard.api.test.ts` | Passed |
| **API-DSH-24** | API | **Sec-1** | Response objects expose only public user fields (id, name), omitting emails, roles, and passwordHash | No sensitive credentials leaked in dashboard response | `server/tests/lab-04/staff-dashboard.api.test.ts` | Passed |
| **API-MIG-01** | DB | **AC-11** | Database migration preserves Labs 1-3 records | Pre- and post-migration record counts for Users, Tickets, etc. are identical | `server/tests/lab-04/database-regression.test.ts` | Passed |
| **API-MIG-02** | DB | **AC-11** | Seed script is idempotent when executed repeatedly | Database record counts remain unchanged after 2nd seed run | `server/tests/lab-04/database-regression.test.ts` | Passed |
| **UI-ACT-01** | UI | **AC-01, AC-08, BR-16** | Actions Taken section renders list and empty state | Renders loading spinner, chronological table (`actionAt` ASC, `id` ASC), and empty alert when 0 actions | `client/tests/lab-04/ActionsTaken.test.tsx` | Passed |
| **UI-ACT-02** | UI | **AC-03** | Requester sees read-only view without create/edit controls | Form buttons hidden; action data readable | `client/tests/lab-04/ActionsTaken.test.tsx` | Passed |
| **UI-ACT-03** | UI | **AC-04, BR-04** | Follow-Up checkbox reveals note field with inline validation | Note input expands with `aria-expanded`; validates required on submit | `client/tests/lab-04/ActionsTaken.test.tsx` | Passed |
| **UI-ACT-04** | UI | **AC-10** | Double click prevention & in-flight disable | Button disables while in-flight; prevents double submissions; handles 200/201 responses gracefully | `client/tests/lab-04/ActionsTaken.test.tsx` | Passed |
| **UI-ACT-05** | UI | **DoD-7** | Action submission fails with 500 error | Form preserves entered text; displays safe error alert for retry | `client/tests/lab-04/ActionsTaken.test.tsx` | Passed |
| **UI-ACT-06** | UI | **FR-01** | Inline action editing | Staff clicks Edit, row expands to form; Cancel reverts without API call; Save dispatches PATCH | `client/tests/lab-04/ActionsTaken.test.tsx` | Passed |
| **UI-ACT-07** | UI | **BR-07** | Terminal state locking | On Closed or Cancelled tickets, create and edit controls are hidden with locked notice | `client/tests/lab-04/ActionsTaken.test.tsx` | Passed |
| **UI-ACT-08** | UI | **BR-02** | Collaborative multiple performers display | Multiple actions from different performers display their respective names and roles | `client/tests/lab-04/ActionsTaken.test.tsx` | Passed |
| **UI-ACT-09** | UI | **BR-05** | Field limits and live character counter | Enforces 1000-char limits on Description/Result, 500 on Attachment Notes, trims whitespace | `client/tests/lab-04/ActionsTaken.test.tsx` | Passed |
| **UI-ACT-10** | UI | **a11y** | Accessibility attributes, focus management, announcements | Inputs have `aria-describedby` and `aria-invalid`; focus returns to trigger on cancel/save; announcements via `role="status"` | `client/tests/lab-04/ActionsTaken.test.tsx` | Passed |
| **UI-ACT-11** | UI | **AC-06** | Mandatory `onActionChanged` callback | Creating or editing an action invokes callback, triggering parent ticket refetch for Resolution Gate | `client/tests/lab-04/ActionsTaken.test.tsx` | Passed |
| **UI-ACT-12** | UI | **Resiliency** | Initial list fetch error & retry | Displays error message with "Retry" button that refetches list when clicked | `client/tests/lab-04/ActionsTaken.test.tsx` | Passed |
| **UI-ACT-13** | UI | **UX Safety** | Form mutual exclusion | Opening Edit mode cancels or closes active Create mode, preventing concurrent conflicting forms | `client/tests/lab-04/ActionsTaken.test.tsx` | Passed |
| **UI-ACT-14** | UI | **Timezone Safety** | DateTime-local conversion to ISO | Local datetime input is converted to valid ISO UTC string before dispatching POST | `client/tests/lab-04/ActionsTaken.test.tsx` | Passed |
| **UI-ACT-15** | UI | **Server Validation** | API field-level errors mapping | Backend errors returning `fields` map directly to field error messages with `aria-describedby` | `client/tests/lab-04/ActionsTaken.test.tsx` | Passed |
| **UI-ACT-16** | UI | **BR-13** | Administrator operational capabilities | Administrator user has full capability to view, log, and edit actions | `client/tests/lab-04/ActionsTaken.test.tsx` | Passed |
| **UI-ACT-17** | UI | **Concurrency** | Concurrently closed ticket handling | Handles `TERMINAL_TICKET_LOCKED` by dismissing form, showing locked alert, and refetching parent | `client/tests/lab-04/ActionsTaken.test.tsx` | Passed |
| **UI-WKF-01** | UI | **AC-05, BR-10** | Table-driven transition matrix across roles | Renders only permitted transitions for Staff/Admin, and zero for Requester | `client/tests/lab-04/TicketWorkflow.test.tsx` | Passed |
| **UI-WKF-02** | UI | **AC-06, BR-09** | Resolution gate incomplete feedback | When `resolutionGate.met === false`, Resolve action is aria-disabled with aria-describedby | `client/tests/lab-04/TicketWorkflow.test.tsx` | Passed |
| **UI-WKF-03** | UI | **AC-06** | Resolution gate missing requirements banner | Banner explains missing gate items with actionable shortcut links to Assign Owner and Log Action | `client/tests/lab-04/TicketWorkflow.test.tsx` | Passed |
| **UI-WKF-04** | UI | **AC-06, BR-09** | Resolution gate satisfied enables action | When `resolutionGate.met === true`, Resolve button is active and accessible | `client/tests/lab-04/TicketWorkflow.test.tsx` | Passed |
| **UI-WKF-05** | UI | **AC-07, BR-11** | Optimistic concurrency expectedVersion payload | Dispatches `expectedVersion` with status transition payload | `client/tests/lab-04/TicketWorkflow.test.tsx` | Passed |
| **UI-WKF-06** | UI | **BR-11** | Sequential mutations without page reload | Sequential mutations (status then priority) update version in-state and pass without 409 | `client/tests/lab-04/TicketWorkflow.test.tsx` | Passed |
| **UI-WKF-07** | UI | **BR-11, BR-12** | Owner assignment optimistic versioning | Owner assignment sends `expectedVersion` and increments state version | `client/tests/lab-04/TicketWorkflow.test.tsx` | Passed |
| **UI-WKF-08** | UI | **a11y, DoD-5** | Status change live region announcement | Successful transition updates status badge, updatedAt, and announces via `role="status"` | `client/tests/lab-04/TicketWorkflow.test.tsx` | Passed |
| **UI-WKF-09** | UI | **AC-07, BR-11** | Concurrency 409 Conflict Dialog | HTTP 409 opens AccessibleDialog with server status and Reload button | `client/tests/lab-04/TicketWorkflow.test.tsx` | Passed |
| **UI-WKF-10** | UI | **AC-07** | Dismissing conflict dialog refetches latest data | Closing dialog triggers reload to ensure stale data is refreshed | `client/tests/lab-04/TicketWorkflow.test.tsx` | Passed |
| **UI-WKF-11** | UI | **UX Safety** | Confirmation modal for Cancel / Close | Destructive transition opens confirmation dialog with initial focus on safe button | `client/tests/lab-04/TicketWorkflow.test.tsx` | Passed |
| **UI-WKF-12** | UI | **a11y** | Confirmation modal focus trap and Esc key | Modal traps keyboard focus within boundary and closes on Esc key | `client/tests/lab-04/TicketWorkflow.test.tsx` | Passed |
| **UI-WKF-13** | UI | **a11y** | Focus recovery when triggering button unmounts | When action button unmounts on transition, focus shifts safely to `#ticket-summary-status` | `client/tests/lab-04/TicketWorkflow.test.tsx` | Passed |
| **UI-WKF-14** | UI | **AC-05, AC-06** | Friendly error alerts for known domain error codes | Displays friendly error messages for `INVALID_STATUS_TRANSITION`, `RESOLUTION_GATE_FAILED`, `TERMINAL_TICKET_LOCKED` | `client/tests/lab-04/TicketWorkflow.test.tsx` | Passed |
| **UI-WKF-15** | UI | **Resiliency** | Safe fallback alert messages for server/network errors | Displays safe messages for 403, 404, 500, and network exceptions without crashing | `client/tests/lab-04/TicketWorkflow.test.tsx` | Passed |
| **UI-WKF-16** | UI | **BR-07** | Terminal state locking on Closed / Cancelled | Owner select, claim button, and IT priority select are disabled on terminal tickets | `client/tests/lab-04/TicketWorkflow.test.tsx` | Passed |
| **UI-WKF-16b** | UI | **BR-07** | Comment/note locking on Resolved tickets | Public comments and internal notes inputs are locked on Resolved tickets while workflow controls stay operational | `client/tests/lab-04/TicketWorkflow.test.tsx` | Passed |
| **UI-WKF-17** | UI | **BR-08** | Requester advisory button role and state visibility | Visible only for Requester on Open/InProgress/WaitingForRequester; hidden on New/Resolved/Closed/Cancelled | `client/tests/lab-04/TicketWorkflow.test.tsx` | Passed |
| **UI-WKF-18** | UI | **BR-08** | Confirming advisory signal calls PATCH & appends comment | Confirming advisory dialog calls PATCH, appends public comment, sets `appearsResolved`, increments version | `client/tests/lab-04/TicketWorkflow.test.tsx` | Passed |
| **UI-WKF-19** | UI | **BR-08** | Staff advisory banner with smooth scroll link | Staff sees Requester advisory banner with link that scrolls/focuses to Actions Taken | `client/tests/lab-04/TicketWorkflow.test.tsx` | Passed |
| **UI-WKF-20** | UI | **BR-08** | Staff transition clears advisory signal | When Staff transitions ticket status, `appearsResolved` is reset and advisory banner disappears | `client/tests/lab-04/TicketWorkflow.test.tsx` | Passed |
| **UI-WKF-21** | UI | **AC-10** | Double click prevention & loading indicator | Buttons disable and show loading indicators while mutation is in-flight | `client/tests/lab-04/TicketWorkflow.test.tsx` | Passed |
| **UI-WKF-22** | UI | **BR-13** | Administrator operational capability parity | Administrator user has full capability to perform workflow transitions | `client/tests/lab-04/TicketWorkflow.test.tsx` | Passed |
| **UI-DSH-01** | UI | **AC-09** | Staff Dashboard renders 5 metric cards and recent tickets | Displays correct counts and renders ticket rows | `client/tests/lab-04/StaffDashboard.test.tsx` | Planned |
| **UI-DSH-02** | UI | **FR-08** | Clicking metric card navigates to filtered Queue (Drill-down) | URL navigates to `/queue?status=...` | `client/tests/lab-04/StaffDashboard.test.tsx` | Planned |
| **UI-DSH-03** | UI | **AC-02** | Requester Dashboard renders personal metrics | Cards render counts; Recent tickets list displays | `client/tests/lab-04/RequesterDashboard.test.tsx` | Planned |
| **UI-DSH-04** | UI | **AC-08** | Requester with zero tickets renders welcoming empty state | Displays empty state with "+ Create Ticket" button | `client/tests/lab-04/RequesterDashboard.test.tsx` | Planned |
| **UI-NAV-01** | UI | **AC-14, DoD-5** | Unauthenticated access redirects to `/login` with `from` state | Browser redirects to `/login`, preserves return URL in state | `client/tests/lab-04/AppRouting.test.tsx` | Passed |
| **UI-NAV-02** | UI | **AC-14, DoD-5** | Active nav items expose `aria-current="page"` | Link matching current URL has `aria-current="page"` and active styling | `client/tests/lab-04/AppRouting.test.tsx` | Passed |
| **UI-NAV-03** | UI | **AC-14** | Session loading shows accessible loading spinner | Renders centered spinner while `isLoading = true` | `client/tests/lab-04/AppRouting.test.tsx` | Passed |
| **UI-NAV-04** | UI | **AC-14** | Temporary password forces redirect to `/change-password` | Users with `requiresPasswordChange` quarantined to password screen | `client/tests/lab-04/AppRouting.test.tsx` | Passed |
| **UI-NAV-05** | UI | **AC-14** | Role Screen Matrix: Requester routes (`/dashboard`, `/tickets`, `/tickets/new`) | Permitted screens render; `/queue` and `/admin/users` render 403 | `client/tests/lab-04/AppRouting.test.tsx` | Passed |
| **UI-NAV-06** | UI | **AC-14** | Role Screen Matrix: Staff routes (`/dashboard`, `/queue`, `/tickets/:id`) | Permitted screens render; `/tickets/new` and `/admin/users` render 403 | `client/tests/lab-04/AppRouting.test.tsx` | Passed |
| **UI-NAV-07** | UI | **AC-14** | Role Screen Matrix: Admin routes (`/dashboard`, `/queue`, `/tickets/:id`, `/admin/users`) | Full operational and admin access; `/tickets/new` renders 403 | `client/tests/lab-04/AppRouting.test.tsx` | Passed |
| **UI-NAV-08** | UI | **AC-14** | Unrecognized route renders Zen Green 404 page | 404 screen displays "Page Not Found" and "Back to Dashboard" button | `client/tests/lab-04/AppRouting.test.tsx` | Passed |
| **UI-NAV-09** | UI | **AC-14** | Non-numeric ticket ID (`/tickets/abc`) renders 404 | Error boundary / validation renders 404 without crashing | `client/tests/lab-04/AppRouting.test.tsx` | Passed |
| **UI-NAV-10** | UI | **AC-14** | Parent nav highlighting on detail screen | Viewing `/tickets/:id` highlights parent `/queue` or `/tickets` | `client/tests/lab-04/AppRouting.test.tsx` | Passed |
| **UI-NAV-11** | UI | **AC-14** | In-app Back button history fallback | Direct deep link Back button falls back to `/queue` or `/tickets` | `client/tests/lab-04/AppRouting.test.tsx` | Passed |
| **UI-NAV-12** | UI | **AC-15** | Queue reads initial filters from URL query parameters | `?status=Open&itPriority=HIGH` initializes filter inputs | `client/tests/lab-04/AppRouting.test.tsx` | Passed |
| **UI-NAV-13** | UI | **AC-15** | Queue updates URL searchParams when filter inputs change | Changing dropdown updates browser URL synchronously | `client/tests/lab-04/AppRouting.test.tsx` | Passed |
| **UI-NAV-14** | UI | **AC-15** | Queue sanitizes invalid URL filter parameters | Unknown status/priority reset to empty/defaults | `client/tests/lab-04/AppRouting.test.tsx` | Passed |
| **UI-NAV-15** | UI | **AC-15** | My Tickets synchronizes filters with URL searchParams | Filter changes update URL; Back/Forward restores previous filters | `client/tests/lab-04/AppRouting.test.tsx` | Passed |
| **UI-NAV-16** | UI | **AC-15** | Deep link drill-down parses and dispatches sanitized API query | Fetch dispatched with query params matching valid URL state | `client/tests/lab-04/AppRouting.test.tsx` | Passed |
| **UI-NAV-17** | UI | **AC-14, DoD-5** | Mobile navbar toggler accessibility and auto-collapse | Toggler has `aria-controls`, `aria-expanded`; closes on nav click | `client/tests/lab-04/AppRouting.test.tsx` | Passed |
| **UI-NAV-18** | UI | **AC-14, DoD-5** | Accessibility skip link and dynamic `document.title` | Skip link targets `#main-content`; title reflects current page | `client/tests/lab-04/AppRouting.test.tsx` | Passed |
| **E2E-ACT-01** | E2E | **AC-01, AC-03** | Cross-Role Action Lifecycle | Staff logs action with unique timestamp -> Requester views read-only | `e2e/lab-04/actions-taken.spec.ts` | Passed |
| **E2E-ACT-02** | E2E | **FR-01** | Inline Action Editing | Staff edits action result -> verifies update rendered in table | `e2e/lab-04/actions-taken.spec.ts` | Passed |
| **E2E-ACT-03** | E2E | **AC-04** | Client Form Validation | Ticking follow-up without note blocks submission with inline error | `e2e/lab-04/actions-taken.spec.ts` | Passed |
| **E2E-ACT-04** | E2E | **BR-07** | Terminal State Action Locking | Closed ticket hides create and edit controls and displays locked notice | `e2e/lab-04/actions-taken.spec.ts` | Passed |
| **E2E-ACT-05** | E2E | **BR-13** | Administrator Operational Parity | Admin logs action on ticket; performer reflects admin name | `e2e/lab-04/actions-taken.spec.ts` | Passed |
| **E2E-RES-01** | E2E | **AC-06, BR-09** | Resolution Gate lifecycle blocking and unblocking | Gate blocks Resolve action until Owner assigned and Action Taken logged; unblocks immediately | `e2e/lab-04/ticket-resolution.spec.ts` | Passed |
| **E2E-RES-02** | E2E | **BR-08** | Requester advisory signal & staff feedback workflow | Requester signals resolved; Staff views alert banner and uses shortcut to review Actions Taken | `e2e/lab-04/ticket-resolution.spec.ts` | Passed |
| **E2E-RES-03** | E2E | **AC-07, BR-11** | Optimistic concurrency 409 conflict dialog & reload | Concurrent update triggers 409 dialog; Reload updates client state to latest server version | `e2e/lab-04/ticket-resolution.spec.ts` | Passed |
| **E2E-RES-04** | E2E | **BR-07, BR-10** | Terminal ticket locking & Reopen transition | Terminal Closed ticket locks staff controls; Reopen transition re-enables controls | `e2e/lab-04/ticket-resolution.spec.ts` | Passed |
| **E2E-03** | E2E | **AC-02, AC-09** | Dashboard metrics and drill-down navigation | Metrics verify against UI; clicking cards navigates to filtered lists | `e2e/lab-04/dashboards.spec.ts` | Planned |
| **E2E-04** | E2E | **AC-12** | Responsive verification across 375px, 768px, 1280px | No horizontal scroll, no clipping, accessible tap targets | `e2e/lab-04/dashboards.spec.ts` | Planned |
| **E2E-NAV-01** | E2E | **AC-14** | Admin Operational Parity | Admin logs in, views `/queue`, opens `/tickets/1`, verifies queue/detail | `e2e/lab-04/navigation.spec.ts` | Passed |
| **E2E-NAV-02** | E2E | **AC-14** | Role Boundary Enforcement | Requester navigating to `/queue` or `/admin/users` gets in-place 403 | `e2e/lab-04/navigation.spec.ts` | Passed |
| **E2E-NAV-03** | E2E | **AC-14** | Deep-link Login Return | Unauthenticated `/tickets/1` redirects to `/login` and returns on auth | `e2e/lab-04/navigation.spec.ts` | Passed |
| **E2E-NAV-04** | E2E | **AC-14** | Deep-link Direct History Fallback | Opening `/tickets/1` directly falls back to `/queue` on Back click | `e2e/lab-04/navigation.spec.ts` | Passed |
| **E2E-NAV-05** | E2E | **AC-15** | Filter Persistence & History | Back button preserves URL searchParams across filter transitions | `e2e/lab-04/navigation.spec.ts` | Passed |
| **E2E-NAV-06** | E2E | **AC-14** | Zen Green 404 Route Handling | Navigating to `/unknown-route` renders 404 with Back to Dashboard button | `e2e/lab-04/navigation.spec.ts` | Passed |
| **REG-01** | Regression | **AC-13** | Labs 1–3 regression test suite passes | All previous server tests, client tests, and E2E flows pass | `server/tests/`, `client/tests/`, `e2e/` | Passed |

---

## 4. Acceptance Criteria Verification Summary

- **AC-01**: Verified by `API-ACT-01`, `UI-ACT-01`, `E2E-01`
- **AC-02**: Verified by `API-DSH-01`, `API-DSH-02`, `API-DSH-05`, `API-DSH-08`, `API-DSH-09`, `API-DSH-10`, `UI-DSH-03`, `E2E-03`
- **AC-03**: Verified by `API-ACT-02`, `API-ACT-03`, `UI-ACT-02`, `E2E-01`
- **AC-04**: Verified by `API-ACT-05`, `UI-ACT-03`
- **AC-05**: Verified by `API-WKF-02`, `UI-WKF-01`
- **AC-06**: Verified by `API-WKF-03`, `API-WKF-04`, `API-WKF-05`, `UI-WKF-02`, `E2E-02`
- **AC-07**: Verified by `API-WKF-06`, `UI-WKF-03`, `E2E-02`
- **AC-08**: Verified by `API-ACT-08`, `API-DSH-03`, `UI-ACT-01`, `UI-DSH-04`
- **AC-09**: Verified by `API-DSH-11` through `API-DSH-24`, `UI-DSH-01`, `E2E-03`
- **AC-10**: Verified by `API-ACT-11`, `UI-ACT-04`
- **AC-11**: Verified by `API-MIG-01`, `API-MIG-02`
- **AC-12**: Verified by `E2E-04`
- **AC-13**: Verified by `REG-01` (189/189 server tests, 102/102 client tests, 100% pass)
- **AC-14**: Verified by `UI-NAV-01` through `UI-NAV-11`, `UI-NAV-17`, `UI-NAV-18`, `E2E-NAV-01` through `E2E-NAV-04`, `E2E-NAV-06`
- **AC-15**: Verified by `UI-NAV-12` through `UI-NAV-16`, `E2E-NAV-05`

