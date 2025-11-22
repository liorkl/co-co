# Task Management Guide

This guide explains how to manage tasks, backlog, and work items in the FounderFinder project using GitHub Issues and Projects.

## Quick Start

### Initial Setup

1. **Set up labels and project board:**
   ```bash
   npm run task:setup
   ```

2. **Create your project board** (one-time, manual):
   - Go to: https://github.com/liorkl/co-co/projects/new
   - Choose "Board" template
   - **Name:** `Co-Co Backlog` (current project name)
     - Alternative names: `FounderFinder Backlog`, `Development Board`, `Sprint Board`, `Product Backlog`
   - Add columns: Backlog → In Progress → Review → Done

## Task Lifecycle

```
Backlog → In Progress → Review → Done
   ↓          ↓            ↓        ↓
  Issues    Active     PR Open   Merged
```

## Creating Tasks

### Using Script (Recommended)

```bash
# Create a feature task
npm run task:create "Add user profile editing" \
  "Allow users to update their profiles after onboarding" \
  type:feature priority:high size:medium status:backlog

# Create a bug task
npm run task:create "Fix login redirect" \
  "Users are redirected to wrong page after login" \
  type:bug priority:critical size:small status:backlog
```

### Using GitHub UI

1. Go to: https://github.com/liorkl/co-co/issues/new
2. Choose template (Bug Report or Feature Request)
3. Fill in details
4. Add labels: `type:feature`, `priority:high`, `status:backlog`
5. Submit

## Updating Tasks

### Update Status

```bash
# Start working (move from backlog to in-progress)
npm run task:update 5 --status in-progress

# Create PR (move to review)
npm run task:update 5 --status review

# Complete (after PR merge)
npm run task:update 5 --status done
```

### Update Priority

```bash
# Change priority
npm run task:update 5 --priority high
npm run task:update 5 --priority critical
```

### Add Labels

```bash
# Add labels
npm run task:update 5 --add-label type:feature --add-label size:large
```

### Assign Tasks

```bash
# Assign to yourself
npm run task:update 5 --assign liorkl

# Add comment
npm run task:update 5 --comment "Starting work on this"
```

## Listing Tasks

### List by Status

```bash
# Show in-progress tasks
npm run task:list --status in-progress

# Show high priority tasks
npm run task:list --priority high

# Show all tasks assigned to you
npm run task:list --assignee liorkl

# Show all open tasks
npm run task:list --all
```

### Using GitHub UI

- **All issues:** https://github.com/liorkl/co-co/issues
- **Filter by label:** Add `label:priority:high` to search
- **Filter by assignee:** Add `assignee:liorkl` to search

## Labels Reference

### Priority Labels

- `priority:critical` - Must fix immediately
- `priority:high` - Important, do soon
- `priority:medium` - Normal priority
- `priority:low` - Nice to have

### Type Labels

- `type:feature` - New feature
- `type:bug` - Bug fix
- `type:chore` - Maintenance task
- `type:docs` - Documentation
- `type:refactor` - Code refactoring
- `type:test` - Test improvements
- `type:ci` - CI/CD changes
- `type:infra` - Infrastructure

### Status Labels

- `status:backlog` - In backlog (not started)
- `status:in-progress` - Currently working on
- `status:review` - In code review
- `status:blocked` - Blocked by dependency
- `status:done` - Completed

**Note:** The `status:todo` label exists but isn't needed for the simplified workflow. All unstarted items use `status:backlog`.

### Size Labels

- `size:small` - < 1 day
- `size:medium` - 1-3 days
- `size:large` - 3+ days
- `size:epic` - Multiple sprints

## Workflow Examples

### Starting Work on a Task

```bash
# 1. Find a task
npm run task:list --status backlog --priority high

# 2. Move to in-progress
npm run task:update 5 --status in-progress --assign liorkl

# 3. Create branch (link to issue)
git checkout -b feat/user-profile-add-editing-to-enable-updates
# In PR description, add: "Closes #5"

# 4. Work on task...

# 5. Create PR (auto-moves to Review)
git push && npm run pr:create
```

### Completing a Task

```bash
# 1. PR is merged (auto-closes issue)

# 2. Move to done (if not auto-closed)
npm run task:update 5 --status done

# 3. Issue is archived after 30 days (auto-configured)
```

### Blocking a Task

```bash
# Mark as blocked
npm run task:update 5 --status blocked --comment "Waiting on API changes in #10"
```

## Project Board Management

### Manual Updates

1. Go to: https://github.com/liorkl/co-co/projects
2. Drag issues between columns
3. Issues automatically sync with labels

### Auto-Updates

- **PR Created** → Issue moves to "Review" column (or update manually with `--status review`)
- **PR Merged** → Issue auto-closes and moves to "Done" column
- **Issue Closed** → Issue archived after 30 days

## Best Practices

1. **One issue per task** - Don't mix multiple tasks in one issue
2. **Use descriptive titles** - Clear, actionable titles
3. **Add context** - Include problem statement, proposed solution
4. **Link related issues** - Use `Closes #5`, `Related to #10`
5. **Update status regularly** - Keep status current
6. **Use labels consistently** - Follow label conventions
7. **Close when done** - Don't leave issues open indefinitely
8. **Review backlog weekly** - Prioritize and plan

## Integration with PRs

### Linking Issues to PRs

In PR description or commit message:
```
Closes #5
Fixes #10
Related to #15
```

### Auto-Labeling PRs

PRs are automatically labeled based on:
- Branch name prefix (`feat/` → `type:feature`)
- Files changed (test files → `type:test`)

### Status Updates

- **PR Created** → Issue status → `status:review`
- **PR Merged** → Issue → Closed
- **PR Closed** → Issue status → `status:backlog` (if not merged)

## NPM Scripts

Add these to `package.json`:

```json
{
  "scripts": {
    "task:setup": "./scripts/setup-task-management.sh",
    "task:create": "./scripts/task-create.sh",
    "task:update": "./scripts/task-update.sh",
    "task:list": "./scripts/task-list.sh"
  }
}
```

## Troubleshooting

### Labels Not Found

```bash
# Re-run setup
npm run task:setup
```

### Can't Create Issues

- Check GitHub authentication: `gh auth status`
- Verify repository access
- Check GitHub CLI is installed: `gh --version`

### Project Board Not Updating

- Ensure issues are linked to project board
- Check project board settings for auto-archive
- Manually drag issues to correct columns

## Advanced Usage

### Query Examples

```bash
# High priority bugs in backlog
gh issue list --label "priority:high,type:bug,status:backlog"

# In-progress features
gh issue list --label "status:in-progress,type:feature"

# Unassigned tasks
gh issue list --no-assignee --label "status:backlog"
```

### Bulk Operations

```bash
# Update multiple issues
for issue in 5 6 7; do
  npm run task:update $issue --status todo
done
```

## Resources

- [GitHub Issues Docs](https://docs.github.com/en/issues)
- [GitHub Projects Docs](https://docs.github.com/en/issues/planning-and-tracking-with-projects)
- [GitHub CLI Docs](https://cli.github.com/manual/)

