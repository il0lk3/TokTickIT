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

<br><br>

---
---

<br><br>

# Pull Requests I Reviewed

> I reviewed the following PRs authored and submitted by my partner.

| PR | Issue | Branch | My Verdict |
|---|---|---|---|
| [#49](https://github.com/Achikan/TokTickIT/pull/49) | 16 — Sprint 3 Engineering Contract | `feature/lab3-docs` | Approved (after 1 revision) |
| [#50](https://github.com/Achikan/TokTickIT/pull/50) | 17 — Database Migration & User Model | `feature/lab3-db` | Approved |
| [#51](https://github.com/Achikan/TokTickIT/pull/51) | 18 — Authentication & Authorization API | `feature/lab3-auth` | Approved (after 1 revision) |
| [#52](https://github.com/Achikan/TokTickIT/pull/52) | 19 — Login & Authentication UI | `feature/lab3-ui` | Approved |
| [#53](https://github.com/Achikan/TokTickIT/pull/53) | 20 — Requester Regression | `feature/lab3-regression` | Approved (after 1 revision) |
| [#54](https://github.com/Achikan/TokTickIT/pull/54) | 21 — IT Staff Ticket Queue | `feature/lab3-staff-queue` | Approved (after 1 revision) |
| [#56](https://github.com/Achikan/TokTickIT/pull/56) | 22 — IT Staff Ticket Detail | `feature/lab3-staff-detail` | Approved |
| [#57](https://github.com/Achikan/TokTickIT/pull/57) | 23 — Administrator User Management | `feature/lab3-admin` | Approved (after 1 revision) |
| [#58](https://github.com/Achikan/TokTickIT/pull/58) | 24 — E2E Testing | `feature/lab3-e2e` | Approved (after 1 revision) |
| [#59](https://github.com/Achikan/TokTickIT/pull/59) | 25 — Final Review & Release Integration | `feature/lab3-release` | Approved |

<br>

### Partner PR #49 — Issue 16: Sprint 3 Engineering Contract

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/Achikan/TokTickIT/pull/49](https://github.com/Achikan/TokTickIT/pull/49) |
| **Reviewer** | [@il0lk3](https://github.com/il0lk3) (Me) |
| **My Review Comment** | It is extremely thorough, well-structured, and covers all the ACs and requirements from the Lab 3 PDF perfectly. I just caught one minor continuity detail in `specification.md`... shouldn't the data mapping here explicitly include `SUBMITTED → NEW` for the existing tickets, rather than `NEW → NEW`? If we don't map `SUBMITTED` explicitly, the migration for our existing Lab 2 tickets might fail. |
| **Partner's Response** | Fixed the migration mapping to strictly transform SUBMITTED to NEW. |
| **Outcome** | Approved and merged |

---

### Partner PR #50 — Issue 17: Database Migration & User Model

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/Achikan/TokTickIT/pull/50](https://github.com/Achikan/TokTickIT/pull/50) |
| **Reviewer** | [@il0lk3](https://github.com/il0lk3) (Me) |
| **My Review Comment** | The database increment is spot on and strictly follows Section 5 of the Lab 3 handout. The schema evolution handles the new `User` model, roles, `ownerId`, comments, and notes perfectly. The SQL migration script is exceptionally well-written. Applying our discussed `SUBMITTED` -> `NEW` defensive mapping directly in the SQL migration is a fantastic touch! Seed data meets every requirement. LGTM^^ |
| **Partner's Response** | *(No response yet)* |
| **Outcome** | Approved and merged |

---

### Partner PR #51 — Issue 18: Authentication & Authorization API

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/Achikan/TokTickIT/pull/51](https://github.com/Achikan/TokTickIT/pull/51) |
| **Reviewer** | [@il0lk3](https://github.com/il0lk3) (Me) |
| **My Review Comment** | I was just reviewing the backend password validation logic and caught a minor discrepancy with the UI spec. In `server/src/session.ts`, the current logic only checks for at least one letter and at least one digit. LGTM! |
| **Partner's Response** | Updated the regex to enforce the exact special character policy defined in the UI specifications. |
| **Outcome** | Approved and merged |

---

### Partner PR #52 — Issue 19: Login & Authentication UI

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/Achikan/TokTickIT/pull/52](https://github.com/Achikan/TokTickIT/pull/52) |
| **Reviewer** | [@il0lk3](https://github.com/il0lk3) (Me) |
| **My Review Comment** | LGTM, Great work tying the UI to the new secure backend. |
| **Partner's Response** | *(No response yet)* |
| **Outcome** | Approved and merged |

---

### Partner PR #53 — Issue 20: Requester Regression

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/Achikan/TokTickIT/pull/53](https://github.com/Achikan/TokTickIT/pull/53) |
| **Reviewer** | [@il0lk3](https://github.com/il0lk3) (Me) |
| **My Review Comment** | It looks like you forgot to commit the Prisma schema changes and the migration files. If we merge this now, the build will fail because `requesterIndicatedResolvedAt` doesn't exist, and the API validates `content` up to 2000 characters but the schema restricts it to 1000. Could you update `schema.prisma` to fix this? Everything else is solid. LGTM, My apologies for the confusion. |
| **Partner's Response** | Added the missing schema changes and migration files for the character limit and the new boolean flag. |
| **Outcome** | Approved and merged |

---

### Partner PR #54 — Issue 21: IT Staff Ticket Queue

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/Achikan/TokTickIT/pull/54](https://github.com/Achikan/TokTickIT/pull/54) |
| **Reviewer** | [@il0lk3](https://github.com/il0lk3) (Me) |
| **My Review Comment** | I verified the specs and here is what we need to fix before merging: 1. Admin Access (AC-10 Violation): The Authorization Matrix explicitly says `No` for Admin access to the Ticket Queue. Please remove `ADMIN` from `requireRole`. 2. Mega-grid Table: We currently have 10 columns. Please stick strictly to the 8 columns defined in the UI spec to avoid the mega-grid. LGTM |
| **Partner's Response** | Removed the Admin role from the Staff router and dropped the extra table columns to perfectly match the UI specifications. |
| **Outcome** | Approved and merged |

---

### Partner PR #56 — Issue 22: IT Staff Ticket Detail

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/Achikan/TokTickIT/pull/56](https://github.com/Achikan/TokTickIT/pull/56) |
| **Reviewer** | [@il0lk3](https://github.com/il0lk3) (Me) |
| **My Review Comment** | I have thoroughly reviewed the pull request against the approved specs. 1. Administrator Authorization is correct. 2. Implementation of three distinct `PATCH` endpoints is correct. 3. Staff GET Endpoint is correct. 4. Public Comments and Internal Notes are distinctly segregated in the UI. The codebase meets all required criteria for the IT Staff Ticket Detail increment. No further changes are necessary. |
| **Partner's Response** | *(No response yet)* |
| **Outcome** | Approved and merged |

---

### Partner PR #57 — Issue 23: Administrator User Management

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/Achikan/TokTickIT/pull/57](https://github.com/Achikan/TokTickIT/pull/57) |
| **Reviewer** | [@il0lk3](https://github.com/il0lk3) (Me) |
| **My Review Comment** | The implementation of the Administrator User Management is excellent, and the server-side safety rules are perfectly handled. However, there is one minor UI issue. When an Administrator tries to set a new initial password that violates the password policy, `submitInitialPassword` drops the specific field error and only displays a generic message. Please update the catch block to surface the specific field error. LGTM |
| **Partner's Response** | Fixed the UI state to correctly display the specific API validation errors. |
| **Outcome** | Approved and merged |

---

### Partner PR #58 — Issue 24: E2E Testing

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/Achikan/TokTickIT/pull/58](https://github.com/Achikan/TokTickIT/pull/58) |
| **Reviewer** | [@il0lk3](https://github.com/il0lk3) (Me) |
| **My Review Comment** | There are missing files in this Pull Request. It appears you may have forgotten to stage some of the newly created test files before committing. Missing E2E-05, RESP-01, and A11Y-01 Specs, and `responsive.spec.ts`. Please check your local git workspace. I will be happy to fully review and approve once the missing files are included. LGTM |
| **Partner's Response** | Staged and pushed the missing Playwright spec files. |
| **Outcome** | Approved and merged |

---

### Partner PR #59 — Issue 25: Final Review & Release Integration

| Field | Detail |
|-------|--------|
| **PR Link** | [https://github.com/Achikan/TokTickIT/pull/59](https://github.com/Achikan/TokTickIT/pull/59) |
| **Reviewer** | [@il0lk3](https://github.com/il0lk3) (Me) |
| **My Review Comment** | LGTM |
| **Partner's Response** | *(No response yet)* |
| **Outcome** | Approved and merged |
