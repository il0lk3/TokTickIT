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
- **New Section**: "Comments".
- **View**: Renders a list of Public Comments chronologically.
- **Input**: A text area to add a new Public Comment (placeholder must be exactly `"Type a public comment..."`).
- **Action**: "Post Comment".
- **Action**: "Problem Appears Resolved" button. (This does not formally change the status to Resolved, but flags it for IT Staff).

## 4. IT Staff Ticket Queue
- **Layout**: Data table or grid (responsive cards on mobile).
- **Columns**: Ticket Number, Created Date, Summary, Category, Requested Priority, IT Priority, Status, Owner. *(Justification: This set of 8 columns matches the requested mockup and avoids a mega-grid by keeping data to a single line per row on desktop).*
- **Controls**:
  - Search bar (by Ticket Number or Summary).
  - Filters (Dropdowns for Status, Requested Priority, IT Priority, Owner/Unassigned).
  - Sorting (Clickable column headers to toggle sort direction).
  - Pagination controls (Previous/Next, Page numbers).
- **Empty State**: Clear message when no tickets match the filters.
- **Actions**: Clicking a row opens the IT Staff Ticket Detail screen.

## 5. IT Staff Ticket Detail
- **Layout**: Similar to Requester Ticket Detail but with operational controls.
- **Editable Fields**:
  - **Ticket Owner**: Dropdown to assign to self (Claim) or reassign to another IT Staff.
  - **IT Priority**: Dropdown to override the requested priority.
  - **Status**: Dropdown to change the status (e.g., Open -> In Progress -> Resolved).
- **Comments & Notes**:
  - Tabbed interface or clearly separated visual sections for "Public Comments" vs "Internal Notes".
  - Internal Notes must have a distinct background color (e.g., pale yellow/gray) to prevent accidental public posting.
  - Inputs to post either a Public Comment or an Internal Note.

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

## 7. Responsive & Accessibility Rules (Same as Lab 2)
- All tables must switch to stacked cards or scroll horizontally on mobile.
- Forms must use `form-label` and correct input types (e.g., `type="email"`, `type="password"`).
- All buttons and links must be keyboard accessible and have visible focus states.
