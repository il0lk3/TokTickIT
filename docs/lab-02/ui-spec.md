# Lab 2 Zen Green Theme UI Specification

## 1. Color Palette
- **Primary green:** `#006B3C` (App header, primary actions, strong emphasis)
- **Secondary green:** `#0B7A46` (Active tabs, focus accents, links, hover states)
- **Pale green:** `#EAF6EF` (Selected, success, subtle section emphasis)
- **Page background:** `#F5F7F6`
- **Surface / cards:** `#FFFFFF` (White with subtle border and restrained shadow)
- **Text:** Dark charcoal-green (`#1F2924` or similar, not pure black)
- **Error:** Dark red text and border (`#D32F2F`)
- **Warning:** Amber (`#FFA000`)
- **Success:** Green confirmation text (`#2E7D32`)

## 2. Typography & Spacing
- Use a clean, modern sans-serif font (e.g., Inter or Roboto).
- **Labels:** Appear above controls, consistent font weight (e.g., fw-medium).
- **Spacing:** Use Tailwind/Bootstrap standard spacing (e.g., gap-3, mb-4).

## 3. Components
### 3.1. Inputs & Forms
- **Editable field:** White background, clear neutral border. Focus state uses Secondary green ring.
- **Read-only field:** Soft gray-green or warm ivory shading, disabled look but high contrast text.
- **Required fields:** Marked with a red asterisk `*`.
- **Validation Messages:** Appear immediately below the associated field in Error color.
- **Multline inputs:** Textareas must have a consistent base height and be vertically resizable only.

### 3.2. Buttons
- **Primary:** Background `#006B3C`, white text.
- **Secondary/Cancel:** Outline or neutral background.
- **Disabled/Busy:** Visually faded, unclickable. "Busy" state must show a loading spinner or "Loading..." text.

### 3.3. Badges
- **Priority (Medium):** Warning/Amber background, dark text.
- **Priority (High):** Pale red background, red text.
- **Status (New/In Progress):** Pale green background, Primary green text.

## 4. Responsive Layout Rules
- **Desktop (>= 992px):** Multi-column layout. Forms centered with a sensible max-width (e.g., 900px).
- **Tablet (768px - 991px):** Two-column layout where practical.
- **Mobile (< 768px):** Fields stack vertically 100% width. Buttons remain touch-friendly (min-height 44px). No horizontal scrolling allowed.

## 5. Required Screens
### 5.1. Development Requester Selection
- Centered card, dropdown of active requesters, "Continue" button.
- **State Diagram:** `Idle (Select User)` → `Loading (Fetching API)` → `Success (Set Context & Redirect)` or `Error (Show alert)`.

### 5.2. Create Ticket
- Form with Category, System, Priority, Summary, Description, and Attachment dropzone.
- **State Diagram:** `Idle (Empty Form)` → `Validating (Check inputs)` → `Submitting (Busy state, button disabled)` → `Success (Show Ticket Number)` or `Error (Show field validation/API error)`.

### 5.3. My Tickets
- Data table (desktop) or stacked cards (mobile). Search bar, filter dropdowns, and pagination controls at the bottom.

### 5.4. Ticket Detail
- Read-only fields grouped logically. Attachment list with "Download" and "Remove" action icons.

## 6. Accessibility (A11y)
- Focus indicators remain visible for keyboard navigation.
- Icon-only controls must have `aria-label` or `title` tooltips.
- Success/Error states must not rely on color alone (use icons or clear text).
