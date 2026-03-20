# Governance Files Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add the standard governance files and GitHub templates needed for a public open-source repository baseline.

**Architecture:** Create lightweight, GitHub-native governance files at the repository root and under `.github/`. Use standard community templates with only the project-specific customization needed for OpenClaw Job Agent's local-first, human-reviewed automation workflow.

**Tech Stack:** Markdown, GitHub issue form YAML, GitHub PR templates

---

### Task 1: Add the root governance files

**Files:**
- Create: `LICENSE`
- Create: `CODE_OF_CONDUCT.md`
- Create: `CONTRIBUTING.md`
- Create: `SECURITY.md`

**Step 1: Verify the files are missing**

Run:

```bash
find . -maxdepth 1 \( -name 'LICENSE*' -o -name 'CODE_OF_CONDUCT.md' -o -name 'CONTRIBUTING.md' -o -name 'SECURITY.md' \) | sort
```

Expected:
- PASS
- no matching governance files exist yet

**Step 2: Create the files**

Write:

- `LICENSE` with standard MIT text
- `CODE_OF_CONDUCT.md` using Contributor Covenant 2.1 with maintainer contact wording
- `CONTRIBUTING.md` with:
  - contribution types
  - local setup
  - minimum verification commands
  - PR expectations
  - automation safety boundaries
- `SECURITY.md` with:
  - private reporting guidance
  - best-effort response language
  - supported-version note for a pre-1.0 repo

**Step 3: Review the wording**

Check that:

- no file promises unsupported maintainer capacity
- commands match the current repo
- the docs do not contradict the human-final-submit boundary

**Step 4: Commit**

```bash
git add LICENSE CODE_OF_CONDUCT.md CONTRIBUTING.md SECURITY.md
git commit -m "Add repository governance files"
```

### Task 2: Add GitHub issue and PR templates

**Files:**
- Create: `.github/ISSUE_TEMPLATE/bug_report.yml`
- Create: `.github/ISSUE_TEMPLATE/feature_request.yml`
- Create: `.github/ISSUE_TEMPLATE/config.yml`
- Create: `.github/pull_request_template.md`

**Step 1: Verify the templates are missing**

Run:

```bash
find .github -maxdepth 3 -type f | sort
```

Expected:
- PASS
- only the workflow file is present

**Step 2: Create the templates**

Write:

- bug form with runtime-mode fields for:
  - Docker vs local
  - import/analysis/resume mode
  - Temporal flag
  - provider
- feature request form with workflow-area and risk/trade-off prompts
- issue-template config that points users toward docs while still allowing maintainers to evolve the flow later
- PR template with:
  - Summary
  - What changed
  - How to test
  - Risks / follow-ups

**Step 3: Review GitHub compatibility**

Check:

- YAML structure looks like valid GitHub issue forms
- file placement matches GitHub conventions
- field names are short and readable

**Step 4: Commit**

```bash
git add .github/ISSUE_TEMPLATE .github/pull_request_template.md
git commit -m "Add GitHub issue and PR templates"
```

### Task 3: Update the open-source checklist and verify the file set

**Files:**
- Modify: `docs/plans/2026-03-19-open-source-release-checklist.md`

**Step 1: Verify the checklist item is still open**

Run:

```bash
rg -n 'Add repository governance files' docs/plans/2026-03-19-open-source-release-checklist.md
```

Expected:
- PASS
- the governance-files item is unchecked

**Step 2: Mark the item complete**

Update the checklist to mark item 1 complete and shift the current focus to the next remaining slice.

**Step 3: Verify the file set**

Run:

```bash
find . -maxdepth 1 \( -name 'LICENSE*' -o -name 'CODE_OF_CONDUCT.md' -o -name 'CONTRIBUTING.md' -o -name 'SECURITY.md' \) | sort
find .github -maxdepth 3 -type f | sort
```

Expected:
- PASS
- all governance files and templates are present in the expected locations

**Step 4: Commit**

```bash
git add docs/plans/2026-03-19-open-source-release-checklist.md
git commit -m "Mark governance checklist item complete"
```
