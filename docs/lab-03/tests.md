# Sprint 3 Test Plan and Traceability Matrix

This document provides a comprehensive mapping of Acceptance Criteria (AC) and Business Rules (BR) derived from the `specification.md` to their corresponding automated test implementations for the Lab 3 sprint. 

All identified test cases have been executed and verified against the designated acceptance criteria.

## 1. Application Programming Interface (API) Tests

| Test ID | Requirement | Test Description | Expected System Behavior | Automated Test File | Final Status |
|---|---|---|---|---|---|
| API-01 | AC-01 | Valid authentication request | 200 OK; returns sanitized user data and assigns an HttpOnly session cookie. | `server/tests/lab-03/auth.api.test.ts` | Done |
| API-02 | AC-01 | Invalid authentication request | 401 Unauthorized; returns a generic error message without enumerating accounts. | `server/tests/lab-03/auth.api.test.ts` | Done |
| API-03 | AC-07 | Inactive account authentication | 401 Unauthorized; returns a generic error message. | `server/tests/lab-03/auth.api.test.ts` | Done |
| API-04 | AC-02 | Mandatory password change enforcement | 403 Forbidden for all application endpoints if the `requiresPasswordChange` flag evaluates to true. | `server/tests/lab-03/authorization.api.test.ts` | Done |
| API-05 | AC-03 | Authorized data access | 200 OK; successfully returns ticket data belonging to the authenticated identity. | `server/tests/lab-03/authorization.api.test.ts` | Done |
| API-06 | AC-03 | Unauthorized cross-user data access | 403 Forbidden or 404 Not Found; prevents access to data unassociated with the session. | `server/tests/lab-03/authorization.api.test.ts` | Done |
| API-07 | BR-04 | Public comment authorization | 200 OK for Requester and IT Staff; 403 Forbidden for Administrator role. | `server/tests/lab-03/comments-notes.api.test.ts` | Done |
| API-08 | AC-04 | Internal notes authorization | 403 Forbidden; Requesters are strictly prohibited from retrieving internal notes. | `server/tests/lab-03/comments-notes.api.test.ts` | Done |
| API-09 | AC-05 | Ticket queue retrieval | 200 OK; returns successfully filtered, sorted, and paginated ticket arrays for IT Staff. | `server/tests/lab-03/staff-queue.api.test.ts` | Done |
| API-10 | BR-08, BR-09 | Ticket operational field updates | 200 OK; IT Staff modifications to ownership, priority, and status persist successfully. | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | Done |
| API-11 | BR-06 | Administrator self-deactivation | 400 Bad Request or 403 Forbidden; an Administrator cannot deactivate their own account. | `server/tests/lab-03/users-admin.api.test.ts` | Done |
| API-12 | BR-07 | Duplicate user email creation | 409 Conflict; strictly prevents the creation of user records with existing email addresses. | `server/tests/lab-03/users-admin.api.test.ts` | Done |
| API-13 | AC-08, AC-09 | User administration lifecycle | 200/201 OK; validates creation, role assignment, and mandatory password reset flags. | `server/tests/lab-03/users-admin.api.test.ts` | Done |
| API-14 | AC-10 | Last active Administrator validation | 403 Forbidden or 400 Bad Request; prevents the system from being left without an active Administrator. | `server/tests/lab-03/users-admin.api.test.ts` | Done |
| API-15 | AC-15 | Administrative endpoint authorization | 403 Forbidden; strictly denies access to User Management APIs for non-Administrator roles. | `server/tests/lab-03/users-admin.api.test.ts` | Done |
| API-16 | AC-14 | Lab 2 API continuation | 200/201 OK; verifies that previous sprint features operate seamlessly under the new authentication model. | `server/tests/lab-03/requester-regression.api.test.ts` | Done |
| API-17 | AC-11 | Session invalidation | 401 Unauthorized on subsequent requests; ensures the logout process fully invalidates the token. | `server/tests/lab-03/auth.api.test.ts` | Done |
| API-18 | AC-12 | Invalid ticket status transition | 400 Bad Request; enforces the transition matrix against illegal status updates. | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | Done |
| API-19 | AC-13 | Comment payload validation | 400 Bad Request; rejects empty or oversized payloads for comments and notes. | `server/tests/lab-03/comments-notes.api.test.ts` | Done |

## 2. Database and Migration Tests

| Test ID | Requirement | Test Description | Expected System Behavior | Automated Test File | Final Status |
|---|---|---|---|---|---|
| DB-01 | Migration | Schema evolution and data integrity | Verifies that the legacy `RequesterUser` table migrates to `User` without data loss and seed execution succeeds. | `server/tests/lab-03/migration.test.ts` | Done |

## 3. User Interface (UI) Component Tests

| Test ID | Requirement | Test Description | Expected System Behavior | Automated Test File | Final Status |
|---|---|---|---|---|---|
| UI-01 | FR-01 | Authentication component rendering | Verifies input rendering, submission handling, and structural presentation of validation errors. | `client/tests/lab-03/Login.test.tsx` | Done |
| UI-02 | FR-01 | Password modification rendering | Verifies structural integrity of the password update form and client-side validation logic. | `client/tests/lab-03/ChangePassword.test.tsx` | Done |
| UI-03 | FR-04 | Ticket queue presentation | Validates the rendering of tabular data, empty states, search inputs, and filter mechanisms. | `client/tests/lab-03/StaffTicketQueue.test.tsx` | Done |
| UI-04 | FR-05 | Ticket detail interface | Validates that editable fields, readonly badges, and tabbed interfaces render accurately based on role. | `client/tests/lab-03/StaffTicketDetail.test.tsx` | Done |
| UI-05 | FR-06 | User management component | Validates the presentation of the user list and the correct initialization of the edit modal. | `client/tests/lab-03/UserManagement.test.tsx` | Done |
| UI-06 | Style/A11y | Accessibility and theme consistency | Verifies that badges utilize `badge-zen-*` tokens, interactive elements possess focus rings, and layout clipping is prevented. | `client/tests/lab-03/ui-style.test.tsx` | Done |

## 4. End-to-End (E2E) Workflow Tests

| Test ID | Requirement | Test Description | Expected System Behavior | Automated Test File | Final Status |
|---|---|---|---|---|---|
| E2E-01 | FR-01 | Comprehensive authentication lifecycle | Validates successful navigation into the application and confirms session termination upon logout. | `e2e/lab-03/authentication.spec.ts` | Done |
| E2E-02 | AC-02 | Initial authentication interception | Validates that users with flagged accounts are forced to update their credentials prior to accessing application features. | `e2e/lab-03/authentication.spec.ts` | Done |
| E2E-03 | FR-04, FR-05 | Staff operational workflow | Simulates IT Staff searching the queue, accessing a specific ticket, and updating its operational status. | `e2e/lab-03/staff-ticket-flow.spec.ts` | Done |
| E2E-04 | FR-06 | Administrative lifecycle workflow | Simulates an Administrator creating a new user entity and verifies successful authentication of the newly created account. | `e2e/lab-03/user-administration.spec.ts` | Done |
| E2E-05 | AC-14, BR-05 | Requester interaction workflow | Simulates a Requester filing a ticket, submitting a comment, and subsequently flagging the issue as resolved. | `e2e/lab-03/requester-flow.spec.ts` | Done |
