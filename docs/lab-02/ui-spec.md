# Lab 2 UI Specification: Zen Green Enterprise Theme

This document serves as the comprehensive source of truth for the frontend visual design, interaction patterns, and layout structures of the TokTickIT platform.

---

## 1. Design System & Tokens

### 1.1 Color Palette
The application uses a nature-inspired "Zen Green" theme to convey trust, stability, and approachability.
- **Primary Brand:** `#006B3C` (App header, primary buttons, active states, key emphasis)
- **Secondary Accent:** `#0B7A46` (Hover states, focus rings, interactive elements)
- **Background (Page):** `#F5F7F6` (A cool, very pale gray-green to reduce eye strain compared to pure white)
- **Background (Surface):** `#FFFFFF` (For distinct cards and elevated panels)
- **Text (Primary):** `#1F2924` (Dark charcoal-green, ensuring high contrast without the harshness of pure black `#000000`)
- **Text (Muted/Secondary):** `#6C757D` (Standard Bootstrap muted gray)

**Semantic Colors:**
- **Error/Danger:** `#DC3545` (Validation messages, destructive actions, 'High' priority badge)
- **Warning:** `#FFC107` (Alerts, 'Medium' priority badge)
- **Success:** `#198754` (Toast notifications, completion states)
- **Info:** `#0DCAF0` (Informational alerts, 'New' status badge)

### 1.2 Typography
We utilize modern, highly legible Google Fonts to establish a premium feel.
- **Primary Font (Headings):** `Outfit`, sans-serif. Used for `h1` through `h6` for a geometric, friendly appearance. Font weights: 500, 600, 700.
- **Secondary Font (Body & UI):** `Inter`, sans-serif. Used for all standard text, inputs, and tables for maximum readability. Font weights: 400, 500.
- **Monospace Font:** `monospace` (System default). Strictly used for Ticket Numbers (e.g., `TKT-2026-123456`) to ensure alignment.

### 1.3 Elevation & Glassmorphism
The UI steps away from flat design by using subtle depth and frosted glass effects.
- **Glass Panels (`.glass-panel`):** Used as the primary container for forms and tables.
  - Background: `rgba(255, 255, 255, 0.95)`
  - Backdrop Filter: `blur(12px)`
  - Box Shadow: `0 8px 32px rgba(0, 0, 0, 0.04)`
  - Border: `1px solid rgba(255, 255, 255, 0.5)`
  - Border Radius: `16px`

---

## 2. Core Components

### 2.1 Inputs & Forms
- **Standard Input/Textarea:** Light gray background (`bg-light`), no visible border until focused.
- **Focus State:** When focused, the input gains a 3px ring of Secondary Green (`box-shadow: 0 0 0 0.25rem rgba(11, 122, 70, 0.25)`).
- **Read-Only Fields:** Maintain the light gray background but text remains fully opaque (`text-muted` or standard color) to ensure readability. Mouse cursor changes to `default`.
- **Validation:** 
  - Required fields must display a red asterisk (`<span class="text-danger">*</span>`).
  - Error messages appear directly below the field in 12px Error red text. The input border also turns red.

### 2.2 Buttons
- **Primary Button:** Solid Primary Green background, white text, pill-shaped (`rounded-pill`). Hover effect deepens the green and slightly translates the button upward (`transform: translateY(-1px)`).
- **Secondary Button:** Outline Primary Green or Outline Secondary (Gray), transparent background.
- **Disabled State:** Opacity reduced to `0.65`, `cursor: not-allowed`, hover animations disabled.

### 2.3 Status & Priority Badges
Badges are pill-shaped (`rounded-pill`) with a soft translucent background and opaque text border.
- **Priority (High):** `bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25`
- **Priority (Medium):** `bg-warning bg-opacity-10 text-warning border border-warning border-opacity-50`
- **Priority (Low):** `bg-success bg-opacity-10 text-success border border-success border-opacity-25`
- **Status (New):** `bg-info bg-opacity-10 text-info border border-info border-opacity-50`

---

## 3. Responsive Layout Guidelines

The application must be fully usable on mobile devices, tablets, and large desktop monitors.

### 3.1 Desktop (≥ 992px)
- **Container:** Max-width of `1140px` centered on the screen.
- **Navigation:** Full horizontal navbar with visible brand logo, navigation links, and User Profile dropdown.
- **Data Display:** Complex data (like My Tickets) is displayed in a standard HTML `<table>` with sortable columns.

### 3.2 Tablet (768px - 991px)
- **Forms:** 2-column grids collapse into a single column where horizontal space is constrained.
- **Data Display:** Table columns may wrap or truncate text, but the table structure is maintained.

### 3.3 Mobile (< 768px)
- **Navigation:** Navbar links collapse into a Hamburger Menu (`navbar-toggler`).
- **Data Display (Critical):** The HTML `<table>` for My Tickets is completely hidden (`d-none`). Instead, each ticket is rendered as an independent Card (`.ticket-card`) stacked vertically (`d-block d-md-none`).
  - Mobile cards must retain **100% data parity** with the desktop table (Ticket No, Summary, Category, Priority, Status, Created Date, Last Updated). No data is allowed to be hidden just to save space.
- **Spacing:** Padding is reduced (e.g., from `p-4` to `p-3`) to maximize usable screen real estate.

---

## 4. Screen-by-Screen Breakdown

### 4.1 Requester Selection (App Startup)
- **Layout:** Centered modal-style card on a full viewport-height background.
- **Elements:** Large brand logo, `<select>` dropdown populated with active users, and a Primary "Continue" button.
- **Behavior:** The "Continue" button remains disabled until a user is explicitly selected.

### 4.2 My Tickets
- **Header Section:** Page title aligned left, "Total Tickets" pill badge aligned right.
- **Filter Bar:** 4-column grid (Search Input, Category Dropdown, Priority Dropdown, Status Dropdown). Stacks to 1-column on mobile.
- **List View (Desktop):** Clean table with invisible borders (`border-0`), sorting arrows on headers (`Ticket No.`, `Priority`, `Status`, `Date`, `Last Updated`). Hovering over a row highlights it subtly.
- **List View (Mobile):** Rendered as individual cards. Includes a visible `<select>` dropdown for sorting since table headers are hidden.

### 4.3 Create Ticket
- **Layout:** Contained within a single `.glass-panel` to prevent visual spread on large monitors.
- **Grid Layout:** 
  - Category, System, Priority (3 columns on desktop, 1 on mobile).
  - Summary (Full width).
  - Description (Full width, `textarea` with `resize: none`, min-height 120px).
- **File Upload:** Hidden `<input type="file">` triggered by a styled "Upload File" outline button. File list appears above the button with 'Remove' (Trash icon) actions.
- **Form Actions:** Right-aligned "Submit Ticket" and "Cancel" buttons at the bottom.

### 4.4 Ticket Detail
- **Layout:** Mimics the 'Create Ticket' form structure but uses Read-Only inputs instead of raw text labels to create a clean, uniform grid alignment.
- **Data Rendering:** 
  - Status and Priority are rendered as distinct Badges inside the read-only input containers.
  - Ticket Number is rendered in monospace font.
- **Attachments:** Rendered as a list of clickable links.

---

## 5. Animations & Interaction States

- **Route Transitions:** Wrap main views in an `.animate-enter` CSS class (`animation: fadeSlideUp 0.4s ease-out`).
- **Loading States:** Use a pulsing green spinner (`spinner-border text-zen-primary`) centered on the screen for full-page loads.
- **Hover Effects:** Table rows and buttons should use `transition: all 0.2s ease` to ensure smooth color blending.

## 6. Accessibility (A11y)
- **Contrast:** All text colors must pass WCAG AA contrast ratios against their respective backgrounds (especially Badges).
- **Keyboard Navigation:** Native browser focus outlines must not be removed unless replaced by a highly visible custom focus ring (e.g., the 3px Secondary Green ring).
- **Screen Readers:** Sort icons and action buttons must include `aria-label` attributes describing their function (e.g., `aria-label="Sort by Ticket Number"`).
