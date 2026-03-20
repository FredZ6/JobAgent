# Release Packaging Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a complete `v0.1.0-alpha` release-packaging set so the repository has a changelog, release notes, support matrix, GitHub release guidance, label conventions, and demo-asset placeholders suitable for a first public alpha.

**Architecture:** Keep the implementation doc-driven. Create a small release-document set under `docs/releases`, add a root `CHANGELOG.md`, connect the new material from `README.md`, and update the open-source checklist when the package is complete. Treat GitHub-side settings as file-backed guidance instead of trying to automate repo settings from code.

**Tech Stack:** Markdown, GitHub repository docs

---

### Task 1: Add release-packaging source documents

**Files:**
- Create: `CHANGELOG.md`
- Create: `docs/releases/v0.1.0-alpha.md`
- Create: `docs/releases/support-matrix.md`
- Create: `docs/releases/release-template.md`
- Create: `docs/releases/github-labels.md`
- Create: `docs/releases/demo-assets/README.md`

**Step 1: Draft the changelog entry**

Write `CHANGELOG.md` with:

- a short intro
- a `v0.1.0-alpha` section
- grouped bullets for `Added`, `Changed`, and `Known limitations`

Keep it concise and aligned with the actual repository state.

**Step 2: Write the alpha release notes**

Create `docs/releases/v0.1.0-alpha.md` with:

- release summary
- highlights
- included capabilities
- intended audience
- known limitations
- setup expectations

**Step 3: Write the support matrix**

Create `docs/releases/support-matrix.md` covering:

- Docker Compose support
- local npm workflow expectations
- provider support
- mock/live maturity
- Temporal maturity

**Step 4: Add GitHub release helper docs**

Create:

- `docs/releases/release-template.md`
- `docs/releases/github-labels.md`

These should be practical and ready to use, not just placeholders.

**Step 5: Add demo-assets placeholder guidance**

Create `docs/releases/demo-assets/README.md` with:

- planned assets
- file naming guidance
- suggested formats
- where each asset will be used later

### Task 2: Wire release packaging into the repository entry points

**Files:**
- Modify: `README.md`
- Modify: `docs/plans/2026-03-19-open-source-release-checklist.md`

**Step 1: Add release links to the README**

Add a short release-focused section or link block in `README.md` pointing to:

- `CHANGELOG.md`
- `docs/releases/v0.1.0-alpha.md`
- `docs/releases/support-matrix.md`

Keep this concise and consistent with the current public-facing README voice.

**Step 2: Update the roadmap/release wording if needed**

Adjust any README lines that still talk about release packaging as future work so the document reflects the new state after these files land.

**Step 3: Mark the checklist item complete**

Update `docs/plans/2026-03-19-open-source-release-checklist.md` so item 10 is checked and the checklist reflects full completion.

### Task 3: Validate consistency and finish the open-source release checklist

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `README.md`
- Modify: `docs/releases/v0.1.0-alpha.md`
- Modify: `docs/releases/support-matrix.md`
- Modify: `docs/plans/2026-03-19-open-source-release-checklist.md`

**Step 1: Verify file coverage**

Run:

```bash
find docs/releases -maxdepth 2 -type f | sort
```

Expected:
- PASS
- all planned release files are present

Also confirm:

```bash
test -f CHANGELOG.md && echo ok
```

Expected:
- `ok`

**Step 2: Check link and wording consistency**

Run:

```bash
rg -n 'v0\\.1\\.0-alpha|manual submit|best-effort|Gemini|OpenAI' README.md CHANGELOG.md docs/releases
```

Expected:
- PASS
- release docs and README reference the same product boundaries and release version

**Step 3: Manual review**

Manually confirm:

- no file overclaims production readiness
- support matrix and README do not conflict
- release template is usable for a GitHub release draft
- label guidance is actionable for manual GitHub setup

**Step 4: Commit**

```bash
git add CHANGELOG.md README.md docs/releases docs/plans/2026-03-19-open-source-release-checklist.md
git commit -m "Add v0.1.0-alpha release packaging"
```
