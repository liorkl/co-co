#!/bin/bash
# Update a GitHub issue (task)
# Usage: ./scripts/task-update.sh <issue-number> [--status <status>] [--priority <priority>] [--add-label <label>] [--remove-label <label>]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Detect repo info
if repo_info=$(git remote get-url origin 2>/dev/null | sed -E 's|.*github.com[:/]([^/]+)/([^/]+)\.git|\1 \2|'); then
  REPO_OWNER=$(echo "$repo_info" | awk '{print $1}')
  REPO_NAME=$(echo "$repo_info" | awk '{print $2}')
else
  REPO_OWNER="${GITHUB_REPOSITORY_OWNER:-liorkl}"
  REPO_NAME="${GITHUB_REPOSITORY_NAME:-co-co}"
fi

if [ $# -lt 1 ]; then
  echo "Usage: $0 <issue-number> [options...]"
  echo ""
  echo "Options:"
  echo "  --status <status>        Set status (backlog|in-progress|review|blocked|done)"
  echo "  --priority <priority>    Set priority (critical|high|medium|low)"
  echo "  --add-label <label>     Add a label"
  echo "  --remove-label <label>  Remove a label"
  echo "  --assign <username>      Assign to user"
  echo "  --comment <text>        Add a comment"
  echo ""
  echo "Examples:"
  echo "  $0 5 --status in-progress"
  echo "  $0 5 --priority high --add-label type:feature"
  echo "  $0 5 --assign liorkl --comment \"Starting work on this\""
  exit 1
fi

ISSUE_NUMBER="$1"
shift

# Check if issue exists
if ! gh issue view "$ISSUE_NUMBER" >/dev/null 2>&1; then
  echo -e "${RED}❌ Issue #$ISSUE_NUMBER not found${NC}"
  exit 1
fi

while [ $# -gt 0 ]; do
  case "$1" in
    --status)
      STATUS="$2"
      shift 2
      case "$STATUS" in
        backlog) LABEL="status:backlog" ;;
        in-progress) LABEL="status:in-progress" ;;
        review) LABEL="status:review" ;;
        blocked) LABEL="status:blocked" ;;
        done) LABEL="status:done" ;;
        *)
          echo -e "${RED}❌ Invalid status: $STATUS${NC}"
          echo "   Valid: backlog, in-progress, review, blocked, done"
          exit 1
          ;;
      esac
      # Remove old status labels (each label needs its own --remove-label flag)
      gh issue edit "$ISSUE_NUMBER" \
        --remove-label "status:backlog" \
        --remove-label "status:todo" \
        --remove-label "status:in-progress" \
        --remove-label "status:review" \
        --remove-label "status:blocked" \
        --remove-label "status:done" 2>/dev/null || true
      # Add new status label
      gh issue edit "$ISSUE_NUMBER" --add-label "$LABEL" 2>/dev/null && \
        echo -e "${GREEN}✅ Updated status to: $STATUS${NC}"
      ;;
    --priority)
      PRIORITY="$2"
      shift 2
      case "$PRIORITY" in
        critical) LABEL="priority:critical" ;;
        high) LABEL="priority:high" ;;
        medium) LABEL="priority:medium" ;;
        low) LABEL="priority:low" ;;
        *)
          echo -e "${RED}❌ Invalid priority: $PRIORITY${NC}"
          echo "   Valid: critical, high, medium, low"
          exit 1
          ;;
      esac
      # Remove old priority labels (each label needs its own --remove-label flag)
      gh issue edit "$ISSUE_NUMBER" \
        --remove-label "priority:critical" \
        --remove-label "priority:high" \
        --remove-label "priority:medium" \
        --remove-label "priority:low" 2>/dev/null || true
      # Add new priority label
      gh issue edit "$ISSUE_NUMBER" --add-label "$LABEL" 2>/dev/null && \
        echo -e "${GREEN}✅ Updated priority to: $PRIORITY${NC}"
      ;;
    --add-label)
      LABEL="$2"
      shift 2
      gh issue edit "$ISSUE_NUMBER" --add-label "$LABEL" 2>/dev/null && \
        echo -e "${GREEN}✅ Added label: $LABEL${NC}" || \
        echo -e "${YELLOW}⚠️  Failed to add label: $LABEL${NC}"
      ;;
    --remove-label)
      LABEL="$2"
      shift 2
      gh issue edit "$ISSUE_NUMBER" --remove-label "$LABEL" 2>/dev/null && \
        echo -e "${GREEN}✅ Removed label: $LABEL${NC}" || \
        echo -e "${YELLOW}⚠️  Failed to remove label: $LABEL${NC}"
      ;;
    --assign)
      USER="$2"
      shift 2
      gh issue edit "$ISSUE_NUMBER" --add-assignee "$USER" 2>/dev/null && \
        echo -e "${GREEN}✅ Assigned to: $USER${NC}" || \
        echo -e "${YELLOW}⚠️  Failed to assign to: $USER${NC}"
      ;;
    --comment)
      COMMENT="$2"
      shift 2
      gh issue comment "$ISSUE_NUMBER" --body "$COMMENT" 2>/dev/null && \
        echo -e "${GREEN}✅ Added comment${NC}" || \
        echo -e "${YELLOW}⚠️  Failed to add comment${NC}"
      ;;
    *)
      echo -e "${RED}❌ Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

echo -e "\n${GREEN}✅ Issue #$ISSUE_NUMBER updated${NC}"
echo "   View: https://github.com/${REPO_OWNER}/${REPO_NAME}/issues/${ISSUE_NUMBER}"

