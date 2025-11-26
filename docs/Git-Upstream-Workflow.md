# Git Upstream Workflow Guide

This guide explains how to work with the Arcana repository as the central upstream repository. Sub-system repositories will use this workflow to stay synchronized with the main repository and contribute changes through pull requests.

## Overview

In this workflow:
- **Arcana** is the main repository (upstream) that all sub-repos will sync with
- **Sub-system repos** are separate repositories with refactored code based on the same codebase
- Developers commit, pull, and push to their sub-system repo normally
- Changes are synced with the main repo using the **upstream remote** (`git fetch upstream` and `git merge upstream/main`)
- Contributors push their main branch to a **new branch in Arcana** via upstream to create pull requests for review

---

## Table of Contents

1. [Initial Setup](#initial-setup)
2. [Daily Workflow](#daily-workflow)
3. [Syncing with Upstream](#syncing-with-upstream)
4. [Creating a Pull Request](#creating-a-pull-request)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)

---

## Initial Setup

### Step 1: Clone Your Sub-System Repository

Clone your sub-system repository to your local machine:

```bash
git clone https://github.com/YOUR-ORG/your-subsystem-repo.git
cd your-subsystem-repo
```

### Step 2: Add Upstream Remote

Add the main Arcana repository as the upstream remote:

```bash
git remote add upstream https://github.com/The-United-Legend-Tech-Group/Arcana.git
```

### Step 3: Verify Remotes

Confirm that both remotes are configured correctly:

```bash
git remote -v
```

Expected output:
```
origin    https://github.com/YOUR-ORG/your-subsystem-repo.git (fetch)
origin    https://github.com/YOUR-ORG/your-subsystem-repo.git (push)
upstream  https://github.com/The-United-Legend-Tech-Group/Arcana.git (fetch)
upstream  https://github.com/The-United-Legend-Tech-Group/Arcana.git (push)
```

---

## Daily Workflow

### Working on Your Sub-System Repository

For regular development work, use standard git commands with your sub-system repo:

```bash
# Pull latest changes from your sub-system repo
git pull origin main

# Make changes to your code
# ...

# Stage and commit changes
git add .
git commit -m "Your commit message"

# Push to your sub-system repo
git push origin main
```

---

## Syncing with Upstream

To keep your sub-system repo up-to-date with the main Arcana repository, follow these steps:

### Step 1: Fetch Upstream Changes

Fetch the latest changes from the upstream repository:

```bash
git fetch upstream
```

### Step 2: Switch to Main Branch

Ensure you're on your local main branch:

```bash
git checkout main
```

### Step 3: Merge Upstream Changes

Merge the upstream main branch into your local main:

```bash
git merge upstream/main
```

Alternatively, you can use rebase for a cleaner history:

```bash
git rebase upstream/main
```

### Step 4: Push Updates to Your Sub-System Repo

Push the synchronized changes to your sub-system repo:

```bash
git push origin main
```

### Quick Sync Command

You can combine these steps into a single workflow:

```bash
git fetch upstream && git checkout main && git merge upstream/main && git push origin main
```

---

## Creating a Pull Request

When you're ready to contribute changes from your sub-system repo back to the main Arcana repository, you can push your main branch directly to a new branch in Arcana via upstream:

### Step 1: Sync with Upstream First

Always sync with upstream before pushing your changes:

```bash
git fetch upstream
git checkout main
git merge upstream/main
```

### Step 2: Push Your Main Branch to a New Branch in Arcana

Push your local main branch to a new branch in the upstream Arcana repository. This creates a new branch in Arcana automatically:

```bash
git push upstream main:feature/your-feature-name
```

This command pushes your local `main` branch to a new branch called `feature/your-feature-name` in the upstream Arcana repository.

Branch naming conventions:
- `feature/` - for new features
- `bugfix/` - for bug fixes
- `hotfix/` - for urgent fixes
- `docs/` - for documentation changes
- `subsystem/your-subsystem-name/` - to identify which subsystem the changes come from

Example with subsystem prefix:
```bash
git push upstream main:subsystem/payments/feature/add-stripe-integration
```

### Step 3: Create Pull Request on GitHub

1. Navigate to the Arcana repository on GitHub
2. You should see a prompt to create a pull request from your recently pushed branch
3. Click **Compare & pull request**
4. Fill in the pull request details:
   - **Title**: Clear, concise description of the change
   - **Description**: Detailed explanation of what was changed and why
5. Select reviewers if required
6. Click **Create pull request**

### Step 4: Address Review Feedback

If reviewers request changes:

```bash
# Make changes locally on your main branch
git add .
git commit -m "fix: address review feedback"

# Push the updated main to the same branch in upstream
git push upstream main:feature/your-feature-name
```

The pull request will automatically update with your new commits.

---

## Best Practices

### Commit Messages

Follow conventional commit format:
- `feat:` - new feature
- `fix:` - bug fix
- `docs:` - documentation changes
- `refactor:` - code refactoring
- `test:` - adding tests
- `chore:` - maintenance tasks

Example:
```bash
git commit -m "feat: add user authentication module"
```

### Sync Frequently

Sync with upstream regularly to avoid large merge conflicts:

```bash
# Do this at least once a day
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

### Keep Changes Focused

- Make focused changes for specific features
- Avoid combining unrelated changes in one push
- Use clear branch names when pushing to upstream

### Before Creating a Pull Request

1. ✅ Sync with upstream
2. ✅ Ensure your main branch has focused changes
3. ✅ Write clear commit messages
4. ✅ Test your changes locally
5. ✅ Push your main to a new branch in upstream
6. ✅ Create pull request

---

## Troubleshooting

### Merge Conflicts

If you encounter merge conflicts when syncing:

```bash
# After running git merge upstream/main
# Git will indicate conflicted files

# Open conflicted files and resolve conflicts manually
# Look for conflict markers: <<<<<<<, =======, >>>>>>>

# After resolving conflicts
git add .
git commit -m "chore: resolve merge conflicts"
git push origin main
```

### Upstream Not Configured

If you get an error about upstream not being found:

```bash
git remote add upstream https://github.com/The-United-Legend-Tech-Group/Arcana.git
```

### Accidentally Committed to Main

This workflow expects you to work on main in your sub-system repo, so this is fine. Just push your main to a new branch in upstream when ready:

```bash
git push upstream main:feature/your-feature-name
```

### Stale Main Branch

If your main branch is outdated compared to upstream:

```bash
# Fetch and merge upstream changes
git fetch upstream
git checkout main
git merge upstream/main

# Resolve any conflicts if needed, then push to your sub-system repo
git push origin main
```

### Permission Denied When Pushing to Upstream

If you get a permission error when pushing to upstream, ensure you have write access to create branches in the Arcana repository. Contact the repository maintainers to request access.

---

## Quick Reference

| Action | Command |
|--------|---------|
| Add upstream | `git remote add upstream https://github.com/The-United-Legend-Tech-Group/Arcana.git` |
| Fetch upstream | `git fetch upstream` |
| Merge upstream | `git merge upstream/main` |
| Push main to new upstream branch | `git push upstream main:feature/name` |
| Sync main | `git fetch upstream && git checkout main && git merge upstream/main && git push origin main` |

---

## Summary

1. **Clone** your sub-system repository locally
2. **Add upstream** remote pointing to the main Arcana repo
3. **Work normally** on your sub-system repo (commit, pull, push to origin)
4. **Sync with upstream** regularly to stay updated
5. **Push your main** to a **new branch in Arcana** via upstream when ready to contribute
6. **Create a pull request** in Arcana from that branch
7. **Address feedback** from reviewers
8. Once approved, your changes will be **merged** into the main repository

---

## Need Help?

If you encounter issues not covered in this guide, please:
1. Check the [Git documentation](https://git-scm.com/doc)
2. Review [GitHub's working with remotes guide](https://docs.github.com/en/get-started/getting-started-with-git/managing-remote-repositories)
3. Contact the repository maintainers
