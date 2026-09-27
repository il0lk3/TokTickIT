# Lab 3 Peer Review Record

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
| [#41](https://github.com/il0lk3/TokTickIT/pull/41) | 1 — Lab 3 Sprint Specification and Test Plan | `docs(lab3)` | Approved (after 1 revision) |
| [#42](https://github.com/il0lk3/TokTickIT/pull/42) | 2 — User model, DB migration, and seed data | `feature/lab3` | Approved (after 1 revision) |
| [#43](https://github.com/il0lk3/TokTickIT/pull/43) | 3 — Implement Authentication API and Session | `feature/lab3` | Approved |
| [#45](https://github.com/il0lk3/TokTickIT/pull/45) | 4 — Login & Change-Password UI + App Shell | `feature/lab3` | Approved (after 1 revision) |
| [#46](https://github.com/il0lk3/TokTickIT/pull/46) | 5 — Complete Requester Ticket Detail & Regression Tests | `feature/lab3` | Approved |
| [#47](https://github.com/il0lk3/TokTickIT/pull/47) | 6 — IT Staff Ticket Queue | `feature/lab3` | Approved |
| [#48](https://github.com/il0lk3/TokTickIT/pull/48) | 7 — IT Staff Ticket Detail | `feature/lab3` | Approved |
| [#49](https://github.com/il0lk3/TokTickIT/pull/49) | 8 — Administrator User Management | `feature/lab3` | Approved (after 1 revision) |
| [#52](https://github.com/il0lk3/TokTickIT/pull/52) | 9 — End-to-End Testing, Authorization Hardening | `feature/lab3` | Approved (after 1 revision) |
| [#53](https://github.com/il0lk3/TokTickIT/pull/53) | 10 — UI Polish & Zen Green Consistency Pass | `feature/lab3` | Approved (after 1 revision) |
| TBD | 11 — Release Evidence (Docs, Screenshots) | `feature/lab3-release-evidence` | *Pending* |

<br>

### PR #41 — Issue 1: Lab 3 Sprint Specification and Test Plan

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/il0lk3/TokTickIT/pull/41](https://github.com/il0lk3/TokTickIT/pull/41) |
| **Reviewer** | [@Achikan](https://github.com/Achikan) |
| **Review Comment** | ## Requested changes — reviewed against `Lab_3_sheet`<br><br>Reviewed the 4 files (`specification.md`, `api-spec.md`, `ui-spec.md`, `tests.md`) against the Lab 3 handout. Strong start, but there are internal inconsistencies between the documents and several mandatory contract items are missing. Please fix before merge.<br><br>**Blockers (internal inconsistencies)**<br>1. Admin Ticket Queue access contradicts between documents.<br>2. Mismatched ticket-update endpoint.<br>3. Queue API is missing sorting.<br>4. Status transition matrix (Handout §4.5) missing.<br>5. Missing business rules (Handout §4.4) for password handling.<br>6. Admin User Management UI missing Email column.<br>7. Test plan coverage gaps (Requester regression, migration test). |
| **My Response** | All inconsistencies resolved and documents synchronized. Added the status transition matrix, missing test coverage, and aligned the authentication rules. |
| **Outcome** | Approved and merged |

---

### PR #42 — Issue 2: User model, DB migration, and seed data

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/il0lk3/TokTickIT/pull/42](https://github.com/il0lk3/TokTickIT/pull/42) |
| **Reviewer** | [@Achikan](https://github.com/Achikan) |
| **Review Comment** | ## Requested changes — Issue #33<br><br>Nice foundation, but a few blockers before merge.<br>1. Lab 2 is broken — `requesterUser` still referenced everywhere.<br>2. Migration sequence is broken (dropping defaults before creation).<br>3. Leftover empty migration.<br>4. Field name mismatch: `mustChangePassword` vs `requiresPasswordChange`.<br>5. Base is `main`, not `lab3-staging`.<br>6. Missing DB-01 migration test. |
| **My Response** | Addressed all issues: renamed all references to `user`, fixed the migration sequence, standardized on `requiresPasswordChange`, rebased onto `lab3-staging`, and added the `migration.test.ts` suite. |
| **Outcome** | Approved and merged |

---

### PR #43 — Issue 3: Implement Authentication API and Session

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/il0lk3/TokTickIT/pull/43](https://github.com/il0lk3/TokTickIT/pull/43) |
| **Reviewer** | [@Achikan](https://github.com/Achikan) |
| **Review Comment** | Verified locally on the PR head. Test evidence: Ran the full server suite against a live Postgres. Results: 33/33 passing, 6 files. Spec compliance: Identity derived from session, generic 401s, HttpOnly cookies, and requiresPasswordChange blocks. No blockers found. Approved. |
| **My Response** | Thank you for the thorough verification! |
| **Outcome** | Approved and merged |

---

### PR #45 — Issue 4: Login & Change-Password UI + App Shell

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/il0lk3/TokTickIT/pull/45](https://github.com/il0lk3/TokTickIT/pull/45) |
| **Reviewer** | [@Achikan](https://github.com/Achikan) |
| **Review Comment** | ## Review: Request Changes<br><br>Thanks for the work — the Login / Change-Password screens and role-based App Shell are a solid start. Below are blocking issues: 1. E2E tests reference users/passwords that don't exist in the seed. 2. E2E "login success" flow contradicts the seed's `requiresPasswordChange: true`. 3. Attachment removal reason regression. 4. Stale session state in AppShell after logout. |
| **My Response** | Fixed the E2E user seeds, ensured `AppShell` state is fully flushed upon logout, and restored the attachment removal reason prompt to preserve Lab 2 functionality. |
| **Outcome** | Approved and merged |

---

### PR #49 — Issue 8: Administrator User Management

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/il0lk3/TokTickIT/pull/49](https://github.com/il0lk3/TokTickIT/pull/49) |
| **Reviewer** | [@Achikan](https://github.com/Achikan) |
| **Review Comment** | Almost there — one blocking compile error: typing `where` as `Prisma.UserWhereInput` in `admin.ts:40` breaks `tsc`. The `User.role` field is the `Role` enum, so `where.role = role as string` no longer typechecks. Please verify with `npm run build` before pushing. |
| **My Response** | Fixed the Prisma TypeScript strictness by casting to the Enum explicitly. Build is clean now. |
| **Outcome** | Approved and merged |

---

### PR #52 — Issue 9: End-to-End Testing, Authorization Hardening

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/il0lk3/TokTickIT/pull/52](https://github.com/il0lk3/TokTickIT/pull/52) |
| **Reviewer** | [@Achikan](https://github.com/Achikan) |
| **Review Comment** | ## Review — Request Changes<br><br>Nice hardening work overall. However, a few things block merge:<br>1. `PATCH /api/tickets/:id` is a new, undocumented, under-tested feature.<br>2. IT Priority business-rule violation: Requester silently overwrites IT-assigned priority.<br>3. E2E locator change masks a UI divergence: `"Type a public comment..."` |
| **My Response** | Dropped the undocumented PATCH route, removed the IT Priority overwrite vulnerability, and reverted the E2E placeholder string to match the UI specification. |
| **Outcome** | Approved and merged |

---

### PR #53 — Issue 10: UI Polish & Zen Green Consistency Pass

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/il0lk3/TokTickIT/pull/53](https://github.com/il0lk3/TokTickIT/pull/53) |
| **Reviewer** | [@Achikan](https://github.com/Achikan) |
| **Review Comment** | **Overall: Approved with minor changes.** Great polish pass — clean, consistent, and it bridges the gap between Bootstrap defaults and the Zen green theme. Issues to fix:<br>1. Docs drift (specs are treated strictly).<br>2. `e2e/screenshot.js` is leftover debug code.<br>3. Inconsistent `Closed` badge semantics.<br>4. Partial ARIA on tabs. |
| **My Response** | Fixed the `Closed` badge color to secondary, deleted the leftover debug scripts, and fully resolved the ARIA attributes on the tabs for better accessibility. |
| **Outcome** | Approved and merged |
