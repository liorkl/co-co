# GitHub MCP Server Setup Guide

This guide explains how to set up and use the GitHub MCP (Model Context Protocol) server to enhance your development workflow with AI-driven GitHub operations.

## What is GitHub MCP?

GitHub MCP is a server that enables AI assistants (like Cursor) to interact with GitHub repositories using natural language commands. It provides:

- **Automated Code Management**: List issues, review PRs, fetch repository metadata
- **Enhanced Development Workflow**: Streamline code-related tasks and connect third-party tools
- **Natural Language Interface**: Use conversational commands for GitHub operations

## Quick Setup (Recommended)

The easiest way to set up GitHub MCP is using the **remote GitHub-hosted server** - no Docker or local server setup required!

### Prerequisites

- GitHub Personal Access Token (PAT) with appropriate permissions
- Cursor IDE (latest version recommended)

### Automated Setup

Run the setup script:

```bash
npm run github:mcp:setup
```

The script will:
1. Prompt for your GitHub Personal Access Token (or use `GITHUB_PERSONAL_ACCESS_TOKEN` env var)
2. Create the Cursor MCP configuration file at `~/.cursor/mcp.json`
3. Configure it to use GitHub's hosted server

### Manual Setup

1. **Create GitHub Personal Access Token**:
   - Go to https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Select scopes:
     - `repo` (full control of private repositories)
     - `workflow` (update GitHub Action workflows)
     - `read:org` (if working with organization repos)
   - Copy the token

2. **Configure Cursor**:
   - Open `~/.cursor/mcp.json` (create if it doesn't exist)
   - Add the following configuration:

```json
{
  "mcpServers": {
    "github": {
      "url": "https://api.githubcopilot.com/mcp/",
      "headers": {
        "Authorization": "Bearer YOUR_GITHUB_PAT"
      }
    }
  }
}
```

3. **Restart Cursor** completely (quit and reopen)

4. **Verify Installation**:
   - Go to Settings → Tools & Integrations → MCP Tools
   - You should see a green dot next to "github"
   - In chat/composer, check "Available Tools" - you should see GitHub MCP tools

## Usage Examples

Once configured, you can use natural language commands in Cursor:

### Repository Operations
- "List all open pull requests"
- "Show me the details of PR #5"
- "What issues are assigned to me?"
- "Create a new issue for bug in authentication"

### Pull Request Operations
- "Review the latest PR and suggest improvements"
- "Add labels 'bug' and 'high-priority' to PR #10"
- "Assign @username as reviewer for current PR"
- "Merge PR #5 if CI passes"

### Code Operations
- "Show me the diff for the last commit"
- "What files changed in the last 3 commits?"
- "Compare main branch with feature/user-auth"

## Integration with Existing Workflow

The GitHub MCP server complements (but doesn't replace) our existing GitHub CLI automation:

### Current Automation (GitHub CLI)
- ✅ Auto-generate PR descriptions
- ✅ Auto-create PRs on push
- ✅ Auto-label PRs by branch type
- ✅ Open PRs in browser

### Enhanced with MCP
- ✅ Natural language GitHub operations
- ✅ AI-driven code review suggestions
- ✅ Automated issue management
- ✅ Intelligent PR analysis

## Troubleshooting

### MCP Not Loading
- **Restart Cursor completely** after configuration
- Check that `~/.cursor/mcp.json` has valid JSON
- Verify the token is correct and has proper scopes

### Authentication Failures
- Verify PAT has correct scopes (`repo`, `workflow`)
- Check token hasn't expired
- Try regenerating the token

### Tools Not Appearing
- Check server shows green dot in MCP settings (Settings → Tools & Integrations → MCP Tools)
- Look for MCP-related errors in Cursor logs
- Ensure you're using Cursor v0.48.0+ for remote server support

### Connection Issues
- Verify you have internet connection (remote server requires it)
- Check firewall/proxy settings
- Try the manual configuration method

## Local Server Setup (Optional)

If you prefer to run a local server (requires Docker):

1. **Install Docker** (if not already installed):
   ```bash
   # macOS
   brew install --cask docker
   ```

2. **Configure Cursor for Local Server**:
   ```json
   {
     "mcpServers": {
       "github": {
         "command": "docker",
         "args": [
           "run",
           "-i",
           "--rm",
           "-e",
           "GITHUB_PERSONAL_ACCESS_TOKEN",
           "ghcr.io/github/github-mcp-server"
         ],
         "env": {
           "GITHUB_PERSONAL_ACCESS_TOKEN": "YOUR_GITHUB_PAT"
         }
       }
     }
   }
   ```

3. **Restart Cursor**

> **Note**: The remote server (recommended) is simpler and doesn't require Docker. Use local server only if you have specific requirements.

## Security Best Practices

1. **Token Security**:
   - Never commit tokens to git
   - Use environment variables when possible
   - Rotate tokens regularly
   - Use fine-grained tokens when possible

2. **Token Scopes**:
   - Grant minimum required permissions
   - Review token usage regularly
   - Revoke unused tokens

3. **File Permissions**:
   - Restrict access to config files containing tokens
   ```bash
   chmod 600 ~/.cursor/mcp.json
   ```

## Resources

- [GitHub MCP Server Repository](https://github.com/github/github-mcp-server)
- [MCP Protocol Documentation](https://modelcontextprotocol.io)
- [GitHub API Documentation](https://docs.github.com/en/rest)
- [Cursor MCP Integration Guide](https://cursor.sh/docs/mcp)

## Next Steps

1. ✅ Set up GitHub MCP using the automated script or manual method
2. ✅ Restart Cursor
3. ✅ Verify installation in MCP settings
4. ✅ Test with: "List all open pull requests"
5. ✅ Explore advanced features like automated code review

---

**Note**: The GitHub MCP server is a separate service from GitHub CLI. Both can be used together for maximum automation and flexibility.
