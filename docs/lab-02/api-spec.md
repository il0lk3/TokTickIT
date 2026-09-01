# Lab 2 REST API Contract

## 1. Reference Data Endpoints

### 1.1. Get Categories
- **Endpoint:** `GET /api/categories`
- **Response (200 OK):** `[{ "id": 1, "name": "Hardware" }, ...]`

### 1.2. Get Related Systems
- **Endpoint:** `GET /api/systems`
- **Response (200 OK):** `[{ "id": 1, "name": "Corporate Laptop" }, ...]`

### 1.3. Get Development Requesters
- **Endpoint:** `GET /api/requesters`
- **Response (200 OK):** `[{ "id": 1, "name": "Jennifer Anderson", "email": "jennifer@example.com", "isActive": true }, ...]`

## 2. Ticket Endpoints

### 2.1. Create Ticket
- **Endpoint:** `POST /api/tickets`
- **Headers:** `X-Requester-Id: <id>` (Simulates authenticated user)
- **Request Body:**
```json
{
  "categoryId": 1,
  "relatedSystemId": 2,
  "requestedPriority": "MEDIUM",
  "summary": "Laptop battery drains quickly",
  "description": "My laptop battery is draining much faster than usual..."
}
```
- **Response (201 Created):**
```json
{
  "id": 1,
  "ticketNumber": "TKT-2025-001234",
  "categoryId": 1,
  "relatedSystemId": 2,
  "summary": "Laptop battery drains quickly",
  "description": "My laptop battery is draining much faster than usual...",
  "currentStatus": "New",
  "createdAt": "..."
}
```
- **Errors:** 
  - `400 Bad Request` (Validation failed).
  - `401 Unauthorized` (`{ "error": "Requester not found or missing X-Requester-Id header" }`).

### 2.2. Get My Tickets (List)
- **Endpoint:** `GET /api/tickets`
- **Headers:** `X-Requester-Id: <id>`
- **Query Parameters:**
  - `search` (string, optional): Searches in ticketNumber and summary.
  - `categoryId` (number, optional): Filters by category.
  - `requestedPriority` (string, optional): Filters by priority.
  - `status` (string, optional): Filters by status.
  - `page` (number, default: 1).
  - `limit` (number, default: 10).
  - `sortBy` (string, default: `createdAt`), `sortOrder` (asc/desc, default: `desc`).
- **Response (200 OK):**
```json
{
  "data": [ { "id": 1, "ticketNumber": "TKT-2025-001234", "summary": "...", "currentStatus": "New" } ],
  "meta": { "total": 42, "page": 1, "limit": 10, "totalPages": 5 }
}
```

### 2.3. Get Ticket Detail
- **Endpoint:** `GET /api/tickets/:id`
- **Headers:** `X-Requester-Id: <id>`
- **Response (200 OK):** Ticket details including nested `category`, `relatedSystem`, and `attachments`.
- **Errors:** `404 Not Found` (if ticket does not exist OR does not belong to the Requester).

## 3. Attachment Endpoints

### 3.1. Upload Attachment
- **Endpoint:** `POST /api/tickets/:id/attachments`
- **Headers:** `X-Requester-Id: <id>`
- **Content-Type:** `multipart/form-data`
- **Body:** `file` (File object).
- **Response (201 Created):** Attachment metadata object (`id`, `originalName`, `size`, `createdAt`).
- **Errors:** `400 Bad Request` (Invalid file type, size > 5MB, or max 5 limit reached), `404 Not Found` (Ownership check failed).

### 3.2. Download Attachment
- **Endpoint:** `GET /api/tickets/:id/attachments/:attachmentId/download`
- **Headers:** `X-Requester-Id: <id>`
- **Response (200 OK):** File stream with appropriate MIME type.
- **Errors:** `404 Not Found` (Ownership failed), `410 Gone` (File was soft-removed).

### 3.3. Soft-Remove Attachment
- **Endpoint:** `DELETE /api/tickets/:id/attachments/:attachmentId`
- **Headers:** `X-Requester-Id: <id>`
- **Body:** `{ "reason": "Uploaded wrong file" }` (Optional).
- **Response (200 OK):** Success confirmation.
- **Errors:** `404 Not Found` (Ownership failed).
