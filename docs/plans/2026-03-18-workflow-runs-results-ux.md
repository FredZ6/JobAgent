# Workflow Runs Results UX Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve `/workflow-runs` with clearer query/result feedback, active filter chips, a clear-filters action, and smarter empty states.

**Architecture:** Keep the existing API and URL query-state model intact. Add a small front-end helper for result-summary and active-filter derivation, then wire those derived values into the existing page. This keeps the work UI-local and avoids growing the backend surface area.

**Tech Stack:** Next.js App Router, React, TypeScript, Vitest, Docker Compose

---

### Task 1: Add Result-UX Helper Tests

**Files:**
- Create: `apps/web/src/lib/workflow-runs-results.ts`
- Create: `apps/web/src/lib/workflow-runs-results.test.ts`

**Steps:**
1. Write failing tests for:
   - deriving active filter chips from workflow-runs query state
   - counting active filters correctly
   - generating a readable result summary
   - distinguishing true-empty vs filtered-empty states
2. Run `npm run test --workspace @openclaw/web -- workflow-runs-results.test.ts` and confirm RED.
3. Write the minimal helper implementation.
4. Re-run the same test command and confirm GREEN.

### Task 2: Wire Result UX Into `/workflow-runs`

**Files:**
- Modify: `apps/web/src/app/workflow-runs/page.tsx`
- Modify: `apps/web/src/app/globals.css`

**Steps:**
1. Use the helper to derive active filter chips and summary copy from the current query state and response data.
2. Render:
   - a result summary block
   - removable active filter chips
   - a `Clear filters` action
3. Make chip removal and clear-filters update the URL-backed query state and reset the list to the first page.
4. Replace the single empty-state message with distinct true-empty and filtered-empty variants.
5. Add only the minimal CSS needed for the new chips/summary presentation.

### Task 3: Verification And Docs

**Files:**
- Modify: `README.md`
- Modify: `task_plan.md`
- Modify: `findings.md`
- Modify: `progress.md`

**Steps:**
1. Run targeted tests:
   - `npm run test --workspace @openclaw/web -- workflow-runs-results.test.ts`
2. Run full verification:
   - `npm test`
   - `npm run build`
   - `docker compose up --build -d`
3. Run runtime checks:
   - `curl -sS http://localhost:3000/workflow-runs`
   - `curl -sS 'http://localhost:3000/workflow-runs?status=failed&q=platform'`
4. Update docs and planning artifacts with final Phase 34 status and any runtime notes.
