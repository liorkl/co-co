#!/usr/bin/env python3
"""
Add MVP backlog issues to GitHub project "Co-Co Backlog"
Requires: GITHUB_TOKEN with read:project and write:project scopes
"""

import os
import sys
import subprocess
import json

REPO = "liorkl/co-co"
ISSUES = [45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56]
PROJECT_NAME = "Co-Co Backlog"

def get_gh_token():
    """Get GitHub token from gh CLI"""
    try:
        result = subprocess.run(
            ["gh", "auth", "token"],
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout.strip()
    except (subprocess.CalledProcessError, FileNotFoundError):
        return os.environ.get("GITHUB_TOKEN")

def find_project(token):
    """Find project by name using GraphQL API"""
    query = """
    query {
      organization(login: "liorkl") {
        projectsV2(first: 20) {
          nodes {
            id
            title
            number
          }
        }
      }
      user(login: "liorkl") {
        projectsV2(first: 20) {
          nodes {
            id
            title
            number
          }
        }
      }
    }
    """
    
    import requests
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    
    response = requests.post(
        "https://api.github.com/graphql",
        json={"query": query},
        headers=headers,
        timeout=10
    )
    
    if response.status_code != 200:
        print(f"❌ API Error: {response.status_code}")
        print(f"   Response: {response.text}")
        return None
    
    data = response.json()
    
    # Handle errors, but allow organization errors since liorkl is a user
    if "errors" in data and len(data.get("errors", [])) > 0:
        error_messages = [error.get("message", "Unknown error") for error in data["errors"]]
        # Check if all errors are organization-related (user account, not org)
        org_errors_only = all(
            "Could not resolve to an Organization" in msg or "organization" in msg.lower()
            for msg in error_messages
        )
        
        if not org_errors_only:
            # Real errors that should stop execution
            print("❌ GraphQL Errors:")
            for error in data["errors"]:
                print(f"   {error.get('message', 'Unknown error')}")
            if "read:project" in str(data["errors"]) or "project" in str(data["errors"]):
                print("\n💡 Solution: Run 'gh auth refresh -s read:project,write:project'")
                print("   Or use the 'project' scope: 'gh auth refresh -s project'")
            return None
        # If only org errors, continue to check user projects
    
    # Check organization projects
    org_projects = data.get("data", {}).get("organization", {}).get("projectsV2", {}).get("nodes", [])
    for project in org_projects:
        if project.get("title") == PROJECT_NAME:
            return project.get("id"), project.get("number")
    
    # Check user projects
    user_projects = data.get("data", {}).get("user", {}).get("projectsV2", {}).get("nodes", [])
    for project in user_projects:
        if project.get("title") == PROJECT_NAME:
            return project.get("id"), project.get("number")
    
    return None

def get_issue_node_id(token, issue_num):
    """Get GraphQL node ID for an issue"""
    query = """
    query($owner: String!, $repo: String!, $number: Int!) {
      repository(owner: $owner, name: $repo) {
        issue(number: $number) {
          id
        }
      }
    }
    """
    
    import requests
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    
    variables = {
        "owner": "liorkl",
        "repo": "co-co",
        "number": issue_num
    }
    
    response = requests.post(
        "https://api.github.com/graphql",
        json={"query": query, "variables": variables},
        headers=headers,
        timeout=10
    )
    
    if response.status_code == 200:
        data = response.json()
        issue = data.get("data", {}).get("repository", {}).get("issue")
        if issue:
            return issue.get("id")
    
    return None

def add_issue_to_project(token, project_id, issue_id):
    """Add issue to project using GraphQL"""
    mutation = """
    mutation($projectId: ID!, $contentId: ID!) {
      addProjectV2ItemById(input: {projectId: $projectId, contentId: $contentId}) {
        item {
          id
        }
      }
    }
    """
    
    import requests
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    
    variables = {
        "projectId": project_id,
        "contentId": issue_id
    }
    
    response = requests.post(
        "https://api.github.com/graphql",
        json={"query": mutation, "variables": variables},
        headers=headers,
        timeout=10
    )
    
    if response.status_code == 200:
        data = response.json()
        if "errors" in data and len(data.get("errors", [])) > 0:
            error_msg = data["errors"][0].get("message", "Unknown error")
            if "already exists" in error_msg.lower():
                return "exists"
            return f"error: {error_msg}"
        return "success"
    
    return f"http_error: {response.status_code}"

def main():
    print(f"🔍 Finding project: {PROJECT_NAME}...")
    
    token = get_gh_token()
    if not token:
        print("❌ No GitHub token found. Set GITHUB_TOKEN or run 'gh auth login'")
        sys.exit(1)
    
    # Check for requests library before any functions that use it
    try:
        import requests
    except ImportError:
        print("❌ 'requests' library required. Install with: pip install requests")
        sys.exit(1)
    
    project_info = find_project(token)
    if not project_info:
        print(f"\n❌ Could not find project '{PROJECT_NAME}'")
        print("\n💡 Options:")
        print("   1. Run 'gh auth refresh -s read:project,write:project' to grant scopes")
        print("   2. Verify the project name matches exactly")
        print("   3. Add issues manually via GitHub UI")
        sys.exit(1)
    
    project_id, project_number = project_info
    print(f"✅ Found project #{project_number}: {PROJECT_NAME}")
    print(f"📋 Adding {len(ISSUES)} issues to project...\n")
    
    success_count = 0
    exists_count = 0
    error_count = 0
    
    for issue_num in ISSUES:
        print(f"  Processing issue #{issue_num}...", end=" ", flush=True)
        
        issue_id = get_issue_node_id(token, issue_num)
        if not issue_id:
            print(f"❌ Could not find issue #{issue_num}")
            error_count += 1
            continue
        
        result = add_issue_to_project(token, project_id, issue_id)
        if result == "success":
            print("✅")
            success_count += 1
        elif result == "exists":
            print("ℹ️  (already in project)")
            exists_count += 1
        else:
            print(f"❌ {result}")
            error_count += 1
    
    print(f"\n✅ Summary:")
    print(f"   Added: {success_count}")
    print(f"   Already in project: {exists_count}")
    print(f"   Errors: {error_count}")
    print(f"\n📊 View project: https://github.com/users/liorkl/projects/{project_number}")

if __name__ == "__main__":
    main()

