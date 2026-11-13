/**
 * GitGry Automation Script: execute-maintenance.js
 * Applies approved maintenance changes to the target repository workspace.
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
const repoPath = path.resolve(args.repoPath || '.');

console.log(`[GitGry Maintenance Engine] Applying changes to: ${repoPath}`);

// Standard EditorConfig template
const standardEditorConfig = `root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.md]
trim_trailing_whitespace = false
`;

// Example task runner logic
const editorConfigTarget = path.join(repoPath, '.editorconfig');
if (!fs.existsSync(editorConfigTarget)) {
  fs.writeFileSync(editorConfigTarget, standardEditorConfig, 'utf8');
  console.log(`[GitGry Maintenance Engine] Generated .editorconfig`);
}

// Clean trailing whitespaces in markdown files
const readmePath = path.join(repoPath, 'README.md');
if (fs.existsSync(readmePath)) {
  const original = fs.readFileSync(readmePath, 'utf8');
  const cleaned = original.replace(/[ \t]+$/gm, '').replace(/\r\n/g, '\n');
  if (original !== cleaned) {
    fs.writeFileSync(readmePath, cleaned, 'utf8');
    console.log(`[GitGry Maintenance Engine] Normalized line endings and trailing spaces in README.md`);
  }
}

console.log('[GitGry Maintenance Engine] Execution completed.');
process.exit(0);

