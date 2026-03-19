# Workflow Runs Bulk Follow-up Guidance Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add safe follow-up actions to the recent bulk retry/cancel result panel on `/workflow-runs` so users can continue from the latest bulk outcome without manually rebuilding the next selection.

**Architecture:** Keep the current bulk result panel in memory and add a small helper that derives follow-up actions from the latest bulk response plus the currently loaded run list. Wire those derived actions into the existing `/workflow-runs` panel so the page can open successful run details or rebuild a new page-local selection from skipped/failed rows without new backend APIs.

**Tech Stack:** Next.js, React, TypeScript, Vitest, Docker Compose

---

### Task 1: Add a bulk follow-up helper with tests

**Files:**
- Create: `apps/web/src/lib/workflow-runs-bulk-follow-up.ts`
- Create: `apps/web/src/lib/workflow-runs-bulk-follow-up.test.ts`

**Step 1: Write the failing tests**

Cover:
- deriving successful run-detail targets from the latest bulk result
- deriving skipped/failed reselection ids filtered to the current loaded page
- returning helpful messages when no skipped/failed ids are currently reloadable

**Step 2: Run tests to verify failure**

Run: `npm run test --workspace @openclaw/web -- workflow-runs-bulk-follow-up.test.ts`

**Step 3: Write minimal implementation**

Add helper functions that:
- build successful run-detail URLs
- derive reselection ids for skipped rows
- derive reselection ids for failed rows
- return small feedback strings for reselection actions

**Step 4: Run tests to verify pass**

Run: `npm run test --workspace @openclaw/web -- workflow-runs-bulk-follow-up.test.ts`

---

### Task 2: Wire follow-up actions into `/workflow-runs`

**Files:**
- Modify: `apps/web/src/app/workflow-runs/page.tsx`

**Step 1: Add follow-up action state**

Track a lightweight follow-up feedback string for:
- reselected skipped runs
- reselected failed runs
- follow-up action errors

**Step 2: Render only relevant actions**

Show:
- `Open successful runs` when the latest result contains successful rows with returned run details
- `Reselect skipped runs` when the latest result contains skipped rows
- `Reselect failed results` when the latest result contains failed rows

**Step 3: Keep actions safe**

- `Open successful runs` should reuse the existing navigation-only behavior and guard limits
- reselection should only target runs still present in the current loaded list
- if no target runs are available, show clear feedback instead of silently doing nothing

**Step 4: Keep existing panel behavior**

Do not break:
- bulk result summary rendering
- row-level outcome rendering
- dismiss behavior
- selection reset after the original bulk action

**Step 5: Run targeted web verification**

Run:
- `npm run test --workspace @openclaw/web -- workflow-runs-bulk-follow-up.test.ts`
- `npm run test --workspace @openclaw/web -- workflow-runs-bulk-outcomes.test.ts`
- `npm run test --workspace @openclaw/web -- workflow-runs-bulk-controls.test.ts`

---

### Task 3: Verify and document the slice

**Files:**
- Modify: `README.md`
- Modify: `task_plan.md`
- Modify: `findings.md`
- Modify: `progress.md`

**Step 1: Run root verification**

Run:
- `npm test`
- `npm run build`

**Step 2: Run Docker verification**

Run:
- `docker compose up --build -d`
- `curl -sS http://localhost:3001/health`

**Step 3: Run browser-level verification**

Verify on `/workflow-runs`:
- recent bulk result still appears
- `Open successful runs` appears when applicable
- `Reselect skipped runs` and `Reselect failed results` rebuild the page-local selection when those rows are available
- dismiss still removes the panel

**Step 4: Update docs**

Record:
- Phase 40 completion
- new follow-up actions on the recent bulk-action result panel
- the fact that reselection only operates on runs still present in the current loaded page
