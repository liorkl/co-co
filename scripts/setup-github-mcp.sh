#!/bin/bash
# GitHub MCP Server Setup Script
# This script configures the GitHub MCP server for AI-driven GitHub operations
# Uses the remote GitHub-hosted server (no Docker required)
#
# SECURITY NOTE:
# - All files containing tokens/secrets are created OUTSIDE this repository:
#   - ~/.cursor/mcp.json (contains GitHub token for Cursor)
# - These files are NEVER committed to git
# - The .gitignore already excludes the Cursor config

set -e

GITHUB_TOKEN="${GITHUB_PERSONAL_ACCESS_TOKEN:-}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 GitHub MCP Server Setup${NC}\n"
echo -e "${BLUE}Using remote GitHub-hosted server (no Docker required)${NC}\n"

# Get GitHub token - check multiple sources
if [ -z "$GITHUB_TOKEN" ]; then
  # Check GitHub CLI
  if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
    echo -e "${BLUE}📝 Attempting to get token from GitHub CLI...${NC}"
    GITHUB_TOKEN=$(gh auth token 2>/dev/null || echo "")
  fi
fi

# Last resort: ask user
if [ -z "$GITHUB_TOKEN" ]; then
  echo -e "${BLUE}📝 GitHub Personal Access Token${NC}"
  echo ""
  echo "You need a GitHub Personal Access Token (PAT) with the following scopes:"
  echo "  - repo (full control of private repositories)"
  echo "  - workflow (update GitHub Action workflows)"
  echo ""
  echo "Create a token at: https://github.com/settings/tokens"
  echo "Click 'Generate new token (classic)' and select the scopes above."
  echo ""
  echo -e "${YELLOW}💡 Tip: You can set GITHUB_PERSONAL_ACCESS_TOKEN environment variable to skip this prompt${NC}"
  echo ""
  read -p "Enter your GitHub Personal Access Token: " GITHUB_TOKEN
  echo ""
fi

if [ -z "$GITHUB_TOKEN" ]; then
  echo -e "${RED}❌ GitHub token is required${NC}"
  exit 1
fi

# Create Cursor configuration file
CURSOR_CONFIG_DIR="$HOME/.cursor"
CURSOR_MCP_CONFIG="$CURSOR_CONFIG_DIR/mcp.json"

echo -e "${BLUE}📝 Creating Cursor MCP configuration...${NC}"

# Create Cursor config directory if it doesn't exist
mkdir -p "$CURSOR_CONFIG_DIR"

# Check if config file exists
if [ -f "$CURSOR_MCP_CONFIG" ]; then
  echo -e "${YELLOW}⚠️  MCP config file already exists at: $CURSOR_MCP_CONFIG${NC}"
  echo -e "${BLUE}💡 Backing up to: ${CURSOR_MCP_CONFIG}.backup${NC}"
  cp "$CURSOR_MCP_CONFIG" "${CURSOR_MCP_CONFIG}.backup"
fi

# Create MCP configuration for remote server
cat > "$CURSOR_MCP_CONFIG" <<EOF
{
  "mcpServers": {
    "github": {
      "url": "https://api.githubcopilot.com/mcp/",
      "headers": {
        "Authorization": "Bearer $GITHUB_TOKEN"
      }
    }
  }
}
EOF

echo -e "${GREEN}✅ Cursor MCP configuration created at: $CURSOR_MCP_CONFIG${NC}"

echo ""
echo -e "${BLUE}📋 Configuration Details:${NC}"
echo "   File: $CURSOR_MCP_CONFIG"
echo "   Server: https://api.githubcopilot.com/mcp/ (remote, hosted by GitHub)"
echo ""
echo -e "${BLUE}📝 Manual Configuration (if needed):${NC}"
echo "   If Cursor doesn't pick up the config file automatically,"
echo "   add this to Cursor settings (Cmd+, → search 'MCP'):"
echo ""
cat <<EOF
{
  "mcpServers": {
    "github": {
      "url": "https://api.githubcopilot.com/mcp/",
      "headers": {
        "Authorization": "Bearer $GITHUB_TOKEN"
      }
    }
  }
}
EOF

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}\n"
echo "Next steps:"
echo "  1. Restart Cursor completely (quit and reopen)"
echo "  2. Check Settings → Tools & Integrations → MCP Tools"
echo "     (You should see a green dot next to 'github')"
echo "  3. Test with: 'List all open pull requests'"
echo ""
echo -e "${BLUE}💡 Note: This uses GitHub's hosted server - no local server or Docker needed!${NC}"
