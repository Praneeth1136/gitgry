# GitGry Setup Guide

This guide walks through configuring GitGry locally and connecting it to GitHub and MongoDB.

## Prerequisites
- Node.js >= 20.x (verified on v26.13.0)
- npm >= 10.x
- MongoDB (local or MongoDB Atlas)
- A GitHub Account

## 1. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in the required variables:
- `MONGODB_URI`: MongoDB connection string.
- `GITHUB_CLIENT_ID`: Your GitHub OAuth App Client ID.
- `GITHUB_CLIENT_SECRET`: Your GitHub OAuth App Client Secret.
- `ENCRYPTION_KEY`: A 64-character hex string (generate using `node -e "console.log(crypto.randomBytes(32).toString('hex'))"`).
- `SESSION_SECRET`: A 64-character random string.

## 2. GitHub OAuth App Setup
1. Visit [GitHub Developer Settings](https://github.com/settings/developers).
2. Click **New OAuth App**.
3. Set **Application Name**: `GitGry`
4. Set **Homepage URL**: `http://localhost:5173`
5. Set **Authorization callback URL**: `http://localhost:5000/api/auth/github/callback`
6. Click **Register Application**, then generate a **Client Secret**.
7. Copy both the Client ID and Client Secret into your `.env` file.

## 3. Installation & Running
Install dependencies:
```bash
npm install
```
Start development servers (backend on 5000, frontend on 5173):
```bash
npm run dev
```

Run tests:
```bash
npm run test
```

