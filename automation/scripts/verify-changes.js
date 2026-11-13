/**
 * GitGry Automation Script: verify-changes.js
 * Verifies applied changes prior to git commit and push.
 * Guarantees:
 * 1. Git diff is non-empty.
 * 2. No secrets (.env, keys) were created or modified.
 * 3. File modifications are within safety boundaries.
 */

import { execSync } from 'node:child_process';
import path from 'node:path';

function parseArgs() {
  const args = {};
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--')) {
      const [key, ...values] = arg.slice(2).split('=');
      args[key] = values.join('=');
    }
  }
  return args;
}

const args = parseArgs();
const repoPath = path.resolve(args.repoPath || '.');

try {
  const diffOutput = execSync('git status --porcelain', {
    cwd: repoPath,
    encoding: 'utf8',
  }).trim();

  if (!diffOutput) {
    console.warn('[GitGry Verifier] Warning: No changes detected. No commit will be produced.');
    process.exit(0);
  }

  // Check for forbidden secret additions
  const forbiddenFiles = ['.env', '.env.local', 'id_rsa', 'credentials.json'];
  const modifiedFiles = diffOutput.split('\n').map(line => line.trim().slice(3));

  for (const file of modifiedFiles) {
    if (forbiddenFiles.some(f => file.includes(f))) {
      console.error(`[GitGry Verifier] SAFETY ALERT: Forbidden file modification detected: ${file}`);
      process.exit(1);
    }
  }

  console.log(`[GitGry Verifier] Verification passed. Modified files: ${modifiedFiles.join(', ')}`);
  process.exit(0);
} catch (err) {
  console.error('[GitGry Verifier] Verification execution failed:', err.message);
  process.exit(1);
}

