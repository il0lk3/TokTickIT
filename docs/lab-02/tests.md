# Lab 2 Test Plan and Results

This document serves as the comprehensive testing matrix for Sprint 2. It tracks automated test execution across the API (Server), React Components (Client), and End-to-End flows.

## Test Commands
- **Server:** `cd server && npm run test`
- **Client:** `cd client && npm run test`
- **End-to-End (E2E):** `cd e2e && npm run test`
  *(Note: The E2E script automatically boots both the backend API and the Vite frontend via Playwright's `webServer` block. No manual server startup is required.)*

---

## 1. Test Strategy & Philosophy
- **Unit & Integration Tests (Server):** Focuses heavily on endpoint validation, business rule enforcement (e.g., ticket numbering constraints, unique identifiers, pagination limits), and relationship constraints.
- **Component Tests (Client):** Uses `React Testing Library` to verify rendering logic and state changes in isolation, with API calls mocked.
- **End-to-End Tests (E2E):** Playwright is used strictly to simulate the end-user's entire flow through the system across multiple pages to ensure state retention and to assert visual/responsive requirements.

---

## 2. Server API Tests (22/22 Passing)
The backend test suite verifies strict compliance with the API specifications and handles all edge cases gracefully.

### 2.1 Ticket Creation (`POST /api/tickets`)
| Test ID | Requirement / AC | What It Tests | Expected Result | File | Final |
|---|---|---|---|---|---|
| `API-CREATE-01` | **AC-01** | Create valid ticket with all fields | `201 Created` with unique `TKT-YYYY-XXXXXX` | `create-ticket.api.test.ts` | Pass |
| `API-CREATE-02` | **BR-01** | Missing `X-Requester-Id` header | `401 Unauthorized` | `create-ticket.api.test.ts` | Pass |
| `API-CREATE-03` | **BR-02** | Missing required fields (summary, etc) | `400 Bad Request` | `create-ticket.api.test.ts` | Pass |
| `API-CREATE-04` | **BR-02** | Invalid foreign keys (Fake Category) | `400 Bad Request` | `create-ticket.api.test.ts` | Pass |
| `API-CREATE-05` | **BR-02** | Summary exceeds 150 chars limit | `400 Bad Request` | `create-ticket.api.test.ts` | Pass |
| `API-CREATE-06` | **BR-03** | Duplicate submission within short timeframe | `400 Bad Request` | `create-ticket.api.test.ts` | Pass |

### 2.2 My Tickets List (`GET /api/tickets`)
| Test ID | Requirement / AC | What It Tests | Expected Result | File | Final |
|---|---|---|---|---|---|
| `API-LIST-01` | **AC-03** | Ticket Ownership Protection | Returns ONLY tickets owned by `X-Requester-Id` | `my-tickets.api.test.ts` | Pass |
| `API-LIST-02` | **AC-07** | Search filter by keyword | `200 OK` filtered by Summary match | `my-tickets.api.test.ts` | Pass |
| `API-LIST-03` | **FR-03** | Filter by Status | `200 OK` filtered by Status | `my-tickets.api.test.ts` | Pass |
| `API-LIST-04` | **FR-03** | Filter by CategoryId | `200 OK` filtered by Category | `my-tickets.api.test.ts` | Pass |
| `API-LIST-05` | **FR-03** | Filter by Priority | `200 OK` filtered by Priority | `my-tickets.api.test.ts` | Pass |
| `API-LIST-06` | **FR-03** | Sorting by Date/Priority/Status | `200 OK` correctly ordered list | `my-tickets.api.test.ts` | Pass |
| `API-LIST-07` | **FR-03** | Pagination handling | `200 OK` with correct `meta` counts and `data` | `my-tickets.api.test.ts` | Pass |

### 2.3 Ticket Detail & Attachments (`GET /api/tickets/:id`)
| Test ID | Requirement / AC | What It Tests | Expected Result | File | Final |
|---|---|---|---|---|---|
| `API-DETAIL-01` | **AC-03** | Access owned ticket detail | `200 OK` with full ticket payload | `ticket-detail.api.test.ts` | Pass |
| `API-DETAIL-02` | **AC-03** | Cross-requester access protection | `404 Not Found` (Does not leak 403 to prevent enumeration) | `ticket-detail.api.test.ts` | Pass |
| `API-ATTACH-01` | **AC-05** | Upload Attachment | `201 Created` stores blob | `ticket-detail.api.test.ts` | Pass |
| `API-ATTACH-02` | **AC-06** | Soft Remove Attachment | `200 OK` sets `isRemoved` flag | `ticket-detail.api.test.ts` | Pass |

---

## 3. Client UI Tests (12/12 Passing)
The frontend test suite focuses on component behavior, specifically mocking the API to isolate React rendering logic.

### 3.1 App Shell & Requester Context
| Test ID | Requirement | What It Tests | Expected Result | File | Final |
|---|---|---|---|---|---|
| `UI-CTX-01` | **AC-02** | Base Render | Renders context heading successfully | `App.test.tsx` | Pass |
| `UI-CTX-02` | **AC-02** | Context Fetching | Fetches requesters and populates form | `App.test.tsx` | Pass |
| `UI-CTX-03` | **AC-02** | Offline Error | Shows error if context fetch fails | `App.test.tsx` | Pass |

### 3.2 Create Ticket Form
| Test ID | Requirement | What It Tests | Expected Result | File | Final |
|---|---|---|---|---|---|
| `UI-CREATE-01` | **AC-04** | Base Rendering | Renders Create Ticket form successfully | `CreateTicket.test.tsx` | Pass |
| `UI-CREATE-02` | **AC-04** | Empty Submission | Shows validation errors on empty submit | `CreateTicket.test.tsx` | Pass |
| `UI-CREATE-03` | **AC-04** | Invalid Summary Length | Shows validation error for summary > 150 | `CreateTicket.test.tsx` | Pass |
| `UI-CREATE-04` | **AC-04** | Missing Dropdowns | Shows validation error for missing dropdowns | `CreateTicket.test.tsx` | Pass |

### 3.3 My Tickets Dashboard
| Test ID | Requirement | What It Tests | Expected Result | File | Final |
|---|---|---|---|---|---|
| `UI-LIST-01` | **FR-05** | View Loading State | Renders loading spinner initially | `MyTickets.test.tsx` | Pass |
| `UI-LIST-02` | **FR-01** | Render List | Displays fetched tickets correctly | `MyTickets.test.tsx` | Pass |
| `UI-LIST-03` | **FR-02** | Debounced Search Input | Typing triggers debounced search action | `MyTickets.test.tsx` | Pass |
| `UI-LIST-04` | **FR-03** | Sort Header Click | Changing sort field triggers correct fetch | `MyTickets.test.tsx` | Pass |

### 3.4 Ticket Detail View
| Test ID | Requirement | What It Tests | Expected Result | File | Final |
|---|---|---|---|---|---|
| `UI-DETAIL-01` | **FR-04** | Base Rendering | Renders ticket details successfully | `TicketDetail.test.tsx` | Pass |

---

## 4. End-to-End Tests (2/2 Passing)
Playwright tests verify the critical flows, UI adherence, and capture responsive screenshots.

| Test ID | Flow | Steps Covered | Final |
|---|---|---|---|
| `E2E-01` | Full Requester Flow | 1. Select Requester<br>2. Navigate to "Create Ticket"<br>3. Fill form and submit<br>4. Extract Ticket Number<br>5. Search for Ticket in list<br>6. Verify presence<br>7. Click ticket to view Details | Pass |
| `E2E-02` | Responsive & UI Checks | 1. Load context<br>2. Evaluate horizontal overflow on Mobile, Tablet, Desktop<br>3. Capture automated screenshots of My Tickets and Create form across viewports | Pass |

---

## 5. Acceptance-Criterion Traceability Matrix

Every Acceptance Criterion (AC) strictly ties back to at least one automated test.

| AC | Description | Covering Tests |
|---|---|---|
| **AC-01** | Successful creation generates Ticket Number | `API-CREATE-01`, `E2E-01` |
| **AC-02** | Requester Selection enforcement | `UI-CTX-01`, `UI-CTX-02`, `UI-CTX-03` |
| **AC-03** | Cross-Requester access protection | `API-LIST-01`, `API-DETAIL-02` |
| **AC-04** | Validation error presentation | `UI-CREATE-02`, `UI-CREATE-03`, `UI-CREATE-04` |
| **AC-05** | Attachment upload limits | `API-ATTACH-01` |
| **AC-06** | Soft removal metadata preservation | `API-ATTACH-02` |
| **AC-07** | My Tickets Search | `API-LIST-02`, `UI-LIST-03`, `E2E-01` |

## 6. Manual QA & Automated Visual Checklist
- [x] **No clipped labels on Mobile:** Stacked cards allow full width text reading.
- [x] **No overlapping validation messages:** Absolute positioning removed in favor of block margins.
- [x] **No horizontal scrolling on Mobile viewports:** Asserted dynamically in `E2E-02`.
- [x] **Zen Green Color Adherence:** Asserted dynamically in `E2E-02` and captured in screenshots.
