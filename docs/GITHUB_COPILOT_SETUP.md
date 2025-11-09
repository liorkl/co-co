## GitHub Copilot CLI Setup

Use this guide to enable the **GitHub Copilot CLI** (`copilot`) in this repository. The CLI lets you chat with Copilot, summarize commands, and request suggestions directly from your terminal.

### Quick Setup (Recommended)

```bash
npm run github:copilot:setup
```

The script performs these steps:
- Ensures the standalone Copilot CLI (`copilot`) is installed
- Verifies/login with `copilot auth login`
- Runs a lightweight smoke test (best-effort; skipped if network unavailable)

If any step fails, follow the on-screen instructions and re-run the script.

### Manual Setup

1. Install GitHub CLI (optional but recommended)  
   `brew install gh`

2. Authenticate with GitHub (if using `gh`)  
   `gh auth login`

3. Install the Copilot CLI  
   `brew install github/copilot-cli/copilot`

4. Authenticate Copilot  
   `copilot auth login`

5. Verify everything is ready  
   `copilot auth status`

### Usage Examples

- Chat: `copilot chat`
- Explain command: `copilot explain 'npm run push'`
- Suggest commands: `copilot suggest 'List git remotes sorted alphabetically'`
- Generate aliases: `copilot alias --shell zsh`

### Troubleshooting

- **Command not found**  
  Ensure the Copilot CLI binary is installed and on your `PATH`: `brew install github/copilot-cli/copilot`.

- **Scope/permission errors**  
  Refresh authentication: `copilot auth login`

- **Corporate/SSO enforcement**  
  Log into the browser window that opens during `copilot auth login` with an account that has Copilot access.

### Related Scripts

- `npm run github:mcp:setup` – configure GitHub MCP for Cursor
- `npm run github:setup-labels` – ensure standard labels exist
- `npm run push` – push branch and auto-create PR with `gh`

