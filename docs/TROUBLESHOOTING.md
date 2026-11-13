# GitGry Troubleshooting Guide

## Common Issues & Resolutions

### 1. GitHub OAuth Redirect Mismatch / 400 Error
- **Symptom:** GitHub reports `redirect_uri_mismatch`.
- **Cause:** The authorization callback URL configured in your GitHub OAuth App does not match `http://localhost:5000/api/auth/github/callback`.
- **Resolution:** Open GitHub Developer Settings -> OAuth Apps -> GitGry, and ensure the callback URL is set to `http://localhost:5000/api/auth/github/callback`.

### 2. MongoDB Connection Timeout
- **Symptom:** `MongoServerSelectionError` or connection timeout.
- **Cause:** IP address not whitelisted in MongoDB Atlas Network Access.
- **Resolution:** In MongoDB Atlas, go to **Network Access** -> **Add IP Address** -> Select **Allow Access From Anywhere** (`0.0.0.0/0`) for development.

### 3. GitHub Actions Dispatch Fails (404 or 403)
- **Symptom:** `workflow_dispatch` API call returns 404 or 403.
- **Cause:** 
  1. The workflow `.github/workflows/repository-maintenance.yml` is not yet merged into the default branch of the automation repository. GitHub Actions requires the workflow file to exist on the default branch before it can be triggered by `workflow_dispatch`.
  2. The PAT or GitHub token lacks `workflow` and `repo` scopes.
- **Resolution:** Push the workflow file to your default branch (`main`) and ensure your token has `workflow` permissions.

