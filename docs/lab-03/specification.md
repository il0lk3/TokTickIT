# Sprint 3 Engineering Specification

## 1. Sprint Goal
Transform the temporary Development Requester system into a secure, role-based application. Introduce real authentication, establish Requester and IT Staff operational workflows, and provide a minimalist Administrator interface for user management, ensuring data migration and backward compatibility with Lab 2.

## 2. Stakeholder Request
The stakeholder needs to replace the temporary mock-user selector with a secure login system. The application must now support real Users with distinct roles (Requester, IT Staff, and Administrator). Requesters will continue their existing workflows but tied to their authenticated identity. IT Staff need a professional Ticket Queue and Ticket Detail screen to manage work, communicate with Requesters via Public Comments, and record private Internal Notes. Administrators need a simple User Management screen to create and manage user accounts. All features must be securely enforced by backend authorization.

## 3. Scope
**Included:**
- Secure authentication (login/logout/current-user) and role-based authorization.
- Mandatory password change for users signing in with an initial password.
- Migration of the Lab 2 Development Requester model to a unified User model.
- Requester workflows (Regression of Lab 2) + Public Comments + "Appears Resolved" action.
- IT Staff workflows: Ticket Queue (search, filter, sort, paginate) and Ticket Detail (claim/reassign, set IT Priority, update status, Public Comments, Internal Notes).
- Administrator workflows: Minimalist User Management (list, search, create, edit, activate/deactivate, set initial password).

**Explicitly Excluded:**
- Email invitations, password-reset emails, MFA, social login, single sign-on.
- Self-registration and Requester-created accounts.
- Formal SLA calculation, escalations, advanced dashboards/analytics.
- Multi-tenant organizations, user deletion, bulk operations.
- Actions Taken by IT Staff.

## 4. Functional Requirements
- **FR-01**: The system must provide secure authentication (login, logout, current-user retrieval) and mandate a password change on first login.
- **FR-02**: The system must enforce server-side role-based authorization for Requesters, IT Staff, and Administrators.
- **FR-03**: Requesters must be able to view, create, and manage only their own Tickets, and post Public Comments.
- **FR-04**: IT Staff must have a Ticket Queue to view, search, filter, sort, and paginate tickets.
- **FR-05**: IT Staff must be able to open Ticket Details to claim/reassign ownership, set IT Priority, change permitted statuses, post Public Comments, and add private Internal Notes.
- **FR-06**: Administrators must have a minimalist User Management screen to view, search, create, and edit users, including assigning roles, activating/deactivating accounts, and setting initial passwords.

## 5. Business Rules
- **BR-01**: Only an active user with valid credentials may authenticate.
- **BR-02**: A user marked as requiring a password change cannot enter the normal application until a new valid password is saved.
- **BR-03**: The authenticated user identity, not a requesterId supplied by the client, determines ownership of Requester operations.
- **BR-04**: Public Comments are visible to the Requester and IT Staff. Internal Notes are visible only to IT Staff.
- **BR-05**: A Requester may indicate that the problem appears resolved, but cannot formally set the Ticket to Resolved or Closed.
- **BR-06**: An Administrator cannot deactivate their own account or remove the last active Administrator.
- **BR-07**: Duplicate email addresses are prevented during user creation or updates.
- **BR-08**: Requested Priority remains the value submitted by the Requester. IT Priority initially copies Requested Priority and may later be changed only by IT Staff.
- **BR-09**: Valid Ticket statuses are New, Open, In Progress, Waiting for Requester, Resolved, Closed, Reopened, and Cancelled. The explicit transition matrix is as follows:
  - `New` -> `Open` (IT Staff claims the ticket)
  - `Open` -> `In Progress` (IT Staff begins work)
  - `In Progress` -> `Waiting for Requester` (IT Staff needs more info)
  - `Waiting for Requester` -> `In Progress` (IT Staff resumes work after Requester replies)
  - `In Progress` / `Open` -> `Resolved` (IT Staff marks resolved)
  - `Resolved` -> `Closed` (IT Staff closes after confirmation)
  - `Resolved` -> `Reopened` (IT Staff reopens if issue persists)
  - `Any` -> `Cancelled` (IT Staff cancels ticket)
- **BR-10**: Both Public Comments and Internal Notes are append-only. Editing, deletion, or whitespace-only content is not permitted.
- **BR-11**: Passwords must meet complexity requirements and JWT sessions must securely expire.
- **BR-12**: Logout must fully invalidate the session/token.
- **BR-13**: A user can only be assigned exactly one role.
- **BR-14**: A Ticket can have zero or one primary Ticket Owner, who must be an active IT Staff user.
- **BR-15**: Public Comments and Internal Notes must have justified length limits (e.g., maximum 1000 characters) and cannot be empty.

### 5.1. Authorization Matrix
| Operation | Requester | IT Staff | Administrator |
|---|---|---|---|
| View own tickets | Yes | Yes | No |
| Create ticket | Yes | No | No |
| View Ticket Queue | No | Yes | No |
| Change Ticket Owner | No | Yes | No |
| Change IT Priority | No | Yes | No |
| Change Status | No | Yes | No |
| Post Public Comment | Yes (own ticket) | Yes | No |
| Post Internal Note | No | Yes | No |
| Manage Users | No | No | Yes |

## 6. UI Specification Summary
The UI will reuse the Zen Green design system. New additions include:
- **Login & Password Change**: Screens for authentication and mandatory initial password change, with validation and safe failure feedback.
- **App Shell**: Top navigation updated to remove the Dev Requester Selector and replace it with an authenticated user profile menu (with Logout). Navigation links are role-restricted.
- **Requester Detail**: Added a section for Public Comments and a "Problem Appears Resolved" action.
- **IT Staff Queue**: A data table/grid supporting search, filters, pagination, and sorting.
- **IT Staff Detail**: Expanded ticket view with editable operational fields (Owner, IT Priority, Status), Public Comments, and visually distinct Internal Notes.
- **Admin User Management**: A list view with search/filters, and a modal/form for creating and editing user accounts.
Detailed wireframes and responsive behavior are defined in `docs/lab-03/ui-spec.md`.

## 7. Data Changes
- **Models**:
  - `User` (migrated from `RequesterUser`): Includes `email`, `name`, `passwordHash`, `role` (Requester, IT Staff, Admin), `isActive`, `requiresPasswordChange`.
  - `PublicComment`: Includes `content`, `authorId`, `ticketId`, `createdAt`.
  - `InternalNote`: Includes `content`, `authorId`, `ticketId`, `createdAt`.
- **Relationships**:
  - `Ticket.requesterId` maps to `User.id` (Requester).
  - `Ticket.ownerId` maps to `User.id` (IT Staff, optional).
- **Migration**: Existing `RequesterUser` records will be migrated to `User` records with role `Requester`. Existing tickets remain linked correctly. Migrated users will receive the universal initial password `Password123!` (securely hashed) to maintain immediate accessibility.
- **Seed**: Updated to include 4 active/1 inactive Requesters, 3 active/1 inactive IT Staff, 1 active Admin, and realistic ticket/comment data.

## 8. API Contract
Detailed in `docs/lab-03/api-spec.md`. Key endpoints:
- `POST /api/auth/login`: Authenticate and return JWT token in HttpOnly cookie.
- `POST /api/auth/logout`: Clear session.
- `GET /api/auth/me`: Retrieve current user.
- `POST /api/auth/change-password`: Update initial password.
- `GET /api/staff/tickets`: IT Staff queue retrieval.
- `PATCH /api/staff/tickets/:id`: Update ticket operational fields.
- `POST /api/tickets/:id/comments`: Add public comment.
- `POST /api/tickets/:id/notes`: Add internal note (restricted).
- `GET /api/admin/users`: List users.
- `POST /api/admin/users`: Create user.
- `PUT /api/admin/users/:id`: Edit user.

## 9. Acceptance Criteria
- **AC-01**: Given an active user with valid credentials, when the user logs in, then the backend establishes authenticated access and returns the permitted user identity and role.
- **AC-02**: Given a user who must change the initial password, when login succeeds, then normal application screens remain unavailable until a valid new password is saved.
- **AC-03**: Given an authenticated Requester, when the client supplies another requesterId, then the backend still applies the authenticated identity and does not return another Requester's data.
- **AC-04**: Given a Requester account, when an Internal Note endpoint is requested, then the operation is rejected (403 Forbidden).
- **AC-05**: Given an IT Staff user, when viewing the Queue, then tickets are filterable, sortable, and paginated correctly.
- **AC-06**: Given an Admin user, when attempting to deactivate their own account, then the system rejects the operation.
- **AC-07**: Given an inactive user, when attempting to log in, then the system returns a safe generic failure without exposing exact account status.
- **AC-08**: Given an Admin user, when creating or updating a user, duplicate email addresses are rejected with a 409 Conflict.
- **AC-09**: Given an Admin user, when setting a new initial password, the target user's `requiresPasswordChange` is set to true.
- **AC-10**: Given an Admin user, attempting to delete or deactivate the last active Admin is rejected.
- **AC-11**: Given an authenticated user, when logging out, the session token is fully invalidated and protected routes return 401.
- **AC-12**: Given an IT Staff user, when changing a ticket status, invalid transitions according to the matrix are rejected.
- **AC-13**: Given any user, when posting a comment or note, empty content or content exceeding length limits is rejected.
- **AC-14**: Given a Requester, all Lab 2 Ticket and Attachment functions continue to work seamlessly using their authenticated identity.
- **AC-15**: Given a non-Admin user, any attempt to access the Admin User Management endpoints returns 403 Forbidden.

## 10. Definition of Done
- **Git Workflow**: Commit history shows feature branches merged into `lab3-staging` and then `main`; final GitHub Project/Kanban with all Issues in Done; rendered `reviewer.md` with reviewer identity, PR links, comments, responses, and approvals; README and `.gitignore` evidence; repository directory structure.
- **Spec DD**: Rendered `docs/lab-03/specification.md` showing numbered requirements, business rules, authorization matrix or rules, acceptance criteria, migration decisions, and Product Definition of Done.
- **Test DD and Traceability**: Rendered `docs/lab-03/tests.md` including planned tests, AC traceability, actual test-file paths, and final status. Complete unit, API/integration, UI, authorization, regression, and E2E passing test output from main.
- **AI Use with Reflection**: Rendered `docs/lab-03/ai-use.md` naming the LLM used and showing 6-10 selected key prompts, with a brief "My Reflection".
- **Working Login and Password Change UI**: Valid and invalid login, inactive-account handling, busy and safe failure feedback, mandatory first-password change, authenticated user/role display, logout, and direct access blocked after logout.
- **Working IT Staff Ticket Queue UI**: Realistic queue data, search, filters, sorting, pagination, assigned/unassigned ownership, status and priority badges, open-detail action, empty/no-results/failure feedback, and responsive behavior.
- **Working IT Staff Ticket Detail UI**: Claim/reassign, IT Priority, permitted status changes, Public Comments, Internal Notes, Attachment continuity, Requester resolution indication, role restrictions, validation, and safe failure behavior. Include direct API authorization evidence.
- **Working Administrator User Management UI**: User list, search by name/email, optional role filtering, create user, duplicate-email and invalid-input validation, edit name/email/role/activation state, set new initial password, prevention of self-deactivation/removing last active Admin, forbidden access for non-Administrators.
- **Zen Green UI and Responsive Evidence**: Rendered `ui-spec.md` plus desktop, tablet, and mobile screenshots for all major Lab 3 screens.

## 11. Assumptions and Decisions
- **Authentication**: We will use JWT stored in `HttpOnly` and `SameSite=Strict` cookies for secure session management without complex session stores. The JWT token lifetime will be set to 2 hours. Logout will invalidate the session by clearing the cookie.
- **Passwords**: `bcryptjs` will be used for password hashing with a cost factor (salt rounds) of 10 to balance security and performance during local development.
- **Migration Strategy**: During startup or via a script, the existing `RequesterUser` table will be renamed/migrated to `User`. The existing SQLite/Postgres data will be preserved.
- **Pagination**: The IT Staff queue will use standard offset/limit pagination (e.g., `page=1, limit=10`).
