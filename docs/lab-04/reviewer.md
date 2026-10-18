# Lab 4 Peer Review Record

A living document tracking the code review process. Reviews run in both directions with my partner.

## My Information

| Field | Detail |
|---|---|
| **Name** | Thanakorn Pahunrat |
| **Student ID** | 67070505217 |
| **GitHub** | [@il0lk3](https://github.com/il0lk3) |

---

## Peer Reviewer

| Field | Detail |
|---|---|
| **Reviewer Name** | Achiraya Inta |
| **Student ID** | 67070505229 |
| **Reviewer GitHub** | [@Achikan](https://github.com/Achikan) |

---

# Pull Requests I Authored

> My partner reviewed the following PRs that I submitted to `lab4-staging`.

| PR | Issue | Branch | Reviewer Verdict |
|---|---|---|---|
| [#69](https://github.com/il0lk3/TokTickIT/pull/69) | Issue 1 — Sprint 4 Engineering Contract (Spec DD + Test DD) | `feature/lab4-specs` | Approved & Merged |
| [#70](https://github.com/il0lk3/TokTickIT/pull/70) | Issue 2 — Database Increment — ActionTaken Model, Migration, Backfill, Seed | `feature/lab4-db-actions-taken` | Approved & Merged |
| [#71](https://github.com/il0lk3/TokTickIT/pull/71) | Issue 3 — Actions Taken API and Authorization (TDD) | `feature/lab4-actions-taken-api` | Approved & Merged |
| [#72](https://github.com/il0lk3/TokTickIT/pull/72) | Issue 4 — Ticket Workflow Rules and Conflict Handling (API) | `feature/lab4-ticket-workflow-api` | Pending Review |

> *Note: PR #67 was prematurely merged during automated script setup before peer review; base branch `lab4-staging` was immediately reset to `main`, and the official deliverable was submitted in PR #69 for review by @Achikan.*

---

### PR #69 — Issue 1: Sprint 4 Engineering Contract (Spec DD + Test DD)

| Field | Detail |
|---|---|
| **PR Link** | [https://github.com/il0lk3/TokTickIT/pull/69](https://github.com/il0lk3/TokTickIT/pull/69) |
| **Reviewer** | [@Achikan](https://github.com/Achikan) |
| **Review Verdict** | Approved ([Review #5556815718](https://github.com/il0lk3/TokTickIT/pull/69#pullrequestreview-5556815718)) |
| **Review Comments** | 1. **Missing Advisory Resolution API & Schema:** Requester advisory-signal (`appearsResolved = true`) was missing in `api-spec.md` and `Ticket` schema in `specification.md`.<br>2. **Client Route Inconsistency:** Inconsistent path references between documents (`/staff/queue` vs `/queue`, `/staff/dashboard` vs `/dashboard`).<br>3. **Authorization Matrix Contradiction:** Section 5.1 marked "Create Ticket" as `No` for IT Staff and Admin, contradicting Section 11 and UI spec. |
| **My Response / Actions Taken** | 1. Added `PATCH /api/tickets/:id/appears-resolved` specification in [api-spec.md](file:///Users/karn/Downloads/toktickit/docs/lab-04/api-spec.md#L233) with full validation, RBAC, and response schema. Added `appearsResolved Boolean @default(false)` to `Ticket` schema in [specification.md](file:///Users/karn/Downloads/toktickit/docs/lab-04/specification.md#L207).<br>2. Standardized all frontend routes across [specification.md](file:///Users/karn/Downloads/toktickit/docs/lab-04/specification.md), [ui-spec.md](file:///Users/karn/Downloads/toktickit/docs/lab-04/ui-spec.md), and [api-spec.md](file:///Users/karn/Downloads/toktickit/docs/lab-04/api-spec.md) to use canonical paths (`/dashboard`, `/tickets`, `/tickets/new`, `/tickets/:ticketId`, `/queue`, `/admin/users`).<br>3. Updated Section 5.1 Authorization Matrix in [specification.md](file:///Users/karn/Downloads/toktickit/docs/lab-04/specification.md#L78) for `Create Ticket` to `Yes (on behalf of user)` for both IT Staff and Administrator. |
| **Outcome** | Approved & Merged into `lab4-staging` by @Achikan |

---

### PR #70 — Issue 2: Database Increment — ActionTaken Model, Migration, Backfill, Seed

| Field | Detail |
|---|---|
| **PR Link** | [https://github.com/il0lk3/TokTickIT/pull/70](https://github.com/il0lk3/TokTickIT/pull/70) |
| **Reviewer** | [@Achikan](https://github.com/Achikan) |
| **Review Verdict** | Changes Requested ([Review #5557454686](https://github.com/il0lk3/TokTickIT/pull/70#pullrequestreview-5557454686)), addressed and approved |
| **Review Comments** | 1. **Missing Attachment Seeding in Clean Setup:** `server/prisma/seed.ts` lacked an `Attachment` seed, causing `API-MIG-01` to fail on fresh environments where `attachmentCount` starts at 0.<br>2. **Avoid Hardcoded IDs for Comments/Notes:** In `seed.ts`, comments and notes used fixed `id: 1` which can cause PK conflicts if database sequences diverge. |
| **My Response / Actions Taken** | 1. Added `upsertAttachment` helper to [seed.ts](file:///Users/karn/Downloads/toktickit/server/prisma/seed.ts) and seeded a sample attachment (`duplexer-gear.png`) for Ticket 1.<br>2. Replaced hardcoded IDs with dynamic `upsertPublicComment` and `upsertInternalNote` lookup helpers, and added PostgreSQL sequence realignment (`setval`) across all tables at the end of seed execution. |
| **Outcome** | Approved & Merged into `lab4-staging` by @Achikan |

---

### PR #71 — Issue 3: Actions Taken API and Authorization (TDD)

| Field | Detail |
|---|---|
| **PR Link** | [https://github.com/il0lk3/TokTickIT/pull/71](https://github.com/il0lk3/TokTickIT/pull/71) |
| **Reviewer** | [@Achikan](https://github.com/Achikan) |
| **Review Verdict** | Approved |
| **Review Comments** | "LGTM! The Actions Taken API implementation is thorough, clean, and fully compliant with the Lab 4 handout and specifications. Role authorization, terminal status guards, follow-up validations, session-bound performer derivations, and 5-second duplicate protection are all properly enforced and backed by 27 passing tests. Excellent work! Approved!" |
| **My Response / Actions Taken** | Addressed all 27 TDD test requirements and peer review criteria cleanly. |
| **Outcome** | Approved & Merged into `lab4-staging` by @Achikan |

---

### PR #72 — Issue 4: Ticket Workflow Rules and Conflict Handling (API)

| Field | Detail |
|---|---|
| **PR Link** | [https://github.com/il0lk3/TokTickIT/pull/72](https://github.com/il0lk3/TokTickIT/pull/72) |
| **Reviewer** | [@Achikan](https://github.com/Achikan) |
| **Review Verdict** | Changes Requested ([Review #5561575083](https://github.com/il0lk3/TokTickIT/pull/72#pullrequestreview-5561575083)) |
| **Review Comments** | 1. **Guard against Ineligible Owner in `POST /api/staff/tickets/:id/claim` (BR-12)**: In `/claim`, verify caller has active `IT_STAFF` role (`ASSIGNEE_NOT_ELIGIBLE` if ineligible, `INACTIVE_ASSIGNEE_REJECTED` if inactive) because Administrator access was permitted on `/api/staff/*` (BR-13) and assigning an Admin causes Resolution Gate to fail.<br>2. **Validate Non-Empty Update Payload in `PATCH /api/staff/tickets/:id`**: Reject payloads providing only `{ expectedVersion }` without `ownerId`, `itPriority`, or `status` with 400 Bad Request (`NO_FIELDS_TO_UPDATE`). |
| **My Response / Actions Taken** | 1. Added role and active status checks in `POST /api/staff/tickets/:id/claim` returning 400 Bad Request (`ASSIGNEE_NOT_ELIGIBLE`) if caller is not `IT_STAFF` and (`INACTIVE_ASSIGNEE_REJECTED`) if inactive.<br>2. Added empty update payload guard in `PATCH /api/staff/tickets/:id` returning 400 Bad Request (`NO_FIELDS_TO_UPDATE`) when none of `ownerId`, `itPriority`, or `status` are supplied.<br>3. Added automated test cases `API-WKF-VAL-07` and `API-WKF-OWN-04` covering both scenarios in `server/tests/lab-04/ticket-workflow.api.test.ts`. All 38 workflow tests pass (100%).<br>4. Verified zero regressions across all server suites (16 suites, 165 tests pass) and client suites (8 suites, 25 tests pass); TypeScript compilation passes with 0 errors.<br>5. Updated API specification (`docs/lab-04/api-spec.md`) and testing matrix (`docs/lab-04/tests.md`). |
| **Outcome** | Addressed changes requested, tests verified, pushed to `feature/lab4-ticket-workflow-api` for re-review |





