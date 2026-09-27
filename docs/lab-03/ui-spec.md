# Sprint 3 UI Specification

This document details the new and updated user interfaces required for Lab 3, continuing the Zen Green design language.

## 1. Global App Shell
- **Top Navigation**:
  - The "TokTickIT" brand logo remains on the left.
  - The Lab 2 "Development Requester Selector" is **removed**.
  - Replaced with a profile dropdown/menu showing the current authenticated user's name and role (e.g., `Jane Doe (IT Staff)`).
  - Includes a **Logout** button.
- **Role-Based Navigation**:
  - **Requester**: Sees "My Tickets" and "Create Ticket".
  - **IT Staff**: Sees "Ticket Queue".
  - **Administrator**: Sees "User Management".
  - Non-permitted navigation items are completely hidden, not just disabled.

## 2. Authentication Screens
### 2.1. Login Screen
- **Fields**: Email, Password.
- **Actions**: Sign In.
- **Feedback**:
  - Inline validation for invalid email formats or empty fields.
  - Form-level alert for "Invalid credentials" or "Account is inactive".
  - Button shows a loading spinner during API request.

### 2.2. Mandatory Password Change Screen
- **Trigger**: Appears immediately after a successful login if the user's `requiresPasswordChange` flag is true.
- **Fields**: Current (Initial) Password, New Password, Confirm New Password.
- **Rules**: New password must be validated (e.g., min 8 chars). Confirm password must match.
- **Actions**: Update Password.
- **State**: The user cannot bypass this screen to reach the main application until the password is successfully changed.

## 3. Requester Ticket Detail (Update)
- **Top Section (Grid)**: Displays ticket information. Fields like Current Status, Ticket Owner, and Requested Priority are rendered as read-only badges to visually distinguish them from editable fields.
- **Action**: "Problem Appears Resolved" button. (This does not formally change the status to Resolved, but flags it for IT Staff). It is positioned near the Current Status field for high visibility. Once pressed, the button must be hidden or disabled to prevent duplicate submissions.
- **Indicators**: An `appearsResolved` badge or visual indicator must appear near the Current Status when this flag is active.
- **Bottom Section (Tabbed Interface)**:
  - **Tabs**: 💬 Public Comments (count) · 📎 Attachments (count).
  - **View**: Renders a list of items for the active tab.
  - **Input**: A text area to add a new Public Comment (placeholder must be exactly `"Type a comment..."`). When the ticket is in a terminal status (Resolved, Closed, Cancelled), the input is replaced with a disabled state message: "This ticket is closed and no longer accepts new comments".
  - **Action**: "Post Comment".

## 4. IT Staff Ticket Queue
- **Layout**: Data table or grid (responsive cards on mobile).
- **Columns**: Ticket Number, Created Date, Summary, Category, Requested Priority, IT Priority, Status, Owner. *(Justification: This set of 8 columns matches the requested mockup and avoids a mega-grid by keeping data to a single line per row on desktop).*
- **Controls**:
  - Search bar (by Ticket Number or Summary).
  - Filters (Dropdowns for Status, Requested Priority, IT Priority, Owner/Unassigned).
  - Sorting (Clickable column headers to toggle sort direction).
  - Pagination controls (Previous/Next, Page numbers).
- **Empty State**: Clear message when no tickets match the filters. Unassigned tickets should visually differentiate the Owner field (e.g., using an italicized, muted *"Unassigned"* text).
- **Actions**: Clicking a row opens the IT Staff Ticket Detail screen.
- **Feedback States**: 
  - **Loading**: Displays a spinner or skeleton loader while fetching the queue.
  - **No-results**: Distinct from a completely empty system, this shows when search/filters yield zero rows.
  - **Forbidden**: If a non-staff user attempts to view this, show a 403 Forbidden message.
  - **Failure**: Friendly error message if the API fails to load the queue.

## 5. IT Staff Ticket Detail
- **Top Section (Grid)**: Operational controls and ticket details organized in a card.
- **Indicators**: IT Staff must also see the `appearsResolved` badge if the Requester has flagged it, serving as a cue to review and formally close the ticket.
- **Editable Fields** (must have white background and visible border to distinguish from read-only fields):
  - **Ticket Owner**: Dropdown to assign to self ("Claim Ticket" button adjacent) or reassign to another IT Staff.
  - **IT Priority**: Dropdown to override the requested priority.
  - **Current Status**: Dropdown to change the status (e.g., Open -> In Progress -> Resolved).
  - **Required Confirmations**: Transitions to terminal statuses (`Resolved`, `Closed`, `Cancelled`) must prompt a confirmation dialog before applying the change.
- **Feedback States**:
  - **Loading**: Spinner while fetching the ticket details.
  - **Saving**: Spinner or inline indicator while applying status/priority/owner updates.
  - **Failure**: Alert message if an update fails (e.g., invalid transition).
- **Bottom Section (Tabbed Interface)**:
  - **Tabs**: 💬 Public Comments (count) · 🔒 Internal Notes (count, staff-only) · 📎 Attachments (count).
  - *Note*: "Service Actions" tab is explicitly excluded as it maps to "Actions Taken", which is deferred to Lab 4 (per handout §4.2).
  - **Internal Notes Tab**: Must be conditionally rendered to ensure it does not exist in the DOM for Requesters. The content area uses a distinct background tint (e.g., light yellow/amber) to prevent accidental public posting.
  - Inputs to post either a Public Comment or an Internal Note. When the ticket is in a terminal status (Resolved, Closed, Cancelled), the input is replaced with a disabled state message: "This ticket is closed and no longer accepts new comments".

## 6. Administrator User Management
- **Layout**: Data table (responsive cards on mobile).
- **Columns**: Name, Email Address, Role, Status (Active/Inactive).
- **Controls**:
  - Search bar (by Name or Email).
  - Filter (by Role).
  - "Create New User" button.
- **Actions**: Clicking "Edit" on a row opens the User Edit modal/form.

### 6.1. Create / Edit User Modal
- **Fields**:
  - Full Name
  - Email Address
  - Role (Dropdown: Requester, IT Staff, Administrator)
  - Status Toggle (Active / Inactive)
  - Initial Password (Input field, visible during creation, optional during edit to reset).
- **Rules**:
  - Cannot deactivate the last active Admin.
  - Cannot deactivate self.
  - Changing the initial password automatically sets `requiresPasswordChange = true` for the user.
- **Feedback States**:
  - **Loading / Saving**: Display spinners during data fetch and form submission.
  - **Success**: Notification toast or alert upon successful user creation/edit.
  - **Validation / Failure**: Inline errors for duplicate emails or attempting to deactivate the last Admin.
  - **Forbidden**: Non-admin users must see a 403 access denied message if they attempt to load the route.

## 7. Responsive & Accessibility Rules (Same as Lab 2)
- **ARIA Tabs Pattern**: The new tabbed interfaces (Public Comments, Internal Notes) must implement proper ARIA roles (`role="tablist"`, `role="tab"`, `role="tabpanel"`) and state attributes (`aria-selected="true"`) to ensure screen-reader accessibility.
- All tables must switch to stacked cards or scroll horizontally on mobile.
- Forms must use `form-label` and correct input types (e.g., `type="email"`, `type="password"`).
- All buttons and links must be keyboard accessible and have visible focus states.
