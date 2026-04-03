---
description: 'Add a new feature end-to-end: outline, plan, code, test, fix bugs, and write docs'
agent: 'agent'
argument-hint: 'Describe the feature you want to add...'
---

# Feature Implementation Workflow for Vibe Coded Projects

This document outlines the standard approach for adding new features to this project. Follow these steps to ensure consistency, quality, and maintainable code.

# 1. Understanding the Requirements

- **Define the Feature:** input from the user will be a one or two-sentence description of the goal.
- **Ask Clarifying Questions:** If any part of the requirement is ambiguous or if more detail is needed to proceed, please ask for clarification before starting.

# 2. Exploring the Existing Codebase

- **The "Agent" Folder:** Always check the `/agent` directory first. It contains pertinent information, project history, and notes from previous sessions (e.g., `plan.md`, `specs.md`, `context.md`, `agent_notes.md`). If one doesn't exist, create it.
- **Blank Repo Scaffolding:** If this is the first feature in a blank repository, initialize based on the project type:
  - **Simple Utility:** A single `index.html` file containing HTML, CSS, and JS, designed to run directly from a folder. Include a basic `README.md`.
  - **Vite Stack:** Initialize a Node.js/npm project using Vite. Structure should include `src/`, `test/`, and `dist/`. Clarify with the user if documentation (VitePress) is required.
- **Analyze Existing Code:** Identify relevant files, trace data flow, and review existing tests. Focus only on the parts of the codebase necessary for the new feature.

# 3. Planning the Changes

- **Draft a Plan:** List the specific files to be modified, new files to be created, and how these changes interact with the existing system.
- **Human-Centric Organization:** Ensure the plan for the `src` directory results in code that is organized, named, and structured logically for a human developer to review.
- **Confirm the Plan:** Present the plan and ask for confirmation or clarifying details before moving to implementation.

# 4. Implementing the Changes

- **Incremental Build:** Execute the implementation phase based on the stages outlined in the plan.
- **Autonomy:** The agent has the lead on the implementation details, provided the code remains clean and human-readable.

# 5. Testing

- **Test-Driven Mentality:** Tests are the definition of expected behavior.
- **Coverage:** Aim for full unit test coverage for every new function written.
- **Levels of Testing:** 
  - Unit tests for components.
  - Integration tests for interconnected parts.
  - Update or create End-to-End (E2E) tests based on the project's current phase.
- **Iterate on Code, Not Tests:** If a test fails, modify the code to meet the requirement. Do not change the test to match the code's current behavior unless the requirement itself has changed. Ask the user if the desired outcome is unclear.

# 6. Updating Documentation

- **Agent Files:** Update `plan.md`, `specs.md`, or `agent_notes.md` with the latest functionality and insights that would help future agents get up to speed.
- **Project Docs:** Update the project’s documentation if it exists.
- **Concise README:** Update the `README.md` to be developer-focused and as concise as possible. Include:
  - Brief project description.
  - Installation instructions.
  - Key features/API overview.
- **Commit Message:** Provide a final, one-line summary sentence that can be used as a GitHub commit message for the entire feature.
