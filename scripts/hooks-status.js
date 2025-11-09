#!/usr/bin/env node
const { existsSync, readFileSync } = require('fs');
const { spawnSync } = require('child_process');
const path = require('path');

const repoRoot = process.cwd();
const gitDir = path.join(repoRoot, '.git');

if (!existsSync(gitDir)) {
  console.log('ℹ️  Not inside a git repository (.git directory missing).');
  process.exit(0);
}

const hooksPathResult = spawnSync('git', ['config', '--path', 'core.hooksPath'], {
  encoding: 'utf8'
});
const customHooksPath =
  hooksPathResult.status === 0 ? hooksPathResult.stdout.trim() : '';

const hooksDir = customHooksPath || path.join(gitDir, 'hooks');
const prePushHook = path.join(hooksDir, 'pre-push');
const HOOK_MARKER = '# Git pre-push hook to auto-generate PR description';

console.log(`🔍 Checking git hook status (hooks directory: ${hooksDir})`);

if (!existsSync(hooksDir)) {
  console.log('❌ Hooks directory does not exist.');
  console.log('   Run `npm run setup:hooks` to install project hooks.');
  process.exit(0);
}

if (!existsSync(prePushHook)) {
  console.log('⚠️  No pre-push hook detected.');
  console.log('   Run `npm run setup:hooks` to install it.');
  process.exit(0);
}

try {
  const contents = readFileSync(prePushHook, 'utf8');
  if (contents.includes(HOOK_MARKER)) {
    console.log('✅ Pre-push hook installed and managed by scripts/setup-git-hooks.sh');
  } else {
    console.log('⚠️  Pre-push hook exists but is not the managed version.');
    console.log('   Review scripts/git-hooks/pre-push and merge manually if needed.');
  }
} catch (err) {
  console.log(`⚠️  Unable to read pre-push hook: ${err.message}`);
}

