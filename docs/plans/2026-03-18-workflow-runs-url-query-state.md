# Workflow Runs URL Query-State Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add shareable URL query-state and refresh-safe deep links to the `/workflow-runs` page.

**Architecture:** Keep the existing client-side fetch model, but introduce a small front-end helper that converts between `searchParams` and normalized workflow-runs page state. Treat pagination as session-local UI state and leave it out of the URL so deep links always restore a stable first-page query.

**Tech Stack:** Next.js App Router, React, TypeScript, Vitest, Docker Compose

---

### Task 1: Add Query-State Helper Tests

**Files:**
- Create: `apps/web/src/lib/workflow-runs-query-state.ts`
- Create: `apps/web/src/lib/workflow-runs-query-state.test.ts`

**Steps:**
1. Write failing tests for:
   - parsing URL params into workflow-runs page state
   - omitting defaults when serializing back to the URL
   - preserving non-default filters/search/date/sort values
2. Run `npm run test --workspace @openclaw/web -- workflow-runs-query-state.test.ts` and confirm RED.
3. Write the minimal helper implementation.
4. Re-run the same test command and confirm GREEN.

### Task 2: Wire `/workflow-runs` To URL State

**Files:**
- Modify: `apps/web/src/app/workflow-runs/page.tsx`

**Steps:**
1. Read initial page state from `useSearchParams()`.
2. Sync non-default filter/search/date/sort state back into the URL with `router.replace(...)`.
3. Keep `Load more` using in-memory cursor state only.
4. Reset appended rows whenever query-state changes.
5. Keep the page client-side and avoid broader routing refactors.

### Task 3: Verification And Docs

**Files:**
- Modify: `README.md`
- Modify: `task_plan.md`
- Modify: `findings.md`
- Modify: `progress.md`

**Steps:**
1. Run targeted tests:
   - `npm run test --workspace @openclaw/web -- workflow-runs-query-state.test.ts`
2. Run full verification:
   - `npm test`
   - `npm run build`
   - `docker compose up --build -d`
3. Run runtime checks:
   - `curl -sS 'http://localhost:3000/workflow-runs?status=failed&sortBy=status&sortOrder=asc'`
   - `curl -sS 'http://localhost:3000/workflow-runs?q=platform&from=2026-03-18'`
4. Update docs and planning artifacts with final Phase 33 status and any runtime notes.
