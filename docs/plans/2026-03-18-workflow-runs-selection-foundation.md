# Workflow Runs Selection Foundation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add page-local workflow-run selection so `/workflow-runs` is ready for future bulk actions.

**Architecture:** Keep selection entirely in the web app. Add a small helper for selection semantics, then wire per-row checkboxes, selection summary copy, and reset rules into the existing `/workflow-runs` page without changing any backend APIs.

**Tech Stack:** Next.js App Router, React, TypeScript, Vitest, Docker Compose

---

### Task 1: Add Selection Helper Tests

**Files:**
- Create: `apps/web/src/lib/workflow-runs-selection.ts`
- Create: `apps/web/src/lib/workflow-runs-selection.test.ts`

**Steps:**
1. Write failing tests for:
   - toggling a run id in and out of selection
   - selecting all loaded rows
   - building a stable query-scope key for selection reset
   - counting selected rows
2. Run `npm run test --workspace @openclaw/web -- workflow-runs-selection.test.ts` and confirm RED.
3. Write the minimal helper implementation.
4. Re-run the same test command and confirm GREEN.

### Task 2: Wire Selection Into `/workflow-runs`

**Files:**
- Modify: `apps/web/src/app/workflow-runs/page.tsx`
- Modify: `apps/web/src/app/globals.css`

**Steps:**
1. Add local selected-run state and a query-scope key derived from filter/search/date/sort state.
2. Reset selection whenever the query scope changes.
3. Add per-row checkboxes, `N runs selected`, `Select all loaded`, and `Clear selection`.
4. Preserve selection across `Load more`.
5. Add only the minimal CSS needed for the selection row and checkbox layout.

### Task 3: Verification And Docs

**Files:**
- Modify: `README.md`
- Modify: `task_plan.md`
- Modify: `findings.md`
- Modify: `progress.md`

**Steps:**
1. Run targeted tests:
   - `npm run test --workspace @openclaw/web -- workflow-runs-selection.test.ts`
2. Run full verification:
   - `npm test`
   - `npm run build`
   - `docker compose up --build -d`
3. Run runtime checks:
   - `curl -sS http://localhost:3000/workflow-runs`
   - browser-level verification that selection count and actions render
4. Update docs and planning artifacts with final Phase 35 status and any runtime notes.
