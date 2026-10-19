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

## 3. IT Staff & Administrator Dashboard Screen (`/dashboard`)

### 3.1 Layout Structure & Visual Hierarchy
- **Header Section**:
  - `<h1>`: "IT Support Dashboard" (for IT Staff) or "IT Administration Dashboard" (for Administrator).
  - `<h2>`: Subtitle `Welcome back, {User Name} — operational workload and support queue health.` with styling `text-muted mb-0 small fs-6 fw-normal`.
  - **Quick Actions**: Quick navigation buttons linking to **+ Create Ticket** (`/tickets/new`), **Search Tickets** (`/queue`), and **My Queue** (`/queue?ownerId=me&active=true`).
  - **Refresh Action**: Accessible button with sync SVG icon. Disabled with `aria-busy="true"` and spinning animation while in-flight. Rapid repeated clicks are ignored while in-flight.
- **Accessible Live Region**:
  - Hidden element with `role="status"` and `aria-live="polite"` announcing `"Dashboard loaded"` or `"Dashboard updated"`.
- **4 Operational Metric Cards (Top Row)**:
  - Responsive layout: 4 columns on desktop (1280px), 2 columns on tablet (768px), 1 column on mobile (375px).
  - 1-to-1 drill-down destinations:
    1. **Unassigned**: Active tickets needing triage -> `/queue?ownerId=unassigned&active=true` (Warning variant).
    2. **Assigned to Me**: Active tickets assigned to current user -> `/queue?ownerId=me&active=true` (Primary variant).
    3. **Appears Resolved**: Active tickets with requester advisory signals -> `/queue?appearsResolved=true&active=true` (Success variant).
    4. **Updated in 24h**: Operational activity in last 24 hours -> `/queue?active=true&updatedSince={ISO}` (Info variant).
  - Card components include SVG decorative icons with `aria-hidden="true"`, large bold count numeral (`.display-6`), subtitle, and full accessible names (e.g., `aria-label="Unassigned, 8 tickets, view in Ticket Queue"`).
- **Admin User Management Summary (Administrator only)**:
  - Banner container visible strictly to `ADMINISTRATOR` users, displaying total users count, active breakdown, and drill-down link to `/admin/users`.
  - Safe-failure tolerance: If `adminUserCounts` is null, cleanly falls back without crashing.
- **Queue Breakdown Sections**:
  - **Status Chip Group**: Renders all 8 status chips (`New`, `Open`, `InProgress`, `WaitingForRequester`, `Resolved`, `Closed`, `Reopened`, `Cancelled`). Terminal states (`Closed`, `Cancelled`) link to `/queue?status={status}` without `active=true`, while non-terminal states link to `/queue?status={status}&active=true`.
  - **Priority Chip Group**: Renders `LOW`, `MEDIUM`, and `HIGH` chips with non-negative counts and drill-down to `/queue?itPriority={priority}&active=true`.
- **Activity Sections**:
  - **Urgent Active Tickets**: Top 5 active tickets with `itPriority === 'HIGH'`, sorted by `updatedAt DESC, id DESC`, with direct detail links to `/tickets/:id`.
  - **My Recent Tickets**: Top 5 active tickets owned by logged-in staff, sorted by `updatedAt DESC, id DESC`, with direct detail links to `/tickets/:id`.
- **Responsive Overflow Defense**:
  - Ticket summaries enforce `.text-break` to prevent unbroken long strings from causing horizontal overflow at 375px mobile viewport.

### 3.2 UI States
- **Loading State (`DashboardSkeleton`)**: Clean shimmer skeleton placeholder for cards and tables.
- **Empty State**: When queue has zero active tickets, displays Zen Green banner: *"Queue is all clear. No active tickets require immediate triage."* with a "View All Queue" button.
- **Error State**: Friendly alert card with retry button when initial fetch fails. Non-destructive inline alert when manual refresh fails without destroying rendered data.
- **Forbidden State (`DashboardForbidden`)**: In-place 403 screen with SVG shield, informative text, and link back to list.

---

## 4. Requester Dashboard Screen (`/dashboard`)

### 4.1 Layout Structure & Visual Hierarchy
- **Header Section**:
  - `<h1>`: "Requester Dashboard".
  - `<h2>`: Subtitle `Welcome back, {User Name} — track and manage your support requests.`
  - **Quick Actions**: Navigation buttons linking to **+ Create Ticket** (`/tickets/new`) and **View My Tickets** (`/tickets`).
  - **Refresh Action**: Sync button with live status region announcement.
- **5 Top Metric Cards**:
  - Reflows across breakpoints (5 columns on desktop, 2-3 on tablet, 1 on mobile).
  - 1-to-1 drill-down destinations:
    1. **Open Requests**: Count of `New`, `Open`, and `Reopened` -> `/tickets?status=New,Open,Reopened`.
    2. **In Progress**: Count of `InProgress` -> `/tickets?status=InProgress`.
    3. **Waiting on You**: Count of `WaitingForRequester` -> `/tickets?status=WaitingForRequester`.
    4. **Recently Resolved**: Count of `Resolved` within past 7 days -> `/tickets?status=Resolved&updatedSince={ISO}`.
    5. **Closed**: Count of `Closed` -> `/tickets?status=Closed`.
- **Activity Sections**:
  - **Attention Needed**: Tickets with status `WaitingForRequester` requiring requester response.
  - **My Recent Requests**: Up to 5 most recently updated tickets owned by user, with links to `/tickets/:id`.

### 4.2 UI States
- **Loading State**: Shimmer skeleton blocks matching card layout.
- **Empty State**: When requester has zero tickets, displays welcoming banner: *"You have no tickets yet. All caught up! You have not submitted any support tickets."* with a "Create Ticket" button.
- **Safe Failure & Forbidden States**: Consistent with Zen Green standard alerts.

---

## 5. Active Filter Chips & List Parity (DoD-6)

### 5.1 Active Filter Chips Bar
- **Location**: Positioned directly beneath filter controls on `/tickets` and `/queue`.
- **Accessibility**: Enclosed in `<div data-testid="active-filter-chips" role="region" aria-label="Active filters">`.
- **Behavior**:
  - Displays interactive pill badges for each active filter (e.g., `Status: In Progress`, `Owner: Unassigned`, `Active Only`, `Priority: HIGH`).
  - Each chip features an accessible remove button (`aria-label="Remove filter: ..."`) that clears that single filter parameter and resets pagination to page 1.
  - "Clear all" button clears all filter parameters back to the default list view.
  - Exposes `data-testid="list-total-count"` which renders `meta.total`, ensuring strict dynamic equality with dashboard metric card numbers.

---

## 6. Actions Taken on Ticket Detail

*Positioned on Ticket Detail (`/tickets/:ticketId`).*

### 6.1 Placement & Visual Hierarchy
- Placed immediately below the Ticket Details card and above the Public Comments / Internal Notes tabbed container.
- Container title: `Actions Taken ({count})` with a badge showing total actions logged.

### 6.2 Actions Taken Table / List
- **Desktop (>= 768px)**: Clean responsive data table.
  - **Columns**:
    1. `Date / Time`: Formatted as `YYYY-MM-DD HH:mm`.
    2. `Description`: Primary technical activity performed.
    3. `Result`: Concrete diagnostic or resolution outcome.
    4. `Performed By`: Badge with staff member's name.
    5. `Follow-Up`: Distinct badge:
       - If `true`: Amber badge with `[Follow-up]` indicator and `"Yes"` label.
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

## 6. Ticket Workflow Controls & Resolution Feedback (Issue 7)

### 6.1 Status Transition Controls (`TicketWorkflowActions`)
- **Location**: Rendered directly beneath the Current Status indicator on Ticket Detail (`TicketDetail.tsx`).
- **Dynamic Action Button Row**:
  - Consumes `ticket.allowedTransitions` directly from the backend as the single source of truth.
  - Renders tailored SVG-icon action buttons for permitted transitions:
    - `Open Ticket`: Outline Primary with folder/open SVG icon.
    - `In Progress`: Outline Warning with clock/progress SVG icon.
    - `Waiting for Requester`: Outline Info with user/chat SVG icon.
    - `Resolve`: Solid Emerald Green (`btn-success`) when gate is satisfied, or disabled outline secondary with opacity when gate is incomplete.
    - `Close Ticket`: Outline Secondary with lock/archive SVG icon.
    - `Reopen`: Warning with reload/sync SVG icon.
    - `Cancel Ticket`: Outline Danger with cancel/cross SVG icon.
  - Buttons are disabled with loading state when mutations are in-flight.
- **Accessible Live Region Announcer**:
  - Live region with `role="status"` and `aria-live="polite"` announces status transitions (e.g. `Status changed to InProgress`).
  - Focus smoothly recovers to `#ticket-summary-status` when triggering action button unmounts.

### 6.2 Resolution Gate Feedback & Actionable Shortcuts
- **Gate Blocking**:
  - When `ticket.resolutionGate.met === false`, the `Resolve` action button is `aria-disabled="true"` and has `aria-describedby="resolution-gate-reason"`.
  - Resolution Gate Banner (`#resolution-gate-reason`) displays below action buttons:
    - Text: *"Resolution Gate Requirements: Ticket must have an assigned active IT Staff owner and at least one logged action taken with a result before it can be resolved."*
    - Non-color cue: Alert warning icon SVG (circle with exclamation point).
    - **Actionable Shortcut Buttons**:
      - `Assign Owner` shortcut button: Automatically focuses `#ownerSelect` to assign an active staff member.
      - `Log Action` shortcut button: Smoothly scrolls to `#actions-taken-section` and triggers the create action form.
- **Gate Unblocking**:
  - Once both requirements are satisfied (`hasActiveOwner === true` and `validActionCount >= 1`), the gate banner unmounts and the `Resolve` button becomes active.

### 6.3 Unified Accessible Dialog (`AccessibleDialog`)
- **Modal Specifications**:
  - Single reusable accessible modal component implementing WAI-ARIA Dialog and Alertdialog patterns.
  - Supports role: `dialog` (standard modal) or `alertdialog` (concurrency collision, destructive confirmation).
  - Background overlay with body scroll lock (`modal-open` class) and application root `inert` attribute.
  - Focus trap keeps Tab and Shift+Tab traversal strictly inside the modal boundary.
  - Initial focus safely defaults to the safe cancel button (`initialFocusSafe={true}`).
  - `Esc` key dismisses modal; backdrop clicking dismisses unless `isSubmitting` is in-flight.
  - Returning focus: Automatically restores focus to the previously active element upon unmounting.
- **Use Cases**:
  1. **Destructive State Confirmation (`Cancelled`, `Closed`)**:
     - Warns staff of terminal transitions: *"Are you sure you want to cancel/close this ticket? This action is terminal and cannot be reversed."*
     - Cancel button labeled *"Keep Ticket"*; Confirm button labeled *"Confirm Cancel"* or *"Confirm Closed"*.
  2. **Optimistic Concurrency Conflict Dialog (HTTP 409)**:
     - Catches 409 `STALE_VERSION_CONFLICT`.
     - Displays server's current status and version: *"This ticket has been modified by another user. Current status is {status} (v{version}). Please reload latest changes to prevent accidental overwrites."*
     - Primary action *"Reload Ticket"* fetches latest ticket state and bumps local state version.
  3. **Requester Advisory Signal Confirmation**:
     - Opened when requester clicks *"Problem Appears Resolved"*.
     - Explains: *"This will notify IT Staff that your issue appears resolved and post an advisory audit comment. IT Staff will verify and complete the resolution."*
     - Confirmation dispatches `PATCH /api/tickets/:id/appears-resolved`, appends audit comment, and updates badge.

### 6.4 Requester Advisory & Staff Banner Feedback
- **Requester View**:
  - On `Open`, `InProgress`, or `WaitingForRequester` tickets, a *"Problem Appears Resolved"* button is available.
  - Once signaled, button is replaced with Zen Success badge: *"You reported this problem appears resolved"*.
- **Staff View**:
  - Staff sees a prominent green advisory banner (`#requester-advisory-banner`):
    - Bell SVG graphic + *"Requester marked issue as resolved — please verify actions taken and resolve ticket."*
    - Direct action button: *"Review Actions Taken"* smoothly scrolls and focuses `#actions-taken-section`.
  - When staff transitions the ticket status, `ticket.appearsResolved` is reset and the advisory banner automatically unmounts.

### 6.5 Terminal State Locking
- When ticket is `Closed` or `Cancelled`:
  - `Ticket Owner` dropdown, `Claim Ticket` button, and `IT Priority` dropdown are strictly `disabled`.
  - For `Closed` tickets, only the `Reopen` transition action is permitted.
  - For `Cancelled` tickets, all workflow transitions are locked (`allowedTransitions = []`).

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
