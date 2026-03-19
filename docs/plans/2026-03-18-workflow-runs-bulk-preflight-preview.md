# Workflow Runs Bulk Preflight Preview Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an execution preview to the inline bulk retry/cancel confirmation flow on `/workflow-runs` so users can see which selected runs will be processed and which will be skipped before confirming.

**Architecture:** Keep the current bulk action flow and eligibility model, then add a small web-side helper that derives a preflight preview from the selected run ids, the current loaded run list, and the active bulk action type. Render that preview directly inside the existing inline confirmation area so the API and mutation flow remain unchanged.

**Tech Stack:** Next.js, React, TypeScript, Vitest, Docker Compose

---

### Task 1: Add a bulk preflight helper with tests

**Files:**
- Create: `apps/web/src/lib/workflow-runs-bulk-preflight.ts`
- Create: `apps/web/src/lib/workflow-runs-bulk-preflight.test.ts`

**Step 1: Write the failing tests**

Cover:
- retry preview with eligible and skipped rows
- cancel preview with queued Temporal rows and skipped rows
- skip reasons matching current UI semantics

**Step 2: Run tests to verify failure**

Run: `npm run test --workspace @openclaw/web -- workflow-runs-bulk-preflight.test.ts`

**Step 3: Write minimal implementation**

Build a helper that:
- accepts action type, selected run ids, and loaded run items
- returns `willProcess` and `willSkip`
- includes row metadata and skip reasons

**Step 4: Run tests to verify pass**

Run: `npm run test --workspace @openclaw/web -- workflow-runs-bulk-preflight.test.ts`

---

### Task 2: Render the preflight preview in `/workflow-runs`

**Files:**
- Modify: `apps/web/src/app/workflow-runs/page.tsx`
- Modify: `apps/web/src/app/globals.css`

**Step 1: Derive preview data**

Use the helper with:
- current `pendingBulkAction`
- current `selectedRunIds`
- current loaded runs

**Step 2: Extend the existing inline confirmation area**

Render:
- the existing confirmation sentence
- a `Will process` section when applicable
- a `Will skip` section when applicable
- each row’s metadata and reason

**Step 3: Preserve the current flow**

Do not change:
- enable/disable rules
- confirm behavior
- `Go back`
- post-confirm refresh and selection reset

**Step 4: Run targeted web checks**

Run:
- `npm run test --workspace @openclaw/web -- workflow-runs-bulk-preflight.test.ts`
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
- inline preview appears after starting retry/cancel
- `Will process` and `Will skip` sections render correctly
- `Go back` hides the preview
- confirmation still succeeds afterward

**Step 4: Update docs**

Record:
- Phase 41 completion
- the new bulk preflight preview behavior
- the fact that preview data is derived only from the current loaded page and current selection
