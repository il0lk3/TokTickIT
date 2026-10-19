# Direct SQL Comparison Evidence: Dashboard Aggregations

## Overview
This document records the mathematical and logical equivalence between Prisma aggregate queries in the TokTickIT application layer and raw PostgreSQL queries (`prisma.$queryRaw`) executed directly against the database, satisfying Rubric Part 5 and Lab 4 Sheet Section 6 requirements.

Automated verification is enforced via:
- `server/tests/lab-04/requester-dashboard.api.test.ts` (`API-DSH-10`)
- `server/tests/lab-04/staff-dashboard.api.test.ts` (`API-DSH-21`)

---

## 1. Requester Dashboard Equivalence

### 1.1 Open Requests (`openRequests`)
- **Formula:** Active tickets owned by the requester with status `New`, `Open`, or `Reopened`.
- **Prisma Application Query:**
  ```typescript
  prisma.ticket.groupBy({
    by: ['currentStatus'],
    where: { requesterId }
  });
  // openRequests = statusMap['New'] + statusMap['Open'] + statusMap['Reopened']
  ```
- **Direct Raw SQL:**
  ```sql
  SELECT COUNT(*)::int AS count
  FROM "Ticket"
  WHERE "requesterId" = $1
    AND "currentStatus" IN ('New', 'Open', 'Reopened');
  ```
- **Equivalence Status:** Verified identical count in API-DSH-10.

### 1.2 In Progress (`inProgress`)
- **Formula:** Tickets owned by the requester currently undergoing active work (`InProgress`).
- **Prisma Application Query:**
  ```typescript
  // inProgress = statusMap['InProgress']
  ```
- **Direct Raw SQL:**
  ```sql
  SELECT COUNT(*)::int AS count
  FROM "Ticket"
  WHERE "requesterId" = $1
    AND "currentStatus" = 'In Progress';
  ```
- **Equivalence Status:** Verified identical count in API-DSH-10 (handling Postgres enum value `'In Progress'`).

### 1.3 Waiting for Requester (`waitingForRequester`)
- **Formula:** Tickets where IT Staff requested user feedback or clarification (`WaitingForRequester`).
- **Prisma Application Query:**
  ```typescript
  // waitingForRequester = statusMap['WaitingForRequester']
  ```
- **Direct Raw SQL:**
  ```sql
  SELECT COUNT(*)::int AS count
  FROM "Ticket"
  WHERE "requesterId" = $1
    AND "currentStatus" = 'Waiting for Requester';
  ```
- **Equivalence Status:** Verified identical count in API-DSH-10 (handling Postgres enum value `'Waiting for Requester'`).

### 1.4 Recently Resolved (`recentlyResolved`)
- **Formula:** Tickets in `Resolved` status updated within rolling 7 calendar days (`updatedAt >= NOW() - INTERVAL '7 days'`).
- **Prisma Application Query:**
  ```typescript
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  prisma.ticket.count({
    where: {
      requesterId,
      currentStatus: TicketStatus.Resolved,
      updatedAt: { gte: sevenDaysAgo }
    }
  });
  ```
- **Direct Raw SQL:**
  ```sql
  SELECT COUNT(*)::int AS count
  FROM "Ticket"
  WHERE "requesterId" = $1
    AND "currentStatus" = 'Resolved'
    AND "updatedAt" >= NOW() - INTERVAL '7 days';
  ```
- **Equivalence Status:** Verified identical count in API-DSH-10 and boundary precision tested in API-DSH-04.

### 1.5 Closed Requests (`closed`)
- **Formula:** Tickets in terminal `Closed` status.
- **Prisma Application Query:**
  ```typescript
  // closed = statusMap['Closed']
  ```
- **Direct Raw SQL:**
  ```sql
  SELECT COUNT(*)::int AS count
  FROM "Ticket"
  WHERE "requesterId" = $1
    AND "currentStatus" = 'Closed';
  ```
- **Equivalence Status:** Verified identical count in API-DSH-10.

---

## 2. Staff and Administrator Dashboard Equivalence

### 2.1 Unassigned Active Tickets (`unassigned`)
- **Formula:** Non-terminal tickets (`currentStatus NOT IN ('Closed', 'Cancelled')`) without an assigned owner (`ownerId IS NULL`).
- **Prisma Application Query:**
  ```typescript
  prisma.ticket.count({
    where: {
      ownerId: null,
      currentStatus: { notIn: [TicketStatus.Closed, TicketStatus.Cancelled] }
    }
  });
  ```
- **Direct Raw SQL:**
  ```sql
  SELECT COUNT(*)::int AS count
  FROM "Ticket"
  WHERE "ownerId" IS NULL
    AND "currentStatus" NOT IN ('Closed', 'Cancelled');
  ```
- **Equivalence Status:** Verified identical count in API-DSH-21.

### 2.2 Owned By Me Active Tickets (`ownedByMe`)
- **Formula:** Active tickets assigned to the authenticated IT Staff user.
- **Prisma Application Query:**
  ```typescript
  prisma.ticket.count({
    where: {
      ownerId: userId,
      currentStatus: { notIn: [TicketStatus.Closed, TicketStatus.Cancelled] }
    }
  });
  ```
- **Direct Raw SQL:**
  ```sql
  SELECT COUNT(*)::int AS count
  FROM "Ticket"
  WHERE "ownerId" = $1
    AND "currentStatus" NOT IN ('Closed', 'Cancelled');
  ```
- **Equivalence Status:** Verified identical count in API-DSH-21.

### 2.3 Appears Resolved Active Tickets (`appearsResolved`)
- **Formula:** Active tickets where requester confirmed resolution via advisory signal (`appearsResolved = true`).
- **Prisma Application Query:**
  ```typescript
  prisma.ticket.count({
    where: {
      appearsResolved: true,
      currentStatus: { notIn: [TicketStatus.Closed, TicketStatus.Cancelled] }
    }
  });
  ```
- **Direct Raw SQL:**
  ```sql
  SELECT COUNT(*)::int AS count
  FROM "Ticket"
  WHERE "appearsResolved" = true
    AND "currentStatus" NOT IN ('Closed', 'Cancelled');
  ```
- **Equivalence Status:** Verified identical count in API-DSH-21.

### 2.4 Breakdown By Priority (`byPriority`)
- **Formula:** Active tickets grouped by `itPriority`, with `UNSET` mapped for tickets without explicit IT priority assignment.
- **Prisma Application Query:**
  ```typescript
  prisma.ticket.groupBy({
    by: ['itPriority'],
    where: {
      currentStatus: { notIn: [TicketStatus.Closed, TicketStatus.Cancelled] }
    },
    _count: true
  });
  ```
- **Direct Raw SQL:**
  ```sql
  SELECT "itPriority", COUNT(*)::int AS count
  FROM "Ticket"
  WHERE "currentStatus" NOT IN ('Closed', 'Cancelled')
  GROUP BY "itPriority";
  ```
- **Equivalence Status:** Verified identical count in API-DSH-21.

---

## 3. Test Execution Verification

Vitest execution summary from `server/tests/lab-04/requester-dashboard.api.test.ts` and `server/tests/lab-04/staff-dashboard.api.test.ts`:
- Total Dashboard API tests: 24 passed (0 failed).
- Direct SQL Comparison tests:
  - `API-DSH-10`: Requester SQL equivalence passed.
  - `API-DSH-21`: Staff SQL equivalence passed.
- 1-to-1 Card-to-List Count Consistency:
  - `API-DSH-09`: `GET /api/tickets` with drill-down query matches card count for every metric.
  - `API-DSH-20`: `GET /api/staff/tickets` with drill-down query matches card count for every metric.
