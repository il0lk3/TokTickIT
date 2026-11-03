# TokTickIT

An IT service desk application designed to streamline support requests for Account and Access, Hardware, Software, and Network issues.

This repository demonstrates a full-stack architecture built progressively. **Lab 1** established the
vertical slice (database to frontend), **Lab 2** introduced the core **Requester Ticketing MVP** (ticket
creation, attachment management, and a Zen Green Premium UI), **Lab 3** added real authentication,
server-side role-based authorization (Requester / IT Staff / Administrator), an operational IT Staff ticket
workflow, and user management. **Lab 4** introduces Action Taken logging, deterministic optimistic concurrency
with Resolution Gate controls, role-tailored operational dashboards, and client routing.

```text
React + Vite + Bootstrap  →  Express REST API (JWT Auth)  →  Prisma ORM  →  PostgreSQL
        (Client)                       (Server)
```

See [docs/lab-02/specification.md](./docs/lab-02/specification.md),
[docs/lab-03/specification.md](./docs/lab-03/specification.md), and
[docs/lab-04/specification.md](./docs/lab-04/specification.md) for the engineering contracts and
business rules for each sprint.

---

## Prerequisites

| Tool | Version Used | Purpose |
|------|--------------|---------|
| **Node.js** | 20.x or higher | Runtime for both client and server |
| **npm** | 9.x or higher | Package manager |
| **Docker Desktop** | Required | Runs PostgreSQL in a containerized environment |

---

## Setup & Installation

Run the following commands from the root of the repository to get the system running locally.

```bash
# 1. Install dependencies for all workspaces and install Playwright browsers
cd server && npm install
cd ../client && npm install
cd ../e2e && npm install
npx playwright install
cd ..

# 2. Create the environment files from templates (server)
cd server
cp .env.example .env
# Open .env and set JWT_SECRET (e.g. JWT_SECRET="your_secure_random_string_here").
# The server, seed runner, and test runner automatically load .env via dotenv.
# (Note: JWT_SECRET is mandatory for running the server and has no fallback, by design).

# 3. Start PostgreSQL via Docker
cd ..
docker compose up -d

# 4. Create database tables and apply migrations
cd server
npx prisma migrate dev

# 5. Insert idempotent seed data (Categories, Systems, Users, Tickets across all 8 statuses, and Actions Taken)
npx prisma db seed
cd ..
```
*Note: The seed script is completely idempotent. Running it repeatedly preserves existing data and generates zero duplicates.*

---

## Test Accounts (Seed Data)

As of Lab 3, all accounts authenticate through the real login screen (the Lab 2 Development Requester
selector has been removed). Every account below uses the same universal initial password and will be
prompted to set a new password on first login.

| Role | Email | Status | Requires Password Change? |
|------|-------|--------|--------------------------|
| **Requester** | `cream.su@example.com`, `bew.su@example.com`, `kanta.su@example.com`, `je.su@example.com`, `bewnoi.su@example.com`, `grace.su@example.com`, `phrao.su@example.com`, `pueng.su@example.com` | Active | Yes |
| **Requester** | `e2e.requester@example.com` | Active | No |
| **Requester** | `inactive.user@example.com` | Inactive | Yes |
| **IT Staff** | `staff1@example.com`, `staff2@example.com`, `staff3@example.com` | Active | Yes |
| **IT Staff** | `e2e.staff@example.com` | Active | No |
| **IT Staff** | `inactive.staff@example.com` | Inactive | Yes |
| **Admin** | `admin@example.com` | Active | Yes |
| **Admin** | `e2e.admin@example.com` | Active | No |

*Universal initial password: `Password123!` — most accounts (including Requesters migrated from Lab 2)
use this password and require a password change on first login. E2E accounts (`e2e.requester@example.com`, `e2e.staff@example.com`, `e2e.admin@example.com`) do not require a password change. These credentials are for local
development only; do not reuse them anywhere else.*

---

## Database Reset

To reset the database to a clean, fresh seed state at any time:

```bash
cd server
npx prisma migrate reset --force
npx prisma db seed
```

---

## Running the Application

Open two separate terminals to start the development servers.

```bash
# Terminal 1: Start the Backend API
cd server
npm run dev

# Terminal 2: Start the Frontend UI
cd client
npm run dev
```

### Service URLs
| Service | URL |
|---------|-----|
| Frontend (Vite) | http://localhost:5173 |
| Backend (Express) | http://localhost:3000 |
| PostgreSQL (Docker)| localhost:5433 |

---

## Running the Tests

The project is built using Test-Driven Development (TDD). Tests are split between the workspaces and
organized by sprint. Every test suite maintains a strict 100% pass rate with zero skipped tests.

```bash
# Run all backend tests (Lab 1 + Lab 2 + Lab 3 + Lab 4)
# 20 test files, 199 passed (100%)
cd server
npm run test

# Or target a specific sprint's backend suite only
npx vitest run tests/lab-02/
npx vitest run tests/lab-03/
npx vitest run tests/lab-04/

# Run all frontend tests (Lab 2 + Lab 3 + Lab 4)
# 15 test files, 140 passed (100%)
cd ../client
npm run test

# Run all end-to-end (E2E) tests
# 51 tests total, 100% pass across Chromium, Tablet WebKit, and Mobile Chromium
cd ../e2e
npm run test

# Or target Lab 4 E2E tests specifically (38 tests)
npm test -- lab-04

# Regenerate Lab 4 Release Evidence Screenshots (@screenshots — 5 suites, 161 @2x PNGs)
npm run test:screenshots

# Verify requirements traceability against codebase
cd ..
node scripts/verify-traceability.js
```

- **Server tests:** Uses `Supertest` and `Vitest`. Tests query the real test database — ensure
  `npx prisma db seed` has run first.
- **Client tests:** Uses `Vitest` and `React Testing Library` in `jsdom`. These mock the `fetch` API and
  render components in a simulated browser.
- **E2E tests:** Uses `Playwright` across Desktop Chromium, Tablet (iPad WebKit), and Mobile (Pixel 5). Automatically boots the server and
  Vite client, verifying multi-role operational flows, concurrency conflicts, and responsive quality sweeps with zero skipped tests.

The full test plan for each sprint can be found in [docs/lab-02/tests.md](./docs/lab-02/tests.md),
[docs/lab-03/tests.md](./docs/lab-03/tests.md), and [docs/lab-04/tests.md](./docs/lab-04/tests.md).

---

## Role Demo Walkthrough Script (Rubric Parts 5–8)

Follow these steps to demonstrate the end-to-end multi-role capabilities of TokTickIT:

### 1. Role: Requester (`e2e.requester@example.com` / `Password123!`)
1. **Sign In**: Navigate to `http://localhost:5173/login`. Enter email and password. Click **Sign In**.
2. **Requester Dashboard**: The landing view displays live personal metrics:
   - Metric cards: **Open Requests**, **In Progress**, **Waiting for You** (`waitingForRequester`), **Recently Resolved**, and **Closed** (all 5 cards feature 1-click drill-downs to `/tickets?status=...`).
   - **Attention Needed** panel for tickets in `WaitingForRequester` status requiring user response.
   - **Recent Activity** list sorted chronologically (`updatedAt DESC, id DESC`).
3. **Create Ticket**:
   - Click **Create Ticket** in the navbar (or Quick Action on dashboard) -> navigates to `/tickets/new`.
   - Select Category (e.g. *Hardware*), Related System, Priority (*HIGH*), enter Summary and Description.
   - Click **Submit Ticket** (and upload a `.png` attachment on the Ticket Detail **Attachments** tab).
4. **Ticket Detail & Conversation**:
   - Opens `/tickets/:id`.
   - Open **Attachments** tab to upload, inspect, or remove attachments.
   - Open **Public Comments** tab and post a public comment. Note: the **Internal Notes** tab is completely hidden from Requesters.
5. **Actions Taken (Read-Only)**:
   - Scroll to the **Actions Taken** section. Note that Requesters can view the complete action history (Date/Time, Description, Result, Performed By, Follow-up, Attachment Notes) in read-only mode with zero create/edit controls.
6. **Advisory Resolution Signal**:
   - When the ticket is in an active state (*Open*, *In Progress*, or *Waiting for Requester*), click **Problem Appears Resolved**.
   - Confirm in the accessible modal. The ticket's `appearsResolved` flag is set, an advisory banner is published for IT Staff, and the public comment `"The problem appears to be resolved."` is automatically appended.
7. **Logout**: Click the **Logout** button in the top navigation bar.

### 2. Role: IT Staff (`e2e.staff@example.com` / `Password123!`)
1. **Sign In**: Navigate to `http://localhost:5173/login`. Enter email and password. Click **Sign In**.
2. **Staff Operational Dashboard**:
   - View operational metric cards: **Unassigned** (unclaimed active tickets), **Assigned to Me** (active tickets owned by current staff), **Appears Resolved** (active tickets with requester advisory signal), and **Updated in 24h** (active tickets updated in last 24 rolling hours).
   - View **Queue Status Breakdown** chips (all 8 statuses), **Priority Overview** chips (*Low*, *Medium*, *High*), **Urgent Active Tickets**, and **My Recent Tickets** tables.
3. **Drill-down to Queue**:
   - Click any metric card (e.g. **Unassigned**), status chip (e.g. **In Progress**), or **High** priority chip.
   - Navigates to `/queue?ownerId=unassigned&active=true`, `/queue?status=InProgress&active=true`, or `/queue?itPriority=HIGH&active=true` with strict 1-to-1 matching ticket counts (`meta.total === card.count`).
   - Notice the **Active Filter Chips** bar above the queue. Click the remove (`×`) button on a chip to clear that single filter in-place, or click **Clear all**.
4. **Open Ticket & Advisory Banner**:
   - Select an active ticket to open `/tickets/:id`.
   - If the Requester signaled resolution, notice the green Requester Advisory Banner (`#requester-advisory-banner`) with a **Review Actions Taken** shortcut button.
5. **Log Action Taken**:
   - Scroll to the **Actions Taken** section (or click the shortcut button).
   - Click **+ Log Action Taken**.
   - Fill in **Action Date/Time**, **Description**, **Result**, optional **Follow-Up Required** (which reveals the mandatory **Follow-up Note** input), and optional **Attachment Notes**. Click **Log Action**.
   - The action is immediately appended to the chronological table, and the parent ticket's Resolution Gate status updates automatically. Click **Edit** on any row to test inline editing and **Save Changes** / **Cancel**.
6. **Resolution Gate & State Transitions**:
   - On a ticket missing an active IT Staff Owner or a completed Action Taken with a result, observe that **Resolve** is disabled (`aria-disabled="true"`) and the **Resolution Gate Requirements** banner provides actionable **Assign Owner** and **Log Action** shortcut buttons.
   - Once an active IT Staff Owner is assigned and at least one Action Taken with a non-empty `result` is logged, the gate banner clears and **Resolve** becomes enabled. Click **Resolve** to transition the ticket to `Resolved` (which increments `version` and locks public comments while keeping `Close Ticket` / `Reopen` transitions active).
   - Clicking terminal actions (**Close Ticket** or **Cancel Ticket**) opens the focus-trapped confirmation dialog (`AccessibleDialog`).
7. **Concurrency Conflict Handling (409)**:
   - If two staff sessions modify a ticket simultaneously (e.g. across two browser tabs), submitting a stale `expectedVersion` triggers HTTP `409 Conflict` and opens the accessible **Conflict Dialog** displaying the server's current status and version with a **Reload Ticket** button.
8. **Logout**: Click **Logout** in the top navigation bar.

### 3. Role: Administrator (`e2e.admin@example.com` / `Password123!`)
1. **Sign In**: Navigate to `http://localhost:5173/login`. Enter email and password. Click **Sign In**.
2. **Admin Dashboard Parity**:
   - Lands on the **IT Administration Dashboard**, which includes the **User Administration** summary card (`adminUserCounts`: Total Users, Active Users, Requesters, IT Staff, Administrators) with a direct link to `/admin/users`.
3. **Full Operational Authority**:
   - Navigate to `/queue` and `/tickets/:id`. Administrators have full operational permissions to assign owners, update priorities, log/edit Actions Taken, and execute workflow status transitions.
4. **User Management**:
   - Navigate to `/admin/users` via the navbar.
   - Create users, edit roles/details, or deactivate accounts.
   - **Self-Deactivation Guard**: Open Edit on the currently logged-in admin account (`e2e.admin@example.com`) and verify that **Deactivate User** is strictly disabled with `"You cannot deactivate your own account."`
5. **Logout**: Click **Logout** in the top navigation bar.

## Repository Layout

```text
toktickit/
├── client/                     # React + TypeScript + Vite + Bootstrap (Zen Green UI)
│   ├── src/
│   └── tests/
│       ├── lab-02/             # Vitest UI tests for Lab 2 components
│       ├── lab-03/             # Vitest UI tests for Lab 3 components
│       └── lab-04/             # Vitest UI tests for Lab 4 (Actions, Workflow, Dashboards, Routing)
├── server/                     # Node.js + Express + TypeScript
│   ├── prisma/                 # Schema, migrations, seed data
│   ├── src/
│   ├── uploads/                # Local attachment storage (ignored in git)
│   └── tests/
│       ├── lab-01/             # Lab 1 vertical slice tests
│       ├── lab-02/             # Supertest API integration tests (Lab 2)
│       ├── lab-03/             # Supertest API integration tests (Lab 3)
│       └── lab-04/             # Supertest API integration tests (Lab 4 Workflow, Dashboard, Hardening)
├── docs/
│   ├── lab-02/                 # Lab 2 engineering specification, test plan, UI/API specs
│   ├── lab-03/                 # Lab 3 engineering specification, test plan, UI/API specs
│   └── lab-04/                 # specification.md, api-spec.md, ui-spec.md, tests.md, reviewer.md, ai-use.md
├── e2e/
│   ├── lab-03/                 # Playwright E2E specs (Lab 3)
│   └── lab-04/                 # Playwright E2E specs (Lab 4 Actions, Dashboard, Regression, Quality Smoke, Screenshots)
├── artifacts/
│   ├── lab-02/                 # Lab 2 evidence artifacts
│   ├── lab-03/screenshots/     # Lab 3 responsive evidence screenshots
│   └── lab-04/                 # Lab 4 161 @2x evidence screenshots (5 domains) & SQL comparison evidence
├── scripts/
│   ├── get-sql-evidence.cjs    # Executes live PostgreSQL raw queries for SQL equivalence evidence
│   ├── reset-test-fixtures.cjs # Restores deterministic seed state before screenshot scenarios
│   └── verify-traceability.js  # Automated bidirectional requirements & test traceability verifier
├── docker-compose.yml           # PostgreSQL container config
└── README.md
```

---

## Git Workflow (Lab 2)

| Issue | Feature Branch | Pull Request Target |
|-------|----------------|---------------------|
| 1. Lab 2 Sprint Specification and Test Plan | `feature/lab2-specs` | `lab2-staging` |
| 2. Database Models & Reference Data | `feature/lab2-context-db` | `lab2-staging` |
| 3. Development Requester Selector | `feature/lab2-selector` | `lab2-staging` |
| 4. Create Ticket API | `feature/lab2-create-ticket-api` | `lab2-staging` |
| 5. Create Ticket UI Component | `feature/lab2-create-ticket-ui` | `lab2-staging` |
| 6. Implement My Tickets API and Upgrade UI | `feature/lab2-my-tickets` | `lab2-staging` |
| 7. Implement Ticket Detail and Soft Remove Attachments | `feature/lab2-ticket-detail` | `lab2-staging` |
| 8. End-to-End Testing & Final Release Polish | `feature/lab2-e2e-real` | `lab2-staging` |

## Git Workflow (Lab 3)

Development follows the same strict feature-branch workflow established in Lab 2. Work is never committed
directly to `main` or `lab3-staging`.

| Issue | Feature Branch | Pull Request Target |
|-------|----------------|---------------------|
| 1. Sprint Specification and Test Plan | `feature/lab3-specs` | `lab3-staging` |
| 2. User Model, DB Migration & Seed Data | `feature/lab3-user-db` | `lab3-staging` |
| 3. Authentication API & Session | `feature/lab3-auth` | `lab3-staging` |
| 4. Login & Change-Password UI + App Shell | `feature/lab3-auth-ui` | `lab3-staging` |
| 5. Requester Regression & Public Comments | `feature/issue-5-requester-flow` | `lab3-staging` |
| 6. IT Staff Ticket Queue | `feature/issue-6-staff-queue` | `lab3-staging` |
| 7. IT Staff Ticket Detail | `feature/issue-7-ticket-detail` | `lab3-staging` |
| 8. Administrator User Management | `feature/issue-8-user-administration` | `lab3-staging` |
| 9. Authorization Hardening, Regression & Cleanup | `feature/issue-9-polish` | `lab3-staging` |
| 10. UI Polish & Zen Green Consistency Pass | `feature/issue-10-ui-polish` | `lab3-staging` |
| 11. Release Evidence (Docs, Screenshots) | `feature/lab3-release-evidence` | `lab3-staging` → `main` |

## Git Workflow (Lab 4)

Development continues following the strict feature-branch workflow. Work is never committed directly to `main` or `lab4-staging`.

| Issue | Feature Branch | Pull Request Target |
|-------|----------------|---------------------|
| 1. Sprint 4 Engineering Contract (Spec DD + Test DD) | `feature/lab4-specs` | `lab4-staging` |
| 2. Database Increment — ActionTaken Model, Migration, Backfill, Seed | `feature/lab4-db-actions-taken` | `lab4-staging` |
| 3. Actions Taken API and Authorization (TDD) | `feature/lab4-actions-taken-api` | `lab4-staging` |
| 4. Ticket Workflow Rules and Conflict Handling (API) | `feature/lab4-ticket-workflow-api` | `lab4-staging` |
| 5. Client Routing and Role-aware Application Shell | `feature/lab4-client-routing-shell` | `lab4-staging` |
| 6. Actions Taken UI on Ticket Detail | `feature/lab4-actions-taken-ui` | `lab4-staging` |
| 7. Ticket Workflow UI and Resolution Feedback | `feature/lab4-ticket-workflow-ui` | `lab4-staging` |
| 8. Dashboard APIs (Requester and IT Staff) | `feature/lab4-dashboard-api` | `lab4-staging` |
| 9. Dashboard UIs, Navigation, and Drill-down | `feature/lab4-dashboard-ui` | `lab4-staging` |
| 10. Regression Hardening, Polish & Evidence | `feature/lab4-regression-hardening` | `lab4-staging` |
| 11. Visual, Responsive, and Accessibility Pass + Release Evidence | `feature/lab4-release-evidence` | `lab4-staging` → `main` |



---

## Troubleshooting

- **`npm run dev` fails to connect to database:** Ensure Docker is running and `docker compose up -d` was
  executed. Check that port `5433` is not being used by another local PostgreSQL instance.
- **Server tests fail with connection error:** The database is likely empty. Run
  `cd server && npx prisma db push && npx prisma db seed` to initialize the testing data.
- **Prisma migration errors:** If the database state gets corrupted during testing, run
  `npx prisma migrate reset` inside the `server/` folder to drop and recreate all tables from scratch.
- **Server fails to start with `FATAL ERROR: JWT_SECRET environment variable is missing.`:** Open `server/.env` and set
  `JWT_SECRET` to any random string. This is required as of Lab 3 and has no fallback, by design.
- **Login fails with "Invalid email or password" for a seeded account:** Confirm the seed ran after the
  latest migration (`npx prisma db seed`), and that you're using the universal password `Password123!`.
- **403 Forbidden on `/api/staff/*` or `/api/admin/*` even when logged in:** The authenticated account's
  role doesn't match what the endpoint requires (e.g. `/api/admin/*` requires the Administrator role).
  Call `GET /api/auth/me` to confirm the current session's role.
- **Stuck on the Change Password screen with no way to proceed:** This is expected for any account using
  its initial password (`requiresPasswordChange: true`) — set a new password that meets the listed
  requirements to continue into the application.