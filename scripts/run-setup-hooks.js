#!/usr/bin/env node
const { existsSync, readFileSync } = require('fs');
const { spawnSync } = require('child_process');
const path = require('path');

const shouldSkip =
  process.env.CI ||
  process.env.SKIP_SETUP_HOOKS ||
  process.env.SKIP_POSTINSTALL ||
  process.env.NPM_CONFIG_GLOBAL;

if (shouldSkip) {
  console.log('ℹ️  Skipping git hook setup (environment opt-out detected).');
  process.exit(0);
}

const repoRoot = process.cwd();
const gitDir = path.join(repoRoot, '.git');
if (!existsSync(gitDir)) {
  console.log('ℹ️  Skipping git hook setup (.git directory not found).');
  process.exit(0);
}

const hooksPathResult = spawnSync('git', ['config', '--path', 'core.hooksPath'], {
  encoding: 'utf8'
});
const customHooksPath =
  hooksPathResult.status === 0 ? hooksPathResult.stdout.trim() : '';

if (customHooksPath) {
  console.log(
    `ℹ️  Skipping git hook setup (custom core.hooksPath detected at ${customHooksPath}).`
  );
  console.log(
    '   Run scripts/setup-git-hooks.sh manually after installing hooks in your configured directory.'
  );
  process.exit(0);
}

const hookScript = path.join(repoRoot, 'scripts', 'setup-git-hooks.sh');
if (!existsSync(hookScript)) {
  console.warn('⚠️  Git hook setup script not found; skipping.');
  process.exit(0);
}

const hooksDir = path.join(gitDir, 'hooks');
const prePushHook = path.join(hooksDir, 'pre-push');
const HOOK_MARKER = '# Git pre-push hook to auto-generate PR description';

if (existsSync(prePushHook)) {
  try {
    const current = readFileSync(prePushHook, 'utf8');
    if (!current.includes(HOOK_MARKER)) {
      console.warn(
        '⚠️  Existing pre-push hook detected and left untouched (not managed by this project).'
      );
      console.warn('   Review scripts/git-hooks/pre-push and merge manually if desired.');
      process.exit(0);
    }
  } catch (err) {
    console.warn(
      `⚠️  Could not inspect existing pre-push hook (${err.message}). Skipping automatic install.`
    );
    console.warn('   Run scripts/setup-git-hooks.sh manually after resolving the issue.');
    process.exit(0);
  }
}

console.log('🔧 Running postinstall git hook setup...');
const result = spawnSync(hookScript, { stdio: 'inherit', shell: true });

if (result.status !== 0) {
  console.warn(
    `⚠️  Git hook setup encountered an error (exit code ${result.status}). Run \`npm run setup:hooks\` manually if needed.`
  );
  process.exit(result.status);
}

console.log('✅ Git hooks installed via postinstall.');

