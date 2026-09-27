# AI Usage Log (Lab 3)

**LLM Model Used:** Google Antigravity (Gemini-based Agentic IDE)

## Key Prompts Used
1. "Set up the authentication API with cookie-based sessions, and integrate it into a React AuthContext."
2. "Convert the existing MyTickets and CreateTicket flows to use the new authentication session instead of the mock RequesterContext."
3. "Generate the IT Staff Queue page UI with server-side pagination, searching, and filtering. Ensure it switches to card layout on mobile."
4. "Create a User Management dashboard for the Administrator role that allows creating, editing, and deactivating users."
5. "Add role-based authorization middleware to the Express server to prevent unauthorized access to /api/admin and /api/staff."
6. "Fix the E2E tests for the staff queue so that it accounts for the 'Unassigned' badge and proper sorting assertions."
7. "Refactor the 'badge-zen-success' status logic so that 'Closed' displays as grey ('badge-zen-secondary') instead of green across all components."
8. "Write a robust Playwright script that automatically generates screenshots for all required states in the User Management flow, including edge cases like `deactivate-self-blocked`."

## My Reflection
Using an **Agentic AI** (like Antigravity) is a significantly different experience from using a **Spec-agent** (like ChatGPT or Claude in a web browser). 
- **The Good:** The agent could directly search my codebase, read existing files (like `index.css` and Bootstrap classes), and apply edits directly to the relevant files. This eliminated the tedious copy-pasting required when using a web LLM. It was particularly powerful for tracking down CSS classes, refactoring E2E tests, and writing exhaustive automation scripts.
- **The Bad / Challenges:** Because the agent has the power to edit files, giving vague instructions sometimes resulted in it changing things outside the intended scope (e.g. over-correcting accessibility attributes or causing layout jumps). I had to learn to be extremely precise with my prompts ("Change the badge color in TicketQueue.tsx ONLY") to prevent side-effects.
- **Conclusion:** The AI is an incredibly powerful coding assistant that accelerates boilerplate generation and test writing. However, the human developer *must* remain the domain expert. I still had to thoroughly review its PRs, catch missing business rules (like the 'last admin deactivate' block), and enforce visual design consistency. AI handles the typing, but the developer handles the architecture and quality assurance.
