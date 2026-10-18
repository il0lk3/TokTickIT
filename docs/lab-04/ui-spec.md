# Sprint 4 UI Specification: Zen Green Dashboards & Actions Taken

This document defines the complete UI/UX specifications for Lab 4 of TokTickIT, including layouts, responsive breakpoints, component modes, feedback states, accessibility requirements, and Zen Green design tokens.

---

## 1. Zen Green Design System Tokens

Lab 4 preserves and polishes the established **Zen Green** visual identity:

### 1.1 Color Palette
- **Primary Brand Green**: `#1b4332` (Deep Forest) / `#2d6a4f` (Forest Green - Primary actions)
- **Secondary Green / Hover**: `#40916c` / `#52b788` (Light Sage)
- **Background Tints**: `#f4f9f5` (Page background) / `#e8f5e9` (Card/Badge tint) / `#ffffff` (Card surface)
- **Borders & Dividers**: `#d8f3dc` / `#ced4da`
- **Text**: `#1a202c` (High contrast primary) / `#4a5568` (Muted secondary)
- **Status & Feedback Colors**:
  - `New`: Blue (`#0284c7`, bg `#e0f2fe`)
  - `Open`: Purple (`#7c3aed`, bg `#ede9fe`)
  - `In Progress`: Amber/Orange (`#d97706`, bg `#fef3c7`)
  - `Waiting for Requester`: Indigo/Cyan (`#0891b2`, bg `#cffafe`)
  - `Resolved`: Emerald Green (`#059669`, bg `#d1fae5`)
  - `Closed`: Gray (`#4b5563`, bg `#f3f4f6`)
  - `Reopened`: Crimson (`#dc2626`, bg `#fee2e2`)
  - `Cancelled`: Slate/Dark Gray (`#64748b`, bg `#e2e8f0`)

### 1.2 Non-Color Cues & Accessibility Invariants
- Status badges must **always** include both a distinct text label and an accompanying SVG icon (e.g., checkmark for Resolved, clock for In Progress, alert triangle for Waiting for Requester).
- Focus rings: All interactive elements feature a visible high-contrast focus ring: `outline: 2px solid #2d6a4f; outline-offset: 2px`.
- Minimum tap target size on mobile: `44px x 44px`.

---

## 2. App Shell & Global Navigation

### 2.1 Navigation Bar Updates
- **Brand**: TokTickIT logo links to the user's home (`/dashboard`).
- **Skip Navigation Link**: Hidden until focused (`.visually-hidden-focusable`) skip link pointing directly to `#main-content` for keyboard accessibility.
- **Navigation Links**:
  - **Requester**:
    - `Dashboard` (`/dashboard`)
    - `My Tickets` (`/tickets`)
    - `Create Ticket` (`/tickets/new`)
  - **IT Staff**:
    - `Dashboard` (`/dashboard`)
    - `Ticket Queue` (`/queue`)
  - **Administrator**:
    - `Dashboard` (`/dashboard`)
    - `Ticket Queue` (`/queue`)
    - `User Management` (`/admin/users`)
- **Active Page Indicator & Accessibility**:
  - Semantic `<Link>` elements with `NavItemLink` helper.
  - Active navigation item exposes `aria-current="page"` (using exact pathname matching for dashboard/lists, and highlighting parent `/queue` or `/tickets` when viewing ticket detail `/tickets/:id`).
  - Mobile navbar toggler provides accessible attributes (`aria-controls="main-navbar"`, `aria-expanded`), and automatically closes the collapsed menu when any navigation link is clicked.
- **Dynamic Document Title**:
  - Automatically synchronizes `document.title` on every route transition (e.g. `TokTickIT — Ticket Queue`, `TokTickIT — Ticket #1`).
- **Profile Controls**:
  - Shows authenticated user's name and role badge (e.g., `Michael Staff (IT Staff)`).
  - Contains **Sign Out** button with keyboard accessible triggers.

### 2.2 Client Route Map & Route Guards

| Path | Allowed Roles | Component | Guard / Redirect Rule |
|---|---|---|---|
| `/login` | Public (Unauthenticated) | `Login` | Redirects to `from` location or `/dashboard` if already authenticated |
| `/change-password` | Authenticated (`requiresPasswordChange: true`) | `ChangePassword` | All protected routes quarantine here until initial password is changed |
| `/` | Authenticated | Redirect | Redirects to role landing route (`/dashboard`) |
| `/dashboard` | Requester, Staff, Admin | `DashboardShell` / Role Dashboards | Role-aware dashboard landing frame with drill-down links |
| `/tickets` | Requester | `MyTicketsRoute` | URL searchParams sync: `?status=...&categoryId=...&requestedPriority=...` |
| `/tickets/new` | Requester | `CreateTicketRoute` | Strict requester boundary (enforces Lab 3 API contract); Staff/Admin get in-place 403 |
| `/tickets/:ticketId` | Requester (own), Staff, Admin | `TicketDetailRoute` | Validates numeric ID (404 if invalid); deep-linkable; in-app Back button falls back to parent list |
| `/queue` | Staff, Admin | `TicketQueueRoute` | URL searchParams sync: `?status=...&ownerId=...&itPriority=...&requestedPriority=...` |
| `/admin/users` | Administrator | `UserManagement` | Admin user CRUD management; Staff/Requester get in-place 403 |
| `*` | All | `NotFound` | Zen Green 404 page with "Back to Dashboard" button |

- **Route Guard Behaviors**:
  - **Session Loading Resilience**: While `isLoading` is true, renders an accessible centered spinner, avoiding premature redirects.
  - **Authentication Boundary (`ProtectedRoute`)**: Unauthenticated access to protected routes redirects to `/login`, preserving `{ from: location }` in state. After successful login, the user is redirected back to their intended deep link.
  - **Temporary Password Quarantine**: Users with `requiresPasswordChange: true` are restricted to `/change-password` across all protected routes.
  - **In-Place Authorization Guard (`RoleRoute`)**: Accessing unauthorized routes (e.g., Requester hitting `/queue` or `/admin/users`, or Staff hitting `/tickets/new`) renders an in-place Zen Green 403 Forbidden screen preserving top navigation shell and application state.
  - **Numeric ID & Fallback Navigation**: Direct access to `/tickets/:ticketId` parses and validates numeric ID; non-numeric IDs immediately render 404 Not Found. Clicking Back navigates `-1` in history, or falls back to `/queue` (Staff/Admin) or `/tickets` (Requester) if opened directly in a new tab.
  - **URL Search Parameter Single Source of Truth**: `/queue` and `/tickets` read filters directly from `window.location.search`, sanitize all values against allowed enums, and push query updates on every filter change. Browser Back/Forward restores previous filter criteria seamlessly.

---

## 3. IT Staff Dashboard Screen (`/dashboard`)

*Based on Lab 4 Mockup Handout page 5.*

### 3.1 Layout Structure
- **Header**:
  - Greeting: `"Welcome back, {User Name}!"` with subtitle `"Here's what's happening with your queue today."`
  - Action: **Refresh** button with sync icon (spins while fetching data).
- **Metric Cards Grid (Top)**:
  - 5 cards displayed side-by-side on desktop (reflows to 2 columns on tablet, 1 column on mobile):
    1. **New**: Total unhandled new tickets.
    2. **Open**: Accepted tickets awaiting work.
    3. **In Progress**: Currently active investigation tickets.
    4. **Waiting for Requester**: Tickets blocked awaiting user reply.
    5. **My Assigned**: Tickets assigned to the logged-in staff member.
  - Card Design: Large bold count numeral (36px), clear semantic label, subtle "+X from yesterday" indicator, and clickable drill-down linking directly to `/queue?status={Status}`.
- **Main Section (Split 2:1 on Desktop)**:
  - **Left (67% width) — "My Recent Tickets"**:
    - Table/list of the 5 most recently active tickets.
    - Columns: Ticket Number (monospace link), Summary, Status Badge, Formatted Timestamp (e.g. "May 12, 09:14 AM").
    - Header includes a `"View all"` link navigating to `/queue`.
  - **Right (33% width) — "Quick Actions"**:
    - Card container containing 3 prominent shortcut buttons:
      - `+ Create Ticket`: Opens ticket creation modal/page.
      - `🔍 Search Tickets`: Opens ticket queue with focus on search input.
      - `📋 My Queue`: Navigates to `/queue?ownerId=me`.

### 3.2 UI States
- **Loading State**: Metric cards render pulsing skeleton blocks; recent tickets table shows 5 skeleton rows.
- **Empty State**: Metric values display `0`; recent tickets displays an illustrative Zen Green placeholder: *"No active tickets found in your queue. Great job!"*
- **Safe Failure State**: Non-blocking alert banner with message *"Unable to refresh dashboard metrics"* and a `"Retry"` button.
- **Forbidden State**: Non-staff users navigating here are redirected or shown a clear 403 Forbidden screen.

---

## 4. Requester Dashboard Screen (`/dashboard`)

*Based on Lab 4 Mockup Handout page 6.*

### 4.1 Layout Structure
- **Header**:
  - Greeting: `"Welcome, {User Name}!"` with subtitle `"Here's the latest on your requests."`
- **Metric Cards Grid (Top)**:
  - 4 cards displayed horizontally:
    1. **My Open Tickets**: Total unresolved tickets submitted by user (`New`, `Open`, `Reopened`).
    2. **In Progress**: Work actively being conducted by IT Staff.
    3. **Resolved**: Issues solved awaiting closure or confirmation.
    4. **Closed**: Historical completed tickets.
  - Card Design: Clean card with count numeral, label, and `"View all"` drill-down button linking to `/tickets?status={Status}`.
- **Main Section (Split 2:1 on Desktop)**:
  - **Left (67% width) — "My Recent Tickets"**:
    - List of recently updated tickets owned by this Requester.
    - Displays Ticket Number, Summary, Status Badge, and Updated Time.
    - Link to view full ticket details.
  - **Right (33% width) — "Quick Actions"**:
    - `+ Create Ticket`: Primary button (`#2d6a4f`) to submit a new IT service request.
    - `📋 View My Tickets`: Secondary button to navigate to the full tickets table (`/tickets`).

### 4.2 UI States
- **Loading State**: Shimmer skeleton blocks for cards and ticket rows.
- **Empty State**: For a requester with 0 tickets: Displays welcoming banner *"You have no active requests. If you need assistance, submit a ticket below."*
- **Safe Failure State**: Informative error message with retry trigger.

---

## 5. Actions Taken on Ticket Detail

*Positioned on Ticket Detail (`/tickets/:ticketId`).*

### 5.1 Placement & Visual Hierarchy
- Placed immediately below the Ticket Details card and above the Public Comments / Internal Notes tabbed container.
- Container title: `🛠️ Actions Taken ({count})` with a badge showing total actions logged.

### 5.2 Actions Taken Table / List
- **Desktop (≥ 768px)**: Clean responsive data table.
  - **Columns**:
    1. `Date / Time`: Formatted as `YYYY-MM-DD HH:mm`.
    2. `Description`: Primary technical activity performed.
    3. `Result`: Concrete diagnostic or resolution outcome.
    4. `Performed By`: Badge with staff member's name.
    5. `Follow-Up`: Distinct badge:
       - If `true`: Amber badge with ⚠️ icon and `"Yes"` label.
       - If `false`: Muted gray badge `"No"`.
    6. `Follow-up Note`: Text note explaining required next steps.
    7. `Attachment Notes`: Text noting filenames to reference.
    8. `Actions` (Staff/Admin only): "Edit" button.
- **Mobile (< 768px)**: Stacked card view where each Action Taken is rendered as an isolated card with labeled key-value rows.
- **Empty State**: When 0 actions exist:
  - Staff: Muted placeholder box: *"No actions recorded yet. Log the first action using the button below."*
  - Requester: *"IT Staff has not logged any physical actions yet."*

### 5.3 Create Action Mode (Staff & Admin)
- Triggered via `"+ Log Action Taken"` button.
- Form fields:
  - `Action Date/Time`: Auto-filled with current timestamp, editable via datetime-local input.
  - `Description`: Textarea with character counter (`0 / 1000`). Required.
  - `Result`: Textarea with character counter (`0 / 1000`). Required.
  - `Performed By`: Read-only field displaying the authenticated staff member's name.
  - `Follow-Up Required`: Accessible checkbox.
  - `Follow-up Note`: **Conditionally revealed**. When "Follow-Up Required" is checked, smoothly expands with `aria-expanded="true"`. Required field when visible; displays red border and inline message *"Follow-up note is required when follow-up is requested"* if submitted empty.
  - `Attachment Notes`: Optional textarea (`0 / 500`) with placeholder `"e.g., Look for diagnostic-log.png in attachments"`.
- Submission Behavior:
  - Submit button shows loading spinner and is disabled while in-flight to prevent duplicate posts.
  - If server returns an error, form fields remain intact (entered data is **never** lost).

### 5.4 Edit Action Mode (Staff & Admin)
- Clicking "Edit" on an action row replaces text cells with inline form controls (or opens an edit modal).
- Allows editing Description, Result, Follow-Up flags/notes, and Attachment Notes.
- Save and Cancel buttons. Cancel reverts values without API calls.

### 5.5 Requester View
- Requesters see the complete list of Actions Taken with all details (Description, Result, Performed By, Notes).
- The `"+ Log Action Taken"` button and `"Edit"` actions are completely hidden.

---

## 6. Ticket Workflow Controls & Feedback

### 6.1 Status Transition Controls (IT Staff Detail)
- Action Bar at top-right of Ticket Detail.
- Dropdown or button group displaying **only** valid next transitions based on the current status and transition matrix.
- **Resolution Gate Feedback**:
  - If Ticket has no owner OR 0 Actions Taken with results:
    - The "Resolve" button is disabled or accompanied by an inline alert:
      `ℹ️ Ticket must have an assigned owner and at least one logged action before it can be resolved.`
  - If a client attempts to bypass this, the API returns a 400 error which is displayed as a prominent danger alert.
- **Confirmation for Irreversible States**:
  - Transitioning to `Cancelled` or `Closed` requires confirming via a modal dialog with full keyboard focus trap and `Esc` to cancel.

### 6.2 Optimistic Concurrency Conflict Modal (409)
- If another user updated the ticket while the current user had it open:
  - The API responds with `409 Conflict`.
  - The UI presents a clear modal dialog:
    - Title: `⚠️ Conflict Detected`
    - Body: `"This ticket has been updated by another team member since you loaded it. To prevent accidental overwrites, please reload the latest data."`
    - Actions: **"Reload Ticket"** button (fetches latest state) and **"Dismiss"** button.

### 6.3 Requester Advisory Indication
- On Requester Ticket Detail:
  - Button: `"Problem Appears Resolved"`
  - Below Current Status: Once clicked, displays an advisory banner:
    `✓ You reported this problem appears resolved. IT Staff will verify and complete resolution.`
  - The button is disabled after clicking.
- On Staff Ticket Detail:
  - A prominent notice badge appears: `🔔 Requester marked issue as resolved` to notify staff to verify work and close the ticket.

---

## 7. Responsive Specifications

| Breakpoint | Target Devices | Key Layout Behaviors |
|---|---|---|
| **Desktop** (`≥ 1200px`) | Laptops, Desktops, Monitors | Full multi-column dashboard (5 cards, 2:1 split), complete actions table, standard sidebar/navbar |
| **Tablet** (`768px – 1199px`) | iPad, Surface, Tablets | 2-3 metric cards per row, table horizontal scroll with sticky columns, simplified split |
| **Mobile** (`< 768px`) | iPhones, Android devices | Single-column stacked cards, hamburger navigation menu, actions table converts to individual cards, touch targets ≥ 44px, zero horizontal scrolling |

---

## 8. Accessibility (a11y) Verification Checklist

- [x] **Semantic HTML**: Proper `<header>`, `<nav>`, `<main>`, `<section>`, `<table>`, `<button>` tags used throughout.
- [x] **Heading Hierarchy**: Exactly one `<h1>` per page, followed by logical `<h2>` and `<h3>` nesting.
- [x] **Color Independence**: Every status badge uses both color and icon/text; follow-up indicators use distinct labels.
- [x] **Keyboard Operation**: Tab navigation traverses interactive controls sequentially; Modals trap focus; `Esc` dismisses dialogs.
- [x] **Form Accessibility**: All `<input>` and `<textarea>` elements have explicit `<label>` tags and `aria-describedby` linking to error messages.
- [x] **Dynamic Updates**: Live regions (`aria-live="polite"`) announce dashboard refresh completions and ticket status updates.
- [x] **Contrast Ratio**: Normal text meets minimum 4.5:1 contrast against background; large headers meet 3:1 contrast.
