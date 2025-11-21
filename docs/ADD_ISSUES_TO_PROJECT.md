# Adding MVP Issues to GitHub Project

## Quick Steps

1. **Grant project scopes to your GitHub token:**
   ```bash
   gh auth refresh -s read:project,write:project
   ```
   (This will open a browser for authorization)

2. **Run the automation script:**
   ```bash
   ./scripts/add-issues-to-project-api.sh
   ```

## Manual Alternative

If you prefer to add issues manually:

1. Go to your GitHub project: https://github.com/users/liorkl/projects
2. Open the "Co-Co Backlog" project
3. Click "Add items" or use the "+" button
4. Search for and add issues: #45, #46, #47, #48, #49, #50, #51, #52, #53, #54, #55, #56

## Issues Created

All 12 issues from the MVP gap analysis have been created:

**Sprint 1 (High Priority):**
- #45 - Landing page revamp with lead capture
- #46 - Guided multi-step onboarding with validation
- #47 - Analytics foundation with event tracking
- #48 - Match actions: Request intro CTA
- #49 - Test hardening: expand coverage
- #55 - Matching service improvements

**Sprint 2 (Medium Priority):**
- #50 - Monetization experiment surface
- #51 - Preference refinement UI
- #52 - Balance dashboard for marketplace health
- #53 - Background jobs system
- #54 - Quality telemetry and monitoring
- #56 - API rate limit telemetry

All issues are labeled with `sprint-1`, `sprint-2`, `mvp`, and functional area tags.

