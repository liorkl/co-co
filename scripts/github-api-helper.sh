#!/bin/bash
# GitHub API Helper Script
# Provides advanced GitHub operations using GitHub API

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Detect repository owner/name from git remote if not provided
detect_repo_from_remote() {
  local remote="${GITHUB_REMOTE:-origin}"
  local remote_url

  if ! command -v git >/dev/null 2>&1; then
    return 1
  fi

  remote_url=$(git remote get-url "$remote" 2>/dev/null || git remote get-url origin 2>/dev/null)
  if [ -z "$remote_url" ]; then
    return 1
  fi

  # Normalize URL (supports SSH and HTTPS)
  case "$remote_url" in
    git@*)
      remote_url=${remote_url#git@}
      remote_url=${remote_url/:/\/}
      ;;
    ssh://git@*)
      remote_url=${remote_url#ssh://}
      remote_url=${remote_url#git@}
      ;;
    https://* | http://*)
      remote_url=${remote_url#https://}
      remote_url=${remote_url#http://}
      ;;
  esac

  # Strip trailing .git if present
  remote_url=${remote_url%.git}

  # Expect format github.com/owner/repo
  local path=${remote_url#*/}
  local owner=${path%%/*}
  local repo=${path#*/}

  if [ -n "$owner" ] && [ -n "$repo" ] && [ "$owner" != "$repo" ]; then
    echo "$owner" "$repo"
    return 0
  fi

  return 1
}

if repo_info=$(detect_repo_from_remote); then
  REPO_OWNER="${GITHUB_REPOSITORY_OWNER:-$(echo "$repo_info" | awk '{print $1}')}"
  REPO_NAME="${GITHUB_REPOSITORY_NAME:-$(echo "$repo_info" | awk '{print $2}')}"
else
  REPO_OWNER="${GITHUB_REPOSITORY_OWNER:-}"
  REPO_NAME="${GITHUB_REPOSITORY_NAME:-}"
fi

if [ -z "$REPO_OWNER" ] || [ -z "$REPO_NAME" ]; then
  echo -e "${RED}❌ Could not determine repository owner/name.${NC}"
  echo "   Set environment variables GITHUB_REPOSITORY_OWNER and GITHUB_REPOSITORY_NAME."
  exit 1
fi

# Check if GitHub CLI is available
if ! command -v gh >/dev/null 2>&1; then
  echo -e "${RED}❌ GitHub CLI (gh) is not installed${NC}"
  echo "   Install it: brew install gh"
  exit 1
fi

# Check authentication (attempt interactive login if possible)
if ! gh auth status >/dev/null 2>&1; then
  echo -e "${YELLOW}⚠️  GitHub CLI is not authenticated or token is invalid.${NC}"
  if [ -t 1 ] && [ -z "${CI:-}" ]; then
    echo -e "${BLUE}🔐 Launching gh auth login...${NC}"
    gh auth login
    if ! gh auth status >/dev/null 2>&1; then
      echo -e "${RED}❌ Authentication still failing. Please run 'gh auth login' manually.${NC}"
      exit 1
    fi
  else
    echo "   Run: gh auth login"
    exit 1
  fi
fi

# Function to get PR number from branch
get_pr_number() {
  local branch="$1"
  gh pr list --head "$branch" --json number --jq '.[0].number' 2>/dev/null || echo ""
}

# Function to add labels to PR
add_labels() {
  local pr_number="$1"
  shift
  local labels=("$@")
  
  if [ ${#labels[@]} -eq 0 ]; then
    echo -e "${YELLOW}⚠️  No labels provided${NC}"
    return 1
  fi
  
  for label in "${labels[@]}"; do
    gh pr edit "$pr_number" --add-label "$label" 2>/dev/null && \
      echo -e "${GREEN}✅ Added label: $label${NC}" || \
      echo -e "${YELLOW}⚠️  Failed to add label: $label (may not exist)${NC}"
  done
}

# Function to add reviewers to PR
add_reviewers() {
  local pr_number="$1"
  shift
  local reviewers=("$@")
  
  if [ ${#reviewers[@]} -eq 0 ]; then
    echo -e "${YELLOW}⚠️  No reviewers provided${NC}"
    return 1
  fi
  
  gh pr edit "$pr_number" --add-reviewer "${reviewers[@]}" 2>/dev/null && \
    echo -e "${GREEN}✅ Added reviewers: ${reviewers[*]}${NC}" || \
    echo -e "${YELLOW}⚠️  Failed to add reviewers${NC}"
}

# Function to get PR details
get_pr_details() {
  local pr_number="$1"
  gh pr view "$pr_number" --json number,title,state,author,labels,reviewers,url --jq '.'
}

# Function to list all labels in repository
list_labels() {
  gh api "repos/${REPO_OWNER}/${REPO_NAME}/labels" --jq '.[].name' | sort
}

# Function to create a label if it doesn't exist
ensure_label() {
  local label_name="$1"
  local label_color="${2:-0e8a16}"  # Default green
  local label_description="${3:-}"
  
  # Check if label exists
  if gh api "repos/${REPO_OWNER}/${REPO_NAME}/labels/${label_name}" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Label '$label_name' already exists${NC}"
    return 0
  fi
  
  # Create label
  local payload="{\"name\":\"$label_name\",\"color\":\"$label_color\""
  if [ -n "$label_description" ]; then
    payload="${payload},\"description\":\"$label_description\""
  fi
  payload="${payload}}"
  
  gh api "repos/${REPO_OWNER}/${REPO_NAME}/labels" \
    --method POST \
    --input - <<< "$payload" >/dev/null 2>&1 && \
    echo -e "${GREEN}✅ Created label: $label_name${NC}" || \
    echo -e "${RED}❌ Failed to create label: $label_name${NC}"
}

# Function to setup standard labels
setup_standard_labels() {
  echo "🏷️  Setting up standard labels..."
  
  ensure_label "bug" "d73a4a" "Something isn't working"
  ensure_label "enhancement" "a2eeef" "New feature or request"
  ensure_label "documentation" "0075ca" "Documentation improvements"
  ensure_label "refactor" "7057ff" "Code refactoring"
  ensure_label "chore" "ffffff" "Maintenance tasks"
  ensure_label "test" "c5def5" "Adding or updating tests"
  ensure_label "ci" "bfe5bf" "CI/CD changes"
  ensure_label "dependencies" "0366d6" "Dependency updates"
  
  echo -e "${GREEN}✅ Standard labels setup complete${NC}"
}

# Main command handler
case "${1:-}" in
  "add-labels")
    shift
    branch=$(git branch --show-current)
    pr_number=$(get_pr_number "$branch")
    if [ -z "$pr_number" ]; then
      echo -e "${RED}❌ No PR found for branch: $branch${NC}"
      exit 1
    fi
    add_labels "$pr_number" "$@"
    ;;
  "add-reviewers")
    shift
    branch=$(git branch --show-current)
    pr_number=$(get_pr_number "$branch")
    if [ -z "$pr_number" ]; then
      echo -e "${RED}❌ No PR found for branch: $branch${NC}"
      exit 1
    fi
    add_reviewers "$pr_number" "$@"
    ;;
  "pr-details")
    branch=$(git branch --show-current)
    pr_number=$(get_pr_number "$branch")
    if [ -z "$pr_number" ]; then
      echo -e "${RED}❌ No PR found for branch: $branch${NC}"
      exit 1
    fi
    get_pr_details "$pr_number"
    ;;
  "list-labels")
    list_labels
    ;;
  "setup-labels")
    setup_standard_labels
    ;;
  "ensure-label")
    if [ -z "$2" ]; then
      echo "Usage: $0 ensure-label <label-name> [color] [description]"
      exit 1
    fi
    ensure_label "$2" "$3" "$4"
    ;;
  *)
    echo "GitHub API Helper"
    echo ""
    echo "Usage: $0 <command> [args...]"
    echo ""
    echo "Commands:"
    echo "  add-labels <label1> [label2...]  - Add labels to current branch's PR"
    echo "  add-reviewers <user1> [user2...] - Add reviewers to current branch's PR"
    echo "  pr-details                       - Get detailed PR information"
    echo "  list-labels                       - List all labels in repository"
    echo "  setup-labels                      - Create standard labels"
    echo "  ensure-label <name> [color] [desc] - Create label if it doesn't exist"
    echo ""
    echo "Examples:"
    echo "  $0 add-labels bug enhancement"
    echo "  $0 add-reviewers liorkl"
    echo "  $0 setup-labels"
    exit 1
    ;;
esac



