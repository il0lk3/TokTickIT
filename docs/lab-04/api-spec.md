# Sprint 4 REST API Specification

This document defines the formal REST API contract for Lab 4 of TokTickIT, including endpoint paths, methods, authentication, payload schemas, business validations, optimistic concurrency conflict handling, error codes, and dashboard calculations.

---

## 1. Global Conventions & Error Handling

### 1.1 Authentication & Authorization
All authenticated requests must include a valid session JWT via the HTTP-only cookie (`accessToken`).
- `401 Unauthorized`: No valid token or user session expired/inactive.
- `403 Forbidden`: Authenticated user lacks required role (e.g., Requester attempting to write an Action Taken) or does not own the requested resource.

### 1.2 Error Response Format
All 4xx and 5xx responses must return a standardized, safe JSON body:
```json
{
  "error": "Human readable error description",
  "code": "STANDARDIZED_ERROR_CODE",
  "details": null
}
```

### 1.3 HTTP Status Codes
| Code | Meaning | Usage |
|---|---|---|
| `200 OK` | Success | Successful retrieval, modification, or workflow transition |
| `201 Created` | Created | Successfully created Action Taken |
| `400 Bad Request` | Validation Error | Missing required fields, length exceeded, or invalid transition |
| `401 Unauthorized` | Unauthenticated | Missing or invalid authentication token |
| `403 Forbidden` | Access Denied | Role or ownership restriction violated |
| `404 Not Found` | Not Found | Target ticket, action, or related resource does not exist |
| `409 Conflict` | Optimistic Concurrency | Stale update detected (`expectedVersion != currentVersion`) |
| `422 Unprocessable` | Semantic Error | Logical business rule failure |
| `500 Server Error` | Internal Failure | Unexpected failure; internal details omitted from client |

---

## 2. Actions Taken APIs

### 2.1 List Actions Taken for a Ticket
Retrieve all Actions Taken entries for a specific ticket, ordered chronologically.

- **Method / Path**: `GET /api/tickets/:id/actions-taken`
- **Access**: 
  - `REQUESTER` (Allowed **only** if the ticket belongs to the authenticated Requester)
  - `IT_STAFF` / `ADMINISTRATOR` (Allowed for all tickets)
- **Path Parameters**:
  - `id`: Integer (Ticket ID)
- **Success Response (200 OK)**:
  ```json
  [
    {
      "id": 101,
      "ticketId": 14,
      "actionAt": "2026-10-17T09:30:00.000Z",
      "description": "Inspected network interface card and tested link speed.",
      "result": "NIC hardware functional; packet loss detected on switch port 12.",
      "performedById": 2,
      "performedBy": {
        "id": 2,
        "name": "Alex Tech",
        "role": "IT_STAFF"
      },
      "followUpRequired": true,
      "followUpNote": "Scheduled port migration with building network admin.",
      "attachmentNotes": "Refer to switch-diagnostic-log.txt",
      "createdAt": "2026-10-17T09:35:10.000Z",
      "updatedAt": "2026-10-17T09:35:10.000Z"
    }
  ]
  ```
- **Empty State Response (200 OK)**: `[]` (When no actions have been logged yet).
- **Error Responses**:
  - `401 Unauthorized`: Token missing or expired.
  - `403 Forbidden`: Authenticated user lacks required role.
  - `404 Not Found`: Ticket does not exist, or belongs to another user (Requester tenant isolation returns `404 Not Found` to prevent ID enumeration).

---

### 2.2 Create Action Taken
Record a new action under an active ticket. Performer is extracted strictly from the authenticated session.

- **Method / Path**: `POST /api/tickets/:id/actions-taken`
- **Access**: `IT_STAFF`, `ADMINISTRATOR` (Requesters return `403 Forbidden`).
- **Path Parameters**:
  - `id`: Integer (Ticket ID)
- **Request Body**:
  ```json
  {
    "actionAt": "2026-10-17T09:30:00.000Z",
    "description": "Cleaned dust from heatsink and reapplied thermal paste.",
    "result": "CPU idle temperatures dropped from 82C to 45C.",
    "followUpRequired": false,
    "followUpNote": null,
    "attachmentNotes": "hwmonitor-screenshot.png"
  }
  ```
- **Validation Rules**:
  - `description`: Required string, 1 to 1,000 characters.
  - `result`: Required string, 1 to 1,000 characters.
  - `actionAt`: Optional ISO DateTime string (defaults to `new Date()` if omitted). Cannot be in the future beyond 10 minutes (clock drift margin).
  - `followUpRequired`: Boolean (defaults to `false`).
  - `followUpNote`: **Mandatory** string (1 to 1,000 characters) if `followUpRequired === true`. Must be null/empty if `false`.
  - `attachmentNotes`: Optional string, max 500 characters.
  - `performedById` in body: **Ignored / Forbidden**. Overwritten with `res.locals.user.id`.
  - Target Ticket Status: Ticket cannot be in terminal status (`Closed`, `Cancelled`).
- **Success Response (201 Created)**:
  ```json
  {
    "id": 102,
    "ticketId": 14,
    "actionAt": "2026-10-17T09:30:00.000Z",
    "description": "Cleaned dust from heatsink and reapplied thermal paste.",
    "result": "CPU idle temperatures dropped from 82C to 45C.",
    "performedById": 2,
    "performedBy": {
      "id": 2,
      "name": "Alex Tech",
      "role": "IT_STAFF"
    },
    "followUpRequired": false,
    "followUpNote": null,
    "attachmentNotes": "hwmonitor-screenshot.png",
    "createdAt": "2026-10-17T09:40:00.000Z",
    "updatedAt": "2026-10-17T09:40:00.000Z"
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `FOLLOWUP_NOTE_REQUIRED` when `followUpRequired: true` without note.
  - `400 Bad Request`: `TERMINAL_TICKET_LOCKED` when ticket is `Closed` or `Cancelled`.
  - `403 Forbidden`: `ROLE_NOT_PERMITTED` if Requester attempts call.
  - `404 Not Found`: Ticket ID not found.

---

### 2.3 Update Action Taken
Update an existing Action Taken record.

- **Method / Path**: `PATCH /api/tickets/:id/actions-taken/:actionId`
- **Access**: `IT_STAFF`, `ADMINISTRATOR`
- **Path Parameters**:
  - `id`: Integer (Ticket ID)
  - `actionId`: Integer (Action Taken ID)
- **Request Body**:
  ```json
  {
    "description": "Updated diagnostic summary...",
    "result": "Final stress test passed.",
    "followUpRequired": true,
    "followUpNote": "Follow-up check on Monday."
  }
  ```
- **Validation Rules**:
  - Action must belong to ticket `id` (`action.ticketId === id`).
  - Cannot move action to another ticket.
  - Follow-up validation rules apply as in creation.
- **Success Response (200 OK)**: Returns updated `ActionTaken` object.
- **Error Responses**:
  - `400 Bad Request`: Invalid payload or terminal ticket locked.
  - `404 Not Found`: Action Taken not found under this ticket.

---

## 3. Ticket Workflow & Resolution Gate API

### 3.1 Update Ticket Status & Operational Fields
Handles owner assignment, priority adjustment, and status transitions with optimistic concurrency control.

- **Method / Path**: `PATCH /api/staff/tickets/:id`
- **Access**: `IT_STAFF`, `ADMINISTRATOR`
- **Path Parameters**:
  - `id`: Integer (Ticket ID)
- **Request Body**:
  ```json
  {
    "status": "Resolved",
    "expectedVersion": 2,
    "ownerId": 2,
    "itPriority": "HIGH"
  }
  ```

#### Business Rules & Validation Steps:
1. **Mandatory Concurrency Version Check**:
   - `expectedVersion` is strictly required (`400 Bad Request`, `VERSION_REQUIRED` if omitted).
   - `expectedVersion` must be a non-negative integer (`400 Bad Request`, `INVALID_VERSION_FORMAT` if string/negative/float/null).
   - If `expectedVersion !== ticket.version`:
     - Return **`409 Conflict`**:
       ```json
       {
         "error": "This ticket has been modified by another user. Please reload the latest changes.",
         "code": "STALE_VERSION_CONFLICT",
         "currentVersion": 3,
         "currentStatus": "InProgress",
         "updatedAt": "2026-10-18T02:00:00.000Z"
       }
       ```
2. **Non-Empty Update Payload Guard**:
   - At least one operational field (`ownerId`, `itPriority`, or `status`) must be provided alongside `expectedVersion`. Submitting only `{ expectedVersion }` returns **`400 Bad Request`** (`NO_FIELDS_TO_UPDATE`).
3. **Terminal / Locked Ticket Guard**:
   - `Closed` and `Cancelled` tickets are locked. Modifications to priority, owner, or status are blocked (`400 Bad Request`, `TERMINAL_TICKET_LOCKED`), with the sole exception of `Closed -> Reopened`.
4. **Assignee / Owner Eligibility**:
   - If `ownerId` is provided:
     - Target user must exist, have role `IT_STAFF`, and `isActive === true`.
     - If inactive: Return **`400 Bad Request`** (`INACTIVE_ASSIGNEE_REJECTED`).
     - If non-staff role: Return **`400 Bad Request`** (`ASSIGNEE_NOT_ELIGIBLE`).
5. **Status Transition Matrix Validation**:
   - Verify `ticket.currentStatus -> body.status` is permitted by the 8x8 status matrix.
   - If not permitted: Return **`400 Bad Request`** (`INVALID_STATUS_TRANSITION`).
6. **Resolution Gate Enforcement**:
   - When transitioning to `Resolved`:
     - Target ticket must have an assigned active IT Staff Owner (`(ownerId || ticket.ownerId) !== null` and active).
     - Target ticket must have at least **1** `ActionTaken` entry with non-empty `result`.
     - If either condition fails: Return **`400 Bad Request`**:
       ```json
       {
         "error": "Resolution gate failed: Ticket must have an active IT Staff owner and at least one Action Taken with a result.",
         "code": "RESOLUTION_GATE_FAILED",
         "details": ["ACTIVE_STAFF_OWNER_REQUIRED", "ACTION_TAKEN_WITH_RESULT_REQUIRED"]
       }
       ```
7. **Atomic Conditional Commit & Version Increment**:
   - On success, `version` is atomically incremented by 1 (`version: { increment: 1 }`).
   - If a status transition occurs, `appearsResolved` is reset to `false`.

- **Success Response (200 OK)**:
  ```json
  {
    "id": 14,
    "ticketNumber": "TKT-2026-000014",
    "currentStatus": "Resolved",
    "ownerId": 2,
    "itPriority": "HIGH",
    "version": 3,
    "updatedAt": "2026-10-18T02:20:00.000Z",
    "allowedTransitions": ["Closed", "Reopened", "Cancelled"],
    "resolutionGate": {
      "met": true,
      "hasActiveOwner": true,
      "validActionCount": 1,
      "missing": []
    }
  }
  ```

---

### 3.2 Advisory Resolution Signal (Requester)
Allows a Requester to signal that their issue appears resolved. This action posts an advisory audit comment and sets a flag, but strictly does NOT alter the formal ticket status.

- **Method / Path**: `PATCH /api/tickets/:id/appears-resolved`
- **Access**: `REQUESTER` (Must be the owner of the ticket; non-owners or other roles receive `403 Forbidden`).
- **Path Parameters**:
  - `id`: Integer (Ticket ID)
- **Request Body**: None (Empty body `{}`)
- **Business Validations**:
  - Ticket must exist (`404 Not Found` if missing).
  - Authenticated user must be the ticket requester (`ticket.requesterId === res.locals.user.id`).
  - Ticket cannot be in terminal status (`Resolved`, `Closed`, `Cancelled`) -> `400 Bad Request` (`TICKET_ALREADY_CLOSED_OR_RESOLVED`).
  - Ticket cannot already have `appearsResolved === true` -> `400 Bad Request` (`TICKET_ALREADY_MARKED_RESOLVED`).
- **Processing**:
  - Atomically sets `ticket.appearsResolved = true`.
  - Automatically posts a public comment: `"The problem appears to be resolved."` with author set to the requester.
- **Success Response (200 OK)**:
  ```json
  {
    "ticket": {
      "id": 14,
      "ticketNumber": "TKT-2026-000014",
      "currentStatus": "InProgress",
      "appearsResolved": true,
      "updatedAt": "2026-10-17T10:05:00.000Z"
    },
    "comment": {
      "id": 55,
      "content": "The problem appears to be resolved.",
      "author": {
        "name": "Jennifer Requester",
        "role": "REQUESTER"
      },
      "createdAt": "2026-10-17T10:05:00.000Z"
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Ticket already marked or in terminal state.
  - `403 Forbidden`: User is not the owner of this ticket.
  - `404 Not Found`: Ticket ID not found.

---

### 3.3 Claim Ticket
Allows an active IT Staff member to claim ownership of an existing ticket.

- **Method / Path**: `POST /api/staff/tickets/:id/claim`
- **Access**: `IT_STAFF` only (per BR-12; Administrators calling this receive `400 Bad Request` with `ASSIGNEE_NOT_ELIGIBLE`).
- **Validation Rules**:
  - Caller must have role `IT_STAFF` (`400 Bad Request`, `ASSIGNEE_NOT_ELIGIBLE` if ineligible role).
  - Caller must be active (`400 Bad Request`, `INACTIVE_ASSIGNEE_REJECTED` if inactive).
  - Target ticket must exist (`404 Not Found`, `TICKET_NOT_FOUND`).
  - Cannot claim terminal tickets (`Closed`, `Cancelled`) -> `400 Bad Request` (`TERMINAL_TICKET_LOCKED`).
  - If ticket is currently `New`, it transitions automatically to `Open` and resets `appearsResolved` to `false`.
  - Atomically increments ticket `version` by 1.
- **Success Response (200 OK)**:
  Returns updated ticket object enriched with `allowedTransitions` array and `resolutionGate` status.
- **Error Responses**:
  - `400 Bad Request`: `ASSIGNEE_NOT_ELIGIBLE` if caller is not `IT_STAFF`.
  - `400 Bad Request`: `INACTIVE_ASSIGNEE_REJECTED` if caller is inactive.
  - `400 Bad Request`: `TERMINAL_TICKET_LOCKED` if ticket is `Closed` or `Cancelled`.
  - `404 Not Found`: `TICKET_NOT_FOUND`.

---

## 4. Operational Dashboard APIs

### 4.1 Requester Dashboard
Provides summary statistics, urgent attention tickets, and recent ticket history strictly for the authenticated Requester.

- **Method / Path**: `GET /api/dashboard/requester`
- **Access**: `REQUESTER` only (Staff/Admin calling this receives `403 Forbidden`).
- **Headers**:
  - `Cache-Control: no-store`
- **Success Response (200 OK)**:
  ```json
  {
    "metrics": {
      "openRequests": {
        "count": 3,
        "drillDown": {
          "path": "/tickets",
          "query": { "status": "New,Open,Reopened" }
        }
      },
      "inProgress": {
        "count": 2,
        "drillDown": {
          "path": "/tickets",
          "query": { "status": "InProgress" }
        }
      },
      "waitingForRequester": {
        "count": 1,
        "drillDown": {
          "path": "/tickets",
          "query": { "status": "WaitingForRequester" }
        }
      },
      "recentlyResolved": {
        "count": 5,
        "drillDown": {
          "path": "/tickets",
          "query": { "status": "Resolved", "updatedSince": "2026-10-12T00:00:00.000Z" }
        }
      },
      "closed": {
        "count": 12,
        "drillDown": {
          "path": "/tickets",
          "query": { "status": "Closed" }
        }
      }
    },
    "attentionTickets": [
      {
        "id": 18,
        "ticketNumber": "TKT-2026-000018",
        "summary": "Need confirmation for software install",
        "currentStatus": "WaitingForRequester",
        "updatedAt": "2026-10-19T08:00:00.000Z",
        "category": { "id": 2, "name": "Software" }
      }
    ],
    "recentTickets": [
      {
        "id": 24,
        "ticketNumber": "TKT-2026-000024",
        "summary": "Laptop battery drains quickly",
        "currentStatus": "InProgress",
        "updatedAt": "2026-10-19T09:14:00.000Z",
        "category": { "id": 1, "name": "Hardware" }
      }
    ]
  }
  ```
- **Metric Definitions**:
  - `openRequests`: Tickets owned by Requester where status in `['New', 'Open', 'Reopened']`.
  - `inProgress`: Tickets owned by Requester where status = `'InProgress'`.
  - `waitingForRequester`: Tickets owned by Requester where status = `'WaitingForRequester'` (requires requester attention).
  - `recentlyResolved`: Tickets owned by Requester where status = `'Resolved'` and `updatedAt >= (now - 7 rolling days)`.
  - `closed`: Tickets owned by Requester where status = `'Closed'`.
  - `attentionTickets`: Active tickets owned by Requester with status = `'WaitingForRequester'`, ordered by `updatedAt DESC, id DESC` (limit 5).
  - `recentTickets`: Top 5 tickets owned by Requester ordered by `updatedAt DESC, id DESC`.

---

### 4.2 IT Staff & Administrator Dashboard
Provides system-wide operational metrics, normalized status/priority maps, user counts (admin-only), and drill-down links.

- **Method / Path**: `GET /api/dashboard/staff`
- **Access**: `IT_STAFF`, `ADMINISTRATOR` (Requesters return `403 Forbidden`).
- **Headers**:
  - `Cache-Control: no-store`
- **Success Response (200 OK)**:
  ```json
  {
    "metrics": {
      "unassigned": {
        "count": 8,
        "drillDown": {
          "path": "/queue",
          "query": { "ownerId": "unassigned", "active": "true" }
        }
      },
      "ownedByMe": {
        "count": 16,
        "drillDown": {
          "path": "/queue",
          "query": { "ownerId": "me", "active": "true" }
        }
      },
      "appearsResolved": {
        "count": 3,
        "drillDown": {
          "path": "/queue",
          "query": { "appearsResolved": "true", "active": "true" }
        }
      },
      "recentlyUpdated": {
        "count": 12,
        "drillDown": {
          "path": "/queue",
          "query": { "updatedSince": "2026-10-18T10:00:00.000Z", "active": "true" }
        }
      },
      "byStatus": {
        "New": 4,
        "Open": 6,
        "InProgress": 8,
        "WaitingForRequester": 2,
        "Resolved": 10,
        "Closed": 15,
        "Reopened": 1,
        "Cancelled": 0
      },
      "byPriority": {
        "LOW": 5,
        "MEDIUM": 12,
        "HIGH": 3,
        "UNSET": 0
      },
      "adminUserCounts": {
        "total": 35,
        "active": 33,
        "requesters": 25,
        "staff": 7,
        "admins": 3
      }
    },
    "myRecentTickets": [
      {
        "id": 34,
        "ticketNumber": "TKT-2026-000034",
        "summary": "Core router rebooted unexpectedly",
        "currentStatus": "InProgress",
        "itPriority": "HIGH",
        "owner": { "id": 2, "name": "Michael Staff" },
        "requester": { "id": 10, "name": "Alice Requester" },
        "category": { "id": 3, "name": "Network" },
        "updatedAt": "2026-10-19T09:14:00.000Z"
      }
    ],
    "urgentTickets": [
      {
        "id": 35,
        "ticketNumber": "TKT-2026-000035",
        "summary": "Production database latency spike",
        "currentStatus": "Open",
        "itPriority": "HIGH",
        "owner": null,
        "requester": { "id": 11, "name": "Bob Requester" },
        "category": { "id": 4, "name": "Database" },
        "updatedAt": "2026-10-19T09:20:00.000Z"
      }
    ]
  }
  ```
- **Metric Definitions**:
  - `unassigned`: Active tickets (`currentStatus` not in `['Closed', 'Cancelled']`) where `ownerId === null`.
  - `ownedByMe`: Active tickets where `ownerId === authenticatedUser.id`.
  - `appearsResolved`: Active tickets where `appearsResolved === true`.
  - `recentlyUpdated`: Active tickets where `updatedAt >= (now - 24 rolling hours)`.
  - `byStatus`: Complete normalized map containing all 8 lifecycle statuses (all values >= 0).
  - `byPriority`: Count of active tickets grouped by `itPriority` (`LOW`, `MEDIUM`, `HIGH`, `UNSET`).
  - `adminUserCounts`: User statistics returned if authenticated user is `ADMINISTRATOR`, otherwise `null` for IT Staff.
  - `myRecentTickets`: Top 5 active tickets owned by the authenticated staff user ordered by `updatedAt DESC, id DESC`.
  - `urgentTickets`: Top 5 active tickets across system with `itPriority = 'HIGH'` ordered by `updatedAt DESC, id DESC`.

---

### 4.3 List & Queue Query Parameters (1-to-1 Drill-Down Consistency)
Both `/api/tickets` and `/api/staff/tickets` accept structured drill-down parameters ensuring `meta.total` matches dashboard card counts exactly:

#### Staff Queue (`GET /api/staff/tickets`):
- `status`: Single status or comma-separated status list (e.g. `status=New,Open,Reopened`).
- `ownerId`: Integer ID, `"unassigned"` (ownerId IS NULL), or `"me"` (ownerId === authenticated staff).
- `active`: `"true"` filters out `Closed` and `Cancelled` tickets.
- `appearsResolved`: `"true"` filters tickets where requester submitted advisory confirmation.
- `updatedSince`: ISO 8601 timestamp string (`updatedAt >= date`).
- `itPriority`: Priority level (`LOW`, `MEDIUM`, `HIGH`).
- `requestedPriority`: Priority level (`LOW`, `MEDIUM`, `HIGH`).
- `categoryId`: Integer ID.
- `search`: Case-insensitive search on ticketNumber or summary.
- `page`, `limit`, `sortBy`, `sortOrder`.

#### Requester My Tickets (`GET /api/tickets`):
- `status`: Single status or comma-separated status list (e.g. `status=New,Open,Reopened`).
- `active`: `"true"` filters out `Closed` and `Cancelled` tickets.
- `updatedSince`: ISO 8601 timestamp string (`updatedAt >= date`).
- `requestedPriority`: Priority level (`LOW`, `MEDIUM`, `HIGH`).
- `categoryId`: Integer ID.
- `search`: Case-insensitive search.
- `page`, `limit`, `sortBy`, `sortOrder`.

---

## 5. Date & Timezone Conventions
- Timestamps sent and received over REST are in **ISO 8601** UTC string format (e.g. `2026-10-19T09:30:00.000Z`).
- Time window boundaries (`recentlyResolved` 7 days, `recentlyUpdated` 24 hours) operate on deterministic rolling millisecond intervals (`Date.now() - durationMs`), maintaining UTC invariance and test reproducibility.
