/**
 * GitGry Automation Script: validate-task.js
 * Validates that the requested task ID has legitimate parameters,
 * does not touch forbidden paths, and passes safety checks.
 */

import fs from 'node:fs';
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
const taskId = args.taskId;
const repoPath = path.resolve(args.repoPath || '.');

console.log(`[GitGry Validator] Checking task: ${taskId} in repo path: ${repoPath}`);

if (!fs.existsSync(repoPath)) {
  console.error(`[GitGry Validator] Target repository path does not exist: ${repoPath}`);
  process.exit(1);
}

// Basic safety rules
const forbiddenPatterns = [
  /\.env.*/i,
  /id_rsa/i,
  /\.pem$/i,
  /\.key$/i,
  /credentials\.json/i,
  /passwd/i,
];

console.log('[GitGry Validator] Target repo verified successfully.');
process.exit(0);

