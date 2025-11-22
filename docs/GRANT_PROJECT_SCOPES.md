# How to Grant Project Scopes to GitHub Token

## Method 1: Using GitHub CLI (Easiest - Recommended)

Run this command in your terminal:

```bash
gh auth refresh -s read:project,write:project
```

**What happens:**
1. The command will open your default web browser
2. GitHub will show an authorization page asking you to approve the new scopes
3. Click "Authorize" or "Authorize github" button
4. The terminal will confirm when authorization is complete

**Note:** If you're not logged in to GitHub CLI, you may need to run `gh auth login` first.

## Method 2: Manual Token Update (Alternative)

If Method 1 doesn't work, you can manually update your token:

1. **Go to GitHub Settings:**
   - Visit: https://github.com/settings/tokens
   - Or: GitHub → Your Profile → Settings → Developer settings → Personal access tokens → Tokens (classic)

2. **Find your token:**
   - Look for a token that matches what `gh` is using
   - Or create a new "Fine-grained token" or "Classic token"

3. **For Classic Tokens:**
   - Click "Edit" on your existing token
   - Check the boxes for:
     - ✅ `read:project` (Read project data)
     - ✅ `write:project` (Write project data)
   - Click "Update token"

4. **For Fine-grained Tokens:**
   - Create a new token or edit existing
   - Under "Repository access", select your repository
   - Under "Permissions", expand "Projects":
     - ✅ Read access
     - ✅ Write access
   - Generate/Update the token

5. **Update gh CLI to use the new token:**
   ```bash
   gh auth login --with-token < your-token-file.txt
   ```
   Or set it as an environment variable:
   ```bash
   export GITHUB_TOKEN=your_token_here
   ```

## Method 3: Re-authenticate with All Scopes

If you want to start fresh:

```bash
gh auth login
```

When prompted:
- Choose "GitHub.com"
- Choose your preferred protocol (HTTPS recommended)
- Authenticate via web browser
- When asked about scopes, make sure to include project scopes

## Verify It Worked

After granting scopes, verify with:

```bash
gh auth status
```

You should see `read:project` and `write:project` in the scopes list.

Or test with:

```bash
gh project list
```

If this works without errors, you're all set!

## Troubleshooting

**"Token not found" error:**
- Run `gh auth login` first to authenticate

**"Permission denied" error:**
- Make sure you clicked "Authorize" in the browser
- Check that the token has the right scopes in GitHub settings

**"Command not found" error:**
- Install GitHub CLI: https://cli.github.com/

