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

## 2. Server API Tests (33/33 Passing)
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

### 2.2 User Management (Administrator)
| Test ID | Requirement / AC | What It Tests | Expected Result | File | Final |
|---|---|---|---|---|---|
| `API-USER-01` | **AC-08, AC-09** | Admin creates/edits user, assigns role | `200/201 OK`; returns correct data and sets flag | `users-admin.api.test.ts` | Pass |
| `API-USER-02` | **BR-07** | Admin creates duplicate email | `409 Conflict` | `users-admin.api.test.ts` | Pass |
| `API-USER-03` | **BR-06** | Admin deactivates self | `400 Bad Request` | `users-admin.api.test.ts` | Pass |
| `API-USER-04` | **AC-10** | Admin attempts to deactivate last active Admin | `403 Forbidden / 400 Bad Request` | `users-admin.api.test.ts` | Pass |

### 2.3 Ticket Management & Staff Queue
| Test ID | Requirement / AC | What It Tests | Expected Result | File | Final |
|---|---|---|---|---|---|
| `API-TICKET-01` | **AC-05** | IT Staff Ticket Queue with search/filter/sort | `200 OK` Returns filtered/sorted/paginated tickets | `staff-queue.api.test.ts` | Pass |
| `API-TICKET-02` | **BR-08, BR-09** | IT Staff update ticket operational fields | `200 OK`; fields updated successfully | `staff-ticket-detail.api.test.ts` | Pass |
| `API-TICKET-03` | **AC-12** | IT Staff attempts invalid status transition | `400 Bad Request` | `staff-ticket-detail.api.test.ts` | Pass |
| `API-TICKET-04` | **AC-03** | Requester accessing own ticket | `200 OK`; returns ticket data | `authorization.api.test.ts` | Pass |
| `API-TICKET-05` | **AC-03** | Requester accessing other's ticket | `404 Not Found` | `authorization.api.test.ts` | Pass |

### 2.4 Comments & Notes
| Test ID | Requirement / AC | What It Tests | Expected Result | File | Final |
|---|---|---|---|---|---|
| `API-CMT-01` | **BR-04** | Public comment access | `200 OK` for Requester, IT Staff (`403` for Admin) | `comments-notes.api.test.ts` | Pass |
| `API-CMT-02` | **AC-04** | Requester requests Internal Notes | `403 Forbidden`; no note data returned | `comments-notes.api.test.ts` | Pass |
| `API-CMT-03` | **AC-13** | Empty or over-length comment/note rejected | `400 Bad Request` | `comments-notes.api.test.ts` | Pass |

### 2.5 Migration & Regression
| Test ID | Requirement / AC | What It Tests | Expected Result | File | Final |
|---|---|---|---|---|---|
| `DB-01` | **Migration** | RequesterUser to User migration | Schema valid, existing data intact, seed runs | `migration.test.ts` | Pass |
| `API-REG-01` | **AC-14** | Requester Lab 2 API continuation | `200/201 OK`; operations succeed for own data | `requester-regression.api.test.ts` | Pass |

---

## 3. Client UI Tests (16/16 Passing)
The frontend test suite focuses on component behavior, specifically mocking the API to isolate React rendering logic.

### 3.1 Authentication & Shell
| Test ID | Requirement | What It Tests | Expected Result | File | Final |
|---|---|---|---|---|---|
| `UI-AUTH-01` | **FR-01** | Login screen behavior | Renders inputs, handles submit, shows errors | `Login.test.tsx` | Pass |
| `UI-AUTH-02` | **FR-01** | Change Password screen | Renders fields, validates rules | `ChangePassword.test.tsx` | Pass |

### 3.2 Staff Ticket Operations
| Test ID | Requirement | What It Tests | Expected Result | File | Final |
|---|---|---|---|---|---|
| `UI-STAFF-01` | **FR-04** | IT Staff Ticket Queue table | Renders rows, empty states, search/filter | `StaffTicketQueue.test.tsx` | Pass |
| `UI-STAFF-02` | **FR-05** | IT Staff Ticket Detail forms | Editable fields render correctly | `StaffTicketDetail.test.tsx` | Pass |

### 3.3 User Administration
| Test ID | Requirement | What It Tests | Expected Result | File | Final |
|---|---|---|---|---|---|
| `UI-ADMIN-01` | **FR-06** | Admin User Management table | Lists users, opens edit modal | `UserManagement.test.tsx` | Pass |
| `UI-ADMIN-02` | **Style/A11y** | Accessibility and styling | Badges use `zen` styles, inputs are accessible | `ui-style.test.tsx` | Pass |

---

## 4. End-to-End Tests (5/5 Passing)
Playwright tests verify the critical flows and UI adherence.

| Test ID | Flow | Steps Covered | Final |
|---|---|---|---|
| `E2E-01` | **FR-01:** Full login/logout flow | 1. Navigate to `/login`<br>2. Submit credentials<br>3. Verify redirection<br>4. Click logout and clear session | Pass |
| `E2E-02` | **AC-02:** Initial password login and change | 1. Login with temporary password<br>2. Assert forced redirect to `/change-password`<br>3. Change password successfully | Pass |
| `E2E-03` | **FR-04, FR-05:** IT Staff queue to detail flow | 1. Login as IT Staff<br>2. Search queue<br>3. Click ticket<br>4. Update status and priority | Pass |
| `E2E-04` | **FR-06:** Admin creates user flow | 1. Login as Admin<br>2. Open user management<br>3. Create new user<br>4. Login as new user | Pass |
| `E2E-05` | **AC-14, BR-05:** Requester Ticket flow | 1. Create ticket<br>2. Add comment (using exact locator)<br>3. Verify "Appears Resolved" logic | Pass |

---

## 5. Acceptance-Criterion Traceability Matrix

Every Acceptance Criterion (AC) strictly ties back to at least one automated test.
