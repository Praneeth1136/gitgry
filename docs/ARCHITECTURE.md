# GitGry Architecture Documentation

GitGry (GitHub Activity Manager) is a platform for legitimate repository maintenance and consistent development activity. It coordinates automated repository analysis, task approval, and isolated execution via GitHub Actions cloud runners.

## High-Level System Architecture

```
+----------------------------------------------------------------+
|                        React Frontend                          |
|    - Dashboard, Repositories, Approvals, Schedules, Analytics  |
|    - Dark-first SaaS UI, Tailwind CSS, TanStack Query, Recharts|
+-------------------------------+--------------------------------+
                                |
                                | REST API + Session Cookies (HTTP-only)
                                v
+----------------------------------------------------------------+
|                    Express.js Backend API                      |
|    - OAuth Authentication & AES-256-GCM Token Encryption       |
|    - Repository Inspection & Maintenance Task Planner          |
|    - Approval Workflow Engine & Schedule Timezone Converter    |
|    - GitHub API Gateway (REST & Workflow Dispatch)             |
+---------------+---------------+----------------+---------------+
                |               |                |
                v               v                v
        +---------------+ +-----------+ +--------------------+
        | MongoDB Atlas | | GitHub    | | GitHub Actions     |
        |               | | REST API  | | Cloud Runner       |
        | - Users       | | & OAuth   | | (Isolated Env)     |
        | - Repos       | +-----------+ +---------+----------+
        | - Tasks       |                         |
        | - Executions  |                         v
        | - Schedules   |               +--------------------+
        | - Config      |               | Target User Repos  |
        +---------------+               | (Legitimate Commits|
                                        |  only)             |
                                        +--------------------+
```

## Core Architectural Guarantees

1. **No Artificial Activity / No Empty Commits:**
   GitGry enforces strict diff inspection. If an automated task produces no meaningful, valid file modifications or fails validation, execution halts without creating a commit.

2. **Decoupled Cloud Execution:**
   The Express backend never acts as an unconfined shell executor. Approved tasks are dispatched to GitHub Actions (`workflow_dispatch`), running in a sandboxed, ephemeral Ubuntu runner with least-privilege tokens.

3. **Multi-Stage Engine:**
   - **Stage A (Analysis & Planning):** Analyzes repositories for legitimate hygiene opportunities (formatting, docs, `.editorconfig`, secret protection in `.gitignore`, dependency configs).
   - **Stage B (Review & Approval):** Generates structured diffs with risk ratings (`low`, `medium`, `high`) requiring human review by default.
   - **Stage C (Cloud Dispatch & Verification):** Executes only approved changes, performs post-execution safety verification, and syncs execution records.

4. **Security & Cryptography:**
   - GitHub Access Tokens are never returned to the frontend or stored in plain text.
   - Tokens are encrypted at rest using AES-256-GCM with authenticated verification tags.
   - All client sessions use signed, HTTP-only, SameSite cookies with CSRF validation.

