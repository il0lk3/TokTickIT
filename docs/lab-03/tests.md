# Sprint 3 Test Plan

This document maps Acceptance Criteria (AC) from `specification.md` to planned and executed tests for Lab 3.

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final |
|---|---|---|---|---|---|---|
| API-01 | API | AC-01 | Valid login | Authenticated response; safe user data; cookie set | `server/tests/lab-03/auth.api.test.ts` | TBD |
| API-02 | API | AC-01 | Invalid login | 401 Unauthorized; safe error message | `server/tests/lab-03/auth.api.test.ts` | TBD |
| API-03 | API | AC-07 | Inactive account login | 401 Unauthorized; generic error | `server/tests/lab-03/auth.api.test.ts` | TBD |
| API-04 | API | AC-02 | Password change required | 403 Forbidden for normal API endpoints if `requiresPasswordChange` is true | `server/tests/lab-03/authorization.api.test.ts` | TBD |
| API-05 | API | AC-03 | Requester accessing own ticket | 200 OK; returns ticket data | `server/tests/lab-03/authorization.api.test.ts` | TBD |
| API-06 | API | AC-03 | Requester accessing other's ticket | 403 Forbidden or 404 Not Found | `server/tests/lab-03/authorization.api.test.ts` | TBD |
| API-07 | API | BR-04 | Public comment access | 200 OK for Requester, IT Staff, Admin | `server/tests/lab-03/comments-notes.api.test.ts` | TBD |
| API-08 | API | AC-04 | Requester requests Internal Notes | Forbidden; no note data returned | `server/tests/lab-03/comments-notes.api.test.ts` | TBD |
| API-09 | API | AC-05 | IT Staff Ticket Queue with search/filter | Returns filtered/paginated tickets | `server/tests/lab-03/staff-queue.api.test.ts` | TBD |
| API-10 | API | BR-08, BR-09 | IT Staff update ticket operational fields | 200 OK; fields updated successfully | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | TBD |
| API-11 | API | BR-06 | Admin deactivates self | 400 Bad Request / 403 Forbidden | `server/tests/lab-03/users-admin.api.test.ts` | TBD |
| API-12 | API | BR-07 | Admin creates duplicate email | 409 Conflict / 400 Bad Request | `server/tests/lab-03/users-admin.api.test.ts` | TBD |
| UI-01 | UI | FR-01 | Login screen behavior | Renders inputs, handles submit, shows errors | `client/tests/lab-03/Login.test.tsx` | TBD |
| UI-02 | UI | FR-01 | Change Password screen | Renders fields, validates rules | `client/tests/lab-03/ChangePassword.test.tsx` | TBD |
| UI-03 | UI | FR-04 | IT Staff Ticket Queue table | Renders rows, empty states, search/filter | `client/tests/lab-03/StaffTicketQueue.test.tsx` | TBD |
| UI-04 | UI | FR-05 | IT Staff Ticket Detail forms | Editable fields render correctly | `client/tests/lab-03/StaffTicketDetail.test.tsx` | TBD |
| UI-05 | UI | FR-06 | Admin User Management table | Lists users, opens edit modal | `client/tests/lab-03/UserManagement.test.tsx` | TBD |
| E2E-01 | E2E | FR-01 | Full login/logout flow | Navigates to app, logout clears session | `e2e/lab-03/authentication.spec.ts` | TBD |
| E2E-02 | E2E | AC-02 | Initial password login and change | Normal app opens only after valid change | `e2e/lab-03/authentication.spec.ts` | TBD |
| E2E-03 | E2E | FR-04, FR-05| IT Staff queue to detail flow | Search queue, click ticket, update status | `e2e/lab-03/staff-ticket-flow.spec.ts` | TBD |
| E2E-04 | E2E | FR-06 | Admin creates user flow | Creates user, logs in as new user | `e2e/lab-03/user-administration.spec.ts` | TBD |
