# Lab 2 AI Use

A living document recording the key prompts used during the sprint to shape the design, solve bugs, and refine implementation.

## 1. Which AI I used

**Google Antigravity IDE (Gemini)** running in the editor, with full access to the repository, terminal, tests, and file system. 
It was used iteratively as both a design consultant and a coding agent.

## 2. Selected key prompts

The following prompts highlight moments where I challenged the AI, corrected its assumptions, or pushed it to dig deeper into bugs, rather than just asking for basic code generation.

| # | Prompt | What it changed | PR |
| --- | --- | --- | --- |
| 1 | *"คือหน้า ticket detail มันต้องเป็นแนวประมาณนี้ไหม... แถบด้านบนมันควรจะเป้นสีเขียวรึเปล่า"* | Overruled the AI's generic frontend design and forced a complete UI overhaul to match the 'Zen Green Enterprise' mockup. The AI had to rewrite the Navbar, App shell, and Ticket Detail screens to comply with the required aesthetic. | PR #29 |
| 2 | *"คือเป็นโมบายแล้วไม่มีข้อมูล status หรอออ ทำให้เหมือนกัน ข้อมูลโชว์เหมือนกันหมด"* | Enforced strict data parity. The AI had initially hidden 'Status' and 'Priority' on mobile to save space. This prompt forced it to redesign the mobile card to be denser but functionally identical to the desktop table. | PR #29 |
| 3 | *"last updated ทำไม filter ไม่ได้"* | Sparked a full-stack fix. Instead of just adding a UI button, the AI investigated and found the backend `tickets.ts` API strictly rejected sorting by `updatedAt`. It fixed the backend array and wired up the frontend. | PR #29 |
| 4 | *"ช่วยด้วยยยยย failed เยอะมาก"* | Triggered deep backend debugging. The AI realized the dev DB seeds were causing test collisions (9 tickets returned instead of 3). More importantly, it discovered and fixed a backend infinite loop bug where ticket number collisions (`TKT-YYYY-XXXXXX`) caused a 500 error instead of auto-incrementing. | PR #29 |
| 5 | *"เออใช่ไอที่โชวข้อมูลควรมีทั้ง Created date กับ lasted date ด้วยไหมอะ"* | Changed the schema display requirement. The AI added a dedicated "Last Updated" column to both the desktop table and the mobile cards, parsing the `updatedAt` database field which was previously ignored in the UI. | PR #29 |
| 6 | *"แกคือ route/URL path ของแต่ละหน้า web เราเหมือนกันหมดเลยหรอ"* | Sparked an architectural review of the routing mechanism. The AI explained that the app was a strict SPA using state (`activeTab`) instead of `react-router-dom`, clarifying why browser navigation (Back/Forward) wasn't working. | PR #29 |

## 3. Workflow Observation

Rather than generating large blocks of code blindly, the AI was most effective when given screenshots of its own UI outputs and error logs. When tests failed, feeding it the terminal output allowed it to trace the bug across the full stack (from the frontend React component all the way to the Prisma backend and test runner constraints).
