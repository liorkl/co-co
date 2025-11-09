#!/bin/bash
# GitHub Copilot CLI setup helper
# Verifies the standalone Copilot CLI is installed and authenticated

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 GitHub Copilot CLI Setup${NC}\n"

# Ensure Copilot CLI is installed
if ! command -v copilot >/dev/null 2>&1; then
  echo -e "${RED}❌ GitHub Copilot CLI is not installed.${NC}"
  echo "   Install it from https://github.com/github/copilot-cli"
  echo "   macOS (Homebrew): brew install github/copilot-cli/copilot"
  exit 1
fi

echo -e "${BLUE}ℹ️  Copilot CLI version:${NC}"
copilot --version
echo ""

# Attempt to authenticate
if copilot auth status >/dev/null 2>&1; then
  echo -e "${GREEN}✅ Copilot authentication already configured.${NC}"
else
  echo -e "${YELLOW}ℹ️  Launching Copilot authentication flow...${NC}"
  copilot auth login
  copilot auth status
  echo -e "${GREEN}✅ Copilot authentication complete.${NC}"
fi

echo ""
echo -e "${BLUE}🧪 Testing Copilot CLI...${NC}"
if copilot explain 'git status' >/dev/null 2>&1; then
  echo -e "${GREEN}✅ Copilot CLI responded to a sample command.${NC}"
else
  echo -e "${YELLOW}ℹ️  Sample command could not be executed automatically (possibly due to no network).${NC}"
  echo "   Try manually: copilot explain 'npm run push'"
fi

echo ""
echo -e "${GREEN}🎉 GitHub Copilot CLI is ready to use!${NC}"
echo ""
echo "Try these next:"
echo "  copilot chat                         # interactive chat"
echo "  copilot explain 'npm run push'       # explain a command"
echo "  copilot suggest 'Write a git alias'  # get command suggestions"
  exit 1
fi

echo -e "${BLUE}🔌 Checking gh-copilot extension...${NC}"

if gh extension list | grep -q "github/gh-copilot"; then
  echo -e "${GREEN}✅ gh-copilot extension already installed.${NC}"
else
  echo -e "${YELLOW}ℹ️  Installing gh-copilot extension...${NC}"
  gh extension install github/gh-copilot
  echo -e "${GREEN}✅ gh-copilot extension installed.${NC}"
fi

echo ""
echo -e "${BLUE}🔐 Verifying Copilot authentication...${NC}"

if gh copilot --help 2>/dev/null | grep -q "auth status"; then
  if gh copilot auth status >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Copilot authentication already configured.${NC}"
  else
    echo -e "${YELLOW}ℹ️  Launching Copilot authentication flow...${NC}"
    gh copilot auth login
    gh copilot auth status
    echo -e "${GREEN}✅ Copilot authentication complete.${NC}"
  fi
else
  echo -e "${YELLOW}ℹ️  Copilot CLI does not expose 'auth' subcommands in this version.${NC}"
  echo -e "${BLUE}🔄 Refreshing gh authentication with Copilot scope...${NC}"
  gh auth refresh -h github.com -s copilot
  echo -e "${GREEN}✅ gh authentication refreshed with Copilot scope.${NC}"
  echo -e "${YELLOW}💡 Tip: Update the Copilot extension to the latest version for richer commands.${NC}"
fi

echo ""
echo -e "${BLUE}🧪 Testing Copilot chat...${NC}"
echo "   Try: gh copilot explain 'Explain what this project does'"
echo "   or: gh copilot suggest -f README.md \"Improve intro\""

echo ""
echo -e "${GREEN}🎉 gh copilot is ready to use!${NC}"

