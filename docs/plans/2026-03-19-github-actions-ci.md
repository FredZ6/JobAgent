# GitHub Actions CI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a first-pass GitHub Actions CI workflow for install, Prisma generate, test, and build checks.

**Architecture:** Create a single `.github/workflows/ci.yml` workflow that runs on pull requests and default-branch pushes. Keep the first version intentionally lightweight: use Node 22, enable npm cache, run the root monorepo commands in order, and avoid Docker, databases, and e2e work for now.

**Tech Stack:** GitHub Actions, Node 22, npm workspaces, Prisma CLI

---

### Task 1: Add the CI workflow file

**Files:**
- Create: `.github/workflows/ci.yml`

**Step 1: Write the failing verification**

Inspect the repo and confirm that `.github/workflows/ci.yml` does not exist yet.

Run:

```bash
find .github -maxdepth 3 -type f 2>/dev/null | sort
```

Expected:
- PASS
- no CI workflow is present

**Step 2: Write the workflow**

Create `.github/workflows/ci.yml` with:

- workflow name such as `CI`
- triggers:
  - `pull_request`
  - `push` to the default branch
- concurrency cancellation for the same workflow/ref
- one `build-test` job on `ubuntu-latest`
- `actions/checkout`
- `actions/setup-node` with:
  - `node-version: 22`
  - `cache: npm`
- command steps:
  - `npm ci`
  - `npm run prisma:generate`
  - `npm test`
  - `npm run build`

**Step 3: Review the YAML manually**

Check:
- indentation
- trigger names
- concurrency keys
- Node version
- command order

Expected:
- PASS
- workflow matches the design exactly

**Step 4: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "Add GitHub Actions CI workflow"
```

### Task 2: Verify the workflow commands locally

**Files:**
- No new product files required

**Step 1: Run install**

Run:

```bash
npm ci
```

Expected:
- PASS
- dependencies install cleanly from `package-lock.json`

**Step 2: Run Prisma client generation**

Run:

```bash
npm run prisma:generate
```

Expected:
- PASS
- Prisma client generation succeeds

**Step 3: Run tests**

Run:

```bash
npm test
```

Expected:
- PASS
- workspace tests complete successfully

**Step 4: Run builds**

Run:

```bash
npm run build
```

Expected:
- PASS
- workspace builds complete successfully

**Step 5: Commit verification-only fixes if needed**

If any workflow command mismatch or small CI-related issue appears, make the minimal fix before moving on.

### Task 3: Document the CI addition in the release checklist notes

**Files:**
- Modify: `docs/plans/2026-03-19-open-source-release-checklist.md`

**Step 1: Write the failing verification**

Inspect the checklist file and confirm the CI item is still unchecked.

Run:

```bash
rg -n 'Add GitHub Actions CI' docs/plans/2026-03-19-open-source-release-checklist.md
```

Expected:
- PASS
- the CI item still appears as unchecked

**Step 2: Update the checklist status**

Mark the GitHub Actions CI checklist item as completed once Task 1 and Task 2 are both done.

**Step 3: Commit**

```bash
git add docs/plans/2026-03-19-open-source-release-checklist.md
git commit -m "Mark CI checklist item complete"
```
