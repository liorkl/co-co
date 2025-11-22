# Self-Code Review Checklist

This checklist is based on bugs discovered during development and should be reviewed before each push/PR.

## Bash Scripts (`set -e` Considerations)

### ✅ Arithmetic Operations
- [ ] **Post-increment operators**: `((VAR++))` returns the old value (falsy when 0), causing `set -e` to exit
  - ✅ Use: `VAR=$((VAR + 1))` or `((VAR++)) || true`
  - ❌ Avoid: `((SUCCESS++))` with `set -e` when variable might be 0
- [ ] **Arithmetic expressions**: Test that math operations work with `set -e` enabled

### ✅ Error Handling Consistency
- [ ] **All operations have error fallbacks**: Check that all `gh`, `curl`, `jq` commands have `|| echo` or `|| true` when failures shouldn't abort
- [ ] **Consistent patterns**: If one option uses `|| echo`, similar options should too
- [ ] **Label operations**: Status/priority updates should match error handling of other options

### ✅ Array Expansion and Commands
- [ ] **Multiple labels/flags**: Array expansion `"${ARRAY[@]}"` after single flag creates positional args
  - ✅ Use: Loop with repeated flags or comma-separated format
  - ❌ Avoid: `--label "${LABELS[@]}"` (expands to `--label label1 label2` incorrectly)
- [ ] **Empty arrays**: Check if array is non-empty before using in commands
  - ✅ Use: `if [ ${#ARRAY[@]} -gt 0 ]; then ...`

### ✅ Variable Initialization
- [ ] **Color variables**: All `RED`, `GREEN`, `YELLOW`, `BLUE`, `NC` are defined before use
- [ ] **Counters**: All counters (`SUCCESS`, `ERRORS`, etc.) initialized to 0
- [ ] **Check undefined variables**: Scripts shouldn't reference undefined variables

## API and GraphQL Scripts

### ✅ GraphQL Mutations
- [ ] **Parameter names**: Verify correct parameter names for API version
  - ✅ Projects V2 uses `contentId`, not `itemId`
- [ ] **Error handling**: Check for empty errors array before accessing index
  - ✅ Use: `if "errors" in data and len(data.get("errors", [])) > 0:`
  - ❌ Avoid: `data["errors"][0]` without length check

### ✅ Organization vs User Queries
- [ ] **Handle organization errors**: When querying user projects, ignore org-specific errors
  - ✅ Continue processing if only org errors exist
  - ❌ Don't exit immediately on all GraphQL errors

### ✅ Authentication and Scopes
- [ ] **Correct scope names**: Verify scope names match API requirements
  - ✅ Projects V2 uses `project` scope (not `read:project` or `write:project`)
- [ ] **Error messages**: Provide correct commands with right syntax
  - ✅ `gh auth refresh -s project` not `gh auth refresh -h github.com -s read:project`

## Workflow and Consistency

### ✅ Label Management
- [ ] **Setup matches usage**: Labels created in setup script should be used/removed in update scripts
- [ ] **No orphan labels**: Don't create labels not in documented workflow
- [ ] **Removal matches creation**: Don't remove labels that aren't created

### ✅ Reporting Accuracy
- [ ] **Count accuracy**: Report actual counts, not array lengths
  - ✅ Track `SUCCESS`, `EXISTS`, `ERRORS` separately
  - ❌ Don't say "Added ${#ARRAY[@]} issues" without verification
- [ ] **Summary matches actions**: Final summary should reflect actual results

## Python Scripts

### ✅ Import Management
- [ ] **Import timing**: Check for optional imports (like `requests`) before functions use them
  - ✅ Check at start of `main()` before calling functions
  - ❌ Don't check after `find_project()` already imported it
- [ ] **Error messages**: Provide helpful error messages with installation instructions

### ✅ Error Handling
- [ ] **IndexError prevention**: Check list length before accessing by index
- [ ] **Empty checks**: Handle empty lists/dicts gracefully
- [ ] **API errors**: Distinguish between recoverable and fatal errors

## CLI Command Syntax

### ✅ GitHub CLI Commands
- [ ] **Label syntax**: Verify multiple labels use correct format
  - ✅ Comma-separated: `--label "label1,label2,label3"`
  - ✅ Repeated flags: `--label label1 --label label2 --label label3`
  - ❌ Not: `--label label1 label2 label3` (becomes positional args)
- [ ] **Flag requirements**: Each flag should have its own value
- [ ] **Optional flags**: Conditionally include flags only when values exist

### ✅ Command Building
- [ ] **Array command building**: When building commands with arrays, test expansion
- [ ] **Error suppression**: Use `2>/dev/null || true` appropriately
- [ ] **Exit codes**: Verify command success/failure detection works correctly

## Code Quality

### ✅ Documentation
- [ ] **Usage examples**: Scripts have clear usage examples
- [ ] **Error messages**: Helpful error messages with next steps
- [ ] **Comments**: Complex logic has explanatory comments

### ✅ Testing Considerations
- [ ] **Test empty inputs**: Scripts handle empty arrays, missing args, etc.
- [ ] **Test edge cases**: 0 values, first iteration, last iteration
- [ ] **Test error paths**: Verify error handling doesn't cause unexpected exits

## Quick Pre-Push Checklist

Before pushing, verify:
1. ✅ All arithmetic uses safe operations with `set -e`
2. ✅ Error handling is consistent across similar operations
3. ✅ Array expansions won't create syntax errors
4. ✅ All variables are defined before use
5. ✅ API calls use correct parameter names
6. ✅ Workflow consistency (setup matches usage)
7. ✅ Reports reflect actual results, not assumptions
8. ✅ Imports checked before use
9. ✅ CLI commands tested with multiple inputs
10. ✅ No orphan labels or inconsistent state

## Common Patterns to Avoid

### ❌ Bad Patterns
```bash
# Post-increment with set -e
((SUCCESS++))  # Fails when SUCCESS is 0

# Array expansion after single flag
--label "${LABELS[@]}"  # Wrong syntax

# Accessing array without check
data["errors"][0]  # IndexError if empty

# Missing error handling
gh issue edit --add-label "$LABEL"  # Exits on failure

# Color variable not defined
echo -e "${RED}Error${NC}"  # Literal text if undefined
```

### ✅ Good Patterns
```bash
# Safe increment
SUCCESS=$((SUCCESS + 1))

# Multiple flags correctly
for label in "${LABELS[@]}"; do
  GH_CMD+=(--label "$label")
done

# Check before access
if "errors" in data and len(data.get("errors", [])) > 0:
    error_msg = data["errors"][0].get("message")

# Error handling
gh issue edit --add-label "$LABEL" 2>/dev/null && \
  echo "Success" || echo "Failed"

# Define colors
RED='\033[0;31m'
NC='\033[0m'
```

