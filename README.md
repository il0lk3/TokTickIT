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
# 1. Install dependencies for both workspaces
cd server && npm install
cd ../client && npm install

# 2. Create the environment files from templates (server)
cd ../server
cp .env.example .env
# IMPORTANT: open .env and set JWT_SECRET to a random string.
# As of Lab 3, the server requires JWT_SECRET and will refuse to start without it — there is no
# hardcoded fallback, by design (see docs/lab-03/specification.md, Section 11).

# 3. Start PostgreSQL via Docker
docker compose up -d

# 4. Create database tables and apply migrations
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
cd client
npm run test

# Run all end-to-end (E2E) tests
# 38 tests, 100% pass across Chromium, Tablet WebKit, and Mobile Chromium
cd e2e
npm run test

# Or target Lab 4 E2E tests specifically
npm test -- lab-04

# Verify requirements traceability against codebase
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
   - Metric cards: Open, In Progress, Waiting on You, and Resolved.
   - Attention Needed card for tickets requiring user response.
   - Recent Tickets table sorted chronologically.
3. **Create Ticket**:
   - Click **+ New Ticket** (or Quick Action on dashboard) -> navigates to `/tickets/new`.
   - Select Category (e.g. *Hardware*), Priority (*High*), enter Title and Description.
   - Attach a file (e.g. `.png` screenshot). Click **Submit Ticket**.
4. **Ticket Detail & Conversation**:
   - Automatically redirects to `/tickets/:id`.
   - Open **Attachments** tab to inspect or preview the uploaded attachment.
   - Open **Conversation** tab and post a public comment. Note: Internal Notes are completely hidden from Requesters.
5. **Actions Taken (Read-Only)**:
   - Scroll to the **Actions Taken** section. Note that Requesters can see action history in read-only mode (no creation or editing controls).
6. **Advisory Resolution Signal**:
   - When the ticket is in an active state (*Open*, *In Progress*, or *Waiting for Requester*), click **Problem Appears Resolved**.
   - Confirm in the accessible modal. An advisory banner is published for IT Staff, and a public confirmation comment is appended.
7. **Sign Out**: Click user menu in navbar and select **Sign Out**.

### 2. Role: IT Staff (`e2e.staff@example.com` / `Password123!`)
1. **Sign In**: Navigate to `http://localhost:5173/login`. Enter email and password. Click **Sign In**.
2. **Staff Operational Dashboard**:
   - View operational cards: Total Open, In Progress, Waiting for Requester, and Resolved Today.
   - View Priority Distribution chips (*High*, *Medium*, *Low*) and Urgent Tickets table.
3. **Drill-down to Queue**:
   - Click the **In Progress** card or **High** priority chip.
   - Navigates to `/queue?status=IN_PROGRESS` or `/queue?itPriority=HIGH` with 1-to-1 matching ticket counts.
   - Notice the active filter chips above the queue. Click the '×' button on a chip to remove that filter in-place.
4. **Open Ticket & Advisory Banner**:
   - Select an assigned or active ticket to open `/tickets/:id`.
   - If the Requester signaled resolution, notice the amber Requester Advisory Banner at the top with a **Review Actions Taken** shortcut button.
5. **Log Action Taken**:
   - Scroll to **Actions Taken** section (or click shortcut in banner).
   - Click **+ Log Action Taken** (or **Assign Owner** shortcut if unassigned).
   - Fill in Description, Action Category, Outcome, and optional Follow-up Date/Note. Click **Save Action**.
   - The action is immediately appended to the audit timeline. Use inline edit to update the action outcome if needed.
6. **Resolution Gate & State Transitions**:
   - Attempt to resolve a ticket without owner or without actions taken: the Resolution Gate displays clear inline validation blocks.
   - Assign Owner to self, log required actions, then click **Resolve Ticket**.
   - Enter Resolution Summary and select Root Cause Category in the Resolution Modal. Click **Confirm Resolution**.
   - The ticket transitions to `RESOLVED`, locks public comments, and increments the ticket version.
7. **Concurrency Conflict Handling (409)**:
   - If two staff members modify a ticket simultaneously (e.g. across two browser tabs), submitting a stale version prompts the accessible **Conflict Dialog (409)** with a **Reload Latest Data** button to prevent data loss.
8. **Sign Out**: Sign out from user menu.

### 3. Role: Administrator (`e2e.admin@example.com` / `Password123!`)
1. **Sign In**: Navigate to `http://localhost:5173/login`. Enter email and password. Click **Sign In**.
2. **Admin Dashboard Parity**:
   - Lands on Staff Operational Dashboard, with an additional **User Counts** panel (Active Requesters, Active IT Staff, Administrators, Inactive Users).
3. **Full Operational Authority**:
   - Navigate to `/queue` and `/tickets/:id`. Administrators have complete operational permissions to triage, claim, log actions, and resolve tickets.
4. **User Management**:
   - Navigate to `/admin/users` via navbar.
   - Search users by name or email, or filter by Role and Active status.
   - Toggle user activation (Active / Inactive) or promote user roles.
   - **Self-Deactivation Guard**: Verify that deactivating the currently logged-in admin account (`e2e.admin@example.com`) is strictly disabled to prevent system lockout.
5. **Sign Out**: Complete session.

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
│   ├── lab-02/                 # Playwright E2E specs (Lab 2)
│   ├── lab-03/                 # Playwright E2E specs (Lab 3)
│   └── lab-04/                 # Playwright E2E specs (Lab 4 Actions, Dashboard, Regression, Quality Smoke)
├── artifacts/
│   ├── lab-03/screenshots/     # Lab 3 responsive evidence screenshots
│   └── lab-04/                 # Lab 4 responsive screenshots (Actions Taken, Dashboards) & SQL analysis
├── scripts/
│   └── verify-traceability.js  # Automated requirements & test traceability verifier
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
| 3. Actions Taken API — CRUD, Validation, and Isolation | `feature/lab4-actions-taken-api` | `lab4-staging` |
| 4. Ticket Workflow API — Concurrency, Resolution Gate & State Transitions | `feature/lab4-ticket-workflow-api` | `lab4-staging` |
| 5. Client Routing and Role-aware Application Shell | `feature/lab4-client-routing` | `lab4-staging` |
| 6. Actions Taken UI — Timeline, Drawer, and Inline Edit | `feature/lab4-actions-taken-ui` | `lab4-staging` |
| 7. Ticket Workflow UI — Controls, Resolution Gate & 409 Reload | `feature/lab4-ticket-workflow-ui` | `lab4-staging` |
| 8. Operational Dashboard API — Metrics & Drill-downs | `feature/lab4-dashboard-api` | `lab4-staging` |
| 9. Operational Dashboard UI — Metrics, Cards & Queue Filters | `feature/lab4-dashboard-ui` | `lab4-staging` |
| 10. Regression Hardening, Polish & Evidence | `feature/lab4-regression-hardening` | `lab4-staging` |
| 11. Final Polish, Review Verification & Release | `feature/lab4-polish-release` | `lab4-staging` → `main` |



---

## Troubleshooting

- **`npm run dev` fails to connect to database:** Ensure Docker is running and `docker compose up -d` was
  executed. Check that port `5433` is not being used by another local PostgreSQL instance.
- **Server tests fail with connection error:** The database is likely empty. Run
  `cd server && npx prisma db push && npx prisma db seed` to initialize the testing data.
- **Prisma migration errors:** If the database state gets corrupted during testing, run
  `npx prisma migrate reset` inside the `server/` folder to drop and recreate all tables from scratch.
- **Server fails to start with `JWT_SECRET environment variable is required`:** Open `server/.env` and set
  `JWT_SECRET` to any random string. This is required as of Lab 3 and has no fallback, by design.
- **Login fails with "Invalid email or password" for a seeded account:** Confirm the seed ran after the
  latest migration (`npx prisma db seed`), and that you're using the universal password `Password123!`.
- **403 Forbidden on `/api/staff/*` or `/api/admin/*` even when logged in:** The authenticated account's
  role doesn't match what the endpoint requires (e.g. `/api/admin/*` requires the Administrator role).
  Call `GET /api/auth/me` to confirm the current session's role.
- **Stuck on the Change Password screen with no way to proceed:** This is expected for any account using
  its initial password (`requiresPasswordChange: true`) — set a new password that meets the listed
  requirements to continue into the application.