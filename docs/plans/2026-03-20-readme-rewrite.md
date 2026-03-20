# README Rewrite Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rewrite `README.md` so it serves as an external-user-friendly open-source homepage with clear setup, boundaries, and demo placeholders.

**Architecture:** Keep all work in `README.md`. Reorganize the existing information into a skimmable landing-page structure, move the voice away from closeout language, preserve the accurate runtime/setup instructions, and add explicit screenshot/GIF placeholder sections that can be filled later without another structural rewrite.

**Tech Stack:** Markdown, GitHub repository docs

---

### Task 1: Replace the current README structure

**Files:**
- Modify: `README.md`

**Step 1: Verify the current README still uses delivery-oriented voice**

Run:

```bash
rg -n 'closeout|handoff|Delivery Status|Current Scope|Current App Flow' README.md
```

Expected:
- PASS
- the current README still reflects delivery/handoff framing

**Step 2: Rewrite the top-level sections**

Replace the README structure with these sections:

- title + short pitch
- why this project exists
- what it can do
- product boundaries
- screenshots / demo placeholders
- quick start
- configuration
- walkthrough
- architecture
- known limitations
- roadmap
- additional docs

**Step 3: Keep setup instructions accurate**

Preserve and reframe the real setup flow:

- `cp .env.example .env`
- `docker compose up --build`
- `docker compose exec api npm run prisma:seed`
- migration notes
- provider and feature flag explanation

**Step 4: Review for clarity**

Check that:

- the README is skimmable
- the top half is user-facing rather than implementation-history-heavy
- the product boundaries are explicit and easy to find

### Task 2: Add screenshot/GIF placeholders and concise walkthrough content

**Files:**
- Modify: `README.md`

**Step 1: Add the screenshots / demo section**

Create placeholder entries for:

- Dashboard overview
- Job detail and workflow runs
- Resume review and PDF preview
- Application review and automation sessions

These should be obvious placeholders for future assets, not fake image links.

**Step 2: Compress the walkthrough**

Replace the current oversized app-flow section with a shorter high-signal walkthrough that still covers:

- settings
- profile
- job import
- analyze
- resume generation
- prefill and review
- manual final submit recording

**Step 3: Add deeper-doc links**

Point readers to:

- `docs/closeout/2026-03-18-delivery-package.md`
- roadmap/spec/design docs where helpful

without turning the README back into a handoff artifact.

### Task 3: Validate and mark the checklist item complete

**Files:**
- Modify: `docs/plans/2026-03-19-open-source-release-checklist.md`

**Step 1: Validate the rewritten README**

Run:

```bash
rg -n 'closeout / handoff|Delivery Status' README.md
```

Expected:
- PASS
- no homepage-facing delivery-status language remains

Also manually confirm:

- commands match the current repo
- links point at existing files
- README wording does not conflict with `CONTRIBUTING.md` or `SECURITY.md`

**Step 2: Update the checklist**

Mark the README rewrite item complete and move `Current Focus` to the next remaining item.

**Step 3: Commit**

```bash
git add README.md docs/plans/2026-03-19-open-source-release-checklist.md
git commit -m "Rewrite README for external users"
```
