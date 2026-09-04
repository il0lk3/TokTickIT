# Lab 2 Peer Review Record

A living document tracking the code review process. Reviews run in both directions with my partner.

## My Information

| Field | Detail |
|-------|--------|
| **Name** | Thanakorn Pahunrat |
| **Student ID** | 6707050521 |
| **GitHub** | [@il0lk3](https://github.com/il0lk3) |

---

## Peer Reviewer

| Field | Detail |
|-------|--------|
| **Reviewer Name** | Achiraya Inta |
| **Student ID** | 67070505229 |
| **Reviewer GitHub** | [@Achikan](https://github.com/Achikan) |

---

## Pull Requests Reviewed

> My partner reviewed the following PRs that I submitted.

### PR #22 — Issue 1: Lab 2 Sprint Specification and Test Plan

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/il0lk3/TokTickIT/pull/22](https://github.com/il0lk3/TokTickIT/pull/22) |
| **Reviewer** | [@Achikan](https://github.com/Achikan) |
| **Review Comment** | ok great!  |
| **My Response** | > ## Review: Issue #22 — Lab 2 Sprint Specification & Test Plan<br>> ### Overall Assessment: **Good foundation with several areas needing attention**<br>> The PR establishes a Spec-Driven Development (Spec DD) contract for Lab 2. The four files (`specification.md`, `api-spec.md`, `ui-spec.md`, `tests.md`) are well-structured and demonstrate clear thinking. Below are my findings:<br>> <br>> ### 1. Strengths<br>> * **Clear scope boundaries** — The "Included" vs. "Excluded" section (Spec §3) explic... |
| **Outcome** | Approved and merged |

---

### PR #23 — Issue 2: Database Models & Reference Data

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/il0lk3/TokTickIT/pull/23](https://github.com/il0lk3/TokTickIT/pull/23) |
| **Reviewer** | [@Achikan](https://github.com/Achikan) |
| **Review Comment** | ## Review: Issue #23 — Database Models & Reference Data<br><br>Thanks for the clean, focused implementation. The schema and seed are solid and mostly conform to the Lab 2 spec. I have two blocking items and a couple of suggestions before this can merge.<br><br>---<br><br>### Blocking<br><br>**1. PR description is inaccurate — no tests were added**<br>The description states *"Added basic automated tests for DB operations"*, but the diff contains **zero** new or modified test files (only `schema.p... |
| **My Response** | > ## Review: Issue #23 — Database Models & Reference Data<br>> Thanks for the clean, focused implementation. The schema and seed are solid and mostly conform to the Lab 2 spec. I have two blocking items and a couple of suggestions before this can merge.<br>> <br>> ### Blocking<br>> **1. PR description is inaccurate — no tests were added** The description states _"Added basic automated tests for DB operations"_, but the diff contains **zero** new or modified test files (only `schema.prisma`, `see... |
| **Outcome** | Approved and merged |

---

### PR #24 — Issue 3: Development Requester Selector

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/il0lk3/TokTickIT/pull/24](https://github.com/il0lk3/TokTickIT/pull/24) |
| **Reviewer** | [@Achikan](https://github.com/Achikan) |
| **Review Comment** | ## Review: Issue #24 — Development Requester Selector<br><br>Nice clean implementation of the simulated-auth flow. The component structure matches the UI spec state diagram (`Idle → Loading → Success \| Error`), and the `RequesterContext` + `Switch User` flow works correctly. This is ready to merge.<br><br>### Confirmed good<br>- Backend filters `isActive: true` correctly via Prisma.<br>- `RequesterProvider`/`useRequester` is a clean pattern; `Switch User` clears state and localStorage properly.... |
| **My Response** | > ## Review: Issue #24 — Development Requester Selector<br>> Nice clean implementation of the simulated-auth flow. The component structure matches the UI spec state diagram (`Idle → Loading → Success \| Error`), and the `RequesterContext` + `Switch User` flow works correctly. This is ready to merge.<br>> <br>> ### Confirmed good<br>> * Backend filters `isActive: true` correctly via Prisma.<br>> * `RequesterProvider`/`useRequester` is a clean pattern; `Switch User` clears state and localStorage p... |
| **Outcome** | Approved and merged |

---

### PR #25 — Issue 4: Create Ticket API

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/il0lk3/TokTickIT/pull/25](https://github.com/il0lk3/TokTickIT/pull/25) |
| **Reviewer** | [@Achikan](https://github.com/Achikan) |
| **Review Comment** | ## Review: Issue #25 — Create Ticket API<br><br>Nice clean implementation — the happy path works and the router/middleware separation is good. However, there are several spec-contract violations that produce misleading `500` responses where the API contract requires `400`. Per the lab's Spec-DD approach these should be fixed before merge.<br><br>---<br><br>### Blocking<br><br>**1. FK references are not validated → 500 instead of 400**<br>`categoryId` / `relatedSystemId` are never checked against... |
| **My Response** | > ## Review: Issue #25 — Create Ticket API<br>> Nice clean implementation — the happy path works and the router/middleware separation is good. However, there are several spec-contract violations that produce misleading `500` responses where the API contract requires `400`. Per the lab's Spec-DD approach these should be fixed before merge.<br>> <br>> ### Blocking<br>> **1. FK references are not validated → 500 instead of 400** `categoryId` / `relatedSystemId` are never checked against the DB. Sen... |
| **Outcome** | Approved and merged |

---

### PR #26 — Issue 5: Create Ticket UI Component

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/il0lk3/TokTickIT/pull/26](https://github.com/il0lk3/TokTickIT/pull/26) |
| **Reviewer** | [@Achikan](https://github.com/Achikan) |
| **Review Comment** | ## Review: Issue #26 — Create Ticket UI Component<br><br>The component itself is well-built — clean state handling, field-level validation, Zen Green styling, busy state, and a good success screen. However, there is one critical integration gap that blocks the merge, plus an inaccurate PR description.<br><br>---<br><br>### Blocking<br><br>**1. The UI depends on GET /api/systems, which does not exist on the backend**<br><br>`CreateTicket.tsx` calls `getSystems()` → `fetch \`${API_URL}/api/systems... |
| **My Response** | Thanks for the thorough review! You are absolutely right about the missing backend route. I have just pushed an update to address all of your feedback:<br><br>**Fixes included in the latest commit:**<br>1. **Added `GET /api/systems`**: Implemented the missing route in `server/src/app.ts` so the dropdown now populates correctly.<br>2. **PR Description**: Updated the PR description to accurately reflect reality (`LOW/MEDIUM/HIGH` and 150 chars).<br>3. **Error Handling**: Added a visible error stat... |
| **Outcome** | Approved and merged |

---

### PR #27 — Issue 6: Implement My Tickets API and Upgrade UI 

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/il0lk3/TokTickIT/pull/27](https://github.com/il0lk3/TokTickIT/pull/27) |
| **Reviewer** | [@Achikan](https://github.com/Achikan) |
| **Review Comment** | ## Review: Issue #27 — My Tickets API & UI<br><br>The GET /api/tickets endpoint is well-implemented: pagination, search (AC-07), filter by category/status/priority, and cross-requester isolation (AC-03) all work correctly and pass tests. The MyTickets UI component is clean with proper debounce, loading/empty/error states, and responsive table layout. However, there are blocking gaps against the labsheet requirements and out-of-scope changes that need attention before merge.<br><br>---<br><br>###... |
| **My Response** | @Achikan Thanks for the thorough review! I've addressed all your comments and just pushed the fixes:<br><br>1. **Sorting (Fixed):** Added clickable table headers to `<MyTickets />` and updated the `getTickets` API client to pass `sortBy` and `sortOrder`. I also added a UI test to verify the sorting logic.<br>2. **Seed Data & Spec (Fixed):** I completely understand your point about the deviation. However, instead of reverting the seed, I have updated both `specification.md` and `api-spec.md` to o... |
| **Outcome** | Approved and merged |

---

### PR #28 — Issue 7: Implement Ticket Detail and Soft Remove Attachments

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/il0lk3/TokTickIT/pull/28](https://github.com/il0lk3/TokTickIT/pull/28) |
| **Reviewer** | [@Achikan](https://github.com/Achikan) |
| **Review Comment** | ## PR #28 — Ticket Detail & Soft Remove Attachments (review)<br><br>Reviewed as Achikan, cross-checked against the `Lab_02_labsheet` (Part 8: Ticket Detail, viewing ticket info + attachments, adding permitted attachments, and soft-removal demonstration).<br><br>### Verification performed<br>Ran the full test suites against an isolated DB on the branch:<br>- **Server:** `22 passed (5 files)` — including the new `ticket-detail.api.test.ts` (5 tests).<br>- **Client:** `12 passed (4 files)` — includ... |
| **My Response** | @Achikan Thanks for the thorough review! I've addressed all the feedback and pushed the fixes:<br><br>**1. Blocker (Fixed):** <br>I have removed the committed `.txt` artifacts using `git rm --cached`, added `server/uploads/*` (with `!.gitkeep`) to `.gitignore`, and updated the `afterAll` hook in `ticket-detail.api.test.ts` to actively clean up any uploaded `.txt` test files.<br><br>**2. Minor - Destructive deleteMany (Fixed):** <br>I completely agree. I've scoped the cleanup in `ticket-detail.ap... |
| **Outcome** | Approved and merged |

---

### PR #29 — Issue 8: End-to-End Testing & Final Release Polish

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/il0lk3/TokTickIT/pull/29](https://github.com/il0lk3/TokTickIT/pull/29) |
| **Reviewer** | [@Achikan](https://github.com/Achikan) |
| **Review Comment** | *(Pending review)* |
| **My Response** | *(Pending)* |
| **Outcome** | OPEN |

---

