#!/usr/bin/env node
// Simple check script to warn about local env files in repo
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const envLocal = path.join(repoRoot, '.env.local');
const gitIgnore = path.join(repoRoot, '.gitignore');

let warned = false;

if (fs.existsSync(envLocal)) {
  const stat = fs.statSync(envLocal);
  if (stat.size > 0) {
    console.warn('\n⚠️  Warning: .env.local exists in the repository root with size', stat.size, 'bytes.');
    console.warn('  Ensure you do NOT commit real secrets. Add .env.local to .gitignore if not present.');
    warned = true;
  }
}

if (fs.existsSync(gitIgnore)) {
  const content = fs.readFileSync(gitIgnore, 'utf8');
  if (!/\.env(local)?/.test(content)) {
    console.warn('\n⚠️  .gitignore does not appear to ignore .env files.');
    console.warn('  Consider adding `.env.local` and `.env` to .gitignore.');
    warned = true;
  }
}

if (!warned) {
  console.log('\n✅ .env check passed. No obvious local env warnings.');
}
