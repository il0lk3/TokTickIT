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
- **Validation & Processing Rules**:
  - `description`: Required string, 1 to 1,000 characters (after trimming).
  - `result`: Required string, 1 to 1,000 characters (after trimming).
  - `actionAt`: Optional ISO DateTime string (defaults to `new Date()` if omitted). Cannot be in the future beyond 10 minutes (`FUTURE_ACTION_DATE_REJECTED`).
  - `followUpRequired`: Boolean (defaults to `false`).
  - `followUpNote`: **Mandatory** string (1 to 1,000 characters) if `followUpRequired === true` (`FOLLOWUP_NOTE_REQUIRED`). Cleared to `null` if `false`.
  - `attachmentNotes`: Optional string, max 500 characters.
  - `performedById` in body: **Ignored / Forbidden**. Overwritten strictly with `res.locals.user.id`.
  - **Target Ticket Status**: Ticket cannot be in terminal status (`Closed`, `Cancelled`).
  - **5-Second Idempotency Guard**: If the same user submits an identical `description` on the same ticket within 5 seconds, returns **`200 OK`** with the existing `ActionTaken` record instead of creating a duplicate.
  - **Ticket Timestamp Touch**: Creating a new action updates `ticket.updatedAt` (so it appears in the dashboard's 24h activity metric) while intentionally preserving `ticket.version` to avoid false optimistic concurrency conflicts.
- **Success Response (201 Created, or 200 OK on 5s duplicate)**:
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
  - `400 Bad Request`: `INVALID_ID_FORMAT` when `:id` is not a positive integer.
  - `400 Bad Request`: `VALIDATION_ERROR` when `description`, `result`, `followUpNote`, `attachmentNotes`, or `actionAt` fails format/length validation (includes field-level `fields` map).
  - `400 Bad Request`: `FOLLOWUP_NOTE_REQUIRED` when `followUpRequired: true` without a non-empty note.
  - `400 Bad Request`: `FUTURE_ACTION_DATE_REJECTED` when `actionAt` is more than 10 minutes in the future.
  - `400 Bad Request`: `TERMINAL_TICKET_LOCKED` when ticket is `Closed` or `Cancelled`.
  - `403 Forbidden`: `ROLE_NOT_PERMITTED` if Requester attempts call.
  - `404 Not Found`: `TICKET_NOT_FOUND` if ticket ID does not exist.

---

### 2.3 Update Action Taken
Update an existing Action Taken record with optional optimistic concurrency protection.

- **Method / Path**: `PATCH /api/tickets/:id/actions-taken/:actionId`
- **Access**: `IT_STAFF`, `ADMINISTRATOR` (Requesters return `403 Forbidden`).
- **Path Parameters**:
  - `id`: Integer (Ticket ID)
  - `actionId`: Integer (Action Taken ID)
- **Request Body**:
  ```json
  {
    "description": "Updated diagnostic summary...",
    "result": "Final stress test passed.",
    "followUpRequired": true,
    "followUpNote": "Follow-up check on Monday.",
    "expectedUpdatedAt": "2026-10-17T09:35:10.000Z"
  }
  ```
- **Validation Rules**:
  - Action must belong to ticket `id` (`action.ticketId === id`), otherwise returns `404 Not Found` (`ACTION_NOT_FOUND`).
  - At least one modifiable field (`description`, `result`, `actionAt`, `followUpRequired`, `followUpNote`, `attachmentNotes`) must be provided (`400 Bad Request`, `EMPTY_UPDATE_PAYLOAD` if empty).
  - `ticketId` and `performedById` are immutable and cannot be modified.
  - If `expectedUpdatedAt` is provided and does not match `existingAction.updatedAt.toISOString()`, returns **`409 Conflict`** (`STALE_ACTION_UPDATE`).
  - Merged fields are validated using the same length, date, and follow-up rules as creation.
- **Success Response (200 OK)**: Returns updated `ActionTaken` object with `performedBy`.
- **Error Responses**:
  - `400 Bad Request`: `INVALID_ID_FORMAT`, `EMPTY_UPDATE_PAYLOAD`, `VALIDATION_ERROR`, `FOLLOWUP_NOTE_REQUIRED`, `FUTURE_ACTION_DATE_REJECTED`, or `TERMINAL_TICKET_LOCKED`.
  - `403 Forbidden`: `ROLE_NOT_PERMITTED` if Requester attempts call.
  - `404 Not Found`: `TICKET_NOT_FOUND` or `ACTION_NOT_FOUND`.
  - `409 Conflict`: `STALE_ACTION_UPDATE` when `expectedUpdatedAt` is stale.

---

## 3. Ticket Workflow & Resolution Gate API

### 3.0 Get Staff Ticket Detail with Workflow Metadata
Retrieves full ticket details for IT Staff and Administrators, enriched with computed `allowedTransitions` and `resolutionGate` evaluation.

- **Method / Path**: `GET /api/staff/tickets/:id`
- **Access**: `IT_STAFF`, `ADMINISTRATOR`
- **Path Parameters**:
  - `id`: Integer (Ticket ID)
- **Success Response (200 OK)**:
  Returns the full ticket record (with `category`, `relatedSystem`, `requester`, `owner`, `attachments`, `publicComments`, `internalNotes`) plus workflow metadata:
  ```json
  {
    "id": 14,
    "ticketNumber": "TKT-2026-000014",
    "currentStatus": "InProgress",
    "ownerId": 2,
    "itPriority": "HIGH",
    "appearsResolved": false,
    "version": 2,
    "allowedTransitions": ["WaitingForRequester", "Resolved", "Cancelled"],
    "resolutionGate": {
      "met": true,
      "hasActiveOwner": true,
      "validActionCount": 1,
      "missing": []
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `INVALID_ID_FORMAT`.
  - `404 Not Found`: `TICKET_NOT_FOUND`.

---

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
2. **Non-Empty Update Payload & Enum Validation**:
   - At least one operational field (`ownerId`, `itPriority`, or `status`) must be provided alongside `expectedVersion`. Submitting only `{ expectedVersion }` returns **`400 Bad Request`** (`NO_FIELDS_TO_UPDATE`).
   - Invalid `status` values return `400 Bad Request` (`INVALID_STATUS_VALUE`); invalid `itPriority` values (outside `LOW`, `MEDIUM`, `HIGH`) return `400 Bad Request` (`INVALID_PRIORITY`).
3. **Terminal / Locked Ticket Guard**:
   - `Closed` and `Cancelled` tickets are locked. Modifications to priority, owner, or status are blocked (`400 Bad Request`, `TERMINAL_TICKET_LOCKED`), with the sole exception of `Closed -> Reopened`.
4. **Assignee / Owner Eligibility**:
   - If `ownerId` is provided (and not `null`):
     - Target user must exist (`400 Bad Request`, `ASSIGNEE_NOT_FOUND` if missing), have role `IT_STAFF`, and `isActive === true`.
     - If inactive: Return **`400 Bad Request`** (`INACTIVE_ASSIGNEE_REJECTED`).
     - If non-staff role: Return **`400 Bad Request`** (`ASSIGNEE_NOT_ELIGIBLE`).
   - **Auto-Open on Initial Assignment**: If `ownerId` is assigned to a ticket currently in `New` status and `status` is not explicitly provided, the ticket automatically transitions `New -> Open`.
5. **Status Transition Matrix Validation**:
   - Verify `ticket.currentStatus -> nextStatus` is permitted by the 8×8 status matrix.
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
- **Access**: `REQUESTER` (Must be the owner of the ticket; non-owners or other roles receive `403 Forbidden` with `FORBIDDEN`).
- **Path Parameters**:
  - `id`: Integer (Ticket ID)
- **Request Body**: None (Empty body `{}`)
- **Business Validations**:
  - Ticket must exist (`404 Not Found`, `TICKET_NOT_FOUND` if missing).
  - Authenticated user must be the ticket requester (`ticket.requesterId === res.locals.user.id`).
  - Ticket cannot be in `New` status -> `400 Bad Request` (`CANNOT_SIGNAL_ON_NEW_TICKET`).
  - Ticket cannot be in terminal status (`Resolved`, `Closed`, `Cancelled`) -> `400 Bad Request` (`TICKET_ALREADY_RESOLVED_OR_CLOSED`).
  - Ticket cannot already have `appearsResolved === true` -> `400 Bad Request` (`TICKET_ALREADY_MARKED_RESOLVED`).
- **Processing**:
  - Atomically sets `ticket.appearsResolved = true` and increments `ticket.version` by 1.
  - Automatically posts a public comment: `"The problem appears to be resolved."` with author set to the requester.
- **Success Response (200 OK)**:
  ```json
  {
    "ticket": {
      "id": 14,
      "ticketNumber": "TKT-2026-000014",
      "currentStatus": "InProgress",
      "appearsResolved": true,
      "version": 2,
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
  - `400 Bad Request`: `INVALID_ID_FORMAT`, `CANNOT_SIGNAL_ON_NEW_TICKET`, `TICKET_ALREADY_RESOLVED_OR_CLOSED`, or `TICKET_ALREADY_MARKED_RESOLVED`.
  - `403 Forbidden`: `FORBIDDEN` if user is not the requester of this ticket.
  - `404 Not Found`: `TICKET_NOT_FOUND`.

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
        "appearsResolved": false,
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
        "appearsResolved": false,
        "updatedAt": "2026-10-19T09:14:00.000Z",
        "category": { "id": 1, "name": "Hardware" }
      }
    ],
    "generatedAt": "2026-10-19T09:30:00.000Z"
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
        "HIGH": 3
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
        "appearsResolved": false,
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
        "appearsResolved": false,
        "owner": null,
        "requester": { "id": 11, "name": "Bob Requester" },
        "category": { "id": 4, "name": "Database" },
        "updatedAt": "2026-10-19T09:20:00.000Z"
      }
    ],
    "generatedAt": "2026-10-19T09:30:00.000Z"
  }
  ```
- **Metric Definitions**:
  - `unassigned`: Active tickets (`currentStatus` not in `['Closed', 'Cancelled']`) where `ownerId === null`.
  - `ownedByMe`: Active tickets where `ownerId === authenticatedUser.id`.
  - `appearsResolved`: Active tickets where `appearsResolved === true`.
  - `recentlyUpdated`: Active tickets where `updatedAt >= (now - 24 rolling hours)`.
  - `byStatus`: Complete normalized map containing all 8 lifecycle statuses (all values >= 0).
  - `byPriority`: Count of active tickets grouped by `itPriority` (`LOW`, `MEDIUM`, `HIGH`).
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
