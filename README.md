# TokTickIT

An IT service desk application designed to streamline support requests for Account and Access, Hardware, Software, and Network issues.

This repository demonstrates a full-stack architecture built progressively. **Lab 1** established the vertical slice (database to frontend), and **Lab 2** introduces the core **Requester Ticketing MVP**, featuring ticket creation, attachment management, and a Zen Green Premium UI.

```text
React + Vite + Bootstrap  →  Express REST API  →  Prisma ORM  →  PostgreSQL
        (Client)                       (Server)
```

See [docs/lab-02/specification.md](./docs/lab-02/specification.md) for the detailed engineering contract and business rules for the current sprint.

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

# 3. Start PostgreSQL via Docker
docker compose up -d

# 4. Create database tables
npx prisma migrate dev

# 5. Insert seed data (Categories, Systems, and Requesters)
npx prisma db seed
cd ..
```
*Note: The seed script is idempotent. Running it multiple times will not create duplicate records.*

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

The project is built using Test-Driven Development (TDD). Tests are split between the two workspaces.

```bash
# Run backend tests (API & Unit tests)
cd server
npm run test

# Run frontend tests (UI Components & Logic)
cd client
npm run test
```

- **Server tests:** Uses `Supertest` and `Vitest`. Tests like `my-tickets.api.test.ts` query the real test database. Ensure `npx prisma db seed` has run first.
- **Client tests:** Uses `Vitest` and `React Testing Library` in `jsdom`. These mock the `fetch` API and render components in a simulated browser.

The full test plan can be found in [docs/lab-02/tests.md](./docs/lab-02/tests.md).

---

## Repository Layout

```text
toktickit/
├── client/                 # React + TypeScript + Vite + Bootstrap (Premium Zen Green UI)
│   ├── src/
│   └── tests/lab-02/       # Vitest UI tests for components
├── server/                 # Node.js + Express + TypeScript
│   ├── prisma/             # Schema, migrations, seed data
│   ├── src/
│   ├── uploads/            # Local attachment storage (ignored in git)
│   └── tests/lab-02/       # Supertest API integration tests
├── docs/lab-02/            # Engineering specifications, test plans, UI/API specs
├── docker-compose.yml      # PostgreSQL container config
└── README.md
```

---

## Git Workflow (Lab 2)

Development follows a strict feature-branch workflow. Work is never committed directly to `main` or `lab2-staging`.

| Issue | Feature Branch | Pull Request Target |
|-------|----------------|---------------------|
| 5. Development Requester | `feature/lab2-requester-context` | `lab2-staging` |
| 6. My Tickets | `feature/lab2-my-tickets` | `lab2-staging` |
| 7. Ticket Detail & Attachments | `feature/lab2-ticket-detail` | `lab2-staging` |
| 8. E2E Tests | `feature/lab2-e2e` | `lab2-staging` |

---

## Troubleshooting

- **`npm run dev` fails to connect to database:** Ensure Docker is running and `docker compose up -d` was executed. Check that port `5433` is not being used by another local PostgreSQL instance.
- **Server tests fail with connection error:** The database is likely empty. Run `cd server && npx prisma db push && npx prisma db seed` to initialize the testing data.
- **Prisma migration errors:** If the database state gets corrupted during testing, run `npx prisma migrate reset` inside the `server/` folder to drop and recreate all tables from scratch.