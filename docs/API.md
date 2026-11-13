# GitGry REST API Specification

All API endpoints are prefixed with `/api`. Responses return consistent JSON objects with `{ success: true, data: ... }` or `{ success: false, error: ... }`.

## Authentication

### `GET /api/auth/github`
Initiates GitHub OAuth flow by generating a secure cryptographically random state parameter and redirecting the browser to GitHub.

### `GET /api/auth/github/callback`
GitHub OAuth redirect handler. Validates state, exchanges authorization code for an access token, stores AES-256-GCM encrypted token in MongoDB, sets an HTTP-only session cookie, and redirects user to `/dashboard`.

### `GET /api/auth/me`
Returns the currently authenticated user's profile and active session status.
- **Auth:** Session cookie required.
- **Returns:** `{ success: true, data: { user: { id, githubId, username, displayName, avatarUrl, email } } }`

### `POST /api/auth/logout`
Clears session cookie and invalidates server-side session.

---

## Repositories

### `GET /api/repositories`
Returns all managed repositories connected by the authenticated user.
- **Query params:** `page`, `limit`, `search`, `visibility`, `enabled`

### `GET /api/repositories/available`
Fetches all repositories available on the user's GitHub account directly via GitHub REST API, filtering out archived and already-managed repositories.

### `POST /api/repositories`
Adds a repository to the user's managed list.
- **Body:** `{ githubRepoId, owner, name, fullName, htmlUrl, defaultBranch, visibility, description }`

### `GET /api/repositories/:id`
Retrieves detailed information for a single managed repository.

### `PATCH /api/repositories/:id`
Updates settings for a repository (e.g. toggles enabled/disabled state).
- **Body:** `{ enabled: boolean }`

### `DELETE /api/repositories/:id`
Removes repository from GitGry management.

### `POST /api/repositories/:id/analyze`
Triggers immediate maintenance analysis for the repository.

---

## Automation & Planning

### `GET /api/automation/config`
Retrieves the user's global automation configuration.

### `PUT /api/automation/config`
Updates automation settings (min/max tasks, timezone, allowed maintenance types, etc.).

### `POST /api/automation/plan`
Generates a new maintenance task plan across enabled repositories for the current day.

### `POST /api/automation/run`
Triggers execution for all approved tasks or queues workflow dispatch.

### `POST /api/automation/pause`
Pauses all automated maintenance routines.

### `POST /api/automation/resume`
Resumes automation routines.

---

## Maintenance Tasks & Approvals

### `GET /api/tasks`
Lists maintenance tasks. Filterable by `status`, `repositoryId`, `riskLevel`.

### `GET /api/tasks/:id`
Retrieves detailed task information including full diff preview and validation checks.

### `POST /api/tasks/:id/approve`
Approves a proposed maintenance task.

### `POST /api/tasks/:id/reject`
Rejects a proposed maintenance task with an optional reason.

### `POST /api/tasks/:id/execute`
Dispatches the approved task directly to GitHub Actions.

---

## Schedules

### `GET /api/schedules`
Lists all recurring schedules created by the user.

### `POST /api/schedules`
Creates a new maintenance schedule with timezone conversion.

### `PATCH /api/schedules/:id`
Updates an existing schedule.

### `DELETE /api/schedules/:id`
Deletes a schedule.

---

## Executions

### `GET /api/executions`
Returns execution history with pagination.

### `GET /api/executions/:id`
Returns execution details including associated task IDs, status, logs, and GitHub workflow run link.

### `POST /api/executions/sync`
Synchronizes status with GitHub Actions workflow run API.

---

## Analytics & Health

### `GET /api/analytics/overview`
Returns high-level statistics: total tasks, approval rate, active repos, recent activity.

### `GET /api/analytics/activity`
Returns daily/weekly maintenance distribution data for Recharts time-series visualization.

### `GET /api/analytics/repositories`
Returns task counts and success rates grouped by repository.

### `GET /api/health`
Health check endpoint reporting API uptime and database connectivity.

