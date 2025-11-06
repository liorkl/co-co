#!/usr/bin/env node

/**
 * Generate PR description from current branch changes
 * Usage: node scripts/generate-pr-description.js [base-branch]
 * Default base branch: main
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BASE_BRANCH = process.argv[2] || 'main';
const PR_TEMPLATE_PATH = path.join(__dirname, '../.github/pull_request_template.md');

function exec(command, options = {}) {
  try {
    return execSync(command, { encoding: 'utf-8', ...options }).trim();
  } catch (error) {
    return '';
  }
}

function getCurrentBranch() {
  return exec('git branch --show-current');
}

function getCommits(baseBranch, currentBranch) {
  const commits = exec(`git log --oneline ${baseBranch}..${currentBranch}`);
  return commits.split('\n').filter(Boolean);
}

function getCommitDetails(baseBranch, currentBranch) {
  // Use --pretty=format with proper escaping
  const commits = exec(`git log --pretty=format:"%H|%s|%b" ${baseBranch}..${currentBranch}`, { shell: true });
  return commits.split('\n').filter(Boolean).map(line => {
    const parts = line.split('|');
    const hash = parts[0] || '';
    const subject = parts[1] || '';
    const body = parts.slice(2).join('|') || '';
    return { hash, subject, body };
  });
}

function getChangedFiles(baseBranch, currentBranch) {
  const files = exec(`git diff --name-status ${baseBranch}..${currentBranch}`);
  return files.split('\n').filter(Boolean);
}

function getFileStats(baseBranch, currentBranch) {
  const stats = exec(`git diff --stat ${baseBranch}..${currentBranch}`);
  return stats;
}

function analyzeBranchName(branchName) {
  const parts = branchName.split('/');
  if (parts.length < 2) return { type: 'other', what: branchName };
  
  const type = parts[0];
  const rest = parts.slice(1).join('/');
  
  // Try to extract "what" and "why" from branch name
  const whatWhy = rest.split('-');
  const what = whatWhy.slice(0, -1).join('-') || rest;
  const why = whatWhy[whatWhy.length - 1] || '';
  
  return { type, what, why, full: branchName };
}

function determineChangeType(files) {
  const fileTypes = {
    docs: 0,
    test: 0,
    code: 0,
    config: 0,
  };
  
  files.forEach(file => {
    const fileName = file.split('\t')[1] || file;
    if (fileName.includes('CONTRIBUTING') || fileName.includes('README') || 
        fileName.includes('.md') || fileName.includes('docs/')) {
      fileTypes.docs++;
    } else if (fileName.includes('test') || fileName.includes('.test.') || fileName.includes('.spec.')) {
      fileTypes.test++;
    } else if (fileName.includes('.json') || fileName.includes('.yml') || fileName.includes('.yaml') || 
               fileName.includes('config')) {
      fileTypes.config++;
    } else {
      fileTypes.code++;
    }
  });
  
  const types = [];
  if (fileTypes.docs > 0) types.push('Documentation update');
  if (fileTypes.test > 0) types.push('New feature'); // Tests usually accompany features
  if (fileTypes.code > 0 && fileTypes.docs === 0) types.push('New feature');
  if (fileTypes.config > 0) types.push('Configuration change');
  
  return types.length > 0 ? types[0] : 'Code change';
}

function runTests() {
  console.log('🧪 Running tests...');
  try {
    // Check if test script exists first
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8'));
    if (!packageJson.scripts || !packageJson.scripts.test) {
      console.log('   ℹ️  No test script found');
      return null; // No test script
    }
    
    // Run tests silently
    execSync('npm test', { stdio: 'pipe', encoding: 'utf-8' });
    console.log('   ✅ Tests passed');
    return true;
  } catch (error) {
    console.log('   ❌ Tests failed');
    return false; // Test script exists but failed
  }
}

function runCIVerify() {
  console.log('🔍 Running CI verification...');
  try {
    // Run CI checks silently
    execSync('npm run ci:verify', { stdio: 'pipe', encoding: 'utf-8' });
    console.log('   ✅ CI checks passed');
    return true;
  } catch (error) {
    console.log('   ❌ CI checks failed');
    return false;
  }
}

function generateDescription(branchInfo, commits, files, stats, testsPassed, ciPassed) {
  const branchName = branchInfo.full;
  const changeType = determineChangeType(files);
  const commitDetails = getCommitDetails(BASE_BRANCH, getCurrentBranch());
  
  // Group files by type
  const docsFiles = files.filter(f => {
    const fileName = f.split('\t')[1] || f;
    return fileName.includes('.md') || fileName.includes('CONTRIBUTING') || fileName.includes('README');
  });
  const codeFiles = files.filter(f => {
    const fileName = f.split('\t')[1] || f;
    return !fileName.includes('.md') && !fileName.includes('CONTRIBUTING') && !fileName.includes('README');
  });
  
  let description = `## Description\n\n`;
  
  // Generate description based on branch type and commit messages
  const firstCommit = commitDetails[0];
  if (firstCommit) {
    const commitType = firstCommit.subject.split(':')[0].toLowerCase();
    const commitMessage = firstCommit.subject.split(':').slice(1).join(':').trim();
    
    if (commitType.includes('fix')) {
      description += `This PR fixes ${commitMessage || branchInfo.what.replace(/-/g, ' ')}.\n\n`;
    } else if (commitType.includes('feat')) {
      description += `This PR adds ${commitMessage || branchInfo.what.replace(/-/g, ' ')}.\n\n`;
    } else if (commitType.includes('docs')) {
      description += `This PR updates documentation: ${commitMessage || branchInfo.what.replace(/-/g, ' ')}.\n\n`;
    } else if (commitType.includes('refactor')) {
      description += `This PR refactors ${commitMessage || branchInfo.what.replace(/-/g, ' ')}.\n\n`;
    } else {
      description += `This PR implements ${commitMessage || branchInfo.what.replace(/-/g, ' ')}.\n\n`;
    }
  } else {
    // Fallback to branch name analysis
    if (branchInfo.type === 'fix') {
      description += `This PR fixes ${branchInfo.what.replace(/-/g, ' ')}.\n\n`;
    } else if (branchInfo.type === 'feat' || branchInfo.type === 'feature') {
      description += `This PR adds ${branchInfo.what.replace(/-/g, ' ')}.\n\n`;
    } else if (branchInfo.type === 'docs') {
      description += `This PR updates documentation: ${branchInfo.what.replace(/-/g, ' ')}.\n\n`;
    } else if (branchInfo.type === 'refactor') {
      description += `This PR refactors ${branchInfo.what.replace(/-/g, ' ')}.\n\n`;
    } else {
      description += `This PR implements changes for ${branchInfo.what.replace(/-/g, ' ')}.\n\n`;
    }
  }
  
  // Add key changes from commit messages
  if (commitDetails.length > 0) {
    description += `**Key changes:**\n`;
    const validCommits = commitDetails.filter(c => c.subject && c.subject.trim());
    validCommits.slice(0, 5).forEach(commit => {
      // Extract message after type: prefix
      let message = commit.subject;
      if (commit.subject.includes(':')) {
        message = commit.subject.split(':').slice(1).join(':').trim();
      }
      if (message) {
        description += `- ${message}\n`;
      }
    });
    if (validCommits.length > 5) {
      description += `- ... and ${validCommits.length - 5} more commit(s)\n`;
    }
    description += `\n`;
  }
  
  description += `## Type of Change\n`;
  description += `- [ ] Bug fix\n`;
  description += `- [ ] New feature\n`;
  description += `- [ ] Breaking change\n`;
  description += `- [ ] Documentation update\n`;
  description += `\n`;
  
  description += `## Changes Made\n\n`;
  
  if (docsFiles.length > 0) {
    description += `### Documentation\n`;
    docsFiles.forEach(file => {
      const fileName = file.split('\t')[1] || file;
      description += `- ${fileName}\n`;
    });
    description += `\n`;
  }
  
  if (codeFiles.length > 0) {
    description += `### Code Changes\n`;
    codeFiles.slice(0, 10).forEach(file => {
      const fileName = file.split('\t')[1] || file;
      description += `- ${fileName}\n`;
    });
    if (codeFiles.length > 10) {
      description += `- ... and ${codeFiles.length - 10} more file(s)\n`;
    }
    description += `\n`;
  }
  
  if (stats) {
    description += `### Statistics\n\`\`\`\n${stats}\n\`\`\`\n\n`;
  }
  
  description += `## Testing\n`;
  
  // Tests pass locally - auto-check if tests exist and pass
  if (testsPassed === true) {
    description += `- [x] Tests pass locally ✅ (automated verification)\n`;
  } else if (testsPassed === false) {
    description += `- [ ] Tests pass locally ❌ (failed - please fix)\n`;
  } else {
    description += `- [ ] Tests pass locally (no test script found)\n`;
  }
  
  // Manual testing - always manual
  description += `- [ ] Manual testing completed\n`;
  
  // CI checks - auto-check if passes
  if (ciPassed) {
    description += `- [x] CI checks pass ✅ (automated verification)\n`;
  } else {
    description += `- [ ] CI checks pass ❌ (failed - run \`npm run ci:verify\` to fix)\n`;
  }
  description += `\n`;
  
  description += `## Checklist\n`;
  description += `- [ ] Code follows project style guidelines\n`;
  description += `- [ ] Self-review completed\n`;
  description += `- [ ] Comments added for complex code\n`;
  description += `- [ ] Documentation updated (if applicable)\n`;
  
  return description;
}

function main() {
  const currentBranch = getCurrentBranch();
  
  if (!currentBranch) {
    console.error('❌ Not in a git repository or no branch checked out');
    process.exit(1);
  }
  
  if (currentBranch === BASE_BRANCH) {
    console.error(`❌ Cannot generate PR description: already on ${BASE_BRANCH} branch`);
    console.error(`   Please checkout a feature branch first`);
    process.exit(1);
  }
  
  console.log(`📝 Generating PR description for branch: ${currentBranch}`);
  console.log(`   Comparing against: ${BASE_BRANCH}\n`);
  
  const branchInfo = analyzeBranchName(currentBranch);
  const commits = getCommits(BASE_BRANCH, currentBranch);
  const files = getChangedFiles(BASE_BRANCH, currentBranch);
  const stats = getFileStats(BASE_BRANCH, currentBranch);
  
  if (commits.length === 0) {
    console.error(`❌ No commits found between ${BASE_BRANCH} and ${currentBranch}`);
    console.error(`   Make sure you have commits in your branch`);
    process.exit(1);
  }
  
  // Run automated checks before generating description
  console.log('🔍 Running automated verification checks...\n');
  const testsPassed = runTests();
  const ciPassed = runCIVerify();
  console.log(''); // Empty line after checks
  
  const description = generateDescription(branchInfo, commits, files, stats, testsPassed, ciPassed);
  
  // Write to file
  const outputPath = path.join(__dirname, '../PR_DESCRIPTION.md');
  fs.writeFileSync(outputPath, description, 'utf-8');
  
  console.log('✅ PR description generated!');
  console.log(`📄 Saved to: ${outputPath}\n`);
  console.log('---\n');
  console.log(description);
  console.log('\n---');
  console.log(`\n💡 Copy the content above or from ${outputPath} into your GitHub PR description`);
}

main();

