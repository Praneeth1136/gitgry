# GitGry - GitHub Activity Manager

**GitGry** is a full-stack MERN application and cloud execution coordinator for **legitimate repository maintenance and consistent development activity**.

Unlike artificial green-wall generators that produce meaningless commits or empty files, GitGry identifies genuine code hygiene tasks—including whitespace normalization, standard line endings, `.editorconfig` adoption, `.gitignore` secret safeguarding, and documentation improvements—validates the diffs, enforces human-in-the-loop approvals, and executes approved tasks through sandboxed GitHub Actions cloud runners.

---

## 1. Features

- **GitHub OAuth 2.0 Authentication:** Secure session management with HTTP-only, SameSite cookies and cryptographically randomized CSRF state tokens.
- **AES-256-GCM Token Encryption:** GitHub access tokens are encrypted at rest in MongoDB using server-side AES-256-GCM with authenticated verification tags.
- **Multi-Repository Management:** Connect, monitor, and filter public and authorized private GitHub repositories.
- **Intelligent Hygiene Planning:** Discovers genuine maintenance opportunities (line-ending normalization, `.editorconfig` generation, `.gitignore` secret protection, and documentation enhancements).
- **Randomized Target Planning:** Configurable daily target range (e.g., 2–6 tasks) that stops if insufficient legitimate work exists, ensuring zero empty or fabricated commits.
- **Human-in-the-Loop Review:** Dedicated Approval Center with before/after diff previews and risk level analysis (`low`, `medium`, `high`).
- **Cloud Execution via GitHub Actions:** Dispatches approved tasks to isolated Ubuntu runners via `workflow_dispatch`.
- **Scheduled Maintenance Routines:** Daily schedules with automatic timezone conversion and execution previews.
- **Live Execution Audit & Logs:** Full execution history with run logs, duration, and GitHub workflow links.
- **Interactive SaaS Analytics:** Maintenance velocity and repository distribution charts powered by Recharts.
- **Dark-First Developer UI:** Polished interface modeled after modern developer tools (Vercel, Linear).

---

## 2. Technology Stack

- **Frontend:** React 18, Vite, ES Modules, Tailwind CSS, Lucide React, React Router v6, Axios, TanStack Query, Recharts, React Hook Form, Zod.
- **Backend:** Node.js (v20+), Express.js (Modular Monolith, ES Modules), MongoDB Atlas, Mongoose, Axios, Zod, Helmet, Cookie-Parser, Express-Rate-Limit, Pino.
- **Cloud Automation:** GitHub Actions (`workflow_dispatch`), Ubuntu runner, automated diff inspection.
- **Testing:** Vitest, Supertest, React Testing Library, JSDOM.

---

## 3. Architecture

```
React Frontend (Vite)
       │
       │ REST API + HTTP-only Cookie
       ▼
Express.js Monolith API
       ├──────────────► MongoDB Atlas (Encrypted token store & metadata)
       ├──────────────► GitHub REST API (OAuth & repository inspection)
       └──────────────► GitHub Actions API (workflow_dispatch)
                               │
                               ▼
                      GitHub Actions Runner (ubuntu-latest)
                               │
                               ▼
                      Target Repositories (Legitimate reviewable commits)
```

---

## 4. Folder Structure

```
d:\GitGry/
├── client/                     # React Vite Frontend
│   ├── src/
│   │   ├── components/layout/  # Navbar, Sidebar, AppLayout
│   │   ├── context/            # AuthContext (OAuth session state)
│   │   ├── pages/              # Dashboard, Repositories, Details, Automation, etc.
│   │   ├── services/           # Axios API Client
│   │   ├── App.jsx             # React Router routing tree
│   │   └── main.jsx
│   ├── tests/                  # Frontend Vitest test suite
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                     # Express.js Monolithic API
│   ├── src/
│   │   ├── config/             # Environment & MongoDB Atlas connection
│   │   ├── controllers/        # Auth, Repositories, Automation, Tasks, etc.
│   │   ├── middleware/         # Auth, validation, error handler, rate limit
│   │   ├── models/             # Mongoose Models (User, Repo, Task, Execution, etc.)
│   │   ├── routes/             # REST route endpoints
│   │   ├── services/           # GitHub REST & Automation Planning Services
│   │   ├── utils/              # AES-256-GCM crypto & Pino logger
│   │   ├── app.js              # Express app middleware setup
│   │   └── server.js           # Server listen & graceful shutdown
│   └── tests/                  # Crypto, Security, and API tests
│
├── automation/                 # GitHub Actions Cloud Runner
│   ├── .github/workflows/      # repository-maintenance.yml (workflow_dispatch)
│   └── scripts/                # Validation, inspection, execution, and diff verification
│
├── shared/                     # Shared constants & schemas
│   ├── constants/
│   └── schemas/
│
├── docs/                       # Architectural, API, Security, & Setup docs
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── SECURITY.md
│   ├── SETUP.md
│   └── TROUBLESHOOTING.md
│
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 5. Local Setup & Quickstart

### Prerequisites
- Node.js >= 20.x
- npm >= 10.x
- MongoDB (Local or Atlas)
- GitHub OAuth Application

### Step 1: Clone & Configure `.env`
Ensure `.env` exists in the root directory:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:5000

# MongoDB
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/gitgry?retryWrites=true&w=majority

# GitHub OAuth App
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback

# Security (AES-256-GCM 32-byte hex key)
ENCRYPTION_KEY=3055ca5b87484f2264deb65f85307e05b8c82706a7e145b06e7fc1fe2b1a092e
SESSION_SECRET=30d620e7c7aee336f898fad3e1b5081bb3431f116a97071eb1ed7f72adc67f90
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Run Full Test Suite
```bash
npm run test
```
Runs both server (crypto, security, API) and client component tests.

### Step 4: Run Development Environment
```bash
npm run dev
```
Starts:
- **Express Backend:** `http://localhost:5000`
- **React Frontend:** `http://localhost:5173`

---

## 6. GitHub Actions Automation Workflow

The workflow file is located at `automation/.github/workflows/repository-maintenance.yml`.

To deploy:
1. Commit and push `.github/workflows/repository-maintenance.yml` to the default branch (`main`) of your automation repository.
2. In your repository settings under **Secrets and variables > Actions**, configure:
   - `CROSS_REPO_PAT`: A GitHub Personal Access Token (with `repo` and `workflow` scopes) for pushing to target repositories.
   - `GITGRY_API_TOKEN`: Optional callback verification secret.

---

## 7. Security Guarantees

1. **Zero Secret Leaks:** Pre-commit verification scripts (`verify-changes.js`) automatically block commits containing `.env`, `.pem`, `id_rsa`, or credential files.
2. **Zero Empty Commits:** Diff inspection confirms that actual bytes were modified before creating any git commit.
3. **No Unrestricted Code Execution:** No arbitrary user shell execution is permitted; only pre-approved, deterministic maintenance tasks run in sandboxed runners.
4. **OAuth Protection:** CSRF state parameters with 10-minute expiration defend the authentication flow.

---

## 8. License

Distributed under the MIT License.

