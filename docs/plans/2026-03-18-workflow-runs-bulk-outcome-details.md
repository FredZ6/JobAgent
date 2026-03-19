# Workflow Runs Bulk Outcome Details Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a recent bulk-action result panel to `/workflow-runs` that shows per-run retry/cancel outcomes, not just the aggregate summary line.

**Architecture:** Keep the current bulk retry/cancel API responses unchanged and add a small web-side presentation helper that turns the latest response into a renderable panel model. Extend `/workflow-runs` to keep the latest response in memory, render row-level outcomes with status-specific styling, and provide `Open run detail` links whenever the bulk response returned a linked `workflowRun`.

**Tech Stack:** Next.js, React, TypeScript, Vitest, Docker Compose

---

### Task 1: Add a bulk-outcome presentation helper with tests

**Files:**
- Create: `apps/web/src/lib/workflow-runs-bulk-outcomes.ts`
- Create: `apps/web/src/lib/workflow-runs-bulk-outcomes.test.ts`

**Step 1: Write the failing tests**

Cover:
- building a retry panel heading and summary from a bulk response
- mapping `success / skipped / failed` rows to stable presentation data
- exposing `Open run detail` only when a row includes `workflowRun`

**Step 2: Run tests to verify failure**

Run: `npm run test --workspace @openclaw/web -- workflow-runs-bulk-outcomes.test.ts`

**Step 3: Write minimal implementation**

Add helper functions that:
- build a panel title from `retry | cancel`
- forward the existing aggregate summary string
- map result rows to presentation data including optional run-detail hrefs

**Step 4: Run tests to verify pass**

Run: `npm run test --workspace @openclaw/web -- workflow-runs-bulk-outcomes.test.ts`

---

### Task 2: Render recent bulk-action outcome details on `/workflow-runs`

**Files:**
- Modify: `apps/web/src/app/workflow-runs/page.tsx`

**Step 1: Write the failing page-level test target concept**

Use the existing helper tests as the red step for presentation behavior, then wire the page to consume the helper.

**Step 2: Store the last bulk response**

Track:
- last bulk action type
- last bulk aggregate summary
- last bulk row details

Keep this state in memory only.

**Step 3: Render the result panel**

Add:
- heading
- aggregate summary
- row list for each result
- `Open run detail` when the row has a returned `workflowRun`
- `Dismiss results`

**Step 4: Preserve current behavior**

Do not change:
- inline confirmation flow
- post-action list refresh
- selection reset
- safe bulk navigation actions

**Step 5: Run web tests**

Run:
- `npm run test --workspace @openclaw/web -- workflow-runs-bulk-controls.test.ts`
- `npm run test --workspace @openclaw/web -- workflow-runs-bulk-outcomes.test.ts`

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
- bulk retry/cancel still works
- the recent bulk action panel appears
- rows show `success / skipped / failed`
- successful rows can open run detail
- `Dismiss results` hides the panel

**Step 4: Update docs**

Record:
- Phase 39 completion
- the new recent bulk-action result panel
- the fact that the panel only shows the most recent in-memory result
