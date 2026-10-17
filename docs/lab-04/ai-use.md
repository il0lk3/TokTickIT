# Lab 4 AI Use & Reflection

A living document recording the key prompts used during Sprint 4 (Actions Taken, Dashboards, and Final Regression). This document demonstrates how AI was utilized as an engineering partner for specification design, concurrency architecture, TDD test authoring, and zero-regression product hardening.

## 1. AI Assistant Details

- **Primary Tool:** Google Antigravity IDE (Gemini)
- **Role:** Specification Agent & Coding Agent
- **Workflow:** Specification-Driven Development (Spec-DD) and Test-Driven Development (TDD). The AI was first tasked with formulating complete, consistent contracts (`specification.md`, `api-spec.md`, `ui-spec.md`, `tests.md`) before writing any application code.

## 2. Selected Key Prompts

| # | Focus Area | Actual Prompt Used | My Reflection & Impact | PR |
|---|---|---|---|---|
| **1** | **Specification Agent** | *"ทำความเข้าใจงานนนี้ ... แกคิดว่าควรมีกี่ issue ... เริ่ม ๆ issue 1 เลยจ้า"*<br><br>*(Understand this assignment, decompose into structured GitHub issues, and draft the complete Sprint 4 engineering contract with transition matrix, resolution gate, optimistic concurrency, and dashboard formulas).* | **Reflection:** Decomposing Sprint 4 into 10 cohesive issues allowed for manageable PR sizes. Working with the AI on the specification forced early architectural decisions: resolving the ambiguous "assignee" terminology in the labsheet by defining Ticket Owner vs Action Performer, and choosing integer `version` over timestamp comparisons for deterministic conflict handling. | PR #1 (Issue 1) |

## 3. Workflow Observation & Reflection (Sprint 4 Initial Reflection)

Using AI as a **Specification Agent** before touching implementation code ensures that requirements, edge cases, and architectural invariants (such as the Resolution Gate and 409 Conflict handling) are codified in advance. By mapping every Acceptance Criterion (AC-01 through AC-13) to planned automated test files in `tests.md`, we establish full traceability from day one, adhering strictly to the KMUTT CPE 334 engineering methodology.
