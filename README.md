# TokTickIT

An IT service desk application designed to streamline support requests for Account and Access, Hardware, Software, and Network issues.

This repository demonstrates a full-stack architecture built progressively. **Lab 1** established the
vertical slice (database to frontend), **Lab 2** introduced the core **Requester Ticketing MVP** (ticket
creation, attachment management, and a Zen Green Premium UI), and **Lab 3** adds real authentication,
server-side role-based authorization (Requester / IT Staff / Administrator), an operational IT Staff ticket
workflow (queue, ownership, priority, status, comments, and notes), and a minimalist Administrator user
management screen.

```text
React + Vite + Bootstrap  →  Express REST API (JWT Auth)  →  Prisma ORM  →  PostgreSQL
        (Client)                       (Server)
```

See [docs/lab-02/specification.md](./docs/lab-02/specification.md) and
[docs/lab-03/specification.md](./docs/lab-03/specification.md) for the engineering contracts and
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

# 4. Create database tables
npx prisma migrate dev

# 5. Insert seed data (Categories, Systems, Users, and sample Tickets/Comments/Notes)
npx prisma db seed
cd ..
```
*Note: The seed script is idempotent. Running it multiple times will not create duplicate records.*

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

*Universal initial password: `Password123!` — most accounts (including Requesters migrated from Lab 2)
use this password and require a password change on first login. E2E accounts do not require a password change. These credentials are for local
development only; do not reuse them anywhere else.*

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

The project is built using Test-Driven Development (TDD). Tests are split between the two workspaces and
organized by sprint.

```bash
# Run all backend tests (Lab 2 + Lab 3)
cd server
npm run test

# Or target a specific sprint's suite only
npx vitest run tests/lab-02/
npx vitest run tests/lab-03/

# Run all frontend tests (Lab 2 + Lab 3)
cd client
npm run test

# Run end-to-end (E2E) tests
cd e2e
npm run test
```

- **Server tests:** Uses `Supertest` and `Vitest`. Tests query the real test database — ensure
  `npx prisma db seed` has run first (Lab 3 auth/authorization tests in particular depend on all three
  seeded roles being present).
- **Client tests:** Uses `Vitest` and `React Testing Library` in `jsdom`. These mock the `fetch` API and
  render components in a simulated browser.
- **E2E tests:** Uses `Playwright` to drive a real Chromium browser. Automatically boots the server and
  Vite client, testing full user flows (including login/logout, role-based navigation, and responsive
  layouts) — run `npx prisma db seed` before this too.

The full test plan for each sprint can be found in [docs/lab-02/tests.md](./docs/lab-02/tests.md) and
[docs/lab-03/tests.md](./docs/lab-03/tests.md).

---

## Repository Layout

```text
toktickit/
├── client/                     # React + TypeScript + Vite + Bootstrap (Zen Green UI)
│   ├── src/
│   └── tests/
│       ├── lab-02/             # Vitest UI tests for Lab 2 components
│       └── lab-03/             # Vitest UI tests for Lab 3 components
├── server/                     # Node.js + Express + TypeScript
│   ├── prisma/                 # Schema, migrations, seed data
│   ├── src/
│   ├── uploads/                # Local attachment storage (ignored in git)
│   └── tests/
│       ├── lab-02/             # Supertest API integration tests (Lab 2)
│       └── lab-03/             # Supertest API integration tests (Lab 3)
├── docs/
│   ├── lab-02/                 # Lab 2 engineering specification, test plan, UI/API specs
│   └── lab-03/                 # specification.md, api-spec.md, ui-spec.md, tests.md,
│                                # reviewer.md, ai-use.md
├── e2e/
│   ├── lab-02/                 # Playwright E2E specs (Lab 2)
│   └── lab-03/                 # Playwright E2E specs (Lab 3)
├── artifacts/
│   └── lab-03/screenshots/     # Responsive screenshots (desktop/tablet/mobile) for submission evidence
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

> Verify branch names above against actual PR history before final submission — some may have diverged
> slightly during implementation.

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