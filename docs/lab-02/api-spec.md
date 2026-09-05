# Lab 2 API Contract

TokTickIT REST API. Companion to [`specification.md`](./specification.md).

Base URL in development: `http://localhost:3000`

---

## 1. Requester context

Every endpoint below marked **scoped** requires this header:

```http
X-Requester-Id: 1
```

It is validated before any business logic executes. The value must parse as a positive integer, match an existing `RequesterUser`, and that user must be active.

| Situation | Status | Error Code |
| --- | --- | --- |
| Header absent | `401` | `REQUESTER_CONTEXT_REQUIRED` |
| Not a positive integer | `401` | `REQUESTER_CONTEXT_INVALID` |
| No such user / Inactive | `401` | `REQUESTER_CONTEXT_UNKNOWN` |

This header is forgeable by anyone. It is a test fixture, not a credential. Lab 3 replaces it with an authenticated identity.

---

## 2. Error envelope

Every failure returns this shape and nothing else.

```json
{
  "error": "The ticket could not be created.",
  "details": {
    "summary": "Summary must be at least 5 characters.",
    "categoryId": "Category ID is required."
  }
}
```

Responses never carry stack traces, database messages, filesystem paths, or configuration values.

### Status codes

| Code | Meaning here |
| --- | --- |
| `200` | Retrieval, download, soft removal |
| `201` | Ticket or attachment created |
| `400` | Invalid field, invalid query parameter, duplicate submission, limit reached |
| `401` | Invalid or missing requester context |
| `404` | Resource absent, owned by a different requester, or no route matches the path |
| `410` | Resource was soft-removed (used for Attachments) |
| `413` | Attachment file larger than 5 MB |
| `415` | File type not permitted (only JPG, PNG, WEBP, PDF allowed) |
| `500` | Unexpected internal failure |

---

## 3. Reference data

### `GET /api/categories`

Active categories in display order. Not scoped.

```json
[
  { "id": 1, "name": "Hardware" },
  { "id": 2, "name": "Software" },
  { "id": 3, "name": "Network" }
]
```

### `GET /api/systems`

Active related systems in display order. Not scoped.

```json
[
  { "id": 1, "name": "Corporate Laptop" },
  { "id": 2, "name": "Campus Wi-Fi" },
  { "id": 3, "name": "VPN" }
]
```

### `GET /api/requesters`

Active Development Requesters for the selector. Not scoped — it is what populates the context in the first place. Inactive users never appear.

```json
[
  { "id": 1, "name": "Cream Su", "email": "cream.su@example.com" },
  { "id": 2, "name": "Bew Su", "email": "bew.su@example.com" }
]
```

---

## 4. Tickets

### `POST /api/tickets` — scoped

Creates one ticket owned by the context. `201` on success.

**Request**

```json
{
  "categoryId": 1,
  "relatedSystemId": 2,
  "summary": "Laptop battery drains quickly",
  "description": "My laptop battery is draining much faster than usual even when idle.",
  "requestedPriority": "MEDIUM"
}
```

**Response `201`**

```json
{
  "id": 42,
  "ticketNumber": "TKT-2026-000042",
  "summary": "Laptop battery drains quickly",
  "description": "My laptop battery is draining much faster than usual even when idle.",
  "requestedPriority": "MEDIUM",
  "currentStatus": "New",
  "categoryId": 1,
  "relatedSystemId": 2,
  "requesterId": 1,
  "createdAt": "2026-08-19T09:14:22.481Z",
  "updatedAt": "2026-08-19T09:14:22.481Z"
}
```

**Validation**

| Field | Rule |
| --- | --- |
| `summary` | required, max 150 chars |
| `description` | required, max 1000 chars |
| `categoryId` | required, must exist in DB |
| `relatedSystemId` | required, must exist in DB |
| `requestedPriority` | required, enum (LOW, MEDIUM, HIGH) |

### `GET /api/tickets` — scoped

Retrieves a paginated list of tickets owned by the requester.

**Query Parameters**
- `page` (number, default: 1)
- `limit` (number, default: 10)
- `sortBy` (string, default: `createdAt`)
- `sortOrder` (enum `asc` or `desc`, default: `desc`)
- `search` (string, ILIKE match on `summary` or `ticketNumber`)
- `categoryId`, `status`, `requestedPriority` (string/number, exact match)

**Response `200`**

```json
{
  "data": [
    {
      "id": 42,
      "ticketNumber": "TKT-2026-000042",
      "summary": "Laptop battery drains quickly",
      "requestedPriority": "MEDIUM",
      "currentStatus": "New",
      "createdAt": "2026-08-19T09:14:22.481Z",
      "updatedAt": "2026-08-19T09:14:22.481Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

### `GET /api/tickets/:id` — scoped

Retrieves the full ticket entity graph. Returns `404 Not Found` if the ticket does not exist OR is owned by a different requester.

**Response `200`**

```json
{
  "id": 42,
  "ticketNumber": "TKT-2026-000042",
  "summary": "Laptop battery drains quickly",
  "description": "My laptop battery is draining much faster than usual even when idle.",
  "requestedPriority": "MEDIUM",
  "currentStatus": "New",
  "createdAt": "2026-08-19T09:14:22.481Z",
  "updatedAt": "2026-08-19T09:14:22.481Z",
  "category": { "id": 1, "name": "Hardware" },
  "relatedSystem": { "id": 2, "name": "Corporate Laptop" },
  "attachments": []
}
```

---

## 5. Attachments

### `POST /api/tickets/:id/attachments` — scoped

Uploads a binary file and binds it to the specified ticket. Fails with `404` if the ticket is not owned by the requester. Fails with `400` if the ticket already has 5 active attachments.

**Request**
- `Content-Type: multipart/form-data`
- Field name: `file`

**Validation**
- `413 Payload Too Large`: File exceeds 5MB (5,242,880 bytes).
- `415 Unsupported Media Type`: File is not `image/jpeg`, `image/png`, `image/webp`, or `application/pdf`.

**Response `201`**
```json
{
  "id": 12,
  "ticketId": 42,
  "originalName": "error_screenshot.png",
  "size": 1048576,
  "mimeType": "image/png",
  "createdAt": "2026-08-19T09:15:00.000Z"
}
```

### `GET /api/tickets/:id/attachments/:attachmentId/download` — scoped

Streams the binary file payload to the client.

- **Errors:** 
  - `404 Not Found` if the ticket or attachment does not exist, or ownership verification fails.
  - `410 Gone` if the attachment has `isRemoved: true`.

### `DELETE /api/tickets/:id/attachments/:attachmentId` — scoped

Executes a soft-delete on the attachment record.

**Request**
```json
{
  "reason": "Uploaded wrong screenshot"
}
```

**Response `200`**
```json
{
  "message": "Attachment removed successfully"
}
```
