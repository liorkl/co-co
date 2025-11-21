# Task Management Quick Reference

## 🚀 Initial Setup (One-Time)

```bash
# 1. Set up all labels
npm run task:setup

# 2. Create project board manually:
#    https://github.com/liorkl/co-co/projects/new
#    - Choose "Board" template
#    - Name: "FounderFinder Backlog" (or your preferred name)
#    - Columns: Backlog → In Progress → Review → Done
```

## 📝 Daily Commands

### Create Task
```bash
npm run task:create "Title" "Description" type:feature priority:high status:backlog
```

### Update Task Status
```bash
npm run task:update <issue-number> --status in-progress
npm run task:update <issue-number> --status review
npm run task:update <issue-number> --status done
```

### List Tasks
```bash
npm run task:list --status in-progress
npm run task:list --priority high
npm run task:list --assignee liorkl
```

## 🏷️ Common Label Combinations

### Feature Task
```
type:feature priority:high size:medium status:backlog
```

### Bug Fix
```
type:bug priority:critical size:small status:backlog
```

### Documentation
```
type:docs priority:low size:small status:backlog
```

## 🔄 Typical Workflow

1. **Create task:**
   ```bash
   npm run task:create "Add feature X" "Description" type:feature priority:high status:backlog
   ```

2. **Start work:**
   ```bash
   npm run task:update 5 --status in-progress --assign liorkl
   git checkout -b feat/area-action-context-outcome
   ```

3. **Create PR:**
   ```bash
   git push && npm run pr:create
   # PR auto-moves issue to "Review"
   ```

4. **Complete:**
   ```bash
   # After PR merge, issue auto-closes
   # Or manually: npm run task:update 5 --status done
   ```

## 📊 Status Flow

```
Backlog → In Progress → Review → Done
```

## 🔗 Links

- [Full Guide](./TASK_MANAGEMENT.md)
- [GitHub Issues](https://github.com/liorkl/co-co/issues)
- [GitHub Projects](https://github.com/liorkl/co-co/projects)

