# AI Usage Log (Lab 3)

**LLM Model Used:** Google Antigravity (Agentic Integrated Development Environment)

## Prompt Engineering Log

1. "Implement the authentication API leveraging cookie-based sessions, and integrate the corresponding logic into a React AuthContext."
2. "Refactor the existing MyTickets and CreateTicket workflows to utilize the newly established authentication session, deprecating the legacy RequesterContext."
3. "Develop the IT Staff Queue interface featuring server-side pagination, search capabilities, and filtering mechanisms, ensuring responsive design principles are applied for mobile viewports."
4. "Construct a User Management dashboard tailored for the Administrator role, facilitating operations such as user creation, modification, and deactivation."
5. "Introduce role-based authorization middleware within the Express architecture to restrict unauthorized access to administrative and staff endpoints."
6. "Resolve the end-to-end testing discrepancies for the staff queue by incorporating assertions for the 'Unassigned' badge state and validating sorting functionalities."
7. "Standardize the 'badge-zen-success' status logic across the application to ensure the 'Closed' status is consistently represented with a secondary thematic color."
8. "Formulate an exhaustive Playwright automation script to generate visual verification artifacts across all User Management states, including edge cases such as self-deactivation prevention."

## Developer Reflection

The utilization of an Agentic Artificial Intelligence significantly alters the software development lifecycle compared to traditional prompt-and-paste paradigms. 

**Advantages:** The agent's capacity to autonomously index the codebase, analyze existing configurations (such as global CSS architectures and component abstractions), and apply targeted modifications directly to the file system drastically reduces boilerplate implementation time. This capability proved exceptionally advantageous during the execution of widespread refactoring tasks, the normalization of end-to-end test locators, and the generation of exhaustive visual automation scripts. The agent demonstrated a strong adherence to predefined structural patterns when provided with adequate context.

**Challenges:** The inherent autonomy of the agent introduces a risk of over-correction. Ambiguous instructions occasionally resulted in modifications beyond the intended scope, such as excessive adjustments to accessibility attributes or inadvertent layout regressions. This necessitates highly precise, constrained prompting (e.g., explicitly delineating the boundaries of a refactoring operation) to mitigate unintended side-effects.

**Conclusion:** Agentic AI serves as a formidable accelerator for software engineering, particularly in generating foundational structures and test coverage. However, the human developer remains the critical domain expert. Comprehensive peer review, architectural oversight, and strict validation against business requirements (e.g., verifying the prevention of the last active administrator deactivation) remain indispensable. The AI accelerates the mechanical aspects of coding, while the developer is ultimately responsible for systemic integrity and architectural coherence.
