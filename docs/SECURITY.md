# GitGry Security Architecture

GitGry is engineered to manage code automation safely, preventing unauthorized commits, arbitrary code execution, and credential exposure.

## 1. Credential Security & Encryption at Rest
- GitHub OAuth access tokens are encrypted before saving to MongoDB using **AES-256-GCM** with authenticated encryption tags.
- Tokens are never logged, never returned in API payloads, and never stored in client-accessible storage (such as browser `localStorage`).
- Cookie sessions are signed and set with `HttpOnly`, `SameSite=Lax` (or `Strict`), and `Secure` (in production).

## 2. GitHub Actions Isolation
- All code changes are executed inside ephemeral GitHub Actions runners (`ubuntu-latest`).
- Target repository checkouts use least-privilege tokens.
- Cross-repository access is managed via explicit GitHub Secrets (`CROSS_REPO_PAT` or GitHub App Installation tokens).

## 3. Defense Against Artificial / Unreviewed Commits
- GitGry rejects empty diffs (`git diff --stat` empty check).
- Workflows automatically fail if forbidden secret files (`.env`, `.pem`, private keys, AWS tokens) are detected in the diff.
- Human-in-the-loop approval is enabled by default: each maintenance task must be reviewed and approved by the repository owner before dispatch.

## 4. API & Network Protection
- Express backend is secured with:
  - `helmet` for HTTP security headers (CSP, HSTS, X-Content-Type-Options)
  - `cors` allowlist restricted to the frontend origin
  - `express-rate-limit` for rate limiting API and authentication endpoints
  - Zod schemas validating every incoming payload

