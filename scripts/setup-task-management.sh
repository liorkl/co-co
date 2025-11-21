#!/bin/bash
# Setup Task Management System
# Creates all labels, sets up project board structure, and configures task management

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo -e "${BLUE}🚀 Setting up Task Management System${NC}\n"

# Load GitHub helper functions (extract just the functions we need)
ensure_label() {
  local label_name="$1"
  local label_color="${2:-0e8a16}"
  local label_description="${3:-}"
  
  # Detect repo from git remote
  if repo_info=$(git remote get-url origin 2>/dev/null | sed -E 's|.*github.com[:/]([^/]+)/([^/]+)\.git|\1 \2|'); then
    REPO_OWNER=$(echo "$repo_info" | awk '{print $1}')
    REPO_NAME=$(echo "$repo_info" | awk '{print $2}')
  else
    REPO_OWNER="${GITHUB_REPOSITORY_OWNER:-liorkl}"
    REPO_NAME="${GITHUB_REPOSITORY_NAME:-co-co}"
  fi
  
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

# Detect repo info
if repo_info=$(git remote get-url origin 2>/dev/null | sed -E 's|.*github.com[:/]([^/]+)/([^/]+)\.git|\1 \2|'); then
  REPO_OWNER=$(echo "$repo_info" | awk '{print $1}')
  REPO_NAME=$(echo "$repo_info" | awk '{print $2}')
else
  REPO_OWNER="${GITHUB_REPOSITORY_OWNER:-liorkl}"
  REPO_NAME="${GITHUB_REPOSITORY_NAME:-co-co}"
fi

# Function to create label with color and description
create_task_label() {
  local name="$1"
  local color="$2"
  local description="$3"
  
  ensure_label "$name" "$color" "$description"
}

echo -e "${YELLOW}📋 Step 1: Creating Priority Labels${NC}"
create_task_label "priority:critical" "b60205" "Critical priority - must fix immediately"
create_task_label "priority:high" "d93f0b" "High priority - important"
create_task_label "priority:medium" "fbca04" "Medium priority - normal"
create_task_label "priority:low" "0e8a16" "Low priority - nice to have"

echo -e "\n${YELLOW}📋 Step 2: Creating Type Labels${NC}"
create_task_label "type:feature" "a2eeef" "New feature"
create_task_label "type:bug" "d73a4a" "Bug fix"
create_task_label "type:chore" "ffffff" "Maintenance task"
create_task_label "type:docs" "0075ca" "Documentation"
create_task_label "type:refactor" "7057ff" "Code refactoring"
create_task_label "type:test" "c5def5" "Test improvements"
create_task_label "type:ci" "bfe5bf" "CI/CD changes"
create_task_label "type:infra" "f9d0c4" "Infrastructure changes"

echo -e "\n${YELLOW}📋 Step 3: Creating Status Labels${NC}"
create_task_label "status:backlog" "ededed" "In backlog"
create_task_label "status:todo" "c2e0c6" "Ready to start"
create_task_label "status:in-progress" "fbca04" "Currently working on"
create_task_label "status:review" "d4c5f9" "In code review"
create_task_label "status:blocked" "b60205" "Blocked by dependency"
create_task_label "status:done" "0e8a16" "Completed"

echo -e "\n${YELLOW}📋 Step 4: Creating Size Labels${NC}"
create_task_label "size:small" "3cbf00" "Small task (< 1 day)"
create_task_label "size:medium" "fbca04" "Medium task (1-3 days)"
create_task_label "size:large" "d93f0b" "Large task (3+ days)"
create_task_label "size:epic" "b60205" "Epic (multiple sprints)"

echo -e "\n${GREEN}✅ All labels created successfully!${NC}\n"

echo -e "${BLUE}📊 Step 5: Project Board Setup${NC}"
echo -e "${YELLOW}Note: GitHub Projects must be created manually via UI${NC}"
echo ""
echo "To create your project board:"
echo "1. Go to: https://github.com/${REPO_OWNER}/${REPO_NAME}/projects/new"
echo "2. Choose 'Board' template"
echo "3. Name it: 'FounderFinder Backlog' (or 'Development Board', 'Sprint Board', etc.)"
echo "4. Add these columns:"
echo "   - 📋 Backlog"
echo "   - 🔄 In Progress"
echo "   - 👀 Review"
echo "   - ✅ Done"
echo ""
echo "5. Configure auto-archive:"
echo "   - Settings → Archive closed items after 30 days"
echo ""
echo -e "${GREEN}✅ Task management setup complete!${NC}\n"

echo -e "${BLUE}📝 Next Steps:${NC}"
echo "1. Create your project board (see instructions above)"
echo "2. Use 'npm run task:create' to create new tasks"
echo "3. Use 'npm run task:update' to update task status"
echo "4. See docs/TASK_MANAGEMENT.md for full workflow"

