#!/bin/bash
# Add MVP backlog issues to GitHub project using GitHub API
# Requires: gh CLI with read:project and write:project scopes

set -e

REPO="liorkl/co-co"
ISSUES=(45 46 47 48 49 50 51 52 53 54 55 56)
PROJECT_NAME="Co-Co Backlog"

TOKEN=$(gh auth token 2>/dev/null || echo "")
if [ -z "$TOKEN" ]; then
  echo "❌ No GitHub token found. Run 'gh auth login' first."
  exit 1
fi

echo "🔍 Finding project: $PROJECT_NAME..."

# Find project using GraphQL (check user projects first, then org)
PROJECT_QUERY='{
  "query": "query { user(login: \"liorkl\") { projectsV2(first: 20) { nodes { id title number } } } }"
}'

RESPONSE=$(curl -s -X POST https://api.github.com/graphql \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$PROJECT_QUERY")

# Check for errors (but allow organization errors since liorkl is a user)
if echo "$RESPONSE" | jq -e '.errors' > /dev/null 2>&1; then
  ERROR_MSG=$(echo "$RESPONSE" | jq -r '.errors[0].message' 2>/dev/null)
  # Ignore organization errors, but show other errors
  if ! echo "$ERROR_MSG" | grep -q "Could not resolve to an Organization"; then
    echo "❌ API Error:"
    echo "$RESPONSE" | jq -r '.errors[].message'
    if echo "$RESPONSE" | grep -q "read:project\|project"; then
      echo ""
      echo "💡 Solution: Run 'gh auth refresh -s read:project,write:project'"
      echo "   Or use the 'project' scope: 'gh auth refresh -s project'"
    fi
    exit 1
  fi
fi

# Extract project ID from user projects
PROJECT_ID=$(echo "$RESPONSE" | jq -r '.data.user.projectsV2.nodes[] | select(.title == "'"$PROJECT_NAME"'") | .id' | head -1)
PROJECT_NUMBER=$(echo "$RESPONSE" | jq -r '.data.user.projectsV2.nodes[] | select(.title == "'"$PROJECT_NAME"'") | .number' | head -1)

if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "null" ]; then
  echo "❌ Project '$PROJECT_NAME' not found."
  echo ""
  echo "Available projects:"
  echo "$RESPONSE" | jq -r '.data.user.projectsV2.nodes[].title' 2>/dev/null | sed 's/^/   - /'
  if [ -z "$(echo "$RESPONSE" | jq -r '.data.user.projectsV2.nodes[].title' 2>/dev/null)" ]; then
    echo "   (No projects found)"
  fi
  exit 1
fi

echo "✅ Found project #$PROJECT_NUMBER: $PROJECT_NAME"
echo "📋 Adding ${#ISSUES[@]} issues to project..."
echo ""

SUCCESS=0
EXISTS=0
ERRORS=0

for ISSUE_NUM in "${ISSUES[@]}"; do
  echo -n "  Issue #$ISSUE_NUM... "
  
  # Get issue node ID
  ISSUE_QUERY="{
    \"query\": \"query(\$owner: String!, \$repo: String!, \$number: Int!) { repository(owner: \$owner, name: \$repo) { issue(number: \$number) { id } } }\",
    \"variables\": {
      \"owner\": \"liorkl\",
      \"repo\": \"co-co\",
      \"number\": $ISSUE_NUM
    }
  }"
  
  ISSUE_RESPONSE=$(curl -s -X POST https://api.github.com/graphql \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$ISSUE_QUERY")
  
  ISSUE_ID=$(echo "$ISSUE_RESPONSE" | jq -r '.data.repository.issue.id' 2>/dev/null)
  
  if [ -z "$ISSUE_ID" ] || [ "$ISSUE_ID" = "null" ]; then
    echo "❌ (issue not found)"
    ERRORS=$((ERRORS + 1))
    continue
  fi
  
  # Add issue to project (use contentId instead of itemId for Projects v2)
  ADD_MUTATION="{
    \"query\": \"mutation(\$projectId: ID!, \$contentId: ID!) { addProjectV2ItemById(input: {projectId: \$projectId, contentId: \$contentId}) { item { id } } }\",
    \"variables\": {
      \"projectId\": \"$PROJECT_ID\",
      \"contentId\": \"$ISSUE_ID\"
    }
  }"
  
  ADD_RESPONSE=$(curl -s -X POST https://api.github.com/graphql \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$ADD_MUTATION")
  
  if echo "$ADD_RESPONSE" | jq -e '.data.addProjectV2ItemById' > /dev/null 2>&1; then
    echo "✅"
    SUCCESS=$((SUCCESS + 1))
  elif echo "$ADD_RESPONSE" | grep -q "already exists\|already added"; then
    echo "ℹ️  (already in project)"
    EXISTS=$((EXISTS + 1))
  else
    ERROR_MSG=$(echo "$ADD_RESPONSE" | jq -r '.errors[0].message' 2>/dev/null || echo "Unknown error")
    echo "❌ ($ERROR_MSG)"
    ERRORS=$((ERRORS + 1))
  fi
done

echo ""
echo "✅ Summary:"
echo "   Added: $SUCCESS"
echo "   Already in project: $EXISTS"
echo "   Errors: $ERRORS"
echo ""
echo "📊 View project: https://github.com/users/liorkl/projects/$PROJECT_NUMBER"

