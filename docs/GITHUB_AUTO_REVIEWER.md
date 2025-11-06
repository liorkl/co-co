# GitHub Auto-Reviewer Configuration

This guide explains how to configure automatic reviewer assignment for pull requests.

## Overview

When you use `npm run push` to create a PR, you can automatically assign a reviewer by setting the `GITHUB_AUTO_REVIEWER` environment variable.

## Setup

### Option 1: Environment Variable (Recommended)

Add to your shell profile (`~/.zshrc`, `~/.bashrc`, etc.):

```bash
export GITHUB_AUTO_REVIEWER="username"
```

Then reload your shell:
```bash
source ~/.zshrc  # or source ~/.bashrc
```

### Option 2: Per-Project Configuration

Create a `.env.local` file in the project root (if not already present) and add:

```bash
GITHUB_AUTO_REVIEWER="username"
```

**Note:** The script will read this from your environment, so you may need to source it:
```bash
export $(cat .env.local | grep GITHUB_AUTO_REVIEWER | xargs)
```

### Option 3: Inline Usage

Set it when running the command:

```bash
GITHUB_AUTO_REVIEWER="username" npm run push
```

## Finding Your Username

Your GitHub username is typically:
- Your GitHub profile username (e.g., `liorkl`)
- Can be found at: https://github.com/settings/profile

To check your current username:
```bash
gh api user --jq '.login'
```

## Usage Examples

### Single Reviewer
```bash
export GITHUB_AUTO_REVIEWER="liorkl"
npm run push
```

### Multiple Reviewers (via GitHub API Helper)
If you need multiple reviewers, use the GitHub API helper after PR creation:
```bash
npm run push
./scripts/github-api-helper.sh add-reviewers liorkl collaborator1 collaborator2
```

### Organization Teams
For organization teams, use the team slug:
```bash
export GITHUB_AUTO_REVIEWER="org-name/team-name"
npm run push
```

## How It Works

1. When you run `npm run push`, the script creates a PR
2. If `GITHUB_AUTO_REVIEWER` is set, it automatically adds that user/team as a reviewer
3. The reviewer will receive a notification to review the PR

## Troubleshooting

### Reviewer Not Added
- **Check username**: Ensure the username is correct (case-sensitive)
- **Check permissions**: The reviewer must have access to the repository
- **Check logs**: The script silently fails if reviewer can't be added (non-blocking)

### Team Not Found
- Use the format: `organization-name/team-slug`
- Verify the team exists and has repository access
- Check team slug at: `https://github.com/orgs/ORG_NAME/teams/TEAM_NAME`

### Environment Variable Not Working
- Verify it's exported: `echo $GITHUB_AUTO_REVIEWER`
- Check shell profile is loaded
- Try setting it inline: `GITHUB_AUTO_REVIEWER="user" npm run push`

## Disabling Auto-Reviewer

To temporarily disable:
```bash
unset GITHUB_AUTO_REVIEWER
npm run push
```

Or remove it from your shell profile and reload.

## Best Practices

1. **Use your own username for solo projects** - Auto-assign yourself to review your own PRs
2. **Use team names for organizations** - Assign entire teams for better coverage
3. **Combine with labels** - Auto-labeling + auto-reviewer = fully automated PR setup
4. **Review the PR anyway** - Auto-reviewer is a convenience, not a replacement for manual review

## Related Features

- **Auto-labeling**: PRs are automatically labeled based on branch type
- **Auto-description**: PR descriptions are auto-generated from commits
- **GitHub MCP**: For AI-driven GitHub operations (see `docs/GITHUB_MCP_SETUP.md`)



