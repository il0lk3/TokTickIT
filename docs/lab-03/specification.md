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
- **BR-04**: Public Comments are visible to the Requester, IT Staff, and Administrator. Internal Notes are visible only to IT Staff and Administrator.
- **BR-05**: A Requester may indicate that the problem appears resolved, but cannot formally set the Ticket to Resolved or Closed.
- **BR-06**: An Administrator cannot deactivate their own account or remove the last active Administrator.
- **BR-07**: Duplicate email addresses are prevented during user creation or updates.
- **BR-08**: Requested Priority remains the value submitted by the Requester. IT Priority initially copies Requested Priority and may later be changed only by IT Staff or Administrator.
- **BR-09**: Valid Ticket statuses are New, Open, In Progress, Waiting for Requester, Resolved, Closed, Reopened, and Cancelled.
- **BR-10**: Both Public Comments and Internal Notes are append-only. Editing, deletion, or whitespace-only content is not permitted.

### 5.1. Authorization Matrix
| Operation | Requester | IT Staff | Administrator |
|---|---|---|---|
| View own tickets | Yes | Yes | Yes |
| Create ticket | Yes | No | No |
| View Ticket Queue | No | Yes | No |
| Change Ticket Owner | No | Yes | Yes |
| Change IT Priority | No | Yes | Yes |
| Change Status | No | Yes | Yes |
| Post Public Comment | Yes (own ticket) | Yes | Yes |
| Post Internal Note | No | Yes | Yes |
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
  - `Ticket.ownerId` maps to `User.id` (IT Staff/Admin, optional).
- **Migration**: Existing `RequesterUser` records will be migrated to `User` records with role `Requester`. Existing tickets remain linked correctly.
- **Seed**: Updated to include 4 active/1 inactive Requesters, 3 active/1 inactive IT Staff, 1 active Admin, and realistic ticket/comment data.

## 8. API Contract
Detailed in `docs/lab-03/api-spec.md`. Key endpoints:
- `POST /api/auth/login`: Authenticate and return JWT token in HttpOnly cookie.
- `POST /api/auth/logout`: Clear session.
- `GET /api/auth/me`: Retrieve current user.
- `POST /api/auth/change-password`: Update initial password.
- `GET /api/staff/tickets`: IT Staff queue retrieval.
- `PUT /api/staff/tickets/:id`: Update ticket operational fields.
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

## 10. Definition of Done
Defined in `implementation_plan.md` and `task.md`. Includes completed code, passing tests (Unit/API/E2E), responsive UI verification, documentation (Spec DD), and GitHub PR merge to main.

## 11. Assumptions and Decisions
- **Authentication**: We will use JWT stored in HttpOnly cookies for secure session management without complex session stores.
- **Passwords**: `bcrypt` will be used for password hashing.
- **Migration Strategy**: During startup or via a script, the existing `RequesterUser` table will be renamed/migrated to `User`. The existing SQLite/Postgres data will be preserved.
- **Pagination**: The IT Staff queue will use standard offset/limit pagination (e.g., `page=1, limit=10`).
