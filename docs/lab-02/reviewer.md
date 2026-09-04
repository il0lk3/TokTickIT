# Lab 2 Peer Review Record

A living document tracking the code review process. Reviews run in both directions with my partner.

## My Information

| Field | Detail |
|-------|--------|
| **Name** | Thanakorn Pahunrat |
| **Student ID** | 67070505217 |
| **GitHub** | [@il0lk3](https://github.com/il0lk3) |

---

## Peer Reviewer

| Field | Detail |
|-------|--------|
| **Reviewer Name** | Achiraya Inta |
| **Student ID** | 67070505229 |
| **Reviewer GitHub** | [@Achikan](https://github.com/Achikan) |

---

# Pull Requests I Authored

> My partner reviewed the following PRs that I submitted.

| PR | Issue | Branch | Reviewer Verdict |
|---|---|---|---|
| [#22](https://github.com/il0lk3/TokTickIT/pull/22) | 1 — Lab 2 Sprint Specification and Test Plan | `feature/lab2-specs` | Approved |
| [#23](https://github.com/il0lk3/TokTickIT/pull/23) | 2 — Database Models & Reference Data | `feature/lab2-context-db` | Approved (after 1 revision) |
| [#24](https://github.com/il0lk3/TokTickIT/pull/24) | 3 — Development Requester Selector | `feature/lab2-selector` | Approved |
| [#25](https://github.com/il0lk3/TokTickIT/pull/25) | 4 — Create Ticket API | `feature/lab2-create-ticket-api` | Approved (after 1 revision) |
| [#26](https://github.com/il0lk3/TokTickIT/pull/26) | 5 — Create Ticket UI Component | `feature/lab2-create-ticket-ui` | Approved (after 1 revision) |
| [#27](https://github.com/il0lk3/TokTickIT/pull/27) | 6 — Implement My Tickets API and Upgrade UI | `feature/lab2-my-tickets` | Approved (after 1 revision) |
| [#28](https://github.com/il0lk3/TokTickIT/pull/28) | 7 — Implement Ticket Detail and Soft Remove Attachments | `feature/lab2-ticket-detail` | Approved (after 1 revision) |
| [#29](https://github.com/il0lk3/TokTickIT/pull/29) | 8 — End-to-End Testing & Final Release Polish | `feature/lab2-e2e-real` | Approved (after 3 revisions) |

<br>

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
| **Review Comment** | ## Review: Issue #8 — E2E Testing<br><br>The tests look good, but there are a few blockers. 1. You need to add a responsive spec and wire up automated screenshots across 3 viewports. 2. Your test coverage claims in `tests.md` do not match reality. 3. *(Re-review)* The client `npm run build` fails with 12 TS errors because `TicketDetail.tsx` references fields like `requesterName` and `requestedPriority` that are missing from the API response interfaces. 4. *(Final re-review)* The code is in good shape and builds cleanly, but `docs/lab-02/tests.md` still overstates `E2E-02` by claiming it captures screenshots and asserts color. Please update `tests.md` to reflect that it only tests horizontal overflow, and move the visual checklist to the manual section. |
| **My Response** | Thanks for the thorough review! I've addressed all the blockers over a few commits:<br><br>1. **Responsive Specs**: Added `responsive.spec.ts` to assert no horizontal overflow on Mobile, Tablet, and Desktop viewports.<br>2. **Build Errors**: Updated `TicketResponse` and `TicketDetailResponse` in `api.ts` to include the missing fields, and fixed `TicketDetail.tsx` to correctly use `ticket.requester?.name`. The client now builds perfectly without TS errors.<br>3. **Documentation Sync**: Fixed `tests.md` to remove the automated screenshot and color assertion claims from `E2E-02`, and accurately moved them to the manual visual checklist section as requested. Everything should be 100% accurate now! |
| **Outcome** | Approved and merged |

---


<br><br>

---
---

<br><br>

# Pull Requests I Reviewed

> I reviewed the following PRs authored and submitted by my partner.

| PR | Issue | Branch | My Verdict |
|---|---|---|---|
| [#25](https://github.com/Achikan/TokTickIT/pull/25) | 5 — docs: Lab 2 engineering contract | `feature/5-spec-test-plan` | Approved |
| [#26](https://github.com/Achikan/TokTickIT/pull/26) | 6 — feat: Lab 2 data model, migration, and seed data | `feature/6-db-models-seed` | Approved |
| [#27](https://github.com/Achikan/TokTickIT/pull/27) | 7 — feat: Development Requester selection context | `feature/7-requester-selection` | Approved |
| [#28](https://github.com/Achikan/TokTickIT/pull/28) | 8 — feat: Ticket creation (API + Create Ticket screen) | `feature/8-ticket-creation` | Approved (after 1 revision) |
| [#29](https://github.com/Achikan/TokTickIT/pull/29) | 9 — feat: My Tickets list with search, filters, sorting, pagination | `feature/9-my-tickets` | Approved (after 1 revision) |
| [#30](https://github.com/Achikan/TokTickIT/pull/30) | 10 — feat: Ticket Detail screen with ownership-scoped detail view | `feature/10-ticket-detail` | Approved (after 1 revision) |
| [#31](https://github.com/Achikan/TokTickIT/pull/31) | 11 — feat: Attachment Lifecycle — upload, download, soft-remove | `feature/11-attachments` | Approved (after 1 revision) |
| [#32](https://github.com/Achikan/TokTickIT/pull/32) | 12 — feat: Zen Green UI & Responsive — tokens, button hierarchy, focus | `feature/12-zen-green-ui` | Approved (after 2 revisions) |
| [#33](https://github.com/Achikan/TokTickIT/pull/33) | 13 — feat: Automated Tests — E2E, responsive, screenshots, final results | `feature/13-automated-tests` | Approved (after 1 revision) |
| [#34](https://github.com/Achikan/TokTickIT/pull/34) | 14 — docs: Visual Inspection & Evidence — ui-spec checklist + screenshots | `feature/14-visual-inspection` | Approved |
| [#35](https://github.com/Achikan/TokTickIT/pull/35) | 15 — docs: finalize Lab 2 docs — reviewer, ai-use, README, final status | `feature/15-finalize-docs` | Approved |

<br>

### Partner PR #25 — docs: Lab 2 engineering contract (Issue 5)

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/Achikan/TokTickIT/pull/25](https://github.com/Achikan/TokTickIT/pull/25) |
| **Reviewer** | [@il0lk3](https://github.com/il0lk3) (Me) |
| **My Review Comment** | The engineering contract looks great overall and matches the requirements well!<br><br>There's just one change needed: please update specification.md to explicitly include AC-14 and AC-15 in the Given-When-Then format. I've left a line comment showing where it's missing. Once that's fixed, let me know and I will approve! |
| **Partner's Response** | @il0lk3 Thanks for the review! I've updated `specification.md` to write out **AC-14** and **AC-15** explicitly in the exact Given-When-Then format, matching AC-01 through AC-13:<br><br>- **AC-14** — Given a requester opens My Tickets, when their Ticket list is empty, then an "empty" state is shown; and when search or filters are applied with no matches, then a distinct "no-results" state is shown.<br>- **AC-15** — Given a requester opens an owned Ticket's attachments, when an Attachment is uploa... |
| **Outcome** | Approved and merged |

---

### Partner PR #26 — feat: Lab 2 data model, migration, and seed data (Issue 6)

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/Achikan/TokTickIT/pull/26](https://github.com/Achikan/TokTickIT/pull/26) |
| **Reviewer** | [@il0lk3](https://github.com/il0lk3) (Me) |
| **My Review Comment** | Everything looks extremely solid! The database schema exactly matches the Lab 2 requirements.<br><br>- All models, enums, relationships, and indexes are properly defined.<br>- The Ticket and Attachment fields (especially the soft-remove setup) are correct.<br>- The seed data is comprehensive and correctly uses idempotent logic (`upsert` / find-then-update), which is a great practice.<br>- The seed tests are very thorough.<br><br>Great work on the data layer! Approving this PR. |
| **Partner's Response** | *(No response yet)* |
| **Outcome** | Approved and merged |

---

### Partner PR #27 — feat: Development Requester selection context (Issue 7)

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/Achikan/TokTickIT/pull/27](https://github.com/Achikan/TokTickIT/pull/27) |
| **Reviewer** | [@il0lk3](https://github.com/il0lk3) (Me) |
| **My Review Comment** | Great job on implementing the Development Requester selection context!<br><br>- **Backend:** The `GET /api/development-requesters` endpoint correctly filters out inactive requesters and maps the response to the expected `{ items: [...] }` shape.<br>- **Frontend:** The selection screen handles all UI states (loading, empty, error) gracefully. The testing explanation and 'Change Requester' logic are perfectly implemented.<br>- **Tests:** The tests on both client and server sides are comprehensive ... |
| **Partner's Response** | *(No response yet)* |
| **Outcome** | Approved and merged |

---

### Partner PR #28 — feat: Ticket creation (API + Create Ticket screen) (Issue 8)

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/Achikan/TokTickIT/pull/28](https://github.com/Achikan/TokTickIT/pull/28) |
| **Reviewer** | [@il0lk3](https://github.com/il0lk3) (Me) |
| **My Review Comment** | The Create Ticket screen and the API validation logic look great and align well with the UI specifications.<br><br>However, there is a missing implementation regarding the API contract. `api-spec.md` strictly requires the `X-Requester-Id` header for requester-scoped endpoints. Currently, the client does not send this header in `createTicket`, and the server does not validate it in the `POST /api/tickets` route.<br><br>Please update the following files:<br><br>**1. `client/src/api.ts`**<br>Update... |
| **Partner's Response** | Thanks for the careful review! I've pushed the fix:<br><br>**`client/src/api.ts`** — `createTicket()` now sends the `X-Requester-Id` header.<br><br>**`server/src/app.ts`** — `POST /api/tickets` now enforces the header:<br>- Missing `X-Requester-Id` → `403 FORBIDDEN`.<br>- Per api-spec §3 ("All requester-scoped endpoints verify ownership"), the header must also match the `requesterId` in the body → `403 FORBIDDEN` on mismatch.<br><br>**Tests** — added two cases (missing header → 403, spoofed/mism... |
| **Outcome** | Approved and merged |

---

### Partner PR #29 — feat: My Tickets list with search, filters, sorting, pagination (Issue 9)

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/Achikan/TokTickIT/pull/29](https://github.com/Achikan/TokTickIT/pull/29) |
| **Reviewer** | [@il0lk3](https://github.com/il0lk3) (Me) |
| **My Review Comment** | The My Tickets implementation looks excellent. The API properly isolates tickets by requester ownership, and the pagination and filtering logic handles invalid parameters correctly. The frontend effectively manages all required UI states, including the distinct empty and no-results scenarios, and the responsive design is well implemented. The test coverage is comprehensive. Approving this pull request. |
| **Partner's Response** | Thanks for the detailed re-review — I've addressed all four points:<br><br>**1. Search by Ticket Number (\`server/src/app.ts\`)** — Added \`ticketNumber\` to the search OR conditions (case-insensitive), so \`search=\` now matches summary, description, and the official Ticket Number. Covered by an API test.<br><br>**2. Deterministic secondary sort** — The API now always appends a secondary sort: after the requested primary column, results are ordered by \`createdAt desc\` and then \`id asc\` (ski... |
| **Outcome** | Approved and merged |

---

### Partner PR #30 — feat(Issue 10): Ticket Detail screen with ownership-scoped detail view

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/Achikan/TokTickIT/pull/30](https://github.com/Achikan/TokTickIT/pull/30) |
| **Reviewer** | [@il0lk3](https://github.com/il0lk3) (Me) |
| **My Review Comment** | The implementation for the Ticket Detail screen is very clean and meets almost all requirements, especially the secure API ownership checks and the safe failure states.<br><br>However, there is one visual layout issue that violates the responsive design requirements in the Lab 2 guidelines:<br><br>**Responsive Breakpoints (`client/src/TicketDetail.tsx`)**<br>According to the guidelines (Section 8.7), on Mobile viewports (`< 768 px`), fields must stack vertically.<br>Currently, the code uses Boot... |
| **Partner's Response** | Good catch — fixed! Changed all `col-sm-3`/`col-sm-9` → `col-md-3`/`col-md-9` so fields now stack vertically on viewports < 768px per §8.7. All 34 client tests still pass. Ready for re-review. |
| **Outcome** | Approved and merged |

---

### Partner PR #31 — feat(Issue 11): Attachment Lifecycle — upload, download, soft-remove

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/Achikan/TokTickIT/pull/31](https://github.com/Achikan/TokTickIT/pull/31) |
| **Reviewer** | [@il0lk3](https://github.com/il0lk3) (Me) |
| **My Review Comment** | The implementation of the attachment lifecycle is excellent. However, there is one requirement that needs to be fixed regarding the API response for removed attachments.<br><br>According to **AC-06 (Soft Removal)**: "...the download API returns 410 Gone."<br>Currently, the download API returns a `404 Not Found` for soft-removed attachments.<br><br>Please update the following files to fix this:<br><br>**1. `server/src/app.ts`**<br>Update the `GET /api/attachments/:id/download` endpoint to return ... |
| **Partner's Response** | Good catch — fixed. `GET /api/attachments/:id/download` now returns **410 Gone** for a soft-removed attachment (AC-06 / labsheet §4.5 "Removed files must not be downloadable"), while a missing or foreign attachment still returns a non-disclosing 404.<br><br>Changes:<br>- `server/src/app.ts` — the download endpoint now returns `410 { code: "REMOVED" }` when `attachment.removedAt` is set.<br>- `server/tests/lab-02/attachments.api.test.ts` — the removed-download test now expects `410` (was `404`).<... |
| **Outcome** | Approved and merged |

---

### Partner PR #32 — feat(Issue 12): Zen Green UI & Responsive — tokens, button hierarchy, focus, STYLE-01 tests

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/Achikan/TokTickIT/pull/32](https://github.com/Achikan/TokTickIT/pull/32) |
| **Reviewer** | [@il0lk3](https://github.com/il0lk3) (Me) |
| **My Review Comment** | Good catch on the UI implementation! The CSS changes in `styles.css` look great and comply with the Zen Green Theme Specification (Section 7).<br><br>However, there are two significant issues in `client/tests/lab-02/style.test.tsx` that need to be addressed to properly satisfy the STYLE-01 assertions (Section 8.8):<br><br>**1. Fake assertion in the CSS Token test:**<br>The test `"keeps Zen Green color tokens in :root"` defines a hardcoded string `cssText` inside the test and asserts against it, ... |
| **Partner's Response** | Thanks for the detailed review! I've addressed all three points. Summary:<br><br>**1. Fake assertion on CSS tokens - FIXED**<br>The test now reads the actual `client/src/styles.css` file with Node `fs` and asserts the tokens against its real content, so it can no longer pass if the CSS is removed. I referenced the file via `resolve(__dirname, "../../src/styles.css")` (vitest injects `__dirname`; a raw `new URL(..., import.meta.url)` did not resolve to a `file:` scheme under vitest, so I used the... |
| **Outcome** | Approved and merged |

---

### Partner PR #33 — feat(Issue 13): Automated Tests — E2E, responsive, screenshots, final results

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/Achikan/TokTickIT/pull/33](https://github.com/Achikan/TokTickIT/pull/33) |
| **Reviewer** | [@il0lk3](https://github.com/il0lk3) (Me) |
| **My Review Comment** | I deeply reviewed the E2E test implementation, and it is impossible for these tests to have passed. The claim in `tests.md` that the E2E tests are passing seems to be incorrect, as the test script is completely disconnected from our actual UI and backend implementation.<br><br>Here are the 4 critical failures in `e2e/lab-02/helpers.ts` and `requester-ticket-flow.spec.ts` that will cause the tests to instantly crash:<br><br>1. **Ticket Number Format Mismatch:** The test checks for `/TK-\d{6}/`, b... |
| **Partner's Response** | Thanks for the deep review. I appreciate the thoroughness, but I need to push back on three of the four points: they do not match the actual code in this repo, and the E2E suite genuinely passes locally. I did run `npm run test:e2e` against the running server (:3000) + Vite client (:5173) — the output is `11 passed`, and each of the four assertions you flagged resolves against the real UI/backend as written.<br><br>Here is the evidence, point by point:<br><br>**1. Ticket Number format `TK-\d{6}`... |
| **Outcome** | Approved and merged |

---

### Partner PR #34 — docs(Issue 14): Visual Inspection & Evidence — ui-spec checklist + screenshots

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/Achikan/TokTickIT/pull/34](https://github.com/Achikan/TokTickIT/pull/34) |
| **Reviewer** | [@il0lk3](https://github.com/il0lk3) (Me) |
| **My Review Comment** | I just pulled the branch and verified the codebase against this document. The visual inspection is extremely thorough, well-organized, and accurately reflects the current state of the code.<br><br>I really appreciate the clarity and honesty in the Deviations / Notes section regarding the SUBMITTED vs New status divergence. Documenting it clearly as a known issue (rather than sweeping it under the rug) is a great engineering practice.<br><br>The coverage for viewports and screen states is compreh... |
| **Partner's Response** | *(No response yet)* |
| **Outcome** | Approved and merged |

---

### Partner PR #35 — docs(Issue 15): finalize Lab 2 docs — reviewer, ai-use, README, final status

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/Achikan/TokTickIT/pull/35](https://github.com/Achikan/TokTickIT/pull/35) |
| **Reviewer** | [@il0lk3](https://github.com/il0lk3) (Me) |
| **My Review Comment** | LGTM<br><br>The final documentation updates are extremely thorough and perfectly wrap up Lab 2.<br><br>I really liked how you documented our exact exchange regarding PR #33 in reviewer.md and ai-use.md. It perfectly demonstrates the value of verifying against the actual codebase (git ls-tree / git show) during a peer review instead of relying on assumptions.<br><br>The README updates are clear, the API spec clarification is spot on, and the final test counts are nicely summarized. Great job wrapping up Lab 2 on this branch! |
| **Partner's Response** | *(No response yet)* |
| **Outcome** | Approved and merged |
