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
  - `403 Forbidden`: Requester accessing another user's ticket actions.
  - `404 Not Found`: Ticket does not exist.

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
1. **Optimistic Concurrency Check**:
   - Compare `body.expectedVersion` with current `ticket.version`.
   - If `body.expectedVersion !== undefined && body.expectedVersion !== ticket.version`:
     - Return **`409 Conflict`**:
       ```json
       {
         "error": "This ticket has been modified by another user. Please reload the latest changes.",
         "code": "STALE_VERSION_CONFLICT",
         "currentVersion": 3,
         "currentStatus": "InProgress"
       }
       ```
2. **Assignee / Owner Eligibility**:
   - If `ownerId` is provided:
     - Target user must exist, have role `IT_STAFF`, and `isActive === true`.
     - If inactive or invalid: Return **`400 Bad Request`** (`INACTIVE_ASSIGNEE_REJECTED`).
3. **Status Transition Matrix Validation**:
   - Verify `ticket.currentStatus -> body.status` is permitted by the status matrix.
   - If not permitted: Return **`400 Bad Request`** (`INVALID_STATUS_TRANSITION`).
4. **Resolution Gate Enforcement**:
   - When transitioning to `Resolved`:
     - Target ticket must have an assigned Owner (`(ownerId || ticket.ownerId) !== null`).
     - Target ticket must have at least **1** `ActionTaken` entry with non-empty `result`.
     - If either condition fails: Return **`400 Bad Request`**:
       ```json
       {
         "error": "Resolution gate failed: Ticket must have an assigned owner and at least one completed Action Taken with a result.",
         "code": "RESOLUTION_GATE_FAILED"
       }
       ```
5. **Atomic Commit & Version Increment**:
   - On success, `version` is incremented by 1 (`version: { increment: 1 }`).

- **Success Response (200 OK)**:
  ```json
  {
    "id": 14,
    "ticketNumber": "TKT-2026-000014",
    "currentStatus": "Resolved",
    "ownerId": 2,
    "itPriority": "HIGH",
    "version": 3,
    "updatedAt": "2026-10-17T10:00:00.000Z"
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

## 4. Operational Dashboard APIs

### 4.1 Requester Dashboard
Provides summary statistics and recent ticket history strictly for the authenticated Requester.

- **Method / Path**: `GET /api/dashboard/requester`
- **Access**: `REQUESTER` only (Staff/Admin calling this receives `403 Forbidden`).
- **Success Response (200 OK)**:
  ```json
  {
    "metrics": {
      "openTickets": 3,
      "inProgress": 2,
      "waitingForRequester": 1,
      "recentlyResolved": 5,
      "closed": 12
    },
    "drillDown": {
      "openTickets": "/tickets?status=New,Open,Reopened",
      "inProgress": "/tickets?status=InProgress",
      "waitingForRequester": "/tickets?status=WaitingForRequester",
      "recentlyResolved": "/tickets?status=Resolved",
      "closed": "/tickets?status=Closed"
    },
    "recentTickets": [
      {
        "id": 24,
        "ticketNumber": "TKT-2026-000024",
        "summary": "Laptop battery drains quickly",
        "currentStatus": "InProgress",
        "updatedAt": "2026-10-17T09:14:00.000Z",
        "category": { "name": "Hardware" }
      }
    ]
  }
  ```
- **Metric Definitions**:
  - `openTickets`: Tickets owned by Requester where status $\in$ `['New', 'Open', 'Reopened']`.
  - `inProgress`: Tickets owned by Requester where status = `'InProgress'`.
  - `waitingForRequester`: Tickets owned by Requester where status = `'WaitingForRequester'` (requires requester attention).
  - `recentlyResolved`: Tickets owned by Requester where status = `'Resolved'` and `updatedAt >= (now - 7 days)`.
  - `closed`: Tickets owned by Requester where status = `'Closed'`.
  - `recentTickets`: Top 5 tickets owned by Requester ordered by `updatedAt DESC`.

---

### 4.2 IT Staff & Administrator Dashboard
Provides system-wide operational metrics, queue counts, and drill-down links.

- **Method / Path**: `GET /api/dashboard/staff`
- **Access**: `IT_STAFF`, `ADMINISTRATOR` (Requesters return `403 Forbidden`).
- **Success Response (200 OK)**:
  ```json
  {
    "metrics": {
      "unassigned": 8,
      "ownedByMe": 16,
      "newTickets": 14,
      "openTickets": 23,
      "inProgress": 18,
      "waitingForRequester": 7,
      "recentlyUpdated": 12,
      "byPriority": {
        "LOW": 15,
        "MEDIUM": 25,
        "HIGH": 8
      },
      "adminUserCounts": {
        "total": 35,
        "active": 33,
        "requesters": 25,
        "staff": 7,
        "admins": 3
      }
    },
    "drillDown": {
      "unassigned": "/queue?ownerId=unassigned",
      "ownedByMe": "/queue?ownerId=me",
      "newTickets": "/queue?status=New",
      "openTickets": "/queue?status=Open",
      "inProgress": "/queue?status=InProgress",
      "waitingForRequester": "/queue?status=WaitingForRequester"
    },
    "recentTickets": [
      {
        "id": 34,
        "ticketNumber": "TKT-2026-000034",
        "summary": "Core router rebooted unexpectedly",
        "currentStatus": "InProgress",
        "itPriority": "HIGH",
        "owner": {
          "id": 2,
          "name": "Michael Staff"
        },
        "updatedAt": "2026-10-17T09:14:00.000Z"
      }
    ]
  }
  ```
- **Metric Definitions**:
  - `unassigned`: Active tickets (`currentStatus` not in `['Closed', 'Cancelled']`) where `ownerId === null`.
  - `ownedByMe`: Active tickets where `ownerId === authenticatedUser.id`.
  - `newTickets`: Tickets with `currentStatus = 'New'`.
  - `openTickets`: Tickets with `currentStatus = 'Open'`.
  - `inProgress`: Tickets with `currentStatus = 'InProgress'`.
  - `waitingForRequester`: Tickets with `currentStatus = 'WaitingForRequester'`.
  - `recentlyUpdated`: Active tickets where `updatedAt >= (now - 24 hours)`.
  - `byPriority`: Count of active tickets grouped by `itPriority`.
  - `adminUserCounts`: Returned if authenticated user is `ADMINISTRATOR`, otherwise `null`.
  - `recentTickets`: Top 5 active tickets in system ordered by `updatedAt DESC`.

---

## 5. Date & Timezone Conventions
- Timestamps sent and received over REST are in **ISO 8601** UTC string format (e.g. `2026-10-17T09:30:00.000Z`).
- Date boundary aggregations (e.g., "within last 7 days", "past 24 hours") use the server timezone `Asia/Bangkok` (UTC+7) reference.
