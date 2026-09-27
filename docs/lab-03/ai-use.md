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
| **1** | **Session & Cookie Security** | *"แกช่วยทำระบบ Login โดยใช้ Cookie Session ให้หน่อย เอาแบบปลอดภัยๆ แล้วผูกเข้ากับ AuthContext ใน React เลยนะ"*<br><br>*(Can you build the Login system using Cookie Sessions? Make it secure and hook it into React's AuthContext.)* | **Reflection:** Prompted the AI to design a robust session layer. It configured `HttpOnly` and `SameSite` attributes correctly on the server, significantly reducing XSS vulnerabilities. | PR #43 |
| **2** | **Refactoring Legacy State** | *"ช่วยลบไอ้ mock RequesterContext เก่าๆ ทิ้งที แล้วแก้หน้า MyTickets กับ CreateTicket ให้ไปดึงข้อมูลจาก Session จริงๆ แทน"*<br><br>*(Please remove the old mock RequesterContext and fix MyTickets/CreateTicket to fetch from the real Session instead.)* | **Reflection:** A complex migration. The AI successfully purged the simulated X-Requester-Id headers and wired the Axios interceptors to rely on cookies. It required some manual verification, but vastly accelerated the refactor. | PR #45 |
| **3** | **Responsive Table/Card UX** | *"หน้า IT Staff Queue ขอแบบมีค้นหา เรียงข้อมูล แล้วก็แบ่งหน้า (Pagination) จากฝั่ง Server เลยนะ อ้อ แล้วถ้าเปิดในมือถือต้องสลับเป็นแบบ Card ด้วยนะ ไม่เอาตารางพังๆ"*<br><br>*(For the IT Staff Queue, I need server-side searching, sorting, and pagination. Oh, and it must switch to a Card layout on mobile, no broken tables.)* | **Reflection:** The AI implemented a hybrid approach using `useMediaQuery` to toggle between a standard HTML table on desktop and a densely packed card layout on mobile, maintaining data parity across viewports. | PR #47 |
| **4** | **Complex Form Validation** | *"ทำหน้า User Management ของแอดมินให้หน่อย ให้มันเพิ่ม ลบ แก้ไขข้อมูลได้ แต่เดี๋ยวก่อน! ต้องห้ามให้แอดมินคนสุดท้ายถูกปิดใช้งาน (Deactivate) เด็ดขาดนะ"*<br><br>*(Build the Admin User Management page for CRUD operations. But wait! You must strictly prevent the last active administrator from being deactivated.)* | **Reflection:** The AI scaffolded the modals efficiently. However, it initially missed the requirement to prevent deactivating the final active administrator. I had to guide it to enforce this business rule strictly on the backend. | PR #49 |
| **5** | **Authorization Middleware** | *"ตอนนี้พวก API หลังบ้านมันเข้าถึงได้หมดเลย แกช่วยเขียน Middleware มาดัก role หน่อยได้ไหม พวก /api/admin กับ /api/staff อะ ห้ามคนอื่นเข้านะ"*<br><br>*(Right now the backend APIs are accessible to anyone. Can you write a role-based Middleware to block unauthorized access to /api/admin and /api/staff?)* | **Reflection:** The AI wrote a very clean `requireRole` middleware. This centralized the security logic, making it easy to sweep the entire API and ensure no endpoint leaked data to unauthorized users. | PR #52 |
| **6** | **E2E Flakiness & Locators** | *"เทสต์ E2E พังยับเลยตอนสลับไปหน้า Queue มันหาป้าย 'Unassigned' ไม่เจอ แล้วก็เรื่องเรียงข้อมูลด้วย แกช่วยแก้ locator ให้มันแม่นๆ กว่านี้หน่อย"*<br><br>*(The E2E tests are failing massively on the Queue page. It can't find the 'Unassigned' badge and the sorting assertions are failing. Can you make the locators more precise?)* | **Reflection:** The AI demonstrated an impressive ability to read Playwright traces and DOM structures. It tightened the locators, making the tests much more resilient to minor UI changes. | PR #52 |
| **7** | **Visual Theme Consistency** | *"เห้ย แกทำไมป้ายสถานะ Closed มันเป็นสีเขียวเหมือน Resolved เลยอะ มันจะงงนะ เปลี่ยนให้มันเป็นสีเทา (badge-zen-secondary) ให้เหมือนกันทุกหน้าเลย"*<br><br>*(Hey, why is the 'Closed' badge green just like 'Resolved'? That's confusing. Change it to grey (badge-zen-secondary) consistently across all pages.)* | **Reflection:** The AI utilized project-wide search to locate all instances where badge colors were hardcoded, consolidating them into a single utility mapping function. | PR #53 |
| **8** | **Exhaustive QA Automation** | *"ไปเขียนสคริปต์ Playwright มาแคปรูปส่งจารย์ที ขอทุกหน้าของฝั่งแอดมินเลยนะ รวมถึงตอนที่มันพยายามจะปิดใช้งานตัวเองแล้วโดนบล็อคด้วย เอาให้ครบ!"*<br><br>*(Write a Playwright script to capture screenshots for the professor. I need every state in the Admin flow, including the edge case where self-deactivation is blocked. Make it exhaustive!)* | **Reflection:** The AI saved hours of manual QA. By scripting the exact edge cases, it proved that the system correctly blocks invalid actions at the UI level, generating perfect artifacts for final review. | PR #53 |

## 3. Workflow Observation

Rather than treating the AI as a code generator, I treated it as a **Senior Engineer / Reviewer**. 

The AI was most effective when given raw terminal outputs (like Playwright failure logs) or when challenged on its design choices ("Why did you map Closed to Green?"). When tests failed, feeding the AI the exact trace allowed it to navigate from a frontend React test failure, through the API, directly to a Prisma schema constraint. 

This Spec-Driven Development (Spec-DD) approach ensured that the AI didn't just write code, but wrote code that rigidly conformed to the engineering contracts we established in `specification.md` and `api-spec.md`.
