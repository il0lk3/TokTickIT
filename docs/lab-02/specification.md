# Lab 2 Sprint Engineering Specification

## 1. Sprint Goal
The objective of this sprint is to deliver a functional Minimum Viable Product (MVP) for the Requester ticketing experience. This includes implementing a simulated context identity mechanism, a comprehensive workflow for submitting IT support tickets with file attachments, and a dashboard for requesters to track and inspect their submissions. This architecture serves as the foundation before cryptographic authentication and authorization layers are introduced in Lab 3.

## 2. Stakeholder Request Interpretation
The IT Service Management division requires a robust frontend interface and corresponding backend RESTful API for issue submission. Due to the absence of an integrated IAM (Identity and Access Management) system in the current phase, the application will simulate user identity via a strict "Development Requester Selection" interceptor. The system must enforce comprehensive data validation, support binary file uploads (capped at 5MB, restricted by MIME type), provide paginated and filterable ticket lists, and present immutable ticket records. The frontend architecture must rigidly adhere to the designated "Zen Green Theme" design system.

## 3. Scope Definition

### 3.1 Included
- **Context Management:** Development Requester selection mechanism to simulate persistent session state.
- **Ticket Ingestion:** "Create Ticket" workflow with synchronous client-side and asynchronous server-side payload validation.
- **Data Aggregation:** "My Tickets" workflow featuring cursor/offset pagination, debounce-optimized full-text search, multi-dimensional filtering, and dynamic column sorting.
- **Data Presentation:** "Requester Ticket Detail" read-only component mapping deeply nested JSON responses to presentation layers.
- **Binary Blob Management:** Attachment lifecycle including strict MIME-type validation, streaming disk I/O, soft-delete mechanisms, and metadata preservation.
- **Responsive Architecture:** Mobile-first structural compliance with viewport-specific layout transformations (Table to Stacked Cards).

### 3.2 Excluded
- Cryptographic authentication, session cookies, JWT generation, and RBAC (Role-Based Access Control).
- IT Staff operational dashboards, ticket assignment, and prioritization workflows.
- Bidirectional ticket collaboration (commenting, status transitions).
- System administration and reference data modification endpoints.

## 4. Functional Requirements (FR)

- **FR-01 (Requester Selection):** The application must intercept unauthenticated route access and redirect to a mandatory selection screen exposing active simulated identities.
- **FR-02 (Create Ticket):** An active session must allow the creation of a support ticket comprising Foreign Keys (Category, Related System), Enum types (Priority), and string payloads (Summary, Description).
- **FR-03 (My Tickets Aggregation):** The system must serve a paginated array of tickets owned strictly by the active identity, exposing sorting (ascending/descending) and filtering (priority, status, category) parameters.
- **FR-04 (Ticket Detail Rendering):** The application must fetch and render a read-only, deeply nested representation of a specific ticket and its associated entities.
- **FR-05 (Horizontal Privilege Escalation Protection):** The API must actively evaluate the ownership of requested resources against the `X-Requester-Id` header, returning HTTP 404 for non-owned entities to prevent IDOR (Insecure Direct Object Reference) and enumeration vectors.
- **FR-06 (Attachment Addition):** The system must accept `multipart/form-data` uploads, capping total active attachments at 5 per ticket. Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`. Size ceiling: 5,242,880 bytes (5MB) per blob.
- **FR-07 (Attachment Soft-Delete):** A soft-delete mechanism must flag the attachment record as removed (`isRemoved: true`), immediately terminating binary download capabilities (HTTP 410 Gone) while permanently freezing the metadata in the presentation layer.

## 5. Business Rules (BR)

- **BR-01 (Deterministic Ticket Enumeration):** The primary ticket identifier must follow a strict, auto-incrementing format: `TKT-YYYY-NNNNNN` (e.g., TKT-2026-000001). The generation mechanism must implement retry logic and handle database unique constraint collisions gracefully.
- **BR-02 (Default State Constraints):** A newly instantiated ticket record must be written to the database with the enum state `New`.
- **BR-03 (Identity Simulation Protocol):** The Development Requester context is injected via a custom HTTP header (`X-Requester-Id`) for API requests. This is a non-secure simulation protocol unique to Lab 2 constraints.
- **BR-04 (Payload Constraints):** Ticket Summary length must not exceed 150 characters. Ticket Description length must not exceed 1000 characters. Null or empty string values for required fields must yield an HTTP 400 response.
- **BR-05 (Idempotency and Concurrency):** Client-side mutation actions (form submission) must disable interactive elements immediately upon trigger to prevent network race conditions and duplicate record generation.

## 6. UI/UX and Architectural Constraints

- **Theme Compliance:** The implementation must map all visual elements to the "Zen Green Theme" (Primary: `#006B3C`, Secondary: `#0B7A46`).
- **Responsive Mutations:** The "My Tickets" view must utilize a structural mutation based on viewport width. Viewports `>= 768px` must render standard HTML `<table>` elements. Viewports `< 768px` must suppress the table and render individual data cards with 100% data parity.
- **Frameworks:** React 18, React DOM, Bootstrap 5 (CSS only), Vite. No client-side routers (`react-router-dom`) are permitted; state-based component rendering must be utilized.

## 7. Data Schema Architecture

The relational schema is enforced via Prisma ORM mapped to PostgreSQL:
- **RequesterUser:** Base simulated identity model.
- **Category / RelatedSystem:** Static reference dictionaries.
- **Ticket:** Primary aggregate root containing relational maps to Category, RelatedSystem, RequesterUser, and one-to-many relationship with Attachments.
- **Attachment:** Binary metadata index containing `originalName`, `mimeType`, `size`, and physical path pointers.

## 8. API Contract Definition

All endpoints operate under the `/api` namespace and require the `X-Requester-Id` header (excluding public reference routes).
- `GET /categories` - Fetches active ticket categories.
- `GET /systems` - Fetches active related systems.
- `GET /requesters` - Fetches active requester identities for simulation.
- `POST /tickets` - Accepts JSON payload to instantiate a ticket.
- `GET /tickets` - Accepts query parameters (`page`, `limit`, `search`, `sortBy`, `sortDir`, `categoryId`, `status`, `priority`).
- `GET /tickets/:id` - Fetches ticket entity graph.
- `POST /tickets/:id/attachments` - Accepts `multipart/form-data`.
- `GET /tickets/:id/attachments/:attachmentId/download` - Serves binary streams.
- `DELETE /tickets/:id/attachments/:attachmentId` - Executes soft-delete mutation.

## 9. Acceptance Criteria (AC)

- **AC-01:** Given valid payload parameters, when the POST request is executed, then the database commits the transaction and returns a unique `TKT-YYYY-NNNNNN` identifier.
- **AC-02:** Given a lack of identity context in the client state, when accessing the application, then the user is blocked by the Requester Selection interceptor.
- **AC-03:** Given active Requester ID `A`, when attempting to query or mutate a Ticket bound to Requester ID `B`, then the server intercepts the request and responds with HTTP 404.
- **AC-04:** Given empty required fields, when the client submits the form, then HTML5 and React state validations halt the submission, flag the fields, and prevent API invocation.
- **AC-05:** Given a Ticket already holding 5 attachments, when a 6th upload is attempted, then the API rejects the request (HTTP 400) and the UI renders a limit-reached alert.
- **AC-06:** Given a successful DELETE call to an attachment, when the attachment is subsequently requested for download, then the server returns HTTP 410 Gone.
- **AC-07:** Given a search string input, when the GET /tickets endpoint is called, then the server executes a partial `ILIKE` match against the Summary and Ticket Number fields.

## 10. Definition of Done (DoD)

1. Total fulfillment of all Acceptance Criteria (AC-01 through AC-07).
2. Automated test suite (Unit, API, Component, E2E) achieves 100% pass rate.
3. No console errors or unresolved Promise rejections during E2E simulation.
4. Strict enforcement of responsive layout mutations without horizontal overflow on mobile viewports (320px).
5. Code committed, reviewed via Pull Request, and successfully merged into the primary integration branch.
6. Documentation files (`ai-use.md`, `reviewer.md`, `tests.md`, `ui-spec.md`, `specification.md`) updated to accurately reflect the final technical state.
