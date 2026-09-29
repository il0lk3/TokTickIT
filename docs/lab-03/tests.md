# Lab 3 Test Plan and Results

This document serves as the comprehensive testing matrix for Sprint 3. It tracks automated test execution across the API (Server), React Components (Client), and End-to-End flows.

## Test Commands
- **Server:** `cd server && npm run test`
- **Client:** `cd client && npm run test`
- **End-to-End (E2E):** `cd e2e && npm run test`
  *(Note: The E2E script automatically boots both the backend API and the Vite frontend via Playwright's `webServer` block. No manual server startup is required.)*

---

## 1. Test Strategy & Philosophy
- **Unit & Integration Tests (Server):** Focuses heavily on endpoint validation, business rule enforcement (e.g., ticket numbering constraints, unique identifiers, pagination limits), and relationship constraints.
- **Component Tests (Client):** Uses `React Testing Library` to verify rendering logic and state changes in isolation, with API calls mocked.
- **End-to-End Tests (E2E):** Playwright is used strictly to simulate the end-user's entire flow through the system across multiple pages to ensure state retention and to assert visual/responsive requirements.

---

## 2. Server API Tests (92/92 Passing across 29 Core Scenarios)
The backend test suite verifies strict compliance with the API specifications and handles all edge cases gracefully.

### 2.1 Authentication & Authorization
| Test ID | Requirement / AC | What It Tests | Expected Result | File | Final |
|---|---|---|---|---|---|
| `API-AUTH-01` | **AC-01** | Valid login | `200 OK`; Authenticated response; safe user data; cookie set | `auth.api.test.ts` | Pass |
| `API-AUTH-02` | **AC-01** | Invalid login | `401 Unauthorized`; safe error message | `auth.api.test.ts` | Pass |
| `API-AUTH-03` | **AC-07** | Inactive account login | `401 Unauthorized`; generic error | `auth.api.test.ts` | Pass |
| `API-AUTH-04` | **AC-11** | Logout invalidates session token | `401 Unauthorized` on subsequent requests | `auth.api.test.ts` | Pass |
| `API-AUTH-05` | **AC-02** | Password change required | `403 Forbidden` for normal API endpoints if flag is true | `authorization.api.test.ts` | Pass |
| `API-AUTH-06` | **AC-15** | Non-Admin access to User Management | `403 Forbidden` | `users-admin.api.test.ts` | Pass |
| `API-AUTH-07` | **Auth Matrix** | Admin access to Staff Queue | `403 Forbidden` (Confirms Admin cannot access Staff Queue) | `authorization.api.test.ts` | Pass |
| `API-AUTH-08` | **Auth Matrix** | Admin access to Staff Ticket Detail | `403 Forbidden` (Confirms Admin cannot access Staff operations) | `authorization.api.test.ts` | Pass |

### 2.2 User Management (Administrator)
| Test ID | Requirement / AC | What It Tests | Expected Result | File | Final |
|---|---|---|---|---|---|
| `API-USER-01` | **AC-08, AC-09** | Admin creates/edits user, assigns role | `200/201 OK`; returns correct data and sets flag | `users-admin.api.test.ts` | Pass |
| `API-USER-02` | **BR-07** | Admin creates duplicate email | `409 Conflict` | `users-admin.api.test.ts` | Pass |
| `API-USER-03` | **BR-06** | Admin deactivates self | `409 Conflict` | `users-admin.api.test.ts` | Pass |
| `API-USER-04` | **AC-10** | Admin attempts to deactivate last active Admin | `409 Conflict` | `users-admin.api.test.ts` | Pass |
| `API-USER-05` | **BR-11** | Admin resets initial password | `200 OK`; sets requiresPasswordChange to true | `users-admin.api.test.ts` | Pass |
| `API-USER-06` | **BR-13** | Assign invalid role | `400 Bad Request` | `users-admin.api.test.ts` | Pass |

### 2.3 Ticket Management & Staff Queue
| Test ID | Requirement / AC | What It Tests | Expected Result | File | Final |
|---|---|---|---|---|---|
| `API-TICKET-01` | **AC-05** | IT Staff Ticket Queue with search/filter/sort | `200 OK` Returns filtered/sorted/paginated tickets | `staff-queue.api.test.ts` | Pass |
| `API-TICKET-02` | **BR-08, BR-09** | IT Staff update ticket operational fields | `200 OK`; fields updated successfully | `staff-ticket-detail.api.test.ts` | Pass |
| `API-TICKET-03` | **AC-12** | IT Staff attempts invalid status transition | `400 Bad Request` | `staff-ticket-detail.api.test.ts` | Pass |
| `API-TICKET-04` | **BR-14** | Assign Admin as Ticket Owner | `400 Bad Request` | `staff-ticket-detail.api.test.ts` | Pass |
| `API-TICKET-05` | **BR-09** | Claim sets status to Open | `200 OK` and status transitions to Open | `staff-ticket-detail.api.test.ts` | Pass |
| `API-TICKET-06` | **AC-03** | Requester accessing own ticket | `200 OK`; returns ticket data | `authorization.api.test.ts` | Pass |
| `API-TICKET-07` | **AC-03** | Requester accessing other's ticket | `404 Not Found` | `authorization.api.test.ts` | Pass |

### 2.4 Comments & Notes
| Test ID | Requirement / AC | What It Tests | Expected Result | File | Final |
|---|---|---|---|---|---|
| `API-CMT-01` | **BR-04** | Post public comment | `200 OK` for Req/Staff, `403` for Admin | `comments-notes.api.test.ts` | Pass |
| `API-CMT-02` | **AC-04** | Requester requests Internal Notes | `403 Forbidden` without exposing note content | `comments-notes.api.test.ts` | Pass |
| `API-CMT-03` | **AC-13** | Empty or over-length comment/note rejected | `400 Bad Request` | `comments-notes.api.test.ts` | Pass |
| `API-CMT-04` | **BR-05** | Appears Resolved indicator | Adds comment + updates boolean without formal closure | `comments-notes.api.test.ts` | Pass |
| `API-CMT-05` | **BR-09** | Post on terminal ticket | `400 Bad Request` | `comments-notes.api.test.ts` | Pass |

### 2.5 Migration & Regression
| Test ID | Requirement / AC | What It Tests | Expected Result | File | Final |
|---|---|---|---|---|---|
| `DB-01` | **Migration** | RequesterUser to User migration | Schema valid, existing data intact, seed runs | `migration.test.ts` | Pass |
| `API-REG-01` | **AC-14** | Requester Create Ticket | `200/201 OK`; operations succeed for own data | `requester-regression.api.test.ts` | Pass |
| `API-REG-02` | **AC-14** | Requester List Tickets | `200 OK`; lists own tickets | `requester-regression.api.test.ts` | Pass |

---

## 3. Client UI Tests (25/25 Passing)
The frontend test suite focuses on component behavior, specifically mocking the API to isolate React rendering logic.

### 3.1 Authentication & Shell
| Test ID | Requirement | What It Tests | Expected Result | File | Final |
|---|---|---|---|---|---|
| `UI-AUTH-01` | **FR-01** | Login screen behavior | Renders inputs, handles submit, shows errors | `Login.test.tsx` | Pass |
| `UI-AUTH-02` | **FR-01** | Change Password screen | Renders fields, validates rules | `ChangePassword.test.tsx` | Pass |
| `UI-AUTH-03` | **FR-01** | App Shell | Renders contextual navigations by role | `App.test.tsx` | Pass |

### 3.2 Staff Ticket Operations
| Test ID | Requirement | What It Tests | Expected Result | File | Final |
|---|---|---|---|---|---|
| `UI-STAFF-01` | **FR-04** | IT Staff Ticket Queue table | Renders rows, empty states, search/filter | `StaffTicketQueue.test.tsx` | Pass |
| `UI-STAFF-02` | **FR-05** | IT Staff Ticket Detail forms | Editable fields render correctly | `StaffTicketDetail.test.tsx` | Pass |

### 3.3 Requester Operations
| Test ID | Requirement | What It Tests | Expected Result | File | Final |
|---|---|---|---|---|---|
| `UI-REQ-01` | **FR-03** | Create Ticket | Form handles input and submission | `CreateTicket.test.tsx` | Pass |
| `UI-REQ-02` | **FR-02** | My Tickets list | Renders list with sorting and debounced search | `MyTickets.test.tsx` | Pass |
| `UI-REQ-03` | **FR-02** | Ticket Detail | Renders timeline and comment box | `TicketDetail.test.tsx` | Pass |

---

## 4. End-to-End Tests & Responsive (6/6 Passing)
Playwright tests verify the critical flows, responsive layouts, and UI adherence across viewports.

### 4.1 Functional E2E
| Test ID | Flow | Steps Covered | Final |
|---|---|---|---|
| `E2E-01` | **FR-01:** Full login/logout flow | 1. Navigate to `/login`<br>2. Submit credentials<br>3. Verify redirection<br>4. Click logout and clear session | Pass |
| `E2E-02` | **AC-02:** Initial password login and change | 1. Login with temporary password<br>2. Assert forced redirect to `/change-password`<br>3. Change password successfully | Pass |
| `E2E-03` | **FR-04, FR-05:** IT Staff queue to detail flow | 1. Login as IT Staff<br>2. Search queue<br>3. Click ticket<br>4. Update status and priority | Pass |
| `E2E-04` | **FR-06:** Admin creates user flow | 1. Login as Admin<br>2. Open user management<br>3. Create new user<br>4. Login as new user | Pass |
| `E2E-05` | **AC-14, BR-05:** Requester Ticket flow | 1. Create ticket<br>2. Add comment<br>3. Verify "Appears Resolved" logic | Pass |

### 4.2 Responsive & Style
| Test ID | Flow | What It Tests | Final |
|---|---|---|---|
| `RESP-01` | **Responsive Layouts** | 1. Queue switches to Cards on mobile viewport<br>2. Hamburger menu appears and expands properly<br>3. Ticket detail timeline wraps without horizontal overflow | Pass |
| `UI-STYLE-01` | **UI Style & Zen Green** | 1. Standardized `btn-zen-primary` usage<br>2. Proper gray closed badges `badge-zen-secondary`<br>3. Consistent input focus rings | Pass |

---

## 5. Acceptance-Criterion Traceability Matrix

Every Acceptance Criterion (AC) strictly ties back to at least one automated test.

| AC | Covered By (Test IDs) |
|---|---|
| **AC-01** (Secure Login) | `API-AUTH-01`, `API-AUTH-02`, `E2E-01` |
| **AC-02** (Change Password) | `API-AUTH-05`, `E2E-02` |
| **AC-03** (Role Isolation) | `API-TICKET-06`, `API-TICKET-07` |
| **AC-04** (Internal Note Privacy) | `API-CMT-02` |
| **AC-05** (Staff Queue) | `API-TICKET-01`, `UI-STAFF-01`, `E2E-03` |
| **AC-07** (Inactive Accounts) | `API-AUTH-03` |
| **AC-08** (Admin Create User) | `API-USER-01`, `API-USER-05`, `E2E-04` |
| **AC-09** (Admin Edit User) | `API-USER-01` |
| **AC-10** (Admin Last-Active Rule) | `API-USER-04` |
| **AC-11** (Secure Logout) | `API-AUTH-04`, `E2E-01` |
| **AC-12** (Status Transitions) | `API-TICKET-03`, `E2E-03` |
| **AC-13** (Comment Validation) | `API-CMT-03` |
| **AC-14** (Lab 2 Regression) | `API-REG-01`, `API-REG-02`, `E2E-05` |
| **AC-15** (Admin Authorization) | `API-AUTH-06`, `E2E-04` |

---

## 6. Manual QA & Visual Checklist

While automated tests cover the critical paths, the following visual checks were manually validated to ensure the "Zen Green" design language and polished UX constraints are met:

- [x] **Focus States:** Input fields and textareas feature a smooth green (`#27AE60`) focus ring, overriding default browser blue.
- [x] **Typography:** All tables and badges use appropriate sizing (e.g., `small`, `fw-bold`) to ensure data density without looking cluttered.
- [x] **Disabled/Read-only Styling:** Closed and Cancelled tickets clearly show disabled dropdowns and muted colors, preventing confusion about actionability.
- [x] **Empty States:** The queue gracefully shows a "No tickets found" illustration/text when filters yield zero results.
- [x] **Mobile Menus:** The App Shell's hamburger menu is easily tappable on mobile devices, and closes upon navigation.
- [x] **Horizontal Scroll Prevention:** No pages require horizontal scrolling on devices down to 320px width.
