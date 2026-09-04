# Lab 2 AI Use and Reflection

**LLM/AI Assistant Used:** Google Antigravity (Gemini 2.5)

## 1. Selected Key Prompts

| Prompt ID | Phase | Prompt Text | How the AI Helped |
|---|---|---|---|
| 1 | Specification | "Help me extract the business rules and acceptance criteria from this PDF handout and structure them into the Appendix A template." | The AI correctly identified missing rules (e.g., character limits, attachment boundaries) and formatted them properly. |
| 2 | Testing | "I need a test plan that covers these acceptance criteria using TDD. Help me map the UI, API, and E2E tests into a table." | The AI generated the traceability matrix and suggested testing paths I hadn't considered. |
| 3 | Implementation | "Create the API endpoints for Ticket creation and Attachment uploads, enforcing the 5MB and 5-file limits." | It scaffolded the Express backend with Multer for file uploads and Zod for validation. |
| 4 | UI Development | "Help me build the MyTickets page with search, filters, pagination, and sorting using the Zen Green theme from index.css." | The AI generated the responsive data table and successfully integrated debounced search. |
| 5 | E2E Testing | "Write a Playwright test that logs in, creates a ticket with attachments, and then searches for it in My Tickets." | It wrote a complete end-to-end test script that confirmed all features were working correctly. |
| 6 | Refactoring | "Can you check if there are any missing styles compared to the PDF requirement for read-only fields in TicketDetail?" | The AI identified that read-only fields needed a specific soft gray-green background and applied `#F4F7F6`. |

## 2. My Reflection

*(Student: Please write a brief paragraph here reflecting on your experience using the AI coding agent. For example, did it speed up your work? Did you have to correct its mistakes? Did it help you understand the requirements better?)*

Overall, working with the AI agent was...
