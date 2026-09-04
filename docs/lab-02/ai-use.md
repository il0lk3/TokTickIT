# Lab 2 AI Use & Reflection

A living document recording the key prompts used during Sprint 2. This document demonstrates how AI was utilized not just for code generation, but as a sparring partner for architectural decisions, deep debugging, and strict specification enforcement.

## 1. AI Assistant Details

- **Primary Tool:** Google Antigravity IDE (Gemini)
- **Role:** Design consultant, backend architect, and deep-stack debugger. 
- **Workflow:** Iterative pairing. Instead of blind code generation, the AI was fed error logs, database schema states, and terminal outputs to trace bugs across the full stack (Prisma → Express → React).

## 2. Selected Key Prompts

The following 8 prompts highlight moments where I challenged the AI, corrected its assumptions, or pushed it to dig deeper into complex software engineering problems.

| # | Focus Area | Actual Prompt Used | My Reflection & Impact | PR |
|---|---|---|---|---|
| **1** | **Responsive Design & Data Parity** | *"คือเป็นโมบายแล้วไม่มีข้อมูล status หรอ ทำให้เหมือนกัน ข้อมูลโชว์เหมือนกันหมด"*<br><br>*(Why are Status and Priority missing on mobile? Enforce 100% data parity between views.)* | **Reflection:** The AI initially took the easy route of hiding columns on mobile to save space. I overruled this to enforce strict data parity. It forced the AI to redesign the mobile layout using densely packed Flexbox cards (`d-block d-md-none`) instead of just hiding HTML table columns. | PR #29 |
| **2** | **Race Conditions & Unique Constraints** | *"ช่วยด้วยยยยย failed เยอะมาก เทสต์พังหมดเลย มันเกิดอะไรขึ้นตอน Generate Ticket Number"*<br><br>*(Tests are failing massively. What is happening during ticket number generation?)* | **Reflection:** Triggered deep backend debugging. The AI analyzed the logs and discovered a severe race condition during concurrent ticket creation. The auto-increment logic (`count() + 1`) was causing Prisma `P2002` unique constraint violations. This led to implementing a robust `while` loop with retry logic for ticket number generation. | PR #25 |
| **3** | **SPA State Management vs Routing** | *"แกคือ route/URL path ของแต่ละหน้า web เราเหมือนกันหมดเลยหรอ ไม่มีอะไรต่างกันเลยหรอ"*<br><br>*(Are all the route/URL paths exactly the same? Is there no routing at all?)* | **Reflection:** Sparked a crucial architectural review. The AI explained the constraints of our current setup: we are building a strict Single Page Application (SPA) using React State (`activeTab`) rather than `react-router-dom`. This helped clarify why browser navigation (Back/Forward) wasn't functioning and how context dictates the view. | PR #24 |
| **4** | **Idempotency & UX Protection** | *"ถ้า User กดปุ่ม Create ย้ำๆๆ รัวๆ จะแก้ปัญหายังไงไม่ให้ตั๋วเบิ้ล (Double Submit) เข้า Database"*<br><br>*(How do we prevent double-submissions if a user spams the Create button?)* | **Reflection:** Pushed the AI to think beyond the happy path. This resulted in two layers of protection: disabling the submit button via React state immediately upon click, and adding a 10-second deduplication guard on the Express backend based on the Requester ID and Summary payload. | PR #25 |
| **5** | **Simulated Authentication Context** | *"เราใช้ `X-Requester-Id` แทน Token ไปก่อนใน Lab 2 มันจะเวิร์คไหม แล้วฝั่ง Client ควรจัดการ State นี่ยังไงไม่ให้แอปพังเวลาเผลอรีเฟรช"*<br><br>*(Will `X-Requester-Id` work as a simulated token? How do we manage client state so it survives a refresh?)* | **Reflection:** We architected the `RequesterContext` API. The AI initially suggested a basic `localStorage` read, but I pushed it to consider edge cases. It then implemented a strict `try/catch` around `JSON.parse()` on boot to ensure stale or corrupted local storage wouldn't crash the entire React application. | PR #24 |
| **6** | **Strict UI Theme Enforcement** | *"หน้า ticket detail มันต้องเป็นแนวประมาณนี้ไหม... แถบด้านบนมันควรจะเป็นสีเขียวรึเปล่า"*<br><br>*(Should the ticket detail page look like this? Shouldn't the top bar be green?)* | **Reflection:** The AI tends to generate generic, bootstrap-default UI components. I used this prompt to reject its initial design and force a complete UI overhaul to strictly match the "Zen Green Enterprise" aesthetic (`#006B3C`), ensuring CSS variables and custom overrides were properly utilized. | PR #29 |
| **7** | **Database Filtering & Indexing** | *"last updated ทำไม filter ไม่ได้... แล้วที่โชว์ข้อมูลควรมีทั้ง Created date กับ lasted date ด้วยไหม"*<br><br>*(Why can't I filter by Last Updated? Shouldn't we display both dates?)* | **Reflection:** Sparked a full-stack schema and API fix. The AI realized the Express API strictly rejected sorting by `updatedAt` because it wasn't indexed or exposed in the query parser. We added the column to the frontend and wired the Prisma query engine to correctly handle `sortBy=updatedAt`. | PR #29 |
| **8** | **API Contract Standardization** | *"ไฟล์ api-spec.md ของผมทำไมดูไม่ค่อยละเอียดเท่าไหร่เลย ช่วยวิเคราะห์เทียบกับ Standard REST API ให้หน่อย"*<br><br>*(My API spec looks incomplete. Can you analyze and compare it against standard REST API practices?)* | **Reflection:** I used the AI to self-audit my documentation. It identified missing HTTP status codes and a lack of standardized error envelopes. This led to a complete rewrite of the API Spec to include strict JSON shapes, precise HTTP 400/404/410 semantic meanings, and validation boundaries. | PR #22 |

## 3. Workflow Observation

Rather than treating the AI as a code generator, I treated it as a **Senior Engineer / Reviewer**. 

The AI was most effective when given raw terminal outputs (like Vitest failure logs) or when challenged on its design choices ("Why did you do it this way?"). When tests failed, feeding the AI the exact trace allowed it to navigate from a frontend React test failure, through the API, directly to a Prisma schema constraint. 

This Spec-Driven Development (Spec-DD) approach ensured that the AI didn't just write code, but wrote code that rigidly conformed to the engineering contracts we established in `specification.md` and `api-spec.md`.
