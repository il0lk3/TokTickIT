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
| **API-DSH-01** | API | **AC-02, BR-15** | Requester retrieves dashboard metrics | HTTP 200 OK; returns only tickets and counts owned by user | `server/tests/lab-04/requester-dashboard.api.test.ts` | Planned |
| **API-DSH-02** | API | **AC-08, BR-14** | Requester with zero tickets loads dashboard | HTTP 200 OK; all metric counters return 0; empty array | `server/tests/lab-04/requester-dashboard.api.test.ts` | Planned |
| **API-DSH-03** | API | **BR-15** | Requester attempts to call Staff dashboard endpoint | HTTP 403 Forbidden | `server/tests/lab-04/requester-dashboard.api.test.ts` | Planned |
| **API-DSH-04** | API | **AC-09, BR-14** | Staff retrieves operational dashboard metrics | HTTP 200 OK; metric counts match direct PostgreSQL queries | `server/tests/lab-04/staff-dashboard.api.test.ts` | Planned |
| **API-DSH-05** | API | **BR-13** | Administrator retrieves Staff dashboard | HTTP 200 OK; includes `adminUserCounts` block | `server/tests/lab-04/staff-dashboard.api.test.ts` | Planned |
| **API-MIG-01** | DB | **AC-11** | Database migration preserves Labs 1-3 records | Pre- and post-migration record counts for Users, Tickets, etc. are identical | `server/tests/lab-04/database-regression.test.ts` | Passed |
| **API-MIG-02** | DB | **AC-11** | Seed script is idempotent when executed repeatedly | Database record counts remain unchanged after 2nd seed run | `server/tests/lab-04/database-regression.test.ts` | Passed |
| **UI-ACT-01** | UI | **AC-01, AC-08** | Actions Taken section renders list and empty state | Renders table on desktop, empty alert when 0 actions | `client/tests/lab-04/ActionsTaken.test.tsx` | Planned |
| **UI-ACT-02** | UI | **AC-03** | Requester sees read-only view without create/edit controls | Form buttons hidden; action data readable | `client/tests/lab-04/ActionsTaken.test.tsx` | Planned |
| **UI-ACT-03** | UI | **AC-04** | Follow-Up checkbox reveals note field with inline validation | Note input expands; validates on submit | `client/tests/lab-04/ActionsTaken.test.tsx` | Planned |
| **UI-ACT-04** | UI | **AC-10** | Double click on submit action button | Button disables on click; single API call dispatched | `client/tests/lab-04/ActionsTaken.test.tsx` | Planned |
| **UI-ACT-05** | UI | **DoD-7** | Action submission fails with 500 error | Form preserves entered text; displays safe error alert | `client/tests/lab-04/ActionsTaken.test.tsx` | Planned |
| **UI-WKF-01** | UI | **AC-05, BR-10** | Status controls render only permitted transitions | Only valid next statuses shown in dropdown/buttons | `client/tests/lab-04/TicketWorkflow.test.tsx` | Planned |
| **UI-WKF-02** | UI | **AC-06** | Resolution gate incomplete shows helpful feedback | Resolve button disabled with explanatory tooltip | `client/tests/lab-04/TicketWorkflow.test.tsx` | Planned |
| **UI-WKF-03** | UI | **AC-07** | Server returns 409 Conflict | Displays Conflict Modal with "Reload Latest" button | `client/tests/lab-04/TicketWorkflow.test.tsx` | Planned |
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
| **E2E-01** | E2E | **AC-01, AC-03** | Complete Actions Taken flow across roles | Staff logs in -> logs action -> Requester logs in -> sees action read-only | `e2e/lab-04/actions-taken-flow.spec.ts` | Planned |
| **E2E-02** | E2E | **AC-06, AC-07** | Ticket Resolution & Concurrency conflict flow | Resolve blocked -> action added -> Resolve succeeds -> second tab gets 409 | `e2e/lab-04/ticket-resolution.spec.ts` | Planned |
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
- **AC-02**: Verified by `API-DSH-01`, `UI-DSH-03`, `E2E-03`
- **AC-03**: Verified by `API-ACT-02`, `API-ACT-03`, `UI-ACT-02`, `E2E-01`
- **AC-04**: Verified by `API-ACT-05`, `UI-ACT-03`
- **AC-05**: Verified by `API-WKF-02`, `UI-WKF-01`
- **AC-06**: Verified by `API-WKF-03`, `API-WKF-04`, `API-WKF-05`, `UI-WKF-02`, `E2E-02`
- **AC-07**: Verified by `API-WKF-06`, `UI-WKF-03`, `E2E-02`
- **AC-08**: Verified by `API-ACT-08`, `API-DSH-02`, `UI-ACT-01`, `UI-DSH-04`
- **AC-09**: Verified by `API-DSH-04`, `UI-DSH-01`, `E2E-03`
- **AC-10**: Verified by `API-ACT-11`, `UI-ACT-04`
- **AC-11**: Verified by `API-MIG-01`, `API-MIG-02`
- **AC-12**: Verified by `E2E-04`
- **AC-13**: Verified by `REG-01` (165/165 server tests, 60/60 client tests, 100% pass)
- **AC-14**: Verified by `UI-NAV-01` through `UI-NAV-11`, `UI-NAV-17`, `UI-NAV-18`, `E2E-NAV-01` through `E2E-NAV-04`, `E2E-NAV-06`
- **AC-15**: Verified by `UI-NAV-12` through `UI-NAV-16`, `E2E-NAV-05`

