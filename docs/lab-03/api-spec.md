# Sprint 3 API Specification

This document details the REST API contract for Lab 3, covering Authentication, Requester operations, IT Staff operations, and Administrator User Management.

## 1. Authentication & Session

**Note on Security**: All authenticated endpoints expect a valid JWT passed via an `HttpOnly` cookie (e.g., `accessToken`). The backend must validate this token and extract the user's identity and role.

**Global Safe Error Conventions**:
- `401 Unauthorized`: Missing or invalid session token.
- `403 Forbidden`: Authenticated, but lacks required role or ownership.
- `404 Not Found`: Resource does not exist (or is hidden due to ownership).
- `400 Bad Request`: Invalid input or query parameters.
- `409 Conflict`: Resource conflict (e.g., duplicate email).

### 1.1. Login
- **Endpoint**: `POST /api/auth/login`
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "mySecurePassword"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "id": 1,
    "name": "Jane Doe",
    "email": "user@example.com",
    "role": "Requester",
    "requiresPasswordChange": false
  }
  ```
  *(Sets `HttpOnly` cookie with JWT)*
- **Response (401 Unauthorized)**: Invalid credentials or inactive account.

### 1.2. Logout
- **Endpoint**: `POST /api/auth/logout`
- **Response (200 OK)**:
  *(Clears `HttpOnly` cookie)*

### 1.3. Get Current User
- **Endpoint**: `GET /api/auth/me`
- **Response (200 OK)**: Same as Login success body.
- **Response (401 Unauthorized)**: If not logged in.

### 1.4. Change Initial Password
- **Endpoint**: `POST /api/auth/change-password`
- **Request Body**:
  ```json
  {
    "currentPassword": "oldPassword123",
    "newPassword": "newSecurePassword456"
  }
  ```
- **Response (200 OK)**: `{ "success": true }`
- **Response (401 Unauthorized)**: If current password is wrong.

---

## 2. Tickets & Attachments (Requester & Staff)

### 2.0. Lab 2 API Continuation
All Requester operations from Lab 2 must continue to work securely using the authenticated user identity (deriving `requesterId` from the session token, not client payload). Attempting to access another Requester's data must return 403 Forbidden or 404 Not Found.
- `POST /api/tickets`: Create a ticket.
- `POST /api/attachments`: Upload an attachment (restricted by ownership).
- `DELETE /api/attachments/:id`: Remove an attachment (restricted by ownership).
- `GET /api/categories` & `GET /api/related-systems`: Reference data retrieval.

### 2.1. List Tickets (Requester)
- **Endpoint**: `GET /api/tickets`
- **Authorization**: `Requester` (Backend automatically filters by authenticated user ID).
- **Response**: List of tickets owned by the user.

### 2.2. Get Ticket Detail
- **Endpoint**: `GET /api/tickets/:id`
- **Authorization**: `Requester` (Must own the ticket) or `IT Staff`.
- **Response (200 OK)**:
  ```json
  {
    "id": 1,
    "ticketNumber": "TKT-2026-00001",
    "summary": "Laptop issue",
    "status": "Open",
    "requestedPriority": "High",
    "itPriority": "High",
    "requester": { "id": 1, "name": "Jane Doe" },
    "owner": null,
    "comments": [...],
    "internalNotes": [...] // Only included if requester role is IT Staff
  }
  ```

### 2.3. Update Ticket Operational Fields (IT Staff)
- **Endpoint**: `PATCH /api/staff/tickets/:id`
- **Authorization**: `IT Staff`.
- **Request Body** (All fields optional):
  ```json
  {
    "ownerId": 3,
    "itPriority": "Medium",
    "status": "In Progress"
  }
  ```

---

## 3. Comments and Notes

### 3.1. Post Public Comment
- **Endpoint**: `POST /api/tickets/:id/comments`
- **Authorization**: `Requester` (Must own ticket) or `IT Staff`.
- **Request Body**:
  ```json
  {
    "content": "I have restarted the computer, still not working."
  }
  ```

### 3.2. Post Internal Note
- **Endpoint**: `POST /api/tickets/:id/notes`
- **Authorization**: `IT Staff`.
- **Request Body**:
  ```json
  {
    "content": "Suspect motherboard issue. Ordering replacement."
  }
  ```

---

## 4. IT Staff Ticket Queue

### 4.1. Get Queue
- **Endpoint**: `GET /api/staff/tickets`
- **Authorization**: `IT Staff`.
- **Query Parameters**:
  - `search` (string): Matches ticketNumber or summary.
  - `status` (string): Filter by status (e.g., 'Open').
  - `ownerId` (number): Filter by assignee ID, or 'unassigned'.
  - `page` (number): For pagination (default 1).
  - `limit` (number): For pagination (default 10).
  - `sortBy` (string): Field to sort by (e.g., `lastUpdated`).
  - `sortOrder` (string): `asc` or `desc` (default `desc`).
- **Default Ordering**: By `createdAt` descending if no sort params are provided.
- **Response (200 OK)**:
  ```json
  {
    "data": [...],
    "meta": {
      "total": 50,
      "page": 1,
      "limit": 10,
      "totalPages": 5
    }
  }
  ```

---

## 5. Administrator User Management

### 5.1. List Users
- **Endpoint**: `GET /api/admin/users`
- **Authorization**: `Admin`.
- **Query Parameters**:
  - `search` (string): Matches name or email.
  - `role` (string): Filter by role.
- **Response (200 OK)**: Array of User objects (excluding passwords).

### 5.2. Create User
- **Endpoint**: `POST /api/admin/users`
- **Authorization**: `Admin`.
- **Request Body**:
  ```json
  {
    "name": "New User",
    "email": "newuser@example.com",
    "role": "IT Staff",
    "initialPassword": "TempPassword1!",
    "isActive": true
  }
  ```

### 5.3. Update User
- **Endpoint**: `PUT /api/admin/users/:id`
- **Authorization**: `Admin`.
- **Request Body**:
  ```json
  {
    "name": "Updated Name",
    "email": "updated@example.com",
    "role": "IT Staff",
    "isActive": false,
    "resetInitialPassword": "NewTempPassword2!" // Optional
  }
  ```
- **Note**: Backend must prevent an Admin from setting their own `isActive` to false.
