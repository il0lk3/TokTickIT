# Lab 2 Test Plan and Results

## 1. Test Strategy
We will employ Test-Driven Development (TDD) for critical business logic and API endpoints, and Spec-Driven Development (Spec DD) for the UI components.
- **Unit Tests:** Utilities, Ticket Number generation format.
- **API Tests:** Endpoint validation, ownership protection, file upload constraints.
- **UI Tests:** Component rendering, form state (busy, error, success), accessible labels.
- **E2E Tests:** Complete user flows using Playwright.

## 2. Planned Tests

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final |
|---|---|---|---|---|---|---|
| API-01 | API | AC-01 | Create valid ticket | 201; one saved Ticket; number returned | `server/tests/lab-02/create-ticket.api.test.ts` | Pending |
| API-02 | API | AC-03 | Retrieve another user's ticket | 404 Not Found; Ticket data not returned | `server/tests/lab-02/ticket-detail.api.test.ts` | Pending |
| API-03 | API | AC-05 | Upload 6th attachment | 400 Bad Request; upload rejected | `server/tests/lab-02/attachments.api.test.ts` | Pending |
| API-04 | API | AC-06 | Soft remove attachment | 410 Gone on subsequent download | `server/tests/lab-02/attachments.api.test.ts` | Pending |
| API-05 | API | BR-04 | Upload invalid file type (.exe) | 400 Bad Request; file rejected | `server/tests/lab-02/attachments.api.test.ts` | Pending |
| API-06 | API | BR-04 | Upload file > 5MB | 400 Bad Request; size limit error | `server/tests/lab-02/attachments.api.test.ts` | Pending |
| API-07 | API | FR-03 | Pagination and Filtering | 200 OK; correct items and meta pagination | `server/tests/lab-02/my-tickets.api.test.ts` | Pending |
| UI-01 | UI | AC-02 | Unauthenticated access | Redirects or shows Requester Selection | `client/src/tests/lab-02/MyTickets.test.tsx` | Pending |
| UI-02 | UI | AC-04 | Submit without Summary | Field-level error message; API not called | `client/src/tests/lab-02/CreateTicket.test.tsx` | Pending |
| UI-03 | UI | FR-06 | Attachment busy state | Upload button disabled during upload | `client/src/tests/lab-02/AttachmentSection.test.tsx` | Pending |
| E2E-01 | E2E | AC-01, AC-07 | Complete submission flow & Search | Success UI, ticket appears in search | `e2e/lab-02/requester-ticket-flow.spec.ts` | Pending |

## 3. Acceptance-Criterion Traceability

| AC | Description | Covering Tests |
|---|---|---|
| AC-01 | Successful creation generates Ticket Number | API-01, E2E-01 |
| AC-02 | Requester Selection enforcement | UI-01 |
| AC-03 | Cross-Requester access protection | API-02 |
| AC-04 | Validation error presentation | UI-02 |
| AC-05 | Attachment upload limits | API-03, API-05, API-06 |
| AC-06 | Soft removal metadata preservation | API-04 |
| AC-07 | My Tickets Search | E2E-01, API-07 |

## 4. Responsive and Visual Checklist
- [ ] No clipped labels on Mobile.
- [ ] No overlapping validation messages.
- [ ] No horizontal scrolling on Mobile viewports.
- [ ] "Zen Green" color palette strictly followed.

## 5. Test Commands
- **Backend API/Unit:** `npm run test` (in `/server`)
- **Frontend UI:** `npm run test` (in `/client`)
- **E2E:** `npx playwright test` (in `/e2e` - note: `mkdir e2e` may be required before setup)

## 6. Final Results
*(To be updated after implementation)*

## 7. Known Limitations or Deferred Tests
- Visual regression testing (e.g., Percy) is deferred; relying on manual responsive checks and Playwright for now.
