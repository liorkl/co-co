#!/bin/bash
# List GitHub issues (tasks) with filters
# Usage: ./scripts/task-list.sh [--status <status>] [--priority <priority>] [--type <type>] [--assignee <user>]

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

QUERY_ARGS=()

while [ $# -gt 0 ]; do
  case "$1" in
    --status)
      STATUS="$2"
      shift 2
      QUERY_ARGS+=("label:status:$STATUS")
      ;;
    --priority)
      PRIORITY="$2"
      shift 2
      QUERY_ARGS+=("label:priority:$PRIORITY")
      ;;
    --type)
      TYPE="$2"
      shift 2
      QUERY_ARGS+=("label:type:$TYPE")
      ;;
    --assignee)
      ASSIGNEE="$2"
      shift 2
      QUERY_ARGS+=("assignee:$ASSIGNEE")
      ;;
    --all)
      shift
      QUERY_ARGS=()
      ;;
    *)
      echo "Usage: $0 [options...]"
      echo ""
      echo "Options:"
      echo "  --status <status>     Filter by status (backlog|todo|in-progress|review|blocked|done)"
      echo "  --priority <priority> Filter by priority (critical|high|medium|low)"
      echo "  --type <type>         Filter by type (feature|bug|chore|docs|refactor|test|ci|infra)"
      echo "  --assignee <user>     Filter by assignee"
      echo "  --all                 Show all open issues"
      echo ""
      echo "Examples:"
      echo "  $0 --status in-progress"
      echo "  $0 --priority high --type feature"
      echo "  $0 --assignee liorkl"
      exit 1
      ;;
  esac
done

# Build query
QUERY="is:issue is:open"
if [ ${#QUERY_ARGS[@]} -gt 0 ]; then
  QUERY="$QUERY ${QUERY_ARGS[*]}"
fi

echo "Listing issues: $QUERY"
echo ""

gh issue list \
  --limit 50 \
  --search "$QUERY" \
  --json number,title,labels,assignees,state,createdAt \
  --jq '.[] | "\(.number) | \(.title) | Labels: \(.labels | map(.name) | join(", ")) | Assignees: \(.assignees | map(.login) | join(", ") // "none")"' \
  | column -t -s '|'

