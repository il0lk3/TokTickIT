# Lab 3 AI Use & Reflection

A living document recording the key prompts used during Sprint 3. This document demonstrates how AI was utilized not just for code generation, but as a sparring partner for architectural decisions, deep debugging, and strict specification enforcement.

## 1. AI Assistant Details

- **Primary Tool:** Google Antigravity IDE (Gemini)
- **Role:** Design consultant, backend architect, and deep-stack debugger. 
- **Workflow:** Iterative pairing. Instead of blind code generation, the AI was fed error logs, database schema states, and terminal outputs to trace bugs across the full stack (Prisma → Express → React).

## 2. Selected Key Prompts

The following 8 prompts highlight moments where I challenged the AI, corrected its assumptions, or pushed it to dig deeper into complex software engineering problems.

| # | Focus Area | Actual Prompt Used | My Reflection & Impact | PR |
|---|---|---|---|---|
| **1** | **Session & Cookie Security** | *"Set up the authentication API with cookie-based sessions, and integrate it into a React AuthContext."*<br><br>*(Configure cookie sessions securely and wire them into the client context.)* | **Reflection:** Prompted the AI to design a robust session layer. It configured `HttpOnly` and `SameSite` attributes correctly on the server, significantly reducing XSS vulnerabilities. | PR #43 |
| **2** | **Refactoring Legacy State** | *"Convert the existing MyTickets and CreateTicket flows to use the new authentication session instead of the mock RequesterContext."*<br><br>*(Remove the mock context and migrate the application to real auth logic.)* | **Reflection:** A complex migration. The AI successfully purged the simulated X-Requester-Id headers and wired the Axios interceptors to rely on cookies. It required some manual verification, but vastly accelerated the refactor. | PR #45 |
| **3** | **Responsive Table/Card UX** | *"Generate the IT Staff Queue page UI with server-side pagination, searching, and filtering. Ensure it switches to card layout on mobile."*<br><br>*(Build the queue grid, but enforce a card-based layout on smaller screens.)* | **Reflection:** The AI implemented a hybrid approach using `useMediaQuery` to toggle between a standard HTML table on desktop and a densely packed card layout on mobile, maintaining data parity across viewports. | PR #47 |
| **4** | **Complex Form Validation** | *"Create a User Management dashboard for the Administrator role that allows creating, editing, and deactivating users."*<br><br>*(Construct the Admin UI for full CRUD operations on users.)* | **Reflection:** The AI scaffolded the modals efficiently. However, it initially missed the requirement to prevent deactivating the final active administrator. I had to guide it to enforce this business rule strictly on the backend. | PR #49 |
| **5** | **Authorization Middleware** | *"Add role-based authorization middleware to the Express server to prevent unauthorized access to /api/admin and /api/staff."*<br><br>*(Secure the backend endpoints using strict role checks.)* | **Reflection:** The AI wrote a very clean `requireRole` middleware. This centralized the security logic, making it easy to sweep the entire API and ensure no endpoint leaked data to unauthorized users. | PR #52 |
| **6** | **E2E Flakiness & Locators** | *"Fix the E2E tests for the staff queue so that it accounts for the 'Unassigned' badge and proper sorting assertions."*<br><br>*(Update Playwright assertions to handle the new sorting and badge features.)* | **Reflection:** The AI demonstrated an impressive ability to read Playwright traces and DOM structures. It tightened the locators, making the tests much more resilient to minor UI changes. | PR #52 |
| **7** | **Visual Theme Consistency** | *"Refactor the 'badge-zen-success' status logic so that 'Closed' displays as grey ('badge-zen-secondary') instead of green across all components."*<br><br>*(Enforce the Zen Green aesthetic by ensuring Closed tickets don't look Resolved.)* | **Reflection:** The AI utilized project-wide search to locate all instances where badge colors were hardcoded, consolidating them into a single utility mapping function. | PR #53 |
| **8** | **Exhaustive QA Automation** | *"Write a robust Playwright script that automatically generates screenshots for all required states in the User Management flow, including edge cases like `deactivate-self-blocked`."*<br><br>*(Automate the generation of release evidence screenshots.)* | **Reflection:** The AI saved hours of manual QA. By scripting the exact edge cases, it proved that the system correctly blocks invalid actions at the UI level, generating perfect artifacts for final review. | PR #53 |

## 3. Workflow Observation

Rather than treating the AI as a code generator, I treated it as a **Senior Engineer / Reviewer**. 

The AI was most effective when given raw terminal outputs (like Playwright failure logs) or when challenged on its design choices ("Why did you map Closed to Green?"). When tests failed, feeding the AI the exact trace allowed it to navigate from a frontend React test failure, through the API, directly to a Prisma schema constraint. 

This Spec-Driven Development (Spec-DD) approach ensured that the AI didn't just write code, but wrote code that rigidly conformed to the engineering contracts we established in `specification.md` and `api-spec.md`.
