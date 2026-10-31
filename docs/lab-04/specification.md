# Sprint 4 Engineering Specification: TokTickIT Actions Taken, Dashboards, and Final Regression

## 1. Sprint Goal
Complete the core TokTickIT service-desk workflow by introducing child "Actions Taken" records under Tickets, enforcing backend-driven Ticket lifecycle and resolution gates, delivering role-appropriate operational Dashboards with drill-down capabilities for Requesters and IT Staff/Administrators, and hardening the entire application across security, responsive design, accessibility, and zero-regression compliance for final product release.

## 2. Stakeholder Request
The service desk can now receive tickets and allow communication between IT Staff and Requesters, but operational teams lack a structured way to plan, track, and audit actual work performed. Stakeholders require an "Actions Taken" history on each Ticket—recording action timestamps, descriptions, results, authenticated performers, follow-up flags/notes, and attachment hints. Furthermore, Tickets may have one primary Ticket Owner coordinating overall resolution, while multiple IT Staff members contribute recorded actions. Requesters can indicate that their issue appears resolved, but formal resolution must be verified and closed by IT Staff through an explicit resolution gate. Finally, both Requesters and IT Staff need concise, real-time dashboards connected to detailed filtered lists, with the entire system polished under the Zen Green design system.

## 3. Scope

### Included Work
- **Parent-Child Work Structure**: Implementation of `ActionTaken` model linked to `Ticket` (1:N) and `User` (performer).
- **Actions Taken Management**: List, create, and edit actions with field validations (mandatory follow-up notes when flagged, character limits, immutable actor binding).
- **Ticket Workflow & Resolution Gate**: Strict backend enforcement of the status-transition matrix; requiring an assigned Ticket Owner and at least one Action Taken with a recorded result before transitioning to `Resolved`.
- **Optimistic Concurrency Control**: Detection of stale updates (HTTP 409 Conflict) using an incremental `version` counter on `Ticket` to prevent silent overwrites during concurrent operations.
- **Role-Appropriate Operational Dashboards**: Backend-aggregated metrics and recent ticket summaries for Requesters (`/api/dashboard/requester`) and IT Staff/Admin (`/api/dashboard/staff`), supporting filter drill-down.
- **Database Evolution**: Zero-data-loss Prisma migration preserving all Lab 1–3 records, backfilling default values, and expanding idempotent seeds to cover all operational scenarios (zero and non-zero counts).
- **Application Shell & Navigation**: Dedicated Dashboard navigation with active-page indication and role-based access.
- **Hardening & Regression Assurance**: Full regression testing of Labs 1–3, elimination of console warnings/errors, accessibility compliance (WCAG 2.1 AA focus, ARIA, non-color cues), and responsive mobile/tablet/desktop layouts.

### Explicitly Excluded Work
- Automatic SLA countdown timers, escalation alert engines, and breach notifications.
- External messaging transports (Email, SMS, LINE, Webhook, push notifications).
- Inventory consumption, spare parts procurement, billing, payroll, or labor cost accounting.
- Multi-level hierarchical approval workflows or cryptographic digital signatures.
- Advanced business intelligence (BI) report builders or external data warehouse exports.
- Multi-tenant organizational partitioning or distributed multi-region cloud clustering.
- Any unapproved feature extensions outside the Sprint 4 engineering contract.

---

## 4. Functional Requirements

- **FR-01 (Actions Taken Recording)**: Permitted IT Staff and Administrators must be able to create and update Action Taken entries under any accessible ticket. The action must record timestamp, description, result, follow-up requirement, follow-up note, and attachment notes. The performer identity must be derived automatically from the authenticated session.
- **FR-02 (Actions Taken Read Visibility)**: Requesters must be able to view all Action Taken entries associated with their owned tickets in read-only mode. Requesters are strictly forbidden from creating, updating, or deleting actions.
- **FR-03 (Ticket Lifecycle & Status Enforcement)**: The system must enforce a formal Ticket status-transition matrix on the backend across all 8 statuses: `New`, `Open`, `In Progress`, `Waiting for Requester`, `Resolved`, `Closed`, `Reopened`, and `Cancelled`. Direct API requests bypassing the UI must be validated and rejected if illegal.
- **FR-04 (Resolution Gate Enforcement)**: The backend must prohibit moving a Ticket to `Resolved` status unless the Ticket has an assigned active IT Staff Owner AND at least one associated Action Taken entry with a non-empty `result`.
- **FR-05 (Advisory Resolution Indication)**: Requesters may signal that their issue appears resolved (`appearsResolved = true`), which posts an advisory audit comment and visual badge, but this action does not alter the formal Ticket status.
- **FR-06 (Optimistic Concurrency & Conflict Protection)**: Every status change and ticket modification must submit an `expectedVersion`. If the submitted version does not match the authoritative database version, the backend must return HTTP 409 Conflict without modifying data.
- **FR-07 (Requester Dashboard)**: The system must provide a dedicated Requester Dashboard displaying authoritative metrics (`openRequests`, `inProgress`, `waitingForRequester`, `recentlyResolved`, `closed`), attention tickets (`attentionTickets`), recent tickets (`recentTickets`), quick action shortcuts, and filter drill-downs.
- **FR-08 (IT Staff & Admin Dashboard)**: The system must provide an IT Staff Dashboard displaying operational metrics (`unassigned`, `ownedByMe`, `appearsResolved`, `recentlyUpdated`, `byStatus`, `byPriority`), quick queue filters, and recent activity (`myRecentTickets`, `urgentTickets`). Administrators access the IT Staff dashboard augmented with system user counts (`adminUserCounts`).
- **FR-09 (Zen Green Consistency & Final Hardening)**: The entire web application must adhere to the Zen Green design system, maintain clean browser console output (zero errors/warnings), prevent double submissions, and provide responsive, accessible views across desktop (≥1200px), tablet (768px–1199px), and mobile (<768px).

---

## 5. Business Rules

- **BR-01 (Parent-Child Integrity)**: An Action Taken belongs to exactly one Ticket. Once created, an action cannot be transferred or relinked to another ticket (`ticketId` is immutable).
- **BR-02 (Collaborative Action Execution)**: The Ticket Owner coordinates the Ticket as a whole, but any active IT Staff member or Administrator may perform and log an Action Taken on that ticket.
- **BR-03 (Authoritative Performer Binding)**: The `performedById` attribute must strictly be populated from the server-validated JWT session. The backend must ignore or reject any `performedById` or `userId` supplied in the client request payload.
- **BR-04 (Follow-Up Conditional Requirement)**: If `followUpRequired` is `true`, `followUpNote` is strictly mandatory and cannot be empty or whitespace-only. If `followUpRequired` is `false`, `followUpNote` is optional and cleared.
- **BR-05 (Text Field Validation Limits)**:
  - `description`: 1 to 1,000 characters (cannot be whitespace-only).
  - `result`: 1 to 1,000 characters (cannot be whitespace-only).
  - `followUpNote`: 1 to 1,000 characters when required.
  - `attachmentNotes`: Optional, up to 500 characters.
- **BR-06 (Action Audit Trail & Immutability)**: Actions Taken records are permanent and append-and-edit only. Hard deletion of Action Taken records is prohibited to preserve operational traceability.
- **BR-07 (Terminal Ticket Action Locking)**: No new Actions Taken can be created, and existing actions cannot be edited, on Tickets in terminal statuses (`Closed` or `Cancelled`).
- **BR-08 (Advisory Resolution Flag)**: Requester indication of problem resolution is purely informational (`appearsResolved = true`). Only permitted IT Staff or Administrators can formally transition a Ticket to `Resolved`.
- **BR-09 (Resolution Gate)**: A Ticket transition to `Resolved` requires:
  1. `ownerId != null` and the assigned owner must be an active User with role `IT_STAFF`.
  2. The ticket must have at least one `ActionTaken` child record where `result` is non-empty (`result.trim().length > 0`). *(Assumption: For Reopened tickets, having at least one ActionTaken with a non-empty result satisfies the Resolution Gate).*
- **BR-10 (Strict Status Transition Matrix)**: Permitted transitions are restricted to the 8x8 matrix defined in Section 5.2. Any transition not explicitly listed is rejected with HTTP 400 (`INVALID_STATUS_TRANSITION`).
- **BR-11 (Optimistic Concurrency Invariant)**: Each state transition and operational field update (`ownerId`, `itPriority`, `status`) must include mandatory `expectedVersion`. The backend performs an atomic conditional update (`where: { id, version: expectedVersion }`) and increments `version` by 1. If mismatched or stale, HTTP 409 is returned (`STALE_VERSION_CONFLICT`). Missing version returns HTTP 400 (`VERSION_REQUIRED`).
- **BR-12 (Assignee Eligibility & Inactive Rejection)**: A Ticket Owner (`ownerId`) must be an active User with role `IT_STAFF`. Assignment to an inactive user (`isActive == false`) is rejected with HTTP 400 (`INACTIVE_ASSIGNEE_REJECTED`). Assignment to a non-staff role is rejected with HTTP 400 (`ASSIGNEE_NOT_ELIGIBLE`).
- **BR-13 (Role Hierarchy & Admin Capabilities)**: In Sprint 4, Administrators possess full operational IT Staff permissions (viewing queues, updating tickets, adding actions, executing status changes) in addition to user management capabilities.
- **BR-14 (Authoritative Backend Analytics)**: Dashboard metric figures must be computed via PostgreSQL aggregate queries (`COUNT`, `GROUP BY`) by the backend. Endpoints must return compact metric objects, not collections of full Ticket records.
- **BR-15 (Tenant Isolation on Dashboards)**: Requester dashboard calculations must strictly filter by `where: { requesterId: authenticatedUser.id }`. Under no circumstances may one Requester view or infer another Requester's operational counts.
- **BR-16 (Stable Chronological Ordering)**: Action Taken lists must return in a deterministic order: chronological by `actionAt` ASC, secondary sort by `id` ASC.

### 5.1 Authorization Matrix

| Operation | Requester | IT Staff | Administrator |
|---|:---:|:---:|:---:|
| View own tickets & actions | Yes | No* | No* |
| View Ticket Queue | No | Yes | Yes |
| View Ticket Detail & Actions | Yes (own ticket, read-only) | Yes | Yes |
| Create Ticket | Yes | Yes (on behalf of user) | Yes (on behalf of user) |
| Create Action Taken | No (403) | Yes | Yes |
| Edit Action Taken | No (403) | Yes | Yes |
| Assign / Reassign Owner | No (403) | Yes | Yes |
| Update IT Priority | No (403) | Yes | Yes |
| Change Ticket Status | No (403)** | Yes | Yes |
| Signal Problem Appears Resolved | Yes (own ticket) | No | No |
| Post Public Comment | Yes (own ticket) | Yes | Yes |
| Post Internal Note | No (403) | Yes | Yes |
| View Requester Dashboard | Yes (own data only) | No (403) | No (403) |
| View IT Staff Dashboard | No (403) | Yes | Yes |
| User Administration | No (403) | No (403) | Yes |

*\* IT Staff and Administrators manage tickets via the operational Ticket Queue and Detail screens.*  
*\*\* Requesters may only signal `appearsResolved = true` via the dedicated advisory endpoint.*

### 5.2 Ticket Status-Transition Matrix

| Current Status | Target Status | Permitted Roles | Pre-conditions & Business Rules |
|---|---|:---:|---|
| `New` | `Open` | Staff, Admin | Claiming ticket or assigning active owner. |
| `New` | `Cancelled` | Staff, Admin | Reason required; ticket cancelled prior to opening. |
| `Open` | `InProgress` | Staff, Admin | Work has begun; ticket must have an assigned Owner. |
| `Open` | `Resolved` | Staff, Admin | Must satisfy **Resolution Gate** (Owner + ≥1 Action with Result). |
| `Open` | `Cancelled` | Staff, Admin | Ticket cancelled. |
| `InProgress` | `WaitingForRequester` | Staff, Admin | Awaiting input/testing from Requester. |
| `InProgress` | `Resolved` | Staff, Admin | Must satisfy **Resolution Gate** (Owner + ≥1 Action with Result). |
| `InProgress` | `Cancelled` | Staff, Admin | Ticket cancelled. |
| `WaitingForRequester` | `InProgress` | Staff, Admin | Requester provided response or staff resumed work. |
| `WaitingForRequester` | `Resolved` | Staff, Admin | Must satisfy **Resolution Gate** (Owner + ≥1 Action with Result). |
| `WaitingForRequester` | `Cancelled` | Staff, Admin | Ticket cancelled. |
| `Resolved` | `Closed` | Staff, Admin | Requester confirmed resolution or retention period elapsed. |
| `Resolved` | `Reopened` | Staff, Admin | Problem recurred; moves back to active investigation. |
| `Resolved` | `Cancelled` | Staff, Admin | Resolution invalidated; ticket terminated. |
| `Closed` | `Reopened` | Staff, Admin | Issue reopened under exceptional conditions. |
| `Reopened` | `InProgress` | Staff, Admin | Work resumed on reopened issue. |
| `Reopened` | `Resolved` | Staff, Admin | Must satisfy **Resolution Gate** (Owner + ≥1 Action with Result). |
| `Reopened` | `Cancelled` | Staff, Admin | Ticket cancelled. |
| `Cancelled` | *(None)* | — | **Terminal State:** No further transitions permitted. |

---

## 6. UI Specification Summary

The UI extends the established **Zen Green** design language. Complete wireframes, responsive grids, and design tokens are detailed in `docs/lab-04/ui-spec.md`.

- **Global Navigation (App Shell) & Routing Architecture**:
  - The in-memory state switching (`activeTab`, `selectedTicketId`) in `App.tsx` is completely replaced with robust URL routing using `react-router-dom`. Every view has a stable, deep-linkable URL supporting browser Back/Forward navigation, bookmarking, and page refreshes.
  - Top navigation updated with a role-aware **Dashboard** link as real anchor tags (`<NavLink>` / `<Link>`).
  - Active-page state is styled with high-contrast indicator and semantic `aria-current="page"`.
  - Requesters navigate between `Dashboard`, `My Tickets`, and `Create Ticket`.
  - IT Staff navigate between `Dashboard`, `Ticket Queue`, and `Create Ticket`.
  - Administrators navigate between `Dashboard`, `Ticket Queue`, and `User Management`.

### 6.1 Client Route Map
| Path | Allowed Roles | Screen Component | Notes |
|---|---|---|---|
| `/login` | Public (Unauthenticated) | `Login` | Redirects back to intended destination after sign-in |
| `/change-password` | Authenticated (`requiresPasswordChange: true`) | `ChangePassword` | Blocks all other application routes until password changed |
| `/` | Authenticated | Redirect | Redirects to role default landing route (`/dashboard`) |
| `/dashboard` | Requester, Staff, Admin | `RequesterDashboard` / `StaffDashboard` | Role-aware operational landing screen with summary metrics |
| `/tickets` | Requester | `MyTickets` | Full searchable/paginated list; supports URL query filters |
| `/tickets/new` | Requester, Staff, Admin | `CreateTicket` | Create service request; IT Staff can log tickets on behalf of users |
| `/tickets/:ticketId` | Requester (own), Staff, Admin | `TicketDetail` | Deep-linkable ticket view; preserves filter state on Back |
| `/queue` | Staff, Admin | `TicketQueue` | IT Staff operational queue; supports `status`, `owner`, etc. query filters |
| `/admin/users` | Administrator | `UserManagement` | Admin user CRUD and account management |
| `*` | All | `NotFound` | Zen Green 404 page |
- **IT Staff Dashboard (`/dashboard`)**:
  - Operational banner welcoming the authenticated staff member with a quick **Refresh** button.
  - Operational metric cards: `Unassigned`, `Owned By Me`, `Appears Resolved`, `Recently Updated`, along with normalized breakdowns by status and priority.
  - Each card features an accessible drill-down click action linking to the Ticket Queue (`/queue`) filtered by that specific criterion.
  - "My Recent Tickets" (staff owned active tickets) and "Urgent Tickets" (HIGH priority active tickets) tables with status badges, date, and detail links.
  - Quick Action shortcuts: `+ Create Ticket`, `Search Tickets`, `My Queue` (links to `/queue?ownerId=me`).
- **Requester Dashboard (`/dashboard`)**:
  - Concise personal overview summarizing tickets owned by the authenticated Requester.
  - Metric cards: `Open Requests`, `In Progress`, `Waiting for Requester`, `Recently Resolved`, `Closed` (each with View all drill-down to `/tickets?status=...`).
  - "Attention Tickets" (tickets in WaitingForRequester status) and "Recent Tickets" summary list with status badges and timestamps.
  - Quick Action buttons: `+ Create Ticket` and `View My Tickets` (links to `/tickets`).
- **Actions Taken on Ticket Detail (`/tickets/:ticketId`)**:
  - Dedicated "Actions Taken" card/section positioned below Ticket Description and above Comments/Notes.
  - Displays a structured table on desktop and stacked card view on mobile.
  - Columns: Date/Time, Description, Result, Performed By (badge), Follow-Up (icon + text badge), Follow-up Note, Attachment Notes.
  - **Create Action Form (Staff/Admin)**: Expandable drawer/form with client-side validation. Checking "Follow-Up Required" immediately reveals the mandatory "Follow-up Note" field with inline validation.
  - **Inline Edit Mode (Staff/Admin)**: Row-level "Edit" button toggles inputs for Description, Result, Follow-Up flags, and Attachment Notes with Save/Cancel controls.
  - **Read-Only Mode (Requester)**: Displays all recorded actions cleanly without create/edit action triggers.
- **Ticket Workflow & Conflict Feedback**:
  - Workflow transition controls adapt dynamically to the user's role and valid target statuses.
  - If a Ticket has not met the Resolution Gate, the "Resolve" button displays an explanatory helper tooltip/message ("Ticket requires an assigned owner and at least one completed action").
  - On concurrent update collision (409 Conflict), the UI displays a non-destructive conflict modal/toast: *"This ticket was modified by another user. Please reload the latest changes."* with a one-click **Reload** button that protects unsaved input.
- **Responsive & Accessibility Baseline**:
  - Full keyboard navigation across all buttons, dropdowns, and modals.
  - Semantic ARIA attributes (`aria-expanded`, `aria-describedby` for error text, `role="status"`).
  - WCAG 2.1 AA color contrast compliance for text and badge indicators.
  - Zero horizontal overflow or clipped text at 375px (Mobile), 768px (Tablet), and 1200px+ (Desktop).

---

## 7. Data Changes

### 7.1 Data Models & Relationships

Extend the existing PostgreSQL Prisma schema (`server/prisma/schema.prisma`):

```prisma
model ActionTaken {
  id              Int      @id @default(autoincrement())
  ticketId        Int
  actionAt        DateTime @default(now())
  description     String   @db.VarChar(1000)
  result          String   @db.VarChar(1000)
  performedById   Int
  followUpRequired Boolean  @default(false)
  followUpNote    String?  @db.VarChar(1000)
  attachmentNotes String?  @db.VarChar(500)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  ticket          Ticket   @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  performedBy     User     @relation("ActionPerformer", fields: [performedById], references: [id])

  @@index([ticketId, actionAt])
  @@index([performedById])
}
```

Additions to `Ticket` model:
```prisma
model Ticket {
  // ... existing fields ...
  appearsResolved Boolean       @default(false)
  version         Int           @default(1)
  actionsTaken    ActionTaken[]

  // Indexes to support rapid dashboard aggregation
  @@index([currentStatus])
  @@index([ownerId])
  @@index([updatedAt])
}
```

Additions to `User` model:
```prisma
model User {
  // ... existing fields ...
  performedActions ActionTaken[] @relation("ActionPerformer")
}
```

### 7.2 Database Design Decisions & Justifications

1. **Optimistic Concurrency via Integer `version` Field (vs `updatedAt` Timestamp)**:
   - *Decision*: We implement an explicit integer `version` field incremented atomically (`version: { increment: 1 }`) on every state transition or workflow update, rather than comparing `updatedAt` timestamps.
   - *Justification*: Clock drift across multi-container or distributed deployment environments can cause timestamp discrepancies. Furthermore, some database engines or ORM drivers truncate sub-millisecond precision on `DateTime` fields during JSON serialization, which can lead to false-positive conflict rejections or lost updates. An integer version counter is 100% deterministic, cross-platform, and standard in robust enterprise architectures.

2. **Open-Text `result` Field with Minimum Length Validation (vs Fixed Enum/Reference Table)**:
   - *Decision*: The `result` field in `ActionTaken` is structured as a `VarChar(1000)` text field rather than a rigid enum (e.g., SUCCESS/FAILED/PARTIAL).
   - *Justification*: IT operational diagnostics and field interventions vary wildly (e.g., "Replaced thermal paste and ran memtest for 2 hours with 0 errors", "Updated BIOS to v1.4, rebooted twice, issue resolved"). A fixed enum is too reductive for actionable service-desk history. Enforcing non-empty string validation at the API layer satisfies the Resolution Gate while allowing rich, context-specific technical notes.

### 7.3 Migration and Backfill Strategy
- The migration is generated using `npx prisma migrate dev --name add_actions_taken_and_version`.
- **Zero Data Loss Guarantee**: All existing Users, Categories, Systems, Tickets, Attachments, Comments, and Internal Notes remain completely intact.
- Existing legacy tickets without actions are automatically assigned `version = 1`.
- Legacy tickets without actions remain fully viewable. Dashboard metrics treat legacy tickets based on their current status and owner without error.
- **Rollback / Recovery Plan**: A pre-migration PostgreSQL dump (`toktickit_pre_lab4.sql`) is executed before applying migrations. Rollback involves reapplying the previous migration state and restoring the database backup if schema drift occurs.

### 7.4 Idempotent Seed Data
The database seeder (`server/prisma/seed.ts`) is enhanced to be completely **idempotent** (can be re-run indefinitely without duplicate records or primary key collision):
- Creates realistic Tickets covering all 8 statuses (`New`, `Open`, `InProgress`, `WaitingForRequester`, `Resolved`, `Closed`, `Reopened`, `Cancelled`).
- Includes tickets with **zero actions**, **single action**, and **multiple actions** performed by different IT Staff members.
- Includes actions with `followUpRequired = true` and populated `followUpNote`.
- Creates a dedicated Requester with zero tickets to verify that dashboards gracefully handle empty metrics without crashing.
- Accurately distributes timestamps to populate "recently updated" and "recently resolved" metrics.

---

## 8. API Contract Summary

The API contract is formally documented in `docs/lab-04/api-spec.md`. Key endpoints include:

| Method | Endpoint | Authorization | Description |
|---|---|---|---|
| `GET` | `/api/tickets/:id/actions-taken` | Requester (own), Staff, Admin | Retrieve chronological list of actions taken for a ticket |
| `POST` | `/api/tickets/:id/actions-taken` | Staff, Admin | Create a new Action Taken record (actor = session user) |
| `PATCH` | `/api/tickets/:id/actions-taken/:actionId` | Staff, Admin | Update an existing Action Taken record |
| `PATCH` | `/api/staff/tickets/:id` | Staff, Admin | Update ticket owner, priority, status with version check & resolution gate |
| `GET` | `/api/dashboard/requester` | Requester | Retrieve compact operational metrics for authenticated requester |
| `GET` | `/api/dashboard/staff` | Staff, Admin | Retrieve operational queue metrics and activity counts |

All error responses adhere to standard format: `{ "error": "Clear, safe message", "code": "MACHINE_READABLE_CODE" }`.

---

## 9. Acceptance Criteria

- **AC-01 (Create Action Taken)**: Given an authenticated active IT Staff user and valid payload, when submitting `POST /api/tickets/:id/actions-taken`, then the record is saved with `performedById` set to the authenticated user ID and returns HTTP 201.
- **AC-02 (Requester Dashboard Isolation)**: Given an authenticated Requester, when calling `GET /api/dashboard/requester`, then the response returns only metrics and recent tickets owned by that authenticated Requester.
- **AC-03 (Requester Action Modification Prohibition)**: Given an authenticated Requester, when attempting to `POST` or `PATCH` on `/api/tickets/:id/actions-taken`, then the server returns HTTP 403 Forbidden without modifying database state.
- **AC-04 (Follow-Up Validation)**: Given `followUpRequired: true` and an empty `followUpNote`, when submitting an Action Taken, then the API rejects the request with HTTP 400 and an explanatory validation error.
- **AC-05 (Disallowed Status Transitions)**: Given a status transition not permitted by the transition matrix (e.g., `New` -> `Resolved`), when submitted via `PATCH /api/staff/tickets/:id`, then the server returns HTTP 400 with `INVALID_STATUS_TRANSITION`.
- **AC-06 (Resolution Gate Enforcement)**: Given a Ticket without an Owner or with zero completed Actions Taken, when a request is made to set status to `Resolved`, then the server rejects the update with HTTP 400 and code `RESOLUTION_GATE_FAILED`.
- **AC-07 (Optimistic Concurrency Collision)**: Given a request to update ticket status with a stale `expectedVersion`, when processed by the backend, then the server aborts the transaction, makes no changes, and returns HTTP 409 Conflict.
- **AC-08 (Zero-Action Ticket Rendering)**: Given a Ticket with zero Actions Taken, when viewed in the UI, then the system renders a clean empty state without errors, and dashboard calculations execute cleanly.
- **AC-09 (Dashboard Metric Accuracy)**: Given seeded database records, when calling `GET /api/dashboard/staff`, then every reported metric matches the exact count returned by an authoritative direct PostgreSQL aggregate query.
- **AC-10 (Duplicate Submission Prevention)**: Given repeated rapid clicks or network retry on Action Taken submission, then the UI disables submission and the backend prevents duplicate record creation.
- **AC-11 (Data Preservation After Migration)**: Given existing database records from Labs 1–3, when the Prisma migration is applied, then 100% of Users, Tickets, Comments, Notes, and Attachments remain intact and operational.
- **AC-12 (Responsive Mobile Layouts)**: Given any major screen (Dashboard, Ticket Queue, Ticket Detail with Actions Taken) viewed at 375px mobile viewport, then there is no horizontal page scrolling, clipping, or overlapping UI elements.
- **AC-13 (Zero-Regression Suite)**: Given the full suite of automated tests from Labs 1–3, when executed against the Lab 4 codebase, then all tests pass with zero regressions.
- **AC-14 (Role-Based Client Routing & Screen Boundaries)**: Given unauthenticated access to protected routes, the application redirects to `/login` preserving target location in state for seamless post-login return. Given an authenticated user accessing an unauthorized route (e.g. Requester navigating to `/queue` or `/admin/users`), the system renders an in-place Zen Green 403 Forbidden screen with navbar preserved. Invalid paths (or non-numeric ticket IDs) render a Zen Green 404 Not Found screen.
- **AC-15 (URL Single Source of Truth for Screen Filters)**: Given filter or pagination changes on `/queue` or `/tickets`, the URL search parameters update synchronously without page reload. Direct deep links with search parameters (e.g. `/queue?status=Open&itPriority=HIGH`) sanitize values against whitelists and initialize filter inputs accordingly, enabling drill-down navigation from dashboard metric cards. Browser Back/Forward restores previous filter criteria reliably.
- **AC-16 (Security & Error Handling Hardening)**: Given malformed JSON bodies, unknown `/api/*` routes, unauthenticated write requests, or public responses, the server returns structured error envelopes (400/404/401), disables `X-Powered-By`, enforces authentication on all state mutations, and omits sensitive credentials from user representations.
- **AC-17 (Performance Smoke & Query Efficiency)**: Given dashboard and queue API endpoints under load, all endpoints respond within 500ms using aggregate PostgreSQL queries (`COUNT`, `GROUP BY`) without full-table in-memory operations.

---

## 10. Definition of Done (DoD)

A feature or pull request in Sprint 4 is considered **Done** only when meeting all of the following criteria:

1. **Specification Precedence**: Feature implementation strictly adheres to the approved specifications in `docs/lab-04/`.
2. **Test-Driven Traceability**: Every Acceptance Criterion (AC-01 through AC-17) has corresponding automated test coverage in `tests.md` with a passing result.
3. **Automated Test Execution**: All unit, integration, component, and E2E test suites pass cleanly with zero failures (`npm test` in `server`, `client`, and `e2e`).
4. **Zero Console Errors**: Zero JavaScript errors, unhandled promise rejections, or React key warnings in the browser developer console.
5. **Accessibility Compliance**: Meets WCAG 2.1 AA standards for keyboard navigation, visible focus indicators, semantic labels, and non-color dependent status cues.
6. **Responsive Verification**: Verified without clipping, text overflow, or horizontal scrolling across Mobile (375px), Tablet (768px), and Desktop (1280px).
7. **Code Quality & Security**: Backend strictly enforces all authorization and input validations. No sensitive stack traces leaked to clients.
8. **Documentation & Peer Review**: Code has been reviewed and approved via Pull Request targeting `lab4-staging`, with complete review logs documented in `docs/lab-04/reviewer.md` and AI usage documented in `docs/lab-04/ai-use.md`.

---

## 11. Assumptions and Decisions

- **Interpretation of Assignee vs Action Performer**:
  - The Ticket has an assigned Owner (`ownerId`), referred to as the Ticket Assignee.
  - An Action Taken has a `performedById` representing the specific IT Staff member who executed that action.
  - The labsheet's "approved assignee" and "inactive-assignee rejection" rule applies to the Ticket Owner: assigning a ticket to an inactive user or non-staff user is rejected. Furthermore, the action performer must also be an active IT Staff or Administrator account.
- **Collaborative Action Editing**:
  - Any active IT Staff member or Administrator can edit existing Action Taken records on an active ticket to support shift handovers and collaborative troubleshooting.
  - History is preserved because actions cannot be deleted.
- **Terminal Ticket Mutability**:
  - Tickets in `Closed` or `Cancelled` states are strictly locked. No actions taken, public comments, or internal notes can be appended or modified while a ticket remains in a terminal state. If further work is required, the ticket must first be formally transitioned to `Reopened`.
- **Requester Action Visibility**:
  - Requesters can see all Action Taken entries (Date, Description, Result, Performed By, Follow-up Flag, Attachment Notes) on their own tickets. Transparency promotes trust and self-service troubleshooting. Internal Notes remain strictly hidden from Requesters.
- **Administrator Role Alignment**:
  - In accordance with Section 4.3 of the Lab 4 hand-out, Administrators retain full operational IT Staff permissions for testing and support. Middleware will permit both `IT_STAFF` and `ADMINISTRATOR` roles across `/api/staff/*` and Action Taken endpoints.
- **Dashboard Timezone and Date Boundaries**:
  - In accordance with API Spec Section 5, timestamps and rolling interval boundaries (`recentlyResolved` within 7 rolling days, `recentlyUpdated` within 24 rolling hours) operate on deterministic UTC millisecond intervals (`Date.now() - durationMs`), ensuring timezone-invariant accuracy and repeatable test execution.
- **Decision on IT Staff "Create Ticket" Capability**:
  - In accordance with Lab 3 backend middleware (`requireRole(["REQUESTER"])` on `POST /api/tickets`), `/tickets/new` is role-guarded strictly to `REQUESTER`. IT Staff and Administrators attempting to navigate to `/tickets/new` are shown the in-place 403 Forbidden screen, preventing client-side submission of calls that the backend rejects. IT Staff and Administrators manage tickets via the operational Ticket Queue (`/queue`) and Ticket Detail (`/tickets/:id`).
- **Decision on Requester Default Landing Screen & Navigation**:
  - In accordance with Handout Section 4.6 and Section 8.2, the default landing route after login for all roles is `/dashboard`. For Requesters, `/dashboard` displays high-level operational counts (`openRequests`, `inProgress`, `recentlyResolved`, `closed`), recent tickets, and quick action shortcuts. The global navigation bar provides distinct links for both `Dashboard` and `My Tickets` (`/tickets`), ensuring Requesters can effortlessly switch between executive summaries and the full searchable ticket archive without UI ambiguity.
- **Administrator Extended Operational Access**:
  - Administrators can access the Dashboard (`/dashboard`), Ticket Queue (`/queue`), Ticket Detail (`/tickets/:ticketId`), and User Management (`/admin/users`), satisfying Handout Section 4.3 ("Administrator: Perform IT Staff behavior and retain administrative access needed for support and testing").
