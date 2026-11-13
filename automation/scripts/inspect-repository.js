/**
 * GitGry Automation Script: inspect-repository.js
 * Scans a repository directory to identify legitimate maintenance opportunities:
 * - README markdown formatting / trailing whitespace / missing sections
 * - Missing or outdated .editorconfig
 * - Outdated or missing .gitignore standards
 * - Package.json script consistency
 * - Linting / code formatting opportunities
 */

import fs from 'node:fs';
import path from 'node:path';

export function inspectRepo(repoPath) {
  const findings = [];
  const resolved = path.resolve(repoPath);

  if (!fs.existsSync(resolved)) {
    return { findings, error: 'Path not found' };
  }

  // 1. Check for README.md
  const readmePath = path.join(resolved, 'README.md');
  if (fs.existsSync(readmePath)) {
    const content = fs.readFileSync(readmePath, 'utf8');
    if (/\r\n/.test(content) || /[ \t]+$/m.test(content)) {
      findings.push({
        type: 'lint_format',
        title: 'Normalize README.md Line Endings & Trailing Whitespace',
        file: 'README.md',
        description: 'Clean up trailing whitespace and normalize newline characters for clean cross-platform git diffs.',
        risk: 'low',
      });
    }
  } else {
    findings.push({
      type: 'documentation',
      title: 'Initialize Standard Project README.md',
      file: 'README.md',
      description: 'Add a standard, clean project documentation header with installation and usage instructions.',
      risk: 'low',
    });
  }

  // 2. Check for .editorconfig
  const editorConfigPath = path.join(resolved, '.editorconfig');
  if (!fs.existsSync(editorConfigPath)) {
    findings.push({
      type: 'config_maintenance',
      title: 'Add Recommended .editorconfig for Consistent Formatting',
      file: '.editorconfig',
      description: 'Establish standard 2-space indentation, UTF-8 encoding, and trailing newline trimming across editors.',
      risk: 'low',
    });
  }

  // 3. Check for .gitignore
  const gitignorePath = path.join(resolved, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    if (!gitignoreContent.includes('.env')) {
      findings.push({
        type: 'config_maintenance',
        title: 'Update .gitignore to Safeguard Environment Secrets',
        file: '.gitignore',
        description: 'Explicitly ignore .env and local secret credential files to prevent accidental security leaks.',
        risk: 'low',
      });
    }
  }

  return { findings, total: findings.length };
}

if (process.argv[1] && process.argv[1].endsWith('inspect-repository.js')) {
  const targetDir = process.argv[2] || '.';
  const results = inspectRepo(targetDir);
  console.log(JSON.stringify(results, null, 2));
}

